# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

## Funcionalidades
### Comprar Titulos com:
* Moeda nativa da rede, ex: Matic, ETH
* DREX , via contrato mockado ERC 20
* Pix diretamente

### Criar Pools de liquidez:
* token => ETH
* token => DREX
* taxa de swap: 0.2 %
* bloqueio de liquidez: 10 dias
* slipage: 0.5% -> 5%
* 1 LP => 1 token


### Tokens suportados
* Titulos Pré fixados
* Titulos Pós fixados
  * ICPA + tx
  * Titulo RENDA+
  * Titulo EDUCA+

### Codigo dos Tokens
* Titulos Pré fixados
  * 100 + ano vencimento
* Titulos Pós Fixados
  * 200 + ano vencimento + tx
