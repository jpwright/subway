var jsonfile = require('jsonfile');
var turf = require('turf');
var ProgressBar = require('progress');
var pg = require('pg');

var NODE_SPACING = 0.1;
var DGGRID_FILE = '../geojson/dggrid/usa_1.geojson';
var CENSUS_FILE = '../geojson/cb_2015_36_tract_500k.geojson'

var config = {
    user: 'postgres',
    database: 'transit',
    password: 'metr0n0m3',
    host: 'localhost',
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000
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
    )', function(err, result) {
        done();

        if (err) {
            return console.error('error running query', err);
        } else {
            jsonfile.readFile(DGGRID_FILE, function(dggrid_err, dggrid_data) {
                console.log('Loaded DGGrid file');

                var bar = new ProgressBar('  processing [:bar] :percent :etas', {
                    complete: '=',
                    incomplete: ' ',
                    width: 100,
                    total: dggrid_data.features.length
                });

                jsonfile.readFile(CENSUS_FILE, function(census_err, census_data) {
                    console.log('Loaded census file');

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

                    console.log("Calculating centroids");
                    var centroids = [];
                    for (tract_index = 0; tract_index < census_data.features.length; tract_index++) {
                        var turf_centroid = turf.centroid(census_data.features[tract_index]);
                        //var tract_area = turf.area(turf_polygons[tract_index]);
                        centroids[tract_index] = turf_centroid;
                    }

                    for (var j = 0; j < dggrid_data.features.length; j++) {

                        var feature = dggrid_data.features[j];

                        var dggrid_polygon = {
                            "type": "Feature",
                            "properties": {},
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": feature.geometry.coordinates;
                            }
                        };

                        var dggrid_centroid = turf.center({"type": "FeatureCollection", "features": [dggrid_polygon]});

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

                        for (tract_index = 0; tract_index < census_data.features.length; tract_index++) {
                            var tract = census_data.features[tract_index];
                            var tract_centroid = centroids[tract_index];
                            var distance = turf.distance(dggrid_centroid, tract_centroid, 'miles');

                            if (distance < 20.0) {
                                var overlap_polygon = turf.intersect(tract, dggrid_polygon);
                                if (overlap_polygon != undefined) {
                                    console.log("overlap with tract at position "+tract_index);
                                    client.query("INSERT INTO dggrid (gid, geo) \
                                        VALUES("+feature.properties.global_id+", ST_GeomFromText('"+wkt+"'))", function(err, result) {
                                        done();

                                        if (err) {
                                            return console.error('error running query', err);
                                        }
                                    });
                                }
                            }
                        }

                        bar.tick();

                    }
                });

            });
        }
    });



});

pool.on('error', function (err, client) {
  console.error('idle client error', err.message, err.stack)
})