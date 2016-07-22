var assert = require('chai').assert
var ConsulBackupRestore = require('../src')
var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
var describe = require('mocha').describe
var after = require('mocha').after
// var before = require('mocha').before
var it = require('mocha').it
var fs = require('fs')
// var mock = require('mock-fs')

var beforeSetConsulKeysAndValues = require('./consulTestUtil').beforeSetConsulKeysAndValues
// var deleteAllKeys = require('./consulTestUtil').deleteAllKeys
var key1Value = require('./consulTestUtil').key1Value
var key2Value = require('./consulTestUtil').key2Value

describe('consul-back-restore', function () {
  it('backup & restore functions should be accesible on cbr object', function () {
    assert.isFunction(cbr.backup)
    assert.isFunction(cbr.restore)
  })
  describe('cbr.backup({})', function () {
    beforeSetConsulKeysAndValues()

    it('should be able to backup locally', function (done) {
      var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
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
    // mock({
    //   '/test': {
    //     'backup_file': '[{"LockIndex":0,"Key":"web/key1","Flags":0,"Value":"test1","CreateIndex":3378,"ModifyIndex":3378},{"LockIndex":0,"Key":"web/key2","Flags":0,"Value":"test2","CreateIndex":3379,"ModifyIndex":3379}]'
    //   }
    // })
    // before('delete all consul keys', function (done) {
    //   deleteAllKeys().then(function () { done() })
    // })
    //
    // it('should be able to restore locally', function (done) {
    //   var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
    //   cbr.restore({filePath: '/test/backup_file'}, done)
    // })
    //
    // after('the restored keys should be in consul', function () {
    //   // TODO: find keys and check their values
    //   // getKey1().then(function(){
    //   //   done()
    //   // })
    // })
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
