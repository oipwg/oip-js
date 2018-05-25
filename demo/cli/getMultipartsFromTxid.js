const OIPJS = require('../../lib/babel.js').OIPJS;
const Artifact = require('../../lib/babel.js').Artifact;

var Core = OIPJS();

Core.Index.getMultipartsForArtifact('2c5140f5da2c7ab5434af0953e22fe4800b7e09ecbec2836fe91d6bbe771134e', function(multiparts){
	console.log(multiparts)

	var art = new Artifact();

	art.fromMultiparts(multiparts);

	console.log(art.getTXID())
}, console.error);