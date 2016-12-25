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

import ConfigParser

app = Flask(__name__, static_url_path='/static')
app.secret_key = 'F12Yr58j4yX T~Y%C!efD]Fxc/,?KT'

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
        session_to_map[session['id']] = Transit.Map()

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
    sdata = session_to_map[session['id']].to_json()
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
        m = Transit.Map()
        m.from_json(sdata)
        session_to_map[session['id']] = m

    return json.dumps({"id": session['id'], "data": sdata})

@app.route('/hexagons')
def route_hexagons():

    lat = request.args.get('lat')
    lng = request.args.get('lng')
    distance = request.args.get('distance')

    hexagons = TransitGIS.hexagons(lat, lng, distance)

    return json.dumps(hexagons)

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
        if service_id == str(service.id):
            station = TransitGIS.station_constructor(lat, lng)
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

    station = TransitGIS.station_constructor(lat, lng)
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
        if service_id == str(s.id):

            # Look for matching station.
            for station in s.stations:
                if station_id == str(station.id):
                    s.remove_station(station)
                    return station.to_json()

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
        if service_id == str(service.id):
            line_exists = False
            for line in service.lines:
                if line_id == str(line.id):
                    line_exists = True
                    line_to_use = line

            if (line_exists):
                if service.has_station(int(station_id)):
                    station = service.find_station(int(station_id))
                    stop = Transit.Stop(station.id)
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
        if service_id == str(s.id):

            # Look for matching line.
            for line in s.lines:
                if line_id == str(line.id):
                    for stop in line.stops:
                        if stop_id == str(stop.id):
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

    line = Transit.Line(name)
    line.full_name = full_name
    line.color_bg = color_bg
    line.color_fg = color_fg

    service_id = request.args.get('service-id')

    m = session_to_map[session['id']]
    for service in m.services:
        if service_id == str(service.id):
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
        if service_id == str(s.id):

            # Look for matching line.
            for line in s.lines:
                if line_id == str(line.id):
                    if name != None:
                        line.name = name
                    if full_name != None:
                        line.full_name = full_name
                    if color_bg != None:
                        line.color_bg = color_bg
                    if color_fg != None:
                        line.color_fg = color_fg


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
        if service_id == str(s.id):

            # Look for matching line.
            line_exists = False
            for line in s.lines:
                if line_id == str(line.id):
                    line_exists = True
                    line_to_use = line

            # Look for matching stops.
            stops_found = 0
            if (line_exists):
                for stop in line_to_use.stops:
                    if stop_1_id == str(stop.id):
                        stop_1 = stop
                        stops_found += 1
                    if stop_2_id == str(stop.id):
                        stop_2 = stop
                        stops_found += 1

            # Add the edge.
            if (stops_found == 2):
                edge = Transit.Edge([stop_1_id, stop_2_id])
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
        if service_id == str(s.id):

            # Look for matching line.
            for line in s.lines:
                if line_id == str(line.id):
                    for edge in line.edges:
                        if edge_id == str(edge.id):
                            line.remove_edge(edge)
                            return edge.to_json()

    return json.dumps({"error": "Invalid ID"})

@app.route('/service-add')
def route_service_add():

    e = check_for_session_errors()
    if e:
        return e

    name = request.args.get('name')

    service = Transit.Service(name)
    m = session_to_map[session['id']]
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
        if id == str(s.id):
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

@app.route('/station-info')
def station_info():

    lat = request.args.get('lat')
    lng = request.args.get('lng')

def check_for_session_errors():
    if 'id' not in session:
        return json.dumps({"error": "Create session first"})
    elif session['id'] not in session_to_map:
        return json.dumps({"error": "Invalid session"})

    return 0

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)