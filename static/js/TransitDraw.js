class StationMarker {
    
    constructor(station) {
        this.station = station;
        this.marker = this.generate_marker();
        this.popup = L.popup({'className': 'station-popup'});
        this.marker.bindPopup(this.popup);
        this.generate_popup();
    }
    
    generate_marker() {
        var latlng = L.latLng(this.station.location[0], this.station.location[1]);
        var marker = L.circleMarker(latlng, {draggable: true, color: "black", opacity: 1.0, fillColor: "white", fillOpacity: 1.0, zIndexOffset: 100}).setRadius(MARKER_RADIUS_DEFAULT);
        
        return marker;
    }
    
    generate_popup() {
        var content = '<div class="station-name" id="station-'+this.station.id.toString()+'">'+this.station.name+'   <i class="fa fa-pencil" style="margin-left: 5px;" aria-hidden="true"></i></div>';
        content += '<div class="station-content"><div class="station-info">'+this.station.neighborhood+'<br /><i class="fa fa-user" aria-hidden="true"></i> '+'R'+'</div>';
        content += '<div class="station-info subway-lines">';

        var lines = NS_interface.active_service.station_lines(this.station);
        var active_line_is_different = true;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            content += '<div id="'+this.station.id+'" class="subway-line-long subway-deletable station-popup-line-marker" style="background-color: '+line.color_bg+'; color: '+line.color_fg+';"><div class="content">'+line.name+'</div></div>';
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
    }
    
}

class BezierControlPoint {
    
    constructor(lat, lng) {
        this.lat = lat;
        this.lng = lng;
    }
}

class LinePath {
    
    constructor() {
        this.edge_paths = [];
    }
}

class EdgePath {
    
    constructor(stop_points, control_points, color, opacity) {
        this.stop_points = stop_points;
        this.control_points = control_points;
        this.color = color;
        this.opacity = opacity;
        this.track_width = 6;
        this.path = this.generate_path(this.color, this.opacity);
    }
    
    generate_path(color, opacity) {
        
        if (this.control_points.length == 2) {
            var bezier_options = [
                                    'M', 
                                    [this.stop_points[0][0], this.stop_points[0][1]],
                                    'C',
                                    [this.control_points[0].lng, this.control_points[0].lat],
                                    [this.control_points[1].lng, this.control_points[1].lat],
                                    [this.stop_points[1][0], this.stop_points[1][1]]
                                ];
            
            var curve_options = {"color": color, "weight": this.track_width, "opacity": opacity, "fill": false, "smoothFactor": 1.0, "offset": 0, "clickable": false, "pointer-events": "none", "className": "no-hover"};
            
            var path = L.curve(bezier_options, curve_options);
        } else {
            var path = L.polyline([L.latLng(this.stop_points[0][0], this.stop_points[0][1]), L.latLng(this.stop_points[1][0], this.stop_points[1][1])], {weight: this.track_width, color: color, opacity: opacity});
        }
        return path;
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
            