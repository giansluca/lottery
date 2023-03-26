const assert = require("assert").strict;
const ganache = require("ganache-cli");

const provider = ganache.provider();
const Web3 = require("web3");
const web3 = new Web3(provider);

const lotteryContractFile = require("../scripts/compile");
const bytecode = lotteryContractFile.evm.bytecode.object;
const abi = lotteryContractFile.abi;

let accounts;
let lottery;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    lottery = await new web3.eth.Contract(abi).deploy({ data: bytecode }).send({ from: accounts[0], gas: "1000000" });
});

describe("Lottery", () => {
    it("should deploy a contract", () => {
        assert.ok(lottery.options.address);
    });

    it("should allow multiple accounts to enter", async () => {
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei("0.02", "ether"),
        });

        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei("0.02", "ether"),
        });

        await lottery.methods.enter().send({
            from: accounts[3],
            value: web3.utils.toWei("0.02", "ether"),
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[1],
        });

        assert.strictEqual(accounts[1], players[0]);
        assert.strictEqual(accounts[2], players[1]);
        assert.strictEqual(accounts[3], players[2]);
        assert.strictEqual(3, players.length);
    });

    it("should requires minimum amount of ether to enter", async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[1],
                value: 10,
            });
        } catch (e) {
            assert.ok(e);
            return;
        }

        assert.fail("Should not get here!");
    });

    it("should allow access to pickWinner only to manager", async () => {
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei("0.02", "ether"),
        });

        try {
            await lottery.methods.pickWinner().send({
                from: accounts[2],
            });
        } catch (e) {
            assert.ok(e);
            return;
        }

        assert.fail("Should not get here!");
    });

    it("should send money to the winners and reset the players array", async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei("2", "ether"),
        });

        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickWinner().send({ from: accounts[0] });
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const difference = finalBalance - initialBalance;

        assert(difference > web3.utils.toWei("1.8", "ether"));
    });
});
