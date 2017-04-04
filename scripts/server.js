'use strict';

var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),

    _mongoDb = require('mongodb'),
    MongoClient = _mongoDb.MongoClient,
    ObjectID = _mongoDb.ObjectID,

    EventEmitter = require('events'),
    emitter = new EventEmitter(),

    assert = require('assert'),

    config = require('../etc/config.json')
    ;

var mongoDb;

app.set('config', config);
app.use(bodyParser.urlencoded({extended: false}));

function initApp() {
  var connectMongo = new Promise(function(resolve, reject) {
    MongoClient.connect(config.mongo.uri, function(err, db) {
      assert.equal(null, err);
      resolve(db);
    });
  });
  connectMongo.then(
    function(db){
      mongoDb = db;
      emitter.emit('init', 'mongo');
    },
    function(err){
      console.log('mongo error');
      process.exit(1);
    }
  );
}

app.get('/report.json', function(req, res) {

  var ExecutorId = parseInt(req.query.ExecutorId);
  assert(ExecutorId > 0);

  var emitter = new EventEmitter();
  var tasks = mongoDb.collection('tasks');
  var taskItems = [];

  emitter.on('response', function(type){
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(taskItems));
  });

  // {ExecutorIds: ExecutorId},
  var filter = {
    Expenses: {
      $elemMatch: {
        UserId: ExecutorId,
        Date: {
          $gte: req.query.start + 'T00:00:00',
          $lte: req.query.end + 'T23:59:59'
        }
      },
    }
  };

  // console.log(JSON.stringify(filter, null, 4));

  var cursor = tasks.find(filter, {Created: 1, Creator: 1, Expenses: 1, ExecutorIds: 1, Name: 1, Id: 1, StatusId: 1, TypeId: 1});

  cursor.toArray(function(err, tasks){
    assert.equal(null, err);
    taskItems = [];
    for(var i in tasks) {
      var task = tasks[i];

      if(typeof task.Expenses !== 'undefined' && task.Expenses.length) {

        for(var i2 in task.Expenses) {
          var expense = task.Expenses[i2];
          if(expense.UserId != ExecutorId) continue;

          var expHours = Math.round(expense.Minutes / 6) / 10;
          var event = {
            title: task.Name,
            start: expense.Date.substr(0,10),
            className: 'task-status--' + task.StatusId,
            data: {
              url: config.helpdesk.taskUri.replace('{taskid}', task.Id),
              expHours: expHours
            }
          };

          taskItems.push(event);
        }
      }

    }




    emitter.emit('response');
  });

});


app.get('/users.json', function(req, res) {
  var emitter = new EventEmitter();
  var users = mongoDb.collection('users');
  var userItems = {};

  emitter.on('response', function(){
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({users: userItems}));
  });

  var usersIDs = Object.keys(config.report.users).map(function (val) { return parseInt(val); });

  var cursor = users.find({Id: {$in: usersIDs}});

  cursor.each(function(err, user){
    if(user == null) {
      emitter.emit('response');
    } else {
      // сливаем параметры из конфига с параметрами из БД
      user = Object.assign(config.report.users[user.Id], user);
      userItems[user.Id] = user;
    }
  });
});

initApp();

// Статика
app.use(express.static('public_html'));
app.listen(config.web.port);
