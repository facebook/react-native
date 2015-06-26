/**
 * @providesModule PushNotificationIOS
 */
'use strict';

var warning = require('warning');

var PushNotifications = {

    unsupported: true, // TODO HACK YICK

    checkPermissions: function(callback) {
        warning(false, 'Push notifications not supported on web');
        callback({});
    },

    requestPermissions: function(permissions) {
        warning(false, 'Push notifications not supported on web');
    },

    addEventListener: function(eventName, callback) {
        warning(false, 'Push notifications not supported on web');
    },

    removeEventListener: function(eventName, callback) {
        warning(false, 'Push notifications not supported on web');
    },

};

module.exports = PushNotifications;
