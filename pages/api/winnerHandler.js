const { WalletAdapterNetwork } = require("@solana/wallet-adapter-base");
const { clusterApiUrl, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Message } = require("@solana/web3.js");
const { NextApiRequest, NextApiResponse } = require("next");

const { Keypair } = require("@solana/web3.js");
const bs58 = require("bs58");
const nacl = require("tweetnacl");
const path = require("path");
const dotenv = require("dotenv");
const axios = require('axios');

async function winnerHandler(amount, account) {
    try {
        const  mainAddress  ="D3z3634UdRFCdhYtgRr7AkXrwBBwr996vP7xQ4VoThaT";
        const network = WalletAdapterNetwork.Devnet;
        const endpoint = clusterApiUrl(network);
        const connection = new Connection(endpoint);

        dotenv.config({ path: path.resolve(__dirname, '../../.env') });
        const configText = process.env.CONFIG_TEXT;

        if (!configText) {
            throw new Error("CONFIG_TEXT not provided");
        }

        const shopKey = Keypair.fromSecretKey(bs58.decode(configText));
        const mainAdd = new PublicKey(mainAddress);

        if (!amount || !account) {
            return { error: "Invalid request parameters" };
        }
        const ourCommissionPercentage = 1;
        const winnerAmount = amount - (ourCommissionPercentage / 100) * amount;
        const ourCommission = amount * (ourCommissionPercentage / 100);
        const lamportsToSend = Math.floor(Number(ourCommission) * LAMPORTS_PER_SOL);

        console.log("ourcommi: "+ourCommission);
        console.log("lamabords: "+lamportsToSend);
        // Send commission to the main account
        let tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: shopKey.publicKey,
                toPubkey: mainAdd,
                lamports:lamportsToSend
            })
        );

        tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
        tx.feePayer = shopKey.publicKey;

        const realDataToSign = tx.serializeMessage();

        // Sign fee payer
        let feePayerSign = nacl.sign.detached(realDataToSign, shopKey.secretKey);

        // Verify fee payer signature
        let verifyFeePayerSign = nacl.sign.detached.verify(realDataToSign, feePayerSign, shopKey.publicKey.toBytes());

        if (!verifyFeePayerSign) {
            throw new Error("Fee payer signature verification failed");
        }

        // Populate and send the transaction
        let recoverTx = Transaction.populate(Message.from(realDataToSign), [bs58.encode(feePayerSign)]);
        const complete = await connection.sendRawTransaction(recoverTx.serialize());

        if (complete) {
            // Send the winner amount to the winner
            const response = await axios.post(process.env.DOMAIN + ":3002/sendWinnerAmount", {
                winAmount: winnerAmount,
                winner: account
            });

            if (response.status === 200) {
                return { message: 'Transaction successful' };
            } else {
                return { error: 'Failed to send the winner amount' };
            }
        }
    } catch (err) {
        console.error(err);
        return { error: 'Something went wrong' };
    }
}

module.exports =  winnerHandler;
