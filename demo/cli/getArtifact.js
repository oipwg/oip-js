var OIPJS = require('../../lib/babel.js').OIPJS();

OIPJS.Index.getArtifactFromID("a1a8d9", function(artifact){
	console.log("Successfully grabbed Artifact!", JSON.stringify(artifact.toJSON(), null, 4));
}, function(error){console.error(error)})