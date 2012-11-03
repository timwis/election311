var api = api || {};
api = {
	config: {
		ulrs311: {
			base: "http://services.phila.gov/ULRS311/Data/" // Ideally this should allow jsonp. ETA 2012-11-11
			,location: "Location/"
			,timeout: 20000
			,minConfidence: 85
		}
		,gisServer: {
			base: "http://gis.phila.gov/ArcGIS/rest/services/"
			,pollingPlaces: "PhilaGov/PollingPlaces/MapServer/1/"
			,defaultParams: "query?geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnCountOnly=false&returnIdsOnly=false&returnGeometry=false&outFields=WARD_1%2CDIVISION_1%2CPOLLING_PL%2CADDRESS%2CBUILDING_A%2CPARKING_AC&f=pjson&geometry="
			,timeout: 20000
		}
	}
	
	,geocode: function(input, successCallback, errorCallback) {
		var url = api.config.ulrs311.base + api.config.ulrs311.location + encodeURIComponent(input);
		$.ajax({
			url: url
			,timeout: api.config.ulrs311.timeout
			,cache: true
			,error: errorCallback
			,success: function(data) {
				var location = null;
				if(data.Locations !== undefined && data.Locations.length) {
					for(i in data.Locations) {
						if(data.Locations[i].Address.Similarity >= api.config.ulrs311.minConfidence) {
							location = data.Locations[i];
							break;
						}
					}
				}
				successCallback(location);
			}
		})
	}
	
	,getPollingPlace: function(x, y, successCallback, errorCallback) {
		var geometry = "{\"x\":" + x + ",\"y\":" + y + "}";
		var url = api.config.gisServer.base + api.config.gisServer.pollingPlaces + api.config.gisServer.defaultParams + encodeURIComponent(geometry);
		$.ajax({
			url: url
			,dataType: "jsonp"
			,timeout: api.config.gisServer.timeout
			,cache: true
			,error: errorCallback
			,success: function(data) {
				var location = null;
				if(data.features !== undefined && data.features.length) {
					location = data.features[0].attributes;
				}
				successCallback(location);
			}
		})
	}
	
	,getCandidates: function(input, successCallback, errorCallback) {
		successCallback({foo: "bar"});
	}
}