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

    var session_id = get_url_parameter("id");

    if (session_id != null) {
        PRELOADED_SESSION = true;
        // Initialize session and map
        $.ajax({ url: "session-load?id="+session_id,
            async: false,
            dataType: 'json',
            success: function(data, status) {
                console.log(data.data);
                NS_session = data.id;
                NS_map = new Map(data.data.id);
                NS_map.from_json(data.data);
                NS_interface.active_service = NS_map.primary_service();
                NS_interface.active_line = NS_map.primary_service().lines[0];
                NS_interface.update_line_selector(NS_interface.active_line.id);
                NS_interface.update_line_editor();
                NS_interface.refresh_line_editor();
                NS_interface.update_line_diagram();
                for (var i = 0; i < NS_map.primary_service().stations.length; i++) {
                    var station = NS_map.primary_service().stations[i];
                    NS_interface.create_station_marker(station);
                }
                for (var i = 0; i < NS_map.primary_service().lines.length; i++) {
                    var line = NS_map.primary_service().lines[i];
                    NS_interface.draw_line(line);
                }
            }
        });
    } else {

        var initial_lines = [
            new Line(0, 'A')
        ];
        // Initialize server
        $.ajax({ url: "session",
            async: false,
            dataType: 'json',
            success: function(data, status) {
                NS_session = data["id"];
                window.history.pushState("", "", "?id="+NS_session);
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
                NS_interface.active_service = NS_map.primary_service();
                NS_interface.active_line = NS_map.primary_service().lines[0];
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
    }

}

// Main

var HEADLESS_MODE = false;
var PRELOADED_SESSION = false;
var CUSTOM_CITY_NAME = "";

initialize_game_state();

$(function() {

    if (PRELOADED_SESSION) {
        $("#starter").hide();
    }

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

    setInterval(function(){
        // Initialize service
        $.ajax({ url: "session-save",
            async: false,
            dataType: 'json',
            success: function(data, status) {
            }
        });
    }, 5000);

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