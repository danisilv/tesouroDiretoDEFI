import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { ITPFt } from "../typechain-types";
import { expect } from "chai";

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

let cnpjTesouroNacional = 12345678;
let cnpjBB = 98765432;

describe("TesouroDireto", function () {
	let dec = Math.pow(10, 8);
	async function deployFixture() {
		const [bancoCentral, tesouroNacional, bb, alice, bob, robber1] = await ethers.getSigners();
		const realTokenizadoSTN = await ethers.getContractFactory("RealTokenizado");
		const realTokenizadoBB = await ethers.getContractFactory("RealTokenizado");

		const realTokenizadoSTNContract = await realTokenizadoSTN.deploy(
			"Tesouro Direto",
			"BRL@"+cnpjTesouroNacional,
			tesouroNacional.address,
			bancoCentral.address,
			"TesouroNacional",
			cnpjTesouroNacional,
			tesouroNacional.address
		);

		const enableAccountRD = await ethers.getContractFactory("RealDigitalEnableAccount");
		const enableAccountRDContract = await enableAccountRD.deploy(realTokenizadoSTNContract.getAddress());

		const tpft = await ethers.getContractFactory("TPFt");
		const tpftContract = await tpft.deploy();

		const swapOneStepSTN = await ethers.getContractFactory("SwapOneStep");
		const swapOneStepSTNContract = await swapOneStepSTN.deploy(realTokenizadoSTNContract);

		// const enableTpft = await ethers.getContractFactory("TPFtAccessControl");
		// const enableTpftContract = await enableTpft.deploy(
		// );

		const realTokenizadoBBContract = await realTokenizadoBB.deploy(
			"Tesouro Direto",
			"BRL@CNPJ_BB",
			bb.address,
			bancoCentral.address,
			"BancoDoBrasil",
			cnpjBB,
			bb.address
		);

		const swapOneStepBB = await ethers.getContractFactory("SwapOneStep");
		const swapOneStepBBContract = await swapOneStepBB.deploy(realTokenizadoBBContract);

		const enableAccountBB = await ethers.getContractFactory("RealDigitalEnableAccount");
		const enableAccountBBContract = await enableAccountBB.deploy(realTokenizadoBBContract.getAddress());


		return {
			realTokenizadoSTNContract,
			realTokenizadoBBContract,
			enableAccountRDContract,
			tpftContract,
			swapOneStepSTNContract,
			swapOneStepBBContract,
			enableAccountBBContract,
			// enableTpftContract,
			bancoCentral,
			tesouroNacional,
			bb,
			alice,
			bob,
			robber1,
		};

		const swapOneStep = await ethers.getContractFactory("SwapOneStep");
		const swapOneStepContract = await swapOneStepSTN.deploy(realTokenizadoSTNContract);
	}
	it("should deploy", async function () {
		const { realTokenizadoSTNContract } = await deployFixture();
	});

	it("should mint", async function () {
		const { realTokenizadoSTNContract, tpftContract, enableAccountRDContract, tesouroNacional, alice, bancoCentral, bob } = await deployFixture();

		await realTokenizadoSTNContract.connect(tesouroNacional).enableAccount(alice.address);
		await realTokenizadoSTNContract.connect(tesouroNacional).enableAccount(bob.address);
		await realTokenizadoSTNContract.connect(tesouroNacional).mint(alice.address, cvalue(1000));
		await realTokenizadoSTNContract.connect(alice).transfer(bob.address, cvalue(1000));
		let tit1: ITPFt.TPFtDataStruct = {
			acronym: "PRE2024",
			code: "00001",
			maturityDate: new Date("2030-01-01").getTime() / 1000,
		};
		await tpftContract.allowTPFtMint(tesouroNacional.address);
		await tpftContract.allowDirectPlacement(tesouroNacional.address);
		await tpftContract.connect(tesouroNacional).createTPFt(tit1);
		await tpftContract.connect(tesouroNacional).mint(tesouroNacional.address, tit1, cvalue(1000));
		await tpftContract.connect(tesouroNacional).directPlacement(tesouroNacional.address, alice.address, tit1, cvalue(1000));
	});

	it("Should SwapOneStep", async function () {
		const {
			realTokenizadoSTNContract,
			realTokenizadoBBContract,
			swapOneStepBBContract,
			enableAccountBBContract,
			bb,
			tpftContract,
			enableAccountRDContract,
			tesouroNacional,
			alice,
			bancoCentral,
			bob,
		} = await deployFixture();

		console.log("alice", alice.address);
		console.log("bob", bob.address);
		console.log("bb", bb.address);
		console.log("swapOneStepBBContract", await swapOneStepBBContract.getAddress());


		await realTokenizadoBBContract.connect(bb).enableAccount(alice.address);
		await realTokenizadoBBContract.connect(bb).enableAccount(bb.address);
		await realTokenizadoBBContract.connect(bb).enableAccount(tesouroNacional.address);
		await realTokenizadoBBContract.connect(bb).mint(alice.address, cvalue(1000));
		await realTokenizadoBBContract.connect(bb).mint( bb.address, cvalue(10000000));

		await realTokenizadoSTNContract.connect(tesouroNacional).enableAccount(bob.address);
		await realTokenizadoSTNContract.grantRole(await realTokenizadoSTNContract.MINTER_ROLE(), swapOneStepBBContract.getAddress());	
		
		
		await realTokenizadoBBContract.connect(alice).approve(swapOneStepBBContract.getAddress(), cvalue(100));
    	await realTokenizadoBBContract.grantRole(await realTokenizadoBBContract.MOVER_ROLE(), swapOneStepBBContract.getAddress());	
		// // // await realTokenizadoBBContract.connect(bb).enableAccount(swapOneStepBBContract.getAddress());

		await swapOneStepBBContract.connect(alice).executeSwap(realTokenizadoBBContract, realTokenizadoSTNContract, bob.address, cvalue(100));

		expect(await realTokenizadoBBContract.balanceOf(alice.address)).to.equal(cvalue(900));
		expect(await realTokenizadoSTNContract.balanceOf(bob.address)).to.equal(cvalue(100));
	});
});
