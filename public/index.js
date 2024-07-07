let clicked = false;

setInterval(async () => {
	const res = await fetch("/api/status");
	if (res.ok) {
		const json = await res.json();
		if (!json.live) document.getElementById("button").classList.add("disabled");
	}

}, 1000);

document.getElementById("button").onclick = (evt) => {
	if (document.getElementById("button").classList.contains("disabled") || clicked) return;
}