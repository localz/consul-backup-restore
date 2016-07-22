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

exports.restoreKeyValues = function (consulInstance, rawData, override, callback) {
  var keyValues = JSON.parse(rawData.toString('utf-8'))

  async.map(keyValues, setConsulAndCheckOverride.bind(override), (err, kv) => {
    if (err) { callback(err) }
    callback(null, kv)
  })

  function setConsulAndCheckOverride (kv, callback) {
    const key = kv.Key
    const backupValue = kv.Value

    getConsulKey(key)
      .then((consulValue) => overrideKey(key, consulValue, override))
      .then((willSetKey) => setConsulKeyValue(willSetKey, key, backupValue))
      .then((restoredKey) => callback(null, `${restoredKey}`))
      .catch((e) => callback(e))
  }

  function getConsulKey (key) {
    return new Promise((resolve, reject) => {
      consulInstance.kv.get(key, (err, result) => {
        if (err) reject(err)

        if (result) {
          resolve(JSON.stringify(result.Value))
        } else {
          resolve(null)
        }
      })
    })
  }

  // added override flag to args so its clear that the function is dependent on it?
  // passed key so we can see which keys get overriden
  function overrideKey (key, consulValue, overrideFlag) {
    return new Promise((resolve, reject) => {
      if (consulValue) {
        if (overrideFlag) {
          resolve(true)
        } else {
          resolve(false)
        }
      } else {
        resolve(true)
      }
    })
  }

  function setConsulKeyValue (willSetKey, key, backupValue) {
    return new Promise((resolve, reject) => {
      if (willSetKey) {
        consulInstance.kv.set(key, backupValue, (err, result) => {
          if (err) reject(err)
          if (result) resolve(key)
        })
      } else {
        reject()
      }
    })
  }
}
