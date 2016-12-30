class Map {
    /*
     * A Map contains a collection of Services, everything needed for a single Transit session.
     *
     * Attributes:
     *  services: An array of Services.
     */

    constructor() {
        this.id = NS_id.id();
        this.sid = 0;
        this.services = [];
    }

    add_service(s) {
        this.services.push(s);
    }

    primary_service() {
        return this.services[0];
    }

    to_json() {
        return JSON.stringify(this);
    }

    from_json(j) {
        this.sid = j.id;
        this.services = [];
        for (var i = 0; i < j.services.length; i++) {
            var s = new Service(j.services[i].name);
            s.sid = j.services[i].id;
            s.from_json(j.services[i]);
            this.add_service(s);
        }
    }
}

class Station {
    /*
     * A Station is a physical location consisting of one or more Stops.
     *
     * Attributes:
     *  name: A string representing the Station's name.
     *  location: A [lat, lng] pair describing the Station's physical location.
     *  streets: An array of strings containing nearby street names.
     *  neighborhood: The name of the neighborhood the Station is in, if applicable.
     *  locality: The name of the city or town the Station is in.
     *  region: The name of the state the Station is in.
     */

    constructor(name, location, preview) {
        if (preview === undefined || preview == false) {
            this.id = NS_id.id();
        } else {
            this.id = 0;
        }
        this.sid = 0;
        this.name = name;
        this.location = location;
        this.streets = [];
        this.neighborhood = "";
        this.locality = "";
        this.region = "";
    }

    move_to(lat, lng) {
        this.location = [lat, lng];
    }

    to_json() {
        return JSON.stringify(this);
    }

    from_json(j) {
        this.sid = j.id;
        this.name = j.name;
        this.location = [parseFloat(j.location[0]), parseFloat(j.location[1])];
        this.streets = j.streets;
        this.neighborhood = j.neighborhood;
        this.locality = j.locality;
        this.region = j.region;
    }
}

class Stop {
    /*
     * A Stop represents a location at which a Line can stop.
     *
     * Attributes:
     *  station: The Station this stop is contained within.
     */

    constructor(station, preview) {
        if (preview === undefined || preview == false) {
            this.id = NS_id.id();
        } else {
            this.id = 0;
        }
        this.sid = 0;
        this.station = station;
    }

    to_json() {
        return JSON.stringify(this);
    }

    from_json(j, service) {
        this.sid = j.id;
        this.station = service.get_station_by_sid(j.station_id);
    }
}

class Line {
    /*
     * A Line represents a transit service. It consists of Stops connected by Edges.
     *
     * Attributes:
     *  name: A string representing the Line's name.
     *  long_name: A string representing the Line's full name.
     *  color_bg: Hex code for the Line's background color.
     *  color_fg: Hex code for the Line's foreground color.
     *  group_id: A unique identifier, used for grouping Lines when drawing.
     *  stops: An array of Stops on this Line.
     *  edges: An array of Edges on this Line.
     */

    constructor(name) {
        this.id = NS_id.id();
        this.sid = 0;
        this.name = name;
        this.full_name = name;
        this.color_bg = "#000000";
        this.color_fg = "#FFFFFF";
        this.group_id = 0;
        this.stops = [];
        this.edges = [];
    }

    add_stop(stop) {
        this.stops.push(stop);
    }

    remove_stop(stop) {
        var stop_index = this.stops.indexOf(stop);
        if (stop_index > -1) {
            this.stops.splice(stop_index, 1);
        }
    }

    has_stop(stop) {
        for (var i = 0; i < this.stops.length; i++) {
            if (this.stops[i].id == stop.id) {
                return true;
            }
        }
        return false;
    }

    get_stop_by_id(id) {
        for (var i = 0; i < this.stops.length; i++) {
            if (this.stops[i].id == id) {
                return this.stops[i];
            }
        }
        return null;
    }

    get_stop_by_sid(id) {
        for (var i = 0; i < this.stops.length; i++) {
            if (this.stops[i].sid == id) {
                return this.stops[i];
            }
        }
        return null;
    }

    get_stop_by_station(station) {
        for (var i = 0; i < this.stops.length; i++) {
            if (this.stops[i].station.id == station.id) {
                return this.stops[i];
            }
        }
        return null;
    }

    has_station(station) {
        for (var i = 0; i < this.stops.length; i++) {
            if (this.stops[i].station.id == station.id) {
                return true;
            }
        }
        return false;
    }

    add_edge(edge) {
        this.edges.push(edge);
    }

    remove_edge(edge) {
        var edge_index = this.edges.indexOf(edge);
        if (edge_index > -1) {
            this.edges.splice(edge_index, 1);
        }
    }

    get_edge_by_id(id) {
        for (var i = 0; i < this.edges.length; i++) {
            if (this.edges[i].id == id) {
                return this.edges[i];
            }
        }
        return null;
    }

    get_edge_by_stops(stops) {
        for (var i = 0; i < this.edges.length; i++) {
            if (this.edges[i].compare_stops(stops)) {
                return this.edges[i];
            }
        }
        return null;
    }

    length() {
        var distance = 0.0;
        for (var i = 0; i < this.edges.length; i++) {
            distance + this.edges[i].length();
        }
        return distance;
    }

    neighbors(stop) {
        // Returns all neighbors of the input stop.

        var neighbors = [];
        for (var i = 0; i < this.edges.length; i++) {
            var edge = this.edges[i];
            if (edge.stops[0].id == stop.id) {
                neighbors.push(edge.stops[1]);
            }
            if (edge.stops[1].id == stop.id) {
                neighbors.push(edge.stops[0]);
            }
        }
        return neighbors;
    }

    dijkstra(source) {
        // Returns a 2D array containing the distance between
        // a source stop and all other stops.

        var distance = {};
        var visited = {};

        for (var i = 0; i < this.stops.length; i++) {
            distance[this.stops[i].id] = 0;
            visited[this.stops[i].id] = 0;
        }

        distance[source.id] = 0;
        visited[source.id] = 1;

        // TODO optimize this iterator...
        for (var i = 0; i < this.stops.length; i++) {
            var neighbors = this.neighbors(this.stops[i]);
            for (var j = 0; j < neighbors.length; j++) {
                var alt = distance[this.stops[i].id] + 1;
                if (alt < distance[neighbors[j].id] || !visited[neighbors[j].id]) {
                    distance[neighbors[j].id] = alt;
                    visited[neighbors[j].id] = 1;
                }
            }
        }

        return distance;
    }

    center_stop() {
        // This function returns the Jordan center of the line, i.e.
        // the set of stops where the greatest distance to all other
        // stops is minimized.

        var best_length = -1;
        var center_stops = [];

        for (var i = 0; i < this.stops.length; i++) {
            var stop = this.stops[i];
            var djikstra = this.dijkstra(stop);
            var sum_distance = 0;
            for (var j in djikstra) {
                sum_distance += djikstra[j];
            }
            if (sum_distance < best_length || best_length == -1) {
                best_length = sum_distance;
                center_stops = [stop];
            }
            else if (sum_distance == best_length) {
                center_stops.push(stop);
            }
        }

        return center_stops;
    }

    outer_stops() {
        // This returns the set of stops connected by only one edge.

        var outer_stops = [];
        var inner_stops = [];

        // If we don't have any stops, we don't have any outer stops.
        if (this.stops.length == 0) {
            return [];
        }

        // If we only have one stop, it's the only outer stop.
        if (this.stops.length == 1) {
            return [this.stops[0]];
        }

        // Otherwise, we should have at least one edge to work with.
        for (var i = 0; i < this.edges.length; i++) {
            var edge = this.edges[i];
            for (var j = 0; j < edge.stops.length; j++) {
                var stop = edge.stops[j];
                var outer_stop_index = outer_stops.indexOf(stop);
                var inner_stop_index = inner_stops.indexOf(stop);

                if (inner_stop_index == -1 && outer_stop_index == -1) {
                    // First time encountering this stop
                    outer_stops.push(stop);
                }
                if (inner_stop_index == -1 && outer_stop_index > -1) {
                    // Second time encountering this stop
                    outer_stops.splice(outer_stop_index, 1);
                    inner_stops.push(stop);
                }
            }
        }

        return outer_stops;
    }

    overlapping_stops(stop) {
        for (var i = 0; i < this.stops.length; i++) {
            if (stop.station.id == this.stops[i].station.id) {
                return this.stops[i];
            }
        }
        return null;
    }

    to_json() {
        return JSON.stringify(this);
    }

    from_json(j, service) {
        this.sid = j.id;
        this.name = j.name;
        this.full_name = j.full_name;
        this.color_bg = j.color_bg;
        this.color_fg = j.color_fg;
        this.stops = [];
        for (var i = 0; i < j.stops.length; i++) {
            var s = new Stop(service.get_station_by_sid(j.stops[i].station_id));
            s.sid = j.stops[i].id;
            s.from_json(j.stops[i], service);
            this.add_stop(s);
        }
        this.edges = [];
        for (var i = 0; i < j.edges.length; i++) {
            var e = new Edge([]);
            e.sid = j.edges[i].id;
            e.from_json(j.edges[i], this);
            this.add_edge(e);
        }
    }
}

class Edge {
    /*
     * An Edge is a connection between two Stops.
     *
     * Attributes:
     *  stops: An array (of size 2) containing the Stops connected by this Edge.
     *  path: An EdgePath used to represent this edge.
     */

    constructor(stops, preview) {
        if (preview === undefined || preview == false) {
            this.id = NS_id.id();
        } else {
            this.id = 0;
        }
        this.stops = stops;
        this.path = null;
    }

    length() {
        var location_0 = this.stops[0].station.location;
        var location_1 = this.stops[1].station.location;
        var latlng_0 = L.latLng(location_0[0], location_0[1]);
        var latlng_1 = L.latLng(location_1[0], location_1[1]);

        return latlng_0.distanceTo(latlng_1);
    }

    has_stop(stop) {
        if (this.stops[0].id == stop.id || this.stops[1].id == stop.id) {
            return true;
        } else {
            return false;
        }
    }

    compare_stops(s) {
        if (s[0].id == this.stops[0].id && s[1].id == this.stops[1].id) return 1;
        if (s[0].id == this.stops[1].id && s[1].id == this.stops[0].id) return 2;
        return 0;
    }

    to_json() {
        return JSON.stringify(this);
    }

    from_json(j, line) {
        this.sid = j.id;
        this.stops = [];
        for (var i = 0; i < j.stop_ids.length; i++) {
            this.stops.push(line.get_stop_by_sid(j.stop_ids[i]));
        }
    }
}

class Service {
    /*
     * A Service is a collection of Lines; most analogous to a single mode within a transit agency.
     *
     * Attributes:
     *  name: A string representing the Service's name.
     *  lines: An array of Lines within this Service.
     */

    constructor(name) {
        this.id = NS_id.id();
        this.sid = 0;
        this.name = name;
        this.lines = [];
        this.stations = [];
    }

    add_line(l) {
        this.lines.push(l);
    }

    get_line_by_id(id) {
        for (var i = 0; i < this.lines.length; i++) {
            if (this.lines[i].id == id) {
                return this.lines[i];
            }
        }
        return null;
    }

    get_line_by_stop(stop) {
        for (var i = 0; i < this.lines.length; i++) {
            if (this.lines[i].has_stop(stop)) {
                return this.lines[i];
            }
        }
        return null;
    }

    add_station(s) {
        this.stations.push(s);
    }

    get_station_by_id(id) {
        for (var i = 0; i < this.stations.length; i++) {
            if (this.stations[i].id == id) {
                return this.stations[i];
            }
        }
        return null;
    }

    get_station_by_sid(id) {
        for (var i = 0; i < this.stations.length; i++) {
            if (this.stations[i].sid == id) {
                return this.stations[i];
            }
        }
        return null;
    }

    station_lines(station) {
        var lines = [];

        for (var i = 0; i < this.lines.length; i++) {
            var line = this.lines[i];
            for (var j = 0; j < line.stops.length; j++) {
                var stop = line.stops[j];
                if (stop.station.id == station.id) {
                    lines.push(line);
                }
            }
        }
        return lines;
    }

    drawmap(stop_1, stop_2, line) {
        // For stop 1 and 2 connected by line,
        // return an array of additional stops to draw the line through.

        var dfs_stops = [];
        var dfs_path = [];
        var dfs_path_found = false;
        var visited = {};

        var max_depth = 8;

        // recursive DFS to find all the paths
        function dfs(v, target, l) {
            //console.log("DFS: node "+v.station.name);

            // Add new stop.
            dfs_stops.push(v);
            if (v == target && dfs_stops.length <= max_depth) {
                dfs_path_found = true;
                dfs_path = dfs_stops;
            }

            visited[v.id] = 1;
            var neighbors = l.neighbors(v);
            for (var i = 0; i < neighbors.length; i++) {
                var w = neighbors[i];
                if (!visited[w.id] && !dfs_path_found) {
                    dfs(w, target, l);
                }
            }
            if (!dfs_path_found) {
                var v_i = dfs_stops.indexOf(v);
                dfs_stops.splice(v_i, 1);
            }
        }

        var lines_to_check = this.station_lines(stop_1.station);
        var drawmaps = [new Drawmap(line, [stop_1.station, stop_2.station])];

        for (var i = 0; i < lines_to_check.length; i++) {
            var line_to_check = lines_to_check[i];
            if (line_to_check.id != line.id) {
                // Check if both stops are on this line.
                var stop_1_overlap = line_to_check.overlapping_stops(stop_1);
                var stop_2_overlap = line_to_check.overlapping_stops(stop_2);

                if (stop_1_overlap != null && stop_2_overlap != null) {
                    // Initialize visited stops.
                    var visited = {};
                    var visited_stops_count = 0;
                    for (var j = 0; j < line_to_check.stops.length; j++) {
                        visited[line_to_check.stops[j].id] = 0;
                    }
                    // Initialize DFS variables.
                    dfs_stops = [];
                    dfs_path = [];
                    dfs_path_found = false;

                    dfs(stop_1_overlap, stop_2_overlap, line_to_check);
                    if (dfs_path_found) {
                        drawmaps.push(new Drawmap(line_to_check, dfs_path));
                    }
                }
            }
        }

        drawmaps.sort(function(a,b) {
            return a.line.id > b.line.id;
        });

        return drawmaps;

    }

    to_json() {
        return JSON.stringify(this);
    }

    from_json(j) {
        this.id = j.id;
        this.name = j.name;
        this.stations = [];
        for (var i = 0; i < j.stations.length; i++) {
            var s = new Station(j.stations[i].name, j.stations[i].location);
            s.sid = j.stations[i].id;
            s.from_json(j.stations[i]);
            this.add_station(s);
        }
        this.lines = [];
        for (var i = 0; i < j.lines.length; i++) {
            var l = new Line(j.lines[i].name);
            l.sid = j.lines[i].id;
            l.from_json(j.lines[i], this);
            this.add_line(l);
        }
    }
}

class Drawmap {
    /*
     * A Drawmap is a collection of Lines and Stops.
     *
     * Attributes:
     *  line: The Line this drawmap follows.
     *  stops: The Stops on this drawmap.
     */

    constructor(line, stops) {
        this.line = line;
        this.stops = stops;
    }
}

class IdFactory {
    /*
     * Generates unique object IDs.
     */
    constructor() {
        this.current_id = 0;
    }

    id() {
        this.current_id += 1;
        return this.current_id;
    }
}
