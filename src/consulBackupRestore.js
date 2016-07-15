function ConsulBackupRestore(options) {
    this.options = options || {};
}

ConsulBackupRestore.prototype.backup = function (otpions, callback) {
    console.log('backing up...');
    callback(null);
}

ConsulBackupRestore.prototype.restore = function (options, callback) {
    console.log('restoring...');
    callback(null);
}

exports.ConsulBackupRestore = ConsulBackupRestore;
