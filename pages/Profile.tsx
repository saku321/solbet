import axios from 'axios';

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import React, { useEffect, useCallback, useState } from "react";
export default function Profile() {

    const [name, SetName] = useState("");
    const { publicKey } = useWallet()
    const [pictureSrc, SetPictureSrc] = useState("");
    const [pictureFile, SetPictureFile] = useState("");
    const [alertMsg, SetAlertMsg] = useState("");

    
    const uploader = (userImg: File) => {
       
        const formData = new FormData();
        console.log(userImg);
        formData.append("file", userImg)
        formData.append("upload_preset", "z0gs48fd")
        formData.append("cloud_name", "dmaleysxe")

        /*
        axios.post("http://localhost:3002/test", {
            method: "post",
            body: formData,
        }).then((res) => {
            console.log(res);
        }).catch((err) => {
            console.log(err);
        });

        */
        try {
           fetch("https://api.cloudinary.com/v1_1/dmaleysxe/image/upload", {
                method: "post",
                body: formData
            }).then(resp => resp.json())
                .then(data => {
                    SetPictureSrc(data.url);
                })
        } catch (err: any) {
            console.log(err);
        }
        
    }

    
    const inputHandle = (e: any) => {
        const input = e.target as HTMLInputElement;

        if (!input.files?.length) {
            return;
        }

        const file = input.files[0];
        const size = file.size / 1024 / 1024
        if (size > 2) {
            alert("Your image is too big: "+size);
        } else {
            uploader(file);
        }

    }
    const updateDataToDb = () => {
          
            axios.post("http://localhost:3002/as", {
                newName: name,
                newImg: pictureSrc,
                userWallet: publicKey?.toString(),
            }).then((res) => {
                if (res.data.msg == "Data updated") {
                    window.location.reload();
                }
                if (!res.data.data) {
                SetAlertMsg(res.data.msg);
                }
            }).catch((err) => {
                console.log(err)
            });
        
    }
    console.log(alertMsg);
    return (
        <div>
            {pictureSrc != "" && (
                <img src={pictureSrc} />

            )}
            <input type="file" accept="image/*" id="imgUploader" onChange={inputHandle} />
            <input type="text" id="userName" onChange={(e)=>SetName(e.target.value)} />
            <button style={{ color: "white" }} onClick={updateDataToDb}>Update data</button>



        </div>
    )
}