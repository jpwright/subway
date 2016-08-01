class Line {
    constructor(name, html, css, color_bg, color_text) {
        this.name = name;
        this.html = html;
        this.css = css;
        this.color_bg = color_bg;
        this.color_text = color_text;
        this.branch = false;

        this.stations = [];
        this.draw_map = [];
        this.tracks = [];
        this.control_points = [];

        this.id = line_id_generator.generate();
    }

    to_json() {
        var json = {
            "name": this.name,
            "html": this.html,
            "css": this.css,
            "color_bg": this.color_bg,
            "color_text": this.color_text,
            "stations": this.stations,
            "draw_map": this.draw_map,
            "id": this.id
        };
        return json;
    }

    has_station(station_id) {
        if (is_in_array(station_id, this.stations)) {
            return true;
        } else {
            return false;
        }
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

        return this.insert_station_at_pos(station_id, line_insertion_pos);

    }

    insert_station_at_pos(station_id, line_insertion_pos) {

        this.stations.splice(line_insertion_pos, 0, station_id);

        // Add this line to the station's array of lines.
        if (!is_in_array(this.id, N_stations[station_id].lines)) {
            N_stations[station_id].lines.push(this.id);
        }

        // Generate impacted draw maps.
        for (var i = 0; i < N_stations[station_id].lines.length; i++) {
            //N_lines[N_stations[station_id].lines[i]].generate_draw_map();
        }

        return line_insertion_pos;
    }

    remove_station(station_id) {

        if (N_stations[station_id].lines.length == 1) {
            N_stations[station_id].del();
        } else {
            var station_pos = this.stations.indexOf(station_id);
            if (station_pos > -1) {
                this.stations.splice(station_pos, 1);
            }

            var line_pos = N_stations[station_id].lines.indexOf(this.id);
            if (line_pos > -1) {
                N_stations[station_id].lines.splice(line_pos, 1);
            }
        }

    }

    generate_draw_map() {

        // Reset the drawmap for the impacted line.
        this.draw_map = this.stations.slice(0);

        var draw_map_index = 0;

        // Iterate through all stations on this line.
        for (var i = 0; i < this.stations.length - 1; i++) {

            var shared_stretch_found = false;

            if (!is_in_array(this.stations[i], this.draw_map)) {
                this.draw_map.splice(draw_map_index, 0, this.stations[i]);
            }

            // Increment draw_map_index.
            draw_map_index += 1;

            var station_id = this.stations[i];
            var station = N_stations[station_id];


            // Only care if the station is on at least 2 lines.
            if (station.lines.length > 1) {

                // Traverse down each of the other lines and see if we find another station on the current line.
                for (var j = 0; j < station.lines.length; j++) {
                    var relevant_line_id = station.lines[j];
                    var relevant_line = N_lines[relevant_line_id];

                    // Only look at other lines -- not the current one.
                    if (relevant_line_id != this.id) {
                        var start_index = relevant_line.stations.indexOf(station_id);

                        // Check in both directions.
                        for (var dir = -1; dir < 2; dir += 2) {
                            if (dir > 0) {
                                var delta = Math.min(relevant_line.stations.length - 1, start_index + SHARED_STRETCH_THRESHOLD) - start_index;
                            } else {
                                var delta = start_index - Math.max(0, start_index - SHARED_STRETCH_THRESHOLD);
                            }

                            var station_buffer = [];
                            console.log(relevant_line.stations);

                            for (var k = start_index; (k >= (start_index - delta) && k <= (start_index + delta)); k += dir) {

                                station_buffer.push(relevant_line.stations[k]);

                                if (k == -1) {
                                    console.log("Debugme");
                                }

                                var station_is_shared_between_lines = is_in_array(this.id, N_stations[relevant_line.stations[k]].lines);
                                var station_is_close_enough_on_impacted_line = Math.abs(i - this.stations.indexOf(relevant_line.stations[k])) <= SHARED_STRETCH_THRESHOLD;
                                var different_stations = relevant_line.stations[k] != station_id;
                                var more_stations_on_relevant_line = Math.abs(k - start_index) > (this.stations.indexOf(relevant_line.stations[k]) - i);
                                var is_next_station_on_line = relevant_line.stations[k] == this.stations[i + 1];

                                if (station_is_shared_between_lines && station_is_close_enough_on_impacted_line && different_stations && more_stations_on_relevant_line && is_next_station_on_line) {

                                    // Shared stretch found!
                                    // Add all the stations to the drawmap, if not yet present.
                                    // Only allow this to happen once per station, to avoid Canal St N/Q/R bug...
                                    var draw_map_added = 0;

                                    if (!shared_stretch_found) {
                                        for (var m = 0; m < station_buffer.length; m++) {
                                            if (!is_in_array(station_buffer[m], this.draw_map)) {
                                                this.draw_map.splice(draw_map_index, 0, station_buffer[m]);
                                                draw_map_index += 1;
                                                draw_map_added += 1;
                                            }
                                        }
                                        if (draw_map_added > 0) {
                                            shared_stretch_found = true;
                                        }
                                    }

                                }
                            }
                        }


                    }
                }

            }
        }

    }

    generate_control_points () {
        if (USE_CURVED_TRACKS) {
            if (this.draw_map.length > 1) {
                var coordinates = []
                for (var i = 0; i < this.draw_map.length; i++) {
                    coordinates.push({"x": N_stations[this.draw_map[i]].marker.getLatLng().lng, "y": N_stations[this.draw_map[i]].marker.getLatLng().lat});
                }

                var turf_line = {
                    "type": "Feature",
                    "properties": {
                        "stroke": "#f00"
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": coordinates
                    }
                };

                var spline = new BezierSpline({points: coordinates, sharpness: BEZIER_SHARPNESS});

                for (i = 1; i < this.draw_map.length; i++) {
                    var bezier_options = ['M', [N_stations[this.draw_map[i-1]].marker.getLatLng().lat, N_stations[this.draw_map[i-1]].marker.getLatLng().lng]];
                    this.control_points[i-1] = [[spline.controls[i-1][1].y, spline.controls[i-1][1].x], [spline.controls[i][0].y, spline.controls[i][0].x]];
                }
            }
        }
    }

    draw() {

        // Remove existing tracks.
        for (var i = 0; i < this.tracks.length; i++) {
            var track = this.tracks[i];
            map.removeLayer(track);
        }

        // Clear tracks array.
        this.tracks = [];

        var curve_options = {"color": this.color_bg, "weight": TRACK_WIDTH, "fill": false, "smoothFactor": 1.0, "offset": 0, "clickable": false, "pointer-events": "none", "className": "no-hover"};

        if (USE_CURVED_TRACKS) {

            if (this.draw_map.length > 1) {

                for (i = 1; i < this.draw_map.length; i++) {

                    var bezier_options = ['M', [N_stations[this.draw_map[i-1]].marker.getLatLng().lat, N_stations[this.draw_map[i-1]].marker.getLatLng().lng]];

                    //this.control_points[i-1] = [[spline.controls[i-1][1].y, spline.controls[i-1][1].x], [spline.controls[i][0].y, spline.controls[i][0].x]];

                    var station_prev = N_stations[this.draw_map[i-1]];
                    var station_next = N_stations[this.draw_map[i]];
                    var station_drawmaps = station_prev.drawmaps();

                    // Get the number of colors in the tracks between these stations.
                    var common_tracks = sort_by_group(intersect(station_drawmaps, station_next.drawmaps()));
                    var unique_groups = lines_to_groups(common_tracks).sort();

                    var first_line = N_lines[common_tracks[0]];
                    var parity = first_line.draw_map.indexOf(this.draw_map[i]) > first_line.draw_map.indexOf(this.draw_map[i-1]);

                    var unique_group_index = 0;

                    // Get index of this line within the unique groups.
                    for (var j = 0; j < unique_groups.length; j++) {
                        if (is_in_array(this.id, N_line_groups[unique_groups[j]].lines)) {
                            unique_group_index = j;
                        }
                    }

                    // Offset the line accordingly.
                    var swap_control_points = false;
                    if (unique_groups.length > 1) {
                        var c = unique_group_index - (unique_groups.length - 1)/2.0;
                        if (parity) {
                            curve_options["offset"] = c*TRACK_OFFSET;
                        } else {
                            curve_options["offset"] = c*-1*TRACK_OFFSET;
                            swap_control_points = true;
                        }
                    } else {
                        curve_options["offset"] = 0.0;
                    }


                    var control_point_1 = 0.0;
                    var control_point_2 = 0.0;


                    if (station_drawmaps.length == 1) {
                        // No other lines impact this station.

                        control_point_1 = this.control_points[i-1][0];
                        control_point_2 = this.control_points[i-1][1]

                    } else {
                        // Iterate through this other station's drawmaps.
                        var control_points_to_average = [[this.control_points[i-1][0], this.control_points[i-1][1]]];

                        var station_ids_to_check = [N_stations[this.draw_map[i]].id];


                        if (station_next.id == 282 || station_prev.id == 282) {
                            var debugme = true;
                        }

                        for (var j = 0; j < station_drawmaps.length; j++) {
                            // Only consider different lines.
                            if (station_drawmaps[j] != this.id) {
                                var station_position_in_line = N_lines[station_drawmaps[j]].draw_map.indexOf(station_prev.id);

                                // If there's a "next" station to check...
                                if (station_position_in_line + 1 < N_lines[station_drawmaps[j]].draw_map.length) {
                                    if (is_in_array(N_lines[station_drawmaps[j]].draw_map[station_position_in_line + 1], station_ids_to_check)) {
                                        var cp_to_push = N_lines[station_drawmaps[j]].control_points[station_position_in_line];
                                        if (cp_to_push != null) {
                                            control_points_to_average.push(cp_to_push);
                                        }
                                    }
                                }

                                // If there's a "previous" station to check...
                                if (station_position_in_line - 1 >= 0) {
                                    if (is_in_array(N_lines[station_drawmaps[j]].draw_map[station_position_in_line - 1], station_ids_to_check)) {
                                        var cp_to_push = N_lines[station_drawmaps[j]].control_points[station_position_in_line - 1];
                                        if (cp_to_push != null) {
                                            cp_to_push = cp_to_push.slice(0).reverse();
                                            control_points_to_average.push(cp_to_push);
                                        }
                                    }
                                }

                            }
                        }
                        // Average the control points and push them
                        if (control_points_to_average.length > 1) {
                            var cpa = average_control_points(control_points_to_average);
                            control_point_1 = cpa[0];
                            control_point_2 = cpa[1];

                            /*if (swap_control_points) {
                                var control_point_save = control_point_2;
                                control_point_2 = control_point_1;
                                control_point_1 = control_point_save;
                            }*/

                        } else {
                            control_point_1 = this.control_points[i-1][0];
                            control_point_2 = this.control_points[i-1][1];
                        }



                    }

                    bezier_options.push('C');

                    bezier_options.push(control_point_1);
                    bezier_options.push(control_point_2);
                    bezier_options.push([N_stations[this.draw_map[i]].marker.getLatLng().lat, N_stations[this.draw_map[i]].marker.getLatLng().lng]);

                    // For testing control points
                    if (DEBUG_MODE) {
                        debug_layer.addLayer(L.circle([control_point_1[0], control_point_1[1]], 10, {stroke: false, color: 'blue', fillOpacity: 1.0}));
                        debug_layer.addLayer(L.circle([control_point_2[0], control_point_2[1]], 10, {stroke: false, color: 'red', fillOpacity: 1.0}));
                    }


                    var track = L.curve(bezier_options, curve_options);

                    //var track = L.polyline(latlngs, curve_options);
                    curve_layer.addLayer(track);
                    this.tracks.push(track);

                    // Adjust marker styles.
                    station_prev.set_marker_style();
                }


                // Adjust marker style for the station outside the loop.
                N_stations[this.draw_map[this.draw_map.length-1]].set_marker_style();

            }

        } else {

            for (i = 1; i < this.draw_map.length; i++) {

                var station_prev = N_stations[this.draw_map[i-1]];
                var station_next = N_stations[this.draw_map[i]];

                // Get the number of colors in the tracks between these stations.
                var common_tracks = sort_by_group(intersect(station_prev.drawmaps(), station_next.drawmaps()));
                var unique_groups = lines_to_groups(common_tracks).sort();

                var first_line = N_lines[common_tracks[0]];
                var parity = first_line.draw_map.indexOf(this.draw_map[i]) > first_line.draw_map.indexOf(this.draw_map[i-1]);

                var unique_group_index = 0;

                // Get index of this line within the unique groups.
                for (var j = 0; j < unique_groups.length; j++) {
                    if (is_in_array(this.id, N_line_groups[unique_groups[j]].lines)) {
                        unique_group_index = j;
                    }
                }

                // Offset the line accordingly.
                if (unique_groups.length > 1) {
                    var c = unique_group_index - (unique_groups.length - 1)/2.0;
                    if (parity) {
                        curve_options["offset"] = c*TRACK_OFFSET;
                    } else {
                        curve_options["offset"] = c*-1*TRACK_OFFSET;
                    }
                } else {
                    curve_options["offset"] = 0.0;
                }

                // Set the marker size based on number of tracks.
                if (lines_to_groups(station_prev.drawmaps()).length >= STATION_MARKER_LARGE_THRESHOLD || station_prev.lines.length > 8) {
                    station_prev.marker.setRadius(MARKER_RADIUS_LARGE);
                }

                var track = L.polyline([station_prev.marker.getLatLng(), station_next.marker.getLatLng()], curve_options);

                curve_layer.addLayer(track);
                this.tracks.push(track);

            }
        }

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

function find_line_by_html(html) {

    // Loop through all lines, and return the 1st one that matches the html.
    for (var i = 0; i < N_lines.length; i++) {
        if (N_lines[i].html == html) {
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
            if (is_in_array(lines[j], group.lines) && !is_in_array(i, groups)) {
                groups.push(i);
            }
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
        for (var j = 0; j < impacted_line.stations.length - 1; j++) {


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

                            var station_is_shared_between_lines = is_in_array(impacted_line_id, N_stations[relevant_line.stations[l]].lines);
                            var station_is_close_enough_on_impacted_line = Math.abs(j - impacted_line.stations.indexOf(relevant_line.stations[l].id)) <= SHARED_STRETCH_THRESHOLD;
                            var different_stations = relevant_line.stations[l] != station_id;
                            var more_stations_on_relevant_line = (l - start_index) > (impacted_line.stations.indexOf(relevant_line.stations[l].id) - j);
                            var is_next_station_on_line = relevant_line.stations[l].id == impacted_line.stations[j+1].id;

                            if (station_is_shared_between_lines && station_is_close_enough_on_impacted_line && different_stations && more_stations_on_relevant_line && is_next_station_on_line) {

                                // Shared stretch found!
                                // Add all the stations to the drawmap, if not yet present.

                                if (impacted_line_id == 2) {
                                    var end_of_stretch_station = N_stations[relevant_line.stations[l]];
                                    var breakpoint = 0;
                                }

                                for (var m = 0; m < station_buffer.length; m++) {
                                    if (!is_in_array(station_buffer[m], impacted_line.draw_map)) {
                                        impacted_line.draw_map.splice(draw_map_index, 0, station_buffer[m]);
                                        draw_map_index += 1;
                                    }
                                }

                            }
                        }


                    }
                }

            }


        }

        // Add the last station, which we didn't consider for shared stretches.
        impacted_line.draw_map.splice(draw_map_index, 0, impacted_line.stations[impacted_line.stations.length - 1]);
    }

}

var N_lines;
var N_line_groups;
var N_active_line;