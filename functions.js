var APIkey = "USFCOFHXTDXYNVRQ9";
var APIkey2 = "GWBBEFRRPJGVCMBCL";

function getPreviewData(previewURL, callback) {
	var goodURL = previewURL.replace("https", "http");
	
	$.post( "http://developer.echonest.com/api/v4/track/upload", { 
		api_key: APIkey, 
		url: goodURL, //"http://p.scdn.co/mp3-preview/ee420207228b4a0a5d44eaf4f85726b2feb614e0" 
	}).done(function( data ) {
	
		var id = data.response.track.id;
	
		var purl = "http://developer.echonest.com/api/v4/track/profile?api_key="+APIkey2+"&format=json&id="+id+"&bucket=audio_summary"
		console.log(purl);
	
		$.get("http://developer.echonest.com/api/v4/track/profile", {
			api_key: APIkey2,
			format: "json",
			id: id,
			bucket: "audio_summary"
		}).done(function(data) {
		
			var analysis_url = data.response.track.audio_summary.analysis_url;
			console.log(analysis_url);
			
			setTimeout(function() {
				$.get(analysis_url).done(function(data) {
					callback(data);
					console.log(data);
					// console.log(JSON.stringify(data));
				});
			}, 3000);
		
		});	
	});
}