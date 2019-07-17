const { db } = require('../util/admin')
exports.getAllScreams = (req, res) => {
  db
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId : doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(screams)
    })
    .catch((error) => console.error(error));
};

exports.postOneScream =  (req, res) => {
  if(req.body.body.trim() === ''){
    return res.staus(400).json({ body: 'Body must not be empty'})
  }
  const newScream = {
    body : req.body.body,
    userHandle : req.user.handle,
    createdAt : new Date().toISOString()
  }
  db
    .collection('screams')
    .add(newScream)
    .then(doc => {
      return res.json({ message : `document ${doc.id} created successfully`});
    })
    .catch((error) => {
      res.status(500).json({ error : 'something went wrong'});
      console.error(error);
    });
  }
