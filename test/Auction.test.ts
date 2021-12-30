// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {ethers, BigNumber} from 'ethers'
import {solidity} from 'ethereum-waffle'
import {Auction, MockWETH, MockNFT} from '../typechain'
import {deployContract, signer} from './framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './framework/transaction'
import {advanceBlockTo, getTimestamp, getBlock} from './framework/time'

// Wires up Waffle with Chai
chai.use(solidity)

const AMOUNT = '90000000000000000000000000000000'
const ITEMS = 3

describe('Auction', () => {
    before(async () => {
        admin = await signer(0)
        bidders = []
        for (let i = 0; i < ITEMS; ++i) {
            bidders.push(await signer(i + 1))
        }
        nft = await deployContract<MockNFT>('MockNFT')
        weth = await deployContract<MockWETH>('MockWETH')
        for (let i = 0; i < ITEMS; ++i) {
            await weth.connect(bidders[i]).deposit({value: AMOUNT})
        }
    })

    it('Run auction', async () => {
        const start = (await getTimestamp()) + 3
        const end = (await getTimestamp()) + 11
        auction = await deployContract<Auction>(
            'Auction',
            start,
            end,
            nft.address,
            ITEMS,
            weth.address
        )
        await nft.addMinter(auction.address)

        const amountBytes = ethers.utils.defaultAbiCoder.encode(
            ['uint256'],
            [AMOUNT]
        )
        const msg = ethers.utils.arrayify(
            ethers.utils.solidityKeccak256(['uint256'], [AMOUNT])
        )

        const sigsR = []
        const sigsS = []
        const sigsV = []

        for (let i = 0; i < ITEMS; ++i) {
            await weth.connect(bidders[i]).approve(auction.address, AMOUNT)
            const rawSignature = await bidders[i].signMessage(msg)
            const signature = ethers.utils.splitSignature(rawSignature)

            sigsR.push(signature.r)
            sigsS.push(signature.s)
            sigsV.push(signature.v)
        }

        await advanceBlockTo((await getBlock()) + 8)

        const bids = []
        const ids = []
        const biddersAddrs = []

        for (let i = 0; i < ITEMS; ++i) {
            bids.push(AMOUNT)
            ids.push(i + 1)
            biddersAddrs.push(bidders[i].address)
        }

        await successfulTransaction(
            auction.selectWinners(biddersAddrs, bids, sigsR, sigsS, sigsV, ids)
        )

        for (let i = 0; i < ITEMS; ++i) {
            expect(await nft.ownerOf(i + 1)).equals(bidders[i].address)
        }
    })

    let admin: SignerWithAddress
    let bidders: SignerWithAddress[]
    let auction: Auction
    let weth: MockWETH
    let nft: MockNFT
})
