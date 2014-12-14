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
var bpmIntverval = null;

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
var filter = context.createBiquadFilter();


////////////////////////////////////////////////
// callbacks 
function loadInTrackData(track, data) {
    console.log("done callback");
    track.data = data;
}

function toggleFilter() {
    if (filtering) {
        // stop filter
    } else { 
        // start filter
    };
}

function finishedLoadingStart(buffer) {

    currentTrack.source = context.createBufferSource();
    currentTrack.source.buffer = buffer;
    //currentTrack.source.connect(context.destination);
    currentTrack.source.start(0);
    currentTrack.source.playbackRate = 1;
    currentTrack.startingTime = context.currentTime;
	currentTrack.source.loop = true;

    filter.type = 'highpass';
    filter.frequency.value = 400;

    currentTrack.source.connect(filter); // Connect sine wave to gain node

    var gainNode = context.createGain();
    gainNode.gain.value = 0.5;
    filter.connect(gainNode);
    gainNode.connect(context.destination); // Connect gain node to speakers

    document.getElementById('volume').addEventListener('change', function () {
        gainNode.gain.value = this.value;
    });
    document.getElementById('eq').addEventListener('change', function () {
        filter.frequency.value = this.value;
    });

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
                getSimilarArtists(currentTrack);
            });



            if(currentTrack.source) currentTrack.source.stop();

            bufferLoader = new BufferLoader(context, finishedLoadingStart);
            bufferLoader.load($(this).attr("preview"));

        });

    });

});

//////////////////////////
//events

$("#stopButton").click(function(){
    // currentTrack.source.stop();
    currentTrack.source.playbackRate.value = 0;
    console.log(currentTrack.source);
    clearInterval(bpmIntverval);
    console.log(currentTrack.audioSummary);
});

$("#search").keydown(function(event) {
    if(event.keyCode == 13) {
        $("#searchButton").click();
    }
})
