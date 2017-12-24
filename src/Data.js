var DataFunction = function(){
	var Network = this.Network;

	var Data = {};

	Data.getExchangeRate = function(coin, fiat, callback){
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
						exchangeTypes[fiat_type][coin_type].getExchangeRate(callback)
					}
				}
			}
		}
	}

	Data.getBTCPrice = function(callback){
		// Check to see if we should update again, if not, just return the old data.
		Network.getLatestBTCPrice(callback);
	}

	Data.getFLOPrice = function(callback){
		// Check to see if we should update again, if not, just return the old data.
		Network.getLatestFLOPrice(callback);
	}

	Data.getLTCPrice = function(callback){
		// Check to see if we should update again, if not, just return the old data.
		Network.getLatestLTCPrice(callback);
	}

	Data.calculateBTCCost = function(usd_value, callback){
		Data.getBTCPrice(function(btc_price){
			callback(usd_value / btc_price)
		})
	}

	Data.getOIPdInfo = function(onSuccess, onError){
		Network.getLatestOIPdInfo(onSuccess, onError);
	}

	this.Data = Data;
	return this.Data;
}

export default DataFunction;