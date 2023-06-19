"use strict";

// require our modules
var express = require("express");
var bodyParser = require("body-parser");
var fileUpload = require("express-fileupload");
var session = require("express-session");
var mysql = require("mysql");
const { render } = require("ejs");


// set up other config vars
var port=8000;
var app = express();

// set up our middleware



app.use(session({secret: "ttgfhrwgedgnl7qtcoqtcg2uyaugyuegeuagu111",
                resave: false,
                saveUninitialized: true,
                cookie: {maxAge: 1200000}}));
app.use(express.static("static"));
app.set("view-engine", "ejs");
app.set("views", "templates");
app.use(bodyParser.urlencoded({extended: true}));
app.use(fileUpload());

// configure out database connection
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "NNssHxss999+",  // Enter your own MySQL password
    database: "project2" // Enter your database name

    // host: "mysql.scss.tcd.ie", // hostname of your MySQL server
    // user: "gachpazr", // your username
    // password: "baing6Ie",// your password
    // database: "gachpazr_db"
});

// connect to the DB
con.connect( function(err) {
    if (err) {
        console.log("Error: "+err);
    } else {
        //var newDate = new Date();         
        // console.log(newDate.toLocaleTimeString());      // 04:40:52
        // console.log(newDate.toDateString());            // Tue Apr 05 2022
        //console.log(newDate.toLocaleTimeString()+" "+newDate.toDateString());//04:43:09 Tue Apr 05 2022
        console.log("Successfully connected to DB");
    }
 });

// set up routes

app.get("/", function(req, res) {
    var username;
    if (req.session.username) {
        username = req.session.username;
    }else{
        username = "NULL";
    }
    //console.log(username);
    res.render("home.ejs", {"user": username});
});

// render the login page

app.get("/login", function(req, res) {    
    if(req.session.username){
        res.render("home.ejs", {"user": req.session.username});
    }else{
        res.render("login.ejs");
    }
});

app.post("/login", function(req, res) {
    var found = false;
    var sql = `SELECT * FROM users`;
    var inputName = req.body.username;
    var password = req.body.password;
    var sessionData = null;
    con.query(sql, function (err, results) {
        if (err) {
            res.send("A database error occurred: " + err);
        } else {
            if (results.length > 0) {
                for (var i in results) {
                    if (inputName == results[i].username && password == results[i].password) { // judge if the username and password that users input are right
                        found = true;
                        console.log("found");
                        req.session.username = inputName;
                        sessionData = req.session.username;
                    }
                }
                res.render("home.ejs", {"user": sessionData});

            }
        }
    })
});


app.get("/logout", function(req, res) {
    req.session.destroy();
    res.render("home.ejs", {"user": "NULL"});
});


app.get("/signup", function(req, res) {
    res.render("signup.ejs");
});



app.post("/signup", function(req, res) {
    var found = false;
    var sql = `SELECT * FROM users`;
    var username = req.body.username;
    var firstname = req.body.firstname;
    var surname = req.body.surname;
    var password = req.body.password;

    con.query(sql, function (err, results) {
        if (err) {
            res.send("A database error occurred: " + err);
        } else {
            if (results.length > 0) {
                for (var i in results) {
                    if (username == results[i].username) { // judge if there is a same username in the database
                        found = true;
                        console.log("Invalid username! Username has been occupied!");
                        res.render("signup.ejs");
                    }
                }
            }
        }
    })
    if(found==false){
        var sql = `INSERT INTO users (username, firstname, surname, password) VALUES ("${username}", "${firstname}", "${surname}", "${password}")`;
        con.query(sql, function(err, results) {
            if (err) {
                res.send("A database error occurred: "+err);
            } else {
                res.render("home.ejs", {"user": username});
                console.log(results);
            }
        });

    }
    
});

app.get("/upload",function(req, res){

    var username;
    if (req.session.username) {
        username = req.session.username;
        console.log(req.session.username);
        res.render("uploads.ejs"),{"user": username};
    } else {
        res.render("home.ejs", {"user": "NULL"});
    }    
});



app.post("/upload", function(req, res) {

    var username ;
    if(req.session.username){

        username = req.session.username;
        var file = req.files.myimage;
        var newDate = new Date(); 
        

        
        //console.log(newDate.toLocaleTimeString());      // 04:40:52
        //console.log(newDate.toDateString());            // Tue Apr 05 2022
        var timeStr = newDate.toLocaleTimeString()+" "+newDate.toDateString();
        
        var sql = `INSERT INTO images (imagename, uploadusername, uploaddate) VALUES ("${file.name}", "${username}", "${timeStr}")`;
        con.query(sql, function(err, results) {
            if (err) {
                res.send("A database error occurred: "+err);
            } else {
                file.mv("static/uploadFiles/"+file.name);
                console.log("Successfully uploaded image");
                
                res.render("home.ejs", {"user": username});
            }
        });       
    }else{
        username = "NULL";
        res.render("home.ejs", {"user": username});
    }   
});



app.get("/images", function(req, res) {
    
    var username = req.session.username;
    var sql = `SELECT * FROM images`;
    con.query(sql, function (err, results) {

        if (err) {
            res.send("A database error occurred: " + err);
        } else {
            if(results.length>0){
                var filename = new Array(results.length);
                for(var i =0; i < results.length; i ++){
                    filename[i]=results[i].imagename;
                }
                // console.log(filename);
                res.render("images.ejs", {"filename": filename,"user":username});  
            }else{

                res.render("home.ejs", {"user": username});
            }    
        }
    })   
});

app.get("/images/:imagename", function(req, res) {
    var filename = req.params.imagename;
    var sql = `select commentusername,content from comments where imagename = "${filename}"`;
    var sql2 = `select uploadusername,uploaddate from images where imagename = "${filename}"`;
    var sql3 = `select * from likes where likeimagename = "${filename}"`;
    var like_num = 0;
    var users =[];
    var contents = [];
    var uploadUser,uploadDate;
    var username;

    // console.log(users.length);
    // console.log(contents.length);
    con.query(sql2,function(err,results){
        if (err) {
            res.send("A database error occurred: " + err);
        }else{    
    
            uploadUser = results[0].uploadusername;
            uploadDate = results[0].uploaddate;
            con.query(sql,function(err,results){
                if (err){
                    res.send("A database error occurred: " + err);
                }else{
                    if(results.length>0){
                        for(var i = 0; i < results.length; i++){
                            users[i] = results[i].commentusername;
                            contents[i] = results[i].content;
                        }    
                    }
                    con.query(sql3,function(err,results){
                        if(err){
                            res.send("A database error occurred: " + err);
                        }else{
                            like_num = results.length;
                        }
                        if(req.session.username){
                            username = req.session.username;
                        }else{
                            username = "NULL";
                        }
                        res.render("image.ejs",{"user":username,"filename": filename,"users":users,"contents":contents,"uploadUser":uploadUser,"uploadDate":uploadDate,"like_num":like_num});


                    })

                   
                }
            });
            
        }
    });

});

app.post("/images/:imagename/comment", function(req, res) {
    var filename = req.params.imagename;
    var username = req.session.username;
    var comment = req.body.comment;
    var sql = `INSERT INTO comments (imagename, commentusername, content) VALUES ("${filename}", "${username}", "${comment}")`;
    var sql2 = `select commentusername,content from comments where imagename = "${filename}"`;
    var sql3 = `select uploadusername,uploaddate from images where imagename = "${filename}"`;
    var sql4 = `select * from likes where likeimagename = "${filename}"`;
    var like_num = 0;
    var users =[];
    var contents = [];
    var uploadUser,uploadDate;
    if(username){
        con.query(sql, function (err, results) {
            if (err) {
                res.send("A database error occurred: " + err);
            } else {
                console.log("Successfully uploaded comment!");                
            }
        })
        con.query(sql3,function(err,results){
            if (err) {
                res.send("A database error occurred: " + err);
            }else{    
        
                uploadUser = results[0].uploadusername;
                uploadDate = results[0].uploaddate;
                con.query(sql2,function(err,results){
                    if (err){
                        res.send("A database error occurred: " + err);
                    }else{
                        if(results.length>0){
                            for(var i = 0; i < results.length; i++){
                                users[i] = results[i].commentusername;
                                contents[i] = results[i].content;
                            }    
                        }
                        con.query(sql4,function(err,results){
                            if(err){
                                res.send("A database error occurred: " + err);
                            }else{
                                like_num = results.length;
                            }
                            res.render("image.ejs",{"filename": filename,"users":users,"contents":contents,"uploadUser":uploadUser,"uploadDate":uploadDate,"like_num":like_num});

                        })
                        
                    }
                })
                
            }
        })
    }else{
        res.redirect("/");
    }
    
});

app.post("/images/:imagename/like", function(req, res) {
    var filename = req.params.imagename;
    var username = req.session.username;
    var sql_check = `SELECT * FROM likes`;

    var found = false;
    var sql = `INSERT INTO likes (likeimagename, likeusername) VALUES ("${filename}", "${username}")`;
    var sql2 = `select commentusername,content from comments where imagename = "${filename}"`;
    var sql3 = `select uploadusername,uploaddate from images where imagename = "${filename}"`;
    var sql4 = `select * from likes where likeimagename = "${filename}"`;
    var like_num = 0;
    var users =[];
    var contents = [];
    var uploadUser,uploadDate;

    if(username){
        con.query(sql_check,function(err,results){
            if (err) {
                res.send("A database error occurred: " + err);
            }else{
                for(var i = 0 ; i < results.length ; i++){
                    if(results[i].likeimagename == filename && results[i].likeusername == username){
                        found = true;
                        console.log("You liked this image!");
                    }
                }
                if(!found){
                    con.query(sql, function (err, results) {
                        if (err) {
                            res.send("A database error occurred: " + err);
                        } else {
                            console.log("Successfully liked the image!");                
                        }
                    })
                }
            }

        })
        
            
            con.query(sql3,function(err,results){
                if (err) {
                    res.send("A database error occurred: " + err);
                }else{    
            
                    uploadUser = results[0].uploadusername;
                    uploadDate = results[0].uploaddate;
                    con.query(sql2,function(err,results){
                        if (err){
                            res.send("A database error occurred: " + err);
                        }else{
                            if(results.length>0){
                                for(var i = 0; i < results.length; i++){
                                    users[i] = results[i].commentusername;
                                    contents[i] = results[i].content;
                                }    
                            }


                            con.query(sql4,function(err,results){
                                if(err){
                                    res.send("A database error occurred: " + err);
                                }else{
                                    like_num = results.length;
                                }
                                console.log(uploadUser+uploadDate+users+contents);
                                res.render("image.ejs",{"filename": filename,"users":users,"contents":contents,"uploadUser":uploadUser,"uploadDate":uploadDate,"like_num":like_num});

                            })
                            
                        }
                    })
                    
                }
            })
    }else{
        res.redirect("/");
    }




});





// start the server
app.listen(port);
console.log("Server running on http://localhost:"+port);