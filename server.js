// Creating the express app:
const express = require("express");
const app = express();
// Requring destructed DB function
const {
    getAllImages,
    insertimages,
    getOneImage,
    addComments,
    chooseComments,
    getMoreImages,
} = require("./db");
const s3 = require("./s3");
const { s3Url } = require("./config.json");

//-----Start-----// the below code is required tp upload
const multer = require("multer"); // This talk with harddrive for uploading the file
const uidSafe = require("uid-safe"); // ramdomly generate unique string
const path = require("path");

const diskStorage = multer.diskStorage({
    //diskstorage
    destination: function (req, file, callback) {
        callback(null, __dirname + "/uploads");
    },
    filename: function (req, file, callback) {
        //uidsafe: unique name is generate every single we upload file..! that is 24 character long
        uidSafe(24).then(function (uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    },
});
//--- Creating an object uploader.. This is going to allows to upload the files  into upload with uniques file name..!
//-- It is reponsible for talk with hard drive for uploading
const uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 2097152, // FIle size constrains... Max size 2Mb file can be uploaded..! This will automatically give an error .!
    },
});
//-----END--------//
app.use(express.json());
// To srve static files from public folder
app.use(express.static("public"));

// We are running as a Middleware..!
//uploader runs and upload the file into upload directory..!
app.post("/upload", uploader.single("file"), s3.upload, (req, res) => {
    console.log("upload worked!");

    // here we are going to insert the title, desc, username and filename to the database!!
    console.log("req.body:", req.body); // containt title, description and username
    console.log("req.file:", req.file); //req.file represnts the file that was uploaded..!
    if (req.file) {
        // this will run if everything worked
        const { title, description, username } = req.body;
        const { filename } = req.file;
        const fullUrl = s3Url + filename;
        console.log("fullUrl:", fullUrl);
        //insert into images
        if (!title || !username) {
            return res.status(404).json({
                error: " Title or Username is empty",
            });
        }
        insertimages(title, description, username, fullUrl)
            .then((results) => {
                console.log("results:", results);
                res.json(results.rows[0]);
            })
            .catch((error) => {
                console.log("Error in POST /upload req.file", error);
            });
        //send back a reponse to Vue using res.json
    } else {
        // this will run if something fail..!
        //send back a reponse to Vue using res.json
        // the response we send back needs to be somthing that indicate that the upload didnt work..!
        res.json({
            success: false,
        });
    }
});

// Creating /images routes:
app.get("/image", (req, res) => {
    console.log("A GET request was made to /images route");
    getAllImages()
        .then((data) => {
            //logging the data
            console.log("data", data);
            res.json({
                message: "success",
                images: data.rows, // storing the images data in image
            });
        })
        .catch((error) => {
            console.log("Error in getting the image from DataBase:", error);
        });
});

app.get("/image/:imageId", (req, res) => {
    getOneImage(req.params.imageId)
        .then((results) => {
            res.json(results.rows[0]);
        })
        .catch((error) => {
            console.log("Error in GET /image/:imageId route", error);
        });
});

app.get("/comments/:imageId", (req, res) => {
    chooseComments(req.params.imageId)
        .then((results) => {
            res.json(results.rows);
        })
        .catch((error) => {
            console.log("Error in GET /comments/:imageId  :", error);
        });
});

app.post("/comment", (req, res) => {
    console.log("req.body /POST /comment:", req.body);
    const { username, comment_text: commentText, image_id: imageId } = req.body;
    addComments(username, commentText, imageId)
        .then((results) => {
            console.log("Results.rows:", results.rows);
            res.json(results.rows[0]);
        })
        .catch((error) => {
            console.log("Error in POST /comment route", error);
        });
});

app.get("/moreImages/:lowestId", (req, res) => {
    console.log("a GET was sent to /moreImages/:lowestId route");
    console.log("req.params.lowestId: ", req.params.lowestId);
    console.log("req.params:", req.params);
    getMoreImages(req.params.lowestId)
        .then((results) => {
            console.log("results:", results.rows);
            res.json(results.rows);
        })
        .catch((error) => {
            console.log("Error in GET loadMoreImages/:lowestId: ", error);
        });
});

app.listen(8080, () => {
    console.log("Image-Board Listening");
});
