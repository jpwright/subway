var jsonfile = require('jsonfile');
var turf = require('turf');
var ProgressBar = require('progress');
var pg = require('pg');
var argv = require("minimist")(process.argv.slice(2));
var parse = require('csv-parse/lib/sync');
var fs = require('fs');

var settings = {
    "d": "../../dggrid/output/ny_1.geojson",
    "c": "../geojson/tabblock2010_simplified.geojson",
    "w": "../geojson/usa_water_bodies.geojson"
};

for (var key in argv) {
    if (key in settings) {
        settings[key] = argv[key];
    }
}

var DGGRID_FILE = settings["d"];
var CENSUS_FILE = settings["c"];
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

var dggrids_with_overlap = 0;
var dggrids_queried = 0;

pool.connect(function(err, client, done) {
    if (err) {
        return console.error('error fetching client from pool', err);
    }

    client.query('CREATE TABLE IF NOT EXISTS dggrid ( \
        id BIGSERIAL PRIMARY KEY, \
        gid bigint UNIQUE, \
        geo geometry, \
        population int \
    );', function(err, result) {
        //done();

        if (err) {
            return console.error('error running query', err);
        } else {

            jsonfile.readFile(DGGRID_FILE, function(dggrid_err, dggrid_data) {
                console.log('Loaded DGGrid file '+DGGRID_FILE);
                console.log(dggrid_data.features.length + " total dggrids");
                var bar = new ProgressBar('  processing [:bar] :percent :etas', {
                    complete: '=',
                    incomplete: ' ',
                    width: 100,
                    total: dggrid_data.features.length
                });

                jsonfile.readFile(CENSUS_FILE, function(census_err, census_data) {
                    
                    if (census_err) {
                        return console.error('error: '+census_err);
                    }
                    
                    console.log('Loaded census file '+CENSUS_FILE);
                    console.log(census_data.features.length + ' total features');

                    var populations = [];
                    var centroids = [];
                    var block_areas = [];
                    var geoids = [];
                    
                    for (var k = 0; k < census_data.features.length; k++) {
                        var block = census_data.features[k];
                        
                        var centroid = turf.centroid(block);
                        centroids[k] = centroid;
                        
                        var area = turf.area(block);
                        block_areas[k] = area;
                        
                    }

                    for (var j = 0; j < dggrid_data.features.length; j++) {

                        var feature = dggrid_data.features[j];
                        var gid = feature.properties.global_id;

                        var dggrid_polygon = {
                            "type": "Feature",
                            "properties": {},
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": feature.geometry.coordinates
                            }
                        };

                        var dggrid_centroid = turf.centroid(dggrid_polygon);
                        //var dggrid_area = turf.area(dggrid_polygon);

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
                        
                        var dggrid_population = 0.0;
                        for (block_index = 0; block_index < census_data.features.length; block_index++) {
                            var block = census_data.features[block_index];
                            var block_centroid = centroids[block_index];
                            var geoid = block.properties["BLOCKID10"];
                            
                            if (block.properties["POP10"] > 0) {
                                
                                var distance = turf.distance(dggrid_centroid, block_centroid, 'miles');
                                if (distance < 5.0) {
                                    var overlap_polygon = turf.intersect(block, dggrid_polygon);
                                    if (overlap_polygon != undefined) {
                                        //console.log("overlap");
                                        var population = block.properties["POP10"];
                                        var area = block_areas[block_index];
                                        
                                        has_overlap = true;
                                        var overlap_area = turf.area(overlap_polygon);
                                        var new_population = population * (overlap_area/area);
                                        dggrid_population += new_population;
                                    }
                                }
                                
                            }
                        }
                        
                        if (has_overlap && (Math.round(dggrid_population) > 5)) {
                            
                            dggrids_with_overlap += 1;
                            
                            //pool.connect(function(err, new_client, new_done) {

                                
                            var s_gid = JSON.parse(JSON.stringify(gid));
                            var s_population = JSON.parse(JSON.stringify(Math.round(dggrid_population)));
                            var s_wkt = JSON.parse(JSON.stringify(wkt));
                            
                            db_sync(client, s_gid, s_population, s_wkt);
                                    
                                
                            //});
                        }

                        bar.tick();

                    }
                    console.log("Added/updated "+dggrids_with_overlap+" dggrids out of a possible "+dggrid_data.features.length);
                    if (dggrids_with_overlap == 0) {
                        process.exit();
                    }

                });
                    
            }); // jsonfile (dggrid)
        }
    });



});

function db_sync(client, s_gid, s_population, s_wkt) {
    var sel_result = client.query("SELECT id FROM dggrid WHERE gid="+s_gid+";", function(sel_err, sel_result) {

        
        if (sel_err) {
            console.error('error running query', sel_err);
        }
        
        if (sel_result.rows.length >= 1) {
            client.query("UPDATE dggrid \
                SET population = "+s_population+" WHERE gid = "+s_gid+";", function(psd_err, psd_result) {
                
                if (psd_err) {
                    console.error('error running query', psd_err);
                }
                
                dggrids_queried += 1;
                //console.log("Query done for dggrid "+dggrids_queried+" of "+dggrids_with_overlap);
                if (dggrids_queried == dggrids_with_overlap) {
                    process.exit();
                }
            });
        } else {
        
            client.query("INSERT INTO dggrid (gid, geo, population) \
                VALUES("+s_gid+", ST_GeomFromText('"+s_wkt+"'), "+s_population+");", function(psd_err, psd_result) {
                
                if (psd_err) {
                    console.error('error running query', psd_err);
                }
                
                dggrids_queried += 1;
                //console.log("Query done for dggrid "+dggrids_queried+" of "+dggrids_with_overlap);
                if (dggrids_queried == dggrids_with_overlap) {
                    process.exit();
                }
            });
            
        }
        
    });
}

pool.on('error', function (err, client) {
  console.error('idle client error', err.message, err.stack)
})
