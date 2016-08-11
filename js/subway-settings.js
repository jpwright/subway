// Game version
var GAME_VERSION = 0.11;

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
var ENC_LANDMARKS_ONLY_LABEL = ['Ellis Island', 'Liberty Island', 'Governors Island', 'Grand Army Plaza', 'Bartel Pritchard Square', 'Mets-Willets Point'];
ENC_LANDMARKS_NEVER_LABEL = ['JFK Airport', 'LaGuardia Airport']; // These are covered by the neighborhood name

var TRANSFER_BUTTON_DEFAULT = "Start Transfer"
var TRANSFER_BUTTON_START = "Click a station"
var TRANSFER_BUTTON_END = "Click another station"

// Instructions for calculate_ridership function
var RIDERSHIP_ADD = 0;
var RIDERSHIP_NOCHANGE = 1;
var RIDERSHIP_DELETE = 2;

// Employment modifiers
// Data from NYCEDC
var PERCENTAGE_EMPLOYMENT_TRIPS = 0.20;
var EMPLOYMENT_BY_BOROUGH_MODIFIERS = {"Staten Island": 1.0, "Queens": 5.551, "Brooklyn": 5.606, "Bronx": 2.476, "Manhattan": 22.189}

// Transit modifiers
var TRANSIT_MODIFIERS = {
    "John F. Kennedy International Airport": 35000,
    "LaGuardia Airport": 25000
}

// Custom lines
var CUSTOM_LINE_FIRST_INDEX = 97;