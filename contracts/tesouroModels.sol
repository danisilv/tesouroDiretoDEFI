// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TesouroModels {

    enum PaymentType {
        TBRL,
        ETH
    }
    struct BondProperties {
        uint64 tax; // taxa de juros em porcentagem por dia (1e8 = 1%)
        uint64 minTBRL; // valor mínimo em TBRL para comprar o token (ex: 1e8 = 1 real)
        uint64 unitPriceBuy; // preço unitário do token em TBRL (ex: 1e8 = 1 real)
        uint64 unitPriceEarlyRedemption; // preço unitário do token em TBRL para resgate antecipado (ex: 1e8 = 1 real)
        uint64 expirationDate; // data de vencimento do token em timestamp Unix (ex: 1633046400 = 01/10/2021)
    }

    struct TokenProperties {
        uint64 tokenType; // ID do token base
        uint64 yearInterestRate; // taxa de juros em porcentagem por dia (com 5 casas decimais)
        uint64 buyTimestamp; // timestamp da compra do token
        uint256 lastPaidCustodyTimestamp; // timestamp do último pagamento de custódia
        uint64 unitPriceBuy; // preço unitário do token em TBRL (ex: 1e8 = 1 real)
        uint256 expirationDate; // data de vencimento do token em timestamp Unix (ex: 1633046400 = 01/10/2021)
    }

    struct SellOrder {
        address seller; // endereço do vendedor
        uint256 tokenID; // ID do token
        uint256 amount; // quantidade de tokens
        uint256 unitPriceSell; // preço unitário do token em TBRL (ex: 1e8 = 1 real)
    }

    struct BuyOrder {
        address buyer; // endereço do comprador
        uint256 tokenID; // ID do token
        uint256 amount; // quantidade de tokens
        uint256 unitPriceBuy; // preço unitário do token em TBRL (ex: 1e8 = 1 real)
    }
    
}
