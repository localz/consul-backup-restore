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

  function getConsulKey (key) {
    return new Promise((resolve, reject) => {
      consulInstance.kv.get(key, (err, result) => {
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
  function overrideKey (key, consulValue, overrideFlag) {
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

  function setConsulKeyValue (key, backupValue) {
    return new Promise((resolve, reject) => {
      consulInstance.kv.set(key, backupValue, (err, result) => {
        if (err) reject(err)

        result ? resolve(key) : reject(Error(key + ' was not set'))
      })
    })
  }
}
