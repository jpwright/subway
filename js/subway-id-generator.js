class IdGenerator {
    constructor () {
        this.currentId = 0;
    }

    generate() {
        var givenId = this.currentId;
        this.currentId += 1;
        return givenId;
    }
    
    reset() {
        this.currentId = 0;
    }
    
}

var station_id_generator = new IdGenerator();
var line_id_generator = new IdGenerator();