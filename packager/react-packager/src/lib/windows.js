/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

var path = require('path');
var os = require('os');
var _ = require('underscore');

var WindowsPath = {
    isWindows:  function() {
        return os.type().match(/Windows/);
    },
    convertPath: function(pathstr) {
        return pathstr.replace(/\\/g,'\/');
    },
    path: path
};

function resolve() {
    return WindowsPath.convertPath(path.resolve.apply(this,arguments));
}

function relative() {
    return WindowsPath.convertPath(path.relative.apply(this,arguments));
}

function join() {
    return WindowsPath.convertPath(path.join.apply(this,arguments));
}

if (WindowsPath.isWindows()) {
    console.log("Is Windows");
    WindowsPath.path = _.extend(
        {},
        path,
        {
            resolve:resolve,
            relative:relative,
            join:join,
            sep: '/'
    });
}

module.exports = WindowsPath;
