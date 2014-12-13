
window.onload = init;
var context;
var bufferLoader;
var startingSource = null;
var bpmIntverval = null;

var currentTrack = {
	startingTime: 0,
	data: null,
	artistId: ""
};

$("#stopButton").click(function(){
	// startingSource.stop();
	startingSource.playbackRate.value = 0;
	console.log(startingSource);
	clearInterval(bpmIntverval);
});

// var currentTrackSta
// var currentTrackData = null;

function loadInTrackData(data) {
	console.log("done callback");
	currentTrack.data = data;
}

function init() {
  context = new webkitAudioContext();

}

function finishedLoadingStart(buffer) {
	startingSource = context.createBufferSource();
	startingSource.buffer = buffer;
    startingSource.connect(context.destination);
    startingSource.start(0);
	startingSource.playbackRate = 1;
	currentTrack.startingTime = context.currentTime;
	console.log(context.currentTime);
	console.log(startingSource);
	
	bpmIntverval = setInterval(function () {
		if(!currentTrack.data || startingSource.playbackRate === 0) return;
		
		var trackTime = context.currentTime-currentTrack.startingTime;
		
		$("body").css("background-color", "#000");
		currentTrack.data.beats.forEach(function(e) {
			if(Math.abs(trackTime - e.start) < 0.1) {
				$("body").css("background-color", "#fff");
			}
			
			// console.log(trackTime +" "+ e.start);
		});
	}, 20);
	
	// console.log("started song");
}

function finishedLoading(bufferList) {
  // Create two sources and play them both together.
  source1 = context.createBufferSource();
  // var source2 = context.createBufferSource();
  source1.buffer = bufferList[0];
  // source2.buffer = bufferList[1];

  source1.connect(context.destination);
  // source2.connect(context.destination);
  source1.start(0);
  // source2.start(0);
  
  // setInterval(function() {
  // 	  console.log(context.currentTime);
  // }, 200);
  
 
}


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
			$("#searchResults ul").append("<li class='searchResultItem' id='"+items[i].id+"' preview='"+items[i].preview_url+"'>" + artist + ": " + track + "</li>");
		}
		
		$(".searchResultItem").click(function() {
			console.log($(this).attr("preview"));
			
			$(this).attr("preview")
			
			getPreviewData($(this).attr("preview"), loadInTrackData);
			
			if(startingSource) startingSource.stop();
			
		    bufferLoader = new BufferLoader(
		      context,
		      [],
		      finishedLoadingStart
		      );

		    bufferLoader.load( $(this).attr("preview"));
			
		});
		
	});
	
});
