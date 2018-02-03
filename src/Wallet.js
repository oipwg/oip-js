import EventEmitter from 'eventemitter3';
import oipmw from 'oipmw';

var WalletFunction = function(){
	var Artifact = this.Artifact;
	var Data = this.Data;
	var Network = this.Network;
	var Index = this.Index;

	var Wallet = {}

	Wallet.wallet; 
	Wallet.devMode = false;
	Wallet.emitter = new EventEmitter();
	Wallet.activeRetailer = {};
	Wallet.activePromoter = {};

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
			Wallet.Login(wallet.identifier, password, onSuccess, onError);
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

	Wallet.Logout = function(){
		Wallet.wallet = undefined;
	}

	Wallet.getMainAddress = function(coin){
		if (Wallet.wallet){
			return Wallet.wallet.getMainAddress(coin);
		} else {
			return '';
		}
	}

	Wallet.newShortMWAddress = function(){
		return Wallet.wallet.newShortMWAddress()
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
		console.groupCollapsed("Send TX Comment")
		console.log("Sending TX Comment", options);
		
		var pubAddress = Wallet.wallet.getMainAddress('florincoin');

		Wallet.wallet.payTo(pubAddress, pubAddress, 0.001, options, function(error, success){
			if (error){
				console.groupEnd();
				console.error("Error sending TX Comment!", error);
				onError(error);
			} else {
				Wallet.wallet.store();
				Wallet.createAndEmitState(() => {
					Wallet.refresh();
				});
				
				console.log("TX Comment sent successfully!", success)
				console.groupEnd()

				onSuccess(success);
			}
		})
	}

	Wallet.payForArtifact = function(artifact, file_number, purchase_type, onSuccess, onError){
		var artifact_cost = Artifact.getFileCost(artifact, file_number, purchase_type);
		var artifact_fiat = Artifact.getFiat(artifact);
		var payment_supported_addresses = Artifact.getPaymentAddresses(artifact, file_number);
		var artifact_retailer_cut = Artifact.getRetailerCut(artifact, file_number);
		var artifact_promoter_cut = Artifact.getPromoterCut(artifact, file_number);

		var supportedCoins = oipmw.Networks.listSupportedCoins();

		var coin_exchange_rates = {};

		var gotExchangeRate = function(fiat_per_coin, coin, fiat){
			coin_exchange_rates[coin].status = "success";

			coin_exchange_rates[coin][fiat] = {};
			coin_exchange_rates[coin][fiat] = fiat_per_coin;
		}
		var exchangeRateError = function(coin, fiat){
			coin_exchange_rates[coin].status = "error";
		}

		var finishProcessing = function(){
			var can_process_with = {};

			for (var coin in coin_exchange_rates){
				if (coin_exchange_rates[coin] && coin_exchange_rates[coin].status){
					if (coin_exchange_rates[coin].status === "success" && coin_exchange_rates[coin][artifact_fiat]){
						if (coin_exchange_rates[coin][artifact_fiat] * artifact_cost >= Wallet.wallet.getBalance(coin)){
							can_process_with[coin] = coin_exchange_rates[coin][artifact_fiat] * Wallet.wallet.getBalance(coin);
						}
					}
				}
			}

			var coin_with_greatest_balance;

			for (var coin in can_process_with){
				if (!coin_with_greatest_balance){
					coin_with_greatest_balance = coin;
				} else if (can_process_with[coin] > can_process_with[coin_with_greatest_balance]) {
					coin_with_greatest_balance = coin;
				}
			}

			if (coin_with_greatest_balance){
				var outputs = {};
				var artist_percentage = 100;

				if (Wallet.activeRetailer){
					artist_percentage -= artifact_retailer_cut;

					var retailerAddress = Wallet.activeRetailer.paymentAddresses[coin_with_greatest_balance];
					outputs[retailerAddress] = artifact_cost * (artifact_retailer_cut / 100);
				}

				if (Wallet.activePromoter){
					artist_percentage -= artifact_promoter_cut;

					var promoterAddress = Wallet.activePromoter.paymentAddresses[coin_with_greatest_balance];
					outputs[promoterAddress] = artifact_cost * (artifact_promoter_cut / 100);
				}

				outputs[payment_supported_addresses[coin_with_greatest_balance]] = artifact_cost * (artist_percentage / 100);

				Wallet.sendPaymentMulti(coin_with_greatest_balance, artifact_fiat, outputs, onSuccess, onError);
			} else {
				onError("No coins with balance enough to pay!!!")
			}
		}

		var continueIfDone = function(){
			var done = true;
			for (var coin in coin_exchange_rates){
				if (coin_exchange_rates[coin] && coin_exchange_rates[coin].status && coin_exchange_rates[coin].status === "pending"){
					done = false;
				}
			}
			if (done) {
				finishProcessing();
			}
		}

		for (var coin in supportedCoins){
			var canPayWith = false;
			for (var payCoin in payment_supported_addresses){
				if (payCoin === payCoin){
					canPayWith = true;
				}
			}

			if (canPayWith){
				coin_exchange_rates[supportedCoins[coin]] = {};
				coin_exchange_rates[supportedCoins[coin]].status = "pending";
				Data.getExchangeRate(artifact_fiat, supportedCoins[coin], gotExchangeRate, exchangeRateError)
			}
		}
	}

	Wallet.sendPaymentMulti = function(coin, fiat, options, onSuccess, onError){
		var outputs = options.outputs;

		Data.getExchangeRate(coin, fiat, function(fiatPerCoin){
			var coinOutputs = {};
			var total_output_amount_fiat = 0;
			var total_output_amount_coin = 0;

			for (var output_address in outputs){
				var output_amount_fiat = outputs[output_address];

				total_output_amount_fiat += output_amount_fiat;

				var paymentAmount = parseFloat((output_amount_fiat / fiatPerCoin).toFixed(8));

				total_output_amount_coin += paymentAmount;
				
				coinOutputs[output_address] = paymentAmount;
			}

			options.outputs = coinOutputs;
			options.q = true;

			console.groupCollapsed("Send MultiPayment")
			console.log("From: " + coin + "\nTo: " + outputs + "\nAmount:" + total_output_amount_coin + "\nFiat:" + fiat + " (" + total_output_amount_fiat + ")", options);

			Wallet.wallet.payToMulti(coin, options, function(error, success){
				if (error){
					console.groupEnd();
					console.error("Error sending payment!!", error);
					onError(error);
				} else {
					Wallet.wallet.store();
					Wallet.createAndEmitState(() => {
						Wallet.refresh();
					});
					
					console.log("Payment sent successfully", success);
					console.groupEnd();
					onSuccess(success);
				}
			});
		}, onError)
	}

	Wallet.sendPayment = function(coin, fiat, fiat_amount, payTo, onSuccess, onError){
		Data.getExchangeRate(coin, fiat, function(fiatPerCoin){
			var paymentAmount = (fiat_amount / fiatPerCoin).toFixed(8);

			console.groupCollapsed("Send Payment")
			console.log("From: " + coin + "\nTo: " + payTo + "\nAmount:" + paymentAmount + "\nFiat:" + fiat + " (" + fiat_amount + ")");

			Wallet.wallet.payTo(coin, payTo, parseFloat(paymentAmount), options, function(error, success){
				if (error){
					console.groupEnd();
					console.error("Error sending payment!!", error);
					onError(error);
				} else {
					Wallet.wallet.store();
					Wallet.createAndEmitState(() => {
						Wallet.refresh();
					});

					console.log("Payment sent successfully", success);
					console.groupEnd();
					
					onSuccess(success);
				}
			});
		}, onError)
	}

	Wallet.createState = function(){
		var state = {
			identifier: Wallet.wallet.identifier
		};

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

		console.groupCollapsed("OIPJS Wallet Balance Update")
		console.log("New State:", state);
		console.groupEnd()

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

	Wallet.setActiveRetailer = function(id, onSuccess, onError){
		Index.getRetailer(id, function(retailer){
			Wallet.activeRetailer = retailer;
			Wallet.activeRetailer.paymentAddresses = {
				'florincoin': retailer["retailer-data"]['alexandria-retailer'].FLOaddress,
				'bitcoin': retailer["retailer-data"]['alexandria-retailer'].BTCaddress
			}
			onSuccess(retailer);
		}, onError)
	}

	Wallet.setActivePromoter = function(id, onSuccess, onError){
		Index.getPromoter(id, function(promoter){
			Wallet.activePromoter = promoter;
			Wallet.activePromoter.paymentAddresses = {
				'florincoin': promoter["promoter-data"]['alexandria-promoter'].FLOaddress,
				'bitcoin': promoter["promoter-data"]['alexandria-promoter'].BTCaddress
			}
			onSuccess(promoter);
		}, onError)
	}

	this.Wallet = Wallet;

	return this.Wallet;
}

export default WalletFunction;