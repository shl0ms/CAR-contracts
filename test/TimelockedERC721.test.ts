// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {ethers, BigNumber} from 'ethers'
import {solidity} from 'ethereum-waffle'
import {TimelockedERC721} from '../typechain'
import {deployContract, signer} from './framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './framework/transaction'
import {setNextBlockTimestamp, getTimestamp} from './framework/time'

// Wires up Waffle with Chai
chai.use(solidity)

const USERS = 3
const TIMESTAMP_INCREMENT = '100000000000'

describe('Timelocked ERC721', () => {
    before(async () => {
        admin = await signer(0)
        users = []
        for (let i = 0; i < USERS; ++i) {
            users.push(await signer(i + 1))
        }
        timelockedERC721 = await deployContract<TimelockedERC721>(
            'TimelockedERC721'
        )
        unlockTimestamp = BigNumber.from(await getTimestamp()).add(
            TIMESTAMP_INCREMENT
        )
        tokenName = 'TimelockedNFT'
        tokenSymbol = 'TNFT'

        await timelockedERC721
            .connect(admin)
            .initialize(tokenName, tokenSymbol, '0x', unlockTimestamp)
    })

    it('[sanity] Timelocked ERC721 initialized with expected name, symbol, and unlock timestamp', async () => {
        expect(await timelockedERC721.name()).to.equal('TimelockedNFT')
        expect(await timelockedERC721.symbol()).to.equal('TNFT')
        expect(
            (await timelockedERC721.tokenUnlockTimestamp()).eq(unlockTimestamp)
        )
    })

    it('[sanity] admin has DEFAULT_ADMIN_ROLE and MINTER_ROLE', async () => {
        expect(
            await timelockedERC721.hasRole(
                ethers.utils.keccak256(
                    ethers.utils.toUtf8Bytes('DEFAULT_ADMIN_ROLE')
                ),
                await admin.getAddress()
            )
        )
        expect(
            await timelockedERC721.hasRole(
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')),
                await admin.getAddress()
            )
        )
    })

    it('Should be able to mint tokens to other addresses with minter role', async () => {
        for (let i = 0; i < USERS; ++i) {
            await timelockedERC721
                .connect(admin)
                .mint(await users[i].getAddress(), i)
            expect(await timelockedERC721.ownerOf(i)).to.equal(
                await users[i].getAddress()
            )
        }
    })

    it('Should fail if non minter calls mint', async () => {
        await expect(
            timelockedERC721
                .connect(users[1])
                .mint(await users[1].getAddress(), 3)
        ).to.be.revertedWith("Doesn't have minter role!")
    })

    it('Should be able to transfer tokens that have never been locked', async () => {
        await timelockedERC721
            .connect(users[0])
            .transferFrom(
                await users[0].getAddress(),
                await users[1].getAddress(),
                0
            )
        expect(await timelockedERC721.ownerOf(0)).to.equal(
            await users[1].getAddress()
        )
    })

    it('Should not be able to transfer locked tokens before unlockTimestamp', async () => {
        await timelockedERC721.connect(users[1]).lockToken(0)
        await expect(
            timelockedERC721
                .connect(users[1])
                .transferFrom(
                    await users[1].getAddress(),
                    await users[0].getAddress(),
                    0
                )
        ).to.be.revertedWith('token is locked!')
        expect(await timelockedERC721.lockedTokens(0)).to.equal(true)
    })

    it('Should be able to unlock and transfer locked tokens at time unlockTimestamp', async () => {
        await setNextBlockTimestamp(unlockTimestamp.add(1))
        await timelockedERC721
            .connect(users[1])
            .transferFrom(
                await users[1].getAddress(),
                await users[0].getAddress(),
                0
            )

        expect(await timelockedERC721.ownerOf(0)).to.equal(
            await users[0].getAddress()
        )
        expect(await timelockedERC721.lockedTokens(0)).to.equal(false)
    })

    it('Should not be able to set unlockTimestamp that is not in the future', async () => {
        await expect(
            timelockedERC721
                .connect(admin)
                .setTokenUnlockTimestamp(await getTimestamp())
        ).to.be.revertedWith('timestamp must be in future!')
    })

    it('Should not be able to set unlockTimestamp without admin role', async () => {
        await expect(
            timelockedERC721
                .connect(users[0])
                .setTokenUnlockTimestamp((await getTimestamp()) + 1)
        ).to.be.revertedWith("Doesn't have admin role!")
    })

    let admin: SignerWithAddress
    let users: SignerWithAddress[]
    let timelockedERC721: TimelockedERC721
    let unlockTimestamp: BigNumber
    let tokenName: string
    let tokenSymbol: string
})
