class StationMarker {

    constructor(station) {
        this.station = station;
        this.tooltip_options = {direction: 'top', offset: L.point(0, -5), className: 'station-marker-tooltip'};
        this.marker = this.generate_marker();
        this.popup = L.popup({'className': 'station-popup'});
        this.marker.bindPopup(this.popup);
        this.generate_popup();
    }

    generate_marker() {
        var latlng = L.latLng(this.station.location[0], this.station.location[1]);
        var marker = L.circleMarker(latlng, {draggable: true, color: "black", opacity: 1.0, fillColor: "white", fillOpacity: 1.0, zIndexOffset: 100}).setRadius(MARKER_RADIUS_DEFAULT).bindTooltip(this.station.name, this.tooltip_options);

        return marker;
    }

    generate_popup() {
        var content = '<div class="station-name" id="station-'+this.station.id.toString()+'">'+this.station.name+'   <i class="fa fa-pencil" style="margin-left: 5px;" aria-hidden="true"></i></div>';
        content += '<div class="station-content"><div class="station-info">'+this.station.neighborhood+'<br /><i class="fa fa-user" aria-hidden="true"></i> '+Math.round(this.station.ridership).toString()+'</div>';
        content += '<div class="station-info subway-lines">';

        var lines = NS_interface.active_service.station_lines(this.station);
        var active_line_is_different = true;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            content += '<div id="'+this.station.id.toString()+'.'+line.id.toString()+'" class="subway-line-long subway-deletable station-popup-line-marker" style="background-color: '+line.color_bg+'; color: '+line.color_fg+';"><div class="content">'+line.name+'</div></div>';
            if (line.id == NS_interface.active_line.id) {
                active_line_is_different = false;
            }
        }
        content += ' </div>';

        content += '<div class="station-buttons"><div class="station-content-button station-transfer" id="transfer-'+this.station.id.toString()+'">Transfer</div>';


        if (active_line_is_different) {
            content += '<div class="station-content-button station-build line-'+NS_interface.active_line.id.toString()+'" id="'+this.station.id.toString()+'">Build <div class="subway-line-long subway-line-mini" style="background-color: '+NS_interface.active_line.color_bg+'; color: '+NS_interface.active_line.color_fg+';"><div class="content">'+NS_interface.active_line.name+'</div></div></div>';
        }

        content += '<div class="station-content-button station-delete ';
        content += '" id="delete-'+this.station.id.toString()+'">Delete</div>';
        content += '</div><div style="clear: both;"></div>';
        content += '</div>';

        this.popup.setContent(content);
        this.popup.update();
        this.marker.bindPopup(this.popup);
    }
    
    update_tooltip() {
        this.marker.unbindTooltip();
        this.marker.bindTooltip(this.station.name, this.tooltip_options);
    }

}

class BezierControlPoint {

    constructor(lat, lng) {
        this.lat = lat;
        this.lng = lng;
    }
}

class BezierControlPointMarker {
    
    constructor(b, id, sp_id) {
        this.bcp = b;
        this.id = id;
        this.sp_id = sp_id;
        this.marker = this.generate_marker();
    }
    
    update_marker() {
        this.marker = this.generate_marker();
    }
    
    generate_marker() {
        var options = {draggable: false, color: "black", opacity: 0.8, fillColor: "#333", fillOpacity: 0.8, zIndexOffset: 100, radius: 5};
        var marker = L.circleMarker(L.latLng(this.bcp.lat, this.bcp.lng), options);
        marker.mcp_index = this.id;
        marker.sp_id = this.sp_id;
        return marker;
    }
}

class LinePath {

    constructor() {
        this.raw_edge_paths = [];
        this.edge_paths = [];
    }

    get_path_for_edge(edge) {
        for (var i = 0; i < this.edge_paths.length; i++) {
            if (this.edge_paths[i].edge_id == edge.id) {
                return this.edge_paths[i];
            }
        }
        return null;
    }

    get_raw_path_for_edge(edge) {
        for (var i = 0; i < this.raw_edge_paths.length; i++) {
            if (this.raw_edge_paths[i].edge_id == edge.id) {
                return this.raw_edge_paths[i];
            }
        }
        return null;
    }
}

class EdgePath {

    constructor(edge_id, stop_points, control_points, offset, color, opacity) {
        this.edge_id = edge_id;
        this.stop_points = stop_points;
        this.control_points = control_points;
        this.custom_control_points = [];
        this.offset = offset;
        this.color = color;
        this.opacity = opacity;
        this.track_width = 6;
        this.path = this.generate_path(this.color, this.opacity);
    }

    generate_path(color, opacity) {
        if (this.control_points.length == 0) {
            var path = L.polyline([L.latLng(this.stop_points[0][0], this.stop_points[0][1]), L.latLng(this.stop_points[1][0], this.stop_points[1][1])], {weight: this.track_width, color: color, opacity: opacity});
        } else if (this.control_points[0].length == 0) {
            var path = L.polyline([L.latLng(this.stop_points[0][0], this.stop_points[0][1]), L.latLng(this.stop_points[1][0], this.stop_points[1][1])], {weight: this.track_width, color: color, opacity: opacity});
        } else {
            var bezier_options = [
                                    'M',
                                    [this.stop_points[0][0], this.stop_points[0][1]]
                                ];
            for (var i = 0; i < this.control_points.length; i++) {
                var new_options = ['C',
                                    [this.control_points[i][0].lng, this.control_points[i][0].lat],
                                    [this.control_points[i][1].lng, this.control_points[i][1].lat],
                                    [this.stop_points[i+1][0], this.stop_points[i+1][1]]
                                ];
                bezier_options.push.apply(bezier_options, new_options);
            }
            var curve_options = {"color": color, "weight": this.track_width, "opacity": opacity, "fill": false, "smoothFactor": 1.0, "offset": this.offset*(this.track_width/2), "clickable": false, "pointer-events": "none", "className": "no-hover"};
            var path = L.curve(bezier_options, curve_options);
        }
        return path;
    }

    regenerate_path() {
        this.path = this.generate_path(this.color, this.opacity);
    }
}

class StationPair {
    
    // Two stations associated with an array of LineControlPoints
    constructor(stations) {
        this.id = NS_id_sp.id();
        this.stations = stations;
        this.line_control_points = [];
        this.user_modifying = 0; // Index of actively modified user_control_point
        this.user_modified = false;
        this.user_control_points = [];
        this.paths = [];
        this.draw_inverted = false;
    }
    
    add_control_points(line, control_points) {
        this.line_control_points.push(new LineControlPoints(line, control_points));
        if (!this.user_modified) {
            this.clear_user_control_points();
        }
        this.line_control_points.sort(function(a,b) {
            return a.line.id > b.line.id;
        });
    }
    
    clear_line_control_points(line) {
        for (var i = this.line_control_points.length - 1; i >= 0; i--) {
            var lcp = this.line_control_points[i];
            if (lcp.line == line) {
                this.line_control_points.splice(i, 1);
            }
        }
        if (!this.user_modified) {
            this.clear_user_control_points();
        }
    }
    
    set_user_control_points(control_points) {
        this.user_control_points = control_points;
        this.user_modified = true;
    }
    
    clear_user_control_points() {
        var a_lcp = this.average_lcp();
        this.user_control_points = [new BezierControlPoint(a_lcp[0].lat, a_lcp[0].lng), new BezierControlPoint(a_lcp[1].lat, a_lcp[1].lng)];
    }
    
    lines() {
        var lines = [];
        for (var i = 0; i < this.line_control_points.length; i++) {
            var lcp_line = this.line_control_points[i].line;
            if (lines.indexOf(lcp_line) == -1) {
                lines.push(lcp_line);
            }
        }
        return lines;
    }
    
    has_line(line) {
        for (var i = 0; i < this.line_control_points.length; i++) {
            var lcp_line = this.line_control_points[i].line;
            if (lcp_line == line) {
                return true;
            }
        }
        return false;
    }
    
    has_station(station) {
        for (var i = 0; i < this.stations.length; i++) {
            if (this.stations[i].id == station.id) {
                return true;
            }
        }
        return false;
    }
    
    num_lines() {
        var used_lines = [];
        for (var i = 0; i < this.line_control_points.length; i++) {
            var lcp_line = this.line_control_points[i].line;
            if (used_lines.indexOf(lcp_line) == -1) {
                used_lines.push(lcp_line);
            }
        }
        return used_lines.length;
    }
    
    num_lines_color() {
        var ret = 0;
        var used_colors = [];
        for (var i = 0; i < this.line_control_points.length; i++) {
            var lcp_line = this.line_control_points[i].line;
            if (used_colors.indexOf(lcp_line.color_bg) == -1) {
                used_colors.push(lcp_line.color_bg);
                ret += 1;
            }
        }
        return ret;
    }
    
    lcp_pos(lcp) {
        var used_lines = [];
        for (var i = 0; i < this.line_control_points.length; i++) {
            var lcp_line = this.line_control_points[i].line;
            if (used_lines.indexOf(lcp_line) == -1) {
                used_lines.push(lcp_line);
            }
        }
        for (var j = 0; j < used_lines.length; j++) {
            if (used_lines[j] == lcp.line) {
                return j;
            }
        }
        return -1;
    }
    
    lcp_pos_color(lcp) {
        var used_colors = [];
        for (var i = 0; i < this.line_control_points.length; i++) {
            var lcp_line = this.line_control_points[i].line;
            if (used_colors.indexOf(lcp_line.color_bg) == -1) {
                used_colors.push(lcp_line.color_bg);
            }
        }
        for (var j = 0; j < used_colors.length; j++) {
            if (used_colors[j] == lcp.line.color_bg) {
                return j;
            }
        }
        return -1;
    }
    
    average_lcp() {
        var x0 = 0.0;
        var y0 = 0.0;
        var x1 = 0.0;
        var y1 = 0.0;
        for (var i = 0; i < this.line_control_points.length; i++) {
            x0 += this.line_control_points[i].control_points[0].lat;
            y0 += this.line_control_points[i].control_points[0].lng;
            x1 += this.line_control_points[i].control_points[1].lat;
            y1 += this.line_control_points[i].control_points[1].lng;
        }
        x0 = x0 / this.line_control_points.length;
        y0 = y0 / this.line_control_points.length;
        x1 = x1 / this.line_control_points.length;
        y1 = y1 / this.line_control_points.length;
        return [{"lat": x0, "lng": y0}, {"lat": x1, "lng": y1}];
    }
    
    markers() {
        if (this.user_modified) {
            var cp = [{"lat": this.user_control_points[0].lat, "lng": this.user_control_points[0].lng}, {"lat": this.user_control_points[1].lat, "lng": this.user_control_points[1].lng}];
        } else {
            var cp = this.average_lcp();
        }
        var b1 = new BezierControlPointMarker(new BezierControlPoint(cp[0].lat, cp[0].lng), 0, this.id);
        var b2 = new BezierControlPointMarker(new BezierControlPoint(cp[1].lat, cp[1].lng), 1, this.id);
        return [b1, b2];
    }
    
    generate_path(lcp, color, offset, weight, opacity) {  
        if (this.user_modified) {
            var cp = [{"lat": this.user_control_points[0].lat, "lng": this.user_control_points[0].lng}, {"lat": this.user_control_points[1].lat, "lng": this.user_control_points[1].lng}];
        } else {
            var cp = this.average_lcp();
        }
        
        if (lcp.control_points.length == 0) {
            var path = L.polyline([L.latLng(this.stations[0].location[0], this.stations[0].location[1]), L.latLng(this.stations[1].location[0], this.stations[1].location[1])], {weight: weight, color: color, opacity: opacity});
        } else {
            var bezier_options = [
                                    'M',
                                    [this.stations[0].location[0], this.stations[0].location[1]]
                                ];

            var new_options = ['C',
                                [cp[0].lat, cp[0].lng],
                                [cp[1].lat, cp[1].lng],
                                [this.stations[1].location[0], this.stations[1].location[1]]
                            ];
            bezier_options.push.apply(bezier_options, new_options);
            
            var curve_options = {"color": color, "weight": weight, "opacity": opacity, "fill": false, "smoothFactor": 1.0, "offset": offset*(weight/2), "clickable": false, "pointer-events": "none", "className": "no-hover"};
            var path = L.curve(bezier_options, curve_options);
        }
        return path;
    }
    
    average_path() {
        var lcp = this.line_control_points[0];
        return this.generate_path(lcp, "#A77", 0, 6*(this.num_lines_color()+1), 0.5);
    }
    
    generate_paths() {
        this.undraw();
        this.paths = [];
        for (var i = 0; i < this.line_control_points.length; i++) {
            var lcp = this.line_control_points[i];
            //this.paths.push(this.generate_path(lcp, this.lcp_pos(lcp)*2 - (this.num_lines()-1)));
            var offset = this.lcp_pos_color(lcp)*2 - (this.num_lines_color()-1);
            /*if (this.stations[0].id > this.stations[1].id) {
                offset = offset * -1;
            }*/
            /*if (this.draw_inverted) {
                offset = offset * -1;
            }*/
            this.paths.push(this.generate_path(lcp, lcp.line.color_bg, offset, 6, 1.0));
        }
    }
    
    undraw() {
        for (var j = 0; j < this.paths.length; j++) {
            NS_interface.line_path_layer.removeLayer(this.paths[j]);
        }
    }
    
    draw() {
        for (var j = 0; j < this.paths.length; j++) {
            NS_interface.line_path_layer.addLayer(this.paths[j]);
        }
    }

}

class LineControlPoints {
    
    constructor(line, control_points) {
        this.line = line;
        this.control_points = control_points;
    }
    
}
    

class LineColor {

    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.fr = 255;
        this.fg = 255;
        this.fb = 255;
        if ((r + g + b) > (255*3/2)) {
            this.fr = 0;
            this.fg = 0;
            this.fb = 0;
        }
    }

    bg_hex() {
        var rs = ("0" + this.r.toString(16).toUpperCase()).slice(-2);
        var rg = ("0" + this.g.toString(16).toUpperCase()).slice(-2);
        var rb = ("0" + this.b.toString(16).toUpperCase()).slice(-2);
        return "#"+rs+rg+rb;
    }

    fg_hex() {
        var rs = ("0" + this.fr.toString(16).toUpperCase()).slice(-2);
        var rg = ("0" + this.fg.toString(16).toUpperCase()).slice(-2);
        var rb = ("0" + this.fb.toString(16).toUpperCase()).slice(-2);
        return "#"+rs+rg+rb;
    }
}
