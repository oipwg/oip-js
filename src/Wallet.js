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
			Wallet.Login(email, password, onSuccess, onError);
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

	Wallet.checkDailyFaucet = function(flo_address, onSuccess, onError){
		Network.checkDailyFaucet(flo_address, (res) => {
			if (res.status === "ALREADY_RECEIVED_INTERVAL_FOR_NOW"){
				onSuccess(false);
			} else {
				onSuccess(true);
			}
		}, (error) => {
			onError(error);
		});
	}

	Wallet.tryOneTimeFaucet = function(flo_address, recaptcha, onSuccess, onError){
		Network.tryOneTimeFaucet(flo_address, recaptcha, function(txinfo){
			Wallet.wallet.addUnconfirmedRawTransaction(txinfo);
			Wallet.createAndEmitState(function(success){
				Wallet.wallet.store();
				onSuccess();
			}, function(error){
				onSuccess();
			})
		}, onError);
	}

	Wallet.tryDailyFaucet = function(flo_address, recaptcha, onSuccess, onError){
		Network.tryDailyFaucet(flo_address, recaptcha, function(txinfo){
			Wallet.wallet.addUnconfirmedRawTransaction(txinfo);
			Wallet.createAndEmitState(function(success){
				Wallet.wallet.store();
				onSuccess();
			}, function(error){
				onSuccess();
			})
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

	Wallet.createAndEmitState = function(onSuccess, onError){
		if (!onSuccess)
			onSuccess = function(){}
		if (!onError)
			onError = function(){}

		try {
			let state = Wallet.createState();

			// Custom wipe out stxo ;)
			// Wallet.wallet.keys[0].coins.florincoin.stxo = [];
			// Wallet.wallet.store();

	    	Wallet.emitter.emit("bal-update", state);

	    	onSuccess(state);
		} catch (e) {
			onError(e);
		}
	}

	Wallet.signMessage = function(address, message){
		return Wallet.wallet.signMessage(address, message)
	}

	Wallet.refresh = function(onSuccess, onError){
		if (!onSuccess)
			onSuccess = function(){}
		if (!onError)
			onError = function(){}

		Wallet.wallet.refresh().then((keys) => {
			Wallet.createAndEmitState(onSuccess, onError);
		}).catch((error) => {
			onError(error);
		})
	}

	Wallet.sendTxComment = function(options, onSuccess, onError){
		console.log("Sending TX Comment", options);
		
		var pubAddress = Wallet.wallet.getMainAddress('florincoin');
		Wallet.wallet.payTo(pubAddress, pubAddress, 0.001, options, function(error, success){
			console.log(success, error)
			if (error){
				console.error(error);
				onError(error);
			} else {
				Wallet.wallet.store();
				Wallet.createAndEmitState(() => {
					Wallet.refresh();
				});
				
				onSuccess(success);
			}
		})
	}

	Wallet.sendPayment = function(coin, fiat, fiat_amount, payTo, onSuccess, onError){
		// payTo can be an array of addresses, if avaiable. If not, it will only be a string.
		console.log(coin, fiat, fiat_amount, payTo);

		if (coin !== "florincoin"){
			console.error("Attempting to send currency with " + coin + " will not calculte the correct USD value!!!");
			return;
		}

		Data.getExchangeRate(coin, fiat, function(fiatPerCoin){
			var paymentAmount = (fiat_amount / fiatPerCoin).toFixed(8);

			console.log("From: " + coin + "\nTo: " + payTo + "\nAmount:" + paymentAmount + "\nFiat:" + fiat + " (" + fiat_amount + ")");

			var options = {
				//"txComment": "Hello from oip-mw :)"
			};

			Wallet.wallet.payTo(coin, payTo, parseFloat(paymentAmount), options, function(error, success){
				console.log(success,error)
				if (error){
					console.error(error);
					onError(error);
				} else {
					Wallet.wallet.store();
					Wallet.createAndEmitState(() => {
						Wallet.refresh();
					});
					
					onSuccess(success);
				}
			});
		})
	}

	Wallet.createState = function(){
		var state = {};

		var supportedCoins = oipmw.Networks.listSupportedCoins();

		for (var coin in supportedCoins){
			state[supportedCoins[coin]] = {
				mainAddress: Wallet.wallet.getMainAddress(supportedCoins[coin]),
				mainPrivate: Wallet.wallet.getPrivateKey(Wallet.wallet.getMainAddress(supportedCoins[coin])),
				balance: Wallet.wallet.getBalance(supportedCoins[coin]),
				usd: 0,
				transactions: {
					queued: [],
					unconfirmed: [],
					confirmed: { txs: [] }
				}
			}

			for (var key in Wallet.wallet.keys){
				var transactions = {
					queued: [],
					unconfirmed: [],
					confirmed: { txs: [] }
				};

				try {
					transactions = Wallet.wallet.keys[key].getTransactionsHistory(supportedCoins[coin]);
				} catch (e) {}

				for (var i = 0; i < transactions.queued.length; i++) {
					state[supportedCoins[coin]].transactions.queued.push(transactions.queued[i]);
				}
				// for (var i = 0; i < transactions.unconfirmed.length; i++) {
				// 	state[supportedCoins[coin]].transactions.unconfirmed.push(transactions.unconfirmed[i]);
				// }
				for (var i = 0; i < transactions.confirmed.txs.length; i++) {
					state[supportedCoins[coin]].transactions.confirmed.txs.push(transactions.confirmed.txs[i]);
				}
			}
		}

		console.log("Created State!", state);

		return state;
	}

	Wallet.validateAddress = function(address, coin){
		var network = oipmw.Networks.getNetwork(coin);

		var validAddress = oipmw.util.validation.isValidAddress(address, network);

		if (!validAddress){
			return false
		} else {
			return true
		}
	}

	this.Wallet = Wallet;

	return this.Wallet;
}

export default WalletFunction;