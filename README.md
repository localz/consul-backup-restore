# consul-backup-restore
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
var cbr = new ConsulBackupRestore({Host: 'localhost', Port:8500});
```

### Backup - cbr.backup([options], callback)
``` javascript
cbr.backup(
    {prefix: 'serviceName'},
    function(err) {
        if (err) throw err;
    }
)
```
Callbacks only argument is error

Options
* prefix : Consul prefix used to back up keys from consul. If left blank all key value pairs will be backed up
* s3_bucket_name: If you wish to use AWS's s3 bucket, specify the buckets name

### Restore - cbr.restore([options], callback)
``` javascript
cbr.restore(
    {prefix: 'serviceName', overwrite: true, path_to_file:''},
    function(err) {
        if (err) throw err;
    }    
)
```
Callbacks only argument is error

Options
* s3_bucket_name: If you wish to use AWS's s3 bucket, specify the buckets name
* path_to_file: name of the file you wish to restore from
* override: use true or 'true' to override existing keys & their values in consul
