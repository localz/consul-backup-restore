const parseUtil = require('./parseUtil')
const consulUtil = require('./consulUtil')
const s3FileUtil = require('./s3FileUtil')

const consul = require('consul')
const { s3 } = require('./s3Util')
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
  parseUtil.parseOptions('backup', options, (err, parsedOptions) => {
    if (err) {
      return callback(err)
    }
    consulUtil.getKeyValues(this.consulInstance, parsedOptions.prefix, (err, keyValues) => {
      if (err) {
        return callback(err)
      }
      s3FileUtil.backup(keyValues, parsedOptions.prefix, parsedOptions.s3BucketName, parsedOptions.filePath, callback)
    })
  })
}

ConsulBackupRestore.prototype.restore = function (options, callback) {
  parseUtil.parseOptions('restore', options, (err, parsedOptions) => {
    if (err) {
      return callback(err)
    }

    const prefix = parsedOptions.prefix ? parsedOptions.prefix : null
    if (parsedOptions.s3BucketName) {
      s3.getObject({Bucket: parsedOptions.s3BucketName, Key: parsedOptions.filePath}, (err, data) => {
        if (err) return callback(err)
        else {
          consulUtil.restoreKeyValues(this.consulInstance, data.Body, prefix, parsedOptions.override, (err, result) => {
            if (err) {
              return callback(err)
            }
            var blanksRemoved = result.filter((e) => e !== null)
            callback(null, blanksRemoved)
          })
        }
      })
    } else {
      fs.readFile(parsedOptions.filePath, 'utf8', (err, data) => {
        if (err) {
          return callback(err)
        }
        if (data) {
          consulUtil.restoreKeyValues(this.consulInstance, data, prefix, parsedOptions.override, (err, result) => {
            if (err) {
              return callback(err)
            }
            var blanksRemoved = result.filter((e) => e !== null)
            callback(null, blanksRemoved)
          })
        }
      })
    }
  })
}

exports.ConsulBackupRestore = ConsulBackupRestore
