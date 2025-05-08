//Module Connect MQTT and Update data to database

import mqtt from "mqtt";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

//create connect MQTT Broker (via websocket server)
const client = mqtt.connect(process.env.MQTT_URL_WS);

client.on('connect',() => {
    console.log('▶️ Connected to MQTT Broker');

    //Subscribe Topic
    client.subscribe(process.env.MQTT_TOPIC, (err) => {
        if (err) console.log('Subscribe error: ', err);
        else console.log(`🔖 Subscribed to topic "${process.env.MQTT_TOPIC}"`);
    });
});

client.on('message', async (topic, payload) => {
    const message = payload.toString();
    const deviceid = JSON.parse(message).position?.deviceId;

    //body data
    const data = {
        deviceid,
        topic,
        message,
    };

    console.log('Message Data:', data );

    try {
        // Call API to post insert data
        const res = await axios.post(process.env.API_URL, data);
        console.log('➡️ Sent to API, status:', res.status);
    } catch (err) {
        console.error('❌ Error sending to API:', err.message);
    }

});

client.on('error', err => {
    console.error('🚨 MQTT Error:', err);
});


