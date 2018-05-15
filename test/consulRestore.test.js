const mock = require('mock-fs')
const ConsulBackupRestore = require('../src')
const consulUtil = require('./consulTestUtil')
const AWS = require('../src/s3Util.js')
const s3 = require('../src/s3Util.js').s3

const allKeys = (keys) => {
  return keys.map((key, i) => `{"LockIndex":0,"Key":"${key.key}","Flags":0,"Value":"${key.value}","CreateIndex":${3378+i}, "ModifyIndex": ${3378+i}}`)
}

console.log('LOG Needed')
// a horrible error that took me ages to find
// https://github.com/tschaub/mock-fs/issues/234
mock({
  '/mock/allKeys.test': `[${allKeys(consulUtil.keys)}]`
})

afterAll( () => {
  mock.restore()
})

beforeEach( () => {
  return consulUtil.deleteAllKeys()
})

test('can restore all keys', (done) => {
  const cbr = new ConsulBackupRestore({host:'localhost', port:8500})
  cbr.restore({
    filePath: '/mock/allKeys.test', prefix: ''
  }, (err, res) => {
    if(err) {
      done(err)
    }
      // need to check consul for keys
      consulUtil.getKeys()
        .then((res) => {
          expect(res.data.length).toEqual(5) 
          done()
        })
      .catch((err) => {
        done(err)
      })
  })
})

test('can restore specific prefix', (done) => {
  const cbr = new ConsulBackupRestore({host:'localhost', port:8500})
  cbr.restore({
    filePath: '/mock/allKeys.test', prefix: 'bucket1'
  }, (err, res) => {
    if(err) {
      done(err)
    }
      // need to check consul for keys
      consulUtil.getKeys()
        .then((res) => {
          expect(res.data.length).toEqual(2) 
          done()
        })
      .catch((err) => {
        done(err)
      })
  })
})

test.skip('[s3] can restore all keys', (done) => {
  const cbr = new ConsulBackupRestore({host:'localhost', port:8500})
  const getObject = s3.getObject = jest.fn().mockImplementation = (opts, cb) => {
    recievedOpts = opts
    cb(null, {
    "AcceptRanges": "bytes",
    "ContentType": "text/plain",
    "LastModified": "Tue, 15 May 2018 06:30:40 GMT",
    "ContentLength": 16,
    "ETag": "\"843ad4c290af5c582c8ffa1a6c62a0ab\"",
      "Metadata": {},
      "Body": '{"apple":"yes"}'
    })
  }
  cbr.restore({
    s3BucketName: 'assests-fb', prefix: '', filePath:'test.txt'
  }, (err, res) => {
    if(err) {
      done(err)
    }
      // need to check consul for keys
      consulUtil.getKeys()
        .then((res) => {
          expect(res.data.length).toEqual(5) 
          done()
        })
      .catch((err) => {
        done(err)
      })
  })
})

test('[s3] can restore specific prefix', (done) => {
      done()
})

