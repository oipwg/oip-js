import Artifact from './src/Artifact.js';
import Comments from './src/Comments.js';
import Data from './src/Data.js';
import Index from './src/Index.js';
import Network from './src/Network.js';
import Publisher from './src/Publisher.js';
import User from './src/User.js';
import Wallet from './src/Wallet.js';
import util from './src/util.js';
import settings from './src/settings.js';

let AlexandriaCore = (function(){
	let Core = {};

	Core.settings = settings.bind(Core)();

	Core.util = util.bind(Core)();

	Core.Artifact = Artifact.bind(Core)();

	Core.Network = Network.bind(Core)();

	Core.Data = Data.bind(Core)();

	Core.Index = Index.bind(Core)();

	Core.Wallet = Wallet.bind(Core)();

	Core.User = User.bind(Core)();

	Core.Publisher = Publisher.bind(Core)();

	Core.Comments = Comments.bind(Core)();

	return Core;
})();

export default AlexandriaCore;