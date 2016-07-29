function calculate_ridership(latlng) {

    var total_ridership = 0;

    // New method: Voxels

    var voxel_i = Math.round((latlng.lat - LAT_MIN)/VOXELS_RES_LAT);
    var voxel_j = Math.round((latlng.lng - LNG_MIN)/VOXELS_RES_LNG);

    total_ridership += demand[voxel_i][voxel_j+2];

    total_ridership += demand[voxel_i+1][voxel_j+1];
    total_ridership += demand[voxel_i][voxel_j+1];
    total_ridership += demand[voxel_i-1][voxel_j+1];

    total_ridership += demand[voxel_i+2][voxel_j];
    total_ridership += demand[voxel_i+1][voxel_j];
    total_ridership += demand[voxel_i][voxel_j];
    total_ridership += demand[voxel_i-1][voxel_j];
    total_ridership += demand[voxel_i-2][voxel_j];

    total_ridership += demand[voxel_i+1][voxel_j-1];
    total_ridership += demand[voxel_i][voxel_j-1];
    total_ridership += demand[voxel_i-1][voxel_j-1];

    total_ridership += demand[voxel_i][voxel_j-2];

    return total_ridership;
    
}

function calculate_total_ridership() {
    var r = 0;
    for (var i = 0; i < N_stations.length; i++) {
        if (N_stations[i].active)
            r += N_stations[i].riders;
    }
    
    var rs = r * 1.69375;
    var riders_millions = rs / 1000000.0;
    
    $('#system-ridership').text(Number(riders_millions).toFixed(2).toString() + " million");

    var mc_cost = number_of_active_stations()*19859.5063025/r;
    $('#metrocard-cost').text("$"+Number(mc_cost).toFixed(2).toString());
    
    var rating = 41.4634146341 * riders_millions / mc_cost;
    var letter_grade = '';
    
    if (rating >= 97) {
        letter_grade = 'A+';
    } else if (rating >= 93) {
        letter_grade = 'A';
    } else if (rating >= 90) {
        letter_grade = 'A-';
    } else if (rating >= 87) {
        letter_grade = 'B+';
    } else if (rating >= 83) {
        letter_grade = 'B';
    } else if (rating >= 80) {
        letter_grade = 'B-';
    } else if (rating >= 77) {
        letter_grade = 'C+';
    } else if (rating >= 73) {
        letter_grade = 'C';
    } else if (rating >= 70) {
        letter_grade = 'C-';
    } else if (rating >= 67) {
        letter_grade = 'D+';
    } else if (rating >= 63) {
        letter_grade = 'D';
    } else if (rating >= 60) {
        letter_grade = 'D-';
    } else {
        letter_grade = 'F';
    }
    $('#system-rating').text(letter_grade);

    
    //$('#system-rating').text(Number(rating).toFixed(2).toString());
    
}