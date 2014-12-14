var APIkey = "USFCOFHXTDXYNVRQ9";
var APIkey2 = "GWBBEFRRPJGVCMBCL";

function swapKeys() {
    var temp = APIkey;
    APIkey = APIkey2;
    APIkey2 = temp;
}

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
							
							clearInterval(stupidPendingInterval);
							
						}).fail(function(){
							
							console.log("failed to get analysis data");
							swapKeys();
						});
					}, 1000);
				
				}
				else {
					console.log("still waiting...");
					console.log(trackData);
					
					
				}
			});
		}, 3000);		
	});
}

function getSimilarArtists(track) {
	
	$.get("https://api.spotify.com/v1/artists/" + track.spotifyArtistId + "/related-artists").done(function(data) {
		if(data.artists.length > 0) {
			var uri = data.artists[0].uri;
			var name = data.artists[0].name;			
			var tempoThreshold = 0.1;
			
			console.log("track.audioSummary");
			console.log(track.audioSummary);
			var NUM_RESULTS = 10;
			
			var searchUrl = "http://developer.echonest.com/api/v4/song/search?api_key="+APIkey+
			"&format=json&results=10&artist="+encodeURI(name) +
			"&min_tempo=" + (Math.round(track.audioSummary.tempo) - tempoThreshold) +
			"&max_tempo=" + (Math.round(track.audioSummary.tempo) + tempoThreshold);

			console.log("searchUrl = " + searchUrl);
			
			$.get(searchUrl, {
			// $.get("http://developer.echonest.com/api/v4/song/search", {
			// 	api_key: APIkey,
			// 	format: "json",
			// 	results: NUM_RESULTS,
			// 	artist: encodeURI(name),
			// 	min_tempo: Math.round(track.audioSummary.tempo) - tempoThreshold,
			// 	max_tempo: Math.round(track.audioSummary.tempo) + tempoThreshold,
			}).done(function(searchData) {
				
				console.log("searchData");
				console.log(searchData);
				
				if(searchData.response.songs.length > 0) {
					// var searchData.response.songs[0].
					var firstSong = searchData.response.songs[0];
					var query  = encodeURI(firstSong.title + "+artist:" + firstSong.artist_name);
					console.log("query = " + query);
					$.get("https://api.spotify.com/v1/search?q=" + query + "&type=track").done(function(spotifySearchData){
						console.log("spotifySearchData");
						console.log(spotifySearchData);
						
						var previewUrl = spotifySearchData.tracks.items[0].preview_url;
						var spotifyTrackId = spotifySearchData.tracks.items[0].id;
						var spotifyArtistId = spotifySearchData.tracks.items[0].artists[0].id;
			            
						
						getPreviewData(previewUrl, function(audioSummary, data) {
							console.log("done callback");
							nextTrack.data = data;
							nextTrack.audioSummary = audioSummary;
							nextTrack.spotifyTrackId = spotifyTrackId;
							nextTrack.spotifyArtistId = spotifyArtistId;
							
							console.log("WE HAVE TWO TRACKS!!!!");
							// getSimilarArtists(nextTrack);
							
							bufferLoader = new BufferLoader(context, playNextTrack);
				            bufferLoader.load(previewUrl);
							
						});
						
					});
				} 
                else {
                    console.log("no similar match found!!!");
                }
				
			});
			
		}
	});
}

function playNextTrack(buffer) {
	
	currentTrack.source.stop();
	currentTrack = nextTrack;
	
    currentTrack.source = context.createBufferSource();
    currentTrack.source.buffer = buffer;
    currentTrack.source.connect(context.destination);
    currentTrack.source.start(0);
    currentTrack.source.playbackRate = 1;
    currentTrack.startingTime = context.currentTime;

    ///////////////////////////////////////////////////////////
    // this is where the meat of the bpm shit lives
    ///////////////////////////////////////////////////////////

    bpmIntverval = setInterval(function () {
        if(!currentTrack.data || currentTrack.source.playbackRate === 0) return;

        var trackTime = context.currentTime-currentTrack.startingTime;

        // $("body").css("background-color", "#000");
        currentTrack.data.beats.forEach(function(e) {
            if(Math.abs(trackTime - e.start) < 0.1) {
                // $("body").css("background-color", "#fff");
            }
        });
    }, 20);
}