const helpers = require('./helpers')

exports.backup = function (keyValues, prefix, s3BucketName, filePath, callback) {
  const writeData = helpers.parseKeys(keyValues, (err) => {
    if (err) {
      callback(err)
    }
  })

  if (s3BucketName) {
    helpers.writeS3File(s3BucketName, filePath, writeData, (err, result) => {
      if (err) {
        callback(err)
      }
      console.log(result)
    })
  } else {
    helpers.writeLocalFile(filePath, writeData, (err, result) => {
      if (err) {
        callback(err)
      }
      console.log(result)
    })
  }
}
