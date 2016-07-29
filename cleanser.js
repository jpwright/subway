var jsonfile = require('jsonfile');
var turf = require('turf');

var input_file = 'geojson/everything.geojson';

var turf_polygons = {};
var tract_centroids = {};
var tract_nearby = {};

jsonfile.readFile(input_file, function(err, data) {
    console.log('Loaded tracts');
    
    var manhattan_center = {
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "Point",
            "coordinates": [-74.005416, 40.721926]
        }
    };
    
    var new_data = JSON.parse(JSON.stringify(data));
    
    for (tract_index in data.features) {
        var feature = data.features[tract_index]
        var properties = feature.properties;
        var properties_new = {"S":properties["STATEFP10"], "L":properties["LOCALNAME"],"C":properties["TRACTCE10"],"H":properties["HH_COUNT"]};
        new_data.features[tract_index].properties = properties_new;
    }
    var rem_data = JSON.parse(JSON.stringify(new_data));
    rem_data.features = [];
    for (tract_index in new_data.features) {
        var feature = new_data.features[tract_index]
        var centroid = turf.centroid(feature);
        //console.log(feature);
        console.log(centroid.geometry.coordinates);
        var distance = turf.distance(centroid, manhattan_center, "miles");
        //console.log(distance);
    
        if (distance < 20.0) {
            rem_data.features.push(feature);
        }
        
    }
        
    jsonfile.writeFile('everything_node.geojson', rem_data, {spaces: 2}, function(err) {
        console.error(err);
    });
});