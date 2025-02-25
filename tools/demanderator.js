var jsonfile = require('jsonfile');
var turf = require('turf');
var ProgressBar = require('progress');

var input_file = 'geojson/everything.geojson';
var population_file = 'json/population.json';
var landmarks_file = 'geojson/landmarks.geojson';

var turf_polygons = {};
var tract_centroids = {};
var tract_nearby = {};

var geo_range_lat = 0.8;
var geo_range_lon = 1.0;

var lat_min = 40.713 - geo_range_lat/2.0;
var lat_max = 40.713 + geo_range_lat/2.0;
var lon_min = -74.006 - geo_range_lon/2.0;
var lon_max = -74.006 + geo_range_lon/2.0;

var voxels_dim = 500;
var voxels_res_lat = geo_range_lat / voxels_dim;
var voxels_res_lon = geo_range_lon / voxels_dim;
var voxels_total = voxels_dim * voxels_dim;

var bar = new ProgressBar('  processing [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 100,
    total: voxels_total
  });

jsonfile.readFile(input_file, function(err, data) {
    console.log('Loaded tracts');
    var populations = {};
    jsonfile.readFile(population_file, function(population_err, population_data ) {
        console.log('Loaded population');
        jsonfile.readFile(landmarks_file, function(landmarks_err, landmarks_data) {
            console.log('Loaded landmarks');
            var q;
            var totalPopulation = 0;
            for (q = 0; q < population_data["2020"].length; q++) {
                var boroCtId = population_data["2020"][q]["BCT2020"];
                var geoid = population_data["2020"][q]["GEO_ID"];
                if (!boroCtId) continue;
                var ctId = boroCtId.slice(1);
                var populationStr = population_data["2020"][q]["Pop1"];
                var strippedPopulationStr = populationStr.replaceAll(",", ""); // remove commas so we can parseFloat
                var population = parseFloat(strippedPopulationStr);
                populations[ctId] = population;
                totalPopulation += population;
            }
            console.log("totalPopulation: "+totalPopulation);
            
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
            
            var i;
            var j;
            var demand = [];
            for (var a = 0; a < voxels_dim; a++) {
                var dim = [];
                for (var b = 0; b < voxels_dim; b++) {
                    dim.push(0.0);
                }
                demand.push(dim);
            }
            
            var landmark_polygons_of_interest = {"JFK Airport": 0, "LaGuardia Airport": 0, "Grand Central": 0, "Port Authority Bus Terminal": 0, "Penn Station": 0};
            var landmark_scalers = {"JFK Airport": 11000.0, "LaGuardia Airport": 9000.0, "Grand Central": 2000.0, "Port Authority Bus Terminal": 1000.0, "Penn Station": 2000.0};
            
            for (landmark_index = 0; landmark_index < landmarks_data["features"].length; landmark_index++) {
                var landmark = landmarks_data["features"][landmark_index];
                var landmark_name = landmark["properties"]["name"];
                if (landmark_name in landmark_polygons_of_interest) {
                    var landmark_polygon = turf.polygon(landmark["geometry"]["coordinates"]);
                    landmark_polygons_of_interest[landmark_name] = landmark_polygon;
                    var landmark_centroid = turf.centroid(landmark_polygon);
                    console.log("Landmark "+landmark_name+" centroid in polygon: "+turf.inside(landmark_centroid, landmark_polygon));
                }
            }
            
            
            console.log("Calculating centroids");
            var centroids = [];
            for (tract_index = 0; tract_index < data.features.length; tract_index++) {
                var turf_centroid = turf.centroid(data.features[tract_index]);
                //var tract_area = turf.area(turf_polygons[tract_index]);
                centroids[tract_index] = turf_centroid;
            }
            
            console.log("Calculating voxels");
            var tooFar = 0;
            var numUndefined = 0;
            for (i = 0; i < voxels_dim; i++) {
                var lat = lat_min + voxels_res_lat*i;
                for (j = 0; j < voxels_dim; j++) {
                    var lon = lon_min + voxels_res_lon*j;
                    var square = turf.bboxPolygon([lon, lat, lon+voxels_res_lon, lat+voxels_res_lat]);
                    var d = 0.0;
                    
                    for (tract_index = 0; tract_index < data.features.length; tract_index++) {
                        var tract = data.features[tract_index];
                        var ct2020 = tract.properties["CT2020"];
                        var centroid = centroids[tract_index];
                        var square_centroid = turf.center({"type": "FeatureCollection", "features": [square]});
                        
                        var distance = turf.distance(centroid, square_centroid, 'miles');
                    
                        if (distance <= 1.0) {
                        
                            var overlap_polygon = turf.intersect(tract, square);
                            if (overlap_polygon != undefined) {
                                
                                var overlap_area = turf.area(overlap_polygon);
                                var tract_area = turf.area(tract);
                                if (ct2020 in populations) {
                                    d += populations[ct2020] * overlap_area/tract_area;
                                } else {
                                    d += 1000.0 * overlap_area/tract_area;
                                }
                            }
                    }

                    
                    
                    var voxel_center = turf.point([lon + voxels_res_lon/2.0, lat + voxels_res_lat/2.0]);
                    for (lpoi in landmark_polygons_of_interest) {
                        if (turf.inside(voxel_center, landmark_polygons_of_interest[lpoi])) {
                            console.log("Inside "+lpoi);
                            d += 500.0;
                        }
                    }
                    
                    
                    //console.log(d);
                    demand[i][j] = d;
                    //console.log("Finished voxel "+(j+(i*voxels_dim))+" of "+voxels_total);
                    bar.tick();
                    if (bar.complete) {
                        console.log('complete!');
                    }
                }
            }
               

            jsonfile.writeFile('demand.json', demand, {spaces: 2}, function(err) {
                console.error(err);
            });
            
        });

        
    });
    
        
});