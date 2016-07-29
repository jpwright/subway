// Drawing parameters
var CURVE_THRESHOLD = 0.005; // Max overshoot from curve momentum.
var MARKER_RADIUS_DEFAULT = 6.0;
var MARKER_RADIUS_LARGE = 8.0;
var MARKER_RADIUS_HUGE = 12.0;
var STATION_MARKER_LARGE_THRESHOLD = 3; // Number of groups needed to force a large station marker
var STATION_MARKER_HUGE_THRESHOLD = 4;
var STATION_MARKER_SCALE_THRESHOLD = 6;
var TRACK_WIDTH = 6.0;
var TRACK_OFFSET = 6.0;
var TRANSFER_WIDTH = 3.0;

var USE_CURVED_TRACKS = true;
var CURVE_OVERSHOOT = 0.5;
var BEZIER_SHARPNESS = 0.6;

var DEBUG_MODE = false;

// Map rendering parameters
var SHARED_STRETCH_THRESHOLD = 8; // Max number of "local" stations in a shared stretch.

// Voxel data paramaters
var GEO_RANGE_LAT = 0.8;
var GEO_RANGE_LNG = 1.0;

var LAT_MIN = 40.713 - GEO_RANGE_LAT/2.0;
var LAT_MAX = 40.713 + GEO_RANGE_LAT/2.0;
var LNG_MIN = -74.006 - GEO_RANGE_LNG/2.0;
var LNG_MAX = -74.006 + GEO_RANGE_LNG/2.0;

var VOXELS_DIM = 500;
var VOXELS_RES_LAT = GEO_RANGE_LAT / VOXELS_DIM;
var VOXELS_RES_LNG = GEO_RANGE_LNG / VOXELS_DIM;
var VOXELS_TOTAL = VOXELS_DIM * VOXELS_DIM;

// Geocoding parameters
var ENC_NEIGHBORHOODS_ALWAYS_LABEL = ['Astoria'];
var ENC_NEIGHBORHOODS_ONLY_LABEL = ['Roosevelt Island', 'Governors Island', 'Randall\'s Island', 'North Brother Island', 'South Brother Island', 'Rikers Island', 'John F. Kennedy International Airport', 'Floyd Bennett Field', 'LaGuardia Airport'];
var ENC_LANDMARKS_ONLY_LABEL = ['Ellis Island', 'Liberty Island', 'Grand Army Plaza', 'Bartel Pritchard Square', 'Mets-Willets Point'];

var TRANSFER_BUTTON_DEFAULT = "Start Transfer"
var TRANSFER_BUTTON_START = "Click a station"
var TRANSFER_BUTTON_END = "Click another station"