import { useState } from 'react';

export default function DepoInput() {
    const [depoSum, setDepoSum] = useState(0);

    const changeDepoVal = (e: any) => {
        setDepoSum(e.target.value);
    }
    return (
        <div>
        <input placeholder="Deposit Amount" id="depoInput" autoComplete="off" onChange={changeDepoVal} />
            <br/>
        <button className="items-center px-20 rounded-md py-2 max-w-fit self-center bg-gray-900 text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" >Deposit</button>

        </div>

    )

}