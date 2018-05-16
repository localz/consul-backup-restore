const fs = require('fs')
const s3 = require('../src/s3Util.js').s3
const ConsulBackupRestore = require('../src')
const consulUtil = require('./consulTestUtil')

beforeEach(() => {
  return consulUtil.addKeys()
})

test('can backup all keys', (done) => {
  const cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
  cbr.backup({
    prefix: '', filePath: 'localtest.delete.backup_all_keys'
  }, (err, result) => {
    if (err) done(err)
    else {
      // open file and check it
      const backedUp = fs.readFileSync(result, 'utf8')
      const keysAndValues = JSON.parse(backedUp).map((keyMetaData) => {
        delete keyMetaData.ModifyIndex
        delete keyMetaData.LockIndex
        delete keyMetaData.Flags
        delete keyMetaData.CreateIndex
        return keyMetaData
      })
      expect(keysAndValues).toMatchSnapshot()
      done()
    }
  })
})

test('only backs up a specific key', (done) => {
  const cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
  cbr.backup({
    prefix: 'bucket1', filePath: 'localtest.delete.backup_prefix'
  }, (err, result) => {
    if (err) done(err)
    else {
      // open file and check it
      const backedUp = fs.readFileSync(result, 'utf8')
      const keysAndValues = JSON.parse(backedUp).map((keyMetaData) => {
        delete keyMetaData.ModifyIndex
        delete keyMetaData.LockIndex
        delete keyMetaData.Flags
        delete keyMetaData.CreateIndex
        return keyMetaData
      })
      expect(keysAndValues.length).toEqual(2)
      expect(keysAndValues).toMatchSnapshot()
      done()
    }
  })
})

test('[s3] only backs up a specific key to s3', (done) => {
  let recievedOpts
  s3.putObject = jest.fn().mockImplementation = (opts, cb) => {
    recievedOpts = opts
    cb(null, {data: {eId: '123'}})
  }
  const cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
  cbr.backup({
    prefix: 'bucket1', s3BucketName: 'testBucket'
  }, (err, result) => {
    if (err) done(err)
    else {
      // should have correct keys and values
      const body = JSON.parse(recievedOpts.Body)
      body.forEach((value, i) => {
        expect(value.Key).toEqual(consulUtil.keys[i].key)
        expect(value.Value).toEqual(consulUtil.keys[i].value)
      })
      expect(body.length).toEqual(2)
      expect(recievedOpts.Bucket).toEqual('testBucket')
      done()
    }
  })
})

test('[s3] backs up all keys to s3', (done) => {
  let recievedOpts
  s3.putObject = jest.fn().mockImplementation = (opts, cb) => {
    recievedOpts = opts
    cb(null, {data: {eId: '123'}})
  }
  const cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
  cbr.backup({
    prefix: '', s3BucketName: 'testBucket'
  }, (err, result) => {
    if (err) done(err)
    else {
      // should have correct keys and values
      const body = JSON.parse(recievedOpts.Body)
      body.forEach((value, i) => {
        expect(value.Key).toEqual(consulUtil.keys[i].key)
        expect(value.Value).toEqual(consulUtil.keys[i].value)
      })
      expect(body.length).toEqual(5)
      expect(recievedOpts.Bucket).toEqual('testBucket')
      done()
    }
  })
})

// delete test files
afterAll(() => {
  (fs.readdirSync('./')).map((e) => {
    if (e.match(/^localtest.delete./)) {
      fs.unlink(e, function (err, res) {
        if (err) throw (err)
      })
    }
  })
})
