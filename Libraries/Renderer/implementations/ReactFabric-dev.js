/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @providesModule ReactFabric-dev
 * @preventMunge
 * @generated
 */

'use strict';

if (__DEV__) {
  (function() {
"use strict";

require("react-native/Libraries/ReactPrivate/ReactNativePrivateInitializeCore");
var ReactNativePrivateInterface = require("react-native/Libraries/ReactPrivate/ReactNativePrivateInterface");
var React = require("react");
var Scheduler = require("scheduler");
var checkPropTypes = require("prop-types/checkPropTypes");
var tracing = require("scheduler/tracing");

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

/**
 * Injectable ordering of event plugins.
 */
var eventPluginOrder = null;
/**
 * Injectable mapping from names to event plugin modules.
 */

var namesToPlugins = {};
/**
 * Recomputes the plugin list using the injected plugins and plugin ordering.
 *
 * @private
 */

function recomputePluginOrdering() {
  if (!eventPluginOrder) {
    // Wait until an `eventPluginOrder` is injected.
    return;
  }

  for (var pluginName in namesToPlugins) {
    var pluginModule = namesToPlugins[pluginName];
    var pluginIndex = eventPluginOrder.indexOf(pluginName);

    if (!(pluginIndex > -1)) {
      throw Error(
        "EventPluginRegistry: Cannot inject event plugins that do not exist in the plugin ordering, `" +
          pluginName +
          "`."
      );
    }

    if (plugins[pluginIndex]) {
      continue;
    }

    if (!pluginModule.extractEvents) {
      throw Error(
        "EventPluginRegistry: Event plugins must implement an `extractEvents` method, but `" +
          pluginName +
          "` does not."
      );
    }

    plugins[pluginIndex] = pluginModule;
    var publishedEvents = pluginModule.eventTypes;

    for (var eventName in publishedEvents) {
      if (
        !publishEventForPlugin(
          publishedEvents[eventName],
          pluginModule,
          eventName
        )
      ) {
        throw Error(
          "EventPluginRegistry: Failed to publish event `" +
            eventName +
            "` for plugin `" +
            pluginName +
            "`."
        );
      }
    }
  }
}
/**
 * Publishes an event so that it can be dispatched by the supplied plugin.
 *
 * @param {object} dispatchConfig Dispatch configuration for the event.
 * @param {object} PluginModule Plugin publishing the event.
 * @return {boolean} True if the event was successfully published.
 * @private
 */

function publishEventForPlugin(dispatchConfig, pluginModule, eventName) {
  if (!!eventNameDispatchConfigs.hasOwnProperty(eventName)) {
    throw Error(
      "EventPluginHub: More than one plugin attempted to publish the same event name, `" +
        eventName +
        "`."
    );
  }

  eventNameDispatchConfigs[eventName] = dispatchConfig;
  var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;

  if (phasedRegistrationNames) {
    for (var phaseName in phasedRegistrationNames) {
      if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
        var phasedRegistrationName = phasedRegistrationNames[phaseName];
        publishRegistrationName(
          phasedRegistrationName,
          pluginModule,
          eventName
        );
      }
    }

    return true;
  } else if (dispatchConfig.registrationName) {
    publishRegistrationName(
      dispatchConfig.registrationName,
      pluginModule,
      eventName
    );
    return true;
  }

  return false;
}
/**
 * Publishes a registration name that is used to identify dispatched events.
 *
 * @param {string} registrationName Registration name to add.
 * @param {object} PluginModule Plugin publishing the event.
 * @private
 */

function publishRegistrationName(registrationName, pluginModule, eventName) {
  if (!!registrationNameModules[registrationName]) {
    throw Error(
      "EventPluginHub: More than one plugin attempted to publish the same registration name, `" +
        registrationName +
        "`."
    );
  }

  registrationNameModules[registrationName] = pluginModule;
  registrationNameDependencies[registrationName] =
    pluginModule.eventTypes[eventName].dependencies;

  {
    var lowerCasedName = registrationName.toLowerCase();
  }
}
/**
 * Registers plugins so that they can extract and dispatch events.
 *
 * @see {EventPluginHub}
 */

/**
 * Ordered list of injected plugins.
 */

var plugins = [];
/**
 * Mapping from event name to dispatch config
 */

var eventNameDispatchConfigs = {};
/**
 * Mapping from registration name to plugin module
 */

var registrationNameModules = {};
/**
 * Mapping from registration name to event name
 */

var registrationNameDependencies = {};
/**
 * Mapping from lowercase registration names to the properly cased version,
 * used to warn in the case of missing event handlers. Available
 * only in true.
 * @type {Object}
 */

// Trust the developer to only use possibleRegistrationNames in true

/**
 * Injects an ordering of plugins (by plugin name). This allows the ordering
 * to be decoupled from injection of the actual plugins so that ordering is
 * always deterministic regardless of packaging, on-the-fly injection, etc.
 *
 * @param {array} InjectedEventPluginOrder
 * @internal
 * @see {EventPluginHub.injection.injectEventPluginOrder}
 */

function injectEventPluginOrder(injectedEventPluginOrder) {
  if (!!eventPluginOrder) {
    throw Error(
      "EventPluginRegistry: Cannot inject event plugin ordering more than once. You are likely trying to load more than one copy of React."
    );
  } // Clone the ordering so it cannot be dynamically mutated.

  eventPluginOrder = Array.prototype.slice.call(injectedEventPluginOrder);
  recomputePluginOrdering();
}
/**
 * Injects plugins to be used by `EventPluginHub`. The plugin names must be
 * in the ordering injected by `injectEventPluginOrder`.
 *
 * Plugins can be injected as part of page initialization or on-the-fly.
 *
 * @param {object} injectedNamesToPlugins Map from names to plugin modules.
 * @internal
 * @see {EventPluginHub.injection.injectEventPluginsByName}
 */

function injectEventPluginsByName(injectedNamesToPlugins) {
  var isOrderingDirty = false;

  for (var pluginName in injectedNamesToPlugins) {
    if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
      continue;
    }

    var pluginModule = injectedNamesToPlugins[pluginName];

    if (
      !namesToPlugins.hasOwnProperty(pluginName) ||
      namesToPlugins[pluginName] !== pluginModule
    ) {
      if (!!namesToPlugins[pluginName]) {
        throw Error(
          "EventPluginRegistry: Cannot inject two different event plugins using the same name, `" +
            pluginName +
            "`."
        );
      }

      namesToPlugins[pluginName] = pluginModule;
      isOrderingDirty = true;
    }
  }

  if (isOrderingDirty) {
    recomputePluginOrdering();
  }
}

var invokeGuardedCallbackImpl = function(
  name,
  func,
  context,
  a,
  b,
  c,
  d,
  e,
  f
) {
  var funcArgs = Array.prototype.slice.call(arguments, 3);

  try {
    func.apply(context, funcArgs);
  } catch (error) {
    this.onError(error);
  }
};

{
  // In DEV mode, we swap out invokeGuardedCallback for a special version
  // that plays more nicely with the browser's DevTools. The idea is to preserve
  // "Pause on exceptions" behavior. Because React wraps all user-provided
  // functions in invokeGuardedCallback, and the production version of
  // invokeGuardedCallback uses a try-catch, all user exceptions are treated
  // like caught exceptions, and the DevTools won't pause unless the developer
  // takes the extra step of enabling pause on caught exceptions. This is
  // unintuitive, though, because even though React has caught the error, from
  // the developer's perspective, the error is uncaught.
  //
  // To preserve the expected "Pause on exceptions" behavior, we don't use a
  // try-catch in DEV. Instead, we synchronously dispatch a fake event to a fake
  // DOM node, and call the user-provided callback from inside an event handler
  // for that fake event. If the callback throws, the error is "captured" using
  // a global event handler. But because the error happens in a different
  // event loop context, it does not interrupt the normal program flow.
  // Effectively, this gives us try-catch behavior without actually using
  // try-catch. Neat!
  // Check that the browser supports the APIs we need to implement our special
  // DEV version of invokeGuardedCallback
  if (
    typeof window !== "undefined" &&
    typeof window.dispatchEvent === "function" &&
    typeof document !== "undefined" &&
    typeof document.createEvent === "function"
  ) {
    var fakeNode = document.createElement("react");

    var invokeGuardedCallbackDev = function(
      name,
      func,
      context,
      a,
      b,
      c,
      d,
      e,
      f
    ) {
      // If document doesn't exist we know for sure we will crash in this method
      // when we call document.createEvent(). However this can cause confusing
      // errors: https://github.com/facebookincubator/create-react-app/issues/3482
      // So we preemptively throw with a better message instead.
      if (!(typeof document !== "undefined")) {
        throw Error(
          "The `document` global was defined when React was initialized, but is not defined anymore. This can happen in a test environment if a component schedules an update from an asynchronous callback, but the test has already finished running. To solve this, you can either unmount the component at the end of your test (and ensure that any asynchronous operations get canceled in `componentWillUnmount`), or you can change the test itself to be asynchronous."
        );
      }

      var evt = document.createEvent("Event"); // Keeps track of whether the user-provided callback threw an error. We
      // set this to true at the beginning, then set it to false right after
      // calling the function. If the function errors, `didError` will never be
      // set to false. This strategy works even if the browser is flaky and
      // fails to call our global error handler, because it doesn't rely on
      // the error event at all.

      var didError = true; // Keeps track of the value of window.event so that we can reset it
      // during the callback to let user code access window.event in the
      // browsers that support it.

      var windowEvent = window.event; // Keeps track of the descriptor of window.event to restore it after event
      // dispatching: https://github.com/facebook/react/issues/13688

      var windowEventDescriptor = Object.getOwnPropertyDescriptor(
        window,
        "event"
      ); // Create an event handler for our fake event. We will synchronously
      // dispatch our fake event using `dispatchEvent`. Inside the handler, we
      // call the user-provided callback.

      var funcArgs = Array.prototype.slice.call(arguments, 3);

      function callCallback() {
        // We immediately remove the callback from event listeners so that
        // nested `invokeGuardedCallback` calls do not clash. Otherwise, a
        // nested call would trigger the fake event handlers of any call higher
        // in the stack.
        fakeNode.removeEventListener(evtType, callCallback, false); // We check for window.hasOwnProperty('event') to prevent the
        // window.event assignment in both IE <= 10 as they throw an error
        // "Member not found" in strict mode, and in Firefox which does not
        // support window.event.

        if (
          typeof window.event !== "undefined" &&
          window.hasOwnProperty("event")
        ) {
          window.event = windowEvent;
        }

        func.apply(context, funcArgs);
        didError = false;
      } // Create a global error event handler. We use this to capture the value
      // that was thrown. It's possible that this error handler will fire more
      // than once; for example, if non-React code also calls `dispatchEvent`
      // and a handler for that event throws. We should be resilient to most of
      // those cases. Even if our error event handler fires more than once, the
      // last error event is always used. If the callback actually does error,
      // we know that the last error event is the correct one, because it's not
      // possible for anything else to have happened in between our callback
      // erroring and the code that follows the `dispatchEvent` call below. If
      // the callback doesn't error, but the error event was fired, we know to
      // ignore it because `didError` will be false, as described above.

      var error; // Use this to track whether the error event is ever called.

      var didSetError = false;
      var isCrossOriginError = false;

      function handleWindowError(event) {
        error = event.error;
        didSetError = true;

        if (error === null && event.colno === 0 && event.lineno === 0) {
          isCrossOriginError = true;
        }

        if (event.defaultPrevented) {
          // Some other error handler has prevented default.
          // Browsers silence the error report if this happens.
          // We'll remember this to later decide whether to log it or not.
          if (error != null && typeof error === "object") {
            try {
              error._suppressLogging = true;
            } catch (inner) {
              // Ignore.
            }
          }
        }
      } // Create a fake event type.

      var evtType = "react-" + (name ? name : "invokeguardedcallback"); // Attach our event handlers

      window.addEventListener("error", handleWindowError);
      fakeNode.addEventListener(evtType, callCallback, false); // Synchronously dispatch our fake event. If the user-provided function
      // errors, it will trigger our global error handler.

      evt.initEvent(evtType, false, false);
      fakeNode.dispatchEvent(evt);

      if (windowEventDescriptor) {
        Object.defineProperty(window, "event", windowEventDescriptor);
      }

      if (didError) {
        if (!didSetError) {
          // The callback errored, but the error event never fired.
          error = new Error(
            "An error was thrown inside one of your components, but React " +
              "doesn't know what it was. This is likely due to browser " +
              'flakiness. React does its best to preserve the "Pause on ' +
              'exceptions" behavior of the DevTools, which requires some ' +
              "DEV-mode only tricks. It's possible that these don't work in " +
              "your browser. Try triggering the error in production mode, " +
              "or switching to a modern browser. If you suspect that this is " +
              "actually an issue with React, please file an issue."
          );
        } else if (isCrossOriginError) {
          error = new Error(
            "A cross-origin error was thrown. React doesn't have access to " +
              "the actual error object in development. " +
              "See https://fb.me/react-crossorigin-error for more information."
          );
        }

        this.onError(error);
      } // Remove our event listeners

      window.removeEventListener("error", handleWindowError);
    };

    invokeGuardedCallbackImpl = invokeGuardedCallbackDev;
  }
}

var invokeGuardedCallbackImpl$1 = invokeGuardedCallbackImpl;

var hasError = false;
var caughtError = null; // Used by event system to capture/rethrow the first error.

var hasRethrowError = false;
var rethrowError = null;
var reporter = {
  onError: function(error) {
    hasError = true;
    caughtError = error;
  }
};
/**
 * Call a function while guarding against errors that happens within it.
 * Returns an error if it throws, otherwise null.
 *
 * In production, this is implemented using a try-catch. The reason we don't
 * use a try-catch directly is so that we can swap out a different
 * implementation in DEV mode.
 *
 * @param {String} name of the guard to use for logging or debugging
 * @param {Function} func The function to invoke
 * @param {*} context The context to use when calling the function
 * @param {...*} args Arguments for function
 */

function invokeGuardedCallback(name, func, context, a, b, c, d, e, f) {
  hasError = false;
  caughtError = null;
  invokeGuardedCallbackImpl$1.apply(reporter, arguments);
}
/**
 * Same as invokeGuardedCallback, but instead of returning an error, it stores
 * it in a global so it can be rethrown by `rethrowCaughtError` later.
 * TODO: See if caughtError and rethrowError can be unified.
 *
 * @param {String} name of the guard to use for logging or debugging
 * @param {Function} func The function to invoke
 * @param {*} context The context to use when calling the function
 * @param {...*} args Arguments for function
 */

function invokeGuardedCallbackAndCatchFirstError(
  name,
  func,
  context,
  a,
  b,
  c,
  d,
  e,
  f
) {
  invokeGuardedCallback.apply(this, arguments);

  if (hasError) {
    var error = clearCaughtError();

    if (!hasRethrowError) {
      hasRethrowError = true;
      rethrowError = error;
    }
  }
}
/**
 * During execution of guarded functions we will capture the first error which
 * we will rethrow to be handled by the top level error handler.
 */

function rethrowCaughtError() {
  if (hasRethrowError) {
    var error = rethrowError;
    hasRethrowError = false;
    rethrowError = null;
    throw error;
  }
}
function hasCaughtError() {
  return hasError;
}
function clearCaughtError() {
  if (hasError) {
    var error = caughtError;
    hasError = false;
    caughtError = null;
    return error;
  } else {
    {
      throw Error(
        "clearCaughtError was called but no error was captured. This error is likely caused by a bug in React. Please file an issue."
      );
    }
  }
}

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */
var warningWithoutStack = function() {};

{
  warningWithoutStack = function(condition, format) {
    for (
      var _len = arguments.length,
        args = new Array(_len > 2 ? _len - 2 : 0),
        _key = 2;
      _key < _len;
      _key++
    ) {
      args[_key - 2] = arguments[_key];
    }

    if (format === undefined) {
      throw new Error(
        "`warningWithoutStack(condition, format, ...args)` requires a warning " +
          "message argument"
      );
    }

    if (args.length > 8) {
      // Check before the condition to catch violations early.
      throw new Error(
        "warningWithoutStack() currently supports at most 8 arguments."
      );
    }

    if (condition) {
      return;
    }

    if (typeof console !== "undefined") {
      var argsWithFormat = args.map(function(item) {
        return "" + item;
      });
      argsWithFormat.unshift("Warning: " + format); // We intentionally don't use spread (or .apply) directly because it
      // breaks IE9: https://github.com/facebook/react/issues/13610

      Function.prototype.apply.call(console.error, console, argsWithFormat);
    }

    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      var argIndex = 0;
      var message =
        "Warning: " +
        format.replace(/%s/g, function() {
          return args[argIndex++];
        });
      throw new Error(message);
    } catch (x) {}
  };
}

var warningWithoutStack$1 = warningWithoutStack;

var getFiberCurrentPropsFromNode = null;
var getInstanceFromNode = null;
var getNodeFromInstance = null;
function setComponentTree(
  getFiberCurrentPropsFromNodeImpl,
  getInstanceFromNodeImpl,
  getNodeFromInstanceImpl
) {
  getFiberCurrentPropsFromNode = getFiberCurrentPropsFromNodeImpl;
  getInstanceFromNode = getInstanceFromNodeImpl;
  getNodeFromInstance = getNodeFromInstanceImpl;

  {
    !(getNodeFromInstance && getInstanceFromNode)
      ? warningWithoutStack$1(
          false,
          "EventPluginUtils.setComponentTree(...): Injected " +
            "module is missing getNodeFromInstance or getInstanceFromNode."
        )
      : void 0;
  }
}
var validateEventDispatches;

{
  validateEventDispatches = function(event) {
    var dispatchListeners = event._dispatchListeners;
    var dispatchInstances = event._dispatchInstances;
    var listenersIsArr = Array.isArray(dispatchListeners);
    var listenersLen = listenersIsArr
      ? dispatchListeners.length
      : dispatchListeners
        ? 1
        : 0;
    var instancesIsArr = Array.isArray(dispatchInstances);
    var instancesLen = instancesIsArr
      ? dispatchInstances.length
      : dispatchInstances
        ? 1
        : 0;
    !(instancesIsArr === listenersIsArr && instancesLen === listenersLen)
      ? warningWithoutStack$1(false, "EventPluginUtils: Invalid `event`.")
      : void 0;
  };
}
/**
 * Dispatch the event to the listener.
 * @param {SyntheticEvent} event SyntheticEvent to handle
 * @param {function} listener Application-level callback
 * @param {*} inst Internal component instance
 */

function executeDispatch(event, listener, inst) {
  var type = event.type || "unknown-event";
  event.currentTarget = getNodeFromInstance(inst);
  invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
  event.currentTarget = null;
}
/**
 * Standard/simple iteration through an event's collected dispatches.
 */

function executeDispatchesInOrder(event) {
  var dispatchListeners = event._dispatchListeners;
  var dispatchInstances = event._dispatchInstances;

  {
    validateEventDispatches(event);
  }

  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      } // Listeners and Instances are two parallel arrays that are always in sync.

      executeDispatch(event, dispatchListeners[i], dispatchInstances[i]);
    }
  } else if (dispatchListeners) {
    executeDispatch(event, dispatchListeners, dispatchInstances);
  }

  event._dispatchListeners = null;
  event._dispatchInstances = null;
}
/**
 * Standard/simple iteration through an event's collected dispatches, but stops
 * at the first dispatch execution returning true, and returns that id.
 *
 * @return {?string} id of the first dispatch execution who's listener returns
 * true, or null if no listener returned true.
 */

function executeDispatchesInOrderStopAtTrueImpl(event) {
  var dispatchListeners = event._dispatchListeners;
  var dispatchInstances = event._dispatchInstances;

  {
    validateEventDispatches(event);
  }

  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      } // Listeners and Instances are two parallel arrays that are always in sync.

      if (dispatchListeners[i](event, dispatchInstances[i])) {
        return dispatchInstances[i];
      }
    }
  } else if (dispatchListeners) {
    if (dispatchListeners(event, dispatchInstances)) {
      return dispatchInstances;
    }
  }

  return null;
}
/**
 * @see executeDispatchesInOrderStopAtTrueImpl
 */

function executeDispatchesInOrderStopAtTrue(event) {
  var ret = executeDispatchesInOrderStopAtTrueImpl(event);
  event._dispatchInstances = null;
  event._dispatchListeners = null;
  return ret;
}
/**
 * Execution of a "direct" dispatch - there must be at most one dispatch
 * accumulated on the event or it is considered an error. It doesn't really make
 * sense for an event with multiple dispatches (bubbled) to keep track of the
 * return values at each dispatch execution, but it does tend to make sense when
 * dealing with "direct" dispatches.
 *
 * @return {*} The return value of executing the single dispatch.
 */

function executeDirectDispatch(event) {
  {
    validateEventDispatches(event);
  }

  var dispatchListener = event._dispatchListeners;
  var dispatchInstance = event._dispatchInstances;

  if (!!Array.isArray(dispatchListener)) {
    throw Error("executeDirectDispatch(...): Invalid `event`.");
  }

  event.currentTarget = dispatchListener
    ? getNodeFromInstance(dispatchInstance)
    : null;
  var res = dispatchListener ? dispatchListener(event) : null;
  event.currentTarget = null;
  event._dispatchListeners = null;
  event._dispatchInstances = null;
  return res;
}
/**
 * @param {SyntheticEvent} event
 * @return {boolean} True iff number of dispatches accumulated is greater than 0.
 */

function hasDispatches(event) {
  return !!event._dispatchListeners;
}

/**
 * Accumulates items that must not be null or undefined into the first one. This
 * is used to conserve memory by avoiding array allocations, and thus sacrifices
 * API cleanness. Since `current` can be null before being passed in and not
 * null after this function, make sure to assign it back to `current`:
 *
 * `a = accumulateInto(a, b);`
 *
 * This API should be sparingly used. Try `accumulate` for something cleaner.
 *
 * @return {*|array<*>} An accumulation of items.
 */

function accumulateInto(current, next) {
  if (!(next != null)) {
    throw Error(
      "accumulateInto(...): Accumulated items must not be null or undefined."
    );
  }

  if (current == null) {
    return next;
  } // Both are not empty. Warning: Never call x.concat(y) when you are not
  // certain that x is an Array (x could be a string with concat method).

  if (Array.isArray(current)) {
    if (Array.isArray(next)) {
      current.push.apply(current, next);
      return current;
    }

    current.push(next);
    return current;
  }

  if (Array.isArray(next)) {
    // A bit too dangerous to mutate `next`.
    return [current].concat(next);
  }

  return [current, next];
}

/**
 * @param {array} arr an "accumulation" of items which is either an Array or
 * a single item. Useful when paired with the `accumulate` module. This is a
 * simple utility that allows us to reason about a collection of items, but
 * handling the case when there is exactly one item (and we do not need to
 * allocate an array).
 * @param {function} cb Callback invoked with each element or a collection.
 * @param {?} [scope] Scope used as `this` in a callback.
 */
function forEachAccumulated(arr, cb, scope) {
  if (Array.isArray(arr)) {
    arr.forEach(cb, scope);
  } else if (arr) {
    cb.call(scope, arr);
  }
}

/**
 * Internal queue of events that have accumulated their dispatches and are
 * waiting to have their dispatches executed.
 */

var eventQueue = null;
/**
 * Dispatches an event and releases it back into the pool, unless persistent.
 *
 * @param {?object} event Synthetic event to be dispatched.
 * @private
 */

var executeDispatchesAndRelease = function(event) {
  if (event) {
    executeDispatchesInOrder(event);

    if (!event.isPersistent()) {
      event.constructor.release(event);
    }
  }
};

var executeDispatchesAndReleaseTopLevel = function(e) {
  return executeDispatchesAndRelease(e);
};

function runEventsInBatch(events) {
  if (events !== null) {
    eventQueue = accumulateInto(eventQueue, events);
  } // Set `eventQueue` to null before processing it so that we can tell if more
  // events get enqueued while processing.

  var processingEventQueue = eventQueue;
  eventQueue = null;

  if (!processingEventQueue) {
    return;
  }

  forEachAccumulated(processingEventQueue, executeDispatchesAndReleaseTopLevel);

  if (!!eventQueue) {
    throw Error(
      "processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented."
    );
  } // This would be a good time to rethrow if any of the event handlers threw.

  rethrowCaughtError();
}

function isInteractive(tag) {
  return (
    tag === "button" ||
    tag === "input" ||
    tag === "select" ||
    tag === "textarea"
  );
}

function shouldPreventMouseEvent(name, type, props) {
  switch (name) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
      return !!(props.disabled && isInteractive(type));

    default:
      return false;
  }
}
/**
 * This is a unified interface for event plugins to be installed and configured.
 *
 * Event plugins can implement the following properties:
 *
 *   `extractEvents` {function(string, DOMEventTarget, string, object): *}
 *     Required. When a top-level event is fired, this method is expected to
 *     extract synthetic events that will in turn be queued and dispatched.
 *
 *   `eventTypes` {object}
 *     Optional, plugins that fire events must publish a mapping of registration
 *     names that are used to register listeners. Values of this mapping must
 *     be objects that contain `registrationName` or `phasedRegistrationNames`.
 *
 *   `executeDispatch` {function(object, function, string)}
 *     Optional, allows plugins to override how an event gets dispatched. By
 *     default, the listener is simply invoked.
 *
 * Each plugin that is injected into `EventsPluginHub` is immediately operable.
 *
 * @public
 */

/**
 * Methods for injecting dependencies.
 */

var injection = {
  /**
   * @param {array} InjectedEventPluginOrder
   * @public
   */
  injectEventPluginOrder: injectEventPluginOrder,

  /**
   * @param {object} injectedNamesToPlugins Map from names to plugin modules.
   */
  injectEventPluginsByName: injectEventPluginsByName
};
/**
 * @param {object} inst The instance, which is the source of events.
 * @param {string} registrationName Name of listener (e.g. `onClick`).
 * @return {?function} The stored callback.
 */

function getListener(inst, registrationName) {
  var listener; // TODO: shouldPreventMouseEvent is DOM-specific and definitely should not
  // live here; needs to be moved to a better place soon

  var stateNode = inst.stateNode;

  if (!stateNode) {
    // Work in progress (ex: onload events in incremental mode).
    return null;
  }

  var props = getFiberCurrentPropsFromNode(stateNode);

  if (!props) {
    // Work in progress.
    return null;
  }

  listener = props[registrationName];

  if (shouldPreventMouseEvent(registrationName, inst.type, props)) {
    return null;
  }

  if (!(!listener || typeof listener === "function")) {
    throw Error(
      "Expected `" +
        registrationName +
        "` listener to be a function, instead got a value of `" +
        typeof listener +
        "` type."
    );
  }

  return listener;
}
/**
 * Allows registered plugins an opportunity to extract events from top-level
 * native browser events.
 *
 * @return {*} An accumulation of synthetic events.
 * @internal
 */

function extractPluginEvents(
  topLevelType,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags
) {
  var events = null;

  for (var i = 0; i < plugins.length; i++) {
    // Not every plugin in the ordering may be loaded at runtime.
    var possiblePlugin = plugins[i];

    if (possiblePlugin) {
      var extractedEvents = possiblePlugin.extractEvents(
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags
      );

      if (extractedEvents) {
        events = accumulateInto(events, extractedEvents);
      }
    }
  }

  return events;
}

function runExtractedPluginEventsInBatch(
  topLevelType,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags
) {
  var events = extractPluginEvents(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags
  );
  runEventsInBatch(events);
}

var FunctionComponent = 0;
var ClassComponent = 1;
var IndeterminateComponent = 2; // Before we know whether it is function or class

var HostRoot = 3; // Root of a host tree. Could be nested inside another node.

var HostPortal = 4; // A subtree. Could be an entry point to a different renderer.

var HostComponent = 5;
var HostText = 6;
var Fragment = 7;
var Mode = 8;
var ContextConsumer = 9;
var ContextProvider = 10;
var ForwardRef = 11;
var Profiler = 12;
var SuspenseComponent = 13;
var MemoComponent = 14;
var SimpleMemoComponent = 15;
var LazyComponent = 16;
var IncompleteClassComponent = 17;
var DehydratedFragment = 18;
var SuspenseListComponent = 19;
var FundamentalComponent = 20;
var ScopeComponent = 21;

function getParent(inst) {
  do {
    inst = inst.return; // TODO: If this is a HostRoot we might want to bail out.
    // That is depending on if we want nested subtrees (layers) to bubble
    // events to their parent. We could also go through parentNode on the
    // host node but that wouldn't work for React Native and doesn't let us
    // do the portal feature.
  } while (inst && inst.tag !== HostComponent);

  if (inst) {
    return inst;
  }

  return null;
}
/**
 * Return the lowest common ancestor of A and B, or null if they are in
 * different trees.
 */

function getLowestCommonAncestor(instA, instB) {
  var depthA = 0;

  for (var tempA = instA; tempA; tempA = getParent(tempA)) {
    depthA++;
  }

  var depthB = 0;

  for (var tempB = instB; tempB; tempB = getParent(tempB)) {
    depthB++;
  } // If A is deeper, crawl up.

  while (depthA - depthB > 0) {
    instA = getParent(instA);
    depthA--;
  } // If B is deeper, crawl up.

  while (depthB - depthA > 0) {
    instB = getParent(instB);
    depthB--;
  } // Walk in lockstep until we find a match.

  var depth = depthA;

  while (depth--) {
    if (instA === instB || instA === instB.alternate) {
      return instA;
    }

    instA = getParent(instA);
    instB = getParent(instB);
  }

  return null;
}
/**
 * Return if A is an ancestor of B.
 */

function isAncestor(instA, instB) {
  while (instB) {
    if (instA === instB || instA === instB.alternate) {
      return true;
    }

    instB = getParent(instB);
  }

  return false;
}
/**
 * Return the parent instance of the passed-in instance.
 */

function getParentInstance(inst) {
  return getParent(inst);
}
/**
 * Simulates the traversal of a two-phase, capture/bubble event dispatch.
 */

function traverseTwoPhase(inst, fn, arg) {
  var path = [];

  while (inst) {
    path.push(inst);
    inst = getParent(inst);
  }

  var i;

  for (i = path.length; i-- > 0; ) {
    fn(path[i], "captured", arg);
  }

  for (i = 0; i < path.length; i++) {
    fn(path[i], "bubbled", arg);
  }
}
/**
 * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
 * should would receive a `mouseEnter` or `mouseLeave` event.
 *
 * Does not invoke the callback on the nearest common ancestor because nothing
 * "entered" or "left" that element.
 */

/**
 * Some event types have a notion of different registration names for different
 * "phases" of propagation. This finds listeners by a given phase.
 */
function listenerAtPhase(inst, event, propagationPhase) {
  var registrationName =
    event.dispatchConfig.phasedRegistrationNames[propagationPhase];
  return getListener(inst, registrationName);
}
/**
 * A small set of propagation patterns, each of which will accept a small amount
 * of information, and generate a set of "dispatch ready event objects" - which
 * are sets of events that have already been annotated with a set of dispatched
 * listener functions/ids. The API is designed this way to discourage these
 * propagation strategies from actually executing the dispatches, since we
 * always want to collect the entire set of dispatches before executing even a
 * single one.
 */

/**
 * Tags a `SyntheticEvent` with dispatched listeners. Creating this function
 * here, allows us to not have to bind or create functions for each event.
 * Mutating the event's members allows us to not have to create a wrapping
 * "dispatch" object that pairs the event with the listener.
 */

function accumulateDirectionalDispatches(inst, phase, event) {
  {
    !inst
      ? warningWithoutStack$1(false, "Dispatching inst must not be null")
      : void 0;
  }

  var listener = listenerAtPhase(inst, event, phase);

  if (listener) {
    event._dispatchListeners = accumulateInto(
      event._dispatchListeners,
      listener
    );
    event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
  }
}
/**
 * Collect dispatches (must be entirely collected before dispatching - see unit
 * tests). Lazily allocate the array to conserve memory.  We must loop through
 * each event and perform the traversal for each one. We cannot perform a
 * single traversal for the entire collection of events because each event may
 * have a different target.
 */

function accumulateTwoPhaseDispatchesSingle(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
  }
}
/**
 * Same as `accumulateTwoPhaseDispatchesSingle`, but skips over the targetID.
 */

function accumulateTwoPhaseDispatchesSingleSkipTarget(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    var targetInst = event._targetInst;
    var parentInst = targetInst ? getParentInstance(targetInst) : null;
    traverseTwoPhase(parentInst, accumulateDirectionalDispatches, event);
  }
}
/**
 * Accumulates without regard to direction, does not look for phased
 * registration names. Same as `accumulateDirectDispatchesSingle` but without
 * requiring that the `dispatchMarker` be the same as the dispatched ID.
 */

function accumulateDispatches(inst, ignoredDirection, event) {
  if (inst && event && event.dispatchConfig.registrationName) {
    var registrationName = event.dispatchConfig.registrationName;
    var listener = getListener(inst, registrationName);

    if (listener) {
      event._dispatchListeners = accumulateInto(
        event._dispatchListeners,
        listener
      );
      event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
    }
  }
}
/**
 * Accumulates dispatches on an `SyntheticEvent`, but only for the
 * `dispatchMarker`.
 * @param {SyntheticEvent} event
 */

function accumulateDirectDispatchesSingle(event) {
  if (event && event.dispatchConfig.registrationName) {
    accumulateDispatches(event._targetInst, null, event);
  }
}

function accumulateTwoPhaseDispatches(events) {
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
}
function accumulateTwoPhaseDispatchesSkipTarget(events) {
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingleSkipTarget);
}

function accumulateDirectDispatches(events) {
  forEachAccumulated(events, accumulateDirectDispatchesSingle);
}

/* eslint valid-typeof: 0 */
var EVENT_POOL_SIZE = 10;
/**
 * @interface Event
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */

var EventInterface = {
  type: null,
  target: null,
  // currentTarget is set when dispatching; no use in copying it here
  currentTarget: function() {
    return null;
  },
  eventPhase: null,
  bubbles: null,
  cancelable: null,
  timeStamp: function(event) {
    return event.timeStamp || Date.now();
  },
  defaultPrevented: null,
  isTrusted: null
};

function functionThatReturnsTrue() {
  return true;
}

function functionThatReturnsFalse() {
  return false;
}
/**
 * Synthetic events are dispatched by event plugins, typically in response to a
 * top-level event delegation handler.
 *
 * These systems should generally use pooling to reduce the frequency of garbage
 * collection. The system should check `isPersistent` to determine whether the
 * event should be released into the pool after being dispatched. Users that
 * need a persisted event should invoke `persist`.
 *
 * Synthetic events (and subclasses) implement the DOM Level 3 Events API by
 * normalizing browser quirks. Subclasses do not necessarily have to implement a
 * DOM interface; custom application-specific events can also subclass this.
 *
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {*} targetInst Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @param {DOMEventTarget} nativeEventTarget Target node.
 */

function SyntheticEvent(
  dispatchConfig,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {
  {
    // these have a getter/setter for warnings
    delete this.nativeEvent;
    delete this.preventDefault;
    delete this.stopPropagation;
    delete this.isDefaultPrevented;
    delete this.isPropagationStopped;
  }

  this.dispatchConfig = dispatchConfig;
  this._targetInst = targetInst;
  this.nativeEvent = nativeEvent;
  var Interface = this.constructor.Interface;

  for (var propName in Interface) {
    if (!Interface.hasOwnProperty(propName)) {
      continue;
    }

    {
      delete this[propName]; // this has a getter/setter for warnings
    }

    var normalize = Interface[propName];

    if (normalize) {
      this[propName] = normalize(nativeEvent);
    } else {
      if (propName === "target") {
        this.target = nativeEventTarget;
      } else {
        this[propName] = nativeEvent[propName];
      }
    }
  }

  var defaultPrevented =
    nativeEvent.defaultPrevented != null
      ? nativeEvent.defaultPrevented
      : nativeEvent.returnValue === false;

  if (defaultPrevented) {
    this.isDefaultPrevented = functionThatReturnsTrue;
  } else {
    this.isDefaultPrevented = functionThatReturnsFalse;
  }

  this.isPropagationStopped = functionThatReturnsFalse;
  return this;
}

Object.assign(SyntheticEvent.prototype, {
  preventDefault: function() {
    this.defaultPrevented = true;
    var event = this.nativeEvent;

    if (!event) {
      return;
    }

    if (event.preventDefault) {
      event.preventDefault();
    } else if (typeof event.returnValue !== "unknown") {
      event.returnValue = false;
    }

    this.isDefaultPrevented = functionThatReturnsTrue;
  },
  stopPropagation: function() {
    var event = this.nativeEvent;

    if (!event) {
      return;
    }

    if (event.stopPropagation) {
      event.stopPropagation();
    } else if (typeof event.cancelBubble !== "unknown") {
      // The ChangeEventPlugin registers a "propertychange" event for
      // IE. This event does not support bubbling or cancelling, and
      // any references to cancelBubble throw "Member not found".  A
      // typeof check of "unknown" circumvents this issue (and is also
      // IE specific).
      event.cancelBubble = true;
    }

    this.isPropagationStopped = functionThatReturnsTrue;
  },

  /**
   * We release all dispatched `SyntheticEvent`s after each event loop, adding
   * them back into the pool. This allows a way to hold onto a reference that
   * won't be added back into the pool.
   */
  persist: function() {
    this.isPersistent = functionThatReturnsTrue;
  },

  /**
   * Checks if this event should be released back into the pool.
   *
   * @return {boolean} True if this should not be released, false otherwise.
   */
  isPersistent: functionThatReturnsFalse,

  /**
   * `PooledClass` looks for `destructor` on each instance it releases.
   */
  destructor: function() {
    var Interface = this.constructor.Interface;

    for (var propName in Interface) {
      {
        Object.defineProperty(
          this,
          propName,
          getPooledWarningPropertyDefinition(propName, Interface[propName])
        );
      }
    }

    this.dispatchConfig = null;
    this._targetInst = null;
    this.nativeEvent = null;
    this.isDefaultPrevented = functionThatReturnsFalse;
    this.isPropagationStopped = functionThatReturnsFalse;
    this._dispatchListeners = null;
    this._dispatchInstances = null;

    {
      Object.defineProperty(
        this,
        "nativeEvent",
        getPooledWarningPropertyDefinition("nativeEvent", null)
      );
      Object.defineProperty(
        this,
        "isDefaultPrevented",
        getPooledWarningPropertyDefinition(
          "isDefaultPrevented",
          functionThatReturnsFalse
        )
      );
      Object.defineProperty(
        this,
        "isPropagationStopped",
        getPooledWarningPropertyDefinition(
          "isPropagationStopped",
          functionThatReturnsFalse
        )
      );
      Object.defineProperty(
        this,
        "preventDefault",
        getPooledWarningPropertyDefinition("preventDefault", function() {})
      );
      Object.defineProperty(
        this,
        "stopPropagation",
        getPooledWarningPropertyDefinition("stopPropagation", function() {})
      );
    }
  }
});
SyntheticEvent.Interface = EventInterface;
/**
 * Helper to reduce boilerplate when creating subclasses.
 */

SyntheticEvent.extend = function(Interface) {
  var Super = this;

  var E = function() {};

  E.prototype = Super.prototype;
  var prototype = new E();

  function Class() {
    return Super.apply(this, arguments);
  }

  Object.assign(prototype, Class.prototype);
  Class.prototype = prototype;
  Class.prototype.constructor = Class;
  Class.Interface = Object.assign({}, Super.Interface, Interface);
  Class.extend = Super.extend;
  addEventPoolingTo(Class);
  return Class;
};

addEventPoolingTo(SyntheticEvent);
/**
 * Helper to nullify syntheticEvent instance properties when destructing
 *
 * @param {String} propName
 * @param {?object} getVal
 * @return {object} defineProperty object
 */

function getPooledWarningPropertyDefinition(propName, getVal) {
  var isFunction = typeof getVal === "function";
  return {
    configurable: true,
    set: set,
    get: get
  };

  function set(val) {
    var action = isFunction ? "setting the method" : "setting the property";
    warn(action, "This is effectively a no-op");
    return val;
  }

  function get() {
    var action = isFunction ? "accessing the method" : "accessing the property";
    var result = isFunction
      ? "This is a no-op function"
      : "This is set to null";
    warn(action, result);
    return getVal;
  }

  function warn(action, result) {
    var warningCondition = false;
    !warningCondition
      ? warningWithoutStack$1(
          false,
          "This synthetic event is reused for performance reasons. If you're seeing this, " +
            "you're %s `%s` on a released/nullified synthetic event. %s. " +
            "If you must keep the original synthetic event around, use event.persist(). " +
            "See https://fb.me/react-event-pooling for more information.",
          action,
          propName,
          result
        )
      : void 0;
  }
}

function getPooledEvent(dispatchConfig, targetInst, nativeEvent, nativeInst) {
  var EventConstructor = this;

  if (EventConstructor.eventPool.length) {
    var instance = EventConstructor.eventPool.pop();
    EventConstructor.call(
      instance,
      dispatchConfig,
      targetInst,
      nativeEvent,
      nativeInst
    );
    return instance;
  }

  return new EventConstructor(
    dispatchConfig,
    targetInst,
    nativeEvent,
    nativeInst
  );
}

function releasePooledEvent(event) {
  var EventConstructor = this;

  if (!(event instanceof EventConstructor)) {
    throw Error(
      "Trying to release an event instance into a pool of a different type."
    );
  }

  event.destructor();

  if (EventConstructor.eventPool.length < EVENT_POOL_SIZE) {
    EventConstructor.eventPool.push(event);
  }
}

function addEventPoolingTo(EventConstructor) {
  EventConstructor.eventPool = [];
  EventConstructor.getPooled = getPooledEvent;
  EventConstructor.release = releasePooledEvent;
}

/**
 * `touchHistory` isn't actually on the native event, but putting it in the
 * interface will ensure that it is cleaned up when pooled/destroyed. The
 * `ResponderEventPlugin` will populate it appropriately.
 */

var ResponderSyntheticEvent = SyntheticEvent.extend({
  touchHistory: function(nativeEvent) {
    return null; // Actually doesn't even look at the native event.
  }
});

var TOP_TOUCH_START = "topTouchStart";
var TOP_TOUCH_MOVE = "topTouchMove";
var TOP_TOUCH_END = "topTouchEnd";
var TOP_TOUCH_CANCEL = "topTouchCancel";
var TOP_SCROLL = "topScroll";
var TOP_SELECTION_CHANGE = "topSelectionChange";
function isStartish(topLevelType) {
  return topLevelType === TOP_TOUCH_START;
}
function isMoveish(topLevelType) {
  return topLevelType === TOP_TOUCH_MOVE;
}
function isEndish(topLevelType) {
  return topLevelType === TOP_TOUCH_END || topLevelType === TOP_TOUCH_CANCEL;
}
var startDependencies = [TOP_TOUCH_START];
var moveDependencies = [TOP_TOUCH_MOVE];
var endDependencies = [TOP_TOUCH_CANCEL, TOP_TOUCH_END];

/**
 * Tracks the position and time of each active touch by `touch.identifier`. We
 * should typically only see IDs in the range of 1-20 because IDs get recycled
 * when touches end and start again.
 */

var MAX_TOUCH_BANK = 20;
var touchBank = [];
var touchHistory = {
  touchBank: touchBank,
  numberActiveTouches: 0,
  // If there is only one active touch, we remember its location. This prevents
  // us having to loop through all of the touches all the time in the most
  // common case.
  indexOfSingleActiveTouch: -1,
  mostRecentTimeStamp: 0
};

function timestampForTouch(touch) {
  // The legacy internal implementation provides "timeStamp", which has been
  // renamed to "timestamp". Let both work for now while we iron it out
  // TODO (evv): rename timeStamp to timestamp in internal code
  return touch.timeStamp || touch.timestamp;
}
/**
 * TODO: Instead of making gestures recompute filtered velocity, we could
 * include a built in velocity computation that can be reused globally.
 */

function createTouchRecord(touch) {
  return {
    touchActive: true,
    startPageX: touch.pageX,
    startPageY: touch.pageY,
    startTimeStamp: timestampForTouch(touch),
    currentPageX: touch.pageX,
    currentPageY: touch.pageY,
    currentTimeStamp: timestampForTouch(touch),
    previousPageX: touch.pageX,
    previousPageY: touch.pageY,
    previousTimeStamp: timestampForTouch(touch)
  };
}

function resetTouchRecord(touchRecord, touch) {
  touchRecord.touchActive = true;
  touchRecord.startPageX = touch.pageX;
  touchRecord.startPageY = touch.pageY;
  touchRecord.startTimeStamp = timestampForTouch(touch);
  touchRecord.currentPageX = touch.pageX;
  touchRecord.currentPageY = touch.pageY;
  touchRecord.currentTimeStamp = timestampForTouch(touch);
  touchRecord.previousPageX = touch.pageX;
  touchRecord.previousPageY = touch.pageY;
  touchRecord.previousTimeStamp = timestampForTouch(touch);
}

function getTouchIdentifier(_ref) {
  var identifier = _ref.identifier;

  if (!(identifier != null)) {
    throw Error("Touch object is missing identifier.");
  }

  {
    !(identifier <= MAX_TOUCH_BANK)
      ? warningWithoutStack$1(
          false,
          "Touch identifier %s is greater than maximum supported %s which causes " +
            "performance issues backfilling array locations for all of the indices.",
          identifier,
          MAX_TOUCH_BANK
        )
      : void 0;
  }

  return identifier;
}

function recordTouchStart(touch) {
  var identifier = getTouchIdentifier(touch);
  var touchRecord = touchBank[identifier];

  if (touchRecord) {
    resetTouchRecord(touchRecord, touch);
  } else {
    touchBank[identifier] = createTouchRecord(touch);
  }

  touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
}

function recordTouchMove(touch) {
  var touchRecord = touchBank[getTouchIdentifier(touch)];

  if (touchRecord) {
    touchRecord.touchActive = true;
    touchRecord.previousPageX = touchRecord.currentPageX;
    touchRecord.previousPageY = touchRecord.currentPageY;
    touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
    touchRecord.currentPageX = touch.pageX;
    touchRecord.currentPageY = touch.pageY;
    touchRecord.currentTimeStamp = timestampForTouch(touch);
    touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
  } else {
    console.warn(
      "Cannot record touch move without a touch start.\n" + "Touch Move: %s\n",
      "Touch Bank: %s",
      printTouch(touch),
      printTouchBank()
    );
  }
}

function recordTouchEnd(touch) {
  var touchRecord = touchBank[getTouchIdentifier(touch)];

  if (touchRecord) {
    touchRecord.touchActive = false;
    touchRecord.previousPageX = touchRecord.currentPageX;
    touchRecord.previousPageY = touchRecord.currentPageY;
    touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
    touchRecord.currentPageX = touch.pageX;
    touchRecord.currentPageY = touch.pageY;
    touchRecord.currentTimeStamp = timestampForTouch(touch);
    touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
  } else {
    console.warn(
      "Cannot record touch end without a touch start.\n" + "Touch End: %s\n",
      "Touch Bank: %s",
      printTouch(touch),
      printTouchBank()
    );
  }
}

function printTouch(touch) {
  return JSON.stringify({
    identifier: touch.identifier,
    pageX: touch.pageX,
    pageY: touch.pageY,
    timestamp: timestampForTouch(touch)
  });
}

function printTouchBank() {
  var printed = JSON.stringify(touchBank.slice(0, MAX_TOUCH_BANK));

  if (touchBank.length > MAX_TOUCH_BANK) {
    printed += " (original size: " + touchBank.length + ")";
  }

  return printed;
}

var ResponderTouchHistoryStore = {
  recordTouchTrack: function(topLevelType, nativeEvent) {
    if (isMoveish(topLevelType)) {
      nativeEvent.changedTouches.forEach(recordTouchMove);
    } else if (isStartish(topLevelType)) {
      nativeEvent.changedTouches.forEach(recordTouchStart);
      touchHistory.numberActiveTouches = nativeEvent.touches.length;

      if (touchHistory.numberActiveTouches === 1) {
        touchHistory.indexOfSingleActiveTouch =
          nativeEvent.touches[0].identifier;
      }
    } else if (isEndish(topLevelType)) {
      nativeEvent.changedTouches.forEach(recordTouchEnd);
      touchHistory.numberActiveTouches = nativeEvent.touches.length;

      if (touchHistory.numberActiveTouches === 1) {
        for (var i = 0; i < touchBank.length; i++) {
          var touchTrackToCheck = touchBank[i];

          if (touchTrackToCheck != null && touchTrackToCheck.touchActive) {
            touchHistory.indexOfSingleActiveTouch = i;
            break;
          }
        }

        {
          var activeRecord = touchBank[touchHistory.indexOfSingleActiveTouch];
          !(activeRecord != null && activeRecord.touchActive)
            ? warningWithoutStack$1(false, "Cannot find single active touch.")
            : void 0;
        }
      }
    }
  },
  touchHistory: touchHistory
};

/**
 * Accumulates items that must not be null or undefined.
 *
 * This is used to conserve memory by avoiding array allocations.
 *
 * @return {*|array<*>} An accumulation of items.
 */

function accumulate(current, next) {
  if (!(next != null)) {
    throw Error(
      "accumulate(...): Accumulated items must not be null or undefined."
    );
  }

  if (current == null) {
    return next;
  } // Both are not empty. Warning: Never call x.concat(y) when you are not
  // certain that x is an Array (x could be a string with concat method).

  if (Array.isArray(current)) {
    return current.concat(next);
  }

  if (Array.isArray(next)) {
    return [current].concat(next);
  }

  return [current, next];
}

/**
 * Instance of element that should respond to touch/move types of interactions,
 * as indicated explicitly by relevant callbacks.
 */

var responderInst = null;
/**
 * Count of current touches. A textInput should become responder iff the
 * selection changes while there is a touch on the screen.
 */

var trackedTouchCount = 0;

var changeResponder = function(nextResponderInst, blockHostResponder) {
  var oldResponderInst = responderInst;
  responderInst = nextResponderInst;

  if (ResponderEventPlugin.GlobalResponderHandler !== null) {
    ResponderEventPlugin.GlobalResponderHandler.onChange(
      oldResponderInst,
      nextResponderInst,
      blockHostResponder
    );
  }
};

var eventTypes = {
  /**
   * On a `touchStart`/`mouseDown`, is it desired that this element become the
   * responder?
   */
  startShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: "onStartShouldSetResponder",
      captured: "onStartShouldSetResponderCapture"
    },
    dependencies: startDependencies
  },

  /**
   * On a `scroll`, is it desired that this element become the responder? This
   * is usually not needed, but should be used to retroactively infer that a
   * `touchStart` had occurred during momentum scroll. During a momentum scroll,
   * a touch start will be immediately followed by a scroll event if the view is
   * currently scrolling.
   *
   * TODO: This shouldn't bubble.
   */
  scrollShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: "onScrollShouldSetResponder",
      captured: "onScrollShouldSetResponderCapture"
    },
    dependencies: [TOP_SCROLL]
  },

  /**
   * On text selection change, should this element become the responder? This
   * is needed for text inputs or other views with native selection, so the
   * JS view can claim the responder.
   *
   * TODO: This shouldn't bubble.
   */
  selectionChangeShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: "onSelectionChangeShouldSetResponder",
      captured: "onSelectionChangeShouldSetResponderCapture"
    },
    dependencies: [TOP_SELECTION_CHANGE]
  },

  /**
   * On a `touchMove`/`mouseMove`, is it desired that this element become the
   * responder?
   */
  moveShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: "onMoveShouldSetResponder",
      captured: "onMoveShouldSetResponderCapture"
    },
    dependencies: moveDependencies
  },

  /**
   * Direct responder events dispatched directly to responder. Do not bubble.
   */
  responderStart: {
    registrationName: "onResponderStart",
    dependencies: startDependencies
  },
  responderMove: {
    registrationName: "onResponderMove",
    dependencies: moveDependencies
  },
  responderEnd: {
    registrationName: "onResponderEnd",
    dependencies: endDependencies
  },
  responderRelease: {
    registrationName: "onResponderRelease",
    dependencies: endDependencies
  },
  responderTerminationRequest: {
    registrationName: "onResponderTerminationRequest",
    dependencies: []
  },
  responderGrant: {
    registrationName: "onResponderGrant",
    dependencies: []
  },
  responderReject: {
    registrationName: "onResponderReject",
    dependencies: []
  },
  responderTerminate: {
    registrationName: "onResponderTerminate",
    dependencies: []
  }
};
/**
 *
 * Responder System:
 * ----------------
 *
 * - A global, solitary "interaction lock" on a view.
 * - If a node becomes the responder, it should convey visual feedback
 *   immediately to indicate so, either by highlighting or moving accordingly.
 * - To be the responder means, that touches are exclusively important to that
 *   responder view, and no other view.
 * - While touches are still occurring, the responder lock can be transferred to
 *   a new view, but only to increasingly "higher" views (meaning ancestors of
 *   the current responder).
 *
 * Responder being granted:
 * ------------------------
 *
 * - Touch starts, moves, and scrolls can cause an ID to become the responder.
 * - We capture/bubble `startShouldSetResponder`/`moveShouldSetResponder` to
 *   the "appropriate place".
 * - If nothing is currently the responder, the "appropriate place" is the
 *   initiating event's `targetID`.
 * - If something *is* already the responder, the "appropriate place" is the
 *   first common ancestor of the event target and the current `responderInst`.
 * - Some negotiation happens: See the timing diagram below.
 * - Scrolled views automatically become responder. The reasoning is that a
 *   platform scroll view that isn't built on top of the responder system has
 *   began scrolling, and the active responder must now be notified that the
 *   interaction is no longer locked to it - the system has taken over.
 *
 * - Responder being released:
 *   As soon as no more touches that *started* inside of descendants of the
 *   *current* responderInst, an `onResponderRelease` event is dispatched to the
 *   current responder, and the responder lock is released.
 *
 * TODO:
 * - on "end", a callback hook for `onResponderEndShouldRemainResponder` that
 *   determines if the responder lock should remain.
 * - If a view shouldn't "remain" the responder, any active touches should by
 *   default be considered "dead" and do not influence future negotiations or
 *   bubble paths. It should be as if those touches do not exist.
 * -- For multitouch: Usually a translate-z will choose to "remain" responder
 *  after one out of many touches ended. For translate-y, usually the view
 *  doesn't wish to "remain" responder after one of many touches end.
 * - Consider building this on top of a `stopPropagation` model similar to
 *   `W3C` events.
 * - Ensure that `onResponderTerminate` is called on touch cancels, whether or
 *   not `onResponderTerminationRequest` returns `true` or `false`.
 *
 */

/*                                             Negotiation Performed
                                             +-----------------------+
                                            /                         \
Process low level events to    +     Current Responder      +   wantsResponderID
determine who to perform negot-|   (if any exists at all)   |
iation/transition              | Otherwise just pass through|
-------------------------------+----------------------------+------------------+
Bubble to find first ID        |                            |
to return true:wantsResponderID|                            |
                               |                            |
     +-------------+           |                            |
     | onTouchStart|           |                            |
     +------+------+     none  |                            |
            |            return|                            |
+-----------v-------------+true| +------------------------+ |
|onStartShouldSetResponder|----->|onResponderStart (cur)  |<-----------+
+-----------+-------------+    | +------------------------+ |          |
            |                  |                            | +--------+-------+
            | returned true for|       false:REJECT +-------->|onResponderReject
            | wantsResponderID |                    |       | +----------------+
            | (now attempt     | +------------------+-----+ |
            |  handoff)        | |   onResponder          | |
            +------------------->|      TerminationRequest| |
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |         true:GRANT +-------->|onResponderGrant|
                               |                            | +--------+-------+
                               | +------------------------+ |          |
                               | |   onResponderTerminate |<-----------+
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |                    +-------->|onResponderStart|
                               |                            | +----------------+
Bubble to find first ID        |                            |
to return true:wantsResponderID|                            |
                               |                            |
     +-------------+           |                            |
     | onTouchMove |           |                            |
     +------+------+     none  |                            |
            |            return|                            |
+-----------v-------------+true| +------------------------+ |
|onMoveShouldSetResponder |----->|onResponderMove (cur)   |<-----------+
+-----------+-------------+    | +------------------------+ |          |
            |                  |                            | +--------+-------+
            | returned true for|       false:REJECT +-------->|onResponderRejec|
            | wantsResponderID |                    |       | +----------------+
            | (now attempt     | +------------------+-----+ |
            |  handoff)        | |   onResponder          | |
            +------------------->|      TerminationRequest| |
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |         true:GRANT +-------->|onResponderGrant|
                               |                            | +--------+-------+
                               | +------------------------+ |          |
                               | |   onResponderTerminate |<-----------+
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |                    +-------->|onResponderMove |
                               |                            | +----------------+
                               |                            |
                               |                            |
      Some active touch started|                            |
      inside current responder | +------------------------+ |
      +------------------------->|      onResponderEnd    | |
      |                        | +------------------------+ |
  +---+---------+              |                            |
  | onTouchEnd  |              |                            |
  +---+---------+              |                            |
      |                        | +------------------------+ |
      +------------------------->|     onResponderEnd     | |
      No active touches started| +-----------+------------+ |
      inside current responder |             |              |
                               |             v              |
                               | +------------------------+ |
                               | |    onResponderRelease  | |
                               | +------------------------+ |
                               |                            |
                               +                            + */

/**
 * A note about event ordering in the `EventPluginHub`.
 *
 * Suppose plugins are injected in the following order:
 *
 * `[R, S, C]`
 *
 * To help illustrate the example, assume `S` is `SimpleEventPlugin` (for
 * `onClick` etc) and `R` is `ResponderEventPlugin`.
 *
 * "Deferred-Dispatched Events":
 *
 * - The current event plugin system will traverse the list of injected plugins,
 *   in order, and extract events by collecting the plugin's return value of
 *   `extractEvents()`.
 * - These events that are returned from `extractEvents` are "deferred
 *   dispatched events".
 * - When returned from `extractEvents`, deferred-dispatched events contain an
 *   "accumulation" of deferred dispatches.
 * - These deferred dispatches are accumulated/collected before they are
 *   returned, but processed at a later time by the `EventPluginHub` (hence the
 *   name deferred).
 *
 * In the process of returning their deferred-dispatched events, event plugins
 * themselves can dispatch events on-demand without returning them from
 * `extractEvents`. Plugins might want to do this, so that they can use event
 * dispatching as a tool that helps them decide which events should be extracted
 * in the first place.
 *
 * "On-Demand-Dispatched Events":
 *
 * - On-demand-dispatched events are not returned from `extractEvents`.
 * - On-demand-dispatched events are dispatched during the process of returning
 *   the deferred-dispatched events.
 * - They should not have side effects.
 * - They should be avoided, and/or eventually be replaced with another
 *   abstraction that allows event plugins to perform multiple "rounds" of event
 *   extraction.
 *
 * Therefore, the sequence of event dispatches becomes:
 *
 * - `R`s on-demand events (if any)   (dispatched by `R` on-demand)
 * - `S`s on-demand events (if any)   (dispatched by `S` on-demand)
 * - `C`s on-demand events (if any)   (dispatched by `C` on-demand)
 * - `R`s extracted events (if any)   (dispatched by `EventPluginHub`)
 * - `S`s extracted events (if any)   (dispatched by `EventPluginHub`)
 * - `C`s extracted events (if any)   (dispatched by `EventPluginHub`)
 *
 * In the case of `ResponderEventPlugin`: If the `startShouldSetResponder`
 * on-demand dispatch returns `true` (and some other details are satisfied) the
 * `onResponderGrant` deferred dispatched event is returned from
 * `extractEvents`. The sequence of dispatch executions in this case
 * will appear as follows:
 *
 * - `startShouldSetResponder` (`ResponderEventPlugin` dispatches on-demand)
 * - `touchStartCapture`       (`EventPluginHub` dispatches as usual)
 * - `touchStart`              (`EventPluginHub` dispatches as usual)
 * - `responderGrant/Reject`   (`EventPluginHub` dispatches as usual)
 */

function setResponderAndExtractTransfer(
  topLevelType,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {
  var shouldSetEventType = isStartish(topLevelType)
    ? eventTypes.startShouldSetResponder
    : isMoveish(topLevelType)
      ? eventTypes.moveShouldSetResponder
      : topLevelType === TOP_SELECTION_CHANGE
        ? eventTypes.selectionChangeShouldSetResponder
        : eventTypes.scrollShouldSetResponder; // TODO: stop one short of the current responder.

  var bubbleShouldSetFrom = !responderInst
    ? targetInst
    : getLowestCommonAncestor(responderInst, targetInst); // When capturing/bubbling the "shouldSet" event, we want to skip the target
  // (deepest ID) if it happens to be the current responder. The reasoning:
  // It's strange to get an `onMoveShouldSetResponder` when you're *already*
  // the responder.

  var skipOverBubbleShouldSetFrom = bubbleShouldSetFrom === responderInst;
  var shouldSetEvent = ResponderSyntheticEvent.getPooled(
    shouldSetEventType,
    bubbleShouldSetFrom,
    nativeEvent,
    nativeEventTarget
  );
  shouldSetEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;

  if (skipOverBubbleShouldSetFrom) {
    accumulateTwoPhaseDispatchesSkipTarget(shouldSetEvent);
  } else {
    accumulateTwoPhaseDispatches(shouldSetEvent);
  }

  var wantsResponderInst = executeDispatchesInOrderStopAtTrue(shouldSetEvent);

  if (!shouldSetEvent.isPersistent()) {
    shouldSetEvent.constructor.release(shouldSetEvent);
  }

  if (!wantsResponderInst || wantsResponderInst === responderInst) {
    return null;
  }

  var extracted;
  var grantEvent = ResponderSyntheticEvent.getPooled(
    eventTypes.responderGrant,
    wantsResponderInst,
    nativeEvent,
    nativeEventTarget
  );
  grantEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
  accumulateDirectDispatches(grantEvent);
  var blockHostResponder = executeDirectDispatch(grantEvent) === true;

  if (responderInst) {
    var terminationRequestEvent = ResponderSyntheticEvent.getPooled(
      eventTypes.responderTerminationRequest,
      responderInst,
      nativeEvent,
      nativeEventTarget
    );
    terminationRequestEvent.touchHistory =
      ResponderTouchHistoryStore.touchHistory;
    accumulateDirectDispatches(terminationRequestEvent);
    var shouldSwitch =
      !hasDispatches(terminationRequestEvent) ||
      executeDirectDispatch(terminationRequestEvent);

    if (!terminationRequestEvent.isPersistent()) {
      terminationRequestEvent.constructor.release(terminationRequestEvent);
    }

    if (shouldSwitch) {
      var terminateEvent = ResponderSyntheticEvent.getPooled(
        eventTypes.responderTerminate,
        responderInst,
        nativeEvent,
        nativeEventTarget
      );
      terminateEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
      accumulateDirectDispatches(terminateEvent);
      extracted = accumulate(extracted, [grantEvent, terminateEvent]);
      changeResponder(wantsResponderInst, blockHostResponder);
    } else {
      var rejectEvent = ResponderSyntheticEvent.getPooled(
        eventTypes.responderReject,
        wantsResponderInst,
        nativeEvent,
        nativeEventTarget
      );
      rejectEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
      accumulateDirectDispatches(rejectEvent);
      extracted = accumulate(extracted, rejectEvent);
    }
  } else {
    extracted = accumulate(extracted, grantEvent);
    changeResponder(wantsResponderInst, blockHostResponder);
  }

  return extracted;
}
/**
 * A transfer is a negotiation between a currently set responder and the next
 * element to claim responder status. Any start event could trigger a transfer
 * of responderInst. Any move event could trigger a transfer.
 *
 * @param {string} topLevelType Record from `BrowserEventConstants`.
 * @return {boolean} True if a transfer of responder could possibly occur.
 */

function canTriggerTransfer(topLevelType, topLevelInst, nativeEvent) {
  return (
    topLevelInst && // responderIgnoreScroll: We are trying to migrate away from specifically
    // tracking native scroll events here and responderIgnoreScroll indicates we
    // will send topTouchCancel to handle canceling touch events instead
    ((topLevelType === TOP_SCROLL && !nativeEvent.responderIgnoreScroll) ||
      (trackedTouchCount > 0 && topLevelType === TOP_SELECTION_CHANGE) ||
      isStartish(topLevelType) ||
      isMoveish(topLevelType))
  );
}
/**
 * Returns whether or not this touch end event makes it such that there are no
 * longer any touches that started inside of the current `responderInst`.
 *
 * @param {NativeEvent} nativeEvent Native touch end event.
 * @return {boolean} Whether or not this touch end event ends the responder.
 */

function noResponderTouches(nativeEvent) {
  var touches = nativeEvent.touches;

  if (!touches || touches.length === 0) {
    return true;
  }

  for (var i = 0; i < touches.length; i++) {
    var activeTouch = touches[i];
    var target = activeTouch.target;

    if (target !== null && target !== undefined && target !== 0) {
      // Is the original touch location inside of the current responder?
      var targetInst = getInstanceFromNode(target);

      if (isAncestor(responderInst, targetInst)) {
        return false;
      }
    }
  }

  return true;
}

var ResponderEventPlugin = {
  /* For unit testing only */
  _getResponder: function() {
    return responderInst;
  },
  eventTypes: eventTypes,

  /**
   * We must be resilient to `targetInst` being `null` on `touchMove` or
   * `touchEnd`. On certain platforms, this means that a native scroll has
   * assumed control and the original touch targets are destroyed.
   */
  extractEvents: function(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags
  ) {
    if (isStartish(topLevelType)) {
      trackedTouchCount += 1;
    } else if (isEndish(topLevelType)) {
      if (trackedTouchCount >= 0) {
        trackedTouchCount -= 1;
      } else {
        console.warn(
          "Ended a touch event which was not counted in `trackedTouchCount`."
        );
        return null;
      }
    }

    ResponderTouchHistoryStore.recordTouchTrack(topLevelType, nativeEvent);
    var extracted = canTriggerTransfer(topLevelType, targetInst, nativeEvent)
      ? setResponderAndExtractTransfer(
          topLevelType,
          targetInst,
          nativeEvent,
          nativeEventTarget
        )
      : null; // Responder may or may not have transferred on a new touch start/move.
    // Regardless, whoever is the responder after any potential transfer, we
    // direct all touch start/move/ends to them in the form of
    // `onResponderMove/Start/End`. These will be called for *every* additional
    // finger that move/start/end, dispatched directly to whoever is the
    // current responder at that moment, until the responder is "released".
    //
    // These multiple individual change touch events are are always bookended
    // by `onResponderGrant`, and one of
    // (`onResponderRelease/onResponderTerminate`).

    var isResponderTouchStart = responderInst && isStartish(topLevelType);
    var isResponderTouchMove = responderInst && isMoveish(topLevelType);
    var isResponderTouchEnd = responderInst && isEndish(topLevelType);
    var incrementalTouch = isResponderTouchStart
      ? eventTypes.responderStart
      : isResponderTouchMove
        ? eventTypes.responderMove
        : isResponderTouchEnd
          ? eventTypes.responderEnd
          : null;

    if (incrementalTouch) {
      var gesture = ResponderSyntheticEvent.getPooled(
        incrementalTouch,
        responderInst,
        nativeEvent,
        nativeEventTarget
      );
      gesture.touchHistory = ResponderTouchHistoryStore.touchHistory;
      accumulateDirectDispatches(gesture);
      extracted = accumulate(extracted, gesture);
    }

    var isResponderTerminate =
      responderInst && topLevelType === TOP_TOUCH_CANCEL;
    var isResponderRelease =
      responderInst &&
      !isResponderTerminate &&
      isEndish(topLevelType) &&
      noResponderTouches(nativeEvent);
    var finalTouch = isResponderTerminate
      ? eventTypes.responderTerminate
      : isResponderRelease
        ? eventTypes.responderRelease
        : null;

    if (finalTouch) {
      var finalEvent = ResponderSyntheticEvent.getPooled(
        finalTouch,
        responderInst,
        nativeEvent,
        nativeEventTarget
      );
      finalEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
      accumulateDirectDispatches(finalEvent);
      extracted = accumulate(extracted, finalEvent);
      changeResponder(null);
    }

    return extracted;
  },
  GlobalResponderHandler: null,
  injection: {
    /**
     * @param {{onChange: (ReactID, ReactID) => void} GlobalResponderHandler
     * Object that handles any change in responder. Use this to inject
     * integration with an existing touch handling system etc.
     */
    injectGlobalResponderHandler: function(GlobalResponderHandler) {
      ResponderEventPlugin.GlobalResponderHandler = GlobalResponderHandler;
    }
  }
};

var customBubblingEventTypes =
  ReactNativePrivateInterface.ReactNativeViewConfigRegistry
    .customBubblingEventTypes;
var customDirectEventTypes =
  ReactNativePrivateInterface.ReactNativeViewConfigRegistry
    .customDirectEventTypes;
var ReactNativeBridgeEventPlugin = {
  eventTypes: {},

  /**
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags
  ) {
    if (targetInst == null) {
      // Probably a node belonging to another renderer's tree.
      return null;
    }

    var bubbleDispatchConfig = customBubblingEventTypes[topLevelType];
    var directDispatchConfig = customDirectEventTypes[topLevelType];

    if (!(bubbleDispatchConfig || directDispatchConfig)) {
      throw Error(
        'Unsupported top level event type "' + topLevelType + '" dispatched'
      );
    }

    var event = SyntheticEvent.getPooled(
      bubbleDispatchConfig || directDispatchConfig,
      targetInst,
      nativeEvent,
      nativeEventTarget
    );

    if (bubbleDispatchConfig) {
      accumulateTwoPhaseDispatches(event);
    } else if (directDispatchConfig) {
      accumulateDirectDispatches(event);
    } else {
      return null;
    }

    return event;
  }
};

var ReactNativeEventPluginOrder = [
  "ResponderEventPlugin",
  "ReactNativeBridgeEventPlugin"
];

/**
 * Make sure essential globals are available and are patched correctly. Please don't remove this
 * line. Bundles created by react-packager `require` it before executing any application code. This
 * ensures it exists in the dependency graph and can be `require`d.
 * TODO: require this in packager, not in React #10932517
 */
// Module provided by RN:
/**
 * Inject module for resolving DOM hierarchy and plugin ordering.
 */

injection.injectEventPluginOrder(ReactNativeEventPluginOrder);
/**
 * Some important event plugins included by default (without having to require
 * them).
 */

injection.injectEventPluginsByName({
  ResponderEventPlugin: ResponderEventPlugin,
  ReactNativeBridgeEventPlugin: ReactNativeBridgeEventPlugin
});

var debugRenderPhaseSideEffectsForStrictMode = false;
var enableUserTimingAPI = true;
var replayFailedUnitOfWorkWithInvokeGuardedCallback = true;
var warnAboutDeprecatedLifecycles = true;
var enableProfilerTimer = true;
var enableSchedulerTracing = true;
var enableSuspenseServerRenderer = false;

var enableFlareAPI = false;
var enableFundamentalAPI = false;
var enableScopeAPI = false;

var warnAboutUnmockedScheduler = false;
var flushSuspenseFallbacksInTests = true;
var enableSuspenseCallback = false;
var warnAboutDefaultPropsOnFunctionComponents = false;
var warnAboutStringRefs = false;
var disableLegacyContext = false;
var disableSchedulerTimeoutBasedOnReactExpirationTime = false;

var enableNativeTargetAsInstance = false; // Only used in www builds.

// Flow magic to verify the exports of this file match the original version.

function getInstanceFromInstance(instanceHandle) {
  return instanceHandle;
}

function getTagFromInstance(inst) {
  if (enableNativeTargetAsInstance) {
    var nativeInstance = inst.stateNode.canonical;

    if (!nativeInstance._nativeTag) {
      throw Error("All native instances should have a tag.");
    }

    return nativeInstance;
  } else {
    var tag = inst.stateNode.canonical._nativeTag;

    if (!tag) {
      throw Error("All native instances should have a tag.");
    }

    return tag;
  }
}

function getFiberCurrentPropsFromNode$1(inst) {
  return inst.canonical.currentProps;
}

// Module provided by RN:
var ReactFabricGlobalResponderHandler = {
  onChange: function(from, to, blockNativeResponder) {
    if (to !== null) {
      var tag = to.stateNode.canonical._nativeTag;
      ReactNativePrivateInterface.UIManager.setJSResponder(
        tag,
        blockNativeResponder
      );
    } else {
      ReactNativePrivateInterface.UIManager.clearJSResponder();
    }
  }
};

setComponentTree(
  getFiberCurrentPropsFromNode$1,
  getInstanceFromInstance,
  getTagFromInstance
);
ResponderEventPlugin.injection.injectGlobalResponderHandler(
  ReactFabricGlobalResponderHandler
);

/**
 * `ReactInstanceMap` maintains a mapping from a public facing stateful
 * instance (key) and the internal representation (value). This allows public
 * methods to accept the user facing instance as an argument and map them back
 * to internal methods.
 *
 * Note that this module is currently shared and assumed to be stateless.
 * If this becomes an actual Map, that will break.
 */

/**
 * This API should be called `delete` but we'd have to make sure to always
 * transform these to strings for IE support. When this transform is fully
 * supported we can rename it.
 */

function get(key) {
  return key._reactInternalFiber;
}

function set(key, value) {
  key._reactInternalFiber = value;
}

var ReactSharedInternals =
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED; // Prevent newer renderers from RTE when used with older react package versions.
// Current owner and dispatcher used to share the same ref,
// but PR #14548 split them out to better support the react-debug-tools package.

if (!ReactSharedInternals.hasOwnProperty("ReactCurrentDispatcher")) {
  ReactSharedInternals.ReactCurrentDispatcher = {
    current: null
  };
}

if (!ReactSharedInternals.hasOwnProperty("ReactCurrentBatchConfig")) {
  ReactSharedInternals.ReactCurrentBatchConfig = {
    suspense: null
  };
}

// The Symbol used to tag the ReactElement-like types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
var hasSymbol = typeof Symbol === "function" && Symbol.for;
var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for("react.element") : 0xeac7;
var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for("react.portal") : 0xeaca;
var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for("react.fragment") : 0xeacb;
var REACT_STRICT_MODE_TYPE = hasSymbol
  ? Symbol.for("react.strict_mode")
  : 0xeacc;
var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for("react.profiler") : 0xead2;
var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for("react.provider") : 0xeacd;
var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for("react.context") : 0xeace; // TODO: We don't use AsyncMode or ConcurrentMode anymore. They were temporary
// (unstable) APIs that have been removed. Can we remove the symbols?

var REACT_CONCURRENT_MODE_TYPE = hasSymbol
  ? Symbol.for("react.concurrent_mode")
  : 0xeacf;
var REACT_FORWARD_REF_TYPE = hasSymbol
  ? Symbol.for("react.forward_ref")
  : 0xead0;
var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for("react.suspense") : 0xead1;
var REACT_SUSPENSE_LIST_TYPE = hasSymbol
  ? Symbol.for("react.suspense_list")
  : 0xead8;
var REACT_MEMO_TYPE = hasSymbol ? Symbol.for("react.memo") : 0xead3;
var REACT_LAZY_TYPE = hasSymbol ? Symbol.for("react.lazy") : 0xead4;
var REACT_FUNDAMENTAL_TYPE = hasSymbol
  ? Symbol.for("react.fundamental")
  : 0xead5;
var REACT_RESPONDER_TYPE = hasSymbol ? Symbol.for("react.responder") : 0xead6;
var REACT_SCOPE_TYPE = hasSymbol ? Symbol.for("react.scope") : 0xead7;
var MAYBE_ITERATOR_SYMBOL = typeof Symbol === "function" && Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = "@@iterator";
function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== "object") {
    return null;
  }

  var maybeIterator =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable[FAUX_ITERATOR_SYMBOL];

  if (typeof maybeIterator === "function") {
    return maybeIterator;
  }

  return null;
}

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = warningWithoutStack$1;

{
  warning = function(condition, format) {
    if (condition) {
      return;
    }

    var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
    var stack = ReactDebugCurrentFrame.getStackAddendum(); // eslint-disable-next-line react-internal/warning-and-invariant-args

    for (
      var _len = arguments.length,
        args = new Array(_len > 2 ? _len - 2 : 0),
        _key = 2;
      _key < _len;
      _key++
    ) {
      args[_key - 2] = arguments[_key];
    }

    warningWithoutStack$1.apply(
      void 0,
      [false, format + "%s"].concat(args, [stack])
    );
  };
}

var warning$1 = warning;

var Uninitialized = -1;
var Pending = 0;
var Resolved = 1;
var Rejected = 2;
function refineResolvedLazyComponent(lazyComponent) {
  return lazyComponent._status === Resolved ? lazyComponent._result : null;
}
function initializeLazyComponentType(lazyComponent) {
  if (lazyComponent._status === Uninitialized) {
    lazyComponent._status = Pending;
    var ctor = lazyComponent._ctor;
    var thenable = ctor();
    lazyComponent._result = thenable;
    thenable.then(
      function(moduleObject) {
        if (lazyComponent._status === Pending) {
          var defaultExport = moduleObject.default;

          {
            if (defaultExport === undefined) {
              warning$1(
                false,
                "lazy: Expected the result of a dynamic import() call. " +
                  "Instead received: %s\n\nYour code should look like: \n  " +
                  "const MyComponent = lazy(() => import('./MyComponent'))",
                moduleObject
              );
            }
          }

          lazyComponent._status = Resolved;
          lazyComponent._result = defaultExport;
        }
      },
      function(error) {
        if (lazyComponent._status === Pending) {
          lazyComponent._status = Rejected;
          lazyComponent._result = error;
        }
      }
    );
  }
}

function getWrappedName(outerType, innerType, wrapperName) {
  var functionName = innerType.displayName || innerType.name || "";
  return (
    outerType.displayName ||
    (functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName)
  );
}

function getComponentName(type) {
  if (type == null) {
    // Host root, text node or just invalid type.
    return null;
  }

  {
    if (typeof type.tag === "number") {
      warningWithoutStack$1(
        false,
        "Received an unexpected object in getComponentName(). " +
          "This is likely a bug in React. Please file an issue."
      );
    }
  }

  if (typeof type === "function") {
    return type.displayName || type.name || null;
  }

  if (typeof type === "string") {
    return type;
  }

  switch (type) {
    case REACT_FRAGMENT_TYPE:
      return "Fragment";

    case REACT_PORTAL_TYPE:
      return "Portal";

    case REACT_PROFILER_TYPE:
      return "Profiler";

    case REACT_STRICT_MODE_TYPE:
      return "StrictMode";

    case REACT_SUSPENSE_TYPE:
      return "Suspense";

    case REACT_SUSPENSE_LIST_TYPE:
      return "SuspenseList";
  }

  if (typeof type === "object") {
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE:
        return "Context.Consumer";

      case REACT_PROVIDER_TYPE:
        return "Context.Provider";

      case REACT_FORWARD_REF_TYPE:
        return getWrappedName(type, type.render, "ForwardRef");

      case REACT_MEMO_TYPE:
        return getComponentName(type.type);

      case REACT_LAZY_TYPE: {
        var thenable = type;
        var resolvedThenable = refineResolvedLazyComponent(thenable);

        if (resolvedThenable) {
          return getComponentName(resolvedThenable);
        }

        break;
      }
    }
  }

  return null;
}

// Don't change these two values. They're used by React Dev Tools.
var NoEffect =
  /*              */
  0;
var PerformedWork =
  /*         */
  1; // You can change the rest (and add more).

var Placement =
  /*             */
  2;
var Update =
  /*                */
  4;
var PlacementAndUpdate =
  /*    */
  6;
var Deletion =
  /*              */
  8;
var ContentReset =
  /*          */
  16;
var Callback =
  /*              */
  32;
var DidCapture =
  /*            */
  64;
var Ref =
  /*                   */
  128;
var Snapshot =
  /*              */
  256;
var Passive =
  /*               */
  512;
var Hydrating =
  /*             */
  1024;
var HydratingAndUpdate =
  /*    */
  1028; // Passive & Update & Callback & Ref & Snapshot

var LifecycleEffectMask =
  /*   */
  932; // Union of all host effects

var HostEffectMask =
  /*        */
  2047;
var Incomplete =
  /*            */
  2048;
var ShouldCapture =
  /*         */
  4096;

var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner;
function getNearestMountedFiber(fiber) {
  var node = fiber;
  var nearestMounted = fiber;

  if (!fiber.alternate) {
    // If there is no alternate, this might be a new tree that isn't inserted
    // yet. If it is, then it will have a pending insertion effect on it.
    var nextNode = node;

    do {
      node = nextNode;

      if ((node.effectTag & (Placement | Hydrating)) !== NoEffect) {
        // This is an insertion or in-progress hydration. The nearest possible
        // mounted fiber is the parent but we need to continue to figure out
        // if that one is still mounted.
        nearestMounted = node.return;
      }

      nextNode = node.return;
    } while (nextNode);
  } else {
    while (node.return) {
      node = node.return;
    }
  }

  if (node.tag === HostRoot) {
    // TODO: Check if this was a nested HostRoot when used with
    // renderContainerIntoSubtree.
    return nearestMounted;
  } // If we didn't hit the root, that means that we're in an disconnected tree
  // that has been unmounted.

  return null;
}

function isFiberMounted(fiber) {
  return getNearestMountedFiber(fiber) === fiber;
}
function isMounted(component) {
  {
    var owner = ReactCurrentOwner$1.current;

    if (owner !== null && owner.tag === ClassComponent) {
      var ownerFiber = owner;
      var instance = ownerFiber.stateNode;
      !instance._warnedAboutRefsInRender
        ? warningWithoutStack$1(
            false,
            "%s is accessing isMounted inside its render() function. " +
              "render() should be a pure function of props and state. It should " +
              "never access something that requires stale data from the previous " +
              "render, such as refs. Move this logic to componentDidMount and " +
              "componentDidUpdate instead.",
            getComponentName(ownerFiber.type) || "A component"
          )
        : void 0;
      instance._warnedAboutRefsInRender = true;
    }
  }

  var fiber = get(component);

  if (!fiber) {
    return false;
  }

  return getNearestMountedFiber(fiber) === fiber;
}

function assertIsMounted(fiber) {
  if (!(getNearestMountedFiber(fiber) === fiber)) {
    throw Error("Unable to find node on an unmounted component.");
  }
}

function findCurrentFiberUsingSlowPath(fiber) {
  var alternate = fiber.alternate;

  if (!alternate) {
    // If there is no alternate, then we only need to check if it is mounted.
    var nearestMounted = getNearestMountedFiber(fiber);

    if (!(nearestMounted !== null)) {
      throw Error("Unable to find node on an unmounted component.");
    }

    if (nearestMounted !== fiber) {
      return null;
    }

    return fiber;
  } // If we have two possible branches, we'll walk backwards up to the root
  // to see what path the root points to. On the way we may hit one of the
  // special cases and we'll deal with them.

  var a = fiber;
  var b = alternate;

  while (true) {
    var parentA = a.return;

    if (parentA === null) {
      // We're at the root.
      break;
    }

    var parentB = parentA.alternate;

    if (parentB === null) {
      // There is no alternate. This is an unusual case. Currently, it only
      // happens when a Suspense component is hidden. An extra fragment fiber
      // is inserted in between the Suspense fiber and its children. Skip
      // over this extra fragment fiber and proceed to the next parent.
      var nextParent = parentA.return;

      if (nextParent !== null) {
        a = b = nextParent;
        continue;
      } // If there's no parent, we're at the root.

      break;
    } // If both copies of the parent fiber point to the same child, we can
    // assume that the child is current. This happens when we bailout on low
    // priority: the bailed out fiber's child reuses the current child.

    if (parentA.child === parentB.child) {
      var child = parentA.child;

      while (child) {
        if (child === a) {
          // We've determined that A is the current branch.
          assertIsMounted(parentA);
          return fiber;
        }

        if (child === b) {
          // We've determined that B is the current branch.
          assertIsMounted(parentA);
          return alternate;
        }

        child = child.sibling;
      } // We should never have an alternate for any mounting node. So the only
      // way this could possibly happen is if this was unmounted, if at all.

      {
        throw Error("Unable to find node on an unmounted component.");
      }
    }

    if (a.return !== b.return) {
      // The return pointer of A and the return pointer of B point to different
      // fibers. We assume that return pointers never criss-cross, so A must
      // belong to the child set of A.return, and B must belong to the child
      // set of B.return.
      a = parentA;
      b = parentB;
    } else {
      // The return pointers point to the same fiber. We'll have to use the
      // default, slow path: scan the child sets of each parent alternate to see
      // which child belongs to which set.
      //
      // Search parent A's child set
      var didFindChild = false;
      var _child = parentA.child;

      while (_child) {
        if (_child === a) {
          didFindChild = true;
          a = parentA;
          b = parentB;
          break;
        }

        if (_child === b) {
          didFindChild = true;
          b = parentA;
          a = parentB;
          break;
        }

        _child = _child.sibling;
      }

      if (!didFindChild) {
        // Search parent B's child set
        _child = parentB.child;

        while (_child) {
          if (_child === a) {
            didFindChild = true;
            a = parentB;
            b = parentA;
            break;
          }

          if (_child === b) {
            didFindChild = true;
            b = parentB;
            a = parentA;
            break;
          }

          _child = _child.sibling;
        }

        if (!didFindChild) {
          throw Error(
            "Child was not found in either parent set. This indicates a bug in React related to the return pointer. Please file an issue."
          );
        }
      }
    }

    if (!(a.alternate === b)) {
      throw Error(
        "Return fibers should always be each others' alternates. This error is likely caused by a bug in React. Please file an issue."
      );
    }
  } // If the root is not a host container, we're in a disconnected tree. I.e.
  // unmounted.

  if (!(a.tag === HostRoot)) {
    throw Error("Unable to find node on an unmounted component.");
  }

  if (a.stateNode.current === a) {
    // We've determined that A is the current branch.
    return fiber;
  } // Otherwise B has to be current branch.

  return alternate;
}
function findCurrentHostFiber(parent) {
  var currentParent = findCurrentFiberUsingSlowPath(parent);

  if (!currentParent) {
    return null;
  } // Next we'll drill down this component to find the first HostComponent/Text.

  var node = currentParent;

  while (true) {
    if (node.tag === HostComponent || node.tag === HostText) {
      return node;
    } else if (node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    if (node === currentParent) {
      return null;
    }

    while (!node.sibling) {
      if (!node.return || node.return === currentParent) {
        return null;
      }

      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;
  } // Flow needs the return null here, but ESLint complains about it.
  // eslint-disable-next-line no-unreachable

  return null;
}

/**
 * In the future, we should cleanup callbacks by cancelling them instead of
 * using this.
 */
function mountSafeCallback_NOT_REALLY_SAFE(context, callback) {
  return function() {
    if (!callback) {
      return undefined;
    } // This protects against createClass() components.
    // We don't know if there is code depending on it.
    // We intentionally don't use isMounted() because even accessing
    // isMounted property on a React ES6 class will trigger a warning.

    if (typeof context.__isMounted === "boolean") {
      if (!context.__isMounted) {
        return undefined;
      }
    } // FIXME: there used to be other branches that protected
    // against unmounted host components. But RN host components don't
    // define isMounted() anymore, so those checks didn't do anything.
    // They caused false positive warning noise so we removed them:
    // https://github.com/facebook/react-native/issues/18868#issuecomment-413579095
    // However, this means that the callback is NOT guaranteed to be safe
    // for host components. The solution we should implement is to make
    // UIManager.measure() and similar calls truly cancelable. Then we
    // can change our own code calling them to cancel when something unmounts.

    return callback.apply(context, arguments);
  };
}
function throwOnStylesProp(component, props) {
  if (props.styles !== undefined) {
    var owner = component._owner || null;
    var name = component.constructor.displayName;
    var msg =
      "`styles` is not a supported property of `" +
      name +
      "`, did " +
      "you mean `style` (singular)?";

    if (owner && owner.constructor && owner.constructor.displayName) {
      msg +=
        "\n\nCheck the `" +
        owner.constructor.displayName +
        "` parent " +
        " component.";
    }

    throw new Error(msg);
  }
}
function warnForStyleProps(props, validAttributes) {
  for (var key in validAttributes.style) {
    if (!(validAttributes[key] || props[key] === undefined)) {
      console.error(
        "You are setting the style `{ " +
          key +
          ": ... }` as a prop. You " +
          "should nest it in a style object. " +
          "E.g. `{ style: { " +
          key +
          ": ... } }`"
      );
    }
  }
}

// Modules provided by RN:
var emptyObject = {};
/**
 * Create a payload that contains all the updates between two sets of props.
 *
 * These helpers are all encapsulated into a single module, because they use
 * mutation as a performance optimization which leads to subtle shared
 * dependencies between the code paths. To avoid this mutable state leaking
 * across modules, I've kept them isolated to this module.
 */

// Tracks removed keys
var removedKeys = null;
var removedKeyCount = 0;
var deepDifferOptions = {
  unsafelyIgnoreFunctions: true
};

function defaultDiffer(prevProp, nextProp) {
  if (typeof nextProp !== "object" || nextProp === null) {
    // Scalars have already been checked for equality
    return true;
  } else {
    // For objects and arrays, the default diffing algorithm is a deep compare
    return ReactNativePrivateInterface.deepDiffer(
      prevProp,
      nextProp,
      deepDifferOptions
    );
  }
}

function restoreDeletedValuesInNestedArray(
  updatePayload,
  node,
  validAttributes
) {
  if (Array.isArray(node)) {
    var i = node.length;

    while (i-- && removedKeyCount > 0) {
      restoreDeletedValuesInNestedArray(
        updatePayload,
        node[i],
        validAttributes
      );
    }
  } else if (node && removedKeyCount > 0) {
    var obj = node;

    for (var propKey in removedKeys) {
      if (!removedKeys[propKey]) {
        continue;
      }

      var nextProp = obj[propKey];

      if (nextProp === undefined) {
        continue;
      }

      var attributeConfig = validAttributes[propKey];

      if (!attributeConfig) {
        continue; // not a valid native prop
      }

      if (typeof nextProp === "function") {
        nextProp = true;
      }

      if (typeof nextProp === "undefined") {
        nextProp = null;
      }

      if (typeof attributeConfig !== "object") {
        // case: !Object is the default case
        updatePayload[propKey] = nextProp;
      } else if (
        typeof attributeConfig.diff === "function" ||
        typeof attributeConfig.process === "function"
      ) {
        // case: CustomAttributeConfiguration
        var nextValue =
          typeof attributeConfig.process === "function"
            ? attributeConfig.process(nextProp)
            : nextProp;
        updatePayload[propKey] = nextValue;
      }

      removedKeys[propKey] = false;
      removedKeyCount--;
    }
  }
}

function diffNestedArrayProperty(
  updatePayload,
  prevArray,
  nextArray,
  validAttributes
) {
  var minLength =
    prevArray.length < nextArray.length ? prevArray.length : nextArray.length;
  var i;

  for (i = 0; i < minLength; i++) {
    // Diff any items in the array in the forward direction. Repeated keys
    // will be overwritten by later values.
    updatePayload = diffNestedProperty(
      updatePayload,
      prevArray[i],
      nextArray[i],
      validAttributes
    );
  }

  for (; i < prevArray.length; i++) {
    // Clear out all remaining properties.
    updatePayload = clearNestedProperty(
      updatePayload,
      prevArray[i],
      validAttributes
    );
  }

  for (; i < nextArray.length; i++) {
    // Add all remaining properties.
    updatePayload = addNestedProperty(
      updatePayload,
      nextArray[i],
      validAttributes
    );
  }

  return updatePayload;
}

function diffNestedProperty(
  updatePayload,
  prevProp,
  nextProp,
  validAttributes
) {
  if (!updatePayload && prevProp === nextProp) {
    // If no properties have been added, then we can bail out quickly on object
    // equality.
    return updatePayload;
  }

  if (!prevProp || !nextProp) {
    if (nextProp) {
      return addNestedProperty(updatePayload, nextProp, validAttributes);
    }

    if (prevProp) {
      return clearNestedProperty(updatePayload, prevProp, validAttributes);
    }

    return updatePayload;
  }

  if (!Array.isArray(prevProp) && !Array.isArray(nextProp)) {
    // Both are leaves, we can diff the leaves.
    return diffProperties(updatePayload, prevProp, nextProp, validAttributes);
  }

  if (Array.isArray(prevProp) && Array.isArray(nextProp)) {
    // Both are arrays, we can diff the arrays.
    return diffNestedArrayProperty(
      updatePayload,
      prevProp,
      nextProp,
      validAttributes
    );
  }

  if (Array.isArray(prevProp)) {
    return diffProperties(
      updatePayload, // $FlowFixMe - We know that this is always an object when the input is.
      ReactNativePrivateInterface.flattenStyle(prevProp), // $FlowFixMe - We know that this isn't an array because of above flow.
      nextProp,
      validAttributes
    );
  }

  return diffProperties(
    updatePayload,
    prevProp, // $FlowFixMe - We know that this is always an object when the input is.
    ReactNativePrivateInterface.flattenStyle(nextProp),
    validAttributes
  );
}
/**
 * addNestedProperty takes a single set of props and valid attribute
 * attribute configurations. It processes each prop and adds it to the
 * updatePayload.
 */

function addNestedProperty(updatePayload, nextProp, validAttributes) {
  if (!nextProp) {
    return updatePayload;
  }

  if (!Array.isArray(nextProp)) {
    // Add each property of the leaf.
    return addProperties(updatePayload, nextProp, validAttributes);
  }

  for (var i = 0; i < nextProp.length; i++) {
    // Add all the properties of the array.
    updatePayload = addNestedProperty(
      updatePayload,
      nextProp[i],
      validAttributes
    );
  }

  return updatePayload;
}
/**
 * clearNestedProperty takes a single set of props and valid attributes. It
 * adds a null sentinel to the updatePayload, for each prop key.
 */

function clearNestedProperty(updatePayload, prevProp, validAttributes) {
  if (!prevProp) {
    return updatePayload;
  }

  if (!Array.isArray(prevProp)) {
    // Add each property of the leaf.
    return clearProperties(updatePayload, prevProp, validAttributes);
  }

  for (var i = 0; i < prevProp.length; i++) {
    // Add all the properties of the array.
    updatePayload = clearNestedProperty(
      updatePayload,
      prevProp[i],
      validAttributes
    );
  }

  return updatePayload;
}
/**
 * diffProperties takes two sets of props and a set of valid attributes
 * and write to updatePayload the values that changed or were deleted.
 * If no updatePayload is provided, a new one is created and returned if
 * anything changed.
 */

function diffProperties(updatePayload, prevProps, nextProps, validAttributes) {
  var attributeConfig;
  var nextProp;
  var prevProp;

  for (var propKey in nextProps) {
    attributeConfig = validAttributes[propKey];

    if (!attributeConfig) {
      continue; // not a valid native prop
    }

    prevProp = prevProps[propKey];
    nextProp = nextProps[propKey]; // functions are converted to booleans as markers that the associated
    // events should be sent from native.

    if (typeof nextProp === "function") {
      nextProp = true; // If nextProp is not a function, then don't bother changing prevProp
      // since nextProp will win and go into the updatePayload regardless.

      if (typeof prevProp === "function") {
        prevProp = true;
      }
    } // An explicit value of undefined is treated as a null because it overrides
    // any other preceding value.

    if (typeof nextProp === "undefined") {
      nextProp = null;

      if (typeof prevProp === "undefined") {
        prevProp = null;
      }
    }

    if (removedKeys) {
      removedKeys[propKey] = false;
    }

    if (updatePayload && updatePayload[propKey] !== undefined) {
      // Something else already triggered an update to this key because another
      // value diffed. Since we're now later in the nested arrays our value is
      // more important so we need to calculate it and override the existing
      // value. It doesn't matter if nothing changed, we'll set it anyway.
      // Pattern match on: attributeConfig
      if (typeof attributeConfig !== "object") {
        // case: !Object is the default case
        updatePayload[propKey] = nextProp;
      } else if (
        typeof attributeConfig.diff === "function" ||
        typeof attributeConfig.process === "function"
      ) {
        // case: CustomAttributeConfiguration
        var nextValue =
          typeof attributeConfig.process === "function"
            ? attributeConfig.process(nextProp)
            : nextProp;
        updatePayload[propKey] = nextValue;
      }

      continue;
    }

    if (prevProp === nextProp) {
      continue; // nothing changed
    } // Pattern match on: attributeConfig

    if (typeof attributeConfig !== "object") {
      // case: !Object is the default case
      if (defaultDiffer(prevProp, nextProp)) {
        // a normal leaf has changed
        (updatePayload || (updatePayload = {}))[propKey] = nextProp;
      }
    } else if (
      typeof attributeConfig.diff === "function" ||
      typeof attributeConfig.process === "function"
    ) {
      // case: CustomAttributeConfiguration
      var shouldUpdate =
        prevProp === undefined ||
        (typeof attributeConfig.diff === "function"
          ? attributeConfig.diff(prevProp, nextProp)
          : defaultDiffer(prevProp, nextProp));

      if (shouldUpdate) {
        var _nextValue =
          typeof attributeConfig.process === "function"
            ? attributeConfig.process(nextProp)
            : nextProp;

        (updatePayload || (updatePayload = {}))[propKey] = _nextValue;
      }
    } else {
      // default: fallthrough case when nested properties are defined
      removedKeys = null;
      removedKeyCount = 0; // We think that attributeConfig is not CustomAttributeConfiguration at
      // this point so we assume it must be AttributeConfiguration.

      updatePayload = diffNestedProperty(
        updatePayload,
        prevProp,
        nextProp,
        attributeConfig
      );

      if (removedKeyCount > 0 && updatePayload) {
        restoreDeletedValuesInNestedArray(
          updatePayload,
          nextProp,
          attributeConfig
        );
        removedKeys = null;
      }
    }
  } // Also iterate through all the previous props to catch any that have been
  // removed and make sure native gets the signal so it can reset them to the
  // default.

  for (var _propKey in prevProps) {
    if (nextProps[_propKey] !== undefined) {
      continue; // we've already covered this key in the previous pass
    }

    attributeConfig = validAttributes[_propKey];

    if (!attributeConfig) {
      continue; // not a valid native prop
    }

    if (updatePayload && updatePayload[_propKey] !== undefined) {
      // This was already updated to a diff result earlier.
      continue;
    }

    prevProp = prevProps[_propKey];

    if (prevProp === undefined) {
      continue; // was already empty anyway
    } // Pattern match on: attributeConfig

    if (
      typeof attributeConfig !== "object" ||
      typeof attributeConfig.diff === "function" ||
      typeof attributeConfig.process === "function"
    ) {
      // case: CustomAttributeConfiguration | !Object
      // Flag the leaf property for removal by sending a sentinel.
      (updatePayload || (updatePayload = {}))[_propKey] = null;

      if (!removedKeys) {
        removedKeys = {};
      }

      if (!removedKeys[_propKey]) {
        removedKeys[_propKey] = true;
        removedKeyCount++;
      }
    } else {
      // default:
      // This is a nested attribute configuration where all the properties
      // were removed so we need to go through and clear out all of them.
      updatePayload = clearNestedProperty(
        updatePayload,
        prevProp,
        attributeConfig
      );
    }
  }

  return updatePayload;
}
/**
 * addProperties adds all the valid props to the payload after being processed.
 */

function addProperties(updatePayload, props, validAttributes) {
  // TODO: Fast path
  return diffProperties(updatePayload, emptyObject, props, validAttributes);
}
/**
 * clearProperties clears all the previous props by adding a null sentinel
 * to the payload for each valid key.
 */

function clearProperties(updatePayload, prevProps, validAttributes) {
  // TODO: Fast path
  return diffProperties(updatePayload, prevProps, emptyObject, validAttributes);
}

function create(props, validAttributes) {
  return addProperties(
    null, // updatePayload
    props,
    validAttributes
  );
}
function diff(prevProps, nextProps, validAttributes) {
  return diffProperties(
    null, // updatePayload
    prevProps,
    nextProps,
    validAttributes
  );
}

var PLUGIN_EVENT_SYSTEM = 1;

var restoreImpl = null;
var restoreTarget = null;
var restoreQueue = null;

function restoreStateOfTarget(target) {
  // We perform this translation at the end of the event loop so that we
  // always receive the correct fiber here
  var internalInstance = getInstanceFromNode(target);

  if (!internalInstance) {
    // Unmounted
    return;
  }

  if (!(typeof restoreImpl === "function")) {
    throw Error(
      "setRestoreImplementation() needs to be called to handle a target for controlled events. This error is likely caused by a bug in React. Please file an issue."
    );
  }

  var props = getFiberCurrentPropsFromNode(internalInstance.stateNode);
  restoreImpl(internalInstance.stateNode, internalInstance.type, props);
}

function needsStateRestore() {
  return restoreTarget !== null || restoreQueue !== null;
}
function restoreStateIfNeeded() {
  if (!restoreTarget) {
    return;
  }

  var target = restoreTarget;
  var queuedTargets = restoreQueue;
  restoreTarget = null;
  restoreQueue = null;
  restoreStateOfTarget(target);

  if (queuedTargets) {
    for (var i = 0; i < queuedTargets.length; i++) {
      restoreStateOfTarget(queuedTargets[i]);
    }
  }
}

// the renderer. Such as when we're dispatching events or if third party
// libraries need to call batchedUpdates. Eventually, this API will go away when
// everything is batched by default. We'll then have a similar API to opt-out of
// scheduled work and instead do synchronous work.
// Defaults

var batchedUpdatesImpl = function(fn, bookkeeping) {
  return fn(bookkeeping);
};

var discreteUpdatesImpl = function(fn, a, b, c) {
  return fn(a, b, c);
};

var flushDiscreteUpdatesImpl = function() {};

var batchedEventUpdatesImpl = batchedUpdatesImpl;
var isInsideEventHandler = false;
var isBatchingEventUpdates = false;

function finishEventHandler() {
  // Here we wait until all updates have propagated, which is important
  // when using controlled components within layers:
  // https://github.com/facebook/react/issues/1698
  // Then we restore state of any controlled component.
  var controlledComponentsHavePendingUpdates = needsStateRestore();

  if (controlledComponentsHavePendingUpdates) {
    // If a controlled event was fired, we may need to restore the state of
    // the DOM node back to the controlled value. This is necessary when React
    // bails out of the update without touching the DOM.
    flushDiscreteUpdatesImpl();
    restoreStateIfNeeded();
  }
}

function batchedUpdates(fn, bookkeeping) {
  if (isInsideEventHandler) {
    // If we are currently inside another batch, we need to wait until it
    // fully completes before restoring state.
    return fn(bookkeeping);
  }

  isInsideEventHandler = true;

  try {
    return batchedUpdatesImpl(fn, bookkeeping);
  } finally {
    isInsideEventHandler = false;
    finishEventHandler();
  }
}
function batchedEventUpdates(fn, a, b) {
  if (isBatchingEventUpdates) {
    // If we are currently inside another batch, we need to wait until it
    // fully completes before restoring state.
    return fn(a, b);
  }

  isBatchingEventUpdates = true;

  try {
    return batchedEventUpdatesImpl(fn, a, b);
  } finally {
    isBatchingEventUpdates = false;
    finishEventHandler();
  }
} // This is for the React Flare event system

function executeUserEventHandler(fn, value) {
  var previouslyInEventHandler = isInsideEventHandler;

  try {
    isInsideEventHandler = true;
    var type = typeof value === "object" && value !== null ? value.type : "";
    invokeGuardedCallbackAndCatchFirstError(type, fn, undefined, value);
  } finally {
    isInsideEventHandler = previouslyInEventHandler;
  }
}
function discreteUpdates(fn, a, b, c) {
  var prevIsInsideEventHandler = isInsideEventHandler;
  isInsideEventHandler = true;

  try {
    return discreteUpdatesImpl(fn, a, b, c);
  } finally {
    isInsideEventHandler = prevIsInsideEventHandler;

    if (!isInsideEventHandler) {
      finishEventHandler();
    }
  }
}
var lastFlushedEventTimeStamp = 0;
function flushDiscreteUpdatesIfNeeded(timeStamp) {
  // event.timeStamp isn't overly reliable due to inconsistencies in
  // how different browsers have historically provided the time stamp.
  // Some browsers provide high-resolution time stamps for all events,
  // some provide low-resolution time stamps for all events. FF < 52
  // even mixes both time stamps together. Some browsers even report
  // negative time stamps or time stamps that are 0 (iOS9) in some cases.
  // Given we are only comparing two time stamps with equality (!==),
  // we are safe from the resolution differences. If the time stamp is 0
  // we bail-out of preventing the flush, which can affect semantics,
  // such as if an earlier flush removes or adds event listeners that
  // are fired in the subsequent flush. However, this is the same
  // behaviour as we had before this change, so the risks are low.
  if (
    !isInsideEventHandler &&
    (!enableFlareAPI ||
      timeStamp === 0 ||
      lastFlushedEventTimeStamp !== timeStamp)
  ) {
    lastFlushedEventTimeStamp = timeStamp;
    flushDiscreteUpdatesImpl();
  }
}
function setBatchingImplementation(
  _batchedUpdatesImpl,
  _discreteUpdatesImpl,
  _flushDiscreteUpdatesImpl,
  _batchedEventUpdatesImpl
) {
  batchedUpdatesImpl = _batchedUpdatesImpl;
  discreteUpdatesImpl = _discreteUpdatesImpl;
  flushDiscreteUpdatesImpl = _flushDiscreteUpdatesImpl;
  batchedEventUpdatesImpl = _batchedEventUpdatesImpl;
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

/**
 * Class only exists for its Flow type.
 */
var ReactNativeComponent =
  /*#__PURE__*/
  (function(_React$Component) {
    _inheritsLoose(ReactNativeComponent, _React$Component);

    function ReactNativeComponent() {
      return _React$Component.apply(this, arguments) || this;
    }

    var _proto = ReactNativeComponent.prototype;

    _proto.blur = function blur() {};

    _proto.focus = function focus() {};

    _proto.measure = function measure(callback) {};

    _proto.measureInWindow = function measureInWindow(callback) {};

    _proto.measureLayout = function measureLayout(
      relativeToNativeNode,
      onSuccess,
      onFail
    ) {};

    _proto.setNativeProps = function setNativeProps(nativeProps) {};

    return ReactNativeComponent;
  })(React.Component); // This type is only used for FlowTests. It shouldn't be imported directly

var DiscreteEvent = 0;
var UserBlockingEvent = 1;
var ContinuousEvent = 2;

// CommonJS interop named imports.

var UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
var runWithPriority = Scheduler.unstable_runWithPriority;
var _nativeFabricUIManage$2 = nativeFabricUIManager;
var measureInWindow = _nativeFabricUIManage$2.measureInWindow;
var rootEventTypesToEventResponderInstances = new Map();
var currentTimeStamp = 0;
var currentInstance = null;
var eventResponderContext = {
  dispatchEvent: function(eventValue, eventListener, eventPriority) {
    validateResponderContext();
    validateEventValue(eventValue);

    switch (eventPriority) {
      case DiscreteEvent: {
        flushDiscreteUpdatesIfNeeded(currentTimeStamp);
        discreteUpdates(function() {
          return executeUserEventHandler(eventListener, eventValue);
        });
        break;
      }

      case UserBlockingEvent: {
        runWithPriority(UserBlockingPriority, function() {
          return executeUserEventHandler(eventListener, eventValue);
        });
        break;
      }

      case ContinuousEvent: {
        executeUserEventHandler(eventListener, eventValue);
        break;
      }
    }
  },
  isTargetWithinNode: function(childTarget, parentTarget) {
    validateResponderContext();
    var childFiber = getFiberFromTarget(childTarget);
    var parentFiber = getFiberFromTarget(parentTarget);
    var node = childFiber;

    while (node !== null) {
      if (node === parentFiber) {
        return true;
      }

      node = node.return;
    }

    return false;
  },
  getTargetBoundingRect: function(target, callback) {
    measureInWindow(target.node, function(x, y, width, height) {
      callback({
        left: x,
        right: x + width,
        top: y,
        bottom: y + height
      });
    });
  },
  addRootEventTypes: function(rootEventTypes) {
    validateResponderContext();

    for (var i = 0; i < rootEventTypes.length; i++) {
      var rootEventType = rootEventTypes[i];
      var eventResponderInstance = currentInstance;
      registerRootEventType(rootEventType, eventResponderInstance);
    }
  },
  removeRootEventTypes: function(rootEventTypes) {
    validateResponderContext();

    for (var i = 0; i < rootEventTypes.length; i++) {
      var rootEventType = rootEventTypes[i];
      var rootEventResponders = rootEventTypesToEventResponderInstances.get(
        rootEventType
      );
      var rootEventTypesSet = currentInstance.rootEventTypes;

      if (rootEventTypesSet !== null) {
        rootEventTypesSet.delete(rootEventType);
      }

      if (rootEventResponders !== undefined) {
        rootEventResponders.delete(currentInstance);
      }
    }
  },
  getTimeStamp: function() {
    validateResponderContext();
    return currentTimeStamp;
  },
  getResponderNode: function() {
    validateResponderContext();
    var responderFiber = currentInstance.fiber;

    if (responderFiber.tag === ScopeComponent) {
      return null;
    }

    return responderFiber.stateNode;
  }
};

function validateEventValue(eventValue) {
  if (typeof eventValue === "object" && eventValue !== null) {
    var target = eventValue.target,
      type = eventValue.type,
      timeStamp = eventValue.timeStamp;

    if (target == null || type == null || timeStamp == null) {
      throw new Error(
        'context.dispatchEvent: "target", "timeStamp", and "type" fields on event object are required.'
      );
    }

    var showWarning = function(name) {
      {
        warning$1(
          false,
          "%s is not available on event objects created from event responder modules (React Flare). " +
            'Try wrapping in a conditional, i.e. `if (event.type !== "press") { event.%s }`',
          name,
          name
        );
      }
    };

    eventValue.preventDefault = function() {
      {
        showWarning("preventDefault()");
      }
    };

    eventValue.stopPropagation = function() {
      {
        showWarning("stopPropagation()");
      }
    };

    eventValue.isDefaultPrevented = function() {
      {
        showWarning("isDefaultPrevented()");
      }
    };

    eventValue.isPropagationStopped = function() {
      {
        showWarning("isPropagationStopped()");
      }
    }; // $FlowFixMe: we don't need value, Flow thinks we do

    Object.defineProperty(eventValue, "nativeEvent", {
      get: function() {
        {
          showWarning("nativeEvent");
        }
      }
    });
  }
}

function getFiberFromTarget(target) {
  if (target === null) {
    return null;
  }

  return target.canonical._internalInstanceHandle || null;
}

function createFabricResponderEvent(topLevelType, nativeEvent, target) {
  return {
    nativeEvent: nativeEvent,
    target: target,
    type: topLevelType
  };
}

function validateResponderContext() {
  if (!currentInstance) {
    throw Error(
      "An event responder context was used outside of an event cycle."
    );
  }
} // TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic

function responderEventTypesContainType(eventTypes, type) {
  for (var i = 0, len = eventTypes.length; i < len; i++) {
    if (eventTypes[i] === type) {
      return true;
    }
  }

  return false;
}

function validateResponderTargetEventTypes(eventType, responder) {
  var targetEventTypes = responder.targetEventTypes; // Validate the target event type exists on the responder

  if (targetEventTypes !== null) {
    return responderEventTypesContainType(targetEventTypes, eventType);
  }

  return false;
} // TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic

function traverseAndHandleEventResponderInstances(
  eventType,
  targetFiber,
  nativeEvent
) {
  // Trigger event responders in this order:
  // - Bubble target responder phase
  // - Root responder phase
  var responderEvent = createFabricResponderEvent(
    eventType,
    nativeEvent,
    targetFiber !== null ? targetFiber.stateNode : null
  );
  var visitedResponders = new Set();
  var node = targetFiber;

  while (node !== null) {
    var _node = node,
      dependencies = _node.dependencies,
      tag = _node.tag;

    if (
      (tag === HostComponent || tag === ScopeComponent) &&
      dependencies !== null
    ) {
      var respondersMap = dependencies.responders;

      if (respondersMap !== null) {
        var responderInstances = Array.from(respondersMap.values());

        for (var i = 0, length = responderInstances.length; i < length; i++) {
          var responderInstance = responderInstances[i];
          var props = responderInstance.props,
            responder = responderInstance.responder,
            state = responderInstance.state;

          if (
            !visitedResponders.has(responder) &&
            validateResponderTargetEventTypes(eventType, responder)
          ) {
            var onEvent = responder.onEvent;
            visitedResponders.add(responder);

            if (onEvent !== null) {
              currentInstance = responderInstance;
              onEvent(responderEvent, eventResponderContext, props, state);
            }
          }
        }
      }
    }

    node = node.return;
  } // Root phase

  var rootEventResponderInstances = rootEventTypesToEventResponderInstances.get(
    eventType
  );

  if (rootEventResponderInstances !== undefined) {
    var _responderInstances = Array.from(rootEventResponderInstances);

    for (var _i = 0; _i < _responderInstances.length; _i++) {
      var _responderInstance = _responderInstances[_i];
      var props = _responderInstance.props,
        responder = _responderInstance.responder,
        state = _responderInstance.state;
      var onRootEvent = responder.onRootEvent;

      if (onRootEvent !== null) {
        currentInstance = _responderInstance;
        onRootEvent(responderEvent, eventResponderContext, props, state);
      }
    }
  }
} // TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic

function dispatchEventForResponderEventSystem(
  topLevelType,
  targetFiber,
  nativeEvent
) {
  var previousInstance = currentInstance;
  var previousTimeStamp = currentTimeStamp; // We might want to control timeStamp another way here

  currentTimeStamp = Date.now();

  try {
    batchedEventUpdates(function() {
      traverseAndHandleEventResponderInstances(
        topLevelType,
        targetFiber,
        nativeEvent
      );
    });
  } finally {
    currentInstance = previousInstance;
    currentTimeStamp = previousTimeStamp;
  }
} // TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic

function mountEventResponder(responder, responderInstance, props, state) {
  var onMount = responder.onMount;

  if (onMount !== null) {
    currentInstance = responderInstance;

    try {
      batchedEventUpdates(function() {
        onMount(eventResponderContext, props, state);
      });
    } finally {
      currentInstance = null;
    }
  }
} // TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic

function unmountEventResponder(responderInstance) {
  var responder = responderInstance.responder;
  var onUnmount = responder.onUnmount;

  if (onUnmount !== null) {
    var props = responderInstance.props,
      state = responderInstance.state;
    currentInstance = responderInstance;

    try {
      batchedEventUpdates(function() {
        onUnmount(eventResponderContext, props, state);
      });
    } finally {
      currentInstance = null;
    }
  }

  var rootEventTypesSet = responderInstance.rootEventTypes;

  if (rootEventTypesSet !== null) {
    var rootEventTypes = Array.from(rootEventTypesSet);

    for (var i = 0; i < rootEventTypes.length; i++) {
      var topLevelEventType = rootEventTypes[i];
      var rootEventResponderInstances = rootEventTypesToEventResponderInstances.get(
        topLevelEventType
      );

      if (rootEventResponderInstances !== undefined) {
        rootEventResponderInstances.delete(responderInstance);
      }
    }
  }
}

function registerRootEventType(rootEventType, responderInstance) {
  var rootEventResponderInstances = rootEventTypesToEventResponderInstances.get(
    rootEventType
  );

  if (rootEventResponderInstances === undefined) {
    rootEventResponderInstances = new Set();
    rootEventTypesToEventResponderInstances.set(
      rootEventType,
      rootEventResponderInstances
    );
  }

  var rootEventTypesSet = responderInstance.rootEventTypes;

  if (rootEventTypesSet === null) {
    rootEventTypesSet = responderInstance.rootEventTypes = new Set();
  }

  if (!!rootEventTypesSet.has(rootEventType)) {
    throw Error(
      'addRootEventTypes() found a duplicate root event type of "' +
        rootEventType +
        '". This might be because the event type exists in the event responder "rootEventTypes" array or because of a previous addRootEventTypes() using this root event type.'
    );
  }

  rootEventTypesSet.add(rootEventType);
  rootEventResponderInstances.add(responderInstance);
}

function addRootEventTypesForResponderInstance(
  responderInstance,
  rootEventTypes
) {
  for (var i = 0; i < rootEventTypes.length; i++) {
    var rootEventType = rootEventTypes[i];
    registerRootEventType(rootEventType, responderInstance);
  }
}

function dispatchEvent(target, topLevelType, nativeEvent) {
  var targetFiber = target;

  if (enableFlareAPI) {
    // React Flare event system
    dispatchEventForResponderEventSystem(topLevelType, target, nativeEvent);
  }

  var eventTarget = null;

  if (enableNativeTargetAsInstance) {
    if (targetFiber != null) {
      eventTarget = targetFiber.stateNode.canonical;
    }
  } else {
    eventTarget = nativeEvent.target;
  }

  batchedUpdates(function() {
    // Heritage plugin event system
    runExtractedPluginEventsInBatch(
      topLevelType,
      targetFiber,
      nativeEvent,
      eventTarget,
      PLUGIN_EVENT_SYSTEM
    );
  }); // React Native doesn't use ReactControlledComponent but if it did, here's
  // where it would do it.
}

// can re-export everything from this module.

function shim() {
  {
    throw Error(
      "The current renderer does not support mutation. This error is likely caused by a bug in React. Please file an issue."
    );
  }
} // Mutation (when unsupported)

var supportsMutation = false;
var appendChild = shim;
var appendChildToContainer = shim;
var commitTextUpdate = shim;
var commitMount = shim;
var commitUpdate = shim;
var insertBefore = shim;
var insertInContainerBefore = shim;
var removeChild = shim;
var removeChildFromContainer = shim;
var resetTextContent = shim;
var hideInstance = shim;
var hideTextInstance = shim;
var unhideInstance = shim;
var unhideTextInstance = shim;

// can re-export everything from this module.

function shim$1() {
  {
    throw Error(
      "The current renderer does not support hydration. This error is likely caused by a bug in React. Please file an issue."
    );
  }
} // Hydration (when unsupported)

var supportsHydration = false;
var canHydrateInstance = shim$1;
var canHydrateTextInstance = shim$1;
var canHydrateSuspenseInstance = shim$1;
var isSuspenseInstancePending = shim$1;
var isSuspenseInstanceFallback = shim$1;
var registerSuspenseInstanceRetry = shim$1;
var getNextHydratableSibling = shim$1;
var getFirstHydratableChild = shim$1;
var hydrateInstance = shim$1;
var hydrateTextInstance = shim$1;
var hydrateSuspenseInstance = shim$1;
var getNextHydratableInstanceAfterSuspenseInstance = shim$1;
var commitHydratedContainer = shim$1;
var commitHydratedSuspenseInstance = shim$1;
var clearSuspenseBoundary = shim$1;
var clearSuspenseBoundaryFromContainer = shim$1;
var didNotMatchHydratedContainerTextInstance = shim$1;
var didNotMatchHydratedTextInstance = shim$1;
var didNotHydrateContainerInstance = shim$1;
var didNotHydrateInstance = shim$1;
var didNotFindHydratableContainerInstance = shim$1;
var didNotFindHydratableContainerTextInstance = shim$1;
var didNotFindHydratableContainerSuspenseInstance = shim$1;
var didNotFindHydratableInstance = shim$1;
var didNotFindHydratableTextInstance = shim$1;
var didNotFindHydratableSuspenseInstance = shim$1;

var _nativeFabricUIManage$1 = nativeFabricUIManager;
var createNode = _nativeFabricUIManage$1.createNode;
var cloneNode = _nativeFabricUIManage$1.cloneNode;
var cloneNodeWithNewChildren = _nativeFabricUIManage$1.cloneNodeWithNewChildren;
var cloneNodeWithNewChildrenAndProps =
  _nativeFabricUIManage$1.cloneNodeWithNewChildrenAndProps;
var cloneNodeWithNewProps = _nativeFabricUIManage$1.cloneNodeWithNewProps;
var createChildNodeSet = _nativeFabricUIManage$1.createChildSet;
var appendChildNode = _nativeFabricUIManage$1.appendChild;
var appendChildNodeToSet = _nativeFabricUIManage$1.appendChildToSet;
var completeRoot = _nativeFabricUIManage$1.completeRoot;
var registerEventHandler = _nativeFabricUIManage$1.registerEventHandler;
var fabricMeasure = _nativeFabricUIManage$1.measure;
var fabricMeasureInWindow = _nativeFabricUIManage$1.measureInWindow;
var fabricMeasureLayout = _nativeFabricUIManage$1.measureLayout;
var getViewConfigForType =
  ReactNativePrivateInterface.ReactNativeViewConfigRegistry.get; // Counter for uniquely identifying views.
// % 10 === 1 means it is a rootTag.
// % 2 === 0 means it is a Fabric tag.
// This means that they never overlap.

var nextReactTag = 2;

// TODO: Remove this conditional once all changes have propagated.
if (registerEventHandler) {
  /**
   * Register the event emitter with the native bridge
   */
  registerEventHandler(dispatchEvent);
}
/**
 * This is used for refs on host components.
 */

var ReactFabricHostComponent =
  /*#__PURE__*/
  (function() {
    function ReactFabricHostComponent(
      tag,
      viewConfig,
      props,
      internalInstanceHandle
    ) {
      this._nativeTag = tag;
      this.viewConfig = viewConfig;
      this.currentProps = props;
      this._internalInstanceHandle = internalInstanceHandle;
    }

    var _proto = ReactFabricHostComponent.prototype;

    _proto.blur = function blur() {
      ReactNativePrivateInterface.TextInputState.blurTextInput(this._nativeTag);
    };

    _proto.focus = function focus() {
      ReactNativePrivateInterface.TextInputState.focusTextInput(
        this._nativeTag
      );
    };

    _proto.measure = function measure(callback) {
      fabricMeasure(
        this._internalInstanceHandle.stateNode.node,
        mountSafeCallback_NOT_REALLY_SAFE(this, callback)
      );
    };

    _proto.measureInWindow = function measureInWindow(callback) {
      fabricMeasureInWindow(
        this._internalInstanceHandle.stateNode.node,
        mountSafeCallback_NOT_REALLY_SAFE(this, callback)
      );
    };

    _proto.measureLayout = function measureLayout(
      relativeToNativeNode,
      onSuccess,
      onFail
    ) /* currently unused */
    {
      if (
        typeof relativeToNativeNode === "number" ||
        !(relativeToNativeNode instanceof ReactFabricHostComponent)
      ) {
        warningWithoutStack$1(
          false,
          "Warning: ref.measureLayout must be called with a ref to a native component."
        );
        return;
      }

      fabricMeasureLayout(
        this._internalInstanceHandle.stateNode.node,
        relativeToNativeNode._internalInstanceHandle.stateNode.node,
        mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
        mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess)
      );
    };

    _proto.setNativeProps = function setNativeProps(nativeProps) {
      warningWithoutStack$1(
        false,
        "Warning: setNativeProps is not currently supported in Fabric"
      );
      return;
    };

    return ReactFabricHostComponent;
  })(); // eslint-disable-next-line no-unused-expressions

function appendInitialChild(parentInstance, child) {
  appendChildNode(parentInstance.node, child.node);
}
function createInstance(
  type,
  props,
  rootContainerInstance,
  hostContext,
  internalInstanceHandle
) {
  var tag = nextReactTag;
  nextReactTag += 2;
  var viewConfig = getViewConfigForType(type);

  {
    for (var key in viewConfig.validAttributes) {
      if (props.hasOwnProperty(key)) {
        ReactNativePrivateInterface.deepFreezeAndThrowOnMutationInDev(
          props[key]
        );
      }
    }
  }

  var updatePayload = create(props, viewConfig.validAttributes);
  var node = createNode(
    tag, // reactTag
    viewConfig.uiViewClassName, // viewName
    rootContainerInstance, // rootTag
    updatePayload, // props
    internalInstanceHandle // internalInstanceHandle
  );
  var component = new ReactFabricHostComponent(
    tag,
    viewConfig,
    props,
    internalInstanceHandle
  );
  return {
    node: node,
    canonical: component
  };
}
function createTextInstance(
  text,
  rootContainerInstance,
  hostContext,
  internalInstanceHandle
) {
  if (!hostContext.isInAParentText) {
    throw Error("Text strings must be rendered within a <Text> component.");
  }

  var tag = nextReactTag;
  nextReactTag += 2;
  var node = createNode(
    tag, // reactTag
    "RCTRawText", // viewName
    rootContainerInstance, // rootTag
    {
      text: text
    }, // props
    internalInstanceHandle // instance handle
  );
  return {
    node: node
  };
}
function finalizeInitialChildren(
  parentInstance,
  type,
  props,
  rootContainerInstance,
  hostContext
) {
  return false;
}
function getRootHostContext(rootContainerInstance) {
  return {
    isInAParentText: false
  };
}
function getChildHostContext(parentHostContext, type, rootContainerInstance) {
  var prevIsInAParentText = parentHostContext.isInAParentText;
  var isInAParentText =
    type === "AndroidTextInput" || // Android
    type === "RCTMultilineTextInputView" || // iOS
    type === "RCTSinglelineTextInputView" || // iOS
    type === "RCTText" ||
    type === "RCTVirtualText";

  if (prevIsInAParentText !== isInAParentText) {
    return {
      isInAParentText: isInAParentText
    };
  } else {
    return parentHostContext;
  }
}
function getPublicInstance(instance) {
  return instance.canonical;
}
function prepareForCommit(containerInfo) {
  // Noop
}
function prepareUpdate(
  instance,
  type,
  oldProps,
  newProps,
  rootContainerInstance,
  hostContext
) {
  var viewConfig = instance.canonical.viewConfig;
  var updatePayload = diff(oldProps, newProps, viewConfig.validAttributes); // TODO: If the event handlers have changed, we need to update the current props
  // in the commit phase but there is no host config hook to do it yet.
  // So instead we hack it by updating it in the render phase.

  instance.canonical.currentProps = newProps;
  return updatePayload;
}
function resetAfterCommit(containerInfo) {
  // Noop
}
function shouldDeprioritizeSubtree(type, props) {
  return false;
}
function shouldSetTextContent(type, props) {
  // TODO (bvaughn) Revisit this decision.
  // Always returning false simplifies the createInstance() implementation,
  // But creates an additional child Fiber for raw text children.
  // No additional native views are created though.
  // It's not clear to me which is better so I'm deferring for now.
  // More context @ github.com/facebook/react/pull/8560#discussion_r92111303
  return false;
} // The Fabric renderer is secondary to the existing React Native renderer.

var isPrimaryRenderer = false; // The Fabric renderer shouldn't trigger missing act() warnings

var warnsIfNotActing = false;
var scheduleTimeout = setTimeout;
var cancelTimeout = clearTimeout;
var noTimeout = -1; // -------------------
//     Persistence
// -------------------

var supportsPersistence = true;
function cloneInstance(
  instance,
  updatePayload,
  type,
  oldProps,
  newProps,
  internalInstanceHandle,
  keepChildren,
  recyclableInstance
) {
  var node = instance.node;
  var clone;

  if (keepChildren) {
    if (updatePayload !== null) {
      clone = cloneNodeWithNewProps(node, updatePayload);
    } else {
      clone = cloneNode(node);
    }
  } else {
    if (updatePayload !== null) {
      clone = cloneNodeWithNewChildrenAndProps(node, updatePayload);
    } else {
      clone = cloneNodeWithNewChildren(node);
    }
  }

  return {
    node: clone,
    canonical: instance.canonical
  };
}
function cloneHiddenInstance(instance, type, props, internalInstanceHandle) {
  var viewConfig = instance.canonical.viewConfig;
  var node = instance.node;
  var updatePayload = create(
    {
      style: {
        display: "none"
      }
    },
    viewConfig.validAttributes
  );
  return {
    node: cloneNodeWithNewProps(node, updatePayload),
    canonical: instance.canonical
  };
}
function cloneHiddenTextInstance(instance, text, internalInstanceHandle) {
  throw new Error("Not yet implemented.");
}
function createContainerChildSet(container) {
  return createChildNodeSet(container);
}
function appendChildToContainerChildSet(childSet, child) {
  appendChildNodeToSet(childSet, child.node);
}
function finalizeContainerChildren(container, newChildren) {
  completeRoot(container, newChildren);
}

function mountResponderInstance(
  responder,
  responderInstance,
  props,
  state,
  instance
) {
  if (enableFlareAPI) {
    var rootEventTypes = responder.rootEventTypes;

    if (rootEventTypes !== null) {
      addRootEventTypesForResponderInstance(responderInstance, rootEventTypes);
    }

    mountEventResponder(responder, responderInstance, props, state);
  }
}
function unmountResponderInstance(responderInstance) {
  if (enableFlareAPI) {
    // TODO stop listening to targetEventTypes
    unmountEventResponder(responderInstance);
  }
}
function getFundamentalComponentInstance(fundamentalInstance) {
  throw new Error("Not yet implemented.");
}
function mountFundamentalComponent(fundamentalInstance) {
  throw new Error("Not yet implemented.");
}
function shouldUpdateFundamentalComponent(fundamentalInstance) {
  throw new Error("Not yet implemented.");
}
function updateFundamentalComponent(fundamentalInstance) {
  throw new Error("Not yet implemented.");
}
function unmountFundamentalComponent(fundamentalInstance) {
  throw new Error("Not yet implemented.");
}
function cloneFundamentalInstance(fundamentalInstance) {
  throw new Error("Not yet implemented.");
}
function getInstanceFromNode$1(node) {
  throw new Error("Not yet implemented.");
}

var BEFORE_SLASH_RE = /^(.*)[\\\/]/;
var describeComponentFrame = function(name, source, ownerName) {
  var sourceInfo = "";

  if (source) {
    var path = source.fileName;
    var fileName = path.replace(BEFORE_SLASH_RE, "");

    {
      // In DEV, include code for a common special case:
      // prefer "folder/index.js" instead of just "index.js".
      if (/^index\./.test(fileName)) {
        var match = path.match(BEFORE_SLASH_RE);

        if (match) {
          var pathBeforeSlash = match[1];

          if (pathBeforeSlash) {
            var folderName = pathBeforeSlash.replace(BEFORE_SLASH_RE, "");
            fileName = folderName + "/" + fileName;
          }
        }
      }
    }

    sourceInfo = " (at " + fileName + ":" + source.lineNumber + ")";
  } else if (ownerName) {
    sourceInfo = " (created by " + ownerName + ")";
  }

  return "\n    in " + (name || "Unknown") + sourceInfo;
};

var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

function describeFiber(fiber) {
  switch (fiber.tag) {
    case HostRoot:
    case HostPortal:
    case HostText:
    case Fragment:
    case ContextProvider:
    case ContextConsumer:
      return "";

    default:
      var owner = fiber._debugOwner;
      var source = fiber._debugSource;
      var name = getComponentName(fiber.type);
      var ownerName = null;

      if (owner) {
        ownerName = getComponentName(owner.type);
      }

      return describeComponentFrame(name, source, ownerName);
  }
}

function getStackByFiberInDevAndProd(workInProgress) {
  var info = "";
  var node = workInProgress;

  do {
    info += describeFiber(node);
    node = node.return;
  } while (node);

  return info;
}
var current = null;
var phase = null;
function getCurrentFiberOwnerNameInDevOrNull() {
  {
    if (current === null) {
      return null;
    }

    var owner = current._debugOwner;

    if (owner !== null && typeof owner !== "undefined") {
      return getComponentName(owner.type);
    }
  }

  return null;
}
function getCurrentFiberStackInDev() {
  {
    if (current === null) {
      return "";
    } // Safe because if current fiber exists, we are reconciling,
    // and it is guaranteed to be the work-in-progress version.

    return getStackByFiberInDevAndProd(current);
  }

  return "";
}
function resetCurrentFiber() {
  {
    ReactDebugCurrentFrame.getCurrentStack = null;
    current = null;
    phase = null;
  }
}
function setCurrentFiber(fiber) {
  {
    ReactDebugCurrentFrame.getCurrentStack = getCurrentFiberStackInDev;
    current = fiber;
    phase = null;
  }
}
function setCurrentPhase(lifeCyclePhase) {
  {
    phase = lifeCyclePhase;
  }
}

// Prefix measurements so that it's possible to filter them.
// Longer prefixes are hard to read in DevTools.
var reactEmoji = "\u269B";
var warningEmoji = "\u26D4";
var supportsUserTiming =
  typeof performance !== "undefined" &&
  typeof performance.mark === "function" &&
  typeof performance.clearMarks === "function" &&
  typeof performance.measure === "function" &&
  typeof performance.clearMeasures === "function"; // Keep track of current fiber so that we know the path to unwind on pause.
// TODO: this looks the same as nextUnitOfWork in scheduler. Can we unify them?

var currentFiber = null; // If we're in the middle of user code, which fiber and method is it?
// Reusing `currentFiber` would be confusing for this because user code fiber
// can change during commit phase too, but we don't need to unwind it (since
// lifecycles in the commit phase don't resemble a tree).

var currentPhase = null;
var currentPhaseFiber = null; // Did lifecycle hook schedule an update? This is often a performance problem,
// so we will keep track of it, and include it in the report.
// Track commits caused by cascading updates.

var isCommitting = false;
var hasScheduledUpdateInCurrentCommit = false;
var hasScheduledUpdateInCurrentPhase = false;
var commitCountInCurrentWorkLoop = 0;
var effectCountInCurrentCommit = 0;
// to avoid stretch the commit phase with measurement overhead.

var labelsInCurrentCommit = new Set();

var formatMarkName = function(markName) {
  return reactEmoji + " " + markName;
};

var formatLabel = function(label, warning) {
  var prefix = warning ? warningEmoji + " " : reactEmoji + " ";
  var suffix = warning ? " Warning: " + warning : "";
  return "" + prefix + label + suffix;
};

var beginMark = function(markName) {
  performance.mark(formatMarkName(markName));
};

var clearMark = function(markName) {
  performance.clearMarks(formatMarkName(markName));
};

var endMark = function(label, markName, warning) {
  var formattedMarkName = formatMarkName(markName);
  var formattedLabel = formatLabel(label, warning);

  try {
    performance.measure(formattedLabel, formattedMarkName);
  } catch (err) {} // If previous mark was missing for some reason, this will throw.
  // This could only happen if React crashed in an unexpected place earlier.
  // Don't pile on with more errors.
  // Clear marks immediately to avoid growing buffer.

  performance.clearMarks(formattedMarkName);
  performance.clearMeasures(formattedLabel);
};

var getFiberMarkName = function(label, debugID) {
  return label + " (#" + debugID + ")";
};

var getFiberLabel = function(componentName, isMounted, phase) {
  if (phase === null) {
    // These are composite component total time measurements.
    return componentName + " [" + (isMounted ? "update" : "mount") + "]";
  } else {
    // Composite component methods.
    return componentName + "." + phase;
  }
};

var beginFiberMark = function(fiber, phase) {
  var componentName = getComponentName(fiber.type) || "Unknown";
  var debugID = fiber._debugID;
  var isMounted = fiber.alternate !== null;
  var label = getFiberLabel(componentName, isMounted, phase);

  if (isCommitting && labelsInCurrentCommit.has(label)) {
    // During the commit phase, we don't show duplicate labels because
    // there is a fixed overhead for every measurement, and we don't
    // want to stretch the commit phase beyond necessary.
    return false;
  }

  labelsInCurrentCommit.add(label);
  var markName = getFiberMarkName(label, debugID);
  beginMark(markName);
  return true;
};

var clearFiberMark = function(fiber, phase) {
  var componentName = getComponentName(fiber.type) || "Unknown";
  var debugID = fiber._debugID;
  var isMounted = fiber.alternate !== null;
  var label = getFiberLabel(componentName, isMounted, phase);
  var markName = getFiberMarkName(label, debugID);
  clearMark(markName);
};

var endFiberMark = function(fiber, phase, warning) {
  var componentName = getComponentName(fiber.type) || "Unknown";
  var debugID = fiber._debugID;
  var isMounted = fiber.alternate !== null;
  var label = getFiberLabel(componentName, isMounted, phase);
  var markName = getFiberMarkName(label, debugID);
  endMark(label, markName, warning);
};

var shouldIgnoreFiber = function(fiber) {
  // Host components should be skipped in the timeline.
  // We could check typeof fiber.type, but does this work with RN?
  switch (fiber.tag) {
    case HostRoot:
    case HostComponent:
    case HostText:
    case HostPortal:
    case Fragment:
    case ContextProvider:
    case ContextConsumer:
    case Mode:
      return true;

    default:
      return false;
  }
};

var clearPendingPhaseMeasurement = function() {
  if (currentPhase !== null && currentPhaseFiber !== null) {
    clearFiberMark(currentPhaseFiber, currentPhase);
  }

  currentPhaseFiber = null;
  currentPhase = null;
  hasScheduledUpdateInCurrentPhase = false;
};

var pauseTimers = function() {
  // Stops all currently active measurements so that they can be resumed
  // if we continue in a later deferred loop from the same unit of work.
  var fiber = currentFiber;

  while (fiber) {
    if (fiber._debugIsCurrentlyTiming) {
      endFiberMark(fiber, null, null);
    }

    fiber = fiber.return;
  }
};

var resumeTimersRecursively = function(fiber) {
  if (fiber.return !== null) {
    resumeTimersRecursively(fiber.return);
  }

  if (fiber._debugIsCurrentlyTiming) {
    beginFiberMark(fiber, null);
  }
};

var resumeTimers = function() {
  // Resumes all measurements that were active during the last deferred loop.
  if (currentFiber !== null) {
    resumeTimersRecursively(currentFiber);
  }
};

function recordEffect() {
  if (enableUserTimingAPI) {
    effectCountInCurrentCommit++;
  }
}
function recordScheduleUpdate() {
  if (enableUserTimingAPI) {
    if (isCommitting) {
      hasScheduledUpdateInCurrentCommit = true;
    }

    if (
      currentPhase !== null &&
      currentPhase !== "componentWillMount" &&
      currentPhase !== "componentWillReceiveProps"
    ) {
      hasScheduledUpdateInCurrentPhase = true;
    }
  }
}

function startWorkTimer(fiber) {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming || shouldIgnoreFiber(fiber)) {
      return;
    } // If we pause, this is the fiber to unwind from.

    currentFiber = fiber;

    if (!beginFiberMark(fiber, null)) {
      return;
    }

    fiber._debugIsCurrentlyTiming = true;
  }
}
function cancelWorkTimer(fiber) {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming || shouldIgnoreFiber(fiber)) {
      return;
    } // Remember we shouldn't complete measurement for this fiber.
    // Otherwise flamechart will be deep even for small updates.

    fiber._debugIsCurrentlyTiming = false;
    clearFiberMark(fiber, null);
  }
}
function stopWorkTimer(fiber) {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming || shouldIgnoreFiber(fiber)) {
      return;
    } // If we pause, its parent is the fiber to unwind from.

    currentFiber = fiber.return;

    if (!fiber._debugIsCurrentlyTiming) {
      return;
    }

    fiber._debugIsCurrentlyTiming = false;
    endFiberMark(fiber, null, null);
  }
}
function stopFailedWorkTimer(fiber) {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming || shouldIgnoreFiber(fiber)) {
      return;
    } // If we pause, its parent is the fiber to unwind from.

    currentFiber = fiber.return;

    if (!fiber._debugIsCurrentlyTiming) {
      return;
    }

    fiber._debugIsCurrentlyTiming = false;
    var warning =
      fiber.tag === SuspenseComponent
        ? "Rendering was suspended"
        : "An error was thrown inside this error boundary";
    endFiberMark(fiber, null, warning);
  }
}
function startPhaseTimer(fiber, phase) {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }

    clearPendingPhaseMeasurement();

    if (!beginFiberMark(fiber, phase)) {
      return;
    }

    currentPhaseFiber = fiber;
    currentPhase = phase;
  }
}
function stopPhaseTimer() {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }

    if (currentPhase !== null && currentPhaseFiber !== null) {
      var warning = hasScheduledUpdateInCurrentPhase
        ? "Scheduled a cascading update"
        : null;
      endFiberMark(currentPhaseFiber, currentPhase, warning);
    }

    currentPhase = null;
    currentPhaseFiber = null;
  }
}
function startWorkLoopTimer(nextUnitOfWork) {
  if (enableUserTimingAPI) {
    currentFiber = nextUnitOfWork;

    if (!supportsUserTiming) {
      return;
    }

    commitCountInCurrentWorkLoop = 0; // This is top level call.
    // Any other measurements are performed within.

    beginMark("(React Tree Reconciliation)"); // Resume any measurements that were in progress during the last loop.

    resumeTimers();
  }
}
function stopWorkLoopTimer(interruptedBy, didCompleteRoot) {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }

    var warning = null;

    if (interruptedBy !== null) {
      if (interruptedBy.tag === HostRoot) {
        warning = "A top-level update interrupted the previous render";
      } else {
        var componentName = getComponentName(interruptedBy.type) || "Unknown";
        warning =
          "An update to " + componentName + " interrupted the previous render";
      }
    } else if (commitCountInCurrentWorkLoop > 1) {
      warning = "There were cascading updates";
    }

    commitCountInCurrentWorkLoop = 0;
    var label = didCompleteRoot
      ? "(React Tree Reconciliation: Completed Root)"
      : "(React Tree Reconciliation: Yielded)"; // Pause any measurements until the next loop.

    pauseTimers();
    endMark(label, "(React Tree Reconciliation)", warning);
  }
}
function startCommitTimer() {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }

    isCommitting = true;
    hasScheduledUpdateInCurrentCommit = false;
    labelsInCurrentCommit.clear();
    beginMark("(Committing Changes)");
  }
}
function stopCommitTimer() {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }

    var warning = null;

    if (hasScheduledUpdateInCurrentCommit) {
      warning = "Lifecycle hook scheduled a cascading update";
    } else if (commitCountInCurrentWorkLoop > 0) {
      warning = "Caused by a cascading update in earlier commit";
    }

    hasScheduledUpdateInCurrentCommit = false;
    commitCountInCurrentWorkLoop++;
    isCommitting = false;
    labelsInCurrentCommit.clear();
    endMark("(Committing Changes)", "(Committing Changes)", warning);
  }
}
function startCommitSnapshotEffectsTimer() {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }

    effectCountInCurrentCommit = 0;
    beginMark("(Committing Snapshot Effects)");
  }
}
function stopCommitSnapshotEffectsTimer() {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }

    var count = effectCountInCurrentCommit;
    effectCountInCurrentCommit = 0;
    endMark(
      "(Committing Snapshot Effects: " + count + " Total)",
      "(Committing Snapshot Effects)",
      null
    );
  }
}
function startCommitHostEffectsTimer() {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }

    effectCountInCurrentCommit = 0;
    beginMark("(Committing Host Effects)");
  }
}
function stopCommitHostEffectsTimer() {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }

    var count = effectCountInCurrentCommit;
    effectCountInCurrentCommit = 0;
    endMark(
      "(Committing Host Effects: " + count + " Total)",
      "(Committing Host Effects)",
      null
    );
  }
}
function startCommitLifeCyclesTimer() {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }

    effectCountInCurrentCommit = 0;
    beginMark("(Calling Lifecycle Methods)");
  }
}
function stopCommitLifeCyclesTimer() {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }

    var count = effectCountInCurrentCommit;
    effectCountInCurrentCommit = 0;
    endMark(
      "(Calling Lifecycle Methods: " + count + " Total)",
      "(Calling Lifecycle Methods)",
      null
    );
  }
}

var valueStack = [];
var fiberStack;

{
  fiberStack = [];
}

var index = -1;

function createCursor(defaultValue) {
  return {
    current: defaultValue
  };
}

function pop(cursor, fiber) {
  if (index < 0) {
    {
      warningWithoutStack$1(false, "Unexpected pop.");
    }

    return;
  }

  {
    if (fiber !== fiberStack[index]) {
      warningWithoutStack$1(false, "Unexpected Fiber popped.");
    }
  }

  cursor.current = valueStack[index];
  valueStack[index] = null;

  {
    fiberStack[index] = null;
  }

  index--;
}

function push(cursor, value, fiber) {
  index++;
  valueStack[index] = cursor.current;

  {
    fiberStack[index] = fiber;
  }

  cursor.current = value;
}

var warnedAboutMissingGetChildContext;

{
  warnedAboutMissingGetChildContext = {};
}

var emptyContextObject = {};

{
  Object.freeze(emptyContextObject);
} // A cursor to the current merged context object on the stack.

var contextStackCursor = createCursor(emptyContextObject); // A cursor to a boolean indicating whether the context has changed.

var didPerformWorkStackCursor = createCursor(false); // Keep track of the previous context object that was on the stack.
// We use this to get access to the parent context after we have already
// pushed the next context provider, and now need to merge their contexts.

var previousContext = emptyContextObject;

function getUnmaskedContext(
  workInProgress,
  Component,
  didPushOwnContextIfProvider
) {
  if (disableLegacyContext) {
    return emptyContextObject;
  } else {
    if (didPushOwnContextIfProvider && isContextProvider(Component)) {
      // If the fiber is a context provider itself, when we read its context
      // we may have already pushed its own child context on the stack. A context
      // provider should not "see" its own child context. Therefore we read the
      // previous (parent) context instead for a context provider.
      return previousContext;
    }

    return contextStackCursor.current;
  }
}

function cacheContext(workInProgress, unmaskedContext, maskedContext) {
  if (disableLegacyContext) {
    return;
  } else {
    var instance = workInProgress.stateNode;
    instance.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext;
    instance.__reactInternalMemoizedMaskedChildContext = maskedContext;
  }
}

function getMaskedContext(workInProgress, unmaskedContext) {
  if (disableLegacyContext) {
    return emptyContextObject;
  } else {
    var type = workInProgress.type;
    var contextTypes = type.contextTypes;

    if (!contextTypes) {
      return emptyContextObject;
    } // Avoid recreating masked context unless unmasked context has changed.
    // Failing to do this will result in unnecessary calls to componentWillReceiveProps.
    // This may trigger infinite loops if componentWillReceiveProps calls setState.

    var instance = workInProgress.stateNode;

    if (
      instance &&
      instance.__reactInternalMemoizedUnmaskedChildContext === unmaskedContext
    ) {
      return instance.__reactInternalMemoizedMaskedChildContext;
    }

    var context = {};

    for (var key in contextTypes) {
      context[key] = unmaskedContext[key];
    }

    {
      var name = getComponentName(type) || "Unknown";
      checkPropTypes(
        contextTypes,
        context,
        "context",
        name,
        getCurrentFiberStackInDev
      );
    } // Cache unmasked context so we can avoid recreating masked context unless necessary.
    // Context is created before the class component is instantiated so check for instance.

    if (instance) {
      cacheContext(workInProgress, unmaskedContext, context);
    }

    return context;
  }
}

function hasContextChanged() {
  if (disableLegacyContext) {
    return false;
  } else {
    return didPerformWorkStackCursor.current;
  }
}

function isContextProvider(type) {
  if (disableLegacyContext) {
    return false;
  } else {
    var childContextTypes = type.childContextTypes;
    return childContextTypes !== null && childContextTypes !== undefined;
  }
}

function popContext(fiber) {
  if (disableLegacyContext) {
    return;
  } else {
    pop(didPerformWorkStackCursor, fiber);
    pop(contextStackCursor, fiber);
  }
}

function popTopLevelContextObject(fiber) {
  if (disableLegacyContext) {
    return;
  } else {
    pop(didPerformWorkStackCursor, fiber);
    pop(contextStackCursor, fiber);
  }
}

function pushTopLevelContextObject(fiber, context, didChange) {
  if (disableLegacyContext) {
    return;
  } else {
    if (!(contextStackCursor.current === emptyContextObject)) {
      throw Error(
        "Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue."
      );
    }

    push(contextStackCursor, context, fiber);
    push(didPerformWorkStackCursor, didChange, fiber);
  }
}

function processChildContext(fiber, type, parentContext) {
  if (disableLegacyContext) {
    return parentContext;
  } else {
    var instance = fiber.stateNode;
    var childContextTypes = type.childContextTypes; // TODO (bvaughn) Replace this behavior with an invariant() in the future.
    // It has only been added in Fiber to match the (unintentional) behavior in Stack.

    if (typeof instance.getChildContext !== "function") {
      {
        var componentName = getComponentName(type) || "Unknown";

        if (!warnedAboutMissingGetChildContext[componentName]) {
          warnedAboutMissingGetChildContext[componentName] = true;
          warningWithoutStack$1(
            false,
            "%s.childContextTypes is specified but there is no getChildContext() method " +
              "on the instance. You can either define getChildContext() on %s or remove " +
              "childContextTypes from it.",
            componentName,
            componentName
          );
        }
      }

      return parentContext;
    }

    var childContext;

    {
      setCurrentPhase("getChildContext");
    }

    startPhaseTimer(fiber, "getChildContext");
    childContext = instance.getChildContext();
    stopPhaseTimer();

    {
      setCurrentPhase(null);
    }

    for (var contextKey in childContext) {
      if (!(contextKey in childContextTypes)) {
        throw Error(
          (getComponentName(type) || "Unknown") +
            '.getChildContext(): key "' +
            contextKey +
            '" is not defined in childContextTypes.'
        );
      }
    }

    {
      var name = getComponentName(type) || "Unknown";
      checkPropTypes(
        childContextTypes,
        childContext,
        "child context",
        name, // In practice, there is one case in which we won't get a stack. It's when
        // somebody calls unstable_renderSubtreeIntoContainer() and we process
        // context from the parent component instance. The stack will be missing
        // because it's outside of the reconciliation, and so the pointer has not
        // been set. This is rare and doesn't matter. We'll also remove that API.
        getCurrentFiberStackInDev
      );
    }

    return Object.assign({}, parentContext, {}, childContext);
  }
}

function pushContextProvider(workInProgress) {
  if (disableLegacyContext) {
    return false;
  } else {
    var instance = workInProgress.stateNode; // We push the context as early as possible to ensure stack integrity.
    // If the instance does not exist yet, we will push null at first,
    // and replace it on the stack later when invalidating the context.

    var memoizedMergedChildContext =
      (instance && instance.__reactInternalMemoizedMergedChildContext) ||
      emptyContextObject; // Remember the parent context so we can merge with it later.
    // Inherit the parent's did-perform-work value to avoid inadvertently blocking updates.

    previousContext = contextStackCursor.current;
    push(contextStackCursor, memoizedMergedChildContext, workInProgress);
    push(
      didPerformWorkStackCursor,
      didPerformWorkStackCursor.current,
      workInProgress
    );
    return true;
  }
}

function invalidateContextProvider(workInProgress, type, didChange) {
  if (disableLegacyContext) {
    return;
  } else {
    var instance = workInProgress.stateNode;

    if (!instance) {
      throw Error(
        "Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue."
      );
    }

    if (didChange) {
      // Merge parent and own context.
      // Skip this if we're not updating due to sCU.
      // This avoids unnecessarily recomputing memoized values.
      var mergedContext = processChildContext(
        workInProgress,
        type,
        previousContext
      );
      instance.__reactInternalMemoizedMergedChildContext = mergedContext; // Replace the old (or empty) context with the new one.
      // It is important to unwind the context in the reverse order.

      pop(didPerformWorkStackCursor, workInProgress);
      pop(contextStackCursor, workInProgress); // Now push the new context and mark that it has changed.

      push(contextStackCursor, mergedContext, workInProgress);
      push(didPerformWorkStackCursor, didChange, workInProgress);
    } else {
      pop(didPerformWorkStackCursor, workInProgress);
      push(didPerformWorkStackCursor, didChange, workInProgress);
    }
  }
}

function findCurrentUnmaskedContext(fiber) {
  if (disableLegacyContext) {
    return emptyContextObject;
  } else {
    // Currently this is only used with renderSubtreeIntoContainer; not sure if it
    // makes sense elsewhere
    if (!(isFiberMounted(fiber) && fiber.tag === ClassComponent)) {
      throw Error(
        "Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue."
      );
    }

    var node = fiber;

    do {
      switch (node.tag) {
        case HostRoot:
          return node.stateNode.context;

        case ClassComponent: {
          var Component = node.type;

          if (isContextProvider(Component)) {
            return node.stateNode.__reactInternalMemoizedMergedChildContext;
          }

          break;
        }
      }

      node = node.return;
    } while (node !== null);

    {
      throw Error(
        "Found unexpected detached subtree parent. This error is likely caused by a bug in React. Please file an issue."
      );
    }
  }
}

var LegacyRoot = 0;
var BlockingRoot = 1;
var ConcurrentRoot = 2;

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
var Scheduler_runWithPriority = Scheduler.unstable_runWithPriority;
var Scheduler_scheduleCallback = Scheduler.unstable_scheduleCallback;
var Scheduler_cancelCallback = Scheduler.unstable_cancelCallback;
var Scheduler_shouldYield = Scheduler.unstable_shouldYield;
var Scheduler_requestPaint = Scheduler.unstable_requestPaint;
var Scheduler_now = Scheduler.unstable_now;
var Scheduler_getCurrentPriorityLevel =
  Scheduler.unstable_getCurrentPriorityLevel;
var Scheduler_ImmediatePriority = Scheduler.unstable_ImmediatePriority;
var Scheduler_UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
var Scheduler_NormalPriority = Scheduler.unstable_NormalPriority;
var Scheduler_LowPriority = Scheduler.unstable_LowPriority;
var Scheduler_IdlePriority = Scheduler.unstable_IdlePriority;

if (enableSchedulerTracing) {
  // Provide explicit error message when production+profiling bundle of e.g.
  // react-dom is used with production (non-profiling) bundle of
  // scheduler/tracing
  if (
    !(
      tracing.__interactionsRef != null &&
      tracing.__interactionsRef.current != null
    )
  ) {
    throw Error(
      "It is not supported to run the profiling version of a renderer (for example, `react-dom/profiling`) without also replacing the `scheduler/tracing` module with `scheduler/tracing-profiling`. Your bundler might have a setting for aliasing both modules. Learn more at http://fb.me/react-profiling"
    );
  }
}

var fakeCallbackNode = {}; // Except for NoPriority, these correspond to Scheduler priorities. We use
// ascending numbers so we can compare them like numbers. They start at 90 to
// avoid clashing with Scheduler's priorities.

var ImmediatePriority = 99;
var UserBlockingPriority$1 = 98;
var NormalPriority = 97;
var LowPriority = 96;
var IdlePriority = 95; // NoPriority is the absence of priority. Also React-only.

var NoPriority = 90;
var shouldYield = Scheduler_shouldYield;
var requestPaint = // Fall back gracefully if we're running an older version of Scheduler.
  Scheduler_requestPaint !== undefined ? Scheduler_requestPaint : function() {};
var syncQueue = null;
var immediateQueueCallbackNode = null;
var isFlushingSyncQueue = false;
var initialTimeMs = Scheduler_now(); // If the initial timestamp is reasonably small, use Scheduler's `now` directly.
// This will be the case for modern browsers that support `performance.now`. In
// older browsers, Scheduler falls back to `Date.now`, which returns a Unix
// timestamp. In that case, subtract the module initialization time to simulate
// the behavior of performance.now and keep our times small enough to fit
// within 32 bits.
// TODO: Consider lifting this into Scheduler.

var now =
  initialTimeMs < 10000
    ? Scheduler_now
    : function() {
        return Scheduler_now() - initialTimeMs;
      };
function getCurrentPriorityLevel() {
  switch (Scheduler_getCurrentPriorityLevel()) {
    case Scheduler_ImmediatePriority:
      return ImmediatePriority;

    case Scheduler_UserBlockingPriority:
      return UserBlockingPriority$1;

    case Scheduler_NormalPriority:
      return NormalPriority;

    case Scheduler_LowPriority:
      return LowPriority;

    case Scheduler_IdlePriority:
      return IdlePriority;

    default: {
      throw Error("Unknown priority level.");
    }
  }
}

function reactPriorityToSchedulerPriority(reactPriorityLevel) {
  switch (reactPriorityLevel) {
    case ImmediatePriority:
      return Scheduler_ImmediatePriority;

    case UserBlockingPriority$1:
      return Scheduler_UserBlockingPriority;

    case NormalPriority:
      return Scheduler_NormalPriority;

    case LowPriority:
      return Scheduler_LowPriority;

    case IdlePriority:
      return Scheduler_IdlePriority;

    default: {
      throw Error("Unknown priority level.");
    }
  }
}

function runWithPriority$1(reactPriorityLevel, fn) {
  var priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  return Scheduler_runWithPriority(priorityLevel, fn);
}
function scheduleCallback(reactPriorityLevel, callback, options) {
  var priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  return Scheduler_scheduleCallback(priorityLevel, callback, options);
}
function scheduleSyncCallback(callback) {
  // Push this callback into an internal queue. We'll flush these either in
  // the next tick, or earlier if something calls `flushSyncCallbackQueue`.
  if (syncQueue === null) {
    syncQueue = [callback]; // Flush the queue in the next tick, at the earliest.

    immediateQueueCallbackNode = Scheduler_scheduleCallback(
      Scheduler_ImmediatePriority,
      flushSyncCallbackQueueImpl
    );
  } else {
    // Push onto existing queue. Don't need to schedule a callback because
    // we already scheduled one when we created the queue.
    syncQueue.push(callback);
  }

  return fakeCallbackNode;
}
function cancelCallback(callbackNode) {
  if (callbackNode !== fakeCallbackNode) {
    Scheduler_cancelCallback(callbackNode);
  }
}
function flushSyncCallbackQueue() {
  if (immediateQueueCallbackNode !== null) {
    var node = immediateQueueCallbackNode;
    immediateQueueCallbackNode = null;
    Scheduler_cancelCallback(node);
  }

  flushSyncCallbackQueueImpl();
}

function flushSyncCallbackQueueImpl() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    // Prevent re-entrancy.
    isFlushingSyncQueue = true;
    var i = 0;

    try {
      var _isSync = true;
      var queue = syncQueue;
      runWithPriority$1(ImmediatePriority, function() {
        for (; i < queue.length; i++) {
          var callback = queue[i];

          do {
            callback = callback(_isSync);
          } while (callback !== null);
        }
      });
      syncQueue = null;
    } catch (error) {
      // If something throws, leave the remaining callbacks on the queue.
      if (syncQueue !== null) {
        syncQueue = syncQueue.slice(i + 1);
      } // Resume flushing in the next tick

      Scheduler_scheduleCallback(
        Scheduler_ImmediatePriority,
        flushSyncCallbackQueue
      );
      throw error;
    } finally {
      isFlushingSyncQueue = false;
    }
  }
}

var NoMode = 0;
var StrictMode = 1; // TODO: Remove BlockingMode and ConcurrentMode by reading from the root
// tag instead

var BlockingMode = 2;
var ConcurrentMode = 4;
var ProfileMode = 8;

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
var MAX_SIGNED_31_BIT_INT = 1073741823;

var NoWork = 0; // TODO: Think of a better name for Never. The key difference with Idle is that
// Never work can be committed in an inconsistent state without tearing the UI.
// The main example is offscreen content, like a hidden subtree. So one possible
// name is Offscreen. However, it also includes dehydrated Suspense boundaries,
// which are inconsistent in the sense that they haven't finished yet, but
// aren't visibly inconsistent because the server rendered HTML matches what the
// hydrated tree would look like.

var Never = 1; // Idle is slightly higher priority than Never. It must completely finish in
// order to be consistent.

var Idle = 2; // Continuous Hydration is a moving priority. It is slightly higher than Idle
var Sync = MAX_SIGNED_31_BIT_INT;
var Batched = Sync - 1;
var UNIT_SIZE = 10;
var MAGIC_NUMBER_OFFSET = Batched - 1; // 1 unit of expiration time represents 10ms.

function msToExpirationTime(ms) {
  // Always add an offset so that we don't clash with the magic number for NoWork.
  return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0);
}
function expirationTimeToMs(expirationTime) {
  return (MAGIC_NUMBER_OFFSET - expirationTime) * UNIT_SIZE;
}

function ceiling(num, precision) {
  return (((num / precision) | 0) + 1) * precision;
}

function computeExpirationBucket(currentTime, expirationInMs, bucketSizeMs) {
  return (
    MAGIC_NUMBER_OFFSET -
    ceiling(
      MAGIC_NUMBER_OFFSET - currentTime + expirationInMs / UNIT_SIZE,
      bucketSizeMs / UNIT_SIZE
    )
  );
} // TODO: This corresponds to Scheduler's NormalPriority, not LowPriority. Update
// the names to reflect.

var LOW_PRIORITY_EXPIRATION = 5000;
var LOW_PRIORITY_BATCH_SIZE = 250;
function computeAsyncExpiration(currentTime) {
  return computeExpirationBucket(
    currentTime,
    LOW_PRIORITY_EXPIRATION,
    LOW_PRIORITY_BATCH_SIZE
  );
}
function computeSuspenseExpiration(currentTime, timeoutMs) {
  // TODO: Should we warn if timeoutMs is lower than the normal pri expiration time?
  return computeExpirationBucket(
    currentTime,
    timeoutMs,
    LOW_PRIORITY_BATCH_SIZE
  );
} // We intentionally set a higher expiration time for interactive updates in
// dev than in production.
//
// If the main thread is being blocked so long that you hit the expiration,
// it's a problem that could be solved with better scheduling.
//
// People will be more likely to notice this and fix it with the long
// expiration time in development.
//
// In production we opt for better UX at the risk of masking scheduling
// problems, by expiring fast.

var HIGH_PRIORITY_EXPIRATION = 500;
var HIGH_PRIORITY_BATCH_SIZE = 100;
function computeInteractiveExpiration(currentTime) {
  return computeExpirationBucket(
    currentTime,
    HIGH_PRIORITY_EXPIRATION,
    HIGH_PRIORITY_BATCH_SIZE
  );
}

function inferPriorityFromExpirationTime(currentTime, expirationTime) {
  if (expirationTime === Sync) {
    return ImmediatePriority;
  }

  if (expirationTime === Never || expirationTime === Idle) {
    return IdlePriority;
  }

  var msUntil =
    expirationTimeToMs(expirationTime) - expirationTimeToMs(currentTime);

  if (msUntil <= 0) {
    return ImmediatePriority;
  }

  if (msUntil <= HIGH_PRIORITY_EXPIRATION + HIGH_PRIORITY_BATCH_SIZE) {
    return UserBlockingPriority$1;
  }

  if (msUntil <= LOW_PRIORITY_EXPIRATION + LOW_PRIORITY_BATCH_SIZE) {
    return NormalPriority;
  } // TODO: Handle LowPriority
  // Assume anything lower has idle priority

  return IdlePriority;
}

/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
function is(x, y) {
  return (
    (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y) // eslint-disable-line no-self-compare
  );
}

var is$1 = typeof Object.is === "function" ? Object.is : is;

var hasOwnProperty = Object.prototype.hasOwnProperty;
/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal.
 */

function shallowEqual(objA, objB) {
  if (is$1(objA, objB)) {
    return true;
  }

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  } // Test for A's keys different from B.

  for (var i = 0; i < keysA.length; i++) {
    if (
      !hasOwnProperty.call(objB, keysA[i]) ||
      !is$1(objA[keysA[i]], objB[keysA[i]])
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Forked from fbjs/warning:
 * https://github.com/facebook/fbjs/blob/e66ba20ad5be433eb54423f2b097d829324d9de6/packages/fbjs/src/__forks__/warning.js
 *
 * Only change is we use console.warn instead of console.error,
 * and do nothing when 'console' is not supported.
 * This really simplifies the code.
 * ---
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */
var lowPriorityWarningWithoutStack = function() {};

{
  var printWarning = function(format) {
    for (
      var _len = arguments.length,
        args = new Array(_len > 1 ? _len - 1 : 0),
        _key = 1;
      _key < _len;
      _key++
    ) {
      args[_key - 1] = arguments[_key];
    }

    var argIndex = 0;
    var message =
      "Warning: " +
      format.replace(/%s/g, function() {
        return args[argIndex++];
      });

    if (typeof console !== "undefined") {
      console.warn(message);
    }

    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };

  lowPriorityWarningWithoutStack = function(condition, format) {
    if (format === undefined) {
      throw new Error(
        "`lowPriorityWarningWithoutStack(condition, format, ...args)` requires a warning " +
          "message argument"
      );
    }

    if (!condition) {
      for (
        var _len2 = arguments.length,
          args = new Array(_len2 > 2 ? _len2 - 2 : 0),
          _key2 = 2;
        _key2 < _len2;
        _key2++
      ) {
        args[_key2 - 2] = arguments[_key2];
      }

      printWarning.apply(void 0, [format].concat(args));
    }
  };
}

var lowPriorityWarningWithoutStack$1 = lowPriorityWarningWithoutStack;

var ReactStrictModeWarnings = {
  recordUnsafeLifecycleWarnings: function(fiber, instance) {},
  flushPendingUnsafeLifecycleWarnings: function() {},
  recordLegacyContextWarning: function(fiber, instance) {},
  flushLegacyContextWarning: function() {},
  discardPendingWarnings: function() {}
};

{
  var findStrictRoot = function(fiber) {
    var maybeStrictRoot = null;
    var node = fiber;

    while (node !== null) {
      if (node.mode & StrictMode) {
        maybeStrictRoot = node;
      }

      node = node.return;
    }

    return maybeStrictRoot;
  };

  var setToSortedString = function(set) {
    var array = [];
    set.forEach(function(value) {
      array.push(value);
    });
    return array.sort().join(", ");
  };

  var pendingComponentWillMountWarnings = [];
  var pendingUNSAFE_ComponentWillMountWarnings = [];
  var pendingComponentWillReceivePropsWarnings = [];
  var pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
  var pendingComponentWillUpdateWarnings = [];
  var pendingUNSAFE_ComponentWillUpdateWarnings = []; // Tracks components we have already warned about.

  var didWarnAboutUnsafeLifecycles = new Set();

  ReactStrictModeWarnings.recordUnsafeLifecycleWarnings = function(
    fiber,
    instance
  ) {
    // Dedup strategy: Warn once per component.
    if (didWarnAboutUnsafeLifecycles.has(fiber.type)) {
      return;
    }

    if (
      typeof instance.componentWillMount === "function" && // Don't warn about react-lifecycles-compat polyfilled components.
      instance.componentWillMount.__suppressDeprecationWarning !== true
    ) {
      pendingComponentWillMountWarnings.push(fiber);
    }

    if (
      fiber.mode & StrictMode &&
      typeof instance.UNSAFE_componentWillMount === "function"
    ) {
      pendingUNSAFE_ComponentWillMountWarnings.push(fiber);
    }

    if (
      typeof instance.componentWillReceiveProps === "function" &&
      instance.componentWillReceiveProps.__suppressDeprecationWarning !== true
    ) {
      pendingComponentWillReceivePropsWarnings.push(fiber);
    }

    if (
      fiber.mode & StrictMode &&
      typeof instance.UNSAFE_componentWillReceiveProps === "function"
    ) {
      pendingUNSAFE_ComponentWillReceivePropsWarnings.push(fiber);
    }

    if (
      typeof instance.componentWillUpdate === "function" &&
      instance.componentWillUpdate.__suppressDeprecationWarning !== true
    ) {
      pendingComponentWillUpdateWarnings.push(fiber);
    }

    if (
      fiber.mode & StrictMode &&
      typeof instance.UNSAFE_componentWillUpdate === "function"
    ) {
      pendingUNSAFE_ComponentWillUpdateWarnings.push(fiber);
    }
  };

  ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings = function() {
    // We do an initial pass to gather component names
    var componentWillMountUniqueNames = new Set();

    if (pendingComponentWillMountWarnings.length > 0) {
      pendingComponentWillMountWarnings.forEach(function(fiber) {
        componentWillMountUniqueNames.add(
          getComponentName(fiber.type) || "Component"
        );
        didWarnAboutUnsafeLifecycles.add(fiber.type);
      });
      pendingComponentWillMountWarnings = [];
    }

    var UNSAFE_componentWillMountUniqueNames = new Set();

    if (pendingUNSAFE_ComponentWillMountWarnings.length > 0) {
      pendingUNSAFE_ComponentWillMountWarnings.forEach(function(fiber) {
        UNSAFE_componentWillMountUniqueNames.add(
          getComponentName(fiber.type) || "Component"
        );
        didWarnAboutUnsafeLifecycles.add(fiber.type);
      });
      pendingUNSAFE_ComponentWillMountWarnings = [];
    }

    var componentWillReceivePropsUniqueNames = new Set();

    if (pendingComponentWillReceivePropsWarnings.length > 0) {
      pendingComponentWillReceivePropsWarnings.forEach(function(fiber) {
        componentWillReceivePropsUniqueNames.add(
          getComponentName(fiber.type) || "Component"
        );
        didWarnAboutUnsafeLifecycles.add(fiber.type);
      });
      pendingComponentWillReceivePropsWarnings = [];
    }

    var UNSAFE_componentWillReceivePropsUniqueNames = new Set();

    if (pendingUNSAFE_ComponentWillReceivePropsWarnings.length > 0) {
      pendingUNSAFE_ComponentWillReceivePropsWarnings.forEach(function(fiber) {
        UNSAFE_componentWillReceivePropsUniqueNames.add(
          getComponentName(fiber.type) || "Component"
        );
        didWarnAboutUnsafeLifecycles.add(fiber.type);
      });
      pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
    }

    var componentWillUpdateUniqueNames = new Set();

    if (pendingComponentWillUpdateWarnings.length > 0) {
      pendingComponentWillUpdateWarnings.forEach(function(fiber) {
        componentWillUpdateUniqueNames.add(
          getComponentName(fiber.type) || "Component"
        );
        didWarnAboutUnsafeLifecycles.add(fiber.type);
      });
      pendingComponentWillUpdateWarnings = [];
    }

    var UNSAFE_componentWillUpdateUniqueNames = new Set();

    if (pendingUNSAFE_ComponentWillUpdateWarnings.length > 0) {
      pendingUNSAFE_ComponentWillUpdateWarnings.forEach(function(fiber) {
        UNSAFE_componentWillUpdateUniqueNames.add(
          getComponentName(fiber.type) || "Component"
        );
        didWarnAboutUnsafeLifecycles.add(fiber.type);
      });
      pendingUNSAFE_ComponentWillUpdateWarnings = [];
    } // Finally, we flush all the warnings
    // UNSAFE_ ones before the deprecated ones, since they'll be 'louder'

    if (UNSAFE_componentWillMountUniqueNames.size > 0) {
      var sortedNames = setToSortedString(UNSAFE_componentWillMountUniqueNames);
      warningWithoutStack$1(
        false,
        "Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. " +
          "See https://fb.me/react-unsafe-component-lifecycles for details.\n\n" +
          "* Move code with side effects to componentDidMount, and set initial state in the constructor.\n" +
          "\nPlease update the following components: %s",
        sortedNames
      );
    }

    if (UNSAFE_componentWillReceivePropsUniqueNames.size > 0) {
      var _sortedNames = setToSortedString(
        UNSAFE_componentWillReceivePropsUniqueNames
      );

      warningWithoutStack$1(
        false,
        "Using UNSAFE_componentWillReceiveProps in strict mode is not recommended " +
          "and may indicate bugs in your code. " +
          "See https://fb.me/react-unsafe-component-lifecycles for details.\n\n" +
          "* Move data fetching code or side effects to componentDidUpdate.\n" +
          "* If you're updating state whenever props change, " +
          "refactor your code to use memoization techniques or move it to " +
          "static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state\n" +
          "\nPlease update the following components: %s",
        _sortedNames
      );
    }

    if (UNSAFE_componentWillUpdateUniqueNames.size > 0) {
      var _sortedNames2 = setToSortedString(
        UNSAFE_componentWillUpdateUniqueNames
      );

      warningWithoutStack$1(
        false,
        "Using UNSAFE_componentWillUpdate in strict mode is not recommended " +
          "and may indicate bugs in your code. " +
          "See https://fb.me/react-unsafe-component-lifecycles for details.\n\n" +
          "* Move data fetching code or side effects to componentDidUpdate.\n" +
          "\nPlease update the following components: %s",
        _sortedNames2
      );
    }

    if (componentWillMountUniqueNames.size > 0) {
      var _sortedNames3 = setToSortedString(componentWillMountUniqueNames);

      lowPriorityWarningWithoutStack$1(
        false,
        "componentWillMount has been renamed, and is not recommended for use. " +
          "See https://fb.me/react-unsafe-component-lifecycles for details.\n\n" +
          "* Move code with side effects to componentDidMount, and set initial state in the constructor.\n" +
          "* Rename componentWillMount to UNSAFE_componentWillMount to suppress " +
          "this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. " +
          "To rename all deprecated lifecycles to their new names, you can run " +
          "`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n" +
          "\nPlease update the following components: %s",
        _sortedNames3
      );
    }

    if (componentWillReceivePropsUniqueNames.size > 0) {
      var _sortedNames4 = setToSortedString(
        componentWillReceivePropsUniqueNames
      );

      lowPriorityWarningWithoutStack$1(
        false,
        "componentWillReceiveProps has been renamed, and is not recommended for use. " +
          "See https://fb.me/react-unsafe-component-lifecycles for details.\n\n" +
          "* Move data fetching code or side effects to componentDidUpdate.\n" +
          "* If you're updating state whenever props change, refactor your " +
          "code to use memoization techniques or move it to " +
          "static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state\n" +
          "* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress " +
          "this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. " +
          "To rename all deprecated lifecycles to their new names, you can run " +
          "`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n" +
          "\nPlease update the following components: %s",
        _sortedNames4
      );
    }

    if (componentWillUpdateUniqueNames.size > 0) {
      var _sortedNames5 = setToSortedString(componentWillUpdateUniqueNames);

      lowPriorityWarningWithoutStack$1(
        false,
        "componentWillUpdate has been renamed, and is not recommended for use. " +
          "See https://fb.me/react-unsafe-component-lifecycles for details.\n\n" +
          "* Move data fetching code or side effects to componentDidUpdate.\n" +
          "* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress " +
          "this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. " +
          "To rename all deprecated lifecycles to their new names, you can run " +
          "`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n" +
          "\nPlease update the following components: %s",
        _sortedNames5
      );
    }
  };

  var pendingLegacyContextWarning = new Map(); // Tracks components we have already warned about.

  var didWarnAboutLegacyContext = new Set();

  ReactStrictModeWarnings.recordLegacyContextWarning = function(
    fiber,
    instance
  ) {
    var strictRoot = findStrictRoot(fiber);

    if (strictRoot === null) {
      warningWithoutStack$1(
        false,
        "Expected to find a StrictMode component in a strict mode tree. " +
          "This error is likely caused by a bug in React. Please file an issue."
      );
      return;
    } // Dedup strategy: Warn once per component.

    if (didWarnAboutLegacyContext.has(fiber.type)) {
      return;
    }

    var warningsForRoot = pendingLegacyContextWarning.get(strictRoot);

    if (
      fiber.type.contextTypes != null ||
      fiber.type.childContextTypes != null ||
      (instance !== null && typeof instance.getChildContext === "function")
    ) {
      if (warningsForRoot === undefined) {
        warningsForRoot = [];
        pendingLegacyContextWarning.set(strictRoot, warningsForRoot);
      }

      warningsForRoot.push(fiber);
    }
  };

  ReactStrictModeWarnings.flushLegacyContextWarning = function() {
    pendingLegacyContextWarning.forEach(function(fiberArray, strictRoot) {
      var uniqueNames = new Set();
      fiberArray.forEach(function(fiber) {
        uniqueNames.add(getComponentName(fiber.type) || "Component");
        didWarnAboutLegacyContext.add(fiber.type);
      });
      var sortedNames = setToSortedString(uniqueNames);
      var strictRootComponentStack = getStackByFiberInDevAndProd(strictRoot);
      warningWithoutStack$1(
        false,
        "Legacy context API has been detected within a strict-mode tree." +
          "\n\nThe old API will be supported in all 16.x releases, but applications " +
          "using it should migrate to the new version." +
          "\n\nPlease update the following components: %s" +
          "\n\nLearn more about this warning here: https://fb.me/react-legacy-context" +
          "%s",
        sortedNames,
        strictRootComponentStack
      );
    });
  };

  ReactStrictModeWarnings.discardPendingWarnings = function() {
    pendingComponentWillMountWarnings = [];
    pendingUNSAFE_ComponentWillMountWarnings = [];
    pendingComponentWillReceivePropsWarnings = [];
    pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
    pendingComponentWillUpdateWarnings = [];
    pendingUNSAFE_ComponentWillUpdateWarnings = [];
    pendingLegacyContextWarning = new Map();
  };
}

var resolveFamily = null; // $FlowFixMe Flow gets confused by a WeakSet feature check below.

var failedBoundaries = null;
var setRefreshHandler = function(handler) {
  {
    resolveFamily = handler;
  }
};
function resolveFunctionForHotReloading(type) {
  {
    if (resolveFamily === null) {
      // Hot reloading is disabled.
      return type;
    }

    var family = resolveFamily(type);

    if (family === undefined) {
      return type;
    } // Use the latest known implementation.

    return family.current;
  }
}
function resolveClassForHotReloading(type) {
  // No implementation differences.
  return resolveFunctionForHotReloading(type);
}
function resolveForwardRefForHotReloading(type) {
  {
    if (resolveFamily === null) {
      // Hot reloading is disabled.
      return type;
    }

    var family = resolveFamily(type);

    if (family === undefined) {
      // Check if we're dealing with a real forwardRef. Don't want to crash early.
      if (
        type !== null &&
        type !== undefined &&
        typeof type.render === "function"
      ) {
        // ForwardRef is special because its resolved .type is an object,
        // but it's possible that we only have its inner render function in the map.
        // If that inner render function is different, we'll build a new forwardRef type.
        var currentRender = resolveFunctionForHotReloading(type.render);

        if (type.render !== currentRender) {
          var syntheticType = {
            $$typeof: REACT_FORWARD_REF_TYPE,
            render: currentRender
          };

          if (type.displayName !== undefined) {
            syntheticType.displayName = type.displayName;
          }

          return syntheticType;
        }
      }

      return type;
    } // Use the latest known implementation.

    return family.current;
  }
}
function isCompatibleFamilyForHotReloading(fiber, element) {
  {
    if (resolveFamily === null) {
      // Hot reloading is disabled.
      return false;
    }

    var prevType = fiber.elementType;
    var nextType = element.type; // If we got here, we know types aren't === equal.

    var needsCompareFamilies = false;
    var $$typeofNextType =
      typeof nextType === "object" && nextType !== null
        ? nextType.$$typeof
        : null;

    switch (fiber.tag) {
      case ClassComponent: {
        if (typeof nextType === "function") {
          needsCompareFamilies = true;
        }

        break;
      }

      case FunctionComponent: {
        if (typeof nextType === "function") {
          needsCompareFamilies = true;
        } else if ($$typeofNextType === REACT_LAZY_TYPE) {
          // We don't know the inner type yet.
          // We're going to assume that the lazy inner type is stable,
          // and so it is sufficient to avoid reconciling it away.
          // We're not going to unwrap or actually use the new lazy type.
          needsCompareFamilies = true;
        }

        break;
      }

      case ForwardRef: {
        if ($$typeofNextType === REACT_FORWARD_REF_TYPE) {
          needsCompareFamilies = true;
        } else if ($$typeofNextType === REACT_LAZY_TYPE) {
          needsCompareFamilies = true;
        }

        break;
      }

      case MemoComponent:
      case SimpleMemoComponent: {
        if ($$typeofNextType === REACT_MEMO_TYPE) {
          // TODO: if it was but can no longer be simple,
          // we shouldn't set this.
          needsCompareFamilies = true;
        } else if ($$typeofNextType === REACT_LAZY_TYPE) {
          needsCompareFamilies = true;
        }

        break;
      }

      default:
        return false;
    } // Check if both types have a family and it's the same one.

    if (needsCompareFamilies) {
      // Note: memo() and forwardRef() we'll compare outer rather than inner type.
      // This means both of them need to be registered to preserve state.
      // If we unwrapped and compared the inner types for wrappers instead,
      // then we would risk falsely saying two separate memo(Foo)
      // calls are equivalent because they wrap the same Foo function.
      var prevFamily = resolveFamily(prevType);

      if (prevFamily !== undefined && prevFamily === resolveFamily(nextType)) {
        return true;
      }
    }

    return false;
  }
}
function markFailedErrorBoundaryForHotReloading(fiber) {
  {
    if (resolveFamily === null) {
      // Hot reloading is disabled.
      return;
    }

    if (typeof WeakSet !== "function") {
      return;
    }

    if (failedBoundaries === null) {
      failedBoundaries = new WeakSet();
    }

    failedBoundaries.add(fiber);
  }
}
var scheduleRefresh = function(root, update) {
  {
    if (resolveFamily === null) {
      // Hot reloading is disabled.
      return;
    }

    var staleFamilies = update.staleFamilies,
      updatedFamilies = update.updatedFamilies;
    flushPassiveEffects();
    flushSync(function() {
      scheduleFibersWithFamiliesRecursively(
        root.current,
        updatedFamilies,
        staleFamilies
      );
    });
  }
};
var scheduleRoot = function(root, element) {
  {
    if (root.context !== emptyContextObject) {
      // Super edge case: root has a legacy _renderSubtree context
      // but we don't know the parentComponent so we can't pass it.
      // Just ignore. We'll delete this with _renderSubtree code path later.
      return;
    }

    flushPassiveEffects();
    syncUpdates(function() {
      updateContainer(element, root, null, null);
    });
  }
};

function scheduleFibersWithFamiliesRecursively(
  fiber,
  updatedFamilies,
  staleFamilies
) {
  {
    var alternate = fiber.alternate,
      child = fiber.child,
      sibling = fiber.sibling,
      tag = fiber.tag,
      type = fiber.type;
    var candidateType = null;

    switch (tag) {
      case FunctionComponent:
      case SimpleMemoComponent:
      case ClassComponent:
        candidateType = type;
        break;

      case ForwardRef:
        candidateType = type.render;
        break;

      default:
        break;
    }

    if (resolveFamily === null) {
      throw new Error("Expected resolveFamily to be set during hot reload.");
    }

    var needsRender = false;
    var needsRemount = false;

    if (candidateType !== null) {
      var family = resolveFamily(candidateType);

      if (family !== undefined) {
        if (staleFamilies.has(family)) {
          needsRemount = true;
        } else if (updatedFamilies.has(family)) {
          if (tag === ClassComponent) {
            needsRemount = true;
          } else {
            needsRender = true;
          }
        }
      }
    }

    if (failedBoundaries !== null) {
      if (
        failedBoundaries.has(fiber) ||
        (alternate !== null && failedBoundaries.has(alternate))
      ) {
        needsRemount = true;
      }
    }

    if (needsRemount) {
      fiber._debugNeedsRemount = true;
    }

    if (needsRemount || needsRender) {
      scheduleWork(fiber, Sync);
    }

    if (child !== null && !needsRemount) {
      scheduleFibersWithFamiliesRecursively(
        child,
        updatedFamilies,
        staleFamilies
      );
    }

    if (sibling !== null) {
      scheduleFibersWithFamiliesRecursively(
        sibling,
        updatedFamilies,
        staleFamilies
      );
    }
  }
}

var findHostInstancesForRefresh = function(root, families) {
  {
    var hostInstances = new Set();
    var types = new Set(
      families.map(function(family) {
        return family.current;
      })
    );
    findHostInstancesForMatchingFibersRecursively(
      root.current,
      types,
      hostInstances
    );
    return hostInstances;
  }
};

function findHostInstancesForMatchingFibersRecursively(
  fiber,
  types,
  hostInstances
) {
  {
    var child = fiber.child,
      sibling = fiber.sibling,
      tag = fiber.tag,
      type = fiber.type;
    var candidateType = null;

    switch (tag) {
      case FunctionComponent:
      case SimpleMemoComponent:
      case ClassComponent:
        candidateType = type;
        break;

      case ForwardRef:
        candidateType = type.render;
        break;

      default:
        break;
    }

    var didMatch = false;

    if (candidateType !== null) {
      if (types.has(candidateType)) {
        didMatch = true;
      }
    }

    if (didMatch) {
      // We have a match. This only drills down to the closest host components.
      // There's no need to search deeper because for the purpose of giving
      // visual feedback, "flashing" outermost parent rectangles is sufficient.
      findHostInstancesForFiberShallowly(fiber, hostInstances);
    } else {
      // If there's no match, maybe there will be one further down in the child tree.
      if (child !== null) {
        findHostInstancesForMatchingFibersRecursively(
          child,
          types,
          hostInstances
        );
      }
    }

    if (sibling !== null) {
      findHostInstancesForMatchingFibersRecursively(
        sibling,
        types,
        hostInstances
      );
    }
  }
}

function findHostInstancesForFiberShallowly(fiber, hostInstances) {
  {
    var foundHostInstances = findChildHostInstancesForFiberShallowly(
      fiber,
      hostInstances
    );

    if (foundHostInstances) {
      return;
    } // If we didn't find any host children, fallback to closest host parent.

    var node = fiber;

    while (true) {
      switch (node.tag) {
        case HostComponent:
          hostInstances.add(node.stateNode);
          return;

        case HostPortal:
          hostInstances.add(node.stateNode.containerInfo);
          return;

        case HostRoot:
          hostInstances.add(node.stateNode.containerInfo);
          return;
      }

      if (node.return === null) {
        throw new Error("Expected to reach root first.");
      }

      node = node.return;
    }
  }
}

function findChildHostInstancesForFiberShallowly(fiber, hostInstances) {
  {
    var node = fiber;
    var foundHostInstances = false;

    while (true) {
      if (node.tag === HostComponent) {
        // We got a match.
        foundHostInstances = true;
        hostInstances.add(node.stateNode); // There may still be more, so keep searching.
      } else if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }

      if (node === fiber) {
        return foundHostInstances;
      }

      while (node.sibling === null) {
        if (node.return === null || node.return === fiber) {
          return foundHostInstances;
        }

        node = node.return;
      }

      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  return false;
}

function resolveDefaultProps(Component, baseProps) {
  if (Component && Component.defaultProps) {
    // Resolve default props. Taken from ReactElement
    var props = Object.assign({}, baseProps);
    var defaultProps = Component.defaultProps;

    for (var propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }

    return props;
  }

  return baseProps;
}
function readLazyComponentType(lazyComponent) {
  initializeLazyComponentType(lazyComponent);

  if (lazyComponent._status !== Resolved) {
    throw lazyComponent._result;
  }

  return lazyComponent._result;
}

var valueCursor = createCursor(null);
var rendererSigil;

{
  // Use this to detect multiple renderers using the same context
  rendererSigil = {};
}

var currentlyRenderingFiber = null;
var lastContextDependency = null;
var lastContextWithAllBitsObserved = null;
var isDisallowedContextReadInDEV = false;
function resetContextDependencies() {
  // This is called right before React yields execution, to ensure `readContext`
  // cannot be called outside the render phase.
  currentlyRenderingFiber = null;
  lastContextDependency = null;
  lastContextWithAllBitsObserved = null;

  {
    isDisallowedContextReadInDEV = false;
  }
}
function enterDisallowedContextReadInDEV() {
  {
    isDisallowedContextReadInDEV = true;
  }
}
function exitDisallowedContextReadInDEV() {
  {
    isDisallowedContextReadInDEV = false;
  }
}
function pushProvider(providerFiber, nextValue) {
  var context = providerFiber.type._context;

  if (isPrimaryRenderer) {
    push(valueCursor, context._currentValue, providerFiber);
    context._currentValue = nextValue;

    {
      !(
        context._currentRenderer === undefined ||
        context._currentRenderer === null ||
        context._currentRenderer === rendererSigil
      )
        ? warningWithoutStack$1(
            false,
            "Detected multiple renderers concurrently rendering the " +
              "same context provider. This is currently unsupported."
          )
        : void 0;
      context._currentRenderer = rendererSigil;
    }
  } else {
    push(valueCursor, context._currentValue2, providerFiber);
    context._currentValue2 = nextValue;

    {
      !(
        context._currentRenderer2 === undefined ||
        context._currentRenderer2 === null ||
        context._currentRenderer2 === rendererSigil
      )
        ? warningWithoutStack$1(
            false,
            "Detected multiple renderers concurrently rendering the " +
              "same context provider. This is currently unsupported."
          )
        : void 0;
      context._currentRenderer2 = rendererSigil;
    }
  }
}
function popProvider(providerFiber) {
  var currentValue = valueCursor.current;
  pop(valueCursor, providerFiber);
  var context = providerFiber.type._context;

  if (isPrimaryRenderer) {
    context._currentValue = currentValue;
  } else {
    context._currentValue2 = currentValue;
  }
}
function calculateChangedBits(context, newValue, oldValue) {
  if (is$1(oldValue, newValue)) {
    // No change
    return 0;
  } else {
    var changedBits =
      typeof context._calculateChangedBits === "function"
        ? context._calculateChangedBits(oldValue, newValue)
        : MAX_SIGNED_31_BIT_INT;

    {
      !((changedBits & MAX_SIGNED_31_BIT_INT) === changedBits)
        ? warning$1(
            false,
            "calculateChangedBits: Expected the return value to be a " +
              "31-bit integer. Instead received: %s",
            changedBits
          )
        : void 0;
    }

    return changedBits | 0;
  }
}
function scheduleWorkOnParentPath(parent, renderExpirationTime) {
  // Update the child expiration time of all the ancestors, including
  // the alternates.
  var node = parent;

  while (node !== null) {
    var alternate = node.alternate;

    if (node.childExpirationTime < renderExpirationTime) {
      node.childExpirationTime = renderExpirationTime;

      if (
        alternate !== null &&
        alternate.childExpirationTime < renderExpirationTime
      ) {
        alternate.childExpirationTime = renderExpirationTime;
      }
    } else if (
      alternate !== null &&
      alternate.childExpirationTime < renderExpirationTime
    ) {
      alternate.childExpirationTime = renderExpirationTime;
    } else {
      // Neither alternate was updated, which means the rest of the
      // ancestor path already has sufficient priority.
      break;
    }

    node = node.return;
  }
}
function propagateContextChange(
  workInProgress,
  context,
  changedBits,
  renderExpirationTime
) {
  var fiber = workInProgress.child;

  if (fiber !== null) {
    // Set the return pointer of the child to the work-in-progress fiber.
    fiber.return = workInProgress;
  }

  while (fiber !== null) {
    var nextFiber = void 0; // Visit this fiber.

    var list = fiber.dependencies;

    if (list !== null) {
      nextFiber = fiber.child;
      var dependency = list.firstContext;

      while (dependency !== null) {
        // Check if the context matches.
        if (
          dependency.context === context &&
          (dependency.observedBits & changedBits) !== 0
        ) {
          // Match! Schedule an update on this fiber.
          if (fiber.tag === ClassComponent) {
            // Schedule a force update on the work-in-progress.
            var update = createUpdate(renderExpirationTime, null);
            update.tag = ForceUpdate; // TODO: Because we don't have a work-in-progress, this will add the
            // update to the current fiber, too, which means it will persist even if
            // this render is thrown away. Since it's a race condition, not sure it's
            // worth fixing.

            enqueueUpdate(fiber, update);
          }

          if (fiber.expirationTime < renderExpirationTime) {
            fiber.expirationTime = renderExpirationTime;
          }

          var alternate = fiber.alternate;

          if (
            alternate !== null &&
            alternate.expirationTime < renderExpirationTime
          ) {
            alternate.expirationTime = renderExpirationTime;
          }

          scheduleWorkOnParentPath(fiber.return, renderExpirationTime); // Mark the expiration time on the list, too.

          if (list.expirationTime < renderExpirationTime) {
            list.expirationTime = renderExpirationTime;
          } // Since we already found a match, we can stop traversing the
          // dependency list.

          break;
        }

        dependency = dependency.next;
      }
    } else if (fiber.tag === ContextProvider) {
      // Don't scan deeper if this is a matching provider
      nextFiber = fiber.type === workInProgress.type ? null : fiber.child;
    } else if (
      enableSuspenseServerRenderer &&
      fiber.tag === DehydratedFragment
    ) {
      // If a dehydrated suspense bounudary is in this subtree, we don't know
      // if it will have any context consumers in it. The best we can do is
      // mark it as having updates.
      var parentSuspense = fiber.return;

      if (!(parentSuspense !== null)) {
        throw Error(
          "We just came from a parent so we must have had a parent. This is a bug in React."
        );
      }

      if (parentSuspense.expirationTime < renderExpirationTime) {
        parentSuspense.expirationTime = renderExpirationTime;
      }

      var _alternate = parentSuspense.alternate;

      if (
        _alternate !== null &&
        _alternate.expirationTime < renderExpirationTime
      ) {
        _alternate.expirationTime = renderExpirationTime;
      } // This is intentionally passing this fiber as the parent
      // because we want to schedule this fiber as having work
      // on its children. We'll use the childExpirationTime on
      // this fiber to indicate that a context has changed.

      scheduleWorkOnParentPath(parentSuspense, renderExpirationTime);
      nextFiber = fiber.sibling;
    } else {
      // Traverse down.
      nextFiber = fiber.child;
    }

    if (nextFiber !== null) {
      // Set the return pointer of the child to the work-in-progress fiber.
      nextFiber.return = fiber;
    } else {
      // No child. Traverse to next sibling.
      nextFiber = fiber;

      while (nextFiber !== null) {
        if (nextFiber === workInProgress) {
          // We're back to the root of this subtree. Exit.
          nextFiber = null;
          break;
        }

        var sibling = nextFiber.sibling;

        if (sibling !== null) {
          // Set the return pointer of the sibling to the work-in-progress fiber.
          sibling.return = nextFiber.return;
          nextFiber = sibling;
          break;
        } // No more siblings. Traverse up.

        nextFiber = nextFiber.return;
      }
    }

    fiber = nextFiber;
  }
}
function prepareToReadContext(workInProgress, renderExpirationTime) {
  currentlyRenderingFiber = workInProgress;
  lastContextDependency = null;
  lastContextWithAllBitsObserved = null;
  var dependencies = workInProgress.dependencies;

  if (dependencies !== null) {
    var firstContext = dependencies.firstContext;

    if (firstContext !== null) {
      if (dependencies.expirationTime >= renderExpirationTime) {
        // Context list has a pending update. Mark that this fiber performed work.
        markWorkInProgressReceivedUpdate();
      } // Reset the work-in-progress list

      dependencies.firstContext = null;
    }
  }
}
function readContext(context, observedBits) {
  {
    // This warning would fire if you read context inside a Hook like useMemo.
    // Unlike the class check below, it's not enforced in production for perf.
    !!isDisallowedContextReadInDEV
      ? warning$1(
          false,
          "Context can only be read while React is rendering. " +
            "In classes, you can read it in the render method or getDerivedStateFromProps. " +
            "In function components, you can read it directly in the function body, but not " +
            "inside Hooks like useReducer() or useMemo()."
        )
      : void 0;
  }

  if (lastContextWithAllBitsObserved === context) {
    // Nothing to do. We already observe everything in this context.
  } else if (observedBits === false || observedBits === 0) {
    // Do not observe any updates.
  } else {
    var resolvedObservedBits; // Avoid deopting on observable arguments or heterogeneous types.

    if (
      typeof observedBits !== "number" ||
      observedBits === MAX_SIGNED_31_BIT_INT
    ) {
      // Observe all updates.
      lastContextWithAllBitsObserved = context;
      resolvedObservedBits = MAX_SIGNED_31_BIT_INT;
    } else {
      resolvedObservedBits = observedBits;
    }

    var contextItem = {
      context: context,
      observedBits: resolvedObservedBits,
      next: null
    };

    if (lastContextDependency === null) {
      if (!(currentlyRenderingFiber !== null)) {
        throw Error(
          "Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."
        );
      } // This is the first dependency for this component. Create a new list.

      lastContextDependency = contextItem;
      currentlyRenderingFiber.dependencies = {
        expirationTime: NoWork,
        firstContext: contextItem,
        responders: null
      };
    } else {
      // Append a new context item.
      lastContextDependency = lastContextDependency.next = contextItem;
    }
  }

  return isPrimaryRenderer ? context._currentValue : context._currentValue2;
}

// UpdateQueue is a linked list of prioritized updates.
//
// Like fibers, update queues come in pairs: a current queue, which represents
// the visible state of the screen, and a work-in-progress queue, which can be
// mutated and processed asynchronously before it is committed — a form of
// double buffering. If a work-in-progress render is discarded before finishing,
// we create a new work-in-progress by cloning the current queue.
//
// Both queues share a persistent, singly-linked list structure. To schedule an
// update, we append it to the end of both queues. Each queue maintains a
// pointer to first update in the persistent list that hasn't been processed.
// The work-in-progress pointer always has a position equal to or greater than
// the current queue, since we always work on that one. The current queue's
// pointer is only updated during the commit phase, when we swap in the
// work-in-progress.
//
// For example:
//
//   Current pointer:           A - B - C - D - E - F
//   Work-in-progress pointer:              D - E - F
//                                          ^
//                                          The work-in-progress queue has
//                                          processed more updates than current.
//
// The reason we append to both queues is because otherwise we might drop
// updates without ever processing them. For example, if we only add updates to
// the work-in-progress queue, some updates could be lost whenever a work-in
// -progress render restarts by cloning from current. Similarly, if we only add
// updates to the current queue, the updates will be lost whenever an already
// in-progress queue commits and swaps with the current queue. However, by
// adding to both queues, we guarantee that the update will be part of the next
// work-in-progress. (And because the work-in-progress queue becomes the
// current queue once it commits, there's no danger of applying the same
// update twice.)
//
// Prioritization
// --------------
//
// Updates are not sorted by priority, but by insertion; new updates are always
// appended to the end of the list.
//
// The priority is still important, though. When processing the update queue
// during the render phase, only the updates with sufficient priority are
// included in the result. If we skip an update because it has insufficient
// priority, it remains in the queue to be processed later, during a lower
// priority render. Crucially, all updates subsequent to a skipped update also
// remain in the queue *regardless of their priority*. That means high priority
// updates are sometimes processed twice, at two separate priorities. We also
// keep track of a base state, that represents the state before the first
// update in the queue is applied.
//
// For example:
//
//   Given a base state of '', and the following queue of updates
//
//     A1 - B2 - C1 - D2
//
//   where the number indicates the priority, and the update is applied to the
//   previous state by appending a letter, React will process these updates as
//   two separate renders, one per distinct priority level:
//
//   First render, at priority 1:
//     Base state: ''
//     Updates: [A1, C1]
//     Result state: 'AC'
//
//   Second render, at priority 2:
//     Base state: 'A'            <-  The base state does not include C1,
//                                    because B2 was skipped.
//     Updates: [B2, C1, D2]      <-  C1 was rebased on top of B2
//     Result state: 'ABCD'
//
// Because we process updates in insertion order, and rebase high priority
// updates when preceding updates are skipped, the final result is deterministic
// regardless of priority. Intermediate state may vary according to system
// resources, but the final state is always the same.
var UpdateState = 0;
var ReplaceState = 1;
var ForceUpdate = 2;
var CaptureUpdate = 3; // Global state that is reset at the beginning of calling `processUpdateQueue`.
// It should only be read right after calling `processUpdateQueue`, via
// `checkHasForceUpdateAfterProcessing`.

var hasForceUpdate = false;
var didWarnUpdateInsideUpdate;
var currentlyProcessingQueue;

{
  didWarnUpdateInsideUpdate = false;
  currentlyProcessingQueue = null;
}

function createUpdateQueue(baseState) {
  var queue = {
    baseState: baseState,
    firstUpdate: null,
    lastUpdate: null,
    firstCapturedUpdate: null,
    lastCapturedUpdate: null,
    firstEffect: null,
    lastEffect: null,
    firstCapturedEffect: null,
    lastCapturedEffect: null
  };
  return queue;
}

function cloneUpdateQueue(currentQueue) {
  var queue = {
    baseState: currentQueue.baseState,
    firstUpdate: currentQueue.firstUpdate,
    lastUpdate: currentQueue.lastUpdate,
    // TODO: With resuming, if we bail out and resuse the child tree, we should
    // keep these effects.
    firstCapturedUpdate: null,
    lastCapturedUpdate: null,
    firstEffect: null,
    lastEffect: null,
    firstCapturedEffect: null,
    lastCapturedEffect: null
  };
  return queue;
}

function createUpdate(expirationTime, suspenseConfig) {
  var update = {
    expirationTime: expirationTime,
    suspenseConfig: suspenseConfig,
    tag: UpdateState,
    payload: null,
    callback: null,
    next: null,
    nextEffect: null
  };

  {
    update.priority = getCurrentPriorityLevel();
  }

  return update;
}

function appendUpdateToQueue(queue, update) {
  // Append the update to the end of the list.
  if (queue.lastUpdate === null) {
    // Queue is empty
    queue.firstUpdate = queue.lastUpdate = update;
  } else {
    queue.lastUpdate.next = update;
    queue.lastUpdate = update;
  }
}

function enqueueUpdate(fiber, update) {
  // Update queues are created lazily.
  var alternate = fiber.alternate;
  var queue1;
  var queue2;

  if (alternate === null) {
    // There's only one fiber.
    queue1 = fiber.updateQueue;
    queue2 = null;

    if (queue1 === null) {
      queue1 = fiber.updateQueue = createUpdateQueue(fiber.memoizedState);
    }
  } else {
    // There are two owners.
    queue1 = fiber.updateQueue;
    queue2 = alternate.updateQueue;

    if (queue1 === null) {
      if (queue2 === null) {
        // Neither fiber has an update queue. Create new ones.
        queue1 = fiber.updateQueue = createUpdateQueue(fiber.memoizedState);
        queue2 = alternate.updateQueue = createUpdateQueue(
          alternate.memoizedState
        );
      } else {
        // Only one fiber has an update queue. Clone to create a new one.
        queue1 = fiber.updateQueue = cloneUpdateQueue(queue2);
      }
    } else {
      if (queue2 === null) {
        // Only one fiber has an update queue. Clone to create a new one.
        queue2 = alternate.updateQueue = cloneUpdateQueue(queue1);
      } else {
        // Both owners have an update queue.
      }
    }
  }

  if (queue2 === null || queue1 === queue2) {
    // There's only a single queue.
    appendUpdateToQueue(queue1, update);
  } else {
    // There are two queues. We need to append the update to both queues,
    // while accounting for the persistent structure of the list — we don't
    // want the same update to be added multiple times.
    if (queue1.lastUpdate === null || queue2.lastUpdate === null) {
      // One of the queues is not empty. We must add the update to both queues.
      appendUpdateToQueue(queue1, update);
      appendUpdateToQueue(queue2, update);
    } else {
      // Both queues are non-empty. The last update is the same in both lists,
      // because of structural sharing. So, only append to one of the lists.
      appendUpdateToQueue(queue1, update); // But we still need to update the `lastUpdate` pointer of queue2.

      queue2.lastUpdate = update;
    }
  }

  {
    if (
      fiber.tag === ClassComponent &&
      (currentlyProcessingQueue === queue1 ||
        (queue2 !== null && currentlyProcessingQueue === queue2)) &&
      !didWarnUpdateInsideUpdate
    ) {
      warningWithoutStack$1(
        false,
        "An update (setState, replaceState, or forceUpdate) was scheduled " +
          "from inside an update function. Update functions should be pure, " +
          "with zero side-effects. Consider using componentDidUpdate or a " +
          "callback."
      );
      didWarnUpdateInsideUpdate = true;
    }
  }
}
function enqueueCapturedUpdate(workInProgress, update) {
  // Captured updates go into a separate list, and only on the work-in-
  // progress queue.
  var workInProgressQueue = workInProgress.updateQueue;

  if (workInProgressQueue === null) {
    workInProgressQueue = workInProgress.updateQueue = createUpdateQueue(
      workInProgress.memoizedState
    );
  } else {
    // TODO: I put this here rather than createWorkInProgress so that we don't
    // clone the queue unnecessarily. There's probably a better way to
    // structure this.
    workInProgressQueue = ensureWorkInProgressQueueIsAClone(
      workInProgress,
      workInProgressQueue
    );
  } // Append the update to the end of the list.

  if (workInProgressQueue.lastCapturedUpdate === null) {
    // This is the first render phase update
    workInProgressQueue.firstCapturedUpdate = workInProgressQueue.lastCapturedUpdate = update;
  } else {
    workInProgressQueue.lastCapturedUpdate.next = update;
    workInProgressQueue.lastCapturedUpdate = update;
  }
}

function ensureWorkInProgressQueueIsAClone(workInProgress, queue) {
  var current = workInProgress.alternate;

  if (current !== null) {
    // If the work-in-progress queue is equal to the current queue,
    // we need to clone it first.
    if (queue === current.updateQueue) {
      queue = workInProgress.updateQueue = cloneUpdateQueue(queue);
    }
  }

  return queue;
}

function getStateFromUpdate(
  workInProgress,
  queue,
  update,
  prevState,
  nextProps,
  instance
) {
  switch (update.tag) {
    case ReplaceState: {
      var payload = update.payload;

      if (typeof payload === "function") {
        // Updater function
        {
          enterDisallowedContextReadInDEV();

          if (
            debugRenderPhaseSideEffectsForStrictMode &&
            workInProgress.mode & StrictMode
          ) {
            payload.call(instance, prevState, nextProps);
          }
        }

        var nextState = payload.call(instance, prevState, nextProps);

        {
          exitDisallowedContextReadInDEV();
        }

        return nextState;
      } // State object

      return payload;
    }

    case CaptureUpdate: {
      workInProgress.effectTag =
        (workInProgress.effectTag & ~ShouldCapture) | DidCapture;
    }
    // Intentional fallthrough

    case UpdateState: {
      var _payload = update.payload;
      var partialState;

      if (typeof _payload === "function") {
        // Updater function
        {
          enterDisallowedContextReadInDEV();

          if (
            debugRenderPhaseSideEffectsForStrictMode &&
            workInProgress.mode & StrictMode
          ) {
            _payload.call(instance, prevState, nextProps);
          }
        }

        partialState = _payload.call(instance, prevState, nextProps);

        {
          exitDisallowedContextReadInDEV();
        }
      } else {
        // Partial state object
        partialState = _payload;
      }

      if (partialState === null || partialState === undefined) {
        // Null and undefined are treated as no-ops.
        return prevState;
      } // Merge the partial state and the previous state.

      return Object.assign({}, prevState, partialState);
    }

    case ForceUpdate: {
      hasForceUpdate = true;
      return prevState;
    }
  }

  return prevState;
}

function processUpdateQueue(
  workInProgress,
  queue,
  props,
  instance,
  renderExpirationTime
) {
  hasForceUpdate = false;
  queue = ensureWorkInProgressQueueIsAClone(workInProgress, queue);

  {
    currentlyProcessingQueue = queue;
  } // These values may change as we process the queue.

  var newBaseState = queue.baseState;
  var newFirstUpdate = null;
  var newExpirationTime = NoWork; // Iterate through the list of updates to compute the result.

  var update = queue.firstUpdate;
  var resultState = newBaseState;

  while (update !== null) {
    var updateExpirationTime = update.expirationTime;

    if (updateExpirationTime < renderExpirationTime) {
      // This update does not have sufficient priority. Skip it.
      if (newFirstUpdate === null) {
        // This is the first skipped update. It will be the first update in
        // the new list.
        newFirstUpdate = update; // Since this is the first update that was skipped, the current result
        // is the new base state.

        newBaseState = resultState;
      } // Since this update will remain in the list, update the remaining
      // expiration time.

      if (newExpirationTime < updateExpirationTime) {
        newExpirationTime = updateExpirationTime;
      }
    } else {
      // This update does have sufficient priority.
      // Mark the event time of this update as relevant to this render pass.
      // TODO: This should ideally use the true event time of this update rather than
      // its priority which is a derived and not reverseable value.
      // TODO: We should skip this update if it was already committed but currently
      // we have no way of detecting the difference between a committed and suspended
      // update here.
      markRenderEventTimeAndConfig(updateExpirationTime, update.suspenseConfig); // Process it and compute a new result.

      resultState = getStateFromUpdate(
        workInProgress,
        queue,
        update,
        resultState,
        props,
        instance
      );
      var callback = update.callback;

      if (callback !== null) {
        workInProgress.effectTag |= Callback; // Set this to null, in case it was mutated during an aborted render.

        update.nextEffect = null;

        if (queue.lastEffect === null) {
          queue.firstEffect = queue.lastEffect = update;
        } else {
          queue.lastEffect.nextEffect = update;
          queue.lastEffect = update;
        }
      }
    } // Continue to the next update.

    update = update.next;
  } // Separately, iterate though the list of captured updates.

  var newFirstCapturedUpdate = null;
  update = queue.firstCapturedUpdate;

  while (update !== null) {
    var _updateExpirationTime = update.expirationTime;

    if (_updateExpirationTime < renderExpirationTime) {
      // This update does not have sufficient priority. Skip it.
      if (newFirstCapturedUpdate === null) {
        // This is the first skipped captured update. It will be the first
        // update in the new list.
        newFirstCapturedUpdate = update; // If this is the first update that was skipped, the current result is
        // the new base state.

        if (newFirstUpdate === null) {
          newBaseState = resultState;
        }
      } // Since this update will remain in the list, update the remaining
      // expiration time.

      if (newExpirationTime < _updateExpirationTime) {
        newExpirationTime = _updateExpirationTime;
      }
    } else {
      // This update does have sufficient priority. Process it and compute
      // a new result.
      resultState = getStateFromUpdate(
        workInProgress,
        queue,
        update,
        resultState,
        props,
        instance
      );
      var _callback = update.callback;

      if (_callback !== null) {
        workInProgress.effectTag |= Callback; // Set this to null, in case it was mutated during an aborted render.

        update.nextEffect = null;

        if (queue.lastCapturedEffect === null) {
          queue.firstCapturedEffect = queue.lastCapturedEffect = update;
        } else {
          queue.lastCapturedEffect.nextEffect = update;
          queue.lastCapturedEffect = update;
        }
      }
    }

    update = update.next;
  }

  if (newFirstUpdate === null) {
    queue.lastUpdate = null;
  }

  if (newFirstCapturedUpdate === null) {
    queue.lastCapturedUpdate = null;
  } else {
    workInProgress.effectTag |= Callback;
  }

  if (newFirstUpdate === null && newFirstCapturedUpdate === null) {
    // We processed every update, without skipping. That means the new base
    // state is the same as the result state.
    newBaseState = resultState;
  }

  queue.baseState = newBaseState;
  queue.firstUpdate = newFirstUpdate;
  queue.firstCapturedUpdate = newFirstCapturedUpdate; // Set the remaining expiration time to be whatever is remaining in the queue.
  // This should be fine because the only two other things that contribute to
  // expiration time are props and context. We're already in the middle of the
  // begin phase by the time we start processing the queue, so we've already
  // dealt with the props. Context in components that specify
  // shouldComponentUpdate is tricky; but we'll have to account for
  // that regardless.

  markUnprocessedUpdateTime(newExpirationTime);
  workInProgress.expirationTime = newExpirationTime;
  workInProgress.memoizedState = resultState;

  {
    currentlyProcessingQueue = null;
  }
}

function callCallback(callback, context) {
  if (!(typeof callback === "function")) {
    throw Error(
      "Invalid argument passed as callback. Expected a function. Instead received: " +
        callback
    );
  }

  callback.call(context);
}

function resetHasForceUpdateBeforeProcessing() {
  hasForceUpdate = false;
}
function checkHasForceUpdateAfterProcessing() {
  return hasForceUpdate;
}
function commitUpdateQueue(
  finishedWork,
  finishedQueue,
  instance,
  renderExpirationTime
) {
  // If the finished render included captured updates, and there are still
  // lower priority updates left over, we need to keep the captured updates
  // in the queue so that they are rebased and not dropped once we process the
  // queue again at the lower priority.
  if (finishedQueue.firstCapturedUpdate !== null) {
    // Join the captured update list to the end of the normal list.
    if (finishedQueue.lastUpdate !== null) {
      finishedQueue.lastUpdate.next = finishedQueue.firstCapturedUpdate;
      finishedQueue.lastUpdate = finishedQueue.lastCapturedUpdate;
    } // Clear the list of captured updates.

    finishedQueue.firstCapturedUpdate = finishedQueue.lastCapturedUpdate = null;
  } // Commit the effects

  commitUpdateEffects(finishedQueue.firstEffect, instance);
  finishedQueue.firstEffect = finishedQueue.lastEffect = null;
  commitUpdateEffects(finishedQueue.firstCapturedEffect, instance);
  finishedQueue.firstCapturedEffect = finishedQueue.lastCapturedEffect = null;
}

function commitUpdateEffects(effect, instance) {
  while (effect !== null) {
    var callback = effect.callback;

    if (callback !== null) {
      effect.callback = null;
      callCallback(callback, instance);
    }

    effect = effect.nextEffect;
  }
}

var ReactCurrentBatchConfig = ReactSharedInternals.ReactCurrentBatchConfig;
function requestCurrentSuspenseConfig() {
  return ReactCurrentBatchConfig.suspense;
}

var fakeInternalInstance = {};
var isArray$1 = Array.isArray; // React.Component uses a shared frozen object by default.
// We'll use it to determine whether we need to initialize legacy refs.

var emptyRefsObject = new React.Component().refs;
var didWarnAboutStateAssignmentForComponent;
var didWarnAboutUninitializedState;
var didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate;
var didWarnAboutLegacyLifecyclesAndDerivedState;
var didWarnAboutUndefinedDerivedState;
var warnOnUndefinedDerivedState;
var warnOnInvalidCallback;
var didWarnAboutDirectlyAssigningPropsToState;
var didWarnAboutContextTypeAndContextTypes;
var didWarnAboutInvalidateContextType;

{
  didWarnAboutStateAssignmentForComponent = new Set();
  didWarnAboutUninitializedState = new Set();
  didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate = new Set();
  didWarnAboutLegacyLifecyclesAndDerivedState = new Set();
  didWarnAboutDirectlyAssigningPropsToState = new Set();
  didWarnAboutUndefinedDerivedState = new Set();
  didWarnAboutContextTypeAndContextTypes = new Set();
  didWarnAboutInvalidateContextType = new Set();
  var didWarnOnInvalidCallback = new Set();

  warnOnInvalidCallback = function(callback, callerName) {
    if (callback === null || typeof callback === "function") {
      return;
    }

    var key = callerName + "_" + callback;

    if (!didWarnOnInvalidCallback.has(key)) {
      didWarnOnInvalidCallback.add(key);
      warningWithoutStack$1(
        false,
        "%s(...): Expected the last optional `callback` argument to be a " +
          "function. Instead received: %s.",
        callerName,
        callback
      );
    }
  };

  warnOnUndefinedDerivedState = function(type, partialState) {
    if (partialState === undefined) {
      var componentName = getComponentName(type) || "Component";

      if (!didWarnAboutUndefinedDerivedState.has(componentName)) {
        didWarnAboutUndefinedDerivedState.add(componentName);
        warningWithoutStack$1(
          false,
          "%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. " +
            "You have returned undefined.",
          componentName
        );
      }
    }
  }; // This is so gross but it's at least non-critical and can be removed if
  // it causes problems. This is meant to give a nicer error message for
  // ReactDOM15.unstable_renderSubtreeIntoContainer(reactDOM16Component,
  // ...)) which otherwise throws a "_processChildContext is not a function"
  // exception.

  Object.defineProperty(fakeInternalInstance, "_processChildContext", {
    enumerable: false,
    value: function() {
      {
        throw Error(
          "_processChildContext is not available in React 16+. This likely means you have multiple copies of React and are attempting to nest a React 15 tree inside a React 16 tree using unstable_renderSubtreeIntoContainer, which isn't supported. Try to make sure you have only one copy of React (and ideally, switch to ReactDOM.createPortal)."
        );
      }
    }
  });
  Object.freeze(fakeInternalInstance);
}

function applyDerivedStateFromProps(
  workInProgress,
  ctor,
  getDerivedStateFromProps,
  nextProps
) {
  var prevState = workInProgress.memoizedState;

  {
    if (
      debugRenderPhaseSideEffectsForStrictMode &&
      workInProgress.mode & StrictMode
    ) {
      // Invoke the function an extra time to help detect side-effects.
      getDerivedStateFromProps(nextProps, prevState);
    }
  }

  var partialState = getDerivedStateFromProps(nextProps, prevState);

  {
    warnOnUndefinedDerivedState(ctor, partialState);
  } // Merge the partial state and the previous state.

  var memoizedState =
    partialState === null || partialState === undefined
      ? prevState
      : Object.assign({}, prevState, partialState);
  workInProgress.memoizedState = memoizedState; // Once the update queue is empty, persist the derived state onto the
  // base state.

  var updateQueue = workInProgress.updateQueue;

  if (updateQueue !== null && workInProgress.expirationTime === NoWork) {
    updateQueue.baseState = memoizedState;
  }
}
var classComponentUpdater = {
  isMounted: isMounted,
  enqueueSetState: function(inst, payload, callback) {
    var fiber = get(inst);
    var currentTime = requestCurrentTimeForUpdate();
    var suspenseConfig = requestCurrentSuspenseConfig();
    var expirationTime = computeExpirationForFiber(
      currentTime,
      fiber,
      suspenseConfig
    );
    var update = createUpdate(expirationTime, suspenseConfig);
    update.payload = payload;

    if (callback !== undefined && callback !== null) {
      {
        warnOnInvalidCallback(callback, "setState");
      }

      update.callback = callback;
    }

    enqueueUpdate(fiber, update);
    scheduleWork(fiber, expirationTime);
  },
  enqueueReplaceState: function(inst, payload, callback) {
    var fiber = get(inst);
    var currentTime = requestCurrentTimeForUpdate();
    var suspenseConfig = requestCurrentSuspenseConfig();
    var expirationTime = computeExpirationForFiber(
      currentTime,
      fiber,
      suspenseConfig
    );
    var update = createUpdate(expirationTime, suspenseConfig);
    update.tag = ReplaceState;
    update.payload = payload;

    if (callback !== undefined && callback !== null) {
      {
        warnOnInvalidCallback(callback, "replaceState");
      }

      update.callback = callback;
    }

    enqueueUpdate(fiber, update);
    scheduleWork(fiber, expirationTime);
  },
  enqueueForceUpdate: function(inst, callback) {
    var fiber = get(inst);
    var currentTime = requestCurrentTimeForUpdate();
    var suspenseConfig = requestCurrentSuspenseConfig();
    var expirationTime = computeExpirationForFiber(
      currentTime,
      fiber,
      suspenseConfig
    );
    var update = createUpdate(expirationTime, suspenseConfig);
    update.tag = ForceUpdate;

    if (callback !== undefined && callback !== null) {
      {
        warnOnInvalidCallback(callback, "forceUpdate");
      }

      update.callback = callback;
    }

    enqueueUpdate(fiber, update);
    scheduleWork(fiber, expirationTime);
  }
};

function checkShouldComponentUpdate(
  workInProgress,
  ctor,
  oldProps,
  newProps,
  oldState,
  newState,
  nextContext
) {
  var instance = workInProgress.stateNode;

  if (typeof instance.shouldComponentUpdate === "function") {
    startPhaseTimer(workInProgress, "shouldComponentUpdate");
    var shouldUpdate = instance.shouldComponentUpdate(
      newProps,
      newState,
      nextContext
    );
    stopPhaseTimer();

    {
      !(shouldUpdate !== undefined)
        ? warningWithoutStack$1(
            false,
            "%s.shouldComponentUpdate(): Returned undefined instead of a " +
              "boolean value. Make sure to return true or false.",
            getComponentName(ctor) || "Component"
          )
        : void 0;
    }

    return shouldUpdate;
  }

  if (ctor.prototype && ctor.prototype.isPureReactComponent) {
    return (
      !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
    );
  }

  return true;
}

function checkClassInstance(workInProgress, ctor, newProps) {
  var instance = workInProgress.stateNode;

  {
    var name = getComponentName(ctor) || "Component";
    var renderPresent = instance.render;

    if (!renderPresent) {
      if (ctor.prototype && typeof ctor.prototype.render === "function") {
        warningWithoutStack$1(
          false,
          "%s(...): No `render` method found on the returned component " +
            "instance: did you accidentally return an object from the constructor?",
          name
        );
      } else {
        warningWithoutStack$1(
          false,
          "%s(...): No `render` method found on the returned component " +
            "instance: you may have forgotten to define `render`.",
          name
        );
      }
    }

    var noGetInitialStateOnES6 =
      !instance.getInitialState ||
      instance.getInitialState.isReactClassApproved ||
      instance.state;
    !noGetInitialStateOnES6
      ? warningWithoutStack$1(
          false,
          "getInitialState was defined on %s, a plain JavaScript class. " +
            "This is only supported for classes created using React.createClass. " +
            "Did you mean to define a state property instead?",
          name
        )
      : void 0;
    var noGetDefaultPropsOnES6 =
      !instance.getDefaultProps ||
      instance.getDefaultProps.isReactClassApproved;
    !noGetDefaultPropsOnES6
      ? warningWithoutStack$1(
          false,
          "getDefaultProps was defined on %s, a plain JavaScript class. " +
            "This is only supported for classes created using React.createClass. " +
            "Use a static property to define defaultProps instead.",
          name
        )
      : void 0;
    var noInstancePropTypes = !instance.propTypes;
    !noInstancePropTypes
      ? warningWithoutStack$1(
          false,
          "propTypes was defined as an instance property on %s. Use a static " +
            "property to define propTypes instead.",
          name
        )
      : void 0;
    var noInstanceContextType = !instance.contextType;
    !noInstanceContextType
      ? warningWithoutStack$1(
          false,
          "contextType was defined as an instance property on %s. Use a static " +
            "property to define contextType instead.",
          name
        )
      : void 0;

    if (disableLegacyContext) {
      if (ctor.childContextTypes) {
        warningWithoutStack$1(
          false,
          "%s uses the legacy childContextTypes API which is no longer supported. " +
            "Use React.createContext() instead.",
          name
        );
      }

      if (ctor.contextTypes) {
        warningWithoutStack$1(
          false,
          "%s uses the legacy contextTypes API which is no longer supported. " +
            "Use React.createContext() with static contextType instead.",
          name
        );
      }
    } else {
      var noInstanceContextTypes = !instance.contextTypes;
      !noInstanceContextTypes
        ? warningWithoutStack$1(
            false,
            "contextTypes was defined as an instance property on %s. Use a static " +
              "property to define contextTypes instead.",
            name
          )
        : void 0;

      if (
        ctor.contextType &&
        ctor.contextTypes &&
        !didWarnAboutContextTypeAndContextTypes.has(ctor)
      ) {
        didWarnAboutContextTypeAndContextTypes.add(ctor);
        warningWithoutStack$1(
          false,
          "%s declares both contextTypes and contextType static properties. " +
            "The legacy contextTypes property will be ignored.",
          name
        );
      }
    }

    var noComponentShouldUpdate =
      typeof instance.componentShouldUpdate !== "function";
    !noComponentShouldUpdate
      ? warningWithoutStack$1(
          false,
          "%s has a method called " +
            "componentShouldUpdate(). Did you mean shouldComponentUpdate()? " +
            "The name is phrased as a question because the function is " +
            "expected to return a value.",
          name
        )
      : void 0;

    if (
      ctor.prototype &&
      ctor.prototype.isPureReactComponent &&
      typeof instance.shouldComponentUpdate !== "undefined"
    ) {
      warningWithoutStack$1(
        false,
        "%s has a method called shouldComponentUpdate(). " +
          "shouldComponentUpdate should not be used when extending React.PureComponent. " +
          "Please extend React.Component if shouldComponentUpdate is used.",
        getComponentName(ctor) || "A pure component"
      );
    }

    var noComponentDidUnmount =
      typeof instance.componentDidUnmount !== "function";
    !noComponentDidUnmount
      ? warningWithoutStack$1(
          false,
          "%s has a method called " +
            "componentDidUnmount(). But there is no such lifecycle method. " +
            "Did you mean componentWillUnmount()?",
          name
        )
      : void 0;
    var noComponentDidReceiveProps =
      typeof instance.componentDidReceiveProps !== "function";
    !noComponentDidReceiveProps
      ? warningWithoutStack$1(
          false,
          "%s has a method called " +
            "componentDidReceiveProps(). But there is no such lifecycle method. " +
            "If you meant to update the state in response to changing props, " +
            "use componentWillReceiveProps(). If you meant to fetch data or " +
            "run side-effects or mutations after React has updated the UI, use componentDidUpdate().",
          name
        )
      : void 0;
    var noComponentWillRecieveProps =
      typeof instance.componentWillRecieveProps !== "function";
    !noComponentWillRecieveProps
      ? warningWithoutStack$1(
          false,
          "%s has a method called " +
            "componentWillRecieveProps(). Did you mean componentWillReceiveProps()?",
          name
        )
      : void 0;
    var noUnsafeComponentWillRecieveProps =
      typeof instance.UNSAFE_componentWillRecieveProps !== "function";
    !noUnsafeComponentWillRecieveProps
      ? warningWithoutStack$1(
          false,
          "%s has a method called " +
            "UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?",
          name
        )
      : void 0;
    var hasMutatedProps = instance.props !== newProps;
    !(instance.props === undefined || !hasMutatedProps)
      ? warningWithoutStack$1(
          false,
          "%s(...): When calling super() in `%s`, make sure to pass " +
            "up the same props that your component's constructor was passed.",
          name,
          name
        )
      : void 0;
    var noInstanceDefaultProps = !instance.defaultProps;
    !noInstanceDefaultProps
      ? warningWithoutStack$1(
          false,
          "Setting defaultProps as an instance property on %s is not supported and will be ignored." +
            " Instead, define defaultProps as a static property on %s.",
          name,
          name
        )
      : void 0;

    if (
      typeof instance.getSnapshotBeforeUpdate === "function" &&
      typeof instance.componentDidUpdate !== "function" &&
      !didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.has(ctor)
    ) {
      didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.add(ctor);
      warningWithoutStack$1(
        false,
        "%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). " +
          "This component defines getSnapshotBeforeUpdate() only.",
        getComponentName(ctor)
      );
    }

    var noInstanceGetDerivedStateFromProps =
      typeof instance.getDerivedStateFromProps !== "function";
    !noInstanceGetDerivedStateFromProps
      ? warningWithoutStack$1(
          false,
          "%s: getDerivedStateFromProps() is defined as an instance method " +
            "and will be ignored. Instead, declare it as a static method.",
          name
        )
      : void 0;
    var noInstanceGetDerivedStateFromCatch =
      typeof instance.getDerivedStateFromError !== "function";
    !noInstanceGetDerivedStateFromCatch
      ? warningWithoutStack$1(
          false,
          "%s: getDerivedStateFromError() is defined as an instance method " +
            "and will be ignored. Instead, declare it as a static method.",
          name
        )
      : void 0;
    var noStaticGetSnapshotBeforeUpdate =
      typeof ctor.getSnapshotBeforeUpdate !== "function";
    !noStaticGetSnapshotBeforeUpdate
      ? warningWithoutStack$1(
          false,
          "%s: getSnapshotBeforeUpdate() is defined as a static method " +
            "and will be ignored. Instead, declare it as an instance method.",
          name
        )
      : void 0;
    var _state = instance.state;

    if (_state && (typeof _state !== "object" || isArray$1(_state))) {
      warningWithoutStack$1(
        false,
        "%s.state: must be set to an object or null",
        name
      );
    }

    if (typeof instance.getChildContext === "function") {
      !(typeof ctor.childContextTypes === "object")
        ? warningWithoutStack$1(
            false,
            "%s.getChildContext(): childContextTypes must be defined in order to " +
              "use getChildContext().",
            name
          )
        : void 0;
    }
  }
}

function adoptClassInstance(workInProgress, instance) {
  instance.updater = classComponentUpdater;
  workInProgress.stateNode = instance; // The instance needs access to the fiber so that it can schedule updates

  set(instance, workInProgress);

  {
    instance._reactInternalInstance = fakeInternalInstance;
  }
}

function constructClassInstance(
  workInProgress,
  ctor,
  props,
  renderExpirationTime
) {
  var isLegacyContextConsumer = false;
  var unmaskedContext = emptyContextObject;
  var context = emptyContextObject;
  var contextType = ctor.contextType;

  {
    if ("contextType" in ctor) {
      var isValid = // Allow null for conditional declaration
        contextType === null ||
        (contextType !== undefined &&
          contextType.$$typeof === REACT_CONTEXT_TYPE &&
          contextType._context === undefined); // Not a <Context.Consumer>

      if (!isValid && !didWarnAboutInvalidateContextType.has(ctor)) {
        didWarnAboutInvalidateContextType.add(ctor);
        var addendum = "";

        if (contextType === undefined) {
          addendum =
            " However, it is set to undefined. " +
            "This can be caused by a typo or by mixing up named and default imports. " +
            "This can also happen due to a circular dependency, so " +
            "try moving the createContext() call to a separate file.";
        } else if (typeof contextType !== "object") {
          addendum = " However, it is set to a " + typeof contextType + ".";
        } else if (contextType.$$typeof === REACT_PROVIDER_TYPE) {
          addendum = " Did you accidentally pass the Context.Provider instead?";
        } else if (contextType._context !== undefined) {
          // <Context.Consumer>
          addendum = " Did you accidentally pass the Context.Consumer instead?";
        } else {
          addendum =
            " However, it is set to an object with keys {" +
            Object.keys(contextType).join(", ") +
            "}.";
        }

        warningWithoutStack$1(
          false,
          "%s defines an invalid contextType. " +
            "contextType should point to the Context object returned by React.createContext().%s",
          getComponentName(ctor) || "Component",
          addendum
        );
      }
    }
  }

  if (typeof contextType === "object" && contextType !== null) {
    context = readContext(contextType);
  } else if (!disableLegacyContext) {
    unmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
    var contextTypes = ctor.contextTypes;
    isLegacyContextConsumer =
      contextTypes !== null && contextTypes !== undefined;
    context = isLegacyContextConsumer
      ? getMaskedContext(workInProgress, unmaskedContext)
      : emptyContextObject;
  } // Instantiate twice to help detect side-effects.

  {
    if (
      debugRenderPhaseSideEffectsForStrictMode &&
      workInProgress.mode & StrictMode
    ) {
      new ctor(props, context); // eslint-disable-line no-new
    }
  }

  var instance = new ctor(props, context);
  var state = (workInProgress.memoizedState =
    instance.state !== null && instance.state !== undefined
      ? instance.state
      : null);
  adoptClassInstance(workInProgress, instance);

  {
    if (typeof ctor.getDerivedStateFromProps === "function" && state === null) {
      var componentName = getComponentName(ctor) || "Component";

      if (!didWarnAboutUninitializedState.has(componentName)) {
        didWarnAboutUninitializedState.add(componentName);
        warningWithoutStack$1(
          false,
          "`%s` uses `getDerivedStateFromProps` but its initial state is " +
            "%s. This is not recommended. Instead, define the initial state by " +
            "assigning an object to `this.state` in the constructor of `%s`. " +
            "This ensures that `getDerivedStateFromProps` arguments have a consistent shape.",
          componentName,
          instance.state === null ? "null" : "undefined",
          componentName
        );
      }
    } // If new component APIs are defined, "unsafe" lifecycles won't be called.
    // Warn about these lifecycles if they are present.
    // Don't warn about react-lifecycles-compat polyfilled methods though.

    if (
      typeof ctor.getDerivedStateFromProps === "function" ||
      typeof instance.getSnapshotBeforeUpdate === "function"
    ) {
      var foundWillMountName = null;
      var foundWillReceivePropsName = null;
      var foundWillUpdateName = null;

      if (
        typeof instance.componentWillMount === "function" &&
        instance.componentWillMount.__suppressDeprecationWarning !== true
      ) {
        foundWillMountName = "componentWillMount";
      } else if (typeof instance.UNSAFE_componentWillMount === "function") {
        foundWillMountName = "UNSAFE_componentWillMount";
      }

      if (
        typeof instance.componentWillReceiveProps === "function" &&
        instance.componentWillReceiveProps.__suppressDeprecationWarning !== true
      ) {
        foundWillReceivePropsName = "componentWillReceiveProps";
      } else if (
        typeof instance.UNSAFE_componentWillReceiveProps === "function"
      ) {
        foundWillReceivePropsName = "UNSAFE_componentWillReceiveProps";
      }

      if (
        typeof instance.componentWillUpdate === "function" &&
        instance.componentWillUpdate.__suppressDeprecationWarning !== true
      ) {
        foundWillUpdateName = "componentWillUpdate";
      } else if (typeof instance.UNSAFE_componentWillUpdate === "function") {
        foundWillUpdateName = "UNSAFE_componentWillUpdate";
      }

      if (
        foundWillMountName !== null ||
        foundWillReceivePropsName !== null ||
        foundWillUpdateName !== null
      ) {
        var _componentName = getComponentName(ctor) || "Component";

        var newApiName =
          typeof ctor.getDerivedStateFromProps === "function"
            ? "getDerivedStateFromProps()"
            : "getSnapshotBeforeUpdate()";

        if (!didWarnAboutLegacyLifecyclesAndDerivedState.has(_componentName)) {
          didWarnAboutLegacyLifecyclesAndDerivedState.add(_componentName);
          warningWithoutStack$1(
            false,
            "Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n" +
              "%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\n" +
              "The above lifecycles should be removed. Learn more about this warning here:\n" +
              "https://fb.me/react-unsafe-component-lifecycles",
            _componentName,
            newApiName,
            foundWillMountName !== null ? "\n  " + foundWillMountName : "",
            foundWillReceivePropsName !== null
              ? "\n  " + foundWillReceivePropsName
              : "",
            foundWillUpdateName !== null ? "\n  " + foundWillUpdateName : ""
          );
        }
      }
    }
  } // Cache unmasked context so we can avoid recreating masked context unless necessary.
  // ReactFiberContext usually updates this cache but can't for newly-created instances.

  if (isLegacyContextConsumer) {
    cacheContext(workInProgress, unmaskedContext, context);
  }

  return instance;
}

function callComponentWillMount(workInProgress, instance) {
  startPhaseTimer(workInProgress, "componentWillMount");
  var oldState = instance.state;

  if (typeof instance.componentWillMount === "function") {
    instance.componentWillMount();
  }

  if (typeof instance.UNSAFE_componentWillMount === "function") {
    instance.UNSAFE_componentWillMount();
  }

  stopPhaseTimer();

  if (oldState !== instance.state) {
    {
      warningWithoutStack$1(
        false,
        "%s.componentWillMount(): Assigning directly to this.state is " +
          "deprecated (except inside a component's " +
          "constructor). Use setState instead.",
        getComponentName(workInProgress.type) || "Component"
      );
    }

    classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
  }
}

function callComponentWillReceiveProps(
  workInProgress,
  instance,
  newProps,
  nextContext
) {
  var oldState = instance.state;
  startPhaseTimer(workInProgress, "componentWillReceiveProps");

  if (typeof instance.componentWillReceiveProps === "function") {
    instance.componentWillReceiveProps(newProps, nextContext);
  }

  if (typeof instance.UNSAFE_componentWillReceiveProps === "function") {
    instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
  }

  stopPhaseTimer();

  if (instance.state !== oldState) {
    {
      var componentName = getComponentName(workInProgress.type) || "Component";

      if (!didWarnAboutStateAssignmentForComponent.has(componentName)) {
        didWarnAboutStateAssignmentForComponent.add(componentName);
        warningWithoutStack$1(
          false,
          "%s.componentWillReceiveProps(): Assigning directly to " +
            "this.state is deprecated (except inside a component's " +
            "constructor). Use setState instead.",
          componentName
        );
      }
    }

    classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
  }
} // Invokes the mount life-cycles on a previously never rendered instance.

function mountClassInstance(
  workInProgress,
  ctor,
  newProps,
  renderExpirationTime
) {
  {
    checkClassInstance(workInProgress, ctor, newProps);
  }

  var instance = workInProgress.stateNode;
  instance.props = newProps;
  instance.state = workInProgress.memoizedState;
  instance.refs = emptyRefsObject;
  var contextType = ctor.contextType;

  if (typeof contextType === "object" && contextType !== null) {
    instance.context = readContext(contextType);
  } else if (disableLegacyContext) {
    instance.context = emptyContextObject;
  } else {
    var unmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
    instance.context = getMaskedContext(workInProgress, unmaskedContext);
  }

  {
    if (instance.state === newProps) {
      var componentName = getComponentName(ctor) || "Component";

      if (!didWarnAboutDirectlyAssigningPropsToState.has(componentName)) {
        didWarnAboutDirectlyAssigningPropsToState.add(componentName);
        warningWithoutStack$1(
          false,
          "%s: It is not recommended to assign props directly to state " +
            "because updates to props won't be reflected in state. " +
            "In most cases, it is better to use props directly.",
          componentName
        );
      }
    }

    if (workInProgress.mode & StrictMode) {
      ReactStrictModeWarnings.recordLegacyContextWarning(
        workInProgress,
        instance
      );
    }

    if (warnAboutDeprecatedLifecycles) {
      ReactStrictModeWarnings.recordUnsafeLifecycleWarnings(
        workInProgress,
        instance
      );
    }
  }

  var updateQueue = workInProgress.updateQueue;

  if (updateQueue !== null) {
    processUpdateQueue(
      workInProgress,
      updateQueue,
      newProps,
      instance,
      renderExpirationTime
    );
    instance.state = workInProgress.memoizedState;
  }

  var getDerivedStateFromProps = ctor.getDerivedStateFromProps;

  if (typeof getDerivedStateFromProps === "function") {
    applyDerivedStateFromProps(
      workInProgress,
      ctor,
      getDerivedStateFromProps,
      newProps
    );
    instance.state = workInProgress.memoizedState;
  } // In order to support react-lifecycles-compat polyfilled components,
  // Unsafe lifecycles should not be invoked for components using the new APIs.

  if (
    typeof ctor.getDerivedStateFromProps !== "function" &&
    typeof instance.getSnapshotBeforeUpdate !== "function" &&
    (typeof instance.UNSAFE_componentWillMount === "function" ||
      typeof instance.componentWillMount === "function")
  ) {
    callComponentWillMount(workInProgress, instance); // If we had additional state updates during this life-cycle, let's
    // process them now.

    updateQueue = workInProgress.updateQueue;

    if (updateQueue !== null) {
      processUpdateQueue(
        workInProgress,
        updateQueue,
        newProps,
        instance,
        renderExpirationTime
      );
      instance.state = workInProgress.memoizedState;
    }
  }

  if (typeof instance.componentDidMount === "function") {
    workInProgress.effectTag |= Update;
  }
}

function resumeMountClassInstance(
  workInProgress,
  ctor,
  newProps,
  renderExpirationTime
) {
  var instance = workInProgress.stateNode;
  var oldProps = workInProgress.memoizedProps;
  instance.props = oldProps;
  var oldContext = instance.context;
  var contextType = ctor.contextType;
  var nextContext = emptyContextObject;

  if (typeof contextType === "object" && contextType !== null) {
    nextContext = readContext(contextType);
  } else if (!disableLegacyContext) {
    var nextLegacyUnmaskedContext = getUnmaskedContext(
      workInProgress,
      ctor,
      true
    );
    nextContext = getMaskedContext(workInProgress, nextLegacyUnmaskedContext);
  }

  var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
  var hasNewLifecycles =
    typeof getDerivedStateFromProps === "function" ||
    typeof instance.getSnapshotBeforeUpdate === "function"; // Note: During these life-cycles, instance.props/instance.state are what
  // ever the previously attempted to render - not the "current". However,
  // during componentDidUpdate we pass the "current" props.
  // In order to support react-lifecycles-compat polyfilled components,
  // Unsafe lifecycles should not be invoked for components using the new APIs.

  if (
    !hasNewLifecycles &&
    (typeof instance.UNSAFE_componentWillReceiveProps === "function" ||
      typeof instance.componentWillReceiveProps === "function")
  ) {
    if (oldProps !== newProps || oldContext !== nextContext) {
      callComponentWillReceiveProps(
        workInProgress,
        instance,
        newProps,
        nextContext
      );
    }
  }

  resetHasForceUpdateBeforeProcessing();
  var oldState = workInProgress.memoizedState;
  var newState = (instance.state = oldState);
  var updateQueue = workInProgress.updateQueue;

  if (updateQueue !== null) {
    processUpdateQueue(
      workInProgress,
      updateQueue,
      newProps,
      instance,
      renderExpirationTime
    );
    newState = workInProgress.memoizedState;
  }

  if (
    oldProps === newProps &&
    oldState === newState &&
    !hasContextChanged() &&
    !checkHasForceUpdateAfterProcessing()
  ) {
    // If an update was already in progress, we should schedule an Update
    // effect even though we're bailing out, so that cWU/cDU are called.
    if (typeof instance.componentDidMount === "function") {
      workInProgress.effectTag |= Update;
    }

    return false;
  }

  if (typeof getDerivedStateFromProps === "function") {
    applyDerivedStateFromProps(
      workInProgress,
      ctor,
      getDerivedStateFromProps,
      newProps
    );
    newState = workInProgress.memoizedState;
  }

  var shouldUpdate =
    checkHasForceUpdateAfterProcessing() ||
    checkShouldComponentUpdate(
      workInProgress,
      ctor,
      oldProps,
      newProps,
      oldState,
      newState,
      nextContext
    );

  if (shouldUpdate) {
    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for components using the new APIs.
    if (
      !hasNewLifecycles &&
      (typeof instance.UNSAFE_componentWillMount === "function" ||
        typeof instance.componentWillMount === "function")
    ) {
      startPhaseTimer(workInProgress, "componentWillMount");

      if (typeof instance.componentWillMount === "function") {
        instance.componentWillMount();
      }

      if (typeof instance.UNSAFE_componentWillMount === "function") {
        instance.UNSAFE_componentWillMount();
      }

      stopPhaseTimer();
    }

    if (typeof instance.componentDidMount === "function") {
      workInProgress.effectTag |= Update;
    }
  } else {
    // If an update was already in progress, we should schedule an Update
    // effect even though we're bailing out, so that cWU/cDU are called.
    if (typeof instance.componentDidMount === "function") {
      workInProgress.effectTag |= Update;
    } // If shouldComponentUpdate returned false, we should still update the
    // memoized state to indicate that this work can be reused.

    workInProgress.memoizedProps = newProps;
    workInProgress.memoizedState = newState;
  } // Update the existing instance's state, props, and context pointers even
  // if shouldComponentUpdate returns false.

  instance.props = newProps;
  instance.state = newState;
  instance.context = nextContext;
  return shouldUpdate;
} // Invokes the update life-cycles and returns false if it shouldn't rerender.

function updateClassInstance(
  current,
  workInProgress,
  ctor,
  newProps,
  renderExpirationTime
) {
  var instance = workInProgress.stateNode;
  var oldProps = workInProgress.memoizedProps;
  instance.props =
    workInProgress.type === workInProgress.elementType
      ? oldProps
      : resolveDefaultProps(workInProgress.type, oldProps);
  var oldContext = instance.context;
  var contextType = ctor.contextType;
  var nextContext = emptyContextObject;

  if (typeof contextType === "object" && contextType !== null) {
    nextContext = readContext(contextType);
  } else if (!disableLegacyContext) {
    var nextUnmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
    nextContext = getMaskedContext(workInProgress, nextUnmaskedContext);
  }

  var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
  var hasNewLifecycles =
    typeof getDerivedStateFromProps === "function" ||
    typeof instance.getSnapshotBeforeUpdate === "function"; // Note: During these life-cycles, instance.props/instance.state are what
  // ever the previously attempted to render - not the "current". However,
  // during componentDidUpdate we pass the "current" props.
  // In order to support react-lifecycles-compat polyfilled components,
  // Unsafe lifecycles should not be invoked for components using the new APIs.

  if (
    !hasNewLifecycles &&
    (typeof instance.UNSAFE_componentWillReceiveProps === "function" ||
      typeof instance.componentWillReceiveProps === "function")
  ) {
    if (oldProps !== newProps || oldContext !== nextContext) {
      callComponentWillReceiveProps(
        workInProgress,
        instance,
        newProps,
        nextContext
      );
    }
  }

  resetHasForceUpdateBeforeProcessing();
  var oldState = workInProgress.memoizedState;
  var newState = (instance.state = oldState);
  var updateQueue = workInProgress.updateQueue;

  if (updateQueue !== null) {
    processUpdateQueue(
      workInProgress,
      updateQueue,
      newProps,
      instance,
      renderExpirationTime
    );
    newState = workInProgress.memoizedState;
  }

  if (
    oldProps === newProps &&
    oldState === newState &&
    !hasContextChanged() &&
    !checkHasForceUpdateAfterProcessing()
  ) {
    // If an update was already in progress, we should schedule an Update
    // effect even though we're bailing out, so that cWU/cDU are called.
    if (typeof instance.componentDidUpdate === "function") {
      if (
        oldProps !== current.memoizedProps ||
        oldState !== current.memoizedState
      ) {
        workInProgress.effectTag |= Update;
      }
    }

    if (typeof instance.getSnapshotBeforeUpdate === "function") {
      if (
        oldProps !== current.memoizedProps ||
        oldState !== current.memoizedState
      ) {
        workInProgress.effectTag |= Snapshot;
      }
    }

    return false;
  }

  if (typeof getDerivedStateFromProps === "function") {
    applyDerivedStateFromProps(
      workInProgress,
      ctor,
      getDerivedStateFromProps,
      newProps
    );
    newState = workInProgress.memoizedState;
  }

  var shouldUpdate =
    checkHasForceUpdateAfterProcessing() ||
    checkShouldComponentUpdate(
      workInProgress,
      ctor,
      oldProps,
      newProps,
      oldState,
      newState,
      nextContext
    );

  if (shouldUpdate) {
    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for components using the new APIs.
    if (
      !hasNewLifecycles &&
      (typeof instance.UNSAFE_componentWillUpdate === "function" ||
        typeof instance.componentWillUpdate === "function")
    ) {
      startPhaseTimer(workInProgress, "componentWillUpdate");

      if (typeof instance.componentWillUpdate === "function") {
        instance.componentWillUpdate(newProps, newState, nextContext);
      }

      if (typeof instance.UNSAFE_componentWillUpdate === "function") {
        instance.UNSAFE_componentWillUpdate(newProps, newState, nextContext);
      }

      stopPhaseTimer();
    }

    if (typeof instance.componentDidUpdate === "function") {
      workInProgress.effectTag |= Update;
    }

    if (typeof instance.getSnapshotBeforeUpdate === "function") {
      workInProgress.effectTag |= Snapshot;
    }
  } else {
    // If an update was already in progress, we should schedule an Update
    // effect even though we're bailing out, so that cWU/cDU are called.
    if (typeof instance.componentDidUpdate === "function") {
      if (
        oldProps !== current.memoizedProps ||
        oldState !== current.memoizedState
      ) {
        workInProgress.effectTag |= Update;
      }
    }

    if (typeof instance.getSnapshotBeforeUpdate === "function") {
      if (
        oldProps !== current.memoizedProps ||
        oldState !== current.memoizedState
      ) {
        workInProgress.effectTag |= Snapshot;
      }
    } // If shouldComponentUpdate returned false, we should still update the
    // memoized props/state to indicate that this work can be reused.

    workInProgress.memoizedProps = newProps;
    workInProgress.memoizedState = newState;
  } // Update the existing instance's state, props, and context pointers even
  // if shouldComponentUpdate returns false.

  instance.props = newProps;
  instance.state = newState;
  instance.context = nextContext;
  return shouldUpdate;
}

var didWarnAboutMaps;
var didWarnAboutGenerators;
var didWarnAboutStringRefs;
var ownerHasKeyUseWarning;
var ownerHasFunctionTypeWarning;

var warnForMissingKey = function(child) {};

{
  didWarnAboutMaps = false;
  didWarnAboutGenerators = false;
  didWarnAboutStringRefs = {};
  /**
   * Warn if there's no key explicitly set on dynamic arrays of children or
   * object keys are not valid. This allows us to keep track of children between
   * updates.
   */

  ownerHasKeyUseWarning = {};
  ownerHasFunctionTypeWarning = {};

  warnForMissingKey = function(child) {
    if (child === null || typeof child !== "object") {
      return;
    }

    if (!child._store || child._store.validated || child.key != null) {
      return;
    }

    if (!(typeof child._store === "object")) {
      throw Error(
        "React Component in warnForMissingKey should have a _store. This error is likely caused by a bug in React. Please file an issue."
      );
    }

    child._store.validated = true;
    var currentComponentErrorInfo =
      "Each child in a list should have a unique " +
      '"key" prop. See https://fb.me/react-warning-keys for ' +
      "more information." +
      getCurrentFiberStackInDev();

    if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
      return;
    }

    ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
    warning$1(
      false,
      "Each child in a list should have a unique " +
        '"key" prop. See https://fb.me/react-warning-keys for ' +
        "more information."
    );
  };
}

var isArray = Array.isArray;

function coerceRef(returnFiber, current$$1, element) {
  var mixedRef = element.ref;

  if (
    mixedRef !== null &&
    typeof mixedRef !== "function" &&
    typeof mixedRef !== "object"
  ) {
    {
      // TODO: Clean this up once we turn on the string ref warning for
      // everyone, because the strict mode case will no longer be relevant
      if (returnFiber.mode & StrictMode || warnAboutStringRefs) {
        var componentName = getComponentName(returnFiber.type) || "Component";

        if (!didWarnAboutStringRefs[componentName]) {
          if (warnAboutStringRefs) {
            warningWithoutStack$1(
              false,
              'Component "%s" contains the string ref "%s". Support for string refs ' +
                "will be removed in a future major release. We recommend using " +
                "useRef() or createRef() instead. " +
                "Learn more about using refs safely here: " +
                "https://fb.me/react-strict-mode-string-ref%s",
              componentName,
              mixedRef,
              getStackByFiberInDevAndProd(returnFiber)
            );
          } else {
            warningWithoutStack$1(
              false,
              'A string ref, "%s", has been found within a strict mode tree. ' +
                "String refs are a source of potential bugs and should be avoided. " +
                "We recommend using useRef() or createRef() instead. " +
                "Learn more about using refs safely here: " +
                "https://fb.me/react-strict-mode-string-ref%s",
              mixedRef,
              getStackByFiberInDevAndProd(returnFiber)
            );
          }

          didWarnAboutStringRefs[componentName] = true;
        }
      }
    }

    if (element._owner) {
      var owner = element._owner;
      var inst;

      if (owner) {
        var ownerFiber = owner;

        if (!(ownerFiber.tag === ClassComponent)) {
          throw Error(
            "Function components cannot have refs. Did you mean to use React.forwardRef()?"
          );
        }

        inst = ownerFiber.stateNode;
      }

      if (!inst) {
        throw Error(
          "Missing owner for string ref " +
            mixedRef +
            ". This error is likely caused by a bug in React. Please file an issue."
        );
      }

      var stringRef = "" + mixedRef; // Check if previous string ref matches new string ref

      if (
        current$$1 !== null &&
        current$$1.ref !== null &&
        typeof current$$1.ref === "function" &&
        current$$1.ref._stringRef === stringRef
      ) {
        return current$$1.ref;
      }

      var ref = function(value) {
        var refs = inst.refs;

        if (refs === emptyRefsObject) {
          // This is a lazy pooled frozen object, so we need to initialize.
          refs = inst.refs = {};
        }

        if (value === null) {
          delete refs[stringRef];
        } else {
          refs[stringRef] = value;
        }
      };

      ref._stringRef = stringRef;
      return ref;
    } else {
      if (!(typeof mixedRef === "string")) {
        throw Error(
          "Expected ref to be a function, a string, an object returned by React.createRef(), or null."
        );
      }

      if (!element._owner) {
        throw Error(
          "Element ref was specified as a string (" +
            mixedRef +
            ") but no owner was set. This could happen for one of the following reasons:\n1. You may be adding a ref to a function component\n2. You may be adding a ref to a component that was not created inside a component's render method\n3. You have multiple copies of React loaded\nSee https://fb.me/react-refs-must-have-owner for more information."
        );
      }
    }
  }

  return mixedRef;
}

function throwOnInvalidObjectType(returnFiber, newChild) {
  if (returnFiber.type !== "textarea") {
    var addendum = "";

    {
      addendum =
        " If you meant to render a collection of children, use an array " +
        "instead." +
        getCurrentFiberStackInDev();
    }

    {
      throw Error(
        "Objects are not valid as a React child (found: " +
          (Object.prototype.toString.call(newChild) === "[object Object]"
            ? "object with keys {" + Object.keys(newChild).join(", ") + "}"
            : newChild) +
          ")." +
          addendum
      );
    }
  }
}

function warnOnFunctionType() {
  var currentComponentErrorInfo =
    "Functions are not valid as a React child. This may happen if " +
    "you return a Component instead of <Component /> from render. " +
    "Or maybe you meant to call this function rather than return it." +
    getCurrentFiberStackInDev();

  if (ownerHasFunctionTypeWarning[currentComponentErrorInfo]) {
    return;
  }

  ownerHasFunctionTypeWarning[currentComponentErrorInfo] = true;
  warning$1(
    false,
    "Functions are not valid as a React child. This may happen if " +
      "you return a Component instead of <Component /> from render. " +
      "Or maybe you meant to call this function rather than return it."
  );
} // This wrapper function exists because I expect to clone the code in each path
// to be able to optimize each path individually by branching early. This needs
// a compiler or we can do it manually. Helpers that don't need this branching
// live outside of this function.

function ChildReconciler(shouldTrackSideEffects) {
  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) {
      // Noop.
      return;
    } // Deletions are added in reversed order so we add it to the front.
    // At this point, the return fiber's effect list is empty except for
    // deletions, so we can just append the deletion to the list. The remaining
    // effects aren't added until the complete phase. Once we implement
    // resuming, this may not be true.

    var last = returnFiber.lastEffect;

    if (last !== null) {
      last.nextEffect = childToDelete;
      returnFiber.lastEffect = childToDelete;
    } else {
      returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
    }

    childToDelete.nextEffect = null;
    childToDelete.effectTag = Deletion;
  }

  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) {
      // Noop.
      return null;
    } // TODO: For the shouldClone case, this could be micro-optimized a bit by
    // assuming that after the first child we've already added everything.

    var childToDelete = currentFirstChild;

    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }

    return null;
  }

  function mapRemainingChildren(returnFiber, currentFirstChild) {
    // Add the remaining children to a temporary map so that we can find them by
    // keys quickly. Implicit (null) keys get added to this set with their index
    // instead.
    var existingChildren = new Map();
    var existingChild = currentFirstChild;

    while (existingChild !== null) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }

      existingChild = existingChild.sibling;
    }

    return existingChildren;
  }

  function useFiber(fiber, pendingProps, expirationTime) {
    // We currently set sibling to null and index to 0 here because it is easy
    // to forget to do before returning it. E.g. for the single child case.
    var clone = createWorkInProgress(fiber, pendingProps, expirationTime);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex;

    if (!shouldTrackSideEffects) {
      // Noop.
      return lastPlacedIndex;
    }

    var current$$1 = newFiber.alternate;

    if (current$$1 !== null) {
      var oldIndex = current$$1.index;

      if (oldIndex < lastPlacedIndex) {
        // This is a move.
        newFiber.effectTag = Placement;
        return lastPlacedIndex;
      } else {
        // This item can stay in place.
        return oldIndex;
      }
    } else {
      // This is an insertion.
      newFiber.effectTag = Placement;
      return lastPlacedIndex;
    }
  }

  function placeSingleChild(newFiber) {
    // This is simpler for the single child case. We only need to do a
    // placement for inserting new children.
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.effectTag = Placement;
    }

    return newFiber;
  }

  function updateTextNode(
    returnFiber,
    current$$1,
    textContent,
    expirationTime
  ) {
    if (current$$1 === null || current$$1.tag !== HostText) {
      // Insert
      var created = createFiberFromText(
        textContent,
        returnFiber.mode,
        expirationTime
      );
      created.return = returnFiber;
      return created;
    } else {
      // Update
      var existing = useFiber(current$$1, textContent, expirationTime);
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateElement(returnFiber, current$$1, element, expirationTime) {
    if (
      current$$1 !== null &&
      (current$$1.elementType === element.type || // Keep this check inline so it only runs on the false path:
        isCompatibleFamilyForHotReloading(current$$1, element))
    ) {
      // Move based on index
      var existing = useFiber(current$$1, element.props, expirationTime);
      existing.ref = coerceRef(returnFiber, current$$1, element);
      existing.return = returnFiber;

      {
        existing._debugSource = element._source;
        existing._debugOwner = element._owner;
      }

      return existing;
    } else {
      // Insert
      var created = createFiberFromElement(
        element,
        returnFiber.mode,
        expirationTime
      );
      created.ref = coerceRef(returnFiber, current$$1, element);
      created.return = returnFiber;
      return created;
    }
  }

  function updatePortal(returnFiber, current$$1, portal, expirationTime) {
    if (
      current$$1 === null ||
      current$$1.tag !== HostPortal ||
      current$$1.stateNode.containerInfo !== portal.containerInfo ||
      current$$1.stateNode.implementation !== portal.implementation
    ) {
      // Insert
      var created = createFiberFromPortal(
        portal,
        returnFiber.mode,
        expirationTime
      );
      created.return = returnFiber;
      return created;
    } else {
      // Update
      var existing = useFiber(
        current$$1,
        portal.children || [],
        expirationTime
      );
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateFragment(
    returnFiber,
    current$$1,
    fragment,
    expirationTime,
    key
  ) {
    if (current$$1 === null || current$$1.tag !== Fragment) {
      // Insert
      var created = createFiberFromFragment(
        fragment,
        returnFiber.mode,
        expirationTime,
        key
      );
      created.return = returnFiber;
      return created;
    } else {
      // Update
      var existing = useFiber(current$$1, fragment, expirationTime);
      existing.return = returnFiber;
      return existing;
    }
  }

  function createChild(returnFiber, newChild, expirationTime) {
    if (typeof newChild === "string" || typeof newChild === "number") {
      // Text nodes don't have keys. If the previous node is implicitly keyed
      // we can continue to replace it without aborting even if it is not a text
      // node.
      var created = createFiberFromText(
        "" + newChild,
        returnFiber.mode,
        expirationTime
      );
      created.return = returnFiber;
      return created;
    }

    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          var _created = createFiberFromElement(
            newChild,
            returnFiber.mode,
            expirationTime
          );

          _created.ref = coerceRef(returnFiber, null, newChild);
          _created.return = returnFiber;
          return _created;
        }

        case REACT_PORTAL_TYPE: {
          var _created2 = createFiberFromPortal(
            newChild,
            returnFiber.mode,
            expirationTime
          );

          _created2.return = returnFiber;
          return _created2;
        }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        var _created3 = createFiberFromFragment(
          newChild,
          returnFiber.mode,
          expirationTime,
          null
        );

        _created3.return = returnFiber;
        return _created3;
      }

      throwOnInvalidObjectType(returnFiber, newChild);
    }

    {
      if (typeof newChild === "function") {
        warnOnFunctionType();
      }
    }

    return null;
  }

  function updateSlot(returnFiber, oldFiber, newChild, expirationTime) {
    // Update the fiber if the keys match, otherwise return null.
    var key = oldFiber !== null ? oldFiber.key : null;

    if (typeof newChild === "string" || typeof newChild === "number") {
      // Text nodes don't have keys. If the previous node is implicitly keyed
      // we can continue to replace it without aborting even if it is not a text
      // node.
      if (key !== null) {
        return null;
      }

      return updateTextNode(
        returnFiber,
        oldFiber,
        "" + newChild,
        expirationTime
      );
    }

    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          if (newChild.key === key) {
            if (newChild.type === REACT_FRAGMENT_TYPE) {
              return updateFragment(
                returnFiber,
                oldFiber,
                newChild.props.children,
                expirationTime,
                key
              );
            }

            return updateElement(
              returnFiber,
              oldFiber,
              newChild,
              expirationTime
            );
          } else {
            return null;
          }
        }

        case REACT_PORTAL_TYPE: {
          if (newChild.key === key) {
            return updatePortal(
              returnFiber,
              oldFiber,
              newChild,
              expirationTime
            );
          } else {
            return null;
          }
        }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        if (key !== null) {
          return null;
        }

        return updateFragment(
          returnFiber,
          oldFiber,
          newChild,
          expirationTime,
          null
        );
      }

      throwOnInvalidObjectType(returnFiber, newChild);
    }

    {
      if (typeof newChild === "function") {
        warnOnFunctionType();
      }
    }

    return null;
  }

  function updateFromMap(
    existingChildren,
    returnFiber,
    newIdx,
    newChild,
    expirationTime
  ) {
    if (typeof newChild === "string" || typeof newChild === "number") {
      // Text nodes don't have keys, so we neither have to check the old nor
      // new node for the key. If both are text nodes, they match.
      var matchedFiber = existingChildren.get(newIdx) || null;
      return updateTextNode(
        returnFiber,
        matchedFiber,
        "" + newChild,
        expirationTime
      );
    }

    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          var _matchedFiber =
            existingChildren.get(
              newChild.key === null ? newIdx : newChild.key
            ) || null;

          if (newChild.type === REACT_FRAGMENT_TYPE) {
            return updateFragment(
              returnFiber,
              _matchedFiber,
              newChild.props.children,
              expirationTime,
              newChild.key
            );
          }

          return updateElement(
            returnFiber,
            _matchedFiber,
            newChild,
            expirationTime
          );
        }

        case REACT_PORTAL_TYPE: {
          var _matchedFiber2 =
            existingChildren.get(
              newChild.key === null ? newIdx : newChild.key
            ) || null;

          return updatePortal(
            returnFiber,
            _matchedFiber2,
            newChild,
            expirationTime
          );
        }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        var _matchedFiber3 = existingChildren.get(newIdx) || null;

        return updateFragment(
          returnFiber,
          _matchedFiber3,
          newChild,
          expirationTime,
          null
        );
      }

      throwOnInvalidObjectType(returnFiber, newChild);
    }

    {
      if (typeof newChild === "function") {
        warnOnFunctionType();
      }
    }

    return null;
  }
  /**
   * Warns if there is a duplicate or missing key
   */

  function warnOnInvalidKey(child, knownKeys) {
    {
      if (typeof child !== "object" || child === null) {
        return knownKeys;
      }

      switch (child.$$typeof) {
        case REACT_ELEMENT_TYPE:
        case REACT_PORTAL_TYPE:
          warnForMissingKey(child);
          var key = child.key;

          if (typeof key !== "string") {
            break;
          }

          if (knownKeys === null) {
            knownKeys = new Set();
            knownKeys.add(key);
            break;
          }

          if (!knownKeys.has(key)) {
            knownKeys.add(key);
            break;
          }

          warning$1(
            false,
            "Encountered two children with the same key, `%s`. " +
              "Keys should be unique so that components maintain their identity " +
              "across updates. Non-unique keys may cause children to be " +
              "duplicated and/or omitted — the behavior is unsupported and " +
              "could change in a future version.",
            key
          );
          break;

        default:
          break;
      }
    }

    return knownKeys;
  }

  function reconcileChildrenArray(
    returnFiber,
    currentFirstChild,
    newChildren,
    expirationTime
  ) {
    // This algorithm can't optimize by searching from both ends since we
    // don't have backpointers on fibers. I'm trying to see how far we can get
    // with that model. If it ends up not being worth the tradeoffs, we can
    // add it later.
    // Even with a two ended optimization, we'd want to optimize for the case
    // where there are few changes and brute force the comparison instead of
    // going for the Map. It'd like to explore hitting that path first in
    // forward-only mode and only go for the Map once we notice that we need
    // lots of look ahead. This doesn't handle reversal as well as two ended
    // search but that's unusual. Besides, for the two ended optimization to
    // work on Iterables, we'd need to copy the whole set.
    // In this first iteration, we'll just live with hitting the bad case
    // (adding everything to a Map) in for every insert/move.
    // If you change this code, also update reconcileChildrenIterator() which
    // uses the same algorithm.
    {
      // First, validate keys.
      var knownKeys = null;

      for (var i = 0; i < newChildren.length; i++) {
        var child = newChildren[i];
        knownKeys = warnOnInvalidKey(child, knownKeys);
      }
    }

    var resultingFirstChild = null;
    var previousNewFiber = null;
    var oldFiber = currentFirstChild;
    var lastPlacedIndex = 0;
    var newIdx = 0;
    var nextOldFiber = null;

    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      if (oldFiber.index > newIdx) {
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }

      var newFiber = updateSlot(
        returnFiber,
        oldFiber,
        newChildren[newIdx],
        expirationTime
      );

      if (newFiber === null) {
        // TODO: This breaks on empty slots like null children. That's
        // unfortunate because it triggers the slow path all the time. We need
        // a better way to communicate whether this was a miss or null,
        // boolean, undefined, etc.
        if (oldFiber === null) {
          oldFiber = nextOldFiber;
        }

        break;
      }

      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber.alternate === null) {
          // We matched the slot, but we didn't reuse the existing fiber, so we
          // need to delete the existing child.
          deleteChild(returnFiber, oldFiber);
        }
      }

      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

      if (previousNewFiber === null) {
        // TODO: Move out of the loop. This only happens for the first run.
        resultingFirstChild = newFiber;
      } else {
        // TODO: Defer siblings if we're not at the right index for this slot.
        // I.e. if we had null values before, then we want to defer this
        // for each null value. However, we also don't want to call updateSlot
        // with the previous one.
        previousNewFiber.sibling = newFiber;
      }

      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (newIdx === newChildren.length) {
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      // If we don't have any more existing children we can choose a fast path
      // since the rest will all be insertions.
      for (; newIdx < newChildren.length; newIdx++) {
        var _newFiber = createChild(
          returnFiber,
          newChildren[newIdx],
          expirationTime
        );

        if (_newFiber === null) {
          continue;
        }

        lastPlacedIndex = placeChild(_newFiber, lastPlacedIndex, newIdx);

        if (previousNewFiber === null) {
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = _newFiber;
        } else {
          previousNewFiber.sibling = _newFiber;
        }

        previousNewFiber = _newFiber;
      }

      return resultingFirstChild;
    } // Add all children to a key map for quick lookups.

    var existingChildren = mapRemainingChildren(returnFiber, oldFiber); // Keep scanning and use the map to restore deleted items as moves.

    for (; newIdx < newChildren.length; newIdx++) {
      var _newFiber2 = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx],
        expirationTime
      );

      if (_newFiber2 !== null) {
        if (shouldTrackSideEffects) {
          if (_newFiber2.alternate !== null) {
            // The new fiber is a work in progress, but if there exists a
            // current, that means that we reused the fiber. We need to delete
            // it from the child list so that we don't add it to the deletion
            // list.
            existingChildren.delete(
              _newFiber2.key === null ? newIdx : _newFiber2.key
            );
          }
        }

        lastPlacedIndex = placeChild(_newFiber2, lastPlacedIndex, newIdx);

        if (previousNewFiber === null) {
          resultingFirstChild = _newFiber2;
        } else {
          previousNewFiber.sibling = _newFiber2;
        }

        previousNewFiber = _newFiber2;
      }
    }

    if (shouldTrackSideEffects) {
      // Any existing children that weren't consumed above were deleted. We need
      // to add them to the deletion list.
      existingChildren.forEach(function(child) {
        return deleteChild(returnFiber, child);
      });
    }

    return resultingFirstChild;
  }

  function reconcileChildrenIterator(
    returnFiber,
    currentFirstChild,
    newChildrenIterable,
    expirationTime
  ) {
    // This is the same implementation as reconcileChildrenArray(),
    // but using the iterator instead.
    var iteratorFn = getIteratorFn(newChildrenIterable);

    if (!(typeof iteratorFn === "function")) {
      throw Error(
        "An object is not an iterable. This error is likely caused by a bug in React. Please file an issue."
      );
    }

    {
      // We don't support rendering Generators because it's a mutation.
      // See https://github.com/facebook/react/issues/12995
      if (
        typeof Symbol === "function" && // $FlowFixMe Flow doesn't know about toStringTag
        newChildrenIterable[Symbol.toStringTag] === "Generator"
      ) {
        !didWarnAboutGenerators
          ? warning$1(
              false,
              "Using Generators as children is unsupported and will likely yield " +
                "unexpected results because enumerating a generator mutates it. " +
                "You may convert it to an array with `Array.from()` or the " +
                "`[...spread]` operator before rendering. Keep in mind " +
                "you might need to polyfill these features for older browsers."
            )
          : void 0;
        didWarnAboutGenerators = true;
      } // Warn about using Maps as children

      if (newChildrenIterable.entries === iteratorFn) {
        !didWarnAboutMaps
          ? warning$1(
              false,
              "Using Maps as children is unsupported and will likely yield " +
                "unexpected results. Convert it to a sequence/iterable of keyed " +
                "ReactElements instead."
            )
          : void 0;
        didWarnAboutMaps = true;
      } // First, validate keys.
      // We'll get a different iterator later for the main pass.

      var _newChildren = iteratorFn.call(newChildrenIterable);

      if (_newChildren) {
        var knownKeys = null;

        var _step = _newChildren.next();

        for (; !_step.done; _step = _newChildren.next()) {
          var child = _step.value;
          knownKeys = warnOnInvalidKey(child, knownKeys);
        }
      }
    }

    var newChildren = iteratorFn.call(newChildrenIterable);

    if (!(newChildren != null)) {
      throw Error("An iterable object provided no iterator.");
    }

    var resultingFirstChild = null;
    var previousNewFiber = null;
    var oldFiber = currentFirstChild;
    var lastPlacedIndex = 0;
    var newIdx = 0;
    var nextOldFiber = null;
    var step = newChildren.next();

    for (
      ;
      oldFiber !== null && !step.done;
      newIdx++, step = newChildren.next()
    ) {
      if (oldFiber.index > newIdx) {
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }

      var newFiber = updateSlot(
        returnFiber,
        oldFiber,
        step.value,
        expirationTime
      );

      if (newFiber === null) {
        // TODO: This breaks on empty slots like null children. That's
        // unfortunate because it triggers the slow path all the time. We need
        // a better way to communicate whether this was a miss or null,
        // boolean, undefined, etc.
        if (oldFiber === null) {
          oldFiber = nextOldFiber;
        }

        break;
      }

      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber.alternate === null) {
          // We matched the slot, but we didn't reuse the existing fiber, so we
          // need to delete the existing child.
          deleteChild(returnFiber, oldFiber);
        }
      }

      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

      if (previousNewFiber === null) {
        // TODO: Move out of the loop. This only happens for the first run.
        resultingFirstChild = newFiber;
      } else {
        // TODO: Defer siblings if we're not at the right index for this slot.
        // I.e. if we had null values before, then we want to defer this
        // for each null value. However, we also don't want to call updateSlot
        // with the previous one.
        previousNewFiber.sibling = newFiber;
      }

      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (step.done) {
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      // If we don't have any more existing children we can choose a fast path
      // since the rest will all be insertions.
      for (; !step.done; newIdx++, step = newChildren.next()) {
        var _newFiber3 = createChild(returnFiber, step.value, expirationTime);

        if (_newFiber3 === null) {
          continue;
        }

        lastPlacedIndex = placeChild(_newFiber3, lastPlacedIndex, newIdx);

        if (previousNewFiber === null) {
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = _newFiber3;
        } else {
          previousNewFiber.sibling = _newFiber3;
        }

        previousNewFiber = _newFiber3;
      }

      return resultingFirstChild;
    } // Add all children to a key map for quick lookups.

    var existingChildren = mapRemainingChildren(returnFiber, oldFiber); // Keep scanning and use the map to restore deleted items as moves.

    for (; !step.done; newIdx++, step = newChildren.next()) {
      var _newFiber4 = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        step.value,
        expirationTime
      );

      if (_newFiber4 !== null) {
        if (shouldTrackSideEffects) {
          if (_newFiber4.alternate !== null) {
            // The new fiber is a work in progress, but if there exists a
            // current, that means that we reused the fiber. We need to delete
            // it from the child list so that we don't add it to the deletion
            // list.
            existingChildren.delete(
              _newFiber4.key === null ? newIdx : _newFiber4.key
            );
          }
        }

        lastPlacedIndex = placeChild(_newFiber4, lastPlacedIndex, newIdx);

        if (previousNewFiber === null) {
          resultingFirstChild = _newFiber4;
        } else {
          previousNewFiber.sibling = _newFiber4;
        }

        previousNewFiber = _newFiber4;
      }
    }

    if (shouldTrackSideEffects) {
      // Any existing children that weren't consumed above were deleted. We need
      // to add them to the deletion list.
      existingChildren.forEach(function(child) {
        return deleteChild(returnFiber, child);
      });
    }

    return resultingFirstChild;
  }

  function reconcileSingleTextNode(
    returnFiber,
    currentFirstChild,
    textContent,
    expirationTime
  ) {
    // There's no need to check for keys on text nodes since we don't have a
    // way to define them.
    if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
      // We already have an existing node so let's just update it and delete
      // the rest.
      deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
      var existing = useFiber(currentFirstChild, textContent, expirationTime);
      existing.return = returnFiber;
      return existing;
    } // The existing first child is not a text node so we need to create one
    // and delete the existing ones.

    deleteRemainingChildren(returnFiber, currentFirstChild);
    var created = createFiberFromText(
      textContent,
      returnFiber.mode,
      expirationTime
    );
    created.return = returnFiber;
    return created;
  }

  function reconcileSingleElement(
    returnFiber,
    currentFirstChild,
    element,
    expirationTime
  ) {
    var key = element.key;
    var child = currentFirstChild;

    while (child !== null) {
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (child.key === key) {
        if (
          child.tag === Fragment
            ? element.type === REACT_FRAGMENT_TYPE
            : child.elementType === element.type || // Keep this check inline so it only runs on the false path:
              isCompatibleFamilyForHotReloading(child, element)
        ) {
          deleteRemainingChildren(returnFiber, child.sibling);
          var existing = useFiber(
            child,
            element.type === REACT_FRAGMENT_TYPE
              ? element.props.children
              : element.props,
            expirationTime
          );
          existing.ref = coerceRef(returnFiber, child, element);
          existing.return = returnFiber;

          {
            existing._debugSource = element._source;
            existing._debugOwner = element._owner;
          }

          return existing;
        } else {
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else {
        deleteChild(returnFiber, child);
      }

      child = child.sibling;
    }

    if (element.type === REACT_FRAGMENT_TYPE) {
      var created = createFiberFromFragment(
        element.props.children,
        returnFiber.mode,
        expirationTime,
        element.key
      );
      created.return = returnFiber;
      return created;
    } else {
      var _created4 = createFiberFromElement(
        element,
        returnFiber.mode,
        expirationTime
      );

      _created4.ref = coerceRef(returnFiber, currentFirstChild, element);
      _created4.return = returnFiber;
      return _created4;
    }
  }

  function reconcileSinglePortal(
    returnFiber,
    currentFirstChild,
    portal,
    expirationTime
  ) {
    var key = portal.key;
    var child = currentFirstChild;

    while (child !== null) {
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (child.key === key) {
        if (
          child.tag === HostPortal &&
          child.stateNode.containerInfo === portal.containerInfo &&
          child.stateNode.implementation === portal.implementation
        ) {
          deleteRemainingChildren(returnFiber, child.sibling);
          var existing = useFiber(child, portal.children || [], expirationTime);
          existing.return = returnFiber;
          return existing;
        } else {
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else {
        deleteChild(returnFiber, child);
      }

      child = child.sibling;
    }

    var created = createFiberFromPortal(
      portal,
      returnFiber.mode,
      expirationTime
    );
    created.return = returnFiber;
    return created;
  } // This API will tag the children with the side-effect of the reconciliation
  // itself. They will be added to the side-effect list as we pass through the
  // children and the parent.

  function reconcileChildFibers(
    returnFiber,
    currentFirstChild,
    newChild,
    expirationTime
  ) {
    // This function is not recursive.
    // If the top level item is an array, we treat it as a set of children,
    // not as a fragment. Nested arrays on the other hand will be treated as
    // fragment nodes. Recursion happens at the normal flow.
    // Handle top level unkeyed fragments as if they were arrays.
    // This leads to an ambiguity between <>{[...]}</> and <>...</>.
    // We treat the ambiguous cases above the same.
    var isUnkeyedTopLevelFragment =
      typeof newChild === "object" &&
      newChild !== null &&
      newChild.type === REACT_FRAGMENT_TYPE &&
      newChild.key === null;

    if (isUnkeyedTopLevelFragment) {
      newChild = newChild.props.children;
    } // Handle object types

    var isObject = typeof newChild === "object" && newChild !== null;

    if (isObject) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(
              returnFiber,
              currentFirstChild,
              newChild,
              expirationTime
            )
          );

        case REACT_PORTAL_TYPE:
          return placeSingleChild(
            reconcileSinglePortal(
              returnFiber,
              currentFirstChild,
              newChild,
              expirationTime
            )
          );
      }
    }

    if (typeof newChild === "string" || typeof newChild === "number") {
      return placeSingleChild(
        reconcileSingleTextNode(
          returnFiber,
          currentFirstChild,
          "" + newChild,
          expirationTime
        )
      );
    }

    if (isArray(newChild)) {
      return reconcileChildrenArray(
        returnFiber,
        currentFirstChild,
        newChild,
        expirationTime
      );
    }

    if (getIteratorFn(newChild)) {
      return reconcileChildrenIterator(
        returnFiber,
        currentFirstChild,
        newChild,
        expirationTime
      );
    }

    if (isObject) {
      throwOnInvalidObjectType(returnFiber, newChild);
    }

    {
      if (typeof newChild === "function") {
        warnOnFunctionType();
      }
    }

    if (typeof newChild === "undefined" && !isUnkeyedTopLevelFragment) {
      // If the new child is undefined, and the return fiber is a composite
      // component, throw an error. If Fiber return types are disabled,
      // we already threw above.
      switch (returnFiber.tag) {
        case ClassComponent: {
          {
            var instance = returnFiber.stateNode;

            if (instance.render._isMockFunction) {
              // We allow auto-mocks to proceed as if they're returning null.
              break;
            }
          }
        }
        // Intentionally fall through to the next case, which handles both
        // functions and classes
        // eslint-disable-next-lined no-fallthrough

        case FunctionComponent: {
          var Component = returnFiber.type;

          {
            throw Error(
              (Component.displayName || Component.name || "Component") +
                "(...): Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null."
            );
          }
        }
      }
    } // Remaining cases are all treated as empty.

    return deleteRemainingChildren(returnFiber, currentFirstChild);
  }

  return reconcileChildFibers;
}

var reconcileChildFibers = ChildReconciler(true);
var mountChildFibers = ChildReconciler(false);
function cloneChildFibers(current$$1, workInProgress) {
  if (!(current$$1 === null || workInProgress.child === current$$1.child)) {
    throw Error("Resuming work not yet implemented.");
  }

  if (workInProgress.child === null) {
    return;
  }

  var currentChild = workInProgress.child;
  var newChild = createWorkInProgress(
    currentChild,
    currentChild.pendingProps,
    currentChild.expirationTime
  );
  workInProgress.child = newChild;
  newChild.return = workInProgress;

  while (currentChild.sibling !== null) {
    currentChild = currentChild.sibling;
    newChild = newChild.sibling = createWorkInProgress(
      currentChild,
      currentChild.pendingProps,
      currentChild.expirationTime
    );
    newChild.return = workInProgress;
  }

  newChild.sibling = null;
} // Reset a workInProgress child set to prepare it for a second pass.

function resetChildFibers(workInProgress, renderExpirationTime) {
  var child = workInProgress.child;

  while (child !== null) {
    resetWorkInProgress(child, renderExpirationTime);
    child = child.sibling;
  }
}

var NO_CONTEXT = {};
var contextStackCursor$1 = createCursor(NO_CONTEXT);
var contextFiberStackCursor = createCursor(NO_CONTEXT);
var rootInstanceStackCursor = createCursor(NO_CONTEXT);

function requiredContext(c) {
  if (!(c !== NO_CONTEXT)) {
    throw Error(
      "Expected host context to exist. This error is likely caused by a bug in React. Please file an issue."
    );
  }

  return c;
}

function getRootHostContainer() {
  var rootInstance = requiredContext(rootInstanceStackCursor.current);
  return rootInstance;
}

function pushHostContainer(fiber, nextRootInstance) {
  // Push current root instance onto the stack;
  // This allows us to reset root when portals are popped.
  push(rootInstanceStackCursor, nextRootInstance, fiber); // Track the context and the Fiber that provided it.
  // This enables us to pop only Fibers that provide unique contexts.

  push(contextFiberStackCursor, fiber, fiber); // Finally, we need to push the host context to the stack.
  // However, we can't just call getRootHostContext() and push it because
  // we'd have a different number of entries on the stack depending on
  // whether getRootHostContext() throws somewhere in renderer code or not.
  // So we push an empty value first. This lets us safely unwind on errors.

  push(contextStackCursor$1, NO_CONTEXT, fiber);
  var nextRootContext = getRootHostContext(nextRootInstance); // Now that we know this function doesn't throw, replace it.

  pop(contextStackCursor$1, fiber);
  push(contextStackCursor$1, nextRootContext, fiber);
}

function popHostContainer(fiber) {
  pop(contextStackCursor$1, fiber);
  pop(contextFiberStackCursor, fiber);
  pop(rootInstanceStackCursor, fiber);
}

function getHostContext() {
  var context = requiredContext(contextStackCursor$1.current);
  return context;
}

function pushHostContext(fiber) {
  var rootInstance = requiredContext(rootInstanceStackCursor.current);
  var context = requiredContext(contextStackCursor$1.current);
  var nextContext = getChildHostContext(context, fiber.type, rootInstance); // Don't push this Fiber's context unless it's unique.

  if (context === nextContext) {
    return;
  } // Track the context and the Fiber that provided it.
  // This enables us to pop only Fibers that provide unique contexts.

  push(contextFiberStackCursor, fiber, fiber);
  push(contextStackCursor$1, nextContext, fiber);
}

function popHostContext(fiber) {
  // Do not pop unless this Fiber provided the current context.
  // pushHostContext() only pushes Fibers that provide unique contexts.
  if (contextFiberStackCursor.current !== fiber) {
    return;
  }

  pop(contextStackCursor$1, fiber);
  pop(contextFiberStackCursor, fiber);
}

var DefaultSuspenseContext = 0; // The Suspense Context is split into two parts. The lower bits is
// inherited deeply down the subtree. The upper bits only affect
// this immediate suspense boundary and gets reset each new
// boundary or suspense list.

var SubtreeSuspenseContextMask = 1; // Subtree Flags:
// InvisibleParentSuspenseContext indicates that one of our parent Suspense
// boundaries is not currently showing visible main content.
// Either because it is already showing a fallback or is not mounted at all.
// We can use this to determine if it is desirable to trigger a fallback at
// the parent. If not, then we might need to trigger undesirable boundaries
// and/or suspend the commit to avoid hiding the parent content.

var InvisibleParentSuspenseContext = 1; // Shallow Flags:
// ForceSuspenseFallback can be used by SuspenseList to force newly added
// items into their fallback state during one of the render passes.

var ForceSuspenseFallback = 2;
var suspenseStackCursor = createCursor(DefaultSuspenseContext);
function hasSuspenseContext(parentContext, flag) {
  return (parentContext & flag) !== 0;
}
function setDefaultShallowSuspenseContext(parentContext) {
  return parentContext & SubtreeSuspenseContextMask;
}
function setShallowSuspenseContext(parentContext, shallowContext) {
  return (parentContext & SubtreeSuspenseContextMask) | shallowContext;
}
function addSubtreeSuspenseContext(parentContext, subtreeContext) {
  return parentContext | subtreeContext;
}
function pushSuspenseContext(fiber, newContext) {
  push(suspenseStackCursor, newContext, fiber);
}
function popSuspenseContext(fiber) {
  pop(suspenseStackCursor, fiber);
}

function shouldCaptureSuspense(workInProgress, hasInvisibleParent) {
  // If it was the primary children that just suspended, capture and render the
  // fallback. Otherwise, don't capture and bubble to the next boundary.
  var nextState = workInProgress.memoizedState;

  if (nextState !== null) {
    if (nextState.dehydrated !== null) {
      // A dehydrated boundary always captures.
      return true;
    }

    return false;
  }

  var props = workInProgress.memoizedProps; // In order to capture, the Suspense component must have a fallback prop.

  if (props.fallback === undefined) {
    return false;
  } // Regular boundaries always capture.

  if (props.unstable_avoidThisFallback !== true) {
    return true;
  } // If it's a boundary we should avoid, then we prefer to bubble up to the
  // parent boundary if it is currently invisible.

  if (hasInvisibleParent) {
    return false;
  } // If the parent is not able to handle it, we must handle it.

  return true;
}
function findFirstSuspended(row) {
  var node = row;

  while (node !== null) {
    if (node.tag === SuspenseComponent) {
      var state = node.memoizedState;

      if (state !== null) {
        var dehydrated = state.dehydrated;

        if (
          dehydrated === null ||
          isSuspenseInstancePending(dehydrated) ||
          isSuspenseInstanceFallback(dehydrated)
        ) {
          return node;
        }
      }
    } else if (
      node.tag === SuspenseListComponent && // revealOrder undefined can't be trusted because it don't
      // keep track of whether it suspended or not.
      node.memoizedProps.revealOrder !== undefined
    ) {
      var didSuspend = (node.effectTag & DidCapture) !== NoEffect;

      if (didSuspend) {
        return node;
      }
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    if (node === row) {
      return null;
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === row) {
        return null;
      }

      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;
  }

  return null;
}

var emptyObject$1 = {};
var isArray$2 = Array.isArray;
function createResponderInstance(
  responder,
  responderProps,
  responderState,
  fiber
) {
  return {
    fiber: fiber,
    props: responderProps,
    responder: responder,
    rootEventTypes: null,
    state: responderState
  };
}

function mountEventResponder$1(
  responder,
  responderProps,
  fiber,
  respondersMap,
  rootContainerInstance
) {
  var responderState = emptyObject$1;
  var getInitialState = responder.getInitialState;

  if (getInitialState !== null) {
    responderState = getInitialState(responderProps);
  }

  var responderInstance = createResponderInstance(
    responder,
    responderProps,
    responderState,
    fiber
  );

  if (!rootContainerInstance) {
    var node = fiber;

    while (node !== null) {
      var tag = node.tag;

      if (tag === HostComponent) {
        rootContainerInstance = node.stateNode;
        break;
      } else if (tag === HostRoot) {
        rootContainerInstance = node.stateNode.containerInfo;
        break;
      }

      node = node.return;
    }
  }

  mountResponderInstance(
    responder,
    responderInstance,
    responderProps,
    responderState,
    rootContainerInstance
  );
  respondersMap.set(responder, responderInstance);
}

function updateEventListener(
  listener,
  fiber,
  visistedResponders,
  respondersMap,
  rootContainerInstance
) {
  var responder;
  var props;

  if (listener) {
    responder = listener.responder;
    props = listener.props;
  }

  if (!(responder && responder.$$typeof === REACT_RESPONDER_TYPE)) {
    throw Error(
      "An invalid value was used as an event listener. Expect one or many event listeners created via React.unstable_useResponder()."
    );
  }

  var listenerProps = props;

  if (visistedResponders.has(responder)) {
    // show warning
    {
      warning$1(
        false,
        'Duplicate event responder "%s" found in event listeners. ' +
          "Event listeners passed to elements cannot use the same event responder more than once.",
        responder.displayName
      );
    }

    return;
  }

  visistedResponders.add(responder);
  var responderInstance = respondersMap.get(responder);

  if (responderInstance === undefined) {
    // Mount (happens in either complete or commit phase)
    mountEventResponder$1(
      responder,
      listenerProps,
      fiber,
      respondersMap,
      rootContainerInstance
    );
  } else {
    // Update (happens during commit phase only)
    responderInstance.props = listenerProps;
    responderInstance.fiber = fiber;
  }
}

function updateEventListeners(listeners, fiber, rootContainerInstance) {
  var visistedResponders = new Set();
  var dependencies = fiber.dependencies;

  if (listeners != null) {
    if (dependencies === null) {
      dependencies = fiber.dependencies = {
        expirationTime: NoWork,
        firstContext: null,
        responders: new Map()
      };
    }

    var respondersMap = dependencies.responders;

    if (respondersMap === null) {
      respondersMap = new Map();
    }

    if (isArray$2(listeners)) {
      for (var i = 0, length = listeners.length; i < length; i++) {
        var listener = listeners[i];
        updateEventListener(
          listener,
          fiber,
          visistedResponders,
          respondersMap,
          rootContainerInstance
        );
      }
    } else {
      updateEventListener(
        listeners,
        fiber,
        visistedResponders,
        respondersMap,
        rootContainerInstance
      );
    }
  }

  if (dependencies !== null) {
    var _respondersMap = dependencies.responders;

    if (_respondersMap !== null) {
      // Unmount
      var mountedResponders = Array.from(_respondersMap.keys());

      for (var _i = 0, _length = mountedResponders.length; _i < _length; _i++) {
        var mountedResponder = mountedResponders[_i];

        if (!visistedResponders.has(mountedResponder)) {
          var responderInstance = _respondersMap.get(mountedResponder);

          unmountResponderInstance(responderInstance);

          _respondersMap.delete(mountedResponder);
        }
      }
    }
  }
}
function createResponderListener(responder, props) {
  var eventResponderListener = {
    responder: responder,
    props: props
  };

  {
    Object.freeze(eventResponderListener);
  }

  return eventResponderListener;
}

var NoEffect$1 =
  /*             */
  0;
var UnmountSnapshot =
  /*      */
  2;
var UnmountMutation =
  /*      */
  4;
var MountMutation =
  /*        */
  8;
var UnmountLayout =
  /*        */
  16;
var MountLayout =
  /*          */
  32;
var MountPassive =
  /*         */
  64;
var UnmountPassive =
  /*       */
  128;

var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
var ReactCurrentBatchConfig$1 = ReactSharedInternals.ReactCurrentBatchConfig;
var didWarnAboutMismatchedHooksForComponent;

{
  didWarnAboutMismatchedHooksForComponent = new Set();
}

// These are set right before calling the component.
var renderExpirationTime$1 = NoWork; // The work-in-progress fiber. I've named it differently to distinguish it from
// the work-in-progress hook.

var currentlyRenderingFiber$1 = null; // Hooks are stored as a linked list on the fiber's memoizedState field. The
// current hook list is the list that belongs to the current fiber. The
// work-in-progress hook list is a new list that will be added to the
// work-in-progress fiber.

var currentHook = null;
var nextCurrentHook = null;
var firstWorkInProgressHook = null;
var workInProgressHook = null;
var nextWorkInProgressHook = null;
var remainingExpirationTime = NoWork;
var componentUpdateQueue = null;
var sideEffectTag = 0; // Updates scheduled during render will trigger an immediate re-render at the
// end of the current pass. We can't store these updates on the normal queue,
// because if the work is aborted, they should be discarded. Because this is
// a relatively rare case, we also don't want to add an additional field to
// either the hook or queue object types. So we store them in a lazily create
// map of queue -> render-phase updates, which are discarded once the component
// completes without re-rendering.
// Whether an update was scheduled during the currently executing render pass.

var didScheduleRenderPhaseUpdate = false; // Lazily created map of render-phase updates

var renderPhaseUpdates = null; // Counter to prevent infinite loops.

var numberOfReRenders = 0;
var RE_RENDER_LIMIT = 25; // In DEV, this is the name of the currently executing primitive hook

var currentHookNameInDev = null; // In DEV, this list ensures that hooks are called in the same order between renders.
// The list stores the order of hooks used during the initial render (mount).
// Subsequent renders (updates) reference this list.

var hookTypesDev = null;
var hookTypesUpdateIndexDev = -1; // In DEV, this tracks whether currently rendering component needs to ignore
// the dependencies for Hooks that need them (e.g. useEffect or useMemo).
// When true, such Hooks will always be "remounted". Only used during hot reload.

var ignorePreviousDependencies = false;

function mountHookTypesDev() {
  {
    var hookName = currentHookNameInDev;

    if (hookTypesDev === null) {
      hookTypesDev = [hookName];
    } else {
      hookTypesDev.push(hookName);
    }
  }
}

function updateHookTypesDev() {
  {
    var hookName = currentHookNameInDev;

    if (hookTypesDev !== null) {
      hookTypesUpdateIndexDev++;

      if (hookTypesDev[hookTypesUpdateIndexDev] !== hookName) {
        warnOnHookMismatchInDev(hookName);
      }
    }
  }
}

function checkDepsAreArrayDev(deps) {
  {
    if (deps !== undefined && deps !== null && !Array.isArray(deps)) {
      // Verify deps, but only on mount to avoid extra checks.
      // It's unlikely their type would change as usually you define them inline.
      warning$1(
        false,
        "%s received a final argument that is not an array (instead, received `%s`). When " +
          "specified, the final argument must be an array.",
        currentHookNameInDev,
        typeof deps
      );
    }
  }
}

function warnOnHookMismatchInDev(currentHookName) {
  {
    var componentName = getComponentName(currentlyRenderingFiber$1.type);

    if (!didWarnAboutMismatchedHooksForComponent.has(componentName)) {
      didWarnAboutMismatchedHooksForComponent.add(componentName);

      if (hookTypesDev !== null) {
        var table = "";
        var secondColumnStart = 30;

        for (var i = 0; i <= hookTypesUpdateIndexDev; i++) {
          var oldHookName = hookTypesDev[i];
          var newHookName =
            i === hookTypesUpdateIndexDev ? currentHookName : oldHookName;
          var row = i + 1 + ". " + oldHookName; // Extra space so second column lines up
          // lol @ IE not supporting String#repeat

          while (row.length < secondColumnStart) {
            row += " ";
          }

          row += newHookName + "\n";
          table += row;
        }

        warning$1(
          false,
          "React has detected a change in the order of Hooks called by %s. " +
            "This will lead to bugs and errors if not fixed. " +
            "For more information, read the Rules of Hooks: https://fb.me/rules-of-hooks\n\n" +
            "   Previous render            Next render\n" +
            "   ------------------------------------------------------\n" +
            "%s" +
            "   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n",
          componentName,
          table
        );
      }
    }
  }
}

function throwInvalidHookError() {
  {
    throw Error(
      "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem."
    );
  }
}

function areHookInputsEqual(nextDeps, prevDeps) {
  {
    if (ignorePreviousDependencies) {
      // Only true when this component is being hot reloaded.
      return false;
    }
  }

  if (prevDeps === null) {
    {
      warning$1(
        false,
        "%s received a final argument during this render, but not during " +
          "the previous render. Even though the final argument is optional, " +
          "its type cannot change between renders.",
        currentHookNameInDev
      );
    }

    return false;
  }

  {
    // Don't bother comparing lengths in prod because these arrays should be
    // passed inline.
    if (nextDeps.length !== prevDeps.length) {
      warning$1(
        false,
        "The final argument passed to %s changed size between renders. The " +
          "order and size of this array must remain constant.\n\n" +
          "Previous: %s\n" +
          "Incoming: %s",
        currentHookNameInDev,
        "[" + prevDeps.join(", ") + "]",
        "[" + nextDeps.join(", ") + "]"
      );
    }
  }

  for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (is$1(nextDeps[i], prevDeps[i])) {
      continue;
    }

    return false;
  }

  return true;
}

function renderWithHooks(
  current,
  workInProgress,
  Component,
  props,
  refOrContext,
  nextRenderExpirationTime
) {
  renderExpirationTime$1 = nextRenderExpirationTime;
  currentlyRenderingFiber$1 = workInProgress;
  nextCurrentHook = current !== null ? current.memoizedState : null;

  {
    hookTypesDev = current !== null ? current._debugHookTypes : null;
    hookTypesUpdateIndexDev = -1; // Used for hot reloading:

    ignorePreviousDependencies =
      current !== null && current.type !== workInProgress.type;
  } // The following should have already been reset
  // currentHook = null;
  // workInProgressHook = null;
  // remainingExpirationTime = NoWork;
  // componentUpdateQueue = null;
  // didScheduleRenderPhaseUpdate = false;
  // renderPhaseUpdates = null;
  // numberOfReRenders = 0;
  // sideEffectTag = 0;
  // TODO Warn if no hooks are used at all during mount, then some are used during update.
  // Currently we will identify the update render as a mount because nextCurrentHook === null.
  // This is tricky because it's valid for certain types of components (e.g. React.lazy)
  // Using nextCurrentHook to differentiate between mount/update only works if at least one stateful hook is used.
  // Non-stateful hooks (e.g. context) don't get added to memoizedState,
  // so nextCurrentHook would be null during updates and mounts.

  {
    if (nextCurrentHook !== null) {
      ReactCurrentDispatcher$1.current = HooksDispatcherOnUpdateInDEV;
    } else if (hookTypesDev !== null) {
      // This dispatcher handles an edge case where a component is updating,
      // but no stateful hooks have been used.
      // We want to match the production code behavior (which will use HooksDispatcherOnMount),
      // but with the extra DEV validation to ensure hooks ordering hasn't changed.
      // This dispatcher does that.
      ReactCurrentDispatcher$1.current = HooksDispatcherOnMountWithHookTypesInDEV;
    } else {
      ReactCurrentDispatcher$1.current = HooksDispatcherOnMountInDEV;
    }
  }

  var children = Component(props, refOrContext);

  if (didScheduleRenderPhaseUpdate) {
    do {
      didScheduleRenderPhaseUpdate = false;
      numberOfReRenders += 1;

      {
        // Even when hot reloading, allow dependencies to stabilize
        // after first render to prevent infinite render phase updates.
        ignorePreviousDependencies = false;
      } // Start over from the beginning of the list

      nextCurrentHook = current !== null ? current.memoizedState : null;
      nextWorkInProgressHook = firstWorkInProgressHook;
      currentHook = null;
      workInProgressHook = null;
      componentUpdateQueue = null;

      {
        // Also validate hook order for cascading updates.
        hookTypesUpdateIndexDev = -1;
      }

      ReactCurrentDispatcher$1.current = HooksDispatcherOnUpdateInDEV;
      children = Component(props, refOrContext);
    } while (didScheduleRenderPhaseUpdate);

    renderPhaseUpdates = null;
    numberOfReRenders = 0;
  } // We can assume the previous dispatcher is always this one, since we set it
  // at the beginning of the render phase and there's no re-entrancy.

  ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
  var renderedWork = currentlyRenderingFiber$1;
  renderedWork.memoizedState = firstWorkInProgressHook;
  renderedWork.expirationTime = remainingExpirationTime;
  renderedWork.updateQueue = componentUpdateQueue;
  renderedWork.effectTag |= sideEffectTag;

  {
    renderedWork._debugHookTypes = hookTypesDev;
  } // This check uses currentHook so that it works the same in DEV and prod bundles.
  // hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.

  var didRenderTooFewHooks = currentHook !== null && currentHook.next !== null;
  renderExpirationTime$1 = NoWork;
  currentlyRenderingFiber$1 = null;
  currentHook = null;
  nextCurrentHook = null;
  firstWorkInProgressHook = null;
  workInProgressHook = null;
  nextWorkInProgressHook = null;

  {
    currentHookNameInDev = null;
    hookTypesDev = null;
    hookTypesUpdateIndexDev = -1;
  }

  remainingExpirationTime = NoWork;
  componentUpdateQueue = null;
  sideEffectTag = 0; // These were reset above
  // didScheduleRenderPhaseUpdate = false;
  // renderPhaseUpdates = null;
  // numberOfReRenders = 0;

  if (!!didRenderTooFewHooks) {
    throw Error(
      "Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
    );
  }

  return children;
}
function bailoutHooks(current, workInProgress, expirationTime) {
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.effectTag &= ~(Passive | Update);

  if (current.expirationTime <= expirationTime) {
    current.expirationTime = NoWork;
  }
}
function resetHooks() {
  // We can assume the previous dispatcher is always this one, since we set it
  // at the beginning of the render phase and there's no re-entrancy.
  ReactCurrentDispatcher$1.current = ContextOnlyDispatcher; // This is used to reset the state of this module when a component throws.
  // It's also called inside mountIndeterminateComponent if we determine the
  // component is a module-style component.

  renderExpirationTime$1 = NoWork;
  currentlyRenderingFiber$1 = null;
  currentHook = null;
  nextCurrentHook = null;
  firstWorkInProgressHook = null;
  workInProgressHook = null;
  nextWorkInProgressHook = null;

  {
    hookTypesDev = null;
    hookTypesUpdateIndexDev = -1;
    currentHookNameInDev = null;
  }

  remainingExpirationTime = NoWork;
  componentUpdateQueue = null;
  sideEffectTag = 0;
  didScheduleRenderPhaseUpdate = false;
  renderPhaseUpdates = null;
  numberOfReRenders = 0;
}

function mountWorkInProgressHook() {
  var hook = {
    memoizedState: null,
    baseState: null,
    queue: null,
    baseUpdate: null,
    next: null
  };

  if (workInProgressHook === null) {
    // This is the first hook in the list
    firstWorkInProgressHook = workInProgressHook = hook;
  } else {
    // Append to the end of the list
    workInProgressHook = workInProgressHook.next = hook;
  }

  return workInProgressHook;
}

function updateWorkInProgressHook() {
  // This function is used both for updates and for re-renders triggered by a
  // render phase update. It assumes there is either a current hook we can
  // clone, or a work-in-progress hook from a previous render pass that we can
  // use as a base. When we reach the end of the base list, we must switch to
  // the dispatcher used for mounts.
  if (nextWorkInProgressHook !== null) {
    // There's already a work-in-progress. Reuse it.
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;
    currentHook = nextCurrentHook;
    nextCurrentHook = currentHook !== null ? currentHook.next : null;
  } else {
    // Clone from the current hook.
    if (!(nextCurrentHook !== null)) {
      throw Error("Rendered more hooks than during the previous render.");
    }

    currentHook = nextCurrentHook;
    var newHook = {
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      queue: currentHook.queue,
      baseUpdate: currentHook.baseUpdate,
      next: null
    };

    if (workInProgressHook === null) {
      // This is the first hook in the list.
      workInProgressHook = firstWorkInProgressHook = newHook;
    } else {
      // Append to the end of the list.
      workInProgressHook = workInProgressHook.next = newHook;
    }

    nextCurrentHook = currentHook.next;
  }

  return workInProgressHook;
}

function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: null
  };
}

function basicStateReducer(state, action) {
  return typeof action === "function" ? action(state) : action;
}

function mountReducer(reducer, initialArg, init) {
  var hook = mountWorkInProgressHook();
  var initialState;

  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = initialArg;
  }

  hook.memoizedState = hook.baseState = initialState;
  var queue = (hook.queue = {
    last: null,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: initialState
  });
  var dispatch = (queue.dispatch = dispatchAction.bind(
    null, // Flow doesn't know this is non-null, but we do.
    currentlyRenderingFiber$1,
    queue
  ));
  return [hook.memoizedState, dispatch];
}

function updateReducer(reducer, initialArg, init) {
  var hook = updateWorkInProgressHook();
  var queue = hook.queue;

  if (!(queue !== null)) {
    throw Error(
      "Should have a queue. This is likely a bug in React. Please file an issue."
    );
  }

  queue.lastRenderedReducer = reducer;

  if (numberOfReRenders > 0) {
    // This is a re-render. Apply the new render phase updates to the previous
    // work-in-progress hook.
    var _dispatch = queue.dispatch;

    if (renderPhaseUpdates !== null) {
      // Render phase updates are stored in a map of queue -> linked list
      var firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);

      if (firstRenderPhaseUpdate !== undefined) {
        renderPhaseUpdates.delete(queue);
        var newState = hook.memoizedState;
        var update = firstRenderPhaseUpdate;

        do {
          // Process this render phase update. We don't have to check the
          // priority because it will always be the same as the current
          // render's.
          var action = update.action;
          newState = reducer(newState, action);
          update = update.next;
        } while (update !== null); // Mark that the fiber performed work, but only if the new state is
        // different from the current state.

        if (!is$1(newState, hook.memoizedState)) {
          markWorkInProgressReceivedUpdate();
        }

        hook.memoizedState = newState; // Don't persist the state accumulated from the render phase updates to
        // the base state unless the queue is empty.
        // TODO: Not sure if this is the desired semantics, but it's what we
        // do for gDSFP. I can't remember why.

        if (hook.baseUpdate === queue.last) {
          hook.baseState = newState;
        }

        queue.lastRenderedState = newState;
        return [newState, _dispatch];
      }
    }

    return [hook.memoizedState, _dispatch];
  } // The last update in the entire queue

  var last = queue.last; // The last update that is part of the base state.

  var baseUpdate = hook.baseUpdate;
  var baseState = hook.baseState; // Find the first unprocessed update.

  var first;

  if (baseUpdate !== null) {
    if (last !== null) {
      // For the first update, the queue is a circular linked list where
      // `queue.last.next = queue.first`. Once the first update commits, and
      // the `baseUpdate` is no longer empty, we can unravel the list.
      last.next = null;
    }

    first = baseUpdate.next;
  } else {
    first = last !== null ? last.next : null;
  }

  if (first !== null) {
    var _newState = baseState;
    var newBaseState = null;
    var newBaseUpdate = null;
    var prevUpdate = baseUpdate;
    var _update = first;
    var didSkip = false;

    do {
      var updateExpirationTime = _update.expirationTime;

      if (updateExpirationTime < renderExpirationTime$1) {
        // Priority is insufficient. Skip this update. If this is the first
        // skipped update, the previous update/state is the new base
        // update/state.
        if (!didSkip) {
          didSkip = true;
          newBaseUpdate = prevUpdate;
          newBaseState = _newState;
        } // Update the remaining priority in the queue.

        if (updateExpirationTime > remainingExpirationTime) {
          remainingExpirationTime = updateExpirationTime;
          markUnprocessedUpdateTime(remainingExpirationTime);
        }
      } else {
        // This update does have sufficient priority.
        // Mark the event time of this update as relevant to this render pass.
        // TODO: This should ideally use the true event time of this update rather than
        // its priority which is a derived and not reverseable value.
        // TODO: We should skip this update if it was already committed but currently
        // we have no way of detecting the difference between a committed and suspended
        // update here.
        markRenderEventTimeAndConfig(
          updateExpirationTime,
          _update.suspenseConfig
        ); // Process this update.

        if (_update.eagerReducer === reducer) {
          // If this update was processed eagerly, and its reducer matches the
          // current reducer, we can use the eagerly computed state.
          _newState = _update.eagerState;
        } else {
          var _action = _update.action;
          _newState = reducer(_newState, _action);
        }
      }

      prevUpdate = _update;
      _update = _update.next;
    } while (_update !== null && _update !== first);

    if (!didSkip) {
      newBaseUpdate = prevUpdate;
      newBaseState = _newState;
    } // Mark that the fiber performed work, but only if the new state is
    // different from the current state.

    if (!is$1(_newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();
    }

    hook.memoizedState = _newState;
    hook.baseUpdate = newBaseUpdate;
    hook.baseState = newBaseState;
    queue.lastRenderedState = _newState;
  }

  var dispatch = queue.dispatch;
  return [hook.memoizedState, dispatch];
}

function mountState(initialState) {
  var hook = mountWorkInProgressHook();

  if (typeof initialState === "function") {
    initialState = initialState();
  }

  hook.memoizedState = hook.baseState = initialState;
  var queue = (hook.queue = {
    last: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState
  });
  var dispatch = (queue.dispatch = dispatchAction.bind(
    null, // Flow doesn't know this is non-null, but we do.
    currentlyRenderingFiber$1,
    queue
  ));
  return [hook.memoizedState, dispatch];
}

function updateState(initialState) {
  return updateReducer(basicStateReducer, initialState);
}

function pushEffect(tag, create, destroy, deps) {
  var effect = {
    tag: tag,
    create: create,
    destroy: destroy,
    deps: deps,
    // Circular
    next: null
  };

  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    var lastEffect = componentUpdateQueue.lastEffect;

    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      var firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }

  return effect;
}

function mountRef(initialValue) {
  var hook = mountWorkInProgressHook();
  var ref = {
    current: initialValue
  };

  {
    Object.seal(ref);
  }

  hook.memoizedState = ref;
  return ref;
}

function updateRef(initialValue) {
  var hook = updateWorkInProgressHook();
  return hook.memoizedState;
}

function mountEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
  var hook = mountWorkInProgressHook();
  var nextDeps = deps === undefined ? null : deps;
  sideEffectTag |= fiberEffectTag;
  hook.memoizedState = pushEffect(hookEffectTag, create, undefined, nextDeps);
}

function updateEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
  var hook = updateWorkInProgressHook();
  var nextDeps = deps === undefined ? null : deps;
  var destroy = undefined;

  if (currentHook !== null) {
    var prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;

    if (nextDeps !== null) {
      var prevDeps = prevEffect.deps;

      if (areHookInputsEqual(nextDeps, prevDeps)) {
        pushEffect(NoEffect$1, create, destroy, nextDeps);
        return;
      }
    }
  }

  sideEffectTag |= fiberEffectTag;
  hook.memoizedState = pushEffect(hookEffectTag, create, destroy, nextDeps);
}

function mountEffect(create, deps) {
  {
    // $FlowExpectedError - jest isn't a global, and isn't recognized outside of tests
    if ("undefined" !== typeof jest) {
      warnIfNotCurrentlyActingEffectsInDEV(currentlyRenderingFiber$1);
    }
  }

  return mountEffectImpl(
    Update | Passive,
    UnmountPassive | MountPassive,
    create,
    deps
  );
}

function updateEffect(create, deps) {
  {
    // $FlowExpectedError - jest isn't a global, and isn't recognized outside of tests
    if ("undefined" !== typeof jest) {
      warnIfNotCurrentlyActingEffectsInDEV(currentlyRenderingFiber$1);
    }
  }

  return updateEffectImpl(
    Update | Passive,
    UnmountPassive | MountPassive,
    create,
    deps
  );
}

function mountLayoutEffect(create, deps) {
  return mountEffectImpl(Update, UnmountMutation | MountLayout, create, deps);
}

function updateLayoutEffect(create, deps) {
  return updateEffectImpl(Update, UnmountMutation | MountLayout, create, deps);
}

function imperativeHandleEffect(create, ref) {
  if (typeof ref === "function") {
    var refCallback = ref;

    var _inst = create();

    refCallback(_inst);
    return function() {
      refCallback(null);
    };
  } else if (ref !== null && ref !== undefined) {
    var refObject = ref;

    {
      !refObject.hasOwnProperty("current")
        ? warning$1(
            false,
            "Expected useImperativeHandle() first argument to either be a " +
              "ref callback or React.createRef() object. Instead received: %s.",
            "an object with keys {" + Object.keys(refObject).join(", ") + "}"
          )
        : void 0;
    }

    var _inst2 = create();

    refObject.current = _inst2;
    return function() {
      refObject.current = null;
    };
  }
}

function mountImperativeHandle(ref, create, deps) {
  {
    !(typeof create === "function")
      ? warning$1(
          false,
          "Expected useImperativeHandle() second argument to be a function " +
            "that creates a handle. Instead received: %s.",
          create !== null ? typeof create : "null"
        )
      : void 0;
  } // TODO: If deps are provided, should we skip comparing the ref itself?

  var effectDeps =
    deps !== null && deps !== undefined ? deps.concat([ref]) : null;
  return mountEffectImpl(
    Update,
    UnmountMutation | MountLayout,
    imperativeHandleEffect.bind(null, create, ref),
    effectDeps
  );
}

function updateImperativeHandle(ref, create, deps) {
  {
    !(typeof create === "function")
      ? warning$1(
          false,
          "Expected useImperativeHandle() second argument to be a function " +
            "that creates a handle. Instead received: %s.",
          create !== null ? typeof create : "null"
        )
      : void 0;
  } // TODO: If deps are provided, should we skip comparing the ref itself?

  var effectDeps =
    deps !== null && deps !== undefined ? deps.concat([ref]) : null;
  return updateEffectImpl(
    Update,
    UnmountMutation | MountLayout,
    imperativeHandleEffect.bind(null, create, ref),
    effectDeps
  );
}

function mountDebugValue(value, formatterFn) {
  // This hook is normally a no-op.
  // The react-debug-hooks package injects its own implementation
  // so that e.g. DevTools can display custom hook values.
}

var updateDebugValue = mountDebugValue;

function mountCallback(callback, deps) {
  var hook = mountWorkInProgressHook();
  var nextDeps = deps === undefined ? null : deps;
  hook.memoizedState = [callback, nextDeps];
  return callback;
}

function updateCallback(callback, deps) {
  var hook = updateWorkInProgressHook();
  var nextDeps = deps === undefined ? null : deps;
  var prevState = hook.memoizedState;

  if (prevState !== null) {
    if (nextDeps !== null) {
      var prevDeps = prevState[1];

      if (areHookInputsEqual(nextDeps, prevDeps)) {
        return prevState[0];
      }
    }
  }

  hook.memoizedState = [callback, nextDeps];
  return callback;
}

function mountMemo(nextCreate, deps) {
  var hook = mountWorkInProgressHook();
  var nextDeps = deps === undefined ? null : deps;
  var nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function updateMemo(nextCreate, deps) {
  var hook = updateWorkInProgressHook();
  var nextDeps = deps === undefined ? null : deps;
  var prevState = hook.memoizedState;

  if (prevState !== null) {
    // Assume these are defined. If they're not, areHookInputsEqual will warn.
    if (nextDeps !== null) {
      var prevDeps = prevState[1];

      if (areHookInputsEqual(nextDeps, prevDeps)) {
        return prevState[0];
      }
    }
  }

  var nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function mountDeferredValue(value, config) {
  var _mountState = mountState(value),
    prevValue = _mountState[0],
    setValue = _mountState[1];

  mountEffect(
    function() {
      Scheduler.unstable_next(function() {
        var previousConfig = ReactCurrentBatchConfig$1.suspense;
        ReactCurrentBatchConfig$1.suspense =
          config === undefined ? null : config;

        try {
          setValue(value);
        } finally {
          ReactCurrentBatchConfig$1.suspense = previousConfig;
        }
      });
    },
    [value, config]
  );
  return prevValue;
}

function updateDeferredValue(value, config) {
  var _updateState = updateState(value),
    prevValue = _updateState[0],
    setValue = _updateState[1];

  updateEffect(
    function() {
      Scheduler.unstable_next(function() {
        var previousConfig = ReactCurrentBatchConfig$1.suspense;
        ReactCurrentBatchConfig$1.suspense =
          config === undefined ? null : config;

        try {
          setValue(value);
        } finally {
          ReactCurrentBatchConfig$1.suspense = previousConfig;
        }
      });
    },
    [value, config]
  );
  return prevValue;
}

function mountTransition(config) {
  var _mountState2 = mountState(false),
    isPending = _mountState2[0],
    setPending = _mountState2[1];

  var startTransition = mountCallback(
    function(callback) {
      setPending(true);
      Scheduler.unstable_next(function() {
        var previousConfig = ReactCurrentBatchConfig$1.suspense;
        ReactCurrentBatchConfig$1.suspense =
          config === undefined ? null : config;

        try {
          setPending(false);
          callback();
        } finally {
          ReactCurrentBatchConfig$1.suspense = previousConfig;
        }
      });
    },
    [config, isPending]
  );
  return [startTransition, isPending];
}

function updateTransition(config) {
  var _updateState2 = updateState(false),
    isPending = _updateState2[0],
    setPending = _updateState2[1];

  var startTransition = updateCallback(
    function(callback) {
      setPending(true);
      Scheduler.unstable_next(function() {
        var previousConfig = ReactCurrentBatchConfig$1.suspense;
        ReactCurrentBatchConfig$1.suspense =
          config === undefined ? null : config;

        try {
          setPending(false);
          callback();
        } finally {
          ReactCurrentBatchConfig$1.suspense = previousConfig;
        }
      });
    },
    [config, isPending]
  );
  return [startTransition, isPending];
}

function dispatchAction(fiber, queue, action) {
  if (!(numberOfReRenders < RE_RENDER_LIMIT)) {
    throw Error(
      "Too many re-renders. React limits the number of renders to prevent an infinite loop."
    );
  }

  {
    !(typeof arguments[3] !== "function")
      ? warning$1(
          false,
          "State updates from the useState() and useReducer() Hooks don't support the " +
            "second callback argument. To execute a side effect after " +
            "rendering, declare it in the component body with useEffect()."
        )
      : void 0;
  }

  var alternate = fiber.alternate;

  if (
    fiber === currentlyRenderingFiber$1 ||
    (alternate !== null && alternate === currentlyRenderingFiber$1)
  ) {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    didScheduleRenderPhaseUpdate = true;
    var update = {
      expirationTime: renderExpirationTime$1,
      suspenseConfig: null,
      action: action,
      eagerReducer: null,
      eagerState: null,
      next: null
    };

    {
      update.priority = getCurrentPriorityLevel();
    }

    if (renderPhaseUpdates === null) {
      renderPhaseUpdates = new Map();
    }

    var firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);

    if (firstRenderPhaseUpdate === undefined) {
      renderPhaseUpdates.set(queue, update);
    } else {
      // Append the update to the end of the list.
      var lastRenderPhaseUpdate = firstRenderPhaseUpdate;

      while (lastRenderPhaseUpdate.next !== null) {
        lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
      }

      lastRenderPhaseUpdate.next = update;
    }
  } else {
    var currentTime = requestCurrentTimeForUpdate();
    var suspenseConfig = requestCurrentSuspenseConfig();
    var expirationTime = computeExpirationForFiber(
      currentTime,
      fiber,
      suspenseConfig
    );
    var _update2 = {
      expirationTime: expirationTime,
      suspenseConfig: suspenseConfig,
      action: action,
      eagerReducer: null,
      eagerState: null,
      next: null
    };

    {
      _update2.priority = getCurrentPriorityLevel();
    } // Append the update to the end of the list.

    var last = queue.last;

    if (last === null) {
      // This is the first update. Create a circular list.
      _update2.next = _update2;
    } else {
      var first = last.next;

      if (first !== null) {
        // Still circular.
        _update2.next = first;
      }

      last.next = _update2;
    }

    queue.last = _update2;

    if (
      fiber.expirationTime === NoWork &&
      (alternate === null || alternate.expirationTime === NoWork)
    ) {
      // The queue is currently empty, which means we can eagerly compute the
      // next state before entering the render phase. If the new state is the
      // same as the current state, we may be able to bail out entirely.
      var lastRenderedReducer = queue.lastRenderedReducer;

      if (lastRenderedReducer !== null) {
        var prevDispatcher;

        {
          prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
        }

        try {
          var currentState = queue.lastRenderedState;
          var eagerState = lastRenderedReducer(currentState, action); // Stash the eagerly computed state, and the reducer used to compute
          // it, on the update object. If the reducer hasn't changed by the
          // time we enter the render phase, then the eager state can be used
          // without calling the reducer again.

          _update2.eagerReducer = lastRenderedReducer;
          _update2.eagerState = eagerState;

          if (is$1(eagerState, currentState)) {
            // Fast path. We can bail out without scheduling React to re-render.
            // It's still possible that we'll need to rebase this update later,
            // if the component re-renders for a different reason and by that
            // time the reducer has changed.
            return;
          }
        } catch (error) {
          // Suppress the error. It will throw again in the render phase.
        } finally {
          {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        }
      }
    }

    {
      // $FlowExpectedError - jest isn't a global, and isn't recognized outside of tests
      if ("undefined" !== typeof jest) {
        warnIfNotScopedWithMatchingAct(fiber);
        warnIfNotCurrentlyActingUpdatesInDev(fiber);
      }
    }

    scheduleWork(fiber, expirationTime);
  }
}

var ContextOnlyDispatcher = {
  readContext: readContext,
  useCallback: throwInvalidHookError,
  useContext: throwInvalidHookError,
  useEffect: throwInvalidHookError,
  useImperativeHandle: throwInvalidHookError,
  useLayoutEffect: throwInvalidHookError,
  useMemo: throwInvalidHookError,
  useReducer: throwInvalidHookError,
  useRef: throwInvalidHookError,
  useState: throwInvalidHookError,
  useDebugValue: throwInvalidHookError,
  useResponder: throwInvalidHookError,
  useDeferredValue: throwInvalidHookError,
  useTransition: throwInvalidHookError
};
var HooksDispatcherOnMountInDEV = null;
var HooksDispatcherOnMountWithHookTypesInDEV = null;
var HooksDispatcherOnUpdateInDEV = null;
var InvalidNestedHooksDispatcherOnMountInDEV = null;
var InvalidNestedHooksDispatcherOnUpdateInDEV = null;

{
  var warnInvalidContextAccess = function() {
    warning$1(
      false,
      "Context can only be read while React is rendering. " +
        "In classes, you can read it in the render method or getDerivedStateFromProps. " +
        "In function components, you can read it directly in the function body, but not " +
        "inside Hooks like useReducer() or useMemo()."
    );
  };

  var warnInvalidHookAccess = function() {
    warning$1(
      false,
      "Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. " +
        "You can only call Hooks at the top level of your React function. " +
        "For more information, see " +
        "https://fb.me/rules-of-hooks"
    );
  };

  HooksDispatcherOnMountInDEV = {
    readContext: function(context, observedBits) {
      return readContext(context, observedBits);
    },
    useCallback: function(callback, deps) {
      currentHookNameInDev = "useCallback";
      mountHookTypesDev();
      checkDepsAreArrayDev(deps);
      return mountCallback(callback, deps);
    },
    useContext: function(context, observedBits) {
      currentHookNameInDev = "useContext";
      mountHookTypesDev();
      return readContext(context, observedBits);
    },
    useEffect: function(create, deps) {
      currentHookNameInDev = "useEffect";
      mountHookTypesDev();
      checkDepsAreArrayDev(deps);
      return mountEffect(create, deps);
    },
    useImperativeHandle: function(ref, create, deps) {
      currentHookNameInDev = "useImperativeHandle";
      mountHookTypesDev();
      checkDepsAreArrayDev(deps);
      return mountImperativeHandle(ref, create, deps);
    },
    useLayoutEffect: function(create, deps) {
      currentHookNameInDev = "useLayoutEffect";
      mountHookTypesDev();
      checkDepsAreArrayDev(deps);
      return mountLayoutEffect(create, deps);
    },
    useMemo: function(create, deps) {
      currentHookNameInDev = "useMemo";
      mountHookTypesDev();
      checkDepsAreArrayDev(deps);
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;

      try {
        return mountMemo(create, deps);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useReducer: function(reducer, initialArg, init) {
      currentHookNameInDev = "useReducer";
      mountHookTypesDev();
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;

      try {
        return mountReducer(reducer, initialArg, init);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useRef: function(initialValue) {
      currentHookNameInDev = "useRef";
      mountHookTypesDev();
      return mountRef(initialValue);
    },
    useState: function(initialState) {
      currentHookNameInDev = "useState";
      mountHookTypesDev();
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;

      try {
        return mountState(initialState);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useDebugValue: function(value, formatterFn) {
      currentHookNameInDev = "useDebugValue";
      mountHookTypesDev();
      return mountDebugValue(value, formatterFn);
    },
    useResponder: function(responder, props) {
      currentHookNameInDev = "useResponder";
      mountHookTypesDev();
      return createResponderListener(responder, props);
    },
    useDeferredValue: function(value, config) {
      currentHookNameInDev = "useDeferredValue";
      mountHookTypesDev();
      return mountDeferredValue(value, config);
    },
    useTransition: function(config) {
      currentHookNameInDev = "useTransition";
      mountHookTypesDev();
      return mountTransition(config);
    }
  };
  HooksDispatcherOnMountWithHookTypesInDEV = {
    readContext: function(context, observedBits) {
      return readContext(context, observedBits);
    },
    useCallback: function(callback, deps) {
      currentHookNameInDev = "useCallback";
      updateHookTypesDev();
      return mountCallback(callback, deps);
    },
    useContext: function(context, observedBits) {
      currentHookNameInDev = "useContext";
      updateHookTypesDev();
      return readContext(context, observedBits);
    },
    useEffect: function(create, deps) {
      currentHookNameInDev = "useEffect";
      updateHookTypesDev();
      return mountEffect(create, deps);
    },
    useImperativeHandle: function(ref, create, deps) {
      currentHookNameInDev = "useImperativeHandle";
      updateHookTypesDev();
      return mountImperativeHandle(ref, create, deps);
    },
    useLayoutEffect: function(create, deps) {
      currentHookNameInDev = "useLayoutEffect";
      updateHookTypesDev();
      return mountLayoutEffect(create, deps);
    },
    useMemo: function(create, deps) {
      currentHookNameInDev = "useMemo";
      updateHookTypesDev();
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;

      try {
        return mountMemo(create, deps);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useReducer: function(reducer, initialArg, init) {
      currentHookNameInDev = "useReducer";
      updateHookTypesDev();
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;

      try {
        return mountReducer(reducer, initialArg, init);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useRef: function(initialValue) {
      currentHookNameInDev = "useRef";
      updateHookTypesDev();
      return mountRef(initialValue);
    },
    useState: function(initialState) {
      currentHookNameInDev = "useState";
      updateHookTypesDev();
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;

      try {
        return mountState(initialState);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useDebugValue: function(value, formatterFn) {
      currentHookNameInDev = "useDebugValue";
      updateHookTypesDev();
      return mountDebugValue(value, formatterFn);
    },
    useResponder: function(responder, props) {
      currentHookNameInDev = "useResponder";
      updateHookTypesDev();
      return createResponderListener(responder, props);
    },
    useDeferredValue: function(value, config) {
      currentHookNameInDev = "useDeferredValue";
      updateHookTypesDev();
      return mountDeferredValue(value, config);
    },
    useTransition: function(config) {
      currentHookNameInDev = "useTransition";
      updateHookTypesDev();
      return mountTransition(config);
    }
  };
  HooksDispatcherOnUpdateInDEV = {
    readContext: function(context, observedBits) {
      return readContext(context, observedBits);
    },
    useCallback: function(callback, deps) {
      currentHookNameInDev = "useCallback";
      updateHookTypesDev();
      return updateCallback(callback, deps);
    },
    useContext: function(context, observedBits) {
      currentHookNameInDev = "useContext";
      updateHookTypesDev();
      return readContext(context, observedBits);
    },
    useEffect: function(create, deps) {
      currentHookNameInDev = "useEffect";
      updateHookTypesDev();
      return updateEffect(create, deps);
    },
    useImperativeHandle: function(ref, create, deps) {
      currentHookNameInDev = "useImperativeHandle";
      updateHookTypesDev();
      return updateImperativeHandle(ref, create, deps);
    },
    useLayoutEffect: function(create, deps) {
      currentHookNameInDev = "useLayoutEffect";
      updateHookTypesDev();
      return updateLayoutEffect(create, deps);
    },
    useMemo: function(create, deps) {
      currentHookNameInDev = "useMemo";
      updateHookTypesDev();
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

      try {
        return updateMemo(create, deps);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useReducer: function(reducer, initialArg, init) {
      currentHookNameInDev = "useReducer";
      updateHookTypesDev();
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

      try {
        return updateReducer(reducer, initialArg, init);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useRef: function(initialValue) {
      currentHookNameInDev = "useRef";
      updateHookTypesDev();
      return updateRef(initialValue);
    },
    useState: function(initialState) {
      currentHookNameInDev = "useState";
      updateHookTypesDev();
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

      try {
        return updateState(initialState);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useDebugValue: function(value, formatterFn) {
      currentHookNameInDev = "useDebugValue";
      updateHookTypesDev();
      return updateDebugValue(value, formatterFn);
    },
    useResponder: function(responder, props) {
      currentHookNameInDev = "useResponder";
      updateHookTypesDev();
      return createResponderListener(responder, props);
    },
    useDeferredValue: function(value, config) {
      currentHookNameInDev = "useDeferredValue";
      updateHookTypesDev();
      return updateDeferredValue(value, config);
    },
    useTransition: function(config) {
      currentHookNameInDev = "useTransition";
      updateHookTypesDev();
      return updateTransition(config);
    }
  };
  InvalidNestedHooksDispatcherOnMountInDEV = {
    readContext: function(context, observedBits) {
      warnInvalidContextAccess();
      return readContext(context, observedBits);
    },
    useCallback: function(callback, deps) {
      currentHookNameInDev = "useCallback";
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountCallback(callback, deps);
    },
    useContext: function(context, observedBits) {
      currentHookNameInDev = "useContext";
      warnInvalidHookAccess();
      mountHookTypesDev();
      return readContext(context, observedBits);
    },
    useEffect: function(create, deps) {
      currentHookNameInDev = "useEffect";
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountEffect(create, deps);
    },
    useImperativeHandle: function(ref, create, deps) {
      currentHookNameInDev = "useImperativeHandle";
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountImperativeHandle(ref, create, deps);
    },
    useLayoutEffect: function(create, deps) {
      currentHookNameInDev = "useLayoutEffect";
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountLayoutEffect(create, deps);
    },
    useMemo: function(create, deps) {
      currentHookNameInDev = "useMemo";
      warnInvalidHookAccess();
      mountHookTypesDev();
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;

      try {
        return mountMemo(create, deps);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useReducer: function(reducer, initialArg, init) {
      currentHookNameInDev = "useReducer";
      warnInvalidHookAccess();
      mountHookTypesDev();
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;

      try {
        return mountReducer(reducer, initialArg, init);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useRef: function(initialValue) {
      currentHookNameInDev = "useRef";
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountRef(initialValue);
    },
    useState: function(initialState) {
      currentHookNameInDev = "useState";
      warnInvalidHookAccess();
      mountHookTypesDev();
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;

      try {
        return mountState(initialState);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useDebugValue: function(value, formatterFn) {
      currentHookNameInDev = "useDebugValue";
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountDebugValue(value, formatterFn);
    },
    useResponder: function(responder, props) {
      currentHookNameInDev = "useResponder";
      warnInvalidHookAccess();
      mountHookTypesDev();
      return createResponderListener(responder, props);
    },
    useDeferredValue: function(value, config) {
      currentHookNameInDev = "useDeferredValue";
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountDeferredValue(value, config);
    },
    useTransition: function(config) {
      currentHookNameInDev = "useTransition";
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountTransition(config);
    }
  };
  InvalidNestedHooksDispatcherOnUpdateInDEV = {
    readContext: function(context, observedBits) {
      warnInvalidContextAccess();
      return readContext(context, observedBits);
    },
    useCallback: function(callback, deps) {
      currentHookNameInDev = "useCallback";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateCallback(callback, deps);
    },
    useContext: function(context, observedBits) {
      currentHookNameInDev = "useContext";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return readContext(context, observedBits);
    },
    useEffect: function(create, deps) {
      currentHookNameInDev = "useEffect";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateEffect(create, deps);
    },
    useImperativeHandle: function(ref, create, deps) {
      currentHookNameInDev = "useImperativeHandle";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateImperativeHandle(ref, create, deps);
    },
    useLayoutEffect: function(create, deps) {
      currentHookNameInDev = "useLayoutEffect";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateLayoutEffect(create, deps);
    },
    useMemo: function(create, deps) {
      currentHookNameInDev = "useMemo";
      warnInvalidHookAccess();
      updateHookTypesDev();
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

      try {
        return updateMemo(create, deps);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useReducer: function(reducer, initialArg, init) {
      currentHookNameInDev = "useReducer";
      warnInvalidHookAccess();
      updateHookTypesDev();
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

      try {
        return updateReducer(reducer, initialArg, init);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useRef: function(initialValue) {
      currentHookNameInDev = "useRef";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateRef(initialValue);
    },
    useState: function(initialState) {
      currentHookNameInDev = "useState";
      warnInvalidHookAccess();
      updateHookTypesDev();
      var prevDispatcher = ReactCurrentDispatcher$1.current;
      ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

      try {
        return updateState(initialState);
      } finally {
        ReactCurrentDispatcher$1.current = prevDispatcher;
      }
    },
    useDebugValue: function(value, formatterFn) {
      currentHookNameInDev = "useDebugValue";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateDebugValue(value, formatterFn);
    },
    useResponder: function(responder, props) {
      currentHookNameInDev = "useResponder";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return createResponderListener(responder, props);
    },
    useDeferredValue: function(value, config) {
      currentHookNameInDev = "useDeferredValue";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateDeferredValue(value, config);
    },
    useTransition: function(config) {
      currentHookNameInDev = "useTransition";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateTransition(config);
    }
  };
}

// CommonJS interop named imports.

var now$1 = Scheduler.unstable_now;
var commitTime = 0;
var profilerStartTime = -1;

function getCommitTime() {
  return commitTime;
}

function recordCommitTime() {
  if (!enableProfilerTimer) {
    return;
  }

  commitTime = now$1();
}

function startProfilerTimer(fiber) {
  if (!enableProfilerTimer) {
    return;
  }

  profilerStartTime = now$1();

  if (fiber.actualStartTime < 0) {
    fiber.actualStartTime = now$1();
  }
}

function stopProfilerTimerIfRunning(fiber) {
  if (!enableProfilerTimer) {
    return;
  }

  profilerStartTime = -1;
}

function stopProfilerTimerIfRunningAndRecordDelta(fiber, overrideBaseTime) {
  if (!enableProfilerTimer) {
    return;
  }

  if (profilerStartTime >= 0) {
    var elapsedTime = now$1() - profilerStartTime;
    fiber.actualDuration += elapsedTime;

    if (overrideBaseTime) {
      fiber.selfBaseDuration = elapsedTime;
    }

    profilerStartTime = -1;
  }
}

// This may have been an insertion or a hydration.

var hydrationParentFiber = null;
var nextHydratableInstance = null;
var isHydrating = false;

function warnIfHydrating() {
  {
    !!isHydrating
      ? warning$1(
          false,
          "We should not be hydrating here. This is a bug in React. Please file a bug."
        )
      : void 0;
  }
}

function enterHydrationState(fiber) {
  if (!supportsHydration) {
    return false;
  }

  var parentInstance = fiber.stateNode.containerInfo;
  nextHydratableInstance = getFirstHydratableChild(parentInstance);
  hydrationParentFiber = fiber;
  isHydrating = true;
  return true;
}

function reenterHydrationStateFromDehydratedSuspenseInstance(
  fiber,
  suspenseInstance
) {
  if (!supportsHydration) {
    return false;
  }

  nextHydratableInstance = getNextHydratableSibling(suspenseInstance);
  popToNextHostParent(fiber);
  isHydrating = true;
  return true;
}

function deleteHydratableInstance(returnFiber, instance) {
  {
    switch (returnFiber.tag) {
      case HostRoot:
        didNotHydrateContainerInstance(
          returnFiber.stateNode.containerInfo,
          instance
        );
        break;

      case HostComponent:
        didNotHydrateInstance(
          returnFiber.type,
          returnFiber.memoizedProps,
          returnFiber.stateNode,
          instance
        );
        break;
    }
  }

  var childToDelete = createFiberFromHostInstanceForDeletion();
  childToDelete.stateNode = instance;
  childToDelete.return = returnFiber;
  childToDelete.effectTag = Deletion; // This might seem like it belongs on progressedFirstDeletion. However,
  // these children are not part of the reconciliation list of children.
  // Even if we abort and rereconcile the children, that will try to hydrate
  // again and the nodes are still in the host tree so these will be
  // recreated.

  if (returnFiber.lastEffect !== null) {
    returnFiber.lastEffect.nextEffect = childToDelete;
    returnFiber.lastEffect = childToDelete;
  } else {
    returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
  }
}

function insertNonHydratedInstance(returnFiber, fiber) {
  fiber.effectTag = (fiber.effectTag & ~Hydrating) | Placement;

  {
    switch (returnFiber.tag) {
      case HostRoot: {
        var parentContainer = returnFiber.stateNode.containerInfo;

        switch (fiber.tag) {
          case HostComponent:
            var type = fiber.type;
            var props = fiber.pendingProps;
            didNotFindHydratableContainerInstance(parentContainer, type, props);
            break;

          case HostText:
            var text = fiber.pendingProps;
            didNotFindHydratableContainerTextInstance(parentContainer, text);
            break;

          case SuspenseComponent:
            didNotFindHydratableContainerSuspenseInstance(parentContainer);
            break;
        }

        break;
      }

      case HostComponent: {
        var parentType = returnFiber.type;
        var parentProps = returnFiber.memoizedProps;
        var parentInstance = returnFiber.stateNode;

        switch (fiber.tag) {
          case HostComponent:
            var _type = fiber.type;
            var _props = fiber.pendingProps;
            didNotFindHydratableInstance(
              parentType,
              parentProps,
              parentInstance,
              _type,
              _props
            );
            break;

          case HostText:
            var _text = fiber.pendingProps;
            didNotFindHydratableTextInstance(
              parentType,
              parentProps,
              parentInstance,
              _text
            );
            break;

          case SuspenseComponent:
            didNotFindHydratableSuspenseInstance(
              parentType,
              parentProps,
              parentInstance
            );
            break;
        }

        break;
      }

      default:
        return;
    }
  }
}

function tryHydrate(fiber, nextInstance) {
  switch (fiber.tag) {
    case HostComponent: {
      var type = fiber.type;
      var props = fiber.pendingProps;
      var instance = canHydrateInstance(nextInstance, type, props);

      if (instance !== null) {
        fiber.stateNode = instance;
        return true;
      }

      return false;
    }

    case HostText: {
      var text = fiber.pendingProps;
      var textInstance = canHydrateTextInstance(nextInstance, text);

      if (textInstance !== null) {
        fiber.stateNode = textInstance;
        return true;
      }

      return false;
    }

    case SuspenseComponent: {
      if (enableSuspenseServerRenderer) {
        var suspenseInstance = canHydrateSuspenseInstance(nextInstance);

        if (suspenseInstance !== null) {
          var suspenseState = {
            dehydrated: suspenseInstance,
            retryTime: Never
          };
          fiber.memoizedState = suspenseState; // Store the dehydrated fragment as a child fiber.
          // This simplifies the code for getHostSibling and deleting nodes,
          // since it doesn't have to consider all Suspense boundaries and
          // check if they're dehydrated ones or not.

          var dehydratedFragment = createFiberFromDehydratedFragment(
            suspenseInstance
          );
          dehydratedFragment.return = fiber;
          fiber.child = dehydratedFragment;
          return true;
        }
      }

      return false;
    }

    default:
      return false;
  }
}

function tryToClaimNextHydratableInstance(fiber) {
  if (!isHydrating) {
    return;
  }

  var nextInstance = nextHydratableInstance;

  if (!nextInstance) {
    // Nothing to hydrate. Make it an insertion.
    insertNonHydratedInstance(hydrationParentFiber, fiber);
    isHydrating = false;
    hydrationParentFiber = fiber;
    return;
  }

  var firstAttemptedInstance = nextInstance;

  if (!tryHydrate(fiber, nextInstance)) {
    // If we can't hydrate this instance let's try the next one.
    // We use this as a heuristic. It's based on intuition and not data so it
    // might be flawed or unnecessary.
    nextInstance = getNextHydratableSibling(firstAttemptedInstance);

    if (!nextInstance || !tryHydrate(fiber, nextInstance)) {
      // Nothing to hydrate. Make it an insertion.
      insertNonHydratedInstance(hydrationParentFiber, fiber);
      isHydrating = false;
      hydrationParentFiber = fiber;
      return;
    } // We matched the next one, we'll now assume that the first one was
    // superfluous and we'll delete it. Since we can't eagerly delete it
    // we'll have to schedule a deletion. To do that, this node needs a dummy
    // fiber associated with it.

    deleteHydratableInstance(hydrationParentFiber, firstAttemptedInstance);
  }

  hydrationParentFiber = fiber;
  nextHydratableInstance = getFirstHydratableChild(nextInstance);
}

function prepareToHydrateHostInstance(
  fiber,
  rootContainerInstance,
  hostContext
) {
  if (!supportsHydration) {
    {
      throw Error(
        "Expected prepareToHydrateHostInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
      );
    }
  }

  var instance = fiber.stateNode;
  var updatePayload = hydrateInstance(
    instance,
    fiber.type,
    fiber.memoizedProps,
    rootContainerInstance,
    hostContext,
    fiber
  ); // TODO: Type this specific to this type of component.

  fiber.updateQueue = updatePayload; // If the update payload indicates that there is a change or if there
  // is a new ref we mark this as an update.

  if (updatePayload !== null) {
    return true;
  }

  return false;
}

function prepareToHydrateHostTextInstance(fiber) {
  if (!supportsHydration) {
    {
      throw Error(
        "Expected prepareToHydrateHostTextInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
      );
    }
  }

  var textInstance = fiber.stateNode;
  var textContent = fiber.memoizedProps;
  var shouldUpdate = hydrateTextInstance(textInstance, textContent, fiber);

  {
    if (shouldUpdate) {
      // We assume that prepareToHydrateHostTextInstance is called in a context where the
      // hydration parent is the parent host component of this host text.
      var returnFiber = hydrationParentFiber;

      if (returnFiber !== null) {
        switch (returnFiber.tag) {
          case HostRoot: {
            var parentContainer = returnFiber.stateNode.containerInfo;
            didNotMatchHydratedContainerTextInstance(
              parentContainer,
              textInstance,
              textContent
            );
            break;
          }

          case HostComponent: {
            var parentType = returnFiber.type;
            var parentProps = returnFiber.memoizedProps;
            var parentInstance = returnFiber.stateNode;
            didNotMatchHydratedTextInstance(
              parentType,
              parentProps,
              parentInstance,
              textInstance,
              textContent
            );
            break;
          }
        }
      }
    }
  }

  return shouldUpdate;
}

function prepareToHydrateHostSuspenseInstance(fiber) {
  if (!supportsHydration) {
    {
      throw Error(
        "Expected prepareToHydrateHostSuspenseInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
      );
    }
  }

  var suspenseState = fiber.memoizedState;
  var suspenseInstance =
    suspenseState !== null ? suspenseState.dehydrated : null;

  if (!suspenseInstance) {
    throw Error(
      "Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue."
    );
  }

  hydrateSuspenseInstance(suspenseInstance, fiber);
}

function skipPastDehydratedSuspenseInstance(fiber) {
  if (!supportsHydration) {
    {
      throw Error(
        "Expected skipPastDehydratedSuspenseInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
      );
    }
  }

  var suspenseState = fiber.memoizedState;
  var suspenseInstance =
    suspenseState !== null ? suspenseState.dehydrated : null;

  if (!suspenseInstance) {
    throw Error(
      "Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue."
    );
  }

  return getNextHydratableInstanceAfterSuspenseInstance(suspenseInstance);
}

function popToNextHostParent(fiber) {
  var parent = fiber.return;

  while (
    parent !== null &&
    parent.tag !== HostComponent &&
    parent.tag !== HostRoot &&
    parent.tag !== SuspenseComponent
  ) {
    parent = parent.return;
  }

  hydrationParentFiber = parent;
}

function popHydrationState(fiber) {
  if (!supportsHydration) {
    return false;
  }

  if (fiber !== hydrationParentFiber) {
    // We're deeper than the current hydration context, inside an inserted
    // tree.
    return false;
  }

  if (!isHydrating) {
    // If we're not currently hydrating but we're in a hydration context, then
    // we were an insertion and now need to pop up reenter hydration of our
    // siblings.
    popToNextHostParent(fiber);
    isHydrating = true;
    return false;
  }

  var type = fiber.type; // If we have any remaining hydratable nodes, we need to delete them now.
  // We only do this deeper than head and body since they tend to have random
  // other nodes in them. We also ignore components with pure text content in
  // side of them.
  // TODO: Better heuristic.

  if (
    fiber.tag !== HostComponent ||
    (type !== "head" &&
      type !== "body" &&
      !shouldSetTextContent(type, fiber.memoizedProps))
  ) {
    var nextInstance = nextHydratableInstance;

    while (nextInstance) {
      deleteHydratableInstance(fiber, nextInstance);
      nextInstance = getNextHydratableSibling(nextInstance);
    }
  }

  popToNextHostParent(fiber);

  if (fiber.tag === SuspenseComponent) {
    nextHydratableInstance = skipPastDehydratedSuspenseInstance(fiber);
  } else {
    nextHydratableInstance = hydrationParentFiber
      ? getNextHydratableSibling(fiber.stateNode)
      : null;
  }

  return true;
}

function resetHydrationState() {
  if (!supportsHydration) {
    return;
  }

  hydrationParentFiber = null;
  nextHydratableInstance = null;
  isHydrating = false;
}

var ReactCurrentOwner$3 = ReactSharedInternals.ReactCurrentOwner;
var didReceiveUpdate = false;
var didWarnAboutBadClass;
var didWarnAboutModulePatternComponent;
var didWarnAboutContextTypeOnFunctionComponent;
var didWarnAboutGetDerivedStateOnFunctionComponent;
var didWarnAboutFunctionRefs;
var didWarnAboutReassigningProps;
var didWarnAboutMaxDuration;
var didWarnAboutRevealOrder;
var didWarnAboutTailOptions;
var didWarnAboutDefaultPropsOnFunctionComponent;

{
  didWarnAboutBadClass = {};
  didWarnAboutModulePatternComponent = {};
  didWarnAboutContextTypeOnFunctionComponent = {};
  didWarnAboutGetDerivedStateOnFunctionComponent = {};
  didWarnAboutFunctionRefs = {};
  didWarnAboutReassigningProps = false;
  didWarnAboutMaxDuration = false;
  didWarnAboutRevealOrder = {};
  didWarnAboutTailOptions = {};
  didWarnAboutDefaultPropsOnFunctionComponent = {};
}

function reconcileChildren(
  current$$1,
  workInProgress,
  nextChildren,
  renderExpirationTime
) {
  if (current$$1 === null) {
    // If this is a fresh new component that hasn't been rendered yet, we
    // won't update its child set by applying minimal side-effects. Instead,
    // we will add them all to the child before it gets rendered. That means
    // we can optimize this reconciliation pass by not tracking side-effects.
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderExpirationTime
    );
  } else {
    // If the current child is the same as the work in progress, it means that
    // we haven't yet started any work on these children. Therefore, we use
    // the clone algorithm to create a copy of all the current children.
    // If we had any progressed work already, that is invalid at this point so
    // let's throw it out.
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current$$1.child,
      nextChildren,
      renderExpirationTime
    );
  }
}

function forceUnmountCurrentAndReconcile(
  current$$1,
  workInProgress,
  nextChildren,
  renderExpirationTime
) {
  // This function is fork of reconcileChildren. It's used in cases where we
  // want to reconcile without matching against the existing set. This has the
  // effect of all current children being unmounted; even if the type and key
  // are the same, the old child is unmounted and a new child is created.
  //
  // To do this, we're going to go through the reconcile algorithm twice. In
  // the first pass, we schedule a deletion for all the current children by
  // passing null.
  workInProgress.child = reconcileChildFibers(
    workInProgress,
    current$$1.child,
    null,
    renderExpirationTime
  ); // In the second pass, we mount the new children. The trick here is that we
  // pass null in place of where we usually pass the current child set. This has
  // the effect of remounting all children regardless of whether their their
  // identity matches.

  workInProgress.child = reconcileChildFibers(
    workInProgress,
    null,
    nextChildren,
    renderExpirationTime
  );
}

function updateForwardRef(
  current$$1,
  workInProgress,
  Component,
  nextProps,
  renderExpirationTime
) {
  // TODO: current can be non-null here even if the component
  // hasn't yet mounted. This happens after the first render suspends.
  // We'll need to figure out if this is fine or can cause issues.
  {
    if (workInProgress.type !== workInProgress.elementType) {
      // Lazy component props can't be validated in createElement
      // because they're only guaranteed to be resolved here.
      var innerPropTypes = Component.propTypes;

      if (innerPropTypes) {
        checkPropTypes(
          innerPropTypes,
          nextProps, // Resolved props
          "prop",
          getComponentName(Component),
          getCurrentFiberStackInDev
        );
      }
    }
  }

  var render = Component.render;
  var ref = workInProgress.ref; // The rest is a fork of updateFunctionComponent

  var nextChildren;
  prepareToReadContext(workInProgress, renderExpirationTime);

  {
    ReactCurrentOwner$3.current = workInProgress;
    setCurrentPhase("render");
    nextChildren = renderWithHooks(
      current$$1,
      workInProgress,
      render,
      nextProps,
      ref,
      renderExpirationTime
    );

    if (
      debugRenderPhaseSideEffectsForStrictMode &&
      workInProgress.mode & StrictMode
    ) {
      // Only double-render components with Hooks
      if (workInProgress.memoizedState !== null) {
        nextChildren = renderWithHooks(
          current$$1,
          workInProgress,
          render,
          nextProps,
          ref,
          renderExpirationTime
        );
      }
    }

    setCurrentPhase(null);
  }

  if (current$$1 !== null && !didReceiveUpdate) {
    bailoutHooks(current$$1, workInProgress, renderExpirationTime);
    return bailoutOnAlreadyFinishedWork(
      current$$1,
      workInProgress,
      renderExpirationTime
    );
  } // React DevTools reads this flag.

  workInProgress.effectTag |= PerformedWork;
  reconcileChildren(
    current$$1,
    workInProgress,
    nextChildren,
    renderExpirationTime
  );
  return workInProgress.child;
}

function updateMemoComponent(
  current$$1,
  workInProgress,
  Component,
  nextProps,
  updateExpirationTime,
  renderExpirationTime
) {
  if (current$$1 === null) {
    var type = Component.type;

    if (
      isSimpleFunctionComponent(type) &&
      Component.compare === null && // SimpleMemoComponent codepath doesn't resolve outer props either.
      Component.defaultProps === undefined
    ) {
      var resolvedType = type;

      {
        resolvedType = resolveFunctionForHotReloading(type);
      } // If this is a plain function component without default props,
      // and with only the default shallow comparison, we upgrade it
      // to a SimpleMemoComponent to allow fast path updates.

      workInProgress.tag = SimpleMemoComponent;
      workInProgress.type = resolvedType;

      {
        validateFunctionComponentInDev(workInProgress, type);
      }

      return updateSimpleMemoComponent(
        current$$1,
        workInProgress,
        resolvedType,
        nextProps,
        updateExpirationTime,
        renderExpirationTime
      );
    }

    {
      var innerPropTypes = type.propTypes;

      if (innerPropTypes) {
        // Inner memo component props aren't currently validated in createElement.
        // We could move it there, but we'd still need this for lazy code path.
        checkPropTypes(
          innerPropTypes,
          nextProps, // Resolved props
          "prop",
          getComponentName(type),
          getCurrentFiberStackInDev
        );
      }
    }

    var child = createFiberFromTypeAndProps(
      Component.type,
      null,
      nextProps,
      null,
      workInProgress.mode,
      renderExpirationTime
    );
    child.ref = workInProgress.ref;
    child.return = workInProgress;
    workInProgress.child = child;
    return child;
  }

  {
    var _type = Component.type;
    var _innerPropTypes = _type.propTypes;

    if (_innerPropTypes) {
      // Inner memo component props aren't currently validated in createElement.
      // We could move it there, but we'd still need this for lazy code path.
      checkPropTypes(
        _innerPropTypes,
        nextProps, // Resolved props
        "prop",
        getComponentName(_type),
        getCurrentFiberStackInDev
      );
    }
  }

  var currentChild = current$$1.child; // This is always exactly one child

  if (updateExpirationTime < renderExpirationTime) {
    // This will be the props with resolved defaultProps,
    // unlike current.memoizedProps which will be the unresolved ones.
    var prevProps = currentChild.memoizedProps; // Default to shallow comparison

    var compare = Component.compare;
    compare = compare !== null ? compare : shallowEqual;

    if (
      compare(prevProps, nextProps) &&
      current$$1.ref === workInProgress.ref
    ) {
      return bailoutOnAlreadyFinishedWork(
        current$$1,
        workInProgress,
        renderExpirationTime
      );
    }
  } // React DevTools reads this flag.

  workInProgress.effectTag |= PerformedWork;
  var newChild = createWorkInProgress(
    currentChild,
    nextProps,
    renderExpirationTime
  );
  newChild.ref = workInProgress.ref;
  newChild.return = workInProgress;
  workInProgress.child = newChild;
  return newChild;
}

function updateSimpleMemoComponent(
  current$$1,
  workInProgress,
  Component,
  nextProps,
  updateExpirationTime,
  renderExpirationTime
) {
  // TODO: current can be non-null here even if the component
  // hasn't yet mounted. This happens when the inner render suspends.
  // We'll need to figure out if this is fine or can cause issues.
  {
    if (workInProgress.type !== workInProgress.elementType) {
      // Lazy component props can't be validated in createElement
      // because they're only guaranteed to be resolved here.
      var outerMemoType = workInProgress.elementType;

      if (outerMemoType.$$typeof === REACT_LAZY_TYPE) {
        // We warn when you define propTypes on lazy()
        // so let's just skip over it to find memo() outer wrapper.
        // Inner props for memo are validated later.
        outerMemoType = refineResolvedLazyComponent(outerMemoType);
      }

      var outerPropTypes = outerMemoType && outerMemoType.propTypes;

      if (outerPropTypes) {
        checkPropTypes(
          outerPropTypes,
          nextProps, // Resolved (SimpleMemoComponent has no defaultProps)
          "prop",
          getComponentName(outerMemoType),
          getCurrentFiberStackInDev
        );
      } // Inner propTypes will be validated in the function component path.
    }
  }

  if (current$$1 !== null) {
    var prevProps = current$$1.memoizedProps;

    if (
      shallowEqual(prevProps, nextProps) &&
      current$$1.ref === workInProgress.ref && // Prevent bailout if the implementation changed due to hot reload:
      workInProgress.type === current$$1.type
    ) {
      didReceiveUpdate = false;

      if (updateExpirationTime < renderExpirationTime) {
        return bailoutOnAlreadyFinishedWork(
          current$$1,
          workInProgress,
          renderExpirationTime
        );
      }
    }
  }

  return updateFunctionComponent(
    current$$1,
    workInProgress,
    Component,
    nextProps,
    renderExpirationTime
  );
}

function updateFragment(current$$1, workInProgress, renderExpirationTime) {
  var nextChildren = workInProgress.pendingProps;
  reconcileChildren(
    current$$1,
    workInProgress,
    nextChildren,
    renderExpirationTime
  );
  return workInProgress.child;
}

function updateMode(current$$1, workInProgress, renderExpirationTime) {
  var nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(
    current$$1,
    workInProgress,
    nextChildren,
    renderExpirationTime
  );
  return workInProgress.child;
}

function updateProfiler(current$$1, workInProgress, renderExpirationTime) {
  if (enableProfilerTimer) {
    workInProgress.effectTag |= Update;
  }

  var nextProps = workInProgress.pendingProps;
  var nextChildren = nextProps.children;
  reconcileChildren(
    current$$1,
    workInProgress,
    nextChildren,
    renderExpirationTime
  );
  return workInProgress.child;
}

function markRef(current$$1, workInProgress) {
  var ref = workInProgress.ref;

  if (
    (current$$1 === null && ref !== null) ||
    (current$$1 !== null && current$$1.ref !== ref)
  ) {
    // Schedule a Ref effect
    workInProgress.effectTag |= Ref;
  }
}

function updateFunctionComponent(
  current$$1,
  workInProgress,
  Component,
  nextProps,
  renderExpirationTime
) {
  {
    if (workInProgress.type !== workInProgress.elementType) {
      // Lazy component props can't be validated in createElement
      // because they're only guaranteed to be resolved here.
      var innerPropTypes = Component.propTypes;

      if (innerPropTypes) {
        checkPropTypes(
          innerPropTypes,
          nextProps, // Resolved props
          "prop",
          getComponentName(Component),
          getCurrentFiberStackInDev
        );
      }
    }
  }

  var context;

  if (!disableLegacyContext) {
    var unmaskedContext = getUnmaskedContext(workInProgress, Component, true);
    context = getMaskedContext(workInProgress, unmaskedContext);
  }

  var nextChildren;
  prepareToReadContext(workInProgress, renderExpirationTime);

  {
    ReactCurrentOwner$3.current = workInProgress;
    setCurrentPhase("render");
    nextChildren = renderWithHooks(
      current$$1,
      workInProgress,
      Component,
      nextProps,
      context,
      renderExpirationTime
    );

    if (
      debugRenderPhaseSideEffectsForStrictMode &&
      workInProgress.mode & StrictMode
    ) {
      // Only double-render components with Hooks
      if (workInProgress.memoizedState !== null) {
        nextChildren = renderWithHooks(
          current$$1,
          workInProgress,
          Component,
          nextProps,
          context,
          renderExpirationTime
        );
      }
    }

    setCurrentPhase(null);
  }

  if (current$$1 !== null && !didReceiveUpdate) {
    bailoutHooks(current$$1, workInProgress, renderExpirationTime);
    return bailoutOnAlreadyFinishedWork(
      current$$1,
      workInProgress,
      renderExpirationTime
    );
  } // React DevTools reads this flag.

  workInProgress.effectTag |= PerformedWork;
  reconcileChildren(
    current$$1,
    workInProgress,
    nextChildren,
    renderExpirationTime
  );
  return workInProgress.child;
}

function updateClassComponent(
  current$$1,
  workInProgress,
  Component,
  nextProps,
  renderExpirationTime
) {
  {
    if (workInProgress.type !== workInProgress.elementType) {
      // Lazy component props can't be validated in createElement
      // because they're only guaranteed to be resolved here.
      var innerPropTypes = Component.propTypes;

      if (innerPropTypes) {
        checkPropTypes(
          innerPropTypes,
          nextProps, // Resolved props
          "prop",
          getComponentName(Component),
          getCurrentFiberStackInDev
        );
      }
    }
  } // Push context providers early to prevent context stack mismatches.
  // During mounting we don't know the child context yet as the instance doesn't exist.
  // We will invalidate the child context in finishClassComponent() right after rendering.

  var hasContext;

  if (isContextProvider(Component)) {
    hasContext = true;
    pushContextProvider(workInProgress);
  } else {
    hasContext = false;
  }

  prepareToReadContext(workInProgress, renderExpirationTime);
  var instance = workInProgress.stateNode;
  var shouldUpdate;

  if (instance === null) {
    if (current$$1 !== null) {
      // An class component without an instance only mounts if it suspended
      // inside a non- concurrent tree, in an inconsistent state. We want to
      // tree it like a new mount, even though an empty version of it already
      // committed. Disconnect the alternate pointers.
      current$$1.alternate = null;
      workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

      workInProgress.effectTag |= Placement;
    } // In the initial pass we might need to construct the instance.

    constructClassInstance(
      workInProgress,
      Component,
      nextProps,
      renderExpirationTime
    );
    mountClassInstance(
      workInProgress,
      Component,
      nextProps,
      renderExpirationTime
    );
    shouldUpdate = true;
  } else if (current$$1 === null) {
    // In a resume, we'll already have an instance we can reuse.
    shouldUpdate = resumeMountClassInstance(
      workInProgress,
      Component,
      nextProps,
      renderExpirationTime
    );
  } else {
    shouldUpdate = updateClassInstance(
      current$$1,
      workInProgress,
      Component,
      nextProps,
      renderExpirationTime
    );
  }

  var nextUnitOfWork = finishClassComponent(
    current$$1,
    workInProgress,
    Component,
    shouldUpdate,
    hasContext,
    renderExpirationTime
  );

  {
    var inst = workInProgress.stateNode;

    if (inst.props !== nextProps) {
      !didWarnAboutReassigningProps
        ? warning$1(
            false,
            "It looks like %s is reassigning its own `this.props` while rendering. " +
              "This is not supported and can lead to confusing bugs.",
            getComponentName(workInProgress.type) || "a component"
          )
        : void 0;
      didWarnAboutReassigningProps = true;
    }
  }

  return nextUnitOfWork;
}

function finishClassComponent(
  current$$1,
  workInProgress,
  Component,
  shouldUpdate,
  hasContext,
  renderExpirationTime
) {
  // Refs should update even if shouldComponentUpdate returns false
  markRef(current$$1, workInProgress);
  var didCaptureError = (workInProgress.effectTag & DidCapture) !== NoEffect;

  if (!shouldUpdate && !didCaptureError) {
    // Context providers should defer to sCU for rendering
    if (hasContext) {
      invalidateContextProvider(workInProgress, Component, false);
    }

    return bailoutOnAlreadyFinishedWork(
      current$$1,
      workInProgress,
      renderExpirationTime
    );
  }

  var instance = workInProgress.stateNode; // Rerender

  ReactCurrentOwner$3.current = workInProgress;
  var nextChildren;

  if (
    didCaptureError &&
    typeof Component.getDerivedStateFromError !== "function"
  ) {
    // If we captured an error, but getDerivedStateFrom catch is not defined,
    // unmount all the children. componentDidCatch will schedule an update to
    // re-render a fallback. This is temporary until we migrate everyone to
    // the new API.
    // TODO: Warn in a future release.
    nextChildren = null;

    if (enableProfilerTimer) {
      stopProfilerTimerIfRunning(workInProgress);
    }
  } else {
    {
      setCurrentPhase("render");
      nextChildren = instance.render();

      if (
        debugRenderPhaseSideEffectsForStrictMode &&
        workInProgress.mode & StrictMode
      ) {
        instance.render();
      }

      setCurrentPhase(null);
    }
  } // React DevTools reads this flag.

  workInProgress.effectTag |= PerformedWork;

  if (current$$1 !== null && didCaptureError) {
    // If we're recovering from an error, reconcile without reusing any of
    // the existing children. Conceptually, the normal children and the children
    // that are shown on error are two different sets, so we shouldn't reuse
    // normal children even if their identities match.
    forceUnmountCurrentAndReconcile(
      current$$1,
      workInProgress,
      nextChildren,
      renderExpirationTime
    );
  } else {
    reconcileChildren(
      current$$1,
      workInProgress,
      nextChildren,
      renderExpirationTime
    );
  } // Memoize state using the values we just used to render.
  // TODO: Restructure so we never read values from the instance.

  workInProgress.memoizedState = instance.state; // The context might have changed so we need to recalculate it.

  if (hasContext) {
    invalidateContextProvider(workInProgress, Component, true);
  }

  return workInProgress.child;
}

function pushHostRootContext(workInProgress) {
  var root = workInProgress.stateNode;

  if (root.pendingContext) {
    pushTopLevelContextObject(
      workInProgress,
      root.pendingContext,
      root.pendingContext !== root.context
    );
  } else if (root.context) {
    // Should always be set
    pushTopLevelContextObject(workInProgress, root.context, false);
  }

  pushHostContainer(workInProgress, root.containerInfo);
}

function updateHostRoot(current$$1, workInProgress, renderExpirationTime) {
  pushHostRootContext(workInProgress);
  var updateQueue = workInProgress.updateQueue;

  if (!(updateQueue !== null)) {
    throw Error(
      "If the root does not have an updateQueue, we should have already bailed out. This error is likely caused by a bug in React. Please file an issue."
    );
  }

  var nextProps = workInProgress.pendingProps;
  var prevState = workInProgress.memoizedState;
  var prevChildren = prevState !== null ? prevState.element : null;
  processUpdateQueue(
    workInProgress,
    updateQueue,
    nextProps,
    null,
    renderExpirationTime
  );
  var nextState = workInProgress.memoizedState; // Caution: React DevTools currently depends on this property
  // being called "element".

  var nextChildren = nextState.element;

  if (nextChildren === prevChildren) {
    // If the state is the same as before, that's a bailout because we had
    // no work that expires at this time.
    resetHydrationState();
    return bailoutOnAlreadyFinishedWork(
      current$$1,
      workInProgress,
      renderExpirationTime
    );
  }

  var root = workInProgress.stateNode;

  if (root.hydrate && enterHydrationState(workInProgress)) {
    // If we don't have any current children this might be the first pass.
    // We always try to hydrate. If this isn't a hydration pass there won't
    // be any children to hydrate which is effectively the same thing as
    // not hydrating.
    var child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderExpirationTime
    );
    workInProgress.child = child;
    var node = child;

    while (node) {
      // Mark each child as hydrating. This is a fast path to know whether this
      // tree is part of a hydrating tree. This is used to determine if a child
      // node has fully mounted yet, and for scheduling event replaying.
      // Conceptually this is similar to Placement in that a new subtree is
      // inserted into the React tree here. It just happens to not need DOM
      // mutations because it already exists.
      node.effectTag = (node.effectTag & ~Placement) | Hydrating;
      node = node.sibling;
    }
  } else {
    // Otherwise reset hydration state in case we aborted and resumed another
    // root.
    reconcileChildren(
      current$$1,
      workInProgress,
      nextChildren,
      renderExpirationTime
    );
    resetHydrationState();
  }

  return workInProgress.child;
}

function updateHostComponent(current$$1, workInProgress, renderExpirationTime) {
  pushHostContext(workInProgress);

  if (current$$1 === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  }

  var type = workInProgress.type;
  var nextProps = workInProgress.pendingProps;
  var prevProps = current$$1 !== null ? current$$1.memoizedProps : null;
  var nextChildren = nextProps.children;
  var isDirectTextChild = shouldSetTextContent(type, nextProps);

  if (isDirectTextChild) {
    // We special case a direct text child of a host node. This is a common
    // case. We won't handle it as a reified child. We will instead handle
    // this in the host environment that also have access to this prop. That
    // avoids allocating another HostText fiber and traversing it.
    nextChildren = null;
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    // If we're switching from a direct text child to a normal child, or to
    // empty, we need to schedule the text content to be reset.
    workInProgress.effectTag |= ContentReset;
  }

  markRef(current$$1, workInProgress); // Check the host config to see if the children are offscreen/hidden.

  if (
    workInProgress.mode & ConcurrentMode &&
    renderExpirationTime !== Never &&
    shouldDeprioritizeSubtree(type, nextProps)
  ) {
    if (enableSchedulerTracing) {
      markSpawnedWork(Never);
    } // Schedule this fiber to re-render at offscreen priority. Then bailout.

    workInProgress.expirationTime = workInProgress.childExpirationTime = Never;
    return null;
  }

  reconcileChildren(
    current$$1,
    workInProgress,
    nextChildren,
    renderExpirationTime
  );
  return workInProgress.child;
}

function updateHostText(current$$1, workInProgress) {
  if (current$$1 === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  } // Nothing to do here. This is terminal. We'll do the completion step
  // immediately after.

  return null;
}

function mountLazyComponent(
  _current,
  workInProgress,
  elementType,
  updateExpirationTime,
  renderExpirationTime
) {
  if (_current !== null) {
    // An lazy component only mounts if it suspended inside a non-
    // concurrent tree, in an inconsistent state. We want to treat it like
    // a new mount, even though an empty version of it already committed.
    // Disconnect the alternate pointers.
    _current.alternate = null;
    workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

    workInProgress.effectTag |= Placement;
  }

  var props = workInProgress.pendingProps; // We can't start a User Timing measurement with correct label yet.
  // Cancel and resume right after we know the tag.

  cancelWorkTimer(workInProgress);
  var Component = readLazyComponentType(elementType); // Store the unwrapped component in the type.

  workInProgress.type = Component;
  var resolvedTag = (workInProgress.tag = resolveLazyComponentTag(Component));
  startWorkTimer(workInProgress);
  var resolvedProps = resolveDefaultProps(Component, props);
  var child;

  switch (resolvedTag) {
    case FunctionComponent: {
      {
        validateFunctionComponentInDev(workInProgress, Component);
        workInProgress.type = Component = resolveFunctionForHotReloading(
          Component
        );
      }

      child = updateFunctionComponent(
        null,
        workInProgress,
        Component,
        resolvedProps,
        renderExpirationTime
      );
      break;
    }

    case ClassComponent: {
      {
        workInProgress.type = Component = resolveClassForHotReloading(
          Component
        );
      }

      child = updateClassComponent(
        null,
        workInProgress,
        Component,
        resolvedProps,
        renderExpirationTime
      );
      break;
    }

    case ForwardRef: {
      {
        workInProgress.type = Component = resolveForwardRefForHotReloading(
          Component
        );
      }

      child = updateForwardRef(
        null,
        workInProgress,
        Component,
        resolvedProps,
        renderExpirationTime
      );
      break;
    }

    case MemoComponent: {
      {
        if (workInProgress.type !== workInProgress.elementType) {
          var outerPropTypes = Component.propTypes;

          if (outerPropTypes) {
            checkPropTypes(
              outerPropTypes,
              resolvedProps, // Resolved for outer only
              "prop",
              getComponentName(Component),
              getCurrentFiberStackInDev
            );
          }
        }
      }

      child = updateMemoComponent(
        null,
        workInProgress,
        Component,
        resolveDefaultProps(Component.type, resolvedProps), // The inner type can have defaults too
        updateExpirationTime,
        renderExpirationTime
      );
      break;
    }

    default: {
      var hint = "";

      {
        if (
          Component !== null &&
          typeof Component === "object" &&
          Component.$$typeof === REACT_LAZY_TYPE
        ) {
          hint = " Did you wrap a component in React.lazy() more than once?";
        }
      } // This message intentionally doesn't mention ForwardRef or MemoComponent
      // because the fact that it's a separate type of work is an
      // implementation detail.

      {
        throw Error(
          "Element type is invalid. Received a promise that resolves to: " +
            Component +
            ". Lazy element type must resolve to a class or function." +
            hint
        );
      }
    }
  }

  return child;
}

function mountIncompleteClassComponent(
  _current,
  workInProgress,
  Component,
  nextProps,
  renderExpirationTime
) {
  if (_current !== null) {
    // An incomplete component only mounts if it suspended inside a non-
    // concurrent tree, in an inconsistent state. We want to treat it like
    // a new mount, even though an empty version of it already committed.
    // Disconnect the alternate pointers.
    _current.alternate = null;
    workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

    workInProgress.effectTag |= Placement;
  } // Promote the fiber to a class and try rendering again.

  workInProgress.tag = ClassComponent; // The rest of this function is a fork of `updateClassComponent`
  // Push context providers early to prevent context stack mismatches.
  // During mounting we don't know the child context yet as the instance doesn't exist.
  // We will invalidate the child context in finishClassComponent() right after rendering.

  var hasContext;

  if (isContextProvider(Component)) {
    hasContext = true;
    pushContextProvider(workInProgress);
  } else {
    hasContext = false;
  }

  prepareToReadContext(workInProgress, renderExpirationTime);
  constructClassInstance(
    workInProgress,
    Component,
    nextProps,
    renderExpirationTime
  );
  mountClassInstance(
    workInProgress,
    Component,
    nextProps,
    renderExpirationTime
  );
  return finishClassComponent(
    null,
    workInProgress,
    Component,
    true,
    hasContext,
    renderExpirationTime
  );
}

function mountIndeterminateComponent(
  _current,
  workInProgress,
  Component,
  renderExpirationTime
) {
  if (_current !== null) {
    // An indeterminate component only mounts if it suspended inside a non-
    // concurrent tree, in an inconsistent state. We want to treat it like
    // a new mount, even though an empty version of it already committed.
    // Disconnect the alternate pointers.
    _current.alternate = null;
    workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

    workInProgress.effectTag |= Placement;
  }

  var props = workInProgress.pendingProps;
  var context;

  if (!disableLegacyContext) {
    var unmaskedContext = getUnmaskedContext(workInProgress, Component, false);
    context = getMaskedContext(workInProgress, unmaskedContext);
  }

  prepareToReadContext(workInProgress, renderExpirationTime);
  var value;

  {
    if (
      Component.prototype &&
      typeof Component.prototype.render === "function"
    ) {
      var componentName = getComponentName(Component) || "Unknown";

      if (!didWarnAboutBadClass[componentName]) {
        warningWithoutStack$1(
          false,
          "The <%s /> component appears to have a render method, but doesn't extend React.Component. " +
            "This is likely to cause errors. Change %s to extend React.Component instead.",
          componentName,
          componentName
        );
        didWarnAboutBadClass[componentName] = true;
      }
    }

    if (workInProgress.mode & StrictMode) {
      ReactStrictModeWarnings.recordLegacyContextWarning(workInProgress, null);
    }

    ReactCurrentOwner$3.current = workInProgress;
    value = renderWithHooks(
      null,
      workInProgress,
      Component,
      props,
      context,
      renderExpirationTime
    );
  } // React DevTools reads this flag.

  workInProgress.effectTag |= PerformedWork;

  if (
    typeof value === "object" &&
    value !== null &&
    typeof value.render === "function" &&
    value.$$typeof === undefined
  ) {
    {
      var _componentName = getComponentName(Component) || "Unknown";

      if (!didWarnAboutModulePatternComponent[_componentName]) {
        warningWithoutStack$1(
          false,
          "The <%s /> component appears to be a function component that returns a class instance. " +
            "Change %s to a class that extends React.Component instead. " +
            "If you can't use a class try assigning the prototype on the function as a workaround. " +
            "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " +
            "cannot be called with `new` by React.",
          _componentName,
          _componentName,
          _componentName
        );
        didWarnAboutModulePatternComponent[_componentName] = true;
      }
    } // Proceed under the assumption that this is a class instance

    workInProgress.tag = ClassComponent; // Throw out any hooks that were used.

    resetHooks(); // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance doesn't exist.
    // We will invalidate the child context in finishClassComponent() right after rendering.

    var hasContext = false;

    if (isContextProvider(Component)) {
      hasContext = true;
      pushContextProvider(workInProgress);
    } else {
      hasContext = false;
    }

    workInProgress.memoizedState =
      value.state !== null && value.state !== undefined ? value.state : null;
    var getDerivedStateFromProps = Component.getDerivedStateFromProps;

    if (typeof getDerivedStateFromProps === "function") {
      applyDerivedStateFromProps(
        workInProgress,
        Component,
        getDerivedStateFromProps,
        props
      );
    }

    adoptClassInstance(workInProgress, value);
    mountClassInstance(workInProgress, Component, props, renderExpirationTime);
    return finishClassComponent(
      null,
      workInProgress,
      Component,
      true,
      hasContext,
      renderExpirationTime
    );
  } else {
    // Proceed under the assumption that this is a function component
    workInProgress.tag = FunctionComponent;

    {
      if (disableLegacyContext && Component.contextTypes) {
        warningWithoutStack$1(
          false,
          "%s uses the legacy contextTypes API which is no longer supported. " +
            "Use React.createContext() with React.useContext() instead.",
          getComponentName(Component) || "Unknown"
        );
      }

      if (
        debugRenderPhaseSideEffectsForStrictMode &&
        workInProgress.mode & StrictMode
      ) {
        // Only double-render components with Hooks
        if (workInProgress.memoizedState !== null) {
          value = renderWithHooks(
            null,
            workInProgress,
            Component,
            props,
            context,
            renderExpirationTime
          );
        }
      }
    }

    reconcileChildren(null, workInProgress, value, renderExpirationTime);

    {
      validateFunctionComponentInDev(workInProgress, Component);
    }

    return workInProgress.child;
  }
}

function validateFunctionComponentInDev(workInProgress, Component) {
  if (Component) {
    !!Component.childContextTypes
      ? warningWithoutStack$1(
          false,
          "%s(...): childContextTypes cannot be defined on a function component.",
          Component.displayName || Component.name || "Component"
        )
      : void 0;
  }

  if (workInProgress.ref !== null) {
    var info = "";
    var ownerName = getCurrentFiberOwnerNameInDevOrNull();

    if (ownerName) {
      info += "\n\nCheck the render method of `" + ownerName + "`.";
    }

    var warningKey = ownerName || workInProgress._debugID || "";
    var debugSource = workInProgress._debugSource;

    if (debugSource) {
      warningKey = debugSource.fileName + ":" + debugSource.lineNumber;
    }

    if (!didWarnAboutFunctionRefs[warningKey]) {
      didWarnAboutFunctionRefs[warningKey] = true;
      warning$1(
        false,
        "Function components cannot be given refs. " +
          "Attempts to access this ref will fail. " +
          "Did you mean to use React.forwardRef()?%s",
        info
      );
    }
  }

  if (
    warnAboutDefaultPropsOnFunctionComponents &&
    Component.defaultProps !== undefined
  ) {
    var componentName = getComponentName(Component) || "Unknown";

    if (!didWarnAboutDefaultPropsOnFunctionComponent[componentName]) {
      warningWithoutStack$1(
        false,
        "%s: Support for defaultProps will be removed from function components " +
          "in a future major release. Use JavaScript default parameters instead.",
        componentName
      );
      didWarnAboutDefaultPropsOnFunctionComponent[componentName] = true;
    }
  }

  if (typeof Component.getDerivedStateFromProps === "function") {
    var _componentName2 = getComponentName(Component) || "Unknown";

    if (!didWarnAboutGetDerivedStateOnFunctionComponent[_componentName2]) {
      warningWithoutStack$1(
        false,
        "%s: Function components do not support getDerivedStateFromProps.",
        _componentName2
      );
      didWarnAboutGetDerivedStateOnFunctionComponent[_componentName2] = true;
    }
  }

  if (
    typeof Component.contextType === "object" &&
    Component.contextType !== null
  ) {
    var _componentName3 = getComponentName(Component) || "Unknown";

    if (!didWarnAboutContextTypeOnFunctionComponent[_componentName3]) {
      warningWithoutStack$1(
        false,
        "%s: Function components do not support contextType.",
        _componentName3
      );
      didWarnAboutContextTypeOnFunctionComponent[_componentName3] = true;
    }
  }
}

var SUSPENDED_MARKER = {
  dehydrated: null,
  retryTime: NoWork
};

function shouldRemainOnFallback(suspenseContext, current$$1, workInProgress) {
  // If the context is telling us that we should show a fallback, and we're not
  // already showing content, then we should show the fallback instead.
  return (
    hasSuspenseContext(suspenseContext, ForceSuspenseFallback) &&
    (current$$1 === null || current$$1.memoizedState !== null)
  );
}

function updateSuspenseComponent(
  current$$1,
  workInProgress,
  renderExpirationTime
) {
  var mode = workInProgress.mode;
  var nextProps = workInProgress.pendingProps; // This is used by DevTools to force a boundary to suspend.

  {
    if (shouldSuspend(workInProgress)) {
      workInProgress.effectTag |= DidCapture;
    }
  }

  var suspenseContext = suspenseStackCursor.current;
  var nextDidTimeout = false;
  var didSuspend = (workInProgress.effectTag & DidCapture) !== NoEffect;

  if (
    didSuspend ||
    shouldRemainOnFallback(suspenseContext, current$$1, workInProgress)
  ) {
    // Something in this boundary's subtree already suspended. Switch to
    // rendering the fallback children.
    nextDidTimeout = true;
    workInProgress.effectTag &= ~DidCapture;
  } else {
    // Attempting the main content
    if (current$$1 === null || current$$1.memoizedState !== null) {
      // This is a new mount or this boundary is already showing a fallback state.
      // Mark this subtree context as having at least one invisible parent that could
      // handle the fallback state.
      // Boundaries without fallbacks or should be avoided are not considered since
      // they cannot handle preferred fallback states.
      if (
        nextProps.fallback !== undefined &&
        nextProps.unstable_avoidThisFallback !== true
      ) {
        suspenseContext = addSubtreeSuspenseContext(
          suspenseContext,
          InvisibleParentSuspenseContext
        );
      }
    }
  }

  suspenseContext = setDefaultShallowSuspenseContext(suspenseContext);
  pushSuspenseContext(workInProgress, suspenseContext);

  {
    if ("maxDuration" in nextProps) {
      if (!didWarnAboutMaxDuration) {
        didWarnAboutMaxDuration = true;
        warning$1(
          false,
          "maxDuration has been removed from React. " +
            "Remove the maxDuration prop."
        );
      }
    }
  } // This next part is a bit confusing. If the children timeout, we switch to
  // showing the fallback children in place of the "primary" children.
  // However, we don't want to delete the primary children because then their
  // state will be lost (both the React state and the host state, e.g.
  // uncontrolled form inputs). Instead we keep them mounted and hide them.
  // Both the fallback children AND the primary children are rendered at the
  // same time. Once the primary children are un-suspended, we can delete
  // the fallback children — don't need to preserve their state.
  //
  // The two sets of children are siblings in the host environment, but
  // semantically, for purposes of reconciliation, they are two separate sets.
  // So we store them using two fragment fibers.
  //
  // However, we want to avoid allocating extra fibers for every placeholder.
  // They're only necessary when the children time out, because that's the
  // only time when both sets are mounted.
  //
  // So, the extra fragment fibers are only used if the children time out.
  // Otherwise, we render the primary children directly. This requires some
  // custom reconciliation logic to preserve the state of the primary
  // children. It's essentially a very basic form of re-parenting.

  if (current$$1 === null) {
    // If we're currently hydrating, try to hydrate this boundary.
    // But only if this has a fallback.
    if (nextProps.fallback !== undefined) {
      tryToClaimNextHydratableInstance(workInProgress); // This could've been a dehydrated suspense component.

      if (enableSuspenseServerRenderer) {
        var suspenseState = workInProgress.memoizedState;

        if (suspenseState !== null) {
          var dehydrated = suspenseState.dehydrated;

          if (dehydrated !== null) {
            return mountDehydratedSuspenseComponent(
              workInProgress,
              dehydrated,
              renderExpirationTime
            );
          }
        }
      }
    } // This is the initial mount. This branch is pretty simple because there's
    // no previous state that needs to be preserved.

    if (nextDidTimeout) {
      // Mount separate fragments for primary and fallback children.
      var nextFallbackChildren = nextProps.fallback;
      var primaryChildFragment = createFiberFromFragment(
        null,
        mode,
        NoWork,
        null
      );
      primaryChildFragment.return = workInProgress;

      if ((workInProgress.mode & BlockingMode) === NoMode) {
        // Outside of blocking mode, we commit the effects from the
        // partially completed, timed-out tree, too.
        var progressedState = workInProgress.memoizedState;
        var progressedPrimaryChild =
          progressedState !== null
            ? workInProgress.child.child
            : workInProgress.child;
        primaryChildFragment.child = progressedPrimaryChild;
        var progressedChild = progressedPrimaryChild;

        while (progressedChild !== null) {
          progressedChild.return = primaryChildFragment;
          progressedChild = progressedChild.sibling;
        }
      }

      var fallbackChildFragment = createFiberFromFragment(
        nextFallbackChildren,
        mode,
        renderExpirationTime,
        null
      );
      fallbackChildFragment.return = workInProgress;
      primaryChildFragment.sibling = fallbackChildFragment; // Skip the primary children, and continue working on the
      // fallback children.

      workInProgress.memoizedState = SUSPENDED_MARKER;
      workInProgress.child = primaryChildFragment;
      return fallbackChildFragment;
    } else {
      // Mount the primary children without an intermediate fragment fiber.
      var nextPrimaryChildren = nextProps.children;
      workInProgress.memoizedState = null;
      return (workInProgress.child = mountChildFibers(
        workInProgress,
        null,
        nextPrimaryChildren,
        renderExpirationTime
      ));
    }
  } else {
    // This is an update. This branch is more complicated because we need to
    // ensure the state of the primary children is preserved.
    var prevState = current$$1.memoizedState;

    if (prevState !== null) {
      if (enableSuspenseServerRenderer) {
        var _dehydrated = prevState.dehydrated;

        if (_dehydrated !== null) {
          if (!didSuspend) {
            return updateDehydratedSuspenseComponent(
              current$$1,
              workInProgress,
              _dehydrated,
              prevState,
              renderExpirationTime
            );
          } else if (workInProgress.memoizedState !== null) {
            // Something suspended and we should still be in dehydrated mode.
            // Leave the existing child in place.
            workInProgress.child = current$$1.child; // The dehydrated completion pass expects this flag to be there
            // but the normal suspense pass doesn't.

            workInProgress.effectTag |= DidCapture;
            return null;
          } else {
            // Suspended but we should no longer be in dehydrated mode.
            // Therefore we now have to render the fallback. Wrap the children
            // in a fragment fiber to keep them separate from the fallback
            // children.
            var _nextFallbackChildren = nextProps.fallback;

            var _primaryChildFragment = createFiberFromFragment(
              // It shouldn't matter what the pending props are because we aren't
              // going to render this fragment.
              null,
              mode,
              NoWork,
              null
            );

            _primaryChildFragment.return = workInProgress; // This is always null since we never want the previous child
            // that we're not going to hydrate.

            _primaryChildFragment.child = null;

            if ((workInProgress.mode & BlockingMode) === NoMode) {
              // Outside of blocking mode, we commit the effects from the
              // partially completed, timed-out tree, too.
              var _progressedChild = (_primaryChildFragment.child =
                workInProgress.child);

              while (_progressedChild !== null) {
                _progressedChild.return = _primaryChildFragment;
                _progressedChild = _progressedChild.sibling;
              }
            } else {
              // We will have dropped the effect list which contains the deletion.
              // We need to reconcile to delete the current child.
              reconcileChildFibers(
                workInProgress,
                current$$1.child,
                null,
                renderExpirationTime
              );
            } // Because primaryChildFragment is a new fiber that we're inserting as the
            // parent of a new tree, we need to set its treeBaseDuration.

            if (enableProfilerTimer && workInProgress.mode & ProfileMode) {
              // treeBaseDuration is the sum of all the child tree base durations.
              var treeBaseDuration = 0;
              var hiddenChild = _primaryChildFragment.child;

              while (hiddenChild !== null) {
                treeBaseDuration += hiddenChild.treeBaseDuration;
                hiddenChild = hiddenChild.sibling;
              }

              _primaryChildFragment.treeBaseDuration = treeBaseDuration;
            } // Create a fragment from the fallback children, too.

            var _fallbackChildFragment = createFiberFromFragment(
              _nextFallbackChildren,
              mode,
              renderExpirationTime,
              null
            );

            _fallbackChildFragment.return = workInProgress;
            _primaryChildFragment.sibling = _fallbackChildFragment;
            _fallbackChildFragment.effectTag |= Placement;
            _primaryChildFragment.childExpirationTime = NoWork;
            workInProgress.memoizedState = SUSPENDED_MARKER;
            workInProgress.child = _primaryChildFragment; // Skip the primary children, and continue working on the
            // fallback children.

            return _fallbackChildFragment;
          }
        }
      } // The current tree already timed out. That means each child set is
      // wrapped in a fragment fiber.

      var currentPrimaryChildFragment = current$$1.child;
      var currentFallbackChildFragment = currentPrimaryChildFragment.sibling;

      if (nextDidTimeout) {
        // Still timed out. Reuse the current primary children by cloning
        // its fragment. We're going to skip over these entirely.
        var _nextFallbackChildren2 = nextProps.fallback;

        var _primaryChildFragment2 = createWorkInProgress(
          currentPrimaryChildFragment,
          currentPrimaryChildFragment.pendingProps,
          NoWork
        );

        _primaryChildFragment2.return = workInProgress;

        if ((workInProgress.mode & BlockingMode) === NoMode) {
          // Outside of blocking mode, we commit the effects from the
          // partially completed, timed-out tree, too.
          var _progressedState = workInProgress.memoizedState;

          var _progressedPrimaryChild =
            _progressedState !== null
              ? workInProgress.child.child
              : workInProgress.child;

          if (_progressedPrimaryChild !== currentPrimaryChildFragment.child) {
            _primaryChildFragment2.child = _progressedPrimaryChild;
            var _progressedChild2 = _progressedPrimaryChild;

            while (_progressedChild2 !== null) {
              _progressedChild2.return = _primaryChildFragment2;
              _progressedChild2 = _progressedChild2.sibling;
            }
          }
        } // Because primaryChildFragment is a new fiber that we're inserting as the
        // parent of a new tree, we need to set its treeBaseDuration.

        if (enableProfilerTimer && workInProgress.mode & ProfileMode) {
          // treeBaseDuration is the sum of all the child tree base durations.
          var _treeBaseDuration = 0;
          var _hiddenChild = _primaryChildFragment2.child;

          while (_hiddenChild !== null) {
            _treeBaseDuration += _hiddenChild.treeBaseDuration;
            _hiddenChild = _hiddenChild.sibling;
          }

          _primaryChildFragment2.treeBaseDuration = _treeBaseDuration;
        } // Clone the fallback child fragment, too. These we'll continue
        // working on.

        var _fallbackChildFragment2 = createWorkInProgress(
          currentFallbackChildFragment,
          _nextFallbackChildren2,
          currentFallbackChildFragment.expirationTime
        );

        _fallbackChildFragment2.return = workInProgress;
        _primaryChildFragment2.sibling = _fallbackChildFragment2;
        _primaryChildFragment2.childExpirationTime = NoWork; // Skip the primary children, and continue working on the
        // fallback children.

        workInProgress.memoizedState = SUSPENDED_MARKER;
        workInProgress.child = _primaryChildFragment2;
        return _fallbackChildFragment2;
      } else {
        // No longer suspended. Switch back to showing the primary children,
        // and remove the intermediate fragment fiber.
        var _nextPrimaryChildren = nextProps.children;
        var currentPrimaryChild = currentPrimaryChildFragment.child;
        var primaryChild = reconcileChildFibers(
          workInProgress,
          currentPrimaryChild,
          _nextPrimaryChildren,
          renderExpirationTime
        ); // If this render doesn't suspend, we need to delete the fallback
        // children. Wait until the complete phase, after we've confirmed the
        // fallback is no longer needed.
        // TODO: Would it be better to store the fallback fragment on
        // the stateNode?
        // Continue rendering the children, like we normally do.

        workInProgress.memoizedState = null;
        return (workInProgress.child = primaryChild);
      }
    } else {
      // The current tree has not already timed out. That means the primary
      // children are not wrapped in a fragment fiber.
      var _currentPrimaryChild = current$$1.child;

      if (nextDidTimeout) {
        // Timed out. Wrap the children in a fragment fiber to keep them
        // separate from the fallback children.
        var _nextFallbackChildren3 = nextProps.fallback;

        var _primaryChildFragment3 = createFiberFromFragment(
          // It shouldn't matter what the pending props are because we aren't
          // going to render this fragment.
          null,
          mode,
          NoWork,
          null
        );

        _primaryChildFragment3.return = workInProgress;
        _primaryChildFragment3.child = _currentPrimaryChild;

        if (_currentPrimaryChild !== null) {
          _currentPrimaryChild.return = _primaryChildFragment3;
        } // Even though we're creating a new fiber, there are no new children,
        // because we're reusing an already mounted tree. So we don't need to
        // schedule a placement.
        // primaryChildFragment.effectTag |= Placement;

        if ((workInProgress.mode & BlockingMode) === NoMode) {
          // Outside of blocking mode, we commit the effects from the
          // partially completed, timed-out tree, too.
          var _progressedState2 = workInProgress.memoizedState;

          var _progressedPrimaryChild2 =
            _progressedState2 !== null
              ? workInProgress.child.child
              : workInProgress.child;

          _primaryChildFragment3.child = _progressedPrimaryChild2;
          var _progressedChild3 = _progressedPrimaryChild2;

          while (_progressedChild3 !== null) {
            _progressedChild3.return = _primaryChildFragment3;
            _progressedChild3 = _progressedChild3.sibling;
          }
        } // Because primaryChildFragment is a new fiber that we're inserting as the
        // parent of a new tree, we need to set its treeBaseDuration.

        if (enableProfilerTimer && workInProgress.mode & ProfileMode) {
          // treeBaseDuration is the sum of all the child tree base durations.
          var _treeBaseDuration2 = 0;
          var _hiddenChild2 = _primaryChildFragment3.child;

          while (_hiddenChild2 !== null) {
            _treeBaseDuration2 += _hiddenChild2.treeBaseDuration;
            _hiddenChild2 = _hiddenChild2.sibling;
          }

          _primaryChildFragment3.treeBaseDuration = _treeBaseDuration2;
        } // Create a fragment from the fallback children, too.

        var _fallbackChildFragment3 = createFiberFromFragment(
          _nextFallbackChildren3,
          mode,
          renderExpirationTime,
          null
        );

        _fallbackChildFragment3.return = workInProgress;
        _primaryChildFragment3.sibling = _fallbackChildFragment3;
        _fallbackChildFragment3.effectTag |= Placement;
        _primaryChildFragment3.childExpirationTime = NoWork; // Skip the primary children, and continue working on the
        // fallback children.

        workInProgress.memoizedState = SUSPENDED_MARKER;
        workInProgress.child = _primaryChildFragment3;
        return _fallbackChildFragment3;
      } else {
        // Still haven't timed out.  Continue rendering the children, like we
        // normally do.
        workInProgress.memoizedState = null;
        var _nextPrimaryChildren2 = nextProps.children;
        return (workInProgress.child = reconcileChildFibers(
          workInProgress,
          _currentPrimaryChild,
          _nextPrimaryChildren2,
          renderExpirationTime
        ));
      }
    }
  }
}

function retrySuspenseComponentWithoutHydrating(
  current$$1,
  workInProgress,
  renderExpirationTime
) {
  // We're now not suspended nor dehydrated.
  workInProgress.memoizedState = null; // Retry with the full children.

  var nextProps = workInProgress.pendingProps;
  var nextChildren = nextProps.children; // This will ensure that the children get Placement effects and
  // that the old child gets a Deletion effect.
  // We could also call forceUnmountCurrentAndReconcile.

  reconcileChildren(
    current$$1,
    workInProgress,
    nextChildren,
    renderExpirationTime
  );
  return workInProgress.child;
}

function mountDehydratedSuspenseComponent(
  workInProgress,
  suspenseInstance,
  renderExpirationTime
) {
  // During the first pass, we'll bail out and not drill into the children.
  // Instead, we'll leave the content in place and try to hydrate it later.
  if ((workInProgress.mode & BlockingMode) === NoMode) {
    {
      warning$1(
        false,
        "Cannot hydrate Suspense in legacy mode. Switch from " +
          "ReactDOM.hydrate(element, container) to " +
          "ReactDOM.createBlockingRoot(container, { hydrate: true })" +
          ".render(element) or remove the Suspense components from " +
          "the server rendered components."
      );
    }

    workInProgress.expirationTime = Sync;
  } else if (isSuspenseInstanceFallback(suspenseInstance)) {
    // This is a client-only boundary. Since we won't get any content from the server
    // for this, we need to schedule that at a higher priority based on when it would
    // have timed out. In theory we could render it in this pass but it would have the
    // wrong priority associated with it and will prevent hydration of parent path.
    // Instead, we'll leave work left on it to render it in a separate commit.
    // TODO This time should be the time at which the server rendered response that is
    // a parent to this boundary was displayed. However, since we currently don't have
    // a protocol to transfer that time, we'll just estimate it by using the current
    // time. This will mean that Suspense timeouts are slightly shifted to later than
    // they should be.
    var serverDisplayTime = requestCurrentTimeForUpdate(); // Schedule a normal pri update to render this content.

    var newExpirationTime = computeAsyncExpiration(serverDisplayTime);

    if (enableSchedulerTracing) {
      markSpawnedWork(newExpirationTime);
    }

    workInProgress.expirationTime = newExpirationTime;
  } else {
    // We'll continue hydrating the rest at offscreen priority since we'll already
    // be showing the right content coming from the server, it is no rush.
    workInProgress.expirationTime = Never;

    if (enableSchedulerTracing) {
      markSpawnedWork(Never);
    }
  }

  return null;
}

function updateDehydratedSuspenseComponent(
  current$$1,
  workInProgress,
  suspenseInstance,
  suspenseState,
  renderExpirationTime
) {
  // We should never be hydrating at this point because it is the first pass,
  // but after we've already committed once.
  warnIfHydrating();

  if ((workInProgress.mode & BlockingMode) === NoMode) {
    return retrySuspenseComponentWithoutHydrating(
      current$$1,
      workInProgress,
      renderExpirationTime
    );
  }

  if (isSuspenseInstanceFallback(suspenseInstance)) {
    // This boundary is in a permanent fallback state. In this case, we'll never
    // get an update and we'll never be able to hydrate the final content. Let's just try the
    // client side render instead.
    return retrySuspenseComponentWithoutHydrating(
      current$$1,
      workInProgress,
      renderExpirationTime
    );
  } // We use childExpirationTime to indicate that a child might depend on context, so if
  // any context has changed, we need to treat is as if the input might have changed.

  var hasContextChanged$$1 =
    current$$1.childExpirationTime >= renderExpirationTime;

  if (didReceiveUpdate || hasContextChanged$$1) {
    // This boundary has changed since the first render. This means that we are now unable to
    // hydrate it. We might still be able to hydrate it using an earlier expiration time, if
    // we are rendering at lower expiration than sync.
    if (renderExpirationTime < Sync) {
      if (suspenseState.retryTime <= renderExpirationTime) {
        // This render is even higher pri than we've seen before, let's try again
        // at even higher pri.
        var attemptHydrationAtExpirationTime = renderExpirationTime + 1;
        suspenseState.retryTime = attemptHydrationAtExpirationTime;
        scheduleWork(current$$1, attemptHydrationAtExpirationTime); // TODO: Early abort this render.
      } else {
        // We have already tried to ping at a higher priority than we're rendering with
        // so if we got here, we must have failed to hydrate at those levels. We must
        // now give up. Instead, we're going to delete the whole subtree and instead inject
        // a new real Suspense boundary to take its place, which may render content
        // or fallback. This might suspend for a while and if it does we might still have
        // an opportunity to hydrate before this pass commits.
      }
    } // If we have scheduled higher pri work above, this will probably just abort the render
    // since we now have higher priority work, but in case it doesn't, we need to prepare to
    // render something, if we time out. Even if that requires us to delete everything and
    // skip hydration.
    // Delay having to do this as long as the suspense timeout allows us.

    renderDidSuspendDelayIfPossible();
    return retrySuspenseComponentWithoutHydrating(
      current$$1,
      workInProgress,
      renderExpirationTime
    );
  } else if (isSuspenseInstancePending(suspenseInstance)) {
    // This component is still pending more data from the server, so we can't hydrate its
    // content. We treat it as if this component suspended itself. It might seem as if
    // we could just try to render it client-side instead. However, this will perform a
    // lot of unnecessary work and is unlikely to complete since it often will suspend
    // on missing data anyway. Additionally, the server might be able to render more
    // than we can on the client yet. In that case we'd end up with more fallback states
    // on the client than if we just leave it alone. If the server times out or errors
    // these should update this boundary to the permanent Fallback state instead.
    // Mark it as having captured (i.e. suspended).
    workInProgress.effectTag |= DidCapture; // Leave the child in place. I.e. the dehydrated fragment.

    workInProgress.child = current$$1.child; // Register a callback to retry this boundary once the server has sent the result.

    registerSuspenseInstanceRetry(
      suspenseInstance,
      retryDehydratedSuspenseBoundary.bind(null, current$$1)
    );
    return null;
  } else {
    // This is the first attempt.
    reenterHydrationStateFromDehydratedSuspenseInstance(
      workInProgress,
      suspenseInstance
    );
    var nextProps = workInProgress.pendingProps;
    var nextChildren = nextProps.children;
    var child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderExpirationTime
    );
    var node = child;

    while (node) {
      // Mark each child as hydrating. This is a fast path to know whether this
      // tree is part of a hydrating tree. This is used to determine if a child
      // node has fully mounted yet, and for scheduling event replaying.
      // Conceptually this is similar to Placement in that a new subtree is
      // inserted into the React tree here. It just happens to not need DOM
      // mutations because it already exists.
      node.effectTag |= Hydrating;
      node = node.sibling;
    }

    workInProgress.child = child;
    return workInProgress.child;
  }
}

function scheduleWorkOnFiber(fiber, renderExpirationTime) {
  if (fiber.expirationTime < renderExpirationTime) {
    fiber.expirationTime = renderExpirationTime;
  }

  var alternate = fiber.alternate;

  if (alternate !== null && alternate.expirationTime < renderExpirationTime) {
    alternate.expirationTime = renderExpirationTime;
  }

  scheduleWorkOnParentPath(fiber.return, renderExpirationTime);
}

function propagateSuspenseContextChange(
  workInProgress,
  firstChild,
  renderExpirationTime
) {
  // Mark any Suspense boundaries with fallbacks as having work to do.
  // If they were previously forced into fallbacks, they may now be able
  // to unblock.
  var node = firstChild;

  while (node !== null) {
    if (node.tag === SuspenseComponent) {
      var state = node.memoizedState;

      if (state !== null) {
        scheduleWorkOnFiber(node, renderExpirationTime);
      }
    } else if (node.tag === SuspenseListComponent) {
      // If the tail is hidden there might not be an Suspense boundaries
      // to schedule work on. In this case we have to schedule it on the
      // list itself.
      // We don't have to traverse to the children of the list since
      // the list will propagate the change when it rerenders.
      scheduleWorkOnFiber(node, renderExpirationTime);
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    if (node === workInProgress) {
      return;
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }

      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function findLastContentRow(firstChild) {
  // This is going to find the last row among these children that is already
  // showing content on the screen, as opposed to being in fallback state or
  // new. If a row has multiple Suspense boundaries, any of them being in the
  // fallback state, counts as the whole row being in a fallback state.
  // Note that the "rows" will be workInProgress, but any nested children
  // will still be current since we haven't rendered them yet. The mounted
  // order may not be the same as the new order. We use the new order.
  var row = firstChild;
  var lastContentRow = null;

  while (row !== null) {
    var currentRow = row.alternate; // New rows can't be content rows.

    if (currentRow !== null && findFirstSuspended(currentRow) === null) {
      lastContentRow = row;
    }

    row = row.sibling;
  }

  return lastContentRow;
}

function validateRevealOrder(revealOrder) {
  {
    if (
      revealOrder !== undefined &&
      revealOrder !== "forwards" &&
      revealOrder !== "backwards" &&
      revealOrder !== "together" &&
      !didWarnAboutRevealOrder[revealOrder]
    ) {
      didWarnAboutRevealOrder[revealOrder] = true;

      if (typeof revealOrder === "string") {
        switch (revealOrder.toLowerCase()) {
          case "together":
          case "forwards":
          case "backwards": {
            warning$1(
              false,
              '"%s" is not a valid value for revealOrder on <SuspenseList />. ' +
                'Use lowercase "%s" instead.',
              revealOrder,
              revealOrder.toLowerCase()
            );
            break;
          }

          case "forward":
          case "backward": {
            warning$1(
              false,
              '"%s" is not a valid value for revealOrder on <SuspenseList />. ' +
                'React uses the -s suffix in the spelling. Use "%ss" instead.',
              revealOrder,
              revealOrder.toLowerCase()
            );
            break;
          }

          default:
            warning$1(
              false,
              '"%s" is not a supported revealOrder on <SuspenseList />. ' +
                'Did you mean "together", "forwards" or "backwards"?',
              revealOrder
            );
            break;
        }
      } else {
        warning$1(
          false,
          "%s is not a supported value for revealOrder on <SuspenseList />. " +
            'Did you mean "together", "forwards" or "backwards"?',
          revealOrder
        );
      }
    }
  }
}

function validateTailOptions(tailMode, revealOrder) {
  {
    if (tailMode !== undefined && !didWarnAboutTailOptions[tailMode]) {
      if (tailMode !== "collapsed" && tailMode !== "hidden") {
        didWarnAboutTailOptions[tailMode] = true;
        warning$1(
          false,
          '"%s" is not a supported value for tail on <SuspenseList />. ' +
            'Did you mean "collapsed" or "hidden"?',
          tailMode
        );
      } else if (revealOrder !== "forwards" && revealOrder !== "backwards") {
        didWarnAboutTailOptions[tailMode] = true;
        warning$1(
          false,
          '<SuspenseList tail="%s" /> is only valid if revealOrder is ' +
            '"forwards" or "backwards". ' +
            'Did you mean to specify revealOrder="forwards"?',
          tailMode
        );
      }
    }
  }
}

function validateSuspenseListNestedChild(childSlot, index) {
  {
    var isArray = Array.isArray(childSlot);
    var isIterable = !isArray && typeof getIteratorFn(childSlot) === "function";

    if (isArray || isIterable) {
      var type = isArray ? "array" : "iterable";
      warning$1(
        false,
        "A nested %s was passed to row #%s in <SuspenseList />. Wrap it in " +
          "an additional SuspenseList to configure its revealOrder: " +
          "<SuspenseList revealOrder=...> ... " +
          "<SuspenseList revealOrder=...>{%s}</SuspenseList> ... " +
          "</SuspenseList>",
        type,
        index,
        type
      );
      return false;
    }
  }

  return true;
}

function validateSuspenseListChildren(children, revealOrder) {
  {
    if (
      (revealOrder === "forwards" || revealOrder === "backwards") &&
      children !== undefined &&
      children !== null &&
      children !== false
    ) {
      if (Array.isArray(children)) {
        for (var i = 0; i < children.length; i++) {
          if (!validateSuspenseListNestedChild(children[i], i)) {
            return;
          }
        }
      } else {
        var iteratorFn = getIteratorFn(children);

        if (typeof iteratorFn === "function") {
          var childrenIterator = iteratorFn.call(children);

          if (childrenIterator) {
            var step = childrenIterator.next();
            var _i = 0;

            for (; !step.done; step = childrenIterator.next()) {
              if (!validateSuspenseListNestedChild(step.value, _i)) {
                return;
              }

              _i++;
            }
          }
        } else {
          warning$1(
            false,
            'A single row was passed to a <SuspenseList revealOrder="%s" />. ' +
              "This is not useful since it needs multiple rows. " +
              "Did you mean to pass multiple children or an array?",
            revealOrder
          );
        }
      }
    }
  }
}

function initSuspenseListRenderState(
  workInProgress,
  isBackwards,
  tail,
  lastContentRow,
  tailMode,
  lastEffectBeforeRendering
) {
  var renderState = workInProgress.memoizedState;

  if (renderState === null) {
    workInProgress.memoizedState = {
      isBackwards: isBackwards,
      rendering: null,
      last: lastContentRow,
      tail: tail,
      tailExpiration: 0,
      tailMode: tailMode,
      lastEffect: lastEffectBeforeRendering
    };
  } else {
    // We can reuse the existing object from previous renders.
    renderState.isBackwards = isBackwards;
    renderState.rendering = null;
    renderState.last = lastContentRow;
    renderState.tail = tail;
    renderState.tailExpiration = 0;
    renderState.tailMode = tailMode;
    renderState.lastEffect = lastEffectBeforeRendering;
  }
} // This can end up rendering this component multiple passes.
// The first pass splits the children fibers into two sets. A head and tail.
// We first render the head. If anything is in fallback state, we do another
// pass through beginWork to rerender all children (including the tail) with
// the force suspend context. If the first render didn't have anything in
// in fallback state. Then we render each row in the tail one-by-one.
// That happens in the completeWork phase without going back to beginWork.

function updateSuspenseListComponent(
  current$$1,
  workInProgress,
  renderExpirationTime
) {
  var nextProps = workInProgress.pendingProps;
  var revealOrder = nextProps.revealOrder;
  var tailMode = nextProps.tail;
  var newChildren = nextProps.children;
  validateRevealOrder(revealOrder);
  validateTailOptions(tailMode, revealOrder);
  validateSuspenseListChildren(newChildren, revealOrder);
  reconcileChildren(
    current$$1,
    workInProgress,
    newChildren,
    renderExpirationTime
  );
  var suspenseContext = suspenseStackCursor.current;
  var shouldForceFallback = hasSuspenseContext(
    suspenseContext,
    ForceSuspenseFallback
  );

  if (shouldForceFallback) {
    suspenseContext = setShallowSuspenseContext(
      suspenseContext,
      ForceSuspenseFallback
    );
    workInProgress.effectTag |= DidCapture;
  } else {
    var didSuspendBefore =
      current$$1 !== null && (current$$1.effectTag & DidCapture) !== NoEffect;

    if (didSuspendBefore) {
      // If we previously forced a fallback, we need to schedule work
      // on any nested boundaries to let them know to try to render
      // again. This is the same as context updating.
      propagateSuspenseContextChange(
        workInProgress,
        workInProgress.child,
        renderExpirationTime
      );
    }

    suspenseContext = setDefaultShallowSuspenseContext(suspenseContext);
  }

  pushSuspenseContext(workInProgress, suspenseContext);

  if ((workInProgress.mode & BlockingMode) === NoMode) {
    // Outside of blocking mode, SuspenseList doesn't work so we just
    // use make it a noop by treating it as the default revealOrder.
    workInProgress.memoizedState = null;
  } else {
    switch (revealOrder) {
      case "forwards": {
        var lastContentRow = findLastContentRow(workInProgress.child);
        var tail;

        if (lastContentRow === null) {
          // The whole list is part of the tail.
          // TODO: We could fast path by just rendering the tail now.
          tail = workInProgress.child;
          workInProgress.child = null;
        } else {
          // Disconnect the tail rows after the content row.
          // We're going to render them separately later.
          tail = lastContentRow.sibling;
          lastContentRow.sibling = null;
        }

        initSuspenseListRenderState(
          workInProgress,
          false, // isBackwards
          tail,
          lastContentRow,
          tailMode,
          workInProgress.lastEffect
        );
        break;
      }

      case "backwards": {
        // We're going to find the first row that has existing content.
        // At the same time we're going to reverse the list of everything
        // we pass in the meantime. That's going to be our tail in reverse
        // order.
        var _tail = null;
        var row = workInProgress.child;
        workInProgress.child = null;

        while (row !== null) {
          var currentRow = row.alternate; // New rows can't be content rows.

          if (currentRow !== null && findFirstSuspended(currentRow) === null) {
            // This is the beginning of the main content.
            workInProgress.child = row;
            break;
          }

          var nextRow = row.sibling;
          row.sibling = _tail;
          _tail = row;
          row = nextRow;
        } // TODO: If workInProgress.child is null, we can continue on the tail immediately.

        initSuspenseListRenderState(
          workInProgress,
          true, // isBackwards
          _tail,
          null, // last
          tailMode,
          workInProgress.lastEffect
        );
        break;
      }

      case "together": {
        initSuspenseListRenderState(
          workInProgress,
          false, // isBackwards
          null, // tail
          null, // last
          undefined,
          workInProgress.lastEffect
        );
        break;
      }

      default: {
        // The default reveal order is the same as not having
        // a boundary.
        workInProgress.memoizedState = null;
      }
    }
  }

  return workInProgress.child;
}

function updatePortalComponent(
  current$$1,
  workInProgress,
  renderExpirationTime
) {
  pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
  var nextChildren = workInProgress.pendingProps;

  if (current$$1 === null) {
    // Portals are special because we don't append the children during mount
    // but at commit. Therefore we need to track insertions which the normal
    // flow doesn't do during mount. This doesn't happen at the root because
    // the root always starts with a "current" with a null child.
    // TODO: Consider unifying this with how the root works.
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderExpirationTime
    );
  } else {
    reconcileChildren(
      current$$1,
      workInProgress,
      nextChildren,
      renderExpirationTime
    );
  }

  return workInProgress.child;
}

function updateContextProvider(
  current$$1,
  workInProgress,
  renderExpirationTime
) {
  var providerType = workInProgress.type;
  var context = providerType._context;
  var newProps = workInProgress.pendingProps;
  var oldProps = workInProgress.memoizedProps;
  var newValue = newProps.value;

  {
    var providerPropTypes = workInProgress.type.propTypes;

    if (providerPropTypes) {
      checkPropTypes(
        providerPropTypes,
        newProps,
        "prop",
        "Context.Provider",
        getCurrentFiberStackInDev
      );
    }
  }

  pushProvider(workInProgress, newValue);

  if (oldProps !== null) {
    var oldValue = oldProps.value;
    var changedBits = calculateChangedBits(context, newValue, oldValue);

    if (changedBits === 0) {
      // No change. Bailout early if children are the same.
      if (oldProps.children === newProps.children && !hasContextChanged()) {
        return bailoutOnAlreadyFinishedWork(
          current$$1,
          workInProgress,
          renderExpirationTime
        );
      }
    } else {
      // The context value changed. Search for matching consumers and schedule
      // them to update.
      propagateContextChange(
        workInProgress,
        context,
        changedBits,
        renderExpirationTime
      );
    }
  }

  var newChildren = newProps.children;
  reconcileChildren(
    current$$1,
    workInProgress,
    newChildren,
    renderExpirationTime
  );
  return workInProgress.child;
}

var hasWarnedAboutUsingContextAsConsumer = false;

function updateContextConsumer(
  current$$1,
  workInProgress,
  renderExpirationTime
) {
  var context = workInProgress.type; // The logic below for Context differs depending on PROD or DEV mode. In
  // DEV mode, we create a separate object for Context.Consumer that acts
  // like a proxy to Context. This proxy object adds unnecessary code in PROD
  // so we use the old behaviour (Context.Consumer references Context) to
  // reduce size and overhead. The separate object references context via
  // a property called "_context", which also gives us the ability to check
  // in DEV mode if this property exists or not and warn if it does not.

  {
    if (context._context === undefined) {
      // This may be because it's a Context (rather than a Consumer).
      // Or it may be because it's older React where they're the same thing.
      // We only want to warn if we're sure it's a new React.
      if (context !== context.Consumer) {
        if (!hasWarnedAboutUsingContextAsConsumer) {
          hasWarnedAboutUsingContextAsConsumer = true;
          warning$1(
            false,
            "Rendering <Context> directly is not supported and will be removed in " +
              "a future major release. Did you mean to render <Context.Consumer> instead?"
          );
        }
      }
    } else {
      context = context._context;
    }
  }

  var newProps = workInProgress.pendingProps;
  var render = newProps.children;

  {
    !(typeof render === "function")
      ? warningWithoutStack$1(
          false,
          "A context consumer was rendered with multiple children, or a child " +
            "that isn't a function. A context consumer expects a single child " +
            "that is a function. If you did pass a function, make sure there " +
            "is no trailing or leading whitespace around it."
        )
      : void 0;
  }

  prepareToReadContext(workInProgress, renderExpirationTime);
  var newValue = readContext(context, newProps.unstable_observedBits);
  var newChildren;

  {
    ReactCurrentOwner$3.current = workInProgress;
    setCurrentPhase("render");
    newChildren = render(newValue);
    setCurrentPhase(null);
  } // React DevTools reads this flag.

  workInProgress.effectTag |= PerformedWork;
  reconcileChildren(
    current$$1,
    workInProgress,
    newChildren,
    renderExpirationTime
  );
  return workInProgress.child;
}

function updateFundamentalComponent$1(
  current$$1,
  workInProgress,
  renderExpirationTime
) {
  var fundamentalImpl = workInProgress.type.impl;

  if (fundamentalImpl.reconcileChildren === false) {
    return null;
  }

  var nextProps = workInProgress.pendingProps;
  var nextChildren = nextProps.children;
  reconcileChildren(
    current$$1,
    workInProgress,
    nextChildren,
    renderExpirationTime
  );
  return workInProgress.child;
}

function updateScopeComponent(
  current$$1,
  workInProgress,
  renderExpirationTime
) {
  var nextProps = workInProgress.pendingProps;
  var nextChildren = nextProps.children;
  reconcileChildren(
    current$$1,
    workInProgress,
    nextChildren,
    renderExpirationTime
  );
  return workInProgress.child;
}

function markWorkInProgressReceivedUpdate() {
  didReceiveUpdate = true;
}

function bailoutOnAlreadyFinishedWork(
  current$$1,
  workInProgress,
  renderExpirationTime
) {
  cancelWorkTimer(workInProgress);

  if (current$$1 !== null) {
    // Reuse previous dependencies
    workInProgress.dependencies = current$$1.dependencies;
  }

  if (enableProfilerTimer) {
    // Don't update "base" render times for bailouts.
    stopProfilerTimerIfRunning(workInProgress);
  }

  var updateExpirationTime = workInProgress.expirationTime;

  if (updateExpirationTime !== NoWork) {
    markUnprocessedUpdateTime(updateExpirationTime);
  } // Check if the children have any pending work.

  var childExpirationTime = workInProgress.childExpirationTime;

  if (childExpirationTime < renderExpirationTime) {
    // The children don't have any work either. We can skip them.
    // TODO: Once we add back resuming, we should check if the children are
    // a work-in-progress set. If so, we need to transfer their effects.
    return null;
  } else {
    // This fiber doesn't have work, but its subtree does. Clone the child
    // fibers and continue.
    cloneChildFibers(current$$1, workInProgress);
    return workInProgress.child;
  }
}

function remountFiber(current$$1, oldWorkInProgress, newWorkInProgress) {
  {
    var returnFiber = oldWorkInProgress.return;

    if (returnFiber === null) {
      throw new Error("Cannot swap the root fiber.");
    } // Disconnect from the old current.
    // It will get deleted.

    current$$1.alternate = null;
    oldWorkInProgress.alternate = null; // Connect to the new tree.

    newWorkInProgress.index = oldWorkInProgress.index;
    newWorkInProgress.sibling = oldWorkInProgress.sibling;
    newWorkInProgress.return = oldWorkInProgress.return;
    newWorkInProgress.ref = oldWorkInProgress.ref; // Replace the child/sibling pointers above it.

    if (oldWorkInProgress === returnFiber.child) {
      returnFiber.child = newWorkInProgress;
    } else {
      var prevSibling = returnFiber.child;

      if (prevSibling === null) {
        throw new Error("Expected parent to have a child.");
      }

      while (prevSibling.sibling !== oldWorkInProgress) {
        prevSibling = prevSibling.sibling;

        if (prevSibling === null) {
          throw new Error("Expected to find the previous sibling.");
        }
      }

      prevSibling.sibling = newWorkInProgress;
    } // Delete the old fiber and place the new one.
    // Since the old fiber is disconnected, we have to schedule it manually.

    var last = returnFiber.lastEffect;

    if (last !== null) {
      last.nextEffect = current$$1;
      returnFiber.lastEffect = current$$1;
    } else {
      returnFiber.firstEffect = returnFiber.lastEffect = current$$1;
    }

    current$$1.nextEffect = null;
    current$$1.effectTag = Deletion;
    newWorkInProgress.effectTag |= Placement; // Restart work from the new fiber.

    return newWorkInProgress;
  }
}

function beginWork$1(current$$1, workInProgress, renderExpirationTime) {
  var updateExpirationTime = workInProgress.expirationTime;

  {
    if (workInProgress._debugNeedsRemount && current$$1 !== null) {
      // This will restart the begin phase with a new fiber.
      return remountFiber(
        current$$1,
        workInProgress,
        createFiberFromTypeAndProps(
          workInProgress.type,
          workInProgress.key,
          workInProgress.pendingProps,
          workInProgress._debugOwner || null,
          workInProgress.mode,
          workInProgress.expirationTime
        )
      );
    }
  }

  if (current$$1 !== null) {
    var oldProps = current$$1.memoizedProps;
    var newProps = workInProgress.pendingProps;

    if (
      oldProps !== newProps ||
      hasContextChanged() || // Force a re-render if the implementation changed due to hot reload:
      workInProgress.type !== current$$1.type
    ) {
      // If props or context changed, mark the fiber as having performed work.
      // This may be unset if the props are determined to be equal later (memo).
      didReceiveUpdate = true;
    } else if (updateExpirationTime < renderExpirationTime) {
      didReceiveUpdate = false; // This fiber does not have any pending work. Bailout without entering
      // the begin phase. There's still some bookkeeping we that needs to be done
      // in this optimized path, mostly pushing stuff onto the stack.

      switch (workInProgress.tag) {
        case HostRoot:
          pushHostRootContext(workInProgress);
          resetHydrationState();
          break;

        case HostComponent:
          pushHostContext(workInProgress);

          if (
            workInProgress.mode & ConcurrentMode &&
            renderExpirationTime !== Never &&
            shouldDeprioritizeSubtree(workInProgress.type, newProps)
          ) {
            if (enableSchedulerTracing) {
              markSpawnedWork(Never);
            } // Schedule this fiber to re-render at offscreen priority. Then bailout.

            workInProgress.expirationTime = workInProgress.childExpirationTime = Never;
            return null;
          }

          break;

        case ClassComponent: {
          var Component = workInProgress.type;

          if (isContextProvider(Component)) {
            pushContextProvider(workInProgress);
          }

          break;
        }

        case HostPortal:
          pushHostContainer(
            workInProgress,
            workInProgress.stateNode.containerInfo
          );
          break;

        case ContextProvider: {
          var newValue = workInProgress.memoizedProps.value;
          pushProvider(workInProgress, newValue);
          break;
        }

        case Profiler:
          if (enableProfilerTimer) {
            // Profiler should only call onRender when one of its descendants actually rendered.
            var hasChildWork =
              workInProgress.childExpirationTime >= renderExpirationTime;

            if (hasChildWork) {
              workInProgress.effectTag |= Update;
            }
          }

          break;

        case SuspenseComponent: {
          var state = workInProgress.memoizedState;

          if (state !== null) {
            if (enableSuspenseServerRenderer) {
              if (state.dehydrated !== null) {
                pushSuspenseContext(
                  workInProgress,
                  setDefaultShallowSuspenseContext(suspenseStackCursor.current)
                ); // We know that this component will suspend again because if it has
                // been unsuspended it has committed as a resolved Suspense component.
                // If it needs to be retried, it should have work scheduled on it.

                workInProgress.effectTag |= DidCapture;
                break;
              }
            } // If this boundary is currently timed out, we need to decide
            // whether to retry the primary children, or to skip over it and
            // go straight to the fallback. Check the priority of the primary
            // child fragment.

            var primaryChildFragment = workInProgress.child;
            var primaryChildExpirationTime =
              primaryChildFragment.childExpirationTime;

            if (
              primaryChildExpirationTime !== NoWork &&
              primaryChildExpirationTime >= renderExpirationTime
            ) {
              // The primary children have pending work. Use the normal path
              // to attempt to render the primary children again.
              return updateSuspenseComponent(
                current$$1,
                workInProgress,
                renderExpirationTime
              );
            } else {
              pushSuspenseContext(
                workInProgress,
                setDefaultShallowSuspenseContext(suspenseStackCursor.current)
              ); // The primary children do not have pending work with sufficient
              // priority. Bailout.

              var child = bailoutOnAlreadyFinishedWork(
                current$$1,
                workInProgress,
                renderExpirationTime
              );

              if (child !== null) {
                // The fallback children have pending work. Skip over the
                // primary children and work on the fallback.
                return child.sibling;
              } else {
                return null;
              }
            }
          } else {
            pushSuspenseContext(
              workInProgress,
              setDefaultShallowSuspenseContext(suspenseStackCursor.current)
            );
          }

          break;
        }

        case SuspenseListComponent: {
          var didSuspendBefore =
            (current$$1.effectTag & DidCapture) !== NoEffect;

          var _hasChildWork =
            workInProgress.childExpirationTime >= renderExpirationTime;

          if (didSuspendBefore) {
            if (_hasChildWork) {
              // If something was in fallback state last time, and we have all the
              // same children then we're still in progressive loading state.
              // Something might get unblocked by state updates or retries in the
              // tree which will affect the tail. So we need to use the normal
              // path to compute the correct tail.
              return updateSuspenseListComponent(
                current$$1,
                workInProgress,
                renderExpirationTime
              );
            } // If none of the children had any work, that means that none of
            // them got retried so they'll still be blocked in the same way
            // as before. We can fast bail out.

            workInProgress.effectTag |= DidCapture;
          } // If nothing suspended before and we're rendering the same children,
          // then the tail doesn't matter. Anything new that suspends will work
          // in the "together" mode, so we can continue from the state we had.

          var renderState = workInProgress.memoizedState;

          if (renderState !== null) {
            // Reset to the "together" mode in case we've started a different
            // update in the past but didn't complete it.
            renderState.rendering = null;
            renderState.tail = null;
          }

          pushSuspenseContext(workInProgress, suspenseStackCursor.current);

          if (_hasChildWork) {
            break;
          } else {
            // If none of the children had any work, that means that none of
            // them got retried so they'll still be blocked in the same way
            // as before. We can fast bail out.
            return null;
          }
        }
      }

      return bailoutOnAlreadyFinishedWork(
        current$$1,
        workInProgress,
        renderExpirationTime
      );
    } else {
      // An update was scheduled on this fiber, but there are no new props
      // nor legacy context. Set this to false. If an update queue or context
      // consumer produces a changed value, it will set this to true. Otherwise,
      // the component will assume the children have not changed and bail out.
      didReceiveUpdate = false;
    }
  } else {
    didReceiveUpdate = false;
  } // Before entering the begin phase, clear the expiration time.

  workInProgress.expirationTime = NoWork;

  switch (workInProgress.tag) {
    case IndeterminateComponent: {
      return mountIndeterminateComponent(
        current$$1,
        workInProgress,
        workInProgress.type,
        renderExpirationTime
      );
    }

    case LazyComponent: {
      var elementType = workInProgress.elementType;
      return mountLazyComponent(
        current$$1,
        workInProgress,
        elementType,
        updateExpirationTime,
        renderExpirationTime
      );
    }

    case FunctionComponent: {
      var _Component = workInProgress.type;
      var unresolvedProps = workInProgress.pendingProps;
      var resolvedProps =
        workInProgress.elementType === _Component
          ? unresolvedProps
          : resolveDefaultProps(_Component, unresolvedProps);
      return updateFunctionComponent(
        current$$1,
        workInProgress,
        _Component,
        resolvedProps,
        renderExpirationTime
      );
    }

    case ClassComponent: {
      var _Component2 = workInProgress.type;
      var _unresolvedProps = workInProgress.pendingProps;

      var _resolvedProps =
        workInProgress.elementType === _Component2
          ? _unresolvedProps
          : resolveDefaultProps(_Component2, _unresolvedProps);

      return updateClassComponent(
        current$$1,
        workInProgress,
        _Component2,
        _resolvedProps,
        renderExpirationTime
      );
    }

    case HostRoot:
      return updateHostRoot(current$$1, workInProgress, renderExpirationTime);

    case HostComponent:
      return updateHostComponent(
        current$$1,
        workInProgress,
        renderExpirationTime
      );

    case HostText:
      return updateHostText(current$$1, workInProgress);

    case SuspenseComponent:
      return updateSuspenseComponent(
        current$$1,
        workInProgress,
        renderExpirationTime
      );

    case HostPortal:
      return updatePortalComponent(
        current$$1,
        workInProgress,
        renderExpirationTime
      );

    case ForwardRef: {
      var type = workInProgress.type;
      var _unresolvedProps2 = workInProgress.pendingProps;

      var _resolvedProps2 =
        workInProgress.elementType === type
          ? _unresolvedProps2
          : resolveDefaultProps(type, _unresolvedProps2);

      return updateForwardRef(
        current$$1,
        workInProgress,
        type,
        _resolvedProps2,
        renderExpirationTime
      );
    }

    case Fragment:
      return updateFragment(current$$1, workInProgress, renderExpirationTime);

    case Mode:
      return updateMode(current$$1, workInProgress, renderExpirationTime);

    case Profiler:
      return updateProfiler(current$$1, workInProgress, renderExpirationTime);

    case ContextProvider:
      return updateContextProvider(
        current$$1,
        workInProgress,
        renderExpirationTime
      );

    case ContextConsumer:
      return updateContextConsumer(
        current$$1,
        workInProgress,
        renderExpirationTime
      );

    case MemoComponent: {
      var _type2 = workInProgress.type;
      var _unresolvedProps3 = workInProgress.pendingProps; // Resolve outer props first, then resolve inner props.

      var _resolvedProps3 = resolveDefaultProps(_type2, _unresolvedProps3);

      {
        if (workInProgress.type !== workInProgress.elementType) {
          var outerPropTypes = _type2.propTypes;

          if (outerPropTypes) {
            checkPropTypes(
              outerPropTypes,
              _resolvedProps3, // Resolved for outer only
              "prop",
              getComponentName(_type2),
              getCurrentFiberStackInDev
            );
          }
        }
      }

      _resolvedProps3 = resolveDefaultProps(_type2.type, _resolvedProps3);
      return updateMemoComponent(
        current$$1,
        workInProgress,
        _type2,
        _resolvedProps3,
        updateExpirationTime,
        renderExpirationTime
      );
    }

    case SimpleMemoComponent: {
      return updateSimpleMemoComponent(
        current$$1,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps,
        updateExpirationTime,
        renderExpirationTime
      );
    }

    case IncompleteClassComponent: {
      var _Component3 = workInProgress.type;
      var _unresolvedProps4 = workInProgress.pendingProps;

      var _resolvedProps4 =
        workInProgress.elementType === _Component3
          ? _unresolvedProps4
          : resolveDefaultProps(_Component3, _unresolvedProps4);

      return mountIncompleteClassComponent(
        current$$1,
        workInProgress,
        _Component3,
        _resolvedProps4,
        renderExpirationTime
      );
    }

    case SuspenseListComponent: {
      return updateSuspenseListComponent(
        current$$1,
        workInProgress,
        renderExpirationTime
      );
    }

    case FundamentalComponent: {
      if (enableFundamentalAPI) {
        return updateFundamentalComponent$1(
          current$$1,
          workInProgress,
          renderExpirationTime
        );
      }

      break;
    }

    case ScopeComponent: {
      if (enableScopeAPI) {
        return updateScopeComponent(
          current$$1,
          workInProgress,
          renderExpirationTime
        );
      }

      break;
    }
  }

  {
    throw Error(
      "Unknown unit of work tag (" +
        workInProgress.tag +
        "). This error is likely caused by a bug in React. Please file an issue."
    );
  }
}

function createFundamentalStateInstance(currentFiber, props, impl, state) {
  return {
    currentFiber: currentFiber,
    impl: impl,
    instance: null,
    prevProps: null,
    props: props,
    state: state
  };
}

function isFiberSuspenseAndTimedOut(fiber) {
  return fiber.tag === SuspenseComponent && fiber.memoizedState !== null;
}

function getSuspenseFallbackChild(fiber) {
  return fiber.child.sibling.child;
}

var emptyObject$2 = {};

function collectScopedNodes(node, fn, scopedNodes) {
  if (enableScopeAPI) {
    if (node.tag === HostComponent) {
      var _type = node.type,
        memoizedProps = node.memoizedProps,
        stateNode = node.stateNode;

      var _instance = getPublicInstance(stateNode);

      if (
        _instance !== null &&
        fn(_type, memoizedProps || emptyObject$2, _instance) === true
      ) {
        scopedNodes.push(_instance);
      }
    }

    var child = node.child;

    if (isFiberSuspenseAndTimedOut(node)) {
      child = getSuspenseFallbackChild(node);
    }

    if (child !== null) {
      collectScopedNodesFromChildren(child, fn, scopedNodes);
    }
  }
}

function collectFirstScopedNode(node, fn) {
  if (enableScopeAPI) {
    if (node.tag === HostComponent) {
      var _type2 = node.type,
        memoizedProps = node.memoizedProps,
        stateNode = node.stateNode;

      var _instance2 = getPublicInstance(stateNode);

      if (
        _instance2 !== null &&
        fn(_type2, memoizedProps, _instance2) === true
      ) {
        return _instance2;
      }
    }

    var child = node.child;

    if (isFiberSuspenseAndTimedOut(node)) {
      child = getSuspenseFallbackChild(node);
    }

    if (child !== null) {
      return collectFirstScopedNodeFromChildren(child, fn);
    }
  }

  return null;
}

function collectScopedNodesFromChildren(startingChild, fn, scopedNodes) {
  var child = startingChild;

  while (child !== null) {
    collectScopedNodes(child, fn, scopedNodes);
    child = child.sibling;
  }
}

function collectFirstScopedNodeFromChildren(startingChild, fn) {
  var child = startingChild;

  while (child !== null) {
    var scopedNode = collectFirstScopedNode(child, fn);

    if (scopedNode !== null) {
      return scopedNode;
    }

    child = child.sibling;
  }

  return null;
}

function collectNearestScopeMethods(node, scope, childrenScopes) {
  if (isValidScopeNode(node, scope)) {
    childrenScopes.push(node.stateNode.methods);
  } else {
    var child = node.child;

    if (isFiberSuspenseAndTimedOut(node)) {
      child = getSuspenseFallbackChild(node);
    }

    if (child !== null) {
      collectNearestChildScopeMethods(child, scope, childrenScopes);
    }
  }
}

function collectNearestChildScopeMethods(startingChild, scope, childrenScopes) {
  var child = startingChild;

  while (child !== null) {
    collectNearestScopeMethods(child, scope, childrenScopes);
    child = child.sibling;
  }
}

function isValidScopeNode(node, scope) {
  return (
    node.tag === ScopeComponent &&
    node.type === scope &&
    node.stateNode !== null
  );
}

function createScopeMethods(scope, instance) {
  return {
    getChildren: function() {
      var currentFiber = instance.fiber;
      var child = currentFiber.child;
      var childrenScopes = [];

      if (child !== null) {
        collectNearestChildScopeMethods(child, scope, childrenScopes);
      }

      return childrenScopes.length === 0 ? null : childrenScopes;
    },
    getChildrenFromRoot: function() {
      var currentFiber = instance.fiber;
      var node = currentFiber;

      while (node !== null) {
        var parent = node.return;

        if (parent === null) {
          break;
        }

        node = parent;

        if (node.tag === ScopeComponent && node.type === scope) {
          break;
        }
      }

      var childrenScopes = [];
      collectNearestChildScopeMethods(node.child, scope, childrenScopes);
      return childrenScopes.length === 0 ? null : childrenScopes;
    },
    getParent: function() {
      var node = instance.fiber.return;

      while (node !== null) {
        if (node.tag === ScopeComponent && node.type === scope) {
          return node.stateNode.methods;
        }

        node = node.return;
      }

      return null;
    },
    getProps: function() {
      var currentFiber = instance.fiber;
      return currentFiber.memoizedProps;
    },
    queryAllNodes: function(fn) {
      var currentFiber = instance.fiber;
      var child = currentFiber.child;
      var scopedNodes = [];

      if (child !== null) {
        collectScopedNodesFromChildren(child, fn, scopedNodes);
      }

      return scopedNodes.length === 0 ? null : scopedNodes;
    },
    queryFirstNode: function(fn) {
      var currentFiber = instance.fiber;
      var child = currentFiber.child;

      if (child !== null) {
        return collectFirstScopedNodeFromChildren(child, fn);
      }

      return null;
    },
    containsNode: function(node) {
      var fiber = getInstanceFromNode$1(node);

      while (fiber !== null) {
        if (
          fiber.tag === ScopeComponent &&
          fiber.type === scope &&
          fiber.stateNode === instance
        ) {
          return true;
        }

        fiber = fiber.return;
      }

      return false;
    }
  };
}

function markUpdate(workInProgress) {
  // Tag the fiber with an update effect. This turns a Placement into
  // a PlacementAndUpdate.
  workInProgress.effectTag |= Update;
}

function markRef$1(workInProgress) {
  workInProgress.effectTag |= Ref;
}

var appendAllChildren;
var updateHostContainer;
var updateHostComponent$1;
var updateHostText$1;

if (supportsMutation) {
  // Mutation mode
  appendAllChildren = function(
    parent,
    workInProgress,
    needsVisibilityToggle,
    isHidden
  ) {
    // We only have the top Fiber that was created but we need recurse down its
    // children to find all the terminal nodes.
    var node = workInProgress.child;

    while (node !== null) {
      if (node.tag === HostComponent || node.tag === HostText) {
        appendInitialChild(parent, node.stateNode);
      } else if (enableFundamentalAPI && node.tag === FundamentalComponent) {
        appendInitialChild(parent, node.stateNode.instance);
      } else if (node.tag === HostPortal) {
        // If we have a portal child, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
      } else if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }

      if (node === workInProgress) {
        return;
      }

      while (node.sibling === null) {
        if (node.return === null || node.return === workInProgress) {
          return;
        }

        node = node.return;
      }

      node.sibling.return = node.return;
      node = node.sibling;
    }
  };

  updateHostContainer = function(workInProgress) {
    // Noop
  };

  updateHostComponent$1 = function(
    current,
    workInProgress,
    type,
    newProps,
    rootContainerInstance
  ) {
    // If we have an alternate, that means this is an update and we need to
    // schedule a side-effect to do the updates.
    var oldProps = current.memoizedProps;

    if (oldProps === newProps) {
      // In mutation mode, this is sufficient for a bailout because
      // we won't touch this node even if children changed.
      return;
    } // If we get updated because one of our children updated, we don't
    // have newProps so we'll have to reuse them.
    // TODO: Split the update API as separate for the props vs. children.
    // Even better would be if children weren't special cased at all tho.

    var instance = workInProgress.stateNode;
    var currentHostContext = getHostContext(); // TODO: Experiencing an error where oldProps is null. Suggests a host
    // component is hitting the resume path. Figure out why. Possibly
    // related to `hidden`.

    var updatePayload = prepareUpdate(
      instance,
      type,
      oldProps,
      newProps,
      rootContainerInstance,
      currentHostContext
    ); // TODO: Type this specific to this type of component.

    workInProgress.updateQueue = updatePayload; // If the update payload indicates that there is a change or if there
    // is a new ref we mark this as an update. All the work is done in commitWork.

    if (updatePayload) {
      markUpdate(workInProgress);
    }
  };

  updateHostText$1 = function(current, workInProgress, oldText, newText) {
    // If the text differs, mark it as an update. All the work in done in commitWork.
    if (oldText !== newText) {
      markUpdate(workInProgress);
    }
  };
} else if (supportsPersistence) {
  // Persistent host tree mode
  appendAllChildren = function(
    parent,
    workInProgress,
    needsVisibilityToggle,
    isHidden
  ) {
    // We only have the top Fiber that was created but we need recurse down its
    // children to find all the terminal nodes.
    var node = workInProgress.child;

    while (node !== null) {
      // eslint-disable-next-line no-labels
      branches: if (node.tag === HostComponent) {
        var instance = node.stateNode;

        if (needsVisibilityToggle && isHidden) {
          // This child is inside a timed out tree. Hide it.
          var props = node.memoizedProps;
          var type = node.type;
          instance = cloneHiddenInstance(instance, type, props, node);
        }

        appendInitialChild(parent, instance);
      } else if (node.tag === HostText) {
        var _instance = node.stateNode;

        if (needsVisibilityToggle && isHidden) {
          // This child is inside a timed out tree. Hide it.
          var text = node.memoizedProps;
          _instance = cloneHiddenTextInstance(_instance, text, node);
        }

        appendInitialChild(parent, _instance);
      } else if (enableFundamentalAPI && node.tag === FundamentalComponent) {
        var _instance2 = node.stateNode.instance;

        if (needsVisibilityToggle && isHidden) {
          // This child is inside a timed out tree. Hide it.
          var _props = node.memoizedProps;
          var _type = node.type;
          _instance2 = cloneHiddenInstance(_instance2, _type, _props, node);
        }

        appendInitialChild(parent, _instance2);
      } else if (node.tag === HostPortal) {
        // If we have a portal child, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
      } else if (node.tag === SuspenseComponent) {
        if ((node.effectTag & Update) !== NoEffect) {
          // Need to toggle the visibility of the primary children.
          var newIsHidden = node.memoizedState !== null;

          if (newIsHidden) {
            var primaryChildParent = node.child;

            if (primaryChildParent !== null) {
              if (primaryChildParent.child !== null) {
                primaryChildParent.child.return = primaryChildParent;
                appendAllChildren(
                  parent,
                  primaryChildParent,
                  true,
                  newIsHidden
                );
              }

              var fallbackChildParent = primaryChildParent.sibling;

              if (fallbackChildParent !== null) {
                fallbackChildParent.return = node;
                node = fallbackChildParent;
                continue;
              }
            }
          }
        }

        if (node.child !== null) {
          // Continue traversing like normal
          node.child.return = node;
          node = node.child;
          continue;
        }
      } else if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      } // $FlowFixMe This is correct but Flow is confused by the labeled break.

      node = node;

      if (node === workInProgress) {
        return;
      }

      while (node.sibling === null) {
        if (node.return === null || node.return === workInProgress) {
          return;
        }

        node = node.return;
      }

      node.sibling.return = node.return;
      node = node.sibling;
    }
  }; // An unfortunate fork of appendAllChildren because we have two different parent types.

  var appendAllChildrenToContainer = function(
    containerChildSet,
    workInProgress,
    needsVisibilityToggle,
    isHidden
  ) {
    // We only have the top Fiber that was created but we need recurse down its
    // children to find all the terminal nodes.
    var node = workInProgress.child;

    while (node !== null) {
      // eslint-disable-next-line no-labels
      branches: if (node.tag === HostComponent) {
        var instance = node.stateNode;

        if (needsVisibilityToggle && isHidden) {
          // This child is inside a timed out tree. Hide it.
          var props = node.memoizedProps;
          var type = node.type;
          instance = cloneHiddenInstance(instance, type, props, node);
        }

        appendChildToContainerChildSet(containerChildSet, instance);
      } else if (node.tag === HostText) {
        var _instance3 = node.stateNode;

        if (needsVisibilityToggle && isHidden) {
          // This child is inside a timed out tree. Hide it.
          var text = node.memoizedProps;
          _instance3 = cloneHiddenTextInstance(_instance3, text, node);
        }

        appendChildToContainerChildSet(containerChildSet, _instance3);
      } else if (enableFundamentalAPI && node.tag === FundamentalComponent) {
        var _instance4 = node.stateNode.instance;

        if (needsVisibilityToggle && isHidden) {
          // This child is inside a timed out tree. Hide it.
          var _props2 = node.memoizedProps;
          var _type2 = node.type;
          _instance4 = cloneHiddenInstance(_instance4, _type2, _props2, node);
        }

        appendChildToContainerChildSet(containerChildSet, _instance4);
      } else if (node.tag === HostPortal) {
        // If we have a portal child, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
      } else if (node.tag === SuspenseComponent) {
        if ((node.effectTag & Update) !== NoEffect) {
          // Need to toggle the visibility of the primary children.
          var newIsHidden = node.memoizedState !== null;

          if (newIsHidden) {
            var primaryChildParent = node.child;

            if (primaryChildParent !== null) {
              if (primaryChildParent.child !== null) {
                primaryChildParent.child.return = primaryChildParent;
                appendAllChildrenToContainer(
                  containerChildSet,
                  primaryChildParent,
                  true,
                  newIsHidden
                );
              }

              var fallbackChildParent = primaryChildParent.sibling;

              if (fallbackChildParent !== null) {
                fallbackChildParent.return = node;
                node = fallbackChildParent;
                continue;
              }
            }
          }
        }

        if (node.child !== null) {
          // Continue traversing like normal
          node.child.return = node;
          node = node.child;
          continue;
        }
      } else if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      } // $FlowFixMe This is correct but Flow is confused by the labeled break.

      node = node;

      if (node === workInProgress) {
        return;
      }

      while (node.sibling === null) {
        if (node.return === null || node.return === workInProgress) {
          return;
        }

        node = node.return;
      }

      node.sibling.return = node.return;
      node = node.sibling;
    }
  };

  updateHostContainer = function(workInProgress) {
    var portalOrRoot = workInProgress.stateNode;
    var childrenUnchanged = workInProgress.firstEffect === null;

    if (childrenUnchanged) {
      // No changes, just reuse the existing instance.
    } else {
      var container = portalOrRoot.containerInfo;
      var newChildSet = createContainerChildSet(container); // If children might have changed, we have to add them all to the set.

      appendAllChildrenToContainer(newChildSet, workInProgress, false, false);
      portalOrRoot.pendingChildren = newChildSet; // Schedule an update on the container to swap out the container.

      markUpdate(workInProgress);
      finalizeContainerChildren(container, newChildSet);
    }
  };

  updateHostComponent$1 = function(
    current,
    workInProgress,
    type,
    newProps,
    rootContainerInstance
  ) {
    var currentInstance = current.stateNode;
    var oldProps = current.memoizedProps; // If there are no effects associated with this node, then none of our children had any updates.
    // This guarantees that we can reuse all of them.

    var childrenUnchanged = workInProgress.firstEffect === null;

    if (childrenUnchanged && oldProps === newProps) {
      // No changes, just reuse the existing instance.
      // Note that this might release a previous clone.
      workInProgress.stateNode = currentInstance;
      return;
    }

    var recyclableInstance = workInProgress.stateNode;
    var currentHostContext = getHostContext();
    var updatePayload = null;

    if (oldProps !== newProps) {
      updatePayload = prepareUpdate(
        recyclableInstance,
        type,
        oldProps,
        newProps,
        rootContainerInstance,
        currentHostContext
      );
    }

    if (childrenUnchanged && updatePayload === null) {
      // No changes, just reuse the existing instance.
      // Note that this might release a previous clone.
      workInProgress.stateNode = currentInstance;
      return;
    }

    var newInstance = cloneInstance(
      currentInstance,
      updatePayload,
      type,
      oldProps,
      newProps,
      workInProgress,
      childrenUnchanged,
      recyclableInstance
    );

    if (
      finalizeInitialChildren(
        newInstance,
        type,
        newProps,
        rootContainerInstance,
        currentHostContext
      )
    ) {
      markUpdate(workInProgress);
    }

    workInProgress.stateNode = newInstance;

    if (childrenUnchanged) {
      // If there are no other effects in this tree, we need to flag this node as having one.
      // Even though we're not going to use it for anything.
      // Otherwise parents won't know that there are new children to propagate upwards.
      markUpdate(workInProgress);
    } else {
      // If children might have changed, we have to add them all to the set.
      appendAllChildren(newInstance, workInProgress, false, false);
    }
  };

  updateHostText$1 = function(current, workInProgress, oldText, newText) {
    if (oldText !== newText) {
      // If the text content differs, we'll create a new text instance for it.
      var rootContainerInstance = getRootHostContainer();
      var currentHostContext = getHostContext();
      workInProgress.stateNode = createTextInstance(
        newText,
        rootContainerInstance,
        currentHostContext,
        workInProgress
      ); // We'll have to mark it as having an effect, even though we won't use the effect for anything.
      // This lets the parents know that at least one of their children has changed.

      markUpdate(workInProgress);
    }
  };
} else {
  // No host operations
  updateHostContainer = function(workInProgress) {
    // Noop
  };

  updateHostComponent$1 = function(
    current,
    workInProgress,
    type,
    newProps,
    rootContainerInstance
  ) {
    // Noop
  };

  updateHostText$1 = function(current, workInProgress, oldText, newText) {
    // Noop
  };
}

function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
  switch (renderState.tailMode) {
    case "hidden": {
      // Any insertions at the end of the tail list after this point
      // should be invisible. If there are already mounted boundaries
      // anything before them are not considered for collapsing.
      // Therefore we need to go through the whole tail to find if
      // there are any.
      var tailNode = renderState.tail;
      var lastTailNode = null;

      while (tailNode !== null) {
        if (tailNode.alternate !== null) {
          lastTailNode = tailNode;
        }

        tailNode = tailNode.sibling;
      } // Next we're simply going to delete all insertions after the
      // last rendered item.

      if (lastTailNode === null) {
        // All remaining items in the tail are insertions.
        renderState.tail = null;
      } else {
        // Detach the insertion after the last node that was already
        // inserted.
        lastTailNode.sibling = null;
      }

      break;
    }

    case "collapsed": {
      // Any insertions at the end of the tail list after this point
      // should be invisible. If there are already mounted boundaries
      // anything before them are not considered for collapsing.
      // Therefore we need to go through the whole tail to find if
      // there are any.
      var _tailNode = renderState.tail;
      var _lastTailNode = null;

      while (_tailNode !== null) {
        if (_tailNode.alternate !== null) {
          _lastTailNode = _tailNode;
        }

        _tailNode = _tailNode.sibling;
      } // Next we're simply going to delete all insertions after the
      // last rendered item.

      if (_lastTailNode === null) {
        // All remaining items in the tail are insertions.
        if (!hasRenderedATailFallback && renderState.tail !== null) {
          // We suspended during the head. We want to show at least one
          // row at the tail. So we'll keep on and cut off the rest.
          renderState.tail.sibling = null;
        } else {
          renderState.tail = null;
        }
      } else {
        // Detach the insertion after the last node that was already
        // inserted.
        _lastTailNode.sibling = null;
      }

      break;
    }
  }
}

function completeWork(current, workInProgress, renderExpirationTime) {
  var newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case IndeterminateComponent:
      break;

    case LazyComponent:
      break;

    case SimpleMemoComponent:
    case FunctionComponent:
      break;

    case ClassComponent: {
      var Component = workInProgress.type;

      if (isContextProvider(Component)) {
        popContext(workInProgress);
      }

      break;
    }

    case HostRoot: {
      popHostContainer(workInProgress);
      popTopLevelContextObject(workInProgress);
      var fiberRoot = workInProgress.stateNode;

      if (fiberRoot.pendingContext) {
        fiberRoot.context = fiberRoot.pendingContext;
        fiberRoot.pendingContext = null;
      }

      if (current === null || current.child === null) {
        // If we hydrated, pop so that we can delete any remaining children
        // that weren't hydrated.
        var wasHydrated = popHydrationState(workInProgress);

        if (wasHydrated) {
          // If we hydrated, then we'll need to schedule an update for
          // the commit side-effects on the root.
          markUpdate(workInProgress);
        }
      }

      updateHostContainer(workInProgress);
      break;
    }

    case HostComponent: {
      popHostContext(workInProgress);
      var rootContainerInstance = getRootHostContainer();
      var type = workInProgress.type;

      if (current !== null && workInProgress.stateNode != null) {
        updateHostComponent$1(
          current,
          workInProgress,
          type,
          newProps,
          rootContainerInstance
        );

        if (enableFlareAPI) {
          var prevListeners = current.memoizedProps.listeners;
          var nextListeners = newProps.listeners;

          if (prevListeners !== nextListeners) {
            markUpdate(workInProgress);
          }
        }

        if (current.ref !== workInProgress.ref) {
          markRef$1(workInProgress);
        }
      } else {
        if (!newProps) {
          if (!(workInProgress.stateNode !== null)) {
            throw Error(
              "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
            );
          } // This can happen when we abort work.

          break;
        }

        var currentHostContext = getHostContext(); // TODO: Move createInstance to beginWork and keep it on a context
        // "stack" as the parent. Then append children as we go in beginWork
        // or completeWork depending on we want to add then top->down or
        // bottom->up. Top->down is faster in IE11.

        var _wasHydrated = popHydrationState(workInProgress);

        if (_wasHydrated) {
          // TODO: Move this and createInstance step into the beginPhase
          // to consolidate.
          if (
            prepareToHydrateHostInstance(
              workInProgress,
              rootContainerInstance,
              currentHostContext
            )
          ) {
            // If changes to the hydrated node needs to be applied at the
            // commit-phase we mark this as such.
            markUpdate(workInProgress);
          }

          if (enableFlareAPI) {
            var listeners = newProps.listeners;

            if (listeners != null) {
              updateEventListeners(
                listeners,
                workInProgress,
                rootContainerInstance
              );
            }
          }
        } else {
          var instance = createInstance(
            type,
            newProps,
            rootContainerInstance,
            currentHostContext,
            workInProgress
          );
          appendAllChildren(instance, workInProgress, false, false); // This needs to be set before we mount Flare event listeners

          workInProgress.stateNode = instance;

          if (enableFlareAPI) {
            var _listeners = newProps.listeners;

            if (_listeners != null) {
              updateEventListeners(
                _listeners,
                workInProgress,
                rootContainerInstance
              );
            }
          } // Certain renderers require commit-time effects for initial mount.
          // (eg DOM renderer supports auto-focus for certain elements).
          // Make sure such renderers get scheduled for later work.

          if (
            finalizeInitialChildren(
              instance,
              type,
              newProps,
              rootContainerInstance,
              currentHostContext
            )
          ) {
            markUpdate(workInProgress);
          }
        }

        if (workInProgress.ref !== null) {
          // If there is a ref on a host node we need to schedule a callback
          markRef$1(workInProgress);
        }
      }

      break;
    }

    case HostText: {
      var newText = newProps;

      if (current && workInProgress.stateNode != null) {
        var oldText = current.memoizedProps; // If we have an alternate, that means this is an update and we need
        // to schedule a side-effect to do the updates.

        updateHostText$1(current, workInProgress, oldText, newText);
      } else {
        if (typeof newText !== "string") {
          if (!(workInProgress.stateNode !== null)) {
            throw Error(
              "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
            );
          } // This can happen when we abort work.
        }

        var _rootContainerInstance = getRootHostContainer();

        var _currentHostContext = getHostContext();

        var _wasHydrated2 = popHydrationState(workInProgress);

        if (_wasHydrated2) {
          if (prepareToHydrateHostTextInstance(workInProgress)) {
            markUpdate(workInProgress);
          }
        } else {
          workInProgress.stateNode = createTextInstance(
            newText,
            _rootContainerInstance,
            _currentHostContext,
            workInProgress
          );
        }
      }

      break;
    }

    case ForwardRef:
      break;

    case SuspenseComponent: {
      popSuspenseContext(workInProgress);
      var nextState = workInProgress.memoizedState;

      if (enableSuspenseServerRenderer) {
        if (nextState !== null && nextState.dehydrated !== null) {
          if (current === null) {
            var _wasHydrated3 = popHydrationState(workInProgress);

            if (!_wasHydrated3) {
              throw Error(
                "A dehydrated suspense component was completed without a hydrated node. This is probably a bug in React."
              );
            }

            prepareToHydrateHostSuspenseInstance(workInProgress);

            if (enableSchedulerTracing) {
              markSpawnedWork(Never);
            }

            return null;
          } else {
            // We should never have been in a hydration state if we didn't have a current.
            // However, in some of those paths, we might have reentered a hydration state
            // and then we might be inside a hydration state. In that case, we'll need to
            // exit out of it.
            resetHydrationState();

            if ((workInProgress.effectTag & DidCapture) === NoEffect) {
              // This boundary did not suspend so it's now hydrated and unsuspended.
              workInProgress.memoizedState = null;
            } // If nothing suspended, we need to schedule an effect to mark this boundary
            // as having hydrated so events know that they're free be invoked.
            // It's also a signal to replay events and the suspense callback.
            // If something suspended, schedule an effect to attach retry listeners.
            // So we might as well always mark this.

            workInProgress.effectTag |= Update;
            return null;
          }
        }
      }

      if ((workInProgress.effectTag & DidCapture) !== NoEffect) {
        // Something suspended. Re-render with the fallback children.
        workInProgress.expirationTime = renderExpirationTime; // Do not reset the effect list.

        return workInProgress;
      }

      var nextDidTimeout = nextState !== null;
      var prevDidTimeout = false;

      if (current === null) {
        if (workInProgress.memoizedProps.fallback !== undefined) {
          popHydrationState(workInProgress);
        }
      } else {
        var prevState = current.memoizedState;
        prevDidTimeout = prevState !== null;

        if (!nextDidTimeout && prevState !== null) {
          // We just switched from the fallback to the normal children.
          // Delete the fallback.
          // TODO: Would it be better to store the fallback fragment on
          // the stateNode during the begin phase?
          var currentFallbackChild = current.child.sibling;

          if (currentFallbackChild !== null) {
            // Deletions go at the beginning of the return fiber's effect list
            var first = workInProgress.firstEffect;

            if (first !== null) {
              workInProgress.firstEffect = currentFallbackChild;
              currentFallbackChild.nextEffect = first;
            } else {
              workInProgress.firstEffect = workInProgress.lastEffect = currentFallbackChild;
              currentFallbackChild.nextEffect = null;
            }

            currentFallbackChild.effectTag = Deletion;
          }
        }
      }

      if (nextDidTimeout && !prevDidTimeout) {
        // If this subtreee is running in blocking mode we can suspend,
        // otherwise we won't suspend.
        // TODO: This will still suspend a synchronous tree if anything
        // in the concurrent tree already suspended during this render.
        // This is a known bug.
        if ((workInProgress.mode & BlockingMode) !== NoMode) {
          // TODO: Move this back to throwException because this is too late
          // if this is a large tree which is common for initial loads. We
          // don't know if we should restart a render or not until we get
          // this marker, and this is too late.
          // If this render already had a ping or lower pri updates,
          // and this is the first time we know we're going to suspend we
          // should be able to immediately restart from within throwException.
          var hasInvisibleChildContext =
            current === null &&
            workInProgress.memoizedProps.unstable_avoidThisFallback !== true;

          if (
            hasInvisibleChildContext ||
            hasSuspenseContext(
              suspenseStackCursor.current,
              InvisibleParentSuspenseContext
            )
          ) {
            // If this was in an invisible tree or a new render, then showing
            // this boundary is ok.
            renderDidSuspend();
          } else {
            // Otherwise, we're going to have to hide content so we should
            // suspend for longer if possible.
            renderDidSuspendDelayIfPossible();
          }
        }
      }

      if (supportsPersistence) {
        // TODO: Only schedule updates if not prevDidTimeout.
        if (nextDidTimeout) {
          // If this boundary just timed out, schedule an effect to attach a
          // retry listener to the proimse. This flag is also used to hide the
          // primary children.
          workInProgress.effectTag |= Update;
        }
      }

      if (supportsMutation) {
        // TODO: Only schedule updates if these values are non equal, i.e. it changed.
        if (nextDidTimeout || prevDidTimeout) {
          // If this boundary just timed out, schedule an effect to attach a
          // retry listener to the proimse. This flag is also used to hide the
          // primary children. In mutation mode, we also need the flag to
          // *unhide* children that were previously hidden, so check if the
          // is currently timed out, too.
          workInProgress.effectTag |= Update;
        }
      }

      if (
        enableSuspenseCallback &&
        workInProgress.updateQueue !== null &&
        workInProgress.memoizedProps.suspenseCallback != null
      ) {
        // Always notify the callback
        workInProgress.effectTag |= Update;
      }

      break;
    }

    case Fragment:
      break;

    case Mode:
      break;

    case Profiler:
      break;

    case HostPortal:
      popHostContainer(workInProgress);
      updateHostContainer(workInProgress);
      break;

    case ContextProvider:
      // Pop provider fiber
      popProvider(workInProgress);
      break;

    case ContextConsumer:
      break;

    case MemoComponent:
      break;

    case IncompleteClassComponent: {
      // Same as class component case. I put it down here so that the tags are
      // sequential to ensure this switch is compiled to a jump table.
      var _Component = workInProgress.type;

      if (isContextProvider(_Component)) {
        popContext(workInProgress);
      }

      break;
    }

    case SuspenseListComponent: {
      popSuspenseContext(workInProgress);
      var renderState = workInProgress.memoizedState;

      if (renderState === null) {
        // We're running in the default, "independent" mode. We don't do anything
        // in this mode.
        break;
      }

      var didSuspendAlready =
        (workInProgress.effectTag & DidCapture) !== NoEffect;
      var renderedTail = renderState.rendering;

      if (renderedTail === null) {
        // We just rendered the head.
        if (!didSuspendAlready) {
          // This is the first pass. We need to figure out if anything is still
          // suspended in the rendered set.
          // If new content unsuspended, but there's still some content that
          // didn't. Then we need to do a second pass that forces everything
          // to keep showing their fallbacks.
          // We might be suspended if something in this render pass suspended, or
          // something in the previous committed pass suspended. Otherwise,
          // there's no chance so we can skip the expensive call to
          // findFirstSuspended.
          var cannotBeSuspended =
            renderHasNotSuspendedYet() &&
            (current === null || (current.effectTag & DidCapture) === NoEffect);

          if (!cannotBeSuspended) {
            var row = workInProgress.child;

            while (row !== null) {
              var suspended = findFirstSuspended(row);

              if (suspended !== null) {
                didSuspendAlready = true;
                workInProgress.effectTag |= DidCapture;
                cutOffTailIfNeeded(renderState, false); // If this is a newly suspended tree, it might not get committed as
                // part of the second pass. In that case nothing will subscribe to
                // its thennables. Instead, we'll transfer its thennables to the
                // SuspenseList so that it can retry if they resolve.
                // There might be multiple of these in the list but since we're
                // going to wait for all of them anyway, it doesn't really matter
                // which ones gets to ping. In theory we could get clever and keep
                // track of how many dependencies remain but it gets tricky because
                // in the meantime, we can add/remove/change items and dependencies.
                // We might bail out of the loop before finding any but that
                // doesn't matter since that means that the other boundaries that
                // we did find already has their listeners attached.

                var newThennables = suspended.updateQueue;

                if (newThennables !== null) {
                  workInProgress.updateQueue = newThennables;
                  workInProgress.effectTag |= Update;
                } // Rerender the whole list, but this time, we'll force fallbacks
                // to stay in place.
                // Reset the effect list before doing the second pass since that's now invalid.

                if (renderState.lastEffect === null) {
                  workInProgress.firstEffect = null;
                }

                workInProgress.lastEffect = renderState.lastEffect; // Reset the child fibers to their original state.

                resetChildFibers(workInProgress, renderExpirationTime); // Set up the Suspense Context to force suspense and immediately
                // rerender the children.

                pushSuspenseContext(
                  workInProgress,
                  setShallowSuspenseContext(
                    suspenseStackCursor.current,
                    ForceSuspenseFallback
                  )
                );
                return workInProgress.child;
              }

              row = row.sibling;
            }
          }
        } else {
          cutOffTailIfNeeded(renderState, false);
        } // Next we're going to render the tail.
      } else {
        // Append the rendered row to the child list.
        if (!didSuspendAlready) {
          var _suspended = findFirstSuspended(renderedTail);

          if (_suspended !== null) {
            workInProgress.effectTag |= DidCapture;
            didSuspendAlready = true; // Ensure we transfer the update queue to the parent so that it doesn't
            // get lost if this row ends up dropped during a second pass.

            var _newThennables = _suspended.updateQueue;

            if (_newThennables !== null) {
              workInProgress.updateQueue = _newThennables;
              workInProgress.effectTag |= Update;
            }

            cutOffTailIfNeeded(renderState, true); // This might have been modified.

            if (
              renderState.tail === null &&
              renderState.tailMode === "hidden" &&
              !renderedTail.alternate
            ) {
              // We need to delete the row we just rendered.
              // Reset the effect list to what it was before we rendered this
              // child. The nested children have already appended themselves.
              var lastEffect = (workInProgress.lastEffect =
                renderState.lastEffect); // Remove any effects that were appended after this point.

              if (lastEffect !== null) {
                lastEffect.nextEffect = null;
              } // We're done.

              return null;
            }
          } else if (
            now() > renderState.tailExpiration &&
            renderExpirationTime > Never
          ) {
            // We have now passed our CPU deadline and we'll just give up further
            // attempts to render the main content and only render fallbacks.
            // The assumption is that this is usually faster.
            workInProgress.effectTag |= DidCapture;
            didSuspendAlready = true;
            cutOffTailIfNeeded(renderState, false); // Since nothing actually suspended, there will nothing to ping this
            // to get it started back up to attempt the next item. If we can show
            // them, then they really have the same priority as this render.
            // So we'll pick it back up the very next render pass once we've had
            // an opportunity to yield for paint.

            var nextPriority = renderExpirationTime - 1;
            workInProgress.expirationTime = workInProgress.childExpirationTime = nextPriority;

            if (enableSchedulerTracing) {
              markSpawnedWork(nextPriority);
            }
          }
        }

        if (renderState.isBackwards) {
          // The effect list of the backwards tail will have been added
          // to the end. This breaks the guarantee that life-cycles fire in
          // sibling order but that isn't a strong guarantee promised by React.
          // Especially since these might also just pop in during future commits.
          // Append to the beginning of the list.
          renderedTail.sibling = workInProgress.child;
          workInProgress.child = renderedTail;
        } else {
          var previousSibling = renderState.last;

          if (previousSibling !== null) {
            previousSibling.sibling = renderedTail;
          } else {
            workInProgress.child = renderedTail;
          }

          renderState.last = renderedTail;
        }
      }

      if (renderState.tail !== null) {
        // We still have tail rows to render.
        if (renderState.tailExpiration === 0) {
          // Heuristic for how long we're willing to spend rendering rows
          // until we just give up and show what we have so far.
          var TAIL_EXPIRATION_TIMEOUT_MS = 500;
          renderState.tailExpiration = now() + TAIL_EXPIRATION_TIMEOUT_MS;
        } // Pop a row.

        var next = renderState.tail;
        renderState.rendering = next;
        renderState.tail = next.sibling;
        renderState.lastEffect = workInProgress.lastEffect;
        next.sibling = null; // Restore the context.
        // TODO: We can probably just avoid popping it instead and only
        // setting it the first time we go from not suspended to suspended.

        var suspenseContext = suspenseStackCursor.current;

        if (didSuspendAlready) {
          suspenseContext = setShallowSuspenseContext(
            suspenseContext,
            ForceSuspenseFallback
          );
        } else {
          suspenseContext = setDefaultShallowSuspenseContext(suspenseContext);
        }

        pushSuspenseContext(workInProgress, suspenseContext); // Do a pass over the next row.

        return next;
      }

      break;
    }

    case FundamentalComponent: {
      if (enableFundamentalAPI) {
        var fundamentalImpl = workInProgress.type.impl;
        var fundamentalInstance = workInProgress.stateNode;

        if (fundamentalInstance === null) {
          var getInitialState = fundamentalImpl.getInitialState;
          var fundamentalState;

          if (getInitialState !== undefined) {
            fundamentalState = getInitialState(newProps);
          }

          fundamentalInstance = workInProgress.stateNode = createFundamentalStateInstance(
            workInProgress,
            newProps,
            fundamentalImpl,
            fundamentalState || {}
          );

          var _instance5 = getFundamentalComponentInstance(fundamentalInstance);

          fundamentalInstance.instance = _instance5;

          if (fundamentalImpl.reconcileChildren === false) {
            return null;
          }

          appendAllChildren(_instance5, workInProgress, false, false);
          mountFundamentalComponent(fundamentalInstance);
        } else {
          // We fire update in commit phase
          var prevProps = fundamentalInstance.props;
          fundamentalInstance.prevProps = prevProps;
          fundamentalInstance.props = newProps;
          fundamentalInstance.currentFiber = workInProgress;

          if (supportsPersistence) {
            var _instance6 = cloneFundamentalInstance(fundamentalInstance);

            fundamentalInstance.instance = _instance6;
            appendAllChildren(_instance6, workInProgress, false, false);
          }

          var shouldUpdate = shouldUpdateFundamentalComponent(
            fundamentalInstance
          );

          if (shouldUpdate) {
            markUpdate(workInProgress);
          }
        }
      }

      break;
    }

    case ScopeComponent: {
      if (enableScopeAPI) {
        if (current === null) {
          var _type3 = workInProgress.type;
          var scopeInstance = {
            fiber: workInProgress,
            methods: null
          };
          workInProgress.stateNode = scopeInstance;
          scopeInstance.methods = createScopeMethods(_type3, scopeInstance);

          if (enableFlareAPI) {
            var _listeners2 = newProps.listeners;

            if (_listeners2 != null) {
              var _rootContainerInstance2 = getRootHostContainer();

              updateEventListeners(
                _listeners2,
                workInProgress,
                _rootContainerInstance2
              );
            }
          }

          if (workInProgress.ref !== null) {
            markRef$1(workInProgress);
            markUpdate(workInProgress);
          }
        } else {
          if (enableFlareAPI) {
            var _prevListeners = current.memoizedProps.listeners;
            var _nextListeners = newProps.listeners;

            if (
              _prevListeners !== _nextListeners ||
              workInProgress.ref !== null
            ) {
              markUpdate(workInProgress);
            }
          } else {
            if (workInProgress.ref !== null) {
              markUpdate(workInProgress);
            }
          }

          if (current.ref !== workInProgress.ref) {
            markRef$1(workInProgress);
          }
        }
      }

      break;
    }

    default: {
      throw Error(
        "Unknown unit of work tag (" +
          workInProgress.tag +
          "). This error is likely caused by a bug in React. Please file an issue."
      );
    }
  }

  return null;
}

function unwindWork(workInProgress, renderExpirationTime) {
  switch (workInProgress.tag) {
    case ClassComponent: {
      var Component = workInProgress.type;

      if (isContextProvider(Component)) {
        popContext(workInProgress);
      }

      var effectTag = workInProgress.effectTag;

      if (effectTag & ShouldCapture) {
        workInProgress.effectTag = (effectTag & ~ShouldCapture) | DidCapture;
        return workInProgress;
      }

      return null;
    }

    case HostRoot: {
      popHostContainer(workInProgress);
      popTopLevelContextObject(workInProgress);
      var _effectTag = workInProgress.effectTag;

      if (!((_effectTag & DidCapture) === NoEffect)) {
        throw Error(
          "The root failed to unmount after an error. This is likely a bug in React. Please file an issue."
        );
      }

      workInProgress.effectTag = (_effectTag & ~ShouldCapture) | DidCapture;
      return workInProgress;
    }

    case HostComponent: {
      // TODO: popHydrationState
      popHostContext(workInProgress);
      return null;
    }

    case SuspenseComponent: {
      popSuspenseContext(workInProgress);

      if (enableSuspenseServerRenderer) {
        var suspenseState = workInProgress.memoizedState;

        if (suspenseState !== null && suspenseState.dehydrated !== null) {
          if (!(workInProgress.alternate !== null)) {
            throw Error(
              "Threw in newly mounted dehydrated component. This is likely a bug in React. Please file an issue."
            );
          }

          resetHydrationState();
        }
      }

      var _effectTag2 = workInProgress.effectTag;

      if (_effectTag2 & ShouldCapture) {
        workInProgress.effectTag = (_effectTag2 & ~ShouldCapture) | DidCapture; // Captured a suspense effect. Re-render the boundary.

        return workInProgress;
      }

      return null;
    }

    case SuspenseListComponent: {
      popSuspenseContext(workInProgress); // SuspenseList doesn't actually catch anything. It should've been
      // caught by a nested boundary. If not, it should bubble through.

      return null;
    }

    case HostPortal:
      popHostContainer(workInProgress);
      return null;

    case ContextProvider:
      popProvider(workInProgress);
      return null;

    default:
      return null;
  }
}

function unwindInterruptedWork(interruptedWork) {
  switch (interruptedWork.tag) {
    case ClassComponent: {
      var childContextTypes = interruptedWork.type.childContextTypes;

      if (childContextTypes !== null && childContextTypes !== undefined) {
        popContext(interruptedWork);
      }

      break;
    }

    case HostRoot: {
      popHostContainer(interruptedWork);
      popTopLevelContextObject(interruptedWork);
      break;
    }

    case HostComponent: {
      popHostContext(interruptedWork);
      break;
    }

    case HostPortal:
      popHostContainer(interruptedWork);
      break;

    case SuspenseComponent:
      popSuspenseContext(interruptedWork);
      break;

    case SuspenseListComponent:
      popSuspenseContext(interruptedWork);
      break;

    case ContextProvider:
      popProvider(interruptedWork);
      break;

    default:
      break;
  }
}

function createCapturedValue(value, source) {
  // If the value is an error, call this function immediately after it is thrown
  // so the stack is accurate.
  return {
    value: value,
    source: source,
    stack: getStackByFiberInDevAndProd(source)
  };
}

// Module provided by RN:
if (
  !(
    typeof ReactNativePrivateInterface.ReactFiberErrorDialog.showErrorDialog ===
    "function"
  )
) {
  throw Error(
    "Expected ReactFiberErrorDialog.showErrorDialog to be a function."
  );
}

function showErrorDialog(capturedError) {
  return ReactNativePrivateInterface.ReactFiberErrorDialog.showErrorDialog(
    capturedError
  );
}

function logCapturedError(capturedError) {
  var logError = showErrorDialog(capturedError); // Allow injected showErrorDialog() to prevent default console.error logging.
  // This enables renderers like ReactNative to better manage redbox behavior.

  if (logError === false) {
    return;
  }

  var error = capturedError.error;

  {
    var componentName = capturedError.componentName,
      componentStack = capturedError.componentStack,
      errorBoundaryName = capturedError.errorBoundaryName,
      errorBoundaryFound = capturedError.errorBoundaryFound,
      willRetry = capturedError.willRetry; // Browsers support silencing uncaught errors by calling
    // `preventDefault()` in window `error` handler.
    // We record this information as an expando on the error.

    if (error != null && error._suppressLogging) {
      if (errorBoundaryFound && willRetry) {
        // The error is recoverable and was silenced.
        // Ignore it and don't print the stack addendum.
        // This is handy for testing error boundaries without noise.
        return;
      } // The error is fatal. Since the silencing might have
      // been accidental, we'll surface it anyway.
      // However, the browser would have silenced the original error
      // so we'll print it first, and then print the stack addendum.

      console.error(error); // For a more detailed description of this block, see:
      // https://github.com/facebook/react/pull/13384
    }

    var componentNameMessage = componentName
      ? "The above error occurred in the <" + componentName + "> component:"
      : "The above error occurred in one of your React components:";
    var errorBoundaryMessage; // errorBoundaryFound check is sufficient; errorBoundaryName check is to satisfy Flow.

    if (errorBoundaryFound && errorBoundaryName) {
      if (willRetry) {
        errorBoundaryMessage =
          "React will try to recreate this component tree from scratch " +
          ("using the error boundary you provided, " + errorBoundaryName + ".");
      } else {
        errorBoundaryMessage =
          "This error was initially handled by the error boundary " +
          errorBoundaryName +
          ".\n" +
          "Recreating the tree from scratch failed so React will unmount the tree.";
      }
    } else {
      errorBoundaryMessage =
        "Consider adding an error boundary to your tree to customize error handling behavior.\n" +
        "Visit https://fb.me/react-error-boundaries to learn more about error boundaries.";
    }

    var combinedMessage =
      "" +
      componentNameMessage +
      componentStack +
      "\n\n" +
      ("" + errorBoundaryMessage); // In development, we provide our own message with just the component stack.
    // We don't include the original error message and JS stack because the browser
    // has already printed it. Even if the application swallows the error, it is still
    // displayed by the browser thanks to the DEV-only fake event trick in ReactErrorUtils.

    console.error(combinedMessage);
  }
}

var didWarnAboutUndefinedSnapshotBeforeUpdate = null;

{
  didWarnAboutUndefinedSnapshotBeforeUpdate = new Set();
}

var PossiblyWeakSet = typeof WeakSet === "function" ? WeakSet : Set;
function logError(boundary, errorInfo) {
  var source = errorInfo.source;
  var stack = errorInfo.stack;

  if (stack === null && source !== null) {
    stack = getStackByFiberInDevAndProd(source);
  }

  var capturedError = {
    componentName: source !== null ? getComponentName(source.type) : null,
    componentStack: stack !== null ? stack : "",
    error: errorInfo.value,
    errorBoundary: null,
    errorBoundaryName: null,
    errorBoundaryFound: false,
    willRetry: false
  };

  if (boundary !== null && boundary.tag === ClassComponent) {
    capturedError.errorBoundary = boundary.stateNode;
    capturedError.errorBoundaryName = getComponentName(boundary.type);
    capturedError.errorBoundaryFound = true;
    capturedError.willRetry = true;
  }

  try {
    logCapturedError(capturedError);
  } catch (e) {
    // This method must not throw, or React internal state will get messed up.
    // If console.error is overridden, or logCapturedError() shows a dialog that throws,
    // we want to report this error outside of the normal stack as a last resort.
    // https://github.com/facebook/react/issues/13188
    setTimeout(function() {
      throw e;
    });
  }
}

var callComponentWillUnmountWithTimer = function(current$$1, instance) {
  startPhaseTimer(current$$1, "componentWillUnmount");
  instance.props = current$$1.memoizedProps;
  instance.state = current$$1.memoizedState;
  instance.componentWillUnmount();
  stopPhaseTimer();
}; // Capture errors so they don't interrupt unmounting.

function safelyCallComponentWillUnmount(current$$1, instance) {
  {
    invokeGuardedCallback(
      null,
      callComponentWillUnmountWithTimer,
      null,
      current$$1,
      instance
    );

    if (hasCaughtError()) {
      var unmountError = clearCaughtError();
      captureCommitPhaseError(current$$1, unmountError);
    }
  }
}

function safelyDetachRef(current$$1) {
  var ref = current$$1.ref;

  if (ref !== null) {
    if (typeof ref === "function") {
      {
        invokeGuardedCallback(null, ref, null, null);

        if (hasCaughtError()) {
          var refError = clearCaughtError();
          captureCommitPhaseError(current$$1, refError);
        }
      }
    } else {
      ref.current = null;
    }
  }
}

function safelyCallDestroy(current$$1, destroy) {
  {
    invokeGuardedCallback(null, destroy, null);

    if (hasCaughtError()) {
      var error = clearCaughtError();
      captureCommitPhaseError(current$$1, error);
    }
  }
}

function commitBeforeMutationLifeCycles(current$$1, finishedWork) {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      commitHookEffectList(UnmountSnapshot, NoEffect$1, finishedWork);
      return;
    }

    case ClassComponent: {
      if (finishedWork.effectTag & Snapshot) {
        if (current$$1 !== null) {
          var prevProps = current$$1.memoizedProps;
          var prevState = current$$1.memoizedState;
          startPhaseTimer(finishedWork, "getSnapshotBeforeUpdate");
          var instance = finishedWork.stateNode; // We could update instance props and state here,
          // but instead we rely on them being set during last render.
          // TODO: revisit this when we implement resuming.

          {
            if (
              finishedWork.type === finishedWork.elementType &&
              !didWarnAboutReassigningProps
            ) {
              !(instance.props === finishedWork.memoizedProps)
                ? warning$1(
                    false,
                    "Expected %s props to match memoized props before " +
                      "getSnapshotBeforeUpdate. " +
                      "This might either be because of a bug in React, or because " +
                      "a component reassigns its own `this.props`. " +
                      "Please file an issue.",
                    getComponentName(finishedWork.type) || "instance"
                  )
                : void 0;
              !(instance.state === finishedWork.memoizedState)
                ? warning$1(
                    false,
                    "Expected %s state to match memoized state before " +
                      "getSnapshotBeforeUpdate. " +
                      "This might either be because of a bug in React, or because " +
                      "a component reassigns its own `this.props`. " +
                      "Please file an issue.",
                    getComponentName(finishedWork.type) || "instance"
                  )
                : void 0;
            }
          }

          var snapshot = instance.getSnapshotBeforeUpdate(
            finishedWork.elementType === finishedWork.type
              ? prevProps
              : resolveDefaultProps(finishedWork.type, prevProps),
            prevState
          );

          {
            var didWarnSet = didWarnAboutUndefinedSnapshotBeforeUpdate;

            if (snapshot === undefined && !didWarnSet.has(finishedWork.type)) {
              didWarnSet.add(finishedWork.type);
              warningWithoutStack$1(
                false,
                "%s.getSnapshotBeforeUpdate(): A snapshot value (or null) " +
                  "must be returned. You have returned undefined.",
                getComponentName(finishedWork.type)
              );
            }
          }

          instance.__reactInternalSnapshotBeforeUpdate = snapshot;
          stopPhaseTimer();
        }
      }

      return;
    }

    case HostRoot:
    case HostComponent:
    case HostText:
    case HostPortal:
    case IncompleteClassComponent:
      // Nothing to do for these component types
      return;

    default: {
      {
        throw Error(
          "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
        );
      }
    }
  }
}

function commitHookEffectList(unmountTag, mountTag, finishedWork) {
  var updateQueue = finishedWork.updateQueue;
  var lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;

  if (lastEffect !== null) {
    var firstEffect = lastEffect.next;
    var effect = firstEffect;

    do {
      if ((effect.tag & unmountTag) !== NoEffect$1) {
        // Unmount
        var destroy = effect.destroy;
        effect.destroy = undefined;

        if (destroy !== undefined) {
          destroy();
        }
      }

      if ((effect.tag & mountTag) !== NoEffect$1) {
        // Mount
        var create = effect.create;
        effect.destroy = create();

        {
          var _destroy = effect.destroy;

          if (_destroy !== undefined && typeof _destroy !== "function") {
            var addendum = void 0;

            if (_destroy === null) {
              addendum =
                " You returned null. If your effect does not require clean " +
                "up, return undefined (or nothing).";
            } else if (typeof _destroy.then === "function") {
              addendum =
                "\n\nIt looks like you wrote useEffect(async () => ...) or returned a Promise. " +
                "Instead, write the async function inside your effect " +
                "and call it immediately:\n\n" +
                "useEffect(() => {\n" +
                "  async function fetchData() {\n" +
                "    // You can await here\n" +
                "    const response = await MyAPI.getData(someId);\n" +
                "    // ...\n" +
                "  }\n" +
                "  fetchData();\n" +
                "}, [someId]); // Or [] if effect doesn't need props or state\n\n" +
                "Learn more about data fetching with Hooks: https://fb.me/react-hooks-data-fetching";
            } else {
              addendum = " You returned: " + _destroy;
            }

            warningWithoutStack$1(
              false,
              "An effect function must not return anything besides a function, " +
                "which is used for clean-up.%s%s",
              addendum,
              getStackByFiberInDevAndProd(finishedWork)
            );
          }
        }
      }

      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

function commitPassiveHookEffects(finishedWork) {
  if ((finishedWork.effectTag & Passive) !== NoEffect) {
    switch (finishedWork.tag) {
      case FunctionComponent:
      case ForwardRef:
      case SimpleMemoComponent: {
        commitHookEffectList(UnmountPassive, NoEffect$1, finishedWork);
        commitHookEffectList(NoEffect$1, MountPassive, finishedWork);
        break;
      }

      default:
        break;
    }
  }
}

function commitLifeCycles(
  finishedRoot,
  current$$1,
  finishedWork,
  committedExpirationTime
) {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      commitHookEffectList(UnmountLayout, MountLayout, finishedWork);
      break;
    }

    case ClassComponent: {
      var instance = finishedWork.stateNode;

      if (finishedWork.effectTag & Update) {
        if (current$$1 === null) {
          startPhaseTimer(finishedWork, "componentDidMount"); // We could update instance props and state here,
          // but instead we rely on them being set during last render.
          // TODO: revisit this when we implement resuming.

          {
            if (
              finishedWork.type === finishedWork.elementType &&
              !didWarnAboutReassigningProps
            ) {
              !(instance.props === finishedWork.memoizedProps)
                ? warning$1(
                    false,
                    "Expected %s props to match memoized props before " +
                      "componentDidMount. " +
                      "This might either be because of a bug in React, or because " +
                      "a component reassigns its own `this.props`. " +
                      "Please file an issue.",
                    getComponentName(finishedWork.type) || "instance"
                  )
                : void 0;
              !(instance.state === finishedWork.memoizedState)
                ? warning$1(
                    false,
                    "Expected %s state to match memoized state before " +
                      "componentDidMount. " +
                      "This might either be because of a bug in React, or because " +
                      "a component reassigns its own `this.props`. " +
                      "Please file an issue.",
                    getComponentName(finishedWork.type) || "instance"
                  )
                : void 0;
            }
          }

          instance.componentDidMount();
          stopPhaseTimer();
        } else {
          var prevProps =
            finishedWork.elementType === finishedWork.type
              ? current$$1.memoizedProps
              : resolveDefaultProps(
                  finishedWork.type,
                  current$$1.memoizedProps
                );
          var prevState = current$$1.memoizedState;
          startPhaseTimer(finishedWork, "componentDidUpdate"); // We could update instance props and state here,
          // but instead we rely on them being set during last render.
          // TODO: revisit this when we implement resuming.

          {
            if (
              finishedWork.type === finishedWork.elementType &&
              !didWarnAboutReassigningProps
            ) {
              !(instance.props === finishedWork.memoizedProps)
                ? warning$1(
                    false,
                    "Expected %s props to match memoized props before " +
                      "componentDidUpdate. " +
                      "This might either be because of a bug in React, or because " +
                      "a component reassigns its own `this.props`. " +
                      "Please file an issue.",
                    getComponentName(finishedWork.type) || "instance"
                  )
                : void 0;
              !(instance.state === finishedWork.memoizedState)
                ? warning$1(
                    false,
                    "Expected %s state to match memoized state before " +
                      "componentDidUpdate. " +
                      "This might either be because of a bug in React, or because " +
                      "a component reassigns its own `this.props`. " +
                      "Please file an issue.",
                    getComponentName(finishedWork.type) || "instance"
                  )
                : void 0;
            }
          }

          instance.componentDidUpdate(
            prevProps,
            prevState,
            instance.__reactInternalSnapshotBeforeUpdate
          );
          stopPhaseTimer();
        }
      }

      var updateQueue = finishedWork.updateQueue;

      if (updateQueue !== null) {
        {
          if (
            finishedWork.type === finishedWork.elementType &&
            !didWarnAboutReassigningProps
          ) {
            !(instance.props === finishedWork.memoizedProps)
              ? warning$1(
                  false,
                  "Expected %s props to match memoized props before " +
                    "processing the update queue. " +
                    "This might either be because of a bug in React, or because " +
                    "a component reassigns its own `this.props`. " +
                    "Please file an issue.",
                  getComponentName(finishedWork.type) || "instance"
                )
              : void 0;
            !(instance.state === finishedWork.memoizedState)
              ? warning$1(
                  false,
                  "Expected %s state to match memoized state before " +
                    "processing the update queue. " +
                    "This might either be because of a bug in React, or because " +
                    "a component reassigns its own `this.props`. " +
                    "Please file an issue.",
                  getComponentName(finishedWork.type) || "instance"
                )
              : void 0;
          }
        } // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.

        commitUpdateQueue(
          finishedWork,
          updateQueue,
          instance,
          committedExpirationTime
        );
      }

      return;
    }

    case HostRoot: {
      var _updateQueue = finishedWork.updateQueue;

      if (_updateQueue !== null) {
        var _instance = null;

        if (finishedWork.child !== null) {
          switch (finishedWork.child.tag) {
            case HostComponent:
              _instance = getPublicInstance(finishedWork.child.stateNode);
              break;

            case ClassComponent:
              _instance = finishedWork.child.stateNode;
              break;
          }
        }

        commitUpdateQueue(
          finishedWork,
          _updateQueue,
          _instance,
          committedExpirationTime
        );
      }

      return;
    }

    case HostComponent: {
      var _instance2 = finishedWork.stateNode; // Renderers may schedule work to be done after host components are mounted
      // (eg DOM renderer may schedule auto-focus for inputs and form controls).
      // These effects should only be committed when components are first mounted,
      // aka when there is no current/alternate.

      if (current$$1 === null && finishedWork.effectTag & Update) {
        var type = finishedWork.type;
        var props = finishedWork.memoizedProps;
        commitMount(_instance2, type, props, finishedWork);
      }

      return;
    }

    case HostText: {
      // We have no life-cycles associated with text.
      return;
    }

    case HostPortal: {
      // We have no life-cycles associated with portals.
      return;
    }

    case Profiler: {
      if (enableProfilerTimer) {
        var onRender = finishedWork.memoizedProps.onRender;

        if (typeof onRender === "function") {
          if (enableSchedulerTracing) {
            onRender(
              finishedWork.memoizedProps.id,
              current$$1 === null ? "mount" : "update",
              finishedWork.actualDuration,
              finishedWork.treeBaseDuration,
              finishedWork.actualStartTime,
              getCommitTime(),
              finishedRoot.memoizedInteractions
            );
          } else {
            onRender(
              finishedWork.memoizedProps.id,
              current$$1 === null ? "mount" : "update",
              finishedWork.actualDuration,
              finishedWork.treeBaseDuration,
              finishedWork.actualStartTime,
              getCommitTime()
            );
          }
        }
      }

      return;
    }

    case SuspenseComponent: {
      commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
      return;
    }

    case SuspenseListComponent:
    case IncompleteClassComponent:
    case FundamentalComponent:
    case ScopeComponent:
      return;

    default: {
      {
        throw Error(
          "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
        );
      }
    }
  }
}

function hideOrUnhideAllChildren(finishedWork, isHidden) {
  if (supportsMutation) {
    // We only have the top Fiber that was inserted but we need to recurse down its
    // children to find all the terminal nodes.
    var node = finishedWork;

    while (true) {
      if (node.tag === HostComponent) {
        var instance = node.stateNode;

        if (isHidden) {
          hideInstance(instance);
        } else {
          unhideInstance(node.stateNode, node.memoizedProps);
        }
      } else if (node.tag === HostText) {
        var _instance3 = node.stateNode;

        if (isHidden) {
          hideTextInstance(_instance3);
        } else {
          unhideTextInstance(_instance3, node.memoizedProps);
        }
      } else if (
        node.tag === SuspenseComponent &&
        node.memoizedState !== null &&
        node.memoizedState.dehydrated === null
      ) {
        // Found a nested Suspense component that timed out. Skip over the
        // primary child fragment, which should remain hidden.
        var fallbackChildFragment = node.child.sibling;
        fallbackChildFragment.return = node;
        node = fallbackChildFragment;
        continue;
      } else if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }

      if (node === finishedWork) {
        return;
      }

      while (node.sibling === null) {
        if (node.return === null || node.return === finishedWork) {
          return;
        }

        node = node.return;
      }

      node.sibling.return = node.return;
      node = node.sibling;
    }
  }
}

function commitAttachRef(finishedWork) {
  var ref = finishedWork.ref;

  if (ref !== null) {
    var instance = finishedWork.stateNode;
    var instanceToUse;

    switch (finishedWork.tag) {
      case HostComponent:
        instanceToUse = getPublicInstance(instance);
        break;

      default:
        instanceToUse = instance;
    } // Moved outside to ensure DCE works with this flag

    if (enableScopeAPI && finishedWork.tag === ScopeComponent) {
      instanceToUse = instance.methods;
    }

    if (typeof ref === "function") {
      ref(instanceToUse);
    } else {
      {
        if (!ref.hasOwnProperty("current")) {
          warningWithoutStack$1(
            false,
            "Unexpected ref object provided for %s. " +
              "Use either a ref-setter function or React.createRef().%s",
            getComponentName(finishedWork.type),
            getStackByFiberInDevAndProd(finishedWork)
          );
        }
      }

      ref.current = instanceToUse;
    }
  }
}

function commitDetachRef(current$$1) {
  var currentRef = current$$1.ref;

  if (currentRef !== null) {
    if (typeof currentRef === "function") {
      currentRef(null);
    } else {
      currentRef.current = null;
    }
  }
} // User-originating errors (lifecycles and refs) should not interrupt
// deletion, so don't let them throw. Host-originating errors should
// interrupt deletion, so it's okay

function commitUnmount(finishedRoot, current$$1, renderPriorityLevel) {
  onCommitUnmount(current$$1);

  switch (current$$1.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent: {
      var updateQueue = current$$1.updateQueue;

      if (updateQueue !== null) {
        var lastEffect = updateQueue.lastEffect;

        if (lastEffect !== null) {
          var firstEffect = lastEffect.next; // When the owner fiber is deleted, the destroy function of a passive
          // effect hook is called during the synchronous commit phase. This is
          // a concession to implementation complexity. Calling it in the
          // passive effect phase (like they usually are, when dependencies
          // change during an update) would require either traversing the
          // children of the deleted fiber again, or including unmount effects
          // as part of the fiber effect list.
          //
          // Because this is during the sync commit phase, we need to change
          // the priority.
          //
          // TODO: Reconsider this implementation trade off.

          var priorityLevel =
            renderPriorityLevel > NormalPriority
              ? NormalPriority
              : renderPriorityLevel;
          runWithPriority$1(priorityLevel, function() {
            var effect = firstEffect;

            do {
              var destroy = effect.destroy;

              if (destroy !== undefined) {
                safelyCallDestroy(current$$1, destroy);
              }

              effect = effect.next;
            } while (effect !== firstEffect);
          });
        }
      }

      break;
    }

    case ClassComponent: {
      safelyDetachRef(current$$1);
      var instance = current$$1.stateNode;

      if (typeof instance.componentWillUnmount === "function") {
        safelyCallComponentWillUnmount(current$$1, instance);
      }

      return;
    }

    case HostComponent: {
      if (enableFlareAPI) {
        var dependencies = current$$1.dependencies;

        if (dependencies !== null) {
          var respondersMap = dependencies.responders;

          if (respondersMap !== null) {
            var responderInstances = Array.from(respondersMap.values());

            for (
              var i = 0, length = responderInstances.length;
              i < length;
              i++
            ) {
              var responderInstance = responderInstances[i];
              unmountResponderInstance(responderInstance);
            }

            dependencies.responders = null;
          }
        }
      }

      safelyDetachRef(current$$1);
      return;
    }

    case HostPortal: {
      // TODO: this is recursive.
      // We are also not using this parent because
      // the portal will get pushed immediately.
      if (supportsMutation) {
        unmountHostComponents(finishedRoot, current$$1, renderPriorityLevel);
      } else if (supportsPersistence) {
        emptyPortalContainer(current$$1);
      }

      return;
    }

    case FundamentalComponent: {
      if (enableFundamentalAPI) {
        var fundamentalInstance = current$$1.stateNode;

        if (fundamentalInstance !== null) {
          unmountFundamentalComponent(fundamentalInstance);
          current$$1.stateNode = null;
        }
      }

      return;
    }

    case DehydratedFragment: {
      if (enableSuspenseCallback) {
        var hydrationCallbacks = finishedRoot.hydrationCallbacks;

        if (hydrationCallbacks !== null) {
          var onDeleted = hydrationCallbacks.onDeleted;

          if (onDeleted) {
            onDeleted(current$$1.stateNode);
          }
        }
      }

      return;
    }

    case ScopeComponent: {
      if (enableScopeAPI) {
        safelyDetachRef(current$$1);
      }
    }
  }
}

function commitNestedUnmounts(finishedRoot, root, renderPriorityLevel) {
  // While we're inside a removed host node we don't want to call
  // removeChild on the inner nodes because they're removed by the top
  // call anyway. We also want to call componentWillUnmount on all
  // composites before this host node is removed from the tree. Therefore
  // we do an inner loop while we're still inside the host node.
  var node = root;

  while (true) {
    commitUnmount(finishedRoot, node, renderPriorityLevel); // Visit children because they may contain more composite or host nodes.
    // Skip portals because commitUnmount() currently visits them recursively.

    if (
      node.child !== null && // If we use mutation we drill down into portals using commitUnmount above.
      // If we don't use mutation we drill down into portals here instead.
      (!supportsMutation || node.tag !== HostPortal)
    ) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    if (node === root) {
      return;
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === root) {
        return;
      }

      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function detachFiber(current$$1) {
  var alternate = current$$1.alternate; // Cut off the return pointers to disconnect it from the tree. Ideally, we
  // should clear the child pointer of the parent alternate to let this
  // get GC:ed but we don't know which for sure which parent is the current
  // one so we'll settle for GC:ing the subtree of this child. This child
  // itself will be GC:ed when the parent updates the next time.

  current$$1.return = null;
  current$$1.child = null;
  current$$1.memoizedState = null;
  current$$1.updateQueue = null;
  current$$1.dependencies = null;
  current$$1.alternate = null;
  current$$1.firstEffect = null;
  current$$1.lastEffect = null;
  current$$1.pendingProps = null;
  current$$1.memoizedProps = null;

  if (alternate !== null) {
    detachFiber(alternate);
  }
}

function emptyPortalContainer(current$$1) {
  if (!supportsPersistence) {
    return;
  }

  var portal = current$$1.stateNode;
  var containerInfo = portal.containerInfo;
  var emptyChildSet = createContainerChildSet(containerInfo);
}

function commitContainer(finishedWork) {
  if (!supportsPersistence) {
    return;
  }

  switch (finishedWork.tag) {
    case ClassComponent:
    case HostComponent:
    case HostText:
    case FundamentalComponent: {
      return;
    }

    case HostRoot:
    case HostPortal: {
      var portalOrRoot = finishedWork.stateNode;
      var containerInfo = portalOrRoot.containerInfo,
        pendingChildren = portalOrRoot.pendingChildren;
      return;
    }

    default: {
      {
        throw Error(
          "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
        );
      }
    }
  }
}

function getHostParentFiber(fiber) {
  var parent = fiber.return;

  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }

    parent = parent.return;
  }

  {
    throw Error(
      "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue."
    );
  }
}

function isHostParent(fiber) {
  return (
    fiber.tag === HostComponent ||
    fiber.tag === HostRoot ||
    fiber.tag === HostPortal
  );
}

function getHostSibling(fiber) {
  // We're going to search forward into the tree until we find a sibling host
  // node. Unfortunately, if multiple insertions are done in a row we have to
  // search past them. This leads to exponential search for the next sibling.
  // TODO: Find a more efficient way to do this.
  var node = fiber;

  siblings: while (true) {
    // If we didn't find anything, let's try the next sibling.
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        // If we pop out of the root or hit the parent the fiber we are the
        // last sibling.
        return null;
      }

      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;

    while (
      node.tag !== HostComponent &&
      node.tag !== HostText &&
      node.tag !== DehydratedFragment
    ) {
      // If it is not host node and, we might have a host node inside it.
      // Try to search down until we find one.
      if (node.effectTag & Placement) {
        // If we don't have a child, try the siblings instead.
        continue siblings;
      } // If we don't have a child, try the siblings instead.
      // We also skip portals because they are not part of this host tree.

      if (node.child === null || node.tag === HostPortal) {
        continue siblings;
      } else {
        node.child.return = node;
        node = node.child;
      }
    } // Check if this host node is stable or about to be placed.

    if (!(node.effectTag & Placement)) {
      // Found it!
      return node.stateNode;
    }
  }
}

function commitPlacement(finishedWork) {
  if (!supportsMutation) {
    return;
  } // Recursively insert all host nodes into the parent.

  var parentFiber = getHostParentFiber(finishedWork); // Note: these two variables *must* always be updated together.

  var parent;
  var isContainer;
  var parentStateNode = parentFiber.stateNode;

  switch (parentFiber.tag) {
    case HostComponent:
      parent = parentStateNode;
      isContainer = false;
      break;

    case HostRoot:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;

    case HostPortal:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;

    case FundamentalComponent:
      if (enableFundamentalAPI) {
        parent = parentStateNode.instance;
        isContainer = false;
      }

    // eslint-disable-next-line-no-fallthrough

    default: {
      throw Error(
        "Invalid host parent fiber. This error is likely caused by a bug in React. Please file an issue."
      );
    }
  }

  if (parentFiber.effectTag & ContentReset) {
    // Reset the text content of the parent before doing any insertions
    resetTextContent(parent); // Clear ContentReset from the effect tag

    parentFiber.effectTag &= ~ContentReset;
  }

  var before = getHostSibling(finishedWork); // We only have the top Fiber that was inserted but we need to recurse down its
  // children to find all the terminal nodes.

  var node = finishedWork;

  while (true) {
    var isHost = node.tag === HostComponent || node.tag === HostText;

    if (isHost || (enableFundamentalAPI && node.tag === FundamentalComponent)) {
      var stateNode = isHost ? node.stateNode : node.stateNode.instance;

      if (before) {
        if (isContainer) {
          insertInContainerBefore(parent, stateNode, before);
        } else {
          insertBefore(parent, stateNode, before);
        }
      } else {
        if (isContainer) {
          appendChildToContainer(parent, stateNode);
        } else {
          appendChild(parent, stateNode);
        }
      }
    } else if (node.tag === HostPortal) {
      // If the insertion itself is a portal, then we don't want to traverse
      // down its children. Instead, we'll get insertions from each child in
      // the portal directly.
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    if (node === finishedWork) {
      return;
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === finishedWork) {
        return;
      }

      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function unmountHostComponents(finishedRoot, current$$1, renderPriorityLevel) {
  // We only have the top Fiber that was deleted but we need to recurse down its
  // children to find all the terminal nodes.
  var node = current$$1; // Each iteration, currentParent is populated with node's host parent if not
  // currentParentIsValid.

  var currentParentIsValid = false; // Note: these two variables *must* always be updated together.

  var currentParent;
  var currentParentIsContainer;

  while (true) {
    if (!currentParentIsValid) {
      var parent = node.return;

      findParent: while (true) {
        if (!(parent !== null)) {
          throw Error(
            "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue."
          );
        }

        var parentStateNode = parent.stateNode;

        switch (parent.tag) {
          case HostComponent:
            currentParent = parentStateNode;
            currentParentIsContainer = false;
            break findParent;

          case HostRoot:
            currentParent = parentStateNode.containerInfo;
            currentParentIsContainer = true;
            break findParent;

          case HostPortal:
            currentParent = parentStateNode.containerInfo;
            currentParentIsContainer = true;
            break findParent;

          case FundamentalComponent:
            if (enableFundamentalAPI) {
              currentParent = parentStateNode.instance;
              currentParentIsContainer = false;
            }
        }

        parent = parent.return;
      }

      currentParentIsValid = true;
    }

    if (node.tag === HostComponent || node.tag === HostText) {
      commitNestedUnmounts(finishedRoot, node, renderPriorityLevel); // After all the children have unmounted, it is now safe to remove the
      // node from the tree.

      if (currentParentIsContainer) {
        removeChildFromContainer(currentParent, node.stateNode);
      } else {
        removeChild(currentParent, node.stateNode);
      } // Don't visit children because we already visited them.
    } else if (enableFundamentalAPI && node.tag === FundamentalComponent) {
      var fundamentalNode = node.stateNode.instance;
      commitNestedUnmounts(finishedRoot, node, renderPriorityLevel); // After all the children have unmounted, it is now safe to remove the
      // node from the tree.

      if (currentParentIsContainer) {
        removeChildFromContainer(currentParent, fundamentalNode);
      } else {
        removeChild(currentParent, fundamentalNode);
      }
    } else if (
      enableSuspenseServerRenderer &&
      node.tag === DehydratedFragment
    ) {
      if (enableSuspenseCallback) {
        var hydrationCallbacks = finishedRoot.hydrationCallbacks;

        if (hydrationCallbacks !== null) {
          var onDeleted = hydrationCallbacks.onDeleted;

          if (onDeleted) {
            onDeleted(node.stateNode);
          }
        }
      } // Delete the dehydrated suspense boundary and all of its content.

      if (currentParentIsContainer) {
        clearSuspenseBoundaryFromContainer(currentParent, node.stateNode);
      } else {
        clearSuspenseBoundary(currentParent, node.stateNode);
      }
    } else if (node.tag === HostPortal) {
      if (node.child !== null) {
        // When we go into a portal, it becomes the parent to remove from.
        // We will reassign it back when we pop the portal on the way up.
        currentParent = node.stateNode.containerInfo;
        currentParentIsContainer = true; // Visit children because portals might contain host components.

        node.child.return = node;
        node = node.child;
        continue;
      }
    } else {
      commitUnmount(finishedRoot, node, renderPriorityLevel); // Visit children because we may find more host components below.

      if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }
    }

    if (node === current$$1) {
      return;
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === current$$1) {
        return;
      }

      node = node.return;

      if (node.tag === HostPortal) {
        // When we go out of the portal, we need to restore the parent.
        // Since we don't keep a stack of them, we will search for it.
        currentParentIsValid = false;
      }
    }

    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function commitDeletion(finishedRoot, current$$1, renderPriorityLevel) {
  if (supportsMutation) {
    // Recursively delete all host nodes from the parent.
    // Detach refs and call componentWillUnmount() on the whole subtree.
    unmountHostComponents(finishedRoot, current$$1, renderPriorityLevel);
  } else {
    // Detach refs and call componentWillUnmount() on the whole subtree.
    commitNestedUnmounts(finishedRoot, current$$1, renderPriorityLevel);
  }

  detachFiber(current$$1);
}

function commitWork(current$$1, finishedWork) {
  if (!supportsMutation) {
    switch (finishedWork.tag) {
      case FunctionComponent:
      case ForwardRef:
      case MemoComponent:
      case SimpleMemoComponent: {
        // Note: We currently never use MountMutation, but useLayout uses
        // UnmountMutation.
        commitHookEffectList(UnmountMutation, MountMutation, finishedWork);
        return;
      }

      case Profiler: {
        return;
      }

      case SuspenseComponent: {
        commitSuspenseComponent(finishedWork);
        attachSuspenseRetryListeners(finishedWork);
        return;
      }

      case SuspenseListComponent: {
        attachSuspenseRetryListeners(finishedWork);
        return;
      }

      case HostRoot: {
        if (supportsHydration) {
          var root = finishedWork.stateNode;

          if (root.hydrate) {
            // We've just hydrated. No need to hydrate again.
            root.hydrate = false;
            commitHydratedContainer(root.containerInfo);
          }
        }

        break;
      }
    }

    commitContainer(finishedWork);
    return;
  }

  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent: {
      // Note: We currently never use MountMutation, but useLayout uses
      // UnmountMutation.
      commitHookEffectList(UnmountMutation, MountMutation, finishedWork);
      return;
    }

    case ClassComponent: {
      return;
    }

    case HostComponent: {
      var instance = finishedWork.stateNode;

      if (instance != null) {
        // Commit the work prepared earlier.
        var newProps = finishedWork.memoizedProps; // For hydration we reuse the update path but we treat the oldProps
        // as the newProps. The updatePayload will contain the real change in
        // this case.

        var oldProps =
          current$$1 !== null ? current$$1.memoizedProps : newProps;
        var type = finishedWork.type; // TODO: Type the updateQueue to be specific to host components.

        var updatePayload = finishedWork.updateQueue;
        finishedWork.updateQueue = null;

        if (updatePayload !== null) {
          commitUpdate(
            instance,
            updatePayload,
            type,
            oldProps,
            newProps,
            finishedWork
          );
        }

        if (enableFlareAPI) {
          var prevListeners = oldProps.listeners;
          var nextListeners = newProps.listeners;

          if (prevListeners !== nextListeners) {
            updateEventListeners(nextListeners, finishedWork, null);
          }
        }
      }

      return;
    }

    case HostText: {
      if (!(finishedWork.stateNode !== null)) {
        throw Error(
          "This should have a text node initialized. This error is likely caused by a bug in React. Please file an issue."
        );
      }

      var textInstance = finishedWork.stateNode;
      var newText = finishedWork.memoizedProps; // For hydration we reuse the update path but we treat the oldProps
      // as the newProps. The updatePayload will contain the real change in
      // this case.

      var oldText = current$$1 !== null ? current$$1.memoizedProps : newText;
      commitTextUpdate(textInstance, oldText, newText);
      return;
    }

    case HostRoot: {
      if (supportsHydration) {
        var _root = finishedWork.stateNode;

        if (_root.hydrate) {
          // We've just hydrated. No need to hydrate again.
          _root.hydrate = false;
          commitHydratedContainer(_root.containerInfo);
        }
      }

      return;
    }

    case Profiler: {
      return;
    }

    case SuspenseComponent: {
      commitSuspenseComponent(finishedWork);
      attachSuspenseRetryListeners(finishedWork);
      return;
    }

    case SuspenseListComponent: {
      attachSuspenseRetryListeners(finishedWork);
      return;
    }

    case IncompleteClassComponent: {
      return;
    }

    case FundamentalComponent: {
      if (enableFundamentalAPI) {
        var fundamentalInstance = finishedWork.stateNode;
        updateFundamentalComponent(fundamentalInstance);
      }

      return;
    }

    case ScopeComponent: {
      if (enableScopeAPI) {
        var scopeInstance = finishedWork.stateNode;
        scopeInstance.fiber = finishedWork;

        if (enableFlareAPI) {
          var _newProps = finishedWork.memoizedProps;

          var _oldProps =
            current$$1 !== null ? current$$1.memoizedProps : _newProps;

          var _prevListeners = _oldProps.listeners;
          var _nextListeners = _newProps.listeners;

          if (_prevListeners !== _nextListeners) {
            updateEventListeners(_nextListeners, finishedWork, null);
          }
        }
      }

      return;
    }

    default: {
      {
        throw Error(
          "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
        );
      }
    }
  }
}

function commitSuspenseComponent(finishedWork) {
  var newState = finishedWork.memoizedState;
  var newDidTimeout;
  var primaryChildParent = finishedWork;

  if (newState === null) {
    newDidTimeout = false;
  } else {
    newDidTimeout = true;
    primaryChildParent = finishedWork.child;
    markCommitTimeOfFallback();
  }

  if (supportsMutation && primaryChildParent !== null) {
    hideOrUnhideAllChildren(primaryChildParent, newDidTimeout);
  }

  if (enableSuspenseCallback && newState !== null) {
    var suspenseCallback = finishedWork.memoizedProps.suspenseCallback;

    if (typeof suspenseCallback === "function") {
      var thenables = finishedWork.updateQueue;

      if (thenables !== null) {
        suspenseCallback(new Set(thenables));
      }
    } else {
      if (suspenseCallback !== undefined) {
        warning$1(false, "Unexpected type for suspenseCallback.");
      }
    }
  }
}

function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {
  if (!supportsHydration) {
    return;
  }

  var newState = finishedWork.memoizedState;

  if (newState === null) {
    var current$$1 = finishedWork.alternate;

    if (current$$1 !== null) {
      var prevState = current$$1.memoizedState;

      if (prevState !== null) {
        var suspenseInstance = prevState.dehydrated;

        if (suspenseInstance !== null) {
          commitHydratedSuspenseInstance(suspenseInstance);

          if (enableSuspenseCallback) {
            var hydrationCallbacks = finishedRoot.hydrationCallbacks;

            if (hydrationCallbacks !== null) {
              var onHydrated = hydrationCallbacks.onHydrated;

              if (onHydrated) {
                onHydrated(suspenseInstance);
              }
            }
          }
        }
      }
    }
  }
}

function attachSuspenseRetryListeners(finishedWork) {
  // If this boundary just timed out, then it will have a set of thenables.
  // For each thenable, attach a listener so that when it resolves, React
  // attempts to re-render the boundary in the primary (pre-timeout) state.
  var thenables = finishedWork.updateQueue;

  if (thenables !== null) {
    finishedWork.updateQueue = null;
    var retryCache = finishedWork.stateNode;

    if (retryCache === null) {
      retryCache = finishedWork.stateNode = new PossiblyWeakSet();
    }

    thenables.forEach(function(thenable) {
      // Memoize using the boundary fiber to prevent redundant listeners.
      var retry = resolveRetryThenable.bind(null, finishedWork, thenable);

      if (!retryCache.has(thenable)) {
        if (enableSchedulerTracing) {
          if (thenable.__reactDoNotTraceInteractions !== true) {
            retry = tracing.unstable_wrap(retry);
          }
        }

        retryCache.add(thenable);
        thenable.then(retry, retry);
      }
    });
  }
}

function commitResetTextContent(current$$1) {
  if (!supportsMutation) {
    return;
  }

  resetTextContent(current$$1.stateNode);
}

var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;

function createRootErrorUpdate(fiber, errorInfo, expirationTime) {
  var update = createUpdate(expirationTime, null); // Unmount the root by rendering null.

  update.tag = CaptureUpdate; // Caution: React DevTools currently depends on this property
  // being called "element".

  update.payload = {
    element: null
  };
  var error = errorInfo.value;

  update.callback = function() {
    onUncaughtError(error);
    logError(fiber, errorInfo);
  };

  return update;
}

function createClassErrorUpdate(fiber, errorInfo, expirationTime) {
  var update = createUpdate(expirationTime, null);
  update.tag = CaptureUpdate;
  var getDerivedStateFromError = fiber.type.getDerivedStateFromError;

  if (typeof getDerivedStateFromError === "function") {
    var error = errorInfo.value;

    update.payload = function() {
      logError(fiber, errorInfo);
      return getDerivedStateFromError(error);
    };
  }

  var inst = fiber.stateNode;

  if (inst !== null && typeof inst.componentDidCatch === "function") {
    update.callback = function callback() {
      {
        markFailedErrorBoundaryForHotReloading(fiber);
      }

      if (typeof getDerivedStateFromError !== "function") {
        // To preserve the preexisting retry behavior of error boundaries,
        // we keep track of which ones already failed during this batch.
        // This gets reset before we yield back to the browser.
        // TODO: Warn in strict mode if getDerivedStateFromError is
        // not defined.
        markLegacyErrorBoundaryAsFailed(this); // Only log here if componentDidCatch is the only error boundary method defined

        logError(fiber, errorInfo);
      }

      var error = errorInfo.value;
      var stack = errorInfo.stack;
      this.componentDidCatch(error, {
        componentStack: stack !== null ? stack : ""
      });

      {
        if (typeof getDerivedStateFromError !== "function") {
          // If componentDidCatch is the only error boundary method defined,
          // then it needs to call setState to recover from errors.
          // If no state update is scheduled then the boundary will swallow the error.
          !(fiber.expirationTime === Sync)
            ? warningWithoutStack$1(
                false,
                "%s: Error boundaries should implement getDerivedStateFromError(). " +
                  "In that method, return a state update to display an error message or fallback UI.",
                getComponentName(fiber.type) || "Unknown"
              )
            : void 0;
        }
      }
    };
  } else {
    update.callback = function() {
      markFailedErrorBoundaryForHotReloading(fiber);
    };
  }

  return update;
}

function attachPingListener(root, renderExpirationTime, thenable) {
  // Attach a listener to the promise to "ping" the root and retry. But
  // only if one does not already exist for the current render expiration
  // time (which acts like a "thread ID" here).
  var pingCache = root.pingCache;
  var threadIDs;

  if (pingCache === null) {
    pingCache = root.pingCache = new PossiblyWeakMap();
    threadIDs = new Set();
    pingCache.set(thenable, threadIDs);
  } else {
    threadIDs = pingCache.get(thenable);

    if (threadIDs === undefined) {
      threadIDs = new Set();
      pingCache.set(thenable, threadIDs);
    }
  }

  if (!threadIDs.has(renderExpirationTime)) {
    // Memoize using the thread ID to prevent redundant listeners.
    threadIDs.add(renderExpirationTime);
    var ping = pingSuspendedRoot.bind(
      null,
      root,
      thenable,
      renderExpirationTime
    );
    thenable.then(ping, ping);
  }
}

function throwException(
  root,
  returnFiber,
  sourceFiber,
  value,
  renderExpirationTime
) {
  // The source fiber did not complete.
  sourceFiber.effectTag |= Incomplete; // Its effect list is no longer valid.

  sourceFiber.firstEffect = sourceFiber.lastEffect = null;

  if (
    value !== null &&
    typeof value === "object" &&
    typeof value.then === "function"
  ) {
    // This is a thenable.
    var thenable = value;
    checkForWrongSuspensePriorityInDEV(sourceFiber);
    var hasInvisibleParentBoundary = hasSuspenseContext(
      suspenseStackCursor.current,
      InvisibleParentSuspenseContext
    ); // Schedule the nearest Suspense to re-render the timed out view.

    var _workInProgress = returnFiber;

    do {
      if (
        _workInProgress.tag === SuspenseComponent &&
        shouldCaptureSuspense(_workInProgress, hasInvisibleParentBoundary)
      ) {
        // Found the nearest boundary.
        // Stash the promise on the boundary fiber. If the boundary times out, we'll
        // attach another listener to flip the boundary back to its normal state.
        var thenables = _workInProgress.updateQueue;

        if (thenables === null) {
          var updateQueue = new Set();
          updateQueue.add(thenable);
          _workInProgress.updateQueue = updateQueue;
        } else {
          thenables.add(thenable);
        } // If the boundary is outside of blocking mode, we should *not*
        // suspend the commit. Pretend as if the suspended component rendered
        // null and keep rendering. In the commit phase, we'll schedule a
        // subsequent synchronous update to re-render the Suspense.
        //
        // Note: It doesn't matter whether the component that suspended was
        // inside a blocking mode tree. If the Suspense is outside of it, we
        // should *not* suspend the commit.

        if ((_workInProgress.mode & BlockingMode) === NoMode) {
          _workInProgress.effectTag |= DidCapture; // We're going to commit this fiber even though it didn't complete.
          // But we shouldn't call any lifecycle methods or callbacks. Remove
          // all lifecycle effect tags.

          sourceFiber.effectTag &= ~(LifecycleEffectMask | Incomplete);

          if (sourceFiber.tag === ClassComponent) {
            var currentSourceFiber = sourceFiber.alternate;

            if (currentSourceFiber === null) {
              // This is a new mount. Change the tag so it's not mistaken for a
              // completed class component. For example, we should not call
              // componentWillUnmount if it is deleted.
              sourceFiber.tag = IncompleteClassComponent;
            } else {
              // When we try rendering again, we should not reuse the current fiber,
              // since it's known to be in an inconsistent state. Use a force update to
              // prevent a bail out.
              var update = createUpdate(Sync, null);
              update.tag = ForceUpdate;
              enqueueUpdate(sourceFiber, update);
            }
          } // The source fiber did not complete. Mark it with Sync priority to
          // indicate that it still has pending work.

          sourceFiber.expirationTime = Sync; // Exit without suspending.

          return;
        } // Confirmed that the boundary is in a concurrent mode tree. Continue
        // with the normal suspend path.
        //
        // After this we'll use a set of heuristics to determine whether this
        // render pass will run to completion or restart or "suspend" the commit.
        // The actual logic for this is spread out in different places.
        //
        // This first principle is that if we're going to suspend when we complete
        // a root, then we should also restart if we get an update or ping that
        // might unsuspend it, and vice versa. The only reason to suspend is
        // because you think you might want to restart before committing. However,
        // it doesn't make sense to restart only while in the period we're suspended.
        //
        // Restarting too aggressively is also not good because it starves out any
        // intermediate loading state. So we use heuristics to determine when.
        // Suspense Heuristics
        //
        // If nothing threw a Promise or all the same fallbacks are already showing,
        // then don't suspend/restart.
        //
        // If this is an initial render of a new tree of Suspense boundaries and
        // those trigger a fallback, then don't suspend/restart. We want to ensure
        // that we can show the initial loading state as quickly as possible.
        //
        // If we hit a "Delayed" case, such as when we'd switch from content back into
        // a fallback, then we should always suspend/restart. SuspenseConfig applies to
        // this case. If none is defined, JND is used instead.
        //
        // If we're already showing a fallback and it gets "retried", allowing us to show
        // another level, but there's still an inner boundary that would show a fallback,
        // then we suspend/restart for 500ms since the last time we showed a fallback
        // anywhere in the tree. This effectively throttles progressive loading into a
        // consistent train of commits. This also gives us an opportunity to restart to
        // get to the completed state slightly earlier.
        //
        // If there's ambiguity due to batching it's resolved in preference of:
        // 1) "delayed", 2) "initial render", 3) "retry".
        //
        // We want to ensure that a "busy" state doesn't get force committed. We want to
        // ensure that new initial loading states can commit as soon as possible.

        attachPingListener(root, renderExpirationTime, thenable);
        _workInProgress.effectTag |= ShouldCapture;
        _workInProgress.expirationTime = renderExpirationTime;
        return;
      } // This boundary already captured during this render. Continue to the next
      // boundary.

      _workInProgress = _workInProgress.return;
    } while (_workInProgress !== null); // No boundary was found. Fallthrough to error mode.
    // TODO: Use invariant so the message is stripped in prod?

    value = new Error(
      (getComponentName(sourceFiber.type) || "A React component") +
        " suspended while rendering, but no fallback UI was specified.\n" +
        "\n" +
        "Add a <Suspense fallback=...> component higher in the tree to " +
        "provide a loading indicator or placeholder to display." +
        getStackByFiberInDevAndProd(sourceFiber)
    );
  } // We didn't find a boundary that could handle this type of exception. Start
  // over and traverse parent path again, this time treating the exception
  // as an error.

  renderDidError();
  value = createCapturedValue(value, sourceFiber);
  var workInProgress = returnFiber;

  do {
    switch (workInProgress.tag) {
      case HostRoot: {
        var _errorInfo = value;
        workInProgress.effectTag |= ShouldCapture;
        workInProgress.expirationTime = renderExpirationTime;

        var _update = createRootErrorUpdate(
          workInProgress,
          _errorInfo,
          renderExpirationTime
        );

        enqueueCapturedUpdate(workInProgress, _update);
        return;
      }

      case ClassComponent:
        // Capture and retry
        var errorInfo = value;
        var ctor = workInProgress.type;
        var instance = workInProgress.stateNode;

        if (
          (workInProgress.effectTag & DidCapture) === NoEffect &&
          (typeof ctor.getDerivedStateFromError === "function" ||
            (instance !== null &&
              typeof instance.componentDidCatch === "function" &&
              !isAlreadyFailedLegacyErrorBoundary(instance)))
        ) {
          workInProgress.effectTag |= ShouldCapture;
          workInProgress.expirationTime = renderExpirationTime; // Schedule the error boundary to re-render using updated state

          var _update2 = createClassErrorUpdate(
            workInProgress,
            errorInfo,
            renderExpirationTime
          );

          enqueueCapturedUpdate(workInProgress, _update2);
          return;
        }

        break;

      default:
        break;
    }

    workInProgress = workInProgress.return;
  } while (workInProgress !== null);
}

var ceil = Math.ceil;
var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
var ReactCurrentOwner$2 = ReactSharedInternals.ReactCurrentOwner;
var IsSomeRendererActing = ReactSharedInternals.IsSomeRendererActing;
var NoContext =
  /*                    */
  0;
var BatchedContext =
  /*               */
  1;
var EventContext =
  /*                 */
  2;
var DiscreteEventContext =
  /*         */
  4;
var LegacyUnbatchedContext =
  /*       */
  8;
var RenderContext =
  /*                */
  16;
var CommitContext =
  /*                */
  32;
var RootIncomplete = 0;
var RootFatalErrored = 1;
var RootErrored = 2;
var RootSuspended = 3;
var RootSuspendedWithDelay = 4;
var RootCompleted = 5;
// Describes where we are in the React execution stack
var executionContext = NoContext; // The root we're working on

var workInProgressRoot = null; // The fiber we're working on

var workInProgress = null; // The expiration time we're rendering

var renderExpirationTime = NoWork; // Whether to root completed, errored, suspended, etc.

var workInProgressRootExitStatus = RootIncomplete; // A fatal error, if one is thrown

var workInProgressRootFatalError = null; // Most recent event time among processed updates during this render.
// This is conceptually a time stamp but expressed in terms of an ExpirationTime
// because we deal mostly with expiration times in the hot path, so this avoids
// the conversion happening in the hot path.

var workInProgressRootLatestProcessedExpirationTime = Sync;
var workInProgressRootLatestSuspenseTimeout = Sync;
var workInProgressRootCanSuspendUsingConfig = null; // The work left over by components that were visited during this render. Only
// includes unprocessed updates, not work in bailed out children.

var workInProgressRootNextUnprocessedUpdateTime = NoWork; // If we're pinged while rendering we don't always restart immediately.
// This flag determines if it might be worthwhile to restart if an opportunity
// happens latere.

var workInProgressRootHasPendingPing = false; // The most recent time we committed a fallback. This lets us ensure a train
// model where we don't commit new loading states in too quick succession.

var globalMostRecentFallbackTime = 0;
var FALLBACK_THROTTLE_MS = 500;
var nextEffect = null;
var hasUncaughtError = false;
var firstUncaughtError = null;
var legacyErrorBoundariesThatAlreadyFailed = null;
var rootDoesHavePassiveEffects = false;
var rootWithPendingPassiveEffects = null;
var pendingPassiveEffectsRenderPriority = NoPriority;
var pendingPassiveEffectsExpirationTime = NoWork;
var rootsWithPendingDiscreteUpdates = null; // Use these to prevent an infinite loop of nested updates

var NESTED_UPDATE_LIMIT = 50;
var nestedUpdateCount = 0;
var rootWithNestedUpdates = null;
var NESTED_PASSIVE_UPDATE_LIMIT = 50;
var nestedPassiveUpdateCount = 0;
var interruptedBy = null; // Marks the need to reschedule pending interactions at these expiration times
// during the commit phase. This enables them to be traced across components
// that spawn new work during render. E.g. hidden boundaries, suspended SSR
// hydration or SuspenseList.

var spawnedWorkDuringRender = null; // Expiration times are computed by adding to the current time (the start
// time). However, if two updates are scheduled within the same event, we
// should treat their start times as simultaneous, even if the actual clock
// time has advanced between the first and second call.
// In other words, because expiration times determine how updates are batched,
// we want all updates of like priority that occur within the same event to
// receive the same expiration time. Otherwise we get tearing.

var currentEventTime = NoWork;
function requestCurrentTimeForUpdate() {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    // We're inside React, so it's fine to read the actual time.
    return msToExpirationTime(now());
  } // We're not inside React, so we may be in the middle of a browser event.

  if (currentEventTime !== NoWork) {
    // Use the same start time for all updates until we enter React again.
    return currentEventTime;
  } // This is the first update since React yielded. Compute a new start time.

  currentEventTime = msToExpirationTime(now());
  return currentEventTime;
}
function getCurrentTime() {
  return msToExpirationTime(now());
}
function computeExpirationForFiber(currentTime, fiber, suspenseConfig) {
  var mode = fiber.mode;

  if ((mode & BlockingMode) === NoMode) {
    return Sync;
  }

  var priorityLevel = getCurrentPriorityLevel();

  if ((mode & ConcurrentMode) === NoMode) {
    return priorityLevel === ImmediatePriority ? Sync : Batched;
  }

  if ((executionContext & RenderContext) !== NoContext) {
    // Use whatever time we're already rendering
    // TODO: Should there be a way to opt out, like with `runWithPriority`?
    return renderExpirationTime;
  }

  var expirationTime;

  if (suspenseConfig !== null) {
    // Compute an expiration time based on the Suspense timeout.
    expirationTime = computeSuspenseExpiration(
      currentTime,
      suspenseConfig.timeoutMs | 0 || LOW_PRIORITY_EXPIRATION
    );
  } else {
    // Compute an expiration time based on the Scheduler priority.
    switch (priorityLevel) {
      case ImmediatePriority:
        expirationTime = Sync;
        break;

      case UserBlockingPriority$1:
        // TODO: Rename this to computeUserBlockingExpiration
        expirationTime = computeInteractiveExpiration(currentTime);
        break;

      case NormalPriority:
      case LowPriority:
        // TODO: Handle LowPriority
        // TODO: Rename this to... something better.
        expirationTime = computeAsyncExpiration(currentTime);
        break;

      case IdlePriority:
        expirationTime = Idle;
        break;

      default: {
        throw Error("Expected a valid priority level");
      }
    }
  } // If we're in the middle of rendering a tree, do not update at the same
  // expiration time that is already rendering.
  // TODO: We shouldn't have to do this if the update is on a different root.
  // Refactor computeExpirationForFiber + scheduleUpdate so we have access to
  // the root when we check for this condition.

  if (workInProgressRoot !== null && expirationTime === renderExpirationTime) {
    // This is a trick to move this update into a separate batch
    expirationTime -= 1;
  }

  return expirationTime;
}
function scheduleUpdateOnFiber(fiber, expirationTime) {
  checkForNestedUpdates();
  warnAboutInvalidUpdatesOnClassComponentsInDEV(fiber);
  var root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);

  if (root === null) {
    warnAboutUpdateOnUnmountedFiberInDEV(fiber);
    return;
  }

  checkForInterruption(fiber, expirationTime);
  recordScheduleUpdate(); // TODO: computeExpirationForFiber also reads the priority. Pass the
  // priority as an argument to that function and this one.

  var priorityLevel = getCurrentPriorityLevel();

  if (expirationTime === Sync) {
    if (
      // Check if we're inside unbatchedUpdates
      (executionContext & LegacyUnbatchedContext) !== NoContext && // Check if we're not already rendering
      (executionContext & (RenderContext | CommitContext)) === NoContext
    ) {
      // Register pending interactions on the root to avoid losing traced interaction data.
      schedulePendingInteractions(root, expirationTime); // This is a legacy edge case. The initial mount of a ReactDOM.render-ed
      // root inside of batchedUpdates should be synchronous, but layout updates
      // should be deferred until the end of the batch.

      performSyncWorkOnRoot(root);
    } else {
      ensureRootIsScheduled(root);
      schedulePendingInteractions(root, expirationTime);

      if (executionContext === NoContext) {
        // Flush the synchronous work now, unless we're already working or inside
        // a batch. This is intentionally inside scheduleUpdateOnFiber instead of
        // scheduleCallbackForFiber to preserve the ability to schedule a callback
        // without immediately flushing it. We only do this for user-initiated
        // updates, to preserve historical behavior of legacy mode.
        flushSyncCallbackQueue();
      }
    }
  } else {
    ensureRootIsScheduled(root);
    schedulePendingInteractions(root, expirationTime);
  }

  if (
    (executionContext & DiscreteEventContext) !== NoContext && // Only updates at user-blocking priority or greater are considered
    // discrete, even inside a discrete event.
    (priorityLevel === UserBlockingPriority$1 ||
      priorityLevel === ImmediatePriority)
  ) {
    // This is the result of a discrete event. Track the lowest priority
    // discrete update per root so we can flush them early, if needed.
    if (rootsWithPendingDiscreteUpdates === null) {
      rootsWithPendingDiscreteUpdates = new Map([[root, expirationTime]]);
    } else {
      var lastDiscreteTime = rootsWithPendingDiscreteUpdates.get(root);

      if (lastDiscreteTime === undefined || lastDiscreteTime > expirationTime) {
        rootsWithPendingDiscreteUpdates.set(root, expirationTime);
      }
    }
  }
}
var scheduleWork = scheduleUpdateOnFiber; // This is split into a separate function so we can mark a fiber with pending
// work without treating it as a typical update that originates from an event;
// e.g. retrying a Suspense boundary isn't an update, but it does schedule work
// on a fiber.

function markUpdateTimeFromFiberToRoot(fiber, expirationTime) {
  // Update the source fiber's expiration time
  if (fiber.expirationTime < expirationTime) {
    fiber.expirationTime = expirationTime;
  }

  var alternate = fiber.alternate;

  if (alternate !== null && alternate.expirationTime < expirationTime) {
    alternate.expirationTime = expirationTime;
  } // Walk the parent path to the root and update the child expiration time.

  var node = fiber.return;
  var root = null;

  if (node === null && fiber.tag === HostRoot) {
    root = fiber.stateNode;
  } else {
    while (node !== null) {
      alternate = node.alternate;

      if (node.childExpirationTime < expirationTime) {
        node.childExpirationTime = expirationTime;

        if (
          alternate !== null &&
          alternate.childExpirationTime < expirationTime
        ) {
          alternate.childExpirationTime = expirationTime;
        }
      } else if (
        alternate !== null &&
        alternate.childExpirationTime < expirationTime
      ) {
        alternate.childExpirationTime = expirationTime;
      }

      if (node.return === null && node.tag === HostRoot) {
        root = node.stateNode;
        break;
      }

      node = node.return;
    }
  }

  if (root !== null) {
    if (workInProgressRoot === root) {
      // Received an update to a tree that's in the middle of rendering. Mark
      // that's unprocessed work on this root.
      markUnprocessedUpdateTime(expirationTime);

      if (workInProgressRootExitStatus === RootSuspendedWithDelay) {
        // The root already suspended with a delay, which means this render
        // definitely won't finish. Since we have a new update, let's mark it as
        // suspended now, right before marking the incoming update. This has the
        // effect of interrupting the current render and switching to the update.
        // TODO: This happens to work when receiving an update during the render
        // phase, because of the trick inside computeExpirationForFiber to
        // subtract 1 from `renderExpirationTime` to move it into a
        // separate bucket. But we should probably model it with an exception,
        // using the same mechanism we use to force hydration of a subtree.
        // TODO: This does not account for low pri updates that were already
        // scheduled before the root started rendering. Need to track the next
        // pending expiration time (perhaps by backtracking the return path) and
        // then trigger a restart in the `renderDidSuspendDelayIfPossible` path.
        markRootSuspendedAtTime(root, renderExpirationTime);
      }
    } // Mark that the root has a pending update.

    markRootUpdatedAtTime(root, expirationTime);
  }

  return root;
}

function getNextRootExpirationTimeToWorkOn(root) {
  // Determines the next expiration time that the root should render, taking
  // into account levels that may be suspended, or levels that may have
  // received a ping.
  var lastExpiredTime = root.lastExpiredTime;

  if (lastExpiredTime !== NoWork) {
    return lastExpiredTime;
  } // "Pending" refers to any update that hasn't committed yet, including if it
  // suspended. The "suspended" range is therefore a subset.

  var firstPendingTime = root.firstPendingTime;

  if (!isRootSuspendedAtTime(root, firstPendingTime)) {
    // The highest priority pending time is not suspended. Let's work on that.
    return firstPendingTime;
  } // If the first pending time is suspended, check if there's a lower priority
  // pending level that we know about. Or check if we received a ping. Work
  // on whichever is higher priority.

  var lastPingedTime = root.lastPingedTime;
  var nextKnownPendingLevel = root.nextKnownPendingLevel;
  return lastPingedTime > nextKnownPendingLevel
    ? lastPingedTime
    : nextKnownPendingLevel;
} // Use this function to schedule a task for a root. There's only one task per
// root; if a task was already scheduled, we'll check to make sure the
// expiration time of the existing task is the same as the expiration time of
// the next level that the root has work on. This function is called on every
// update, and right before exiting a task.

function ensureRootIsScheduled(root) {
  var lastExpiredTime = root.lastExpiredTime;

  if (lastExpiredTime !== NoWork) {
    // Special case: Expired work should flush synchronously.
    root.callbackExpirationTime = Sync;
    root.callbackPriority = ImmediatePriority;
    root.callbackNode = scheduleSyncCallback(
      performSyncWorkOnRoot.bind(null, root)
    );
    return;
  }

  var expirationTime = getNextRootExpirationTimeToWorkOn(root);
  var existingCallbackNode = root.callbackNode;

  if (expirationTime === NoWork) {
    // There's nothing to work on.
    if (existingCallbackNode !== null) {
      root.callbackNode = null;
      root.callbackExpirationTime = NoWork;
      root.callbackPriority = NoPriority;
    }

    return;
  } // TODO: If this is an update, we already read the current time. Pass the
  // time as an argument.

  var currentTime = requestCurrentTimeForUpdate();
  var priorityLevel = inferPriorityFromExpirationTime(
    currentTime,
    expirationTime
  ); // If there's an existing render task, confirm it has the correct priority and
  // expiration time. Otherwise, we'll cancel it and schedule a new one.

  if (existingCallbackNode !== null) {
    var existingCallbackPriority = root.callbackPriority;
    var existingCallbackExpirationTime = root.callbackExpirationTime;

    if (
      // Callback must have the exact same expiration time.
      existingCallbackExpirationTime === expirationTime && // Callback must have greater or equal priority.
      existingCallbackPriority >= priorityLevel
    ) {
      // Existing callback is sufficient.
      return;
    } // Need to schedule a new task.
    // TODO: Instead of scheduling a new task, we should be able to change the
    // priority of the existing one.

    cancelCallback(existingCallbackNode);
  }

  root.callbackExpirationTime = expirationTime;
  root.callbackPriority = priorityLevel;
  var callbackNode;

  if (expirationTime === Sync) {
    // Sync React callbacks are scheduled on a special internal queue
    callbackNode = scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
  } else if (disableSchedulerTimeoutBasedOnReactExpirationTime) {
    callbackNode = scheduleCallback(
      priorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  } else {
    callbackNode = scheduleCallback(
      priorityLevel,
      performConcurrentWorkOnRoot.bind(null, root), // Compute a task timeout based on the expiration time. This also affects
      // ordering because tasks are processed in timeout order.
      {
        timeout: expirationTimeToMs(expirationTime) - now()
      }
    );
  }

  root.callbackNode = callbackNode;
} // This is the entry point for every concurrent task, i.e. anything that
// goes through Scheduler.

function performConcurrentWorkOnRoot(root, didTimeout) {
  // Since we know we're in a React event, we can clear the current
  // event time. The next update will compute a new event time.
  currentEventTime = NoWork;

  if (didTimeout) {
    // The render task took too long to complete. Mark the current time as
    // expired to synchronously render all expired work in a single batch.
    var currentTime = requestCurrentTimeForUpdate();
    markRootExpiredAtTime(root, currentTime); // This will schedule a synchronous callback.

    ensureRootIsScheduled(root);
    return null;
  } // Determine the next expiration time to work on, using the fields stored
  // on the root.

  var expirationTime = getNextRootExpirationTimeToWorkOn(root);

  if (expirationTime !== NoWork) {
    var originalCallbackNode = root.callbackNode;

    if (!((executionContext & (RenderContext | CommitContext)) === NoContext)) {
      throw Error("Should not already be working.");
    }

    flushPassiveEffects(); // If the root or expiration time have changed, throw out the existing stack
    // and prepare a fresh one. Otherwise we'll continue where we left off.

    if (
      root !== workInProgressRoot ||
      expirationTime !== renderExpirationTime
    ) {
      prepareFreshStack(root, expirationTime);
      startWorkOnPendingInteractions(root, expirationTime);
    } // If we have a work-in-progress fiber, it means there's still work to do
    // in this root.

    if (workInProgress !== null) {
      var prevExecutionContext = executionContext;
      executionContext |= RenderContext;
      var prevDispatcher = pushDispatcher(root);
      var prevInteractions = pushInteractions(root);
      startWorkLoopTimer(workInProgress);

      do {
        try {
          workLoopConcurrent();
          break;
        } catch (thrownValue) {
          handleError(root, thrownValue);
        }
      } while (true);

      resetContextDependencies();
      executionContext = prevExecutionContext;
      popDispatcher(prevDispatcher);

      if (enableSchedulerTracing) {
        popInteractions(prevInteractions);
      }

      if (workInProgressRootExitStatus === RootFatalErrored) {
        var fatalError = workInProgressRootFatalError;
        stopInterruptedWorkLoopTimer();
        prepareFreshStack(root, expirationTime);
        markRootSuspendedAtTime(root, expirationTime);
        ensureRootIsScheduled(root);
        throw fatalError;
      }

      if (workInProgress !== null) {
        // There's still work left over. Exit without committing.
        stopInterruptedWorkLoopTimer();
      } else {
        // We now have a consistent tree. The next step is either to commit it,
        // or, if something suspended, wait to commit it after a timeout.
        stopFinishedWorkLoopTimer();
        var finishedWork = (root.finishedWork = root.current.alternate);
        root.finishedExpirationTime = expirationTime;
        finishConcurrentRender(
          root,
          finishedWork,
          workInProgressRootExitStatus,
          expirationTime
        );
      }

      ensureRootIsScheduled(root);

      if (root.callbackNode === originalCallbackNode) {
        // The task node scheduled for this root is the same one that's
        // currently executed. Need to return a continuation.
        return performConcurrentWorkOnRoot.bind(null, root);
      }
    }
  }

  return null;
}

function finishConcurrentRender(
  root,
  finishedWork,
  exitStatus,
  expirationTime
) {
  // Set this to null to indicate there's no in-progress render.
  workInProgressRoot = null;

  switch (exitStatus) {
    case RootIncomplete:
    case RootFatalErrored: {
      {
        throw Error("Root did not complete. This is a bug in React.");
      }
    }
    // Flow knows about invariant, so it complains if I add a break
    // statement, but eslint doesn't know about invariant, so it complains
    // if I do. eslint-disable-next-line no-fallthrough

    case RootErrored: {
      // If this was an async render, the error may have happened due to
      // a mutation in a concurrent event. Try rendering one more time,
      // synchronously, to see if the error goes away. If there are
      // lower priority updates, let's include those, too, in case they
      // fix the inconsistency. Render at Idle to include all updates.
      // If it was Idle or Never or some not-yet-invented time, render
      // at that time.
      markRootExpiredAtTime(
        root,
        expirationTime > Idle ? Idle : expirationTime
      ); // We assume that this second render pass will be synchronous
      // and therefore not hit this path again.

      break;
    }

    case RootSuspended: {
      markRootSuspendedAtTime(root, expirationTime);
      var lastSuspendedTime = root.lastSuspendedTime;

      if (expirationTime === lastSuspendedTime) {
        root.nextKnownPendingLevel = getRemainingExpirationTime(finishedWork);
      }

      flushSuspensePriorityWarningInDEV(); // We have an acceptable loading state. We need to figure out if we
      // should immediately commit it or wait a bit.
      // If we have processed new updates during this render, we may now
      // have a new loading state ready. We want to ensure that we commit
      // that as soon as possible.

      var hasNotProcessedNewUpdates =
        workInProgressRootLatestProcessedExpirationTime === Sync;

      if (
        hasNotProcessedNewUpdates && // do not delay if we're inside an act() scope
        !(true && flushSuspenseFallbacksInTests && IsThisRendererActing.current)
      ) {
        // If we have not processed any new updates during this pass, then
        // this is either a retry of an existing fallback state or a
        // hidden tree. Hidden trees shouldn't be batched with other work
        // and after that's fixed it can only be a retry. We're going to
        // throttle committing retries so that we don't show too many
        // loading states too quickly.
        var msUntilTimeout =
          globalMostRecentFallbackTime + FALLBACK_THROTTLE_MS - now(); // Don't bother with a very short suspense time.

        if (msUntilTimeout > 10) {
          if (workInProgressRootHasPendingPing) {
            var lastPingedTime = root.lastPingedTime;

            if (lastPingedTime === NoWork || lastPingedTime >= expirationTime) {
              // This render was pinged but we didn't get to restart
              // earlier so try restarting now instead.
              root.lastPingedTime = expirationTime;
              prepareFreshStack(root, expirationTime);
              break;
            }
          }

          var nextTime = getNextRootExpirationTimeToWorkOn(root);

          if (nextTime !== NoWork && nextTime !== expirationTime) {
            // There's additional work on this root.
            break;
          }

          if (
            lastSuspendedTime !== NoWork &&
            lastSuspendedTime !== expirationTime
          ) {
            // We should prefer to render the fallback of at the last
            // suspended level. Ping the last suspended level to try
            // rendering it again.
            root.lastPingedTime = lastSuspendedTime;
            break;
          } // The render is suspended, it hasn't timed out, and there's no
          // lower priority work to do. Instead of committing the fallback
          // immediately, wait for more data to arrive.

          root.timeoutHandle = scheduleTimeout(
            commitRoot.bind(null, root),
            msUntilTimeout
          );
          break;
        }
      } // The work expired. Commit immediately.

      commitRoot(root);
      break;
    }

    case RootSuspendedWithDelay: {
      markRootSuspendedAtTime(root, expirationTime);
      var _lastSuspendedTime = root.lastSuspendedTime;

      if (expirationTime === _lastSuspendedTime) {
        root.nextKnownPendingLevel = getRemainingExpirationTime(finishedWork);
      }

      flushSuspensePriorityWarningInDEV();

      if (
        // do not delay if we're inside an act() scope
        !(true && flushSuspenseFallbacksInTests && IsThisRendererActing.current)
      ) {
        // We're suspended in a state that should be avoided. We'll try to
        // avoid committing it for as long as the timeouts let us.
        if (workInProgressRootHasPendingPing) {
          var _lastPingedTime = root.lastPingedTime;

          if (_lastPingedTime === NoWork || _lastPingedTime >= expirationTime) {
            // This render was pinged but we didn't get to restart earlier
            // so try restarting now instead.
            root.lastPingedTime = expirationTime;
            prepareFreshStack(root, expirationTime);
            break;
          }
        }

        var _nextTime = getNextRootExpirationTimeToWorkOn(root);

        if (_nextTime !== NoWork && _nextTime !== expirationTime) {
          // There's additional work on this root.
          break;
        }

        if (
          _lastSuspendedTime !== NoWork &&
          _lastSuspendedTime !== expirationTime
        ) {
          // We should prefer to render the fallback of at the last
          // suspended level. Ping the last suspended level to try
          // rendering it again.
          root.lastPingedTime = _lastSuspendedTime;
          break;
        }

        var _msUntilTimeout;

        if (workInProgressRootLatestSuspenseTimeout !== Sync) {
          // We have processed a suspense config whose expiration time we
          // can use as the timeout.
          _msUntilTimeout =
            expirationTimeToMs(workInProgressRootLatestSuspenseTimeout) - now();
        } else if (workInProgressRootLatestProcessedExpirationTime === Sync) {
          // This should never normally happen because only new updates
          // cause delayed states, so we should have processed something.
          // However, this could also happen in an offscreen tree.
          _msUntilTimeout = 0;
        } else {
          // If we don't have a suspense config, we're going to use a
          // heuristic to determine how long we can suspend.
          var eventTimeMs = inferTimeFromExpirationTime(
            workInProgressRootLatestProcessedExpirationTime
          );
          var currentTimeMs = now();
          var timeUntilExpirationMs =
            expirationTimeToMs(expirationTime) - currentTimeMs;
          var timeElapsed = currentTimeMs - eventTimeMs;

          if (timeElapsed < 0) {
            // We get this wrong some time since we estimate the time.
            timeElapsed = 0;
          }

          _msUntilTimeout = jnd(timeElapsed) - timeElapsed; // Clamp the timeout to the expiration time. TODO: Once the
          // event time is exact instead of inferred from expiration time
          // we don't need this.

          if (timeUntilExpirationMs < _msUntilTimeout) {
            _msUntilTimeout = timeUntilExpirationMs;
          }
        } // Don't bother with a very short suspense time.

        if (_msUntilTimeout > 10) {
          // The render is suspended, it hasn't timed out, and there's no
          // lower priority work to do. Instead of committing the fallback
          // immediately, wait for more data to arrive.
          root.timeoutHandle = scheduleTimeout(
            commitRoot.bind(null, root),
            _msUntilTimeout
          );
          break;
        }
      } // The work expired. Commit immediately.

      commitRoot(root);
      break;
    }

    case RootCompleted: {
      // The work completed. Ready to commit.
      if (
        // do not delay if we're inside an act() scope
        !(
          true &&
          flushSuspenseFallbacksInTests &&
          IsThisRendererActing.current
        ) &&
        workInProgressRootLatestProcessedExpirationTime !== Sync &&
        workInProgressRootCanSuspendUsingConfig !== null
      ) {
        // If we have exceeded the minimum loading delay, which probably
        // means we have shown a spinner already, we might have to suspend
        // a bit longer to ensure that the spinner is shown for
        // enough time.
        var _msUntilTimeout2 = computeMsUntilSuspenseLoadingDelay(
          workInProgressRootLatestProcessedExpirationTime,
          expirationTime,
          workInProgressRootCanSuspendUsingConfig
        );

        if (_msUntilTimeout2 > 10) {
          markRootSuspendedAtTime(root, expirationTime);
          root.timeoutHandle = scheduleTimeout(
            commitRoot.bind(null, root),
            _msUntilTimeout2
          );
          break;
        }
      }

      commitRoot(root);
      break;
    }

    default: {
      {
        throw Error("Unknown root exit status.");
      }
    }
  }
} // This is the entry point for synchronous tasks that don't go
// through Scheduler

function performSyncWorkOnRoot(root) {
  // Check if there's expired work on this root. Otherwise, render at Sync.
  var lastExpiredTime = root.lastExpiredTime;
  var expirationTime = lastExpiredTime !== NoWork ? lastExpiredTime : Sync;

  if (root.finishedExpirationTime === expirationTime) {
    // There's already a pending commit at this expiration time.
    // TODO: This is poorly factored. This case only exists for the
    // batch.commit() API.
    commitRoot(root);
  } else {
    if (!((executionContext & (RenderContext | CommitContext)) === NoContext)) {
      throw Error("Should not already be working.");
    }

    flushPassiveEffects(); // If the root or expiration time have changed, throw out the existing stack
    // and prepare a fresh one. Otherwise we'll continue where we left off.

    if (
      root !== workInProgressRoot ||
      expirationTime !== renderExpirationTime
    ) {
      prepareFreshStack(root, expirationTime);
      startWorkOnPendingInteractions(root, expirationTime);
    } // If we have a work-in-progress fiber, it means there's still work to do
    // in this root.

    if (workInProgress !== null) {
      var prevExecutionContext = executionContext;
      executionContext |= RenderContext;
      var prevDispatcher = pushDispatcher(root);
      var prevInteractions = pushInteractions(root);
      startWorkLoopTimer(workInProgress);

      do {
        try {
          workLoopSync();
          break;
        } catch (thrownValue) {
          handleError(root, thrownValue);
        }
      } while (true);

      resetContextDependencies();
      executionContext = prevExecutionContext;
      popDispatcher(prevDispatcher);

      if (enableSchedulerTracing) {
        popInteractions(prevInteractions);
      }

      if (workInProgressRootExitStatus === RootFatalErrored) {
        var fatalError = workInProgressRootFatalError;
        stopInterruptedWorkLoopTimer();
        prepareFreshStack(root, expirationTime);
        markRootSuspendedAtTime(root, expirationTime);
        ensureRootIsScheduled(root);
        throw fatalError;
      }

      if (workInProgress !== null) {
        // This is a sync render, so we should have finished the whole tree.
        {
          throw Error(
            "Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue."
          );
        }
      } else {
        // We now have a consistent tree. Because this is a sync render, we
        // will commit it even if something suspended.
        stopFinishedWorkLoopTimer();
        root.finishedWork = root.current.alternate;
        root.finishedExpirationTime = expirationTime;
        finishSyncRender(root, workInProgressRootExitStatus, expirationTime);
      } // Before exiting, make sure there's a callback scheduled for the next
      // pending level.

      ensureRootIsScheduled(root);
    }
  }

  return null;
}

function finishSyncRender(root, exitStatus, expirationTime) {
  // Set this to null to indicate there's no in-progress render.
  workInProgressRoot = null;

  {
    if (exitStatus === RootSuspended || exitStatus === RootSuspendedWithDelay) {
      flushSuspensePriorityWarningInDEV();
    }
  }

  commitRoot(root);
}

function flushDiscreteUpdates() {
  // TODO: Should be able to flush inside batchedUpdates, but not inside `act`.
  // However, `act` uses `batchedUpdates`, so there's no way to distinguish
  // those two cases. Need to fix this before exposing flushDiscreteUpdates
  // as a public API.
  if (
    (executionContext & (BatchedContext | RenderContext | CommitContext)) !==
    NoContext
  ) {
    if (true && (executionContext & RenderContext) !== NoContext) {
      warning$1(
        false,
        "unstable_flushDiscreteUpdates: Cannot flush updates when React is " +
          "already rendering."
      );
    } // We're already rendering, so we can't synchronously flush pending work.
    // This is probably a nested event dispatch triggered by a lifecycle/effect,
    // like `el.focus()`. Exit.

    return;
  }

  flushPendingDiscreteUpdates(); // If the discrete updates scheduled passive effects, flush them now so that
  // they fire before the next serial event.

  flushPassiveEffects();
}

function syncUpdates(fn, a, b, c) {
  return runWithPriority$1(ImmediatePriority, fn.bind(null, a, b, c));
}

function flushPendingDiscreteUpdates() {
  if (rootsWithPendingDiscreteUpdates !== null) {
    // For each root with pending discrete updates, schedule a callback to
    // immediately flush them.
    var roots = rootsWithPendingDiscreteUpdates;
    rootsWithPendingDiscreteUpdates = null;
    roots.forEach(function(expirationTime, root) {
      markRootExpiredAtTime(root, expirationTime);
      ensureRootIsScheduled(root);
    }); // Now flush the immediate queue.

    flushSyncCallbackQueue();
  }
}

function batchedUpdates$1(fn, a) {
  var prevExecutionContext = executionContext;
  executionContext |= BatchedContext;

  try {
    return fn(a);
  } finally {
    executionContext = prevExecutionContext;

    if (executionContext === NoContext) {
      // Flush the immediate callbacks that were scheduled during this batch
      flushSyncCallbackQueue();
    }
  }
}
function batchedEventUpdates$1(fn, a) {
  var prevExecutionContext = executionContext;
  executionContext |= EventContext;

  try {
    return fn(a);
  } finally {
    executionContext = prevExecutionContext;

    if (executionContext === NoContext) {
      // Flush the immediate callbacks that were scheduled during this batch
      flushSyncCallbackQueue();
    }
  }
}
function discreteUpdates$1(fn, a, b, c) {
  var prevExecutionContext = executionContext;
  executionContext |= DiscreteEventContext;

  try {
    // Should this
    return runWithPriority$1(UserBlockingPriority$1, fn.bind(null, a, b, c));
  } finally {
    executionContext = prevExecutionContext;

    if (executionContext === NoContext) {
      // Flush the immediate callbacks that were scheduled during this batch
      flushSyncCallbackQueue();
    }
  }
}

function flushSync(fn, a) {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    {
      throw Error(
        "flushSync was called from inside a lifecycle method. It cannot be called when React is already rendering."
      );
    }
  }

  var prevExecutionContext = executionContext;
  executionContext |= BatchedContext;

  try {
    return runWithPriority$1(ImmediatePriority, fn.bind(null, a));
  } finally {
    executionContext = prevExecutionContext; // Flush the immediate callbacks that were scheduled during this batch.
    // Note that this will happen even if batchedUpdates is higher up
    // the stack.

    flushSyncCallbackQueue();
  }
}

function prepareFreshStack(root, expirationTime) {
  root.finishedWork = null;
  root.finishedExpirationTime = NoWork;
  var timeoutHandle = root.timeoutHandle;

  if (timeoutHandle !== noTimeout) {
    // The root previous suspended and scheduled a timeout to commit a fallback
    // state. Now that we have additional work, cancel the timeout.
    root.timeoutHandle = noTimeout; // $FlowFixMe Complains noTimeout is not a TimeoutID, despite the check above

    cancelTimeout(timeoutHandle);
  }

  if (workInProgress !== null) {
    var interruptedWork = workInProgress.return;

    while (interruptedWork !== null) {
      unwindInterruptedWork(interruptedWork);
      interruptedWork = interruptedWork.return;
    }
  }

  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null, expirationTime);
  renderExpirationTime = expirationTime;
  workInProgressRootExitStatus = RootIncomplete;
  workInProgressRootFatalError = null;
  workInProgressRootLatestProcessedExpirationTime = Sync;
  workInProgressRootLatestSuspenseTimeout = Sync;
  workInProgressRootCanSuspendUsingConfig = null;
  workInProgressRootNextUnprocessedUpdateTime = NoWork;
  workInProgressRootHasPendingPing = false;

  if (enableSchedulerTracing) {
    spawnedWorkDuringRender = null;
  }

  {
    ReactStrictModeWarnings.discardPendingWarnings();
    componentsThatTriggeredHighPriSuspend = null;
  }
}

function handleError(root, thrownValue) {
  do {
    try {
      // Reset module-level state that was set during the render phase.
      resetContextDependencies();
      resetHooks();
      resetCurrentFiber();

      if (workInProgress === null || workInProgress.return === null) {
        // Expected to be working on a non-root fiber. This is a fatal error
        // because there's no ancestor that can handle it; the root is
        // supposed to capture all errors that weren't caught by an error
        // boundary.
        workInProgressRootExitStatus = RootFatalErrored;
        workInProgressRootFatalError = thrownValue;
        return null;
      }

      if (enableProfilerTimer && workInProgress.mode & ProfileMode) {
        // Record the time spent rendering before an error was thrown. This
        // avoids inaccurate Profiler durations in the case of a
        // suspended render.
        stopProfilerTimerIfRunningAndRecordDelta(workInProgress, true);
      }

      throwException(
        root,
        workInProgress.return,
        workInProgress,
        thrownValue,
        renderExpirationTime
      );
      workInProgress = completeUnitOfWork(workInProgress);
    } catch (yetAnotherThrownValue) {
      // Something in the return path also threw.
      thrownValue = yetAnotherThrownValue;
      continue;
    } // Return to the normal work loop.

    return;
  } while (true);
}

function pushDispatcher(root) {
  var prevDispatcher = ReactCurrentDispatcher.current;
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;

  if (prevDispatcher === null) {
    // The React isomorphic package does not include a default dispatcher.
    // Instead the first renderer will lazily attach one, in order to give
    // nicer error messages.
    return ContextOnlyDispatcher;
  } else {
    return prevDispatcher;
  }
}

function popDispatcher(prevDispatcher) {
  ReactCurrentDispatcher.current = prevDispatcher;
}

function pushInteractions(root) {
  if (enableSchedulerTracing) {
    var prevInteractions = tracing.__interactionsRef.current;
    tracing.__interactionsRef.current = root.memoizedInteractions;
    return prevInteractions;
  }

  return null;
}

function popInteractions(prevInteractions) {
  if (enableSchedulerTracing) {
    tracing.__interactionsRef.current = prevInteractions;
  }
}

function markCommitTimeOfFallback() {
  globalMostRecentFallbackTime = now();
}
function markRenderEventTimeAndConfig(expirationTime, suspenseConfig) {
  if (
    expirationTime < workInProgressRootLatestProcessedExpirationTime &&
    expirationTime > Idle
  ) {
    workInProgressRootLatestProcessedExpirationTime = expirationTime;
  }

  if (suspenseConfig !== null) {
    if (
      expirationTime < workInProgressRootLatestSuspenseTimeout &&
      expirationTime > Idle
    ) {
      workInProgressRootLatestSuspenseTimeout = expirationTime; // Most of the time we only have one config and getting wrong is not bad.

      workInProgressRootCanSuspendUsingConfig = suspenseConfig;
    }
  }
}
function markUnprocessedUpdateTime(expirationTime) {
  if (expirationTime > workInProgressRootNextUnprocessedUpdateTime) {
    workInProgressRootNextUnprocessedUpdateTime = expirationTime;
  }
}
function renderDidSuspend() {
  if (workInProgressRootExitStatus === RootIncomplete) {
    workInProgressRootExitStatus = RootSuspended;
  }
}
function renderDidSuspendDelayIfPossible() {
  if (
    workInProgressRootExitStatus === RootIncomplete ||
    workInProgressRootExitStatus === RootSuspended
  ) {
    workInProgressRootExitStatus = RootSuspendedWithDelay;
  } // Check if there's a lower priority update somewhere else in the tree.

  if (
    workInProgressRootNextUnprocessedUpdateTime !== NoWork &&
    workInProgressRoot !== null
  ) {
    // Mark the current render as suspended, and then mark that there's a
    // pending update.
    // TODO: This should immediately interrupt the current render, instead
    // of waiting until the next time we yield.
    markRootSuspendedAtTime(workInProgressRoot, renderExpirationTime);
    markRootUpdatedAtTime(
      workInProgressRoot,
      workInProgressRootNextUnprocessedUpdateTime
    );
  }
}
function renderDidError() {
  if (workInProgressRootExitStatus !== RootCompleted) {
    workInProgressRootExitStatus = RootErrored;
  }
} // Called during render to determine if anything has suspended.
// Returns false if we're not sure.

function renderHasNotSuspendedYet() {
  // If something errored or completed, we can't really be sure,
  // so those are false.
  return workInProgressRootExitStatus === RootIncomplete;
}

function inferTimeFromExpirationTime(expirationTime) {
  // We don't know exactly when the update was scheduled, but we can infer an
  // approximate start time from the expiration time.
  var earliestExpirationTimeMs = expirationTimeToMs(expirationTime);
  return earliestExpirationTimeMs - LOW_PRIORITY_EXPIRATION;
}

function inferTimeFromExpirationTimeWithSuspenseConfig(
  expirationTime,
  suspenseConfig
) {
  // We don't know exactly when the update was scheduled, but we can infer an
  // approximate start time from the expiration time by subtracting the timeout
  // that was added to the event time.
  var earliestExpirationTimeMs = expirationTimeToMs(expirationTime);
  return (
    earliestExpirationTimeMs -
    (suspenseConfig.timeoutMs | 0 || LOW_PRIORITY_EXPIRATION)
  );
} // The work loop is an extremely hot path. Tell Closure not to inline it.

/** @noinline */

function workLoopSync() {
  // Already timed out, so perform work without checking if we need to yield.
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}
/** @noinline */

function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork) {
  // The current, flushed, state of this fiber is the alternate. Ideally
  // nothing should rely on this, but relying on it here means that we don't
  // need an additional field on the work in progress.
  var current$$1 = unitOfWork.alternate;
  startWorkTimer(unitOfWork);
  setCurrentFiber(unitOfWork);
  var next;

  if (enableProfilerTimer && (unitOfWork.mode & ProfileMode) !== NoMode) {
    startProfilerTimer(unitOfWork);
    next = beginWork$$1(current$$1, unitOfWork, renderExpirationTime);
    stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
  } else {
    next = beginWork$$1(current$$1, unitOfWork, renderExpirationTime);
  }

  resetCurrentFiber();
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    // If this doesn't spawn new work, complete the current work.
    next = completeUnitOfWork(unitOfWork);
  }

  ReactCurrentOwner$2.current = null;
  return next;
}

function completeUnitOfWork(unitOfWork) {
  // Attempt to complete the current unit of work, then move to the next
  // sibling. If there are no more siblings, return to the parent fiber.
  workInProgress = unitOfWork;

  do {
    // The current, flushed, state of this fiber is the alternate. Ideally
    // nothing should rely on this, but relying on it here means that we don't
    // need an additional field on the work in progress.
    var current$$1 = workInProgress.alternate;
    var returnFiber = workInProgress.return; // Check if the work completed or if something threw.

    if ((workInProgress.effectTag & Incomplete) === NoEffect) {
      setCurrentFiber(workInProgress);
      var next = void 0;

      if (
        !enableProfilerTimer ||
        (workInProgress.mode & ProfileMode) === NoMode
      ) {
        next = completeWork(current$$1, workInProgress, renderExpirationTime);
      } else {
        startProfilerTimer(workInProgress);
        next = completeWork(current$$1, workInProgress, renderExpirationTime); // Update render duration assuming we didn't error.

        stopProfilerTimerIfRunningAndRecordDelta(workInProgress, false);
      }

      stopWorkTimer(workInProgress);
      resetCurrentFiber();
      resetChildExpirationTime(workInProgress);

      if (next !== null) {
        // Completing this fiber spawned new work. Work on that next.
        return next;
      }

      if (
        returnFiber !== null && // Do not append effects to parents if a sibling failed to complete
        (returnFiber.effectTag & Incomplete) === NoEffect
      ) {
        // Append all the effects of the subtree and this fiber onto the effect
        // list of the parent. The completion order of the children affects the
        // side-effect order.
        if (returnFiber.firstEffect === null) {
          returnFiber.firstEffect = workInProgress.firstEffect;
        }

        if (workInProgress.lastEffect !== null) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
          }

          returnFiber.lastEffect = workInProgress.lastEffect;
        } // If this fiber had side-effects, we append it AFTER the children's
        // side-effects. We can perform certain side-effects earlier if needed,
        // by doing multiple passes over the effect list. We don't want to
        // schedule our own side-effect on our own list because if end up
        // reusing children we'll schedule this effect onto itself since we're
        // at the end.

        var effectTag = workInProgress.effectTag; // Skip both NoWork and PerformedWork tags when creating the effect
        // list. PerformedWork effect is read by React DevTools but shouldn't be
        // committed.

        if (effectTag > PerformedWork) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = workInProgress;
          } else {
            returnFiber.firstEffect = workInProgress;
          }

          returnFiber.lastEffect = workInProgress;
        }
      }
    } else {
      // This fiber did not complete because something threw. Pop values off
      // the stack without entering the complete phase. If this is a boundary,
      // capture values if possible.
      var _next = unwindWork(workInProgress, renderExpirationTime); // Because this fiber did not complete, don't reset its expiration time.

      if (
        enableProfilerTimer &&
        (workInProgress.mode & ProfileMode) !== NoMode
      ) {
        // Record the render duration for the fiber that errored.
        stopProfilerTimerIfRunningAndRecordDelta(workInProgress, false); // Include the time spent working on failed children before continuing.

        var actualDuration = workInProgress.actualDuration;
        var child = workInProgress.child;

        while (child !== null) {
          actualDuration += child.actualDuration;
          child = child.sibling;
        }

        workInProgress.actualDuration = actualDuration;
      }

      if (_next !== null) {
        // If completing this work spawned new work, do that next. We'll come
        // back here again.
        // Since we're restarting, remove anything that is not a host effect
        // from the effect tag.
        // TODO: The name stopFailedWorkTimer is misleading because Suspense
        // also captures and restarts.
        stopFailedWorkTimer(workInProgress);
        _next.effectTag &= HostEffectMask;
        return _next;
      }

      stopWorkTimer(workInProgress);

      if (returnFiber !== null) {
        // Mark the parent fiber as incomplete and clear its effect list.
        returnFiber.firstEffect = returnFiber.lastEffect = null;
        returnFiber.effectTag |= Incomplete;
      }
    }

    var siblingFiber = workInProgress.sibling;

    if (siblingFiber !== null) {
      // If there is more work to do in this returnFiber, do that next.
      return siblingFiber;
    } // Otherwise, return to the parent

    workInProgress = returnFiber;
  } while (workInProgress !== null); // We've reached the root.

  if (workInProgressRootExitStatus === RootIncomplete) {
    workInProgressRootExitStatus = RootCompleted;
  }

  return null;
}

function getRemainingExpirationTime(fiber) {
  var updateExpirationTime = fiber.expirationTime;
  var childExpirationTime = fiber.childExpirationTime;
  return updateExpirationTime > childExpirationTime
    ? updateExpirationTime
    : childExpirationTime;
}

function resetChildExpirationTime(completedWork) {
  if (
    renderExpirationTime !== Never &&
    completedWork.childExpirationTime === Never
  ) {
    // The children of this component are hidden. Don't bubble their
    // expiration times.
    return;
  }

  var newChildExpirationTime = NoWork; // Bubble up the earliest expiration time.

  if (enableProfilerTimer && (completedWork.mode & ProfileMode) !== NoMode) {
    // In profiling mode, resetChildExpirationTime is also used to reset
    // profiler durations.
    var actualDuration = completedWork.actualDuration;
    var treeBaseDuration = completedWork.selfBaseDuration; // When a fiber is cloned, its actualDuration is reset to 0. This value will
    // only be updated if work is done on the fiber (i.e. it doesn't bailout).
    // When work is done, it should bubble to the parent's actualDuration. If
    // the fiber has not been cloned though, (meaning no work was done), then
    // this value will reflect the amount of time spent working on a previous
    // render. In that case it should not bubble. We determine whether it was
    // cloned by comparing the child pointer.

    var shouldBubbleActualDurations =
      completedWork.alternate === null ||
      completedWork.child !== completedWork.alternate.child;
    var child = completedWork.child;

    while (child !== null) {
      var childUpdateExpirationTime = child.expirationTime;
      var childChildExpirationTime = child.childExpirationTime;

      if (childUpdateExpirationTime > newChildExpirationTime) {
        newChildExpirationTime = childUpdateExpirationTime;
      }

      if (childChildExpirationTime > newChildExpirationTime) {
        newChildExpirationTime = childChildExpirationTime;
      }

      if (shouldBubbleActualDurations) {
        actualDuration += child.actualDuration;
      }

      treeBaseDuration += child.treeBaseDuration;
      child = child.sibling;
    }

    completedWork.actualDuration = actualDuration;
    completedWork.treeBaseDuration = treeBaseDuration;
  } else {
    var _child = completedWork.child;

    while (_child !== null) {
      var _childUpdateExpirationTime = _child.expirationTime;
      var _childChildExpirationTime = _child.childExpirationTime;

      if (_childUpdateExpirationTime > newChildExpirationTime) {
        newChildExpirationTime = _childUpdateExpirationTime;
      }

      if (_childChildExpirationTime > newChildExpirationTime) {
        newChildExpirationTime = _childChildExpirationTime;
      }

      _child = _child.sibling;
    }
  }

  completedWork.childExpirationTime = newChildExpirationTime;
}

function commitRoot(root) {
  var renderPriorityLevel = getCurrentPriorityLevel();
  runWithPriority$1(
    ImmediatePriority,
    commitRootImpl.bind(null, root, renderPriorityLevel)
  );
  return null;
}

function commitRootImpl(root, renderPriorityLevel) {
  flushPassiveEffects();
  flushRenderPhaseStrictModeWarningsInDEV();

  if (!((executionContext & (RenderContext | CommitContext)) === NoContext)) {
    throw Error("Should not already be working.");
  }

  var finishedWork = root.finishedWork;
  var expirationTime = root.finishedExpirationTime;

  if (finishedWork === null) {
    return null;
  }

  root.finishedWork = null;
  root.finishedExpirationTime = NoWork;

  if (!(finishedWork !== root.current)) {
    throw Error(
      "Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue."
    );
  } // commitRoot never returns a continuation; it always finishes synchronously.
  // So we can clear these now to allow a new callback to be scheduled.

  root.callbackNode = null;
  root.callbackExpirationTime = NoWork;
  root.callbackPriority = NoPriority;
  root.nextKnownPendingLevel = NoWork;
  startCommitTimer(); // Update the first and last pending times on this root. The new first
  // pending time is whatever is left on the root fiber.

  var remainingExpirationTimeBeforeCommit = getRemainingExpirationTime(
    finishedWork
  );
  markRootFinishedAtTime(
    root,
    expirationTime,
    remainingExpirationTimeBeforeCommit
  );

  if (root === workInProgressRoot) {
    // We can reset these now that they are finished.
    workInProgressRoot = null;
    workInProgress = null;
    renderExpirationTime = NoWork;
  } else {
  } // This indicates that the last root we worked on is not the same one that
  // we're committing now. This most commonly happens when a suspended root
  // times out.
  // Get the list of effects.

  var firstEffect;

  if (finishedWork.effectTag > PerformedWork) {
    // A fiber's effect list consists only of its children, not itself. So if
    // the root has an effect, we need to add it to the end of the list. The
    // resulting list is the set that would belong to the root's parent, if it
    // had one; that is, all the effects in the tree including the root.
    if (finishedWork.lastEffect !== null) {
      finishedWork.lastEffect.nextEffect = finishedWork;
      firstEffect = finishedWork.firstEffect;
    } else {
      firstEffect = finishedWork;
    }
  } else {
    // There is no effect on the root.
    firstEffect = finishedWork.firstEffect;
  }

  if (firstEffect !== null) {
    var prevExecutionContext = executionContext;
    executionContext |= CommitContext;
    var prevInteractions = pushInteractions(root); // Reset this to null before calling lifecycles

    ReactCurrentOwner$2.current = null; // The commit phase is broken into several sub-phases. We do a separate pass
    // of the effect list for each phase: all mutation effects come before all
    // layout effects, and so on.
    // The first phase a "before mutation" phase. We use this phase to read the
    // state of the host tree right before we mutate it. This is where
    // getSnapshotBeforeUpdate is called.

    startCommitSnapshotEffectsTimer();
    prepareForCommit(root.containerInfo);
    nextEffect = firstEffect;

    do {
      {
        invokeGuardedCallback(null, commitBeforeMutationEffects, null);

        if (hasCaughtError()) {
          if (!(nextEffect !== null)) {
            throw Error("Should be working on an effect.");
          }

          var error = clearCaughtError();
          captureCommitPhaseError(nextEffect, error);
          nextEffect = nextEffect.nextEffect;
        }
      }
    } while (nextEffect !== null);

    stopCommitSnapshotEffectsTimer();

    if (enableProfilerTimer) {
      // Mark the current commit time to be shared by all Profilers in this
      // batch. This enables them to be grouped later.
      recordCommitTime();
    } // The next phase is the mutation phase, where we mutate the host tree.

    startCommitHostEffectsTimer();
    nextEffect = firstEffect;

    do {
      {
        invokeGuardedCallback(
          null,
          commitMutationEffects,
          null,
          root,
          renderPriorityLevel
        );

        if (hasCaughtError()) {
          if (!(nextEffect !== null)) {
            throw Error("Should be working on an effect.");
          }

          var _error = clearCaughtError();

          captureCommitPhaseError(nextEffect, _error);
          nextEffect = nextEffect.nextEffect;
        }
      }
    } while (nextEffect !== null);

    stopCommitHostEffectsTimer();
    resetAfterCommit(root.containerInfo); // The work-in-progress tree is now the current tree. This must come after
    // the mutation phase, so that the previous tree is still current during
    // componentWillUnmount, but before the layout phase, so that the finished
    // work is current during componentDidMount/Update.

    root.current = finishedWork; // The next phase is the layout phase, where we call effects that read
    // the host tree after it's been mutated. The idiomatic use case for this is
    // layout, but class component lifecycles also fire here for legacy reasons.

    startCommitLifeCyclesTimer();
    nextEffect = firstEffect;

    do {
      {
        invokeGuardedCallback(
          null,
          commitLayoutEffects,
          null,
          root,
          expirationTime
        );

        if (hasCaughtError()) {
          if (!(nextEffect !== null)) {
            throw Error("Should be working on an effect.");
          }

          var _error2 = clearCaughtError();

          captureCommitPhaseError(nextEffect, _error2);
          nextEffect = nextEffect.nextEffect;
        }
      }
    } while (nextEffect !== null);

    stopCommitLifeCyclesTimer();
    nextEffect = null; // Tell Scheduler to yield at the end of the frame, so the browser has an
    // opportunity to paint.

    requestPaint();

    if (enableSchedulerTracing) {
      popInteractions(prevInteractions);
    }

    executionContext = prevExecutionContext;
  } else {
    // No effects.
    root.current = finishedWork; // Measure these anyway so the flamegraph explicitly shows that there were
    // no effects.
    // TODO: Maybe there's a better way to report this.

    startCommitSnapshotEffectsTimer();
    stopCommitSnapshotEffectsTimer();

    if (enableProfilerTimer) {
      recordCommitTime();
    }

    startCommitHostEffectsTimer();
    stopCommitHostEffectsTimer();
    startCommitLifeCyclesTimer();
    stopCommitLifeCyclesTimer();
  }

  stopCommitTimer();
  var rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

  if (rootDoesHavePassiveEffects) {
    // This commit has passive effects. Stash a reference to them. But don't
    // schedule a callback until after flushing layout work.
    rootDoesHavePassiveEffects = false;
    rootWithPendingPassiveEffects = root;
    pendingPassiveEffectsExpirationTime = expirationTime;
    pendingPassiveEffectsRenderPriority = renderPriorityLevel;
  } else {
    // We are done with the effect chain at this point so let's clear the
    // nextEffect pointers to assist with GC. If we have passive effects, we'll
    // clear this in flushPassiveEffects.
    nextEffect = firstEffect;

    while (nextEffect !== null) {
      var nextNextEffect = nextEffect.nextEffect;
      nextEffect.nextEffect = null;
      nextEffect = nextNextEffect;
    }
  } // Check if there's remaining work on this root

  var remainingExpirationTime = root.firstPendingTime;

  if (remainingExpirationTime !== NoWork) {
    if (enableSchedulerTracing) {
      if (spawnedWorkDuringRender !== null) {
        var expirationTimes = spawnedWorkDuringRender;
        spawnedWorkDuringRender = null;

        for (var i = 0; i < expirationTimes.length; i++) {
          scheduleInteractions(
            root,
            expirationTimes[i],
            root.memoizedInteractions
          );
        }
      }

      schedulePendingInteractions(root, remainingExpirationTime);
    }
  } else {
    // If there's no remaining work, we can clear the set of already failed
    // error boundaries.
    legacyErrorBoundariesThatAlreadyFailed = null;
  }

  if (enableSchedulerTracing) {
    if (!rootDidHavePassiveEffects) {
      // If there are no passive effects, then we can complete the pending interactions.
      // Otherwise, we'll wait until after the passive effects are flushed.
      // Wait to do this until after remaining work has been scheduled,
      // so that we don't prematurely signal complete for interactions when there's e.g. hidden work.
      finishPendingInteractions(root, expirationTime);
    }
  }

  if (remainingExpirationTime === Sync) {
    // Count the number of times the root synchronously re-renders without
    // finishing. If there are too many, it indicates an infinite update loop.
    if (root === rootWithNestedUpdates) {
      nestedUpdateCount++;
    } else {
      nestedUpdateCount = 0;
      rootWithNestedUpdates = root;
    }
  } else {
    nestedUpdateCount = 0;
  }

  onCommitRoot(finishedWork.stateNode, expirationTime); // Always call this before exiting `commitRoot`, to ensure that any
  // additional work on this root is scheduled.

  ensureRootIsScheduled(root);

  if (hasUncaughtError) {
    hasUncaughtError = false;
    var _error3 = firstUncaughtError;
    firstUncaughtError = null;
    throw _error3;
  }

  if ((executionContext & LegacyUnbatchedContext) !== NoContext) {
    // This is a legacy edge case. We just committed the initial mount of
    // a ReactDOM.render-ed root inside of batchedUpdates. The commit fired
    // synchronously, but layout updates should be deferred until the end
    // of the batch.
    return null;
  } // If layout work was scheduled, flush it now.

  flushSyncCallbackQueue();
  return null;
}

function commitBeforeMutationEffects() {
  while (nextEffect !== null) {
    var effectTag = nextEffect.effectTag;

    if ((effectTag & Snapshot) !== NoEffect) {
      setCurrentFiber(nextEffect);
      recordEffect();
      var current$$1 = nextEffect.alternate;
      commitBeforeMutationLifeCycles(current$$1, nextEffect);
      resetCurrentFiber();
    }

    if ((effectTag & Passive) !== NoEffect) {
      // If there are passive effects, schedule a callback to flush at
      // the earliest opportunity.
      if (!rootDoesHavePassiveEffects) {
        rootDoesHavePassiveEffects = true;
        scheduleCallback(NormalPriority, function() {
          flushPassiveEffects();
          return null;
        });
      }
    }

    nextEffect = nextEffect.nextEffect;
  }
}

function commitMutationEffects(root, renderPriorityLevel) {
  // TODO: Should probably move the bulk of this function to commitWork.
  while (nextEffect !== null) {
    setCurrentFiber(nextEffect);
    var effectTag = nextEffect.effectTag;

    if (effectTag & ContentReset) {
      commitResetTextContent(nextEffect);
    }

    if (effectTag & Ref) {
      var current$$1 = nextEffect.alternate;

      if (current$$1 !== null) {
        commitDetachRef(current$$1);
      }
    } // The following switch statement is only concerned about placement,
    // updates, and deletions. To avoid needing to add a case for every possible
    // bitmap value, we remove the secondary effects from the effect tag and
    // switch on that value.

    var primaryEffectTag =
      effectTag & (Placement | Update | Deletion | Hydrating);

    switch (primaryEffectTag) {
      case Placement: {
        commitPlacement(nextEffect); // Clear the "placement" from effect tag so that we know that this is
        // inserted, before any life-cycles like componentDidMount gets called.
        // TODO: findDOMNode doesn't rely on this any more but isMounted does
        // and isMounted is deprecated anyway so we should be able to kill this.

        nextEffect.effectTag &= ~Placement;
        break;
      }

      case PlacementAndUpdate: {
        // Placement
        commitPlacement(nextEffect); // Clear the "placement" from effect tag so that we know that this is
        // inserted, before any life-cycles like componentDidMount gets called.

        nextEffect.effectTag &= ~Placement; // Update

        var _current = nextEffect.alternate;
        commitWork(_current, nextEffect);
        break;
      }

      case Hydrating: {
        nextEffect.effectTag &= ~Hydrating;
        break;
      }

      case HydratingAndUpdate: {
        nextEffect.effectTag &= ~Hydrating; // Update

        var _current2 = nextEffect.alternate;
        commitWork(_current2, nextEffect);
        break;
      }

      case Update: {
        var _current3 = nextEffect.alternate;
        commitWork(_current3, nextEffect);
        break;
      }

      case Deletion: {
        commitDeletion(root, nextEffect, renderPriorityLevel);
        break;
      }
    } // TODO: Only record a mutation effect if primaryEffectTag is non-zero.

    recordEffect();
    resetCurrentFiber();
    nextEffect = nextEffect.nextEffect;
  }
}

function commitLayoutEffects(root, committedExpirationTime) {
  // TODO: Should probably move the bulk of this function to commitWork.
  while (nextEffect !== null) {
    setCurrentFiber(nextEffect);
    var effectTag = nextEffect.effectTag;

    if (effectTag & (Update | Callback)) {
      recordEffect();
      var current$$1 = nextEffect.alternate;
      commitLifeCycles(root, current$$1, nextEffect, committedExpirationTime);
    }

    if (effectTag & Ref) {
      recordEffect();
      commitAttachRef(nextEffect);
    }

    resetCurrentFiber();
    nextEffect = nextEffect.nextEffect;
  }
}

function flushPassiveEffects() {
  if (pendingPassiveEffectsRenderPriority !== NoPriority) {
    var priorityLevel =
      pendingPassiveEffectsRenderPriority > NormalPriority
        ? NormalPriority
        : pendingPassiveEffectsRenderPriority;
    pendingPassiveEffectsRenderPriority = NoPriority;
    return runWithPriority$1(priorityLevel, flushPassiveEffectsImpl);
  }
}

function flushPassiveEffectsImpl() {
  if (rootWithPendingPassiveEffects === null) {
    return false;
  }

  var root = rootWithPendingPassiveEffects;
  var expirationTime = pendingPassiveEffectsExpirationTime;
  rootWithPendingPassiveEffects = null;
  pendingPassiveEffectsExpirationTime = NoWork;

  if (!((executionContext & (RenderContext | CommitContext)) === NoContext)) {
    throw Error("Cannot flush passive effects while already rendering.");
  }

  var prevExecutionContext = executionContext;
  executionContext |= CommitContext;
  var prevInteractions = pushInteractions(root); // Note: This currently assumes there are no passive effects on the root
  // fiber, because the root is not part of its own effect list. This could
  // change in the future.

  var effect = root.current.firstEffect;

  while (effect !== null) {
    {
      setCurrentFiber(effect);
      invokeGuardedCallback(null, commitPassiveHookEffects, null, effect);

      if (hasCaughtError()) {
        if (!(effect !== null)) {
          throw Error("Should be working on an effect.");
        }

        var error = clearCaughtError();
        captureCommitPhaseError(effect, error);
      }

      resetCurrentFiber();
    }

    var nextNextEffect = effect.nextEffect; // Remove nextEffect pointer to assist GC

    effect.nextEffect = null;
    effect = nextNextEffect;
  }

  if (enableSchedulerTracing) {
    popInteractions(prevInteractions);
    finishPendingInteractions(root, expirationTime);
  }

  executionContext = prevExecutionContext;
  flushSyncCallbackQueue(); // If additional passive effects were scheduled, increment a counter. If this
  // exceeds the limit, we'll fire a warning.

  nestedPassiveUpdateCount =
    rootWithPendingPassiveEffects === null ? 0 : nestedPassiveUpdateCount + 1;
  return true;
}

function isAlreadyFailedLegacyErrorBoundary(instance) {
  return (
    legacyErrorBoundariesThatAlreadyFailed !== null &&
    legacyErrorBoundariesThatAlreadyFailed.has(instance)
  );
}
function markLegacyErrorBoundaryAsFailed(instance) {
  if (legacyErrorBoundariesThatAlreadyFailed === null) {
    legacyErrorBoundariesThatAlreadyFailed = new Set([instance]);
  } else {
    legacyErrorBoundariesThatAlreadyFailed.add(instance);
  }
}

function prepareToThrowUncaughtError(error) {
  if (!hasUncaughtError) {
    hasUncaughtError = true;
    firstUncaughtError = error;
  }
}

var onUncaughtError = prepareToThrowUncaughtError;

function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
  var errorInfo = createCapturedValue(error, sourceFiber);
  var update = createRootErrorUpdate(rootFiber, errorInfo, Sync);
  enqueueUpdate(rootFiber, update);
  var root = markUpdateTimeFromFiberToRoot(rootFiber, Sync);

  if (root !== null) {
    ensureRootIsScheduled(root);
    schedulePendingInteractions(root, Sync);
  }
}

function captureCommitPhaseError(sourceFiber, error) {
  if (sourceFiber.tag === HostRoot) {
    // Error was thrown at the root. There is no parent, so the root
    // itself should capture it.
    captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
    return;
  }

  var fiber = sourceFiber.return;

  while (fiber !== null) {
    if (fiber.tag === HostRoot) {
      captureCommitPhaseErrorOnRoot(fiber, sourceFiber, error);
      return;
    } else if (fiber.tag === ClassComponent) {
      var ctor = fiber.type;
      var instance = fiber.stateNode;

      if (
        typeof ctor.getDerivedStateFromError === "function" ||
        (typeof instance.componentDidCatch === "function" &&
          !isAlreadyFailedLegacyErrorBoundary(instance))
      ) {
        var errorInfo = createCapturedValue(error, sourceFiber);
        var update = createClassErrorUpdate(
          fiber,
          errorInfo, // TODO: This is always sync
          Sync
        );
        enqueueUpdate(fiber, update);
        var root = markUpdateTimeFromFiberToRoot(fiber, Sync);

        if (root !== null) {
          ensureRootIsScheduled(root);
          schedulePendingInteractions(root, Sync);
        }

        return;
      }
    }

    fiber = fiber.return;
  }
}
function pingSuspendedRoot(root, thenable, suspendedTime) {
  var pingCache = root.pingCache;

  if (pingCache !== null) {
    // The thenable resolved, so we no longer need to memoize, because it will
    // never be thrown again.
    pingCache.delete(thenable);
  }

  if (workInProgressRoot === root && renderExpirationTime === suspendedTime) {
    // Received a ping at the same priority level at which we're currently
    // rendering. We might want to restart this render. This should mirror
    // the logic of whether or not a root suspends once it completes.
    // TODO: If we're rendering sync either due to Sync, Batched or expired,
    // we should probably never restart.
    // If we're suspended with delay, we'll always suspend so we can always
    // restart. If we're suspended without any updates, it might be a retry.
    // If it's early in the retry we can restart. We can't know for sure
    // whether we'll eventually process an update during this render pass,
    // but it's somewhat unlikely that we get to a ping before that, since
    // getting to the root most update is usually very fast.
    if (
      workInProgressRootExitStatus === RootSuspendedWithDelay ||
      (workInProgressRootExitStatus === RootSuspended &&
        workInProgressRootLatestProcessedExpirationTime === Sync &&
        now() - globalMostRecentFallbackTime < FALLBACK_THROTTLE_MS)
    ) {
      // Restart from the root. Don't need to schedule a ping because
      // we're already working on this tree.
      prepareFreshStack(root, renderExpirationTime);
    } else {
      // Even though we can't restart right now, we might get an
      // opportunity later. So we mark this render as having a ping.
      workInProgressRootHasPendingPing = true;
    }

    return;
  }

  if (!isRootSuspendedAtTime(root, suspendedTime)) {
    // The root is no longer suspended at this time.
    return;
  }

  var lastPingedTime = root.lastPingedTime;

  if (lastPingedTime !== NoWork && lastPingedTime < suspendedTime) {
    // There's already a lower priority ping scheduled.
    return;
  } // Mark the time at which this ping was scheduled.

  root.lastPingedTime = suspendedTime;

  if (root.finishedExpirationTime === suspendedTime) {
    // If there's a pending fallback waiting to commit, throw it away.
    root.finishedExpirationTime = NoWork;
    root.finishedWork = null;
  }

  ensureRootIsScheduled(root);
  schedulePendingInteractions(root, suspendedTime);
}

function retryTimedOutBoundary(boundaryFiber, retryTime) {
  // The boundary fiber (a Suspense component or SuspenseList component)
  // previously was rendered in its fallback state. One of the promises that
  // suspended it has resolved, which means at least part of the tree was
  // likely unblocked. Try rendering again, at a new expiration time.
  if (retryTime === NoWork) {
    var suspenseConfig = null; // Retries don't carry over the already committed update.

    var currentTime = requestCurrentTimeForUpdate();
    retryTime = computeExpirationForFiber(
      currentTime,
      boundaryFiber,
      suspenseConfig
    );
  } // TODO: Special case idle priority?

  var root = markUpdateTimeFromFiberToRoot(boundaryFiber, retryTime);

  if (root !== null) {
    ensureRootIsScheduled(root);
    schedulePendingInteractions(root, retryTime);
  }
}

function retryDehydratedSuspenseBoundary(boundaryFiber) {
  var suspenseState = boundaryFiber.memoizedState;
  var retryTime = NoWork;

  if (suspenseState !== null) {
    retryTime = suspenseState.retryTime;
  }

  retryTimedOutBoundary(boundaryFiber, retryTime);
}
function resolveRetryThenable(boundaryFiber, thenable) {
  var retryTime = NoWork; // Default

  var retryCache;

  if (enableSuspenseServerRenderer) {
    switch (boundaryFiber.tag) {
      case SuspenseComponent:
        retryCache = boundaryFiber.stateNode;
        var suspenseState = boundaryFiber.memoizedState;

        if (suspenseState !== null) {
          retryTime = suspenseState.retryTime;
        }

        break;

      case SuspenseListComponent:
        retryCache = boundaryFiber.stateNode;
        break;

      default: {
        throw Error(
          "Pinged unknown suspense boundary type. This is probably a bug in React."
        );
      }
    }
  } else {
    retryCache = boundaryFiber.stateNode;
  }

  if (retryCache !== null) {
    // The thenable resolved, so we no longer need to memoize, because it will
    // never be thrown again.
    retryCache.delete(thenable);
  }

  retryTimedOutBoundary(boundaryFiber, retryTime);
} // Computes the next Just Noticeable Difference (JND) boundary.
// The theory is that a person can't tell the difference between small differences in time.
// Therefore, if we wait a bit longer than necessary that won't translate to a noticeable
// difference in the experience. However, waiting for longer might mean that we can avoid
// showing an intermediate loading state. The longer we have already waited, the harder it
// is to tell small differences in time. Therefore, the longer we've already waited,
// the longer we can wait additionally. At some point we have to give up though.
// We pick a train model where the next boundary commits at a consistent schedule.
// These particular numbers are vague estimates. We expect to adjust them based on research.

function jnd(timeElapsed) {
  return timeElapsed < 120
    ? 120
    : timeElapsed < 480
      ? 480
      : timeElapsed < 1080
        ? 1080
        : timeElapsed < 1920
          ? 1920
          : timeElapsed < 3000
            ? 3000
            : timeElapsed < 4320
              ? 4320
              : ceil(timeElapsed / 1960) * 1960;
}

function computeMsUntilSuspenseLoadingDelay(
  mostRecentEventTime,
  committedExpirationTime,
  suspenseConfig
) {
  var busyMinDurationMs = suspenseConfig.busyMinDurationMs | 0;

  if (busyMinDurationMs <= 0) {
    return 0;
  }

  var busyDelayMs = suspenseConfig.busyDelayMs | 0; // Compute the time until this render pass would expire.

  var currentTimeMs = now();
  var eventTimeMs = inferTimeFromExpirationTimeWithSuspenseConfig(
    mostRecentEventTime,
    suspenseConfig
  );
  var timeElapsed = currentTimeMs - eventTimeMs;

  if (timeElapsed <= busyDelayMs) {
    // If we haven't yet waited longer than the initial delay, we don't
    // have to wait any additional time.
    return 0;
  }

  var msUntilTimeout = busyDelayMs + busyMinDurationMs - timeElapsed; // This is the value that is passed to `setTimeout`.

  return msUntilTimeout;
}

function checkForNestedUpdates() {
  if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
    nestedUpdateCount = 0;
    rootWithNestedUpdates = null;

    {
      throw Error(
        "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops."
      );
    }
  }

  {
    if (nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT) {
      nestedPassiveUpdateCount = 0;
      warning$1(
        false,
        "Maximum update depth exceeded. This can happen when a component " +
          "calls setState inside useEffect, but useEffect either doesn't " +
          "have a dependency array, or one of the dependencies changes on " +
          "every render."
      );
    }
  }
}

function flushRenderPhaseStrictModeWarningsInDEV() {
  {
    ReactStrictModeWarnings.flushLegacyContextWarning();

    if (warnAboutDeprecatedLifecycles) {
      ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings();
    }
  }
}

function stopFinishedWorkLoopTimer() {
  var didCompleteRoot = true;
  stopWorkLoopTimer(interruptedBy, didCompleteRoot);
  interruptedBy = null;
}

function stopInterruptedWorkLoopTimer() {
  // TODO: Track which fiber caused the interruption.
  var didCompleteRoot = false;
  stopWorkLoopTimer(interruptedBy, didCompleteRoot);
  interruptedBy = null;
}

function checkForInterruption(fiberThatReceivedUpdate, updateExpirationTime) {
  if (
    enableUserTimingAPI &&
    workInProgressRoot !== null &&
    updateExpirationTime > renderExpirationTime
  ) {
    interruptedBy = fiberThatReceivedUpdate;
  }
}

var didWarnStateUpdateForUnmountedComponent = null;

function warnAboutUpdateOnUnmountedFiberInDEV(fiber) {
  {
    var tag = fiber.tag;

    if (
      tag !== HostRoot &&
      tag !== ClassComponent &&
      tag !== FunctionComponent &&
      tag !== ForwardRef &&
      tag !== MemoComponent &&
      tag !== SimpleMemoComponent
    ) {
      // Only warn for user-defined components, not internal ones like Suspense.
      return;
    } // We show the whole stack but dedupe on the top component's name because
    // the problematic code almost always lies inside that component.

    var componentName = getComponentName(fiber.type) || "ReactComponent";

    if (didWarnStateUpdateForUnmountedComponent !== null) {
      if (didWarnStateUpdateForUnmountedComponent.has(componentName)) {
        return;
      }

      didWarnStateUpdateForUnmountedComponent.add(componentName);
    } else {
      didWarnStateUpdateForUnmountedComponent = new Set([componentName]);
    }

    warningWithoutStack$1(
      false,
      "Can't perform a React state update on an unmounted component. This " +
        "is a no-op, but it indicates a memory leak in your application. To " +
        "fix, cancel all subscriptions and asynchronous tasks in %s.%s",
      tag === ClassComponent
        ? "the componentWillUnmount method"
        : "a useEffect cleanup function",
      getStackByFiberInDevAndProd(fiber)
    );
  }
}

var beginWork$$1;

if (true && replayFailedUnitOfWorkWithInvokeGuardedCallback) {
  var dummyFiber = null;

  beginWork$$1 = function(current$$1, unitOfWork, expirationTime) {
    // If a component throws an error, we replay it again in a synchronously
    // dispatched event, so that the debugger will treat it as an uncaught
    // error See ReactErrorUtils for more information.
    // Before entering the begin phase, copy the work-in-progress onto a dummy
    // fiber. If beginWork throws, we'll use this to reset the state.
    var originalWorkInProgressCopy = assignFiberPropertiesInDEV(
      dummyFiber,
      unitOfWork
    );

    try {
      return beginWork$1(current$$1, unitOfWork, expirationTime);
    } catch (originalError) {
      if (
        originalError !== null &&
        typeof originalError === "object" &&
        typeof originalError.then === "function"
      ) {
        // Don't replay promises. Treat everything else like an error.
        throw originalError;
      } // Keep this code in sync with handleError; any changes here must have
      // corresponding changes there.

      resetContextDependencies();
      resetHooks(); // Don't reset current debug fiber, since we're about to work on the
      // same fiber again.
      // Unwind the failed stack frame

      unwindInterruptedWork(unitOfWork); // Restore the original properties of the fiber.

      assignFiberPropertiesInDEV(unitOfWork, originalWorkInProgressCopy);

      if (enableProfilerTimer && unitOfWork.mode & ProfileMode) {
        // Reset the profiler timer.
        startProfilerTimer(unitOfWork);
      } // Run beginWork again.

      invokeGuardedCallback(
        null,
        beginWork$1,
        null,
        current$$1,
        unitOfWork,
        expirationTime
      );

      if (hasCaughtError()) {
        var replayError = clearCaughtError(); // `invokeGuardedCallback` sometimes sets an expando `_suppressLogging`.
        // Rethrow this error instead of the original one.

        throw replayError;
      } else {
        // This branch is reachable if the render phase is impure.
        throw originalError;
      }
    }
  };
} else {
  beginWork$$1 = beginWork$1;
}

var didWarnAboutUpdateInRender = false;
var didWarnAboutUpdateInGetChildContext = false;

function warnAboutInvalidUpdatesOnClassComponentsInDEV(fiber) {
  {
    if (fiber.tag === ClassComponent) {
      switch (phase) {
        case "getChildContext":
          if (didWarnAboutUpdateInGetChildContext) {
            return;
          }

          warningWithoutStack$1(
            false,
            "setState(...): Cannot call setState() inside getChildContext()"
          );
          didWarnAboutUpdateInGetChildContext = true;
          break;

        case "render":
          if (didWarnAboutUpdateInRender) {
            return;
          }

          warningWithoutStack$1(
            false,
            "Cannot update during an existing state transition (such as " +
              "within `render`). Render methods should be a pure function of " +
              "props and state."
          );
          didWarnAboutUpdateInRender = true;
          break;
      }
    }
  }
} // a 'shared' variable that changes when act() opens/closes in tests.

var IsThisRendererActing = {
  current: false
};
function warnIfNotScopedWithMatchingAct(fiber) {
  {
    if (
      warnsIfNotActing === true &&
      IsSomeRendererActing.current === true &&
      IsThisRendererActing.current !== true
    ) {
      warningWithoutStack$1(
        false,
        "It looks like you're using the wrong act() around your test interactions.\n" +
          "Be sure to use the matching version of act() corresponding to your renderer:\n\n" +
          "// for react-dom:\n" +
          "import {act} from 'react-dom/test-utils';\n" +
          "// ...\n" +
          "act(() => ...);\n\n" +
          "// for react-test-renderer:\n" +
          "import TestRenderer from 'react-test-renderer';\n" +
          "const {act} = TestRenderer;\n" +
          "// ...\n" +
          "act(() => ...);" +
          "%s",
        getStackByFiberInDevAndProd(fiber)
      );
    }
  }
}
function warnIfNotCurrentlyActingEffectsInDEV(fiber) {
  {
    if (
      warnsIfNotActing === true &&
      (fiber.mode & StrictMode) !== NoMode &&
      IsSomeRendererActing.current === false &&
      IsThisRendererActing.current === false
    ) {
      warningWithoutStack$1(
        false,
        "An update to %s ran an effect, but was not wrapped in act(...).\n\n" +
          "When testing, code that causes React state updates should be " +
          "wrapped into act(...):\n\n" +
          "act(() => {\n" +
          "  /* fire events that update state */\n" +
          "});\n" +
          "/* assert on the output */\n\n" +
          "This ensures that you're testing the behavior the user would see " +
          "in the browser." +
          " Learn more at https://fb.me/react-wrap-tests-with-act" +
          "%s",
        getComponentName(fiber.type),
        getStackByFiberInDevAndProd(fiber)
      );
    }
  }
}

function warnIfNotCurrentlyActingUpdatesInDEV(fiber) {
  {
    if (
      warnsIfNotActing === true &&
      executionContext === NoContext &&
      IsSomeRendererActing.current === false &&
      IsThisRendererActing.current === false
    ) {
      warningWithoutStack$1(
        false,
        "An update to %s inside a test was not wrapped in act(...).\n\n" +
          "When testing, code that causes React state updates should be " +
          "wrapped into act(...):\n\n" +
          "act(() => {\n" +
          "  /* fire events that update state */\n" +
          "});\n" +
          "/* assert on the output */\n\n" +
          "This ensures that you're testing the behavior the user would see " +
          "in the browser." +
          " Learn more at https://fb.me/react-wrap-tests-with-act" +
          "%s",
        getComponentName(fiber.type),
        getStackByFiberInDevAndProd(fiber)
      );
    }
  }
}

var warnIfNotCurrentlyActingUpdatesInDev = warnIfNotCurrentlyActingUpdatesInDEV; // In tests, we want to enforce a mocked scheduler.

var didWarnAboutUnmockedScheduler = false; // TODO Before we release concurrent mode, revisit this and decide whether a mocked
// scheduler is the actual recommendation. The alternative could be a testing build,
// a new lib, or whatever; we dunno just yet. This message is for early adopters
// to get their tests right.

function warnIfUnmockedScheduler(fiber) {
  {
    if (
      didWarnAboutUnmockedScheduler === false &&
      Scheduler.unstable_flushAllWithoutAsserting === undefined
    ) {
      if (fiber.mode & BlockingMode || fiber.mode & ConcurrentMode) {
        didWarnAboutUnmockedScheduler = true;
        warningWithoutStack$1(
          false,
          'In Concurrent or Sync modes, the "scheduler" module needs to be mocked ' +
            "to guarantee consistent behaviour across tests and browsers. " +
            "For example, with jest: \n" +
            "jest.mock('scheduler', () => require('scheduler/unstable_mock'));\n\n" +
            "For more info, visit https://fb.me/react-mock-scheduler"
        );
      } else if (warnAboutUnmockedScheduler === true) {
        didWarnAboutUnmockedScheduler = true;
        warningWithoutStack$1(
          false,
          'Starting from React v17, the "scheduler" module will need to be mocked ' +
            "to guarantee consistent behaviour across tests and browsers. " +
            "For example, with jest: \n" +
            "jest.mock('scheduler', () => require('scheduler/unstable_mock'));\n\n" +
            "For more info, visit https://fb.me/react-mock-scheduler"
        );
      }
    }
  }
}
var componentsThatTriggeredHighPriSuspend = null;
function checkForWrongSuspensePriorityInDEV(sourceFiber) {
  {
    var currentPriorityLevel = getCurrentPriorityLevel();

    if (
      (sourceFiber.mode & ConcurrentMode) !== NoEffect &&
      (currentPriorityLevel === UserBlockingPriority$1 ||
        currentPriorityLevel === ImmediatePriority)
    ) {
      var workInProgressNode = sourceFiber;

      while (workInProgressNode !== null) {
        // Add the component that triggered the suspense
        var current$$1 = workInProgressNode.alternate;

        if (current$$1 !== null) {
          // TODO: warn component that triggers the high priority
          // suspend is the HostRoot
          switch (workInProgressNode.tag) {
            case ClassComponent:
              // Loop through the component's update queue and see whether the component
              // has triggered any high priority updates
              var updateQueue = current$$1.updateQueue;

              if (updateQueue !== null) {
                var update = updateQueue.firstUpdate;

                while (update !== null) {
                  var priorityLevel = update.priority;

                  if (
                    priorityLevel === UserBlockingPriority$1 ||
                    priorityLevel === ImmediatePriority
                  ) {
                    if (componentsThatTriggeredHighPriSuspend === null) {
                      componentsThatTriggeredHighPriSuspend = new Set([
                        getComponentName(workInProgressNode.type)
                      ]);
                    } else {
                      componentsThatTriggeredHighPriSuspend.add(
                        getComponentName(workInProgressNode.type)
                      );
                    }

                    break;
                  }

                  update = update.next;
                }
              }

              break;

            case FunctionComponent:
            case ForwardRef:
            case SimpleMemoComponent:
              if (
                workInProgressNode.memoizedState !== null &&
                workInProgressNode.memoizedState.baseUpdate !== null
              ) {
                var _update = workInProgressNode.memoizedState.baseUpdate; // Loop through the functional component's memoized state to see whether
                // the component has triggered any high pri updates

                while (_update !== null) {
                  var priority = _update.priority;

                  if (
                    priority === UserBlockingPriority$1 ||
                    priority === ImmediatePriority
                  ) {
                    if (componentsThatTriggeredHighPriSuspend === null) {
                      componentsThatTriggeredHighPriSuspend = new Set([
                        getComponentName(workInProgressNode.type)
                      ]);
                    } else {
                      componentsThatTriggeredHighPriSuspend.add(
                        getComponentName(workInProgressNode.type)
                      );
                    }

                    break;
                  }

                  if (
                    _update.next === workInProgressNode.memoizedState.baseUpdate
                  ) {
                    break;
                  }

                  _update = _update.next;
                }
              }

              break;

            default:
              break;
          }
        }

        workInProgressNode = workInProgressNode.return;
      }
    }
  }
}

function flushSuspensePriorityWarningInDEV() {
  {
    if (componentsThatTriggeredHighPriSuspend !== null) {
      var componentNames = [];
      componentsThatTriggeredHighPriSuspend.forEach(function(name) {
        return componentNames.push(name);
      });
      componentsThatTriggeredHighPriSuspend = null;

      if (componentNames.length > 0) {
        warningWithoutStack$1(
          false,
          "%s triggered a user-blocking update that suspended." +
            "\n\n" +
            "The fix is to split the update into multiple parts: a user-blocking " +
            "update to provide immediate feedback, and another update that " +
            "triggers the bulk of the changes." +
            "\n\n" +
            "Refer to the documentation for useTransition to learn how " +
            "to implement this pattern.", // TODO: Add link to React docs with more information, once it exists
          componentNames.sort().join(", ")
        );
      }
    }
  }
}

function computeThreadID(root, expirationTime) {
  // Interaction threads are unique per root and expiration time.
  return expirationTime * 1000 + root.interactionThreadID;
}

function markSpawnedWork(expirationTime) {
  if (!enableSchedulerTracing) {
    return;
  }

  if (spawnedWorkDuringRender === null) {
    spawnedWorkDuringRender = [expirationTime];
  } else {
    spawnedWorkDuringRender.push(expirationTime);
  }
}

function scheduleInteractions(root, expirationTime, interactions) {
  if (!enableSchedulerTracing) {
    return;
  }

  if (interactions.size > 0) {
    var pendingInteractionMap = root.pendingInteractionMap;
    var pendingInteractions = pendingInteractionMap.get(expirationTime);

    if (pendingInteractions != null) {
      interactions.forEach(function(interaction) {
        if (!pendingInteractions.has(interaction)) {
          // Update the pending async work count for previously unscheduled interaction.
          interaction.__count++;
        }

        pendingInteractions.add(interaction);
      });
    } else {
      pendingInteractionMap.set(expirationTime, new Set(interactions)); // Update the pending async work count for the current interactions.

      interactions.forEach(function(interaction) {
        interaction.__count++;
      });
    }

    var subscriber = tracing.__subscriberRef.current;

    if (subscriber !== null) {
      var threadID = computeThreadID(root, expirationTime);
      subscriber.onWorkScheduled(interactions, threadID);
    }
  }
}

function schedulePendingInteractions(root, expirationTime) {
  // This is called when work is scheduled on a root.
  // It associates the current interactions with the newly-scheduled expiration.
  // They will be restored when that expiration is later committed.
  if (!enableSchedulerTracing) {
    return;
  }

  scheduleInteractions(root, expirationTime, tracing.__interactionsRef.current);
}

function startWorkOnPendingInteractions(root, expirationTime) {
  // This is called when new work is started on a root.
  if (!enableSchedulerTracing) {
    return;
  } // Determine which interactions this batch of work currently includes, So that
  // we can accurately attribute time spent working on it, And so that cascading
  // work triggered during the render phase will be associated with it.

  var interactions = new Set();
  root.pendingInteractionMap.forEach(function(
    scheduledInteractions,
    scheduledExpirationTime
  ) {
    if (scheduledExpirationTime >= expirationTime) {
      scheduledInteractions.forEach(function(interaction) {
        return interactions.add(interaction);
      });
    }
  }); // Store the current set of interactions on the FiberRoot for a few reasons:
  // We can re-use it in hot functions like performConcurrentWorkOnRoot()
  // without having to recalculate it. We will also use it in commitWork() to
  // pass to any Profiler onRender() hooks. This also provides DevTools with a
  // way to access it when the onCommitRoot() hook is called.

  root.memoizedInteractions = interactions;

  if (interactions.size > 0) {
    var subscriber = tracing.__subscriberRef.current;

    if (subscriber !== null) {
      var threadID = computeThreadID(root, expirationTime);

      try {
        subscriber.onWorkStarted(interactions, threadID);
      } catch (error) {
        // If the subscriber throws, rethrow it in a separate task
        scheduleCallback(ImmediatePriority, function() {
          throw error;
        });
      }
    }
  }
}

function finishPendingInteractions(root, committedExpirationTime) {
  if (!enableSchedulerTracing) {
    return;
  }

  var earliestRemainingTimeAfterCommit = root.firstPendingTime;
  var subscriber;

  try {
    subscriber = tracing.__subscriberRef.current;

    if (subscriber !== null && root.memoizedInteractions.size > 0) {
      var threadID = computeThreadID(root, committedExpirationTime);
      subscriber.onWorkStopped(root.memoizedInteractions, threadID);
    }
  } catch (error) {
    // If the subscriber throws, rethrow it in a separate task
    scheduleCallback(ImmediatePriority, function() {
      throw error;
    });
  } finally {
    // Clear completed interactions from the pending Map.
    // Unless the render was suspended or cascading work was scheduled,
    // In which case– leave pending interactions until the subsequent render.
    var pendingInteractionMap = root.pendingInteractionMap;
    pendingInteractionMap.forEach(function(
      scheduledInteractions,
      scheduledExpirationTime
    ) {
      // Only decrement the pending interaction count if we're done.
      // If there's still work at the current priority,
      // That indicates that we are waiting for suspense data.
      if (scheduledExpirationTime > earliestRemainingTimeAfterCommit) {
        pendingInteractionMap.delete(scheduledExpirationTime);
        scheduledInteractions.forEach(function(interaction) {
          interaction.__count--;

          if (subscriber !== null && interaction.__count === 0) {
            try {
              subscriber.onInteractionScheduledWorkCompleted(interaction);
            } catch (error) {
              // If the subscriber throws, rethrow it in a separate task
              scheduleCallback(ImmediatePriority, function() {
                throw error;
              });
            }
          }
        });
      }
    });
  }
}

var onCommitFiberRoot = null;
var onCommitFiberUnmount = null;
var hasLoggedError = false;
var isDevToolsPresent = typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined";
function injectInternals(internals) {
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined") {
    // No DevTools
    return false;
  }

  var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (hook.isDisabled) {
    // This isn't a real property on the hook, but it can be set to opt out
    // of DevTools integration and associated warnings and logs.
    // https://github.com/facebook/react/issues/3877
    return true;
  }

  if (!hook.supportsFiber) {
    {
      warningWithoutStack$1(
        false,
        "The installed version of React DevTools is too old and will not work " +
          "with the current version of React. Please update React DevTools. " +
          "https://fb.me/react-devtools"
      );
    } // DevTools exists, even though it doesn't support Fiber.

    return true;
  }

  try {
    var rendererID = hook.inject(internals); // We have successfully injected, so now it is safe to set up hooks.

    onCommitFiberRoot = function(root, expirationTime) {
      try {
        var didError = (root.current.effectTag & DidCapture) === DidCapture;

        if (enableProfilerTimer) {
          var currentTime = getCurrentTime();
          var priorityLevel = inferPriorityFromExpirationTime(
            currentTime,
            expirationTime
          );
          hook.onCommitFiberRoot(rendererID, root, priorityLevel, didError);
        } else {
          hook.onCommitFiberRoot(rendererID, root, undefined, didError);
        }
      } catch (err) {
        if (true && !hasLoggedError) {
          hasLoggedError = true;
          warningWithoutStack$1(
            false,
            "React DevTools encountered an error: %s",
            err
          );
        }
      }
    };

    onCommitFiberUnmount = function(fiber) {
      try {
        hook.onCommitFiberUnmount(rendererID, fiber);
      } catch (err) {
        if (true && !hasLoggedError) {
          hasLoggedError = true;
          warningWithoutStack$1(
            false,
            "React DevTools encountered an error: %s",
            err
          );
        }
      }
    };
  } catch (err) {
    // Catch all errors because it is unsafe to throw during initialization.
    {
      warningWithoutStack$1(
        false,
        "React DevTools encountered an error: %s.",
        err
      );
    }
  } // DevTools exists

  return true;
}
function onCommitRoot(root, expirationTime) {
  if (typeof onCommitFiberRoot === "function") {
    onCommitFiberRoot(root, expirationTime);
  }
}
function onCommitUnmount(fiber) {
  if (typeof onCommitFiberUnmount === "function") {
    onCommitFiberUnmount(fiber);
  }
}

var hasBadMapPolyfill;

{
  hasBadMapPolyfill = false;

  try {
    var nonExtensibleObject = Object.preventExtensions({});
    var testMap = new Map([[nonExtensibleObject, null]]);
    var testSet = new Set([nonExtensibleObject]); // This is necessary for Rollup to not consider these unused.
    // https://github.com/rollup/rollup/issues/1771
    // TODO: we can remove these if Rollup fixes the bug.

    testMap.set(0, 0);
    testSet.add(0);
  } catch (e) {
    // TODO: Consider warning about bad polyfills
    hasBadMapPolyfill = true;
  }
}

var debugCounter = 1;

function FiberNode(tag, pendingProps, key, mode) {
  // Instance
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  this.type = null;
  this.stateNode = null; // Fiber

  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;
  this.ref = null;
  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;
  this.dependencies = null;
  this.mode = mode; // Effects

  this.effectTag = NoEffect;
  this.nextEffect = null;
  this.firstEffect = null;
  this.lastEffect = null;
  this.expirationTime = NoWork;
  this.childExpirationTime = NoWork;
  this.alternate = null;

  if (enableProfilerTimer) {
    // Note: The following is done to avoid a v8 performance cliff.
    //
    // Initializing the fields below to smis and later updating them with
    // double values will cause Fibers to end up having separate shapes.
    // This behavior/bug has something to do with Object.preventExtension().
    // Fortunately this only impacts DEV builds.
    // Unfortunately it makes React unusably slow for some applications.
    // To work around this, initialize the fields below with doubles.
    //
    // Learn more about this here:
    // https://github.com/facebook/react/issues/14365
    // https://bugs.chromium.org/p/v8/issues/detail?id=8538
    this.actualDuration = Number.NaN;
    this.actualStartTime = Number.NaN;
    this.selfBaseDuration = Number.NaN;
    this.treeBaseDuration = Number.NaN; // It's okay to replace the initial doubles with smis after initialization.
    // This won't trigger the performance cliff mentioned above,
    // and it simplifies other profiler code (including DevTools).

    this.actualDuration = 0;
    this.actualStartTime = -1;
    this.selfBaseDuration = 0;
    this.treeBaseDuration = 0;
  } // This is normally DEV-only except www when it adds listeners.
  // TODO: remove the User Timing integration in favor of Root Events.

  if (enableUserTimingAPI) {
    this._debugID = debugCounter++;
    this._debugIsCurrentlyTiming = false;
  }

  {
    this._debugSource = null;
    this._debugOwner = null;
    this._debugNeedsRemount = false;
    this._debugHookTypes = null;

    if (!hasBadMapPolyfill && typeof Object.preventExtensions === "function") {
      Object.preventExtensions(this);
    }
  }
} // This is a constructor function, rather than a POJO constructor, still
// please ensure we do the following:
// 1) Nobody should add any instance methods on this. Instance methods can be
//    more difficult to predict when they get optimized and they are almost
//    never inlined properly in static compilers.
// 2) Nobody should rely on `instanceof Fiber` for type testing. We should
//    always know when it is a fiber.
// 3) We might want to experiment with using numeric keys since they are easier
//    to optimize in a non-JIT environment.
// 4) We can easily go from a constructor to a createFiber object literal if that
//    is faster.
// 5) It should be easy to port this to a C struct and keep a C implementation
//    compatible.

var createFiber = function(tag, pendingProps, key, mode) {
  // $FlowFixMe: the shapes are exact here but Flow doesn't like constructors
  return new FiberNode(tag, pendingProps, key, mode);
};

function shouldConstruct(Component) {
  var prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

function isSimpleFunctionComponent(type) {
  return (
    typeof type === "function" &&
    !shouldConstruct(type) &&
    type.defaultProps === undefined
  );
}
function resolveLazyComponentTag(Component) {
  if (typeof Component === "function") {
    return shouldConstruct(Component) ? ClassComponent : FunctionComponent;
  } else if (Component !== undefined && Component !== null) {
    var $$typeof = Component.$$typeof;

    if ($$typeof === REACT_FORWARD_REF_TYPE) {
      return ForwardRef;
    }

    if ($$typeof === REACT_MEMO_TYPE) {
      return MemoComponent;
    }
  }

  return IndeterminateComponent;
} // This is used to create an alternate fiber to do work on.

function createWorkInProgress(current, pendingProps, expirationTime) {
  var workInProgress = current.alternate;

  if (workInProgress === null) {
    // We use a double buffering pooling technique because we know that we'll
    // only ever need at most two versions of a tree. We pool the "other" unused
    // node that we're free to reuse. This is lazily created to avoid allocating
    // extra objects for things that are never updated. It also allow us to
    // reclaim the extra memory if needed.
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode
    );
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    {
      // DEV-only fields
      workInProgress._debugID = current._debugID;
      workInProgress._debugSource = current._debugSource;
      workInProgress._debugOwner = current._debugOwner;
      workInProgress._debugHookTypes = current._debugHookTypes;
    }

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps; // We already have an alternate.
    // Reset the effect tag.

    workInProgress.effectTag = NoEffect; // The effect list is no longer valid.

    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;

    if (enableProfilerTimer) {
      // We intentionally reset, rather than copy, actualDuration & actualStartTime.
      // This prevents time from endlessly accumulating in new commits.
      // This has the downside of resetting values for different priority renders,
      // But works for yielding (the common case) and should support resuming.
      workInProgress.actualDuration = 0;
      workInProgress.actualStartTime = -1;
    }
  }

  workInProgress.childExpirationTime = current.childExpirationTime;
  workInProgress.expirationTime = current.expirationTime;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue; // Clone the dependencies object. This is mutated during the render phase, so
  // it cannot be shared with the current fiber.

  var currentDependencies = current.dependencies;
  workInProgress.dependencies =
    currentDependencies === null
      ? null
      : {
          expirationTime: currentDependencies.expirationTime,
          firstContext: currentDependencies.firstContext,
          responders: currentDependencies.responders
        }; // These will be overridden during the parent's reconciliation

  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;

  if (enableProfilerTimer) {
    workInProgress.selfBaseDuration = current.selfBaseDuration;
    workInProgress.treeBaseDuration = current.treeBaseDuration;
  }

  {
    workInProgress._debugNeedsRemount = current._debugNeedsRemount;

    switch (workInProgress.tag) {
      case IndeterminateComponent:
      case FunctionComponent:
      case SimpleMemoComponent:
        workInProgress.type = resolveFunctionForHotReloading(current.type);
        break;

      case ClassComponent:
        workInProgress.type = resolveClassForHotReloading(current.type);
        break;

      case ForwardRef:
        workInProgress.type = resolveForwardRefForHotReloading(current.type);
        break;

      default:
        break;
    }
  }

  return workInProgress;
} // Used to reuse a Fiber for a second pass.

function resetWorkInProgress(workInProgress, renderExpirationTime) {
  // This resets the Fiber to what createFiber or createWorkInProgress would
  // have set the values to before during the first pass. Ideally this wouldn't
  // be necessary but unfortunately many code paths reads from the workInProgress
  // when they should be reading from current and writing to workInProgress.
  // We assume pendingProps, index, key, ref, return are still untouched to
  // avoid doing another reconciliation.
  // Reset the effect tag but keep any Placement tags, since that's something
  // that child fiber is setting, not the reconciliation.
  workInProgress.effectTag &= Placement; // The effect list is no longer valid.

  workInProgress.nextEffect = null;
  workInProgress.firstEffect = null;
  workInProgress.lastEffect = null;
  var current = workInProgress.alternate;

  if (current === null) {
    // Reset to createFiber's initial values.
    workInProgress.childExpirationTime = NoWork;
    workInProgress.expirationTime = renderExpirationTime;
    workInProgress.child = null;
    workInProgress.memoizedProps = null;
    workInProgress.memoizedState = null;
    workInProgress.updateQueue = null;
    workInProgress.dependencies = null;

    if (enableProfilerTimer) {
      // Note: We don't reset the actualTime counts. It's useful to accumulate
      // actual time across multiple render passes.
      workInProgress.selfBaseDuration = 0;
      workInProgress.treeBaseDuration = 0;
    }
  } else {
    // Reset to the cloned values that createWorkInProgress would've.
    workInProgress.childExpirationTime = current.childExpirationTime;
    workInProgress.expirationTime = current.expirationTime;
    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue; // Clone the dependencies object. This is mutated during the render phase, so
    // it cannot be shared with the current fiber.

    var currentDependencies = current.dependencies;
    workInProgress.dependencies =
      currentDependencies === null
        ? null
        : {
            expirationTime: currentDependencies.expirationTime,
            firstContext: currentDependencies.firstContext,
            responders: currentDependencies.responders
          };

    if (enableProfilerTimer) {
      // Note: We don't reset the actualTime counts. It's useful to accumulate
      // actual time across multiple render passes.
      workInProgress.selfBaseDuration = current.selfBaseDuration;
      workInProgress.treeBaseDuration = current.treeBaseDuration;
    }
  }

  return workInProgress;
}
function createHostRootFiber(tag) {
  var mode;

  if (tag === ConcurrentRoot) {
    mode = ConcurrentMode | BlockingMode | StrictMode;
  } else if (tag === BlockingRoot) {
    mode = BlockingMode | StrictMode;
  } else {
    mode = NoMode;
  }

  if (enableProfilerTimer && isDevToolsPresent) {
    // Always collect profile timings when DevTools are present.
    // This enables DevTools to start capturing timing at any point–
    // Without some nodes in the tree having empty base times.
    mode |= ProfileMode;
  }

  return createFiber(HostRoot, null, null, mode);
}
function createFiberFromTypeAndProps(
  type, // React$ElementType
  key,
  pendingProps,
  owner,
  mode,
  expirationTime
) {
  var fiber;
  var fiberTag = IndeterminateComponent; // The resolved type is set if we know what the final type will be. I.e. it's not lazy.

  var resolvedType = type;

  if (typeof type === "function") {
    if (shouldConstruct(type)) {
      fiberTag = ClassComponent;

      {
        resolvedType = resolveClassForHotReloading(resolvedType);
      }
    } else {
      {
        resolvedType = resolveFunctionForHotReloading(resolvedType);
      }
    }
  } else if (typeof type === "string") {
    fiberTag = HostComponent;
  } else {
    getTag: switch (type) {
      case REACT_FRAGMENT_TYPE:
        return createFiberFromFragment(
          pendingProps.children,
          mode,
          expirationTime,
          key
        );

      case REACT_CONCURRENT_MODE_TYPE:
        fiberTag = Mode;
        mode |= ConcurrentMode | BlockingMode | StrictMode;
        break;

      case REACT_STRICT_MODE_TYPE:
        fiberTag = Mode;
        mode |= StrictMode;
        break;

      case REACT_PROFILER_TYPE:
        return createFiberFromProfiler(pendingProps, mode, expirationTime, key);

      case REACT_SUSPENSE_TYPE:
        return createFiberFromSuspense(pendingProps, mode, expirationTime, key);

      case REACT_SUSPENSE_LIST_TYPE:
        return createFiberFromSuspenseList(
          pendingProps,
          mode,
          expirationTime,
          key
        );

      default: {
        if (typeof type === "object" && type !== null) {
          switch (type.$$typeof) {
            case REACT_PROVIDER_TYPE:
              fiberTag = ContextProvider;
              break getTag;

            case REACT_CONTEXT_TYPE:
              // This is a consumer
              fiberTag = ContextConsumer;
              break getTag;

            case REACT_FORWARD_REF_TYPE:
              fiberTag = ForwardRef;

              {
                resolvedType = resolveForwardRefForHotReloading(resolvedType);
              }

              break getTag;

            case REACT_MEMO_TYPE:
              fiberTag = MemoComponent;
              break getTag;

            case REACT_LAZY_TYPE:
              fiberTag = LazyComponent;
              resolvedType = null;
              break getTag;

            case REACT_FUNDAMENTAL_TYPE:
              if (enableFundamentalAPI) {
                return createFiberFromFundamental(
                  type,
                  pendingProps,
                  mode,
                  expirationTime,
                  key
                );
              }

              break;

            case REACT_SCOPE_TYPE:
              if (enableScopeAPI) {
                return createFiberFromScope(
                  type,
                  pendingProps,
                  mode,
                  expirationTime,
                  key
                );
              }
          }
        }

        var info = "";

        {
          if (
            type === undefined ||
            (typeof type === "object" &&
              type !== null &&
              Object.keys(type).length === 0)
          ) {
            info +=
              " You likely forgot to export your component from the file " +
              "it's defined in, or you might have mixed up default and " +
              "named imports.";
          }

          var ownerName = owner ? getComponentName(owner.type) : null;

          if (ownerName) {
            info += "\n\nCheck the render method of `" + ownerName + "`.";
          }
        }

        {
          throw Error(
            "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " +
              (type == null ? type : typeof type) +
              "." +
              info
          );
        }
      }
    }
  }

  fiber = createFiber(fiberTag, pendingProps, key, mode);
  fiber.elementType = type;
  fiber.type = resolvedType;
  fiber.expirationTime = expirationTime;
  return fiber;
}
function createFiberFromElement(element, mode, expirationTime) {
  var owner = null;

  {
    owner = element._owner;
  }

  var type = element.type;
  var key = element.key;
  var pendingProps = element.props;
  var fiber = createFiberFromTypeAndProps(
    type,
    key,
    pendingProps,
    owner,
    mode,
    expirationTime
  );

  {
    fiber._debugSource = element._source;
    fiber._debugOwner = element._owner;
  }

  return fiber;
}
function createFiberFromFragment(elements, mode, expirationTime, key) {
  var fiber = createFiber(Fragment, elements, key, mode);
  fiber.expirationTime = expirationTime;
  return fiber;
}
function createFiberFromFundamental(
  fundamentalComponent,
  pendingProps,
  mode,
  expirationTime,
  key
) {
  var fiber = createFiber(FundamentalComponent, pendingProps, key, mode);
  fiber.elementType = fundamentalComponent;
  fiber.type = fundamentalComponent;
  fiber.expirationTime = expirationTime;
  return fiber;
}

function createFiberFromScope(scope, pendingProps, mode, expirationTime, key) {
  var fiber = createFiber(ScopeComponent, pendingProps, key, mode);
  fiber.type = scope;
  fiber.elementType = scope;
  fiber.expirationTime = expirationTime;
  return fiber;
}

function createFiberFromProfiler(pendingProps, mode, expirationTime, key) {
  {
    if (
      typeof pendingProps.id !== "string" ||
      typeof pendingProps.onRender !== "function"
    ) {
      warningWithoutStack$1(
        false,
        'Profiler must specify an "id" string and "onRender" function as props'
      );
    }
  }

  var fiber = createFiber(Profiler, pendingProps, key, mode | ProfileMode); // TODO: The Profiler fiber shouldn't have a type. It has a tag.

  fiber.elementType = REACT_PROFILER_TYPE;
  fiber.type = REACT_PROFILER_TYPE;
  fiber.expirationTime = expirationTime;
  return fiber;
}

function createFiberFromSuspense(pendingProps, mode, expirationTime, key) {
  var fiber = createFiber(SuspenseComponent, pendingProps, key, mode); // TODO: The SuspenseComponent fiber shouldn't have a type. It has a tag.
  // This needs to be fixed in getComponentName so that it relies on the tag
  // instead.

  fiber.type = REACT_SUSPENSE_TYPE;
  fiber.elementType = REACT_SUSPENSE_TYPE;
  fiber.expirationTime = expirationTime;
  return fiber;
}
function createFiberFromSuspenseList(pendingProps, mode, expirationTime, key) {
  var fiber = createFiber(SuspenseListComponent, pendingProps, key, mode);

  {
    // TODO: The SuspenseListComponent fiber shouldn't have a type. It has a tag.
    // This needs to be fixed in getComponentName so that it relies on the tag
    // instead.
    fiber.type = REACT_SUSPENSE_LIST_TYPE;
  }

  fiber.elementType = REACT_SUSPENSE_LIST_TYPE;
  fiber.expirationTime = expirationTime;
  return fiber;
}
function createFiberFromText(content, mode, expirationTime) {
  var fiber = createFiber(HostText, content, null, mode);
  fiber.expirationTime = expirationTime;
  return fiber;
}
function createFiberFromHostInstanceForDeletion() {
  var fiber = createFiber(HostComponent, null, null, NoMode); // TODO: These should not need a type.

  fiber.elementType = "DELETED";
  fiber.type = "DELETED";
  return fiber;
}
function createFiberFromDehydratedFragment(dehydratedNode) {
  var fiber = createFiber(DehydratedFragment, null, null, NoMode);
  fiber.stateNode = dehydratedNode;
  return fiber;
}
function createFiberFromPortal(portal, mode, expirationTime) {
  var pendingProps = portal.children !== null ? portal.children : [];
  var fiber = createFiber(HostPortal, pendingProps, portal.key, mode);
  fiber.expirationTime = expirationTime;
  fiber.stateNode = {
    containerInfo: portal.containerInfo,
    pendingChildren: null,
    // Used by persistent updates
    implementation: portal.implementation
  };
  return fiber;
} // Used for stashing WIP properties to replay failed work in DEV.

function assignFiberPropertiesInDEV(target, source) {
  if (target === null) {
    // This Fiber's initial properties will always be overwritten.
    // We only use a Fiber to ensure the same hidden class so DEV isn't slow.
    target = createFiber(IndeterminateComponent, null, null, NoMode);
  } // This is intentionally written as a list of all properties.
  // We tried to use Object.assign() instead but this is called in
  // the hottest path, and Object.assign() was too slow:
  // https://github.com/facebook/react/issues/12502
  // This code is DEV-only so size is not a concern.

  target.tag = source.tag;
  target.key = source.key;
  target.elementType = source.elementType;
  target.type = source.type;
  target.stateNode = source.stateNode;
  target.return = source.return;
  target.child = source.child;
  target.sibling = source.sibling;
  target.index = source.index;
  target.ref = source.ref;
  target.pendingProps = source.pendingProps;
  target.memoizedProps = source.memoizedProps;
  target.updateQueue = source.updateQueue;
  target.memoizedState = source.memoizedState;
  target.dependencies = source.dependencies;
  target.mode = source.mode;
  target.effectTag = source.effectTag;
  target.nextEffect = source.nextEffect;
  target.firstEffect = source.firstEffect;
  target.lastEffect = source.lastEffect;
  target.expirationTime = source.expirationTime;
  target.childExpirationTime = source.childExpirationTime;
  target.alternate = source.alternate;

  if (enableProfilerTimer) {
    target.actualDuration = source.actualDuration;
    target.actualStartTime = source.actualStartTime;
    target.selfBaseDuration = source.selfBaseDuration;
    target.treeBaseDuration = source.treeBaseDuration;
  }

  target._debugID = source._debugID;
  target._debugSource = source._debugSource;
  target._debugOwner = source._debugOwner;
  target._debugIsCurrentlyTiming = source._debugIsCurrentlyTiming;
  target._debugNeedsRemount = source._debugNeedsRemount;
  target._debugHookTypes = source._debugHookTypes;
  return target;
}

function FiberRootNode(containerInfo, tag, hydrate) {
  this.tag = tag;
  this.current = null;
  this.containerInfo = containerInfo;
  this.pendingChildren = null;
  this.pingCache = null;
  this.finishedExpirationTime = NoWork;
  this.finishedWork = null;
  this.timeoutHandle = noTimeout;
  this.context = null;
  this.pendingContext = null;
  this.hydrate = hydrate;
  this.callbackNode = null;
  this.callbackPriority = NoPriority;
  this.firstPendingTime = NoWork;
  this.firstSuspendedTime = NoWork;
  this.lastSuspendedTime = NoWork;
  this.nextKnownPendingLevel = NoWork;
  this.lastPingedTime = NoWork;
  this.lastExpiredTime = NoWork;

  if (enableSchedulerTracing) {
    this.interactionThreadID = tracing.unstable_getThreadID();
    this.memoizedInteractions = new Set();
    this.pendingInteractionMap = new Map();
  }

  if (enableSuspenseCallback) {
    this.hydrationCallbacks = null;
  }
}

function createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks) {
  var root = new FiberRootNode(containerInfo, tag, hydrate);

  if (enableSuspenseCallback) {
    root.hydrationCallbacks = hydrationCallbacks;
  } // Cyclic construction. This cheats the type system right now because
  // stateNode is any.

  var uninitializedFiber = createHostRootFiber(tag);
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;
  return root;
}
function isRootSuspendedAtTime(root, expirationTime) {
  var firstSuspendedTime = root.firstSuspendedTime;
  var lastSuspendedTime = root.lastSuspendedTime;
  return (
    firstSuspendedTime !== NoWork &&
    firstSuspendedTime >= expirationTime &&
    lastSuspendedTime <= expirationTime
  );
}
function markRootSuspendedAtTime(root, expirationTime) {
  var firstSuspendedTime = root.firstSuspendedTime;
  var lastSuspendedTime = root.lastSuspendedTime;

  if (firstSuspendedTime < expirationTime) {
    root.firstSuspendedTime = expirationTime;
  }

  if (lastSuspendedTime > expirationTime || firstSuspendedTime === NoWork) {
    root.lastSuspendedTime = expirationTime;
  }

  if (expirationTime <= root.lastPingedTime) {
    root.lastPingedTime = NoWork;
  }

  if (expirationTime <= root.lastExpiredTime) {
    root.lastExpiredTime = NoWork;
  }
}
function markRootUpdatedAtTime(root, expirationTime) {
  // Update the range of pending times
  var firstPendingTime = root.firstPendingTime;

  if (expirationTime > firstPendingTime) {
    root.firstPendingTime = expirationTime;
  } // Update the range of suspended times. Treat everything lower priority or
  // equal to this update as unsuspended.

  var firstSuspendedTime = root.firstSuspendedTime;

  if (firstSuspendedTime !== NoWork) {
    if (expirationTime >= firstSuspendedTime) {
      // The entire suspended range is now unsuspended.
      root.firstSuspendedTime = root.lastSuspendedTime = root.nextKnownPendingLevel = NoWork;
    } else if (expirationTime >= root.lastSuspendedTime) {
      root.lastSuspendedTime = expirationTime + 1;
    } // This is a pending level. Check if it's higher priority than the next
    // known pending level.

    if (expirationTime > root.nextKnownPendingLevel) {
      root.nextKnownPendingLevel = expirationTime;
    }
  }
}
function markRootFinishedAtTime(
  root,
  finishedExpirationTime,
  remainingExpirationTime
) {
  // Update the range of pending times
  root.firstPendingTime = remainingExpirationTime; // Update the range of suspended times. Treat everything higher priority or
  // equal to this update as unsuspended.

  if (finishedExpirationTime <= root.lastSuspendedTime) {
    // The entire suspended range is now unsuspended.
    root.firstSuspendedTime = root.lastSuspendedTime = root.nextKnownPendingLevel = NoWork;
  } else if (finishedExpirationTime <= root.firstSuspendedTime) {
    // Part of the suspended range is now unsuspended. Narrow the range to
    // include everything between the unsuspended time (non-inclusive) and the
    // last suspended time.
    root.firstSuspendedTime = finishedExpirationTime - 1;
  }

  if (finishedExpirationTime <= root.lastPingedTime) {
    // Clear the pinged time
    root.lastPingedTime = NoWork;
  }

  if (finishedExpirationTime <= root.lastExpiredTime) {
    // Clear the expired time
    root.lastExpiredTime = NoWork;
  }
}
function markRootExpiredAtTime(root, expirationTime) {
  var lastExpiredTime = root.lastExpiredTime;

  if (lastExpiredTime === NoWork || lastExpiredTime > expirationTime) {
    root.lastExpiredTime = expirationTime;
  }
}

// This lets us hook into Fiber to debug what it's doing.
// See https://github.com/facebook/react/pull/8033.
// This is not part of the public API, not even for React DevTools.
// You may only inject a debugTool if you work on React Fiber itself.
var ReactFiberInstrumentation = {
  debugTool: null
};
var ReactFiberInstrumentation_1 = ReactFiberInstrumentation;

var didWarnAboutNestedUpdates;
var didWarnAboutFindNodeInStrictMode;

{
  didWarnAboutNestedUpdates = false;
  didWarnAboutFindNodeInStrictMode = {};
}

function getContextForSubtree(parentComponent) {
  if (!parentComponent) {
    return emptyContextObject;
  }

  var fiber = get(parentComponent);
  var parentContext = findCurrentUnmaskedContext(fiber);

  if (fiber.tag === ClassComponent) {
    var Component = fiber.type;

    if (isContextProvider(Component)) {
      return processChildContext(fiber, Component, parentContext);
    }
  }

  return parentContext;
}

function findHostInstance(component) {
  var fiber = get(component);

  if (fiber === undefined) {
    if (typeof component.render === "function") {
      {
        throw Error("Unable to find node on an unmounted component.");
      }
    } else {
      {
        throw Error(
          "Argument appears to not be a ReactComponent. Keys: " +
            Object.keys(component)
        );
      }
    }
  }

  var hostFiber = findCurrentHostFiber(fiber);

  if (hostFiber === null) {
    return null;
  }

  return hostFiber.stateNode;
}

function findHostInstanceWithWarning(component, methodName) {
  {
    var fiber = get(component);

    if (fiber === undefined) {
      if (typeof component.render === "function") {
        {
          throw Error("Unable to find node on an unmounted component.");
        }
      } else {
        {
          throw Error(
            "Argument appears to not be a ReactComponent. Keys: " +
              Object.keys(component)
          );
        }
      }
    }

    var hostFiber = findCurrentHostFiber(fiber);

    if (hostFiber === null) {
      return null;
    }

    if (hostFiber.mode & StrictMode) {
      var componentName = getComponentName(fiber.type) || "Component";

      if (!didWarnAboutFindNodeInStrictMode[componentName]) {
        didWarnAboutFindNodeInStrictMode[componentName] = true;

        if (fiber.mode & StrictMode) {
          warningWithoutStack$1(
            false,
            "%s is deprecated in StrictMode. " +
              "%s was passed an instance of %s which is inside StrictMode. " +
              "Instead, add a ref directly to the element you want to reference. " +
              "Learn more about using refs safely here: " +
              "https://fb.me/react-strict-mode-find-node%s",
            methodName,
            methodName,
            componentName,
            getStackByFiberInDevAndProd(hostFiber)
          );
        } else {
          warningWithoutStack$1(
            false,
            "%s is deprecated in StrictMode. " +
              "%s was passed an instance of %s which renders StrictMode children. " +
              "Instead, add a ref directly to the element you want to reference. " +
              "Learn more about using refs safely here: " +
              "https://fb.me/react-strict-mode-find-node%s",
            methodName,
            methodName,
            componentName,
            getStackByFiberInDevAndProd(hostFiber)
          );
        }
      }
    }

    return hostFiber.stateNode;
  }

  return findHostInstance(component);
}

function createContainer(containerInfo, tag, hydrate, hydrationCallbacks) {
  return createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks);
}
function updateContainer(element, container, parentComponent, callback) {
  var current$$1 = container.current;
  var currentTime = requestCurrentTimeForUpdate();

  {
    // $FlowExpectedError - jest isn't a global, and isn't recognized outside of tests
    if ("undefined" !== typeof jest) {
      warnIfUnmockedScheduler(current$$1);
      warnIfNotScopedWithMatchingAct(current$$1);
    }
  }

  var suspenseConfig = requestCurrentSuspenseConfig();
  var expirationTime = computeExpirationForFiber(
    currentTime,
    current$$1,
    suspenseConfig
  );

  {
    if (ReactFiberInstrumentation_1.debugTool) {
      if (current$$1.alternate === null) {
        ReactFiberInstrumentation_1.debugTool.onMountContainer(container);
      } else if (element === null) {
        ReactFiberInstrumentation_1.debugTool.onUnmountContainer(container);
      } else {
        ReactFiberInstrumentation_1.debugTool.onUpdateContainer(container);
      }
    }
  }

  var context = getContextForSubtree(parentComponent);

  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  {
    if (phase === "render" && current !== null && !didWarnAboutNestedUpdates) {
      didWarnAboutNestedUpdates = true;
      warningWithoutStack$1(
        false,
        "Render methods should be a pure function of props and state; " +
          "triggering nested component updates from render is not allowed. " +
          "If necessary, trigger nested updates in componentDidUpdate.\n\n" +
          "Check the render method of %s.",
        getComponentName(current.type) || "Unknown"
      );
    }
  }

  var update = createUpdate(expirationTime, suspenseConfig); // Caution: React DevTools currently depends on this property
  // being called "element".

  update.payload = {
    element: element
  };
  callback = callback === undefined ? null : callback;

  if (callback !== null) {
    !(typeof callback === "function")
      ? warningWithoutStack$1(
          false,
          "render(...): Expected the last optional `callback` argument to be a " +
            "function. Instead received: %s.",
          callback
        )
      : void 0;
    update.callback = callback;
  }

  enqueueUpdate(current$$1, update);
  scheduleWork(current$$1, expirationTime);
  return expirationTime;
}
function getPublicRootInstance(container) {
  var containerFiber = container.current;

  if (!containerFiber.child) {
    return null;
  }

  switch (containerFiber.child.tag) {
    case HostComponent:
      return getPublicInstance(containerFiber.child.stateNode);

    default:
      return containerFiber.child.stateNode;
  }
}

var shouldSuspendImpl = function(fiber) {
  return false;
};

function shouldSuspend(fiber) {
  return shouldSuspendImpl(fiber);
}
var overrideHookState = null;
var overrideProps = null;
var scheduleUpdate = null;
var setSuspenseHandler = null;

{
  var copyWithSetImpl = function(obj, path, idx, value) {
    if (idx >= path.length) {
      return value;
    }

    var key = path[idx];
    var updated = Array.isArray(obj) ? obj.slice() : Object.assign({}, obj); // $FlowFixMe number or string is fine here

    updated[key] = copyWithSetImpl(obj[key], path, idx + 1, value);
    return updated;
  };

  var copyWithSet = function(obj, path, value) {
    return copyWithSetImpl(obj, path, 0, value);
  }; // Support DevTools editable values for useState and useReducer.

  overrideHookState = function(fiber, id, path, value) {
    // For now, the "id" of stateful hooks is just the stateful hook index.
    // This may change in the future with e.g. nested hooks.
    var currentHook = fiber.memoizedState;

    while (currentHook !== null && id > 0) {
      currentHook = currentHook.next;
      id--;
    }

    if (currentHook !== null) {
      var newState = copyWithSet(currentHook.memoizedState, path, value);
      currentHook.memoizedState = newState;
      currentHook.baseState = newState; // We aren't actually adding an update to the queue,
      // because there is no update we can add for useReducer hooks that won't trigger an error.
      // (There's no appropriate action type for DevTools overrides.)
      // As a result though, React will see the scheduled update as a noop and bailout.
      // Shallow cloning props works as a workaround for now to bypass the bailout check.

      fiber.memoizedProps = Object.assign({}, fiber.memoizedProps);
      scheduleWork(fiber, Sync);
    }
  }; // Support DevTools props for function components, forwardRef, memo, host components, etc.

  overrideProps = function(fiber, path, value) {
    fiber.pendingProps = copyWithSet(fiber.memoizedProps, path, value);

    if (fiber.alternate) {
      fiber.alternate.pendingProps = fiber.pendingProps;
    }

    scheduleWork(fiber, Sync);
  };

  scheduleUpdate = function(fiber) {
    scheduleWork(fiber, Sync);
  };

  setSuspenseHandler = function(newShouldSuspendImpl) {
    shouldSuspendImpl = newShouldSuspendImpl;
  };
}

function injectIntoDevTools(devToolsConfig) {
  var findFiberByHostInstance = devToolsConfig.findFiberByHostInstance;
  var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
  return injectInternals(
    Object.assign({}, devToolsConfig, {
      overrideHookState: overrideHookState,
      overrideProps: overrideProps,
      setSuspenseHandler: setSuspenseHandler,
      scheduleUpdate: scheduleUpdate,
      currentDispatcherRef: ReactCurrentDispatcher,
      findHostInstanceByFiber: function(fiber) {
        var hostFiber = findCurrentHostFiber(fiber);

        if (hostFiber === null) {
          return null;
        }

        return hostFiber.stateNode;
      },
      findFiberByHostInstance: function(instance) {
        if (!findFiberByHostInstance) {
          // Might not be implemented by the renderer.
          return null;
        }

        return findFiberByHostInstance(instance);
      },
      // React Refresh
      findHostInstancesForRefresh: findHostInstancesForRefresh,
      scheduleRefresh: scheduleRefresh,
      scheduleRoot: scheduleRoot,
      setRefreshHandler: setRefreshHandler,
      // Enables DevTools to append owner stacks to error messages in DEV mode.
      getCurrentFiber: function() {
        return current;
      }
    })
  );
}

// This file intentionally does *not* have the Flow annotation.
// Don't add it. See `./inline-typed.js` for an explanation.

function createPortal(
  children,
  containerInfo, // TODO: figure out the API for cross-renderer implementation.
  implementation
) {
  var key =
    arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  return {
    // This tag allow us to uniquely identify this as a React Portal
    $$typeof: REACT_PORTAL_TYPE,
    key: key == null ? null : "" + key,
    children: children,
    containerInfo: containerInfo,
    implementation: implementation
  };
}

// TODO: this is special because it gets imported during build.

var ReactVersion = "16.11.0";

var NativeMethodsMixin = function(findNodeHandle, findHostInstance) {
  /**
   * `NativeMethodsMixin` provides methods to access the underlying native
   * component directly. This can be useful in cases when you want to focus
   * a view or measure its on-screen dimensions, for example.
   *
   * The methods described here are available on most of the default components
   * provided by React Native. Note, however, that they are *not* available on
   * composite components that aren't directly backed by a native view. This will
   * generally include most components that you define in your own app. For more
   * information, see [Direct
   * Manipulation](docs/direct-manipulation.html).
   *
   * Note the Flow $Exact<> syntax is required to support mixins.
   * React createClass mixins can only be used with exact types.
   */
  var NativeMethodsMixin = {
    /**
     * Determines the location on screen, width, and height of the given view and
     * returns the values via an async callback. If successful, the callback will
     * be called with the following arguments:
     *
     *  - x
     *  - y
     *  - width
     *  - height
     *  - pageX
     *  - pageY
     *
     * Note that these measurements are not available until after the rendering
     * has been completed in native. If you need the measurements as soon as
     * possible, consider using the [`onLayout`
     * prop](docs/view.html#onlayout) instead.
     */
    measure: function(callback) {
      var maybeInstance; // Fiber errors if findNodeHandle is called for an umounted component.
      // Tests using ReactTestRenderer will trigger this case indirectly.
      // Mimicking stack behavior, we should silently ignore this case.
      // TODO Fix ReactTestRenderer so we can remove this try/catch.

      try {
        maybeInstance = findHostInstance(this);
      } catch (error) {} // If there is no host component beneath this we should fail silently.
      // This is not an error; it could mean a class component rendered null.

      if (maybeInstance == null) {
        return;
      }

      if (maybeInstance.canonical) {
        // We can't call FabricUIManager here because it won't be loaded in paper
        // at initialization time. See https://github.com/facebook/react/pull/15490
        // for more info.
        nativeFabricUIManager.measure(
          maybeInstance.node,
          mountSafeCallback_NOT_REALLY_SAFE(this, callback)
        );
      } else {
        ReactNativePrivateInterface.UIManager.measure(
          findNodeHandle(this),
          mountSafeCallback_NOT_REALLY_SAFE(this, callback)
        );
      }
    },

    /**
     * Determines the location of the given view in the window and returns the
     * values via an async callback. If the React root view is embedded in
     * another native view, this will give you the absolute coordinates. If
     * successful, the callback will be called with the following
     * arguments:
     *
     *  - x
     *  - y
     *  - width
     *  - height
     *
     * Note that these measurements are not available until after the rendering
     * has been completed in native.
     */
    measureInWindow: function(callback) {
      var maybeInstance; // Fiber errors if findNodeHandle is called for an umounted component.
      // Tests using ReactTestRenderer will trigger this case indirectly.
      // Mimicking stack behavior, we should silently ignore this case.
      // TODO Fix ReactTestRenderer so we can remove this try/catch.

      try {
        maybeInstance = findHostInstance(this);
      } catch (error) {} // If there is no host component beneath this we should fail silently.
      // This is not an error; it could mean a class component rendered null.

      if (maybeInstance == null) {
        return;
      }

      if (maybeInstance.canonical) {
        // We can't call FabricUIManager here because it won't be loaded in paper
        // at initialization time. See https://github.com/facebook/react/pull/15490
        // for more info.
        nativeFabricUIManager.measureInWindow(
          maybeInstance.node,
          mountSafeCallback_NOT_REALLY_SAFE(this, callback)
        );
      } else {
        ReactNativePrivateInterface.UIManager.measureInWindow(
          findNodeHandle(this),
          mountSafeCallback_NOT_REALLY_SAFE(this, callback)
        );
      }
    },

    /**
     * Like [`measure()`](#measure), but measures the view relative an ancestor,
     * specified as `relativeToNativeNode`. This means that the returned x, y
     * are relative to the origin x, y of the ancestor view.
     *
     * As always, to obtain a native node handle for a component, you can use
     * `findNodeHandle(component)`.
     */
    measureLayout: function(
      relativeToNativeNode,
      onSuccess,
      onFail
    ) /* currently unused */
    {
      var maybeInstance; // Fiber errors if findNodeHandle is called for an umounted component.
      // Tests using ReactTestRenderer will trigger this case indirectly.
      // Mimicking stack behavior, we should silently ignore this case.
      // TODO Fix ReactTestRenderer so we can remove this try/catch.

      try {
        maybeInstance = findHostInstance(this);
      } catch (error) {} // If there is no host component beneath this we should fail silently.
      // This is not an error; it could mean a class component rendered null.

      if (maybeInstance == null) {
        return;
      }

      if (maybeInstance.canonical) {
        warningWithoutStack$1(
          false,
          "Warning: measureLayout on components using NativeMethodsMixin " +
            "or ReactNative.NativeComponent is not currently supported in Fabric. " +
            "measureLayout must be called on a native ref. Consider using forwardRef."
        );
        return;
      } else {
        var relativeNode;

        if (typeof relativeToNativeNode === "number") {
          // Already a node handle
          relativeNode = relativeToNativeNode;
        } else if (relativeToNativeNode._nativeTag) {
          relativeNode = relativeToNativeNode._nativeTag;
        }

        if (relativeNode == null) {
          warningWithoutStack$1(
            false,
            "Warning: ref.measureLayout must be called with a node handle or a ref to a native component."
          );
          return;
        }

        ReactNativePrivateInterface.UIManager.measureLayout(
          findNodeHandle(this),
          relativeNode,
          mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
          mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess)
        );
      }
    },

    /**
     * This function sends props straight to native. They will not participate in
     * future diff process - this means that if you do not include them in the
     * next render, they will remain active (see [Direct
     * Manipulation](docs/direct-manipulation.html)).
     */
    setNativeProps: function(nativeProps) {
      // Class components don't have viewConfig -> validateAttributes.
      // Nor does it make sense to set native props on a non-native component.
      // Instead, find the nearest host component and set props on it.
      // Use findNodeHandle() rather than findNodeHandle() because
      // We want the instance/wrapper (not the native tag).
      var maybeInstance; // Fiber errors if findNodeHandle is called for an umounted component.
      // Tests using ReactTestRenderer will trigger this case indirectly.
      // Mimicking stack behavior, we should silently ignore this case.
      // TODO Fix ReactTestRenderer so we can remove this try/catch.

      try {
        maybeInstance = findHostInstance(this);
      } catch (error) {} // If there is no host component beneath this we should fail silently.
      // This is not an error; it could mean a class component rendered null.

      if (maybeInstance == null) {
        return;
      }

      if (maybeInstance.canonical) {
        warningWithoutStack$1(
          false,
          "Warning: setNativeProps is not currently supported in Fabric"
        );
        return;
      }

      var nativeTag =
        maybeInstance._nativeTag || maybeInstance.canonical._nativeTag;
      var viewConfig =
        maybeInstance.viewConfig || maybeInstance.canonical.viewConfig;

      {
        warnForStyleProps(nativeProps, viewConfig.validAttributes);
      }

      var updatePayload = create(nativeProps, viewConfig.validAttributes); // Avoid the overhead of bridge calls if there's no update.
      // This is an expensive no-op for Android, and causes an unnecessary
      // view invalidation for certain components (eg RCTTextInput) on iOS.

      if (updatePayload != null) {
        ReactNativePrivateInterface.UIManager.updateView(
          nativeTag,
          viewConfig.uiViewClassName,
          updatePayload
        );
      }
    },

    /**
     * Requests focus for the given input or view. The exact behavior triggered
     * will depend on the platform and type of view.
     */
    focus: function() {
      ReactNativePrivateInterface.TextInputState.focusTextInput(
        findNodeHandle(this)
      );
    },

    /**
     * Removes focus from an input or view. This is the opposite of `focus()`.
     */
    blur: function() {
      ReactNativePrivateInterface.TextInputState.blurTextInput(
        findNodeHandle(this)
      );
    }
  };

  {
    // hide this from Flow since we can't define these properties outside of
    // true without actually implementing them (setting them to undefined
    // isn't allowed by ReactClass)
    var NativeMethodsMixin_DEV = NativeMethodsMixin;

    if (
      !(
        !NativeMethodsMixin_DEV.componentWillMount &&
        !NativeMethodsMixin_DEV.componentWillReceiveProps &&
        !NativeMethodsMixin_DEV.UNSAFE_componentWillMount &&
        !NativeMethodsMixin_DEV.UNSAFE_componentWillReceiveProps
      )
    ) {
      throw Error("Do not override existing functions.");
    } // TODO (bvaughn) Remove cWM and cWRP in a future version of React Native,
    // Once these lifecycles have been remove from the reconciler.

    NativeMethodsMixin_DEV.componentWillMount = function() {
      throwOnStylesProp(this, this.props);
    };

    NativeMethodsMixin_DEV.componentWillReceiveProps = function(newProps) {
      throwOnStylesProp(this, newProps);
    };

    NativeMethodsMixin_DEV.UNSAFE_componentWillMount = function() {
      throwOnStylesProp(this, this.props);
    };

    NativeMethodsMixin_DEV.UNSAFE_componentWillReceiveProps = function(
      newProps
    ) {
      throwOnStylesProp(this, newProps);
    }; // React may warn about cWM/cWRP/cWU methods being deprecated.
    // Add a flag to suppress these warnings for this special case.
    // TODO (bvaughn) Remove this flag once the above methods have been removed.

    NativeMethodsMixin_DEV.componentWillMount.__suppressDeprecationWarning = true;
    NativeMethodsMixin_DEV.componentWillReceiveProps.__suppressDeprecationWarning = true;
  }

  return NativeMethodsMixin;
};

var ReactNativeComponent$1 = function(findNodeHandle, findHostInstance) {
  /**
   * Superclass that provides methods to access the underlying native component.
   * This can be useful when you want to focus a view or measure its dimensions.
   *
   * Methods implemented by this class are available on most default components
   * provided by React Native. However, they are *not* available on composite
   * components that are not directly backed by a native view. For more
   * information, see [Direct Manipulation](docs/direct-manipulation.html).
   *
   * @abstract
   */
  var ReactNativeComponent =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(ReactNativeComponent, _React$Component);

      function ReactNativeComponent() {
        return _React$Component.apply(this, arguments) || this;
      }

      var _proto = ReactNativeComponent.prototype;

      /**
       * Due to bugs in Flow's handling of React.createClass, some fields already
       * declared in the base class need to be redeclared below.
       */

      /**
       * Removes focus. This is the opposite of `focus()`.
       */
      _proto.blur = function blur() {
        ReactNativePrivateInterface.TextInputState.blurTextInput(
          findNodeHandle(this)
        );
      };
      /**
       * Requests focus. The exact behavior depends on the platform and view.
       */

      _proto.focus = function focus() {
        ReactNativePrivateInterface.TextInputState.focusTextInput(
          findNodeHandle(this)
        );
      };
      /**
       * Measures the on-screen location and dimensions. If successful, the callback
       * will be called asynchronously with the following arguments:
       *
       *  - x
       *  - y
       *  - width
       *  - height
       *  - pageX
       *  - pageY
       *
       * These values are not available until after natives rendering completes. If
       * you need the measurements as soon as possible, consider using the
       * [`onLayout` prop](docs/view.html#onlayout) instead.
       */

      _proto.measure = function measure(callback) {
        var maybeInstance; // Fiber errors if findNodeHandle is called for an umounted component.
        // Tests using ReactTestRenderer will trigger this case indirectly.
        // Mimicking stack behavior, we should silently ignore this case.
        // TODO Fix ReactTestRenderer so we can remove this try/catch.

        try {
          maybeInstance = findHostInstance(this);
        } catch (error) {} // If there is no host component beneath this we should fail silently.
        // This is not an error; it could mean a class component rendered null.

        if (maybeInstance == null) {
          return;
        }

        if (maybeInstance.canonical) {
          // We can't call FabricUIManager here because it won't be loaded in paper
          // at initialization time. See https://github.com/facebook/react/pull/15490
          // for more info.
          nativeFabricUIManager.measure(
            maybeInstance.node,
            mountSafeCallback_NOT_REALLY_SAFE(this, callback)
          );
        } else {
          ReactNativePrivateInterface.UIManager.measure(
            findNodeHandle(this),
            mountSafeCallback_NOT_REALLY_SAFE(this, callback)
          );
        }
      };
      /**
       * Measures the on-screen location and dimensions. Even if the React Native
       * root view is embedded within another native view, this method will give you
       * the absolute coordinates measured from the window. If successful, the
       * callback will be called asynchronously with the following arguments:
       *
       *  - x
       *  - y
       *  - width
       *  - height
       *
       * These values are not available until after natives rendering completes.
       */

      _proto.measureInWindow = function measureInWindow(callback) {
        var maybeInstance; // Fiber errors if findNodeHandle is called for an umounted component.
        // Tests using ReactTestRenderer will trigger this case indirectly.
        // Mimicking stack behavior, we should silently ignore this case.
        // TODO Fix ReactTestRenderer so we can remove this try/catch.

        try {
          maybeInstance = findHostInstance(this);
        } catch (error) {} // If there is no host component beneath this we should fail silently.
        // This is not an error; it could mean a class component rendered null.

        if (maybeInstance == null) {
          return;
        }

        if (maybeInstance.canonical) {
          // We can't call FabricUIManager here because it won't be loaded in paper
          // at initialization time. See https://github.com/facebook/react/pull/15490
          // for more info.
          nativeFabricUIManager.measureInWindow(
            maybeInstance.node,
            mountSafeCallback_NOT_REALLY_SAFE(this, callback)
          );
        } else {
          ReactNativePrivateInterface.UIManager.measureInWindow(
            findNodeHandle(this),
            mountSafeCallback_NOT_REALLY_SAFE(this, callback)
          );
        }
      };
      /**
       * Similar to [`measure()`](#measure), but the resulting location will be
       * relative to the supplied ancestor's location.
       *
       * Obtain a native node handle with `ReactNative.findNodeHandle(component)`.
       */

      _proto.measureLayout = function measureLayout(
        relativeToNativeNode,
        onSuccess,
        onFail
      ) {
        var maybeInstance; // Fiber errors if findNodeHandle is called for an umounted component.
        // Tests using ReactTestRenderer will trigger this case indirectly.
        // Mimicking stack behavior, we should silently ignore this case.
        // TODO Fix ReactTestRenderer so we can remove this try/catch.

        try {
          maybeInstance = findHostInstance(this);
        } catch (error) {} // If there is no host component beneath this we should fail silently.
        // This is not an error; it could mean a class component rendered null.

        if (maybeInstance == null) {
          return;
        }

        if (maybeInstance.canonical) {
          warningWithoutStack$1(
            false,
            "Warning: measureLayout on components using NativeMethodsMixin " +
              "or ReactNative.NativeComponent is not currently supported in Fabric. " +
              "measureLayout must be called on a native ref. Consider using forwardRef."
          );
          return;
        } else {
          var relativeNode;

          if (typeof relativeToNativeNode === "number") {
            // Already a node handle
            relativeNode = relativeToNativeNode;
          } else if (relativeToNativeNode._nativeTag) {
            relativeNode = relativeToNativeNode._nativeTag;
          }

          if (relativeNode == null) {
            warningWithoutStack$1(
              false,
              "Warning: ref.measureLayout must be called with a node handle or a ref to a native component."
            );
            return;
          }

          ReactNativePrivateInterface.UIManager.measureLayout(
            findNodeHandle(this),
            relativeNode,
            mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
            mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess)
          );
        }
      };
      /**
       * This function sends props straight to native. They will not participate in
       * future diff process - this means that if you do not include them in the
       * next render, they will remain active (see [Direct
       * Manipulation](docs/direct-manipulation.html)).
       */

      _proto.setNativeProps = function setNativeProps(nativeProps) {
        // Class components don't have viewConfig -> validateAttributes.
        // Nor does it make sense to set native props on a non-native component.
        // Instead, find the nearest host component and set props on it.
        // Use findNodeHandle() rather than ReactNative.findNodeHandle() because
        // We want the instance/wrapper (not the native tag).
        var maybeInstance; // Fiber errors if findNodeHandle is called for an umounted component.
        // Tests using ReactTestRenderer will trigger this case indirectly.
        // Mimicking stack behavior, we should silently ignore this case.
        // TODO Fix ReactTestRenderer so we can remove this try/catch.

        try {
          maybeInstance = findHostInstance(this);
        } catch (error) {} // If there is no host component beneath this we should fail silently.
        // This is not an error; it could mean a class component rendered null.

        if (maybeInstance == null) {
          return;
        }

        if (maybeInstance.canonical) {
          warningWithoutStack$1(
            false,
            "Warning: setNativeProps is not currently supported in Fabric"
          );
          return;
        }

        var nativeTag =
          maybeInstance._nativeTag || maybeInstance.canonical._nativeTag;
        var viewConfig =
          maybeInstance.viewConfig || maybeInstance.canonical.viewConfig;
        var updatePayload = create(nativeProps, viewConfig.validAttributes); // Avoid the overhead of bridge calls if there's no update.
        // This is an expensive no-op for Android, and causes an unnecessary
        // view invalidation for certain components (eg RCTTextInput) on iOS.

        if (updatePayload != null) {
          ReactNativePrivateInterface.UIManager.updateView(
            nativeTag,
            viewConfig.uiViewClassName,
            updatePayload
          );
        }
      };

      return ReactNativeComponent;
    })(React.Component); // eslint-disable-next-line no-unused-expressions

  return ReactNativeComponent;
};

var instanceCache = new Map();

function getInstanceFromTag(tag) {
  return instanceCache.get(tag) || null;
}

var emptyObject$3 = {};

{
  Object.freeze(emptyObject$3);
}

var getInspectorDataForViewTag;

{
  var traverseOwnerTreeUp = function(hierarchy, instance) {
    if (instance) {
      hierarchy.unshift(instance);
      traverseOwnerTreeUp(hierarchy, instance._debugOwner);
    }
  };

  var getOwnerHierarchy = function(instance) {
    var hierarchy = [];
    traverseOwnerTreeUp(hierarchy, instance);
    return hierarchy;
  };

  var lastNonHostInstance = function(hierarchy) {
    for (var i = hierarchy.length - 1; i > 1; i--) {
      var instance = hierarchy[i];

      if (instance.tag !== HostComponent) {
        return instance;
      }
    }

    return hierarchy[0];
  };

  var getHostProps = function(fiber) {
    var host = findCurrentHostFiber(fiber);

    if (host) {
      return host.memoizedProps || emptyObject$3;
    }

    return emptyObject$3;
  };

  var getHostNode = function(fiber, findNodeHandle) {
    var hostNode; // look for children first for the hostNode
    // as composite fibers do not have a hostNode

    while (fiber) {
      if (fiber.stateNode !== null && fiber.tag === HostComponent) {
        hostNode = findNodeHandle(fiber.stateNode);
      }

      if (hostNode) {
        return hostNode;
      }

      fiber = fiber.child;
    }

    return null;
  };

  var createHierarchy = function(fiberHierarchy) {
    return fiberHierarchy.map(function(fiber) {
      return {
        name: getComponentName(fiber.type),
        getInspectorData: function(findNodeHandle) {
          return {
            measure: function(callback) {
              return ReactNativePrivateInterface.UIManager.measure(
                getHostNode(fiber, findNodeHandle),
                callback
              );
            },
            props: getHostProps(fiber),
            source: fiber._debugSource
          };
        }
      };
    });
  };

  getInspectorDataForViewTag = function(viewTag) {
    var closestInstance = getInstanceFromTag(viewTag); // Handle case where user clicks outside of ReactNative

    if (!closestInstance) {
      return {
        hierarchy: [],
        props: emptyObject$3,
        selection: null,
        source: null
      };
    }

    var fiber = findCurrentFiberUsingSlowPath(closestInstance);
    var fiberHierarchy = getOwnerHierarchy(fiber);
    var instance = lastNonHostInstance(fiberHierarchy);
    var hierarchy = createHierarchy(fiberHierarchy);
    var props = getHostProps(instance);
    var source = instance._debugSource;
    var selection = fiberHierarchy.indexOf(instance);
    return {
      hierarchy: hierarchy,
      props: props,
      selection: selection,
      source: source
    };
  };
}

var _nativeFabricUIManage = nativeFabricUIManager;
var fabricDispatchCommand = _nativeFabricUIManage.dispatchCommand;
var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;

function findHostInstance_DEPRECATED(componentOrHandle) {
  {
    var owner = ReactCurrentOwner.current;

    if (owner !== null && owner.stateNode !== null) {
      !owner.stateNode._warnedAboutRefsInRender
        ? warningWithoutStack$1(
            false,
            "%s is accessing findNodeHandle inside its render(). " +
              "render() should be a pure function of props and state. It should " +
              "never access something that requires stale data from the previous " +
              "render, such as refs. Move this logic to componentDidMount and " +
              "componentDidUpdate instead.",
            getComponentName(owner.type) || "A component"
          )
        : void 0;
      owner.stateNode._warnedAboutRefsInRender = true;
    }
  }

  if (componentOrHandle == null) {
    return null;
  }

  if (componentOrHandle._nativeTag) {
    return componentOrHandle;
  }

  if (componentOrHandle.canonical && componentOrHandle.canonical._nativeTag) {
    return componentOrHandle.canonical;
  }

  var hostInstance;

  {
    hostInstance = findHostInstanceWithWarning(
      componentOrHandle,
      "findHostInstance_DEPRECATED"
    );
  }

  if (hostInstance == null) {
    return hostInstance;
  }

  if (hostInstance.canonical) {
    // Fabric
    return hostInstance.canonical;
  }

  return hostInstance;
}

function findNodeHandle(componentOrHandle) {
  {
    var owner = ReactCurrentOwner.current;

    if (owner !== null && owner.stateNode !== null) {
      !owner.stateNode._warnedAboutRefsInRender
        ? warningWithoutStack$1(
            false,
            "%s is accessing findNodeHandle inside its render(). " +
              "render() should be a pure function of props and state. It should " +
              "never access something that requires stale data from the previous " +
              "render, such as refs. Move this logic to componentDidMount and " +
              "componentDidUpdate instead.",
            getComponentName(owner.type) || "A component"
          )
        : void 0;
      owner.stateNode._warnedAboutRefsInRender = true;
    }
  }

  if (componentOrHandle == null) {
    return null;
  }

  if (typeof componentOrHandle === "number") {
    // Already a node handle
    return componentOrHandle;
  }

  if (componentOrHandle._nativeTag) {
    return componentOrHandle._nativeTag;
  }

  if (componentOrHandle.canonical && componentOrHandle.canonical._nativeTag) {
    return componentOrHandle.canonical._nativeTag;
  }

  var hostInstance;

  {
    hostInstance = findHostInstanceWithWarning(
      componentOrHandle,
      "findNodeHandle"
    );
  }

  if (hostInstance == null) {
    return hostInstance;
  } // TODO: the code is right but the types here are wrong.
  // https://github.com/facebook/react/pull/12863

  if (hostInstance.canonical) {
    // Fabric
    return hostInstance.canonical._nativeTag;
  }

  return hostInstance._nativeTag;
}

setBatchingImplementation(
  batchedUpdates$1,
  discreteUpdates$1,
  flushDiscreteUpdates,
  batchedEventUpdates$1
);
var roots = new Map();
var ReactFabric = {
  NativeComponent: ReactNativeComponent$1(findNodeHandle, findHostInstance),
  // This is needed for implementation details of TouchableNativeFeedback
  // Remove this once TouchableNativeFeedback doesn't use cloneElement
  findHostInstance_DEPRECATED: findHostInstance_DEPRECATED,
  findNodeHandle: findNodeHandle,
  dispatchCommand: function(handle, command, args) {
    var invalid =
      handle._nativeTag == null || handle._internalInstanceHandle == null;

    if (invalid) {
      !!invalid
        ? warningWithoutStack$1(
            false,
            "dispatchCommand was called with a ref that isn't a " +
              "native component. Use React.forwardRef to get access to the underlying native component"
          )
        : void 0;
      return;
    }

    fabricDispatchCommand(
      handle._internalInstanceHandle.stateNode.node,
      command,
      args
    );
  },
  render: function(element, containerTag, callback) {
    var root = roots.get(containerTag);

    if (!root) {
      // TODO (bvaughn): If we decide to keep the wrapper component,
      // We could create a wrapper for containerTag as well to reduce special casing.
      root = createContainer(containerTag, LegacyRoot, false, null);
      roots.set(containerTag, root);
    }

    updateContainer(element, root, null, callback);
    return getPublicRootInstance(root);
  },
  unmountComponentAtNode: function(containerTag) {
    var root = roots.get(containerTag);

    if (root) {
      // TODO: Is it safe to reset this now or should I wait since this unmount could be deferred?
      updateContainer(null, root, null, function() {
        roots.delete(containerTag);
      });
    }
  },
  createPortal: function(children, containerTag) {
    var key =
      arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    return createPortal(children, containerTag, null, key);
  },
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    // Used as a mixin in many createClass-based components
    NativeMethodsMixin: NativeMethodsMixin(findNodeHandle, findHostInstance)
  }
};
injectIntoDevTools({
  findFiberByHostInstance: getInstanceFromInstance,
  getInspectorDataForViewTag: getInspectorDataForViewTag,
  bundleType: 1,
  version: ReactVersion,
  rendererPackageName: "react-native-renderer"
});

var ReactFabric$2 = Object.freeze({
  default: ReactFabric
});

var ReactFabric$3 = (ReactFabric$2 && ReactFabric) || ReactFabric$2;

// TODO: decide on the top-level export form.
// This is hacky but makes it work with both Rollup and Jest.

var fabric = ReactFabric$3.default || ReactFabric$3;

module.exports = fabric;

  })();
}
