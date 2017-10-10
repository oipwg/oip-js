# alexandria-core
An NPM module containing all of the core functionality to run the Alexandria front end.

## Work in Progress
This section is a work in progress, so more information will be added periotically. Information may be out of data, for latest information, please read the code :)

### Modules
Inside of Alexandria Core there are currently 4 modules. Each of the four modules have specific tasks to try and seperate the logic out. They are seperated as follows:

- Artifact: This contains helper functions for manipulating artifact JSON.
- Data: This contains simple access to application information that was fetched by the network layer.
- Network: Usually called by the Data layer. This module contains all of the server calls & network transfer functions (i.e. IPFS).
- util: Other generally helpful utility functions that we have found helpful.

Currently, we have implemented or planned the following functions:

#### `Core.Artifact`
`Core.Artifact.getTXID(oipArtifactID)`: **return**s the *txid* of the given artifact.

`Core.Artifact.getTitle(oipArtifactID)`: **return**s the *title* of the given artifact.

`Core.Artifact.getType(oipArtifactID)`: **return**s the *type* of the given artifact.

`Core.Artifact.getSubtype(oipArtifactID)`: **return**s the *subtype* of the given artifact.

`Core.Artifact.getDescription(oipArtifactID)`: **return**s the *description* of the given artifact.

`Core.Artifact.getLocation(oipArtifactID)`: If the whole artifact is free, **return**s the location address of the given artifact (This is usually the IPFS hash, unless the Artifact uses another data storage layer) as **storage:location**. If any of the artifact is commercial, **return** "permission denied"

`Core.Artifact.getFiles(oipArtifactID)`: **return**s the data related to the files in the given artifact, Including **dName**s, **fName**s and **playtime** and pricing fields. If any of the artifact is commercial, for all of the files which are available(free), `return`s ipfs file hashes as **storage:files:location**, and **return** "permission denied" for files which are not yet available (not yet paid for). 

`Core.Artifact.getPublisherAlias(oipArtifactID)`: **return**s the *Publisher Alias* for the *Publisher* that published the Artifact. If no *Publisher Alias* was specified, **return**s "Flotoshi"

`Core.Artifact.getPublisherAddress(oipArtifactID)`: **return**s the *Publisher Address* which published the artifact.

`Core.Artifact.getArtist(oipArtifactID)`: **return**s the *Artist* of the given artifact. If an *Artist* was not specified, **return**s *Publisher Alias* instead.

`Core.Artifact.getTipPrefs(oipArtifactID)`: **return**s the tipping address and suggested tip values.

`Core.Artifact.getThumbnail(oipArtifactID)`: **return**s the **fName** of the *Thumbnail* for the given artifact. This is calculated as the first File with the type "Image" that does not have a price to view it. Returns `""` if no thumbnail can be found.

`Core.Artifact.getFirstImage(oipArtifactID)`: **return**s the first *image* in the given artifact. If none are found, `""` will be returned.

`Core.Artifact.getFirstHTML(oipArtifactID)`: **return**s the first html document in the given artifact. This is calculated by grabbing the extension off of files, the first one with an extension of `.html` will be returned. If none are found, `""` will be returned.

`Core.Artifact.getSongs(oipArtifactID)`: **return**s a formatted JSON object of `songs` in the given artifact.

`Core.Artifact.getEntypoIconForType(oipArtifactID)`: **return**s the css class for the artifact type. This will likely be not very useful for most people.

`Core.Artifact.paid(oipArtifactID)`: **return**s `true` if any files have either a suggested buy price or suggested play price. Otherwise it will return `false`.

#### `Core.Index`
`Core.Index.getSupportedArtifacts(callback(supportedArtifacts))`: Provides an array of supported artifacts to the callback. All artifacts will be formatted based on the highest version supported by `alexandria-core`. Currently this is `oip-041`.

`Core.Index.getLatestArtifacts(callback(latestArtifacts))`: This will grab the latest artifacts from OIPd and **return** them as a JSON array to the callback.

`Core.Index.getRegisteredPublishers(callback(registeredPublishers))`: Provides an array of registered publishers to the callback. All publishers will be formatted based on the highest version supported by *alexandria-core*, currently this is oip-041. paginated, sortable by various fields

`Core.Index.getPublisherDetail(oipPublisherAddress)`: **return**s *Publisher Alias*, *BTC Address*, TXID of registration message, registration *timestamp*, and *email md5 hash* for given Publisher Address.

`Core.Index.getPublisherArtifacts(oipPublisherAddress)`: **return**s a list of all *artifactID*s by a given *Publisher*.

#### `Core.Network`
`Core.Network.getIPFS(callback)`: Passes the IPFS object to the callback after it has been successfully spawned. You are highly discouraged from using this function, but it is here for advanced functionality.

`Core.Network.getThumbnailFromIPFS(hash, onDataCallback)`: Give it either an IPFS file hash or hash + subfile (i.e. `hash/filename.png`). Each time data is downloaded (i.e. on download progress), we call the onDataCallback and pass a base64 encoded version of the file. You can feed this directly into an image source and it will load fine :)

`Core.Network.getFileFromIPFS(hash, onCompleteCallback)`: Give it either an IPFS file hash or hash + subfile (i.e. `hash/filename.png`). When the file download is complete, we call the onDataCallback and pass a base64 encoded version of the file. You can feed this directly into an image source and it will load fine :)

#### `Core.util`
`Core.util.chunksToFileURL(chunks, onLoad)`: This is used by the IPFS network layer to load byte arrays into a file URL reader, then return the fileURL base64 data to the `onLoad` callback.

`Core.util.buildIPFSURL(hash, filename)`: **return**s a built HTTP link to the IPFS resource. Use this if you don't want to download the file, but just get the URL to access it.

`Core.util.getExtension(filename)`: **return**s the file extension as a string. For example, pass this `index.html` and it will return `html`.

`Core.util.decodeMakeJSONSafe(stringToDecode)`: This checks if there are non JSON supported characters that we should re-encode, if there are, then it encodes them and **return**s a fixed string, if not, it **return**s the original string.

