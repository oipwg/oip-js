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
	}
	setMainAddress(address){
		this.artifact.floAddress = address;
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

		}

		this.artifact.type = type;
	}
	setSubtype(subtype){
		type = this.capitalizeFirstLetter(type);

		if (SUPPORTED_TYPES.indexOf(type) === -1){

		}
		
		this.artifact.type = type;
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
	isValidArtifact(){
		if (!this.artifact.info.title || this.artifact.info.title === ""){
			return {success: false, error: "Artifact Title is a Required Field"}
		}
		if (!this.artifact.floAddress || this.artifact.floAddress === ""){
			return {success: false, error: "floAddress is a Required Field! Please define it or Login!"}
		}
	}
	toJSON(){
		return this.artifact
	}
	fromJSON(artifact){

	}
	importAlexandriaMedia(){

	}
	import041(){

	}
	import042(){

	}
	capitalizeFirstLetter(string){
		return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
	}
}