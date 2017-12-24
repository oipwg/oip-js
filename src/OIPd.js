import jsonpatch from 'fast-json-patch';
import MD5 from 'crypto-js/md5';

var OIPdFunction = function(){
	var Data = this.Data;
	var Wallet = this.Wallet;
	var User = this.User;
	var OIPd = {}

	OIPd.MP_PREFIX = "oip-mp(";
	OIPd.CHOP_MAX_LEN = 370;
	OIPd.TXCOMMENT_MAX_LEN = 528;

	// returns signature directly
	OIPd.signPublisher = function (name, address, time) {
		// http://api.alexandria.io/#sign-publisher-announcement-message
		var toSign = name + "-" + address + "-" + time;

		return Wallet.signMessage(address, toSign);
	};

	// returns signature directly
	OIPd.signArtifact = function (ipfs, address, time) {
		// http://api.alexandria.io/#sign-publisher-announcement-message
		var toSign = ipfs + "-" + address + "-" + time;

		return Wallet.wallet.signMessage(address, toSign);
	};

	// returns signature directly
	OIPd.signArtifactDeactivation = function (txid, publisher, timestamp) {
		// https://api.alexandria.io/docs/#sign-an-artifact-deactivation-message
		var toSign = txid + "-" + publisher + "-" + timestamp;

		return Wallet.signMessage(publisher, toSign);
	};

	OIPd.signPublishArtifact = function(ipfs, address, artifactJSON) {
		var time = OIPd.unixTime();

		var signature = OIPd.signArtifact(ipfs, address, time);

		var data = {
			"oip-041": {
				"artifact": artifactJSON.artifact, 
				signature: signature
			}
		};

		data["oip-041"]["artifact"].timestamp = parseInt(time);
		data["oip-041"]["artifact"].publisher = address;

		return data;
	};

	// response=http://api.alexandria.io/#publish-new-artifact
	OIPd.publishArtifact = function (ipfs, address, artifactJSON, onSuccess, onError) {
		var signedArtJSON = OIPd.signPublishArtifact(ipfs, address, artifactJSON)

		OIPd.calculatePublishFee(signedArtJSON, function(pubFeeFLO, pubFeeUSD){
			OIPd.Send(signedArtJSON, address, pubFeeFLO, function (txIDs) {
				onSuccess(txIDs)
			}, function(error){
				onError(error)
			});
		}, onError);
	};

	// response=http://api.alexandria.io/#announce-new-publisher
	OIPd.announcePublisher = function (name, address, email, onSuccess, onError) {
		var time = OIPd.unixTime();

		var signature = OIPd.signPublisher(name, address, time);

		var data = {
			"alexandria-publisher": {
				"name": name,
				"address": address,
				"timestamp": parseInt(time),
				"email": MD5(email).toString()
			},
			"signature": signature
		};

		OIPd.Send(data, function(txid){
			onSuccess({name: name, address: address, timestamp: parseInt(time), email: MD5(email).toString(), txid: txid.txid})
		}, onError);
	};

	// callback is (errorString, response) response=https://api.alexandria.io/docs/#deactivate-an-artifact
	OIPd.deactivateArtifact = function (txid, onSuccess, onError) {
		var time = OIPd.unixTime();
		var address = Wallet.getMainAddress('florincoin');

		var signature = OIPd.signArtifactDeactivation(txid, address, parseInt(time));

		var data = {  
		    "oip-041":{  
		        "deactivateArtifact":{  
		            "txid":txid,
		            "timestamp":parseInt(time)
		        },
		        "signature":signature
		    }
		};

		OIPd.Send(data, onSuccess, onError);
	};

	OIPd.unixTime = function () {
		// slice is to strip milliseconds
		return Date.now().toString().slice(0, -3);
	}

	OIPd.Send = function (jsonData, onSuccess, onError) {
		if (!User.isLoggedIn || !Wallet.wallet){
			onError("Error, you must be logged in to publish!");
			return;
		}

		if (!User.isPublisher){
			onError("Error, you must be a publisher to publish!");
			return;
		}

		var publishFee;

		OIPd.sendToBlockChain(JSON.stringify(jsonData), publishFee, onSuccess, onError);
	};

	OIPd.sendToBlockChain = function (txComment, publishFee, onSuccess, onError) {
		// over sized?
		if (txComment.length > (OIPd.CHOP_MAX_LEN * 10)) {
			callback("txComment is too large to fit within 10 multipart transactions. try making it smaller!");
		} else if (txComment.length > OIPd.TXCOMMENT_MAX_LEN) {
			OIPd.multiPart(txComment, publishFee, onSuccess, onError);
		}
		else {
			OIPd.sendTX(txComment, publishFee, onSuccess, onError);
		}
	};

	OIPd.sendTX = function(txComment, publishFee, onSuccess, onError){
		var options = {};

		if (txComment){
			options.txComment = txComment;
		}

		if (publishFee){
			options.fee = publishFee;
		} 

		Wallet.sendTxComment(options, onSuccess, onError)
	}

	OIPd.multiPart = function (txComment, publishFee, onSuccess, onError) {
	    var multiPartPrefix = OIPd.MP_PREFIX;

	    var multipartStrings = OIPd.createMultipartStrings(txComment);

	    var partNumber = 0;
	    var maxParts = multipartStrings.length - 1;

	    var stringPart = multipartStrings[partNumber];

	    // In the first transaction, the txidRef is blank.
	    var txidRef = "";

	    var multiPartMessage = OIPd.createMultipartString(partNumber, maxParts, txidRef, stringPart);

	    // in the first transaction send the whole publish fee then only the network min from there on out
	    OIPd.sendTX(multiPartMessage, publishFee, function (err, data) {
	    	var txIDs = [];

	        var addTxid = function(txid){
	        	txIDs.push(data.txid);
	        }

	        var multipartDone = function(){
	        	onSuccess(txIDs);
	        }

	        addTxid(data.txid);
	        
	        var txidRef = data.txid;

	        OIPd.sendRestOfMultipart(multipartStrings, txidRef, addTxid, multipartDone, onError)
	    });
	};

	OIPd.sendRestOfMultipart = function(multipartStrings, txidRef, addTxid, multipartDone, onError){
		// Start at (index = 1) since we already published the first part.
		var partNumber = 1;
		var maxParts = multipartStrings.length - 1;

		var sendNextPart = function(){
			var stringPart = multipartStrings[partNumber];

			var multiPartMessage = OIPd.createMultipartString(partNumber, maxParts, txidRef, stringPart);
			
			OIPd.sendTx(multiPartMessage, undefined, function(txid){
				addTxid(txid);

				if (partNumber < maxParts){
					partNumber++;
					sendNextPart();
				} else {
					multipartDone();
				}
			}, onError)
		}

		// Now that we have initialized, we need to call it for the first time.
		sendNextPart();
	}

	OIPd.createMultipartStrings = function(longTxComment){
		return OIPd.chopString(longTxComment);
	}

	OIPd.createMultipartString = function(partNumber, maxParts, txidRef, stringPart){
		var publisherAddress = Wallet.getMainAddress('florincoin');

		var signaturePreImage = partNumber + "-" + max + "-" + publisherAddress + "-" + txidRef + "-" + stringPart;

	    var signature = Wallet.signMessage(publisherAddress, signaturePreImage);

	    var multiPartMessage = OIPd.multiPartPrefix + part + "," + max + "," + publisherAddress + "," + txidRef + "," + signature + "):" + stringPart;

	    return multiPartMessage;
	}

	OIPd.chopString = function (input) {
		input = input.toString();

		var chunks = [];
		while (input.length > CHOP_MAX_LEN) {
			chunks[chunks.length] = input.slice(0, CHOP_MAX_LEN);
			input = input.slice(CHOP_MAX_LEN);
		}
		chunks[chunks.length] = input;

		return chunks;
	};

	OIPd.createSquashedPatch = function(original, modified){

	}

	OIPd.squashPatch = function(patch){
		var squashed = {};

		for (var i = 0; i < patch.length; i++) {
			// Store the operation
			var operation = patch[i].op;
			// Remove operation key from squashed patch
			delete patch[i].op;
			// Check what the operation is, and put it in the right place
			if (!squashed[operation])
				squashed[operation] = [];
			
			squashed[operation].push(patch[i]);
		}
		
		return squashed;
	}

	OIPd.unSquashPatch = function(squashedPatch){
		var patch = [];

		for (var op in squashedPatch){
			for (var i = 0; i < squashedPatch[op].length; i++) {
				// Load what we saved from the patch
				var singlePatch = squashedPatch[op];
				// Restore the operation to the patch
				singlePatch.op = op;
				// Add singlePatch to patch
				patch.push(singlePatch);
			}
		}

		return patch;
	}

	OIPd.calculatePublishFee = function(artJSON, onSuccess, onError){
		Data.getFLOPrice(function(USDperFLO){
			Data.getOIPdInfo(function(OIPdInfo){
				var floPerKb = 0.01; // new endpoint, using 0.1 as default for now, ToDo: Update this when changes are made!
				var pubFeeFreeFlo = (JSON.stringify(artJSON).length / 1024) * floPerKb;
				var pubFeeFreeUSD = pubFeeFreeFlo * USDperFLO;

				var minPlayArray = [], minBuyArray = [], sugPlayArray = [], sugBuyArray = [];

				if (artJSON.artifact && artJSON.artifact.storage && artJSON.artifact.storage.files){
					var files = artJSON.artifact.storage.files;

					if (!artJSON.artifact.payment){
						artJSON.artifact.payment = {
							maxdisc: 30
						}
					}

					var scale = artJSON.artifact.payment.scale;

					if (typeof scale === "string" && scale.split(":").length === 2){
						scale = parseInt(scale.split(":")[0]);
					} else {
						scale = 1;
					}

					if (artJSON.artifact && artJSON.artifact.payment){
						if (!artJSON.artifact.payment.maxdisc){
							artJSON.artifact.payment.maxdisc == 30;
						} else if (typeof artJSON.artifact.payment.maxdisc === "string"){
							artJSON.artifact.payment.maxdisc = parseFloat(artJSON.artifact.payment.maxdisc);
						}
					}

					for (var i = 0; i < files.length; i++) {
						if (files[i].sugBuy){
							// maxdisc stands for discount percentage
							minBuyArray.push((files[i].sugBuy * (1 - (artJSON.artifact.payment.maxdisc / 100))) / scale)
							sugBuyArray.push(files[i].sugBuy / scale)
						}
						if (files[i].sugPlay){
							minPlayArray.push((files[i].sugPlay * (1 - (artJSON.artifact.payment.maxdisc / 100))) / scale);
							sugPlayArray.push(files[i].sugPlay / scale)
						}
					}
				}		

				var totMinPlay = 0;
				for (var i = 0; i < minPlayArray.length; i++) {
					totMinPlay += minPlayArray[i];
				}

				var totMinBuy = 0;
				for (var i = 0; i < minBuyArray.length; i++) {
					totMinBuy += minBuyArray[i];
				}

				var totSugPlay = 0;
				for (var i = 0; i < sugPlayArray.length; i++) {
					totSugPlay += sugPlayArray[i];
				}

				var totSugBuy = 0;
				for (var i = 0; i < sugBuyArray.length; i++) {
					totSugBuy += sugBuyArray[i];
				}

				var artCost = (totMinPlay + totSugPlay + totMinBuy + totSugBuy) / 2; 
				// divide by 2 because 
				// devon (3:54 PM): doing it that way applies both of those impacts, which are good, and also solves the previous issue we were discussing

				var avgArtCost = OIPdInfo.avgArtCost;

				var pubFeeComUSD = 0;
				if (artCost <= avgArtCost){
					pubFeeComUSD = artCost;
				} else {
					pubFeeComUSD = (( Math.log(artCost) - Math.log(avgArtCost) ) * (avgArtCost / artCost) * (artCost - avgArtCost)) + avgArtCost;
				}

				var pubFeeComFlo = pubFeeComUSD / USDperFLO;
				var pubFeeUSD = Math.max(pubFeeFreeUSD, pubFeeComUSD);
				var pubFeeFlo = pubFeeUSD / USDperFLO;

				onSuccess(pubFeeUSD, pubFeeFlo);
			}, function(error){
				onError(error);
			})
		}, function(error){
			onError(error);
		})	
	}

	this.OIPd = OIPd;
	return this.OIPd;
}

export default OIPdFunction;