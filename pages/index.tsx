
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { TimelineLite } from "gsap";
import React, { useEffect, useCallback, useState } from "react";
import { io } from "socket.io-client";
import axios from 'axios';
import WithdrawCheckout from './withdrawCheckout';
import Profile from './Profile';
import { PublicKey } from '@solana/web3.js';
import Cookies from 'js-cookie';
import Checkout from './checkout';
const socket = io("http://localhost:5000");



 

export default function HomePage() {
    interface Player {
        User:string;
        UserWallet:string,
        UserBetValue:string;
        UserPic: string;
        CurrentGamePrice:string,
        Chance:number;
        firstTicket: number;
        LastTicket: number;
        
        
    }interface PlayerData {
        Pic: string;
        user:string;

        firstTicket: number;
        lastTicket: number;
        // ... add other properties if needed
    }
       
    //todo: wallet need to be connected only once

    const { publicKey } = useWallet()
    const storedPublicKey = Cookies.get('publicKey');
    const initialPublicKey = storedPublicKey ? JSON.parse(storedPublicKey) : null;
   
  
    const [userWallet, setUserWallet] = useState(initialPublicKey);
    const [PlaceBetStatus, setPlaceBetStatus] = useState(false);

    const [playerImg, setPlayerImg] = useState([{
        pic: "https://iili.io/mBIXqP.jpg",
        name: "eka",
        FirstTicket: 0.00,
        LastTicket: 19.98,
    }, {
        pic: "http://res.cloudinary.com/dmaleysxe/image/upload/v1707556228/UserImages/welkx9lsuagtgfhvwvrn.jpg",
        name: "toka",
        FirstTicket: 19.99,
        LastTicket:29.99,
        },
        ]);

    const [playerChance, setPlayerChance] = useState(0);

    const [timerVal, setTimerVal] = useState("0:00");
    
    const [atStake, setAtStake] = useState(0);
    const [Deposits, setDeposits] = useState<Player[]>([]);
    
    const [userCurrentBalance, setUserCurrentBalance] = useState(0);

    const [depositPage, setDepositPage] = useState(false);
    const [withDrawPage, setWithDrawPage] = useState(false);
    const [profilePage, setProfilePage] = useState(false);

    const [gameIsOn, setGameIsOn] = useState(false);

    useEffect(() => {
        if (publicKey) {
          Cookies.set('publicKey', JSON.stringify(publicKey), { httpOnly: false });
          setUserWallet(publicKey);
        }
      }, [publicKey]);

      const loadGameInfo = async ()=>{
            socket.on("gameInfo", async function (data: { value: number; data: Player[] }) {
                console.log("lata");
                setAtStake(data.value);
                setDeposits(data.data);
                if (userWallet?.toString()) {
                    const foundDeposit = data.data.find(deposit => deposit.UserWallet === userWallet?.toString());
                    if (foundDeposit) {
                
                        const chanceValue = foundDeposit.Chance;
                        setPlayerChance(chanceValue);
                    }
                }
            
            });
       
    };
   
    console.log("latais");




    
  
  


   
    useEffect(() => {
    
            socket.on("connect", () => {
                
                console.log("connetasit");
              
                
            });
            socket.on("roll", function (data) {
                console.log(data);
                setGameIsOn(true);

                StartRoll(data.ticket,data.data,data.AniTime);

                
            });
           
            socket.on("timer", function (data) {

                setTimerVal(`${data.min}:${data.sec}`)
                loadGameInfo();
                if(timerVal.toString()>="0:02" || timerVal.toString()==="0:00"&&!gameIsOn){
                    loadGameInfo();
                }
            });

          
        

            
     /*       socket.on("gameInfo", function (data: { value: number; data: Player[] }) {
                setAtStake(data.value);
                setDeposits(data.data);
             console.log(data.data);
               
            
                const foundDeposit = data.data.find(deposit => deposit.User === publicKey?.toString());
                if (foundDeposit) {
                    console.log(foundDeposit);
                    const chanceValue = foundDeposit.Chance;
                    setPlayerChance(chanceValue);
                }
            });

            
       */
           
        
        }, []);


        
    
        
       
  
   // TweenMax.lagSmoothing(0);
    //const img = document.createElement('img');
    // img.src = "https://iili.io/ZXEC9R.png"
    const StartRoll = (pick:any,data:PlayerData[],aniTime:number) => {
      
        //  const t = document.getElementById("roller") as HTMLElement;
        const slider = document.getElementById("slider") as HTMLElement;

        // Check if the roller element already exists
        let cre = document.getElementById("roller") as HTMLElement;
    
        // If it doesn't exist, create a new one
        if (!cre) {
            cre = document.createElement("div") as HTMLElement;
            cre.id = "roller";
            slider.appendChild(cre);
        }
    
        // Clear existing content inside the roller
        cre.innerHTML = '';
  
          /*const im = document.createElement("img") as HTMLImageElement;
          im.src = "https://iili.io/ZXEC9R.png";
          im.alt = "kuva";
          im.id = "image";
          im.className = "rollerImg";*/
  
          
  
          //luo kuvat
        data.forEach(user => {
            if(user.Pic==null){
                user.Pic="";
            }
        });
        
        for (var i = 0; i < 300; i++) {
            const im = document.createElement("img") as HTMLImageElement;
            im.alt = "kuva";
            im.id = "image";
            im.className = "rollerImg";
            
            // const randomImg = Deposits[Math.floor(Math.random() * Deposits.length)].UserPic;
            
            const randomImg = data[Math.floor(Math.random() * data.length)].Pic;

           

            im.src = randomImg;
            
            cre?.append(im);
        }
        
        rollAni(pick,data,aniTime);
           
         
      
  
      }
  
     
      var tl = new TimelineLite();
      tl.eventCallback()
    
      const rollAni = (pick: any,data:PlayerData[],aniTime:number) => {
       
              const slider = document.getElementById("slider") as HTMLElement;
              const img = document.getElementById("image") as HTMLImageElement;

              const roller = document.getElementById("roller") as HTMLElement;
              setPlaceBetStatus(true);
              
              //valitsee voittajan
         
          
    

            // const te = playerImg.filter(resp => { if (pick > resp.FirstTicket && pick < resp.LastTicket) {return true} } ).map(elem => elem.pic);
       
            //const te = Deposits.filter(resp => { if (pick > resp.firstTicket && pick < resp.LastTicket) {return true} } ).map(elem => elem.UserPic);
            const te: { Pic: string; name: string }[] = data
            .filter((resp: PlayerData) => pick >= resp.firstTicket && pick <= resp.lastTicket)
            .map((elem: PlayerData) => ({ Pic: elem.Pic, name: elem.user }));

            console.log(te);

            pick = Math.max(1, Math.round(pick) + 10);

            const testiImg = document.getElementsByClassName("rollerImg")[pick - 1] as HTMLImageElement;

           
            testiImg.src = te[0].Pic;
  
  
             
              tl.kill();
           
              var offset = (slider.offsetWidth / 2) / (img.offsetWidth);
              var start = img.offsetWidth * offset;
              var range = Math.floor(Math.random() * (img.offsetWidth )) + 5;
             
              var position = range + ((pick - 1) * (img.offsetWidth + 10));
              tl.to(roller, 0, { css: { left: start + 250 } });
              tl.to(roller, aniTime, { css: { left: start - position }, onComplete: () => finish(pick,te[0].name) });
            

          }
  
      const finish = (pick: any,name:string) => {
        const roller = document.getElementById("roller") as HTMLElement;
  
        var winner = roller.children[pick - 1];
        const winnerIndex = pick - 1;
        
        const betList=document.getElementById("betsList") as HTMLElement;
        // Find the corresponding <li> element in the deposit list based on user name
        const winnerLi = Array.from(betList.querySelectorAll("ul li p")).find(
            (pElement) => pElement.textContent?.includes(name.slice(0,10))
        );
            console.log(winnerLi);
            console.log(name.slice(0,10));
        if (winnerLi) {
            // Add a class to the winner <li> element for styling
            winnerLi.parentElement?.classList.add("winner");
            

        }
  
        tl.to(winner, 0.5, { css: { zoom: 1.12, boxShadow: "0px 0px 10px yellow" } })
      
          setTimeout(async() => {
            
              roller.remove();
              setDeposits([]);
              setPlaceBetStatus(false);
              setAtStake(0.00);
              setPlayerChance(0);
              setGameIsOn(false);

          }, 8000);
         
      }
  
      const TestRol = () => {
        loadGameInfo();
      }
    

    return (
        <div>
            <div id="bankMenu">
                <ul className="walletMenuUl">
                    
                    <WalletMultiButton className="walletMultiBtn"/>
                    <br></br>
                    {publicKey != undefined && (
                        <p id="balanceTxt">Balance: {userCurrentBalance}</p>
                    )}
                    </ul>
              
                {profilePage && (
                    <Profile />

                )}
                {publicKey != undefined && !depositPage && !withDrawPage &&!profilePage && (
                    <ul>
                        <button
                            className="bankBtn"
                            onClick={() => setDepositPage(value=>!value)}>
                            <b>Deposit</b>
                            </button>
                        <br />
                        <button className="bankBtn" onClick={() => setWithDrawPage(value=>!value)}
                        ><b>Withdraw</b>
                        </button>
                            <button className="bankBtn" onClick={() => setProfilePage(value => !value)}
                        ><b>Profile</b>
                            </button>
                    </ul>
                )}

            </div>
            {!depositPage && !withDrawPage && !profilePage && (
                <div className="flex flex-col gap-8 max-w-4xl items-stretch m-auto pt-24">
                    <div id="mainBox">
                        <div id="Jproller">
                            <div id="slider">
                                <div id="stick">
                                </div>
                            </div>
                        </div>
                        <div id="timerTxt">
                            <h1><b>{timerVal}</b></h1>
                        </div>
                        <div id="potStats">
                            <h1>AT STAKE: <b>{atStake}</b></h1>
                        {/*<button style={{background:"white"}} onClick={TestRol}>testib</button>*/}

                        </div>

                        <div id="potControls">
                            <h1><b>CHANCE: <i>{playerChance.toFixed(2)}%</i></b></h1>

                            {Deposits.some((user) => user.UserWallet === publicKey?.toString())?(
                                <p>you have bet in</p>

                            ):(<Checkout/>)}
                        </div>

                        <div id="betsList">

                            <ul>
                                {Deposits.length > 0 && Deposits.map((depo, index) =>
                                    <li key={index} > <p>{depo.User.slice(0,10)} deposited {depo.UserBetValue} Sol</p></li>

                                )}
                            </ul>
                        </div>



                    </div>
                </div>
            )}
            </div>

          

  )
}
