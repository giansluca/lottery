const ganache = require("ganache-cli");
const Web3 = require("web3");

const lotteryContractFile = require("../scripts/compile");
const bytecode = lotteryContractFile.evm.bytecode.object;
const abi = lotteryContractFile.abi;

const provider = ganache.provider();
const web3 = new Web3(provider);
let accounts;
let manager;
let lottery;

describe("Test contract", () => {
    beforeEach(async () => {
        accounts = await web3.eth.getAccounts();
        manager = accounts[0];
        lottery = await new web3.eth.Contract(abi).deploy({ data: bytecode }).send({ from: manager, gas: "1000000" });
    });

    it("should deploy a contract", () => {
        expect(lottery.options.address).toBeDefined();
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

        expect(accounts[1]).toBe(players[0]);
        expect(accounts[2]).toBe(players[1]);
        expect(accounts[3]).toBe(players[2]);
        expect(players.length).toBe(3);
    });

    it("should requires minimum amount of ether to enter", async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[1],
                value: web3.utils.toWei("0.0002", "ether"),
            });
        } catch (e) {
            expect(e).toBeDefined();
            return;
        }

        throw new Error("Should not get here!");
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
            expect(e).toBeDefined();
            return;
        }

        throw new Error("Should not get here!");
    });

    it("should send money to the winners and reset the players array", async () => {
        await lottery.methods.enter().send({
            from: manager,
            value: web3.utils.toWei("2", "ether"),
        });

        const initialBalance = await web3.eth.getBalance(manager);
        console.log("initial balance:", web3.utils.fromWei(initialBalance, "ether"));
        await lottery.methods.pickWinner().send({ from: manager });

        const finalBalance = await web3.eth.getBalance(manager);
        console.log("final balance:", web3.utils.fromWei(finalBalance, "ether"));

        const difference = Number(finalBalance) - Number(initialBalance);

        expect(difference).toBeGreaterThan(Number(web3.utils.toWei("1.8", "ether")));
    });
});
