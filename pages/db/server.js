const express = require("express");
const mysql = require("mysql2");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");
var multer = require('multer');
const cloudinary = require("cloudinary");
const { CloudinaryStorage } = require('multer-storage-cloudinary');
app.use(cors());
app.use(express.json());
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const db = mysql.createConnection({
    user: process.env.USER,
    host: process.env.HOST,
    password: "",
    database: process.env.DATABASE,
    
});




cloudinary.config({
    cloud_name: process.env.CLOUDNAME,
    api_key: process.env.APIKEY,
    api_secret: process.env.APISECRET,
});


const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'UserImages',
        allowedFormats: ['jpg', 'png']
    }
});

const multeri = multer({ storage: storage });


//creates transaction for deposit
app.post("/08c15154b781ad0c8ffb50eacc0ebd3f", (req, res) => {


    const user = req.body.wallet;
    const amount = req.body.amount;
    const refu = req.body.reference;




    const CreateTbl = "CREATE TABLE IF NOT EXISTS Transactions (id INT(255) UNSIGNED AUTO_INCREMENT PRIMARY KEY, User VARCHAR(255) NOT NULL,Amount VARCHAR(255) NOT NULL,Reference VARCHAR(255) NOT NULL,Confirmed TINYINT(2), reg_date TIMESTAMP )";
    db.query(CreateTbl, (err, result) => {
    });
        const checkData = "SELECT * FROM Transactions WHERE User= ? AND Reference = ? AND Amount = ? AND Confirmed=?"
        db.query(checkData, [user, refu, amount, false], (err, row) => {
            
            if (row.length > 0) {
                console.log(err);
            } else {
                const insData = "INSERT INTO Transactions (User,Amount,Reference,Confirmed) VALUES (?,?,?,?)";
                db.query(insData, [user, amount, refu,false], (err, result) => {
                    console.log("Transaction request done");

                });
            }
    });

  
      

  
});


// Add depo to db
app.post("/daf3634555a1791bd3eba85491708652", (req, res) => {
    const user = req.body.wallet;
    const amount = req.body.Bal;
    const refu = req.body.refId;
    const newImg="";
    console.log("user: " + user);
    console.log("amount: " + amount);
    console.log("refu: " + refu);

    const checkWallet = "SELECT * FROM Wallets WHERE UserWallet= ? ";

    db.query(checkWallet, [user], (err, userFound) => {
        console.log(userFound.length);

        if (userFound.length === 1) {
            const calcBal = Number(userFound[0].Bal) + Number(amount);
            const checkData = "SELECT * FROM Transactions WHERE User= ? AND Reference = ? AND Amount = ? AND Confirmed = ?";
            db.query(checkData, [user, refu, amount, false], (err, row) => {
                if (row.length === 1) {
                    const refreshDep = "UPDATE Wallets SET Bal= ? WHERE UserWallet= ? ";
                    db.query(refreshDep, [calcBal, user], (err, result) => {
                        if (!err) {
                            const updateTrans = "UPDATE Transactions SET Confirmed = ? WHERE User = ? AND Amount = ? AND Reference = ?";
                            db.query(updateTrans, [1, user, amount, refu], (err, result) => {
                                res.status(200).send({ message: "Transaction and wallet updated successfully!" });
                            });
                        }
                    });
                }
            });
        } else if (userFound.length === 0) {
            const checkDataFirst = "SELECT * FROM Transactions WHERE User= ? AND Reference = ? AND Amount = ? AND Confirmed = ?";
            db.query(checkDataFirst, [user, refu, amount, false], (err, row) => {
                console.log("Ekakerta rowit:" + row.length);
                if (row.length === 1) {
                    const refreshDepo = "INSERT INTO Wallets (UserWallet,Bal,UserImg) VALUES (?,?,?)";
                    db.query(refreshDepo, [user, amount,newImg], (err, result) => {
                        console.log("refreshdepo result: " + result);
                        if (!err) {
                            const updateTranss = "UPDATE Transactions SET Confirmed = ? WHERE User = ? AND Amount = ? AND Reference = ?";
                            db.query(updateTranss, [true, user, amount, refu], (err, result) => {
                                console.log(result);
                                if (result) {
                                    console.log("pitaspaivittaa transactioni");
                                    res.status(200).send({ message: "Transaction and wallet created successfully!" });
                                }
                            });
                        }
                    });
                }
            });
        } else {
            res.status(500).send({ message: "Server error" });
        }
    });
});


//check balance for withdraw
app.post('/checkBal', (req, res) => {
    const user = req.body.wallet;
    const amount = req.body.amount;

    const checkWalQuery = "SELECT Bal FROM Wallets WHERE UserWallet=?";
 
   


    // Using parameterized query to prevent SQL injection
    db.query(checkWalQuery, [user], (err, result) => {
        if (err) {
            console.error("Database query error:", err);
            res.status(500).send({ error: "Internal Server Error" });
            return;
        }

        if (result && result.length > 0) {
            const userBalance = result[0].Bal;

            // Using strict comparison (===) for better type checking
            if (userBalance >= amount) {
                // TODO: Implement MD5 logic here if needed
                res.send({ data: user });
            } else {
                res.send({ data: false });
            }
        } else {
            res.send({ data: false });
        }
    });
});

//update balance after withdraw
app.post('/updateBal', (req, res) => {
    const user = req.body.wallet;
    const amount = req.body.amount;

    
    const checkWalQuery = "SELECT Bal FROM Wallets WHERE UserWallet=?";
    const updateWalBalQuery = "UPDATE Wallets SET Bal = Bal - ? WHERE UserWallet=?";

    // Using parameterized query to prevent SQL injection
    db.query(checkWalQuery, [user], (err, result) => {
        if (err) {
            console.error("Database query error:", err);
            res.status(500).send({ error: "Internal Server Error" });
            return;
        }

        if (result && result.length > 0) {
            const userBalance = result[0].Bal;

            if (userBalance >= amount) {
                // Update the wallet balance
                db.query(updateWalBalQuery, [amount, user], (err, updateResult) => {
                    if (err) {
                        console.error("Database update error:", err);
                        res.status(500).send({ error: "Internal Server Error" });
                        return;
                    }

                    // Check if the update was successful
                    if (updateResult && updateResult.affectedRows > 0) {
                        // Withdrawal successful
                        res.send({ status: `${user}` });
                    } else {
                        // Withdrawal failed
                        res.send({ status: "Failed to update balance" });
                    }
                });
            } else {
                // Insufficient balance
                res.send({ status: "Insufficient balance" });
            }
        } else {
            // User not found
            res.send({ status: "User not found" });
        }
    });
});



//create game
app.post('/157fc6e66776bcf4c004e6d41f0f9524', (req, res) => {
    const gameId = req.body.gameName;

    const createGame = `CREATE TABLE IF NOT EXISTS Games (id INT(255) UNSIGNED AUTO_INCREMENT PRIMARY KEY,GameId INT(255) NOT NULL,User VARCHAR(255) NOT NULL,UserWallet VARCHAR(255) NOT NULL,UserPic VARCHAR(255), UserBetValue DECIMAL(6,2), FirstTicket DOUBLE(10,2),LastTicket DOUBLE(10,2),CurrentGamePrice DECIMAL (6,2),reg_date TIMESTAMP)`;
    db.query(createGame, (err, results) => {
        if (err) {
            console.log(err);
        }


    });
    

   

});
//place bet for jp
app.post('/placeBet', (req, res) => {
    const gameId = req.body.gameName;
    let user = req.body.player;
    const userBet = req.body.playerBet;
    const userWallet = req.body.player;

    const checkIfProfile = "SELECT UserWallet FROM Wallets WHERE UserWallet=?";
    db.query(checkIfProfile, [userWallet], (error, profileFound) => {
        if (error) {
            console.log(error);
            return res.status(500).send("Internal Server Error");
        }
        if (profileFound && profileFound.length === 0) {
            const createProfile = "INSERT INTO Wallets (UserWallet, Bal) VALUES (?, ?)";
            db.query(createProfile, [userWallet, userBet], (profileErr, created) => {
                console.log("toimi");
                if (profileErr) return res.status(500).send("Internal Server Error");

                if (created) {
                    betForGame();
                }
            });
        } else if (profileFound && profileFound.length > 0) {
            betForGame();
        }

        function betForGame() {
            const getNickNameQuery = "SELECT UserName FROM Wallets WHERE UserWallet=?";
            db.query(getNickNameQuery, [user], (err, nicknameResult) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Internal Server Error");
                }

                if (nicknameResult && nicknameResult.length > 0 && nicknameResult[0].UserName != null) {
                    const nicknameFromDB = nicknameResult[0].UserName;
                    user = nicknameFromDB;
                }

                const checkExistingBetQuery = "SELECT User FROM Games WHERE User = ? AND GameId = ?";
                db.query(checkExistingBetQuery, [user, gameId], (checkErr, checkResult) => {
                    if (checkErr) {
                        console.log(checkErr);
                        return res.status(500).send("Internal Server Error");
                    }

                    if (checkResult && checkResult.length > 0) {
                        return res.status(400).send("User has already placed a bet for the current game");
                    }

                    const searchImage = "SELECT UserImg FROM Wallets WHERE UserWallet=?";
                    db.query(searchImage, [userWallet], (imageErr, imageResult) => {
                        if (imageErr) {
                            console.log(imageErr);
                            return res.status(500).send("Internal Server Error");
                        }

                        if (imageResult && imageResult.length > 0) {
                            const userImg = imageResult[0].UserImg;
                            const insertNewGameQuery = `
                                INSERT INTO Games (GameId, User, UserWallet, UserPic, UserBetValue, FirstTicket, LastTicket, CurrentGamePrice)
                                SELECT ?, ?, ?, ?, ?, 10, 20, ? + IFNULL((SELECT MAX(CurrentGamePrice) FROM Games WHERE GameId = ?), 0)`;

                            const queryParams = [gameId, user, userWallet, userImg, userBet, userBet, gameId];

                            db.query(insertNewGameQuery, queryParams, (insertErr, insertResult) => {
                                if (insertErr) {
                                    console.log(insertErr);
                                    return res.status(500).send("Internal Server Error");
                                }

                               
                            });
                        } else {
                            return res.status(404).send("User not found");
                        }
                    });
                });
            });
        }
    });
});









//create info about current game
app.post('/b29661bad7f58361772583616a170a5b', (req, res) => {

    const gameId = req.body.gameName;
    const user = req.body.player;
    const userBet = req.body.playerBet;
    const gamePrice = req.body.currentGamePrice;
    const userWal = req.body.playerWallet;
    const userChance = Math.floor((userBet / gamePrice) * 100);

    const s = "SELECT COUNT(*) as count FROM Games WHERE GameId=?";
    db.query(s, [gameId],(erro, resu) => {
        console.log(erro);
      
        const count = resu[0].count;
        if (count > 1) {
            const updateFirstTicket = `UPDATE Games
SET FirstTicket = (SELECT LastTicket FROM Games WHERE id = (SELECT MAX(id) FROM Games) - 1),
    LastTicket = UserBetValue / 100 * 100;`;

            db.query(updateFirstTicket, (er, res) => {
                console.log(er);
               
            });
          

            const getIds = "SELECT LastTicket FROM Games WHERE id = (SELECT MAX(id) FROM Games)";
            db.query(getIds, (er, re) => {
                const create = "INSERT INTO Games (GameId,User,UserWallet,UserBetValue,FirstTicket,LastTicket,CurrentGamePrice) VALUES (?,?,?,?,(SELECT LastTicket FROM Games WHERE id = (SELECT MAX(id) FROM Games)),FirstTicket + ?,?)";
                console.log(re[0].LastTicket);
                db.query(create, [gameId, user, userWal, userBet ,userChance, gamePrice], (e, r) => {
                    console.log(e);

                });
            });
          
        } else {

            //if there are no rows
            const create = "INSERT INTO Games (GameId,User,UserWallet,UserBetValue,FirstTicket,LastTicket,CurrentGamePrice) VALUES (?,?,?,?,?,?,?)";
            db.query(create, [gameId, user, userWal, userBet, 0, userChance, gamePrice], (e, r) => {
                console.log(e);
            });
        }
        
  

    });
});
//get info about game
app.post('/getInfo', (req, res) => {
    const checkValuesQuery = "SELECT User, UserWallet,UserBetValue,UserPic, CurrentGamePrice FROM Games WHERE GameId=?";
    
    db.query(checkValuesQuery, [req.body.gameId], (err, rows) => {
        if (err) {
            console.log(err);
            res.status(500).send("Internal Server Error");
            return;
        }

        if (rows && rows.length > 0) {
            res.send(rows);
        } else {
            res.status(404).send("No data found for the specified GameId");
        }
    });
});

//check balance from user to bet
app.post('/a2324bdea32c21219c1c5b87c553abf7', (reque, resp) => {
    const getBal = "SELECT Bal FROM Wallets WHERE UserWallet=?";
    
    db.query(getBal, [reque.body.user], (error, response) => {
        if (error) {
            resp.send("error");
            console.log(error);

        } if (response.length > 0) {
            resp.send({ data: response[0].Bal });
        }
    })

});
//update balance after bet
app.post('/4c04af9d5d342446bed22ffed37ff71a', (req, resp) => {
    const updateBal = "UPDATE Wallets SET Bal= bal - ? WHERE UserWallet=?";

    db.query(updateBal, [req.body.playerBet,req.body.player], (error, response) => {
        if (error) {
            resp.send("error");
            console.log(error);

        } if (!error) {
            resp.send({ data:true });
        }
    })

});


app.post('/as', (req, res) => {
    const userWallet = req.body.userWallet;
    const newImg = req.body.newImg;
    let newName = req.body.newName;

    const checkUser = "SELECT * FROM Wallets WHERE UserWallet=?";
    db.query(checkUser, [userWallet], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ msg: "Internal server error" });
        }

        if (row && row.length === 0) {
            const newUser = "INSERT INTO Wallets (UserWallet, UserImg, UserName) VALUES (?, ?, ?)";
            db.query(newUser, [userWallet, newImg, newName], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send({ msg: "Internal server error" });
                }

                res.send({ msg: "Data updated" });
            });
        } else if (row && row[0].UserName === null) {
            let updateQuery = "UPDATE Wallets SET ";
            const updateParams = [];

            if (newImg !== "") {
                updateQuery += "UserImg=?";
                updateParams.push(newImg);
            }

            if (newName !== "") {
                if (newImg !== "") {
                    updateQuery += ", ";
                }
                updateQuery += "UserName=?";
                updateParams.push(newName);
            }

            updateQuery += " WHERE UserWallet=?";
            updateParams.push(userWallet);

            db.query(updateQuery, updateParams, (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send({ msg: "Internal server error" });
                }

                res.send({ msg: "Data updated" });
            });
        } else if (row[0].UserName !== null) {
            let updateImg = false;
            let updateName = false;

            if (newImg !== "") {
                updateImg = true;
            }

            if (newName !== "") {
                updateName = true;
            }

            if (updateImg || updateName) {
                const updateQuery = `UPDATE Wallets SET ${updateImg ? 'UserImg=?' : ''} ${updateImg && updateName ? ',' : ''} ${updateName ? 'UserName=?' : ''} WHERE UserWallet=?`;

                const updateParams = [];
                if (updateImg) updateParams.push(newImg);
                if (updateName) updateParams.push(newName);
                updateParams.push(userWallet);

                db.query(updateQuery, updateParams, (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send({ msg: "Internal server error" });
                    }

                    res.send({ msg: "Data updated" });
                });
            } else {
                res.send({ msg: "No valid data provided for update", data: false });
            }
        } else {
            res.send({ msg: "You have already changed your nickname", data: false });
        }
    });
});



app.post('/tes', (req, res) => {
    const name = req.body.currentName;

    const checkUser = "SELECT UserName FROM Wallets WHERE UserWallet=?";
    db.query(checkUser, [name], (err, row) => {

        if (row && row.length > 0) {
            res.send({data: row[0].UserName});
        } else {
            res.send({ data: "s" });
        }
    });


   
});
app.post('/kaikkibetit', (req, res) => {
    const name = req.body.wallet;
    const GameId = req.body.gameId;
    //todo: lis�t� db alku ja loppu tiketit
    const checkBets = "SELECT UserWallet,UserBetValue,UserChange,CurrentGamePrice FROM Games WHERE GameId=? ORDER BY id DESC";


    db.query(checkBets, [GameId], (err, row) => {

        if (row && row.length > 0) {
           /* const checkStake = "SELECT CurrentGamePrice AS GameStake FROM Games WHERE GameId=?";

            db.query(checkStake, [GameId], (err, stakeRow) => {
              
            });
         */
            console.log(row);
            res.send({ data: row });

        } else {
            res.send({ data: "s" });
        }
    });


   
});


app.post("/sendWinnerAmount",(req,res)=>{
    const winnerName=req.body.winner;
    const amount = req.body.winAmount;


    const updateWinner="UPDATE Wallets SET Bal=Bal+? WHERE UserWallet=?";

    db.query(updateWinner,[amount,winnerName],(err,result)=>{
        if(err)res.status(500).send({ msg: "Error updating tables" });

        if(result&&result.length>0){
            res.status(200).send({ msg: "Winner updated" });
            console.log("winnerGetBal");
        }
    });

});

app.listen(3002, () => {
    console.log("serverrunning");
})
