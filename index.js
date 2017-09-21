import axios from 'axios';
import IPFS_MAIN from 'ipfs'
const ipfs = new IPFS_MAIN()

let AlexandriaCore = (function(){
	let Core = {};

	// Initiate all instances
	Core.ipfs = new IPFS_MAIN();

	// Define all of the application URLS
	Core.OIPdURL = "https://api.alexandria.io/alexandria/v2";
	Core.IPFSGatewayURL = "https://gateway.ipfs.io/ipfs/";

	// Define URLS for things we don't control, these likely will change often
	Core.btcTickerURL = "https://blockchain.info/ticker?cors=true";

	Core.Artifact = {};

	Core.Artifact.maxThumbnailSize = 512000;

	Core.Artifact.getTXID = function(oip){
		let txid = "";
		try {
			txid = oip.txid
		} catch(e) {}
		return txid;
	}

	Core.Artifact.getTitle = function(oip){
		let title = "";
		try {
			title = oip['oip-041'].artifact.info.title
		} catch(e) {}
		return Core.util.decodeMakeJSONSafe(title);
	}

	Core.Artifact.getType = function(oip){
		let type = "";
		try {
			type = oip['oip-041'].artifact.type.split('-')[0];
		} catch(e) {}
		return type;
	}

	Core.Artifact.getSubtype = function(oip){
		let subtype = "";
		try {
			subtype = oip['oip-041'].artifact.type.split('-')[1];
		} catch(e) {}
		return subtype;
	}

	Core.Artifact.getDescription = function(oip){
		let description = "";
		try {
			description = oip['oip-041'].artifact.info.description;

		} catch(e) {}
		return Core.util.decodeMakeJSONSafe(description);
	}

	Core.Artifact.getFiles = function(oip){
		let files = [];
		try {
			files = oip['oip-041'].artifact.storage.files
		} catch(e) {}
		return files;
	}

	Core.Artifact.getLocation = function(oip){
		let location = "";
		try {
			location = oip['oip-041'].artifact.storage.location
		} catch(e) {}
		return location;
	}

	Core.Artifact.getPublisherName = function(oip){
		return oip.publisherName ? oip.publisherName : "Flotoshi";
	}

	Core.Artifact.getArtist = function(oip){
		let artist = "";
		try {
			artist = oip['oip-041'].artifact.info.extraInfo.artist
		} catch(e) {}

		if (artist === ""){
			try {
				artist = Core.Artifact.getPublisherName(oip);
			} catch(e) {}
		}

		return artist;
	}

	Core.Artifact.getScale = function(oip){
		let scale = 1;

		try {
			let tmpScale = oip['oip-041'].artifact.payment.scale;

			if (tmpScale && tmpScale.split(":").length === 2){
				scale = tmpScale.split(":")[0];
			}
		} catch (e) {}

		return scale 
	}

	Core.Artifact.getMainFile = function(oip, type){
		let mainFile;

		let files = Core.Artifact.getFiles(oip);
		let location = Core.Artifact.getLocation(oip);

		for (let i = 0; i < files.length; i++){
			if (files[i].type === type && !mainFile){
				mainFile = files[i];
			}
		}

		return mainFile;
	}

	Core.Artifact.getMainPaidFile = function(oip, type){
		let mainFile;

		let files = Core.Artifact.getFiles(oip);
		let location = Core.Artifact.getLocation(oip);

		for (let i = 0; i < files.length; i++){
			if (files[i].type === type && (files[i].sugPlay !== 0 || files[i].sugBuy !== 0) && !mainFile){
				mainFile = files[i];
			}
		}

		return mainFile;
	}

	Core.Artifact.getMainFileSugPlay = function(oip, type){
		let sugPlay = 0;

		try {
			sugPlay = Core.Artifact.getMainPaidFile(oip, type).sugPlay / Core.Artifact.getScale(oip);
		} catch (e) {}

		return sugPlay 
	}

	Core.Artifact.getMainFileSugBuy = function(oip, type){
		let sugBuy = 0;

		try {
			sugBuy = Core.Artifact.getMainPaidFile(oip, type).sugBuy / Core.Artifact.getScale(oip);
		} catch (e) {}

		return sugBuy
	}

	Core.Artifact.getThumbnail = function(oip){
		let thumbnail;

		let files = Core.Artifact.getFiles(oip);
		let location = Core.Artifact.getLocation(oip);

		for (let i = 0; i < files.length; i++){
			if (files[i].type === "Image" && files[i].sugPlay === 0 && files[i].fsize < Core.Artifact.maxThumbnailSize && !thumbnail){
				thumbnail = files[i];
			}
		}

		let thumbnailURL = "";

		if (thumbnail){
			thumbnailURL = location + "/" + thumbnail.fname;
		}

		return thumbnailURL;
	}

	Core.Artifact.getFirstImage = function(oip){
		let imageGet;

		let files = Core.Artifact.getFiles(oip);
		let location = Core.Artifact.getLocation(oip);

		for (let i = 0; i < files.length; i++){
			if (files[i].type === "Image" && !imageGet){
				imageGet = files[i];
			}
		}

		let imageURL = "";

		if (imageGet){
			imageURL = location + "/" + imageGet.fname;
		}

		return imageURL;
	}

	Core.Artifact.getFirstHTML = function(oip){
		let htmlGet;

		let files = Core.Artifact.getFiles(oip);
		let location = Core.Artifact.getLocation(oip);

		for (let i = 0; i < files.length; i++){
			let extension = Core.util.getExtension(files[i].fname);
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

	Core.Artifact.getFirstHTMLURL = function(oip){
		let htmlGet;

		let files = Core.Artifact.getFiles(oip);
		let location = Core.Artifact.getLocation(oip);

		for (let i = 0; i < files.length; i++){
			let extension = Core.util.getExtension(files[i].fname);
			if ((extension === "html" || extension === "HTML") && !htmlGet){
				htmlGet = files[i];
			}
		}

		let htmlURL = "";

		if (htmlGet){
			htmlURL = location + "/" + htmlGet.fname;
		}

		return Core.util.buildIPFSURL(htmlURL);
	}

	Core.Artifact.getSongs = function(oip){
		let files = Core.Artifact.getFiles(oip);
		let location = Core.Artifact.getLocation(oip);
		let artist = Core.Artifact.getArtist(oip);

		let songs = [];

		for (var i = 0; i < files.length; i++){
			if (files[i].type === "Audio")
				songs.push({fname: files[i].fname, location: location, src: "", artist: files[i].artist ? files[i].artist : artist, name: files[i].dname ? files[i].dname : files[i].fname});
		}

		return songs;
	}

	Core.Artifact.getEntypoIconForType = function(oip){
		let type = oip['oip-041'].artifact.type.split('-')[0];

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

	Core.Artifact.paid = function(oip){
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

	Core.Data = {};

	Core.Data.supportedArtifacts = [];

	Core.Data.getSupportedArtifacts = function(callback){
		let _Core = Core;

		Core.Network.getArtifactsFromOIPd(function(jsonResult) { 
			var supportedArtifacts = [];
			for (var x = jsonResult.length -1; x >= 0; x--){
				if (jsonResult[x]['oip-041']){
					if (jsonResult[x]['oip-041'].artifact.type.split('-').length === 2){
						supportedArtifacts.push(jsonResult[x]);
					}
				}
			}   
			_Core.Data.supportedArtifacts = supportedArtifacts;
			callback(_Core.Data.supportedArtifacts);
		});
	}

	Core.Data.getBTCPrice = function(callback){
		// Check to see if we should update again, if not, just return the old data.
		Core.Network.getLatestBTCPrice(callback);
	}

	Core.Network = {};

	Core.Network.cachedArtifacts = [];
	Core.Network.artifactsLastUpdate = 0; // timestamp of last ajax call to the artifacts endpoint.
	Core.Network.artifactsUpdateTimelimit = 30 * 1000; // 30 seconds
	Core.Network.cachedBTCPriceObj = {};
	Core.Network.btcpriceLastUpdate = 0;
	Core.Network.btcpriceUpdateTimelimit = 5 * 60 * 1000; // Five minutes

	Core.Network.getArtifactsFromOIPd = function(callback){
		// Check to see if we should update again, if not, just return the old data.
		if (Core.Network.artifactsLastUpdate < Date.now() - Core.Network.artifactsUpdateTimelimit){
			Core.Network.artifactsLastUpdate = Date.now();

			let _Core = Core;

			axios.get(Core.OIPdURL + "/media/get/all").then(function(results){
				_Core.Network.cachedArtifacts = results.data;
				callback(_Core.Network.cachedArtifacts);
			});
		} else {
			callback(Core.Network.cachedArtifacts);
		}
	}

	Core.Network.getLatestBTCPrice = function(callback){
		if (Core.Network.btcpriceLastUpdate < Date.now() - Core.Network.btcpriceUpdateTimelimit || Core.Network.cachedBTCPriceObj === {}){
			Core.Network.btcpriceLastUpdate = Date.now();

			let _Core = Core;

			axios.get(Core.btcTickerURL).then(function(result){
				if (result.status === 200){
					_Core.Network.cachedBTCPriceObj = result.data;
				}
				
				callback(_Core.Network.cachedBTCPriceObj["USD"].last);
			});
		} else {
			callback(Core.Network.cachedBTCPriceObj["USD"].last);
		}
	}

	Core.Network.getIPFS = function(callback){
		Core.ipfs.on('ready', () => {
			callback(Core.ipfs);
		})
	}

	Core.Network.getThumbnailFromIPFS = function(hash, onData){
		// Require a hash to be passed
		if (!hash || hash === "")
			return;

		Core.ipfs.files.cat(hash, function (err, file) {
			if (err){
				console.log(err);
				return;
			}

			let stream = file;
			let chunks = [];
			if (stream){
				stream.on('data', function(chunk) {
					chunks.push(chunk);

					// Note, this might cause tons of lag depending on how many ongoing IPFS requests we have.
					Core.util.chunksToFileURL(chunks, function(data){
						onData(data);
					})
				});
				stream.on('end', function(){
					// Core.util.chunksToFileURL(chunks, function(data){
					// 	onData(data);
					// })
				})
			}
		})
	}

	Core.Network.getFileFromIPFS = function(hash, onComplete){
		// Require a hash to be passed
		if (!hash || hash === "")
			return;

		Core.ipfs.files.cat(hash, function (err, file) {
			if (err){
				console.log(err);
				return;
			}

			let stream = file;
			let chunks = [];
			if (stream){
				stream.on('data', function(chunk) {
					chunks.push(chunk);
				});
				stream.on('end', function(){
					Core.util.chunksToFileURL(chunks, function(data){
						onComplete(data);
					})
				})
			}
		})
	}

	Core.util = {};

	Core.util.chunksToFileURL = function(chunks, onLoad){
		var reader  = new FileReader();

		reader.addEventListener("load", function () {
			if (reader.result && reader.result != "data:"){
				onLoad(reader.result);
			}
		}, false);

		if (chunks) {
			reader.readAsDataURL(new Blob(chunks));
		}
	}

	Core.util.buildIPFSURL = function(hash, fname){
		let trailURL = "";
		if (!fname){
			trailURL = hash;
		} else {
			trailURL = hash + "/" + encodeURIComponent(fname);
		}
		return Core.IPFSGatewayURL + trailURL;
	}

	Core.util.getExtension = function(filename){
		let splitFilename = filename.split(".");
		let indexToGrab = splitFilename.length - 1;

		return splitFilename[indexToGrab];
	}

	Core.util.decodeMakeJSONSafe = function(stringToCheck){
		let tmpStr = stringToCheck;
		if (typeof tmpStr === "string" && tmpStr.substr(0,1) === '"' && tmpStr.substr(tmpStr.length-1,tmpStr.length) === '"')
			tmpStr = eval(tmpStr);

		return tmpStr;
	}

	Core.util.calculateBTCCost = function(usd_value, callback){
		Core.Data.getBTCPrice(function(btc_price){
			callback(usd_value / btc_price)
		})
	}

	Core.util.convertBTCtoBits = function(btc_value){
		return btc_value * Math.pow(10,6);
	}

	return Core;
})();

export default AlexandriaCore;