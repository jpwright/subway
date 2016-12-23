

var neighborhoods = new L.geoJson();

$.ajax({
    dataType: "json",
    url: "static/geojson/neighborhoods.geojson",
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
    url: "static/geojson/landmarks.geojson",
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

$.getJSON( "static/json/demand.json", function( data ) {
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

var N_number_of_shuttles = 0;
var N_game_started = false;

// Important global variables.
var NS_session;
var NS_map;
var NS_service;
var NS_interface;

function initialize_game_state() {
    
    // Create leaflet map
    var map = L.map('map', {
        fullscreenControl: true,
        attributionControl: false
    }).setView([40.713, -74.006], 13);

    L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            attribution: '',
            maxZoom: 16,
            minZoom: 12
    }).addTo(map);
    
    map.on('click', handle_map_click);
    
    
    map.on('mousemove', function(e) {
        if (NS_interface.active_tool == "station") {
            if (NS_interface.active_line != null) {
                NS_interface.preview_line(NS_interface.active_line, e.latlng.lat, e.latlng.lng);
            }
        }
        if (NS_interface.active_tool == "line") {
            if (NS_interface.active_line != null) {
                NS_interface.preview_station(NS_interface.active_line, e.latlng.lat, e.latlng.lng);
            }
        }
    });
    
    // Initialize interface
    NS_interface = new TransitUI(map);
    
    var initial_lines = [
        new Line(0, 'A')
    ];

    // Initialize server
    $.ajax({ url: "session", 
        async: false,
        dataType: 'json',
        success: function(data, status) {
            NS_session = data["id"];
        }
    });
    
    // Initialize map
    $.ajax({ url: "map-info", 
        async: false,
        dataType: 'json',
        success: function(data, status) {
            NS_map = new Map(data["id"]);
        }
    });
    
    // Initialize service
    $.ajax({ url: "service-add?name=MTA", 
        async: false,
        dataType: 'json',
        success: function(data, status) {
            var NS_service = new Service(data["id"], "MTA");
            NS_map.add_service(NS_service);
        }
    });
    
    /*
    // Initialize lines
    for (var i = 0; i < initial_lines.length; i++) {
        var line = initial_lines[i];
        
        $.ajax({ url: "line-add?service-id="+NS_map.primary_service().id.toString()+"&name="+line.name,
            async: false,
            dataType: 'json',
            success: function(data, status) {
                line.id = data["id"];
                line.color_bg = '#0039A6';
                line.color_fg = '#FFFFFF';
                NS_map.primary_service().add_line(line);
                NS_interface.add_to_line_selector(line);
            }
        });
    }
    */
    
    NS_interface.active_service = NS_map.primary_service();
    NS_interface.active_line = NS_map.primary_service().lines[0];
    
}

// Main




initialize_game_state();

var HEADLESS_MODE = false;
var CUSTOM_CITY_NAME = "";

$(function() {

    // Event handlers
    
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
            var station = NS_interface.active_service.get_station_by_id(station_id);
            station.name = newText;
            NS_interface.update_line_diagram();
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
        e.preventDefault(); // prevent navigation to "#"
    });

    $('#custom-line-name').keyup(function() {
        NS_interface.update_line_editor();
        NS_interface.line_editor_save();
    });
    $("#line-selector-new").click(function() {
        NS_interface.line_selector_new();
    });
    
    $(document).on("click", ".line-selector-option", function(e) {
        NS_interface.update_line_selector(parseInt(e.target.id));
    });
    
    $("#custom-line-save").click(function() {
        NS_interface.line_editor_save();
    });

    // UI edits

    $(".subway-hidden").hide();
    //$("#custom-line-options").hide();
    $("#custom-lines").hide();

    // Starter screen
    $("#game-start-scratch").click(function() {
        $("#starter").hide();
    });

    $(".game-start-button").not(".game-start-greyed").click(function() {
        handle_server_file("static/game-starters/" + $(this).attr("id") + ".json");
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
    
    var input = document.getElementById('pac-input');
    var autocomplete = new google.maps.places.Autocomplete(input, {types: ["(cities)"]});
    autocomplete.addListener('place_changed', function() {
        var place = autocomplete.getPlace();
        
        CUSTOM_CITY_NAME = place.name;
        
        var place_lat = place.geometry.location.lat();
        var place_lng = place.geometry.location.lng();
        NS_interface.map.panTo(L.latLng(place_lat, place_lng));
        $("#starter").hide();
    });
    
    // Color pickers
    $("#color-picker-bg").spectrum({
        color: "#808183",
        showInput: true,
        className: "full-spectrum",
        showInitial: true,
        maxSelectionSize: 10,
        preferredFormat: "hex",
        change: function(color) {
            NS_interface.update_line_editor();
            NS_interface.line_editor_save();
        }
    });
    $("#color-picker-fg").spectrum({
        color: "#FFF",
        showInput: true,
        className: "full-spectrum",
        showInitial: true,
        maxSelectionSize: 10,
        preferredFormat: "hex",
        change: function(color) {
            NS_interface.update_line_editor();
            NS_interface.line_editor_save();
        }
    });
    
    // Tool selector
    $("#tool-station").addClass("game-button-active");
    
    $("#tool-station").click(function(e) {
        if (NS_interface.active_tool != "station") {
            $(".tool-button").removeClass("game-button-active");
            $("#tool-station").addClass("game-button-active");
            NS_interface.active_tool = "station";
        }
    });
    $("#tool-line").click(function(e) {
        if (NS_interface.active_tool != "line") {
            $(".tool-button").removeClass("game-button-active");
            $("#tool-line").addClass("game-button-active");
            NS_interface.active_tool = "line";
        }
    });

});