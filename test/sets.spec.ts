

import {
    loadFixture
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

enum PaymentType {
    TBRL,
    ETH
}

describe("TesouroDireto", function () {
    async function deployFixture() {
        const [owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1,] = await ethers.getSigners();
        const tesouroDireto = await ethers.getContractFactory("TesouroDireto");
        const contract = await tesouroDireto.deploy('http://localhost/{id}.json');
        await contract.connect(owner).setCustodyAddress(custodyAddress.address);
        return { contract, owner, incomeAddress, iofAddress, custodyAddress, alice, bob, robber1 };
    }
    describe("setIncomeTaxAddress", function () {
        it("Should set the income tax address correctly", async function () {
            const { contract, owner, incomeAddress } = await loadFixture(deployFixture);
            await contract.connect(owner).setIncomeTaxAddress(incomeAddress.address);
            expect(await contract.incomeTaxAddress()).to.equal(incomeAddress.address);
        });
    });

    describe("setIOFAddress", function () {
        it("Should set the IOF address correctly", async function () {
            const { contract, owner, iofAddress } = await loadFixture(deployFixture);
            await contract.connect(owner).setIOFAddress(iofAddress.address);
            expect(await contract.iofAddress()).to.equal(iofAddress.address);
        });
    });

    describe("setCustodyAddress", function () {
        it("Should set the custody address correctly", async function () {
            const { contract, owner, custodyAddress } = await loadFixture(deployFixture);
            await contract.connect(owner).setCustodyAddress(custodyAddress.address);
            expect(await contract.custodyAddress()).to.equal(custodyAddress.address);
        });
    });

    describe("setCustodyFee", function () {
        it("Should set the custody fee correctly", async function () {
            const { contract, owner } = await loadFixture(deployFixture);
            const newCustodyFee = 200000; // 2%
            await contract.connect(owner).setCustodyFee(newCustodyFee);
            expect(await contract.custodyFee()).to.equal(newCustodyFee);
        });
    });;

    describe("Access Control Tests", function () {
        // Teste para setIncomeTaxAddress
        describe("setIncomeTaxAddress", function () {
            it("Should only allow the owner to set the income tax address", async function () {
                const { contract, owner, incomeAddress, alice } = await loadFixture(deployFixture);

                // Tentativa de chamada por uma conta não autorizada (alice)
                await expect(contract.connect(alice).setIncomeTaxAddress(incomeAddress.address))
                    .to.be.reverted;

                // Chamada bem-sucedida pelo proprietário
                await expect(contract.connect(owner).setIncomeTaxAddress(incomeAddress.address))
                    .not.to.be.reverted;
                expect(await contract.incomeTaxAddress()).to.equal(incomeAddress.address);
            });
        });

        // Teste para setIOFAddress
        describe("setIOFAddress", function () {
            it("Should only allow the owner to set the IOF address", async function () {
                const { contract, owner, iofAddress, bob } = await loadFixture(deployFixture);

                // Tentativa de chamada por uma conta não autorizada (bob)
                await expect(contract.connect(bob).setIOFAddress(iofAddress.address))
                    .to.be.reverted;

                // Chamada bem-sucedida pelo proprietário
                await expect(contract.connect(owner).setIOFAddress(iofAddress.address))
                    .not.to.be.reverted;
                expect(await contract.iofAddress()).to.equal(iofAddress.address);
            });
        });

        // Teste para setCustodyAddress
        describe("setCustodyAddress", function () {
            it("Should only allow the owner to set the custody address", async function () {
                const { contract, owner, custodyAddress, robber1 } = await loadFixture(deployFixture);

                // Tentativa de chamada por uma conta não autorizada (robber1)
                await expect(contract.connect(robber1).setCustodyAddress(custodyAddress.address))
                    .to.be.reverted;

                // Chamada bem-sucedida pelo proprietário
                await expect(contract.connect(owner).setCustodyAddress(custodyAddress.address))
                    .not.to.be.reverted;
                expect(await contract.custodyAddress()).to.equal(custodyAddress.address);
            });
        });

        // Teste para setCustodyFee
        describe("setCustodyFee", function () {
            it("Should only allow the owner to set the custody fee", async function () {
                const { contract, owner, bob } = await loadFixture(deployFixture);
                const newCustodyFee = 200000; // 2%

                // Tentativa de chamada por uma conta não autorizada (bob)
                await expect(contract.connect(bob).setCustodyFee(newCustodyFee))
                    .to.be.reverted;

                // Chamada bem-sucedida pelo proprietário
                await expect(contract.connect(owner).setCustodyFee(newCustodyFee))
                    .not.to.be.reverted;
                expect(await contract.custodyFee()).to.equal(newCustodyFee);
            });
        });

    });
});



