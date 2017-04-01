import TransitSettings
import json

from geopy.distance import great_circle

class Map(object):
    """A Map contains a collection of Services, everything needed for a single Transit session.

    Attributes:
        services: An array of Services.
    """

    def __init__(self, sid):
        self.sid = sid
        self.services = []
        self.sidf_state = 0
        self.settings = TransitSettings.Settings()

    def add_service(self, s):
        self.services.append(s)
        
    def create_sid(self):
        self.sidf_state += 1
        return self.sidf_state
    
    def regenerate_all_ids(self):
        sid_map = {}
        
        for service in self.services:
            sid_map[service.sid] = self.create_sid()
            service.sid = sid_map[service.sid]
            for station in service.stations:
                sid_map[station.sid] = self.create_sid()
                station.sid = sid_map[station.sid]
            for line in service.lines:
                sid_map[line.sid] = self.create_sid()
                line.sid = sid_map[line.sid]
                for stop in line.stops:
                    sid_map[stop.sid] = self.create_sid()
                    stop.sid = sid_map[stop.sid]
                    stop.station_id = sid_map[stop.station_id]
                for edge in line.edges:
                    sid_map[edge.sid] = self.create_sid()
                    edge.sid = sid_map[edge.sid]
                    edge_stop_ids = []
                    for stop_id in edge.stop_ids:
                        edge_stop_ids.append(sid_map[stop_id])
                    edge.stop_ids = edge_stop_ids

        #print sid_map

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

    def from_json(self, j):
        self.sidf_state = int(j['sidf_state'])
        self.services = []
        for service in j['services']:
            s = Service(service['sid'], service['name'])
            s.from_json(service)
            self.add_service(s)
        self.settings = TransitSettings.Settings()
        self.settings.from_json(j['settings'])
        

class Station(object):
    """A Station is a physical location consisting of one or more Stops.

    Attributes:
        name: A string representing the Station's name.
        location: A [lat, lng] pair describing the Station's physical location.
        streets: An array of strings containing nearby street names.
        neighborhood: The name of the neighborhood the Station is in, if applicable.
        locality: The name of the city or town the Station is in.
        region: The name of the state the Station is in.
        gids_in_range: An array of dggrid hexagons near this Station.
        stop_walking_times: A 2-dimensional array containing the walking times between each Stop.
    """

    def __init__(self, sid, name, location):
        self.sid = sid

        self.name = name
        self.location = [float(location[0]), float(location[1])]

        self.streets = []
        self.neighborhood = ""
        self.locality = ""
        self.region = ""
        self.gids_in_range = []
        self.stop_walking_times = []

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

    def from_json(self, j):
        self.name = j['name']
        self.location = [float(j['location'][0]), float(j['location'][1])]
        self.streets = j['streets']
        self.neighborhood = j['neighborhood']
        self.locality = j['locality']
        self.region = j['region']
        self.gids_in_range = j['gids_in_range']
        self.stop_walking_times = j['stop_walking_times']

class Stop(object):
    """A Stop represents a location at which a Line can stop.

    Attributes:
        station: The ID of the Station this stop is contained within.
    """

    def __init__(self, sid, station_id):
        self.sid = sid
        self.station_id = station_id

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

    def from_json(self, j):
        self.station_id = int(j['station_id'])

class Line(object):
    """A Line represents a transit service. It consists of Stops connected by Edges.

    Attributes:
        name: A string representing the Line's name.
        stops: An array of Stops on this Line.
        edges: An array of Edges on this Line.
    """

    def __init__(self, sid, name):
        self.sid = sid
        self.name = name
        self.full_name = name
        self.color_bg = ""
        self.color_fg = ""

        self.stops = []
        self.edges = []

    def add_stop(self, stop):
        self.stops.append(stop)

    def remove_stop(self, stop):
        self.stops.remove(stop)

    def add_edge(self, edge):
        self.edges.append(edge)

    def remove_edge(self, edge):
        self.edges.remove(edge)
        
    def has_edge(self, edge):
        if edge in self.edges:
            return True
        else:
            return False
        
    def get_stop_by_id(self, stop_id):
        for stop in self.stops:
            if stop.sid == stop_id:
                return stop
        return None
        
    def has_station(self, s):
        for stop in self.stops:
            if stop.station_id == s.sid:
                return True
        return False
        
    def get_stop_from_station(self, s):
        for stop in self.stops:
            if stop.station_id == s.sid:
                return stop
        return None

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

    def from_json(self, j, station_ids):
        self.name = j['name']
        self.full_name = j['full_name']
        self.color_bg = j['color_bg']
        self.color_fg = j['color_fg']
        self.stops = []
        stop_ids = []
        for stop in j['stops']:
            s = Stop(stop['sid'], stop['station_id'])
            s.from_json(stop)
            if int(stop['station_id']) in station_ids:
                self.add_stop(s)
                stop_ids.append(s.sid)
            else:
                print "bad stop"
                print stop
        self.edges = []
        for edge in j['edges']:
            if int(edge['stop_ids'][0]) in stop_ids and int(edge['stop_ids'][1]) in stop_ids:
                e = Edge(edge['sid'], edge['stop_ids'])
                e.from_json(edge)
                self.add_edge(e)
            else:
                print "bad edge on line "+self.name
                print edge

class Edge(object):
    """An Edge is a connection between two Stops.

    Attributes:
        stops: An array (of size 2) containing the Stops connected by this Edge.
    """

    def __init__(self, sid, stop_ids):
        self.sid = sid
        self.stop_ids = stop_ids
        
    def has_stop(self, stop):
        if stop.sid in self.stop_ids:
            return True
        else:
            return False
        
    def other_stop_id(self, stop):
        if not self.has_stop(stop):
            return None
        if self.stop_ids[0] == stop.sid:
            return self.stop_ids[1]
        if self.stop_ids[1] == stop.sid:
            return self.stop_ids[0]
        return None

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

    def from_json(self, j):
        self.stop_ids = [int(j['stop_ids'][0]), int(j['stop_ids'][1])]

class Service(object):
    """A Service is a collection of Lines; most analogous to a single mode within a transit agency.

    Attributes:
        name: A string representing the Service's name.
        lines: An array of Lines within this Service.
    """

    def __init__(self, sid, name):
        self.sid = sid
        self.name = name
        self.lines = []
        self.stations = []

    def add_line(self, l):
        self.lines.append(l)

    def add_station(self, s):
        self.stations.append(s)

    def remove_station(self, s):
        self.stations.remove(s)

    def has_station(self, i):
        for station in self.stations:
            if station.sid == i:
                return True
        return False

    def find_station(self, i):
        for station in self.stations:
            if station.sid == i:
                return station
        raise ValueError("station not found with id %s" % (i))
    
    def get_stop_neighbors(self, line, stop):
        neighbors = {}
        for edge in line.edges:
            if edge.has_stop(stop):
                neighbor_id = edge.other_stop_id(stop)
                neighbor = line.get_stop_by_id(neighbor_id)
                neighbors[neighbor] = self.edge_length(edge)
        return neighbors
    
    def station_neighbors(self, s):
        neighbors = {}
        for line in self.lines:
            if line.has_station(s):
                stop = line.get_stop_from_station(s)
                stop_neighbors = self.get_stop_neighbors(line, stop)
                for neighbor in stop_neighbors:
                    neighbor_station = self.find_station(neighbor.station_id)
                    if neighbor_station not in neighbors:
                        neighbors[neighbor_station] = stop_neighbors[neighbor]
        return neighbors

    def edge_length(self, edge):
        stop_ids = edge.stop_ids
        for line in self.lines:
            if line.has_edge(edge):
                station_a = self.find_station(line.get_stop_by_id(stop_ids[0]).station_id)
                station_b = self.find_station(line.get_stop_by_id(stop_ids[1]).station_id)
                return great_circle((station_a.location[0], station_a.location[1]), (station_b.location[0], station_b.location[1])).miles
        return None
                

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

    def from_json(self, j):
        self.name = j['name']
        self.stations = []
        station_ids = []
        for station in j['stations']:
            s = Station(station['sid'], station['name'], station['location'])
            s.from_json(station)
            self.add_station(s)
            station_ids.append(s.sid)
        for line in j['lines']:
            l = Line(line['sid'], line['name'])
            l.from_json(line, station_ids)
            self.add_line(l)
