var express = require('express');
var app = express()
const {
  v4: uuidv4
} = require('uuid')
const bcrypt = require('bcrypt')
const {sign}= require('jsonwebtoken')
var mysql = require("mysql");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const key="workindia"
app.use(bodyParser.urlencoded({ extended: false }));
const {checkToken}=require('./middleware/verifyToken')
var db = mysql.createConnection({
    host:'localhost',
    database:'userDB',//your database name
    user:'root',//your user name
    password:'password'//your user password
});
app.post('/api/admin/signup',async(req,res)=>{
    const {username,password}=req.body;
     const saltRounds = 10;
    const encryptedPassword = await bcrypt.hash(password, saltRounds)
    const userID=uuidv4()
    db.query(
        `INSERT INTO USER(username,password,userID) VALUES (?,?,?)`,[username,encryptedPassword,userID],(err,result)=>
        {
            if(err){
            console.log(err)
        }
        else{
            console.log(result)
            res.send({
                status:"Admin Account successfully created",
                "status_code": 200,
                "user_id": userID
            })
        }
    }
    )
})
// app.post('/createTeam',async(req,res)=>{
//     const teamID=uuidv4()
//     const name=req.body.name
//     db.query(
//         `INSERT INTO TEAM(team_ID,name) VALUES (?,?)`,[uuidv4(),name],(err,result)=>
//         {
//             if(err){
//             console.log(err)
//         }
//         else{
//             res.send({
//                 status:"Team Saved"
//             })
//         }
//     }
//     )
// })
app.post('/createTeam',async(req,res)=>{
    const teamID=uuidv4()
    const name=req.body.name
    db.query(
        `INSERT INTO TEAM(team_ID,name) VALUES (?,?)`,[uuidv4(),name],(err,result)=>
        {
            if(err){
            console.log(err)
        }
        else{
            res.send({
                status:"Team Saved"
            })
        }
    }
    )
})
app.post('/createPlayer',async(req,res)=>{
    const playerID=uuidv4()
    const { name, matches_played, runs, average, strike_rate } = req.body;
   console.log(req.body)
    db.query(
        `INSERT INTO player(player_id,name,matches_played,runs,average,strike_rate) VALUES (?,?,?,?,?,?)`,[playerID,name,matches_played,runs,average,strike_rate],(err,result)=>
        {
            if(err){
            console.log(err)
        }
        else{
            res.send({
                status:"Player Saved"
            })
        }
    }
    )
})
app.post('/api/matches',async(req,res)=>{
    const matchID=uuidv4()
    const { team_1,team_2,date,venue } = req.body;
    const dateObject = new Date(date);

// Format the date in MySQL format (YYYY-MM-DD)
const formattedDate = dateObject
   console.log(req.body)
    db.query(
        `INSERT INTO MATCHES(match_id,team_1,team_2,venue,date) VALUES (?,?,?,?,?)`,[matchID,team_1,team_2,venue,formattedDate],(err,result)=>
        {
            if(err){
            console.log(err)
        }
        else{
            res.send({
                message:"Match Created Successfully",
                match_id:matchID
            })
        }
    }
    )
})
app.get('/api/matches',async(req,res)=>{

    db.query(
        `SELECT * FROM Matches `,(err,result)=>
        {
            if(err){
            console.log(err)
        }
        else{
            res.send({
                matches:result
            })
        }
    }
    )
})
app.get('/api/matches/:matchID',async(req,res)=>{
    const {matchID}=req.params
    let squads=[]
    let team1={}
    let team2={}
    
    db.query(
        `SELECT * FROM Matches WHERE match_id=?`,[matchID],(err,result)=>
        {
            if(err){
            console.log(err)
        }
        else{
            console.log(result[0].team_1)
            db.query(
                `SELECT player_id,name FROM Player WHERE team_id=?`,[result[0].team_1],(err,result1)=>
                {
                    if(err){
                    console.log(err)
                }
                else{
                   squads[0]=result1
                   console.log(result1)
                }
            }
            )
            db.query(
                `SELECT player_id,name FROM Player WHERE team_id=?`,[result[0].team2],(err,result2)=>
                {
                    if(err){
                    console.log(err)
                }
                else{
                   team2=result2
                }
            }
            )
            // squads[0]=team1
            // squads[1]=team2
            res.send({
                result,
                squads
                
            })
        }
    }
    )
})
app.post('/api/teams/:teamID/squad',async(req,res)=>{
    const {teamID}=req.params
    const {playerName}=req.body
    db.query(
        `UPDATE player
        SET team_id = ?
        WHERE name = ?;
        `,[teamID,playerName],(err,result)=>
        {
            if(err){
            console.log(err)
        }
        else{
            res.send({
                message:"Player added to squad successfully"
            })
        }
    }
    )
    // db.query(
    //     `INSERT INTO PLAYER(team_ID,name) VALUES (?,?)`,[uuidv4(),name],(err,result)=>
    //     {
    //         if(err){
    //         console.log(err)
    //     }
    //     else{
    //         res.send({
    //             status:"Team Saved"
    //         })
    //     }
    // }
    // )
})
app.get('/app/sites/list/:userID',checkToken,async(req,res)=>{
    const {userID}=req.params;
    db.query(
        `SELECT text FROM Notes WHERE userID=?`,[userID],(err,result)=>
        {
            if(err){
            console.log(err)
        }
        else{
            res.send(result)
        }
    }
    )
})
app.post("/api/admin/login", async (req, res) => {
  const {username,password} = req.body;

  db.query(`SELECT password,userID FROM User WHERE username=?`, [username], async (err, result) => {
    console.log(result);
    if (err) {
      res.send({
        "code": 400,
        "failed": "error occurred",
        "error": err
      })
    } else {
      if (result) {
        console.log(result[0].userID)
        const comparison = await bcrypt.compareSync(password, result[0].password)
        if (comparison) {
          // console.log("Auth Success");
          const jsontoken=sign({result:result[0]},key,
            {
                expiresIn:"1h"
            }
            )
          res.send({
            "status": "Login successful",
            "status_code": 200,
            "user_id": result[0].userID,
            "access_token": jsontoken
          })
        } else {
          res.send({
            status:"declined"
          })
          // console.log("Declined");
        }
      }
    }
  })
})

app.listen(3000,function(){
    console.log("App listening on port 3000");
    db.connect(function(err){
        if(err){
            console.log(err);
        }else{
            console.log("Database connected");
        }
    })
})

app.post('/app/sites?userID',async(req,res)=>{
    const {username,password}=req.body;
     const saltRounds = 10;
    const encryptedPassword = await bcrypt.hash(password, saltRounds)

    db.query(
        `INSERT INTO USER(username,password,userID) VALUES (?,?,?)`,[username,encryptedPassword,uuidv4()],(err,result)=>
        {
            if(err){
            console.log(err)
        }
        else{
            res.send({
                status:"Account created"
            })
        }
    }
    )
})