class Geocoder {
    constructor (latlng) {

        this.latlng = latlng;
        this.name = '';
        this.info = '';
        this.done = false;

    }

    geocode(line) {

        var geo = this;

        geocode_service.reverse().distance(500).latlng(this.latlng).run(function(error, result) {
            geo.name = '';
            geo.info = '';

            var geocode_success = true;
            if (error) {
                console.log(error);
                geocode_success = false;
            } else {
                var geocoded_name = result.address.Address;
                if (geocoded_name == null) {
                    geocoded_name = "";
                }

                var city = result.address.City;
                geo.name = clean_address(geocoded_name);

                if (city != "New York") {
                    geo.name = clean_city(city) + ' - ' + geo.name;
                    geo.info += clean_city(city);
                }
            }

            var enc_boroughs = [];
            var enc_neighborhoods = [];

            var enc_landmarks = [];
            var neighborhood_in_station_name = false;

            var neighborhood_layer = leafletPip.pointInLayer([geo.latlng.lng, geo.latlng.lat], neighborhoods, true);
            if (neighborhood_layer.length > 0) {
                enc_boroughs.push(neighborhood_layer[0].feature.properties.borough);
                enc_neighborhoods.push(neighborhood_layer[0].feature.properties.neighborhood);
            }

            if (enc_neighborhoods.length > 0) {
                var enc_borough = enc_boroughs[0];
                var enc_neighborhood = enc_neighborhoods[0];

                if (enc_borough != "Manhattan" && geo.name.match(/\d/g)) {
                    geo.name = enc_neighborhood + ' - ' + geo.name;
                    neighborhood_in_station_name = true;
                }

                for (var i = 0; i < enc_neighborhoods.length; i++) {
                    if ((ENC_NEIGHBORHOODS_ALWAYS_LABEL.indexOf(enc_neighborhoods[i]) != -1) && !neighborhood_in_station_name) {
                        geo.name = enc_neighborhoods[i] + ' - ' + geo.name;
                        neighborhood_in_station_name = true;
                    }
                    if ((ENC_NEIGHBORHOODS_ONLY_LABEL.indexOf(enc_neighborhoods[i]) != -1) && !neighborhood_in_station_name) {
                        geo.name = enc_neighborhoods[i];
                        neighborhood_in_station_name = true;
                    }
                }

                if (!geocode_success) {
                    geo.name = enc_neighborhood;
                }
                geo.info += enc_borough;
                geo.info += '<br />';
                geo.info += enc_neighborhood;
            }
            var landmark_layer = leafletPip.pointInLayer([geo.latlng.lng, geo.latlng.lat], landmarks, true);
            if (landmark_layer.length > 0) {
                enc_landmarks.push(landmark_layer[0].feature.properties.name);
            }
            if (enc_landmarks.length > 0) {
                geo.name = geo.name + ' - ' + enc_landmarks[0];
                if (ENC_LANDMARKS_ONLY_LABEL.indexOf(enc_landmarks[0]) != -1) {
                    geo.name = enc_landmarks[0];
                }
            }

            geocode_to_station(geo, line)
        });
    }
}

var geocode_service = L.esri.Geocoding.geocodeService();

function clean_address(addr) {
    addr = addr.replace(/(\d*-?\d*)\s/g, " ").trim().replace(/^[NWES]\s/g, "");
    addr = addr.replace("Plz", "Plaza");
    addr = addr.trim();
    return addr;
}

function clean_city(city) {
    city = city.replace(" Town of", "");
    city = city.replace(" Twp", "");
    city = city.trim();
    return city;
}