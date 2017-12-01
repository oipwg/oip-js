var IndexFunction = function(){
	var Network = this.Network;

	var Index = {};

	Index.supportedArtifacts = [];

	Index.getSupportedArtifacts = function(callback){
		Network.getArtifactsFromOIPd(function(jsonResult) {
			let filtered = Index.stripUnsupported(jsonResult);
			callback([...filtered]);
		});
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

	Index.getArtifactFromID = function(id, callback){
		Index.getSupportedArtifacts(function(supportedArtifacts){
			for (var i = 0; i < supportedArtifacts.length; i++) {
				if (supportedArtifacts[i].txid.substr(0, id.length) === id){
					callback([...[supportedArtifacts[i]]]);
				}
			}
		})
	}

	Index.search = function(options, onSuccess, onError){
		Network.searchOIPd(options, function(results){
			let res = Index.stripUnsupported(results);

			onSuccess(res);
		}, function(error){
			onError(error);
		})
	}

	Index.getPublisher = function(id, onSuccess, onError){
		Network.searchOIPd({"protocol": "publisher", "search-on": "address", "search-for": id}, function(results){
			onSuccess(results[0]['publisher-data']['alexandria-publisher']);
		}, function(err){
			onError(err);
		});
	}

	Index.getRandomSuggested = function(onSuccess){
		Index.getSupportedArtifacts(function(results){
			let randomArt = results.sort( function() { return 0.5 - Math.random() } ).slice(0,15);
			onSuccess(randomArt);
		});
	}

	this.Index = Index;
	return this.Index;
}

export default IndexFunction;