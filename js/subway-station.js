class Station {
    constructor(marker, name, info, riders) {
        this.marker = marker;
        this.name = name;
        this.info = info;
        this.riders = riders;

        this.lines = []; // Lines that contain this station.
        this.drawmaps = []; // Lines that contain this station within its draw map.

        this.id = station_id.generate();
        this.active = true;
    }

    generate_popup() {

    }

    delete() {
        // Set the station to "inactive".
        this.active = false;

        var impacted_lines = [];

        for (var i = 0; i < N_lines.length; i++) {

            // Remove from station array.
            if (is_in_array(this.id, N_lines[i].stations)) {
                if (!is_in_array(i, impacted_lines))
                    impacted_lines.push(i);
                var station_id_index = N_lines[i].stations.indexOf(this.id);
                N_lines[i].stations.splice(station_id_index, 1);
            }

            // Remove from drawmap.
            if (is_in_array(this.id, N_lines[i].draw_map)) {
                if (!is_in_array(i, impacted_lines))
                    impacted_lines.push(i);
                var station_id_index = N_lines[i].draw_map.indexOf(this.id);
                N_lines[i].draw_map.splice(station_id_index, 1);
            }

        }

        // Regenerate drawmaps.
        generate_draw_map(impacted_lines);

    }
}

var N_stations = [];