import json

class Map(object):
    """A Map contains a collection of Services, everything needed for a single Transit session.
    
    Attributes:
        services: An array of Services.
    """
    
    def __init__(self):
        self.id = id(self)
        self.services = []
        
    def add_service(self, s):
        self.services.append(s)
        
    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

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
    
    def __init__(self, name, location):
        self.id = id(self)
        
        self.name = name
        self.location = location
        
        self.streets = []
        self.neighborhood = ""
        self.locality = ""
        self.region = ""
        self.gids_in_range = []
        self.stop_walking_times = []
        
    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)
        
class Stop(object):
    """A Stop represents a location at which a Line can stop.
    
    Attributes:
        station: The Station this stop is contained within.
    """
    
    def __init__(self, station):
        self.id = id(self)
        self.station = station
        
    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)
        
class Line(object):
    """A Line represents a transit service. It consists of Stops connected by Edges.
    
    Attributes:
        name: A string representing the Line's name.
        stops: An array of Stops on this Line.
        edges: An array of Edges on this Line.
    """
    
    def __init__(self, name):
        self.id = id(self)
        self.name = name
        
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
    
    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)
        
class Edge(object):
    """An Edge is a connection between two Stops.
    
    Attributes:
        stops: An array (of size 2) containing the Stops connected by this Edge.
    """
    
    def __init__(self, stops):
        self.id = id(self)
        self.stops = stops
        
    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)
        
class Service(object):
    """A Service is a collection of Lines; most analogous to a single mode within a transit agency.
    
    Attributes:
        name: A string representing the Service's name.
        lines: An array of Lines within this Service.
    """
    
    def __init__(self, name):
        self.id = id(self)
        self.name = name
        self.lines = []
        self.stations = []
        
    def add_line(self, l):
        self.lines.append(l)
        
    def add_station(self, s):
        self.stations.append(s)
        
    def remove_station(self, s):
        self.stations.remove(s)
        
    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)
        
    