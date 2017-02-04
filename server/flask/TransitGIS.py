import psycopg2
import psycopg2.extras

import requests
import json
import re

import Transit
import ConfigParser

class HexagonRegion(object):
    
    def __init__(self):
        self.hexagons = []
        
    def add_hexagon(self, h):
        self.hexagons.append(h)
        
    def has_hexagon(self, h):
        if h in self.hexagons:
            return True
        else:
            return False
        
    def num_hexagons(self):
        return len(self.hexagons)
        
    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

class Hexagon(object):
    
    def __init__(self, gid, geo, population):
        self.gid = gid
        self.geo = geo
        self.population = population
        
    def center(self):
        lat = 0
        lng = 0
        for coordinate in self.geo["coordinates"][0]:
            lat += coordinate[1]
            lng += coordinate[0]
            
        lat = lat / len(self.geo["coordinates"][0])
        lng = lng / len(self.geo["coordinates"][0])
        
        return (lat, lng)
        
    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)
    
class BoundingBox(object):
    
    def __init__(self, min_lat, max_lat, min_lng, max_lng):
        self.min_lat = min_lat
        self.max_lat = max_lat
        self.min_lng = min_lng
        self.max_lng = max_lng
        
    def __init__(self, m):
        min_lat_set = False
        max_lat_set = False
        min_lng_set = False
        max_lng_set = False
    
        for s in m.services:
            stations = s.stations
            for station in stations:
                if not min_lat_set or station.location[0] < self.min_lat:
                    self.min_lat = station.location[0]
                    min_lat_set = True
                if not max_lat_set or station.location[0] > self.max_lat:
                    self.max_lat = station.location[0]
                    max_lat_set = True
                if not min_lng_set or station.location[1] < self.min_lng:
                    self.min_lng = station.location[1]
                    min_lng_set = True
                if not max_lng_set or station.location[1] > self.max_lng:
                    self.max_lng = station.location[1]
                    max_lng_set = True
        

def hexagons(lat, lng, distance):
    config = ConfigParser.RawConfigParser()
    config.read('settings.cfg')

    host = config.get('postgres', 'host')
    port = config.get('postgres', 'port')
    dbname = config.get('postgres', 'dbname')
    user = config.get('postgres', 'user')
    password = config.get('postgres', 'password')
    conn_string = "host='"+host+"' port='"+port+"' dbname='"+dbname+"' user='"+user+"' password='"+password+"'"
    # print the connection string we will use to connect
    print "Connecting to database\n	->%s" % (conn_string)

    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor('cursor_unique_name', cursor_factory=psycopg2.extras.DictCursor)
    
    cursor.execute("SELECT gid, ST_AsGeoJSON(geo), population FROM dggrid WHERE ST_DWithin(geo, 'POINT("+lng+" "+lat+")', "+distance+") LIMIT 10000")
    #cursor.execute("SELECT gid FROM dggrid WHERE ST_DWithin(geo, 'POINT("+lng+" "+lat+")', 0.01) LIMIT 1000;")
    #cursor.execute("SELECT * FROM dggrid ORDER BY geo <-> st_setsrid(st_makepoint("+lng+","+lat+"),4326) LIMIT 100;")

    hexagons = []
    for row in cursor:
        hexagons.append({"gid": row[0], "geo": json.loads(row[1]), "population": row[2]})
        
    return hexagons

def hexagons_bb(bb):
    config = ConfigParser.RawConfigParser()
    config.read('settings.cfg')

    host = config.get('postgres', 'host')
    port = config.get('postgres', 'port')
    dbname = config.get('postgres', 'dbname')
    user = config.get('postgres', 'user')
    password = config.get('postgres', 'password')
    conn_string = "host='"+host+"' port='"+port+"' dbname='"+dbname+"' user='"+user+"' password='"+password+"'"
    # print the connection string we will use to connect
    print "Connecting to database\n	->%s" % (conn_string)

    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor('cursor_unique_name', cursor_factory=psycopg2.extras.DictCursor)
    
    query = "SELECT gid, ST_AsGeoJSON(geo), population FROM dggrid WHERE ST_Intersects(geo, ST_MakeEnvelope("+str(bb.min_lng)+", "+str(bb.min_lat)+", "+str(bb.max_lng)+", "+str(bb.max_lat)+")) LIMIT 10000"
    print query
    cursor.execute(query)
    #cursor.execute("SELECT gid FROM dggrid WHERE ST_DWithin(geo, 'POINT("+lng+" "+lat+")', 0.01) LIMIT 1000;")
    #cursor.execute("SELECT * FROM dggrid ORDER BY geo <-> st_setsrid(st_makepoint("+lng+","+lat+"),4326) LIMIT 100;")

    region = HexagonRegion()
    for row in cursor:
        region.add_hexagon(Hexagon(int(row[0]), json.loads(row[1]), int(row[2])))
        
    return region

def station_constructor(sid, lat, lng):
    
    MAPZEN_API_KEY = "search-aiLd92C"
    mapzen_uri = "https://search.mapzen.com/v1/reverse?api_key="+MAPZEN_API_KEY+"&point.lat="+lat+"&point.lon="+lng+"&size=1&layers=address"
    
    geocode = requests.get(mapzen_uri)
    geocode_content = json.loads(geocode.content)
    
    name = ""
    streets = []
    neighborhood = ""
    locality = ""
    region = ""
    
    if (len(geocode_content["features"]) < 1):
        # Flag an error?
        print "Error in reverse geocoding"
    else:
        properties = geocode_content["features"][0]["properties"]
        
        has_street = False
        has_locality = False
        has_neighborhood = False
        
        if ("street" in properties):
            streets = [properties["street"]]
            has_street = True
        if ("locality" in properties):
            locality = properties["locality"]
            has_locality = True
        if ("borough" in properties):
            locality = properties["borough"]
            has_locality = True
        if ("neighbourhood" in properties):
            neighborhood = properties["neighbourhood"]
            has_neighborhood = True
        
        if (has_street):
            name = properties["street"]
        elif (has_neighborhood):
            name = properties["neighbourhood"]
        elif (has_locality):
            name = properties["locality"]
        else:
            name = "Station"
    
        name = re.sub(r'(\w+\s)\b(Street)\b', r'\1St', name)
        name = re.sub(r'(\w+\s)\b(Road)\b', r'\1Rd', name)
        name = re.sub(r'(\w+\s)\b(Drive)\b', r'\1Dr', name)
        name = re.sub(r'(\w+\s)\b(Avenue)\b', r'\1Av', name)
        name = re.sub(r'(\w+\s)\b(Lane)\b', r'\1Ln', name)
        name = re.sub(r'(\w+\s)\b(Boulevard)\b', r'\1Blvd', name)
    
    s = Transit.Station(sid, name, [lat, lng])
    s.streets = streets
    s.neighborhood = neighborhood
    s.locality = locality
    s.region = region
    
    return s
