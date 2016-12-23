import psycopg2
import psycopg2.extras

import requests
import json
import re

import Transit
import ConfigParser

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

def station_constructor(lat, lng):
    
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
    
    s = Transit.Station(name, [lat, lng])
    s.streets = streets
    s.neighborhood = neighborhood
    s.locality = locality
    s.region = region
    
    return s
