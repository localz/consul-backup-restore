// const overrideKey       = require('./helpers').overrideKey
// const setConsulKeyValue = require('./helpers').setConsulKeyValue
// const getConsulKey      = require('./helpers').getConsulKey
const helpers      = require('./helpers')

const consul = require('consul')
const async  = require('async')
const AWS    = require('aws-sdk')
const fs     = require('fs')

function ConsulBackupRestore(options) {
    this.options = options || {};
    //TODO: consul by default can take in a lot more items
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
    const { prefix, s3_bucket_name, local } = options
    // Find all keys then iterate, results is array of keys
    this.consulInstance.kv.keys(prefix, (err,keys) => {
      if(err) throw err
      // map over array of keys
      async.map(keys, helpers.getKeyValue, (err, result) =>{
        if(err) throw err

        const writeData        = helpers.parseKeys(result)
        const backup_file_name = helpers.createFileName(prefix)

        if(local){
            helpers.writeLocalFile(backup_file_name, writeData, (err, result) => {
                if(err) callback(err)
                console.log(result)
            })
        }else{
            helpers.writeS3File(s3_bucket_name, backup_file_name, writeData, (err, result) =>{
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

    const {s3_bucket_name, file_name, override} = options
    if(options.local){
        fs.readFile(file_name, 'utf8', (err, data)=>{
            if (err) callback(err)
            helpers.consulBackup(data, override, (err,result) => {
                if(err) callback(err)
                console.log(result)
            })
        })
    }else{
        const s3 = new AWS.S3({params:{Bucket: s3_bucket_name}})
        s3.getObject({Bucket: s3_bucket_name, Key: file_name}, (err, data) => {
          if (err) callback(err)
          helpers.consulBackup(data.Body, override, (err,result) => {
              if(err) callback(err)
              if(result) console.log(result)
          })

        })
    }
    callback(null);
}

exports.ConsulBackupRestore = ConsulBackupRestore;
