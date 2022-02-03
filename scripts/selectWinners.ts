import {run, ethers} from 'hardhat'
import {BigNumber as BN} from 'ethers'
import {log} from '../config/logging'
import {MockWETH, MockNFT, Auction} from '../typechain'
import fetch from 'cross-fetch'

const ENV = {
    LOCAL: 'http://localhost:3000',
    DEV: 'https://carauction-jasheal-windranger.vercel.app',
    PROD: 'https://carauction.vercel.app'
}

const CODE = 'YNoq5sNv'
const SCALE = 0.05
const API_URL = ENV.DEV

async function get(url: string) {
    return await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: CODE
        }
    })
}

async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

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

    const TXS = 50
    const GROUP_SIZE = 20

    const AuctionFactory = await ethers.getContractFactory('Auction')
    const WETH = await ethers.getContractFactory('MockWETH')
    const NFT = await ethers.getContractFactory('MockNFT')
    const auction = <Auction>(
        AuctionFactory.attach('0xdA9d2b9B435C95cf56B00b5d258925E0CEDEB088')
    )
    const nft = <MockNFT>(
        NFT.attach('0xaE21994DA34B80364CCF23Dcc63E360E2f901C4b')
    )
    const weth = <MockWETH>(
        WETH.attach('0xdeD9CbEdc514d30ac1F36FA1E860705EcbBf6650')
    )

    const response = await get(API_URL + '/api/bids')
    const responseJson = await response.json()
    if (response.status !== 200) {
        console.log(responseJson)
    }
    let cur = 0
    let sum = BN.from(0)
    for (let i = 0; i < TXS && cur < responseJson.length; ++i) {
        const sigsR = []
        const sigsS = []
        const sigsV = []
        const bids = []
        const ids = []
        const bidders = []
        for (let j = 0; j < GROUP_SIZE; ++j) {
            const amount = ethers.utils.formatUnits(
                ethers.utils.parseUnits(responseJson[cur].amount),
                'wei'
            )
            const allowance = await weth.allowance(
                responseJson[cur].address,
                process.env.AUCTION
            )
            const balance = await weth.balanceOf(responseJson[cur].address)
            /*if (BN.from(allowance).lt(BN.from(amount)) || BN.from(balance).lt(BN.from(amount))) {
                continue
            }*/
            bids.push(amount)
            bidders.push(responseJson[cur].address)
            sigsR.push(responseJson[cur].signature.substr(0, 66))
            sigsS.push('0x' + responseJson[cur].signature.substr(66, 64))
            sigsV.push(
                BN.from(
                    '0x' + responseJson[cur].signature.substr(130, 2)
                ).toString()
            )
            ++cur
            ids.push(cur)
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
        console.log(tx)
        console.log(receipt)
        sum = sum.add(receipt.cumulativeGasUsed)
        for (let j = 0; j < GROUP_SIZE; ++j) {
            const owner = await nft.ownerOf(ids[j])
            if (owner != bidders[j]) {
                console.log('Incorrect owner for: ', ids[j])
            }
        }
    }
    console.log('Gas used: ', sum.toString())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
