class Map {
    /*
     * A Map contains a collection of Services, everything needed for a single Transit session.
     *
     * Attributes:
     *  services: An array of Services.
     */

    constructor(id) {
        this.id = id;
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
        this.id = j.id;
        this.services = [];
        for (var i = 0; i < j.services.length; i++) {
            var s = new Service(j.services[i].id, j.services[i].name);
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

    constructor(id, name, location) {
        this.id = id;
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
        this.id = j.id;
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

    constructor(id, station) {
        this.id = id;
        this.station = station;
    }

    to_json() {
        return JSON.stringify(this);
    }

    from_json(j, service) {
        this.id = j.id;
        this.station = service.get_station_by_id(j.station_id);
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

    constructor(id, name) {
        this.id = id;
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

    get_stop_by_id(id) {
        for (var i = 0; i < this.stops.length; i++) {
            if (this.stops[i].id == id) {
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

    to_json() {
        return JSON.stringify(this);
    }

    from_json(j, service) {
        this.id = j.id;
        this.name = j.name;
        this.full_name = j.full_name;
        this.color_bg = j.color_bg;
        this.color_fg = j.color_fg;
        this.stops = [];
        for (var i = 0; i < j.stops.length; i++) {
            var s = new Stop(j.stops[i].id, service.get_station_by_id(j.stops[i].station_id));
            s.from_json(j.stops[i], service);
            this.add_stop(s);
        }
        this.edges = [];
        for (var i = 0; i < j.edges.length; i++) {
            var e = new Edge(j.edges[i].id, []);
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

    constructor(id, stops) {
        this.id = id;
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
        this.id = j.id;
        this.stops = [];
        for (var i = 0; i < j.stop_ids.length; i++) {
            this.stops.push(line.get_stop_by_id(j.stop_ids[i]));
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

    constructor(id, name) {
        this.id = id;
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

    to_json() {
        return JSON.stringify(this);
    }

    from_json(j) {
        this.id = j.id;
        this.name = j.name;
        this.stations = [];
        for (var i = 0; i < j.stations.length; i++) {
            var s = new Station(j.stations[i].id, j.stations[i].name, j.stations[i].location);
            s.from_json(j.stations[i]);
            this.add_station(s);
        }
        this.lines = [];
        for (var i = 0; i < j.lines.length; i++) {
            var l = new Line(j.lines[i].id, j.lines[i].name);
            l.from_json(j.lines[i], this);
            this.add_line(l);
        }
    }
}
