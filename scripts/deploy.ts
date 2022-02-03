import {run, ethers} from 'hardhat'
import {log} from '../config/logging'
import {MockWETH, MockNFT, Auction} from '../typechain'

async function main() {
    await run('compile')

    const accounts = await ethers.getSigners()

    log.info(
        'Accounts:',
        accounts.map((a) => a.address)
    )

    /*const WETH = await ethers.getContractFactory('MockWETH')
    const weth = <MockWETH>await WETH.deploy()
    await weth.deployed()
    log.info('WETH: ', weth.address)*/
    const WETH = '0xc778417E063141139Fce010982780140Aa0cD5Ab'
    const OPERATOR = '0xf1FBe4F268dB6658780A3A7D4c03Be6F9e3fe136'
    const BENEFICIARY = '0xf1FBe4F268dB6658780A3A7D4c03Be6F9e3fe136'
    const ITEMS = 888

    const NFT = await ethers.getContractFactory('MockNFT')
    const nft = <MockNFT>await NFT.deploy()
    await nft.deployed()
    log.info('NFT: ', nft.address)

    const AuctionFactory = await ethers.getContractFactory('Auction')
    const auction = <Auction>(
        await AuctionFactory.deploy(
            nft.address,
            ITEMS,
            WETH,
            BENEFICIARY,
            OPERATOR
        )
    )
    await auction.deployed()
    await nft.addMinter(auction.address)
    log.info('Auction: ', auction.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
