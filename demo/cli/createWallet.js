var OIPJS = require('../../lib/babel.js')({
	keystoreServerURL: "http://127.0.0.1:9196"
})

var email = 'demouser@alexandria.io';
var password = 'ExampleUserPa55w0rd';
var userAlias = "exampleuser";

// "Register" a "User", this just creates a multiwallet in the Wallet storage server.
OIPJS.User.Register(email, password, function(success){
	console.log("User Register & Wallet Creation Successful!");
}, function(error){ console.error("User Register Error", error) })