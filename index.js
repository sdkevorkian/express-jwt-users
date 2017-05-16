var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var User = require('./models/user');
var app = express();

// good to put in .env file with dot-env module
var secret = "supersecret";

mongoose.connect('mongodb://localhost:27017/myauthenticatedusers');
app.use(bodyParser.urlencoded({ extended: true }));

// lock certain routes with expressJWT, unless you are posting(making a  new user)
app.use('/api/users', expressJWT({ secret: secret }).unless({ method: 'POST' }));
// everything hits the middlewear, only hits the if if there is an error
// goes along with middlewear above
app.use(function(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).send({ message: 'You need an auth token to view' });
    }
});
app.use('/api/users', require('./controllers/users'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/views/index.html');
});

// for logging in
app.post('/api/auth', function(req, res) {
    User.findOne({ email: req.body.email }, function(err, user) {
        if (err || !user) return res.send({ message: 'User not found' });
        user.authenticated(req.body.password, function(err, result) {
            if (err || !result) return res.send({ message: 'User not authenticated' });
            // in below line, user is turned to JSON and the UserScheme.set('toJSON') function is triggered
            var token = jwt.sign(JSON.stringify(user), secret);
            // prob should save as jwt instead of token
            res.send({ user: user, token: token });
        });
    });
});

app.listen(3000);
