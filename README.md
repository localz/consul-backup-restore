# consul-backup-restore
consul-backup-restore is a way of easily restoring and backing up key value pairs from consul.
It works with Amazon's S3 service or locally. 



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
* s3_bucket_name: The name of the s3 bucket you wish to use. Must be used if the local flag is not
* local: Use true or 'true' to back up to your local directory. *local will take precedence over s3_bucket_name*

### Restore - cbr.restore([options], callback)
``` javascript
cbr.restore(
    {prefix: 'serviceName', overwrite: true, file_name:''},
    function(err) {
        if (err) throw err;
    }    
)
```
Callbacks only argument is error

Options
* s3_bucket_name: The name of the s3 bucket you wish to use. Must be used if the local flag is not
* local: use true or 'true' to restore from your local directory. *local will take precedence over s3_bucket_name*
* file_name: name of the file you wish to restore from
* override: use true or 'true' to override existing keys & their values in consul
