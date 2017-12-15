var PublisherFunction = function(){
	var OIPd = this.OIPd;
	var User = this.User;
	var Publisher = {};

	Publisher.Register = function(username, address, email, onSuccess, onError){
		// Set user to a publisher while we publish our registration :)
		User.isPublisher = true;
		OIPd.announcePublisher(username, address, email, function(publisher){
			var registeredPublishers;

			try {
				registeredPublishers = JSON.parse(localStorage.registeredPublishers);
			} catch (e) {}

			if (!registeredPublishers)
					registeredPublishers = {arr: []};

			registeredPublishers.arr.push(publisher);

			localStorage.registeredPublishers = JSON.stringify(registeredPublishers);

			onSuccess(publisher);
		}, function(error){
			// Return to false if error
			User.isPublisher = false;
			onError(error);
		});
	}

	this.Publisher = Publisher;
	return Publisher;
}

export default PublisherFunction;