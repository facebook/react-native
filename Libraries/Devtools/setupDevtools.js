/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule setupDevtools
 * @flow
 */
'use strict';

function setupDevtools() {
  var messageListeners = [];
  var closeListeners = [];
  var ws = new window.WebSocket('ws://localhost:8097/devtools');
  // this is accessed by the eval'd backend code
  var FOR_BACKEND = { // eslint-disable-line no-unused-vars
    resolveRNStyle: require('flattenStyle'),
    wall: {
      listen(fn) {
        messageListeners.push(fn);
      },
      onClose(fn) {
        closeListeners.push(fn);
      },
      send(data) {
        ws.send(JSON.stringify(data));
      },
    },
  };
  ws.onclose = handleClose;
  ws.onerror = handleClose;
  ws.onopen = function () {
    tryToConnect();
  };

  var hasClosed = false;
  function handleClose() {
    if (!hasClosed) {
      hasClosed = true;
      setTimeout(setupDevtools, 2000);
      closeListeners.forEach(fn => fn());
    }
  }

  function tryToConnect() {
    ws.send('attach:agent');
    var _interval = setInterval(() => ws.send('attach:agent'), 500);
    ws.onmessage = evt => {
      if (evt.data.indexOf('eval:') === 0) {
        clearInterval(_interval);
        initialize(evt.data.slice('eval:'.length));
      }
    };
  }

  function initialize(text) {
    try {
      // FOR_BACKEND is used by the eval'd code
      eval(text); // eslint-disable-line no-eval
    } catch (e) {
      console.error('Failed to eval: ' + e.message);
      return;
    }
    // This is breaking encapsulation of the React package. Move plz.
    var ReactNativeComponentTree = require('react/lib/ReactNativeComponentTree');
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject({
      ComponentTree: {
        getClosestInstanceFromNode: function (node) {
          return ReactNativeComponentTree.getClosestInstanceFromNode(node);
        },
        getNodeFromInstance: function (inst) {
          // inst is an internal instance (but could be a composite)
          while (inst._renderedComponent) {
            inst = inst._renderedComponent;
          }
          if (inst) {
            return ReactNativeComponentTree.getNodeFromInstance(inst);
          } else {
            return null;
          }
        }
      },
      Mount: require('react/lib/ReactNativeMount'),
      Reconciler: require('react/lib/ReactReconciler')
    });
    ws.onmessage = handleMessage;
  }

  function handleMessage(evt) {
    // It's hard to handle JSON in a safe manner without inspecting it at
    // runtime, hence the any
    var data: any;
    try {
      data = JSON.parse(evt.data);
    } catch (e) {
      return console.error('failed to parse json: ' + evt.data);
    }
    // the devtools closed
    if (data.$close || data.$error) {
      closeListeners.forEach(fn => fn());
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.emit('shutdown');
      tryToConnect();
      return;
    }
    if (data.$open) {
      return; // ignore
    }
    messageListeners.forEach(fn => {
      try {
        fn(data);
      } catch (e) {
        // jsc doesn't play so well with tracebacks that go into eval'd code,
        // so the stack trace here will stop at the `eval()` call. Getting the
        // message that caused the error is the best we can do for now.
        console.log(data);
        throw e;
      }
    });
  }
}

module.exports = setupDevtools;
