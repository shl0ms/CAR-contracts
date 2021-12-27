import {run, ethers} from 'hardhat'
import {log} from '../config/logging'
import {MockWETH, WindrangerAuction} from '../typechain'

async function main() {
    await run('compile')

    const accounts = await ethers.getSigners()

    log.info(
        'Accounts:',
        accounts.map((a) => a.address)
    )

    const WETH = await ethers.getContractFactory('MockWETH')
    const weth = <MockWETH>await WETH.deploy()
    await weth.deployed()

    log.info('WETH: ', weth.address)

    const Auction = await ethers.getContractFactory('WindrangerAuction')
    const auction = <WindrangerAuction>(
        await Auction.deploy(accounts[0].address, weth.address)
    )
    await auction.deployed()

    log.info('Auction: ', auction.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
