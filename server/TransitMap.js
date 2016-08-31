class Station {
    constructor (lat, lng) {
        this.lat = lat,
        this.lng = lng
    }
}

class Edge {
    constructor (s1, s2, line) {
        this.s1 = s1;
        this.s2 = s2;
        this.line = line;
    }
}

class Line {
    constructor (name) {
        this.name = name;
    }
}

module.exports = class TransitMap {
    
    constructor() {
        this.stations = [];
        this.edges = [];
        this.lines = [];
    }
    
    add_station(lat, lng) {
        var station = new Station(lat, lng);
        this.stations.push(station);
    }
    
    add_edge(stations, line) {
        var edge = new Edge(this.stations[stations[0]], this.stations[stations[1]], this.lines[line]);
        this.edges.push(edge);
    }
    
    add_line(name) {
        var line = new Line(name);
        this.lines.push(name);
    }
        
    
}