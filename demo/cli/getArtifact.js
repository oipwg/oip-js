var OIPJS = require('../../lib/babel.js')();

OIPJS.Index.getArtifactFromID("a1a8d9", function(success){
	console.log("Successfully grabbed Artifact!", success);
}, function(error){console.error(error)})