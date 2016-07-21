const async = require('async')

exports.getKeyValues = function (consulInstance, prefix, callback) {
  consulInstance.kv.keys(prefix, (err, keys) => {
    if (err) {
      throw err
    }
    // map over array of keys
    async.map(keys, getKeyValue, (err, keyValues) => {
      if (err) {
        throw err
      }
      callback(null, keyValues)
    })
  })

  function getKeyValue (key, callback) {
    consulInstance.kv.get(key, (err, keyValue) => {
      if (err) {
        throw err
      }
      callback(null, keyValue)
    })
  }
}
