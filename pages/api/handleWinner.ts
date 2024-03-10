import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Message } from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";
import { mainAddress } from "../../lib/address";
import { Keypair } from "@solana/web3.js";
import * as bs58 from "bs58";
import * as nacl from "tweetnacl";
import path from "path";
import dotenv from "dotenv";
import axios from 'axios';

// handleWinner.ts
export default async function handleWinner(amount: number, account: string): Promise<any> {
  // Your implementation...


    try {
      const network = WalletAdapterNetwork.Devnet;
      const endpoint = clusterApiUrl(network);
      const connection = new Connection(endpoint);
  
      dotenv.config({ path: path.resolve(__dirname, '../.env') });
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
  
      // Send commission to the main account
      let tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: shopKey.publicKey,
          toPubkey: mainAdd,
          lamports: ourCommission * LAMPORTS_PER_SOL,
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