var OIPJS = require('../../lib/babel.js').OIPJS({
	debug: true
});

var numbartifacts = 1150;
OIPJS.Index.getSuggestedContent(function(artifacts, loadMore){
	console.log("Successfully grabbed " + artifacts.length + " Artifacts!");
	console.log("Grabbing some more!");
	var loadMoreSuccess = function(artifacts, loadMore){
		console.log("Grabbed " + artifacts.length + " more!");

		OIPJS.Index.getSupportedArtifacts(function(artifacts){
			console.log("Number of currently loaded Supported Artifacts: " + artifacts.length)

			if (artifacts.length < numbartifacts)
				loadMore(loadMoreSuccess, console.error)
			else
				console.log("Loading of >" + numbartifacts + " Complete");
		}, console.error)
	}

	loadMore(loadMoreSuccess, console.error)
}, console.error)