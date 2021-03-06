var DEBUG = false;
var errors = {
    pollingPlaceEmpty: "A polling place for this address could not be found."
	,pollingPlaceFailed: "An error occurred when trying to get your polling place from the database. Please try again."
	,geocodeEmpty: "Unable to validate the address you entered. Please enter just the basic street address, i.e. 1234 Market"
	,geocodeFailed: "An error occurred when trying to validate your address with the database. Please try again."
};

// Fetch content from Google Doc at run time
setLoading(true);
api.getGoogleDoc(function(data, tabletop) {
	if(DEBUG) console.log(data);
	setLoading(false);
	if(data.Info !== undefined) {
		var info = {sections: []};
		// Enable line breaks and separate top content from section content
		$.each(data.Info.elements, function() {
			this.content = this.content.split("\n").join("<br>\n");
			if( ! this.section) info.top = this.content;
			else info.sections.push(this);
		});
		// Render data
		var infoContainer = $("#info :jqmData(role='content')");
		infoContainer.html(_.template($("#template-info").html(), info, {variable: "data"}));
		if(infoContainer.hasClass("ui-content")) infoContainer.trigger("create"); // If page has already been initialized, reinit
	}
	if(data.Candidates !== undefined) {
		var candidates = {};
		// Reorganize candidates array by race
		$.each(data.Candidates.elements, function() {
			if(candidates[this.office] === undefined) {
				candidates[this.office] = [];
			}
			candidates[this.office].push(this);
		});
		// Render data
		var candidatesContainer = $("#candidates :jqmData(role='content')");
		candidatesContainer.html(_.template($("#template-candidates").html(), candidates, {variable: "data"}));
		if(candidatesContainer.hasClass("ui-content")) candidatesContainer.trigger("create"); // If page has already been initialized, reinit
	}
	if(data.Questions !== undefined) {
		// Enable line breaks
		$.each(data.Questions.elements, function() {
			this.question = this.question.split("\n").join("<br>\n");
		});
		// Render data
		$("#questions :jqmData(role='content')").html(_.template($("#template-questions").html(), data.Questions.elements, {variable: "data"}));
	}
});
	
// If user tries to view the polling place page, check if it contains any results yet; otherwise redirect them to the search page
$("#pollingplace").bind("pagebeforeshow", function() {
	if( ! $(":jqmData(role='content')", $(this)).text()) {
		$.mobile.changePage($("#search"));
	}
});

// When the search page is shown, focus on the first form field
$("#search").bind("pageshow", function() {
	$("form input", $(this)).eq(0).focus();
});

$(document).ready(function() {
	// When search form is submitted
	$("#search form").submit(function(e) {
		var input = $.trim($("input[name='address']", $(this)).val().replace(/^\s+|\s+$/g, "")); // Remove invalid chars
		if(input) {
			search(input);
		} else { // input is empty
			$("input[name='address']", $(this)).focus(); // set focus back to address field
		}
		return false; // don't allow form to submit. we'll handle it from here
	});
});

function search(input) {
	$("#pollingplace :jqmData(role='content')").empty(); // Clear the page
	$.mobile.loading("show");
	
	// Get the latitude/longitude of the address
	api.geocode(input, function(data) {
		if(DEBUG) console.log(data);
		if(data) { // If a match was found
			var userAddress = data.Address.StandardizedAddress; // This is the City's version of the address
			
			// Get the polling place for this latitude/longitude
			api.getPollingPlace(data.XCoord, data.YCoord, function(data) {
				if(DEBUG) console.log(data);
				$.mobile.loading("hide");
				if(data) { // If a match was found
					// Build results array
					var fullAddress = addCityState(data.ADDRESS);
					var contentData = {
						userAddress: userAddress
						,pollingplace: data
						,mapUrl: api.getMapUrl(fullAddress)
						,staticMap: api.getStaticMap(fullAddress)
					};
					// Render results to content area
					$("#pollingplace :jqmData(role='content')").html(_.template($("#template-pollingplace").html(), contentData)).trigger("create");
					$.mobile.changePage($("#pollingplace"));
				} else { // getPollingPlace data is empty
					error("pollingPlaceEmpty");
				}
			}, function(xhr, status, error) { // getPollingPlace error
				error("pollingPlaceFailed", xhr);
			});
		} else { // geocode data is empty
			error("geocodeEmpty");
		}
	}, function(xhr, status, error) { // geocode error
		error("geocodeFailed", xhr);
	});
}

// Render message with error template on #pollingplace
function error(code, xhr) {
	$.mobile.loading("hide");
	var errorData = {msg: (errors[code] !== undefined ? errors[code] : ""), xhr: xhr || null};
	$("#pollingplace :jqmData(role='content')").html(_.template($("#template-error").html(), errorData)).trigger("create");
	$.mobile.changePage($("#pollingplace"));
}

// Helper to remove any city/state and add ", Philadelphia, PA"
function addCityState(input) {
	var comma = input.indexOf(",");
	if(comma > -1) {
		input = input.substr(0, comma);
	}
	return input + ", Philadelphia, PA";
}

// This allows us to do $.mobile.loading() before jQM is loaded
function setLoading(on) {
	if(on) $("body").addClass("ui-loading");
	else $("body").removeClass("ui-loading");
}