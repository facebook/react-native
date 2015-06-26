/**
 * @providesModule AsyncStorage
 */
'use strict';

var AsyncStorage = {

    getItem: function(key, callback) {
        var value = localStorage.getItem(key);
        callback(null, value);
    },

    setItem: function(key, value, callback) {
        localStorage.setItem(key, value);
        callback(null);
    },

};

module.exports = AsyncStorage;
