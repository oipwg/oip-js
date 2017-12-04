var PublisherFunction = function(){
	var Publisher = {};

	Publisher.Register = function(username, onSuccess, onError){
		LibraryDJS.announcePublisher(PhoenixAPI.wallet, username, address, "", email, function(err, data){
			if (err){
				PhoenixEvents.trigger("onPublisherAnnounceFail", err);
				console.error(err);
				return;
			} 

			PhoenixAPI.sentPubUsers.push({
				username: username,
				address: address,
				email: email
			});

			localStorage.sentPubUsers = JSON.stringify(PhoenixAPI.sentPubUsers);

			localStorage.setItem("identifier", PhoenixAPI.wallet.identifier);
			localStorage.setItem("loginWalletEnc", CryptoJS.AES.encrypt(password, PhoenixAPI.wallet.identifier));
			localStorage.setItem("remember-me", "true");


			PhoenixEvents.trigger("onPublisherAnnounceSuccess", {
				identifier: PhoenixAPI.wallet.identifier,
				username: username,
				address: address,
				email: email
			});

			// Redirect to main dashboard page.
			//window.location.href = 'index.html';
		});
	}

	this.Publisher = Publisher;
	return Publisher;
}

export default PublisherFunction;