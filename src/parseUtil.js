function createFileName (prefix) {
  const date = new Date()
  const dateExt = `${date.getFullYear()}_${date.getMonth()}_${date.getDate()}` +
                  `_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}`
  return `consul_kv_backup_${prefix}_${dateExt}`
}

exports.parseOptions = function (functionCall, options, callback) {
  if (functionCall === 'restore') {
    if (options.override === 'true') {
      options.override = true
    }
    if (!options.override || (typeof options.override !== 'boolean')) {
      options.override = false
    }
    if (!options.filePath) {
      console.log(`No ${functionCall} occured`)
      console.log(`Usage: cbr.${functionCall}({filePath:\'filePath\', s3BucketName:\'s3BucketName\'}`)
      callback(Error('Incorrect usage - filePath needed for restore'))
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

exports.parseKeys = function (keys, cb) {
  if (keys.length === 0) return cb(Error('No keys found to backup!'))

  var writeData = ''
  keys.map((e) => {
    writeData += JSON.stringify(e) + '\n'
  })
  return writeData
}
