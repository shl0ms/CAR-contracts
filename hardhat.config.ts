import {task} from 'hardhat/config'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import '@openzeppelin/hardhat-upgrades'
import '@nomiclabs/hardhat-waffle'
import {log} from './config/logging'

/*
 * This is a sample Hardhat task. To learn how to create your own go to https://hardhat.org/guides/create-task.html
 */
task('accounts', 'Prints the list of accounts', async (args, hre) => {
    const accounts = await hre.ethers.getSigners()

    log.info('List of available Accounts')
    for (const account of accounts) {
        log.info('%s', account.address)
    }
})

// task action function receives the Hardhat Runtime Environment as second argument
task('blockNumber', 'Prints the current block number', async (_, {ethers}) => {
    await ethers.provider.getBlockNumber().then((blockNumber) => {
        log.info('Current block number: %d', blockNumber)
    })
})

 const NODE_API_KEY = process.env.NODE_API_KEY
 const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
 const MNEMONIC = process.env.MNEMONIC

/*
 * You need to export an object to set up your config
 * Go to https://hardhat.org/config/ to learn more
 *
 * At time of authoring 0.8.4 was the latest version supported by Hardhat
 */
export default {
    networks: {
        hardhat: {
            forking: {
                url: NODE_API_KEY,
                blockNumber: 13600000
            },
            chainId: 1,
            accounts: [
                {
                    privateKey:
                        '0xf269c6517520b4435128014f9c1e50c1c498374a7f5143f035bfb32153f3adab',
                    balance: '100000000000000000000000000000000'
                },
                {
                    privateKey:
                        '0xca3547a47684862274b476b689f951fad53219fbde79f66c9394e30f1f0b4904',
                    balance: '100000000000000000000000000000000'
                },
                {
                    privateKey:
                        '0x4bad9ef34aa208258e3d5723700f38a7e10a6bca6af78398da61e534be792ea8',
                    balance: '100000000000000000000000000000000'
                },
                {
                    privateKey:
                        '0xffc03a3bd5f36131164ad24616d6cde59a0cfef48235dd8b06529fc0e7d91f7c',
                    balance: '100000000000000000000000000000000'
                },
                {
                    privateKey:
                        '0x380c430a9b8fa9cce5524626d25a942fab0f26801d30bfd41d752be9ba74bd98',
                    balance: '100000000000000000000000000000000'
                },
                {
                    privateKey:
                        '0x76e84d048ab2f7e50865817dda3eef706aaeeeb592c1e0a2d677e914bda4e9d6',
                    balance: '100000000000000000000000000000000'
                },
                {
                    privateKey:
                        '0x11382902ecfbd88082b97693bd0ca5e1d9b273b50ae9626f6fa1f643be175d0b',
                    balance: '100000000000000000000000000000000'
                }
            ],
            allowUnlimitedContractSize: false,
            blockGasLimit: 40000000,
            gas: 40000000,
            gasPrice: 'auto',
            loggingEnabled: false
        },
        development: {
            url: 'http://127.0.0.1:8545',
            gas: 12400000,
            timeout: 1000000
        },
        ropsten: {
            url: NODE_API_KEY,
            accounts: [MNEMONIC]
        },
        rinkeby: {
            url: NODE_API_KEY,
            accounts: [MNEMONIC]
        },
        mainnet: {
            url: NODE_API_KEY,
            accounts: [MNEMONIC]
        },
        kovan: {
            url: NODE_API_KEY,
            accounts: [MNEMONIC]
        }
    },
    solidity: {
        compilers: [
            {
                version: '0.7.6',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            },
            {
                version: '0.8.4'
            }
        ]
    },
    mocha: {
        timeout: 500000
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY
    }
}
