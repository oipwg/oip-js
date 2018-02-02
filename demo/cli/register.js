var OIPJS = require('../../lib/babel.js');

var email = 'exampleuser@alexandria.io';
var password = 'ExampleUserPa55w0rd';
var userAlias = "exampleuser";

// "Register" a "User", this just creates a multiwallet in the Wallet storage server.
OIPJS.User.Register(email, password, function(success){

	console.log("Register User Success!")

	// Grab our main address for this User so that we can request funds from the faucet & register our user as a "Publisher"
	var mainAddress = OIPJS.Wallet.getMainAddress();

	// Ask the faucet for a free one time amount (usually 1 FLO) to cover initial registration/publish fees
	OIPJS.Wallet.tryOneTimeFaucet(mainAddress, function(success){

		console.log("Faucet Success!")

		// "Register" the mainAddress as a "Publisher" in OIP, this allows us to publish/manage Artifacts
		OIPJS.Publisher.Register(userAlias, mainAddress, email, function(success){

			console.log("Register Publisher Success!")
			
		}, function(error){ console.error(error) })
	}, function(error){ console.error(error) })
}, function(error){ console.error(error) })