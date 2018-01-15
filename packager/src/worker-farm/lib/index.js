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

import type {Readable} from 'stream';

var farms = [] // keep record of farms so we can end() them if required

export type FarmAPI = {|
  methods: {[name: string]: Function},
  stdout: Readable,
  stderr: Readable,
|};

function farm(
  options: {+execArgv: Array<string>},
  path: string,
  methods: Array<string>,
): FarmAPI {
  var f   = new Farm(options, path)
    , api = f.setup(methods)

  farms.push({ farm: f, api: api })

  // $FlowFixMe: gotta type the Farm class.
  const {stdout, stderr} = f;

  // return the public API
  return {methods: (api: any), stdout, stderr};
}

function end (api, callback) {
  for (var i = 0; i < farms.length; i++)
    if (farms[i] && farms[i].api === api)
      return farms[i].farm.end(callback)
  process.nextTick(callback.bind(null, 'Worker farm not found!'))
}

module.exports     = farm
module.exports.end = end
