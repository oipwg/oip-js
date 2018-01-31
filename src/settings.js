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
				"Addresses": {
					"Swarm": [
						"/ip4/163.172.45.41/tcp/4001/ipfs/QmbGJgRuT3FNZiCuuqQoUcx6tZJwYqKf4dvB6mvnBCW4pH",
						"/ip4/192.99.6.117/tcp/4001/ipfs/QmQ85u4dH4EPRpNxLxBMvUCHCUyuyZgBZsfW81rzh51FtY",
						"/ip4/69.172.212.23/tcp/4001/ipfs/QmXUcnxbsDkazGNvgf1kQya6YwVqNsLbVhzg3LHNTteqwz",
						"/ip4/163.172.37.165/tcp/4001/ipfs/QmRvfRjoCCwVLbVAiYWqJJCiQKqGqSuKckv4eDKEHZXxZu"
					],
					"API": "",
					"Gateway": ""
				},
				"Discovery": {
					"MDNS": {
						"Enabled": false,
						"Interval": 10
					},
					"webRTCStar": {
						"Enabled": true
					}
				},
				"Bootstrap": [
					"/dns4/ams-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd",
					"/dns4/lon-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3",
					"/dns4/sfo-3.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM",
					"/dns4/sgp-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu",
					"/dns4/nyc-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLueR4xBeUbY9WZ9xGUUxunbKWcrNFTDAadQJmocnWm",
					"/dns4/nyc-2.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64",
					"/dns4/wss0.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmZMxNdpMkewiVZLMRxaNxUeZpDUb34pWjZ1kZvsd16Zic",
					"/dns4/wss1.bootstrap.libp2p.io/tcp/443/wss/ipfs/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6"
				]
			}
		},
		ipfsAPIConfig: {
			host: 'ipfs-one.alexandria.io', 
			port: '9094', 
			protocol: 'http'
		}
	}

	this.settings = settings;
	return this.settings;
}

export default settingsFunction;