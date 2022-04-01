import {run, ethers} from 'hardhat'
import {BigNumber as BN} from 'ethers'
import {log} from '../config/logging'
import {Auction} from '../typechain'
import {readFileSync} from 'fs'

async function main() {
    await run('compile')

    const accounts = await ethers.getSigners()

    log.info(
        'Accounts:',
        accounts.map((a) => a.address)
    )

    const MAX_WINNERS = 888
    const GROUP_SIZE = 20
    const AUCTION = process.env.AUCTION ? process.env.AUCTION : ''
    const AuctionFactory = await ethers.getContractFactory('Auction')
    const auction = <Auction>AuctionFactory.attach(AUCTION)
    const readWinners = readFileSync('winners.csv', 'utf-8')
    const winners = readWinners.split('\n')

    let curID = 1
    let items = 888
    let sum = BN.from(0)
    for (
        let i = 1;
        i < winners.length && curID <= MAX_WINNERS;
        i += GROUP_SIZE
    ) {
        const sigsR = []
        const sigsS = []
        const sigsV = []
        const bids = []
        const bidders = []
        const formattedAmountHashes = []
        for (
            let j = 0;
            j < GROUP_SIZE &&
            curID + j <= MAX_WINNERS &&
            i + j < winners.length;
            ++j
        ) {
            const params = winners[i + j].split('"').join('').split(',')
            bids.push(params[1])
            formattedAmountHashes.push(
                ethers.utils.keccak256(
                    ethers.utils.toUtf8Bytes(params[2])
                )
            )
            bidders.push(params[3])
            const signature = ethers.utils.splitSignature(params[4])
            sigsR.push(signature.r)
            sigsS.push(signature.s)
            sigsV.push(signature.v)
        }
        const tx = await auction.selectWinners(
            bidders,
            bids,
            formattedAmountHashes,
            sigsR,
            sigsS,
            sigsV,
            BN.from(curID)
        )
        const receipt = await tx.wait()
        // console.log(receipt)
        const leftItems = await auction.items()
        curID += items - leftItems.toNumber()
        // console.log('LEFT ITEMS: ' + leftItems.toString())
        items = leftItems.toNumber()
        sum = sum.add(receipt.gasUsed)
    }
    // console.log('Gas used: ', sum.toString())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
