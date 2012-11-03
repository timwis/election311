var DEBUG = false;
var cache = {pollingplace: null, candidates: null};

var controller = {
	search: function(eventType, matchObj, ui, page, evt) {
		var pageId = matchObj[1];
		
		// Add search form to whatever page we're on
		var contentData = {action: "#" + pageId};
		$(":jqmData(role='content')", page).empty().html(_.template($("#template-search").html(), contentData)).trigger("create");
		
		// Reset cache since we just changed the page contents
		if(cache[pageId] !== undefined) cache[pageId] = null;
		
		// Update footer
		updateFooter(pageId, matchObj);
	}
	,pollingplace: function(eventType, matchObj, ui, page, evt) {
		var input = decodeURIComponent(matchObj[1].replace(/\+/g, "%20")).replace(/^\s+|\s+$/g, ""); // Remove invalid chars
		
		if(input != cache.pollingplace) { // If we haven't already shown results for this address
			$(":jqmData(role='content')", page).empty(); // Clear the page
			setLoading(true);
			
			// Get the latitude/longitude of the address
			api.geocode(input, function(data) {
				if(DEBUG) console.log(data);
				if(data) { // If a match was found
					var userAddress = data.Address.StandardizedAddress; // This is the City's version of the address
					
					// Get the polling place for this latitude/longitude
					api.getPollingPlace(data.XCoord, data.YCoord, function(data) {
						setLoading(false);
						if(data) { // If a match was found
						
							// Render results to content area
							var contentData = {userAddress: userAddress, pollingplace: data};
							$(":jqmData(role='content')", page).html(_.template($("#template-pollingplace").html(), contentData)).trigger("create");
							
							// Save this so if we come back to this page we don't have to load it again
							cache.pollingplace = input;
						} else {
							// error, polling place not found (TODO)
						}
					}, function(xhr, status, error) {
						// error, polling place request failed (TODO)
					});
				} else {
					// error, no location found within minConfidence (TODO)
				}
			}, function(xhr, status, error) {
				// error, geocode request failed (TODO)
			});
		}
		// Update footer
		updateFooter("pollingplace", matchObj);
	}
	,candidates: function(eventType, matchObj, ui, page, evt) {
		var input = decodeURIComponent(matchObj[1].replace(/\+/g, "%20")).replace(/^\s+|\s+$/g, ""); // Remove invalid chars
		
		if(input != cache.candidates) { // If we haven't already shown results for this address
			$(":jqmData(role='content')", page).empty(); // Clear the page
			setLoading(true);
			api.getCandidates(input, function(data) {
				setLoading(false);
				if(data) {
					// Render results to content area
					var contentData = data; // this object can be formatted however you like. it gets passed to the template.
					$(":jqmData(role='content')", page).html(_.template($("#template-candidates").html(), contentData)).trigger("create");
					
					// Save this so if we come back to this page we don't have to load it again
					cache.candidates = input;
				} else {
					// error, candidate information not found (TODO)
				}
			}, function(xhr, status, error) {
				// error, candidates request failed (TODO)
			});
		}
		// Update footer
		updateFooter("candidates", matchObj);
	}
	,info: function(eventType, matchObj, ui, page, evt) {
		// Update footer
		updateFooter("info", matchObj);
	}
}

new $.mobile.Router({
	"#info": { handler: "info", events: "bs" }
	,"#pollingplace\\?address=(.*)": { handler: "pollingplace", events: "bs" }
	,"#candidates\\?address=(.*)": { handler: "candidates", events: "bs" }
	,"#(pollingplace|candidates)$": { handler: "search", events: "bs" }
}, controller);

function updateFooter(activePage, matchObj) {
	var footerData = {activePage: activePage, queryString: matchObj.input.match(/\?.*/)};
	$(":jqmData(role='footer')").html(_.template($("#template-footer").html(), footerData)).trigger("create");
}

// Necessary because v1.1.0 of jQuery Mobile doesn't seem to let you show the loading message during pagebeforeshow
function setLoading(on) {
	if(on) $("body").addClass("ui-loading");
	else $("body").removeClass("ui-loading");
}