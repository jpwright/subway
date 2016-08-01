function create_station_marker(id, latlng_orig) {
    var station = L.circleMarker(latlng_orig, {color: "black", opacity: 1.0, fillColor: "white", fillOpacity: 1.0, zIndexOffset: 100}).setRadius(MARKER_RADIUS_DEFAULT);

    station.on('click', function(s_e) {

        // Disable new station creation.
        map.off('click', handle_map_click);

        if (transfer_state == 1) {

            transfer_end = id;
            transfer_state = 0;

            var different_stations = transfer_origin != transfer_end;
            var stations_exist = (N_stations[transfer_origin].active && N_stations[transfer_end]);
            if (different_stations && stations_exist) {
                var transfer = new Transfer(transfer_origin, transfer_end);
                transfer.draw();
                N_transfers.push(transfer);
            }
            generate_route_diagram(N_active_line);

        }

        // Wait a second before you can create a new station.
        setTimeout(function() {
            map.on('click', handle_map_click);
        }, 1000);
    });

    station_layer.addLayer(station);
    return station;
}

function handle_map_click(e) {

    var latlng = e.latlng;

    if (N_active_line != null) {

        var geo = new Geocoder(latlng);
        geo.geocode(N_active_line); // Pass the active line in case it changes. Contains a call back to create the station

    }

}

function delete_station_event(e) {

    var station_id = $(this).attr('id').replace('delete-', '');
    var station = N_stations[station_id];

    var impacted_lines = N_stations[station_id].drawmaps();
    var station_lines = impacted_lines;

    for (var i = 0; i < station_lines.length; i++) {
        var line_id = station_lines[i];
        var line = N_lines[line_id];

        var index = line.stations.indexOf(station_id);

        var start_index = Math.max(0, index - SHARED_STRETCH_THRESHOLD);
        var end_index = Math.min(index + SHARED_STRETCH_THRESHOLD, line.stations.length);

        // Add drawmaps of nearby stations
        for (var j = start_index; j < end_index; j++) {
            var drawmaps = N_stations[line.stations[j]].drawmaps();
            for (var k = 0; k < drawmaps.length; k++) {
                if (!is_in_array(drawmaps[k], impacted_lines)) {
                    impacted_lines.push(drawmaps[k]);
                }
            }
        }

    }

    N_stations[station_id].del();


    for (var i = 0; i < impacted_lines.length; i++) {
        N_lines[impacted_lines[i]].generate_draw_map();
        N_lines[impacted_lines[i]].generate_control_points();
    }
    for (var i = 0; i < impacted_lines.length; i++) {
        N_lines[impacted_lines[i]].draw();
    }

    station_layer.bringToFront();
    regenerate_popups();
    generate_route_diagram(N_active_line);
    calculate_total_ridership();

}

function remove_line_from_station_event(e) {

    var event_comps = $(this).attr('id').split(':');
    var station_id_to_remove = parseInt(event_comps[0]);
    var line_id_to_remove = parseInt(event_comps[1]);

    var impacted_lines = N_stations[station_id_to_remove].drawmaps();
    var station_lines = N_stations[station_id_to_remove].lines;

    for (var i = 0; i < station_lines.length; i++) {
        var line_id = station_lines[i];
        var line = N_lines[line_id];

        var new_index = line.stations.indexOf(station_id_to_remove);

        var start_index = Math.max(0, new_index - SHARED_STRETCH_THRESHOLD);
        var end_index = Math.min(new_index + SHARED_STRETCH_THRESHOLD, line.stations.length);

        // Add drawmaps of nearby stations
        for (var j = start_index; j < end_index; j++) {
            var drawmaps = N_stations[line.stations[j]].drawmaps();
            for (var k = 0; k < drawmaps.length; k++) {
                if (!is_in_array(drawmaps[k], impacted_lines))
                    impacted_lines.push(drawmaps[k]);
            }
        }

    }

    N_lines[line_id_to_remove].remove_station(station_id_to_remove);

    for (var i = 0; i < impacted_lines.length; i++) {
        N_lines[impacted_lines[i]].generate_draw_map();
        N_lines[impacted_lines[i]].generate_control_points();
    }
    for (var i = 0; i < impacted_lines.length; i++) {
        N_lines[impacted_lines[i]].draw();
    }

    station_layer.bringToFront();

    regenerate_popups();
    generate_route_diagram(N_active_line);

    $(this).remove();


}

function build_to_station_event(e) {


    var station_id = $(this).attr('id').replace('build-', '');
    var impacted_lines = N_stations[station_id].drawmaps();

    var build_classes = $(this).attr('class').split(' ');
    var station_lines = [];
    for (c in build_classes) {
        if (build_classes[c].indexOf('line-') > -1) {
            var line = build_classes[c].replace('line-', '');
            station_lines.push(parseInt(line));
            if (!is_in_array(parseInt(line), impacted_lines))
                impacted_lines.push(parseInt(line));
        }
    }

    for (var i = 0; i < station_lines.length; i++) {
        var line_id = station_lines[i];
        var line = N_lines[line_id];

        $('div.subway-lines').append('<div class="subway-line '+line.css+'"><div class="height_fix"></div><div class="content">'+line.html+'</div></div>');

        var new_index = line.insert_station(parseInt(station_id));

        var start_index = Math.max(0, new_index - SHARED_STRETCH_THRESHOLD);
        var end_index = Math.min(new_index + SHARED_STRETCH_THRESHOLD, line.stations.length);

        // Add drawmaps of nearby stations
        for (var j = start_index; j < end_index; j++) {
            var drawmaps = N_stations[line.stations[j]].drawmaps();
            for (var k = 0; k < drawmaps.length; k++) {
                if (!is_in_array(drawmaps[k], impacted_lines))
                    impacted_lines.push(drawmaps[k]);
            }
        }

    }

    for (var i = 0; i < impacted_lines.length; i++) {
        N_lines[impacted_lines[i]].generate_draw_map();
        N_lines[impacted_lines[i]].generate_control_points();
    }
    for (var i = 0; i < impacted_lines.length; i++) {
        N_lines[impacted_lines[i]].draw();
    }

    station_layer.bringToFront();

    regenerate_popups();
    generate_route_diagram(N_active_line);
}

function transfer_station_event(e) {

    var station_id = $(this).attr('id').replace('transfer-', '');
    var station = N_stations[station_id];

    if (transfer_state == 0) {
        transfer_origin = station_id;
        transfer_state = 1;
    }

}

function line_select_click_handler(td) {

    if ($(td).hasClass('subway-selected')) {
        $(td).removeClass('subway-selected');
        active_line = 'None';
        N_active_line = null;
    } else {
        $('.subway-clickable').removeClass('subway-selected');
        $(td).addClass('subway-selected');
        if ($(td).attr('id') == "subway-airtrain-jfk") {
            // Special case for AirTrain.
            N_active_line = find_line_by_name("AirTrain JFK", 1);

        } else if ($(td).attr('id') == "subway-airtrain-lga") {
            // Special case for AirTrain.
            N_active_line = find_line_by_name("AirTrain LGA", 1);
        } else if ($(td).attr('id') == "subway-airtrain-jfk-howard") {
            // Special case for AirTrain.
            N_active_line = find_line_by_name("AirTrain JFK-Howard", 1);
        } else if ($(td).attr('id') == "subway-airtrain-jfk-archer") {
            // Special case for AirTrain.
            N_active_line = find_line_by_name("AirTrain JFK-Archer", 1);
        } else if ($(td).attr('id') == "subway-airtrain-jfk-connectors") {
            // Special case for AirTrain.
            N_active_line = find_line_by_name("AirTrain JFK-Connectors", 1);
        } else if ($(td).attr('id') == "subway-a-euclid") {
            // Special case for AirTrain.
            N_active_line = find_line_by_name("A-Euclid", 1);

        } else if ($(td).hasClass("subway-shuttle")) {
            active_line = $(td).attr('id');
            N_active_line = find_line_by_name($(td).attr('id'));
            if ($(td).hasClass("subway-shuttle-add")) {
                $(td).children(".content").text("S");
                $(td).removeClass("subway-shuttle-add");
                number_of_shuttles += 1;
                if (number_of_shuttles < 4) {
                    $(td).parent().append(newShuttleTemplate(number_of_shuttles+1));
                }
            }
        } else {
            active_line = $(td).text();
            N_active_line = find_line_by_html($(td).text(), 1);
        }
    }
    regenerate_popups();
    generate_route_diagram(N_active_line);
}