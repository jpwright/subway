

var neighborhoods = new L.geoJson();

$.ajax({
    dataType: "json",
    url: "geojson/neighborhoods.geojson",
    success: function(data) {
        $(data.features).each(function(key, data) {
            neighborhoods.addData(data);
        });
    }
}).error(function() {});

var landmarks = new L.geoJson();
//landmarks.addTo(map);

$.ajax({
    dataType: "json",
    url: "geojson/landmarks.geojson",
    success: function(data) {
        $(data.features).each(function(key, data) {
            landmarks.addData(data);
        });
    }
}).error(function() {});

var tracts = new L.geoJson();
var tracts_layers;
var turf_polygons = {};

var tract_centroids = {};
var tract_nearby = {};

var demand = [];
var N_demand_station_links = {};

$.getJSON( "json/demand.json", function( data ) {
    demand = data;
});

var additional_lines_shown = false;
$('#add-lines').click(function(e) {
    if (additional_lines_shown) {
        $("#add-lines").text("Show Additional Lines");
        $(".subway-hidden").hide();
        additional_lines_shown = false;
    } else {
        $("#add-lines").text("Hide Additional Lines");
        $(".subway-hidden").show();
        additional_lines_shown = true;
    }
});

var N_number_of_shuttles = 0;
var N_game_started = false;

function initialize_game_state() {

    if (N_stations != null) {
        // Reset the map
        for (var i = 0; i < N_stations.length; i++) {
            N_stations[i].del();
        }
    }

    if (N_lines != null) {
        for (var j = 0; j < N_lines.length; j++) {
            N_lines[j].generate_draw_map();
        }
        for (j = 0; j < N_lines.length; j++) {
            N_lines[j].draw();
        }
    }

    number_of_shuttles = 1;

    station_id_generator.reset();
    line_id_generator.reset();

    N_stations = [];
    N_lines = [];
    N_transfers = [];

    // NEVER CHANGE THE ORDER OF THESE or you break saved games
    // Only add to the end
    N_lines.push(new Line('A', 'A', 'subway-line', '#0039A6', '#FFFFFF'));
    N_lines.push(new Line('B', 'B', 'subway-line', '#FF6319', '#FFFFFF'));
    N_lines.push(new Line('C', 'C', 'subway-line', '#0039A6', '#FFFFFF'));
    N_lines.push(new Line('D', 'D', 'subway-line', '#FF6319', '#FFFFFF'));
    N_lines.push(new Line('E', 'E', 'subway-line', '#0039A6', '#FFFFFF'));
    N_lines.push(new Line('F', 'F', 'subway-line', '#FF6319', '#FFFFFF'));
    N_lines.push(new Line('G', 'G', 'subway-line', '#6CBE45', '#FFFFFF'));
    N_lines.push(new Line('J', 'J', 'subway-line', '#996633', '#FFFFFF'));
    N_lines.push(new Line('L', 'L', 'subway-line', '#A7A9AC', '#FFFFFF'));
    N_lines.push(new Line('M', 'M', 'subway-line', '#FF6319', '#FFFFFF'));
    N_lines.push(new Line('N', 'N', 'subway-line', '#FCCC0A', '#000000'));
    N_lines.push(new Line('Q', 'Q', 'subway-line', '#FCCC0A', '#000000'));
    N_lines.push(new Line('R', 'R', 'subway-line', '#FCCC0A', '#000000'));
    N_lines.push(new Line('S-1', 'S', 'subway-line', '#808183', '#FFFFFF'));
    N_lines.push(new Line('S-2', 'S', 'subway-line', '#808183', '#FFFFFF'));
    N_lines.push(new Line('S-3', 'S', 'subway-line', '#808183', '#FFFFFF'));
    N_lines.push(new Line('Z', 'Z', 'subway-line', '#996633', '#FFFFFF'));
    N_lines.push(new Line('1', '1', 'subway-line', '#EE352E', '#FFFFFF'));
    N_lines.push(new Line('2', '2', 'subway-line', '#EE352E', '#FFFFFF'));
    N_lines.push(new Line('3', '3', 'subway-line', '#EE352E', '#FFFFFF'));
    N_lines.push(new Line('4', '4', 'subway-line', '#00933C', '#FFFFFF'));
    N_lines.push(new Line('5', '5', 'subway-line', '#00933C', '#FFFFFF'));
    N_lines.push(new Line('6', '6', 'subway-line', '#00933C', '#FFFFFF'));
    N_lines.push(new Line('7', '7', 'subway-line', '#B933AD', '#FFFFFF'));
    N_lines.push(new Line('SIRR', 'SI', 'subway-line', '#0039A6', '#FFFFFF'));
    N_lines.push(new Line('AirTrain JFK', '&#9992;', 'subway-line', '#FFF200', '#000000'));
    N_lines.push(new Line('AirTrain LGA', '&#9992;', 'subway-line', '#FFF200', '#000000'));
    N_lines.push(new Line('T', 'T', 'subway-line', '#00ADD0', '#FFFFFF'));
    N_lines.push(new Line('BQX', 'BQX', 'subway-line-long', '#212121', '#FFFFFF'));
    N_lines.push(new Line('S-4', 'S', 'subway-line', '#808183', '#FFFFFF'));
    N_lines.push(new Line('W', 'W', 'subway-line', '#FCCC0A', '#000000'));
    N_lines.push(new Line('8', '8', 'subway-line', '#00933C', '#FFFFFF'));
    N_lines.push(new Line('9', '9', 'subway-line', '#EE352E', '#FFFFFF'));
    N_lines.push(new Line('10', '10', 'subway-line', '#00933C', '#FFFFFF'));
    N_lines.push(new Line('11', '11', 'subway-line', '#B933AD', '#FFFFFF'));
    N_lines.push(new Line('12', '12', 'subway-line', '#00933C', '#FFFFFF'));
    N_lines.push(new Line('13', '13', 'subway-line', '#EE352E', '#FFFFFF'));
    N_lines.push(new Line('H', 'H', 'subway-line', '#0039A6', '#FFFFFF'));
    N_lines.push(new Line('K', 'K', 'subway-line', '#0039A6', '#FFFFFF'));
    N_lines.push(new Line('V', 'V', 'subway-line', '#FF6319', '#FFFFFF'));
    N_lines.push(new Line('JFK Express', '&#9992;', 'subway-line', '#00ADD0', '#FFFFFF'));
    N_lines.push(new Line('MJ', 'MJ', 'subway-line', '#AB3F57', '#FFFFFF'));
    N_lines.push(new Line('A-Euclid', 'A', 'subway-line', '#0039A6', '#FFFFFF'));
    N_lines.push(new Line('AirTrain JFK-Howard', '&#9992;', 'subway-line', '#FFF200', '#000000'));
    N_lines.push(new Line('AirTrain JFK-Archer', '&#9992;', 'subway-line', '#FFF200', '#000000'));
    N_lines.push(new Line('AirTrain JFK-Connectors', '&#9992;', 'subway-line', '#FFF200', '#000000'));
    N_lines.push(new Line('TriboroRX', 'TriboroRX', 'subway-line-long', '#FCCC0A', '#000000'));

    //Saving space here in case we want to add more defaults later
    for(var i = 0; i < 50; i++) {
        N_lines.push(new Line('N/A', 'N/A', 'subway-line-long', '#808183', '#FFFFFF'));
    }


    find_line_by_name('A-Euclid').branch = true;
    find_line_by_name('AirTrain JFK-Howard').branch = true;
    find_line_by_name('AirTrain JFK-Archer').branch = true;
    find_line_by_name('AirTrain JFK-Connectors').branch = true;


    N_active_line = find_line_by_name('A');

    N_line_groups = [];
    N_line_groups.push(new LineGroup('#0039A6', [find_line_by_name('A').id, find_line_by_name('A-Euclid').id, find_line_by_name('C').id, find_line_by_name('E').id, find_line_by_name('H').id, find_line_by_name('K').id, find_line_by_name('SIRR').id]));
    N_line_groups.push(new LineGroup('#FF6319', [find_line_by_name('B').id, find_line_by_name('D').id, find_line_by_name('F').id, find_line_by_name('M').id, find_line_by_name('V').id]))
    N_line_groups.push(new LineGroup('#6CBE45', [find_line_by_name('G').id]));
    N_line_groups.push(new LineGroup('#996633', [find_line_by_name('J').id, find_line_by_name('Z').id]));
    N_line_groups.push(new LineGroup('#A7A9AC', [find_line_by_name('L').id]));
    N_line_groups.push(new LineGroup('#FCCC0A', [find_line_by_name('N').id, find_line_by_name('Q').id, find_line_by_name('R').id, find_line_by_name('W').id, find_line_by_name('TriboroRX').id]));
    N_line_groups.push(new LineGroup('#808183', [find_line_by_name('S-1').id, find_line_by_name('S-2').id, find_line_by_name('S-3').id, find_line_by_name('S-4').id]));
    N_line_groups.push(new LineGroup('#EE352E', [find_line_by_name('1').id, find_line_by_name('2').id, find_line_by_name('3').id, find_line_by_name('9').id, find_line_by_name('13').id]));
    N_line_groups.push(new LineGroup('#00933C', [find_line_by_name('4').id, find_line_by_name('5').id, find_line_by_name('6').id, find_line_by_name('8').id, find_line_by_name('10').id, find_line_by_name('12').id]));
    N_line_groups.push(new LineGroup('#B933AD', [find_line_by_name('7').id, find_line_by_name('11').id]));
    N_line_groups.push(new LineGroup('#FFF200', [find_line_by_name('AirTrain JFK').id, find_line_by_name('AirTrain JFK-Howard').id, find_line_by_name('AirTrain JFK-Archer').id, find_line_by_name('AirTrain JFK-Connectors').id, find_line_by_name('AirTrain LGA').id]));
    N_line_groups.push(new LineGroup('#00ADD0', [find_line_by_name('T').id, find_line_by_name('JFK Express').id]));
    N_line_groups.push(new LineGroup('#212121', [find_line_by_name('BQX').id]));
    N_line_groups.push(new LineGroup('#AB3F57', [find_line_by_name('MJ').id]));

    N_custom_line_colors = {};

    // Initialize demand matrix
    N_demand_station_links = {};
    N_demand_station_links[0] = {};
    N_demand_station_links[0][0] = [];


}

// Main

initialize_game_state();
var HEADLESS_MODE = true;