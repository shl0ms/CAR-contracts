// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

abstract contract ERC712Domain {
    bytes32 constant DOMAIN_TYPEHASH = keccak256(
        'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
    );

    struct Domain {
        string name;
        string version;
    }

    bytes32 DOMAIN_HASH = 0x00;

    function __ERC712Domain_init(string memory name,string memory version) internal {
        require(DOMAIN_HASH == 0x00, 'ERC712Domain can only be initialized once');

        DOMAIN_HASH = keccak256(abi.encode(
            DOMAIN_TYPEHASH,

            // Bind this domain
            keccak256(bytes(name)),

            // Bind this version
            keccak256(bytes(version)),

            // Bind the chain
            block.chainid,

            // Bind the contract
            address(this)
        ));
    }

    function erc712Hash(bytes32 msgHash) public view returns (bytes32) {
        return keccak256(abi.encodePacked('\x19\x01', DOMAIN_HASH, msgHash));
    }

    function erc712Verify(address signer, bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) public view returns (bool) {
        return ecrecover(erc712Hash(msgHash), v, r, s) == signer;
    }
}
