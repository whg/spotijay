
var context;
var contextClass = (window.AudioContext || 
        window.webkitAudioContext || 
        window.mozAudioContext || 
        window.oAudioContext || 
        window.msAudioContext);
if (contextClass) {
    // Web Audio API is available.
    context = new contextClass();
} else {
    // Web Audio API is not available. Ask the user to use a supported browser.
}
var bufferLoader;
var bpmInterval = null;

var currentGainNode = context.createGain();
currentGainNode.connect(context.destination);

var nextGainNode = context.createGain();
nextGainNode.connect(context.destination);

function Track() {
	this.source = null;
    this.startingTime = 0;
    this.data = null;
    this.artistId = "";
    this.audioSummary = null;
    this.spotifyArtistId;
    this.spotifyTrackId;
	
}

var currentTrack = new Track();
var nextTrack = new Track();


////////////////////////////////////////////////
// callbacks 
function loadInTrackData(track, data) {
    log("done callback");
    track.data = data;
}

function cueNextTrack() {
	
}

var nbarsTogether = 0;
var PLAY_TOGETHER = 4;

function play(souce, startTime, offset, duration, gain) {



  // startTime = context.currentTime;
  var source = context.createBufferSource();
  // Connect graph
  source.buffer = souce.buffer;
  // source.loop = true;
  // source.connect(context.destination);

	source.connect(gain);

  // Start playback, but make sure we stay in bound of the buffer.
  // currentTrack.startingTime = context.currentTime;
  source.start(startTime, offset, duration);

  if(souce) souce.stop(0);

  souce = null;
  souce = source;

}

function go() {
	
    // currentTrack.source.start(0);
    // currentTrack.source.connect(context.destination);
    // currentTrack.source.backRate = 1;
    // currentTrack.startingTime = context.currentTime;
	
	// play(currentTrack.source, 0, currentTrack.data.beats[0].start);
	
    // var gainNode = context.createGain();
    // currentTrack.source.connect(gainNode); // Connect sine wave to gain node
    // gainNode.connect(context.destination); // Connect gain node to speakers

    document.getElementById('volume').addEventListener('change', function () {
        gainNode.gain.value = this.value;
    });

    ///////////////////////////////////////////////////////////
    // this is where the meat of the bpm shit lives
    ///////////////////////////////////////////////////////////

	if(bpmInterval !== null) clearInterval(bpmInterval);
	log(currentTrack.data.bars[1].duration);
	
	var eightbars = 0;
	for(var i = 0; i < 2; i++) {
		eightbars+= currentTrack.data.bars[0+i].duration;
	}
	
	log("eightbars = " + eightbars);
	
    bpmInterval = setInterval(function () {
        if(!currentTrack.data || currentTrack.source.backRate === 0) return;

		//         var trackTime = context.currentTime-currentTrack.startingTime;
		// 
		// var bar1 = currentTrack.data.beats[1];
		// var bar8 = currentTrack.data.beats[3];
		// // log(trackTime + " " + bar8.start + " diff = " + Math.abs(trackTime - (bar8.start + bar8.duration)));
		// if (Math.abs(trackTime - (bar8.start)) < 0.01) {
		//     // currentTrack.source.start(context.currentTime+bar1.start);
		// 	currentTrack.source.stop();
		// 	play(currentTrack.source.buffer, (bar8.start - bar1.start));
		// 	log("looped");
		// }
		
		// if(currentTrack.source) currentTrack.source.stop();
		play(currentTrack.source, 0, currentTrack.data.bars[0].start, eightbars, currentGainNode);
	    // currentTrack.source.connect(currentTrack.gainNode);
		
		
		log("looped");
		
		if(nextTrack.source) {
			log("there is a next track");
			// nextTrack.source.stop();
			play(nextTrack.source, 0, nextTrack.data.bars[0].start, eightbars, nextGainNode);
			// nextTrack.source.connect(nextTrack.gainNode);
			
			
			
			var percent = nbarsTogether / PLAY_TOGETHER;
			// Use an equal-power crossfading curve:
			var gain1 = Math.cos(percent * 0.5*Math.PI);
			var gain2 = Math.cos((1.0 - percent) * 0.5*Math.PI);
			currentGainNode.gain.value = gain1;
			nextGainNode.gain.value = gain2;
			
			log("currentGain = " + gain1 + ", nextGain = " + gain2);
			
			nbarsTogether++;
			
			
			if(nbarsTogether >= PLAY_TOGETHER) {
				currentTrack = nextTrack;
				nextTrack = new Track();
                getSimilarArtists(currentTrack);
				nbarsTogether = 0;
				
				currentGainNode.gain.value = 1;
				nextGainNode.gain.value = 0;
				
			}
		}
		
        // $("body").css("background-color", "#000");
        // currentTrack.data.bars.forEach(function(e) {
        //     if(Math.abs(trackTime - e.start) < 0.1) {
        //         // $("body").css("background-color", "#fff");
        //     }
        // });
    }, eightbars*1000);
	
	
}

function finishedLoadingStart(buffer) {

    currentTrack.source = context.createBufferSource();
    currentTrack.source.buffer = buffer;
    currentTrack.source.start(0);
    var gainNode = context.createGain();
    currentTrack.source.connect(gainNode); // Connect sine wave to gain node
	gainNode.gain.value = 0;
    gainNode.connect(context.destination);
	// currentTrack.gainNode = gainNode;
	
	// currentTrack.source.loop = true;
	// go();


}



// search function for starting song

$("#searchButton").click(function() {
    log("searching " + $("#search").val());


    $.get("https://api.spotify.com/v1/search", {
        q: $("#search").val(),
        type: "track,artist"
    }).done(function(data) {
        log(data.tracks);
        var items = data.tracks.items;
        $("#searchResults ul").html("");
        for (var i = 0; i < items.length; i++) {
            var artist = items[i].artists[0].name;
            var artistId = items[i].artists[0].id;
            var track = items[i].name;
            // log(item[i]);
            $("#searchResults ul").append("<li class='searchResultItem' id='" 
                + items[i].id + "' preview='" + items[i].preview_url + "' artistId='" 
                + artistId + "'>" + artist + ": " + track + "</li>");
        }


        //events for each result item
        $(".searchResultItem").click(function() {
            log($(this).attr("preview"));

	            var that = this;
	            getPreviewData($(this).attr("preview"), function(audioSummary, data) {
	                log("done callback");
	                currentTrack.data = data;
	                currentTrack.audioSummary = audioSummary;
	            
	                currentTrack.spotifyTrackId = $(that).attr("id");
	                currentTrack.spotifyArtistId = $(that).attr("artistId");			
					
					go();
					
	                getSimilarArtists(currentTrack);
	            				
	            });
			
			// currentTrack.data = glimpse;


			log(currentTrack.data );
            // if(currentTrack.source) currentTrack.source.stop();

            bufferLoader = new BufferLoader(context, finishedLoadingStart);
            bufferLoader.load($(this).attr("preview"));
			
			

        });

    });

});

//////////////////////////
//events

$("#stopButton").click(function(){
    // currentTrack.source.stop();
    currentTrack.source.backRate.value = 0;
    log(currentTrack.source);
    clearInterval(bpmIntverval);
    log(currentTrack.audioSummary);
});

$("#search").keydown(function(event) {
    if(event.keyCode == 13) {
        $("#searchButton").click();
    }
});

$("#searchButton").click();


// $("body").mousedown(function(event){
// 	var time = event.pageX* 0.01;
// 	log(time);
// 	if(currentTrack.source) {
// 		currentTrack.source.stop();
// 		play(currentTrack.source.buffer, time);
// 	}
// 	
// });

