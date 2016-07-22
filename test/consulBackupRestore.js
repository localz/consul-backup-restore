var assert = require('chai').assert
var ConsulBackupRestore = require('../src')
var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
var describe = require('mocha').describe
var after = require('mocha').after
var it = require('mocha').it
var fs = require('fs')
var mock = require('mock-fs')
var axios = require('axios')

var consulTestUtil = require('./consulTestUtil')

var changedValue = 'changedValue'
var newKey1 = 'newKey1'
var newKey2 = 'newKey2'
mock({
  '/test': {
    'cbr_key1_key2': `[{"LockIndex":0,"Key":"web/key1","Flags":0,"Value":"${consulTestUtil.key1Value}","CreateIndex":3378,"ModifyIndex":3378},{"LockIndex":0,"Key":"web/key2","Flags":0,"Value":"${consulTestUtil.key2Value}","CreateIndex":3379,"ModifyIndex":3379}]`,
    'cbr_changed_key2': `[{"LockIndex":0,"Key":"web/key1","Flags":0,"Value":"${changedValue}","CreateIndex":3378,"ModifyIndex":3378},{"LockIndex":0,"Key":"web/key2","Flags":0,"Value":"${consulTestUtil.key2Value}","CreateIndex":3379,"ModifyIndex":3379}]`,
    'cbr_newKey1_newKey2': `[{"LockIndex":0,"Key":"web/key1","Flags":0,"Value":"${newKey1}","CreateIndex":3378,"ModifyIndex":3378},{"LockIndex":0,"Key":"web/key2","Flags":0,"Value":"${newKey2}","CreateIndex":3379,"ModifyIndex":3379}]`
  }
})

describe('consul-back-restore', function () {
  it('backup & restore functions should be accesible on cbr object', function () {
    assert.isFunction(cbr.backup)
    assert.isFunction(cbr.restore)
  })
  describe('cbr.backup({})', function () {
    consulTestUtil.beforeSetConsulKeysAndValues()

    it('should be able to backup locally', function (done) {
      var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
      cbr.backup({}, function (err, result) {
        if (err) { done(err) }
        fs.readFile(result, 'utf8', (err, result) => {
          if (err) { done(err) }
          var re1 = new RegExp(consulTestUtil.key1Value)
          var re2 = new RegExp(consulTestUtil.key2Value)
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
    consulTestUtil.beforeDeleteAllKeys()

    it('should be able to restore locally', function (done) {
      var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
      cbr.restore({filePath: '/test/cbr_key1_key2'}, function (err, result) {
        if (err) console.log(err)
        assert.equal(result.length, 2)
        done()
      })
    })

    after('two keys should be restored to consul', function (done) {
      return axios.get('http://localhost:8500/v1/kv/?recurse').then(function (response) {
        if (response.data.length === 2) {
          // console.log(decodeURIComponent(response.data[0].Value))
          var recievedK1 = (new Buffer(response.data[0].Value, 'base64')).toString('utf8')
          var recievedK2 = (new Buffer(response.data[1].Value, 'base64')).toString('utf8')
          if (recievedK1 === consulTestUtil.key1Value && recievedK2 === consulTestUtil.key2Value) {
            done()
          }
        }
      })
    })
  })

  describe('cbr.restore({}), with one key already existing (and not overwrite)', function () {
    consulTestUtil.beforeSetOneConsulKeysAndValues()

    it('Should only restore one key when one already exists', function (done) {
      var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
      cbr.restore({filePath: '/test/cbr_key1_key2'}, function (err, result) {
        if (err) done(err)
        assert.equal(result.length, 1) // should only return one key
        done()
      })
    })

    after('consul should have two correct keys', function (done) {
      return axios.get('http://localhost:8500/v1/kv/?recurse').then(function (response) {
        if (response.data.length === 2) {
          // receivedK1 should not be changedValue should be still original
          var recievedK1 = (new Buffer(response.data[0].Value, 'base64')).toString('utf8')
          var recievedK2 = (new Buffer(response.data[1].Value, 'base64')).toString('utf8')
          if (recievedK1 === consulTestUtil.key1Value && recievedK2 === consulTestUtil.key2Value) {
            done()
          }
        }
      })
    })
  })

  describe('cbr.restore({override:true}), with one key already existing (and override)', function () {
    consulTestUtil.beforeSetOneConsulKeysAndValues()

    it('Should only restore one key when one already exists', function (done) {
      var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
      cbr.restore({filePath: '/test/cbr_changed_key2', override: true}, function (err, result) {
        if (err) done(err)
        assert.equal(result.length, 2) // should return 2 keys
        done()
      })
    })

    after('consul should have two correct keys', function (done) {
      return axios.get('http://localhost:8500/v1/kv/?recurse').then(function (response) {
        if (response.data.length === 2) {
          // recievedK1 should be changedValue
          var recievedK1 = (new Buffer(response.data[0].Value, 'base64')).toString('utf8')
          var recievedK2 = (new Buffer(response.data[1].Value, 'base64')).toString('utf8')
          if (recievedK1 === changedValue && recievedK2 === consulTestUtil.key2Value) {
            done()
          }
        }
      })
    })
  })

  describe('cbr.restore({override:false}), should not restore with two prexising keys & override:false', function () {
    consulTestUtil.beforeSetConsulKeysAndValues()

    it('Should only restore one key when one already exists', function (done) {
      var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
      cbr.restore({filePath: '/test/cbr_newKey1_newKey2', override: false}, function (err, result) {
        if (err) done(err)
        assert.equal(result.length, 0) // should return 0 keys
        done()
      })
    })

    after('consul should have two correct keys', function (done) {
      return axios.get('http://localhost:8500/v1/kv/?recurse').then(function (response) {
        if (response.data.length === 2) {
          // console.log(decodeURIComponent(response.data[0].Value))
          var recievedK1 = (new Buffer(response.data[0].Value, 'base64')).toString('utf8')
          var recievedK2 = (new Buffer(response.data[1].Value, 'base64')).toString('utf8')
          if (recievedK1 === consulTestUtil.key1Value && recievedK2 === consulTestUtil.key2Value) {
            done()
          }
        }
      })
    })
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
