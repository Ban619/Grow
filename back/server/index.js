const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const dotenv = require('dotenv')
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/grow'
})

const app = express()
app.use(cors())
app.use(express.json())

app.post('/api/save', async (req, res) => {
  const { player, state } = req.body
  if(!player) return res.status(400).json({error:'player required'})
  try{
    const now = new Date()
    const q = `INSERT INTO saves(player, data, updated_at) VALUES($1,$2,$3) ON CONFLICT (player) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`;
    await pool.query(q, [player, state, now])
    res.json({ok:true})
  }catch(e){console.error(e); res.status(500).json({error:'save failed'})}
})

app.get('/api/load', async (req, res) => {
  const { player } = req.query
  if(!player) return res.status(400).json({error:'player required'})
  try{
    const r = await pool.query('SELECT data FROM saves WHERE player=$1',[player])
    if(r.rowCount===0) return res.json({})
    res.json({ state: r.rows[0].data })
  }catch(e){console.error(e); res.status(500).json({error:'load failed'})}
})

const port = process.env.PORT || 4000
app.listen(port, ()=>console.log('Server listening on', port))
