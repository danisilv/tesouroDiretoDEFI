

import {
  loadFixture
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { BigNumberish } from "ethers";
import { ethers } from "hardhat";

enum PaymentType {
  TBRL,
  ETH
}

// Owner Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
// Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

// Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
// Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

// Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
// Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

// Account #3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (10000 ETH)
// Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6

// Account #4: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 (10000 ETH)
// Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a

// Account #5: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc (10000 ETH)
// Private Key: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba

// Account #6: 0x976EA74026E726554dB657fA54763abd0C3a0aa9 (10000 ETH)
// Private Key: 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e

// Account #7: 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955 (10000 ETH)
// Private Key: 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356
function cvalue(value: number): BigNumberish {
  return Math.round(value * Math.pow(10, 8));
}
/**
 * Arquivo de teste para o contrato TesouroNacional.
 * Testa as funções de preOrder, orderTokenByTBRL, mint, setIncomeTaxAddress, setCustodyAddress, setIOFAddress e setTranferRate.
 * Também testa as restrições de acesso e validações de parâmetros.
 * @filepath /Volumes/asgard/dev/solidity/hardhat/test/TesouroNacional.spec.ts
 */
describe("TesouroDireto", function () {
  let dec = Math.pow(10, 8);
  async function deployFixture() {
    const [owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1,] = await ethers.getSigners();
    const tesouroDireto = await ethers.getContractFactory("TesouroDireto");
    const contract = await tesouroDireto.deploy('http://localhost/{id}.json');
    await contract.connect(owner).setCustodyAddress(custodyAddress.address);
    await contract.connect(owner).setIncomeTaxAddress(incomeAddress.address);
    return { contract, owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1 };
  }
  this.afterEach(async function () {
  });

  it("Should set Parameters", async function () {
    const { contract, owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1 } = await loadFixture(deployFixture);
    expect(await contract.connect(owner).owner()).to.equal(owner.address);

    await contract.connect(owner).setIncomeTaxAddress(incomeAddress.address);
    expect(await contract.connect(owner).incomeTaxAddress()).to.equal(incomeAddress.address);

    await contract.connect(owner).setIOFAddress(iofAddress.address);
    expect(await contract.connect(owner).iofAddress()).to.equal(iofAddress.address);

    await contract.connect(owner).setCustodyAddress(custodyAddress.address);
    expect(await contract.connect(owner).custodyAddress()).to.equal(custodyAddress.address);

    //check if onwer has MINTER_ROLE
    expect(await contract.connect(owner).hasRole(await contract.MINTER_ROLE(), owner.address)).to.equal(true);

    let expirationDate = new Date(2030, 1, 1).getTime() / 1000;
    await contract.connect(owner).setBondProperties(102026, cvalue(10.63), cvalue(32.22), cvalue(805.67), cvalue(800), expirationDate)
    expect(await contract.connect(owner).getBondProperties(102026)).to.deep.equal([cvalue(10.63), cvalue(32.22), cvalue(805.67), cvalue(800), expirationDate]);

  });

  it("Shoud mint", async function () {
    const { contract, owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1 } = await loadFixture(deployFixture);
    await contract.connect(owner).mint(alice.address, 0, 100000000, "0x");
    expect(await contract.connect(alice).balanceOf(alice.address, 0)).to.equal(100000000);
  });

  it("Should order Token with TBRL", async function () {
    const { contract, owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1 } = await loadFixture(deployFixture);
    let expirationDate = new Date(2030, 1, 1).getTime() / 1000;
    let token1 = 1002026;
    // let token2 = 302029;


    await contract.connect(owner).setBondProperties(token1, cvalue(10), cvalue(10), cvalue(100), cvalue(80), expirationDate)
    await contract.connect(owner).mint(alice.address, 0, cvalue(1000), "0x");
    await contract.connect(alice).orderTokenByTBRL(token1, cvalue(100));
    expect(await contract.connect(alice).balanceOf(alice.address, 0)).to.equal(cvalue(900));
    expect(await contract.connect(alice).balanceOf(alice.address, 10020261)).to.equal(cvalue(1));

    await contract.connect(alice).orderTokenByTBRL(token1, cvalue(10));
    expect(await contract.connect(alice).balanceOf(alice.address, 0)).to.equal(cvalue(890));
    expect(await contract.connect(alice).balanceOf(alice.address, 10020262)).to.equal(cvalue(0.1));
    10000000000
  });
  it("Should order Token with ETH", async function () {
    const { contract, owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1 } = await loadFixture(deployFixture);
    let expirationDate = new Date(2030, 1, 1).getTime() / 1000;
    let token1 = 1002026;
    let token2 = 3002029
    await contract.connect(owner).setBondProperties(token1, cvalue(10), cvalue(10), cvalue(100), cvalue(80), expirationDate)

    // orderTokenByETH passando 1 eth como pagamento
    await contract.connect(alice).orderTokenByETH(token1, { value: ethers.parseEther("1") });
    expect(await contract.connect(alice).balanceOf(alice.address, 10020261)).to.equal(cvalue(1));

  });
  it("Should denny orders without ballance", async function () {
    const { contract, owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1 } = await loadFixture(deployFixture);
    let expirationDate = new Date(2030, 1, 1).getTime() / 1000;
    let token1 = 1002026;
    await contract.connect(owner).setBondProperties(token1, cvalue(10), cvalue(10), cvalue(100), cvalue(80), expirationDate)

    await contract.connect(owner).mint(alice.address, 0, cvalue(100), "0x");
    await expect(contract.connect(alice).orderTokenByTBRL(token1, cvalue(101))).to.be.reverted;

  });

  it("Should transfer token and pay custody with TBRL", async function () {
    const { contract, owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1 } = await loadFixture(deployFixture);
    let expirationDate = new Date(2030, 1, 1).getTime() / 1000;
    // subtract 1 year from today
    let buyDate = new Date();
    buyDate.setDate(buyDate.getDate() - 365);
    let buyDateUnix = Math.round(buyDate.getTime() / 1000);

    let token1 = 1002026;
    await contract.connect(owner).setCustodyFee(cvalue(10));
    await contract.connect(owner).setBondProperties(token1, cvalue(10), cvalue(10), cvalue(100), cvalue(80), expirationDate)
    await contract.connect(owner).mint(alice.address, 0, cvalue(5000), "0x");
    await contract.connect(alice).orderTokenByTBRL(token1, cvalue(1000));
    await contract.connect(owner).setTokensProperties(10020261, 100, cvalue(10), buyDateUnix, buyDateUnix, cvalue(100), expirationDate)
    expect(await contract.connect(alice).balanceOf(alice.address, 10020261)).to.equal(cvalue(10));

    await contract.connect(alice).safeTransferFrom(alice.address, bob.address, 10020261, cvalue(10), "0x");
    expect(await contract.connect(alice).balanceOf(alice.address, 10020261)).to.equal(0);

    expect(await contract.connect(custodyAddress).balanceOf(custodyAddress.address, 0)).to.be.equal(109999999);
  });

  it("Should transfer token and pay custody with token", async function () {
    const { contract, owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1 } = await loadFixture(deployFixture);
    let expirationDate = new Date(2030, 1, 1).getTime() / 1000;
    // subtract 1 year from today
    let buyDate = new Date();
    buyDate.setDate(buyDate.getDate() - 365);
    let buyDateUnix = Math.round(buyDate.getTime() / 1000);

    let token1 = 1002026;
    await contract.connect(owner).setCustodyFee(cvalue(10));
    await contract.connect(owner).setBondProperties(token1, cvalue(10), cvalue(10), cvalue(100), cvalue(80), expirationDate)
    await contract.connect(owner).mint(alice.address, 0, cvalue(1000), "0x");
    await contract.connect(alice).orderTokenByTBRL(token1, cvalue(1000));
    await contract.connect(owner).setTokensProperties(10020261, 100, cvalue(10), buyDateUnix, buyDateUnix, cvalue(100), expirationDate)
    expect(await contract.connect(alice).balanceOf(alice.address, 10020261)).to.equal(cvalue(10));

    await contract.connect(alice).safeTransferFrom(alice.address, bob.address, 10020261, cvalue(10), "0x");

    expect(await contract.connect(alice).balanceOf(alice.address, 10020261)).to.equal(0);
    expect(await contract.connect(custodyAddress).balanceOf(custodyAddress.address, 0)).to.be.equal(109999999);
    expect(await contract.connect(bob).balanceOf(bob, 10020261)).to.be.equal(1000000000 - 99999999);



  });

  it("Should reddem token", async function () {
    // const { contract, owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1 } = await loadFixture(deployFixture);
    // let buyDate = new Date(2022, 10, 14).getTime() / 1000;
    // let expDate = new Date(2023, 10, 14).getTime() / 1000;
    // let token1 = 102026;
    // let tax = 1000; // 10% ao ano
    // let unitPrice = 100000; // 1000 reais
    // let minValue = 3222;
    // await contract.connect(owner).setBondProperties(token1, tax, minValue, unitPrice, expDate)
    // //102026 001000 000100000 1668394800
    // let tokenId = BigInt("102026001000000100000" + buyDate);
    // await contract.connect(owner).setCustodyFee(20); // 0.2%
    // await contract.connect(owner).mint(alice.address, tokenId, 100, "0x");
    // await contract.connect(alice).redeemFixedRateBondAfterMaturity(102026, tokenId);
    // expect(await contract.connect(alice).balanceOf(alice.address, tokenId)).to.equal(0);
    // expect(await contract.connect(alice).balanceOf(alice.address, 0)).to.equal(85300);
    // expect(await contract.connect(alice).getBondsByAddress(alice.address)).to.deep.equal([]);

    // expect(await contract.connect(incomeAddress).balanceOf(incomeAddress.address, 0)).to.equal(14700);
    // expect(await contract.connect(custodyAddress).balanceOf(custodyAddress.address, 0)).to.equal(1999);


  });

});



