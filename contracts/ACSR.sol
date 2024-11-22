// SPDX-License-Identifier: MIT
pragma solidity =0.8.12;

import "./ERC20Detailed.sol";

contract ACSR is ERC20Detailed {
    constructor() ERC20Detailed("ACSR Token", "ACSR", 18, 5000000000000000000000000000, 0xA912880FD162AC4E31c021E4189D9498E1d7D9a7) {
    }
}

