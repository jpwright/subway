class Edge {
    constructor(stations, line) {
        this.stations = stations;
        this.line = line;
        this.polyline = null;
        this.control_points = null;
        this.active_marker = null;
        this.active = true;
        
        this.id = edge_id_generator.generate();
        this.NS_id = 0;
    }
}

var N_edges = [];