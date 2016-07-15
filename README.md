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
var cbr = new ConsulBackupRestore({host: 'localhost'});
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

### Restore
``` javascript
cbr.restore(
    {prefix: 'serviceName', overwrite: true},
    function(err) {
        if (err) throw err;
    }    
)
```
