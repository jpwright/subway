/*****************************************************************************************
*
* Project Name:		jsDraw2DX (SVG/VML based Graphics Library for JavaScript, HTML5 Ready)
* Version:		Alpha 1.0.7 (16-Nov-2012) (Uncompressed)
* Project Homepage:	http://jsdraw2dx.jsfiction.com
* Author:			Sameer Burle
* Copyright 2012:		jsFiction.com (http://www.jsfiction.com)
* Licensed Under:		LGPL
*
* This program (library) is free software: you can redistribute it and/or modify
* it under the terms of the GNU Lesser General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
*****************************************************************************************/
//Global Variables and functions
function jsDraw2DX() {
    //Holder for global variables/functions
}
jsDraw2DX._RefID = 0; //Reference IDs used for <defs> in SVG
jsDraw2DX._isVML = false; //_isVML is true if SVG is not supported and only VML is supported

//Global Functions
//Check browser for IE
jsDraw2DX.checkIE = function() {
    if (navigator.appName == 'Microsoft Internet Explorer') {
        var version = 9;
        if (navigator.appVersion.indexOf('MSIE') != -1)
            version = parseFloat(navigator.appVersion.split('MSIE')[1]);

        if (version < 9) { //SVG support provided for IE9 & onwards
            jsDraw2DX._isVML = true;
        }
    }
}

//Internal global utility factorial function
jsDraw2DX.fact = function(n) {
    var res = 1;
    for (var i = 1; i <= n; i++) {
        res = res * i;
    }
    return res;
}

//Initialization of the library
jsDraw2DX.init = function() {
    jsDraw2DX.checkIE();
    if (jsDraw2DX._isVML) {
        document.namespaces.add('v', 'urn:schemas-microsoft-com:vml', '#default#VML');
        var vmlElements = ['fill', 'stroke', 'path', 'textpath'];
        for (var i = 0, l = vmlElements.length; i < l; i++) {
            document.createStyleSheet().addRule('v\\:' + vmlElements[i], 'behavior: url(#default#VML);');
        }
    }
}

//Global Startup
jsDraw2DX.init();

//jxGraphics class holds basic drawing parameters like origin, scale, co-ordinate system.
//It also holds drawing div, svg/vml root elements and array of the drawn shapes.
function jxGraphics(graphicsDivElement) {

    //Private member variables
    this.origin = new jxPoint(0, 0);
    this.scale = 1;
    this.coordinateSystem = 'default'; //Possible values 'default' or 'cartecian'

    //Private member variables
    var _shapes = new Array(); //Array of shapes drawn with the graphics 
    var _graphicsDiv, _svg, _vml, _defs;

    if (graphicsDivElement) {
        _graphicsDiv = graphicsDivElement;
        _graphicsDiv.style.overflow = 'hidden';
    }
    else
        _graphicsDiv = document.body;  //Document will be used directly for drawing

    //SVG, VML Initialization
    if (!jsDraw2DX._isVML) {
        _svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        _graphicsDiv.appendChild(_svg);
        _defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        _svg.appendChild(_defs);
        _svg.style.position = 'absolute';
        _svg.style.top = '0px';
        _svg.style.left = '0px';
        _svg.style.width = _graphicsDiv.style.width;
        _svg.style.height = _graphicsDiv.style.height;
    }
    else {
        _vml = document.createElement('v:group');
        _vml.style.position = 'absolute';
        _vml.style.top = '0px';
        _vml.style.left = '0px';
        _graphicsDiv.appendChild(_vml);
    }

    //Internal utility methods
    //Defs (for SVG only)
    this.getDefs = getDefs;
    function getDefs() {
        return _defs;
    }

    //Adds shape to the _shapes array
    this.addShape = addShape;
    function addShape(shape) {
        var ind = this.indexOfShape(shape);
        if (ind < 0)
            _shapes.push(shape);
    }

    //Removes shape from the _shapes array
    this.removeShape = removeShape;
    function removeShape(shape) {
        var ind = this.indexOfShape(shape);
        if (ind >= 0)
            _shapes.splice(ind, 1);
    }
    
    //Public Methods
    //Get the type
    this.getType = getType;
    function getType() {
        return 'jxGraphics';
    }
    
    //Graphics Div
    this.getDiv = getDiv;
    function getDiv() {
        return _graphicsDiv;
    }

    //SVG
    this.getSVG = getSVG;
    function getSVG() {
        return _svg;
    }

    //VML
    this.getVML = getVML;
    function getVML() {
        return _vml;
    }

    //Conversion of logical point to physical point based on coordinate system, origin and scale.
    this.logicalToPhysicalPoint = logicalToPhysicalPoint;
    function logicalToPhysicalPoint(point) {
        if (this.coordinateSystem.toLowerCase() == 'cartecian') {
            return new jxPoint(Math.round(point.x * this.scale + this.origin.x), Math.round(this.origin.y - point.y * this.scale))
        }
        else {
            return new jxPoint(Math.round(point.x * this.scale + this.origin.x), Math.round(point.y * this.scale + this.origin.y))
        }
    }

    //Draws a specified shape
    this.draw = draw;
    function draw(shape) {
        return shape.draw(this);
    }

    //Removes a specified shape
    this.remove = remove;
    function remove(shape) {
        return shape.remove(this);
    }

    //Redraws all the shapes
    this.redrawAll = redrawAll;
    function redrawAll() {
        for (ind in _shapes) {
            _shapes[ind].draw(this);
        }
    }

    //Gets the count of the shape drawn on the graphics
    this.getShapesCount = getShapesCount;
    function getShapesCount() {
        return _shapes.length;
    }

    //Gets the shape object drawn on the graphics at specific index
    this.getShape = getShape;
    function getShape(index) {
        return _shapes[index]; 
    }

    //Gets the index of the shape
    this.indexOfShape = indexOfShape;
    function indexOfShape(shape) {
        var ind=-1, length = _shapes.length;
        for (var i = 0; i < length; i++) {
            if (shape == _shapes[i]) {
                ind = i;
            }
        }
        return ind;
    }
}

//jxColor class holds the color information and provides some color related basic functions.
function jxColor() {
    //Member variables
    var _color = '#000000';

    switch (arguments.length) {
        //Color Hex or Named or rgb()
        case 1:
            _color=arguments[0];
            break;
        //RGB Color 
        case 3:
            var red = arguments[0];
            var green = arguments[1];
            var blue = arguments[2];
            _color = jxColor.rgbToHex(red, green, blue);
            break;
    }

    //Public Methods
    //Get the type
    this.getType = getType;
    function getType() {
        return 'jxColor';
    }
    
    //Get the hexa-decimal or named color value of the object
    this.getValue = getValue;
    function getValue() {
        return _color;
    }
}
//Static-Shared Utility Methods of jxColor
//Convert RGB color to Hex color
jxColor.rgbToHex = function(redValue, greenValue, blueValue) {
    //Check argument values
    if (redValue < 0 || redValue > 255 || greenValue < 0 || greenValue > 255 || blueValue < 0 || blueValue > 255) {
        return false;
    }

    var colorDec = Math.round(blueValue) + 256 * Math.round(greenValue) + 65536 * Math.round(redValue);
    return '#' + zeroPad(colorDec.toString(16), 6);

    //Internal method, add zero padding to the left. Used for building hexa-decimal string.	
    function zeroPad(val, count) {
        var valZeropad = val + '';
        while (valZeropad.length < count) {
            valZeropad = '0' + valZeropad;
        }
        return valZeropad;
    }
}

//Convert Hex color to RGB color
jxColor.hexToRgb = function(hexValue) {
    var redValue, greenValue, blueValue;
    if (hexValue.charAt(0) == '#') {
        hexValue = hexValue.substring(1, 7);
    }

    redValue = parseInt(hexValue.substring(0, 2), 16);
    greenValue = parseInt(hexValue.substring(2, 4), 16);
    blueValue = parseInt(hexValue.substring(4, 6), 16);

    //Check argument values
    if (redValue < 0 || redValue > 255 || greenValue < 0 || greenValue > 255 || blueValue < 0 || blueValue > 255) {
        return false;
    }

    return new Array(redValue, greenValue, blueValue);
}

//jxFont class holds the font information which can be used by other objects in object oriented way.
function jxFont(family, size, style, weight, variant) {
    //Public Properties with default value null
    this.family = null;
    this.size = null;
    this.style = null;
    this.weight = null;
    this.variant = null;

    //Object Construction
    if (family)
        this.family = family;

    if (weight)
        this.weight = weight;

    if (size)
        this.size = size;

    if (style)
        this.style = style;

    if (variant)
        this.variant = variant;

    //Internal utility methods
    //Apply font settings to SVG text
    this.updateSVG = updateSVG;
    function updateSVG(_svgvmlObj) {
        if (this.family)
            _svgvmlObj.setAttribute('font-family', this.family)
        else
            _svgvmlObj.setAttribute('font-family', '')
        if (this.weight)
            _svgvmlObj.setAttribute('font-weight', this.weight)
        else
            _svgvmlObj.setAttribute('font-weight', '')
        if (this.size)
            _svgvmlObj.setAttribute('font-size', this.size)
        else
            _svgvmlObj.setAttribute('font-size', '')
        if (this.style)
            _svgvmlObj.setAttribute('font-style', this.style)
        else
            _svgvmlObj.setAttribute('font-style', '')
        if (this.variant)
            _svgvmlObj.setAttribute('font-variant', this.variant)
        else
            _svgvmlObj.setAttribute('font-variant', '')
    }

    //Apply font settings to VML textpath
    this.updateVML = updateVML;
    function updateVML(vmlTextPath) {
        if (this.family)
            vmlTextPath.style.fontFamily = "'" + this.family + "'";
        else
            vmlTextPath.style.fontFamily = '';
        if (this.weight)
            vmlTextPath.style.fontWeight = this.weight;
        else
            vmlTextPath.style.fontWeight = '';
        if (this.size)
            vmlTextPath.style.fontSize = this.size;
        else
            vmlTextPath.style.fontSize = '';
        if (this.style)
            vmlTextPath.style.fontStyle = this.style;
        else
            vmlTextPath.style.fontStyle = '';
        if (this.variant)
            vmlTextPath.style.fontVariant = this.variant;
        else
            vmlTextPath.style.fontVariant = '';
    }
    
    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxFont';
    }    
}

//Internal Static/Shared Methods of jxFont
//To remove font setting of SVG text (font=null)
jxFont.updateSVG = function(_svgvmlObj) {
    _svgvmlObj.setAttribute('font-family', '')
    _svgvmlObj.setAttribute('font-weight', '')
    _svgvmlObj.setAttribute('font-size', '')
    _svgvmlObj.setAttribute('font-style', '')
    _svgvmlObj.setAttribute('font-variant', '')
}

//Remove font settings of VML textpath (font=null)
jxFont.updateVML = function(vmlTextPath) {
    vmlTextPath.style.fontFamily = '';
    vmlTextPath.style.fontWeight = '';
    vmlTextPath.style.fontSize = '';
    vmlTextPath.style.fontStyle = '';
    vmlTextPath.style.fontVariant = '';
}

//jxPen class holds the drawing pen/stroke information. 
//Mainly it holds the color and width values to be used for 2D drawing. 
//Acts like a pen for drawing.
function jxPen(color, width, dashStyle) {
    //Public Properties
    this.color = null;  //color proprty of jxColor type
    this.width = null;  //width property
    this.dashStyle = null; //for dotted and dashed line
    //Object construction
    if (color) 
        this.color = color;
    else
        this.color = new jxColor('#000000'); //default black color
        
    if (width)
        this.width = width;
    else
        this.width = '1px'; //1px default value

    if (dashStyle)
        this.dashStyle = dashStyle;   

    //Internal utility methods
    //Update the svg to apply pen settings
    this.updateSVG = updateSVG;
    function updateSVG(_svgvmlObj) {
        _svgvmlObj.setAttribute('stroke', this.color.getValue());
        _svgvmlObj.setAttribute('stroke-width', this.width);
        if (this.dashStyle) {
            var w = parseInt(this.width);
            switch (this.dashStyle.toLowerCase()) {
                case 'shortdash':
                    _svgvmlObj.setAttribute('stroke-dasharray', w * 3 + ' ' + w);
                    break;
                case 'shortdot':
                    _svgvmlObj.setAttribute('stroke-dasharray', w + ' ' + w);
                    break;
                case 'shortdashdot':
                    _svgvmlObj.setAttribute('stroke-dasharray', w * 3 + ' ' + w + ' ' + w + ' ' + w);
                    break;
                case 'shortdashdotdot':
                    _svgvmlObj.setAttribute('stroke-dasharray', w * 3 + ' ' + w + ' ' + w + ' ' + w + ' ' + w + ' ' + w);
                    break;
                case 'dot':
                    _svgvmlObj.setAttribute('stroke-dasharray', w + ' ' + w * 3);
                    break;
                case 'dash':
                    _svgvmlObj.setAttribute('stroke-dasharray', w * 4 + ' ' + w * 3);
                    break;
                case 'longdash':
                    _svgvmlObj.setAttribute('stroke-dasharray', w * 8 + ' ' + w * 3);
                    break;
                case 'dashdot':
                    _svgvmlObj.setAttribute('stroke-dasharray', w * 4 + ' ' + w * 3 + ' ' + w + ' ' + w * 3);
                    break;
                case 'longdashdot':
                    _svgvmlObj.setAttribute('stroke-dasharray', w * 8 + ' ' + w * 3 + ' ' + w + ' ' + w * 3);
                    break;
                case 'longdashdotdot':
                    _svgvmlObj.setAttribute('stroke-dasharray', w * 8 + ' ' + w * 3 + ' ' + w + ' ' + w * 3 + ' ' + w + ' ' + w * 3);
                    break;
                default:
                    _svgvmlObj.setAttribute('stroke-dasharray', this.dashStyle);
                    break;
            }
        }
    }
    
    //Update the vml to apply pen settings
    this.updateVML = updateVML;
    function updateVML(_svgvmlObj) {
        _svgvmlObj.Stroke.JoinStyle = 'miter';
        _svgvmlObj.Stroke.MiterLimit = '5';
        _svgvmlObj.StrokeColor = this.color.getValue();
        _svgvmlObj.StrokeWeight = this.width;
        if (this.dashStyle)
            _svgvmlObj.Stroke.DashStyle = this.dashStyle;
        if (parseInt(this.width) == 0)
            _svgvmlObj.Stroked = 'False';
    }

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxPen';
    }
}

//jxBrush class holds the drawing fill information. 
//Mainly it holds the fill color values and fill type to be used for filling 2D drawing. 
//Acts like a brush for drawing.
function jxBrush(color, fillType) {

    //Public Properties
    this.color = null;  //color proprty of jxColor type
    this.fillType = null; //fillType property 'solid','lin_grad'='linear_gradient',proposed:'rad_grad'='radial_gradiant' or 'pattern'
    this.color2 = null; //second color for gradient fill type
    this.angle = null;
    
    //Construction of the object
    if (color) 
        this.color = color;
    else
        this.color = new jxColor('#000000');  //Default black color

    if (fillType)
        this.fillType = fillType;
    else
        this.fillType = 'solid'; //Default fillType other values 'linear-gradient'='lin-grad' (more to come)

    //Set rest of defaults
    this.color2 = new jxColor('#FFFFFF'); //Default color2 

    //Internal utility functions
    //Update the svg to apply brush settings
    this.updateSVG = updateSVG;
    function updateSVG(_svgvmlObj,defs) {
        var fillId=null, oldChild;
        fillId = _svgvmlObj.getAttribute('fill');
        if (fillId) {
            if (fillId.substr(0, 5) == 'url(#') {
                fillId = fillId.substr(5, fillId.length - 6);
                oldChild = document.getElementById(fillId);
            }
            else
                fillId = null;
        }

        if (this.fillType == 'linear-gradient' || this.fillType == 'lin-grad') {
            var linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            if (fillId)
                defs.replaceChild(linearGradient, oldChild);
            else
                defs.appendChild(linearGradient);
            var stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            linearGradient.appendChild(stop1);
            var stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            linearGradient.appendChild(stop2);
            jsDraw2DX._RefID++;
            linearGradient.setAttribute('id', 'jsDraw2DX_RefID_' + jsDraw2DX._RefID);
            if (this.angle != null)
                linearGradient.setAttribute('gradientTransform', 'rotate(' + this.angle + ' 0.5 0.5)');
            else
                linearGradient.setAttribute('gradientTransform', 'rotate(0 0.5 0.5)');
            stop1.setAttribute('offset','0%');
            stop1.setAttribute('style','stop-color:' + this.color.getValue() + ';stop-opacity:1');
            stop2.setAttribute('offset','100%');
            stop2.setAttribute('style', 'stop-color:' + this.color2.getValue() + ';stop-opacity:1');
            linearGradient.appendChild(stop1);
            linearGradient.appendChild(stop2);
            _svgvmlObj.setAttribute('fill', 'url(#' + 'jsDraw2DX_RefID_' + jsDraw2DX._RefID + ')');
        }
        else
            _svgvmlObj.setAttribute('fill', this.color.getValue());
    }

    //Update the vml to apply brush settings
    this.updateVML = updateVML;
    function updateVML(vmlFill) {
        vmlFill.On = 'true';
        if (this.fillType == 'solid') {
            vmlFill.Type = 'solid';
            vmlFill.Color = this.color.getValue();
            vmlFill.Color2 = '';
            vmlFill.Angle = 270;
        }
        else {
            vmlFill.Type = 'gradient';
            if (this.angle != null)
                vmlFill.Angle = 270 - this.angle;
            else
                vmlFill.Angle = 270;
            vmlFill.Color = this.color.getValue();
            vmlFill.Color2 = this.color2.getValue();
        }
    }

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxBrush';
    }
}

//jxPoint class holds the 2D drawing point information. 
//It holds values of x and y coordinates of the point.
function jxPoint(x, y) {

    //Public Properties
    this.x = x;
    this.y = y;
    
    //Public Methods
    //Get the type
    this.getType = getType;
    function getType() {
        return 'jxPoint';
    }
}

//Class to hold information and draw line shape
function jxLine(fromPoint, toPoint, pen) {

    //Public Properties
    this.fromPoint = fromPoint;
    this.toPoint = toPoint;
    this.pen = null;

    //Private member variables
    var _svgvmlObj, _isFirst = true;
    var _graphics;
    
    //Object Construction
    if(pen)
        this.pen = pen;
        
    if (!jsDraw2DX._isVML)
        _svgvmlObj = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    else
        _svgvmlObj = document.createElement('v:line');

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxLine';
    }

    //Events Handling Ability
    this.addEventListener = addEventListener;
    function addEventListener(eventName, handler) {
        if (_svgvmlObj.addEventListener)
            _svgvmlObj.addEventListener(eventName, handlerWrapper, false);
        else if (_svgvmlObj.attachEvent)
            _svgvmlObj.attachEvent('on' + eventName, handlerWrapper);

        var currentObj = this;    
        function handlerWrapper(evt) {
            handler(evt, currentObj); 
        }   
    }

    //Draw line shape on the jxGraphics    
    this.draw = draw;
    function draw(graphics) {
        var fromPoint, toPoint;
        fromPoint = graphics.logicalToPhysicalPoint(this.fromPoint);
        toPoint = graphics.logicalToPhysicalPoint(this.toPoint);

        var colorValue, penWidth, isFirst = false;
        colorValue = this.pen.color.getValue();
        penWidth = this.pen.width;
        
        var x1, y1, x2, y2;
        x1 = fromPoint.x;
        y1 = fromPoint.y;
        x2 = toPoint.x;
        y2 = toPoint.y;
        
        _svgvmlObj.style.display = 'none';

        if (!jsDraw2DX._isVML) {
            var svg = graphics.getSVG();
            if (_isFirst)
            {
                svg.appendChild(_svgvmlObj);
                _isFirst = false;
            }
           
            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.setAttribute('stroke', 'none');
            else
                this.pen.updateSVG(_svgvmlObj);

            _svgvmlObj.setAttribute('x1', x1);
            _svgvmlObj.setAttribute('y1', y1);
            _svgvmlObj.setAttribute('x2', x2);
            _svgvmlObj.setAttribute('y2', y2);
        }
        else {
            var vml = graphics.getVML();
            if (_isFirst) {
                vml.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.Stroked = 'False';
            else
                this.pen.updateVML(_svgvmlObj);
                
            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.From = x1 + ',' + y1;
            _svgvmlObj.To = x2 + ',' + y2;
        }

        _svgvmlObj.style.display = '';

        if (_graphics && graphics != _graphics) {
            _graphics.removeShape(this);
        }
        _graphics = graphics;
        _graphics.addShape(this);
    }

    //Removes shape from the graphics drawing
    this.remove = remove;
    function remove() {
        if (_graphics) {
            if (!jsDraw2DX._isVML) {
                var svg = _graphics.getSVG();
                svg.removeChild(_svgvmlObj);
            }
            else {
                var vml = _graphics.getVML();
                vml.removeChild(_svgvmlObj);
            }
            _graphics.removeShape(this);
            _graphics = null;
            _isFirst = true; 
        }
    }

    //Show the already drawn shape
    this.show = show;
    function show() {
        _svgvmlObj.style.display = '';
    }

    //Hide the already drawn shape
    this.hide = hide;
    function hide() {
        _svgvmlObj.style.display = 'none';
    }
}

//Class to hold information and draw rectangle shape
function jxRect(point, width, height, pen, brush) {
    
    //Public Properties
    this.point = point;
    this.width = width;
    this.height = height;
    this.pen = null;
    this.brush = null;

    //Private member variables
    var _svgvmlObj, _isFirst = true;
    var _graphics;
            
    //Object construction
    if (pen)
        this.pen = pen;
    if (brush)
        this.brush = brush;

    if (!jsDraw2DX._isVML)
        _svgvmlObj = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    else
        _svgvmlObj = document.createElement('v:rect');

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxRect';
    }

    //Events Handling Ability
    this.addEventListener = addEventListener;
    function addEventListener(eventName, handler) {
        if (_svgvmlObj.addEventListener)
            _svgvmlObj.addEventListener(eventName, handlerWrapper, false);
        else if (_svgvmlObj.attachEvent)
            _svgvmlObj.attachEvent('on' + eventName, handlerWrapper);

        var currentObj = this;    
        function handlerWrapper(evt) {
            handler(evt, currentObj);
        }    
    }

    //Draw rectangle shape on the jxGraphics 
    this.draw = draw;
    function draw(graphics) {
        var point, scale;
        point = graphics.logicalToPhysicalPoint(this.point);
        scale = graphics.scale; 

        var x1, y1;
        x1 = point.x;
        y1 = point.y;

        _svgvmlObj.style.display = 'none';
        
        if (!jsDraw2DX._isVML) {
            var svg = graphics.getSVG();
            if (_isFirst) {
                svg.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.setAttribute('stroke', 'none');
            else
                this.pen.updateSVG(_svgvmlObj);

            //Apply Brush Settings
            if (!this.brush)
                _svgvmlObj.setAttribute('fill', 'none');
            else {
                this.brush.updateSVG(_svgvmlObj, graphics.getDefs());
            }
            _svgvmlObj.setAttribute('x', x1);
            _svgvmlObj.setAttribute('y', y1);
            _svgvmlObj.setAttribute('width', scale * this.width);
            _svgvmlObj.setAttribute('height', scale * this.height);
            _svgvmlObj.style.position = 'absolute'
        }
        else {
            var vml = graphics.getVML(), vmlFill;
            if (_isFirst) {
                vml.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.Stroked = 'False';
            else
                this.pen.updateVML(_svgvmlObj);

            //Apply Brush Setting
            vmlFill = _svgvmlObj.fill;
            if (!this.brush)
                vmlFill.On = 'false';
            else
                this.brush.updateVML(vmlFill);

            _svgvmlObj.style.width = scale * this.width;
            _svgvmlObj.style.height = scale * this.height;
            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.style.top = y1;
            _svgvmlObj.style.left = x1;
        }

        _svgvmlObj.style.display = '';
        
        if (_graphics && graphics != _graphics) {
            _graphics.removeShape(this);
        }
        _graphics = graphics;
        _graphics.addShape(this);
    }

    //Removes shape from the graphics drawing
    this.remove = remove;
    function remove() {
        if (_graphics) {
            if (!jsDraw2DX._isVML) {
                var svg = _graphics.getSVG();
                svg.removeChild(_svgvmlObj);
            }
            else {
                var vml = _graphics.getVML();
                vml.removeChild(_svgvmlObj);
            }
            _graphics.removeShape(this);
            _graphics = null;
            _isFirst = true;
        }
    }

    //Show the already drawn shape
    this.show = show;
    function show() {
        _svgvmlObj.style.display = '';
    }

    //Hide the already drawn shape
    this.hide = hide;
    function hide() {
        _svgvmlObj.style.display = 'none';
    }
}

//Class to hold information and draw polyline shape
function jxPolyline(points, pen, brush) {

    //Public Properties
    this.points = points;
    this.pen = null;
    this.brush = null;

    //Private member variables
    var _svgvmlObj, _isFirst = true;
    var _graphics;
    
    //Object construction
    if (pen)
        this.pen = pen;
    if (brush)
        this.brush = brush;

    if (!jsDraw2DX._isVML)
        _svgvmlObj = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    else
        _svgvmlObj = document.createElement('v:polyline');

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxPolyline';
    }

    //Events Handling Ability
    this.addEventListener = addEventListener;
    function addEventListener(eventName, handler) {
        if (_svgvmlObj.addEventListener)
            _svgvmlObj.addEventListener(eventName, handlerWrapper, false);
        else if (_svgvmlObj.attachEvent)
            _svgvmlObj.attachEvent('on' + eventName, handlerWrapper);

        var currentObj = this;    
        function handlerWrapper(evt) {
            handler(evt, currentObj);
        }    
    }

    //Draw polyline shape on the jxGraphics 
    this.draw = draw;
    function draw(graphics) {
        var points=new Array(),pointsList='';
        for (ind in this.points) {
            points[ind] = graphics.logicalToPhysicalPoint(this.points[ind]);
        }
        for (ind in points) {
            pointsList = pointsList + points[ind].x + ',' + points[ind].y + ' ';
        }

        _svgvmlObj.style.display = 'none';

        if (!jsDraw2DX._isVML) {
            var svg = graphics.getSVG();
            if (_isFirst) {
                svg.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Settings
            if (!this.pen)
                _svgvmlObj.setAttribute('stroke', 'none');
            else
                this.pen.updateSVG(_svgvmlObj);

            //Apply Brush Settings
            if (!this.brush)
                _svgvmlObj.setAttribute('fill', 'none');
            else {
                this.brush.updateSVG(_svgvmlObj, graphics.getDefs());
            }
            _svgvmlObj.style.position = 'absolute'
            _svgvmlObj.setAttribute('points', pointsList);
        }
        else {
            var vml = graphics.getVML(), vmlFill;
            if (_isFirst) {
                vml.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.Stroked = 'False';
            else
                this.pen.updateVML(_svgvmlObj);

            //Apply Brush Setting
            vmlFill = _svgvmlObj.fill;
            if (!this.brush)
                vmlFill.On = 'false';
            else
                this.brush.updateVML(vmlFill);

            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.Points.Value = pointsList;
        }

        _svgvmlObj.style.display = '';

        if (_graphics && graphics != _graphics) {
            _graphics.removeShape(this);
        }
        _graphics = graphics;
        _graphics.addShape(this);
    }

    //Removes shape from the graphics drawing
    this.remove = remove;
    function remove() {
        if (_graphics) {
            if (!jsDraw2DX._isVML) {
                var svg = _graphics.getSVG();
                svg.removeChild(_svgvmlObj);
            }
            else {
                var vml = _graphics.getVML();
                vml.removeChild(_svgvmlObj);
            }
            _graphics.removeShape(this);
            _graphics = null;
            _isFirst = true; 
        }
    }

    //Show the already drawn shape
    this.show = show;
    function show() {
        _svgvmlObj.style.display = '';
    }

    //Hide the already drawn shape
    this.hide = hide;
    function hide() {
        _svgvmlObj.style.display = 'none';
    }
}

//Class to hold information and draw polygon shape
function jxPolygon(points, pen, brush) {

    //Public Properties
    this.points = points;
    this.pen = null;
    this.brush = null;

    //Private member variables
    var _svgvmlObj, _isFirst = true;
    var _graphics;

    //Object construction
    if (pen)
        this.pen = pen;
    if (brush)
        this.brush = brush;

    if (!jsDraw2DX._isVML)
        _svgvmlObj = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    else
        _svgvmlObj = document.createElement('v:polyline');

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxPolygon';
    }

    //Events Handling Ability
    this.addEventListener = addEventListener;
    function addEventListener(eventName, handler) {
        if (_svgvmlObj.addEventListener)
            _svgvmlObj.addEventListener(eventName, handlerWrapper, false);
        else if (_svgvmlObj.attachEvent)
            _svgvmlObj.attachEvent('on' + eventName, handlerWrapper);

        var currentObj = this;    
        function handlerWrapper(evt) {
            handler(evt, currentObj);    
        }
    }

    //Draw polygon shape on the jxGraphics 
    this.draw = draw;
    function draw(graphics) {
        var points = new Array(), pointsList = '';
        for (ind in this.points) {
            points[ind] = graphics.logicalToPhysicalPoint(this.points[ind]);
        }
        for (ind in points) {
            pointsList = pointsList + points[ind].x + ',' + points[ind].y + ' ';
        }

        _svgvmlObj.style.display = 'none';

        if (!jsDraw2DX._isVML) {
            var svg = graphics.getSVG();
            if (_isFirst) {
                svg.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Settings
            if (!this.pen)
                _svgvmlObj.setAttribute('stroke', 'none');
            else
                this.pen.updateSVG(_svgvmlObj);

            //Apply Brush Settings
            if (!this.brush)
                _svgvmlObj.setAttribute('fill', 'none');
            else {
                this.brush.updateSVG(_svgvmlObj, graphics.getDefs());
            }
            _svgvmlObj.style.position = 'absolute'
            _svgvmlObj.setAttribute('points', pointsList);
        }
        else {
            pointsList = pointsList + points[0].x + ',' + points[0].y;
            var vml = graphics.getVML(), vmlFill;
            if (_isFirst) {
                vml.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.Stroked = 'False';
            else
                this.pen.updateVML(_svgvmlObj);

            //Apply Brush Setting
            vmlFill = _svgvmlObj.fill;
            if (!this.brush)
                vmlFill.On = 'false';
            else
                this.brush.updateVML(vmlFill);

            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.Points.Value = pointsList;
        }
            
        _svgvmlObj.style.display = '';

        if (_graphics && graphics != _graphics) {
            _graphics.removeShape(this);
        }
        _graphics = graphics;
        _graphics.addShape(this);
    }

    //Removes shape from the graphics drawing
    this.remove = remove;
    function remove() {
        if (_graphics) {
            if (!jsDraw2DX._isVML) {
                var svg = _graphics.getSVG();
                svg.removeChild(_svgvmlObj);
            }
            else {
                var vml = _graphics.getVML();
                vml.removeChild(_svgvmlObj);
            }
            _graphics.removeShape(this);
            _graphics = null;
            _isFirst = true;
        }
    }

    //Show the already drawn shape
    this.show = show;
    function show() {
        _svgvmlObj.style.display = '';
    }

    //Hide the already drawn shape
    this.hide = hide;
    function hide() {
        _svgvmlObj.style.display = 'none';
    }
}

//Class to hold information and draw circle shape
function jxCircle(center, radius, pen, brush) {

    //Public Properties
    this.center = center;
    this.radius = radius;
    this.pen = null;
    this.brush = null;

    //Private member variables
    var _svgvmlObj, _isFirst = true;
    var _graphics;

    //Object construction
    if (pen)
        this.pen = pen;
    if (brush)
        this.brush = brush;

    if (!jsDraw2DX._isVML)
        _svgvmlObj = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    else
        _svgvmlObj = document.createElement('v:oval');

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxCircle';
    }

    //Events Handling Ability
    this.addEventListener = addEventListener;
    function addEventListener(eventName, handler) {
        if (_svgvmlObj.addEventListener)
            _svgvmlObj.addEventListener(eventName, handlerWrapper, false);
        else if (_svgvmlObj.attachEvent)
            _svgvmlObj.attachEvent('on' + eventName, handlerWrapper);

        var currentObj = this;    
        function handlerWrapper(evt) {
            handler(evt, currentObj);
        }
    }

    //Draw circle shape on the jxGraphics 
    this.draw = draw;
    function draw(graphics) {
        var center, scale;
        center = graphics.logicalToPhysicalPoint(this.center);
        scale = graphics.scale;

        var cx, cy;
        cx = center.x;
        cy = center.y;

        _svgvmlObj.style.display = 'none';

        if (!jsDraw2DX._isVML) {
            var svg = graphics.getSVG();
            if (_isFirst) {
                svg.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.setAttribute('stroke', 'none');
            else
                this.pen.updateSVG(_svgvmlObj);

            //Apply Brush Setting
            if (!this.brush)
                _svgvmlObj.setAttribute('fill', 'none');
            else {
                this.brush.updateSVG(_svgvmlObj, graphics.getDefs());
            }

            _svgvmlObj.setAttribute('cx', cx);
            _svgvmlObj.setAttribute('cy', cy);
            _svgvmlObj.setAttribute('r', scale * this.radius);
            _svgvmlObj.style.position = 'absolute'
        }
        else {
            var vml = graphics.getVML(), vmlFill;
            if (_isFirst) {
                vml.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.Stroked = 'False';
            else
                this.pen.updateVML(_svgvmlObj);

            //Apply Brush Setting
            vmlFill = _svgvmlObj.fill;
            if (!this.brush)
                vmlFill.On = 'false';
            else
                this.brush.updateVML(vmlFill);

            _svgvmlObj.style.width = scale * this.radius * 2;
            _svgvmlObj.style.height = scale * this.radius * 2;
            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.style.top = cy - scale * this.radius;
            _svgvmlObj.style.left = cx - scale * this.radius;
        }

        _svgvmlObj.style.display = '';

        if (_graphics && graphics != _graphics) {
            _graphics.removeShape(this);
        }
        _graphics = graphics;
        _graphics.addShape(this);
    }

    //Removes shape from the graphics drawing
    this.remove = remove;
    function remove() {
        if (_graphics) {
            if (!jsDraw2DX._isVML) {
                var svg = _graphics.getSVG();
                svg.removeChild(_svgvmlObj);
            }
            else {
                var vml = _graphics.getVML();
                vml.removeChild(_svgvmlObj);
            }
            _graphics.removeShape(this);
            _graphics = null;
            _isFirst = true;
        }
    }

    //Show the already drawn shape
    this.show = show;
    function show() {
        _svgvmlObj.style.display = '';
    }

    //Hide the already drawn shape
    this.hide = hide;
    function hide() {
        _svgvmlObj.style.display = 'none';
    }
}

//Class to hold information and draw ellipse shape
function jxEllipse(center, width, height, pen, brush) {

    //Public Properties
    this.center = center;
    this.width = width;
    this.height = height;
    this.pen = null;
    this.brush = null;

    //Private member variables
    var _svgvmlObj, _isFirst = true;
    var _graphics;

    //Object construction
    if (pen)
        this.pen = pen;
    if (brush)
        this.brush = brush;

    if (!jsDraw2DX._isVML)
        _svgvmlObj = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    else
        _svgvmlObj = document.createElement('v:oval');

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxEllipse';
    }

    //Events Handling Ability
    this.addEventListener = addEventListener;
    function addEventListener(eventName, handler) {
        if (_svgvmlObj.addEventListener)
            _svgvmlObj.addEventListener(eventName, handlerWrapper, false);
        else if (_svgvmlObj.attachEvent)
            _svgvmlObj.attachEvent('on' + eventName, handlerWrapper);

        var currentObj = this;    
        function handlerWrapper(evt) {
            handler(evt, currentObj);
        }    
    }

    //Draw ellipse shape on the jxGraphics 
    this.draw = draw;
    function draw(graphics) {
        var center, scale;
        center = graphics.logicalToPhysicalPoint(this.center);
        scale = graphics.scale;

        var cx, cy;
        cx = center.x;
        cy = center.y;
        
        _svgvmlObj.style.display = 'none';
        
        if (!jsDraw2DX._isVML) {
            var svg = graphics.getSVG();
            if (_isFirst) {
                svg.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Settings
            if (!this.pen)
                _svgvmlObj.setAttribute('stroke', 'none');
            else
                this.pen.updateSVG(_svgvmlObj);

            //Apply Brush Setting
            if (!this.brush)
                _svgvmlObj.setAttribute('fill', 'none');
            else {
                this.brush.updateSVG(_svgvmlObj, graphics.getDefs());
            }
            _svgvmlObj.setAttribute('cx', cx);
            _svgvmlObj.setAttribute('cy', cy);
            _svgvmlObj.setAttribute('rx', scale * this.width / 2);
            _svgvmlObj.setAttribute('ry', scale * this.height / 2);
            _svgvmlObj.style.position = 'absolute'
        }
        else {
            var vml = graphics.getVML(), vmlFill;
            if (_isFirst) {
                vml.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.Stroked = 'False';
            else
                this.pen.updateVML(_svgvmlObj);

            //Apply Brush Setting
            vmlFill = _svgvmlObj.fill;
            if (!this.brush)
                vmlFill.On = 'false';
            else
                this.brush.updateVML(vmlFill);

            _svgvmlObj.style.width = scale * this.width;
            _svgvmlObj.style.height = scale * this.height;
            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.style.top = cy - scale * this.height / 2;
            _svgvmlObj.style.left = cx - scale * this.width / 2;
        }

        _svgvmlObj.style.display = '';

        if (_graphics && graphics != _graphics) {
            _graphics.removeShape(this);
        }
        _graphics = graphics;
        _graphics.addShape(this);
    }

    //Removes shape from the graphics drawing
    this.remove = remove;
    function remove() {
        if (_graphics) {
            if (!jsDraw2DX._isVML) {
                var svg = _graphics.getSVG();
                svg.removeChild(_svgvmlObj);
            }
            else {
                var vml = _graphics.getVML();
                vml.removeChild(_svgvmlObj);
            }
            _graphics.removeShape(this);
            _graphics = null;
            _isFirst = true;
        }
    }

    //Show the already drawn shape
    this.show = show;
    function show() {
        _svgvmlObj.style.display = '';
    }

    //Hide the already drawn shape
    this.hide = hide;
    function hide() {
        _svgvmlObj.style.display = 'none';
    }
}

//Class to hold information and draw elliptical arc shape
function jxArc(center, width, height, startAngle, arcAngle, pen, brush) {

    //Public properties
    this.center = center;
    this.width = width;
    this.height = height;
    this.startAngle = startAngle;
    this.arcAngle = arcAngle;
    this.pen = null;
    this.brush = null;

    //Private member variables
    var _svgvmlObj, _isFirst = true;
    var _graphics;

    //Object construction
    if (pen)
        this.pen = pen;
    if (brush)
        this.brush = brush;

    if (!jsDraw2DX._isVML)
        _svgvmlObj = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    else
        _svgvmlObj = document.createElement('v:arc');

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxArc';
    }

    //Events Handling Ability
    this.addEventListener = addEventListener;
    function addEventListener(eventName, handler) {
        if (_svgvmlObj.addEventListener)
            _svgvmlObj.addEventListener(eventName, handlerWrapper, false);
        else if (_svgvmlObj.attachEvent)
            _svgvmlObj.attachEvent('on' + eventName, handlerWrapper);

        var currentObj = this;    
        function handlerWrapper(evt) {
            handler(evt, currentObj);
        }    
    }

    //Draw arc shape on the jxGraphics 
    this.draw = draw;
    function draw(graphics) {
        var center, scale;
        center = graphics.logicalToPhysicalPoint(graphics);
        scale = graphics.scale;
        var cx, cy;
        cx = this.center.x;
        cy = this.center.y;

        _svgvmlObj.style.display = 'none';

        if (!jsDraw2DX._isVML) {
            //Calculation of coordinates of ellipse based on angle
            var a, b, r1, r2, x1, x2, y1, y2, sa, ea;
            a = scale * this.width / 2;
            b = scale * this.height / 2;
            sa = this.startAngle * Math.PI / 180;
            r1 = a * b / Math.sqrt(b * b * Math.cos(sa) * Math.cos(sa) + a * a * Math.sin(sa) * Math.sin(sa));
            x1 = r1 * Math.cos(sa);
            y1 = r1 * Math.sin(sa);
            x1 = cx + x1;
            y1 = cy + y1;

            ea = (startAngle + arcAngle) * Math.PI / 180;
            r2 = a * b / Math.sqrt(b * b * Math.cos(ea) * Math.cos(ea) + a * a * Math.sin(ea) * Math.sin(ea));
            x2 = r2 * Math.cos(ea);
            y2 = r2 * Math.sin(ea);
            x2 = cx + x2;
            y2 = cy + y2;

            var svg = graphics.getSVG();
            if (_isFirst) {
                svg.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.setAttribute('stroke', 'none');
            else
                this.pen.updateSVG(_svgvmlObj);

            //Apply Brush Setting
            if (!this.brush)
                _svgvmlObj.setAttribute('fill', 'none');
            else {
                this.brush.updateSVG(_svgvmlObj, graphics.getDefs());
            }

            if (arcAngle > 180)
                _svgvmlObj.setAttribute('d', 'M' + x1 + ' ' + y1 + ' A' + a + ' ' + b + ' 0 1 1 ' + x2 + ' ' + y2);
            else
                _svgvmlObj.setAttribute('d', 'M' + x1 + ' ' + y1 + ' A' + a + ' ' + b + ' 0 0 1 ' + x2 + ' ' + y2);
        }
        else {
            var vml = graphics.getVML(), vmlFill;
            if (_isFirst) {
                vml.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            var a, b, r1, r2, sa, ea, sat, eat, endAngle;
            endAngle = this.startAngle + this.arcAngle;
            startAngle = this.startAngle % 360;
            endAngle = endAngle % 360;
            a = scale * this.width / 2;
            b = scale * this.height / 2;
            sa = this.startAngle * Math.PI / 180;
            r1 = a * b / Math.sqrt(b * b * Math.cos(sa) * Math.cos(sa) + a * a * Math.sin(sa) * Math.sin(sa));
            sat = Math.asin(r1 * Math.sin(sa) / b) * 180 / Math.PI;
            if (this.startAngle > 270)
                sat = 360 + sat;
            else if (this.startAngle > 90)
                sat = 180 - sat;

            ea = endAngle * Math.PI / 180;
            r2 = a * b / Math.sqrt(b * b * Math.cos(ea) * Math.cos(ea) + a * a * Math.sin(ea) * Math.sin(ea));
            eat = Math.asin(r2 * Math.sin(ea) / b) * 180 / Math.PI;

            if (endAngle > 270)
                eat = 360 + eat;
            else if (endAngle > 90)
                eat = 180 - eat;

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.Stroked = 'False';
            else
                this.pen.updateVML(_svgvmlObj);

            //Apply Brush Setting
            vmlFill = _svgvmlObj.fill;
            if (!this.brush)
                vmlFill.On = 'false';
            else
                this.brush.updateVML(vmlFill);

            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.style.width = scale * this.width;
            _svgvmlObj.style.height = scale * this.height;
            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.style.left = cx - scale * this.width / 2;
            _svgvmlObj.style.top = cy - scale * this.height / 2;
            sat = sat + 90;
            if (sat > 360)
                _svgvmlObj.StartAngle = sat % 360;
            else
                _svgvmlObj.StartAngle = sat;
            eat = eat + 90;
            if (eat > 360) {
                if (sat <= 360)
                    _svgvmlObj.StartAngle = sat - 360;
                _svgvmlObj.EndAngle = eat % 360;
            }
            else
                _svgvmlObj.EndAngle = eat;
        }

        _svgvmlObj.style.display = '';

        if (_graphics && graphics != _graphics) {
            _graphics.removeShape(this);
        }
        _graphics = graphics;
        _graphics.addShape(this);
    }

    //Removes shape from the graphics drawing
    this.remove = remove;
    function remove() {
        if (_graphics) {
            if (!jsDraw2DX._isVML) {
                var svg = _graphics.getSVG();
                svg.removeChild(_svgvmlObj);
            }
            else {
                var vml = _graphics.getVML();
                vml.removeChild(_svgvmlObj);
            }
            _graphics.removeShape(this);
            _graphics = null;
            _isFirst = true;
        }
    }

    //Show the already drawn shape
    this.show = show;
    function show() {
        _svgvmlObj.style.display = '';
    }

    //Hide the already drawn shape
    this.hide = hide;
    function hide() {
        _svgvmlObj.style.display = 'none';
    }
}

//Class to hold information and draw elliptical arc sector(pie) shape
function jxArcSector(center, width, height, startAngle, arcAngle, pen, brush) {
    
    //Public Properties
    //Check for 360 arcAngle in chrome
    this.center = center;
    this.width = width;
    this.height = height;
    this.startAngle = startAngle;
    this.arcAngle = arcAngle;
    this.pen = null;
    this.brush = null;

    //Private member variables
    var _svgvmlObj, _isFirst = true;
    var _graphics;

    //Object construction
    if (pen)
        this.pen = pen;
    if (brush)
        this.brush = brush;

    if (!jsDraw2DX._isVML)
        _svgvmlObj = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    else
        _svgvmlObj = document.createElement('v:shape');

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxArcSector';
    }

    //Events Handling Ability
    this.addEventListener = addEventListener;
    function addEventListener(eventName, handler) {
        if (_svgvmlObj.addEventListener)
            _svgvmlObj.addEventListener(eventName, handlerWrapper, false);
        else if (_svgvmlObj.attachEvent)
            _svgvmlObj.attachEvent('on' + eventName, handlerWrapper);

        var currentObj = this;    
        function handlerWrapper(evt) {
            handler(evt, currentObj);    
        }
    }

    //Draw arc sector (pie) shape on the jxGraphics 
    this.draw = draw;
    function draw(graphics) {
        var center, scale;
        center = graphics.logicalToPhysicalPoint(this.center);
        scale = graphics.scale;

        var cx, cy;
        cx = center.x;
        cy = center.y;

        //Calculation of coordinates of ellipse based on angle
        var a, b, r1, r2, x1, x2, y1, y2, sa, ea;
        a = scale * this.width / 2;
        b = scale * this.height / 2;
        sa = this.startAngle * Math.PI / 180;
        r1 = a * b / Math.sqrt(b * b * Math.cos(sa) * Math.cos(sa) + a * a * Math.sin(sa) * Math.sin(sa));
        x1 = r1 * Math.cos(sa);
        y1 = r1 * Math.sin(sa);
        x1 = cx + x1;
        y1 = cy + y1;

        ea = (this.startAngle + this.arcAngle) * Math.PI / 180;
        r2 = a * b / Math.sqrt(b * b * Math.cos(ea) * Math.cos(ea) + a * a * Math.sin(ea) * Math.sin(ea));
        x2 = r2 * Math.cos(ea);
        y2 = r2 * Math.sin(ea);
        x2 = cx + x2;
        y2 = cy + y2;

        _svgvmlObj.style.display = 'none';

        if (!jsDraw2DX._isVML) {
            var svg = graphics.getSVG();
            if (_isFirst) {
                svg.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.setAttribute('stroke', 'none');
            else
                this.pen.updateSVG(_svgvmlObj);

            //Apply Brush Setting
            if (!this.brush)
                _svgvmlObj.setAttribute('fill', 'none');
            else {
                this.brush.updateSVG(_svgvmlObj, graphics.getDefs());
            }

            if (arcAngle > 180)
                _svgvmlObj.setAttribute('d', 'M' + cx + ' ' + cy + ' L' + x1 + ' ' + y1 + ' A' + a + ' ' + b + ' 0 1 1 ' + x2 + ' ' + y2 + ' Z');
            else
                _svgvmlObj.setAttribute('d', 'M' + cx + ' ' + cy + ' L' + x1 + ' ' + y1 + ' A' + a + ' ' + b + ' 0 0 1 ' + x2 + ' ' + y2 + ' Z');
        }
        else {
            var vml = graphics.getVML(), vmlFill;
            if (_isFirst) {
                vml.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            var t, l, h, w
            t = Math.min(y2, Math.min(cy, y1));
            l = Math.min(x2, Math.min(cx, x1));
            h = Math.max(y2, Math.max(cy, y1)) - t;
            w = Math.max(x2, Math.max(cx, x1)) - l;

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.Stroked = 'False';
            else
                this.pen.updateVML(_svgvmlObj);

            //Apply Brush Setting
            vmlFill = _svgvmlObj.fill;
            if (!this.brush)
                vmlFill.On = 'false';
            else
                this.brush.updateVML(vmlFill);

            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.style.height = 1;
            _svgvmlObj.style.width = 1;
            _svgvmlObj.CoordSize = 1 + ' ' + 1;
            _svgvmlObj.Path = 'M' + cx + ',' + cy + ' AT' + (cx - a) + ',' + (cy - b) + ',' + (cx + a) + ',' + (cy + b) + ',' + Math.round(x2) + ',' + Math.round(y2) + ',' + Math.round(x1) + ',' + Math.round(y1) + ' X E';
        }

        _svgvmlObj.style.display = '';

        if (_graphics && graphics != _graphics) {
            _graphics.removeShape(this);
        }
        _graphics = graphics;
        _graphics.addShape(this);
    }

    //Removes shape from the graphics drawing
    this.remove = remove;
    function remove() {
        if (_graphics) {
            if (!jsDraw2DX._isVML) {
                var svg = _graphics.getSVG();
                svg.removeChild(_svgvmlObj);
            }
            else {
                var vml = _graphics.getVML();
                vml.removeChild(_svgvmlObj);
            }
            _graphics.removeShape(this);
            _graphics = null;
            _isFirst = true;
        }
    }

    //Show the already drawn shape
    this.show = show;
    function show() {
        _svgvmlObj.style.display = '';
    }

    //Hide the already drawn shape
    this.hide = hide;
    function hide() {
        _svgvmlObj.style.display = 'none';
    }
}

//Class to hold information and draw curve shape
function jxCurve(points, pen, brush, tension) {
    //Public Properties
    this.points = points;
    this.pen = null;
    this.brush = null;
    this.tension = 1;

    //Private member variables
    var _svgvmlObj, _isFirst = true;
    var _graphics;

    //Object construction
    if (pen)
        this.pen = pen;
    if (brush)
        this.brush = brush;
    if (tension!=null)
        this.tension = tension;

    if (!jsDraw2DX._isVML)
        _svgvmlObj = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    else
        _svgvmlObj = document.createElement('v:shape');

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxCurve';
    }

    //Events Handling Ability
    this.addEventListener = addEventListener;
    function addEventListener(eventName, handler) {
        if (_svgvmlObj.addEventListener)
            _svgvmlObj.addEventListener(eventName, handlerWrapper, false);
        else if (_svgvmlObj.attachEvent)
            _svgvmlObj.attachEvent('on' + eventName, handlerWrapper);

        var currentObj = this;    
        function handlerWrapper(evt) {
            handler(evt, currentObj);
        }    
    }

    //Draw curve shape on the jxGraphics 
    this.draw = draw;
    function draw(graphics) {
        var points=new Array();
        for (ind in this.points) {
            points[ind] = graphics.logicalToPhysicalPoint(this.points[ind]);
        }

        var path, ten = this.tension, pDpoints = new Array(), b1points = new Array(), b2points = new Array();
        
        for (i in points) {
            i = parseInt(i);
            if (i == 0)
                pDpoints[i] = new jxPoint(ten * (points[1].x - points[0].x) / 2, ten * (points[1].y - points[0].y) / 2);
            else if (i == points.length - 1)
                pDpoints[i] = new jxPoint(ten * (points[i].x - points[i - 1].x) / 2, ten * (points[i].y - points[i - 1].y) / 2);
            else
                pDpoints[i] = new jxPoint(ten * (points[i + 1].x - points[i - 1].x) / 2, ten * (points[i + 1].y - points[i - 1].y) / 2);
        }
        for (i in points) {
            i = parseInt(i);
            if (i == points.length - 1) {
                b1points[i] = new jxPoint(points[i].x + pDpoints[i].x / 3, points[i].y + pDpoints[i].y / 3);
                b2points[i] = new jxPoint(points[i].x - pDpoints[i].x / 3, points[i].y - pDpoints[i].y / 3);
            }
            else {
                b1points[i] = new jxPoint(points[i].x + pDpoints[i].x / 3, points[i].y + pDpoints[i].y / 3);
                b2points[i] = new jxPoint(points[i + 1].x - pDpoints[i + 1].x / 3, points[i + 1].y - pDpoints[i + 1].y / 3);
            }
        }

        for (i in points) {
            i = parseInt(i);
            if (i == 0)
                path = 'M' + points[i].x + ',' + points[i].y;
            if (i < points.length - 1)
                path = path + ' C' + Math.round(b1points[i].x) + ',' + Math.round(b1points[i].y) + ',' + Math.round(b2points[i].x) + ',' + Math.round(b2points[i].y) + ',' + Math.round(points[i + 1].x) + ',' + Math.round(points[i + 1].y);
        }

        _svgvmlObj.style.display = 'none';

        if (!jsDraw2DX._isVML) {
            var svg = graphics.getSVG();
            if (_isFirst) {
                svg.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.setAttribute('stroke', 'none');
            else
                this.pen.updateSVG(_svgvmlObj);

            //Apply Brush Setting
            if (!this.brush)
                _svgvmlObj.setAttribute('fill', 'none');
            else {
                this.brush.updateSVG(_svgvmlObj, graphics.getDefs());
            }

            _svgvmlObj.setAttribute('d', path);
        }
        else {
            var vml = graphics.getVML(), vmlFill;
            if (_isFirst) {
                vml.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.Stroked = 'False';
            else
                this.pen.updateVML(_svgvmlObj);

            //Apply Brush Setting
            vmlFill = _svgvmlObj.fill;
            if (!this.brush)
                vmlFill.On = 'false';
            else
                this.brush.updateVML(vmlFill);

            path = path + ' E';

            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.style.width = 1;
            _svgvmlObj.style.height = 1;
            _svgvmlObj.CoordSize = 1 + ' ' + 1;
            _svgvmlObj.Path = path;
        }

        _svgvmlObj.style.display = '';

        if (_graphics && graphics != _graphics) {
            _graphics.removeShape(this);
        }
        _graphics = graphics;
        _graphics.addShape(this);
    }

    //Removes shape from the graphics drawing
    this.remove = remove;
    function remove() {
        if (_graphics) {
            if (!jsDraw2DX._isVML) {
                var svg = _graphics.getSVG();
                svg.removeChild(_svgvmlObj);
            }
            else {
                var vml = _graphics.getVML();
                vml.removeChild(_svgvmlObj);
            }
            _graphics.removeShape(this);
            _graphics = null;
            _isFirst = true;
        }
    }

    //Show the already drawn shape
    this.show = show;
    function show() {
        _svgvmlObj.style.display = '';
    }

    //Hide the already drawn shape
    this.hide = hide;
    function hide() {
        _svgvmlObj.style.display = 'none';
    }
}

//Class to hold information and draw closed curve shape
function jxClosedCurve(points, pen, brush, tension) {

    //Public Properties
    this.points = points;
    this.pen = null;
    this.brush = null;
    this.tension = 1;

    //Private member variables
    var _svgvmlObj, _isFirst = true;
    var _graphics;

    //Object construction
    var _svgvmlObj = null;
    if (pen)
        this.pen = pen;
    if (brush)
        this.brush = brush;
    if (tension != null)
        this.tension = tension;

    if (!jsDraw2DX._isVML)
        _svgvmlObj = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    else
        _svgvmlObj = document.createElement('v:shape');

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxClosedCurve';
    }

    //Events Handling Ability
    this.addEventListener = addEventListener;
    function addEventListener(eventName, handler) {
        if (_svgvmlObj.addEventListener)
            _svgvmlObj.addEventListener(eventName, handlerWrapper, false);
        else if (_svgvmlObj.attachEvent)
            _svgvmlObj.attachEvent('on' + eventName, handlerWrapper);

        var currentObj = this;    
        function handlerWrapper(evt) {
            handler(evt, currentObj);
        }    
    }
    
    //Draw closed curve shape on the jxGraphics 
    this.draw = draw;
    function draw(graphics) {
        var points = new Array();
        for (ind in this.points) {
            points[ind] = graphics.logicalToPhysicalPoint(this.points[ind]);
        }

        var path, n=points.length - 1, ten = this.tension, pDpoints = new Array(), b1points = new Array(), b2points = new Array();

        for (i in points) {
            i = parseInt(i);
            if (i == 0)
                pDpoints[i] = new jxPoint(ten * (points[1].x - points[n].x) / 2, ten * (points[1].y - points[n].y) / 2);
            else if (i == points.length - 1)
                pDpoints[i] = new jxPoint(ten * (points[0].x - points[i - 1].x) / 2, ten * (points[0].y - points[i - 1].y) / 2);
            else
                pDpoints[i] = new jxPoint(ten * (points[i + 1].x - points[i - 1].x) / 2, ten * (points[i + 1].y - points[i - 1].y) / 2);
        }
        for (i in points) {
            i = parseInt(i);
            if (i == points.length - 1) {
                b1points[i] = new jxPoint(points[i].x + pDpoints[i].x / 3, points[i].y + pDpoints[i].y / 3);
                b2points[i] = new jxPoint(points[0].x - pDpoints[0].x / 3, points[0].y - pDpoints[0].y / 3);
            }
            else {
                b1points[i] = new jxPoint(points[i].x + pDpoints[i].x / 3, points[i].y + pDpoints[i].y / 3);
                b2points[i] = new jxPoint(points[i + 1].x - pDpoints[i + 1].x / 3, points[i + 1].y - pDpoints[i + 1].y / 3);
            }
        }

        for (i in points) {
            i = parseInt(i);
            if (i == 0)
                path = 'M' + points[i].x + ',' + points[i].y;
            if (i < points.length - 1)
                path = path + ' C' + Math.round(b1points[i].x) + ',' + Math.round(b1points[i].y) + ',' + Math.round(b2points[i].x) + ',' + Math.round(b2points[i].y) + ',' + Math.round(points[i + 1].x) + ',' + Math.round(points[i + 1].y);
            if (i == points.length - 1)
                path = path + ' C' + Math.round(b1points[i].x) + ',' + Math.round(b1points[i].y) + ',' + Math.round(b2points[i].x) + ',' + Math.round(b2points[i].y) + ',' + Math.round(points[0].x) + ',' + Math.round(points[0].y);    
        }

        _svgvmlObj.style.display = 'none';

        if (!jsDraw2DX._isVML) {
            var svg = graphics.getSVG();
            if (_isFirst) {
                svg.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.setAttribute('stroke', 'none');
            else
                this.pen.updateSVG(_svgvmlObj);

            //Apply Brush Setting
            if (!this.brush)
                _svgvmlObj.setAttribute('fill', 'none');
            else {
                this.brush.updateSVG(_svgvmlObj, graphics.getDefs());
            }

            _svgvmlObj.setAttribute('d', path);
        }
        else {
            var vml = graphics.getVML(), vmlFill;
            if (_isFirst) {
                vml.appendChild(_svgvmlObj);
                _isFirst = false;
            }
            path = path + ' E';

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.Stroked = 'False';
            else
                this.pen.updateVML(_svgvmlObj);

            //Apply Brush Setting
            vmlFill = _svgvmlObj.fill;
            if (!this.brush)
                vmlFill.On = 'false';
            else
                this.brush.updateVML(vmlFill);

            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.style.width = 1;
            _svgvmlObj.style.height = 1;
            _svgvmlObj.CoordSize = 1 + ' ' + 1;
            _svgvmlObj.Path = path;
        }

        _svgvmlObj.style.display = '';

        if (_graphics && graphics != _graphics) {
            _graphics.removeShape(this);
        }
        _graphics = graphics;
        _graphics.addShape(this);
    }

    //Removes shape from the graphics drawing
    this.remove = remove;
    function remove() {
        if (_graphics) {
            if (!jsDraw2DX._isVML) {
                var svg = _graphics.getSVG();
                svg.removeChild(_svgvmlObj);
            }
            else {
                var vml = _graphics.getVML();
                vml.removeChild(_svgvmlObj);
            }
            _graphics.removeShape(this);
            _graphics = null;
            _isFirst = true;
        }
    }

    //Show the already drawn shape
    this.show = show;
    function show() {
        _svgvmlObj.style.display = '';
    }

    //Hide the already drawn shape
    this.hide = hide;
    function hide() {
        _svgvmlObj.style.display = 'none';
    }
}

//Class to hold information and draw bezier shape
function jxBezier(points, pen, brush) {

    //Public Properties
    this.points = points;
    this.pen = null;
    this.brush = null;

    //Private member variables
    var _svgvmlObj, _isFirst = true;
    var _graphics;

    //Object construction
    if (pen)
        this.pen = pen;
    if (brush)
        this.brush = brush;

    if (!jsDraw2DX._isVML)
        _svgvmlObj = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    else
        _svgvmlObj = document.createElement('v:shape');

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxBezier';
    }
    
    //Events Handling Ability
    this.addEventListener = addEventListener;
    function addEventListener(eventName, handler) {
        if (_svgvmlObj.addEventListener)
            _svgvmlObj.addEventListener(eventName, handlerWrapper, false);
        else if (_svgvmlObj.attachEvent)
            _svgvmlObj.attachEvent('on' + eventName, handlerWrapper);

        var currentObj = this;    
        function handlerWrapper(evt) {
            handler(evt, currentObj);
        }    
    }

    //Draw bezier shape on the jxGraphics 
    this.draw = draw;
    function draw(graphics) {
        var points = new Array();
        for (ind in this.points) {
            points[ind] = graphics.logicalToPhysicalPoint(this.points[ind]);
        }
           
        var path;
        if (points.length > 4) {
            var pDpoints = new Array();
            var b1points = new Array();
            var b2points = new Array();

            //Calculate bezier points
            var res_points = new Array();
            var n = points.length - 1;
            var bx, by, i, ic, t, tstep = 10 * Math.min(1 / Math.abs(points[n].x - points[0].x), 1 / Math.abs(points[n].y - points[0].y));
            ic = 0;
            for (t = 0; t < 1; t += tstep) {
                x = 0; y = 0;
                for (i = 0; i <= n; i++) {
                    bx = Math.pow(t, i) * Math.pow((1 - t), n - i) * points[i].x;
                    if (i != 0 || i != n) {
                        bx = bx * jsDraw2DX.fact(n) / jsDraw2DX.fact(i) / jsDraw2DX.fact(n - i);
                    }
                    x = x + bx;

                    by = Math.pow(t, i) * Math.pow((1 - t), n - i) * points[i].y;
                    if (i != 0 || i != n) {
                        by = by * jsDraw2DX.fact(n) / jsDraw2DX.fact(i) / jsDraw2DX.fact(n - i);
                    }
                    y = y + by;
                }
                res_points[ic] = new jxPoint(x, y);
                ic++;
            }
            res_points[ic] = new jxPoint(points[n].x, points[n].y);
            points = res_points;
            //result points curve
            tension = 1;
            for (i in points) {
                i = parseInt(i);
                if (i == 0)
                    pDpoints[i] = new jxPoint(tension * (points[1].x - points[0].x) / 2, tension * (points[1].y - points[0].y) / 2);
                else if (i == points.length - 1)
                    pDpoints[i] = new jxPoint(tension * (points[i].x - points[i - 1].x) / 2, tension * (points[i].y - points[i - 1].y) / 2);
                else
                    pDpoints[i] = new jxPoint(tension * (points[i + 1].x - points[i - 1].x) / 2, tension * (points[i + 1].y - points[i - 1].y) / 2);
            }
            for (i in points) {
                i = parseInt(i);
                if (i == 0) {
                    b1points[i] = new jxPoint(points[0].x + pDpoints[0].x / 3, points[0].y + pDpoints[0].y / 3);
                    b2points[i] = new jxPoint(points[1].x - pDpoints[1].x / 3, points[1].y - pDpoints[1].y / 3);
                }
                else if (i == points.length - 1) {
                    b1points[i] = new jxPoint(points[i].x + pDpoints[i].x / 3, points[i].y + pDpoints[i].y / 3);
                    b2points[i] = new jxPoint(points[i].x - pDpoints[i].x / 3, points[i].y - pDpoints[i].y / 3);
                }
                else {
                    b1points[i] = new jxPoint(points[i].x + pDpoints[i].x / 3, points[i].y + pDpoints[i].y / 3);
                    b2points[i] = new jxPoint(points[i + 1].x - pDpoints[i + 1].x / 3, points[i + 1].y - pDpoints[i + 1].y / 3);
                }
            }

            for (i in points) {
                i = parseInt(i);
                if (i == 0)
                    path = 'M' + points[i].x + ',' + points[i].y;
                if (i < points.length - 1)
                    path = path + ' C' + Math.round(b1points[i].x) + ',' + Math.round(b1points[i].y) + ',' + Math.round(b2points[i].x) + ',' + Math.round(b2points[i].y) + ',' + Math.round(points[i + 1].x) + ',' + Math.round(points[i + 1].y);
            }
        }
        else {
            if (points.length == 4) {
                path = ' M' + points[0].x + ',' + points[0].y + ' C' + points[1].x + ',' + points[1].y + ' ' + points[2].x + ',' + points[2].y + ' ' + points[3].x + ',' + points[3].y;
            }
            else if (points.length == 3) {
                if (!jsDraw2DX._isVML) {
                    path = ' M' + points[0].x + ',' + points[0].y + ' Q' + points[1].x + ',' + points[1].y + ' ' + points[2].x + ',' + points[2].y;
                }
                else {
                    //Since QB command of VML does not work, converting one contol point to two
                    var c1point = new jxPoint(2 / 3 * points[1].x + 1 / 3 * points[0].x, 2 / 3 * points[1].y + 1 / 3 * points[0].y);
                    var c2point = new jxPoint(2 / 3 * points[1].x + 1 / 3 * points[2].x, 2 / 3 * points[1].y + 1 / 3 * points[2].y);
                    path = ' M' + points[0].x + ',' + points[0].y + ' C' + Math.round(c1point.x) + ',' + Math.round(c1point.y) + ' ' + Math.round(c2point.x) + ',' + Math.round(c2point.y) + ' ' + points[2].x + ',' + points[2].y;
                }
            }
        }

        _svgvmlObj.style.display = 'none';

        if (!jsDraw2DX._isVML) {
            var svg = graphics.getSVG();
            if (_isFirst) {
                svg.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.setAttribute('stroke', 'none');
            else
                this.pen.updateSVG(_svgvmlObj);

            //Apply Brush Setting
            if (!this.brush)
                _svgvmlObj.setAttribute('fill', 'none');
            else {
                this.brush.updateSVG(_svgvmlObj, graphics.getDefs());
            }

            _svgvmlObj.setAttribute('d', path);
        }
        else {
            var vml = graphics.getVML(), vmlFill;
            if (_isFirst) {
                vml.appendChild(_svgvmlObj);
                _isFirst = false;
            }
            path = path + ' E'

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.Stroked = 'False';
            else
                this.pen.updateVML(_svgvmlObj);

            //Apply Brush Setting
            vmlFill = _svgvmlObj.fill;
            if (!this.brush)
                vmlFill.On = 'false';
            else
                this.brush.updateVML(vmlFill);

            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.style.width = 1;
            _svgvmlObj.style.height = 1;
            _svgvmlObj.CoordSize = 1 + ' ' + 1;
            _svgvmlObj.Path = path;
        }

        _svgvmlObj.style.display = '';

        if (_graphics && graphics != _graphics) {
            _graphics.removeShape(this);
        }
        _graphics = graphics;
        _graphics.addShape(this);
    }

    //Removes shape from the graphics drawing
    this.remove = remove;
    function remove() {
        if (_graphics) {
            if (!jsDraw2DX._isVML) {
                var svg = _graphics.getSVG();
                svg.removeChild(_svgvmlObj);
            }
            else {
                var vml = _graphics.getVML();
                vml.removeChild(_svgvmlObj);
            }
            _graphics.removeShape(this);
            _graphics = null;
            _isFirst = true;
        }
    }

    //Show the already drawn shape
    this.show = show;
    function show() {
        _svgvmlObj.style.display = '';
    }

    //Hide the already drawn shape
    this.hide = hide;
    function hide() {
        _svgvmlObj.style.display = 'none';
    }
}

//Class to hold information and draw function graph shape
function jxFunctionGraph(fn, xMin, xMax, pen, brush) {

    //Public Properties
    this.fn = fn;
    this.xMin = xMin;
    this.xMax = xMax;
    this.pen = null;
    this.brush = null;

    //Private member variables
    var _svgvmlObj, _isFirst = true;
    var _graphics;

    //Object construction
    if (pen)
        this.pen = pen;
    if (brush)
        this.brush = brush;

    if (!jsDraw2DX._isVML)
        _svgvmlObj = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    else
        _svgvmlObj = document.createElement('v:shape');

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxFunctionGraph';
    }

    //Events Handling Ability
    this.addEventListener = addEventListener;
    function addEventListener(eventName, handler) {
        if (_svgvmlObj.addEventListener)
            _svgvmlObj.addEventListener(eventName, handlerWrapper, false);
        else if (_svgvmlObj.attachEvent)
            _svgvmlObj.attachEvent('on' + eventName, handlerWrapper);

        var currentObj = this;    
        function handlerWrapper(evt) {
            handler(evt, currentObj);
        }    
    }

    //Validate the function equation
    this.validate = validate;
    function validate(fn) {
        fn = fn.replace(/x/g, 1);
        with (Math) {
            try {
                eval(fn);
                return true;
            }
            catch (ex) {
                return false;
            }
        }
    }

    //Draw function graph shape on the jxGraphics 
    this.draw = draw;
    function draw(graphics) {
        var points = new Array();
        var path, pDpoints;
        var pDpoints = new Array();
        var b1points = new Array();
        var b2points = new Array();

        //Validate the function
        if (!this.validate(fn))
            return;

        //Calculate function graph points
        var x,y,ic = 0;
        for (x = xMin; x < xMax; x++) {
            with (Math) {
                y = eval(fn.replace(/x/g, x));
            }
            points[ic] = graphics.logicalToPhysicalPoint(new jxPoint(x, y));
            ic++;
        }
        with (Math) {
            y = eval(fn.replace(/x/g, xMax));
        }
        points[ic] = graphics.logicalToPhysicalPoint(new jxPoint(x, y));
        ic++;
        
        //result points curve
        tension = 1;
        for (i in points) {
            i = parseInt(i);
            if (i == 0)
                pDpoints[i] = new jxPoint(tension * (points[1].x - points[0].x) / 2, tension * (points[1].y - points[0].y) / 2);
            else if (i == points.length - 1)
                pDpoints[i] = new jxPoint(tension * (points[i].x - points[i - 1].x) / 2, tension * (points[i].y - points[i - 1].y) / 2);
            else
                pDpoints[i] = new jxPoint(tension * (points[i + 1].x - points[i - 1].x) / 2, tension * (points[i + 1].y - points[i - 1].y) / 2);
        }
        for (i in points) {
            i = parseInt(i);
            if (i == 0) {
                b1points[i] = new jxPoint(points[0].x + pDpoints[0].x / 3, points[0].y + pDpoints[0].y / 3);
                b2points[i] = new jxPoint(points[1].x - pDpoints[1].x / 3, points[1].y - pDpoints[1].y / 3);
            }
            else if (i == points.length - 1) {
                b1points[i] = new jxPoint(points[i].x + pDpoints[i].x / 3, points[i].y + pDpoints[i].y / 3);
                b2points[i] = new jxPoint(points[i].x - pDpoints[i].x / 3, points[i].y - pDpoints[i].y / 3);
            }
            else {
                b1points[i] = new jxPoint(points[i].x + pDpoints[i].x / 3, points[i].y + pDpoints[i].y / 3);
                b2points[i] = new jxPoint(points[i + 1].x - pDpoints[i + 1].x / 3, points[i + 1].y - pDpoints[i + 1].y / 3);
            }
        }

        for (i in points) {
            i = parseInt(i);
            if (i == 0)
                path = 'M' + points[i].x + ',' + points[i].y;
            if (i < points.length - 1)
                path = path + ' C' + Math.round(b1points[i].x) + ',' + Math.round(b1points[i].y) + ',' + Math.round(b2points[i].x) + ',' + Math.round(b2points[i].y) + ',' + Math.round(points[i + 1].x) + ',' + Math.round(points[i + 1].y);
        }

        _svgvmlObj.style.display = 'none';

        if (!jsDraw2DX._isVML) {
            var svg = graphics.getSVG();
            if (_isFirst) {
                svg.appendChild(_svgvmlObj);
                _isFirst = false;
            }
            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.setAttribute('stroke', 'none');
            else
                this.pen.updateSVG(_svgvmlObj);

            //Apply Brush Settings
            if (!this.brush)
                _svgvmlObj.setAttribute('fill', 'none');
            else {
                this.brush.updateSVG(_svgvmlObj, graphics.getDefs());
            }

            _svgvmlObj.setAttribute('d', path);
        }
        else {
            var vml = graphics.getVML(), vmlFill;
            if (_isFirst) {
                vml.appendChild(_svgvmlObj);
                _isFirst = false;
            }

            path = path + ' E'

            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.Stroked = 'False';
            else
                this.pen.updateVML(_svgvmlObj);

            //Apply Brush Setting
            vmlFill = _svgvmlObj.fill;
            if (!this.brush)
                vmlFill.On = 'false';
            else
                this.brush.updateVML(vmlFill);

            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.style.width = 1;
            _svgvmlObj.style.height = 1;
            _svgvmlObj.CoordSize = 1 + ' ' + 1;
            _svgvmlObj.Path = path;
        }

        _svgvmlObj.style.display = '';

        if (_graphics && graphics != _graphics) {
            _graphics.removeShape(this);
        }
        _graphics = graphics;
        _graphics.addShape(this);
    }

    //Removes shape from the graphics drawing
    this.remove = remove;
    function remove() {
        if (_graphics) {
            if (!jsDraw2DX._isVML) {
                var svg = _graphics.getSVG();
                svg.removeChild(_svgvmlObj);
            }
            else {
                var vml = _graphics.getVML();
                vml.removeChild(_svgvmlObj);
            }
            _graphics.removeShape(this);
            _graphics = null;
            _isFirst = true;
        }
    }

    //Show the already drawn shape
    this.show = show;
    function show() {
        _svgvmlObj.style.display = '';
    }

    //Hide the already drawn shape
    this.hide = hide;
    function hide() {
        _svgvmlObj.style.display = 'none';
    }
}

//Class to hold information and draw text string
function jxText(point, text, font, pen, brush, angle) {
    //Public Properties
    this.point = point;
    this.text = text;
    this.font = null;
    this.pen = null;
    this.brush =  null;
    this.angle = 0;

    //Private member variables
    var _svgvmlObj, _isFirst = true;
    var _graphics;

    //Object construction
    if (font)
        this.font = font;
    if (pen)
        this.pen = pen;
    if (brush)
        this.brush = brush;
    if (angle)
        this.angle = angle;

    if (!jsDraw2DX._isVML)
        _svgvmlObj = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    else
        _svgvmlObj = document.createElement('v:shape');

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxText';
    }

    //Events Handling Ability
    this.addEventListener = addEventListener;
    function addEventListener(eventName, handler) {
        if (_svgvmlObj.addEventListener)
            _svgvmlObj.addEventListener(eventName, handlerWrapper, false);
        else if (_svgvmlObj.attachEvent)
            _svgvmlObj.attachEvent('on' + eventName, handlerWrapper);

        var currentObj = this;    
        function handlerWrapper(evt) {
            handler(evt, currentObj);
        }    
    }

    //Draw text string on the jxGraphics 
    this.draw = draw;
    function draw(graphics) {
        var point;
        point = graphics.logicalToPhysicalPoint(this.point);

        var x, y;
        x = point.x;
        y = point.y;

        _svgvmlObj.style.display = 'none';

        if (!jsDraw2DX._isVML) {
            var svg = graphics.getSVG();
            if (_isFirst) {
                svg.appendChild(_svgvmlObj);
                _isFirst = false;
            }
            //Apply Pen Settings
            if (!this.pen)
                _svgvmlObj.setAttribute('stroke', 'none');
            else
                this.pen.updateSVG(_svgvmlObj);

            //Apply Brush Settings
            if (!this.brush)
                _svgvmlObj.setAttribute('fill', 'none');
            else {
                this.brush.updateSVG(_svgvmlObj, graphics.getDefs());
            }

            //Apply Font Settings
            if (this.font)
                this.font.updateSVG(_svgvmlObj);
            else
                jxFont.updateSVG(_svgvmlObj);
            
            _svgvmlObj.setAttribute('x', x);
            _svgvmlObj.setAttribute('y', y);
            _svgvmlObj.setAttribute('transform', 'rotate(' + this.angle + ' ' + x + ',' + y + ')');
            _svgvmlObj.textContent = this.text;
        }
        else {
            var vml = graphics.getVML(), vmlFill, vmlPath, vmlTextPath;
            if (_isFirst) {
                vmlTextPath = document.createElement('v:textpath');
                vmlTextPath.On = 'True';
                vmlTextPath.style['v-text-align'] = 'left';
                _svgvmlObj.appendChild(vmlTextPath); 
                vml.appendChild(_svgvmlObj);
                _isFirst = false;
            }
            vmlFill = _svgvmlObj.fill;
            vmlTextPath = _svgvmlObj.firstChild; 
            
            //Apply Pen Setting
            if (!this.pen)
                _svgvmlObj.Stroked = 'False';
            else
                this.pen.updateVML(_svgvmlObj);

            //Apply Brush Setting
            vmlFill = _svgvmlObj.fill;
            if (!this.brush)
                vmlFill.On = 'false';
            else
                this.brush.updateVML(vmlFill);


            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.style.height = 1;
            _svgvmlObj.CoordSize = 1 + ' ' + 1;
            vmlPath = _svgvmlObj.Path;
            vmlPath.TextPathOk = 'true'; 
            vmlPath.v = 'M' + x + ',' + y + ' L' + (x + 100) + ',' + y + ' E';

            vmlTextPath.String = this.text;

            //Apply Font Settings
            if (this.font)
                this.font.updateVML(vmlTextPath);
            else
                jxFont.updateVML(vmlTextPath);


            _svgvmlObj.style.display = '';

            var x1, y1, r, a;
            r = (_svgvmlObj.clientHeight / 2 * 0.8);
            a = this.angle;
            x = Math.round(x + r * Math.sin(a * Math.PI / 180));
            y = Math.round(y - r * Math.cos(a * Math.PI / 180));
            x1 = Math.round(x + Math.cos(a * Math.PI / 180) * 100);
            y1 = Math.round(y + Math.sin(a * Math.PI / 180) * 100);
            _svgvmlObj.Path = 'M' + x + ',' + y + ' L' + x1 + ',' + y1 + ' E';
            _svgvmlObj.style.width = 1;
        }

        _svgvmlObj.style.display = '';

        if (_graphics && graphics != _graphics) {
            _graphics.removeShape(this);
        }
        _graphics = graphics;
        _graphics.addShape(this);
    }

    //Removes shape from the graphics drawing
    this.remove = remove;
    function remove() {
        if (_graphics) {
            if (!jsDraw2DX._isVML) {
                var svg = _graphics.getSVG();
                svg.removeChild(_svgvmlObj);
            }
            else {
                var vml = _graphics.getVML();
                vml.removeChild(_svgvmlObj);
            }
            _graphics.removeShape(this);
            _graphics = null;
            _isFirst = true;
        }
    }

    //Show the already drawn shape
    this.show = show;
    function show() {
        _svgvmlObj.style.display = '';
    }

    //Hide the already drawn shape
    this.hide = hide;
    function hide() {
        _svgvmlObj.style.display = 'none';
    }
}

//Class to hold information and draw image
function jxImage(point, url, width, height, angle) {
    //Private memeber variables
    this.point = point;
    this.url = url;
    this.width = width;
    this.height = height;
    this.angle = 0;

    //Private member variables
    var _svgvmlObj, _isFirst = true;
    var _graphics;
    
    //Object construction
    if (angle)
        this.angle = angle;

    if (!jsDraw2DX._isVML)
        _svgvmlObj = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    else
        _svgvmlObj = document.createElement('v:image');

    //Public Methods
    this.getType = getType;
    function getType() {
        return 'jxImage';
    }

    //Events Handling Ability
    this.addEventListener = addEventListener;
    function addEventListener(eventName, handler) {
        if (_svgvmlObj.addEventListener)
            _svgvmlObj.addEventListener(eventName, handlerWrapper, false);
        else if (_svgvmlObj.attachEvent)
            _svgvmlObj.attachEvent('on' + eventName, handlerWrapper);

        var currentObj = this;
        function handlerWrapper(evt) {
            handler(evt, currentObj);
        }    
    }

    //Draw image on the jxGraphics 
    this.draw = draw;
    function draw(graphics) {
        var point, scale;
        point = graphics.logicalToPhysicalPoint(this.point);
        scale = graphics.scale;
        var x, y;
        x = point.x;
        y = point.y;

        _svgvmlObj.style.display = 'none';

        if (!jsDraw2DX._isVML) {
            var svg = graphics.getSVG();
            if (_isFirst) {
                svg.appendChild(_svgvmlObj);
                _isFirst = false;
            }
            _svgvmlObj.setAttribute('x', x);
            _svgvmlObj.setAttribute('y', y);
            _svgvmlObj.setAttribute('height', scale * this.height);
            _svgvmlObj.setAttribute('width', scale * this.width);
            _svgvmlObj.setAttribute('preserveAspectRatio', 'none');
            _svgvmlObj.setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.url);
            _svgvmlObj.setAttribute('transform', 'rotate(' + this.angle + ' ' + x + ',' + y + ')');
        }
        else {
            with (Math) {
                var x1, y1, ang = this.angle, a = this.angle * PI / 180, w, h, m1, m2, m3, m4;
                w = scale * this.width;
                h = scale * this.height;
                x1 = x; y1 = y;
                if (abs(ang) > 360)
                    ang = ang % 360;
                if (ang < 0)
                    ang = 360 + ang;
                //Rotation point    
                if (ang >= 0 && ang < 90) {
                    y1 = y;
                    x1 = x - (h * sin(a));
                }
                else if (ang >= 90 && ang < 180) {
                    y1 = y - h * sin(a - PI / 2);
                    x1 = x - (w * sin(a - PI / 2) + h * cos(a - PI / 2));
                }
                else if (ang >= 180 && ang < 270) {
                    y1 = y - (w * sin(a - PI) + h * cos(a - PI));
                    x1 = x - w * cos(a - PI);
                }
                else if (ang >= 270 && ang <=360) {
                    x1 = x;
                    y1 = y - w * cos(a - 1.5 * PI);
                }
                
                //Matrix for rotation            
                m1 = cos(a);
                m2 = -sin(a);
                m3 = sin(a);
                m4 = cos(a);
            }
            var vml = graphics.getVML(),vmlFill;
            if (_isFirst) {
                vml.appendChild(_svgvmlObj);
                _isFirst = false;
            }
            _svgvmlObj.style.width = w;
            _svgvmlObj.style.height = h;
            _svgvmlObj.style.position = 'absolute';
            _svgvmlObj.style.top = y1;
            _svgvmlObj.style.left = x1;
            _svgvmlObj.style.filter = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand',M11=" + m1 + ',M12=' + m2 + ',M21=' + m3 + ',M22=' + m4 + ") filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + url + "', sizingMethod='scale');";
        }

        _svgvmlObj.style.display = '';

        if (_graphics && graphics != _graphics) {
            _graphics.removeShape(this);
        }
        _graphics = graphics;
        _graphics.addShape(this);
    }

    //Removes shape from the graphics drawing
    this.remove = remove;
    function remove() {
        if (_graphics) {
            if (!jsDraw2DX._isVML) {
                var svg = _graphics.getSVG();
                svg.removeChild(_svgvmlObj);
            }
            else {
                var vml = _graphics.getVML();
                vml.removeChild(_svgvmlObj);
            }
            _graphics.removeShape(this);
            _graphics = null;
            _isFirst = true;
        }
    }

    //Show the already drawn shape
    this.show = show;
    function show() {
        _svgvmlObj.style.display = '';
    }

    //Hide the already drawn shape
    this.hide = hide;
    function hide() {
        _svgvmlObj.style.display = 'none';
    }
}
