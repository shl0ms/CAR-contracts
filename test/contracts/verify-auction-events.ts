import {winnersSelectedEvent} from './auction-events'
import {event} from '../framework/events'
import {expect} from 'chai'
import {ContractReceipt} from 'ethers'

/**
 * Verifies the WinnersSelectedEvent, when expectation are not met the test fails.
 *
 * @param receipt expected to contain the WinnersSelectedEvent, whose payload will be verified.
 * @param auctionID expectation for the auctionID field of the given WinnersSelectedEvent.
 */
export function verifyWinnersSelectedEvent(
    receipt: ContractReceipt,
    expectedAuctionID: string
): void {
    const auctionID = winnersSelectedEvent(event('WinnersSelected', receipt))

    expect(auctionID, 'AuctionID does not match').equals(expectedAuctionID)
}
