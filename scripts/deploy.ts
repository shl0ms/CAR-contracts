import {run, ethers} from 'hardhat'
import {log} from '../config/logging'
import {TimelockedERC721, Auction} from '../typechain'

async function main() {
    await run('compile')

    const accounts = await ethers.getSigners()

    log.info(
        'Accounts:',
        accounts.map((a) => a.address)
    )

    const WETH = '0xc778417E063141139Fce010982780140Aa0cD5Ab'
    const OPERATOR = '0xf1FBe4F268dB6658780A3A7D4c03Be6F9e3fe136'
    const BENEFICIARY = '0xf1FBe4F268dB6658780A3A7D4c03Be6F9e3fe136'
    const ITEMS = 888

    const NFT = await ethers.getContractFactory('TimelockedERC721')
    const nft = <TimelockedERC721>await NFT.deploy()
    await nft.initialize('CAR', 'CAR', 'https://lol.com', '1700000000')
    log.info('NFT: ', nft.address)

    const AuctionFactory = await ethers.getContractFactory('Auction')
    const auction = <Auction>await AuctionFactory.deploy()
    await auction.deployed()
    await auction.initialize(nft.address, ITEMS, WETH, BENEFICIARY, OPERATOR)
    log.info('Auction: ', auction.address)
    await nft.addMinter(auction.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
