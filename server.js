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
app.get('/video/*.mp4', function (req, res) {
  const url = req.url.replace('video', 'data')
  const body = `
        <head>
          <title>VIDEO</title>
        </head>
        <body style="padding-top: 100px;">
          <p align="center">
            <video   width="90%"  autoplay="autoplay" controls="controls" id="videoElement"></video>
          </p>
          <h1 align="center">${url}</h1>
        </body>
        <script src="https://cdn.bootcss.com/flv.js/1.5.0/flv.min.js"></script>
        <script>
          if (flvjs.isSupported()) {
            var videoElement = document.getElementById('videoElement');
            var flvPlayer = flvjs.createPlayer({
              type: 'mp4',
              url: '${url}'
            });
            flvPlayer.attachMediaElement(videoElement);
            flvPlayer.load();
            flvPlayer.play();
          }
        </script>
        </html>`
  res.send(body)
})
app.use('/data', express.static('video/'))
// Serve URLs like /ftp/thing as public/ftp/thing
// The express.static serves the file contents
// The serveIndex is this module serving the directory
app.use('/video', express.static('video/'), serveIndex('video/', {'icons': true}))

app.post('/upload', upload.single('torrent'), function (req, res) {
  var download = fork('../download.js', ['../' + req.file.path], {
    cwd: 'video/',
    stdio: 'ignore'
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