var DataFunction = function(){
	var Network = this.Network;

	var Data = {};

	Data.getExchangeRate = function(coin, fiat, onSuccess, onError){
		if (coin === fiat){
			return callback(1);
		}

		var exchangeTypes = {
			usd: {
				bitcoin: {
					getExchangeRate: Data.getBTCPrice
				},
				litecoin: {
					getExchangeRate: Data.getLTCPrice
				},
				florincoin: {
					getExchangeRate: Data.getFLOPrice
				}
			}
		}

		for (var fiat_type in exchangeTypes){
			if (fiat_type === fiat){
				for (var coin_type in exchangeTypes[fiat_type]){
					if (coin_type === coin){
						exchangeTypes[fiat_type][coin_type].getExchangeRate(onSuccess, onError)
					}
				}
			}
		}
	}

	Data.getBTCPrice = function(onSuccess, onError){
		Network.getLatestBTCPrice(onSuccess, onError);
	}

	Data.getFLOPrice = function(onSuccess, onError){
		Network.getLatestFLOPrice(onSuccess, onError);
	}

	Data.getLTCPrice = function(onSuccess, onError){
		Network.getLatestLTCPrice(onSuccess, onError);
	}

	Data.calculateBTCCost = function(usd_value, onSuccess, onError){
		Data.getBTCPrice(function(btc_price){
			onSuccess(usd_value / btc_price)
		})
	}

	Data.getOIPdInfo = function(onSuccess, onError){
		Network.getLatestOIPdInfo(onSuccess, onError);
	}

	this.Data = Data;
	return this.Data;
}

export default DataFunction;