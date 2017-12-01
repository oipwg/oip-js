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

	Artifact.getDuration = function(oip){
		let duration;

		let files = Artifact.getFiles(oip);

		for (var i = files.length - 1; i >= 0; i--) {
			if (files[i].duration && !duration)
				duration = files[i].duration;
		}

		return duration;
	}

	Artifact.getMainPaidFile = function(oip, type){
		let mainFile;

		let files = Artifact.getFiles(oip);
		let location = Artifact.getLocation(oip);

		for (let i = 0; i < files.length; i++){
			if (files[i].type === type && (files[i].sugPlay !== 0 || files[i].sugBuy !== 0) && !mainFile){
				mainFile = files[i];
			}
		}

		return mainFile;
	}

	Artifact.getMainFileSugPlay = function(oip, type){
		let sugPlay = 0;

		try {
			sugPlay = Artifact.getMainPaidFile(oip, type).sugPlay / Artifact.getScale(oip);
		} catch (e) {}

		return sugPlay 
	}

	Artifact.getMainFileSugBuy = function(oip, type){
		let sugBuy = 0;

		try {
			sugBuy = Artifact.getMainPaidFile(oip, type).sugBuy / Artifact.getScale(oip);
		} catch (e) {}

		return sugBuy
	}

	Artifact.getMainFileDisPlay = function(oip, type){
		let disPlay = false;

		try {
			disPlay = Artifact.getMainPaidFile(oip, type).disPlay;
		} catch (e) {}

		if (!disPlay)
			disPlay = false;

		return disPlay
	}

	Artifact.getMainFileDisBuy = function(oip, type){
		let disBuy = 0;

		try {
			disBuy = Artifact.getMainPaidFile(oip, type).disBuy;
		} catch (e) {}

		if (!disBuy)
			disBuy = false;

		return disBuy
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

	Artifact.getAlbumArt = function(oip){
		let albumArt;

		let files = Artifact.getFiles(oip);

		for (let i = 0; i < files.length; i++){
			if (files[i].type === "Image" && files[i].subtype === "cover" && !files[i].sugPlay && !albumArt){
				albumArt = files[i];
			}
		}

		if (!albumArt){
			for (let i = 0; i < files.length; i++){
				if (files[i].type === "Image" && files[i].subtype === "album-art" && !files[i].sugPlay && !albumArt){
					albumArt = files[i];
				}
			}
		}

		if (!albumArt){
			albumArt = Artifact.getThumbnail(oip);
		}

		return albumArt;
	}

	Artifact.getFirstImage = function(oip){
		let imageGet;

		let files = Artifact.getFiles(oip);
		//let location = Artifact.getLocation(oip);

		for (let i = 0; i < files.length; i++){
			if (files[i].type === "Image" && !imageGet){
				imageGet = files[i];
			}
		}

		// let imageURL = "";

		// if (imageGet){
		// 	imageURL = location + "/" + imageGet.fname;
		// }

		return imageGet;
	}

	Artifact.getFirstHTML = function(oip){
		let htmlGet;

		let files = Artifact.getFiles(oip);
		let location = Artifact.getLocation(oip);

		for (let i = 0; i < files.length; i++){
			let extension = util.getExtension(files[i].fname);
			if ((extension === "html" || extension === "HTML") && !htmlGet){
				htmlGet = files[i];
			}
		}

		let htmlURL = "";

		if (htmlGet){
			htmlURL = location + "/" + htmlGet.fname;
		}

		return htmlURL;
	}

	Artifact.getFirstHTMLURL = function(oip){
		let htmlGet;

		let files = Artifact.getFiles(oip);
		let location = Artifact.getLocation(oip);

		for (let i = 0; i < files.length; i++){
			let extension = util.getExtension(files[i].fname);
			if ((extension === "html" || extension === "HTML") && !htmlGet){
				htmlGet = files[i];
			}
		}

		let htmlURL = "";

		if (htmlGet){
			htmlURL = location + "/" + htmlGet.fname;
		}

		return util.buildIPFSURL(htmlURL);
	}

	Artifact.getSongs = function(oip){
		let files = Artifact.getFiles(oip);
		let location = Artifact.getLocation(oip);
		let artist = Artifact.getArtist(oip);

		let albumArtwork = Artifact.getAlbumArt(oip);

		let albumArtUrl = util.buildIPFSURL(util.buildIPFSShortURL(Artifact.getLocation(oip), albumArtwork));

		let songs = [];

		for (var i = 0; i < files.length; i++){
			if (files[i].type === "Audio"){
				let durationNice = util.formatDuration(files[i].duration);

				let songObj = JSON.parse(JSON.stringify(files[i]));

				songObj.location = location;
				songObj.artist = files[i].artist ? files[i].artist : artist
				songObj.name = files[i].dname ? files[i].dname : files[i].fname
				songObj.albumArtwork = albumArtUrl
				songObj.length = durationNice

				songs.push(songObj);
			}
		}

		return songs;
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

	Artifact.checkPaidViewFile = function(file){
		let paid = false;
		if (file.sugPlay)
			paid = true;

		return paid;
	}

	Artifact.getFormattedVideoQualities = function(oip){
		let files = Artifact.getFiles(oip);

		let qualityArr = [];

		for (var i = files.length - 1; i >= 0; i--) {
			if (files[i].subtype === "HD720" || 
				files[i].subtype === "SD480" || 
				files[i].subtype === "LOW320" || 
				files[i].subtype === "MOB240"){
				qualityArr.push({
					format: files[i].subtype,
					src: util.buildIPFSURL(util.buildIPFSShortURL(Artifact.getLocation(oip), files[i])),
					type: "video/" + util.getExtension(files[i].fname)
				})
			}

		}
	}

	Artifact.getPaymentAddresses = function(oip, file){
		let addrs = [];

		try {
			addrs = oip['oip-041'].artifact.payment.addresses;

			if (addrs.length === 0)
				addrs = {'florincoin': Artifact.getPublisher(oip)};
		} catch (e) {}

		return addrs;
	}

	this.Artifact = Artifact;
	return this.Artifact;
}

export default ArtifactFunction;