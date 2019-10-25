
const cheerio = require("cheerio");
const axios = require("axios");
const request = require("request")
const db = require("../models");
// Routes
module.exports = function (app) {
    // Initial page render

    app.get("/", (req, res) => {
        db.Article.find({})
            .then(function (dbArticle) {
                // If we were able to successfully find Articles, send them back to the client
                const retrievedArticles = dbArticle;
                let hbsObject;
                hbsObject = {
                    articles: dbArticle
                };
                res.render("index", hbsObject);
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.json(err);
                return res.status(500).end();
            });
    });

    // A GET route for scraping the echoJS website

    app.get("/scrape", function (req, res) {
        console.log("scrape ran");
        // First, we grab the body of the html with axios

        axios.get("http://www.oann.com/").then(function (response) {
            // Then, we load that into cheerio and save it to $ for a shorthand selector
            var $ = cheerio.load(response.data);

            // Now, we grab every h3 within an article tag, and do the following:
            $("article h3").each(function (i, element) {
                // Save an empty result object
                let result = {};
                // Add the text and href of every link, and save them as properties of the result object
                result.title = $(this)
                    .children("a")
                    .text();
                result.link = $(this)
                    .children("a")
                    .attr("href");
                result.img = $(this)
                    .children("a")
                    .attr("img");
                // Create a new Article using the `result` object built from scraping
                db.Article.create(result)
                    .then(function (dbArticle) {
                        // View the added result in the console
                        console.log(dbArticle);
                    })
                    .catch(function (err) {
                        // If an error occurred, log it
                        console.log(err);
                    });
            });
            res.send("Scrape Complete");
            res.status(200).end();
        })
    });

    // Saved articles
    app.get("/saved", function (req, res) {
        db.Article.find({ saved: true }).populate("note").then(function (dbArticle) {
            console.log(dbArticle);
            const hbsObject = {
                savedArticles: dbArticle
            };
            res.render("saved", hbsObject);
        }).catch(function (err) {
            console.log(err);
            return res.status(500).end();
        });
    });

    // Route for getting all Articles from the db
    app.get("/articles", function (req, res) {
        // Grab every document in the Articles collection
        db.Article.find({})
            .then(function (dbArticle) {
                // If we were able to successfully find Articles, send them back to the client
                res.json(dbArticle);
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.json(err);
            });
    });

    // Save article
    app.put("/articles/saved/:id", function (req, res) {
        db.Article.findOneAndUpdate({ _id: req.params.id }, { isSaved: true }, { new: true })
            .then(function (dbArticle) {
                // If we were able to successfully find Articles, send them back to the client
                console.log(dbArticle);
                res.status(200).end();
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.json(err);
                res.status(500).end();
            });
    });

    // Remove an Article from Saved
    app.put("/articles/delete/:id", function (req, res) {
        db.Article.findOneAndUpdate({ _id: req.params.id }, { isSaved: false }, { new: true })
            .then(function (data) {
                // If we were able to successfully find Articles, send them back to the client
                res.json(data);
                console.log(data);
                res.status(200).end();
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.json(err);
                res.status(500).end();
            });
    });

    // Clear All Articles & Notes
    app.delete("/articles/clear", function (req, res) {
        db.Article.collection.drop().then(function () {
            res.status(200).end();
        }).catch(function (err) {
            console.log(err);
            return res.status(500).end();
        });
        db.Note.collection.drop().then(function () {
            res.status(200).end();
        }).catch(function (err) {
            console.log(err);
            return res.status(500).end();
        });
    });

    // Adding a note
    app.get("/articles/save-note/:id", function (req, res) {
        // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
        db.Note.create({ comment: req.body.note }).then(function (dbNote) {
            console.log(dbNote);
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { note: dbNote._id } }, { new: true })
                .then(function (savedNote) {
                    console.log(savedNote);
                    console.log("Note Saved!");
                    res.status(200).end();
                });
        });
    });

    // Delete a note
    app.delete("/articles/delete-note/:id", function (req, res) {
        // Create a new note and pass the req.body to the entry
        db.Note.deleteOne({ _id: req.params.id })
            .then(function (dbArticle) {
                // If we were able to successfully update an Article, send it back to the client
                res.json(dbArticle);
                res.status(200).end();
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.json(err);
                res.status(500).end();
            });
    });
}
