module.exports =
class ArtifactFileBuilder {
	constructor(){
		this.file = {}
	}
	setFilename(filename){
		this.file.fname = filename;
	}
	setDisplayName(displayName){
		this.file.fname = filename;
	}
	setDuration(seconds){
		this.file.duration = seconds;
	}
	setType(type){
		this.file.type = type;
	}
	setSubtype(subtype){
		if (subtype === "cover"){
			subtype = "Thumbnail"
		}

		this.file.subtype = subtype;
	}
	setFilesize(filesize){
		this.file.fsize = filesize;
	}
	setNetwork(network){
		this.file.network = network;
	}
	setLocation(loc){
		this.file.location = loc;
	}
	toJSON(){
		return JSON.parse(JSON.stringify(this.file))
	}
	fromJSON(fileObj){
		if (fileObj){
			if (fileObj.fname){
				this.setFilename(fileObj.fname)
			}
			if (fileObj.dname){
				this.setDisplayName(fileObj.dname)
			}
			if (fileObj.fsize){
				this.setFilesize(fileObj.fsize)
			}
			if (fileObj.duration){
				this.setDuration(fileObj.duration)
			}
			if (fileObj.type){
				this.setType(fileObj.type)
			}
			if (fileObj.subtype){
				this.setSubtype(fileObj.subtype)
			}
			if (fileObj.network){
				this.setNetwork(fileObj.network)
			}
			if (fileObj.location){
				this.setLocation(fileObj.location)
			}
		}
	}
}