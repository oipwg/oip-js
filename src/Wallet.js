import EventEmitter from 'eventemitter3';
import aep from 'aep';

var WalletFunction = function(){
	var Data = this.Data;
	var Network = this.Network;

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
		aep.createNewWallet({
			email: email,
			password: password
		}).then((wallet) => {
			Wallet.wallet = wallet;
			onSuccess(Wallet.wallet);
			Wallet.wallet.refresh();
		}).catch(onError);
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

	Wallet.tryFaucet = function(flo_address, recaptcha, onSuccess, onError){
		Network.tryFaucet(flo_address, recaptcha, function(res, txinfo){
			for (var key in Wallet.wallet.keys){
				if (Wallet.wallet.keys[key].coins.florincoin){
					for (var i in txinfo.vout){
						for (var j in txinfo.vout[i].scriptPubKey.addresses){
							if (txinfo.vout[i].scriptPubKey.addresses[j] === Wallet.wallet.keys[key].coins.florincoin.address){
								var txid = txinfo.txid;
								var vout = txinfo.vout[i].n;
								var amount = txinfo.vout[i].value;
								var satoshi = amount * Wallet.wallet.keys[key].coins.florincoin.coinInfo.satPerCoin;
								var inputs = [];

								Wallet.wallet.keys[key].coins.florincoin.addUnconfirmed(txid, vout, amount, satoshi, inputs);
								Wallet.refresh();

								onSuccess(res,txinfo);
							}
						}
					} 
				}
			}
		}, onError)
	}

	Wallet.refresh = function(){
		Wallet.wallet.refresh().then((keys) => {
			let json = Wallet.wallet.toJSON();
			let state = Wallet.keysToState(keys[0], json);

	    	Wallet.emitter.emit("bal-update", state);
		})
	}

	Wallet.sendPayment = function(coin, fiat, fiat_amount, payTo, onSuccess, onError){
		// payTo can be an array of addresses, if avaiable. If not, it will only be a string.
		console.log(coin, fiat, fiat_amount, payTo);

		if (coin !== "florincoin"){
			console.error("Attempting to send currency with " + coin + " will not calculte the correct USD value!!!");
			return;
		}

		Data.getFLOPrice(function(usd_flo){
			console.log(Wallet.wallet);
			
			let paymentAmount = (fiat_amount / usd_flo).toFixed(8);
			console.log(paymentAmount)

			if (parseFloat(paymentAmount) <= 0.001)
				paymentAmount = 0.00100001;

			console.log("From: florincoin\nTo: " + payTo + "\nAmount:" + paymentAmount);

			if (Wallet.devMode){
				setTimeout(function(){ onSuccess({"txid": "no-tx-sent___dev-mode"})}, 1500);
			} else {
				Wallet.wallet.payTo(coin, payTo, parseFloat(paymentAmount), 0.001, "Hello from oip-mw :)", function(error, success){
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
		console.log(keys, jsonState);
		for (var j in keys){
			for (var i in keys[j]){
				if (keys[j][i].state === "fulfilled"){
					let coinName = keys[j][i].value.coinName;

					if (!state[coinName]){
						state[coinName] = {
							balance: 0,
							usd: 0,
							addresses: []
						};
					}

					if (keys[j] && keys[j][i] && keys[j][i].value && keys[j][i].value.res && keys[j][i].value.res.balance){
						state[coinName].balance += keys[j][i].value.res.balance;

						state[coinName].addresses.push({
							address: keys[j][i].value.res.addrStr,
							balance: keys[j][i].value.res.balance
						})
					}
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