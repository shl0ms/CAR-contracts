// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {ethers} from 'ethers'
import {solidity} from 'ethereum-waffle'
import {Auction, MockWETH, TimelockedERC721} from '../typechain'
import {deployContract, signer} from './framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './framework/transaction'

chai.use(solidity)

const AMOUNT = '100000000000000000'
const ITEMS = 3

describe('Auction', () => {
    before(async () => {
        admin = await signer(0)
        bidders = []
        for (let i = 0; i < ITEMS; ++i) {
            bidders.push(await signer(i + 1))
        }
        nft = await deployContract<TimelockedERC721>('TimelockedERC721')
        await nft.initialize('NFT', 'NFT', 'https', '1700000000')
        weth = await deployContract<MockWETH>('MockWETH')
        for (let i = 0; i < ITEMS; ++i) {
            await weth.connect(bidders[i]).deposit({value: AMOUNT})
        }
    })

    it('Run auction', async () => {
        auction = await deployContract<Auction>('Auction')
        await auction.initialize(
            nft.address,
            ITEMS,
            weth.address,
            admin.address,
            admin.address
        )
        await nft.addMinter(auction.address)

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

        const bids = []
        const biddersAddrs = []

        for (let i = 0; i < ITEMS; ++i) {
            bids.push(AMOUNT)
            biddersAddrs.push(bidders[i].address)
        }

        await successfulTransaction(
            auction.selectWinners(biddersAddrs, bids, sigsR, sigsS, sigsV, 1)
        )

        for (let i = 0; i < ITEMS; ++i) {
            expect(await nft.ownerOf(i + 1)).equals(bidders[i].address)
        }
    })

    let admin: SignerWithAddress
    let bidders: SignerWithAddress[]
    let auction: Auction
    let weth: MockWETH
    let nft: TimelockedERC721
})
