const axios = require('axios')
const before = require('mocha').before
exports.keys = [{ key: 'bucket1/key_1', value: 'test_1' },
{ key: 'bucket1/key_2', value: 'test_2' },
{ key: 'bucket2/key_3', value: 'test_3' },
{ key: 'bucket2/key_4', value: 'test_4' },
{ key: 'bucket3/key_5', value: 'test_5' }]
exports.deleteAllKeys = deleteAllKeys

function deleteAllKeys () {
  return axios.delete('http://localhost:8500/v1/kv/?recurse')
}
function addKey ({key, value}) {
  return axios.put(`http://localhost:8500/v1/kv/${key}?`, value)
}

exports.addKeys = function () {
  return Promise.all(this.keys.map((key) => addKey(key)))
}

exports.getKeys = function () {
  return axios.get('http://localhost:8500/v1/kv/?recurse')
}

exports.beforeSetConsulKeysAndValues = function () {
  before('set keys in consul', function (done) {
    return deleteAllKeys().then(function () {
      return axios.all([
        addKey1(),
        addKey2()
      ])
    }).then(function () { done() })
  })
}

exports.beforeSetOneConsulKeysAndValues = function () {
  before('set keys in consul', function (done) {
    return deleteAllKeys().then(function () {
      return axios.all([
        addKey1()
      ])
    }).then(function () { done() })
  })
}
exports.beforeDeleteAllKeys = function () {
  before('set keys in consul', function (done) {
    return deleteAllKeys().then(function () { done() })
  })
}
