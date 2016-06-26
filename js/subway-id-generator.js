class IdGenerator {
    constructor () {
        this.currentId = 0;
    }

    generate() {
        var givenId = this.currentId;
        this.currentId += 1;
        return givenId;
    }
}

var station_id = new IdGenerator();
var line_id = new IdGenerator();