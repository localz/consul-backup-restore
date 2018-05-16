# consul-backup-restore
[![Build Status](https://travis-ci.org/localz/consul-backup-restore.svg?branch=master)](https://travis-ci.org/localz/consul-backup-restore)
consul-backup-restore is a way of easily restoring and backing up key value pairs from consul.
It works with Amazon's S3 service or by default locally.

### Install
```
npm install consul-backup-restore
```

## API

### Initialise
``` javascript
var ConsulBackupRestore = require('consul-backup-restore');
var cbr = new ConsulBackupRestore({host: 'localhost', port:8500});
```

### Backup - cbr.backup([options], callback)
``` javascript
cbr.backup(
    {prefix: 'serviceName', filePath:'path/to/myFile'},
    function(err, result) {
        if (err) throw err;
        console.log(result)
    }
)
```
Callbacks has an error argument and a result argument. The result argument will either be the name of the file, or the s3 data dump.

Options
* prefix : Consul prefix used to back up keys from consul. If left blank all key value pairs will be backed up.
* s3BucketName: If you wish to use AWS's s3 bucket, specify the buckets name.
* filePath: Will override the backup file name with your own.

### Restore - cbr.restore([options], callback)
``` javascript
cbr.restore(
    {prefix: 'serviceName', override: true, filePath:'path/to/myFile'},
    function(err, result) {
        if (err) throw err;
        console.log(result)
    }    
)
```
Callbacks has an error argument and a result argument. The result will return an array of keys that were backed up. For example a key that already exists in consul will only be returned if the override is set to true.

Options
* s3BucketName: If you wish to use AWS's s3 bucket, specify the buckets name.
* filePath: name of the file you wish to restore from.
* override: use true or 'true' to override existing keys & their values in consul.
* prefix: if you specify a prefix, only keys witht that prefix are restored eg `service1`


### Local
To run the tests locally you must have a consul instance running. We do this through docker.
```
docker run -d -p 8500:8500 -p 8600:53 -p 8400:8400 consul agent -dev -client 0.0.0.0 -advertise 127.0.0.1
```
From then you can run your tests using mocha
