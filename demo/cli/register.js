var OIPJS = require('../../lib/babel.js')({
	faucetURL: "http://localhost:9090"
})

var email = 'demouser15@alexandria.io';
var password = 'ExampleUserPa55w0rd';
var userAlias = "exampleuser15";

// "Register" a "User", this just creates a multiwallet in the Wallet storage server.
OIPJS.User.Register(email, password, function(success){
	console.log("User Register Successful!");

	// Grab our main address for this User so that we can request funds from the faucet & register our user as a "Publisher"
	var mainAddress = OIPJS.Wallet.getMainAddress();

	// Ask the faucet for a free one time amount (usually 1 FLO) to cover initial registration/publish fees
	OIPJS.Wallet.tryOneTimeFaucet(mainAddress, function(success){
		
		console.log("Faucet Successful!");

		// "Register" the mainAddress as a "Publisher" in OIP, this allows us to publish/manage Artifacts
		OIPJS.Publisher.Register(userAlias, mainAddress, email, function(success){
			
			console.log("Publisher Register Successful!");

		}, function(error){ console.error("Publisher Register Error", error) })
	}, function(error){ console.error("Faucet Error", error) })
}, function(error){ console.error("User Register Error", error) })