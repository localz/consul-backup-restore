// const overrideKey       = require('./helpers').overrideKey
// const setConsulKeyValue = require('./helpers').setConsulKeyValue
// const getConsulKey      = require('./helpers').getConsulKey
const helpers      = require('./helpers')

const consul = require('consul')
const async  = require('async')
const AWS    = require('aws-sdk')


function ConsulBackupRestore(options) {
    this.options = options || {};
    //TODO: look at consul and see what other configs we need to pass in
    this.consulInstance = consul({
        Host:options.Host,
        Port:options.Port,
    })
}

ConsulBackupRestore.prototype.backup = function (options, callback) {

    // parse options & santizes
    options = helpers.parseOptions('backup',options, (err) => {
        if(err) callback(err)
    })
    console.log('backing up...');
    // Find all keys then iterate, results is array of keys
    this.consulInstance.kv.keys(options.prefix, (err,keys) => {
      if(err) throw err
      // map over array of keys
      async.map(keys, helpers.getKeyValue, (err, result) =>{
        if(err) throw err

        console.log(options.prefix)
        const writeData        = helpers.parseKeys(result)
        const backup_file_name = helpers.createFileName(options.prefix)

        if(options.local === true || options.local === 'true'){
            helpers.writeLocalFile(backup_file_name, writeData, (err, result) => {
                if(err) callback(err)
                console.log(result)
            })
        }else{
            helpers.writeS3File(options.s3_bucket_name, backup_file_name, writeData, (err, result) =>{
                if(err) callback(err)
                console.log(result)
            })
        }

        })
    })
    callback(null);
}

ConsulBackupRestore.prototype.restore = function (options, callback) {

    options = helpers.parseOptions('restore', options, (err) => {
        if(err) callback(err)
    })
    console.log('restoring...');

    //local
  // fs.readFile(FILE_NAME, 'utf8', (err,data)=>{}
  // --------------- s3
  //Name of backup file

    const {s3_bucket_name, file_name, override} = options
    const s3 = new AWS.S3({params:{Bucket: s3_bucket_name}})
    s3.getObject({Bucket: s3_bucket_name, Key: file_name}, function(err, data) {
      if (err) callback(err)

      let key_values = data.Body.toString('utf-8').split('\n')
      if (key_values.last === undefined){
          key_values.pop()
        }
      key_values.map((kv)=> {
        const key = JSON.parse(kv).Key
        const backupValue = JSON.parse(kv).Value

        helpers.getConsulKey(key)
          .then((consulValue)  => helpers.overrideKey(key,consulValue, override))
          .then(()             => helpers.setConsulKeyValue(key,backupValue))
          .then((restored_key) => console.log(`Key ${restored_key} was restored`))
          .catch((e)           => callback(e))
      })

    })
    callback(null);
}

exports.ConsulBackupRestore = ConsulBackupRestore;
