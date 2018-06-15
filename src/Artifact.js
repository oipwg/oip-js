import ArtifactFile from './ArtifactFile.js';
import Multipart from './Multipart.js';

const DEFAULT_NETWORK = "IPFS";
const SUPPORTED_TYPES = ["Audio", "Video", "Image", "Text", "Software", "Web", "Research", "Property"]

const CHOP_MAX_LEN = 370;
const FLODATA_MAX_LEN = 528;

module.exports =
class Artifact {
	constructor(input){
		this.artifact = {
			floAddress: "",
			info: {},
			details: {},
			storage: { network: DEFAULT_NETWORK, files: [] },
			payment: {}
		}

		this.FileObjects = [];
		this.Multiparts = [];
		this.fromMultipart = false;

		if (input){
			// If we are being passed in an array, it might be multiparts so try to load from that
			if (Array.isArray(input) && input.length > 1 && input[0] instanceof Multipart){
				this.fromMultipart(input)
			} else if (typeof input === "string") {
				try {
					this.fromJSON(JSON.parse(input))
				} catch (e) {}
			} else if (typeof input === "object") {
				this.fromJSON(input)
			}
		} 
	}
	setTXID(txid){
		this.txid = txid;
	}
	getTXID(){
		return this.txid;
	}
	setPublisherName(pubName){
		this.publisherName = pubName;
	}
	getPublisherName(){
		return this.publisherName
	}
	setMainAddress(address){
		this.artifact.floAddress = address;
	}
	getMainAddress(){
		return this.artifact.floAddress	
	}
	setTimestamp(time){
		this.artifact.timestamp = time;
	}
	getTimestamp(){
		return this.artifact.timestamp
	}
	setTitle(title){
		this.artifact.info.title = title;
	}
	getTitle(){
		return this.artifact.info.title
	}
	setDescription(description){
		this.artifact.info.description = description;
	}
	getDescription(){
		return this.artifact.info.description
	}
	setType(type){
		type = this.capitalizeFirstLetter(type);

		if (SUPPORTED_TYPES.indexOf(type) === -1){
			return "Type Not Supported!";
		}

		this.artifact.type = type;
	}
	getType(){
		return this.artifact.type
	}
	setSubtype(subtype){
		subtype = this.capitalizeFirstLetter(subtype);
		
		this.artifact.subtype = subtype;
	}
	getSubtype(){
		return this.artifact.subtype
	}
	setYear(year){
		this.artifact.info.year = year;
	}
	getYear(){
		return this.artifact.info.year
	}
	setNSFW(nsfwToggle){
		this.artifact.info.nsfw = nsfwToggle;
	}
	getNSFW(){
		return this.artifact.info.nsfw || false
	}
	setTags(tags){
		if (Array.isArray(tags)){
			this.artifact.info.tags = tags;
		} else {
			if (tags.split(",").length > 1){
				this.artifact.info.tags = tags.split(",")
			} else {
				this.artifact.info.tags = [tags]
			}
		}
	}
	getTags(){
		return this.artifact.info.tags
	}
	setDetail(detailNode, info){
		if (typeof info === "string" && info.split(",").length > 1) {
			this.artifact.details[detailNode] = info.split(",")
		} else {
			this.artifact.details[detailNode] = info
		}

		this.artifact.details[detailNode] = info;
	}
	getDetail(detailNode){
		return this.artifact.details[detailNode]
	}
	setSignature(signature){
		this.artifact.signature = signature
	}
	getSignature(){
		return this.artifact.signature
	}
	setNetwork(network){
		if (network === "ipfs")
			network = "IPFS"

		this.artifact.storage.network = network;
	}
	getNetwork(){
		return this.artifact.storage.network
	}
	setLocation(location){
		this.artifact.storage.location = location;
	}
	getLocation(){
		return this.artifact.storage.location
	}
	setPaymentFiat(fiat){
		this.artifact.payment.fiat = fiat;
	}
	getPaymentFiat(){
		return this.artifact.payment.fiat
	}
	setPaymentScale(newScale){
		this.artifact.payment.scale = newScale;
	}
	getPaymentScale(){
		//	Check if scale is a string
		// 		If so, check if the string is a number, or represented as a ratio
		// 			return the parsed number or ratio bound
		if (this.artifact.payment.scale){
			if (typeof this.artifact.payment.scale === "string"){
				if (isNaN(this.artifact.payment.scale) && this.artifact.payment.scale.split(":").length === 2){
					return this.artifact.payment.scale.split(":")[1]
				} else if (!isNaN(this.artifact.payment.scale)){
					return parseInt(this.artifact.payment.scale)
				}
			}

			return this.artifact.payment.scale
		} else {
			// Return 1:1 scale if undefined! The user should ALWAYS set scale ON PUBLISH if they are using a scale!
			return 1;
		}
	}
	setSuggestedTip(sugTipArray){
		this.artifact.payment.tips = sugTipArray;
	}
	getSuggestedTip(){
		return this.artifact.payment.tips
	}
	addTokenRule(tokenRule){
		this.artifact.payment.tokens.push(tokenRule);
	}
	getTokenRules(){
		return this.artifact.payment.tokens
	}
	addSinglePaymentAddress(coin, address){
		var tmpObj = {};
		tmpObj[coin] = address;

		if (!this.artifact.payment.addresses)
			this.artifact.payment.addresses = [];

		this.artifact.payment.addresses.push(tmpObj)
	}
	getPaymentAddresses(){
		return this.artifact.payment.addresses
	}
	setMultiwalletAddress(address){
		this.artifact.payment.shortMW = address
	}
	getMultiwalletAddress(){
		return this.artifact.payment.shortMW
	}
	addSupportedMWCoin(coin){
		if (!this.artifact.payment.coins)
			this.artifact.payment.coins = [];

		this.artifact.payment.coins.push(coin);
	}
	getSupportedMWCoins(){
		return this.artifact.payment.coins
	}
	setRetailerCut(newCut){
		this.artifact.payment.retailer = newCut;
	}
	getRetailerCut(){
		return this.artifact.payment.retailer
	}
	setPromoterCut(newCut){
		this.artifact.payment.promoter = newCut;
	}
	getPromoterCut(){
		return this.artifact.payment.promoter
	}
	setMaxDiscount(newMax){
		this.artifact.payment.maxdisc = newMax;
	}
	getMaxDiscount(){
		return this.artifact.payment.maxdisc
	}
	addFile(file){
		if (file instanceof ArtifactFile){
			this.FileObjects.push(new ArtifactFile(file.toJSON(), this));
		} else if (typeof file === "object" || typeof file === "string") {
			this.FileObjects.push(new ArtifactFile(file, this));
		}
	}
	getFiles(){
		return this.FileObjects
	}
	getThumbnail(){
		for (var file of this.getFiles()){
			if (file.getType() === "Image" && file.getSubtype() === "Thumbnail"){
				return file;
			}
		}
		return undefined;
	}
	getDuration(){
		for (var file of this.getFiles()){
			if (!isNaN(file.getDuration())){
				return file.getDuration();
			}
		}
		return undefined;
	}
	isValid(){
		if (!this.artifact.info.title || this.artifact.info.title === ""){
			return {success: false, error: "Artifact Title is a Required Field"}
		}
		if (!this.artifact.floAddress || this.artifact.floAddress === ""){
			return {success: false, error: "floAddress is a Required Field! Please define it or Login!"}
		}

		return {success: true}
	}
	isPaid(){
		let files = this.getFiles();

		let paid = false;

		if (files){
			for (var file of files){
				if (file.isPaid())
					paid = true;
			}
		}

		return paid;
	}
	toJSON(){
		this.artifact.storage.files = [];

		for (var file of this.FileObjects){
			this.artifact.storage.files.push(file.toJSON())
		}

		var retJSON = {
			oip042: {	
				artifact: this.artifact
			}
		}

		if (this.txid){
			retJSON.txid = this.txid;
		}
		if (this.publisherName){
			retJSON.publisherName = this.publisherName;
		}

		return JSON.parse(JSON.stringify(retJSON))
	}
	fromJSON(artifact){
		if (artifact){
			if (artifact.txid){
				this.setTXID(artifact.txid)
			}
			if (artifact.publisherName){
				this.setPublisherName(artifact.publisherName)
			}

			if (artifact['media-data']){
				if (artifact['media-data']['alexandria-media']){
					return this.importAlexandriaMedia(artifact['media-data']['alexandria-media'])
				} else {
					return {success: false, error: "No Artifact under Version!"}
				}
			} else if (artifact['oip-041']){
				if (artifact['oip-041'].signature){
					this.setSignature(artifact['oip-041'].signature)
				}

				if (artifact['oip-041'].artifact){
					return this.import041(artifact['oip-041'].artifact)
				} else {
					return {success: false, error: "No Artifact under Version!"}
				}
			} else if (artifact.oip042){
				if (artifact.oip042.signature){
					this.setSignature(artifact.oip042.signature)
				}
				if (artifact.oip042.artifact){
					return this.import042(artifact.oip042.artifact)
				} else if (artifact.oip042.publish && artifact.oip042.publish.artifact){
					return this.import042(artifact.oip042.publish.artifact)
				} else if (artifact.oip042.floAddress) {
					// @TODO: Remove this once OIPd is fixed!
					// Returned info is Malformed!!! Remove this code!
					return this.import042(artifact.oip042)
				} else {
					return {success: false, error: "No Artifact under Version!"}
				}
			} else {
				return {success: false, error: "Artifact is Not a Supported Version!", detail: artifact}
			}
		} else {
			return {success: false, error: "Artifact Not Provided!"}
		}
	}
	toString(){
		return JSON.stringify(this.toJSON())
	}
	importAlexandriaMedia(artifact){
		if (artifact.publisher){
			this.setMainAddress(artifact.publisher)
		}
		if (artifact.timestamp){
			this.setTimestamp(artifact.timestamp)
		}
		if (artifact.type){
			var type = artifact.type;

			if (type === "music"){
				type = "Audio"
			}
			if (type === "book"){
				type = "Text"
				this.setSubtype("Book")
			}
			if (type === "thing"){
				type = "Web"
			}

			this.setType(type)
		}
		if (artifact.torrent){
			this.setLocation(artifact.torrent)

			if (artifact.torrent.split(":")[0] === "btih"){
				this.setNetwork("bittorrent")
			}
		}
		if (artifact.info){
			if (artifact.info.title){
				this.setTitle(artifact.info.title)
			}
			if (artifact.info.description){
				this.setDescription(artifact.info.description)
			}
			if (artifact.info.year){
				this.setYear(artifact.info.year)
			}

			if (artifact.info['extra-info']){
				var tmpFiles = [];
				var hadFiles = false;
				for (var key in artifact.info['extra-info']){
					if (artifact.info['extra-info'].hasOwnProperty(key)){
						if (key === "tags"){
							this.setTags(artifact.info['extra-info'][key])
						} else if (key === "Bitcoin Address"){
							this.addSinglePaymentAddress("btc", artifact.info['extra-info'][key])
						} else if (key === "DHT Hash"){
							var hash = artifact.info['extra-info'][key]

							this.setLocation(hash);
						} else if (key === "filename"){
							if (artifact.info['extra-info'][key] !== "none")
								tmpFiles.push({fname: artifact.info['extra-info'][key]})
						} else if (key === "posterFrame"){
							tmpFiles.push({fname: artifact.info['extra-info'][key], type: "Image", subtype: "Thumbnail"})
						} else if (key === "runtime"){
							this.setDetail("duration", artifact.info['extra-info'][key]);
						} else if (key === "files"){
							var fileList = artifact.info['extra-info'][key];

							for (var file of fileList){
								this.addFile(file);
							}

							if (this.FileObjects.length > 0)
								hadFiles = true;
						} else {
							this.setDetail(key, artifact.info['extra-info'][key]);
						}
					}
				}

				if (!hadFiles){
					for (var file of tmpFiles){
						this.addFile(file);
					}
				}
			}
		}
		if (artifact.payment){
			// if (artifact.payment.type && artifact.payment.type === "tip"){
			// 	this.setPaymentFiat(artifact.payment.fiat);
			// }
			// if (artifact.payment.scale){
			// 	this.setPaymentScale(artifact.payment.scale);
			// }
			// if (artifact.payment.sugTip){
			// 	this.setSuggestedTip(artifact.payment.sugTip)
			// }
		}
	}
	import041(artifact){
		if (artifact.publisher){
			this.setMainAddress(artifact.publisher)
		}
		if (artifact.timestamp){
			this.setTimestamp(artifact.timestamp)
		}
		if (artifact.type){
			if (artifact.type.split("-").length === 2){
				var type = artifact.type.split("-")[0];
				var subtype = artifact.type.split("-")[1];

				this.setType(type);
				this.setSubtype(subtype);
			} else if (artifact.type.split("-").length === 1){
				this.setType(artifact.type)
			}
		}
		if (artifact.info){
			if (artifact.info.title){
				this.setTitle(artifact.info.title)
			}
			if (artifact.info.description){
				this.setDescription(artifact.info.description)
			}
			if (artifact.info.year){
				this.setYear(artifact.info.year)
			}
			if (artifact.info.tags){
				this.setTags(artifact.info.tags)
			}
			if (artifact.info.nsfw){
				this.setNSFW(artifact.info.nsfw)
			}

			if (artifact.info.extraInfo){
				for (var key in artifact.info.extraInfo){
					if (artifact.info.extraInfo.hasOwnProperty(key)){
						this.setDetail(key, artifact.info.extraInfo[key]);
					}
				}
			}
		}

		if (artifact.storage){
			if (artifact.storage.network){
				this.setNetwork(artifact.storage.network);
			}
			if (artifact.storage.location){
				this.setLocation(artifact.storage.location);
			}
			if (artifact.storage.files){
				for (var file of artifact.storage.files){
					this.addFile(file);
				}
			}
		}

		if (artifact.payment){
			if (artifact.payment.fiat){
				this.setPaymentFiat(artifact.payment.fiat);
			}
			if (artifact.payment.scale){
				this.setPaymentScale(artifact.payment.scale);
			}
			if (artifact.payment.sugTip){
				this.setSuggestedTip(artifact.payment.sugTip)
			}
			if (artifact.payment.tokens && Array.isArray(artifact.payment.tokens)){
				for (var token of artifact.payment.tokens){
					this.addTokenRule(token)
				}
			}
			if (artifact.payment.addresses){
				for (var address of artifact.payment.addresses){
					this.addSinglePaymentAddress(address.token, address.address)
				}
			}
			if (artifact.payment.retailer){
				this.setRetailerCut(artifact.payment.retailer)
			}
			if (artifact.payment.promoter){
				this.setPromoterCut(artifact.payment.promoter)
			}
			if (artifact.payment.maxdisc){
				this.setMaxDiscount(artifact.payment.maxdisc)
			}
		}
	}
	import042(artifact){
		if (artifact.floAddress){
			this.setMainAddress(artifact.floAddress)
		}
		if (artifact.timestamp){
			this.setTimestamp(artifact.timestamp)
		}
		if (artifact.type){
			this.setType(artifact.type)
		}
		if (artifact.subtype){
			this.setSubtype(artifact.subtype)
		}
		if (artifact.signature){
			this.setSignature(artifact.signature)
		}
		if (artifact.info){
			if (artifact.info.title){
				this.setTitle(artifact.info.title)
			}
			if (artifact.info.description){
				this.setDescription(artifact.info.description)
			}
			if (artifact.info.year){
				this.setYear(artifact.info.year)
			}
			if (artifact.info.tags){
				this.setTags(artifact.info.tags)
			}
			if (artifact.info.nsfw){
				this.setNSFW(artifact.info.nsfw)
			}
		}

		if (artifact.details){
			for (var key in artifact.details){
				if (artifact.details.hasOwnProperty(key)){
					this.setDetail(key, artifact.details[key]);
				}
			}
		}

		if (artifact.storage){
			if (artifact.storage.network){
				this.setNetwork(artifact.storage.network);
			}
			if (artifact.storage.location){
				this.setLocation(artifact.storage.location);
			}
			if (artifact.storage.files){
				for (var file of artifact.storage.files){
					this.addFile(file);
				}
			}
		}

		if (artifact.payment){
			if (artifact.payment.fiat){
				this.setPaymentFiat(artifact.payment.fiat);
			}
			if (artifact.payment.scale){
				this.setPaymentScale(artifact.payment.scale);
			}
			if (artifact.payment.sugTip){
				this.setSuggestedTip(artifact.payment.sugTip)
			}
			if (artifact.payment.tokens && Array.isArray(artifact.payment.tokens)){
				for (var token of artifact.payment.tokens){
					this.addTokenRule(token)
				}
			}
			if (artifact.payment.addresses){
				for (var address of artifact.payment.addresses){
					this.addSinglePaymentAddress(address.token, address.address)
				}
			}
			if (artifact.payment.retailer){
				this.setRetailerCut(artifact.payment.retailer)
			}
			if (artifact.payment.promoter){
				this.setPromoterCut(artifact.payment.promoter)
			}
			if (artifact.payment.maxdisc){
				this.setMaxDiscount(artifact.payment.maxdisc)
			}
		}
	}
	getMultiparts(){
		var jsonString = this.toString();

		if (jsonString.length > FLODATA_MAX_LEN || this.fromMultipart) {
			var exactMatch = false;

			var oldArtifact = new Artifact();
			oldArtifact.fromMultiparts(this.Multiparts)

			if (oldArtifact.toString() === jsonString)
				exactMatch = true;

			if (!exactMatch){
				this.Multiparts = [];

				var chunks = [];
				while (jsonString.length > CHOP_MAX_LEN) {
					chunks[chunks.length] = jsonString.slice(0, CHOP_MAX_LEN);
					jsonString = jsonString.slice(CHOP_MAX_LEN);
				}
				chunks[chunks.length] = jsonString;

				for (var c in chunks){
					var mp = new Multipart();

					mp.setPartNumber(c);
					mp.setTotalParts(chunks.length);
					mp.setPublisherAddress(this.getMainAddress());
					mp.setChoppedStringData(chunks[c]);

					// If we are the first multipart, then sign ourself
					if (c === 0){
						// @TODO: Implement multipart signing
						mp.sign();
					}

					this.Multiparts.push(mp);
				}
			}

			return this.Multiparts;
		} else {
			// Too short to be a multipart!
			return [];
		}
	}
	fromMultiparts(multipartArray){
		if (Array.isArray(multipartArray)){
			for (var part in multipartArray){
				if (multipartArray[part] instanceof Multipart){
					this.Multiparts[part] = multipartArray[part];
				} else {
					var mp = new Multipart();
					mp.fromString(multipartArray[part]);
					this.Multiparts.push(mp);
				}
			}

			if (Array.isArray(this.Multiparts)){
				this.Multiparts.sort(function(a, b){
					return a.getPartNumber() - b.getPartNumber()
				})
			}

			var jsonString = "";

			for (var multiP of this.Multiparts){
				jsonString += multiP.getChoppedStringData();
			}

			try {
				this.fromJSON(JSON.parse(jsonString))
				if (this.Multiparts[0] && this.Multiparts[0].getTXID() !== ""){
					this.setTXID(this.Multiparts[0].getTXID())
				}
				this.fromMultipart = true;
			} catch (e) {
				return {success: false, message: "Unable to parse from JSON!", error: e}
			}
		} else {
			return {success: false, message: "You must pass an array!"}
		}
	}
	capitalizeFirstLetter(string){
		return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
	}
	getClassName(){
		return "Artifact"
	}
}
