/*
 * Leaflet.curve v0.1.0 - a plugin for Leaflet mapping library. https://github.com/elfalem/Leaflet.curve
 * (c) elfalem 2015
 */
/*
 * note that SVG (x, y) corresponds to (long, lat)
 */

L.Curve = L.Path.extend({
	options: {
	},
	
	initialize: function(path, options){
		L.setOptions(this, options);
		this._setPath(path);
	},
	
	getPath: function(){
		return this._coords;
	},
	
	setPath: function(path){
		this._setPath(path);
		return this.redraw();
	},
	
	getBounds: function() {
		return this._bounds;
	},

	_setPath: function(path){
		this._coords = path;
		this._bounds = this._computeBounds();
	},
	
	_computeBounds: function(){
		var bound = new L.LatLngBounds();
		var lastPoint;
		var lastCommand;
		var coord;
		for(var i = 0; i < this._coords.length; i++){
			coord = this._coords[i];
			if(typeof coord == 'string' || coord instanceof String){
				lastCommand = coord;
			}else if(lastCommand == 'H'){
				bound.extend([lastPoint.lat,coord[0]]);
				lastPoint = new L.latLng(lastPoint.lat,coord[0]);
			}else if(lastCommand == 'V'){
				bound.extend([coord[0], lastPoint.lng]);
				lastPoint = new L.latLng(coord[0], lastPoint.lng);
			}else if(lastCommand == 'C'){
				var controlPoint1 = new L.latLng(coord[0], coord[1]);
				coord = this._coords[++i];
				var controlPoint2 = new L.latLng(coord[0], coord[1]);
				coord = this._coords[++i];
				var endPoint = new L.latLng(coord[0], coord[1]);

				bound.extend(controlPoint1);
				bound.extend(controlPoint2);
				bound.extend(endPoint);

				endPoint.controlPoint1 = controlPoint1;
				endPoint.controlPoint2 = controlPoint2;
				lastPoint = endPoint;
			}else if(lastCommand == 'S'){
				var controlPoint2 = new L.latLng(coord[0], coord[1]);
				coord = this._coords[++i];
				var endPoint = new L.latLng(coord[0], coord[1]);

				var controlPoint1 = lastPoint;
				if(lastPoint.controlPoint2){
					var diffLat = lastPoint.lat - lastPoint.controlPoint2.lat;
					var diffLng = lastPoint.lng - lastPoint.controlPoint2.lng;
					controlPoint1 = new L.latLng(lastPoint.lat + diffLat, lastPoint.lng + diffLng);
				}

				bound.extend(controlPoint1);
				bound.extend(controlPoint2);
				bound.extend(endPoint);

				endPoint.controlPoint1 = controlPoint1;
				endPoint.controlPoint2 = controlPoint2;
				lastPoint = endPoint;
			}else if(lastCommand == 'Q'){
				var controlPoint = new L.latLng(coord[0], coord[1]);
				coord = this._coords[++i];
				var endPoint = new L.latLng(coord[0], coord[1]);

				bound.extend(controlPoint);
				bound.extend(endPoint);

				endPoint.controlPoint = controlPoint;
				lastPoint = endPoint;
			}else if(lastCommand == 'T'){
				var endPoint = new L.latLng(coord[0], coord[1]);

				var controlPoint = lastPoint;
				if(lastPoint.controlPoint){
					var diffLat = lastPoint.lat - lastPoint.controlPoint.lat;
					var diffLng = lastPoint.lng - lastPoint.controlPoint.lng;
					controlPoint = new L.latLng(lastPoint.lat + diffLat, lastPoint.lng + diffLng);
				}

				bound.extend(controlPoint);
				bound.extend(endPoint);

				endPoint.controlPoint = controlPoint;
				lastPoint = endPoint;
			}else{
				bound.extend(coord);
				lastPoint = new L.latLng(coord[0], coord[1]);
			}
		}
		return bound;
	},
	
	//TODO: use a centroid algorithm instead
	getCenter: function () {
		return this._bounds.getCenter();
	},
	
	_update: function(){
		if (!this._map) { return; }
		
		this._updatePath();
	},
	
	_updatePath: function() {
		this._renderer._updatecurve(this);
	},
        
        // Stuff copied from PolylineOffset
	translatePoint: function(pt, dist, radians) {
            return L.point(pt.x + dist * Math.cos(radians), pt.y + dist * Math.sin(radians));
        },

        offsetPointLine: function(points, distance) {
            var l = points.length;
            if (l < 2) {
            throw new Error('Line should be defined by at least 2 points');
            }

            var a = points[0], b;
            var offsetAngle, segmentAngle;
            var offsetSegments = [];

            for(var i=1; i < l; i++) {
            b = points[i];
            // angle in (-PI, PI]
            segmentAngle = Math.atan2(a.y - b.y, a.x - b.x);
            // angle in (-1.5 * PI, PI/2]
            offsetAngle = segmentAngle - Math.PI/2;

            // store offset point and other information to avoid recomputing it later
            offsetSegments.push({
                angle: segmentAngle,
                offsetAngle: offsetAngle,
                distance: distance,
                original: [a, b],
                offset: [
                this.translatePoint(a, distance, offsetAngle),
                this.translatePoint(b, distance, offsetAngle)
                ]
            });
            a = b;
            }

            return offsetSegments;
        },

        latLngsToPoints: function(ll, map) {
            var pts = [];
            for(var i=0, l=ll.length; i<l; i++) {
            pts[i] = map.project(ll[i]);
            }
            return pts;
        },

        pointsToLatLngs: function(pts, map) {
            var ll = [];
            for(var i=0, l=pts.length; i<l; i++) {
            ll[i] = map.unproject(pts[i]);
            }
            return ll;
        },

        offsetLatLngs: function(ll, offset, map) {
            var offsetPoints = this.offsetLatLngsToPoints(ll, offset, map);
            return this.pointsToLatLngs(offsetPoints, map);
        },

        offsetLatLngsToPoints: function(ll, offset, map) {
            var origPoints = this.latLngsToPoints(ll, map);
            return this.offsetPoints(origPoints, offset);
        },

        offsetPoints: function(pts, offset) {
            var offsetSegments = this.offsetPointLine(pts, offset);
            return this.joinLineSegments(offsetSegments, offset, 'round');
        },

        /**
        Return the intersection point of two lines defined by two points each
        Return null when there's no unique intersection
        */
        intersection: function(l1a, l1b, l2a, l2b) {
            var line1 = this.lineEquation(l1a, l1b),
                line2 = this.lineEquation(l2a, l2b);

            if (line1 == null || line2 == null) {
            return null;
            }

            if(line1.hasOwnProperty('x')) {
            if(line2.hasOwnProperty('x')) {
                return null;
            }
            return L.point(line1.x, line2.a * line1.x + line2.b);
            }
            if(line2.hasOwnProperty('x')) {
            return L.point(line2.x, line1.a * line2.x + line1.b);
            }

            if (line1.a == line2.a) {
            return null;
            }

            var x = (line2.b - line1.b) / (line1.a - line2.a),
                y = line1.a * x + line1.b;

            return L.point(x, y);
        },

        /**
        Find the coefficients (a,b) of a line of equation y = a.x + b,
        or the constant x for vertical lines
        Return null if there's no equation possible
        */
        lineEquation: function(pt1, pt2) {
            if (pt1.x != pt2.x) {
            var a = (pt2.y - pt1.y) / (pt2.x - pt1.x);
            return {
                a: a,
                b: pt1.y - a * pt1.x
            };
            }

            if (pt1.y != pt2.y) {
            return { x: pt1.x };
            }

            return null;
        },

        /**
        Join 2 line segments defined by 2 points each,
        with a specified methodnormalizeAngle( (default : intersection);
        */
        joinSegments: function(s1, s2, offset, joinStyle) {
            var jointPoints = [];
            switch(joinStyle) {
            case 'round':
                jointPoints = this.circularArc(s1, s2, offset);
                break;
            case 'cut':
                jointPoints = [
                this.intersection(s1.offset[0], s1.offset[1], s2.original[0], s2.original[1]),
                this.intersection(s1.original[0], s1.original[1], s2.offset[0], s2.offset[1])
                ];
                break;
            case 'straight':
                jointPoints = [s1.offset[1], s2.offset[0]];
                break;
            case 'intersection':
            default:
                jointPoints = [this.intersection(s1.offset[0], s1.offset[1], s2.offset[0], s2.offset[1])];
            }
            // filter out null-results
            return jointPoints.filter(function(v) {return v;});
        },

        joinLineSegments: function(segments, offset, joinStyle) {
            var l = segments.length;
            var joinedPoints = [];
            var s1 = segments[0], s2 = segments[0];
            joinedPoints.push(s1.offset[0]);

            for(var i=1; i<l; i++) {
            s2 = segments[i];
            joinedPoints = joinedPoints.concat(this.joinSegments(s1, s2, offset, joinStyle));
            s1 = s2;
            }
            joinedPoints.push(s2.offset[1]);

            return joinedPoints;
        },

        /**
        Interpolates points between two offset segments in a circular form
        */
        circularArc: function(s1, s2, distance) {
            if (s1.angle == s2.angle)
            return [s1.offset[1]];

            var center = s1.original[1];
            var points = [];

            if (distance < 0) {
            var startAngle = s1.offsetAngle;
            var endAngle = s2.offsetAngle;
            } else {
            // switch start and end angle when going right
            var startAngle = s2.offsetAngle;
            var endAngle = s1.offsetAngle;
            }

            if (endAngle < startAngle) {
            endAngle += Math.PI * 2; // the end angle should be bigger than the start angle
            }

            if (endAngle > startAngle + Math.PI) {
            return [this.intersection(s1.offset[0], s1.offset[1], s2.offset[0], s2.offset[1])];
            }

            // Step is distance dependent. Bigger distance results in more steps to take
            var step = Math.abs(8/distance);
            for (var a = startAngle; a < endAngle; a += step) {
            points.push(this.translatePoint(center, distance, a));
            }
            points.push(this.translatePoint(center, distance, endAngle));

            if (distance > 0) {
            // reverse all points again when going right
            points.reverse();
            }

            return points;
        },

	_project: function() {
		var coord, lastCoord, curCommand, curPoint, prevPoint;

		this._points = [];
                
                // Hack added by Jason for offsetting
                var first_actual_coord = this._coords[1];
                var last_actual_coord = this._coords[this._coords.length - 1];
                var start_point = this._map.latLngToLayerPoint([first_actual_coord[0], first_actual_coord[1]]);
                var end_point = this._map.latLngToLayerPoint([last_actual_coord[0], last_actual_coord[1]]);
                var angle = Math.atan2(end_point.x - start_point.x, end_point.y - start_point.y);
                angle = angle + (Math.PI / 2.0);
                var x_offset = Math.sin(angle) * this.options.offset;
                var y_offset = Math.cos(angle) * this.options.offset;
		
		for(var i = 0; i < this._coords.length; i++){
			coord = this._coords[i];
			if(typeof coord == 'string' || coord instanceof String){
				this._points.push(coord);
				curCommand = coord;
			}else {
				switch(coord.length){
					case 2:
						curPoint = this._map.latLngToLayerPoint(coord);
						lastCoord = coord;
					break;
					case 1:
						if(curCommand == 'H'){
							curPoint = this._map.latLngToLayerPoint([lastCoord[0], coord[0]]);
							lastCoord = [lastCoord[0], coord[0]];
						}else{
							curPoint = this._map.latLngToLayerPoint([coord[0], lastCoord[1]]);
							lastCoord = [coord[0], lastCoord[1]];
						}
					break;
				}
				
				
				this._points.push(L.point([curPoint.x+x_offset, curPoint.y+y_offset]));
			}
		}
		
	}
});

L.curve = function (path, options){
	return new L.Curve(path, options);
};

L.SVG.include({
	_updatecurve: function(layer){
		this._setPath(layer, this._curvePointsToPath(layer._points));
    	},
 	_curvePointsToPath: function(points){
		var point, curCommand, str = '';
		for(var i = 0; i < points.length; i++){
			point = points[i];
			if(typeof point == 'string' || point instanceof String){
				curCommand = point;
				str += curCommand;
			}else{
				switch(curCommand){
					case 'H':
						str += point.x + ' ';
						break;
					case 'V':
						str += point.y + ' ';
						break;
					default:
						str += point.x + ',' + point.y + ' ';
						break;
				}
			}
		}
		return str || 'M0 0';
	}
});
