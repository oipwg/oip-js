import ArtifactFileBuilder from './ArtifactFileBuilder.js';

const DEFAULT_NETWORK = "IPFS";
const SUPPORTED_TYPES = ["Audio", "Video", "Image", "Text", "Software", "Web", "Research", "Property"]

module.exports =
class ArtifactBuilder {
	constructor(Core){
		this.Core = Core;

		var tmpWalAddress;

		if (this.Core && this.Core.Wallet){
			tmpWalAddress = this.Core.Wallet.getMainAddress("florincoin")
		}

		this.artifact = {
			floAddress: tmpWalAddress || "",
			info: {},
			details: {},
			storage: { network: "IPFS", files: [] },
			payment: {}
		}

		this.FileObjects = [];
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
		return this.title
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
		this.artifact.info.tags = tags;
	}
	getTags(){
		return this.artifact.info.tags
	}
	setDetail(detailNode, info){
		this.artifact.details[detailNode] = info;
	}
	getDetail(detailNode){
		return this.artifact.details[detailNode]
	}
	setNetwork(network){
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
		return this.artifact.payment.scale
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
		if (file instanceof ArtifactFileBuilder){
			this.FileObjects.push(file);
		} else {
			var newFileObj = new ArtifactFileBuilder();

			newFileObj.fromJSON(file);

			this.FileObjects.push(newFileObj);
		}
	}
	getFiles(){
		return this.FileObjects
	}
	isValidArtifact(){
		if (!this.artifact.info.title || this.artifact.info.title === ""){
			return {success: false, error: "Artifact Title is a Required Field"}
		}
		if (!this.artifact.floAddress || this.artifact.floAddress === ""){
			return {success: false, error: "floAddress is a Required Field! Please define it or Login!"}
		}
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

			if (artifact['alexandria-media']){
				if (artifact['alexandria-media'].artifact){
					return this.importAlexandriaMedia(artifact['alexandria-media'].artifact)
				} else {
					return {success: false, error: "No Artifact under Version!"}
				}
			} else if (artifact['oip-041']){
				if (artifact['oip-041'].artifact){
					return this.import041(artifact['oip-041'].artifact)
				} else {
					return {success: false, error: "No Artifact under Version!"}
				}
			} else if (artifact.oip042){
				if (artifact.oip042.artifact){
					return this.import042(artifact.oip042.artifact)
				} else {
					return {success: false, error: "No Artifact under Version!"}
				}
			} else {
				return {success: false, error: "Artifact is Not a Supported Version!"}
			}
		} else {
			return {success: false, error: "Artifact Not Provided!"}
		}
	}
	importAlexandriaMedia(artifact){

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
			if (artifact.payment.tokens){
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

	}
	capitalizeFirstLetter(string){
		return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
	}
}
