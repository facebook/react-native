/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* eslint-disable */
const CHILDREN         = 500
    , POINTS_PER_CHILD = 1000000
    , FARM_OPTIONS     = {
          maxConcurrentWorkers        : require('os').cpus().length
        , maxCallsPerWorker           : Infinity
        , maxConcurrentCallsPerWorker : 1
      }

var workerFarm = require('../../')
  , calcDirect = require('./calc')
  , calcWorker = workerFarm(FARM_OPTIONS, require.resolve('./calc'))

  , ret
  , start

  , tally = function (finish, err, avg) {
      ret.push(avg)
      if (ret.length == CHILDREN) {
        var pi  = ret.reduce(function (a, b) { return a + b }) / ret.length
          , end = +new Date()
        console.log('PI ~=', pi, '\t(' + Math.abs(pi - Math.PI), 'away from actual!)')
        console.log('took', end - start, 'milliseconds')
        if (finish)
          finish()
      }
    }

  , calc = function (method, callback) {
      ret   = []
      start = +new Date()
      for (var i = 0; i < CHILDREN; i++)
        method(POINTS_PER_CHILD, tally.bind(null, callback))
    }

console.log('Doing it the slow (single-process) way...')
calc(calcDirect, function () {
  console.log('Doing it the fast (multi-process) way...')
  calc(calcWorker, process.exit)
})
