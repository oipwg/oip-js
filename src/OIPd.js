import jsonpatch from 'fast-json-patch';

var OIPdFunction = function(){
	var OIPd = {}

	OIPd.createSquashedPatch = function(original, modified){

	}

	OIPd.squashPatch = function(patch){
		var squashed = {};

		for (var i = 0; i < patch.length; i++) {
			// Store the operation
			var operation = patch[i].op;
			// Remove operation key from squashed patch
			delete patch[i].op;
			// Check what the operation is, and put it in the right place
			if (!squashed[operation])
				squashed[operation] = [];
			
			squashed[operation].push(patch[i]);
		}
		
		return squashed;
	}

	OIPd.unSquashPatch = function(squashedPatch){
		var patch = [];

		for (var op in squashedPatch){
			for (var i = 0; i < squashedPatch[op].length; i++) {
				// Load what we saved from the patch
				var singlePatch = squashedPatch[op];
				// Restore the operation to the patch
				singlePatch.op = op;
				// Add singlePatch to patch
				patch.push(singlePatch);
			}
		}

		return patch;
	}

	this.OIPd = OIPd;
	return this.OIPd;
}

export default OIPdFunction;