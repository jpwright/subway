from flask import Flask, render_template, request, session, escape

import psycopg2
import psycopg2.extras

import requests
import json
import re
import os
import uuid

import sys
sys.path.append(os.path.abspath('server/flask'))
import Transit
import TransitGIS


app = Flask(__name__, static_url_path='/static')
app.secret_key = 'F12Yr58j3yX T~Y%C!efE]Fxc/,?KT'

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
        session['id'] = str(uuid.uuid4())
        # Create a new Map object and keep it
        session_to_map[session['id']] = Transit.Map()

    return json.dumps({"id": session['id']})

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
                for station in service.stations:
                    if station_id == str(station.id):
                        stop = Transit.Stop(station)
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

    line = Transit.Line(name)

    service_id = request.args.get('service-id')

    m = session_to_map[session['id']]
    for service in m.services:
        if service_id == str(service.id):
            service.add_line(line)
            return line.to_json()

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
                edge = Transit.Edge([stop_1, stop_2])
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