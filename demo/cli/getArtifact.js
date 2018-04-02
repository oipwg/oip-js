var OIPJS = require('../../lib/babel.js').OIPJS();
var ArtifactBuilder = require('../../lib/babel.js').ArtifactBuilder;
var ArtifactFileBuilder = require('../../lib/babel.js').ArtifactFileBuilder;

OIPJS.Index.getSupportedArtifacts(function(artifacts){
	console.log("Successfully grabbed Artifacts!");

	for (var x in artifacts){
		if (artifacts[x].getType() === "Research"){
			console.log(artifacts[x].toJSON());
		}
	}
}, function(error){console.error(error)})