
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
    console.log("done callback");
    track.data = data;
}

function cueNextTrack() {
	
}

function play(souce, startTime, offset, duration) {



  // startTime = context.currentTime;
  var source = context.createBufferSource();
  // Connect graph
  source.buffer = souce.buffer;
  // source.loop = true;
  source.connect(context.destination);
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
	
    var gainNode = context.createGain();
    currentTrack.source.connect(gainNode); // Connect sine wave to gain node
    gainNode.connect(context.destination); // Connect gain node to speakers

    document.getElementById('volume').addEventListener('change', function () {
        gainNode.gain.value = this.value;
    });

    ///////////////////////////////////////////////////////////
    // this is where the meat of the bpm shit lives
    ///////////////////////////////////////////////////////////

	if(bpmInterval !== null) clearInterval(bpmInterval);
	console.log(currentTrack.data.bars[1].duration);
	
	var eightbars = 0;
	for(var i = 0; i < 4; i++) {
		eightbars+= currentTrack.data.beats[0+i].duration;
	}
	
	console.log("eightbars = " + eightbars);
	
    bpmInterval = setInterval(function () {
        if(!currentTrack.data || currentTrack.source.backRate === 0) return;

		//         var trackTime = context.currentTime-currentTrack.startingTime;
		// 
		// var bar1 = currentTrack.data.beats[1];
		// var bar8 = currentTrack.data.beats[3];
		// // console.log(trackTime + " " + bar8.start + " diff = " + Math.abs(trackTime - (bar8.start + bar8.duration)));
		// if (Math.abs(trackTime - (bar8.start)) < 0.01) {
		//     // currentTrack.source.start(context.currentTime+bar1.start);
		// 	currentTrack.source.stop();
		// 	play(currentTrack.source.buffer, (bar8.start - bar1.start));
		// 	console.log("looped");
		// }
		
		// if(currentTrack.source) currentTrack.source.stop();
		play(currentTrack.source, 0, currentTrack.data.beats[0].start, eightbars);
		
		
		console.log("looped");
		
		if(nextTrack.source) {
			console.log("there is a next track");
			// nextTrack.source.stop();
			play(nextTrack.source, 0, nextTrack.data.beats[0].start, eightbars);
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
	// currentTrack.source.loop = true;
	// go();


}



// search function for starting song

$("#searchButton").click(function() {
    console.log("searching " + $("#search").val());


    $.get("https://api.spotify.com/v1/search", {
        q: $("#search").val(),
        type: "track,artist"
    }).done(function(data) {
        console.log(data.tracks);
        var items = data.tracks.items;
        $("#searchResults ul").html("");
        for (var i = 0; i < items.length; i++) {
            var artist = items[i].artists[0].name;
            var artistId = items[i].artists[0].id;
            var track = items[i].name;
            // console.log(item[i]);
            $("#searchResults ul").append("<li class='searchResultItem' id='" 
                + items[i].id + "' preview='" + items[i].preview_url + "' artistId='" 
                + artistId + "'>" + artist + ": " + track + "</li>");
        }


        //events for each result item
        $(".searchResultItem").click(function() {
            console.log($(this).attr("preview"));

	            var that = this;
	            getPreviewData($(this).attr("preview"), function(audioSummary, data) {
	                console.log("done callback");
	                currentTrack.data = data;
	                currentTrack.audioSummary = audioSummary;
	            
	                currentTrack.spotifyTrackId = $(that).attr("id");
	                currentTrack.spotifyArtistId = $(that).attr("artistId");			
					
					go();
					
	                getSimilarArtists(currentTrack);
	            				
	            });
			
			// currentTrack.data = glimpse;


			console.log(currentTrack.data );
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
    console.log(currentTrack.source);
    clearInterval(bpmIntverval);
    console.log(currentTrack.audioSummary);
});

$("#search").keydown(function(event) {
    if(event.keyCode == 13) {
        $("#searchButton").click();
    }
});

$("#searchButton").click();


// $("body").mousedown(function(event){
// 	var time = event.pageX* 0.01;
// 	console.log(time);
// 	if(currentTrack.source) {
// 		currentTrack.source.stop();
// 		play(currentTrack.source.buffer, time);
// 	}
// 	
// });

