const { Server } = require("socket.io");
const axios = require("axios");
const winnerHandler =require("./winnerHandler.js");
const io = new Server(5000, { perMessageDeflate: false, cors: { origin: ["http://localhost:3000"] }, });
let time =10;


let CurrentGameValue = 0;

let currentPlayers=0;
let timerOn=false;

let gameData=[];


const generateGameId=()=>{

    return Math.floor(1000 + Math.random() * 9000);
}
let GameId = generateGameId();
let newGameId=GameId;
const resetGame = () => {
    gameData = [];
    CurrentGameValue = 0;
    currentPlayers = 0;
    timerOn = false;

};
const timerFun = () => {
    if (timerOn) {
        let timer; // Declare timer outside the callback

            const pickWinnerAsync = async (ticket) => {
                
                const pickWinner = gameData.filter((winnerData) => ticket >= winnerData.firstTicket && ticket <= winnerData.lastTicket).map((winner) => winner.UserWallet);
                
                const res = await winnerHandler(CurrentGameValue,pickWinner.toString());
              
                console.log(res);
              
            
        };

        const timerCallback = () => {
            let min = Math.floor(time / 60);
            let sec = time % 60;

            sec = sec < 10 ? "0" + sec : sec;
            time--;

            io.sockets.emit('timer', { min: min, sec: sec });

            if (min == 0 && sec == 0) {
                const randomTicket = (Math.random() * 100).toFixed(4);
                const randomTime = Math.floor(Math.random() * 8) + 8;
                console.log("Ticket: " + randomTicket);
                
                if (GameId === newGameId) {
                    GameId = generateGameId();
                    newGameId = GameId;
                }
        

                time = 5;
                clearInterval(timer);

                io.sockets.emit("roll", { AniTime:randomTime,ticket: randomTicket,data:gameData});

                if (gameData.length > 0) {
                    
                    pickWinnerAsync(randomTicket);
                } else {
                    console.log("No players in the game to pick a winner.");
                }

                // Reset game data, value, players, etc.
                resetGame();
            }
        };

        timer = setInterval(timerCallback, 1000); // Use setInterval for repeating timer
    }
};



const loadStats = () => {
    axios.post("http://localhost:3002/getInfo", {
        gameId: GameId,
    })
    .then((response) => {
            try {
                const latestGamePrice = response.data[response.data.length - 1].CurrentGamePrice;
        
                let accumulatedTickets = 0;
                const precision = 10;
        
                // Assign tickets to each player based on their chance
                response.data.forEach((player, index) => {
                    const chance = (player.UserBetValue / latestGamePrice) * 100;
                    const FTicket = parseFloat(accumulatedTickets.toFixed(precision));
                    let LTicket;
        
                    if (index === response.data.length - 1) {
                        // For the last player, ensure the last ticket is always 100
                        LTicket = 100;
                    } else {
                        LTicket = parseFloat((accumulatedTickets + chance).toFixed(precision));
                    }
        
                    accumulatedTickets += chance;
                    const playerData = {
                        user:player.User,
                        UserWallet:player.UserWallet,
                        Pic: player.UserPic,
                        firstTicket: FTicket,
                        lastTicket: LTicket,
                        chance: parseFloat(chance.toFixed(precision)),
                    };
                    player.Chance=chance;
                    
                // Check if the UserPic is not already in the gameData array before adding
              
                const existingIndex = gameData.findIndex((data) => data.UserWallet === player.UserWallet);
                if (existingIndex !== -1) {
                    // Update existing entry in gameData
                    gameData[existingIndex] = playerData;
                } else {
                    // Add new entry to gameData
                    gameData.push(playerData);
                }
                


            });
            

            
            io.sockets.emit("gameInfo", { data: response.data, value: latestGamePrice });
            
            currentPlayers = response.data.length;
            
            if(!timerOn&&currentPlayers>=2){
                timerOn=true;
                timerFun();
            }

        } catch (error) {
            return;
        }

    })
    .catch((error) => {
        return;
        
    });
   
}






async function makeBet(user, userBetValue, currentGameValue, gameId) {
   console.log(time);
    try {
        if (userBetValue !== 0 && time >= 2) {
           
            // Create game info in the database
            await axios.post("http://localhost:3002/placeBet", {
                gameName: gameId,
                player: user,
                playerBet: userBetValue,
                currentGamePrice: currentGameValue,
            });
         
            console.log("After axios.post");
            
            // Execute the code directly here instead of in the finally block
            console.log("jiihaa");
            loadStats();
        }else if(time <= 2&&timerOn){

            console.log("testi");
            newGameId = generateGameId();
             // Create game info in the database
             await axios.post("http://localhost:3002/placeBet", {
                gameName: newGameId,
                player: user,
                playerBet: userBetValue,
                currentGamePrice: currentGameValue,
            });
         
       
           
            loadStats();
        }
    } catch (error) {
        console.error("Error in making bet:", error);
    }
}


io.on("connection", (socket) => {
    loadStats();
   
    socket.on("joinRoom", (user, userBetValue) => {
        socket.join("gameRoom");
        socket.nickname = user;
        
        
        CurrentGameValue += parseFloat(userBetValue);

        // Call makeBet function
        makeBet(user, userBetValue, CurrentGameValue, GameId);

       
    });
    
});

   

