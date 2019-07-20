const {
  admin,
  db
} = require('../util/admin');

const firebase = require('firebase');
const config = require('../util/config')

const {
  validateSignUpData,
  validateLoginData
} = require('../util/validators')

firebase.initializeApp(config);
exports.signUp = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  }

  //Todo validate data

  const {
    valid,
    errors
  } = validateSignUpData(newUser);

  if (!valid) {
    return res.status(400).json(errors);
  }

  let token, userId;
  db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
      if (doc.exists) {
        return res
          .status(400)
          .json({
            handle: 'This handle is already taken'
          })
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/no-img.png?alt=media`
      }
      return db.doc(`/users/${newUser.handle}`).set(userCredentials)
    })
    .then(() => {
      return res.status(200).json({
        token
      })
    })
    .catch((error) => {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        return res.status(400).json({
          email: 'Email is already in use'
        })
      }
      return res.status(500).json({
        error: error.code
      })
    })
}

exports.logIn = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  const {
    valid,
    errors
  } = validateLoginData(user);

  if (!valid) {
    return res.status(400).json(errors);
  }

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({
        token
      });
    })
    .catch((err) => {
      console.log(err)
      if (err.code = "auth/wrong-password") {
        return res.status(403).json({
          general: "Worng credentials, please try again"
        });
      } else return res.status(500).json({
        error: err.code
      });
    });
}

exports.uploadImage = (req, res) => {
  const BusBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');
if(req.method === "POST"){
  const busboy = new BusBoy({
    headers: req.headers
  });

  let imageFileName;
  let imageToBeUploaded = {}

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    console.log(filename);
    console.log(fieldname);
    console.log(mimetype);
    //my.image.png
    const imageExtesnsion = filename.split('.')[filename.split('.').length - 1];
    // 33334499499.png
    imageFileName = `${Math.round(Math.random()*100000000000)}.${imageExtesnsion}`;
    const filepath = path.join(os.tempdir(), imageFileName);
    imageToBeUploaded = {
      filepath,
      mimetype
    };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on('finish', () => {
      admin.storage().bucket().upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
            contentType: imageToBeUploaded.mimetype
        }
      })
    })
    .then(() => {
      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
      return db.doc(`/users/${req.user.handle}`).update({
        imageUrl
      });
    })
    .then(() => {
      return res.json({
        message: 'Image uploaded successfully'
      });
    })
    .catch(err => {
      console.log(err);
      return res.status(500).json({
        error: err.code
      })
    })
  return req.pipe(busboy)
}
  
}