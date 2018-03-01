var OIPJS = require('../../lib/babel.js');

OIPJS.Network.ipfsAPIPin("hash", function(err, info){
	console.log(err, info);
});