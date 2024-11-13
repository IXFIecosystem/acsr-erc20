// SPDX-License-Identifier: MIT
pragma solidity =0.8.12;

import "./ERC20Detailed.sol";

contract ACSR is ERC20Detailed {
    constructor() ERC20Detailed("ACSR Token", "ACSR", 18, 5000000000000000000000000000) {
    }
}

