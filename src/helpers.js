const consul = require('consul')()
const AWS = require('aws-sdk')
const fs = require('fs')


const getConsulKey = exports.getConsulKey = function (key) {
  return new Promise((resolve, reject) => {
    consul.kv.get(key, (err, result) => {
      if (err) reject(err)

      if (result) {
        resolve(JSON.stringify(result.Value))
      } else {
        resolve(undefined)
      }
    })
  })
}

// added override flag to args so its clear that the function is dependent on it?
// passed key so we can see which keys get overriden
const overrideKey = exports.overrideKey = function (key, consulValue, overrideFlag) {
  return new Promise((resolve, reject) => {
    if (consulValue) {
      if (overrideFlag) {
        resolve()
      } else {
        reject(`${key} was not restored (enable override)`)
      }
    } else {
      resolve()
    }
  })
}

const setConsulKeyValue = exports.setConsulKeyValue = function (key, backupValue) {
  return new Promise((resolve, reject) => {
    consul.kv.set(key, backupValue, (err, result) => {
      if (err) reject(err)

      result ? resolve(key) : reject(Error(key + ' was not set'))
    })
  })
}

function createFileName (prefix) {
  const date = new Date()
     // just added seconds to the end to avoid duplicates -> doesn't make too much logical sense though..
  const dateExt = `${date.getFullYear()}_${date.getMonth()}_${date.getDate()}_${date.getSeconds()}`
  return `consul_kv_backup_${prefix}_${dateExt}`
}

exports.parseOptions = function (functionCall, options, callback) {
  if (functionCall === 'restore') {
    if (options.override === 'true') options.override = true
    if (!options.override || (typeof options.override !== 'boolean')) {
      options.override = false
    }
    if (!options.path_to_file) {
      console.log(`No ${functionCall} occured`)
      console.log(`Usage: cbr.${functionCall}({path_to_file:\'path_to_file\', s3_bucket_name:\'bucket_name\'}`)
      callback(Error('Incorrect usage - path_to_file needed for restore'))
    }
  }

  // can backup/restore without prefix, this will back every key
  if (!options.prefix) {
    options.prefix = ''
  }
  if (functionCall === 'backup' && !options.filePath) {
    options.filePath = createFileName(options.prefix)
  }
  return options
}

exports.writeLocalFile = function (backupFileName, writeData, callback) {
  fs.writeFile(backupFileName, writeData, (err) => {
    if (err) callback(err)

    callback(null, `file saved as ${backupFileName}`)
  })
}

exports.writeS3File = function (s3BucketName, backupFileName, writeData, callback) {
  var s3 = new AWS.S3({params: {Bucket: s3BucketName}})
  s3.upload({Body: writeData, Key: backupFileName})
      .on('httpUploadProgress', function (evt) { console.log(evt) })
      .send(function (err, writeData) { callback(err, writeData) })
}

exports.parseKeys = function (keys, cb) {
  if (keys.length === 0) return cb(Error('No keys found to backup!'))

  var writeData = ''
  keys.map((e) => {
    writeData += JSON.stringify(e) + '\n'
  })
  return writeData
}

exports.consulBackup = function (rawData, override, callback) {
  var keyValues = rawData.toString('utf-8').split('\n')
  if (keyValues.last === undefined) {
    keyValues.pop() // pop last value as its a newline
  }
  keyValues.map((kv) => {
    const key = JSON.parse(kv).Key
    const backupValue = JSON.parse(kv).Value

    getConsulKey(key)
           .then((consulValue) => overrideKey(key, consulValue, override))
           .then(() => setConsulKeyValue(key, backupValue))
           .then((restoredKey) => callback(null, `Key ${restoredKey} was restored`))
           .catch((e) => callback(e))
  })
}
