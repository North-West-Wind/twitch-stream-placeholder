import commandExists from "command-exists";
import "dotenv/config";
import express from "express";
import * as fs from "fs";
import fetch from "node-fetch";
import * as path from "path";
import { spawn } from "child_process";
import * as tmi from "tmi.js";

// Check ffmpeg availability
if (!commandExists("ffmpeg")) throw new Error("You need to install ffmpeg");

/**
 * Environment Variables:
 * - VIDEO: the absolute path to the video for looping
 * - CHANNEL: twitch channel to watch
 * - RTMP: rtmp key for streaming
 */
let pid: string | undefined;

const app = express();
app.use(express.json());

app.post("/", (req, res) => {
	switch (req.body.command) {
		case "start": {
			const ffmpeg = spawn("ffmpeg", ["-stream_loop", "-1", "-re", "-i", process.env.VIDEO!, "-vcodec", "libx264", "-b:v", "5M", "-acodec", "aac", "-b:a", "160k", "-f", "flv", process.env.RTMP!]);
			pid = ffmpeg.pid;
			console.log("Started ffmpeg as pid", pid);
			break;
		}
		case "stop": {
			if (!pid) console.log("Stream is not running");
			else {
				process.kill(pid, 9);
				pid = undefined;
				console.log("Killed stream");
			}
			break;
		}
	}
	res.sendStatus(200);
});

app.listen(4455, () => console.log("Listening at port 4455"));

// twitch bot (summatia)
const client = new tmi.Client({
	options: { debug: true },
	connection: {
		secure: true,
		reconnect: true
	},
	identity: {
		username: 'summatia',
		password: process.env.TWITCH_OAUTH_TOKEN
	},
	channels: ['northwestwindnww']
});

client.connect();

client.on("message", (channel, tags, message, self) => {
	if (self || tags.username != "northwestwindnww") return;
	switch (message.toLowerCase()) {
		case "!please-hold": {
			break;
		}
		case "!unhold": {
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

async function isLive() {
	const res = await fetch(`https://twitch.tv/${process.env.CHANNEL}`);
	if (!res.ok) throw new Error("Twitch says not ok");
	return (await res.text()).includes("isLiveBroadcast");
}