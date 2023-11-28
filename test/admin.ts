import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { TesouroModels } from "../typechain-types/contracts/TesouroDireto";

enum PaymentType {
	TBRL,
	ETH,
}

enum TokenType {
	PRE,
	PRE_SEM,
	IPCA,
	IPCA_SEM,
	RENDA,
	EDUCA,
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

describe("TesouroDireto", function () {
	let dec = Math.pow(10, 8);
	async function deployFixture() {
		const [owner, incomeAddress, iofAddress, custodyAddress, liquidityPoolsAddress, alice, bob, robber1] = await ethers.getSigners();
		const tesouroDireto = await ethers.getContractFactory("TesouroDireto");
		const drex = await ethers.getContractFactory("DREX");
		const drexContract = await drex.deploy();

		const tesouroContract = await tesouroDireto.deploy("http://localhost/{id}.json", drexContract.getAddress());
		return {
			tesouroContract,
			drexContract,
			owner,
			incomeAddress,
			iofAddress,
			custodyAddress,
			liquidityPoolsAddress,
			alice,
			bob,
			robber1,
		};
	}
	this.afterEach(async function () {});

	it("Should set Parameters", async function () {
		const { tesouroContract, drexContract, owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1 } = await loadFixture(deployFixture);
		expect(await tesouroContract.connect(owner).owner()).to.equal(owner.address);

		await tesouroContract.connect(owner).setIncomeTaxAddress(incomeAddress.address);
		expect(await tesouroContract.connect(owner).incomeTaxAddress()).to.equal(incomeAddress.address);

		//check if onwer has MINTER_ROLE
		expect(await tesouroContract.connect(owner).hasRole(await tesouroContract.MINTER_ROLE(), owner.address)).to.equal(true);
	});

	it("Should mint DREX", async function () {
		const { tesouroContract, drexContract, owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1 } = await loadFixture(deployFixture);
		await drexContract.mint(owner.address, cvalue(1000000));
		expect(await drexContract.balanceOf(owner.address)).to.equal(cvalue(1000000));
	});

	it("Should mint Token", async function () {
		const { tesouroContract, drexContract, owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1 } = await loadFixture(deployFixture);
		await drexContract.mint(owner.address, cvalue(1000000));

		let token: TesouroModels.BondPropertiesStruct = {
			tokenType: TokenType.PRE,
			yearexpiration: 2030,
			yearInterestRate: 10,
			minDREX: cvalue(30),
			unitPriceBuy: cvalue(100),
			buyTimestamp: Math.round(new Date().getTime() / 1000),
			expirationDate: Math.round(new Date(2030, 1, 1).getTime() / 1000),
		};

		await tesouroContract.connect(owner).mint(owner, 100, cvalue(1000), token);
		expect(await tesouroContract.connect(owner).balanceOf(owner, 1002030)).to.equal(cvalue(1000));
	});

	it("Should create a liquidity pool", async function () {
		const { tesouroContract, drexContract, owner, incomeAddress, iofAddress, custodyAddress, liquidityPoolsAddress, alice, bob, robber1 } =
			await loadFixture(deployFixture);
		await drexContract.mint(owner, cvalue(1000000));

		let token: TesouroModels.BondPropertiesStruct = {
			tokenType: TokenType.PRE,
			yearexpiration: 2030,
			yearInterestRate: 10,
			minDREX: cvalue(30),
			unitPriceBuy: cvalue(100),
			buyTimestamp: Math.round(new Date().getTime() / 1000),
			expirationDate: Math.round(new Date(2030, 1, 1).getTime() / 1000),
		};

		await tesouroContract.connect(owner).createLiquidtyPool(1002030, cvalue(100), cvalue(10));
		await tesouroContract.connect(owner).mint(owner, 100, cvalue(1000), token);
		expect(await tesouroContract.connect(owner).getLiquidtyPool(1)).to.be.deep.equal([1002030, 0, 0, 0, cvalue(100), cvalue(10)]);

		await drexContract.connect(owner).approve(tesouroContract.getAddress(), cvalue(1000000));
		await tesouroContract.connect(owner).addLiquidtyPool(1, cvalue(10));
		expect(await tesouroContract.connect(owner).getLiquidtyPool(1)).to.be.deep.equal([
			1002030,
			cvalue(1000),
			cvalue(10),
			cvalue(1000),
			cvalue(100),
			cvalue(10),
		]);
		expect(await tesouroContract.connect(owner).balanceOf(owner, 99900000001)).to.be.equal(cvalue(1000));

		// // adicionando liquidez com o usuaria alice
		await drexContract.mint(alice.address, cvalue(1000000));
		await drexContract.connect(alice).approve(tesouroContract.getAddress(), cvalue(1000000));
		await tesouroContract.connect(owner).safeTransferFrom(owner.address, alice.address, 1002030, cvalue(10), "0x");
		await tesouroContract.connect(alice).addLiquidtyPool(1, cvalue(5))
		expect(await tesouroContract.connect(owner).getLiquidtyPool(1)).to.be.deep.equal(
		  [1002030, cvalue(1500), cvalue(15), cvalue(1500), cvalue(100), cvalue(10)]);
		expect(await tesouroContract.connect(owner).balanceOf(alice, 99900000001)).to.be.equal(cvalue(500));
	});

	it("Should make Swaps", async function () {
		const { tesouroContract, drexContract, owner, incomeAddress, iofAddress, custodyAddress, liquidityPoolsAddress, alice, bob, robber1 } =
			await loadFixture(deployFixture);

		let token: TesouroModels.BondPropertiesStruct = {
			tokenType: TokenType.PRE,
			yearexpiration: 2030,
			yearInterestRate: 10,
			minDREX: cvalue(30),
			unitPriceBuy: cvalue(100),
			buyTimestamp: Math.round(new Date().getTime() / 1000),
			expirationDate: Math.round(new Date(2030, 1, 1).getTime() / 1000),
		};
		await drexContract.mint(owner, cvalue(10000 * 100));
		await drexContract.connect(owner).approve(tesouroContract.getAddress(), cvalue(10000 * 100));

		await tesouroContract.connect(owner).mint(owner, 100, cvalue(10000), token);
		await tesouroContract.createLiquidtyPool(1002030, cvalue(100), cvalue(0.01));
		await tesouroContract.connect(owner).addLiquidtyPool(1, cvalue(10000));

		//fazendo swap com alice (DREX => token)

		await drexContract.mint(alice.address, cvalue(10000));
		await drexContract.connect(alice).approve(tesouroContract.getAddress(), cvalue(10000));
		await tesouroContract.connect(alice).swap(1, cvalue(1000), false, cvalue(9.8));
		expect(await tesouroContract.connect(alice).balanceOf(alice, 1002030)).to.be.equal(989020869);
		expect(await drexContract.connect(owner).balanceOf(tesouroContract.getAddress())).to.be.equal(100100000000000);

		// agora fazendo swap token => drex
		await drexContract.connect(alice).approve(tesouroContract.getAddress(), cvalue(1000));
		await tesouroContract.connect(alice).swap(1, cvalue(1), true, cvalue(95));
		expect(await drexContract.connect(alice).balanceOf(alice.address)).to.be.equal(909918727874);
		expect(await tesouroContract.connect(alice).balanceOf(alice, 1002030)).to.be.equal(989020869 - 100000000);
	});
	it("Should swap ETH / DREX", async function () {
		const { tesouroContract, drexContract, owner, incomeAddress, iofAddress, custodyAddress, liquidityPoolsAddress, alice, bob, robber1 } =
			await loadFixture(deployFixture);
      await drexContract.mint(tesouroContract.getAddress(), cvalue(101));
	  await tesouroContract.connect(owner).setETH_BRL(cvalue(100))
	  await tesouroContract.connect(owner).swapETHToDREX({value: ethers.parseEther("1")});
	  expect(await drexContract.balanceOf(owner.address)).to.be.equal(cvalue(100));
 
	  
	});

});
