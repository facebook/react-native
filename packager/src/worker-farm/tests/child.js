/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* eslint-disable */
var fs = require('fs')

module.exports = function (timeout, callback) {
  callback = callback.bind(null, null, process.pid, Math.random(), timeout)
  if (timeout)
    return setTimeout(callback, timeout)
  callback()
}

module.exports.run0 = function (callback) {
  module.exports(0, callback)
}

module.exports.killable = function (id, callback) {
  if (Math.random() < 0.5)
    return process.exit(-1)
  callback(null, id, process.pid)
}

module.exports.err = function (type, message, data, callback) {
  if (typeof data == 'function') {
    callback = data
    data = null
  } else {
    var err = new Error(message)
    Object.keys(data).forEach(function(key) {
      err[key] = data[key]
    })
    callback(err)
    return
  }

  if (type == 'TypeError')
    return callback(new TypeError(message))
  callback(new Error(message))
}

module.exports.block = function () {
  while (true);
}

// use provided file path to save retries count among terminated workers
module.exports.stubborn = function (path, callback) {
  function isOutdated(path) {
    return ((new Date).getTime() - fs.statSync(path).mtime.getTime()) > 2000
  }

  // file may not be properly deleted, check if modified no earler than two seconds ago
  if (!fs.existsSync(path) || isOutdated(path)) {
    fs.writeFileSync(path, '1')
    process.exit(-1)
  }

  var retry = parseInt(fs.readFileSync(path, 'utf8'))
  if (Number.isNaN(retry))
    return callback(new Error('file contents is not a number'))

  if (retry > 4) {
    callback(null, 12)
  } else {
    fs.writeFileSync(path, String(retry + 1))
    process.exit(-1)
  }
}

var started = Date.now()
module.exports.uptime = function(callback) {
  callback(null, Date.now() - started)
}
