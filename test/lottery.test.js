const ganache = require("ganache");
const { Web3 } = require("web3");

const lotteryContractFile = require("../scripts/compile");
const bytecode = lotteryContractFile.evm.bytecode.object;
const abi = lotteryContractFile.abi;

const options = { logging: { quiet: true } };
const provider = ganache.provider(options);
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
            from: accounts[4],
            value: web3.utils.toWei("2.5", "ether"),
        });

        await lottery.methods.enter().send({
            from: accounts[3],
            value: web3.utils.toWei("0.62", "ether"),
        });

        const initialBalanceWei = await web3.eth.getBalance(lottery.options.address);
        const initialBalanceEth = web3.utils.fromWei(initialBalanceWei, "ether");
        console.log("initial balance Wei:", initialBalanceWei);
        console.log("initial balance Eth:", initialBalanceEth);

        await lottery.methods.pickWinner().send({ from: manager });

        const finalBalanceWei = await web3.eth.getBalance(lottery.options.address);
        const finalBalanceEth = web3.utils.fromWei(finalBalanceWei, "ether");
        console.log("final balance Wei:", finalBalanceWei);
        console.log("final balance Eth:", finalBalanceEth);

        expect(Number(initialBalanceWei)).toBe(Number(web3.utils.toWei("3.12", "ether")));
        expect(Number(initialBalanceEth)).toBe(3.12);
        expect(Number(finalBalanceWei)).toBe(Number(web3.utils.toWei("0", "ether")));
        expect(Number(finalBalanceEth)).toBe(0);
    });
});
