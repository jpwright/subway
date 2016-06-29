function is_in_array(value, array) {
  return array.indexOf(value) > -1;
}

function is_in_2d_array(arr, i, j) {
    for (var a = 0; a < arr.length; a++) {
        var p = arr[a];
        if (p.indexOf(i) > -1 && p.indexOf(j) > -1) {
            return true;
        }
    }
    return false;
}

function intersect(a, b) {
    var t;
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function (e) {
        if (b.indexOf(e) !== -1) return true;
    });
}

function sort_by_group(line_ids) {
    // Takes an array of line IDs, and sorts based on the group they're in.
    // e.g. [B,C] -> [B,C], [A,B,C,D] -> [A,C,B,D]
    
    return line_ids.sort(function(x,y) {
        var group_x = lines_to_groups([x])[0];
        var group_y = lines_to_groups([y])[0];
        if (group_x == group_y)
            return N_line_groups[group_x].lines.indexOf(x) > N_line_groups[group_y].lines.indexOf(y);
        else
            return group_x > group_y;
    });
}

function debug_stations(station_id_list) {
    for (var i = 0; i < station_id_list.length; i++) {
        console.log(N_stations[station_id_list[i]]);
    }
}

function debug_lines(line_id_list) {
    for (var i = 0; i < line_id_list.length; i++) {
        console.log(N_lines[line_id_list[i]]);
    }
}

function find_stations_by_name(station_name) {
    var stations = [];
    for (var i = 0; i < N_stations.length; i++) {
        if (N_stations[i].name == station_name && N_stations[i].active) {
            stations.push(i);
        }
    }
    return stations;
}