var jsonfile = require('jsonfile');
var turf = require('turf');
var ProgressBar = require('progress');
var pg = require('pg');
var argv = require("minimist")(process.argv.slice(2));
var parse = require('csv-parse/lib/sync');
var fs = require('fs');

var settings = {
    "c": "../geojson/tl_2010_36_tract10.geojson",
    "p": "../../census/census_tracts_list_36.csv",
    "w": "../geojson/usa_water_bodies.geojson"
};

for (var key in argv) {
    if (key in settings) {
        settings[key] = argv[key];
    }
}

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

    client.query('CREATE TABLE IF NOT EXISTS census ( \
        tract_id bigint PRIMARY KEY, \
        geo geometry, \
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
                var populations = {};

                jsonfile.readFile(CENSUS_FILE, function(census_err, census_data) {
                    console.log('Loaded census file '+CENSUS_FILE);
                    console.log(census_data.features.length + ' total features');
                    
                    var bar = new ProgressBar('  processing [:bar] :percent :etas', {
                        complete: '=',
                        incomplete: ' ',
                        width: 100,
                        total: census_data.features.length
                    });
                    
                    for (var k = 0; k < population_records.length; k++) {
                        var record = population_records[k];
                        populations[record["GEOID"]] = record["POP10"];
                    }
                    
                    for (var i = 0; i < census_data.features.length; i++) {
                        var feature = census_data.features[i];
                        
                        var wkt = 'POLYGON((';
                        for (var j = 0; j < feature["geometry"]["coordinates"][0].length; j++) {
                            var coordinate = feature["geometry"]["coordinates"][0][j];
                            wkt += coordinate[0];
                            wkt += ' ';
                            wkt += coordinate[1];
                            if (j < feature["geometry"]["coordinates"][0].length - 1) {
                                wkt += ', ';
                            } else {
                                wkt += '))';
                            }
                        }
                        
                        var geoid = feature.properties["STATEFP10"] + feature.properties["COUNTYFP10"] + feature.properties["TRACTCE10"];
                    
                        //console.log("geoid: "+geoid+", wkt: ..., population: "+populations[geoid]);
                        //console.log(wkt);
                        client.query("INSERT INTO census (tract_id, geo, population) \
                            VALUES("+parseInt(geoid)+", ST_GeomFromText('"+wkt+"'), "+populations[geoid]+");", function(psd_err, psd_result) {
                            if (psd_err) {
                                console.error('error running query', psd_err);
                                console.log(wkt);
                            }
                            done();
                        });
                        


                    }
                    
                    bar.tick();

                });
                        
            }); //fs.readFile
        }
    });



});

pool.on('error', function (err, client) {
  console.error('idle client error', err.message, err.stack)
})
