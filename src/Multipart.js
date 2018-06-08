module.exports =
class Multipart {
	constructor(inputString, txid){
		this.prefix = "oip-mp";
		this.partNumber = 0;
		this.totalParts = 0;
		this.publisherAddress = undefined;
		this.firstPartTXID = "";
		this.signature = "";
		this.choppedStringData = "";

		// This is used to track a reference if someone pulled a multipart from an endpoint
		this.txid = ""

		if (inputString)
			this.fromString(inputString)
		
		if (txid)
			this.setTXID(txid)
	}
	setPrefix(prefix){
		this.prefix = prefix;
	}
	getPrefix(){
		return this.prefix;
	}
	setPartNumber(partNumber){
		this.partNumber = partNumber;
	}
	getPartNumber(){
		return this.partNumber;
	}
	setTotalParts(totalParts){
		this.totalParts = totalParts;
	}
	getTotalParts(){
		return this.totalParts
	}
	setPublisherAddress(publisherAddress){
		this.publisherAddress = publisherAddress;
	}
	getPublisherAddress(){
		return this.publisherAddress
	}
	setFirstPartTXID(firstTXID){
		this.firstPartTXID = firstTXID;
	}
	getFirstPartTXID(){
		return this.firstPartTXID
	}
	setSignature(signature){
		this.signature = signature;
	}
	getSignature(){
		return this.signature
	}
	getSignatureData(){
		return this.partNumber + 
				"-" + this.totalParts + 
				"-" + this.publisherAddress + 
				"-" + this.firstPartTXID + 
				"-" + this.choppedStringData;
	}
	validateSignature(){

	}
	setChoppedStringData(strData){
		this.choppedStringData = strData;
	}
	getChoppedStringData(){
		return this.choppedStringData
	}
	setTXID(id){
		this.txid = id;
	}
	getTXID(){
		return this.txid;
	}
	isValid(){
		if (this.getPrefix() !== "oip-mp"){
			return {success: false, message: "Invalid Multipart Prefix!"}
		}
		if (this.getPartNumber() <= 0){
			return {success: false, message: "You must have at least 1 part number!"}
		}
		if (this.getPartNumber() > this.getTotalParts()){
			return {success: false, message: "Part number too high for total parts!"}
		}
		if (this.getTotalParts() === 0){
			return {success: false, message: "Must have more than one part to be a MULTIPART message!"}
		}
		if (this.getPublisherAddress() === ""){
			return {success: false, message: "Must have a Publisher Address!"}
		}
		if (this.getFirstPartTXID() === "" && this.getPartNumber() !== 0){
			return {success: false, message: "Only the first part in a multipart message can have a blank first part TXID!"}
		}
		if (!this.validateSignature()){
			return {success: false, message: "Invalid Signature!"}
		}

		return {success: true}
	}
	toString(){
		return this.getPrefix() + "(" +
				this.getPartNumber() + "," +
				this.getTotalParts() + "," +
				this.getPublisherAddress() + "," +
				this.getFirstPartTXID() + "," +
				this.getSignature() + "):" +
				this.getChoppedStringData();
	}
	fromString(multipartString){
		if (!multipartString || typeof multipartString !== "string")
			return false;

		// Split the input string into an array of all the characters
		var characters = multipartString.split('');

		// A string to hold the currently being built string
		var builtString = "";

		// Information about what split points we have hit in the loop below
		var prefixSet = false;
		var parenValuesComplete = 0;
		var totalParenValues = 4;
		var closeSet = false;

		// Now we go through the array to find all the split points and break the string up.
		for (var i = 0; i < characters.length; i++){
			// The first split point is an open paren, we will pull the prefix from the first built part
			if (characters[i] === "(" && !prefixSet){
				this.setPrefix(builtString)
				builtString = "";
				prefixSet = true;
			} else if (characters[i] === "," && prefixSet && parenValuesComplete < totalParenValues) {
				switch(parenValuesComplete){
					case 0:
						this.setPartNumber(builtString);
					case 1:
						this.setTotalParts(builtString);
					case 2:
						this.setPublisherAddress(builtString);
					case 3:
						this.setFirstPartTXID(builtString);
				}
				builtString = "";
				parenValuesComplete++;
			} else if (characters[i] === ")" && prefixSet && parenValuesComplete === totalParenValues && !closeSet) {
				this.setSignature(builtString);
				builtString = "";
				closeSet = true;

				if (characters.length >= (i + 1) && characters[i + 1] === ":"){
					i++;
				}
			} else {
				// If we are not the first split point, then add our character to the build string
				builtString += characters[i];
			}
		}

		// Set the final built string to the appended string data
		this.setChoppedStringData(builtString);

		return this.isValid()
	}
}