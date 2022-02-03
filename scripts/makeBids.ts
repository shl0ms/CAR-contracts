import {run, ethers} from 'hardhat'
import fetch from 'cross-fetch'
import {Wallet} from 'ethereumjs-wallet'
import {MockWETH} from '../typechain'
import {readFileSync, writeFileSync} from 'fs'

const ENV = {
    LOCAL: 'http://localhost:3000',
    DEV: 'https://carauction-jasheal-windranger.vercel.app',
    PROD: 'https://carauction.vercel.app'
}

const CODE = 'YNoq5sNv'
const WALLETS = 888
const SLEEP = 100
const SCALE = 0.0000001
const API_URL = ENV.DEV

class Bid {
    amount: string
    signature: string
    address: string
    date: number

    constructor(
        amount: string,
        signature: string,
        address: string,
        date: number
    ) {
        this.amount = amount
        this.signature = signature
        this.address = address
        this.date = date
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function post(url: string, body: any) {
    return await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: CODE
        },
        body
    })
}

async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

async function main() {
    const signers = await ethers.getSigners()
    const admin = signers[0]
    const WETH = await ethers.getContractFactory('MockWETH')
    const weth = <MockWETH>(
        WETH.attach('0xc778417E063141139Fce010982780140Aa0cD5Ab')
    )
    const provider = await ethers.getDefaultProvider(
        'https://eth-ropsten.alchemyapi.io/v2/_FhcEg_5DvMaewwIWP-3ZsH7HuwejLTP'
    )
    await weth.deposit({value: '8800000000000000000'})
    for (let i = 0; i < WALLETS; ++i) {
        const wallet = await Wallet.generate()
        writeFileSync('./addresses.txt', wallet.getPrivateKeyHex())
        await weth.transfer(wallet.getAddressString(), '10000000000000000')
        await admin.sendTransaction({
            to: wallet.getAddressString(),
            value: ethers.utils.parseEther('0.01')
        })
        await weth
            .connect(wallet)
            .approve('0x17E3325559639F206402c15744Ae4549aC1Fb97c', amount)
    }
    /*
  for (let i = 0; i < WALLETS; ++i) {
    const number = '0.01'
    const amount = ethers.utils.formatUnits(
      ethers.utils.parseUnits(number),
      'wei'
    )
    console.log(amount)
    await weth.transfer(wallet.address, amount)
    console.log('LOL')
    console.log(wallet.address)
    await weth.connect(wallet).approve('0x17E3325559639F206402c15744Ae4549aC1Fb97c', amount)
    const signature = await wallet.signMessage(amount)
    const bid = new Bid(amount, signature, wallet.address, Date.now())
    const response = await post(
      API_URL + '/api/bid',
      JSON.stringify({ bid: bid })
    )
    const responseJson = await response.json()
    if (response.status !== 200) {
      console.log(responseJson)
    }
  }*/
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
