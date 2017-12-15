import jsonpatch from 'fast-json-patch';
import MD5 from 'crypto-js/md5';

var OIPdFunction = function(){
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
	OIPd.signArtifactDeactivate = function (txid, publisher, timestamp) {
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
		var data = OIPd.signPublishArtifact(ipfs, address, artifactJSON)

		// ToDo, work on PublishFee!!
		OIPd.Send(data, address, publishFee, function (txIDs) {
			onSuccess(txIDs)
		}, function(error){
			onError(error)
		});
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
	OIPd.sendDeactivationMessage = function (address, txid, onSuccess, onError) {
		var time = OIPd.unixTime();

		var signature = OIPd.signArtifactDeactivate(txid, address, parseInt(time));

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
		} else 	if (txComment.length > OIPd.TXCOMMENT_MAX_LEN) {
			OIPd.multiPart(txComment, publishFee, onSuccess, onError);
		}
		else {
			OIPd.sendTX(txComment, publishFee, onSuccess, onError);
		}
	};

	OIPd.sendTX = function(txComment, publishFee, onSuccess, onError){
		var options = {};
		if (txComment)
			options.txComment = txComment;
		if (publishFee)
			options.fee = publishFee;

		Wallet.sendTxComment(options, onSuccess, onError)
	}

	OIPd.multiPart = function (txComment, publishFee, onSuccess, onError) {
	    var txIDs = [];

	    var multiPartPrefix = OIPd.MP_PREFIX;

	    var chop = OIPd.chopString(txComment);

	    var part = 0;
	    var max = chop.length - 1;

	    // var perPubFee = publishFee / chop.length; just publish all in the first tx fee
	    // hardcoded to one satoshi so that it defaults to the normal amount
	    var perPubFee = 1 / Math.pow(10,8);

	    // the first reference tx id is always 64 zeros
	    var reference = "";

	    var data = chop[part];
	    var preImage = part.toString() + "-" + max.toString() + "-" + address + "-" + reference + "-" + data;

	    var signature = wallet.signMessage(address, preImage);

	    var multiPart = multiPartPrefix + part.toString() + "," + max.toString() +
	        "," + address + "," + reference + "," + signature + "):" + data;

	    // in the first transaction send the whole publish fee then only the network min from there on out
	    wallet.sendCoins(address, address, amount, multiPart, publishFee, function (err, data) {
	        txIDs[txIDs.length] = data.txid;
	        reference = data.txid;

	        publishPart(wallet, perPubFee, chop, max, 0, reference, address, amount, multiPartPrefix, function(txids){
	        	//console.log("Completed publishing parts! Here ya go.")
	        	callback(null, txids);
	        })
	    });
	};

	OIPd.createMultipartStrings = function(longTxComment){
		return OIPd.chopString(longTxComment);
	}

	OIPd.publishPart = function(wallet, perPubFee, chopPieces, numberOfPieces, lastPiecesCompleted, reference, address, amount, multiPartPrefix, callback){
	    var part = lastPiecesCompleted + 1;

	    var data = chopPieces[part];
	    var preImage = part.toString() + "-" + numberOfPieces.toString() + "-" + address + "-" + reference.substring(0,10) + "-" + data;

	    var signature = wallet.signMessage(address, preImage);

	    var multiPart = multiPartPrefix + part.toString() + "," + numberOfPieces.toString() +
	        "," + address + "," + reference.substring(0,10) + "," + signature + "," + "):" + data;

	    wallet.sendCoins(address, address, amount, multiPart, perPubFee, function (err, data) {
	    	txIDs[txIDs.length] = data.txid;

	    	if (part < numberOfPieces){
	        	publishPart(wallet, perPubFee, chopPieces, numberOfPieces, part, reference, address, amount, multiPartPrefix, callback);
	    	} else {
	    		callback(txIDs);
	    	}
	    });
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

	this.OIPd = OIPd;
	return this.OIPd;
}

export default OIPdFunction;