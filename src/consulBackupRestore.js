const parseUtil = require('./parseUtil')
const consulUtil = require('./consulUtil')
const s3FileUtil = require('./s3FileUtil')

const consul = require('consul')
const AWS = require('aws-sdk')
const fs = require('fs')

function ConsulBackupRestore (options) {
  this.options = options || {}
  // TODO: consul by default can take in a lot more items
  this.consulInstance = consul({
    host: options.host,
    port: options.port,
    secure: options.secure
  })
}

ConsulBackupRestore.prototype.backup = function (options, callback) {
  // parse options & santizes
  options = parseUtil.parseOptions('backup', options, (err) => {
    if (err) {
      callback(err)
    }
  })
  console.log('backing up...')

  consulUtil.getKeyValues(this.consulInstance, options.prefix, (err, keyValues) => {
    if (err) {
      callback(err)
    }
    console.log(keyValues)
    s3FileUtil.backup(keyValues, options.prefix, options.s3BucketName, options.filePath, (err) => {
      if (err) {
        callback(err)
      }
      callback(null)
    })
  })
}

ConsulBackupRestore.prototype.restore = function (options, callback) {
  options = parseUtil.parseOptions('restore', options, (err) => {
    if (err) callback(err)
  })
  console.log('restoring...')

  if (options.s3BucketName) {
    const s3 = new AWS.S3({params: {Bucket: options.s3BucketName}})
    s3.getObject({Bucket: options.s3BucketName, Key: options.filePath}, (err, data) => {
      if (err) callback(err)
      consulUtil.restoreKeyValues(this.consulInstance, data.Body, options.override, (err, result) => {
        if (err) {
          callback(err)
        }
        if (result) {
          console.log(result)
        }
      })
    })
  } else {
    fs.readFile(options.filePath, 'utf8', (err, data) => {
      if (err) callback(err)
      consulUtil.restoreKeyValues(this.consulInstance, data, options.override, (err, result) => {
        if (err) {
          callback(err)
        }
        if (result) {
          console.log(result)
        }
      })
    })
  }
  callback(null)
}

exports.ConsulBackupRestore = ConsulBackupRestore
