const low = require('lowdb')
const Memory = require('lowdb/adapters/Memory')
var _ = require('lodash')
var Artifact = require('./Artifact.js')
var Multipart = require('./Multipart.js')

var IndexFunction = function(){
	var Network = this.Network;
	var LocStorage = this.localStorage;
	var settings = this.settings;

	var Index = {};

	Index.db = low(new Memory())

	Index.db.defaults({ 
		AllArtifacts: [],
		SupportedArtifacts: [],
		Publishers: [],
		Retailers: [],
		Promoters: [],
		Autominers: [],
		AutominerPools: [],
		shortHashToLong: []
	}).write()

	Index.addToDb = function(dbObject, insertObject){
		if (Array.isArray(insertObject))
			Index.db.get(dbObject).push(...insertObject).write();
		else
			Index.db.get(dbObject).push(insertObject).write();

		var newDbObj = Index.db.get(dbObject).uniqBy('txid').value();

		Index.db.set(dbObject, newDbObj).write();
	}

	Index.getSupportedArtifacts = function(onSuccess, onError){
		var SupportedArtifactList = Index.db.get("SupportedArtifacts").orderBy("timestamp", "desc").value();

		if (SupportedArtifactList.length < 50){
			Network.getArtifactsFromOIPd(function(artifacts) {
				let supported = Index.stripUnsupported(artifacts);
				let filtered = Index.filterArtifacts(supported);

				onSuccess([...filtered]);
			}, onError);
		} else {
			onSuccess(SupportedArtifactList)
		}
	}

	Index.getArtifacts = function(pageNumber, onSuccess, onError){
		var page = pageNumber || 1;

		if (isNaN(page) && page !== "*"){
			onError = onSuccess;
			onSuccess = pageNumber;
			page = 1;
		} 

		var loadMore = function(newPageNumber, onSuccess, onError){
			Network.getArtifactsFromOIPd(newPageNumber, function(artifacts, currentPageNumber) {
				let supported = Index.stripUnsupported(artifacts);
				let filtered = Index.filterArtifacts(supported);

				onSuccess([...filtered], function(onSuccess, onError){ loadMore(currentPageNumber + 1, onSuccess, onError) });
			}, onError);
		}

		loadMore(page, onSuccess, onError);
	}

	Index.getSuggestedContent = function(pageNumber, onSuccess, onError){
		Index.getArtifacts(pageNumber, onSuccess, onError);
	}

	Index.stripUnsupported = function(artifacts){
		var supportedArtifacts = [];

		for (var x = artifacts.length -1; x >= 0; x--){
			var tmpArtifact = new Artifact();

			try {
				var fromJS = tmpArtifact.fromJSON(artifacts[x])

				var validate = tmpArtifact.isValid()

				if (validate && validate.success)
					supportedArtifacts.push(tmpArtifact);
				else {
					if (settings.debug){
						console.error(fromJS, validate, artifacts[x], tmpArtifact.toJSON());
					}
				}
			} catch (e) { 
				if (settings.debug){
					console.error(e) 
				}
			}
		}   

		return [...supportedArtifacts];
	}

	Index.filterArtifacts = function(artifacts){
		var filteredArtifacts = artifacts;

		if (Array.isArray(settings.artifactFilters)){
			for (var filter of settings.artifactFilters){
				filteredArtifacts = _.filter(filteredArtifacts, filter)
			}
		} else {
			filteredArtifacts = _.filter(filteredArtifacts, settings.artifactFilters)
		}

		Index.addToDb("SupportedArtifacts", filteredArtifacts)

		return [...filteredArtifacts];
	}

	Index.getArtifactFromID = function(id, onSuccess, onError){
		var short = false;

		if (id.length < 11){
			short = true;
		}

		var artifactInDb = Index.db.get("SupportedArtifacts").find(function(artifact){
			if (artifact.getTXID().substr(0, id.length) === id)
				return true;
			else
				return false;
		}).value();

		if (!artifactInDb) {
			Network.getArtifactFromOIPd(id, function(result){
				let supported = Index.stripUnsupported([result]);
				let filtered = Index.filterArtifacts(supported);

				onSuccess(filtered[0]);
			}, onError)
		} else {
			onSuccess(artifactInDb);
		}
	}

	Index.search = function(options, onSuccess, onError){
		Network.searchOIPd(options, function(results){
			if (options.protocol === "media") {
				let supported = Index.stripUnsupported(results);
				let filtered = Index.filterArtifacts(supported);

				onSuccess(filtered);
			} else {
				onSuccess(results);
			}
		}, function(error){
			onError(error);
		})
	}

	Index.getRegisteredPublishers = function(onSuccess, onError){
		var pubs = [];
		if (LocStorage.registeredPublishers){
			pubs = JSON.parse(LocStorage.registeredPublishers).arr;
		}

		Network.getPublishersFromOIPd(function(results) {
			var newPubs = results;
			for (var i = 0; i < pubs.length; i++) {
				newPubs.push(pubs[i])
			}

			Index.addToDb("Publishers", results)
			onSuccess(newPubs);
		});
	}

	Index.getRegisteredRetailers = function(onSuccess, onError){
		Network.getRetailersFromOIPd(function(results) {
			Index.addToDb("Retailers", results)
			onSuccess(results);
		});
	}

	Index.getRegisteredPromoters = function(onSuccess, onError){
		Network.getPromotersFromOIPd(function(results) {
			Index.addToDb("Promoters", results)
			onSuccess(results);
		});
	}

	Index.getPublisher = function(id, onSuccess, onError){
		if (LocStorage.registeredPublishers){
			var pubs = JSON.parse(LocStorage.registeredPublishers).arr;

			var found = false;

			for (var pub of pubs){
				if (pub.address.substr(0, id.length) === id){
					found = true;
					onSuccess(pub);
					return;
				}
			}
		}

		var publisherInDb = Index.db.get("Publishers").find({address: id}).value();

		if (publisherInDb) {
			onSuccess(publisherInDb)
		} else {
			Network.searchOIPd({"protocol": "publisher", "search-on": "address", "search-for": id}, function(results){
				var pub = results[0]['publisher-data']['alexandria-publisher'];

				Index.addToDb("Publishers", pub)

				onSuccess(pub);
			}, function(err){
				onError(err);
			});
		}
	}

	Index.getRetailer = function(id, onSuccess, onError){
		var retailerInDb = Index.db.get("Retailers").find({address: id}).value();

		if (retailerInDb) {
			onSuccess(retailerInDb)
		} else {
			Network.searchOIPd({"protocol": "retailer", "search-on": "address", "search-for": id}, function(results){
				var retailer = results[0];

				Index.addToDb("Retailers", retailer)

				onSuccess(retailer);
			}, function(err){
				onError(err);
			});
		}
	}

	Index.getPromoter = function(id, onSuccess, onError){
		var retailerInDb = Index.db.get("Promoters").find({address: id}).value();

		if (retailerInDb) {
			onSuccess(retailerInDb)
		} else {
			Index.search({"protocol": "retailer", "search-on": "address", "search-for": id}, function(results){
				var retailer = results[0];

				Index.addToDb("Retailers", retailer)

				onSuccess(retailer);
			}, function(err){
				onError(err);
			});
		}
	}

	Index.getPublisherArtifacts = function(pubAddress, onSuccess, onError){
		Index.search({"protocol": "media", "search-on": "address", "search-for": id}, function(results){
			onSuccess(results);
		}, function(err){
			onError(err);
		});
	}

	Index.getRandomSuggested = function(onSuccess){
		Index.getSupportedArtifacts(function(results){
			let randomArt = [...results].sort( function() { return 0.5 - Math.random() } ).slice(0,15);
			onSuccess(randomArt);
		});
	}

	Index.stripIndexData = function(artJson){
		var strippedArtJSON = {
			"oip-041": artJson["oip-041"]
		}

		return strippedArtJSON;
	}

	Index.getFloDataFromTXID = function(txid, onSuccess, onError){
		Network.getTXFromFlosight(txid, function(tx){
			if (tx)
				onSuccess(tx.floData);
			else
				onError("No Transaction Returned on Search!");
		}, onError)
	}

	Index.getMultipartsForArtifact = function(txid, onSuccess, onError){
		var matched = [];

		Index.getArtifactFromID(txid, function(artifact){
			Index.getFloDataFromTXID(artifact.txid, function(txFloData){
				var firstMp = new Multipart();

				firstMp.fromString(txFloData);
				firstMp.setTXID(artifact.txid);

				matched.push(firstMp);

				Network.searchFloData(txid, function(results){
					if (results && results !== "null"){
						for (var mp of results){
							var tmpMp = new Multipart();

							tmpMp.fromString(mp.Message);
							tmpMp.setTXID(mp.Hash);

							// Get the shorter string
							var trimLength = txid.length;

							// Take whichever is shorter
							if (tmpMp.getFirstPartTXID().length < trimLength && tmpMp.getFirstPartTXID().length > 0)
								trimLength = tmpMp.getFirstPartTXID().length
							
							if (txid.substr(0, trimLength) === tmpMp.getFirstPartTXID().substr(0, trimLength)){
								matched.push(tmpMp)
							}
						}

						onSuccess(matched);
					} else {
						onSuccess([])
					}
				}, onError)
			}, onError)
		}, onError)
	}

	this.Index = Index;
	return this.Index;
}

export default IndexFunction;