/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* eslint-disable */
var $module

/*
  var contextProto = this.context;
  while (contextProto = Object.getPrototypeOf(contextProto)) {
    completionGroups.push(Object.getOwnPropertyNames(contextProto));
  }
*/

function handle (data) {
  var idx      = data.idx
    , child    = data.child
    , method   = data.method
    , args     = data.args
    , callback = function () {
        var _args = Array.prototype.slice.call(arguments)
        if (_args[0] instanceof Error) {
          var e = _args[0]
          _args[0] = {
              '$error'  : '$error'
            , 'type'    : e.constructor.name
            , 'message' : e.message
            , 'stack'   : e.stack
          }
          Object.keys(e).forEach(function(key) {
            _args[0][key] = e[key]
          })
        }
        process.send({ idx: idx, child: child, args: _args })
      }
    , exec

  if (method == null && typeof $module == 'function')
    exec = $module
  else if (typeof $module[method] == 'function')
    exec = $module[method]

  if (!exec)
    return console.error('NO SUCH METHOD:', method)

  exec.apply(null, args.concat([ callback ]))
}

process.on('message', function (data) {
  if (!$module) return $module = require(data.module)
  if (data == 'die') return process.exit(0)
  handle(data)
})
