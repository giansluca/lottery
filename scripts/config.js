const ENV = process.env.ENV || "dev";
if (ENV !== "prod") {
    require("dotenv").config();
}

const pkg = require("../package");

const config = {
    env: process.env.ENV || "local",
    app: {
        name: process.env.APP_NAME || "lottery",
        version: pkg.version,
        commit: process.env.APP_COMMIT,
    },
    wallet: {
        providerUrl: process.env.PROVIDER_URL,
        accountAddress: process.env.ACCOUNT_ADDRESS,
        accountSecretPhrase: process.env.ACCOUNT_SECRET_PHRASE,
    },
};

module.exports = config;
