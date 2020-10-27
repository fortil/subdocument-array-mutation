const express = require('express')
const bodyParser = require('body-parser')
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')
const data = require('./data');
const mixins = require('./mixins');

const version = '/api/v1';

const url = route => `${version}${route}`;

// Create server
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Create database instance and start server
const adapter = new FileAsync('db.json')
app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/', (_, res) => res.json({ data: 'Hello world', time: (new Date()).getTime() }));

const App = low(adapter)
  .then(db => {
    // Set db default values
    db.defaults({ arrayToUse: '' }).write();

    /* 
    Personal mixin
    */
    db._.mixin(mixins(db));

    // Routes
    app.post(url('/:array'), data(db));
    
    return app;
  });
  
module.exports = App;