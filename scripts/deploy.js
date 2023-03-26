const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const config = require("./config");

const lotteryContractFile = require("./compile");

const bytecode = lotteryContractFile.evm.bytecode.object;
const abi = lotteryContractFile.abi;

const provider = new HDWalletProvider({
    mnemonic: {
        phrase: config.wallet.phrase,
    },
    providerOrUrl: config.wallet.providerUrl,
});

const web3 = new Web3(provider);

async function deploy() {
    try {
        const accounts = await web3.eth.getAccounts();
        const account = accounts.find((account) => account === config.wallet.account);

        if (!account) throw new Error("no account");

        console.log("Attempting to deploy from account", account);

        const result = await new web3.eth.Contract(abi)
            .deploy({ data: bytecode })
            .send({ from: account, gas: "1000000" });

        console.log("Contract deployed", result.options.address);
    } catch (e) {
        console.log(e);
    }
}

(async function main() {
    await deploy();
})();
provider.engine.stop();
