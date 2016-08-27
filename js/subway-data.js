function calculate_ridership(station_id, instruction) {

    var latlng = N_stations[station_id].marker.getLatLng();
    var total_ridership = 0;

    // New method: Voxels

    var voxel_i = Math.round((latlng.lat - LAT_MIN)/VOXELS_RES_LAT);
    var voxel_j = Math.round((latlng.lng - LNG_MIN)/VOXELS_RES_LNG);
    
    if (voxel_i < 2 || voxel_i > VOXELS_DIM - 2 || voxel_j < 2 || voxel_j > VOXELS_DIM - 2) {
        // This is outside our ridership estimate area.
        // For now, just return 0.
        N_stations[station_id].riders = 0.0;
        N_stations[station_id].generate_popup();
        return 0.0;
    }
    
    var kernels = [[0,2],[-1,1],[0,1],[1,1],[-2,0],[-1,0],[0,0],[1,0],[2,0],[-1,-1],[0,-1],[1,-1],[0,-2]];
    var stations_to_check = [];
    
    for (var i = 0; i < kernels.length; i++) {
    
        var k = kernels[i];
        var scale = 1.0;
        var demand_i = demand[voxel_i+k[0]][voxel_j+k[1]];
        var dsl_i = N_demand_station_links[voxel_i+k[0]];
        if (typeof dsl_i == "undefined") {
            N_demand_station_links[voxel_i+k[0]] = {};
            dsl_i = [];
        }
        var dsl_j = dsl_i[voxel_j+k[1]];
        if (typeof dsl_j == "undefined") {
            switch (instruction) {
                case RIDERSHIP_ADD:
                    N_demand_station_links[voxel_i+k[0]][voxel_j+k[1]] = [station_id];
                    dsl_j = [station_id];
                    break;
                default:
                    N_demand_station_links[voxel_i+k[0]][voxel_j+k[1]] = [];
                    dsl_j = [];
                    break;
            }
        } else {
            switch (instruction) {
                case RIDERSHIP_ADD:
                    N_demand_station_links[voxel_i+k[0]][voxel_j+k[1]].push(station_id);
                    //dsl_j.push(station_id);
                    break;
                case RIDERSHIP_DELETE:
                    var voxel_station_index = N_demand_station_links[voxel_i+k[0]][voxel_j+k[1]].indexOf(station_id);
                    if (voxel_station_index > -1) {
                        N_demand_station_links[voxel_i+k[0]][voxel_j+k[1]].splice(voxel_station_index, 1);
                        //dsl_j.splice(voxel_station_index, 1);
                    }
                    break;
                default:
                    break;
            }
            
        }
        scale = dsl_j.length;
        total_ridership += demand_i / scale;
        
        if (instruction != RIDERSHIP_NOCHANGE) {
            for (var j = 0; j < dsl_j.length; j++) {
                if (!is_in_array(dsl_j[j], stations_to_check) && dsl_j[j] != station_id) {
                    stations_to_check.push(dsl_j[j]);
                }
            }
        }
        
        
    }
    
    for (var i = 0; i < stations_to_check.length; i++) {
        var station_id_i = stations_to_check[i];
        if (N_stations[station_id_i].active) {
            calculate_ridership(station_id_i, RIDERSHIP_NOCHANGE);
            // Update popup for new ridership
            N_stations[station_id_i].generate_popup();
        }
    }
    
    // Global scaling factor
    total_ridership *= 1.0;
    
    // Borough employment scaling
    if (N_stations[station_id].borough in EMPLOYMENT_BY_BOROUGH_MODIFIERS) {
        total_ridership += (total_ridership * PERCENTAGE_EMPLOYMENT_TRIPS) * Math.sqrt(EMPLOYMENT_BY_BOROUGH_MODIFIERS[N_stations[station_id].borough]);
    }
    
    // Bonus for extra lines
    // TODO account for in-system transfers
    var num_accessible_lines = N_stations[station_id].lines.length;
    total_ridership *= Math.log(num_accessible_lines) + 1.0;
    
    // Add some noise!
    if (!HEADLESS_MODE) {
        total_ridership *= (Math.random() - 0.5)*0.05 + 1.0;
    }
    
    N_stations[station_id].riders = total_ridership;
    N_stations[station_id].generate_popup();
    
    return total_ridership;
    
}

function calculate_total_ridership() {
    var r = 0;
    for (var i = 0; i < N_stations.length; i++) {
        if (N_stations[i].active)
            r += N_stations[i].riders;
    }
    
    //console.log("Ridership = "+r.toString());
    //console.log("Platforms = "+number_of_active_platforms().toString());
    
    //var rs = r * 1.69375;
    var rs = r;
    var riders_millions = rs / 1000000.0;
    
    $('#system-ridership').text(Number(riders_millions).toFixed(2).toString() + " million");

    var alpha = 6651.72; // This is derived from $2.75 = (platforms/riders)^2 / alpha
    var mc_cost = Math.pow(number_of_active_platforms()/riders_millions, 2) / alpha;
    $('#metrocard-cost').text("$"+Number(mc_cost).toFixed(2).toString());
    
    var beta = 5.0;
    var gamma = 5.0;
    var zeta = 10000.0;
    var delta = 0.0;
    var psi = 0.0;
    var omega = 10.0;
    
    var f1 =  beta*(Math.log(riders_millions + psi) + 1.0);
    var f2 =  zeta*(riders_millions + psi)/(gamma*(number_of_active_platforms() + number_of_active_stations()) + omega);
    var rating = f1 + f2;
    //console.log("Pop score = "+f1.toString()+", Station score = "+f2.toString());
    //console.log(rating);
    
    var sigma = 3.72073;
    rating *= sigma;
    //console.log(rating);
    var letter_grade = '';
    
    if (HEADLESS_MODE) {
        return rating;
    }
    
    //console.log("Rating = "+rating.toString());
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