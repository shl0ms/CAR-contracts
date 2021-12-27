import {BigNumber as BN} from 'ethers'
import {waffle} from 'hardhat'

const provider = waffle.provider

const PAUSE_TIME_INCREMENT_MS = 100

/**
 * Whether the side effects being awaited have occurred.
 */
export interface SideEffectOccurrence {
    (): boolean
}

/**
 * Delays processing, with an early exit condition.
 *
 * @param earlyStop awaiting the side effect.
 * @param maximumDelayMs most amount of time to await side effect.
 */
export async function occurrenceAtMost(
    earlyStop: SideEffectOccurrence,
    maximumDelayMs: number
): Promise<void> {
    let passedMs = 0

    while (!earlyStop() && passedMs < maximumDelayMs) {
        await sleep(PAUSE_TIME_INCREMENT_MS)
        passedMs += PAUSE_TIME_INCREMENT_MS
    }
}

function sleep(ms: number): Promise<unknown> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

export async function advanceBlock() {
    await provider.send('evm_mine', [])
}

export async function advanceBlockTo(blockNum: number) {
    const blockNumber = BN.from(blockNum)
    for (
        let i = await provider.getBlockNumber();
        i < blockNumber.toNumber();
        i++
    ) {
        await advanceBlock()
    }
}

export async function increase(value: BN) {
    await provider.send('evm_increaseTime', [value.toNumber()])
    await advanceBlock()
}

export async function getTimestamp() {
    const block = await provider.getBlock('latest')
    return block.timestamp
}

export async function getBlock() {
    return provider.getBlockNumber()
}

export async function advanceTimeAndBlock(time: BN) {
    await advanceTime(time)
    await advanceBlock()
}

export async function advanceTime(time: BN) {
    await provider.send('evm_increaseTime', [time])
}

export const duration = {
    seconds: function (val: number) {
        return BN.from(val)
    },
    minutes: function (val: number) {
        return BN.from(val).mul(this.seconds(60))
    },
    hours: function (val: number) {
        return BN.from(val).mul(this.minutes(60))
    },
    days: function (val: number) {
        return BN.from(val).mul(this.hours(24))
    },
    weeks: function (val: number) {
        return BN.from(val).mul(this.days(7))
    },
    years: function (val: number) {
        return BN.from(val).mul(this.days(365))
    }
}
