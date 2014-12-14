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
var startingSource = null;
var bpmIntverval = null;

function Track() {
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

function finishedLoadingStart(buffer) {

    startingSource = context.createBufferSource();
    startingSource.buffer = buffer;
    startingSource.connect(context.destination);
    startingSource.start(0);
    startingSource.playbackRate = 1;
    currentTrack.startingTime = context.currentTime;


    ///////////////////////////////////////////////////////////
    // this is where the meat of the bpm shit lives
    ///////////////////////////////////////////////////////////

    bpmIntverval = setInterval(function () {
        if(!currentTrack.data || startingSource.playbackRate === 0) return;

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



            if(startingSource) startingSource.stop();

            bufferLoader = new BufferLoader(context, finishedLoadingStart);
            bufferLoader.load( $(this).attr("preview"));

        });

    });

});

//////////////////////////
//events

$("#stopButton").click(function(){
    // startingSource.stop();
    startingSource.playbackRate.value = 0;
    console.log(startingSource);
    clearInterval(bpmIntverval);
    console.log(currentTrack.audioSummary);
});

$("#search").keydown(function(event) {
    if(event.keyCode == 13) {
        $("#searchButton").click();
    }
})
