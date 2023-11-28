// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITesouroDireto {
    struct LiquidityPool {
        uint256 tokenA; // ID do token A (O token B é sempre o drex)
        uint256 totalSupplyLP; // Fornecimento total de tokens de liquidez
        uint256 reserveA; // Reserva do tokenA no pool
        uint256 reserveDREX; // Reserva do drex no pool
        uint256 initialPriceA; // Preço inicial do tokenA em DREX
        uint256 swapFee; // Taxa de swap
    }

    function createLiquidtyPool(
        uint256 tokenA,
        uint256 initialPriceA,
        uint256 swapFee
    ) external;
}
