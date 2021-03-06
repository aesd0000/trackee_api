var uuid = require('node-uuid');
var JSONStream = require('JSONStream');
var express = require('express');
var router = express.Router();
var base64 = require('base64-stream');

router.get('/data/:id?', function (req, res) {
  var key = req.params.id ? req.params.id : '';
  var collection = req.collection;
  var opt = { limit: 10 };
  if (req.query.limit) {
    var limit = parseInt(req.query.limit);
    if (limit != -1) {
      opt['limit'] = limit ? limit : 10;
    }
  }
  if (key == '') {
    collection.find({}, opt)
      .pipe(JSONStream.stringify())
      .pipe(res);
  } else {
    collection.findOne({ "_id": key }, opt, function (err, doc) {
      if (!err) {
        if (!doc) {
          res.json({
            'ok': false,
            'message': 'Not Found'
          });
        } else {
          res.json(doc);
        }
      } else {
        res.json({
          'ok': false,
          'message': err
        });
      }
    });
  }
});

router.post('/data/:id?', function (req, res) {
  var key = req.params.id ? req.params.id : '';
  key = (key == '') ? {} : {
    "_id": key
  };
  var value = req.body;
  var collection = req.collection;
  if (!key._id) {
    key['_id'] = uuid.v1().replace(/-/g, '');
    value['_id'] = key['_id'];
  }


  var base64 = new Buffer(value.password, 'utf8')
  var encodePassword = base64.toString('base64');

  let form = {
    username: value.username,
    password: encodePassword
  }

  collection.update(key, form, {
    'upsert': true
  }, function (err, resc) {
    if (err) {
      res.json({
        'ok': false,
        'message': err
      });
    } else {
      var result = resc.result;
      res.json({
        'ok': result.ok == 1 ? true : false,
        'key': key['_id']
      });
    }
  });
});

router.post('/remove', function (req, res) {
  var key = req.params.id;
  var collection = req.collection;
  collection.deleteOne({ '_id': key }, function (err, resc) {
    if (err) {
      res.json({
        'ok': false,
        'message': err
      });
    } else {
      var result = resc.result;
      res.json({
        'ok': result.ok == 1 ? true : false,
        'key': key
      });
    }
  });
});

router.post('/query_test', function (req, res) {
  var collection = req.collection;
  var body = req.body;
  var limit = 0;
  limit = body.limit ? parseInt(body.limit) : 0;


  if (body.distinct) {
    collection.distinct(body.distinct, body.query).then(function (docs) {
      res.json(docs);
    });
  } else {
    collection.find(body.query, body.projection)
      .limit(limit)
      .pipe(JSONStream.stringify())
      .pipe(res);
  }
});

router.post('/query', function (req, res) {
  var collection = req.collection;
  var body = req.body;
  var limit = 0;
  limit = body.limit ? parseInt(body.limit) : 0;

  let form = {
    track: body.track
  }

  collection.findOne(form).then(function (docs) {
    res.json(docs);
  })

});


router.post('/query_all_track', function (req, res) {
  var collection = req.collection;
  var body = req.body;
  var limit = 0;
  limit = body.limit ? parseInt(body.limit) : 0;

  collection.find()
  .limit(limit)
  .pipe(JSONStream.stringify())
  .pipe(res);
  });


  router.post('/find_update', function (req, res) {
    var collection = req.collection;
    var body = req.body;

  
    let update = {table:
      {
        date:body.date,
        time:body.time,
        detail:body.detail,
        province_log:body.province_log
      }
  }
    
    let form = {
      track: body.track
    }
  
    collection.findOneAndUpdate(form, {$push:update}, {new: false}, (err, doc)=> {
      res.json(doc.value);
      if (err) {
          console.log("Something wrong when updating data!");
      }
    })

  });


module.exports = router;