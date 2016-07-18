const consul = require('consul')()
const AWS    = require('aws-sdk')
const fs     = require('fs')


const getConsulKey = exports.getConsulKey = function (key){
  return new Promise((resolve, reject) => {
    consul.kv.get(key, (err, result) => {
      if(err) reject(err);

      if(result){
        resolve(JSON.stringify(result.Value))
      }else{
        resolve(undefined)
      }

    })
  })
}

//added override flag to args so its clear that the function is dependent on it?
//passed key so we can see which keys get overriden
const overrideKey = exports.overrideKey = function (key, consulValue, override_flag){
  return new Promise((resolve, reject) => {
    if(consulValue){
      if(override_flag){
        resolve()
      }else{
        reject(`${key} was not restored (enable override)`)
      }
    }else{
      resolve()
    }
  })
}

const setConsulKeyValue = exports.setConsulKeyValue = function (key,backupValue){
    return new Promise((resolve,reject) => {
      consul.kv.set(key,backupValue, (err, result) => {
        if (err) reject (err)

        result ? resolve(key) : reject( Error(key+' was not set') )
      })
    })
}

//used with asny.map
exports.getKeyValue = function (key, callback){
  consul.kv.get(key, (err,result)=>{
    if (err) throw err
    callback(null, result)
  })
}

exports.parseOptions = function(function_call, options, callback){
  if(function_call === 'restore'){
    if(options.override === 'true') options.override = true
    if(!options.override || (typeof options.override !== 'boolean')){
      options.override = false
    }
    if(!options.path_to_file){
      console.log(`No ${function_call} occured`)
      console.log(`Usage: cbr.${function_call}({path_to_file:\'path_to_file\', s3_bucket_name:\'bucket_name\'}`)
      callback(Error('Incorrect usage - path_to_file needed for restore'))
    }
  }

  // can backup/restore without prefix, this will back every key
  if(!options.prefix) options.prefix = ''
  return options

}

exports.createFileName = function(prefix){
     const date        = new Date();
     //just added seconds to the end to avoid duplicates -> doesn't make too much logical sense though..
     const date_ext    = `${date.getFullYear()}_${date.getMonth()}_${date.getDate()}_${date.getSeconds()}`
     return `consul_kv_backup_${prefix}_${date_ext}`
}


exports.writeLocalFile = function(backup_file_name, writeData, callback){
  fs.writeFile(backup_file_name, writeData, (err) => {
    if(err) callback(err)

    callback(null,`file saved as ${backup_file_name}`)
  })
}


exports.writeS3File = function (s3_bucket_name, backup_file_name, writeData, callback) {
  var s3 = new AWS.S3({params:{Bucket: s3_bucket_name}})
    s3.upload({Body:writeData, Key: backup_file_name})
      .on('httpUploadProgress', function(evt) { console.log(evt); })
      .send(function(err, writeData) { callback(err, writeData) });
}

exports.parseKeys = function (keys) {
  if (keys.length === 0) return console.error('No keys found to backup!')

  let writeData = ''
  keys.map((e)=>{
    writeData += JSON.stringify(e) + '\n'
  })
  return writeData
}


exports.consulBackup = function (raw_data, override, callback) {

       let key_values = raw_data.toString('utf-8').split('\n')
       if (key_values.last === undefined){
           key_values.pop() // pop last value as its a newline
         }
       key_values.map((kv)=> {
         const key = JSON.parse(kv).Key
         const backupValue = JSON.parse(kv).Value

         getConsulKey(key)
           .then((consulValue)  => overrideKey(key,consulValue, override))
           .then(()             => setConsulKeyValue(key,backupValue))
           .then((restored_key) => callback(null,`Key ${restored_key} was restored`))
           .catch((e)           => callback(e))
       })
}
