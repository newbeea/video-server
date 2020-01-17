var express    = require('express')
var serveIndex = require('serve-index')
var multer = require('multer')
var app = express()
var fork = require('child_process').fork
var progress = {}
var storage = multer.diskStorage({
  destination: 'uploads',
  filename: function (req, file, cb) {
    console.log(file)
    cb(null, file.originalname)
  }
})

var upload = multer({ storage: storage })

// Serve URLs like /ftp/thing as public/ftp/thing
// The express.static serves the file contents
// The serveIndex is this module serving the directory
app.use('/video', express.static('video/'), serveIndex('video/', {'icons': true}))

app.post('/upload', upload.single('torrent'), function (req, res) {
  var download = fork('../download.js', ['../' + req.file.path], {
    cwd: 'video/'
  })
  download.on('message', function(message) {
    console.log(message)
    Object.assign(progress, message)
  })
  res.send(req.file)
})
app.get('/progress', function (req, res) {
  res.send(progress)
})
app.use('/', express.static('public/'))
// Listen
app.listen(3000)