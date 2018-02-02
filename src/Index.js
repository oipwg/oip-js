if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

var IndexFunction = function(){
	var Artifact = this.Artifact;
	var Network = this.Network;

	var Index = {};

	Index.supportedArtifacts = [];

	Index.getSupportedArtifacts = function(onSuccess, onError){
		Network.getArtifactsFromOIPd(function(jsonResult) {
			let filtered = Index.stripUnsupported(jsonResult);
			onSuccess([...filtered]);
		}, onError);
	}

	Index.getSuggestedContent = function(userid, callback){
		// In the future we will generate content specific for users, for now, just the generic is ok :)
		// userid is not currently implemented or used.
		Index.getSupportedArtifacts(function(supportedArtifacts){
			console.log(supportedArtifacts)
			if (supportedArtifacts.length > 25){
				callback(supportedArtifacts.slice(0,25));
			} else {
				callback(supportedArtifacts);
			}
		})
	}

	Index.stripUnsupported = function(artifacts){
		var supportedArtifacts = [];

		for (var x = artifacts.length -1; x >= 0; x--){
			if (artifacts[x]['oip-041']){
				if (artifacts[x]['oip-041'].artifact.type.split('-').length === 2){
					if (!artifacts[x]['oip-041'].artifact.info.nsfw)
						supportedArtifacts.push(JSON.parse(JSON.stringify(artifacts[x])));
				}
			}
		}   

		return [...supportedArtifacts];
	}

	Index.getArtifactFromID = function(id, onSuccess, onError){
		Index.getSupportedArtifacts(function(supportedArtifacts){
			for (var i = 0; i < supportedArtifacts.length; i++) {
				if (supportedArtifacts[i].txid.substr(0, id.length) === id){
					onSuccess([...[supportedArtifacts[i]]][0]);
				}
			}
		}, onError)
	}

	Index.search = function(options, onSuccess, onError){
		Network.searchOIPd(options, function(results){
			let res = Index.stripUnsupported(results);

			onSuccess(res);
		}, function(error){
			onError(error);
		})
	}

	Index.getRegisteredPublishers = function(onSuccess, onError){
		var pubs = [];
		if (localStorage.registeredPublishers){
			pubs = JSON.parse(localStorage.registeredPublishers).arr;
		}

		Network.getPublishersFromOIPd(function(jsonResult) {
			var newPubs = jsonResult;
			for (var i = 0; i < pubs.length; i++) {
				newPubs.push(pubs[i])
			}
			onSuccess(newPubs);
		});
	}

	Index.getRegisteredRetailers = function(onSuccess, onError){
		Network.getRetailersFromOIPd(function(jsonResult) {
			onSuccess(jsonResult);
		});
	}

	Index.getRegisteredPromoters = function(onSuccess, onError){
		Network.getPromotersFromOIPd(function(jsonResult) {
			onSuccess(jsonResult);
		});
	}

	Index.getPublisher = function(id, onSuccess, onError){
		if (localStorage.registeredPublishers){
			var pubs = JSON.parse(localStorage.registeredPublishers).arr;

			for (var pub of pubs){
				if (pub.address === id){
					onSuccess(pub);
					return;
				}
			}
		}
		Network.searchOIPd({"protocol": "publisher", "search-on": "address", "search-for": id}, function(results){
			onSuccess(results[0]['publisher-data']['alexandria-publisher']);
		}, function(err){
			onError(err);
		});
	}

	Index.getRetailer = function(id, onSuccess, onError){
		Network.getRetailersFromOIPd(function(retailers) {
			var success = false;

			for (var i = 0; i < retailers.length; i++) {
				if (retailers[i] && retailers[i].txid){
					if (retailers[i].txid === id){
						success = true;
						onSuccess(retailers[i]);
					}
				}
			}
			
			if (!success){
				onError("No Retailer Found");
			}
		});
	}

	Index.getPromoter = function(id, onSuccess, onError){
		Network.getRetailersFromOIPd(function(promoters) {
			var success = false;

			for (var i = 0; i < promoters.length; i++) {
				if (promoters[i] && promoters[i].txid){
					if (promoters[i].txid === id){
						success = true;
						onSuccess(promoters[i]);
					}
				}
			}

			if (!success){
				onError("No Promoter Found");
			}
		});
	}

	Index.getPublisherArtifacts = function(pubAddress, onSuccess, onError){
		Index.getSupportedArtifacts(function(results){
			var artifacts = [];

			for (var i = 0; i < results.length; i++) {
				if (Artifact.getPublisher(results[i]) === pubAddress){
					artifacts.push(results[i]);
				}
			}

			onSuccess(artifacts);
		}, onError)
	}

	Index.getRandomSuggested = function(onSuccess){
		Index.getSupportedArtifacts(function(results){
			let randomArt = results.sort( function() { return 0.5 - Math.random() } ).slice(0,15);
			onSuccess(randomArt);
		});
	}

	Index.stripIndexData = function(artJson){
		var strippedArtJSON = {
			"oip-041": artJson["oip-041"]
		}

		return strippedArtJSON;
	}

	this.Index = Index;
	return this.Index;
}

export default IndexFunction;