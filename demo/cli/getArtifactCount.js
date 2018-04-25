var OIPJS = require('../../lib/babel.js').OIPJS;

var Core = OIPJS({
	OIPdURL: "https://snowflake.oip.fun/alexandria/v2",
	indexFilters: {
		publisher: "FTSTq8xx8yWUKJA5E3bgXLzZqqG9V6dvnr"
	}
})

Core.Index.getSupportedArtifacts(function(artifacts){
	console.log("Total Artifacts Count: ", artifacts.length);
}, function(error){console.error(error)})