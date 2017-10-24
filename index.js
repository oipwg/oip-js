import axios from 'axios';
try {
	var IPFS_MAIN = require('ipfs');
} catch (e) { 
	console.log(e);
}


let AlexandriaCore = (function(){
	let Core = {};

	// Initiate all instances
	try {
		Core.ipfs = new IPFS_MAIN({
			init: true,
			start: true,
			EXPERMENTAL: {
				pubsub: true,
				sharding: true,
				dht: true
			},
			config: {
				Addresses: {
					Swarm: [
						'/ip4/163.172.37.165/tcp/4001/ipfs/QmRvfRjoCCwVLbVAiYWqJJCiQKqGqSuKckv4eDKEHZXxZu',
						"/ip4/69.172.212.23/tcp/4001/ipfs/QmXUcnxbsDkazGNvgf1kQya6YwVqNsLbVhzg3LHNTteqwz",
						"/ip4/69.172.212.23/tcp/4002/ws/ipfs/QmXUcnxbsDkazGNvgf1kQya6YwVqNsLbVhzg3LHNTteqwz",
						"/ip4/192.99.6.117/tcp/4001/ipfs/QmQ85u4dH4EPRpNxLxBMvUCHCUyuyZgBZsfW81rzh51FtY",
						"/ip6/2607:5300:60:3775::/tcp/4001/ipfs/QmQ85u4dH4EPRpNxLxBMvUCHCUyuyZgBZsfW81rzh51FtY"
					]
				}
			}
		});
	} catch (e) {
		Core.ipfs = "not-supported"
	}
	

	// Define all of the application URLS
	Core.OIPdURL = "https://api.alexandria.io/alexandria/v2";
	Core.IPFSGatewayURL = "https://gateway.ipfs.io/ipfs/";
	Core.issoURL = "https://isso.alexandria.io/";

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
			let tmpFiles = oip['oip-041'].artifact.storage.files;

			for (let i = 0; i < tmpFiles.length; i++) {
				files.push(tmpFiles[i])
			}
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

	Core.Artifact.getTimestamp = function(oip){
		let timestamp = 0;
		try {
			timestamp = oip['oip-041'].artifact.timestamp
		} catch(e) {}
		return timestamp;
	}

	Core.Artifact.getPublisherName = function(oip){
		let pubName = "Flotoshi";

		try {
			pubName = oip.publisherName
		} catch(e) {}

		return pubName;
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

		if (!type){
			type = Core.Artifact.getType(oip);
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

	Core.Artifact.getDuration = function(oip){
		let duration;

		let files = Core.Artifact.getFiles(oip);

		for (var i = files.length - 1; i >= 0; i--) {
			if (files[i].duration && !duration)
				duration = files[i].duration;
		}

		return Core.util.formatDuration(duration);
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

	Core.Artifact.getMainFileDisPlay = function(oip, type){
		let disPlay = false;

		try {
			disPlay = Core.Artifact.getMainPaidFile(oip, type).disPlay;
		} catch (e) {}

		if (!disPlay)
			disPlay = false;

		return disPlay
	}

	Core.Artifact.getMainFileDisBuy = function(oip, type){
		let disBuy = 0;

		try {
			disBuy = Core.Artifact.getMainPaidFile(oip, type).disBuy;
		} catch (e) {}

		if (!disBuy)
			disBuy = false;

		return disBuy
	}

	Core.Artifact.getThumbnail = function(oip){
		let thumbnail;

		let files = Core.Artifact.getFiles(oip);
		let location = Core.Artifact.getLocation(oip);

		for (let i = 0; i < files.length; i++){
			if (files[i].type === "Image" && files[i].subtype === "cover" && !files[i].sugPlay && files[i].fsize < Core.Artifact.maxThumbnailSize && !thumbnail){
				thumbnail = files[i];
			}
		}

		if (!thumbnail){
			for (let i = 0; i < files.length; i++){
				if (files[i].type === "Image" && !files[i].sugPlay && files[i].fsize < Core.Artifact.maxThumbnailSize && !thumbnail){
					thumbnail = files[i];
				}
			}
		}

		return thumbnail;
	}

	Core.Artifact.getAlbumArt = function(oip){
		let albumArt;

		let files = Core.Artifact.getFiles(oip);

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
			albumArt = Core.Artifact.getThumbnail(oip);
		}

		return albumArt;
	}

	Core.Artifact.getFirstImage = function(oip){
		let imageGet;

		let files = Core.Artifact.getFiles(oip);
		//let location = Core.Artifact.getLocation(oip);

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

		let albumArtwork = Core.Artifact.getAlbumArt(oip);

		let albumArtUrl = Core.util.buildIPFSURL(Core.util.buildIPFSShortURL(oip, albumArtwork));

		let songs = [];

		for (var i = 0; i < files.length; i++){
			if (files[i].type === "Audio"){
				let durationNice = Core.util.formatDuration(files[i].duration);

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

	Core.Artifact.getEntypoIconForType = function(type){
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

	Core.Artifact.checkPaidViewFile = function(file){
		let paid = false;
		if (file.sugPlay)
			paid = true;

		return paid;
	}

	Core.Artifact.getFormattedVideoQualities = function(oip){
		let files = Core.Artifact.getFiles(oip);

		let qualityArr = [];

		for (var i = files.length - 1; i >= 0; i--) {
			if (files[i].subtype === "HD720" || 
				files[i].subtype === "SD480" || 
				files[i].subtype === "LOW320" || 
				files[i].subtype === "MOB240"){
				qualityArr.push({
					format: files[i].subtype,
					src: Core.util.buildIPFSURL(Core.util.buildIPFSShortURL(oip, files[i])),
					type: "video/" + Core.util.getExtension(files[i].fname)
				})
			}

		}
	}

	Core.Comments = {};

	Core.Comments.get = function(hash, callback){
		Core.Network.getCommentsFromISSO("/browser/" + hash, function(results){
			console.log(results);
			callback(results);
		})
	}

	Core.Comments.add = function(hash, comment, callback){
		Core.Network.postCommentToISSO("/browser/" + hash, {text: comment}, function(results){
			console.log(results)
			callback(results);
		})
	}

	Core.Comments.like = function(id, callback){
		Core.Network.likeISSOComment(id, function(results){
			console.log(results)
			callback(results);
		})
	}

	Core.Comments.dislike = function(id, callback){
		Core.Network.dislikeISSOComment(id, function(results){
			console.log(results)
			callback(results);
		})
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
						if (!jsonResult[x]['oip-041'].artifact.info.nsfw)
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

	Core.Index = {};

	Core.Index.supportedArtifacts = [];

	Core.Index.getSupportedArtifacts = function(callback){
		let _Core = Core;

		Core.Network.getArtifactsFromOIPd(function(jsonResult) { 
			var supportedArtifacts = [];
			for (var x = jsonResult.length -1; x >= 0; x--){
				if (jsonResult[x]['oip-041']){
					if (jsonResult[x]['oip-041'].artifact.type.split('-').length === 2){
						if (!jsonResult[x]['oip-041'].artifact.info.nsfw)
							supportedArtifacts.push(jsonResult[x]);
					}
				}
			}   
			_Core.Index.supportedArtifacts = supportedArtifacts;
			callback(_Core.Index.supportedArtifacts);
		});
	}

	Core.Index.getSuggestedContent = function(userid, callback){
		let _Core = Core;
		// In the future we will generate content specific for users, for now, just the generic is ok :)
		// userid is not currently implemented or used.
		Core.Index.getSupportedArtifacts(function(supportedArtifacts){
			console.log(supportedArtifacts)
			if (supportedArtifacts.length > 25){
				callback(supportedArtifacts.slice(0,25));
			} else {
				callback(supportedArtifacts);
			}
		})
	}

	Core.Index.getArtifactFromID = function(id, callback){
		let found = false;

		for (var i = Core.Index.supportedArtifacts.length - 1; i >= 0; i--) {
			if (Core.Index.supportedArtifacts[i].txid.substr(0, id.length) === id){
				found = true;
				callback(Core.Index.supportedArtifacts[i]);
			}
		}

		if (!found){
			Core.Index.getSupportedArtifacts(function(supportedArtifacts){
				for (var i = Core.Index.supportedArtifacts.length - 1; i >= 0; i--) {
					if (supportedArtifacts[i].txid.substr(0, id.length) === id){
						callback(supportedArtifacts[i]);
					}
				}
			})
		}
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
			let _Core = Core;

			axios.get(Core.OIPdURL + "/media/get/all").then(function(results){
				_Core.Network.cachedArtifacts = results.data;
				_Core.Network.artifactsLastUpdate = Date.now();
				callback(_Core.Network.cachedArtifacts);
			});
		} else {
			callback(Core.Network.cachedArtifacts);
		}
	}

	Core.Network.getLatestBTCPrice = function(callback){
		if (Core.Network.btcpriceLastUpdate < Date.now() - Core.Network.btcpriceUpdateTimelimit || Core.Network.cachedBTCPriceObj === {}){
			let _Core = Core;

			axios.get(Core.btcTickerURL).then(function(result){
				if (result.status === 200){
					_Core.Network.cachedBTCPriceObj = result.data;
					_Core.Network.btcpriceLastUpdate = Date.now();
					callback(_Core.Network.cachedBTCPriceObj["USD"].last);
				}
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

		let returned = false;

		try {
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
							returned = true;
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
		} catch (e){ 
			onData(Core.util.buildIPFSURL(hash));
			returned = true;
		}

		setTimeout(function(){
			if (!returned){
				onData(Core.util.buildIPFSURL(hash));
			}
		}, 2 * 1000)
	}

	Core.Network.getFileFromIPFS = function(hash, onComplete){
		// Require a hash to be passed
		if (!hash || hash === "")
			return;

		let returned = false;

		try {
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
							returned = true;
						})
					})
				}
			})
		} catch(e) { }

		setTimeout(function(){
			if (!returned){
				onData(Core.util.buildIPFSURL(hash));
			}
		}, 2 * 1000)
	}

	Core.Network.getCommentsFromISSO = function(uri, callback){
		axios.get(Core.issoURL + "?uri=" + encodeURIComponent(uri)).then(function(results){
			callback(results);
		}).catch(function (error) {
			// If there is an error, it is likely because the artifact has no comments, just return an empty array.
			callback([]);
		});
	}

	Core.Network.postCommentToISSO = function(uri, comment, callback){
		var instance = axios.create();

		instance.post(Core.issoURL + "new?uri=" + encodeURIComponent(uri), comment, {headers: {"Content-Type": "application/json"}, transformRequest: [(data, headers) => {
		    delete headers.common.Authorization
		    return data }]
		}).then(function(results){
			callback(results);
		}).catch(function (error) {
			// If there is an error, it is likely because the artifact has no comments, just return an empty array.
			callback({error: true});
		});
	}

	Core.Network.likeISSOComment = function(id, callback){
		axios.post(Core.issoURL + "id/" + id + "/like", {}).then(function(results){
			callback(results);
		}).catch(function (error) {
			// If there is an error, it is likely because the artifact has no comments, just return an empty array.
			callback({error: true});
		});
	}

	Core.Network.dislikeISSOComment = function(id, callback){
		axios.post(Core.issoURL + "id/" + id + "/dislike", {}).then(function(results){
			callback(results);
		}).catch(function (error) {
			// If there is an error, it is likely because the artifact has no comments, just return an empty array.
			callback({error: true});
		});
	}

	Core.User = {};

	Core.User.Identifier = "";
	Core.User.Password = "";

	Core.User.Login = function(identifier, password){
		Core.User.Identifier = identifier;
		Core.User.Password = password;
	}

	Core.User.Logout = function(){
		Core.User.Identifier = "";
		Core.User.Password = "";
	}

	Core.User.FollowPublisher = function(publisher){
		
	}

	Core.User.UnfollowPublisher = function(publisher){
		
	}

	Core.User.LikeArtifact = function(oip){
		
	}

	Core.User.NeturalArtifact = function(oip){
		
	}

	Core.User.DislikeArtifact = function(oip){
		
	}

	Core.User.UpdateArtifactView = function(oip, last_action, current_duration){

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

	Core.util.buildIPFSShortURL = function(artifact, file){
		let location = Core.Artifact.getLocation(artifact);
		return location + "/" + file.fname;
	}

	Core.util.buildIPFSURL = function(hash, fname){
		let trailURL = "";
		if (!fname){
			let parts = hash.split('/');
			if (parts.length == 2){
				trailURL = parts[0] + "/" + encodeURIComponent(parts[1]);
			} else {
				trailURL = hash;
			}
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

	Core.util.formatDuration = function(intDuration){
		if (!intDuration || isNaN(intDuration))
			return "";

		var sec_num = parseInt(intDuration, 10); // don't forget the second param
		var hours   = Math.floor(sec_num / 3600);
		var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
		var seconds = sec_num - (hours * 3600) - (minutes * 60);

		if (minutes < 10) {
			if (hours !== 0)
				minutes = "0"+minutes;
		}
		if (seconds < 10) {
			if (minutes !== 0)
				seconds = "0"+seconds;
		}

		if (hours === 0)
			var time = minutes+':'+seconds;
		else
			var time = hours+':'+minutes+':'+seconds;

		return time;
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