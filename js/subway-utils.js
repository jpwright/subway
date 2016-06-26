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