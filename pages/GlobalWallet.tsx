import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Checkout from './checkout';
export default function GlobalWallet() {

    const { publicKey } = useWallet()



    return (
        <div>

            {publicKey == null && (
                <WalletMultiButton />
            )}
            {publicKey != null && (
                <Checkout user={publicKey}/>

            )}

        </div>
        )
}