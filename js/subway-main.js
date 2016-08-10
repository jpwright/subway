

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

var N_custom_line_shown = false;
$('#custom-line').click(function(e) {
    if (N_custom_line_shown) {
        $('#custom-line-options').hide();
        N_custom_line_shown = false;
    } else {
        $('#custom-line-options').show();
        N_custom_line_shown = true;
        $("#option-section-lines").animate({scrollTop: $('#option-section-lines').prop('scrollHeight')}, 1000);
    }
})

var route_diagram_shown = false;
$("#route-header").click(function(e) {
    if (!route_diagram_shown) {
        $("#route-diagram").show();
        $("#route-triangle").html('<i class="fa fa-caret-down" aria-hidden="true"></i>');
        route_diagram_shown = true;
    } else {
        $("#route-diagram").hide();
        $("#route-triangle").html('<i class="fa fa-caret-right" aria-hidden="true"></i>');
        route_diagram_shown = false;
    }
});

var N_number_of_shuttles = 0;

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

    station_layer.bringToFront();

    number_of_shuttles = 1;

    station_id_generator.reset();
    line_id_generator.reset();

    N_stations = [];
    N_lines = [];
    N_transfers = [];

    // NEVER CHANGE THE ORDER OF THESE or you break saved games
    // Only add to the end
    N_lines.push(new Line('A', 'A', 'subway-line subway-blue', '#0039A6', '#FFFFFF'));
    N_lines.push(new Line('B', 'B', 'subway-line subway-orange', '#FF6319', '#FFFFFF'));
    N_lines.push(new Line('C', 'C', 'subway-line subway-blue', '#0039A6', '#FFFFFF'));
    N_lines.push(new Line('D', 'D', 'subway-line subway-orange', '#FF6319', '#FFFFFF'));
    N_lines.push(new Line('E', 'E', 'subway-line subway-blue', '#0039A6', '#FFFFFF'));
    N_lines.push(new Line('F', 'F', 'subway-line subway-orange', '#FF6319', '#FFFFFF'));
    N_lines.push(new Line('G', 'G', 'subway-line subway-light-green', '#6CBE45', '#FFFFFF'));
    N_lines.push(new Line('J', 'J', 'subway-line subway-brown', '#996633', '#FFFFFF'));
    N_lines.push(new Line('L', 'L', 'subway-line subway-silver', '#A7A9AC', '#FFFFFF'));
    N_lines.push(new Line('M', 'M', 'subway-line subway-orange', '#FF6319', '#FFFFFF'));
    N_lines.push(new Line('N', 'N', 'subway-line subway-yellow', '#FCCC0A', '#000000'));
    N_lines.push(new Line('Q', 'Q', 'subway-line subway-yellow', '#FCCC0A', '#000000'));
    N_lines.push(new Line('R', 'R', 'subway-line subway-yellow', '#FCCC0A', '#000000'));
    N_lines.push(new Line('S-1', 'S', 'subway-line subway-gray', '#808183', '#FFFFFF'));
    N_lines.push(new Line('S-2', 'S', 'subway-line subway-gray', '#808183', '#FFFFFF'));
    N_lines.push(new Line('S-3', 'S', 'subway-line subway-gray', '#808183', '#FFFFFF'));
    N_lines.push(new Line('Z', 'Z', 'subway-line subway-brown', '#996633', '#FFFFFF'));
    N_lines.push(new Line('1', '1', 'subway-line subway-red', '#EE352E', '#FFFFFF'));
    N_lines.push(new Line('2', '2', 'subway-line subway-red', '#EE352E', '#FFFFFF'));
    N_lines.push(new Line('3', '3', 'subway-line subway-red', '#EE352E', '#FFFFFF'));
    N_lines.push(new Line('4', '4', 'subway-line subway-green', '#00933C', '#FFFFFF'));
    N_lines.push(new Line('5', '5', 'subway-line subway-green', '#00933C', '#FFFFFF'));
    N_lines.push(new Line('6', '6', 'subway-line subway-green', '#00933C', '#FFFFFF'));
    N_lines.push(new Line('7', '7', 'subway-line subway-purple', '#B933AD', '#FFFFFF'));
    N_lines.push(new Line('SIRR', 'SI', 'subway-line subway-blue', '#0039A6', '#FFFFFF'));
    N_lines.push(new Line('AirTrain JFK', '&#9992;', 'subway-line subway-light-yellow', '#FFF200', '#000000'));
    N_lines.push(new Line('AirTrain LGA', '&#9992;', 'subway-line subway-light-yellow', '#FFF200', '#000000'));
    N_lines.push(new Line('T', 'T', 'subway-line subway-turquoise', '#1E9DBF', '#FFFFFF'));
    N_lines.push(new Line('BQX', 'BQX', 'subway-line-long subway-black', '#212121', '#FFFFFF'));
    N_lines.push(new Line('S-4', 'S', 'subway-line subway-gray', '#808183', '#FFFFFF'));
    N_lines.push(new Line('W', 'W', 'subway-line subway-yellow', '#FCCC0A', '#000000'));
    N_lines.push(new Line('8', '8', 'subway-line subway-green', '#00933C', '#FFFFFF'));
    N_lines.push(new Line('9', '9', 'subway-line subway-red', '#EE352E', '#FFFFFF'));
    N_lines.push(new Line('10', '10', 'subway-line subway-green', '#00933C', '#FFFFFF'));
    N_lines.push(new Line('11', '11', 'subway-line subway-purple', '#B933AD', '#FFFFFF'));
    N_lines.push(new Line('12', '12', 'subway-line subway-green', '#00933C', '#FFFFFF'));
    N_lines.push(new Line('13', '13', 'subway-line subway-red', '#EE352E', '#FFFFFF'));
    N_lines.push(new Line('H', 'H', 'subway-line subway-blue', '#0039A6', '#FFFFFF'));
    N_lines.push(new Line('K', 'K', 'subway-line subway-blue', '#0039A6', '#FFFFFF'));
    N_lines.push(new Line('V', 'V', 'subway-line subway-orange', '#FF6319', '#FFFFFF'));
    N_lines.push(new Line('JFK Express', '&#9992;', 'subway-line subway-turquoise', '#1E9DBF', '#FFFFFF'));
    N_lines.push(new Line('MJ', 'MJ', 'subway-line subway-maroon', '#AB3F57', '#FFFFFF'));
    N_lines.push(new Line('A-Euclid', 'A', 'subway-line subway-blue', '#0039A6', '#FFFFFF'));
    N_lines.push(new Line('AirTrain JFK-Howard', '&#9992;', 'subway-line subway-light-yellow', '#FFF200', '#000000'));
    N_lines.push(new Line('AirTrain JFK-Archer', '&#9992;', 'subway-line subway-light-yellow', '#FFF200', '#000000'));
    N_lines.push(new Line('AirTrain JFK-Connectors', '&#9992;', 'subway-line subway-light-yellow', '#FFF200', '#000000'));
    N_lines.push(new Line('TriboroRX', 'TriboroRX', 'subway-line-long subway-yellow', '#FCCC0A', '#000000'));

    //Saving space here in case we want to add more defaults later
    for(var i = 0; i < 50; i++) {
        N_lines.push(new Line('N/A', 'N/A', 'subway-line-long subway-gray', '#808183', '#FFFFFF'));
    }


    find_line_by_name('A-Euclid').branch = true;
    find_line_by_name('AirTrain JFK-Howard').branch = true;
    find_line_by_name('AirTrain JFK-Archer').branch = true;
    find_line_by_name('AirTrain JFK-Connectors').branch = true;


    N_active_line = find_line_by_name('A');

    N_line_groups = [];
    N_line_groups.push(new LineGroup('ACE', [find_line_by_name('A').id, find_line_by_name('A-Euclid').id, find_line_by_name('C').id, find_line_by_name('E').id, find_line_by_name('H').id, find_line_by_name('K').id]));
    N_line_groups.push(new LineGroup('BDFM', [find_line_by_name('B').id, find_line_by_name('D').id, find_line_by_name('F').id, find_line_by_name('M').id, find_line_by_name('V').id]))
    N_line_groups.push(new LineGroup('G', [find_line_by_name('G').id]));
    N_line_groups.push(new LineGroup('JZ', [find_line_by_name('J').id, find_line_by_name('Z').id]));
    N_line_groups.push(new LineGroup('L', [find_line_by_name('L').id]));
    N_line_groups.push(new LineGroup('NQR', [find_line_by_name('N').id, find_line_by_name('Q').id, find_line_by_name('R').id, find_line_by_name('W').id, find_line_by_name('TriboroRX').id]));
    N_line_groups.push(new LineGroup('Shuttles', [find_line_by_name('S-1').id, find_line_by_name('S-2').id, find_line_by_name('S-3').id, find_line_by_name('S-4').id]));
    N_line_groups.push(new LineGroup('123', [find_line_by_name('1').id, find_line_by_name('2').id, find_line_by_name('3').id, find_line_by_name('9').id, find_line_by_name('13').id]));
    N_line_groups.push(new LineGroup('456', [find_line_by_name('4').id, find_line_by_name('5').id, find_line_by_name('6').id, find_line_by_name('8').id, find_line_by_name('10').id, find_line_by_name('12').id]));
    N_line_groups.push(new LineGroup('7', [find_line_by_name('7').id, find_line_by_name('11').id]));
    N_line_groups.push(new LineGroup('SIRR', [find_line_by_name('SIRR').id]));
    N_line_groups.push(new LineGroup('AirTrains', [find_line_by_name('AirTrain JFK').id, find_line_by_name('AirTrain JFK-Howard').id, find_line_by_name('AirTrain JFK-Archer').id, find_line_by_name('AirTrain JFK-Connectors').id, find_line_by_name('AirTrain LGA').id]));
    N_line_groups.push(new LineGroup('T', [find_line_by_name('T').id, find_line_by_name('JFK Express').id]));
    N_line_groups.push(new LineGroup('BQX', [find_line_by_name('BQX').id]));
    N_line_groups.push(new LineGroup('Maroon', [find_line_by_name('MJ').id]));

    N_custom_line_colors = {};

    // Initialize demand matrix
    N_demand_station_links = {};
    N_demand_station_links[0] = {};
    N_demand_station_links[0][0] = [];


}

// Main

var map = L.map('map', {
    fullscreenControl: true,
    attributionControl: false
}).setView([40.713, -74.006], 13);

L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 16,
        minZoom: 12
}).addTo(map);

var station_layer = L.featureGroup();
var curve_layer = L.featureGroup();
var debug_layer = L.featureGroup();

map.addLayer(curve_layer);
map.addLayer(station_layer);
map.addLayer(debug_layer);

initialize_game_state();


$(function() {

    // Event handlers
    map.on('click', handle_map_click);
    $(document).on('click', '.station-delete', delete_station_event);
    $(document).on('click', '.station-transfer', transfer_station_event);
    $(document).on('click', '.station-build', build_to_station_event);
    $(document).on('click', '.subway-deletable', remove_line_from_station_event);
    $(document).on('click', '.station-name', function() {
        var text = $(this).text();
        var sn = $(this);
        $(this).text('');
        $('<textarea class="station-name-edit"></textarea>').appendTo($(this)).val(text).select().blur(

        function() {
            var newText = $(this).val();
            $(this).parent().text(newText).find('textarea').remove();
            var station_id = sn.attr('id').replace('station-', '');
            var station = N_stations[station_id];
            station.name = newText;
            station.generate_popup();
            generate_route_diagram(N_active_line);
        });
    });
    $(document).on('click', '.subway-clickable', function() {
        line_select_click_handler($(this));
        return false;
    });
    $('#game-save').click(function() {
        //generateGameJSON();
        save_game_json();
    });
    $('#game-load').click(function(e) {
        if (fileElem) {
            fileElem.click();
        }
        $("#starter").hide();
        e.preventDefault(); // prevent navigation to "#"
    });

    $('#custom-line-name').keyup(function() {
        var custom_line_name = $(this).val().substring(0, 20);

        if (custom_line_name.length > 2) {
            $('#custom-line-marker').removeClass('subway-line');
            $('#custom-line-marker').addClass('subway-line-long');
        } else {
            $('#custom-line-marker').addClass('subway-line');
            $('#custom-line-marker').removeClass('subway-line-long');
        }

        $('#custom-line-marker-content').text(custom_line_name);

    });
    $('#custom-line-css-bg').keyup(function() {
        var custom_line_css_bg = $(this).val();
        if (is_css_color(custom_line_css_bg)) {
            $('#custom-line-marker').css('background-color', custom_line_css_bg);
            $(this).removeClass('issue');
        }
    });
    $('#custom-line-css-text').keyup(function() {
        var custom_line_css_text = $(this).val();
        if (is_css_color(custom_line_css_text)) {
            $('#custom-line-marker').css('color', custom_line_css_text);
            $(this).removeClass('issue');
        }
    });
    $("#custom-line-add").click(function() {
        var custom_line_name = $("#custom-line-name").val().substring(0, 20);
        var custom_line_css_bg = $("#custom-line-css-bg").val();
        var custom_line_css_text = $("#custom-line-css-text").val();
        var issue = false;
        if (!is_css_color(custom_line_css_bg)) {
            $('#custom-line-css-bg').addClass('issue');
            issue = true;
        }
        if (!is_css_color(custom_line_css_text)) {
            $('#custom-line-css-text').addClass('issue');
            issue = true;
        }
        var custom_line_css_class = 'subway-line';
        if ($("#custom-line-marker").hasClass('subway-line-long')) {
            custom_line_css_class = 'subway-line-long';
        }
        if (!issue) {
            var line = new Line(custom_line_name, custom_line_name, custom_line_css_class, custom_line_css_bg, custom_line_css_text);
            N_lines.push(line);
            var line_group_exists = false;
            for (var i = 0; i < N_line_groups.length; i++) {
                if (N_line_groups[i].name == custom_line_css_bg) {
                    N_line_groups[i].add_line(line.id);
                    line_group_exists = true;
                }
            }
            if (!line_group_exists) {
                N_line_groups.push(new LineGroup(custom_line_css_bg, [line.id]));
            }

            $("#custom-lines").append('<div class="'+custom_line_css_class+' subway-clickable subway-imaginary" style="background-color: '+custom_line_css_bg+'; color: '+custom_line_css_text+'"><div class="height_fix"></div><div class="content">'+custom_line_name+'</div></div>');
            $("#custom-lines").show();

            $("#custom-line-options").hide();
            N_custom_line_shown = false;
        }
    });

    // UI edits

    $(".subway-hidden").hide();
    $("#custom-line-options").hide();
    $("#custom-lines").hide();

    // Starter screen
    $("#game-start-scratch").click(function() {
        $("#starter").hide();
    });

    $(".game-start-button").not(".game-start-greyed").click(function() {
        handle_server_file("game-starters/" + $(this).attr("id") + ".json");
        /*
        $(".subway-shuttle-add").remove();
        $(".subway-shuttle").parent().append(newShuttleTemplate(number_of_shuttles+1));
        $(".subway-shuttle").parent().append(newShuttleTemplate(number_of_shuttles+2));
        $(".subway-shuttle").removeClass("subway-shuttle-add");
        $(".subway-shuttle").children(".content").text("S");
        $(".subway-shuttle").parent().append(newShuttleTemplate(number_of_shuttles+3));

        number_of_shuttles = 3;*/
        $("#starter").hide();
    });

});