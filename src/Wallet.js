import EventEmitter from 'eventemitter3';
import oipmw from 'oipmw';

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
		oipmw.createNewWallet({
			email: email,
			password: password
		}).then((wallet) => {
			Wallet.wallet = wallet;
			onSuccess(Wallet.wallet);
			Wallet.wallet.refresh();
		}).catch(onError);
	}

	Wallet.Login = function(identifier, password, onSuccess, onError){
		Wallet.wallet = new oipmw.Wallet(identifier, password);

		Wallet.wallet.load().then(() => {
		   		Wallet.refresh(onSuccess, onError);
		   	}).catch((error) => {
				onError(error);
			}
		)
	}

	Wallet.getMainAddress = function(coin){
		if (Wallet.wallet){
			return Wallet.wallet.getMainAddress(coin);
		} else {
			return '';
		}
	}

	Wallet.tryOneTimeFaucet = function(flo_address, recaptcha, onSuccess, onError){
		Network.tryOneTimeFaucet(flo_address, recaptcha, function(txinfo){
			Wallet.tryAddUnconfirmed(flo_address, txinfo, onSuccess, onError);
		}, onError);
	}

	Wallet.tryDailyFaucet = function(flo_address, recaptcha, onSuccess, onError){
		Network.tryDailyFaucet(flo_address, recaptcha, function(txinfo){
			Wallet.tryAddUnconfirmed(flo_address, txinfo, onSuccess, onError);
		}, onError);
	}

	Wallet.tryAddUnconfirmed = function(flo_address, txinfo, onSuccess, onError){
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
							Wallet.wallet.store();
							Wallet.refresh();

							onSuccess(txinfo);
						}
					}
				} 
			}
		}
	}

	Wallet.refresh = function(onSuccess, onError){
		if (typeof onSuccess !== "function")
			onSuccess = function(){}
		if (typeof onError !== "function")
			onError = function(){}

		Wallet.wallet.refresh().then((keys) => {
			let json = Wallet.wallet.toJSON();
			let state = Wallet.keysToState(keys[0], json);

	    	Wallet.emitter.emit("bal-update", state);

	    	onSuccess(state);
		}).catch((error) => {
			onError(error);
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
			let coinName = keys[j].value.coinName;

			if (keys[j].state === "fulfilled"){
				if (!state[coinName]){
					state[coinName] = {
						status: "online",
						balance: 0,
						usd: 0,
						addresses: [],
						utxo: []
					};
				}

				if (keys[j] && keys[j].value && keys[j].value.utxo){
					state[coinName].utxo = keys[j].value.utxo;
				}
			} else {
				if (!state[coinName]){
					state[coinName] = {
						status: "offline",
						balance: 0,
						usd: 0,
						addresses: [],
						utxo: []
					};
				}
			}
		}
		for (var i in jsonState.keys){
			for (var j in jsonState.keys[i].coins){
				let matched = false;
				if (state[j] && state[j].addresses){
					for (var q in state[j].addresses){
						if (state[j].addresses[q].address === jsonState.keys[i].coins[j].address){
							matched = true;
							state[j].addresses[q].privKey = jsonState.keys[i].coins[j].privKey;
						}
					}
				} else {
					if (!state[j]){
						state[j] = {
							balance: 0,
							usd: 0,
							addresses: []
						};
					} else if (!state[j].addresses){
						state[j].addresses = [];
					}
				}
				if (!matched)
					state[j].addresses.push({ address: jsonState.keys[i].coins[j].address, balance: jsonState.keys[i].getBalance(j), privKey: jsonState.keys[i].coins[j].privKey})
			}
		}

		for (var coin in state){
			state[coin].balance = 0;

			for (var address in state[coin].addresses){
				state[coin].balance += state[coin].addresses[address].balance;
			}
		}

		console.log("Created State!", state);

		return state;
	}

	this.Wallet = Wallet;

	return this.Wallet;
}

export default WalletFunction;