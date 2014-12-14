var APIkey = "USFCOFHXTDXYNVRQ9";
var APIkey2 = "GWBBEFRRPJGVCMBCL";

// swapKeys();

function addToMessages(text) {
    $("#messages").append("<p>" + text + "</p>");
}

function log(text, printregarless) {
    if(!text) return;
    
    console.log(text);
    if(text.indexOf === undefined ) {
        // addToMessages(JSON.stringify(text));
    }
    else {
        if(text.indexOf("http") == -1 || printregarless) {
           addToMessages(text);
        }
    }
}

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
	
		var purl = "http://developer.echonest.com/api/v4/track/profile?api_key="+APIkey+"&format=json&id="+id+"&bucket=audio_summary"
		log(purl, true);
	
		var stupidPendingInterval = setInterval(function () {
	
			$.get("http://developer.echonest.com/api/v4/track/profile", {
				api_key: APIkey,
				format: "json",
				id: id,
				bucket: "audio_summary"
			}).done(function(trackData) {
			
				if (trackData.response.track.status === "complete") {
					
					var analysis_url = trackData.response.track.audio_summary.analysis_url;
					log(analysis_url);
			
					var audioSummary = trackData.response.track.audio_summary;	
				
					log("audioSummary of selected song:");
					log(audioSummary);
				
					setTimeout(function() {
						$.get(analysis_url).done(function(analysisData) {
							callback(audioSummary, analysisData);
							log(analysisData);
							// log(JSON.stringify(data));
							
							clearInterval(stupidPendingInterval);
							
						}).fail(function(){
							
							log("failed to get analysis data");
                            // log("<a href='" + purl + "'>CLICK HERE</a>", true);
                            $("#link").html("<a href='" + purl + "'>CLICK HERE</a>");
							swapKeys();
						});
					}, 5);
				
				}
				else {
					log("still waiting...");
					log(trackData);
					
					
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
			
			log("track.audioSummary");
			log(track.audioSummary);
			var NUM_RESULTS = 10;
			
			var searchUrl = "http://developer.echonest.com/api/v4/song/search?api_key="+APIkey+
			"&format=json&results=10&artist="+encodeURI(name) +
			"&min_tempo=" + (Math.round(track.audioSummary.tempo) - tempoThreshold) +
			"&max_tempo=" + (Math.round(track.audioSummary.tempo) + tempoThreshold);

			log("searchUrl = " + searchUrl);
			
			$.get(searchUrl, {
			// $.get("http://developer.echonest.com/api/v4/song/search", {
			// 	api_key: APIkey,
			// 	format: "json",
			// 	results: NUM_RESULTS,
			// 	artist: encodeURI(name),
			// 	min_tempo: Math.round(track.audioSummary.tempo) - tempoThreshold,
			// 	max_tempo: Math.round(track.audioSummary.tempo) + tempoThreshold,
			}).done(function(searchData) {
				
				log("searchData");
				log(searchData);
				
				if(searchData.response.songs.length > 0) {
					// var searchData.response.songs[0].
					var firstSong = searchData.response.songs[0];
					var query  = encodeURI(firstSong.title + "+artist:" + firstSong.artist_name);
					log("query = " + query);
					$.get("https://api.spotify.com/v1/search?q=" + query + "&type=track").done(function(spotifySearchData){
						log("spotifySearchData");
						log(spotifySearchData);
						
						var previewUrl = spotifySearchData.tracks.items[0].preview_url;
						var spotifyTrackId = spotifySearchData.tracks.items[0].id;
						var spotifyArtistId = spotifySearchData.tracks.items[0].artists[0].id;
			            
						
						getPreviewData(previewUrl, function(audioSummary, data) {
							log("done callback");
							nextTrack.data = data;
							nextTrack.audioSummary = audioSummary;
							nextTrack.spotifyTrackId = spotifyTrackId;
							nextTrack.spotifyArtistId = spotifyArtistId;
							
							log("WE HAVE TWO TRACKS!!!!");
							// getSimilarArtists(nextTrack);
							
							bufferLoader = new BufferLoader(context, playNextTrack);
				            bufferLoader.load(previewUrl);
							
						});
						
					});
				} 
                else {
                    log("no similar match found!!!");
                }
				
			});
			
		}
	});
}

function playNextTrack(buffer) {
    	
    nextTrack.source = context.createBufferSource();
    nextTrack.source.buffer = buffer;
    // nextTrack.source.connect(context.destination);
    nextTrack.source.start(0);
    nextTrack.source.playbackRate = 1;
    nextTrack.startingTime = context.currentTime;
    var gainNode = context.createGain();
    nextTrack.source.connect(gainNode); // Connect sine wave to gain node
	gainNode.gain.value = 0;
    gainNode.connect(context.destination);
    
	currentGainNode.gain.value = 1;
	nextGainNode.gain.value = 0;

}