class Line {
    constructor(name, html, css, color_bg, color_text) {
        this.name = name;
        this.html = html;
        this.css = css;
        this.color_bg = color_bg;
        this.color_text = color_text;

        this.stations = [];
        this.draw_map = [];
        this.tracks = [];

        this.id = line_id.generate();
    }

    has_station(station_id) {
        if (is_in_array(station_id, this.stations))
            return true;
        else
            return false;
    }

    insert_station(station_id) {

        var line_insertion_pos = 0;
        var line_insertion_best = -1;
        var line_length = this.stations.length;

        if (line_length > 0) {

            var clone = this.stations.slice(0);
            var line_insertion_best = -1;
            var line_insertion_pos = 0;

            for (var q = 0; q <= line_length; q++) {

                clone.splice(q, 0, station_id);

                // Compute total distance
                var total_distance = 0;
                for (var r = 1; r <= line_length; r++) {
                    var st_prev = N_stations[clone[r-1]].marker.getLatLng();
                    var st_next = N_stations[clone[r]].marker.getLatLng();
                    total_distance += Math.pow((Math.pow(st_prev.lat - st_next.lat, 2) + Math.pow(st_prev.lng - st_next.lng, 2)), 0.5);
                }
                if (total_distance < line_insertion_best || line_insertion_best == -1) {
                    line_insertion_pos = q;
                    line_insertion_best = total_distance;
                }
                clone = this.stations.slice(0);
            }
        }

        this.stations.splice(line_insertion_pos, 0, station_id);

        // Add this line to the station's array of lines.
        if (!is_in_array(this.id, N_stations[station_id].lines))
            N_stations[station_id].lines.push(this.id);

        // Add this line to the station's array of drawmaps.
        if (!is_in_array(this.id, N_stations[station_id].drawmaps))
            N_stations[station_id].drawmaps.push(this.id);

        // Generate impacted draw maps.
        generate_draw_map(N_stations[station_id].lines);

        return line_insertion_pos;
    }

    draw() {
        // Remove existing tracks.
        for (var i = 0; i < this.tracks.length; i++) {
            var track = this.tracks[i];
            map.removeLayer(track);
        }

        // Clear tracks array.
        this.tracks = [];

        var curve_options = {color: this.color_bg, weight: 8, fill: false, smoothFactor: 1.0, offset: 0};

        var cp_lat = 0.0;
        var cp_lng = 0.0;
        var cp_set = false;

        for (i = 1; i < this.draw_map.length; i++) {

            var station_prev = N_stations[this.draw_map[i-1]];
            var station_next = N_stations[this.draw_map[i]];

            // Get the number of colors in the tracks between these stations.
            var common_tracks = intersect(station_prev.drawmaps, station_next.drawmaps);
            var unique_groups = lines_to_groups(common_tracks);

            var unique_group_index = 0;
            // Get index of this line within the unique groups.
            for (var j = 0; j < unique_groups.length; j++) {
                if (is_in_array(this.id, N_line_groups[unique_groups[j]].lines))
                    unique_group_index = j;
            }

            if (unique_groups.length > 1) {
                var c = unique_group_index - (unique_groups.length - 1)/2.0;
                curve_options["offset"] = c*8.0;
            } else {
                curve_options["offset"] = 0.0;
            }
            var track = L.polyline([station_prev.marker.getLatLng(), station_next.marker.getLatLng()], curve_options);
            curve_layer.addLayer(track);
            this.tracks.push(track);
        }

        station_layer.bringToFront();
    }

}

class LineGroup {

    constructor(name, lines) {
        this.name = name;
        this.lines = lines;
    }

    add_line(line_id) {
        if (!is_in_array(line_id, this.lines)) {
            this.lines.push(line_id);
        }
    }

    remove_line(line_id) {
        if (is_in_array(line_id, this.lines)) {
            var line_id_index = this.lines.indexOf(line_id);
            this.lines.splice(line_id_index, 1);
        }
    }
}


function find_line_by_name(name) {

    // Loop through all lines, and return the 1st one that matches the name.
    for (var i = 0; i < N_lines.length; i++) {
        if (N_lines[i].name == name) {
            return N_lines[i];
        }
    }

    return null;
}

function lines_to_groups(lines) {

    var groups = [];
    for (var i = 0; i < N_line_groups.length; i++) {
        var group = N_line_groups[i];
        for (var j = 0; j < lines.length; j++) {
            if (is_in_array(lines[j], group.lines) && !is_in_array(i, groups))
                groups.push(i);
        }
    }
    return groups;
}

function generate_draw_map(impacted_lines) {

    // Iterate through all impacted lines.

    for (var i = 0; i < impacted_lines.length; i++) {
        var impacted_line_id = impacted_lines[i];
        var impacted_line = N_lines[impacted_line_id];

        // Reset the drawmap for the impacted line.
        // impacted_line.draw_map = impacted_line.stations.slice(0);

        var draw_map_index = 0;

        // Iterate through all stations on this line.
        for (var j = 0; j < impacted_line.stations.length; j++) {


            if (!is_in_array(impacted_line.stations[j], impacted_line.draw_map)) {
                impacted_line.draw_map.splice(draw_map_index, 0, impacted_line.stations[j]);
            }


            // Increment draw_map_index.
            draw_map_index += 1;

            var station_id = impacted_line.stations[j];
            var station = N_stations[station_id];

            // Only care if the station is on at least 2 impacted lines.
            var relevant_lines = intersect(station.lines, impacted_lines);
            if (relevant_lines.length > 1) {

                // Traverse down each of the other relevant lines and see if we find another station on the current line.
                for (var k = 0; k < relevant_lines.length; k++) {
                    var relevant_line_id = relevant_lines[k];
                    var relevant_line = N_lines[relevant_line_id];

                    // Only look at other lines -- not the current one.
                    if (relevant_line_id != impacted_line_id) {
                        var start_index = relevant_line.stations.indexOf(station_id);
                        var end_index = Math.min(relevant_line.stations.length - 1, start_index + SHARED_STRETCH_THRESHOLD);
                        var station_buffer = [];

                        for (var l = start_index; l <= end_index; l++) {
                            station_buffer.push(relevant_line.stations[l]);
                            if (is_in_array(impacted_line_id, N_stations[relevant_line.stations[l]].lines)) {
                                // Shared stretch found!
                                // Add all the stations to the drawmap, if not yet present.
                                for (var m = 0; m < station_buffer.length; m++) {
                                    if (!is_in_array(station_buffer[m], impacted_line.draw_map)) {
                                        impacted_line.draw_map.splice(draw_map_index, 0, station_buffer[m]);
                                        draw_map_index += 1;
                                    }
                                    if (!is_in_array(impacted_line_id, N_stations[station_buffer[m]].drawmaps))
                                        N_stations[station_buffer[m]].drawmaps.push(impacted_line_id);
                                }

                            }
                        }


                    }
                }

            }


        }
    }

    // Iterate through the impacted stations.

    // Old approach
    /*

    var shared_stretches = [];
    var station_comparisons_made = [];

    for (i = 0; i < impacted_stations.length; i++) {
        for (j = 0; j < impacted_stations.length; j++) {

            // We only care about station pairs we haven't already considered, and about comparing different stations.
            if (!is_in_2d_array(station_comparisons_made, impacted_stations[i], impacted_stations[j]) && (i != j)) {

                // Store this comparison.
                station_comparisons_made.push([impacted_stations[i], impacted_stations[j]]);

                // They must share at least two common lines.
                var common_lines = [];
                for (var k = 0; k < impacted_lines.length; k++) {
                    if (is_in_array(impacted_stations[i], impacted_lines[k].stations) && is_in_array(impacted_stations[j], impacted_lines[k].stations))
                        common_lines.push(impacted_lines[k]);
                }

                if (common_lines.length > 1) {

    */

    /*

                    var st_shared_stretch = [];
                    var st_shared_used = [];

                    if (common_lines.length > 1 && i != j) {
                        //console.log("Stations ("+i.toString()+", "+j.toString()+") have common lines: ");
                        //console.log(common_lines);
                        var comparisons_made = [];

                        // Compare the position in each common line
                        for (var m = 0; m < common_lines.length; m++) {
                            for (var n = 0; n < common_lines.length; n++) {
                                var comparison = [m, n];
                                if (!isIn2dArray(comparisons_made, m, n)) {
                                    comparisons_made.push(comparison);

                                    // Process line pair

                                    st_i_m = station_associations[common_lines[m]].indexOf(stations[i]);
                                    st_i_n = station_associations[common_lines[n]].indexOf(stations[i]);
                                    st_j_m = station_associations[common_lines[m]].indexOf(stations[j]);
                                    st_j_n = station_associations[common_lines[n]].indexOf(stations[j]);

                                    // At least one side has to have a diff of 1.
                                    diff_m = Math.abs(st_i_m - st_j_m);
                                    diff_n = Math.abs(st_i_n - st_j_n);

                                    // If one line has a diff of 1 and the other has a diff within the threshold...
                                    if ((diff_m == 1 && diff_n <= SHARED_STRETCH_THRESHOLD) || (diff_n == 1 && diff_m <= SHARED_STRETCH_THRESHOLD)) {

                                        // Add the appropriate pair.
                                        if (st_shared_used.indexOf(m) == -1) {
                                            st_shared_used.push(m);
                                            st_shared_stretch.push({"line": common_lines[m], "start": Math.min(st_i_m, st_j_m), "end": Math.max(st_i_m, st_j_m)});
                                        }
                                        if (st_shared_used.indexOf(n) == -1) {
                                            st_shared_used.push(n);
                                            st_shared_stretch.push({"line": common_lines[n], "start": Math.min(st_i_n, st_j_n), "end": Math.max(st_i_n, st_j_n)});
                                        }
                                    }

                                }
                            }
                        }

                        if (st_shared_used.length > 0) {

                            // Before pushing the stretch, check if it overlaps with any existing stretches.

                            var add_this_stretch = true;
                            var remove_these_stretches = [];

                            for (var q = 0; q < shared_stretches.length; q++) {
                                var st_view = shared_stretches[q];
                                for (var r = 0; r < st_view.length; r++) {
                                    var stretch_line = st_view[r].line;
                                    for (var s = 0; s < st_shared_stretch.length; s++) {
                                        if (stretch_line == st_shared_stretch[s].line) {
                                            r_start = st_view[r].start;
                                            r_end = st_view[r].end;
                                            s_start = st_shared_stretch[s].start;
                                            s_end = st_shared_stretch[s].end;

                                            // If it's encompassed by a longer stretch on the same line, don't add it.
                                            if (s_start >= r_start && s_end <= r_end) {
                                                add_this_stretch = false;
                                            }

                                            // If it encompasses a shorter stretch on the same line, remove the shorter one.
                                            if (s_start <= r_start && s_end >= r_end) {
                                                remove_these_stretches.push(q);
                                            }

                                        }
                                    }
                                }
                            }

                            //console.log("Shared stretches length = "+shared_stretches.length.toString());
                            if (remove_these_stretches.length > 0) {
                                //console.log("Removing "+remove_these_stretches.length.toString()+" stretches");
                                for (var t = remove_these_stretches.length - 1; t >= 0; t--) {
                                    shared_stretches.splice(remove_these_stretches[t], 1);
                                }
                            }

                            if (add_this_stretch) {
                                //console.log("Adding a stretch");
                                shared_stretches.push(st_shared_stretch);
                            }
                        }

                    }
                }

            }
        }

        */

}

var N_lines;
var N_line_groups;
var N_active_line;