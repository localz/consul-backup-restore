const mock = require('mock-fs')
const ConsulBackupRestore = require('../src')
const consulUtil = require('./consulTestUtil')
const s3 = require('../src/s3Util.js').s3

const allKeys = (keys) => {
  return keys.map((key, i) => `{"LockIndex":0,"Key":"${key.key}","Flags":0,"Value":"${key.value}","CreateIndex":${3378 + i}, "ModifyIndex": ${3378 + i}}`)
}

console.log('LOG Needed')
// a horrible error that took me ages to find
// https://github.com/tschaub/mock-fs/issues/234
mock({
  '/mock/allKeys.test': `[${allKeys(consulUtil.keys)}]`,
  '/mock/newKeys.test': `[${allKeys(consulUtil.newKeys)}]`
})
afterAll(() => {
  mock.restore()
})

beforeEach(() => {
  return consulUtil.deleteAllKeys()
})

test('can restore all keys', (done) => {
  const cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
  cbr.restore({
    filePath: '/mock/allKeys.test', prefix: ''
  }, (err, res) => {
    if (err) {
      done(err)
    }
    // need to check consul for keys
    consulUtil.getKeys()
      .then((res) => {
        res.data.forEach((item, i) => {
          expect(item.Key).toEqual(consulUtil.keys[i].key)
          expect(item.Value).toEqual(Buffer.from(consulUtil.keys[i].value).toString('base64'))
        })
        expect(res.data.length).toEqual(5)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})

test('can restore specific prefix', (done) => {
  const cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
  cbr.restore({
    filePath: '/mock/allKeys.test', prefix: 'bucket1'
  }, (err, res) => {
    if (err) {
      done(err)
    }
    // need to check consul for keys
    consulUtil.getKeys()
      .then((res) => {
        res.data.forEach((item, i) => {
          expect(item.Key).toEqual(consulUtil.keys[i].key)
          expect(item.Value).toEqual(Buffer.from(consulUtil.keys[i].value).toString('base64'))
        })
        expect(res.data.length).toEqual(2)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})

describe('Overwrite setting', () => {
  beforeAll(() => {
    consulUtil.deleteAllKeys()
  })

  test('will overwrite existing keys', async (done) => {
    await consulUtil.addKeys()
    const cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})

    cbr.restore({
      filePath: '/mock/newKeys.test', prefix: '', override: true
    }, (err, res) => {
      if (err) {
        done(err)
      }
      // need to check consul for keys
      consulUtil.getKeys()
        .then((res) => {
          expect(res.data.length).toEqual(5)
          // all posible keys from newKeys are updated
          expect(res.data[0].Value).toEqual(Buffer.from(consulUtil.newKeys[0].value).toString('base64'))
          expect(res.data[1].Value).toEqual(Buffer.from(consulUtil.newKeys[1].value).toString('base64'))
          expect(res.data[2].Value).toEqual(Buffer.from(consulUtil.newKeys[2].value).toString('base64'))
          expect(res.data[3].Value).toEqual(Buffer.from(consulUtil.keys[3].value).toString('base64'))
          expect(res.data[4].Value).toEqual(Buffer.from(consulUtil.keys[4].value).toString('base64'))
          done()
        })
        .catch((err) => {
          done(err)
        })
    })
  })
  test('will overwrite existing from given prefix', async (done) => {
    await consulUtil.addKeys()
    const cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})

    cbr.restore({
      filePath: '/mock/newKeys.test', prefix: 'bucket1', override: true
    }, (err, res) => {
      if (err) {
        done(err)
      }
      // need to check consul for keys
      consulUtil.getKeys()
        .then((res) => {
          expect(res.data.length).toEqual(5)
          // only bucket1 keys are replaced
          expect(res.data[0].Value).toEqual(Buffer.from(consulUtil.newKeys[0].value).toString('base64'))
          expect(res.data[1].Value).toEqual(Buffer.from(consulUtil.newKeys[1].value).toString('base64'))
          expect(res.data[2].Value).toEqual(Buffer.from(consulUtil.keys[2].value).toString('base64'))
          expect(res.data[3].Value).toEqual(Buffer.from(consulUtil.keys[3].value).toString('base64'))
          expect(res.data[4].Value).toEqual(Buffer.from(consulUtil.keys[4].value).toString('base64'))
          done()
        })
        .catch((err) => {
          done(err)
        })
    })
  })
})

test('[s3] can restore all keys', (done) => {
  const cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
  s3.getObject = jest.fn().mockImplementation = (opts, cb) => {
    cb(null, {
      'AcceptRanges': 'bytes',
      'ContentType': 'text/plain',
      'LastModified': 'Tue, 15 May 2018 06:30:40 GMT',
      'ContentLength': 16,
      'ETag': '"843ad4c290af5c582c8ffa1a6c62a0ab"',
      'Metadata': {},
      'Body': '[{"LockIndex":0,"Key":"bucket1/key_1","Flags":0,"Value":"test_1","CreateIndex":9508,"ModifyIndex":9508},{"LockIndex":0,"Key":"bucket1/key_2","Flags":0,"Value":"test_2","CreateIndex":9506,"ModifyIndex":9506},{"LockIndex":0,"Key":"bucket2/key_3","Flags":0,"Value":"test_3","CreateIndex":9509,"ModifyIndex":9509},{"LockIndex":0,"Key":"bucket2/key_4","Flags":0,"Value":"test_4","CreateIndex":9510,"ModifyIndex":9510},{"LockIndex":0,"Key":"bucket3/key_5","Flags":0,"Value":"test_5","CreateIndex":9507,"ModifyIndex":9507}]'
    })
  }
  cbr.restore({
    s3BucketName: 'assests-fb', prefix: '', filePath: 'test.txt'
  }, (err, res) => {
    if (err) {
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
  const cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
  s3.getObject = jest.fn().mockImplementation = (opts, cb) => {
    cb(null, {
      'AcceptRanges': 'bytes',
      'ContentType': 'text/plain',
      'LastModified': 'Tue, 15 May 2018 06:30:40 GMT',
      'ContentLength': 16,
      'ETag': '"843ad4c290af5c582c8ffa1a6c62a0ab"',
      'Metadata': {},
      'Body': '[{"LockIndex":0,"Key":"bucket1/key_1","Flags":0,"Value":"test_1","CreateIndex":9508,"ModifyIndex":9508},{"LockIndex":0,"Key":"bucket1/key_2","Flags":0,"Value":"test_2","CreateIndex":9506,"ModifyIndex":9506},{"LockIndex":0,"Key":"bucket2/key_3","Flags":0,"Value":"test_3","CreateIndex":9509,"ModifyIndex":9509},{"LockIndex":0,"Key":"bucket2/key_4","Flags":0,"Value":"test_4","CreateIndex":9510,"ModifyIndex":9510},{"LockIndex":0,"Key":"bucket3/key_5","Flags":0,"Value":"test_5","CreateIndex":9507,"ModifyIndex":9507}]'
    })
  }
  cbr.restore({
    s3BucketName: 'assests-fb', prefix: 'bucket1', filePath: 'test.txt'
  }, (err, res) => {
    if (err) {
      done(err)
    }
    // need to check consul for keys
    consulUtil.getKeys()
      .then((res) => {
        expect(res.data.length).toEqual(2)
        expect(res.data[0].Key).toEqual('bucket1/key_1')
        expect(res.data[1].Key).toEqual('bucket1/key_2')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})

test('Fails to back up if filePath is empty', (done) => {
  const cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
  cbr.restore({
    filePath: '', prefix: ''
  }, (err, res) => {
    expect(err.message).toEqual(`No restore occured, file path was not found\nUsage: cbr.restore({filePath:'filePath', s3BucketName:'s3BucketName'})`)
    done()
  })
})

test('Fails to back up if filePath doesn\'t exist', (done) => {
  const cbr = new ConsulBackupRestore({host: 'localhost', port: 8500})
  cbr.restore({
    filePath: 'this_file_def_doesnt_exist', prefix: ''
  }, (err, res) => {
    expect(err.message).toEqual(`ENOENT, no such file or directory 'this_file_def_doesnt_exist'`)
    done()
  })
})
