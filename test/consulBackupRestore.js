var chai = require('chai')
var ConsulBackupRestore = require('../src')
var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
var describe = require('mocha').describe
var beforeEach = require('mocha').beforeEach
var afterEach = require('mocha').afterEach
var after = require('mocha').after
var it = require('mocha').it
var AWS = require('aws-sdk')
var fs = require('fs')
var mock = require('mock-fs')
var axios = require('axios')
var sinon = require('sinon')
var sinonChai = require('sinon-chai')
var assert = chai.assert
var consulTestUtil = require('./consulTestUtil')
var consulUtil = require('../src/consulUtil')

chai.should()
chai.use(sinonChai)

var changedValue = 'changedValue'
var newKey1 = 'newKey1'
var newKey2 = 'newKey2'
mock({
  '/test': {
    'cbr_key1_key2': `[{"LockIndex":0,"Key":"web/key1","Flags":0,"Value":"${consulTestUtil.key1Value}","CreateIndex":3378,"ModifyIndex":3378},{"LockIndex":0,"Key":"web/key2","Flags":0,"Value":"${consulTestUtil.key2Value}","CreateIndex":3379,"ModifyIndex":3379}]`,
    'cbr_key1_key2_key3': `[{"LockIndex":0,"Key":"web/key1","Flags":0,"Value":"${consulTestUtil.key1Value}","CreateIndex":3378,"ModifyIndex":3378},{"LockIndex":0,"Key":"web/key2","Flags":0,"Value":"${consulTestUtil.key2Value}","CreateIndex":3379,"ModifyIndex":3379},{"LockIndex":0,"Key":"notweb/key1","Flags":0,"Value":"${consulTestUtil.key3Value}","CreateIndex":3380,"ModifyIndex":3380}]`,
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

          assert.isNotNull(result.match(re1))
          assert.isNotNull(result.match(re2))
          done()
        })
      })
    })
  })

  describe('cbr.restore({})', function () {
    var sandbox

    consulTestUtil.beforeDeleteAllKeys()

    beforeEach(function () {
      sandbox = sinon.sandbox.create()
    })
    afterEach(function () {
      sandbox.restore()
    })

    it('should be able to restore locally', function (done) {
      var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
      cbr.restore({filePath: '/test/cbr_key1_key2'}, function (err, result) {
        if (err) console.log(err)
        assert.equal(result.length, 2)

        // two keys should be to consul
        return axios.get('http://localhost:8500/v1/kv/?recurse').then(function (response) {
          if (response.data.length === 2) {
            // console.log(decodeURIComponent(response.data[0].Value))
            var recievedK1 = (new Buffer(response.data[0].Value, 'base64')).toString('utf8')
            var recievedK2 = (new Buffer(response.data[1].Value, 'base64')).toString('utf8')
            assert.equal(recievedK1, consulTestUtil.key1Value)
            assert.equal(recievedK2, consulTestUtil.key2Value)
            done()
          }
        })
      })
    })

    it('should not attempt to restore when s3 data not found', function (done) {
      var getObject = AWS.S3.prototype.getObject = sandbox.stub()
      getObject.yields('error-text', null)
      sandbox.spy(consulUtil, 'restoreKeyValues')
      var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
      cbr.restore({s3BucketName: 'http://some-bucket.s3.amazonaws.com', filePath: '/some/file/path'}, function (err, result) {
        assert.equal(err, 'error-text')
        getObject.should.have.been.called
        consulUtil.restoreKeyValues.should.have.not.been.called
        done()
      })
    })

    it('should not attempt to restore when local file not found', function (done) {
      sandbox.spy(consulUtil, 'restoreKeyValues')
      var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
      cbr.restore({filePath: '/test/keynotfound'}, function (err, result) {
        assert.equal(err.code, 'ENOENT')
        assert.isUndefined(result)
        consulUtil.restoreKeyValues.should.have.not.been.called
        done()
      })
    })
  })

  describe('cbr.restore({}), with one key already existing (and not overwrite)', function () {
    consulTestUtil.beforeSetOneConsulKeysAndValues()

    it('Should only restore one key when one already exists', function (done) {
      var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
      cbr.restore({filePath: '/test/cbr_changed_key2'}, function (err, result) {
        if (err) done(err)
        assert.equal(result.length, 1) // should only return one key

        // consul should have one original key and one new key
        return axios.get('http://localhost:8500/v1/kv/?recurse').then(function (response) {
          if (response.data.length === 2) {
            // receivedK1 should not be changedValue should be still original
            var recievedK1 = (new Buffer(response.data[0].Value, 'base64')).toString('utf8')
            var recievedK2 = (new Buffer(response.data[1].Value, 'base64')).toString('utf8')
            assert.equal(recievedK1, consulTestUtil.key1Value)
            assert.equal(recievedK2, consulTestUtil.key2Value)
            done()
          }
        })
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

        // consul should have one overwriten value and one old value
        return axios.get('http://localhost:8500/v1/kv/?recurse').then(function (response) {
          if (response.data.length === 2) {
            // recievedK1 should be changedValue
            var recievedK1 = (new Buffer(response.data[0].Value, 'base64')).toString('utf8')
            var recievedK2 = (new Buffer(response.data[1].Value, 'base64')).toString('utf8')
            assert.equal(recievedK1, changedValue)
            assert.equal(recievedK2, consulTestUtil.key2Value)
            done()
          }
        })
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

        // Consul should have two of the original keys
        return axios.get('http://localhost:8500/v1/kv/?recurse').then(function (response) {
          if (response.data.length === 2) {
            // console.log(decodeURIComponent(response.data[0].Value))
            var recievedK1 = (new Buffer(response.data[0].Value, 'base64')).toString('utf8')
            var recievedK2 = (new Buffer(response.data[1].Value, 'base64')).toString('utf8')
            assert.equal(recievedK1, consulTestUtil.key1Value)
            assert.equal(recievedK2, consulTestUtil.key2Value)
            done()
          }
        })
      })
    })

    it('Should only restore keys defined by prefix', function (done) {
      var cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
      cbr.restore({filePath: '/test/cbr_key1_key2_key3', prefix: 'web', override: false}, function (err, result) {
        if (err) done(err)

        // Consul should have two of the original keys
        return axios.get('http://localhost:8500/v1/kv/?recurse').then(function (response) {
          if (response.data.length === 2) {
            // console.log(decodeURIComponent(response.data[0].Value))
            var recievedK1 = (new Buffer(response.data[0].Value, 'base64')).toString('utf8')
            var recievedK2 = (new Buffer(response.data[1].Value, 'base64')).toString('utf8')
            assert.equal(recievedK1, consulTestUtil.key1Value)
            assert.equal(recievedK2, consulTestUtil.key2Value)
            done()
          }
        })
          .catch((err) => console.log(err))
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
})
