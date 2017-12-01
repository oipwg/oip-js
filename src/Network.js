import axios from 'axios';

try {
	var IPFS_MAIN = require('ipfs');
} catch (e) { 
	console.log(e);
}	

var NetworkFunction = function(){
	var settings = this.settings;
	var util = this.util;

	var Network = {};

	Network.cachedArtifacts = [];
	Network.artifactsLastUpdate = 0; // timestamp of last ajax call to the artifacts endpoint.
	Network.artifactsUpdateTimelimit = 5 * 60 * 1000; // Five minutes
	Network.cachedBTCPriceObj = {};
	Network.cachedFLOPriceObj = {};
	Network.cachedLTCPriceObj = {};
	Network.btcpriceLastUpdate = 0;
	Network.flopriceLastUpdate = 0;
	Network.ltcpriceLastUpdate = 0;
	Network.btcpriceUpdateTimelimit = 5 * 60 * 1000; // Five minutes
	Network.flopriceUpdateTimelimit = 5 * 60 * 1000; // Five minutes
	Network.ltcpriceUpdateTimelimit = 5 * 60 * 1000; // Five minutes

	// Initiate all instances
	try {
		Network.ipfs = new IPFS_MAIN(settings.ipfsConfig);
	} catch (e) {
		Network.ipfs = "not-supported"
	}

	Network.searchOIPd = function(options, onSuccess, onError){
		let defaultOptions = {
			"protocol" : "media", 
			"search-on": "*", 
			"search-like": true
		}

		if (!options.protocol)
			options.protocol = defaultOptions.protocol;

		if (!options["search-on"])
			options["search-on"] = defaultOptions["search-on"];

		if (!options["search-like"]){
			if (options.protocol === "publisher" && options["search-on"] === "address")
				options["search-like"] = false;
			else
				options["search-like"] = defaultOptions["search-like"];
		}

		axios.post(settings.OIPdURL + "/search", options)
		.then(function(results){
			if (results && results.data && results.data.status === "success" && results.data.response)
				onSuccess([...results.data.response]);
			else
				onError(results);
		});
	}

	Network.getArtifactsFromOIPd = function(callback){
		if ((Date.now() - Network.artifactsLastUpdate) > Network.artifactsUpdateTimelimit){
			axios.get(settings.OIPdURL + "/media/get/all", {
				transformResponse: [function (data) {
					return [...data]; 
				}], responseType: 'json'
			}).then( function(results){ 
				Network.cachedArtifacts = results.data;
				Network.artifactsLastUpdate = Date.now();
				callback(Network.cachedArtifacts);
			 });
		} else {
			callback(Network.cachedArtifacts);
		}
	}

	Network.getLatestBTCPrice = function(callback){
		if (Network.btcpriceLastUpdate < Date.now() - Network.btcpriceUpdateTimelimit || Network.cachedBTCPriceObj === {}){

			axios.get(settings.btcTickerURL).then(function(result){
				if (result.status === 200){
					Network.cachedBTCPriceObj = result.data;
					Network.btcpriceLastUpdate = Date.now();
					callback(Network.cachedBTCPriceObj["USD"].last);
				}
			});
		} else {
			callback(Network.cachedBTCPriceObj["USD"].last);
		}
	}

	Network.getLatestFLOPrice = function(callback){
		if (Network.flopriceLastUpdate < Date.now() - Network.flopriceUpdateTimelimit || Network.cachedFLOPriceObj === {}){

			axios.get(settings.floTickerURL).then(function(result){
				if (result.status === 200){
					Network.cachedFLOPriceObj = result.data;
					Network.flopriceLastUpdate = Date.now();
					callback(Network.cachedFLOPriceObj["USD"]);
				}
			});
		} else {
			callback(Network.cachedFLOPriceObj["USD"]);
		}
	}

	Network.getLatestLTCPrice = function(callback){
		if (Network.ltcpriceLastUpdate < Date.now() - Network.ltcpriceUpdateTimelimit || Network.cachedLTCPriceObj === {}){

			axios.get(settings.ltcTickerURL).then(function(result){
				if (result.status === 200){
					Network.cachedLTCPriceObj = result.data;
					Network.ltcpriceLastUpdate = Date.now();
					callback(Network.cachedLTCPriceObj[0]["price_usd"]);
				}
			});
		} else {
			callback(Network.cachedLTCPriceObj[0]["price_usd"]);
		}
	}

	Network.getIPFS = function(callback){
		Network.ipfs.on('ready', () => {
			callback(Network.ipfs);
		})
	}

	Network.getThumbnailFromIPFS = function(hash, onData, onEnd){
		let returned = false;
		let cancelRequest = false;

		let cancelRequestFunc = function(){
			returned = true;
			cancelRequest = true;
		}
		// Require a hash to be passed
		if (!hash || hash === ""){
			returned = true;
			return cancelRequestFunc;
		}

		if (!onEnd){
			onEnd = function(){}
		}

		try {
			Network.ipfs.files.catReadableStream(hash, function (err, file) {
				if (err){
					returned = true;
					return cancelRequestFunc;
				}

				let stream = file;

				if (cancelRequest){
					try {
						stream.destroy();
					} catch(e){}
					return;
				}

				let chunks = [];
				let lastdata = 0;
				if (stream){
					stream.on('data', function(chunk) {
						// If the request was aborted, ABORT ABORT ABORT!
						if (cancelRequest){
							return;
						}

						chunks.push(chunk);

						// Note, this might cause tons of lag depending on how many ongoing IPFS requests we have.
						if (Date.now() - lastdata > 1000){
							lastdata = Date.now();
							util.chunksToFileURL(chunks, function(data){
								onData(data, hash);
								returned = true;
							})
						}
					});
					stream.on('end', function(){
						if (cancelRequest)
							return;

						util.chunksToFileURL(chunks, function(data){
							onData(data, hash);
						})
					})
				}
			})
		} catch (e){ 
			if (cancelRequest)
				return cancelRequestFunc;

			onData(util.buildIPFSURL(hash), hash);
			returned = true;
		}

		setTimeout(function(){
			if (cancelRequest)
				return cancelRequestFunc;

			if (!returned){
				onData(util.buildIPFSURL(hash), hash);
			}
		}, 2 * 1000)

		return cancelRequestFunc;
	}

	Network.getFileFromIPFS = function(hash, onComplete){
		// Require a hash to be passed
		if (!hash || hash === "")
			return;

		let returned = false;

		try {
			Network.ipfs.files.cat(hash, function (err, file) {
				if (err){
					returned = true;
					return;
				}

				let stream = file;
				let chunks = [];
				if (stream){
					stream.on('data', function(chunk) {
						chunks.push(chunk);
					});
					stream.on('end', function(){
						util.chunksToFileURL(chunks, function(data){
							onComplete(data, hash);
							returned = true;
						})
					})
				}
			})
		} catch(e) { }

		setTimeout(function(){
			if (!returned){
				onComplete(util.buildIPFSURL(hash), hash);
			}
		}, 2 * 1000)
	}

	Network.getCommentsFromISSO = function(uri, callback){
		axios.get(settings.issoURL + "?uri=" + encodeURIComponent(uri)).then(function(results){
			callback(results);
		}).catch(function (error) {
			// If there is an error, it is likely because the artifact has no comments, just return an empty array.
			callback([]);
		});
	}

	Network.postCommentToISSO = function(uri, comment, callback){
		var instance = axios.create();

		instance.post(settings.issoURL + "new?uri=" + encodeURIComponent(uri), comment, {headers: {"Content-Type": "application/json"}, transformRequest: [(data, headers) => {
		    delete headers.common.Authorization
		    return data }]
		}).then(function(results){
			callback(results);
		}).catch(function (error) {
			// If there is an error, it is likely because the artifact has no comments, just return an empty array.
			callback({error: true});
		});
	}

	Network.likeISSOComment = function(id, callback){
		axios.post(settings.issoURL + "id/" + id + "/like", {}).then(function(results){
			callback(results);
		}).catch(function (error) {
			// If there is an error, it is likely because the artifact has no comments, just return an empty array.
			callback({error: true});
		});
	}

	Network.dislikeISSOComment = function(id, callback){
		axios.post(settings.issoURL + "id/" + id + "/dislike", {}).then(function(results){
			callback(results);
		}).catch(function (error) {
			// If there is an error, it is likely because the artifact has no comments, just return an empty array.
			callback({error: true});
		});
	}

	this.Network = Network;
	return this.Network;
}

export default NetworkFunction;