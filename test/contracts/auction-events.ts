import {Event} from 'ethers'
import {WinnersSelectedEvent} from '../../typechain/WindrangerAuction'
import {expect} from 'chai'

/**
 * Validates the event shape and converts the arguments of a WinnersSelectedEvent.
 *
 * @param event whose content is expected to match a WinnersSelectedEvent.
 *              If expectation are not met, test will be failed.
 */
export function winnersSelectedEvent(event: Event): string {
    const winnersSelected = event as WinnersSelectedEvent
    expect(winnersSelected.args).is.not.undefined

    const args = winnersSelected.args
    expect(args?.auctionID).is.not.undefined

    return args?.auctionID.toString()
}
