var OIPJS = require('../../lib/babel.js').OIPJS();
var ArtifactBuilder = require('../../lib/babel.js').ArtifactBuilder;
var ArtifactFileBuilder = require('../../lib/babel.js').ArtifactFileBuilder;

OIPJS.Index.getArtifactFromID("a1a8d9", function(artifact){
	console.log("Successfully grabbed Artifact!", JSON.stringify(artifact, null, 4));

	try{
		var updateArtifact = new ArtifactBuilder();
		updateArtifact.fromJSON(artifact);

		var updatedArtifact = updateArtifact.toJSON();
	} catch (e) { console.error(e) }

	console.log("Successfully Updated Artifact", JSON.stringify(updatedArtifact, null, 4))
}, function(error){console.error(error)})