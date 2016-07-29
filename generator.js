var jsonfile = require('jsonfile');
var turf = require('turf');

var input_file = 'geojson/everything_node.min.geojson';

var turf_polygons = {};
var tract_centroids = {};
var tract_nearby = {};

jsonfile.readFile(input_file, function(err, data) {
    console.log('Loaded tracts');
    for (tract_index in data.features) {
        var coords = data.features[tract_index].geometry.coordinates;
        var turf_polygon = {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Polygon",
                "coordinates": coords
            }
        };
        turf_polygons[tract_index] = turf_polygon;
    }
    
    
    console.log("Length of tracts array: "+data.features.length);
    
    var generate = true;
    //generate = false;
    
    if (generate) {
        
        console.log("Calculating centroids");
        var tract_index = 0;
        for (tract_index = 0; tract_index < data.features.length; tract_index++) {
            var turf_centroid = turf.centroid(turf_polygons[tract_index]);
            //var tract_area = turf.area(turf_polygons[tract_index]);
            tract_centroids[tract_index] = turf_centroid;
        }
        
        console.log("Calculating neighbors");
        
        var last_pct = 0;
        var pct = 0;
        for (tract_index = 0; tract_index < data.features.length; tract_index++) {
            var centroid = tract_centroids[tract_index];
            
            for (tcc = 0; tcc < data.features.length; tcc++) {
                var lc = turf_polygons[tcc];
                var cc = tract_centroids[tcc];
                var td = 100;
                if (tcc != tract_index) {
                    td = turf.distance(centroid, cc, 'miles');
                }
                if (tcc == tract_index || td <= 0.75) {
                    if (!(tract_index in tract_nearby)) {
                        tract_nearby[tract_index] = [tcc];
                    } else {
                        tract_nearby[tract_index].push(tcc);
                    }
                }
            }
            pct = (100.0*tract_index/data.features.length)
            if (pct - last_pct > 1) {
                console.log(pct.toString() + "% done");
                last_pct = pct;
            }
        }
        
        jsonfile.writeFile('tract_nearby_node.json', tract_nearby, {spaces: 2}, function(err) {
            console.error(err);
        });
        
    }
});