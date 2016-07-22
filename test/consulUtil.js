var axios = require('axios')
var before = require('mocha').before
var key1Value = 'test1'
var key2Value = 'test2'
exports.key1Value = key1Value
exports.key2Value = key2Value

function deleteAllKeys () {
  return axios.delete('http://localhost:8500/v1/kv/?recurse')
}
function addKey1 () {
  return axios.put('http://localhost:8500/v1/kv/web/key1?', {
    value: key1Value
  })
}
function addKey2 () {
  return axios.put('http://localhost:8500/v1/kv/web/key2?', {
    value: key2Value
  })
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
