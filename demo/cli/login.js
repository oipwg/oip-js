var OIPJS = require('../../lib/main.js');

OIPJS.User.Login("75c1209-dbcac5a6-e040977-64a52ae", "PublicDevAccount", function(success){
	console.log("Login Successful!!");
}, function(error) { console.error(error) });