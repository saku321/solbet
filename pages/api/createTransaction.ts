import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { clusterApiUrl, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { NextApiRequest, NextApiResponse } from "next"
import { shopAddress } from "../../lib/address"
import axios from 'axios';
import dotenv from "dotenv";
import path from "path";
export type MakeTransactionInputData = {
    account: string,
    dataBal: number,
    refu: string,

}

type MakeTransactionGetResponse = {
    label: string,
    icon: string,
}

export type MakeTransactionOutputData = {
    transaction: string,
    ResdataBal: string,
}

type ErrorOutput = {
    error: string
}

function get(res: NextApiResponse<MakeTransactionGetResponse>) {
    res.status(200).json({
        label: "Solbet transaction",
        icon: "https://freesvg.org/img/1370962427.png",
    })
}

async function post(
    req: NextApiRequest,
    res: NextApiResponse<MakeTransactionOutputData | ErrorOutput>
) {
    try {
        // We pass the selected items in the query, calculate the expected cost
        const { dataBal } = req.body as MakeTransactionInputData
        dotenv.config({ path: path.resolve(__dirname, '../.env') });
        if (dataBal === 0) {
            res.status(400).json({ error: "Can't checkout with charge of 0" })
            return
        }

        // We pass the reference to use in the query
        const { refu } = req.body as MakeTransactionInputData
        if (!refu) {
            res.status(400).json({ error: "No reference provided" })
            return
        }

        // We pass the buyer's public key in JSON body
        const { account } = req.body as MakeTransactionInputData
        if (!account) {
            res.status(400).json({ error: "No account provided" })
            return
        }
        const buyerPublicKey = new PublicKey(account)
        const shopPublicKey = shopAddress

        const network = WalletAdapterNetwork.Devnet
        const endpoint = clusterApiUrl(network)
        const connection = new Connection(endpoint)

        // Get a recent blockhash to include in the transaction
        const { blockhash } = await (connection.getLatestBlockhash('finalized'))

        const transaction = new Transaction({
            recentBlockhash: blockhash,
            // The buyer pays the transaction fee
            feePayer: buyerPublicKey,
        })

        // Create the instruction to send SOL from the buyer to the shop
        const transferInstruction = SystemProgram.transfer({
            fromPubkey: buyerPublicKey,
            lamports: dataBal * LAMPORTS_PER_SOL,
            toPubkey: shopPublicKey,
        })

        // Add the reference to the instruction as a key
        // This will mean this transaction is returned when we query for the reference
        transferInstruction.keys.push({
            pubkey: new PublicKey(refu),
            isSigner: false,
            isWritable: false,
        })

        // Add the instruction to the transaction
        transaction.add(transferInstruction)

        // Serialize the transaction and convert to base64 to return it
        const serializedTransaction = transaction.serialize({
            // We will need the buyer to sign this transaction after it's returned to them
            requireAllSignatures: false
        })
        const base64 = serializedTransaction.toString('base64')

       
        //create table for deposit in database
        axios.post(process.env.DOMAIN+':3002/08c15154b781ad0c8ffb50eacc0ebd3f', {
            wallet: account.toString(),
            amount: dataBal.toString(),
            reference: refu.toString(),
        }).catch((err) => {
            console.log(err);
        });
        
       

      
        // Return the serialized transaction
        res.status(200).json({
            transaction: base64,
            ResdataBal: dataBal.toString(),
           
        })
    } catch (err) {
        console.error(err);

        res.status(500).json({ error: 'error creating transaction', })
        return
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<MakeTransactionGetResponse | MakeTransactionOutputData | ErrorOutput>
) {
    if (req.method === "GET") {
        return get(res)
    } else if (req.method === "POST") {
        return await post(req, res)
    } else {
        return res.status(405).json({ error: "Method not allowed" })
    }
}