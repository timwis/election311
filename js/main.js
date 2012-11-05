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
		controller.updateFooter(pageId, matchObj);
	}
	// Called upon pageshow - use it to focus on the first input field
	,focusForm: function(eventType, matchObj, ui, page, evt) {
		$("form input", page).eq(0).focus();
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
						if(DEBUG) console.log(data);
						setLoading(false);
						if(data) { // If a match was found
						
							// Render results to content area
							var fullAddress = addCityState(data.ADDRESS);
							var contentData = {
								userAddress: userAddress
								,pollingplace: data
								,mapUrl: api.getMapUrl(fullAddress)
								,staticMap: api.getStaticMap(fullAddress)
							};
							$(":jqmData(role='content')", page).html(_.template($("#template-pollingplace").html(), contentData)).trigger("create");
							
							// Save this so if we come back to this page we don't have to load it again
							cache.pollingplace = input;
						} else {
							controller.error("A polling place for this address could not be found.", page);
						}
					}, function(xhr, status, error) {
						controller.error("An error occured when trying to get your polling place from the database. Please try again.", page, xhr);
					});
				} else {
					controller.error("Unable to validate the address you entered. Please enter just the basic street address, i.e. 1234 Market", page);
				}
			}, function(xhr, status, error) {
				controller.error("An error occured when trying to validate your address with the database. Please try again.", page, xhr);
			});
		}
		// Update footer
		controller.updateFooter("pollingplace", matchObj);
	}
	,candidates: function(eventType, matchObj, ui, page, evt) {
		var input = decodeURIComponent(matchObj[1].replace(/\+/g, "%20")).replace(/^\s+|\s+$/g, ""); // Remove invalid chars
		input = addCityState(input); // add ", Philadelphia, PA" for google
		
		if(input != cache.candidates) { // If we haven't already shown results for this address
			$(":jqmData(role='content')", page).empty(); // Clear the page
			setLoading(true);
			api.getCandidates(input, function(data) {
				if(DEBUG) console.log(data);
				setLoading(false);
				if(data && data.status !== undefined && data.status == "success") {
					// Render results to content area
					var contentData = data; // this object can be formatted however you like. it gets passed to the template.
					$(":jqmData(role='content')", page).html(_.template($("#template-candidates").html(), contentData)).trigger("create");
					
					// Save this so if we come back to this page we don't have to load it again
					cache.candidates = input;
				} else {
					controller.error("Candidate information for this address could not be found.", page);
				}
			}, function(xhr, status, error) {
				controller.error("An error occured when trying to get candidate information from the database. Please try again.", page, xhr);
			});
		}
		// Update header & footer
		controller.updateHeader("candidates", matchObj);
		controller.updateFooter("candidates", matchObj);
	}
	,questions: function(eventType, matchObj, ui, page, evt) {
		// Render results to content area
		var contentData = {
			questions: questions
		};
		$(":jqmData(role='content')", page).html(_.template($("#template-questions").html(), contentData)).trigger("create");
		
		// Update header & footer
		controller.updateHeader("questions", matchObj);
		controller.updateFooter("candidates", matchObj);
	}
	,info: function(eventType, matchObj, ui, page, evt) {
		// Render content
		$(":jqmData(role='content')", page).html(_.template($("#template-info").html())).trigger("create");
		
		// Update footer
		controller.updateFooter("info", matchObj);
	}
	,error: function(msg, page, xhr) {
		setLoading(false);
		var errorData = {msg: msg, xhr: xhr || null};
		$(":jqmData(role='content')", page).html(_.template($("#template-error").html(), errorData)).trigger("create");
	}
	,updateFooter: function(currentPage, matchObj) {
		var footerData = {currentPage: currentPage, queryString: matchObj.input.match(/\?.*/)};
		$(":jqmData(role='footer')").html(_.template($("#template-footer").html(), footerData)).trigger("create");
	}
	,updateHeader: function(currentPage, matchObj) {
		var headerData = {currentPage: currentPage, queryString: matchObj.input.match(/\?.*/)};
		$(":jqmData(role='header-options')").html(_.template($("#template-header").html(), headerData)).trigger("create");
	}
}

var router = router || new $.mobile.Router([
	{"#info": { handler: "info", events: "bs" }}
	,{"#questions": { handler: "questions", events: "bs" }}
	,{"#pollingplace\\?address=(.*)": { handler: "pollingplace", events: "bs" }}
	,{"#candidates\\?address=(.*)": { handler: "candidates", events: "bs" }}
	,{"#(pollingplace|candidates)$": { handler: "search", events: "bs" }}
	,{"#(pollingplace|candidates)$": { handler: "focusForm", events: "s" }} // On pageshow, focus on first field
], controller);

$(document).ready(function() {
    // Ensure user has input an address before pressing search
	$(":jqmData(role='content') form").submit(function(e) {
		var inputNode = $("input[name=\"address\"]", $(this));
		if( ! $.trim(inputNode.val())) {
			inputNode.focus();
			return false;
		}
	});
});

// Necessary because v1.1.0 of jQuery Mobile doesn't seem to let you show the loading message during pagebeforeshow
function setLoading(on) {
	if(on) $("body").addClass("ui-loading");
	else $("body").removeClass("ui-loading");
}

function addCityState(input) {
	var comma = input.indexOf(",");
	if(comma > -1) {
		input = input.substr(0, comma);
	}
	return input + ", Philadelphia, PA";
}