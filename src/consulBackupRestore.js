const overrideKey       = require('./helpers').overrideKey
const setConsulKeyValue = require('./helpers').setConsulKeyValue
const getConsulKey      = require('./helpers').getConsulKey
const getKeyValue       = require('./helpers').getKeyValue


const consul = require('consul')
const async  = require('async')
const AWS    = require('aws-sdk')
const fs     = require('fs')


function ConsulBackupRestore(options) {
    this.options = options || {};
    //TODO: look at consul and see what other configs we need to pass in
    this.consulInstance = consul({
        Host:options.Host,
        Port:options.Port,
    })
    console.log(options)
}

ConsulBackupRestore.prototype.backup = function (options, callback) {
    console.log('backing up...');

    //TODO: check options for possible options

    // Find all keys then iterate, results is array of keys
    this.consulInstance.kv.keys(options.prefix, (err,keys) => {
      if(err) throw err
      // map over array of keys
      async.map(keys, getKeyValue, (err, result) =>{
        if(err) throw err

        if (result.length === 0) return console.error('No keys found to backup!')

        let output = ''
        result.map((e)=>{
          output += JSON.stringify(e) + '\n'
        })

         // -------------- S3
        const date        = new Date();
        //just added seconds to the end to avoid duplicates -> doesn't make too much logical sense though..
        const date_ext    = `${date.getFullYear()}_${date.getMonth()}_${date.getDate()}_${date.getSeconds()}`
        const backup_file = `consul_kv_backup_${options.prefix}_${date_ext}`


        if(options.s3 === undefined || options.s3){
            var s3 = new AWS.S3({params:{Bucket: options.s3_bucket_name}})
            s3.upload({Body:output, Key: backup_file})
              .on('httpUploadProgress', function(evt) { console.log(evt); })
              .send(function(err, data) { console.log(err, data) });
        }else{
            fs.writeFile(options.file_name, output, (err) => {
              if(err) throw err

              console.log('file saved')
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
