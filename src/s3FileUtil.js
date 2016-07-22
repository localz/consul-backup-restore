const AWS = require('aws-sdk')
const fs = require('fs')
const parseUtil = require('./parseUtil')

function writeLocalFile (backupFileName, writeData, callback) {
  fs.writeFile(backupFileName, writeData, (err) => {
    if (err) callback(err)

    callback(null, `${backupFileName}`)
  })
}

function writeS3File (s3BucketName, backupFileName, writeData, callback) {
  var s3 = new AWS.S3({params: {Bucket: s3BucketName}})
  s3.upload({Body: writeData, Key: backupFileName})
      .on('httpUploadProgress', function (evt) { console.log(evt) })
      .send(function (err, writeData) { callback(err, writeData) })
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
