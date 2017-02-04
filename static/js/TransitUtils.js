function get_url_parameter(param) {
    var vars = {};
    window.location.href.replace( location.hash, '' ).replace(
            /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
            function( m, key, value ) { // callback
                    vars[key] = value !== undefined ? value : '';
            }
    );

    if ( param ) {
            return vars[param] ? vars[param] : null;
    }
    return vars;
}

function num_unique_colors(lines) {
    var ret = 0;
    var used_colors = [];
    for (var i = 0; i < lines.length; i++) {
        if (used_colors.indexOf(lines[i].color_bg) == -1) {
            used_colors.push(lines[i].color_bg);
            ret += 1;
        }
    }
    return ret;
}