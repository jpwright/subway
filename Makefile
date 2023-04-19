
PORT ?=8000

all: run

run:
	python3 -m http.server $(PORT)