var APIkey = "USFCOFHXTDXYNVRQ9";
var APIkey2 = "GWBBEFRRPJGVCMBCL";

function getPreviewData(previewURL, callback) {
	var goodURL = previewURL.replace("https", "http");
	
	$.post( "http://developer.echonest.com/api/v4/track/upload", { 
		api_key: APIkey, 
		url: goodURL, //"http://p.scdn.co/mp3-preview/ee420207228b4a0a5d44eaf4f85726b2feb614e0" 
	}).done(function( uploadData ) {
	
		var id = uploadData.response.track.id;
	
		var purl = "http://developer.echonest.com/api/v4/track/profile?api_key="+APIkey2+"&format=json&id="+id+"&bucket=audio_summary"
		console.log(purl);
	
		var stupidPendingInterval = setInterval(function () {
	
			$.get("http://developer.echonest.com/api/v4/track/profile", {
				api_key: APIkey2,
				format: "json",
				id: id,
				bucket: "audio_summary"
			}).done(function(trackData) {
			
				if (trackData.response.track.status === "complete") {
					
					var analysis_url = trackData.response.track.audio_summary.analysis_url;
					console.log(analysis_url);
			
					var audioSummary = trackData.response.track.audio_summary;	
				
					console.log("audioSummary of selected song:");
					console.log(audioSummary);
				
					setTimeout(function() {
						$.get(analysis_url).done(function(analysisData) {
							callback(audioSummary, analysisData);
							console.log(analysisData);
							// console.log(JSON.stringify(data));
						});
					}, 10);
				
					clearInterval(stupidPendingInterval);
				}
				else {
					console.log("still waiting...");
					console.log(trackData);
				}
			});
		}, 1000);		
	});
}

function getSimilarArtists(track) {
	
	$.get("https://api.spotify.com/v1/artists/" + track.spotifyArtistId + "/related-artists").done(function(data) {
		if(data.artists.length > 0) {
			var uri = data.artists[0].uri;
			var name = data.artists[0].name;			
			var tempoTreshold = 0.1;
			
			console.log("track.audioSummary");
			console.log(track.audioSummary);
			var NUM_RESULTS = 1;
			
			$.get("http://developer.echonest.com/api/v4/song/search", {
				api_key: APIkey,
				format: "json",
				results: NUM_RESULTS,
				artist: name,
				min_tempo: Math.round(track.audioSummary.tempo) - tempoTreshold,
				max_tempo: Math.round(track.audioSummary.tempo) + tempoTreshold,
			}).done(function(searchData) {
				console.log("searchData");
				console.log(searchData);
				if(searchData.response.songs.length > 0) {
					// var searchData.response.songs[0].
					var firstSong = searchData.response.songs[0];
					$.get("https://api.spotify.com/v1/search?q=Night%20Like%20This%20Dyro+artist:Laidback%20Luke&type=track", {
						q: firstSong.title + "+artist:" + firstSong.artist_name,
						type: "track"
					}).done(function(searchData){
						console.log("searchData");
						console.log(searchData);
					});
				}
				
			});
			
		}
	});
}