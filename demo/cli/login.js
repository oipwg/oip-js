var OIPJS = require('../../lib/babel.js')({
	keystoreServerURL: "http://127.0.0.1:9196"
});

OIPJS.User.Login("ffc23fc-7f819492-112a931-48a8479", "ExampleUserPa55w0rd", function(success){
	console.log("Login Successful!!");
}, function(error) { console.error(error) });