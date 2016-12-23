// Dependencies
var express = require('express');
var session = require('express-session');
var jsonfile = require('jsonfile');

// Express app
var app = express();

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'bns'
}));
app.use(express.static('static'));
app.set('view engine', 'ejs');

app.listen(3000, function() {
    console.log('Node app listening on port 3000.');
});

var RESPONSE_CODE_OK = 0;


// Local storage
var sessions = {};

// Routing

app.get('/', function(req, res) {
    //res.send(req.session.id);
    res.render('pages/debug', {
        session_id: req.session.id
    });
});

app.get('/init/', function(req, res) {
    var response = {
        "code": RESPONSE_CODE_OK,
        "session_id": req.session.id
    }
    res.send(response);
});

app.get('/add-station/', function(req, res) {
    res.send(req.query.lat);
});