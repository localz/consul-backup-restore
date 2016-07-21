const helpers = require('./helpers')

exports.backup = function (keyValues, prefix, s3BucketName, callback) {
  const writeData = helpers.parseKeys(keyValues, (err) => {
    if (err) {
      callback(err)
    }
  })
  const backupFileName = helpers.createFileName(prefix)

  if (s3BucketName) {
    helpers.writeS3File(s3BucketName, backupFileName, writeData, (err, result) => {
      if (err) {
        callback(err)
      }
      console.log(result)
    })
  } else {
    helpers.writeLocalFile(backupFileName, writeData, (err, result) => {
      if (err) {
        callback(err)
      }
      console.log(result)
    })
  }
}
