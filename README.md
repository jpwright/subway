# subway
Source code for https://jpwright.github.io/subway/.

## Development

Pre-requisites: `node`

`npm install`

To run: `npx http-server`

### File Generations
Hopefully these steps are only necessary to do once per decade:

#### population.json

Download the latest census results from `nyc.gov`, e.g. for [2020](https://www.nyc.gov/site/planning/planning-level/nyc-population/). This gets downloaded as a `.xlsx` file. Using an online tool of your choice, convert the `2020` data into a `.json` file file and save them into every file in this repo called `population.json`.

One possible converstion:
1. Import `.xlsx` file into google sheets.
2. Delete all the tabs besides 2020 and redownload.
3. Import the redownloaded file into `https://kinoar.github.io/xlsx-to-json/` and click `Download Localization JSON`.

#### demand.json

To re-generate `demand.json` file: `node tools/demanderator.js`

Make sure to copy/paste into `json/demand.json`.