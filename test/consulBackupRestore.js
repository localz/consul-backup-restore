var assert = require('chai').assert
var ConsulBackupRestore = require('../src')
var cbr = new ConsulBackupRestore({host: 'localhost', Port: 8500})
var describe = require('mocha').describe
var after = require('mocha').after
var it = require('mocha').it
var fs = require('fs')

var beforeSetConsulKeysAndValues = require('./consulUtil').beforeSetConsulKeysAndValues
var key1Value = require('./consulUtil').key1Value
var key2Value = require('./consulUtil').key2Value

describe('consul-back-restore', function () {
  it('backup & restore functions should be accesible on cbr object', function () {
    assert.isFunction(cbr.backup)
    assert.isFunction(cbr.restore)
  })
  describe('cbr.backup({})', function () {
    beforeSetConsulKeysAndValues()

    it('should be able to backup locally', function (done) {
      var cbr = new ConsulBackupRestore({Host: 'localhost', Port: 8500})
      cbr.backup({}, function (err, result) {
        if (err) { done(err) }
        fs.readFile(result, 'utf8', (err, result) => {
          if (err) { done(err) }
          var re1 = new RegExp(key1Value)
          var re2 = new RegExp(key2Value)
          if (result.match(re1) && result.match(re2)) {
            done()
          } else {
            done(new Error('did not backup correctly check key store'))
          }
        })
      })
    })
  })

  describe('cbr.restore({})', function () {
    it('should be able to restore locally')
  })

  after('delete all local files created', function () {
    (fs.readdirSync('./')).map((e) => {
      if (e.match(/consul_kv_backup/)) {
        fs.unlink(e, function (err, res) {
          if (err) console.log(err)
        })
      }
    })
  })
})
