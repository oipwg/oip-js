var settingsFunction = function(){
	var settings = {
		OIPdURL: "https://api.alexandria.io/alexandria/v2",
		IPFSGatewayURL: "https://gateway.ipfs.io/ipfs/",
		issoURL: "https://isso.alexandria.io/",
		btcTickerURL: "https://blockchain.info/ticker?cors=true",
		floTickerURL: "https://api.alexandria.io/flo-market-data/v1/getAll",
		ltcTickerURL: "https://api.coinmarketcap.com/v1/ticker/litecoin/",
		faucetURL: "https://api.alexandria.io/faucet",
		ipfsConfig: {
			init: true,
			start: true,
			EXPERMENTAL: {
				pubsub: false,
				sharding: false,
				dht: true
			},
			config: {
				Addresses: {
					Swarm: [
						'/ip4/163.172.37.165/tcp/4001/ipfs/QmRvfRjoCCwVLbVAiYWqJJCiQKqGqSuKckv4eDKEHZXxZu',
						"/ip4/69.172.212.23/tcp/4001/ipfs/QmXUcnxbsDkazGNvgf1kQya6YwVqNsLbVhzg3LHNTteqwz",
						// "/ip4/69.172.212.23/tcp/4002/ws/ipfs/QmXUcnxbsDkazGNvgf1kQya6YwVqNsLbVhzg3LHNTteqwz",
						"/ip4/192.99.6.117/tcp/4001/ipfs/QmQ85u4dH4EPRpNxLxBMvUCHCUyuyZgBZsfW81rzh51FtY",
						"/ip6/2607:5300:60:3775::/tcp/4001/ipfs/QmQ85u4dH4EPRpNxLxBMvUCHCUyuyZgBZsfW81rzh51FtY"
					]
				}
			}
		}
	}

	this.settings = settings;
	return this.settings;
}

export default settingsFunction;