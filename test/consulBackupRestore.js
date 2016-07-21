var assert = require('chai').assert
var ConsulBackupRestore = require('../src')
var cbr = new ConsulBackupRestore({Host: 'localhost', Port: 8500})
var describe = require('mocha').describe
var it = require('mocha').it

describe('consul-back-restore', function () {
  it('backup & restore functions should be accesible on cbr object', function () {
    assert.isFunction(cbr.backup)
    assert.isFunction(cbr.restore)
  })
})

describe('Consul-backup', function () {
  describe('cbr.backup({})', function () {
    it('should be able to backup locally')
  })
})
describe('cbr.backup({s3BucketName:})', function () {
  it('should be able to backup to s3')
})

describe('Consul-restore', function () {
  describe('cbr.restore({})', function () {
    it('should be able to restore locally')
  })
  describe('cbr.restore({s3BucketName:})', function () {
    it('should be able to restore to s3')
  })
})
