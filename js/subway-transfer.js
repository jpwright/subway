class Transfer {
    constructor(station_origin, station_end) {
        this.origin = station_origin;
        this.end = station_end;
        return this;
    }
    
    to_json() {
        var json = {
            "s": this.origin,
            "e": this.end
        };
        return json;
    }
    
    draw() {
        var track_options = {color: 'black', weight: TRANSFER_WIDTH, fill: false, smoothFactor: 1.0, offset: 0};
        var track = L.polyline([N_stations[this.origin].marker.getLatLng(), N_stations[this.end].marker.getLatLng()], track_options);
        if (!HEADLESS_MODE) {
            curve_layer.addLayer(track);
            station_layer.bringToFront();
        }
        this.track = track;
    }
    
    undraw() {
        map.removeLayer(this.track);
    }
}
    
var N_transfer_state = 0;
var N_transfer_origin = -1;
var N_transfer_end = -1;