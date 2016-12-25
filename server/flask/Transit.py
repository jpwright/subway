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
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

    def from_json(self, j):
        self.id = j['id']
        self.services = []
        for service in j['services']:
            s = Service(service['name'])
            s.from_json(service)
            self.add_service(s)

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

    def from_json(self, j):
        self.id = j['id']
        self.name = j['name']
        self.location = j['location']
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

    def __init__(self, station_id):
        self.id = id(self)
        self.station_id = station_id

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

    def from_json(self, j):
        self.id = j['id']
        self.station_id = j['station_id']

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

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

    def from_json(self, j):
        self.id = j['id']
        self.name = j['name']
        self.full_name = j['full_name']
        self.color_bg = j['color_bg']
        self.color_fg = j['color_fg']
        self.stops = []
        for stop in j['stops']:
            s = Stop(stop['station_id'])
            s.from_json(stop)
            self.add_stop(s)
        self.edges = []
        for edge in j['edges']:
            e = Edge(edge['stop_ids'])
            e.from_json(edge)
            self.add_edge(e)

class Edge(object):
    """An Edge is a connection between two Stops.

    Attributes:
        stops: An array (of size 2) containing the Stops connected by this Edge.
    """

    def __init__(self, stop_ids):
        self.id = id(self)
        self.stop_ids = stop_ids

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

    def from_json(self, j):
        self.id = j['id']
        self.stop_ids = j['stop_ids']

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

    def has_station(self, i):
        for station in self.stations:
            if station.id == i:
                return True
        return False

    def find_station(self, i):
        for station in self.stations:
            if station.id == i:
                return station
        raise ValueError("station not found with id %s" % (i))

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

    def from_json(self, j):
        self.id = j['id']
        self.name = j['name']
        self.stations = []
        for station in j['stations']:
            s = Station(station['name'], station['location'])
            s.from_json(station)
            self.add_station(s)
        for line in j['lines']:
            l = Line(line['name'])
            l.from_json(line)
            self.add_line(l)


