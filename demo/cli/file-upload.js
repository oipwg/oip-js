var OIPJS = require('../../lib/babel.js');
var fs = require('fs');

OIPJS.Network.ipfsAPIAdd([{
		path: '/cat.jpeg',
		content: fs.createReadStream(__dirname + "/cat.jpeg")
	}], 
	{ 
		progress: function(progress){
			console.log("Progress:", progress);
		}
	}, function(error, success) { 
		if (error) {
			console.error(error);
		} else {
			console.log(success);
		}
	}
);