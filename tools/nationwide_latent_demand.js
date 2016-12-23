var jsonfile = require('jsonfile');
var turf = require('turf');
var ProgressBar = require('progress');
var pg = require('pg');
var argv = require("minimist")(process.argv.slice(2));
var parse = require('csv-parse/lib/sync');
var fs = require('fs');

var settings = {
    "d": "../geojson/dggrid/ny_6.geojson",
    "c": "../geojson/tl_2010_36_tract10.geojson",
    "p": "../../census/census_tracts_list_36.csv",
    "w": "../geojson/usa_water_bodies.geojson"
};

for (var key in argv) {
    if (key in settings) {
        settings[key] = argv[key];
    }
}

var DGGRID_FILE = settings["d"];
var CENSUS_FILE = settings["c"];
var POPULATION_FILE = settings["p"];
var WATER_FILE = settings["w"];

var config = {
    user: 'postgres',
    database: 'transit',
    password: 'metr0n0m3',
    host: 'localhost',
    port: 5432,
    max: 10,
    idleTimeoutMillis: 100000000
};

var pool = new pg.Pool(config);

pool.connect(function(err, client, done) {
    if (err) {
        return console.error('error fetching client from pool', err);
    }

    client.query('CREATE TABLE IF NOT EXISTS dggrid ( \
        id BIGSERIAL PRIMARY KEY, \
        gid bigint UNIQUE, \
        geo geometry \
        ); \
        CREATE TABLE IF NOT EXISTS demographics ( \
        dggrid_id bigint PRIMARY KEY, \
        population int \
    );', function(err, result) {
        done();

        if (err) {
            return console.error('error running query', err);
        } else {
            fs.readFile(POPULATION_FILE, function(pop_err, pop_data) {
                
                if (pop_err) {
                    return console.log(pop_err);
                }
                var population_records = parse(pop_data, {columns: true});
                //console.log(population_records[0]);
                var populations = {};
                var land_area = {};
                
                
                
                jsonfile.readFile(DGGRID_FILE, function(dggrid_err, dggrid_data) {
                    console.log('Loaded DGGrid file '+DGGRID_FILE);

                    var bar = new ProgressBar('  processing [:bar] :percent :etas', {
                        complete: '=',
                        incomplete: ' ',
                        width: 100,
                        total: dggrid_data.features.length
                    });
                    
                    jsonfile.readFile(WATER_FILE, function(water_err, water_data) {

                        jsonfile.readFile(CENSUS_FILE, function(census_err, census_data) {
                            console.log('Loaded census file '+CENSUS_FILE);
                            console.log(census_data.features.length + ' total features');

                            var turf_polygons = {};
                            for (var tract_index = 0; tract_index < census_data.features.length; tract_index++) {
                                var coords = census_data.features[tract_index].geometry.coordinates;
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

                            
                            var population_density = {};
                            var dense_enough = 0;
                            for (var k = 0; k < population_records.length; k++) {
                                var record = population_records[k];
                                land_area[record["GEOID"]] = record["ALAND"];
                                var aland = record["ALAND"]/1000;
                                var awater = record["AWATER"]/1000;
                                var atotal = aland + awater;
                                var scale_factor = 1.0 / (aland / atotal);
                                var population_scaled_for_land = record["POP10"] * scale_factor;
                                populations[record["GEOID"]] = population_scaled_for_land;
                                population_density[record["GEOID"]] = population_scaled_for_land/(record["ALAND"] * .0000003861);
                                if (population_scaled_for_land/(record["ALAND"] * .0000003861) > 1000.0) {
                                    dense_enough += 1;
                                }
                            }
                            console.log(dense_enough + " of " + population_records.length + " tracts are dense enough for consideration");
                            
                            console.log("Calculating centroids");
                            var centroids = [];
                            var water_centroids = [];
                            for (tract_index = 0; tract_index < census_data.features.length; tract_index++) {
                                var turf_centroid = turf.centroid(turf_polygons[tract_index]);
                                
                                //var tract_area = turf.area(turf_polygons[tract_index]);
                                centroids[tract_index] = turf_centroid;
                            }
                            for (var w = 0; w < water_data.features.length; w++) {
                                var water_centroid = turf.centroid(water_data.features[w]);
                                water_centroids[w] = water_centroid;
                            }
                
                            
                            var dggrids_with_overlap = 0;
                            var dggrids_queried = 0;

                            for (var j = 0; j < dggrid_data.features.length; j++) {

                                var feature = dggrid_data.features[j];

                                var dggrid_polygon = {
                                    "type": "Feature",
                                    "properties": {},
                                    "geometry": {
                                        "type": "Polygon",
                                        "coordinates": feature.geometry.coordinates
                                    }
                                };

                                var dggrid_centroid = turf.centroid(dggrid_polygon);

                                var wkt = 'POLYGON((';
                                for (var i = 0; i < feature["geometry"]["coordinates"][0].length; i++) {
                                    var coordinate = feature["geometry"]["coordinates"][0][i];
                                    wkt += coordinate[0];
                                    wkt += ' ';
                                    wkt += coordinate[1];
                                    if (i < feature["geometry"]["coordinates"][0].length - 1) {
                                        wkt += ', ';
                                    } else {
                                        wkt += '))';
                                    }
                                }

                                var has_overlap = false;
                                var all_water = false;
                                
                                var water_features_checked = 0;
                                
                                //console.log("Checked "+water_features_checked+" of "+water_data.features.length+" water features");
                                
                                if (!all_water) {
                                    var dggrid_population = 0.0;
                                    for (tract_index = 0; tract_index < census_data.features.length; tract_index++) {
                                        var tract = census_data.features[tract_index];
                                        var tract_centroid = centroids[tract_index];
                                        var geoid = tract.properties["STATEFP10"] + tract.properties["COUNTYFP10"] + tract.properties["TRACTCE10"];
                                        
                                        if (population_density[geoid] > 1000.0) {
                                            var distance = turf.distance(dggrid_centroid, tract_centroid, 'miles');
                                            //console.log(dggrid_centroid);
                                            //console.log(tract_centroid);
                                            //console.log("Distance is "+distance);
                                            if (distance < 10.0) {
                                                var overlap_polygon = turf.intersect(tract, dggrid_polygon);
                                                if (overlap_polygon != undefined) {
                                                    var population = populations[geoid];
                                                    var area = land_area[geoid];
                                                    has_overlap = true;
                                                    var overlap_area = turf.area(overlap_polygon);
                                                    var new_population = population * (overlap_area/area);
                                                    dggrid_population += new_population;
                                                }
                                            }
                                        }
                                    }
                                    //console.log("\n"+dggrid_population+"\n");
                                    if (has_overlap && (dggrid_population > 10)) {
                                        
                                        /*for (var w = 0; w < water_data.features.length; w++) {
                                            if (!all_water) {
                                                var water_centroid = water_centroids[w];
                                                var water_distance = turf.distance(dggrid_centroid, water_centroid, 'miles');
                                                if (water_distance < 100.0) {
                                                    var water_overlap = turf.intersect(water_data.features[w], dggrid_polygon);
                                                    if (water_overlap != undefined) {
                                                        var dgg_water_pct = turf.area(water_overlap) / turf.area(dggrid_polygon);
                                                        if (dgg_water_pct > 0.7) {
                                                            all_water = true;
                                                        }
                                                    }
                                                    water_features_checked += 1;
                                                }
                                            }
                                        }*/
                                        
                                        if (!all_water) {
                                            dggrids_with_overlap += 1;
                                            
                                            client.query("INSERT INTO dggrid (gid, geo) \
                                                VALUES("+feature.properties.global_id+", ST_GeomFromText('"+wkt+"')); INSERT INTO demographics (dggrid_id, population) \
                                                VALUES("+feature.properties.global_id+", "+Math.round(dggrid_population)+"); ", function(psd_err, psd_result) {
                                                if (psd_err) {
                                                    console.error('error running query', psd_err);
                                                }
                                                done();
                                                
                                                dggrids_queried += 1;
                                                console.log("Query done for dggrid "+dggrids_queried+" of "+dggrids_with_overlap);
                                            });
                                        }
                                        
                                    }
                                }

                                bar.tick();

                            }
                            console.log("Added "+dggrids_with_overlap+" dggrids out of a possible "+dggrid_data.features.length);

                        });

                    }); //jsonfile (water)
                        
                }); // jsonfile (dggrid)
            }); //fs.readFile
        }
    });



});

pool.on('error', function (err, client) {
  console.error('idle client error', err.message, err.stack)
})
