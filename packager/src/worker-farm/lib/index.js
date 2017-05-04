/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

/* eslint-disable */
const Farm = require('./farm')

var farms = [] // keep record of farms so we can end() them if required

function farm(options: {}, path: string, methods: Array<string>): {[name: string]: Function} {
  var f   = new Farm(options, path)
    , api = f.setup(methods)

  farms.push({ farm: f, api: api })

  // return the public API
  return (api: any)
}

function end (api, callback) {
  for (var i = 0; i < farms.length; i++)
    if (farms[i] && farms[i].api === api)
      return farms[i].farm.end(callback)
  process.nextTick(callback.bind(null, 'Worker farm not found!'))
}

module.exports     = farm
module.exports.end = end
