const overrideKey       = require('./helpers').overrideKey
const setConsulKeyValue = require('./helpers').setConsulKeyValue
const getConsulKey      = require('./helpers').getConsulKey
const helpers      = require('./helpers')


const consul = require('consul')
const async  = require('async')
const fs     = require('fs')


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
    this.options = helpers.parseOptions(options, (err) => {
        if(err) callback(err)
    })

    console.log('backing up...');
    // Find all keys then iterate, results is array of keys
    this.consulInstance.kv.keys(options.prefix, (err,keys) => {
      if(err) throw err
      // map over array of keys
      async.map(keys, helpers.getKeyValue, (err, result) =>{
        if(err) throw err

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
    console.log('restoring...');
    callback(null);
}

exports.ConsulBackupRestore = ConsulBackupRestore;
