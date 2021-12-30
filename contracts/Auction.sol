// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

interface IERC721 {
    function mint(address to, uint256 id) external;
}

contract Auction is Initializable, OwnableUpgradeable, PausableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    uint256 public constant MAX_EXTENSION = 600;

    address public beneficiaryAddress;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public items;
    bool public extended;
    IERC20Upgradeable public weth;
    IERC721 public NFT;

    event Extended(uint256 endTime_);

    constructor(
        uint256 startTime_,
        uint256 endTime_,
        IERC721 NFT_,
        uint256 items_,
        IERC20Upgradeable weth_
    ) initializer {
        __Ownable_init();
        __Pausable_init();
        beneficiaryAddress = _msgSender();
        weth = weth_;
        startTime = startTime_;
        endTime = endTime_;
        items = items_;
        NFT = NFT_;
    }

    function setBeneficiary(address beneficiaryAddress_) external onlyOwner {
        beneficiaryAddress = beneficiaryAddress_;
    }

    function setWeth(IERC20Upgradeable weth_) external onlyOwner {
        weth = weth_;
    }

    function extend(uint256 endTime_) external onlyOwner {
        require(!extended, "Auction was extended");
        require(block.timestamp < endTime, "Can't extended after ending");
        require(
            endTime_ >= endTime && endTime_ - endTime <= MAX_EXTENSION,
            "New ending doesn't satisfy"
        );
        endTime = endTime_;
        extended = true;
        emit Extended(endTime_);
    }

    function selectWinners(
        address[] calldata bidders,
        uint256[] calldata bids,
        bytes32[] calldata sigsR,
        bytes32[] calldata sigsS,
        uint8[] calldata sigsV,
        uint256[] memory ids
    ) external onlyOwner {
        require(block.timestamp > endTime, "Auction hasn't ended");
        require(bidders.length <= items, "Too much winners");
        require(
            bidders.length == ids.length && bidders.length == bids.length,
            "Incorrect number of ids"
        );
        require(
            bidders.length == sigsV.length &&
                sigsV.length == sigsR.length &&
                sigsV.length == sigsR.length,
            "Incorrect number of signatures"
        );
        for (uint256 i = 0; i < bidders.length; i++) {
            require(
                ecrecover(
                    keccak256(
                        abi.encodePacked(
                            "\x19Ethereum Signed Message:\n32",
                            keccak256(abi.encodePacked(bids[i]))
                        )
                    ),
                    sigsV[i],
                    sigsR[i],
                    sigsS[i]
                ) == bidders[i],
                "Incorrect signature"
            );
            weth.safeTransferFrom(bidders[i], beneficiaryAddress, bids[i]);
            NFT.mint(bidders[i], ids[i]);
        }
        items -= bidders.length;
    }

    receive() external payable {}
}
