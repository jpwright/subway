#!/usr/bin/python

from os import listdir, system
from os.path import isfile, join, splitext

DGGRID_FOLDER = "../../dggrid/output/ca-7/"

files = [f for f in listdir(DGGRID_FOLDER) if isfile(join(DGGRID_FOLDER, f))]

for f in sorted(files):
    filename, file_extension = splitext(f)
    if file_extension == '.geojson':
        print 'uploading '+filename
        system('node nationwide_latent_demand_2.js -c "../static/geojson/tabblock2010_06_7_simplified.geojson" -d "'+DGGRID_FOLDER+f+'"')
