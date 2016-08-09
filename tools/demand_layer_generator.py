import json
from PIL import Image, ImageDraw

with open("../json/demand.json") as demand_file:
    demand_data = json.load(demand_file)
    dims_x = len(demand_data);
    dims_y = len(demand_data[0]);
    
    im = Image.new('RGBA', (dims_x*10, dims_y*10), 'black')
    draw = ImageDraw.Draw(im)
    for i in range(0, dims_x):
        for j in range(0, dims_y):
            alpha = int(255.0 * demand_data[i][j] / 1000.0)
            draw.rectangle([(j*10,(dims_x-i)*10),(j*10+10,(dims_x-i)*10 + 10)], fill = (255, 120, 0, alpha), outline = (255, 120, 0, alpha))
    
    im.save("demand.png", "PNG")