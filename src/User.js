var UserFunction = function(){
	var Wallet = this.Wallet;
	var Index = this.Index;

	var User = {};

	User.Identifier = "";
	User.Password = "";

	User.Register = function(email, password, onSuccess, onError){
		Wallet.Create(email, password, function(wallet){
			onSuccess(wallet.identifier);
		}, onError);
	}

	User.Login = function(identifier, password, onSuccess, onError){
		if (!onSuccess)
			onSuccess = function(){};
		if (!onError)
			onError = function(){};

		Wallet.Login(identifier, password, (state) => {
			// If we have florincoin addresses
			if (state.florincoin){
				if (state.florincoin.addresses){
					let gotFirstPublisher = false;

					for (var i = 0; i < state.florincoin.addresses.length; i++) {
						Index.getPublisher(state.florincoin.addresses[i].address, (pubInfo) => {
							if (!gotFirstPublisher){
								gotFirstPublisher = true;
								onSuccess(pubInfo)
							}
						}, (error) => {
							// Address is not a publisher
						})
					}
				}
			}
			//onSuccess(state);
		}, (error) => {
			// On Error
			console.error(error);
			onError(error);
		})
	}

	User.Logout = function(){
		User.Identifier = "";
		User.Password = "";

		Wallet.logout();
	}

	User.FollowPublisher = function(publisher){
		
	}

	User.UnfollowPublisher = function(publisher){
		
	}

	User.LikeArtifact = function(oip){
		
	}

	User.NeturalArtifact = function(oip){
		
	}

	User.DislikeArtifact = function(oip){
		
	}

	User.UpdateArtifactView = function(oip, last_action, current_duration){

	}

	this.User = User;

	return this.User;
}

export default UserFunction;