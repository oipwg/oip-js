import EventEmitter from 'eventemitter3';
import * as aep from 'aep';

var WalletFunction = function(){
	var Data = this.Data;

	var Wallet = {}

	Wallet.wallet; 
	Wallet.devMode = false;
	Wallet.emitter = new EventEmitter();

	Wallet.on = function(eventType, runMe){
		if (!Wallet.emitter)
			Wallet.emitter = newEventEmitter();

		Wallet.emitter.on(eventType, runMe);
	}

	Wallet.Create = function(email, password, onSuccess, onError){

	}

	Wallet.Login = function(identifier, password, onSuccess, onError){
		Wallet.wallet = new aep.Wallet(identifier, password);

		Wallet.wallet.load().then(() => {
		    return Wallet.wallet.refresh().then((keys) => {
		    		let json = Wallet.wallet.toJSON();
			    	let state = Wallet.keysToState(keys[0], json);

			    	Wallet.emitter.emit("bal-update", state);
					onSuccess(state)
				}).catch((error) => {
					onError(error);
				})
			}).catch((error) => {
			onError(error);
		})
	}

	Wallet.RequestFaucet = function(){

	}

	Wallet.refresh = function(){
		Wallet.wallet.refresh().then((keys) => {
			let json = Wallet.wallet.toJSON();
			let state = Wallet.keysToState(keys[0], json);

	    	Wallet.emitter.emit("bal-update", state);
		})
	}

	Wallet.sendPayment = function(fiat, amount, payTo, onSuccess, onError){
		// payTo can be an array of addresses, if avaiable. If not, it will only be a string.
		console.log(fiat, amount, payTo, "florincoin");

		Data.getFLOPrice(function(usd_flo){
			console.log(Wallet.wallet);
			
			let paymentAmount = (amount / usd_flo).toFixed(8);
			console.log(paymentAmount)

			if (parseFloat(paymentAmount) <= 0.001)
				paymentAmount = 0.00100001;

			console.log("From: florincoin\nTo: " + payTo + "\nAmount:" + paymentAmount);

			if (Wallet.devMode){
				setTimeout(function(){ onSuccess({"txid": "no-tx-sent___dev-mode"})}, 1500);
			} else {
				var paymentAddress = payTo;

				if (payTo.florincoin)
					paymentAddress = payTo.florincoin;

				Wallet.wallet.payTo("florincoin", paymentAddress, parseFloat(paymentAmount), 0.001, "Hello from oip-mw :)", function(error, success){
					console.log(success,error)
					if (error){
						console.error(error);
						onError(error);
					} else {
						console.log(success);
						onSuccess(success);

						Wallet.refresh();
						Wallet.wallet.store();
					}
				});
			}
		})
	}

	Wallet.keysToState = function(keys, jsonState){
		let state = {};
		for (var j in keys){
			for (var i in keys[j]){
				let coinName = keys[j][i].coinName;

				if (!state[coinName]){
					state[coinName] = {
						balance: 0,
						usd: 0,
						addresses: []
					};
				}

				if (keys[j] && keys[j][i] && keys[j][i].res && keys[j][i].res.balance){
					state[coinName].balance += keys[j][i].res.balance;

					state[coinName].addresses.push({
						address: keys[j][i].res.addrStr,
						balance: keys[j][i].res.balance
					})
				}
			}
		}
		for (var i in jsonState.keys){
			for (var j in jsonState.keys[i].coins){
				let matched = false;
				for (var q in state[j].addresses){
					if (state[j].addresses[q].address === jsonState.keys[i].coins[j].address){
						matched = true;
						state[j].addresses[q].privKey = jsonState.keys[i].coins[j].privKey;
					}
				}
				if (!matched)
					state[j].addresses.push({ address: jsonState.keys[i].coins[j].address, balance: 0, privKey: jsonState.keys[i].coins[j].privKey})
			}
		}

		return state;
	}

	this.Wallet = Wallet;

	return this.Wallet;
}

export default WalletFunction;