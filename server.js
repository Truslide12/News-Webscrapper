const express = require("express");
const exhbs = require("express-handlebars");
const logger = require("morgan");
const mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
const axios = require("axios");
const cheerio = require("cheerio");

// Require all models
var db = require("./models/");

// Port configuration for local/Heroku
var PORT =  process.env.PORT || process.argv[2] || 3030;

// Initialize Express
const app = express();

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));
const hbs = exhbs.create();

app.engine('handlebars', exhbs({ defaultLayout: "main" }));
app.set('view engine', 'handlebars');

// Connect to the Mongo DB
//mongoose.connect("mongodb://localhost/newsdb", { useNewUrlParser: true });
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsdb";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true }).then(function(){
    console.log("Mongoose is successfully connected");
});

// Routes
require("./controllers/api.js")(app);


// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
