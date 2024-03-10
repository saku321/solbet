const mysql = require("mysql2");

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "",
    database: "SolBet",
});
db.connect(function (err) {
    if (err) throw err;
    console.log("connected");
})
module.exports = {
    connection: mysql.createConnection(db)
}