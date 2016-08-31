var jsonfile = require('jsonfile');
var turf = require('turf');
var ProgressBar = require('progress');
var pg = require('pg');

var NODE_SPACING = 0.1;
var DGGRID_FILE = '../geojson/dggrid/nyc_1.geojson';

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
            jsonfile.readFile(DGGRID_FILE, function(err, data) {
                console.log('Loaded DGGrid file');
                
                for (var j = 0; j < data.features.length; j++) {
                    
                    var feature = data.features[j];
                
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
                    
                    client.query("INSERT INTO dggrid (gid, geo) \
                        VALUES("+feature.properties.global_id+", ST_GeomFromText('"+wkt+"'))", function(err, result) {
                        done();
                        
                        if (err) {
                            return console.error('error running query', err);
                        }
                    });
                    
                }
            });
        }
    });
    
    
    
});

pool.on('error', function (err, client) {
  console.error('idle client error', err.message, err.stack)
})