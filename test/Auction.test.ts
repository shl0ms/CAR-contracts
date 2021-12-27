// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {WindrangerAuction, MockWETH, MockNFT} from '../typechain'
import {deployContract, signer} from './framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './framework/transaction'
import {advanceBlockTo, getTimestamp, getBlock} from './framework/time'
import {verifyWinnersSelectedEvent} from './contracts/verify-auction-events'

// Wires up Waffle with Chai
chai.use(solidity)

const AMOUNT = '90000000000000000000000000000000'

describe('Auction', () => {
    before(async () => {
        admin = await signer(0)
        bidder1 = await signer(1)
        bidder2 = await signer(2)
        bidder3 = await signer(3)
        nft = await deployContract<MockNFT>('MockNFT')
        weth = await deployContract<MockWETH>('MockWETH')
        auction = await deployContract<WindrangerAuction>(
            'WindrangerAuction',
            admin.address,
            weth.address
        )
        await nft.addMinter(auction.address)
        await weth.connect(bidder1).deposit({value: AMOUNT})
        await weth.connect(bidder2).deposit({value: AMOUNT})
        await weth.connect(bidder3).deposit({value: AMOUNT})
    })

    it('Run auction', async () => {
        const start = (await getTimestamp()) + 2
        const end = (await getTimestamp()) + 10
        const items = 3
        let receipt = await successfulTransaction(
            auction.createAuction('1', start, end, nft.address, items)
        )

        await weth.connect(bidder1).approve(auction.address, AMOUNT)
        await weth.connect(bidder2).approve(auction.address, AMOUNT)
        await weth.connect(bidder3).approve(auction.address, AMOUNT)

        await advanceBlockTo((await getBlock()) + 8)

        receipt = await successfulTransaction(
            auction.selectWinners(
                '1',
                [bidder1.address, bidder2.address, bidder3.address],
                ['1', '2', '3']
            )
        )

        verifyWinnersSelectedEvent(receipt, '1')

        expect(await nft.ownerOf('1')).equals(bidder1.address)
        expect(await nft.ownerOf('2')).equals(bidder2.address)
        expect(await nft.ownerOf('3')).equals(bidder3.address)
    })

    let admin: SignerWithAddress
    let bidder1: SignerWithAddress
    let bidder2: SignerWithAddress
    let bidder3: SignerWithAddress
    let auction: WindrangerAuction
    let weth: MockWETH
    let nft: MockNFT
})
