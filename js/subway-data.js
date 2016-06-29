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