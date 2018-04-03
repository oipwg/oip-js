var OIPJS = require('../../lib/babel.js').OIPJS();

OIPJS.Index.getArtifactFromID("e0113b", function(artifact){
	console.log("Successfully grabbed Artifact!", artifact.toJSON());
}, function(error){console.error(error)})