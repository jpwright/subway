import json

class StationPair(object):
    
    def __init__(self, station_1, station_2):
        self.station_sids = [station_1, station_2]
        self.user_control_points = []
        
    def has_stations(self, s1, s2):
        if (self.station_sids[0] == s1 and self.station_sids[1] == s2) or (self.station_sids[1] == s1 and self.station_sids[0] == s2):
            return True
        else:
            return False
        
    def set_ucps(self, ucp_0_lat, ucp_0_lng, ucp_1_lat, ucp_1_lng):
        self.user_control_points = [[ucp_0_lat, ucp_0_lng], [ucp_1_lat, ucp_1_lng]]

class Settings(object):
    """A Map contains a collection of Services, everything needed for a single Transit session.

    Attributes:
        services: An array of Services.
    """

    def __init__(self):
        self.station_pairs = []

    def set_user_control_points(self, s1, s2, ucp_0_lat, ucp_0_lng, ucp_1_lat, ucp_1_lng):
        station_pair_found = False
        for station_pair in self.station_pairs:
            if station_pair.has_stations(s1, s2):
                station_pair_found = True
                station_pair.set_ucps(ucp_0_lat, ucp_0_lng, ucp_1_lat, ucp_1_lng)
        if not station_pair_found:
            sp = StationPair(s1, s2)
            sp.set_ucps(ucp_0_lat, ucp_0_lng, ucp_1_lat, ucp_1_lng)
            self.station_pairs.append(sp)

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

    def from_json(self, j):
        self.station_pairs = []
        for station_pair in j['station_pairs']:
            s = StationPair(station_pair['station_sids'][0], station_pair['station_sids'][1])
            s.set_ucps(station_pair['user_control_points'][0][0], station_pair['user_control_points'][0][1], station_pair['user_control_points'][1][0], station_pair['user_control_points'][1][1])
            self.station_pairs.append(s)