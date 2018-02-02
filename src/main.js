import settings from './settings.js';
import util from './util.js';
import Artifact from './Artifact.js';
import Network from './Network.js';
import Data from './Data.js';
import Index from './Index.js';
import Wallet from './Wallet.js';
import User from './User.js';
import OIPd from './OIPd.js';
import Publisher from './Publisher.js';
import Comments from './Comments.js';

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  var localStorage = new LocalStorage('./scratch');
}

var OIPJS = function(){
	var Core = {};

	Core.localStorage = localStorage;
	Core.settings = settings.bind(Core)();
	Core.util = util.bind(Core)();
	Core.Artifact = Artifact.bind(Core)();
	Core.Network = Network.bind(Core)();
	Core.Data = Data.bind(Core)();
	Core.Index = Index.bind(Core)();
	Core.Wallet = Wallet.bind(Core)();
	Core.User = User.bind(Core)();
	Core.OIPd = OIPd.bind(Core)();
	Core.Publisher = Publisher.bind(Core)();
	Core.Comments = Comments.bind(Core)();

	return Core;
};

export default OIPJS();