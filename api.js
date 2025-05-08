//API

import express from "express";
import { pool } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

//POST /api/mqtt-data
app.post('/api/mqtt-data', async (req, res) => {
  console.log('⚙️  Incoming MQTT data:', req.body);
  console.log('Type of req.body:', typeof req.body);
  const {deviceid, topic, message } = req.body;

  if (!deviceid || !topic || !message ) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const sql = `
      INSERT INTO mqtt_data (deviceid, topic, message)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [deviceid, topic, message]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

app.get('/api/mqtt-data', async (req, res) => {
	console.log('⚙️  Incoming API request:', req.query);
	const { deviceId, startDate, endDate } = req.query;

	let sql = 'SELECT * FROM mqtt_data WHERE 1=1';
	const params = [];

	if (deviceId) {
			sql += " AND deviceid = ?";
			params.push(deviceId);
	}

	if (startDate) {
			sql += ' AND receivedtime >= ?' ;
			params.push(startDate);
	}

	if (endDate) {
			sql += ' AND receivedtime <= ?';
			params.push(endDate);
	}

	sql += ' ORDER BY id DESC';

	console.log('sql:',sql);

	try {
    const [result] = await pool.execute(sql, params);
    res.json(result);
  } 
	catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ error: err });
  }

	/*pool.execute(sql, params, (err, results) => {
		if (err) {
			console.error('❌ Error retrieving data:', err);
			return res.status(500).json({ error: 'Database error' });
		}
		res.json(results);
	});*/
});


// Start server
const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API listening on port ${PORT}`);
});
