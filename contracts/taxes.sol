// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./tesouroModels.sol";

library Taxes {
    function calculateIOF(
        TesouroModels.TokenProperties storage token,
        uint256 amount,
        uint256 unitPrice
    ) public view returns (uint256) {
        if (token.buyTimestamp + 30 days < block.timestamp) {
            return 0;
        }
        if (amount * unitPrice < amount * token.unitPriceBuy) {
            return 0;
        }

        uint256 daysSince = (block.timestamp - token.buyTimestamp) / 1 days;
        uint256 iofRate = 96 - (3 * daysSince);

        uint256 profit = (amount * unitPrice) - (amount * token.unitPriceBuy);

        return (profit * iofRate) / 100;
    }

    function calculateIR(
        TesouroModels.TokenProperties storage token,
        uint256 amount,
        uint256 unitPrice
    ) public view returns (uint256) {
        uint256 profit = (amount * unitPrice) - (amount * token.unitPriceBuy);
        if (amount * unitPrice < amount * token.unitPriceBuy) {
            return 0;
        }
        uint256 irRate = 0;
        if (token.buyTimestamp + 180 days < block.timestamp) {
            irRate = 225;
        }
        if (token.buyTimestamp + 360 days < block.timestamp) {
            irRate = 200;
        }
        if (token.buyTimestamp + 720 days < block.timestamp) {
            irRate = 175;
        }
        if (token.buyTimestamp + 721 days < block.timestamp) {
            irRate = 150;
        }
        
        return (profit * irRate) / 1000;
    }

    function calculateCustody(
        TesouroModels.TokenProperties storage token
    ) public view returns (uint256) {
    }

}
