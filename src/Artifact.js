var ArtifactFunction = function(){
	var util = this.util;

	var Artifact = {};

	Artifact.maxThumbnailSize = 512000;

	Artifact.getTXID = function(oip){
		let txid = "";
		try {
			txid = oip.txid
		} catch(e) {}
		return txid;
	}

	Artifact.getTitle = function(oip){
		let title = "";
		try {
			title = oip['oip-041'].artifact.info.title
		} catch(e) {}
		return util.decodeMakeJSONSafe(title);
	}

	Artifact.getType = function(oip){
		let type = "";
		try {
			type = oip['oip-041'].artifact.type.split('-')[0];
		} catch(e) {}
		return type;
	}

	Artifact.getSubtype = function(oip){
		let subtype = "";
		try {
			subtype = oip['oip-041'].artifact.type.split('-')[1];
		} catch(e) {}
		return subtype;
	}

	Artifact.getDescription = function(oip){
		let description = "";
		try {
			description = oip['oip-041'].artifact.info.description;

		} catch(e) {}
		return util.decodeMakeJSONSafe(description);
	}

	Artifact.getFiles = function(oip){
		let files = [];
		try {
			let tmpFiles = oip['oip-041'].artifact.storage.files;

			for (let i = 0; i < tmpFiles.length; i++) {
				files.push(tmpFiles[i])
			}
		} catch(e) {}

		return [...files];
	}

	Artifact.getLocation = function(oip){
		let location = "";
		try {
			location = oip['oip-041'].artifact.storage.location
		} catch(e) {}
		return location;
	}

	Artifact.getTimestamp = function(oip){
		let timestamp = 0;
		try {
			timestamp = oip['oip-041'].artifact.timestamp
		} catch(e) {}
		return timestamp;
	}

	Artifact.getPublisherName = function(oip){
		let pubName = "Flotoshi";

		try {
			pubName = oip.publisherName
		} catch(e) {}

		return pubName;
	}

	Artifact.getPublisher = function(oip){
		let pubName = "";

		try {
			pubName = oip.publisher
		} catch(e) {}

		return pubName;
	}

	Artifact.getArtist = function(oip){
		let artist = "";
		try {
			artist = oip['oip-041'].artifact.info.extraInfo.artist
		} catch(e) {}

		if (artist === ""){
			try {
				artist = Artifact.getPublisherName(oip);
			} catch(e) {}
		}

		return artist;
	}

	Artifact.getScale = function(oip){
		let scale = 1;

		try {
			let tmpScale = oip['oip-041'].artifact.payment.scale;

			if (tmpScale && tmpScale.split(":").length === 2){
				scale = tmpScale.split(":")[0];
			}
		} catch (e) {}

		return scale 
	}

	Artifact.getMainFile = function(oip, type){
		let mainFile;

		let files = Artifact.getFiles(oip);
		let location = Artifact.getLocation(oip);

		if (!type){
			type = Artifact.getType(oip);
		}

		for (let i = 0; i < files.length; i++){
			if (files[i].type === type && !mainFile){
				mainFile = files[i];
			}
		}

		// If no file is found with the correct type, default to use the first file in the Artifact
		if (!mainFile){
			if (files[0])
				mainFile = files[0];
		}

		return mainFile;
	}

	Artifact.getFileCost = function(oip, file_number, purchase_type){
		let fileCost;

		let files = Artifact.getFiles(oip);

		if (purchase_type === "buy"){
			fileCost = files[file_number].sugBuy;
		} else if (purchase_type === "play"){
			fileCost = files[file_number].sugPlay;
		}

		return fileCost;
	}

	Artifact.getFiat = function(oip){
		var fiat = "usd";

		try {
			fiat = oip['oip-041'].artifact.payment.fiat.toLowerCase();
		} catch (e) {}

		return fiat;
	}

	Artifact.getDuration = function(oip){
		let duration;

		let files = Artifact.getFiles(oip);

		for (var i = files.length - 1; i >= 0; i--) {
			if (files[i].duration && !duration)
				duration = files[i].duration;
		}

		return duration;
	}

	Artifact.getTipPrefs = function(oip){
		let sugTip = [];
		try {
			sugTip = oip['oip-041'].artifact.payment.sugTip
		} catch(e) {}
		return sugTip;
	}

	Artifact.getThumbnail = function(oip){
		let thumbnail;

		let files = Artifact.getFiles(oip);
		let location = Artifact.getLocation(oip);

		for (let i = 0; i < files.length; i++){
			if (files[i].type === "Image" && files[i].subtype === "cover" && !files[i].sugPlay && !files[i].disPlay && files[i].fsize < Artifact.maxThumbnailSize && !thumbnail){
				thumbnail = files[i];
			}
		}

		if (!thumbnail){
			for (let i = 0; i < files.length; i++){
				if (files[i].type === "Image" && !files[i].sugPlay && !files[i].disPlay && files[i].fsize < Artifact.maxThumbnailSize && !thumbnail){
					thumbnail = files[i];
				}
			}
		}

		return thumbnail;
	}

	Artifact.getEntypoIconForType = function(type){
		let icon;

		switch(type){
			case "Audio":
				icon = "beamed-note";
				break;
			case "Video":
				icon = "clapperboard";
				break;
			case "Image":
				icon = "image";
				break;
			case "Text":
				icon = "text";
				break;
			case "Software":
				icon = "code";
				break;
			case "Web":
				icon = "code";
				break;
			default:
				icon = "";
				break;
		}

		return icon;
	}

	Artifact.paid = function(oip){
		let files = oip['oip-041'].artifact.storage.files;

		let paid = false;
		if (files){
			for (var i = 0; i < files.length; i++){
				if (files[i].sugPlay || files[i].sugBuy)
					paid = true;
			}
		}

		return paid;
	}

	Artifact.isFilePaid = function(file){
		let paid = false;
		
		if (file.sugPlay || file.sugBuy)
			paid = true;

		return paid;
	}

	Artifact.getPaymentAddresses = function(oip, file_num){
		let addrs = {};

		try {
			if (file_num && oip && oip.oip042 && oip.oip042.artifact.storage && oip.oip042.artifact.storage.files[file_num] && oip.oip042.artifact.storage.files[file_num].shortMW){
				addrs = { 'shortMW': oip.oip042.artifact.storage.files[file_num].shortMW }
			} else {
				addrs = oip['oip-041'].artifact.payment.addresses;
			}

			if (addrs === {})
				addrs.florincoin = Artifact.getPublisher(oip);
		} catch (e) {}

		return addrs;
	}

	Artifact.getRetailerCut = function(oip, file_num){
		var retailerCut = 0;

		try {
			retailerCut = oip['oip-041'].artifact.payment.retailer
		} catch (e) {}

		return retailerCut
	}

	Artifact.getPromoterCut = function(oip, file_num){
		var promoterCut = 0;

		try {
			promoterCut = oip['oip-041'].artifact.payment.promoter
		} catch (e) {}

		return promoterCut
	}

	this.Artifact = Artifact;
	return this.Artifact;
}

export default ArtifactFunction;