import {run, ethers} from 'hardhat'
import {BigNumber as BN} from 'ethers'
import {log} from '../config/logging'
import {MockWETH, MockNFT, Auction} from '../typechain'

async function main() {
    await run('compile')

    if (!process.env.AUCTION || !process.env.WETH) {
        throw Error('Unset ENV vars')
    }

    const accounts = await ethers.getSigners()

    log.info(
        'Accounts:',
        accounts.map((a) => a.address)
    )

    const ITEMS = 6
    const TOP = 5000

    const AuctionFactory = await ethers.getContractFactory('Auction')
    const WETH = await ethers.getContractFactory('MockWETH')
    const auction = <Auction>AuctionFactory.attach(process.env.AUCTION)
    const weth = <MockWETH>WETH.attach(process.env.WETH)

    const sigsR = []
    const sigsS = []
    const sigsV = []
    const bids = []
    const ids = []
    const bidders = []

    for (let i = 1; i <= ITEMS; ++i) {
        const amount = BN.from(TOP - i).toString()
        await weth.connect(accounts[i]).deposit({value: amount})

        bids.push(amount)
        const msg = ethers.utils.arrayify(
            ethers.utils.solidityKeccak256(['uint256'], [amount])
        )
        await weth.connect(accounts[i]).approve(auction.address, amount)
        const rawSignature = await accounts[i].signMessage(msg)
        const signature = ethers.utils.splitSignature(rawSignature)

        sigsR.push(signature.r)
        sigsS.push(signature.s)
        sigsV.push(signature.v)
        bidders.push(accounts[i].address)
        ids.push(i + 1)
    }

    const tx = await auction.selectWinners(
        bidders,
        bids,
        sigsR,
        sigsS,
        sigsV,
        ids
    )
    const receipt = await tx.wait()
    log.info('Receipt: ', receipt)
    log.info('Auction: ', auction.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
