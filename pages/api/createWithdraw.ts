import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { clusterApiUrl, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Message } from "@solana/web3.js"
import { NextApiRequest, NextApiResponse } from "next"
import { shopAddress } from "../../lib/address"
import { Keypair } from "@solana/web3.js";
import * as bs58 from "bs58";
import * as nacl from "tweetnacl";
import path from "path";
import dotenv from "dotenv";
import axios from 'axios';
function get(res: NextApiResponse<MakeTransactionGetResponse>) {
    res.status(200).json({
        label: "Solbet transaction",
        icon: "https://freesvg.org/img/1370962427.png",
    })
}

export type MakeTransactionInputData = {
    account: string,
    amount: number,
}
type MakeTransactionGetResponse = {
    label: string,
    icon: string,
}

export type MakeTransactionOutputData = {
   
    message: string,
}

type ErrorOutput = {
    error: string
}

async function post(
    req: NextApiRequest,
    res: NextApiResponse<MakeTransactionOutputData | ErrorOutput>
) {
    try {


        const network = WalletAdapterNetwork.Devnet
        const endpoint = clusterApiUrl(network)
        const connection = new Connection(endpoint)
        const { amount } = req.body as MakeTransactionInputData
        const { account } = req.body as MakeTransactionInputData

       
       
        dotenv.config({ path: path.resolve(__dirname, '../.env') });
        interface ENV {
            CONFIGTEXT: string | undefined;
           
        }

        interface Config {
            CONFIGTEXT: string;
         
        }
        const getConfig = (): ENV => {
            return {
                CONFIGTEXT: process.env.CONFIG_TEXT,
               
            };
        };
        const getSanitzedConfig = (config: ENV): Config => {
            for (const [key, value] of Object.entries(config)) {
                if (value === undefined) {
                    throw new Error(`ERROR404`);
                }
            }
            return config as Config;
        };

        const config = getConfig();

        const sanitizedConfig = getSanitzedConfig(config);

        const shopKey = Keypair.fromSecretKey(bs58.decode(sanitizedConfig.CONFIGTEXT))

        const buyer = new PublicKey(account)
        console.log(shopKey.publicKey);

        if (!account) {
            res.status(400).json({ error: "No account provided" })
            return
        }
      

        //transactioni
        let tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: shopKey.publicKey,
                toPubkey: buyer,
                lamports: amount * LAMPORTS_PER_SOL,
            })
        );
        //set feepayer
        tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
        tx.feePayer = shopKey.publicKey;

        const realDataToSign = tx.serializeMessage();

        //sign feepayer
        let feePayerSign = nacl.sign.detached(
            realDataToSign,
            shopKey.secretKey,
        );
      

        //sign 
        let verifybuyerSign = nacl.sign.detached.verify(
            realDataToSign,
            feePayerSign,
            shopKey.publicKey.toBytes(),
        );
        if (verifybuyerSign) {
           
            let recoverTx = Transaction.populate(Message.from(realDataToSign), [
                bs58.encode(feePayerSign),

            ]);
            const checkDb = await axios.post(process.env.DOMAIN+':3002/updateBal', {
                wallet: account.toString(),
                amount: amount,
            }).then(response => {
                if (response.data.status == account.toString()) {
                    return true;

                }
            });
            if (checkDb) {
                 

                const complete = await connection.sendRawTransaction(recoverTx.serialize())

                if (complete) {
                    res.status(200).json({
                        message: `Your ${amount}` + ` SOL withdraw has been completed`,
                    })
                }
            }else{
                res.status(200).json({
                    message:'Something went wrong with your withdraw',
                })
            }
           
        }
    } catch (err) {
        console.error(err);
        res.status(200).json({
            message:'Something went wrong with your withdraw',
        })

    }
} export default async function handler(
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