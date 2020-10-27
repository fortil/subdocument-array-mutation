const App = require('./src/bootstrap')

if (require.main === module) {
  App.then(app => {
    app.listen(8080, () => console.log('\x1b[32m', `listening on port 8080`, '\x1b[0m', ''))
  });
}