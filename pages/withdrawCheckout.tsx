import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Keypair, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import BackLink from "../components/BackLink";
import { createQR, encodeURL, TransferRequestURLFields, findReference, validateTransfer, FindReferenceError, ValidateTransferError } from "@solana/pay";

import { MakeTransactionInputData, MakeTransactionOutputData } from "./api/createWithdraw";
import * as bs58 from "bs58";
import axios from 'axios';
export default function WithdrawCheckout() {

    const router = useRouter();
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    // State to hold API response fields
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [withdrawAmount, setWithdrawAmount] = useState<number>(0)
    const [withdrawStatus,setWithdrawStatus] = useState<boolean>(false)

    // Generate the unique reference which will be used for this transaction
    const reference = useMemo(() => Keypair.generate().publicKey, []);
  
    async function getTransfer() {

        if (!publicKey) return;

       
        const body: MakeTransactionInputData = {
            account: publicKey.toString(),
            amount: withdrawAmount,
        }
        const response = await fetch('/api/createWithdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        
        const json = await response.json() as MakeTransactionOutputData

        if (response.status !== 200) {
            console.error(json);
            return;
        }
        setTransaction(transaction);
        setMessage(json.message);
        setWithdrawStatus(true)
        window.location.reload();
        console.log(json.message)
    }
    const checkWithdraw = () => {
        try{
            axios.post('http://localhost:3002/checkBal', {
                wallet: publicKey?.toString(),
                amount: withdrawAmount,
            }).then(response => {
                if (response.data.data == publicKey?.toString()) {
                    getTransfer()
                } if(!response.data.data){
                    console.log("ei oorahaa");
                }
            });
        }catch(error){
            console.log(error);
        };
        
    }
    
  
    if (!publicKey) {
        return (
            <div className='flex flex-col gap-8 items-center'>
                <div><BackLink href='/'>Cancel</BackLink></div>

                <WalletMultiButton />

                <p>You need to connect your wallet to make withdraw</p>
            </div>
        )
    }
    const changeWithdrawAmount = (e: any) => {
        setWithdrawAmount(e.target.value)
    }
    return (
        <div className='flex flex-col gap-8 items-center'>

            <div>
                <button className="bankBtn" onClick={() => { window.location.reload(false); }}>Home</button>
            </div>

            {!withdrawStatus && publicKey && (
                <input placeholder="WithdrawAmount" autoComplete="off" id="WithDrawInput" onChange={changeWithdrawAmount} type="number" />
            )}
            {!withdrawStatus && publicKey && (
                <button disabled={withdrawAmount==0} className="items-center px-20 rounded-md py-2 max-w-fit self-center bg-gray-900 text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => {

                    checkWithdraw()

                }}>Withdraw {withdrawAmount} SOL</button>
            )}
            {message && (
                <p style={{color:"white"}}>{message} </p>
            )}

            </div>

        );

}