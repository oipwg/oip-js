var utilFunction = function(){
	var settings = this.settings;

	var util = {};

	util.chunksToFileURL = function(chunks, onLoad){
		var reader  = new FileReader();

		reader.addEventListener("load", function () {
			if (reader.result && reader.result != "data:"){
				onLoad(reader.result);
			}
		}, false);

		if (chunks) {
			reader.readAsDataURL(new Blob(chunks));
		}
	}

	util.buildIPFSShortURL = function(location, file){
		if (!location || !file)
			return "";
		
		return location + "/" + file.fname;
	}

	util.buildIPFSURL = function(hash, fname){
		let trailURL = "";
		if (!fname){
			let parts = hash.split('/');
			if (parts.length == 2){
				trailURL = parts[0] + "/" + encodeURIComponent(parts[1]);
			} else {
				trailURL = hash;
			}
		} else {
			trailURL = hash + "/" + encodeURIComponent(fname);
		}
		return settings.IPFSGatewayURL + trailURL;
	}

	util.getExtension = function(filename){
		let splitFilename = filename.split(".");
		let indexToGrab = splitFilename.length - 1;

		return splitFilename[indexToGrab];
	}

	util.formatDuration = function(intDuration){
		if (!intDuration || isNaN(intDuration))
			return "";

		var sec_num = parseInt(intDuration, 10); // don't forget the second param
		var hours   = Math.floor(sec_num / 3600);
		var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
		var seconds = sec_num - (hours * 3600) - (minutes * 60);

		if (minutes < 10) {
			if (hours !== 0)
				minutes = "0"+minutes;
		}
		if (seconds < 10) {
			if (minutes !== 0)
				seconds = "0"+seconds;
		}

		if (hours === 0)
			var time = minutes+':'+seconds;
		else
			var time = hours+':'+minutes+':'+seconds;

		return time;
	}

	util.decodeMakeJSONSafe = function(stringToCheck){
		let tmpStr = stringToCheck;
		if (typeof tmpStr === "string" && tmpStr.substr(0,1) === '"' && tmpStr.substr(tmpStr.length-1,tmpStr.length) === '"')
			tmpStr = eval(tmpStr);

		return tmpStr;
	}

	util.createPriceString = function(price){
		// This function assumes the scale has already been applied, and you are passing it a float value
		var priceStr = parseFloat(price.toFixed(3));

		if (isNaN(priceStr)){
			return 0;
		}

		let priceDecimal = priceStr - parseInt(priceStr);

		if (priceDecimal.toString().length === 3){
			priceStr = priceStr.toString() + "0";
		}

		return priceStr.toString();
	}

	util.convertBTCtoBits = function(btc_value){
		return btc_value * Math.pow(10,6);
	}

	this.util = util;
	return this.util;
}

export default utilFunction;