// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./interfaces/IERC721.sol";

contract Auction is Initializable, OwnableUpgradeable, PausableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address public beneficiary;
    address public operator;
    uint256 public items;
    IERC20Upgradeable public weth;
    IERC721 public NFT;

    modifier onlyOperator() {
        require(_msgSender() == operator, "Must be the operator");
        _;
    }

    function initialize(
        IERC721 NFT_,
        uint256 items_,
        IERC20Upgradeable weth_,
        address beneficiary_,
        address operator_
    ) external initializer {
        __Ownable_init();
        __Pausable_init();
        NFT = NFT_;
        items = items_;
        weth = weth_;
        beneficiary = beneficiary_;
        operator = operator_;
    }

    function setBeneficiary(address beneficiary_) external onlyOwner {
        beneficiary = beneficiary_;
    }

    function setOperator(address operator_) external onlyOwner {
        operator = operator_;
    }

    function setWeth(IERC20Upgradeable weth_) external onlyOwner {
        weth = weth_;
    }

    function setNFT(IERC721 NFT_) external onlyOwner {
        NFT = NFT_;
    }

    function selectWinners(
        address[] calldata bidders,
        uint256[] calldata bids,
        bytes32[] calldata sigsR,
        bytes32[] calldata sigsS,
        uint8[] memory sigsV,
        uint256 startID
    ) external onlyOperator returns (uint256) {
        require(bidders.length <= items, "Too much winners");
        require(bidders.length == bids.length, "Incorrect number of bids");
        require(
            bidders.length == sigsV.length &&
                sigsV.length == sigsR.length &&
                sigsV.length == sigsR.length,
            "Incorrect number of signatures"
        );
        uint256 minted = 0;
        for (uint256 i = 0; i < bidders.length; i++) {
            if (
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
                ) != bidders[i]
            ) {
                continue;
            }
            if (
                weth.allowance(bidders[i], address(this)) < bids[i] ||
                weth.balanceOf(bidders[i]) < bids[i]
            ) {
                continue;
            }
            weth.safeTransferFrom(bidders[i], beneficiary, bids[i]);
            NFT.mint(bidders[i], startID + minted);
            minted++;
        }
        items -= minted;
        return minted;
    }

    receive() external payable {}
}
