function handle_files(files) {
    if (!files.length) {
        console.log("No files selected");
    } else {
        console.log(files);
    }

    var f = files[0];

    var reader = new FileReader();
    reader.onload = (function(theFile) {
        return function(e) {
            // Render thumbnail.
            var data = JSON.parse(e.target.result);
            console.log(data);
            load_game_json(data);
            $("#starter").hide();
        };
    })(f);

    // Read in the image file as a data URL.
    var d = reader.readAsText(f);

}

function handle_server_file(file) {
    $.getJSON(file, function(data) {
        load_game_json(data);
    });
}

function load_game_json(data) {
    console.log(data);
    initialize_game_state();
    console.log(data);
    $("#custom-lines").empty();
    $("#custom-lines").hide();

    for (var j = 0; j < data["lines"].length; j++) {
        var d = data["lines"][j];
        var line_id = d["id"];
        
        if (line_id < N_lines.length) {
            N_lines[line_id].stations = d["stations"];
            N_lines[line_id].draw_map = d["draw_map"];
        } else {
            add_custom_line(d.html, d.css, d.color_bg, d.color_text);
            add_custom_line_selector(N_lines[j].html, N_lines[j].css, N_lines[j].color_bg, N_lines[j].color_text);
            N_lines[j].stations = d["stations"];
            N_lines[j].draw_map = d["draw_map"];
        }
    }

    var fix_corrupt_game = false;
    var fix_boroughs = false;

    for (var i = 0; i < data["stations"].length; i++) {
        var d = data["stations"][i];

        var station = new Station(d["lat"], d["lng"], d["name"], d["info"], d["riders"]);
        station.lines = d["lines"];
        if (!fix_corrupt_game) {
            for (var j = 0; j < station.lines.length; j++) {
                if (!is_in_array(station.id, N_lines[station.lines[j]].stations)) {
                    fix_corrupt_game = true;
                }
            }
        }
        if (!fix_boroughs) {
            if (station.borough == "None") {
                fix_boroughs = true;
            }
        }
        //station.drawmaps = d["drawmaps"];
        N_stations[station.id] = station;

        if (!d["active"]) {
            N_stations[station.id].del();
        }

        station.generate_popup();
    }

    // Correct line array in each station in case of corrupted save game
    if (fix_corrupt_game) {
        for (var i = 0; i < N_stations.length; i++) {
            N_stations[i].lines = [];
        }
        for (var j = 0; j < N_lines.length; j++) {
            var line_stations  = N_lines[j].stations;
            for (var k = 0; k < line_stations.length; k++) {
                N_stations[line_stations[k]].lines.push(N_lines[j].id);
            }
        }
    }

    if (fix_boroughs) {
        futz_boroughs();
    }

    for (var k = 0; k < N_lines.length; k++) {
        console.log(N_lines[k]);
        N_lines[k].generate_draw_map();
        N_lines[k].generate_control_points();
    }
    for (var k = 0; k < N_lines.length; k++) {
        N_lines[k].draw();
    }

    for (var q = 0; q < data["transfers"].length; q++) {
        var d = data["transfers"][q];
        var t = new Transfer(d["s"], d["e"]);
        t.draw();
        N_transfers.push(t);
    }
    
    if (!HEADLESS_MODE) {
        station_layer.bringToFront();
    }
    
    generate_route_diagram(N_active_line);

    recalculate_all_ridership(RIDERSHIP_ADD);

    calculate_total_ridership();
}

function save_game_json() {
    var json = {"lines": [], "stations": [], "transfers": [], "version": GAME_VERSION}

    for (var i = 0; i < N_lines.length; i++) {
        json["lines"].push(N_lines[i].to_json());
    }

    for (i = 0; i < N_stations.length; i++) {
        json["stations"].push(N_stations[i].to_json());
    }

    for (i = 0; i < N_transfers.length; i++) {
        json["transfers"].push(N_transfers[i].to_json());
    }

    /*$("<a />", {
        "download": "bns_saved_game.json",
        "href" : "data:application/json," + encodeURIComponent(JSON.stringify(json))
    }).appendTo("body")
    .click(function() {
        $(this).remove()
    })[0].click();*/
    var blob = new Blob([JSON.stringify(json)], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "bns_saved_game.json", { autoBom: false });
}
