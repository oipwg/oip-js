import ArtifactFileBuilder from './ArtifactFileBuilder.js';

const DEFAULT_NETWORK = "IPFS";
const SUPPORTED_TYPES = ["Audio", "Video", "Image", "Text", "Software", "Web", "Research", "Property"]

module.exports =
class ArtifactBuilder {
	constructor(Core){
		this.Core = Core;

		this.artifact = {
			floAddress: this.Core.Wallet.getMainAddress("florincoin") || "",
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
	setPublisherName(pubName){
		this.publisherName = pubName;
	}
	setMainAddress(address){
		this.artifact.floAddress = address;
	}
	setTimestamp(time){
		this.artifact.timestamp = time;
	}
	setTitle(title){
		this.artifact.info.title = title;
	}
	setDescription(description){
		this.artifact.info.description = description;
	}
	setType(type){
		type = this.capitalizeFirstLetter(type);

		if (SUPPORTED_TYPES.indexOf(type) === -1){
			return "Type Not Supported!";
		}

		this.artifact.type = type;
	}
	setSubtype(subtype){
		subtype = this.capitalizeFirstLetter(subtype);
		
		this.artifact.subtype = subtype;
	}
	setYear(year){
		this.artifact.info.year = year;
	}
	setNSFW(nsfwToggle){
		this.artifact.info.nsfw = nsfwToggle;
	}
	setTags(tags){
		this.artifact.info.tags = tags;
	}
	setDetail(detailNode, info){
		this.artifact.details[detailNode] = info;
	}
	setNetwork(network){
		this.artifact.storage.network = network;
	}
	setLocation(location){
		this.artifact.storage.location = location;
	}
	addFile(file){
		if (file instanceof ArtifactFileBuilder){
			this.FileObjects.push(file);
		} else {
			this.FileObjects.push((new ArtifactFileBuilder).fromJSON(file));
		}
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
			this.setTimestamp(artifact.publisher)
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
				this.setPaymentScale(this.payment.scale);
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
				this.setMaxDiscout(artifact.payment.maxdisc)
			}
		}
	}
	import042(artifact){

	}
	capitalizeFirstLetter(string){
		return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
	}
}