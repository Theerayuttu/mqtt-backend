//API

import express, { request } from "express";
import cors from "cors";
import { pool } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
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
});

app.get('/api/summary', async (req, res) => {
	console.log('⚙️  Incoming API request:', req.query);
	const { deviceId, startDate, endDate } = req.query;

	let sql = `select count(distinct deviceid) as no_devices , count(*) as no_messages , count(distinct topic) as no_topic, 
		count(distinct JSON_EXTRACT(md.message,'$.position.protocol')) as no_protocol, 
		max(JSON_EXTRACT(md.message,'$.position.attributes.hours')) / 3600000  as totalhours, 
		max(JSON_EXTRACT(md.message,'$.position.attributes.totalDistance')) / 1000  as totalDistance, 
		max(JSON_EXTRACT(md.message,'$.position.attributes.odometer')) / 1000  as odometer, 
		max(JSON_EXTRACT(md.message,'$.position.speed'))  as maxspeed ,
		max(JSON_EXTRACT(md.message,'$.position.attributes.rpm'))  as rpm,
		max(JSON_EXTRACT(md.message,'$.position.attributes.coolantTemp'))  as temp,
		max(JSON_EXTRACT(md.message,'$.position.attributes.airPressure'))  as airPressure,
		max(JSON_EXTRACT(md.message,'$.position.attributes.engineLoad'))  as engineLoad,
		max(JSON_EXTRACT(md.message,'$.position.attributes.airTemp'))  as airTemp,
		max(JSON_EXTRACT(md.message,'$.position.attributes.airFlow'))  as airFlow,
		max(JSON_EXTRACT(md.message,'$.position.attributes.fuelConsumption'))  as Consumption,
		max(JSON_EXTRACT(md.message,'$.position.attributes.throttle'))  as throttle,
		max(JSON_EXTRACT(md.message,'$.position.attributes.power'))  as power
		FROM mqtt_data md WHERE 1=1`;
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

	console.log('sql:',sql);

	try {
    const [result] = await pool.execute(sql, params);
    res.json(result);
  } 
	catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ error: err });
  }
});


// Start server
const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API listening on port ${PORT}`);
});
