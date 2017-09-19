import axios from 'axios';
import IPFS_MAIN from 'ipfs'
const ipfs = new IPFS_MAIN()

let AlexandriaCore = (function(){
	let Core = {};

	// Initiate all instances
	Core.ipfs = new IPFS_MAIN();

	// Define all of the application URLS
	Core.OIPdURL = "https://api.alexandria.io/alexandria/v2";

	// Define application values
	Core.artifactsLastUpdate = 0; // timestamp of last ajax call to the artifacts endpoint.
	Core.artifacts = [];
	Core.supportedArtifacts = [];
	Core.artifactsUpdateTimelimit = 30 * 1000;
	Core.maxThumbnailSize = 512000;

	Core.getSupportedArtifacts = function(callback){
		// Check to see if we should update again, if not, just return the old data.
		if (Core.artifactsLastUpdate < Date.now() - Core.artifactsUpdateTimelimit){
			Core.artifactsLastUpdate = Date.now();

			let _Core = Core;

			axios
			.get(Core.OIPdURL + "/media/get/all")
			.then(function(result) { 
				let jsonResult = result.data;
				Core.artifacts = jsonResult;
				var supportedArtifacts = [];
				for (var x = jsonResult.length -1; x >= 0; x--){
					if (jsonResult[x]['oip-041']){
						if (jsonResult[x]['oip-041'].artifact.type.split('-').length === 2){
							supportedArtifacts.push(jsonResult[x]);
						}
					}
				}   
				_Core.supportedArtifacts = supportedArtifacts;
				callback(_Core.supportedArtifacts);
			});
		} else {
			callback(Core.supportedArtifacts);
		}
	}

	Core.getIPFS = function(callback){
		Core.ipfs.on('ready', () => {
			callback(Core.ipfs);
		})
	}

	Core.getThumbnailFromIPFS = function(hash, onData){
		// Require a hash to be passed
		if (!hash || hash === "")
			return;

		Core.ipfs.on('ready', () => {
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
		})
	}

	Core.getFileFromIPFS = function(hash, onComplete){
		// Require a hash to be passed
		if (!hash || hash === "")
			return;

		Core.ipfs.on('ready', () => {
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
		})
	}

	Core.Artifact = {};

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
		return title;
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

	Core.Artifact.getFiles = function(oip){
		let files = "";
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

	Core.Artifact.getThumbnail = function(oip){
		let thumbnail;

		let files = oip['oip-041'].artifact.storage.files;
		let mainHash = oip['oip-041'].artifact.storage.location;

		for (var i = 0; i < files.length; i++){
			if (files[i].type === "Image" && !files[i].sugPlay && files[i].size < Core.maxThumbnailSize && !thumbnail)
				thumbnail = files[i];
		}

		let thumbnailURL = "";

		if (thumbnail){
			thumbnailURL = mainHash + "/" + thumbnail.fname;
		}

		return thumbnailURL;
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

	return Core;
})();

export default AlexandriaCore;