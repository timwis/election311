var DEBUG = true;
var cache = {
	pollingplace: {input: null, language: null}
	,candidates: {input: null, language: null}
};
var language = "en";

var controller = {
	search: function(eventType, matchObj, ui, page, evt) {
		var pageId = matchObj[1];
		
		// Add search form to whatever page we're on
		var contentData = {
			action: "#" + pageId
			,d: function(key) {return dict.lookup("search", key, language);}
		};
		$(":jqmData(role='content')", page).empty().html(_.template($("#template-search").html(), contentData)).trigger("create");
		
		// Reset cache since we just changed the page contents
		cache[pageId] = {input: null, language: null};
		
		// Update footer
		controller.updateFooter(pageId, matchObj);
	}
	// Called upon pageshow - use it to focus on the first input field
	,focusForm: function(eventType, matchObj, ui, page, evt) {
		$("form input", page).eq(0).focus();
	}
	,pollingplace: function(eventType, matchObj, ui, page, evt) {
		var input = decodeURIComponent(matchObj[1].replace(/\+/g, "%20")).replace(/^\s+|\s+$/g, ""); // Remove invalid chars
		
		if(input != cache.pollingplace.input || language != cache.pollingplace.language) { // If we haven't already shown results for this address
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
							var fullAddress = data.ADDRESS + ", Philadelphia, PA";
							var contentData = {
								userAddress: userAddress
								,pollingplace: data
								,mapUrl: api.getMapUrl(fullAddress)
								,staticMap: api.getStaticMap(fullAddress)
								,d: function(key) {return dict.lookup("pollingplace", key, language);}
							};
							$(":jqmData(role='content')", page).html(_.template($("#template-pollingplace").html(), contentData)).trigger("create");
							
							// Save this so if we come back to this page we don't have to load it again
							cache.pollingplace = {input: input, language: language};
						} else {
							controller.error("pollingPlaceEmpty", page);
						}
					}, function(xhr, status, error) {
						controller.error("pollingPlaceFailed", page, xhr);
					});
				} else {
					controller.error("geocodeEmpty", page);
				}
			}, function(xhr, status, error) {
				controller.error("geocodeFailed", page, xhr);
			});
		}
		// Update footer
		controller.updateFooter("pollingplace", matchObj);
	}
	,candidates: function(eventType, matchObj, ui, page, evt) {
		var input = decodeURIComponent(matchObj[1].replace(/\+/g, "%20")).replace(/^\s+|\s+$/g, ""); // Remove invalid chars
		
		if(input != cache.candidates.input || language != cache.candidates.language) { // If we haven't already shown results for this address
			$(":jqmData(role='content')", page).empty(); // Clear the page
			setLoading(true);
			api.getCandidates(input, function(data) {
				setLoading(false);
				if(data) {
					// Render results to content area
					var contentData = { // this object can be formatted however you like. it gets passed to the template.
						candidates: data
						,d: function(key) {return dict.lookup("candidates", key, language);}
					};
					$(":jqmData(role='content')", page).html(_.template($("#template-candidates").html(), contentData)).trigger("create");
					
					// Save this so if we come back to this page we don't have to load it again
					cache.candidates = {input: input, language: language};
				} else {
					controller.error("candidatesEmpty", page);
				}
			}, function(xhr, status, error) {
				controller.error("candidatesFailed", page, xhr);
			});
		}
		// Update footer
		controller.updateFooter("candidates", matchObj);
	}
	,info: function(eventType, matchObj, ui, page, evt) {
		// Render content
		var contentData = {d: function(key) {return dict.lookup("info", key, language);}};
		$(":jqmData(role='content')", page).html(_.template($("#template-info").html(), contentData)).trigger("create");
		
		// Update footer
		controller.updateFooter("info", matchObj);
	}
	,error: function(msg, page, xhr) {
		setLoading(false);
		var errorData = {
			msg: msg
			,xhr: xhr || null
			,d: function(key) {return dict.lookup("error", key, language);}
		};
		$(":jqmData(role='content')", page).html(_.template($("#template-error").html(), errorData)).trigger("create");
	}
	,updateFooter: function(currentPage, matchObj) {
		var headerData = {
			currentPath: matchObj.input
			,currentLanguage: language
		};
		$(":jqmData(role='header-options')").html(_.template($("#template-header").html(), headerData)).trigger("create");
		
		var footerData = {
			currentPage: currentPage
			,queryString: matchObj.input.match(/\?.*/)
			,d: function(key) {return dict.lookup("footer", key, language);}
		};
		$(":jqmData(role='footer')").html(_.template($("#template-footer").html(), footerData)).trigger("create");
	}
}

var router = router || new $.mobile.Router([
	{"#info": { handler: "info", events: "bs" }}
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
	
	$(":jqmData(role='header-options') a:jqmData(lang)").live("click", function(e) {
		if(DEBUG) console.log("Changing language from " + language + " to " + $(this).data("lang"));
		language = $(this).data("lang");
		$.mobile.changePage($(this).attr("href"), {allowSamePageTransition: true});
		return false;
	});
});

// Necessary because v1.1.0 of jQuery Mobile doesn't seem to let you show the loading message during pagebeforeshow
function setLoading(on) {
	if(on) $("body").addClass("ui-loading");
	else $("body").removeClass("ui-loading");
}