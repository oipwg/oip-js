var OIPJS = require('../../lib/babel.js').OIPJS({
	debug: true
});

OIPJS.Index.search({"search-for": "test"}, function(artifacts){
	console.log("Successfully grabbed " + artifacts.length + " Artifacts!");
}, console.error)