var Artifact = require('../../lib/babel.js').Artifact;
var Multipart = require('../../lib/babel.js').Multipart;

var multipartStrings = [
	'oip-mp(0,1,FLZXRaHzVPxJJfaoM32CWT4GZHuj2rx63k,,IPw0M1gDPlY21v7aFYyYBiM7C641PhnSLUAw0jla9B18FteQ6f8dHc2m0a0rpMNmh8gUjRDbHTFYqz4MD/S820Y=):{"oip-041":{"artifact":{"type":"Image-Basic","info":{"extraInfo":{"genre":"The Arts"},"title":"Alexandria Logo"},"storage":{"network":"IPFS","files":[{"fname":"Alexandria.png","fsize":638001,"type":"Image"}],"location":"QmNmVHfXuh5Tub76H1fog7wSM8of4Njfm2j1oTg8ZYUBZm"},"payment":{"fiat":"USD","scale":"1000:1","maxdisc":30,"promoter":15,"retailer":15,"sugTip":[],"addres',
	'oip-mp(1,1,FLZXRaHzVPxJJfaoM32CWT4GZHuj2rx63k,2c5140f5da,H8fjRKrXyMJlxjZLGWxjzdJG/BW5Bn+k+tmud5yGf3sYGhAQDd+aYVtAC1H8LGy+w011kYPjApuF29jrcZPQJP4=):ses\":[]},\"timestamp\":1526153770,\"publisher\":\"FLZXRaHzVPxJJfaoM32CWT4GZHuj2rx63k\"},\"signature\":\"IO0i5yhuwDy5p93VdNvEAna6vsH3UmIert53RedinQV+ScLzESIX8+QrL4vsquCjaCY0ms0ZlaSeTyqRDXC3Iw4=\"}}'
]

var artifact = new Artifact();

artifact.fromMultiparts(multipartStrings);

var multiparts = artifact.getMultiparts();

for (var mp in multiparts){
	if (multipartStrings[mp] !== multiparts[mp].toString()){
		throw new Error("Multipart doesn't match!")
	}
}

console.log("Successful roundtrip of Multipart strings!");