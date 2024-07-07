import commandExists from "command-exists";
import "dotenv/config";
import express from "express";
import * as fs from "fs";
import { spawn } from "child_process";
import * as tmi from "tmi.js";

// Check ffmpeg availability
if (!commandExists("ffmpeg")) throw new Error("You need to install ffmpeg");

/**
 * Environment Variables:
 * - VIDEO: the absolute path to the video for looping
 * - CHANNEL: twitch channel to watch
 * - RTMP: rtmp url for streaming
 * - TWITCH_USERNAME: twitch bot username
 * - TWITCH_OAUTH_TOKEN: twitch bot oauth token
 */
// Check video
checkVideo(false);

// stream functions
let pid: number | undefined;
function start() {
	try {
		checkVideo();
		const ffmpeg = spawn("ffmpeg", ["-stream_loop", "-1", "-re", "-i", process.env.VIDEO!, "-vcodec", "libx264", "-b:v", "5M", "-acodec", "aac", "-b:a", "160k", "-f", "flv", process.env.RTMP!]);
		pid = ffmpeg.pid;
		console.log("Started ffmpeg as pid", pid);
	} catch (err) {
		console.error(err);
	}
}
function stop() {
	if (!pid) console.log("Stream is not running");
	else {
		process.kill(pid, 9);
		pid = undefined;
		console.log("Killed stream");
	}
}

const app = express();
app.use(express.json());

app.post("/", (req, res) => {
	switch (req.body.command) {
		case "start": {
			start();
			break;
		}
		case "stop": {
			stop();
			break;
		}
	}
	res.sendStatus(200);
});

app.listen(process.env.PORT || 4455, () => console.log("Listening..."));

// twitch bot (summatia)
const client = new tmi.Client({
	options: { debug: true },
	connection: {
		secure: true,
		reconnect: true
	},
	identity: {
		username: process.env.TWITCH_USERNAME,
		password: process.env.TWITCH_OAUTH_TOKEN
	},
	channels: [process.env.CHANNEL!]
});

client.connect();

client.on("message", (channel, tags, message, self) => {
	if (self || tags.username != process.env.CHANNEL || channel != process.env.CHANNEL) return;
	switch (message.toLowerCase()) {
		case "!please-hold": {
			start();
			client.say(channel, "Gotcha!");
			break;
		}
		case "!unhold": {
			stop();
			client.say(channel, "Fixed!");
			break;
		}
	}
});

function checkVideo(throwErr = true) {
	if (!process.env.VIDEO || !fs.existsSync(process.env.VIDEO) || fs.statSync(process.env.VIDEO).isDirectory()) {
		if (throwErr) throw new Error("Invalid video");
		else console.warn("Invalid video");
	}
}