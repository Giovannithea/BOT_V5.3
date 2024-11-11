const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config();

class Sniper {
    constructor(config) {
        this.baseToken = config.baseToken;
        this.targetToken = config.targetToken;
        this.buyAmount = config.buyAmount;
        this.sellTargetPrice = config.sellTargetPrice;
        this.tokenData = config.tokenData;
        this.connection = new Connection(process.env.SOLANA_WS_URL, 'confirmed');
        this.K = config.tokenData.K;
    }

    setBuyAmount(amount) {
        this.buyAmount = amount;
    }

    setSellTargetPrice(price) {
        this.sellTargetPrice = price;
    }

    async watchPrice() {
        console.log(`Watching price for target token: ${this.targetToken}`);
        const intervalId = setInterval(async () => {
            const currentPrice = await this.getCurrentPrice(); // Replace with actual price fetching logic
            console.log(`Current price of ${this.targetToken}: ${currentPrice}`);
            if (currentPrice >= this.sellTargetPrice) {
                await this.sellToken();
                clearInterval(intervalId);  // Stop watching price after selling
            }
        }, 60000); // Check price every 60 seconds
    }

    async getCurrentPrice() {
        // Fetch the current liquidity pool balance from pcVault
        const currentBalance = await this.getLiquidityBalance(); // Replace with the actual logic
        return this.calculatePrice(currentBalance);
    }

    calculatePrice(currentBalance) {
        const X = this.K / currentBalance;
        const price = currentBalance / X;
        return price;
    }

    async getLiquidityBalance() {
        const pcVault = new PublicKey(this.tokenData.pcVault);
        const accountInfo = await this.connection.getAccountInfo(pcVault);
        if (accountInfo) {
            const balance = accountInfo.lamports / 10 ** 9; // Adjust if token has different decimal places
            return balance;
        }
        throw new Error(`Unable to fetch liquidity balance for pcVault ${this.tokenData.pcVault}`);
    }

    async buyToken() {
        console.log(`Buying ${this.buyAmount} of target token: ${this.targetToken}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate buy delay
        console.log(`Bought ${this.buyAmount} of ${this.targetToken}`);
    }

    async sellToken() {
        console.log(`Selling target token: ${this.targetToken} when price reaches: ${this.sellTargetPrice}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate sell delay
        console.log(`Sold ${this.targetToken} at target price: ${this.sellTargetPrice}`);
    }

    async subscribeToVault() {
        const pcVault = new PublicKey(this.tokenData.pcVault);
        this.connection.onAccountChange(pcVault, (accountInfo) => {
            const balance = accountInfo.lamports / 10 ** 9; // Adjust the denominator according to the token's decimal places
            console.log(`Updated balance for pcVault ${this.tokenData.pcVault}: ${balance}`);
            const price = this.calculatePrice(balance);
            console.log(`Calculated price based on updated balance: ${price}`);
        });
        console.log(`Subscribed to account changes for pcVault ${this.tokenData.pcVault}`);
    }
}

module.exports = Sniper;
