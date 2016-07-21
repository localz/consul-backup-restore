// const overrideKey       = require('./helpers').overrideKey
// const setConsulKeyValue = require('./helpers').setConsulKeyValue
// const getConsulKey      = require('./helpers').getConsulKey
const helpers = require('./helpers')
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
  options = helpers.parseOptions('backup', options, (err) => {
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
    s3FileUtil.backup(keyValues, options.prefix, options.s3BucketName, (err) => {
      if (err) {
        callback(err)
      }
      callback(null)
    })
  })
}

ConsulBackupRestore.prototype.restore = function (options, callback) {
  options = helpers.parseOptions('restore', options, (err) => {
    if (err) callback(err)
  })
  console.log('restoring...')

  if (options.s3_bucket_name) {
    const s3 = new AWS.S3({params: {Bucket: options.s3_bucket_name}})
    s3.getObject({Bucket: options.s3_bucket_name, Key: options.path_to_file}, (err, data) => {
      if (err) callback(err)
      helpers.consulBackup(data.Body, options.override, (err, result) => {
        if (err) callback(err)
        if (result) console.log(result)
      })
    })
  } else {
    fs.readFile(options.path_to_file, 'utf8', (err, data) => {
      if (err) callback(err)
      helpers.consulBackup(data, options.override, (err, result) => {
        if (err) callback(err)
        if (result) console.log(result)
      })
    })
  }
  callback(null)
}

exports.ConsulBackupRestore = ConsulBackupRestore
