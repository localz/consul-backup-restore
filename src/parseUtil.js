const {get} = require('lodash')

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
      var incorrectUsageString = `No ${functionCall} occured, file path was not found\n`
      incorrectUsageString += `Usage: cbr.${functionCall}({filePath:'filePath', s3BucketName:'s3BucketName'})`
      return callback(Error(incorrectUsageString))
    }
  }

  // can backup/restore without prefix, this will back every key
  if (!options.prefix) {
    options.prefix = ''
  }
  if (functionCall === 'backup' && !options.filePath) {
    options.filePath = createFileName(options.prefix)
  }
  return callback(null, options)
}

exports.parseKeys = function (keys, cb) {
  if (get(keys.length, 0) === 0) console.log('WARN: There were no keys found to backup')
  return JSON.stringify(keys)
}
