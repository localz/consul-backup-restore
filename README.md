# consul-backup-restore
consul-backup-restore is a way of easily restoring and backing up key/value pairs from consul.
Works with s3 or locally. Does not override existing keys, but can be overriden.



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

Options
* prefix : Consul prefix used to back up keys from consul. If left blank will back up all k/v
* s3_bucket_name: s3_bucket_name you wish to connect to. Must be used if the local flag is not
* local: use true or 'true' to back up to your local directory. *local will take precedence s3*

### Restore - cbr.restore([options], callback)
``` javascript
cbr.restore(
    {prefix: 'serviceName', overwrite: true, file_name:''},
    function(err) {
        if (err) throw err;
    }    
)
```

Options
* s3_bucket_name: s3_bucket_name you wish to connect to. Must be used if the local flag is not
* local: use true or 'true' to restore from your local directory
* file_name: name of the file you wish to back up
* override: use true or 'true' to override existing keys in consul
