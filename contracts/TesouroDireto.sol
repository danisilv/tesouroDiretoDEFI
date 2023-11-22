// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

// import "@openzeppelin/contracts/utils/math/Math.sol";
import "hardhat/console.sol";

import "./tesouroModels.sol";
import "./taxes.sol";

contract TesouroDireto is ERC1155, AccessControl, TesouroModels {

    

    address public owner;
    address public incomeTaxAddress; // endereço dos valores retidos na fonte (IR)
    address public iofAddress; // endereço dos valores retidos de IOF
    address public custodyAddress; // endereço dos valores retidos de custódia

    address public sellOrdersAdress; // endereço dos tokens retidos de custódia
    address public buyOrdersAdress; // endereço dos TBRLs retidos de custódia

    uint256 public custodyFee; // taxa de custodia por ano em porcentagem (ex: 1e8 = 1%)
    uint256 public tokenSequence = 1; // sequência de tokens gerados

    uint8 public constant TBRL = 0; // ID da stablecoin brasileira, TBRL (100 = 1 real)
    // O ID dos tokens será comoposto por prefixo(3) + ano vencimento (4) + sequência (5)
    uint16 public constant TESOURO_PRE = 100;
    uint16 public constant TESOURO_PRE_SEM = 101;
    uint16 public constant TESOURO_SELIC = 200;
    uint16 public constant TESOURO_IPCA = 300;
    uint16 public constant TESOURO_IPCA_SEM = 301;
    uint16 public constant TESOURO_RENDA = 400;
    uint16 public constant TESOURO_EDUCA = 500;

    mapping(uint64 => BondProperties) public bondsProperties; // mapeamento dos tokens e suas taxas de juros
    mapping(uint256 => TokenProperties) public tokensProperties; // mapeamento dos tokens e suas propriedades
    mapping(uint256 => SellOrder) public sellOrders; // mapeamento dos tokens e suas propriedades
    mapping(uint256 => BuyOrder) public buyOrders; // mapeamento dos tokens e suas propriedades
    uint256 public sellOrderSequence = 1; // sequência de ordens geradas
    uint256 public buyOrderSequence = 1; // sequência de ordens geradas

    uint256 public ETH_BRL = 100 * 1e8; // mock para o valor do ETH em reais (100 reais)

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PRE_ORDER_ROLE = keccak256("PRE_ORDER_ROLE");
    bytes32 public constant ORDER_TBRL = keccak256("ORDER_TBRL");
    bytes32 public constant PAYMENT_ROLE = keccak256("PAYMENT_ROLE");

    /**
     * @dev Função construtora que inicializa o contrato TesouroDireto.
     */
    constructor(string memory url) ERC1155(url) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORDER_TBRL, msg.sender);
        _grantRole(PAYMENT_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PRE_ORDER_ROLE, msg.sender);
        owner = msg.sender;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function setBondProperties(
        uint64 tokenID,
        uint64 tax,
        uint64 minTBRL,
        uint64 unitPriceBuy,
        uint64 unitPriceEarlyRedemption,
        uint64 expirationDate
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        bondsProperties[tokenID] = BondProperties(
            tax,
            minTBRL,
            unitPriceBuy,
            unitPriceEarlyRedemption,
            expirationDate
        );
    }

    function orderTokenByTBRL(uint64 tokenIDBase, uint64 amountTBRL) public {
        BondProperties memory bondProperties = bondsProperties[tokenIDBase];
        console.log("amountTBRL: %s", amountTBRL);
        console.log("minTBRL: %s", bondProperties.minTBRL);
        require(
            amountTBRL >= bondProperties.minTBRL,
            unicode"TesouroDireto: O valor de TBRL enviado é menor que o mínimo necessário."
        );
        require(
            bondProperties.unitPriceBuy != 0,
            unicode"TesouroDireto: O token não existe."
        );
        require(
            balanceOf(msg.sender, TBRL) >= amountTBRL,
            unicode"TesouroDireto: O usuário não tem saldo suficiente."
        );

        _burn(msg.sender, TBRL, amountTBRL);
        uint256 qtyToken = (amountTBRL * 1e8) / bondProperties.unitPriceBuy;
        console.log("qtyToken: %s", qtyToken);
        uint256 tokenId = generateTokenID(tokenIDBase, tokenSequence);
        console.log("tokenId: %s", tokenId);
        _mint(msg.sender, tokenId, qtyToken, "");
        tokenSequence++;
    }

    function orderTokenByETH(uint64 tokenIDBase) public payable {
        BondProperties memory bondProperties = bondsProperties[tokenIDBase];
        uint256 amountTBRL = (msg.value * ETH_BRL) / (1 ether);
        console.log("amountTBRL: %s", amountTBRL);

        require(
            amountTBRL >= bondsProperties[tokenIDBase].minTBRL,
            unicode"TesouroDireto: O valor de TBRL enviado é menor que o mínimo necessário."
        );
        require(
            bondsProperties[tokenIDBase].unitPriceBuy != 0,
            unicode"TesouroDireto: O token não existe."
        );

        uint256 qtyToken = (amountTBRL * 1e8) / bondProperties.unitPriceBuy;
        console.log("qtyToken: %s", qtyToken);
        uint256 tokenId = generateTokenID(tokenIDBase, tokenSequence);
        _mint(msg.sender, tokenId, qtyToken, "");
        tokenSequence++;
    }

    function getBondProperties(
        uint64 tokenIDBase
    ) public view returns (BondProperties memory) {
        return bondsProperties[tokenIDBase];
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override {
        require(
            amount > 0,
            unicode"TesouroDireto: A quantidade de tokens transferidos deve ser maior que zero."
        );
        require(
            balanceOf(from, id) >= amount,
            unicode"TesouroDireto: O usuário não tem saldo suficiente."
        );
        uint256 balanceTo = balanceOf(to, TBRL);
        require(
            balanceTo >= amount,
            unicode"TesouroDireto: O usuário não tem saldo suficiente."
        );
        TokenProperties storage token = tokensProperties[id];

        uint256 daysSince = (block.timestamp - token.lastPaidCustodyTimestamp) /
            86400;
        uint256 taxDay = (token.yearInterestRate) / 365;
        uint256 profit = (amount * token.unitPriceBuy * taxDay * 365) / 1e20;
        uint256 baseCustody = ((amount * token.unitPriceBuy) / 1e10) + profit;

        console.log(id);
        console.log("yearInterestRate: %s", token.yearInterestRate);
        console.log("amount: %s", amount);
        console.log("daysSince: %s", daysSince);
        console.log("taxDay: %s", taxDay);
        console.log("profit: %s", profit);
        console.log("baseCustody: %s", baseCustody);

        uint256 amountCustody = ((baseCustody * custodyFee) / 1e10);
        console.log("amountCustody: %s", amountCustody);
        uint256 balance = balanceOf(from, TBRL);

        if (balance < amountCustody) {
            uint256 amountCustodyTemp = (amount * taxDay * 365) / 1e10;
            console.log("amountCustodyTemp: %s", amountCustodyTemp);
            _burn(from, id, amountCustodyTemp);
            _mint(custodyAddress, TBRL, amountCustody, "");
            _safeTransferFrom(from, to, id, amount - amountCustodyTemp, data);
        } else {
            // transfere a custodia para o contrato de custodia
            _safeTransferFrom(from, custodyAddress, 0, amountCustody, data);
            _safeTransferFrom(from, to, id, amount, data);
        }
        tokensProperties[id].lastPaidCustodyTimestamp = block.timestamp;
    }


    function bidSellOrderToken(
        address from,
        uint256 tokenID,
        uint256 amount,
        uint256 unitPriceSell
    ) public {
        require(
            balanceOf(from, tokenID) >= amount,
            unicode"TesouroDireto: O usuário não tem saldo suficiente."
        );
        sellOrders[sellOrderSequence] = SellOrder(
            from,
            tokenID,
            amount,
            unitPriceSell
        );
        sellOrderSequence++;
        _safeTransferFrom(from, sellOrdersAdress, tokenID, amount, "");
    }

    function bidBuyOrderToken(
        address from,
        uint256 tokenIDBase,
        uint256 amount,
        uint256 unitPriceBuy
    ) public {
        require(
            balanceOf(from, TBRL) >= amount,
            unicode"TesouroDireto: O usuário não tem saldo suficiente."
        );
        buyOrders[buyOrderSequence] = BuyOrder(
            from,
            tokenIDBase,
            amount,
            unitPriceBuy
        );
        buyOrderSequence++;
        _safeTransferFrom(from, buyOrdersAdress, TBRL, amount, "");
    }

    function executeSellOrder(uint256 orderID, uint256 amount) public {
        SellOrder storage sellOrder = sellOrders[orderID];
        require(
            sellOrder.amount >= amount,
            unicode"TesouroDireto: A quantidade de tokens é maior que a quantidade da ordem."
        );
        uint256 totalTBRL = amount * sellOrder.unitPriceSell;
        require(
            balanceOf(msg.sender, TBRL) >= totalTBRL,
            unicode"TesouroDireto: O usuário não tem saldo suficiente."
        );
        TokenProperties storage token = tokensProperties[sellOrder.tokenID];
        uint256 amountIOF = Taxes.calculateIOF(token, amount, sellOrder.unitPriceSell);
        uint256 amountIR = Taxes.calculateIR(token, amount, sellOrder.unitPriceSell);

        _safeTransferFrom(
            sellOrdersAdress,
            sellOrder.seller,
            sellOrder.tokenID,
            amount,
            ""
        );
        safeTransferFrom(
            sellOrder.seller,
            msg.sender,
            sellOrder.tokenID,
            amount,
            ""
        );
        _burn(msg.sender, TBRL, totalTBRL);
        if (sellOrder.amount - amount == 0) {
            delete sellOrders[orderID];
        } else {
            sellOrders[orderID].amount = sellOrder.amount - amount;
        }
    }

    function executeBuyOrder(uint256 orderID, uint256 amount) public {
        BuyOrder storage buyOrder = buyOrders[orderID];
        require(
            buyOrder.amount >= amount,
            unicode"TesouroDireto: A quantidade de tokens é maior que a quantidade da ordem."
        );
        uint256 totalTBRL = amount * buyOrder.unitPriceBuy;
        require(
            balanceOf(msg.sender, buyOrder.tokenID) >= amount,
            unicode"TesouroDireto: O usuário não tem saldo suficiente."
        );
        _safeTransferFrom(
            buyOrdersAdress,
            buyOrder.buyer,
            TBRL,
            totalTBRL,
            ""
        );
        safeTransferFrom(
            buyOrder.buyer,
            msg.sender,
            buyOrder.tokenID,
            amount,
            ""
        );
        _burn(msg.sender, buyOrder.tokenID, amount);
        if (buyOrder.amount - amount == 0) {
            delete buyOrders[orderID];
        } else {
            buyOrders[orderID].amount = buyOrder.amount - amount;
        }
        
    }


    function redeemTesouroPreAfterMaturity(uint256 tokenID) public {
        TokenProperties storage token = tokensProperties[tokenID];
        require(
            token.tokenType == TESOURO_PRE,
            unicode"TesouroDireto: O token não é do tipo Tesouro Pre."
        );
        require(
            block.timestamp >= token.expirationDate,
            unicode"TesouroDireto: O título ainda não venceu."
        );

        uint256 balance = balanceOf(msg.sender, tokenID);
        require(
            balance > 0,
            unicode"TesouroDireto: O usuário não tem saldo suficiente."
        );

        uint256 amount = balance * 1000 * 1e8; // valor fixo para Tesouro Pre
        uint256 daysSince = (block.timestamp - token.lastPaidCustodyTimestamp) /
            86400;
        uint256 taxCustodyDay = (custodyFee) / 365;
        uint256 umountCustody = (amount * taxCustodyDay * daysSince) / 1e8;

        _mint(custodyAddress, TBRL, umountCustody, "");
        _burn(msg.sender, tokenID, balance);
        _mint(msg.sender, TBRL, amount - umountCustody, "");
    }

    function mint(
        address account,
        uint256 tokenID,
        uint256 amount,
        bytes memory data
    ) public onlyRole(MINTER_ROLE) {
        _mint(account, tokenID, amount, data);
    }

    function setIncomeTaxAddress(
        address newIncomeTaxAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        incomeTaxAddress = newIncomeTaxAddress;
    }

    function setIOFAddress(
        address newIOFAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        iofAddress = newIOFAddress;
    }

    function setCustodyAddress(
        address newCustodyAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        custodyAddress = newCustodyAddress;
    }

    function setCustodyFee(
        uint256 newCustodyFee
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        custodyFee = newCustodyFee;
    }

    function generateTokenID(
        uint256 tokenIdBase,
        uint256 seq
    ) public pure returns (uint256) {
        uint256 length = 0;
        uint256 temp = seq;

        while (temp > 0) {
            length++;
            temp /= 10;
        }

        return tokenIdBase * (10 ** length) + seq;
    }

    function setTokensProperties(
        uint256 tokenId,
        uint256 tokenType,
        uint256 yearInterestRate,
        uint256 buyTimestamp,
        uint256 lastPaidCustodyTimestamp,
        uint256 unitPriceBuy,
        uint256 expirationDate
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        tokensProperties[tokenId] = TokenProperties(
            uint64(tokenType),
            uint64(yearInterestRate),
            uint64(buyTimestamp),
            uint64(lastPaidCustodyTimestamp),
            uint64(unitPriceBuy),
            uint64(expirationDate)
        );
    }
}
