[![](https://travis-ci.org/oipwg/oip-js.svg?branch=master)](https://travis-ci.org/oipwg/oip-js)
[![](https://img.shields.io/npm/v/oip-js.svg)](https://www.npmjs.com/package/oip-js)
# OIP-JS
An NPM module containing all of the core functionality to run any OIP front end.

## Work in Progress
This section is a work in progress, so more information will be added periotically. Information may be out of data, for latest information, please read the code :)

## Browserify
There is a browserified version of OIP-JS that can be compiled with `npm run browserify`. You can find a demo of how to use the Browserified version inside of the `/demo` folder in this repository. Please note that the compiled bundle provided in the repo may not be the most up to date version. When in doubt, be sure to compile it using the command above for the latest version.

### Modules
Inside of OIP-JS there are currently 11 modules. Each of the 11 modules have specific tasks to try and seperate the logic out. They are seperated as follows:

- Artifact: This contains helper functions for manipulating artifact JSON.
- Comments: This allows the user to simply comment on Artifacts
- Data: This contains simple access to application information that was fetched by the network layer.
- Index: This module provides access to OIPd and pulls data directly from an external OIPd server.
- Network: Usually called by the Data layer. This module contains all of the server calls & network transfer functions (i.e. IPFS).
- OIPd: Provides helper functions for pushing OIPd messages to the Florincoin Blockchain.
- Publisher: Provides helper functions for publishers (i.e. registering a publisher, logging in, etc)
- settings: A simple helper file that allows for easy setting of application settings. This contains most of the URL's to different external services.
- User: Create, Sign-in, Pay, etc. This module provides User functions.
- util: Other generally helpful utility functions that we have found helpful.
- Wallet: This module provides access to `OIPMW` and also has a few wrapper functions. Allows users to Sign messages and send funds easily (along with Login, Logout, and Wallet creation)

Currently, we have implemented or planned the following functions:

** NOTE: As of 1/16/2018 this /should be/ a full list of all functions **

#### `Core.Artifact`
`Core.Artifact.getTXID(oipArtifact)`: **return**s the *txid* of the given artifact.

`Core.Artifact.getTitle(oipArtifact)`: **return**s the *title* of the given artifact.

`Core.Artifact.getType(oipArtifact)`: **return**s the *type* of the given artifact.

`Core.Artifact.getSubtype(oipArtifact)`: **return**s the *subtype* of the given artifact.

`Core.Artifact.getDescription(oipArtifact)`: **return**s the *description* of the given artifact.

`Core.Artifact.getFiles(oipArtifact)`: **return**s the data related to the files in the given artifact, Including **dName**s, **fName**s and **playtime** and pricing fields. If any of the artifact is commercial, for all of the files which are available(free), `return`s ipfs file hashes as **storage:files:location**, and **return** "permission denied" for files which are not yet available (not yet paid for). 

`Core.Artifact.getLocation(oipArtifact)`: If the whole artifact is free, **return**s the location address of the given artifact (This is usually the IPFS hash, unless the Artifact uses another data storage layer) as **storage:location**. If any of the artifact is commercial, **return** "permission denied"

`Core.Artifact.getPublisherName(oipArtifact)`: **return**s the *Publisher Alias* for the *Publisher* that published the Artifact. If no *Publisher Alias* was specified, **return**s "Flotoshi"

`Core.Artifact.getPublisher(oipArtifact)`: **return**s the *Publisher Address* which published the artifact.

`Core.Artifact.getArtist(oipArtifact)`: **return**s the *Artist* of the given artifact. If an *Artist* was not specified, **return**s *Publisher Alias* instead.

`Core.Artifact.getScale(oipArtifact)`: **return**s the int on the right side of the scale variable (i.e. "1:1000" would return `1000`).

`Core.Artifact.getMainFile(oipArtifact)`: **return**s first file that matches the Artifact "type" variable (i.e., if the type is `Video`, then we search for the first `Video` file in the artifact).

`Core.Artifact.getDuration(oipArtifact)`: **return**s the duration specified in the first file that has a duration on the Artifact.

`Core.Artifact.getTipPrefs(oipArtifact)`: **return**s the suggested tip values.

`Core.Artifact.getThumbnail(oipArtifact)`: **return**s the **fName** of the *Thumbnail* for the given artifact. This is calculated as the first File with the type "Image" that does not have a price to view it. Returns `""` if no thumbnail can be found.

`Core.Artifact.paid(oipArtifact)`: **return**s `true` if any files have either a suggested buy price or suggested play price. Otherwise it will return `false`.

`Core.Artifact.isFilePaid(oipFile)`: **return**s `true` if the file has either a suggested buy price or suggested play price. Otherwise it will return `false`.

`Core.Artifact.getPaymentAddresses(oipArtifact)`: **return**s a JSON object containing all supported payment method types and their associated coins.

`Core.Artifact.getEntypoIconForType(oipArtifact)`: **return**s the css class for the artifact type. This will be removed/moved.

#### `Core.Comments`
`Core.Comments.get(artifactTxid, callback)`: provides via **callback** the comments on a specified Artifact.

`Core.Comments.add(artifactTxid, comment, callback)`: adds a comment to an Artifact, then returns via **callback** if successful.

`Core.Comments.like(artifactTxid, callback)`: upvotes/likes a comment, calls **callback** if successful.

`Core.Comments.dislike(artifactTxid, callback)`: downvotes/dislikes a comment, calls **callback** if successful.

#### `Core.Data`
`Core.Data.getExchangeRate(coin, fiat, onSuccess({}), onError(error))`: Returns the current per coin price for the requested `coin` and `fiat` pair. Calls the `onSuccess` callback with the Fiat-Per-Coin rate (as a float).

`Core.Data.getBTCPrice(onSuccess(USDPerBTC), onError(error))`: Provides the USD to BTC price via the `onSuccess` callback.

`Core.Data.getFLOPrice(onSuccess(USDPerFLO), onError(error))`: Provides the USD to FLO price via the `onSuccess` callback.

`Core.Data.getLTCPrice(onSuccess(USDPerLTC), onError(error))`: Provides the USD to LTC price via the `onSuccess` callback.

`Core.Data.calculateBTCCost(usd_value, onSuccess(btc_amount), onError(error))`: Provides the amount of BTC that the USD_value variable is worth via the `onSuccess` callback.

`Core.Data.getOIPdInfo(onSuccess, onError)`: Provides information about OIPd via the `onSuccess` callback.

#### `Core.Index`
`Core.Index.getSupportedArtifacts(callback(supportedArtifacts))`: Provides an array of supported artifacts to the callback. All artifacts will be formatted based on the highest version supported by `oip-js`. Currently this is `oip-041`.

`Core.Index.getRandomSuggested(onSuccess(suggestedArtifacts))`: Provides a random array of 25 supported artifacts to the callback. All artifacts will be formatted based on the highest version supported by `oip-js`. Currently this is `oip-041`.

`Core.Index.stripUnsupported(artifacts)`: **return**s an array of Artifacts minus those that are currently unsupported by the interface.

`Core.Index.getArtifactFromID(id, callback(artifact))`: Looks up an Artifact based on its id and returns it to the enduser via **callback**.  

`Core.Index.search(options, onSuccess, onError)`: Searches OIPd for artifacts using the options provided, returns found artifacts via the `onSuccess` **callback**

`Core.Index.getLatestArtifacts(callback(latestArtifacts))`: This will grab the latest artifacts from OIPd and **return** them as a JSON array to the callback.

`Core.Index.getRegisteredPublishers(onSuccess(registeredPublishers), onError(error))`: Provides an array of registered publishers to the callback. All publishers will be formatted based on the highest version supported by *oip-js*, currently this is oip-041. paginated, sortable by various fields

`Core.Index.getPublisher(oipPublisherAddress, onSuccess, onError)`: Provides *Publisher Alias*, *BTC Address*, TXID of registration message, registration *timestamp*, and *email md5 hash* for given Publisher Address via the **callback**.

`Core.Index.getPublisherArtifacts(oipPublisherAddress)`: **return**s a list of all *artifactID*s by a given *Publisher*.

#### `Core.Network`
`Core.Network.getLatestOIPdInfo(onSuccess, onError)`: Provides the latest information from the `/info` OIPd api endpoint to the `onSuccess` **callback**.

`Core.Network.searchOIPd(options, onSuccess, onError)`: Searches OIPd for the options specified and returns the data to the `onSuccess` **callback**.

`Core.Network.getArtifactsFromOIPd(onSuccess, onError)`: Gets all the Artifacts currently in OIPd and returns the data to the `onSuccess` **callback**.

`Core.Network.getPublishersFromOIPd(onSuccess, onError)`: Gets all the Publishers currently in OIPD and returns the data to the `onSuccess` **callback**.

`Core.Network.getLatestBTCPrice(onSuccess, onError)`: Gets the latest BTC to USD price and returns the data to the `onSuccess` **callback**.

`Core.Network.getLatestFLOPrice(onSuccess, onError)`: Gets the latest FLO to USD price and returns the data to the `onSuccess` **callback**.

`Core.Network.getLatestLTCPrice(onSuccess, onError)`: Gets the latest LTC to USD price and returns the data to the `onSuccess` **callback**.

`Core.Network.getIPFS(callback)`: Passes the IPFS object to the callback after it has been successfully spawned. You are highly discouraged from using this function, but it is here for advanced functionality.

`Core.Network.getThumbnailFromIPFS(hash, onDataCallback)`: Give it either an IPFS file hash or hash + subfile (i.e. `hash/filename.png`). Each time data is downloaded (i.e. on download progress), we call the onDataCallback and pass a base64 encoded version of the file. You can feed this directly into an image source and it will load fine :)

`Core.Network.getFileFromIPFS(hash, onCompleteCallback)`: Give it either an IPFS file hash or hash + subfile (i.e. `hash/filename.png`). When the file download is complete, we call the onDataCallback and pass a base64 encoded version of the file. You can feed this directly into an image source and it will load fine :)

`Core.Network.getCommentsFromISSO(uri, callback)`: Grabs the comments for the specified URI and returns them via **callback**

`Core.Network.postCommentToISSO(uri, comment, callback)`: Add a comment to ISSO on the specified URI, calls the **callback** on success.

`Core.Network.likeISSOComment(id, callback)`: Likes an ISSO comment, calls the **callback** on success.

`Core.Network.dislikeISSOComment(id, callback)`: Dislikes an ISSO comment, calls the **callback** on success.

`Core.Network.tryOneTimeFaucet(address, recaptcha, onSuccess, onError)`: Try the One Time FLO faucet. If information is submitted correctly, it will provide tx info via the onSuccess **callback**.

`Core.Network.tryDailyFaucet(address, recaptcha, onSuccess, onError)`: Try the Daily FLO faucet. If information is submitted correctly, it will provide tx info via the onSuccess **callback**.

`Core.Network.tryFaucet(type, address, recaptcha, onSuccess, onError)`: Try the FLO faucet. If information is submitted correctly, it will provide tx info via the onSuccess **callback**. Type is either `one_time` or `interval` for daily.

`Core.Network.checkDailyFaucet(flo_address, onSuccess, onError)`: Check to see if you can receive funds via the Daily FLO Faucet, returns info to the onSuccess callback.

#### `Core.OIPd`
`Core.OIPd.signPublisher(name, address, time)`: **return**s the requested signature.

`Core.OIPd.signArtifact(ipfs, address, time)`: **return**s the requested signature.

`Core.OIPd.signArtifactDeactivation(txid, publisher, timestamp)`: 

`Core.OIPd.signArtifactEdit(txid, timestamp)`: **return**s the requested signature.

`Core.OIPd.signPublishArtifact(artifactJSON)`: **return**s the requested signature.

`Core.OIPd.announcePublisher(name, address, email, onSuccess, onError)`: Announces a new Publisher to the network.

`Core.OIPd.publishArtifact(artifactJSON, onSuccess, onError)`: Publishes an Artifact.

`Core.OIPd.editArtifact(txid, newArtJSON, onSuccess, onError)`: Publishes an Artifact Edit.

`Core.OIPd.deactivateArtifact(txid, onSuccess, onError)`: Publishes an Artifact Deactivation.

`Core.OIPd.unixTime`: **return**s the current Unix timestamp formatted to remove the miliseconds (since JS is in ms and the regular Unix timestamp is done in seconds).

`Core.OIPd.send(jsonData, publishFee, onSuccess, onError)`: Publishes your requested jsonData with the specified `publishFee` to the blockchain.

`Core.OIPd.sendToBlockChain(txComment, publishFee, onSuccess, onError)`: Publishes your txComment to the FLO Blockchain. If more than one transaction is needed, it will automatically split up data using the Multipart protocol.

`Core.OIPd.sendTX(txComment, publishFee, onSuccess, onError)`: Send a transaction with the specified txComment and publishFee.

`Core.OIPd.multiPart(txComment, publishFee, onSuccess, onError)`: Sends out Multipart transactions containing the full `txComment` requested.

`Core.OIPd.sendRestOfMultipart(multipartStrings, txidRef, addTxid, multipartDone, onError)`: Used internally to send the rest of the Multipart tx comments after the initial one is sent.

`Core.OIPd.createMultipartStrings(longTxComment)`: Will provide you an array of strings that are the proper length to publish in Multipart messages.

`Core.OIPd.createMultipartString(partNumber, maxParts, txidRef, stringPart)`: Creates a single mutlipart string to be published as a txComment.

`Core.OIPd.chopString(input)`: Chops the inputted string into multipart compliant sizes and **return**s the array.

`Core.OIPd.createSquashedPatch(original, modified)`: Create a Squashed JSON Edit Patch. **return**s the squashed patch.

`Core.OIPd.squashPatch(patch)`: Squash a patch down to a more minimal state.

`Core.OIPd.unSquashPatch(squashedPatch)`: Restore the patch to the full state.

`Core.OIPd.calculatePublishFee(artJSON, onSuccess, onError)`: Calculates a publish fee for the supplied artJSON and returns a float via the `onSuccess` **callback**.

#### `Core.Publisher`
`Core.Publisher.Register(username, address, email, onSuccess, onError)`: Register the specified Username.

#### `Core.settings`
If you need to tweak any API endpoints, or the IPFS config, you can do so in the `src/settings.js` file.

#### `Core.User`
`Core.User.Register(email, password, onSuccess, onError)`: Register a new User.

`Core.User.Login(identifier, password, onSuccess, onError)`: Login with your user to gain access to Wallet Functions.

`Core.User.Logout`: Logout your user.

#### `Core.Wallet`   
`Core.Wallet.on(eventType, runMeCallback)`: Subscribe to EventEmitter3 events emitted by the Wallet each time a transaction is sent. Currently, the only event type used is `bal-update`. 

`Core.Wallet.Create(email, password, onSuccess, onError)`: Create a wallet with the requested email password combo.

`Core.Wallet.Login(identifier, password, onSuccess, onError)`: Login to a selected wallet.

`Core.Wallet.Logout`: Logout from your walelt.

`Core.Wallet.getMainAddress(coin)`: **return**s the main address for the requested `coin`. Currently supported coins are `bitcoin`, `florincoin`, and `litecoin`.

`Core.Wallet.checkDailyFaucet(flo_address, onSuccess, onError)`: Checks if you are able to use the daily faucet.

`Core.Wallet.tryOneTimeFaucet(flo_address, recaptcha, onSuccess, onError)`: Attempts to receive funds from the one time faucet.

`Core.Wallet.tryDailyFaucet(flo_address, recaptcha, onSuccess, onError)`: Attempts to receive funds from the daily faucet.

`Core.Wallet.createAndEmitState(onSuccess, onError)`: Creates and emits a state via EventEmitter3 to anybody listening. This is currently emitted anytime balances are updated.

`Core.Wallet.signMessage(address, message)`: **return**s the signature for the message & address requested.

`Core.Wallet.refresh(onSuccess, onError)`: Refreshes the wallets information.

`Core.Wallet.sendTxComment(options, onSuccess, onError)`: Directly send a transaction comment to the Blockchain.

`Core.Wallet.sendPayment(coin, fiat, fiat_amount, payTo, onSuccess, onError)`: Send payment to a user. You can specify coins or usd for the `fiat` variable.

`Core.Wallet.createState`: **return**s the current created Wallet State.

`Core.Wallet.validateAddress(address, coin)`: Validates if the address is valid, **return**s true or false.

#### `Core.util`
`Core.util.chunksToFileURL(chunks, onLoad)`: This is used by the IPFS network layer to load byte arrays into a file URL reader, then return the fileURL base64 data to the `onLoad` callback.

`Core.util.buildIPFSShortURL(hash, filename)`: **return**s a built IPFS link to the IPFS resource. Use this if you don't want to download the file, but just get its hash reference.

`Core.util.buildIPFSURL(hash, filename)`: **return**s a built HTTP link to the IPFS resource. Use this if you don't want to download the file, but just get the URL to access it.

`Core.util.getExtension(filename)`: **return**s the file extension as a string. For example, pass this `index.html` and it will return `html`.

`Core.util.formatDuration(intDuration)`: **return**s a formatted duration in minutes and seconds (i.e. input 123 and get "2:03")

`Core.util.decodeMakeJSONSafe(stringToDecode)`: This checks if there are non JSON supported characters that we should re-encode, if there are, then it encodes them and **return**s a fixed string, if not, it **return**s the original string.

`Core.util.createPriceString(price)`: **return**s a price string that always has 3 digits.

`Core.util.convertBTCtoBits(btc_value)`: **return**s the amount of bits in the btc_value requested.

