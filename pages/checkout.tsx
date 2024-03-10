import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Keypair, Transaction, LAMPORTS_PER_SOL} from "@solana/web3.js";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import BackLink from "../components/BackLink";
import { MakeTransactionInputData, MakeTransactionOutputData } from "./api/createTransaction";
import { createQR, encodeURL, TransferRequestURLFields, findReference, validateTransfer, FindReferenceError, ValidateTransferError} from "@solana/pay";
import axios from 'axios';
import { SystemProgram } from "@solana/web3.js";
import { shopAddress } from "../lib/address";
import BigNumber from "bignumber.js";
import { io } from "socket.io-client";
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';


const socket = io("http://localhost:5000");

export default function Checkout() {
    
    
    const router = useRouter();
    const { connection } = useConnection();
    const { publicKey, sendTransaction } =useWallet()
    // State to hold API response fields
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [ReqDepoAmount, setReqDepoAmount] = useState<number>(0);
    const [ResDepoAmount, setResDepoAmount] = useState<number>(0);
    const [DepoStatus, setDepoStatus] = useState<boolean>(false);
    const [PlaceBetStatus, setPlaceBetStatus] = useState(false);
    // Generate the unique reference which will be used for this transaction
    const reference = useMemo(() => Keypair.generate().publicKey, []);
    
  
      
 
    
    // Use our API to fetch the transaction for the selected items
    async function getTransaction() {
        if (!publicKey) {
            return;
        }

        const body: MakeTransactionInputData = {
            account: publicKey.toString(),
            dataBal: ReqDepoAmount,
            refu: reference.toString(),
        }

        try {
            
            // Update the API endpoint based on your project structure
            const response = await fetch(`/api/createTransaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
            })

            const json = await response.json() as MakeTransactionOutputData;
            if (response.status !== 200) {
                console.error(json);
                return;
            }

            // Deserialize the transaction from the response
            const transaction = Transaction.from(Buffer.from(json.transaction, 'base64'));
            const newNumber = Number(json.ResdataBal);

            setResDepoAmount(newNumber);
            setTransaction(transaction);

        } catch (error) {
            console.error('Error fetching transaction:', error);
        }
    }
    useEffect(() => {
    

        // Send the fetched transaction to the connected wallet
        async function trySendTransaction() {
            if (!transaction) {
                return;
            }
    
            try {
                await sendTransaction(transaction, connection);
                console.log("laghetatransactioni");
                if(!PlaceBetStatus){
                    setPlaceBetStatus(true);
                    setDepoStatus(true);
                }
               
            } catch (e) {
                console.error(e);
                setPlaceBetStatus(false);
            }
        }
    
        // Call trySendTransaction when the transaction changes
        trySendTransaction();
    }, [transaction]);
    
    
    
    useEffect(() => {
        if (!PlaceBetStatus) {
            return;
            
        }
        else{
            const maxConfirmationAttempts = 120; // Adjust as needed
            let confirmationAttempts = 0;
            const interval = setInterval(async () => {
            try {
                const signatureInfo = await findReference(connection, reference, { finality: 'confirmed' });
                const confirmed = await connection.getSignatureStatus(signatureInfo.signature);
                
                if (confirmed && confirmed.value && confirmed.value.confirmations !== undefined && confirmed.value.confirmations !== null) {
                    if (confirmed.value.confirmations > 0) {
                        console.log(PlaceBetStatus);
                            if (ReqDepoAmount!=0) {
                                // Divide by 10^(number of decimals) to convert back to decimals before emitting
                                socket.emit("joinRoom", publicKey?.toString(), ReqDepoAmount);
                                
                             
                                setPlaceBetStatus(false);
                                console.log("toka:"+PlaceBetStatus);
                                clearInterval(interval);
                               
                               
                                
                            } else {
                                console.log("Insufficient funds. Please choose a lower bet amount.");
                                // or display a message to the user
                            }


                      
                        
                    }
                }
                confirmationAttempts += 1;
                if (confirmationAttempts >= maxConfirmationAttempts) {
                    console.log("Transaction not confirmed within the specified time.");
             
                    setPlaceBetStatus(false);
                    clearInterval(interval);
                }
            } catch (e) {
                if (e instanceof FindReferenceError) {
                    // No transaction found yet, ignore this error
                    return;
                }
                console.error('Unknown error', e);
            } 
        }, 1000);
       
        return () => {
            clearInterval(interval);
        }}
    }, [PlaceBetStatus, connection, reference, ResDepoAmount, publicKey]);
    
    
    


// render code unchanged

    if (!publicKey) {
        return (
            <div >
              


              <WalletMultiButton className="walletMultiBtn"/>
            </div>
        )
    }
 
  
    
    return (
        
        <div >

                <input placeholder="Bet value" type="number" onChange={(val: any) => setReqDepoAmount(val.target.value)} />

                <button
                    disabled={PlaceBetStatus}
                    className="bankBtn"
                    onClick={async () => {
                        await getTransaction();
                        
                    }}
                >
                   <b>PLACE BET</b></button>
        
        

        </div>
    )
}