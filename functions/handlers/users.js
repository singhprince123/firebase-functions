const { db } = require('../util/admin');

const firebase = require('firebase');
const config = require('../util/config')

const { validateSignUpData , validateLoginData } = require('../util/validators')

firebase.initializeApp(config);
exports.signUp = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  }

  //Todo validate data

  const { valid , errors } = validateSignUpData(newUser);

  if(!valid){
    return res.status(400).json(errors);
  }

  let token, userId;
  db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
      if(doc.exists){
        return res
          .status(400)
          .json({handle: 'This handle is already taken'})
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
        userId
      }
      return db.doc(`/users/${newUser.handle}`).set(userCredentials)
    })
    .then(() => {
      return res.status(200).json({ token })
    })
    .catch((error) => {
      console.error(error);
      if(error.code === "auth/email-already-in-use"){
        return res.status(400).json({ email: 'Email is already in use'})
      }
      return res.status(500).json({ error: error.code })
    })
  }

  exports.logIn =  (req, res) => {
    const user = {
      email: req.body.email,
      password: req.body.password
    };

    const { valid , errors } = validateLoginData(user);

    if(!valid){
    return res.status(400).json(errors);
    }
  
    firebase
      .auth()
      .signInWithEmailAndPassword(user.email, user.password)
      .then((data) => {
        return data.user.getIdToken();
      })
      .then((token) => {
        return res.json({ token });
      })
      .catch((err) => {
        console.log(err)
        if(err.code = "auth/wrong-password"){
          return res.status(403).json({ general : "Worng credentials, please try again"});
        }else return res.status(500).json({ error: err.code });
      });
    }