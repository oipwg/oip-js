const OIPJS = require('../../lib/babel.js').OIPJS;
const Artifact = require('../../lib/babel.js').Artifact;

var Core = OIPJS();

Core.Index.getMultipartsForArtifact('2c9a5d', function(multiparts){
	console.log(multiparts)

	var art = new Artifact();

	art.fromMultiparts(multiparts);

	console.log(art.getTXID())
}, console.error);