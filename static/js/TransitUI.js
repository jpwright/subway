class TransitUI {
    
    constructor(map) {
        this.active_service = null;
        this.active_line = null;
        this.station_markers = [];
        this.line_paths = {}; // line id :: LinePath
        this.preview_paths = [];
        this.map = map;
        
        this.active_tool = "station";
        this.preview_paths_enabled = true;
        
        this.line_path_layer = L.featureGroup();
        this.station_marker_layer = L.featureGroup();
        this.preview_path_layer = L.featureGroup();
        this.data_layer = L.featureGroup();
        
        this.map.addLayer(this.data_layer);
        this.map.addLayer(this.line_path_layer);
        this.map.addLayer(this.preview_path_layer);
        this.map.addLayer(this.station_marker_layer);
        
        this.map.on('mouseup', () => { 
            this.map.dragging.enable();
            this.map.removeEventListener('mousemove');
            this.preview_paths_enabled = true;
            this.map.on('mousemove', function(e) {
                NS_interface.preview_handler(e);
            });
        });
        
        this.map.on('mousemove', function(e) {
            NS_interface.preview_handler(e);
        });
        
        this.show_hexagons(0.2);
        this.map.on('moveend', function(e) {
            NS_interface.show_hexagons(0.2);
        });
    }
    
    add_to_line_selector(line) {
        // Add a line to the line selector dropdown.
        
        $("#dropdown-line-menu").prepend("<li class=\"line-selector-item\"><a class=\"line-selector-option\" id=\""+line.id+"\" href=\"#\"> <div class=\"subway-line-long\" style=\"background-color: "+line.color_bg+"; color: "+line.color_fg+";\"><div class=\"content\">"+line.name+"</div></div> "+line.full_name+"</a></li>");
        
    }
    
    new_line_name() {
        // Generate a new line name, based on used names.
        // Letters A-Z are 0-25. Numbers 1-infinity start at 26
        
        var used_names = [];
        for (var i = 0; i < this.active_service.lines.length; i++) {
            var line = this.active_service.lines[i];
            if (line.name.length == 1) {
                if (isNaN(line.name)) {
                    used_names[line.name.charCodeAt(0) - 65] = 1;
                } else {
                    used_names[parseInt(line.name) + 25] = 1;
                }
            }
        }
        for (var i = 0; i < used_names.length; i++) {
            if (used_names[i] != 1) {
                if (i < 26) {
                    return String.fromCharCode(65 + i);
                } else {
                    return (i - 25).toString();
                }
            }
        }
        
        if (used_names.length < 26) {
            return String.fromCharCode(65 + used_names.length);
        } else {
            return (used_names.length - 25).toString();
        }
    }
    
    random_color() {
        var r = Math.floor(Math.random() * 255);
        var g = Math.floor(Math.random() * 255);
        var b = Math.floor(Math.random() * 255);
        return new LineColor(r, g, b);
    }
    
    line_selector_new() {
        var line = new Line(0, this.new_line_name());
        line.full_name = "Line";
        
        $.ajax({ url: "line-add?service-id="+NS_map.primary_service().id.toString()+"&name="+line.name,
            async: false,
            dataType: 'json',
            success: function(data, status) {
                line.id = data["id"];
                var color = NS_interface.random_color();
                line.color_bg = color.bg_hex();
                line.color_fg = color.fg_hex();
                NS_map.primary_service().add_line(line);
                NS_interface.add_to_line_selector(line);
                NS_interface.update_line_selector(line.id);
            }
        });
    }
    
    update_line_selector(id) {
        // Update system state based on line selector click.
        var line = this.active_service.get_line_by_id(id);
        this.active_line = line;
        
        $("#dropdown-line-button").html("<div class=\"subway-line-long\" style=\"background-color: "+line.color_bg+"; color: "+line.color_fg+";\"><div class=\"content\">"+line.name+"</div></div> "+line.full_name+" <span class=\"caret\"></span>");
        
        $('#custom-line-name').removeClass('issue');
        $('#custom-line-error').text('');
        
        $("#custom-line-name").val(line.name);
        $("#color-picker-bg").spectrum("set", line.color_bg);
        $("#color-picker-fg").spectrum("set", line.color_fg);
        NS_interface.update_line_editor();
    }
    
    update_line_editor() {
        var line_name = $("#custom-line-name").val().substring(0, 20);
        $("#custom-line-marker-content").text(line_name);
        
        var line_color_bg = $("#color-picker-bg").val();
        $('#custom-line-marker').css('background-color', line_color_bg);

        var line_color_fg = $("#color-picker-fg").val();
        $('#custom-line-marker').css('color', line_color_fg);
    }
    
    refresh_line_editor() {
        $(".line-selector-item").remove();
        for (var i = 0; i < this.active_service.lines.length; i++) {
            var line = this.active_service.lines[i];
            $("#dropdown-line-menu").prepend("<li class=\"line-selector-item\"><a class=\"line-selector-option\" id=\""+line.id+"\" href=\"#\"> <div class=\"subway-line-long\" style=\"background-color: "+line.color_bg+"; color: "+line.color_fg+";\"><div class=\"content\">"+line.name+"</div></div> "+line.full_name+"</a></li>");
        }
    }
    
    line_editor_save() {
        var line = this.active_line;
        
        var custom_line_name = $("#custom-line-name").val().substring(0, 20);
        var custom_line_color_bg = $("#color-picker-bg").val();
        var custom_line_color_fg = $("#color-picker-fg").val();
        var issue = false;
        
        if (custom_line_name.length == 0) {
            $('#custom-line-name').addClass('issue');
            $('#custom-line-error').text('Enter a name.');
            issue = true;
        }
        
        /*
        if (find_line_by_name(custom_line_name) != null) {
            $('#custom-line-name').addClass('issue');
            $('#custom-line-error').text('Name already in use.');
            issue = true;
        }
        */
        
        if (!issue) {
            line.name = custom_line_name;
            line.color_bg = custom_line_color_bg;
            line.color_fg = custom_line_color_fg;

            $('#custom-line-name').removeClass('issue');
            $('#custom-line-css-bg').removeClass('issue');
            $('#custom-line-css-text').removeClass('issue');
            $('#custom-line-error').text('');
            
            this.update_line_selector(line.id);
            $("#"+line.id).html("<div class=\"subway-line-long\" style=\"background-color: "+line.color_bg+"; color: "+line.color_fg+";\"><div class=\"content\">"+line.name+"</div></div> "+line.full_name);
            this.draw_line(line);
        } else {
            $("#option-section-lines").animate({scrollTop: $('#option-section-lines').prop('scrollHeight')}, 1000);
        }
    }
    
    get_insertion_result(line, stop) {
        
        // Calculate edge reconfiguration
        var best_edges = [];
        var edges_to_remove = [];
        var best_line_distance = -1;
        
        var base_length = line.length();
        
        // Iterate twice through all stops on the line.
        for (var i = 0; i < line.stops.length; i++) {
            for (var j = 0; j < line.stops.length; j++) {
                
                // Only calculate if the stops are different and not the one we just added
                if ((i != j) && (line.stops[i].id != stop.id) && (line.stops[j].id != stop.id)) {
                    
                    var existing_stops = [line.stops[i], line.stops[j]];
                    
                    var temp_edge_1 = new Edge(0, [stop, line.stops[i]]);
                    var temp_edge_2 = new Edge(0, [stop, line.stops[j]]);
                    
                    var temp_length = base_length + temp_edge_1.length() + temp_edge_2.length();
                    
                    // Subtract any existing edges between the i- and j- stops
                    var temp_edge_to_remove = null;
                    for (var k = 0; k < line.edges.length; k++) {
                        if (line.edges[k].compare_stops(existing_stops)) {
                            temp_length -= line.edges[k].length();
                            temp_edge_to_remove = line.edges[k];
                        }
                    }
                    
                    if (temp_length < best_line_distance || best_edges.length == 0) {
                        best_line_distance = temp_length;
                        best_edges = [temp_edge_1, temp_edge_2];
                        edges_to_remove = [temp_edge_to_remove];
                    }
                            
                }
            }
            
            // Compare with the null case for j
            if (line.stops[i].id != stop.id) {
                var temp_edge = new Edge(0, [stop, line.stops[i]]);
                var temp_length = base_length + temp_edge.length();
                
                if (temp_length < best_line_distance || best_edges.length == 0) {
                    best_line_distance = temp_length;
                    best_edges = [temp_edge];
                    edges_to_remove = [];
                }
            }
            
        }
        
        var delta = new LineDelta(best_edges, edges_to_remove);
        
        return delta;
    }
    
    create_station_marker(station) {
        var station_marker = new StationMarker(station);
        
        this.station_markers.push(station_marker);
        
        station_marker.marker.on('click', function(e) {
            
            // Disable new station creation.
            NS_interface.map.off('click', handle_map_click);
            setTimeout(function() {
                NS_interface.map.on('click', handle_map_click);
            }, 1000);
            
            // Update popup.
            station_marker.generate_popup();
            
        });
        
        station_marker.marker.on('mousedown', function (event) {
            //L.DomEvent.stop(event);
            NS_interface.preview_paths_enabled = false;
            NS_interface.preview_clear();
            NS_interface.map.dragging.disable();
            let {lat: circleStartingLat, lng: circleStartingLng} = station_marker.marker._latlng;
            let {lat: mouseStartingLat, lng: mouseStartingLng} = event.latlng;

            NS_interface.map.on('mousemove', event => {
                let {lat: mouseNewLat, lng: mouseNewLng} = event.latlng;
                let latDifference = mouseStartingLat - mouseNewLat;
                let lngDifference = mouseStartingLng - mouseNewLng;

                let center = [circleStartingLat-latDifference, circleStartingLng-lngDifference];
                station_marker.marker.setLatLng(center);
                station_marker.station.move_to(center[0], center[1]);
                
                var lines = NS_interface.active_service.station_lines(station_marker.station);
                for (var i = 0; i < lines.length; i++) {
                    NS_interface.draw_line(lines[i]);
                }
            });
        });
        
        station_marker.marker.addTo(this.station_marker_layer);
        station_marker.marker.openPopup();
    }
    
    add_new_station(lat, lng) {
        
        var station;
        var stop;
        var line = this.active_line;
        
        // Sync with server
        $.ajax({ url: "station-add?service-id="+this.active_service.id.toString()+"&lat="+lat+"&lng="+lng, 
            async: false,
            dataType: 'json',
            success: function(data, status) {

                station = new Station(data["id"], data["name"], [lat, lng]);
                if ("locality" in data) {
                    station.locality = data["locality"];
                }
                if ("neighborhood" in data) {
                    station.neighborhood = data["neighborhood"];
                }
                if ("region" in data) {
                    station.region = data["region"];
                }
                
            }
        });
        $.ajax({ url: "stop-add?service-id="+this.active_service.id.toString()+"&line-id="+line.id.toString()+"&station-id="+station.id.toString(),
            async: false,
            dataType: 'json',
            success: function(data, status) {
                
                stop = new Stop(data["id"], station);
                
            }
        });
        
        this.active_service.add_station(station);
        line.add_stop(stop);
        
        // If the line has more than 1 stop, we'll need to reconfigure edges
        if (line.stops.length > 1) {
            var delta = this.get_insertion_result(line, stop);
            var best_edges = delta.add;
            var edges_to_remove = delta.remove;
            
            for (var i = 0; i < best_edges.length; i++) {
                line.add_edge(best_edges[i]);
                $.ajax({ url: "edge-add?service-id="+NS_interface.active_service.id.toString()+"&line-id="+line.id.toString()+"&stop-1-id="+best_edges[i].stops[0].id+"&stop-2-id="+best_edges[i].stops[1].id,
                    async: false,
                    dataType: 'json',
                    success: function(data, status) {
                        best_edges[i].id = data.id;
                    }
                });
            }
            for (var i = 0; i < edges_to_remove.length; i++) {
                line.remove_edge(edges_to_remove[i]);
                $.ajax({ url: "edge-remove?service-id="+NS_interface.active_service.id.toString()+"&line-id="+line.id.toString()+"&edge-id="+edges_to_remove[i].id,
                    async: false,
                    dataType: 'json',
                    success: function(data, status) {
                    }
                });
            }
        }
        
        this.create_station_marker(station);
        
        this.draw_line(line);
        
        this.update_line_diagram();
    }
    
    add_stop_to_station(id) {
        
        var station = this.active_service.get_station_by_id(id);
        
        if (station == null) {
            return;
        }
        
        $.ajax({ url: "stop-add?service-id="+this.active_service.id.toString()+"&line-id="+this.active_line.id.toString()+"&station-id="+station.id.toString(),
            async: false,
            dataType: 'json',
            success: function(data, status) {
                
                stop = new Stop(data["id"], station);
                
            }
        });
        
        this.active_line.add_stop(stop);
        
        // If the line has more than 1 stop, we'll need to reconfigure edges
        if (this.active_line.stops.length > 1) {
            var delta = this.get_insertion_result(this.active_line, stop);
            var best_edges = delta.add;
            var edges_to_remove = delta.remove;
            
            for (var i = 0; i < best_edges.length; i++) {
                this.active_line.add_edge(best_edges[i]);
                $.ajax({ url: "edge-add?service-id="+NS_interface.active_service.id.toString()+"&line-id="+this.active_line.id.toString()+"&stop-1-id="+best_edges[i].stops[0].id+"&stop-2-id="+best_edges[i].stops[1].id,
                    async: false,
                    dataType: 'json',
                    success: function(data, status) {
                        best_edges[i].id = data.id;
                    }
                });
            }
            for (var i = 0; i < edges_to_remove.length; i++) {
                this.active_line.remove_edge(edges_to_remove[i]);
                $.ajax({ url: "edge-remove?service-id="+NS_interface.active_service.id.toString()+"&line-id="+this.active_line.id.toString()+"&edge-id="+edges_to_remove[i].id,
                    async: false,
                    dataType: 'json',
                    success: function(data, status) {
                    }
                });
            }
        }
        
        this.draw_line(this.active_line);
        
        for (var i = 0; i < this.station_markers.length; i++)  {
            if (this.station_markers[i].station.id == station.id) {
                this.station_markers[i].generate_popup();
            }
        }
        
        this.update_line_diagram();
        
    }
    
    remove_station(id) {
        
        var impacted_lines = [];
        var impacted_stops = [];
        
        // Remove all stops that use this station.
        for (var i = 0; i < this.active_service.lines.length; i++) {
            var line = this.active_service.lines[i];
            for (var j = 0; j < line.stops.length; j++) {
                var stop = line.stops[j];
                if (stop.station.id == id) {
                    // Found a match. Remove the stop
                    impacted_stops.push(stop);
                    line.stops.splice(j, 1);
                    
                    $.ajax({ url: "stop-remove?service-id="+NS_interface.active_service.id.toString()+"&line-id="+line.id.toString()+"&stop-id="+stop.id.toString(),
                        async: false,
                        dataType: 'json',
                        success: function(data, status) {
                            
                        }
                    });
                    
                    // Add to impacted lines.
                    if (impacted_lines.indexOf(line) == -1) {
                        impacted_lines.push(line);
                    }
                    
                    // Shift the iterator back one.
                    j -= 1;
                }
            }
        }
        
        // Remove all edges that use this station.
        
        for (var i = 0; i < impacted_lines.length; i++) {
            var line = impacted_lines[i];
            var impacted_edges = [];
            for (var j = 0; j < line.edges.length; j++) {
                var edge = line.edges[j];
                for (var k = 0; k < impacted_stops.length; k++) {
                    if (edge.has_stop(impacted_stops[k])) {
                        impacted_edges.push(edge);
                        line.remove_edge(edge);
                        $.ajax({ url: "edge-remove?service-id="+NS_interface.active_service.id.toString()+"&line-id="+line.id.toString()+"&edge-id="+edge.id,
                            async: false,
                            dataType: 'json',
                            success: function(data, status) {
                                
                            }
                        });
                        j -= 1;
                    }
                }
            }
            
            // Connect any gaps in the line
            if (impacted_edges.length > 1) {
                // Choose a random stop to connect the other edges to
                var central_edge = impacted_edges[Math.floor(Math.random() * impacted_edges.length)];
                var central_stop = central_edge.stops[0];
                if (central_stop.station.id == id) {
                    central_stop = central_edge.stops[1];
                }
                
                // Add new edges
                for (var l = 0; l < impacted_edges.length; l++) {
                    var edge = impacted_edges[l];
                    if (edge.id != central_edge.id) {
                        var spoke_stop = edge.stops[0];
                        if (spoke_stop.station.id == id) {
                            spoke_stop = edge.stops[1];
                        }
                        if (spoke_stop.id != central_stop.id) {
                            var new_edge = new Edge(0, [central_stop, spoke_stop]);
                            line.add_edge(new_edge);
                            $.ajax({ url: "edge-add?service-id="+NS_interface.active_service.id.toString()+"&line-id="+line.id.toString()+"&stop-1-id="+new_edge.stops[0].id.toString()+"&stop-2-id="+new_edge.stops[1].id.toString(),
                                async: true,
                                dataType: 'json',
                                success: function(data, status) {
                                    console.log(data);
                                    new_edge.id = data.id;
                                }
                            });
                        }
                    }
                }
                
                // Check for orphaned stops
                for (var l = 0; l < line.stops.length; l++) {
                    var stop = line.stops[l];
                    var is_orphan = true;
                    for (var m = 0; m < line.edges.length; m++) {
                        var edge = line.edges[m];
                        if (edge.has_stop(stop)) {
                            is_orphan = false;
                        }
                    }
                    if (is_orphan) {
                        var delta = this.get_insertion_result(line, stop);
                        var best_edges = delta.add;
                        var edges_to_remove = delta.remove;
                        
                        for (var i = 0; i < best_edges.length; i++) {
                            line.add_edge(best_edges[i]);
                            $.ajax({ url: "edge-add?service-id="+NS_interface.active_service.id.toString()+"&line-id="+line.id.toString()+"&stop-1-id="+best_edges[i].stops[0].id+"&stop-2-id="+best_edges[i].stops[1].id,
                                async: false,
                                dataType: 'json',
                                success: function(data, status) {
                                    best_edges[i].id = data.id;
                                }
                            });
                        }
                        for (var i = 0; i < edges_to_remove.length; i++) {
                            line.remove_edge(edges_to_remove[i]);
                            $.ajax({ url: "edge-remove?service-id="+NS_interface.active_service.id.toString()+"&line-id="+line.id.toString()+"&edge-id="+edges_to_remove[i].id,
                                async: false,
                                dataType: 'json',
                                success: function(data, status) {
                                }
                            });
                        }
                    }
                }
            }
        
                
        }
            
        
        // Remove this station.
        for (var i = 0; i < this.active_service.stations.length; i++) {
            var station = this.active_service.stations[i];
            if (station.id == id) {
                this.active_service.stations.splice(i, 1);
                $.ajax({ url: "station-remove?service-id="+NS_interface.active_service.id.toString()+"&station-id="+station.id.toString(),
                    async: false,
                    dataType: 'json',
                    success: function(data, status) {
                        
                    }
                });
            }
        }
        
        // Remove the station marker.
        for (var i = 0; i < this.station_markers.length; i++) {
            var station_marker = this.station_markers[i];
            if (station_marker.station.id == id) {
                this.station_marker_layer.removeLayer(station_marker.marker);
                this.station_markers.splice(i, 1);
            }
        }
        
        // Redraw all impacted lines.
        for (var i = 0; i < impacted_lines.length; i++) {
            this.draw_line(impacted_lines[i]);
        }
        
        this.update_line_diagram();
        
    }
    
    draw_line(line) {
        if (line.id in this.line_paths) {
            var line_path = this.line_paths[line.id];
        } else {
            var line_path = new LinePath();
            this.line_paths[line.id] = line_path;
        }
        
        // Remove existing edge paths.
        for (var i = 0; i < line_path.edge_paths.length; i++) {
            this.line_path_layer.removeLayer(line_path.edge_paths[i].path);
        }
        
        // Clear edge paths array.
        line_path.edge_paths = [];
        
        // Initialize control points array.
        var edge_tentative_control_points = [];
        for (var j = 0; j < line.edges.length; j++) {
            edge_tentative_control_points[j] = [];
        }
        
        // Get the outer stops.
        var outer_stops = line.outer_stops();
        var active_stop = outer_stops[0];
        
        // Initialize visited stops.
        var visited = {};
        var visited_stops_count = 0;
        for (var j = 0; j < line.stops.length; j++) {
            visited[line.stops[j].id] = 0;
        }
        
        var bezier_coordinates = [[]];
        var bezier_stops = [[]];
        var control_points = {}; // edge.id :: control_points
        
        // recursive DFS to find all the paths
        function dfs(v) {
            console.log("DFS: node "+v.station.name);
            
            bezier_coordinates[bezier_coordinates.length-1].push({"x": v.station.location[0], "y": v.station.location[1]});
            bezier_stops[bezier_stops.length-1].push(v);
            
            visited[v.id] = 1;
            var neighbors = line.neighbors(v);
            var new_neighbor_count = 0;
            for (var i = 0; i < neighbors.length; i++) {
                var w = neighbors[i];
                if (!visited[w.id]) {
                    if (new_neighbor_count > 0) {
                        // Expand the Bezier arrays to start a new path.
                        bezier_coordinates.push([]);
                        bezier_stops.push([]);
                        bezier_coordinates[bezier_coordinates.length-1].push({"x": v.station.location[0], "y": v.station.location[1]});
                        bezier_stops[bezier_stops.length-1].push(v);
                    }
                    new_neighbor_count += 1;
                    dfs(w);
                }
            }
        }
        
        dfs(active_stop);
        console.log(bezier_coordinates);
        
        for (var i = 0; i < bezier_coordinates.length; i++) {
            
            var spline = new BezierSpline({points: bezier_coordinates[i], sharpness: 0.6});
            
            for (var j = 1; j < bezier_stops[i].length; j++) {
                for (var k = 0; k < line.edges.length; k++) {
                    var compare_result = line.edges[k].compare_stops([bezier_stops[i][j-1], bezier_stops[i][j]]);
                    if (compare_result) {
                        // Edge matches. Add the control points
                        if (compare_result == 1) {
                            var cp_0 = new BezierControlPoint(spline.controls[j-1][1].y, spline.controls[j-1][1].x);
                            var cp_1 = new BezierControlPoint(spline.controls[j][0].y, spline.controls[j][0].x);
                        } else {
                            var cp_0 = new BezierControlPoint(spline.controls[j][0].y, spline.controls[j][0].x);
                            var cp_1 = new BezierControlPoint(spline.controls[j-1][1].y, spline.controls[j-1][1].x);
                        }
                        control_points[line.edges[k].id] = [cp_0, cp_1];
                    }
                }
            }
        }
        
        // Draw new edge paths.
        for (var j = 0; j < line.edges.length; j++) {
            var edge = line.edges[j];
            var stop_points = [[edge.stops[0].station.location[0], edge.stops[0].station.location[1]], [edge.stops[1].station.location[0], edge.stops[1].station.location[1]]];
            
            var edge_control_points = [];
            if (edge.id in control_points) {
                edge_control_points = control_points[edge.id];
            }
            var edge_path = new EdgePath(stop_points, edge_control_points, line.color_bg, 1.0);
            
            line_path.edge_paths.push(edge_path);
            this.line_path_layer.addLayer(edge_path.path);
        }
        
        // Bring station layer to front.
        this.station_marker_layer.bringToFront();
        
    }
    
    preview_line(line, lat, lng) {
        this.preview_clear();
        
        // Create dummy station and stop
        var station = new Station(0, "preview", [lat, lng]);
        var stop = new Stop(0, station);
        
        // Get the EdgeDelta from this new stop
        var delta = this.get_insertion_result(line, stop);
        
        // Draw the edge path
        for (var j = 0; j < delta.add.length; j++) {
            var edge = delta.add[j];
            
            var stop_points = [[edge.stops[0].station.location[0], edge.stops[0].station.location[1]], [edge.stops[1].station.location[0], edge.stops[1].station.location[1]]];
            var edge_path = new EdgePath(stop_points, [], line.color_bg, 0.5);
            
            this.preview_paths.push(edge_path);
            this.preview_path_layer.addLayer(edge_path.path);
        }
        
        // Bring station layer to front.
        this.station_marker_layer.bringToFront();
    }
    
    preview_clear() {
        // Remove existing preview paths.
        this.preview_path_layer.clearLayers();
        
        // Clear preview paths array.
        this.preview_paths = [];
    }
    
    preview_handler(e) {
        if (this.preview_paths_enabled) {
            if (this.active_tool == "station") {
                if (this.active_line != null) {
                    this.preview_line(this.active_line, e.latlng.lat, e.latlng.lng);
                }
            }
            if (this.active_tool == "line") {
                if (this.active_line != null) {
                    this.preview_station(this.active_line, e.latlng.lat, e.latlng.lng);
                }
            }
        }
    }
    
    preview_station(line, lat, lng) {
        this.preview_clear();
        
        var turf_e = {"type": "Feature", "properties": {}, "geometry": { "type": "Point", "coordinates": [lng, lat]}};
        
        // Find the nearest station
        var best_distance = 0;
        var best_station = null;
        for (var i = 0; i < line.stops.length; i++) {
            var station = line.stops[i].station;
            
            var turf_s = {"type": "Feature", "properties": {}, "geometry": { "type": "Point", "coordinates": [station.location[1], station.location[0]]}};
            var distance = turf.distance(turf_e, turf_s, "miles");
            
            if (best_distance > distance || best_station == null) {
                best_station = station;
                best_distance = distance;
            }
        }
        
        console.log(best_station);
        if (best_station != null) {
            // Create station highlighter
            var station_highlight = L.circleMarker([best_station.location[0], best_station.location[1]], {radius: 10, color: "#A77"});
            this.preview_paths.push(station_highlight);
            this.preview_path_layer.addLayer(station_highlight);
        }
        
        // Bring station layer to front.
        this.station_marker_layer.bringToFront();
    }
    
    update_line_diagram() {
        var line = this.active_line;
        
        // Get the outer stops.
        var outer_stops = line.outer_stops();
        var active_stop = outer_stops[0];
        
        // Initialize visited stops.
        var visited = {};
        var visited_stops_count = 0;
        for (var j = 0; j < line.stops.length; j++) {
            visited[line.stops[j].id] = 0;
        }
        
        var stop_groups = [[]];
        
        // recursive DFS to find all the paths
        function dfs(v) {
            console.log("DFS: node "+v.station.name);
            
            stop_groups[stop_groups.length-1].push(v);
            
            visited[v.id] = 1;
            var neighbors = line.neighbors(v);
            var new_neighbor_count = 0;
            for (var i = 0; i < neighbors.length; i++) {
                var w = neighbors[i];
                if (!visited[w.id]) {
                    if (new_neighbor_count > 0) {
                        // Expand the arrays to start a new path.
                        stop_groups.push([]);
                        stop_groups[stop_groups.length-1].push(v);
                    }
                    new_neighbor_count += 1;
                    dfs(w);
                }
            }
        }
        
        dfs(active_stop);
        
        console.log(stop_groups);
        
        $("#route-diagram").empty();
        
        var stop_index = 0;
        var stop_position = {}; // stop id :: position in route diagram list
        
        for (var i = 0; i < stop_groups.length; i++) {
            var stop_group = stop_groups[i];
            
            // For everything past the 1st stop group, it's a branch. Ignore the first stop, it will be redundant.
            var start_index = 0;
            if (i > 0) {
                start_index = 1;
            }
            
            for (var j = start_index; j < stop_group.length; j++) {
                var stop = stop_group[j];
                var stop_div = $('<div class="route-diagram-stop"></div>');
                $("#route-diagram").append(stop_div);
                stop_div.append('<div class="route-diagram-station-marker"></div>');
                
                // Add a leading connector if this is the start of a branch.
                if (j == start_index && i > 0) {
                    var connector_height = (stop_index - stop_position[stop_group[0].id])*20;
                    stop_div.append('<div class="route-diagram-connector-top-joint" style="background-color: '+line.color_bg+'; top: -'+(connector_height-5).toString()+'px;"></div>');
                    stop_div.append('<div class="route-diagram-connector-branch" style="background-color: '+line.color_bg+'; height: '+connector_height.toString()+'px; top: -'+(connector_height-10).toString()+'px;"></div>');
                    stop_div.append('<div class="route-diagram-connector-bottom-joint" style="background-color: '+line.color_bg+';"></div>');
                }
                
                // Add a trailing connector if this isn't the end of a branch.
                if (j != stop_group.length - 1) {
                    stop_div.append('<div class="route-diagram-connector" style="background-color: '+line.color_bg+'"></div>');
                }
                stop_div.append(stop.station.name);
                
                // Store the stop index.
                stop_position[stop.id] = stop_index;
                stop_index += 1;
            }
        }
        
    }
    
    show_hexagons(distance) {
        $.ajax({ url: "hexagons?lat="+this.map.getCenter().lat+"&lng="+this.map.getCenter().lng+"&distance="+distance,
            async: true,
            dataType: 'json',
            success: function(data, status) {
                
                
                NS_interface.data_layer.clearLayers();
                for (var i = 0; i < data.length; i++) {
                    var hexagon = data[i];
                    var opacity = hexagon["population"]/3000.0;
                    if (opacity > 0.7) opacity = 0.7;
                    var poly = L.geoJSON(hexagon["geo"], { style: {
                        color: "#ff7800",
                        stroke: false,
                        fillOpacity: opacity
                    }});
                    NS_interface.data_layer.addLayer(poly);
                }
                
            }
        });
    }
    
}

class LineDelta {
    
    constructor(add, remove) {
        this.add = add;
        this.remove = remove;
    }
    
}