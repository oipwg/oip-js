var DataFunction = function(){
	var Network = this.Network;

	var Data = {};

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

	this.Data = Data;
	return this.Data;
}

export default DataFunction;