pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

interface IERC721 {
    function mint(address to, uint256 id) external;
}

contract WindrangerAuction is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct Auction {
        uint256 start;
        uint256 end;
        uint256 items;
        IERC721 NFT;
    }

    address payable private _beneficiaryAddress;
    IERC20Upgradeable private _weth;
    mapping(uint256 => Auction) private _auctions;

    event AuctionCreated(
        uint256 auctionID,
        uint256 startTime,
        uint256 endTime,
        IERC721 NFT,
        uint256 items
    );
    event WinnersSelected(uint256 auctionID);

    modifier whenAuctionEnded(uint256 auctionID) {
        require(
            block.timestamp > _auctions[auctionID].end,
            "Auction hasn't ended"
        );
        _;
    }

    constructor(address payable beneficiaryAddress, IERC20Upgradeable weth)
        initializer
    {
        __Ownable_init();
        __Pausable_init();
        _beneficiaryAddress = beneficiaryAddress;
        _weth = weth;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setBeneficiary(address payable beneficiaryAddress)
        external
        onlyOwner
    {
        _beneficiaryAddress = beneficiaryAddress;
    }

    function setWeth(IERC20Upgradeable weth) external onlyOwner {
        _weth = weth;
    }

    function createAuction(
        uint256 auctionID,
        uint256 startTime,
        uint256 endTime,
        IERC721 NFT,
        uint256 items
    ) external onlyOwner {
        require(
            startTime > block.timestamp && startTime < endTime,
            "Incorrect time range"
        );
        Auction memory auction = Auction(startTime, endTime, items, NFT);
        _auctions[auctionID] = Auction(startTime, endTime, items, NFT);
        emit AuctionCreated(auctionID, startTime, endTime, NFT, items);
    }

    function selectWinners(
        uint256 auctionID,
        address[] calldata bidders,
        uint256[] calldata ids
    ) external onlyOwner whenAuctionEnded(auctionID) {
        require(
            bidders.length <= _auctions[auctionID].items,
            "Too much winners"
        );
        require(
            bidders.length <= _auctions[auctionID].items,
            "Not equal ids and bidders"
        );
        for (uint256 i = 0; i < bidders.length; i++) {
            _weth.safeTransferFrom(
                bidders[i],
                address(this),
                _weth.allowance(bidders[i], address(this))
            );
            _auctions[auctionID].NFT.mint(bidders[i], ids[i]);
        }
        _auctions[auctionID].items -= bidders.length;
        emit WinnersSelected(auctionID);
    }

    function beneficiaryAddress() external view returns (address) {
        return _beneficiaryAddress;
    }

    function weth() external view returns (IERC20Upgradeable) {
        return _weth;
    }

    function auction(uint256 auctionID)
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            IERC721
        )
    {
        return (
            _auctions[auctionID].start,
            _auctions[auctionID].end,
            _auctions[auctionID].items,
            _auctions[auctionID].NFT
        );
    }

    receive() external payable {}
}
