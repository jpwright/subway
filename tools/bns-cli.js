var jsdom = require("node-jsdom");
var argv = require("minimist")(process.argv.slice(2));

var settings = {
    "p": "8000",
    "f": "../game-starters/game-start-2016.json"
};

for (var key in argv) {
    if (key in settings) {
        settings[key] = argv[key];
    }
}

var game_json = require(settings["f"]);

var required_js = [
    "https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js",
    "https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js",
    "https://cdn.jsdelivr.net/leaflet/1.0.0-rc.1/leaflet-src.js",
    "https://cdn.jsdelivr.net/leaflet.esri/2.0.0-beta.8/esri-leaflet.js",
    "https://cdn.jsdelivr.net/leaflet.esri.geocoder/2.0.2/esri-leaflet-geocoder.js",
    "https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/Leaflet.fullscreen.min.js",
    "../js/leaflet.curve.js",
    "../js/leaflet-pip.js",
    "../js/turf.min.js",
    "../js/spline.js",
    "../js/bezier.js",
    "../js/FileSaver.min.js",
    "../js/subway-settings.js",
    "../js/subway-utils.js",
    "../js/subway-files.js",
    "../js/subway-id-generator.js",
    "../js/subway-station.js",
    "../js/subway-line.js",
    "../js/subway-transfer.js",
    "../js/subway-geocoding.js",
    "../js/subway-map-events.js",
    "../js/subway-data.js",
    "../js/subway-main-headless.js"
];

jsdom.env("http://localhost:"+settings["p"], required_js, function(err, window) {
    
    if (err) {
        console.log(err);
    }
    
    setTimeout(function() {
        window.load_game_json(game_json);
        console.log(window.calculate_total_ridership());
    }, 500);
    
    
});