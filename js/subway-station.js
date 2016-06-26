class Station {
    constructor(marker, name, info, riders) {
        this.marker = marker;
        this.name = name;
        this.info = info;
        this.riders = riders;
        this.lines = [];
        this.id = station_id.generate();
        this.active = true;
    }
    
    delete() {
        // Set the station to "inactive".
        this.active = false;
        
        for (var i = 0; i < N_lines.length; i++) {
            
            // Remove from station array.
            if (is_in_array(this.id, N_lines[i].stations)) {
                var station_id_index = N_lines[i].stations.indexOf(this.id);
                N_lines[i].stations.splice(station_id_index, 1);
            }
            
            // Remove from drawmap.
            if (is_in_array(this.id, N_lines[i].draw_map)) {
                var station_id_index = N_lines[i].draw_map.indexOf(this.id);
                N_lines[i].draw_map.splice(station_id_index, 1);
            }
            
        }
        
    }
}

var N_stations = [];