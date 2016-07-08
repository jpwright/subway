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
            load_game_json(data);
        };
    })(f);

    // Read in the image file as a data URL.
    var d = reader.readAsText(f);
    
}

function load_game_json(data) {
    initialize_game_state();
    
    for (var i = 0; i < data["stations"].length; i++) {
        var d = data["stations"][i];
        
        var station = new Station(d["lat"], d["lng"], d["name"], d["info"], d["riders"]);
        station.lines = d["lines"];
        //station.drawmaps = d["drawmaps"];
        N_stations[station.id] = station;
        
        if (!d["active"])
            N_stations[station.id].delete();
        
        station.generate_popup();
    }
    
    for (var j = 0; j < data["lines"].length; j++) {
        var d = data["lines"][j];
        N_lines[d["id"]].stations = d["stations"];
        N_lines[d["id"]].draw_map = d["draw_map"];
    }
        
    
    for (var k = 0; k < N_lines.length; k++) {
        N_lines[k].generate_draw_map();
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

    generate_route_diagram(N_active_line);
    calculateTotalRidership();
}

function save_game_json() {
    var json = {"lines": [], "stations": [], "transfers": []}
    
    for (var i = 0; i < N_lines.length; i++) {
        json["lines"].push(N_lines[i].to_json());
    }
    
    for (i = 0; i < N_stations.length; i++) {
        json["stations"].push(N_stations[i].to_json());
    }
    
    for (i = 0; i < N_transfers.length; i++) {
        json["transfers"].push(N_transfers[i].to_json());
    }

    $("<a />", {
        "download": "subway-game-N.json",
        "href" : "data:application/json," + encodeURIComponent(JSON.stringify(json))
    }).appendTo("body")
    .click(function() {
        $(this).remove()
    })[0].click()
}