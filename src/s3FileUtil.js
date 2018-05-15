const s3 = require('./s3Util').s3
const fs = require('fs')
const parseUtil = require('./parseUtil')

function writeLocalFile (backupFileName, writeData, callback) {
  fs.writeFile(backupFileName, writeData, (err) => {
    if (err) callback(err)

    callback(null, `${backupFileName}`)
  })
}

function writeS3File (s3BucketName, backupFileName, writeData, callback) {
  s3.putObject({Body: writeData, Key: backupFileName, Bucket: s3BucketName}, callback)
}

exports.backup = function (keyValues, prefix, s3BucketName, filePath, callback) {
  const writeData = parseUtil.parseKeys(keyValues, (err) => {
    if (err) {
      callback(err)
    }
  })
  if (s3BucketName) {
    writeS3File(s3BucketName, filePath, writeData, (err, result) => {
      if (err) {
        callback(err)
      }
      callback(null, result)
    })
  } else {
    writeLocalFile(filePath, writeData, (err, result) => {
      if (err) {
        callback(err)
      }
      callback(null, result)
    })
  }
}
