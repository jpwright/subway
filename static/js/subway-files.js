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
    
    NS_map.services = [];
    
    NS_map.id = data["id"];
    for (var i = 0; i < data["services"].length; i++) {
        var d_service = data["services"][i];
        var service = new Service(d_service["id"], d_service["name"]);
        NS_map.add_service(service);

        var d_stations = d_service["stations"];
        for (var j = 0; j < d_stations.length; j++) {
            var d_station = d_stations[j];
            var station = new Station(d_station["id"], d_station["name"], d_station["location"]);
            station.streets = d_station["streets"];
            station.neighborhood = d_station["neighborhood"];
            station.locality = d_station["locality"];
            station.region = d_station["region"];
            service.add_station(station);
            NS_interface.create_station_marker(station);
        }
        
        var d_lines = d_service["lines"];
        for (var j = 0; j < d_lines.length; j++) {
            var d_line = d_lines[j];
            var line = new Line(d_line["id"], d_line["name"]);
            line.full_name = d_line["full_name"];
            line.color_bg = d_line["color_bg"];
            line.color_fg = d_line["color_fg"];
            line.group_id = d_line["group_id"];
            for (var k = 0; k < d_line.stops.length; k++) {
                var d_stop = d_line.stops[k];
                var stop = new Stop(d_stop["id"], service.get_station_by_id(d_stop["station"]["id"]));
                line.add_stop(stop);
            }
            for (var k = 0; k < d_line.edges.length; k++) {
                var d_edge = d_line.edges[k];
                var d_edge_stops = [line.get_stop_by_id(d_edge["stops"][0]["id"]), line.get_stop_by_id(d_edge["stops"][1]["id"])];
                var edge = new Edge(d_edge["id"], d_edge_stops);
                line.add_edge(edge);
            }
            
            service.add_line(line);
            NS_interface.add_to_line_selector(line);
            NS_interface.draw_line(line);
        }
    }
    
    NS_interface.active_service = NS_map.primary_service();
    NS_interface.active_line = NS_map.primary_service().lines[0];
    NS_interface.refresh_line_editor();
    
    
}

function save_game_json() {
    
    var json = NS_map.to_json();

    var blob = new Blob([json], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "bns_saved_game.json");
}