from flask import Flask, render_template, request, session, escape

import psycopg2
import psycopg2.extras

import requests
import json
import re
import os
import uuid
import datetime

import sys
sys.path.append(os.path.abspath('server/flask'))
import Transit
import TransitGIS
import TransitModel

import ConfigParser

app = Flask(__name__, static_url_path='/static')
app.secret_key = 'F12Yr58j4zX T~Y%C!efJ]Gxd/,?KT'

session_to_map = {}

@app.route('/')
def route_main():
    return app.send_static_file('index.html')

@app.route('/session')
def route_session_status():

    create_new_session = False

    if 'id' not in session:
        create_new_session = True
    elif session['id'] not in session_to_map:
        create_new_session = True

    if create_new_session:
        # Get a new session ID
        session['id'] = '{:16x}'.format(uuid.uuid4().int & (1<<63)-1)
        # Create a new Map object and keep it
        session_to_map[session['id']] = Transit.Map(0)

    return json.dumps({"id": session['id']})

@app.route('/session-links')
def route_session_links():

    return json.dumps({})

@app.route('/session-save')
def route_session_save():
    e = check_for_session_errors()
    if e:
        return e

    config = ConfigParser.RawConfigParser()
    config.read('settings.cfg')
    host = config.get('pg_sessions', 'host')
    port = config.get('pg_sessions', 'port')
    dbname = config.get('pg_sessions', 'dbname')
    user = config.get('pg_sessions', 'user')
    password = config.get('pg_sessions', 'password')
    conn_string = "host='"+host+"' port='"+port+"' dbname='"+dbname+"' user='"+user+"' password='"+password+"'"

    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()

    sid = int(session['id'], 16)
    sdata = session_to_map[session['id']].to_json().replace("'", "''")
    sdt = datetime.datetime.now()

    cursor.execute("SELECT id FROM sessions WHERE id = %s LIMIT 1" % (sid))
    if (cursor.rowcount > 0):
        cursor.execute("UPDATE sessions SET data = '%s', updated = '%s' WHERE id = %s" % (sdata, sdt, sid))
    else:
        cursor.execute("INSERT INTO sessions (id, data, updated) VALUES (%s, '%s', '%s')" % (sid, sdata, sdt))

    conn.commit()

    return json.dumps({"result": "OK"})

@app.route('/session-load')
def route_session_load():
    sid = int(request.args.get('id'), 16)
    session['id'] = request.args.get('id')

    config = ConfigParser.RawConfigParser()
    config.read('settings.cfg')
    host = config.get('pg_sessions', 'host')
    port = config.get('pg_sessions', 'port')
    dbname = config.get('pg_sessions', 'dbname')
    user = config.get('pg_sessions', 'user')
    password = config.get('pg_sessions', 'password')
    conn_string = "host='"+host+"' port='"+port+"' dbname='"+dbname+"' user='"+user+"' password='"+password+"'"

    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()

    cursor.execute("SELECT data FROM sessions WHERE id = %s LIMIT 1" % (sid))
    if (cursor.rowcount > 0):
        row = cursor.fetchone()
        sdata = row[0]
        m = Transit.Map(0)
        m.from_json(sdata)
        m.sidf_state = 0
        m.regenerate_all_ids()
        session_to_map[session['id']] = m

    return json.dumps({"id": session['id'], "data": m.to_json().replace("'", "''")})

@app.route('/station-add')
def route_station_add():

    e = check_for_session_errors()
    if e:
        return e

    service_id = request.args.get('service-id')

    lat = request.args.get('lat')
    lng = request.args.get('lng')

    m = session_to_map[session['id']]
    for service in m.services:
        if service_id == str(service.sid):
            station = TransitGIS.station_constructor(m.create_sid(), lat, lng)
            service.add_station(station)
            return station.to_json()

    return json.dumps({"error": "Invalid ID"})

@app.route('/lat-lng-info')
def route_lat_lng_info():
    e = check_for_session_errors()
    if e:
        return e

    lat = request.args.get('lat')
    lng = request.args.get('lng')

    station = TransitGIS.station_constructor(0, lat, lng)
    return station.to_json()

@app.route('/station-remove')
def route_station_remove():

    e = check_for_session_errors()
    if e:
        return e

    service_id = request.args.get('service-id')
    station_id = request.args.get('station-id')

    m = session_to_map[session['id']]
    for s in m.services:
        if service_id == str(s.sid):

            # Look for matching station.
            for station in s.stations:
                if station_id == str(station.sid):
                    s.remove_station(station)
                    return station.to_json()

    return json.dumps({"error": "Invalid ID"})

@app.route('/station-update')
def route_station_update():
    e = check_for_session_errors()
    if e:
        return e

    service_id = request.args.get('service-id')
    station_id = request.args.get('station-id')
    name = request.args.get('name')
    location = request.args.get('location')
    streets = request.args.get('streets')
    neighborhood = request.args.get('neighborhood')
    locality = request.args.get('locality')
    region = request.args.get('region')

    m = session_to_map[session['id']]
    for s in m.services:
        if service_id == str(s.sid):

            # Look for matching station.
            for station in s.stations:
                if station_id == str(station.sid):
                    if name != None:
                        station.name = name
                    if location != None:
                        location_comps = location.split(',')
                        station.location = [float(location_comps[0]), float(location_comps[1])]
                    if streets != None:
                        street_comps = streets.split(',')
                        station.streets = street_comps
                    if neighborhood != None:
                        station.neighborhood = neighborhood
                    if locality != None:
                        station.locality = locality
                    if region != None:
                        station.region = region

    return json.dumps({"error": "Invalid ID"})


@app.route('/stop-add')
def route_stop_add():

    e = check_for_session_errors()
    if e:
        return e

    service_id = request.args.get('service-id')
    line_id = request.args.get('line-id')
    station_id = request.args.get('station-id')

    m = session_to_map[session['id']]
    for service in m.services:
        if service_id == str(service.sid):
            line_exists = False
            for line in service.lines:
                if line_id == str(line.sid):
                    line_exists = True
                    line_to_use = line

            if (line_exists):
                if service.has_station(int(station_id)):
                    station = service.find_station(int(station_id))
                    stop = Transit.Stop(m.create_sid(), station.sid)
                    line_to_use.add_stop(stop)
                    return stop.to_json()


    return json.dumps({"error": "Invalid ID"})

@app.route('/stop-remove')
def route_stop_remove():

    e = check_for_session_errors()
    if e:
        return e

    service_id = request.args.get('service-id')
    line_id = request.args.get('line-id')
    stop_id = request.args.get('stop-id')

    m = session_to_map[session['id']]
    for s in m.services:
        if service_id == str(s.sid):

            # Look for matching line.
            for line in s.lines:
                if line_id == str(line.sid):
                    for stop in line.stops:
                        if stop_id == str(stop.sid):
                            line.remove_stop(stop)
                            return stop.to_json()

    return json.dumps({"error": "Invalid ID"})

@app.route('/line-add')
def route_line_add():

    e = check_for_session_errors()
    if e:
        return e

    name = request.args.get('name')
    full_name = request.args.get('full-name')
    color_bg = request.args.get('color-bg')
    color_fg = request.args.get('color-fg')

    service_id = request.args.get('service-id')

    m = session_to_map[session['id']]
    line = Transit.Line(m.create_sid(), name)
    line.full_name = full_name
    line.color_bg = color_bg
    line.color_fg = color_fg

    for service in m.services:
        if service_id == str(service.sid):
            service.add_line(line)
            return line.to_json()

    return json.dumps({"error": "Invalid ID"})

@app.route('/line-update')
def route_line_update():
    e = check_for_session_errors()
    if e:
        return e

    service_id = request.args.get('service-id')
    line_id = request.args.get('line-id')
    name = request.args.get('name')
    full_name = request.args.get('full-name')
    color_bg = request.args.get('color-bg')
    color_fg = request.args.get('color-fg')

    m = session_to_map[session['id']]
    for s in m.services:
        if service_id == str(s.sid):

            # Look for matching line.
            for line in s.lines:
                if line_id == str(line.sid):
                    if name != None:
                        line.name = name
                    if full_name != None:
                        line.full_name = full_name
                    if color_bg != None:
                        line.color_bg = color_bg
                    if color_fg != None:
                        line.color_fg = color_fg


    return json.dumps({"error": "Invalid ID"})

@app.route('/line-info')
def route_line_info():
    
    e = check_for_session_errors()
    if e:
        return e

    line_id = request.args.get('line-id')
    line_name = request.args.get('line-name')
    
    sid = request.args.get('id')
    m = session_to_map[session['id']]
    for s in m.services:
        for l in s.lines:
            if line_id == str(l.sid) or line_name == l.name:
                return s.line_to_json(l)

    return json.dumps({"error": "Invalid ID"})

@app.route('/edge-add')
def route_edge_add():

    e = check_for_session_errors()
    if e:
        return e

    service_id = request.args.get('service-id')
    line_id = request.args.get('line-id')
    stop_1_id = request.args.get('stop-1-id')
    stop_2_id = request.args.get('stop-2-id')

    if (stop_1_id == stop_2_id):
        return json.dumps({"error": "Duplicate Stop IDs"})

    m = session_to_map[session['id']]
    for s in m.services:
        if service_id == str(s.sid):

            # Look for matching line.
            line_exists = False
            for line in s.lines:
                if line_id == str(line.sid):
                    line_exists = True
                    line_to_use = line

            # Look for matching stops.
            stops_found = 0
            if (line_exists):
                for stop in line_to_use.stops:
                    if stop_1_id == str(stop.sid):
                        stop_1 = stop
                        stops_found += 1
                    if stop_2_id == str(stop.sid):
                        stop_2 = stop
                        stops_found += 1

            # Add the edge.
            if (stops_found == 2):
                edge = Transit.Edge(m.create_sid(), [stop_1_id, stop_2_id])
                line_to_use.add_edge(edge)
                return edge.to_json()

    return json.dumps({"error": "Invalid ID"})

@app.route('/edge-remove')
def route_edge_remove():

    e = check_for_session_errors()
    if e:
        return e

    service_id = request.args.get('service-id')
    line_id = request.args.get('line-id')
    edge_id = request.args.get('edge-id')

    m = session_to_map[session['id']]
    for s in m.services:
        if service_id == str(s.sid):

            # Look for matching line.
            for line in s.lines:
                if line_id == str(line.sid):
                    for edge in line.edges:
                        if edge_id == str(edge.sid):
                            line.remove_edge(edge)
                            return edge.to_json()

    return json.dumps({"error": "Invalid ID"})

@app.route('/service-add')
def route_service_add():

    e = check_for_session_errors()
    if e:
        return e

    name = request.args.get('name')

    m = session_to_map[session['id']]
    
    service = Transit.Service(m.create_sid(), name)
    m.add_service(service)

    return service.to_json()

@app.route('/service-info')
def route_service_info():

    e = check_for_session_errors()
    if e:
        return e

    id = request.args.get('id')
    m = session_to_map[session['id']]
    for s in m.services:
        if id == str(s.sid):
            return s.to_json()

    return json.dumps({"error": "Invalid ID"})

@app.route('/map-info')
def route_map_info():

    e = check_for_session_errors()
    if e:
        return e

    m = session_to_map[session['id']]
    return m.to_json()

@app.route('/graphviz')
def route_graphviz():
    return app.send_static_file('graphviz.html')
    
@app.route('/hexagons')
def route_hexagons():

    lat = request.args.get('lat')
    lng = request.args.get('lng')
    distance = request.args.get('distance')

    hexagons = TransitGIS.hexagons(lat, lng, distance)

    return json.dumps(hexagons)

@app.route('/get-hexagons')
def route_get_hexagons():
    
    e = check_for_session_errors()
    if e:
        return e
    
    m = session_to_map[session['id']]
    bb = TransitGIS.BoundingBox(m)
    bb.min_lat -= 0.02;
    bb.max_lat += 0.02;
    bb.min_lng -= 0.02;
    bb.max_lng += 0.02;
    
    hexagons = TransitGIS.hexagons_bb(bb)
    return hexagons.to_json()

@app.route('/transit-model')
def route_transit_model():
    
    e = check_for_session_errors()
    if e:
        return e
    
    m = session_to_map[session['id']]
    model = TransitModel.map_analysis(m)
    
    return model.to_json()
    

def check_for_session_errors():
    if 'id' not in session:
        return json.dumps({"error": "Create session first"})
    elif session['id'] not in session_to_map:
        return json.dumps({"error": "Invalid session"})

    return 0

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)