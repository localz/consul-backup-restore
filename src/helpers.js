const consul = require('consul')()

exports.getConsulKey = function (key){
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
exports.overrideKey = function (key, consulValue, OVERRIDE_FLAG){
  return new Promise((resolve, reject) => {
    if(consulValue){
      if(OVERRIDE_FLAG){
        resolve()
      }else{
        reject(`${key} was not restored (enable override)`)
      }
    }else{
      resolve()
    }
  })
}

exports.setConsulKeyValue = function (key,backupValue){
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
