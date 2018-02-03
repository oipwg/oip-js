var UserFunction = function(){
	var Wallet = this.Wallet;
	var Index = this.Index;

	var User = {};

	User.isLoggedIn = false;
	User.isPublisher = false;
	User.Identifier = "";
	User.Password = "";

	User.Register = function(email, password, onSuccess, onError){
		Wallet.Create(email, password, function(wallet){
			User.isLoggedIn = true;
			onSuccess(wallet);
		}, onError);
	}

	User.Login = function(identifier, password, onSuccess, onError){
		if (!onSuccess)
			onSuccess = function(){};
		if (!onError)
			onError = function(){};

		Wallet.Login(identifier, password, (state) => {
			User.isLoggedIn = true;
			// If we have florincoin addresses
			if (state.florincoin){
				if (state.florincoin.mainAddress){
					
					Index.getPublisher(state.florincoin.mainAddress, (pubInfo) => {
						User.isPublisher = true;
						onSuccess(pubInfo)
					}, (error) => {
						// Address is not a publisher
						onSuccess({name: "User"});
					})
				} else {
					onSuccess({name: "User"});
				}
			} else {
				onSuccess({name: "User"});
			}
		}, (error) => {
			// On Error
			console.error(error);
			onError(error);
		})
	}

	User.Logout = function(){
		User.Identifier = "";
		User.Password = "";
		User.isLoggedIn = false;
		User.isPublisher = false;

		Wallet.Logout();
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