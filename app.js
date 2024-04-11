const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
const app = express()
app.use(express.json())
let db = null

const initializeDbAndServer = async() => {
  try {
    db = await open({
      fileName: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

//API 1
const convertDbToResponseApi1 = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}
app.get('/players/', async (request, response) => {
  const getPLayersQuery = `SELECT * FROM player_details;`
  const allPlayers = await db.all(getPlayersQuery)
  response.send(
    allPlayers.map(eachPlayer => convertDbToResponseApi1(eachPlayer)),
  )
})

//API 2
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
  SELECT * FROM player_details WHERE player_id = ${playerId};`
  const getPlayer = await db.get(getPlayerQuery)
  response.send(convertDbToResponseApi1(getPlayer))
})

//API 3
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerQuery = `
  UPDATE player_details SET player_name = ${playerName} WHERE player_id = ${playerId};`
  const updatePlayer = await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

//API 4
const convertObjectToResponseApi4 = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchDetailsQuery = `
  SELECT * FROM match_details WHERE match_id = ${matchId};`
  const matchDetails = await db.get(getMatchDetailsQuery)
  response.send(convertObjectToResponseApi4(matchDetails))
})

//API 5


app.get('/players/:playerId/matches/', async (request, response)=>{
  const {playerId} = request.params;
  const getMatchDetails = `
  SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id = ${playerId};`;
  const matchDetails = await db.all(getMatchDetails);
  response.send(matchDetails.map((eachMatch)=>convertObjectToResponseApi4(eachMatch));
});

//API 6
app.get('/matches/:matchId/players/', async (request, response)=>{
  const {matchId} = request.params;
  const getPlayerDetails = `
  SELECT * FROM player_match_score NATURAL JOIN player_details WHERE match_id=${matchId};`;
  const playerDetails = await db.all(getPlayerDetails);
  response.send(playerDetails.map((eachPlayer)=>convertDbToResponseApi1(eachPlayer)))
})

//API 7
app.get('/players/:playerId/playerScores/', async (request, response)=>{
  const {playerId} = request.params;
  const getPlayerScored = `
  SELECT player_details.player_id AS playerId,
  player_details.player_name AS playerName,
  SUM(player_match_score.score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes FROM player_details INNER JOIN player_match_details ON 
  player_details.player_id = player_match_details.player_id;`;
const playerScore = await db.all(getPlayerScored);
response.send(playerScore);

})

module.exports = app;