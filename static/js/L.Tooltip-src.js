L.Tooltip = L.Layer.extend({

  options: {
    pane: 'popupPane',
    nonBubblingEvents: ['mouseover', 'mousemove'],
    position: 'left',
    className: 'tooltip',
    arrowClass: 'tooltip-arrow',
    contentClass: 'tooltip-inner',
    subtextClass: 'tooltip-subtext',
    showClass: 'in',
    noWrap: false,
    wrapScreen: true,
    offset: [10, 5]
  },

  statics: {

    /**
     * @enum {String}
     */
    POSITIONS: {
      TOP:    'top',
      LEFT:   'left',
      BOTTOM: 'bottom',
      RIGHT:  'right'
    }
  },


  /**
   * @class L.Tooltip
   * @constructor
   * @param  {Object} options
   * @param  {*=}     source
   */
  initialize: function(options, source) {

    /**
     * @type {Element}
     */
    this._container   = null;


    /**
     * @type {Element}
     */
    this._arrow       = null;


    /**
     * @type {Element}
     */
    this._contentNode = null;


    /**
     * @type {Element}
     */
    this._subtext     = null;


    L.Util.setOptions(this, options);


    /**
     * @type {L.Layer}
     */
    this._source      = source;
  },


  /**
   * Creates elements
   */
  _initLayout: function() {
    var options = this.options;
    if (options.noWrap) {
      options.className += ' nowrap';
    }
    this._container   = L.DomUtil.create('div',
                          options.className + ' ' + options.position +
                          ' ' + options.showClass);
    this._arrow       = L.DomUtil.create('div',
                          options.arrowClass, this._container);
    this._contentNode = L.DomUtil.create('div',
                          options.contentClass, this._container);
    this._subtext     = L.DomUtil.create('div',
                          options.subtextClass, this._container);
  },


  /**
   * @param  {L.Map} map
   * @return {L.Tooltip}
   */
  onAdd: function(map) {
    this._map = map;
    this._initLayout();
    if (this.options.content) {
      this.setContent(this.options.content);
    }
    this.getPane().appendChild(this._container);
    return this;
  },


  /**
   * @return {L.Tooltip}
   */
  show: function() {
    L.DomUtil.removeClass(this._container, "tooltip-hide");
    return this;
  },


  /**
   * @return {L.Tooltip}
   */
  hide: function() {
    L.DomUtil.addClass(this._container, "tooltip-hide");
    return this;
  },


  /**
   * @param  {L.Map} map
   * @return {L.Tooltip}
   */
  onRemove: function(map) {
    L.Util.cancelAnimFrame(this._updateTimer);
    this.getPane().removeChild(this._container);
    this._map = null;
    return this;
  },


  /**
   * @param {String} content
   * @return {L.LatLng}
   */
  setContent: function(content) {
    this._contentNode.innerHTML = content;
    this.updatePosition();
    return this;
  },


  /**
   * @param {String} text
   * @return {L.Tooltip}
   */
  setSubtext: function(text) {
    this._subtext.innerHTML = text;
    this.updatePosition();
    return this;
  },


  /**
   * @param {L.LatLng} latlng
   * @return {L.Tooltip}
   */
  setLatLng: function(latlng) {
    this._latlng = latlng;
    this.updatePosition();
    return this;
  },


  /**
   * @param  {L.Point} point Position
   * @param  {String} position
   */
  _getOffset: function(point, position) {
    var container  = this._container;
    var options    = this.options;
    var width      = container.offsetWidth;
    var height     = container.offsetHeight;
    var POSITIONS  = L.Tooltip.POSITIONS;

    if (this.options.wrapScreen) {
      var mapSize = this._map.getSize();
      point = this._map.layerPointToContainerPoint(point);
      if (point.x + width / 2  > mapSize.x) {
        position = POSITIONS.LEFT;
      }
      if (point.x - width < 0) {
        position = POSITIONS.RIGHT;
      }

      if (point.y - height < 0) {
        position = POSITIONS.BOTTOM;
      }

      if (point.y + height > mapSize.y) {
        position = POSITIONS.TOP;
      }
    }

    this._container.className = (options.className + ' ' + position +
      ' ' + options.showClass);

    var offset = options.offset;
    if (position        === POSITIONS.LEFT) {
      return new L.Point(-width - offset[0], -height / 2)._floor();
    } else if (position === POSITIONS.RIGHT) {
      return new L.Point(0 + offset[0], -height / 2)._floor();
    } else if (position === POSITIONS.TOP) {
      return new L.Point(-width / 2, -height - offset[1])._floor();
    } else if (position === POSITIONS.BOTTOM) {
      return new L.Point(-width / 2, 0 + offset[1])._floor();
    }
  },


  /**
   * @param  {L.Point=} point
   */
  updatePosition: function(point) {
    this._updateTimer = L.Util.requestAnimFrame(function() {
      if (this._map) {
        point = point || this._map.latLngToLayerPoint(this._latlng);
        L.DomUtil.setPosition(this._container, point.add(
          this._getOffset(point, this.options.position)));
      }
    }, this);
  }

});

L.tooltip = function(options, source) {
  return new L.Tooltip(options, source);
};
