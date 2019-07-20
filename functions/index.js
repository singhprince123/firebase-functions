const functions = require('firebase-functions');
const express = require('express');

const { getAllScreams, postOneScream } = require('./handlers/screams');
const { signUp, logIn , uploadImage} = require('./handlers/users');

const app = express();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions


const FBAuth = require('./util/fbauth');

// Users Route
app.post('/signup', signUp);
app.post('/login', logIn);
app.post('/user/image',FBAuth, uploadImage);

// Scramse Route
app.get('/screams', getAllScreams);
app.post('/screams' , FBAuth , postOneScream);


// https://baseurl.com/api/

exports.api = functions.https.onRequest(app);