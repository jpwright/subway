var jsonfile = require('jsonfile');
var turf = require('turf');

var input_file = 'geojson/everything.geojson';

var turf_polygons = {};
var tract_centroids = {};
var tract_nearby = {};

jsonfile.readFile(input_file, function(err, data) {
    console.log('Loaded tracts');
    for (tract_index in data.features) {
        var feature = data.features[tract_index]
        var properties = feature.properties;
        var properties_new = {"S":properties["STATEFP10"], "L":properties["LOCALNAME"],"C":properties["TRACTCE10"],"H":properties["HH_COUNT"]};
        data.features[tract_index].properties = properties_new;
    }
        
    jsonfile.writeFile('everything_node.json', data, {spaces: 2}, function(err) {
        console.error(err);
    });
});