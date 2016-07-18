# consul-backup-restore

This is a work in progress - come back soon to see it finished!

### Install
```
npm install consul-backup-restore
```

## API

### Initialise
``` javascript
var ConsulBackupRestore = require('consul-backup-restore');
var cbr = new ConsulBackupRestore({Host: 'localhost'});
```

### Backup
``` javascript
cbr.backup(
    {prefix: 'serviceName'},
    function(err) {
        if (err) throw err;
    }
)
```

Parameters
prefix - if left out will back up all key/value pairs
s3_bucket_name - must be included if not using local flag
local -> local in stead of s3. true or 'true'

### Restore
``` javascript
cbr.restore(
    {prefix: 'serviceName', overwrite: true, file_name:''},
    function(err) {
        if (err) throw err;
    }    
)
```
