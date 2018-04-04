/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @providesModule ReactFabric-dev
 * @preventMunge
 */

'use strict';

if (__DEV__) {
  (function() {
"use strict";

require("InitializeCore");
var invariant = require("fbjs/lib/invariant");
var warning = require("fbjs/lib/warning");
var emptyFunction = require("fbjs/lib/emptyFunction");
var UIManager = require("UIManager");
var TextInputState = require("TextInputState");
var deepDiffer = require("deepDiffer");
var flattenStyle = require("flattenStyle");
var React = require("react");
var emptyObject = require("fbjs/lib/emptyObject");
var shallowEqual = require("fbjs/lib/shallowEqual");
var checkPropTypes = require("prop-types/checkPropTypes");
var deepFreezeAndThrowOnMutationInDev = require("deepFreezeAndThrowOnMutationInDev");
var FabricUIManager = require("FabricUIManager");

var invokeGuardedCallback = function(name, func, context, a, b, c, d, e, f) {
  this._hasCaughtError = false;
  this._caughtError = null;
  var funcArgs = Array.prototype.slice.call(arguments, 3);
  try {
    func.apply(context, funcArgs);
  } catch (error) {
    this._caughtError = error;
    this._hasCaughtError = true;
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
  // untintuitive, though, because even though React has caught the error, from
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
      invariant(
        typeof document !== "undefined",
        "The `document` global was defined when React was initialized, but is not " +
          "defined anymore. This can happen in a test environment if a component " +
          "schedules an update from an asynchronous callback, but the test has already " +
          "finished running. To solve this, you can either unmount the component at " +
          "the end of your test (and ensure that any asynchronous operations get " +
          "canceled in `componentWillUnmount`), or you can change the test itself " +
          "to be asynchronous."
      );
      var evt = document.createEvent("Event");

      // Keeps track of whether the user-provided callback threw an error. We
      // set this to true at the beginning, then set it to false right after
      // calling the function. If the function errors, `didError` will never be
      // set to false. This strategy works even if the browser is flaky and
      // fails to call our global error handler, because it doesn't rely on
      // the error event at all.
      var didError = true;

      // Create an event handler for our fake event. We will synchronously
      // dispatch our fake event using `dispatchEvent`. Inside the handler, we
      // call the user-provided callback.
      var funcArgs = Array.prototype.slice.call(arguments, 3);
      function callCallback() {
        // We immediately remove the callback from event listeners so that
        // nested `invokeGuardedCallback` calls do not clash. Otherwise, a
        // nested call would trigger the fake event handlers of any call higher
        // in the stack.
        fakeNode.removeEventListener(evtType, callCallback, false);
        func.apply(context, funcArgs);
        didError = false;
      }

      // Create a global error event handler. We use this to capture the value
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
      var error = void 0;
      // Use this to track whether the error event is ever called.
      var didSetError = false;
      var isCrossOriginError = false;

      function onError(event) {
        error = event.error;
        didSetError = true;
        if (error === null && event.colno === 0 && event.lineno === 0) {
          isCrossOriginError = true;
        }
      }

      // Create a fake event type.
      var evtType = "react-" + (name ? name : "invokeguardedcallback");

      // Attach our event handlers
      window.addEventListener("error", onError);
      fakeNode.addEventListener(evtType, callCallback, false);

      // Synchronously dispatch our fake event. If the user-provided function
      // errors, it will trigger our global error handler.
      evt.initEvent(evtType, false, false);
      fakeNode.dispatchEvent(evt);

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
        this._hasCaughtError = true;
        this._caughtError = error;
      } else {
        this._hasCaughtError = false;
        this._caughtError = null;
      }

      // Remove our event listeners
      window.removeEventListener("error", onError);
    };

    invokeGuardedCallback = invokeGuardedCallbackDev;
  }
}

var invokeGuardedCallback$1 = invokeGuardedCallback;

var ReactErrorUtils = {
  // Used by Fiber to simulate a try-catch.
  _caughtError: null,
  _hasCaughtError: false,

  // Used by event system to capture/rethrow the first error.
  _rethrowError: null,
  _hasRethrowError: false,

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
  invokeGuardedCallback: function(name, func, context, a, b, c, d, e, f) {
    invokeGuardedCallback$1.apply(ReactErrorUtils, arguments);
  },

  /**
   * Same as invokeGuardedCallback, but instead of returning an error, it stores
   * it in a global so it can be rethrown by `rethrowCaughtError` later.
   * TODO: See if _caughtError and _rethrowError can be unified.
   *
   * @param {String} name of the guard to use for logging or debugging
   * @param {Function} func The function to invoke
   * @param {*} context The context to use when calling the function
   * @param {...*} args Arguments for function
   */
  invokeGuardedCallbackAndCatchFirstError: function(
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
    ReactErrorUtils.invokeGuardedCallback.apply(this, arguments);
    if (ReactErrorUtils.hasCaughtError()) {
      var error = ReactErrorUtils.clearCaughtError();
      if (!ReactErrorUtils._hasRethrowError) {
        ReactErrorUtils._hasRethrowError = true;
        ReactErrorUtils._rethrowError = error;
      }
    }
  },

  /**
   * During execution of guarded functions we will capture the first error which
   * we will rethrow to be handled by the top level error handler.
   */
  rethrowCaughtError: function() {
    return rethrowCaughtError.apply(ReactErrorUtils, arguments);
  },

  hasCaughtError: function() {
    return ReactErrorUtils._hasCaughtError;
  },

  clearCaughtError: function() {
    if (ReactErrorUtils._hasCaughtError) {
      var error = ReactErrorUtils._caughtError;
      ReactErrorUtils._caughtError = null;
      ReactErrorUtils._hasCaughtError = false;
      return error;
    } else {
      invariant(
        false,
        "clearCaughtError was called but no error was captured. This error " +
          "is likely caused by a bug in React. Please file an issue."
      );
    }
  }
};

var rethrowCaughtError = function() {
  if (ReactErrorUtils._hasRethrowError) {
    var error = ReactErrorUtils._rethrowError;
    ReactErrorUtils._rethrowError = null;
    ReactErrorUtils._hasRethrowError = false;
    throw error;
  }
};

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
    invariant(
      pluginIndex > -1,
      "EventPluginRegistry: Cannot inject event plugins that do not exist in " +
        "the plugin ordering, `%s`.",
      pluginName
    );
    if (plugins[pluginIndex]) {
      continue;
    }
    invariant(
      pluginModule.extractEvents,
      "EventPluginRegistry: Event plugins must implement an `extractEvents` " +
        "method, but `%s` does not.",
      pluginName
    );
    plugins[pluginIndex] = pluginModule;
    var publishedEvents = pluginModule.eventTypes;
    for (var eventName in publishedEvents) {
      invariant(
        publishEventForPlugin(
          publishedEvents[eventName],
          pluginModule,
          eventName
        ),
        "EventPluginRegistry: Failed to publish event `%s` for plugin `%s`.",
        eventName,
        pluginName
      );
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
  invariant(
    !eventNameDispatchConfigs.hasOwnProperty(eventName),
    "EventPluginHub: More than one plugin attempted to publish the same " +
      "event name, `%s`.",
    eventName
  );
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
  invariant(
    !registrationNameModules[registrationName],
    "EventPluginHub: More than one plugin attempted to publish the same " +
      "registration name, `%s`.",
    registrationName
  );
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
  invariant(
    !eventPluginOrder,
    "EventPluginRegistry: Cannot inject event plugin ordering more than " +
      "once. You are likely trying to load more than one copy of React."
  );
  // Clone the ordering so it cannot be dynamically mutated.
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
      invariant(
        !namesToPlugins[pluginName],
        "EventPluginRegistry: Cannot inject two different event plugins " +
          "using the same name, `%s`.",
        pluginName
      );
      namesToPlugins[pluginName] = pluginModule;
      isOrderingDirty = true;
    }
  }
  if (isOrderingDirty) {
    recomputePluginOrdering();
  }
}

var getFiberCurrentPropsFromNode = null;
var getInstanceFromNode = null;
var getNodeFromInstance = null;

var injection$1 = {
  injectComponentTree: function(Injected) {
    getFiberCurrentPropsFromNode = Injected.getFiberCurrentPropsFromNode;
    getInstanceFromNode = Injected.getInstanceFromNode;
    getNodeFromInstance = Injected.getNodeFromInstance;

    {
      !(getNodeFromInstance && getInstanceFromNode)
        ? warning(
            false,
            "EventPluginUtils.injection.injectComponentTree(...): Injected " +
              "module is missing getNodeFromInstance or getInstanceFromNode."
          )
        : void 0;
    }
  }
};

function isEndish(topLevelType) {
  return (
    topLevelType === "topMouseUp" ||
    topLevelType === "topTouchEnd" ||
    topLevelType === "topTouchCancel"
  );
}

function isMoveish(topLevelType) {
  return topLevelType === "topMouseMove" || topLevelType === "topTouchMove";
}
function isStartish(topLevelType) {
  return topLevelType === "topMouseDown" || topLevelType === "topTouchStart";
}

var validateEventDispatches = void 0;
{
  validateEventDispatches = function(event) {
    var dispatchListeners = event._dispatchListeners;
    var dispatchInstances = event._dispatchInstances;

    var listenersIsArr = Array.isArray(dispatchListeners);
    var listenersLen = listenersIsArr
      ? dispatchListeners.length
      : dispatchListeners ? 1 : 0;

    var instancesIsArr = Array.isArray(dispatchInstances);
    var instancesLen = instancesIsArr
      ? dispatchInstances.length
      : dispatchInstances ? 1 : 0;

    !(instancesIsArr === listenersIsArr && instancesLen === listenersLen)
      ? warning(false, "EventPluginUtils: Invalid `event`.")
      : void 0;
  };
}

/**
 * Standard/simple iteration through an event's collected dispatches.
 */

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
      }
      // Listeners and Instances are two parallel arrays that are always in sync.
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
  invariant(
    !Array.isArray(dispatchListener),
    "executeDirectDispatch(...): Invalid `event`."
  );
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
  invariant(
    next != null,
    "accumulateInto(...): Accumulated items must not be null or undefined."
  );

  if (current == null) {
    return next;
  }

  // Both are not empty. Warning: Never call x.concat(y) when you are not
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
  var listener = void 0;

  // TODO: shouldPreventMouseEvent is DOM-specific and definitely should not
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
  invariant(
    !listener || typeof listener === "function",
    "Expected `%s` listener to be a function, instead got a value of `%s` type.",
    registrationName,
    typeof listener
  );
  return listener;
}

var IndeterminateComponent = 0; // Before we know whether it is functional or class
var FunctionalComponent = 1;
var ClassComponent = 2;
var HostRoot = 3; // Root of a host tree. Could be nested inside another node.
var HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
var HostComponent = 5;
var HostText = 6;
var CallComponent = 7;
var CallHandlerPhase = 8;
var ReturnComponent = 9;
var Fragment = 10;
var Mode = 11;
var ContextConsumer = 12;
var ContextProvider = 13;
var ForwardRef = 14;

function getParent(inst) {
  do {
    inst = inst["return"];
    // TODO: If this is a HostRoot we might want to bail out.
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
  }

  // If A is deeper, crawl up.
  while (depthA - depthB > 0) {
    instA = getParent(instA);
    depthA--;
  }

  // If B is deeper, crawl up.
  while (depthB - depthA > 0) {
    instB = getParent(instB);
    depthB--;
  }

  // Walk in lockstep until we find a match.
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
  var i = void 0;
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
    !inst ? warning(false, "Dispatching inst must not be null") : void 0;
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

var didWarnForAddedNewProperty = false;
var EVENT_POOL_SIZE = 10;

var shouldBeReleasedProperties = [
  "dispatchConfig",
  "_targetInst",
  "nativeEvent",
  "isDefaultPrevented",
  "isPropagationStopped",
  "_dispatchListeners",
  "_dispatchInstances"
];

/**
 * @interface Event
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var EventInterface = {
  type: null,
  target: null,
  // currentTarget is set when dispatching; no use in copying it here
  currentTarget: emptyFunction.thatReturnsNull,
  eventPhase: null,
  bubbles: null,
  cancelable: null,
  timeStamp: function(event) {
    return event.timeStamp || Date.now();
  },
  defaultPrevented: null,
  isTrusted: null
};

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
    this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
  } else {
    this.isDefaultPrevented = emptyFunction.thatReturnsFalse;
  }
  this.isPropagationStopped = emptyFunction.thatReturnsFalse;
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
    this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
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

    this.isPropagationStopped = emptyFunction.thatReturnsTrue;
  },

  /**
   * We release all dispatched `SyntheticEvent`s after each event loop, adding
   * them back into the pool. This allows a way to hold onto a reference that
   * won't be added back into the pool.
   */
  persist: function() {
    this.isPersistent = emptyFunction.thatReturnsTrue;
  },

  /**
   * Checks if this event should be released back into the pool.
   *
   * @return {boolean} True if this should not be released, false otherwise.
   */
  isPersistent: emptyFunction.thatReturnsFalse,

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
    for (var i = 0; i < shouldBeReleasedProperties.length; i++) {
      this[shouldBeReleasedProperties[i]] = null;
    }
    {
      Object.defineProperty(
        this,
        "nativeEvent",
        getPooledWarningPropertyDefinition("nativeEvent", null)
      );
      Object.defineProperty(
        this,
        "preventDefault",
        getPooledWarningPropertyDefinition("preventDefault", emptyFunction)
      );
      Object.defineProperty(
        this,
        "stopPropagation",
        getPooledWarningPropertyDefinition("stopPropagation", emptyFunction)
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

/** Proxying after everything set on SyntheticEvent
 * to resolve Proxy issue on some WebKit browsers
 * in which some Event properties are set to undefined (GH#10010)
 */
{
  var isProxySupported =
    typeof Proxy === "function" &&
    // https://github.com/facebook/react/issues/12011
    !Object.isSealed(new Proxy({}, {}));

  if (isProxySupported) {
    /*eslint-disable no-func-assign */
    SyntheticEvent = new Proxy(SyntheticEvent, {
      construct: function(target, args) {
        return this.apply(target, Object.create(target.prototype), args);
      },
      apply: function(constructor, that, args) {
        return new Proxy(constructor.apply(that, args), {
          set: function(target, prop, value) {
            if (
              prop !== "isPersistent" &&
              !target.constructor.Interface.hasOwnProperty(prop) &&
              shouldBeReleasedProperties.indexOf(prop) === -1
            ) {
              !(didWarnForAddedNewProperty || target.isPersistent())
                ? warning(
                    false,
                    "This synthetic event is reused for performance reasons. If you're " +
                      "seeing this, you're adding a new property in the synthetic event object. " +
                      "The property is never released. See " +
                      "https://fb.me/react-event-pooling for more information."
                  )
                : void 0;
              didWarnForAddedNewProperty = true;
            }
            target[prop] = value;
            return true;
          }
        });
      }
    });
    /*eslint-enable no-func-assign */
  }
}

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
      ? warning(
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
  invariant(
    event instanceof EventConstructor,
    "Trying to release an event instance  into a pool of a different type."
  );
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

var SyntheticEvent$1 = SyntheticEvent;

/**
 * `touchHistory` isn't actually on the native event, but putting it in the
 * interface will ensure that it is cleaned up when pooled/destroyed. The
 * `ResponderEventPlugin` will populate it appropriately.
 */
var ResponderSyntheticEvent = SyntheticEvent$1.extend({
  touchHistory: function(nativeEvent) {
    return null; // Actually doesn't even look at the native event.
  }
});

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

  invariant(identifier != null, "Touch object is missing identifier.");
  {
    !(identifier <= MAX_TOUCH_BANK)
      ? warning(
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
    console.error(
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
    console.error(
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
            ? warning(false, "Cannot find single active touch.")
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
  invariant(
    next != null,
    "accumulate(...): Accumulated items must be not be null or undefined."
  );

  if (current == null) {
    return next;
  }

  // Both are not empty. Warning: Never call x.concat(y) when you are not
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

/**
 * Last reported number of active touches.
 */
var previousActiveTouches = 0;

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
    }
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
    }
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
    }
  },

  /**
   * On a `touchMove`/`mouseMove`, is it desired that this element become the
   * responder?
   */
  moveShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: "onMoveShouldSetResponder",
      captured: "onMoveShouldSetResponderCapture"
    }
  },

  /**
   * Direct responder events dispatched directly to responder. Do not bubble.
   */
  responderStart: { registrationName: "onResponderStart" },
  responderMove: { registrationName: "onResponderMove" },
  responderEnd: { registrationName: "onResponderEnd" },
  responderRelease: { registrationName: "onResponderRelease" },
  responderTerminationRequest: {
    registrationName: "onResponderTerminationRequest"
  },
  responderGrant: { registrationName: "onResponderGrant" },
  responderReject: { registrationName: "onResponderReject" },
  responderTerminate: { registrationName: "onResponderTerminate" }
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
      : topLevelType === "topSelectionChange"
        ? eventTypes.selectionChangeShouldSetResponder
        : eventTypes.scrollShouldSetResponder;

  // TODO: stop one short of the current responder.
  var bubbleShouldSetFrom = !responderInst
    ? targetInst
    : getLowestCommonAncestor(responderInst, targetInst);

  // When capturing/bubbling the "shouldSet" event, we want to skip the target
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
  var extracted = void 0;
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
    topLevelInst &&
    // responderIgnoreScroll: We are trying to migrate away from specifically
    // tracking native scroll events here and responderIgnoreScroll indicates we
    // will send topTouchCancel to handle canceling touch events instead
    ((topLevelType === "topScroll" && !nativeEvent.responderIgnoreScroll) ||
      (trackedTouchCount > 0 && topLevelType === "topSelectionChange") ||
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
    nativeEventTarget
  ) {
    if (isStartish(topLevelType)) {
      trackedTouchCount += 1;
    } else if (isEndish(topLevelType)) {
      if (trackedTouchCount >= 0) {
        trackedTouchCount -= 1;
      } else {
        console.error(
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
      : null;
    // Responder may or may not have transferred on a new touch start/move.
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
        : isResponderTouchEnd ? eventTypes.responderEnd : null;

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
      responderInst && topLevelType === "topTouchCancel";
    var isResponderRelease =
      responderInst &&
      !isResponderTerminate &&
      isEndish(topLevelType) &&
      noResponderTouches(nativeEvent);
    var finalTouch = isResponderTerminate
      ? eventTypes.responderTerminate
      : isResponderRelease ? eventTypes.responderRelease : null;
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

    var numberActiveTouches =
      ResponderTouchHistoryStore.touchHistory.numberActiveTouches;
    if (
      ResponderEventPlugin.GlobalInteractionHandler &&
      numberActiveTouches !== previousActiveTouches
    ) {
      ResponderEventPlugin.GlobalInteractionHandler.onChange(
        numberActiveTouches
      );
    }
    previousActiveTouches = numberActiveTouches;

    return extracted;
  },

  GlobalResponderHandler: null,
  GlobalInteractionHandler: null,

  injection: {
    /**
     * @param {{onChange: (ReactID, ReactID) => void} GlobalResponderHandler
     * Object that handles any change in responder. Use this to inject
     * integration with an existing touch handling system etc.
     */
    injectGlobalResponderHandler: function(GlobalResponderHandler) {
      ResponderEventPlugin.GlobalResponderHandler = GlobalResponderHandler;
    },

    /**
     * @param {{onChange: (numberActiveTouches) => void} GlobalInteractionHandler
     * Object that handles any change in the number of active touches.
     */
    injectGlobalInteractionHandler: function(GlobalInteractionHandler) {
      ResponderEventPlugin.GlobalInteractionHandler = GlobalInteractionHandler;
    }
  }
};

var customBubblingEventTypes = {};
var customDirectEventTypes = {};

var ReactNativeBridgeEventPlugin = {
  eventTypes: {},

  /**
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    if (targetInst == null) {
      // Probably a node belonging to another renderer's tree.
      return null;
    }
    var bubbleDispatchConfig = customBubblingEventTypes[topLevelType];
    var directDispatchConfig = customDirectEventTypes[topLevelType];
    invariant(
      bubbleDispatchConfig || directDispatchConfig,
      'Unsupported top level event type "%s" dispatched',
      topLevelType
    );
    var event = SyntheticEvent$1.getPooled(
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
  },

  processEventTypes: function(viewConfig) {
    var bubblingEventTypes = viewConfig.bubblingEventTypes,
      directEventTypes = viewConfig.directEventTypes;

    {
      if (bubblingEventTypes != null && directEventTypes != null) {
        for (var topLevelType in directEventTypes) {
          invariant(
            bubblingEventTypes[topLevelType] == null,
            "Event cannot be both direct and bubbling: %s",
            topLevelType
          );
        }
      }
    }

    if (bubblingEventTypes != null) {
      for (var _topLevelType in bubblingEventTypes) {
        if (customBubblingEventTypes[_topLevelType] == null) {
          ReactNativeBridgeEventPlugin.eventTypes[
            _topLevelType
          ] = customBubblingEventTypes[_topLevelType] =
            bubblingEventTypes[_topLevelType];
        }
      }
    }

    if (directEventTypes != null) {
      for (var _topLevelType2 in directEventTypes) {
        if (customDirectEventTypes[_topLevelType2] == null) {
          ReactNativeBridgeEventPlugin.eventTypes[
            _topLevelType2
          ] = customDirectEventTypes[_topLevelType2] =
            directEventTypes[_topLevelType2];
        }
      }
    }
  }
};

var instanceCache = {};
var instanceProps = {};

function precacheFiberNode(hostInst, tag) {
  instanceCache[tag] = hostInst;
}

function uncacheFiberNode(tag) {
  delete instanceCache[tag];
  delete instanceProps[tag];
}

function getInstanceFromTag(tag) {
  if (typeof tag === "number") {
    return instanceCache[tag] || null;
  } else {
    // Fabric will invoke event emitters on a direct fiber reference
    return tag;
  }
}

function getTagFromInstance(inst) {
  var tag = inst.stateNode._nativeTag;
  if (tag === undefined) {
    tag = inst.stateNode.canonical._nativeTag;
  }
  invariant(tag, "All native instances should have a tag.");
  return tag;
}

function getFiberCurrentPropsFromNode$1(stateNode) {
  return instanceProps[stateNode._nativeTag] || null;
}

function updateFiberProps(tag, props) {
  instanceProps[tag] = props;
}

var ReactNativeComponentTree = Object.freeze({
  precacheFiberNode: precacheFiberNode,
  uncacheFiberNode: uncacheFiberNode,
  getClosestInstanceFromNode: getInstanceFromTag,
  getInstanceFromNode: getInstanceFromTag,
  getNodeFromInstance: getTagFromInstance,
  getFiberCurrentPropsFromNode: getFiberCurrentPropsFromNode$1,
  updateFiberProps: updateFiberProps
});

var ReactNativeEventPluginOrder = [
  "ResponderEventPlugin",
  "ReactNativeBridgeEventPlugin"
];

// Module provided by RN:
var ReactNativeGlobalResponderHandler = {
  onChange: function(from, to, blockNativeResponder) {
    if (to !== null) {
      var tag = to.stateNode._nativeTag;
      UIManager.setJSResponder(tag, blockNativeResponder);
    } else {
      UIManager.clearJSResponder();
    }
  }
};

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
injection$1.injectComponentTree(ReactNativeComponentTree);

ResponderEventPlugin.injection.injectGlobalResponderHandler(
  ReactNativeGlobalResponderHandler
);

/**
 * Some important event plugins included by default (without having to require
 * them).
 */
injection.injectEventPluginsByName({
  ResponderEventPlugin: ResponderEventPlugin,
  ReactNativeBridgeEventPlugin: ReactNativeBridgeEventPlugin
});

// TODO: The event emitter registration is interfering with the existing
// ReactNative renderer. So disable it for Fabric for now.

// import * as ReactNativeEventEmitter from './ReactNativeEventEmitter';

// Module provided by RN:
// import RCTEventEmitter from 'RCTEventEmitter';

/**
 * Register the event emitter with the native bridge
 */
// RCTEventEmitter.register(ReactNativeEventEmitter);

// The Symbol used to tag the ReactElement-like types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
var hasSymbol = typeof Symbol === "function" && Symbol["for"];

var REACT_ELEMENT_TYPE = hasSymbol ? Symbol["for"]("react.element") : 0xeac7;
var REACT_CALL_TYPE = hasSymbol ? Symbol["for"]("react.call") : 0xeac8;
var REACT_RETURN_TYPE = hasSymbol ? Symbol["for"]("react.return") : 0xeac9;
var REACT_PORTAL_TYPE = hasSymbol ? Symbol["for"]("react.portal") : 0xeaca;
var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol["for"]("react.fragment") : 0xeacb;
var REACT_STRICT_MODE_TYPE = hasSymbol
  ? Symbol["for"]("react.strict_mode")
  : 0xeacc;
var REACT_PROVIDER_TYPE = hasSymbol ? Symbol["for"]("react.provider") : 0xeacd;
var REACT_CONTEXT_TYPE = hasSymbol ? Symbol["for"]("react.context") : 0xeace;
var REACT_ASYNC_MODE_TYPE = hasSymbol
  ? Symbol["for"]("react.async_mode")
  : 0xeacf;
var REACT_FORWARD_REF_TYPE = hasSymbol
  ? Symbol["for"]("react.forward_ref")
  : 0xead0;

var MAYBE_ITERATOR_SYMBOL = typeof Symbol === "function" && Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = "@@iterator";

function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable === "undefined") {
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

function createPortal(
  children,
  containerInfo,
  // TODO: figure out the API for cross-renderer implementation.
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

// Use to restore controlled state after a change event has fired.

var fiberHostComponent = null;

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
  invariant(
    fiberHostComponent &&
      typeof fiberHostComponent.restoreControlledState === "function",
    "Fiber needs to be injected to handle a fiber target for controlled " +
      "events. This error is likely caused by a bug in React. Please file an issue."
  );
  var props = getFiberCurrentPropsFromNode(internalInstance.stateNode);
  fiberHostComponent.restoreControlledState(
    internalInstance.stateNode,
    internalInstance.type,
    props
  );
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

// Used as a way to call batchedUpdates when we don't have a reference to
// the renderer. Such as when we're dispatching events or if third party
// libraries need to call batchedUpdates. Eventually, this API will go away when
// everything is batched by default. We'll then have a similar API to opt-out of
// scheduled work and instead do synchronous work.

// Defaults
var _batchedUpdates = function(fn, bookkeeping) {
  return fn(bookkeeping);
};
var _interactiveUpdates = function(fn, a, b) {
  return fn(a, b);
};
var _flushInteractiveUpdates = function() {};

var isBatching = false;
function batchedUpdates(fn, bookkeeping) {
  if (isBatching) {
    // If we are currently inside another batch, we need to wait until it
    // fully completes before restoring state.
    return fn(bookkeeping);
  }
  isBatching = true;
  try {
    return _batchedUpdates(fn, bookkeeping);
  } finally {
    // Here we wait until all updates have propagated, which is important
    // when using controlled components within layers:
    // https://github.com/facebook/react/issues/1698
    // Then we restore state of any controlled component.
    isBatching = false;
    var controlledComponentsHavePendingUpdates = needsStateRestore();
    if (controlledComponentsHavePendingUpdates) {
      // If a controlled event was fired, we may need to restore the state of
      // the DOM node back to the controlled value. This is necessary when React
      // bails out of the update without touching the DOM.
      _flushInteractiveUpdates();
      restoreStateIfNeeded();
    }
  }
}

var injection$2 = {
  injectRenderer: function(renderer) {
    _batchedUpdates = renderer.batchedUpdates;
    _interactiveUpdates = renderer.interactiveUpdates;
    _flushInteractiveUpdates = renderer.flushInteractiveUpdates;
  }
};

var TouchHistoryMath = {
  /**
   * This code is optimized and not intended to look beautiful. This allows
   * computing of touch centroids that have moved after `touchesChangedAfter`
   * timeStamp. You can compute the current centroid involving all touches
   * moves after `touchesChangedAfter`, or you can compute the previous
   * centroid of all touches that were moved after `touchesChangedAfter`.
   *
   * @param {TouchHistoryMath} touchHistory Standard Responder touch track
   * data.
   * @param {number} touchesChangedAfter timeStamp after which moved touches
   * are considered "actively moving" - not just "active".
   * @param {boolean} isXAxis Consider `x` dimension vs. `y` dimension.
   * @param {boolean} ofCurrent Compute current centroid for actively moving
   * touches vs. previous centroid of now actively moving touches.
   * @return {number} value of centroid in specified dimension.
   */
  centroidDimension: function(
    touchHistory,
    touchesChangedAfter,
    isXAxis,
    ofCurrent
  ) {
    var touchBank = touchHistory.touchBank;
    var total = 0;
    var count = 0;

    var oneTouchData =
      touchHistory.numberActiveTouches === 1
        ? touchHistory.touchBank[touchHistory.indexOfSingleActiveTouch]
        : null;

    if (oneTouchData !== null) {
      if (
        oneTouchData.touchActive &&
        oneTouchData.currentTimeStamp > touchesChangedAfter
      ) {
        total +=
          ofCurrent && isXAxis
            ? oneTouchData.currentPageX
            : ofCurrent && !isXAxis
              ? oneTouchData.currentPageY
              : !ofCurrent && isXAxis
                ? oneTouchData.previousPageX
                : oneTouchData.previousPageY;
        count = 1;
      }
    } else {
      for (var i = 0; i < touchBank.length; i++) {
        var touchTrack = touchBank[i];
        if (
          touchTrack !== null &&
          touchTrack !== undefined &&
          touchTrack.touchActive &&
          touchTrack.currentTimeStamp >= touchesChangedAfter
        ) {
          var toAdd = void 0; // Yuck, program temporarily in invalid state.
          if (ofCurrent && isXAxis) {
            toAdd = touchTrack.currentPageX;
          } else if (ofCurrent && !isXAxis) {
            toAdd = touchTrack.currentPageY;
          } else if (!ofCurrent && isXAxis) {
            toAdd = touchTrack.previousPageX;
          } else {
            toAdd = touchTrack.previousPageY;
          }
          total += toAdd;
          count++;
        }
      }
    }
    return count > 0 ? total / count : TouchHistoryMath.noCentroid;
  },

  currentCentroidXOfTouchesChangedAfter: function(
    touchHistory,
    touchesChangedAfter
  ) {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      touchesChangedAfter,
      true, // isXAxis
      true
    );
  },

  currentCentroidYOfTouchesChangedAfter: function(
    touchHistory,
    touchesChangedAfter
  ) {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      touchesChangedAfter,
      false, // isXAxis
      true
    );
  },

  previousCentroidXOfTouchesChangedAfter: function(
    touchHistory,
    touchesChangedAfter
  ) {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      touchesChangedAfter,
      true, // isXAxis
      false
    );
  },

  previousCentroidYOfTouchesChangedAfter: function(
    touchHistory,
    touchesChangedAfter
  ) {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      touchesChangedAfter,
      false, // isXAxis
      false
    );
  },

  currentCentroidX: function(touchHistory) {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      0, // touchesChangedAfter
      true, // isXAxis
      true
    );
  },

  currentCentroidY: function(touchHistory) {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      0, // touchesChangedAfter
      false, // isXAxis
      true
    );
  },

  noCentroid: -1
};

// TODO: this is special because it gets imported during build.

var ReactVersion = "16.3.1";

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var objects = {};
var uniqueID = 1;
var emptyObject$2 = {};

var ReactNativePropRegistry = (function() {
  function ReactNativePropRegistry() {
    _classCallCheck(this, ReactNativePropRegistry);
  }

  ReactNativePropRegistry.register = function register(object) {
    var id = ++uniqueID;
    {
      Object.freeze(object);
    }
    objects[id] = object;
    return id;
  };

  ReactNativePropRegistry.getByID = function getByID(id) {
    if (!id) {
      // Used in the style={[condition && id]} pattern,
      // we want it to be a no-op when the value is false or null
      return emptyObject$2;
    }

    var object = objects[id];
    if (!object) {
      console.warn("Invalid style with id `" + id + "`. Skipping ...");
      return emptyObject$2;
    }
    return object;
  };

  return ReactNativePropRegistry;
})();

// Modules provided by RN:
var emptyObject$1 = {};

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

function defaultDiffer(prevProp, nextProp) {
  if (typeof nextProp !== "object" || nextProp === null) {
    // Scalars have already been checked for equality
    return true;
  } else {
    // For objects and arrays, the default diffing algorithm is a deep compare
    return deepDiffer(prevProp, nextProp);
  }
}

function resolveObject(idOrObject) {
  if (typeof idOrObject === "number") {
    return ReactNativePropRegistry.getByID(idOrObject);
  }
  return idOrObject;
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
    var obj = resolveObject(node);
    for (var propKey in removedKeys) {
      if (!removedKeys[propKey]) {
        continue;
      }
      var _nextProp = obj[propKey];
      if (_nextProp === undefined) {
        continue;
      }

      var attributeConfig = validAttributes[propKey];
      if (!attributeConfig) {
        continue; // not a valid native prop
      }

      if (typeof _nextProp === "function") {
        _nextProp = true;
      }
      if (typeof _nextProp === "undefined") {
        _nextProp = null;
      }

      if (typeof attributeConfig !== "object") {
        // case: !Object is the default case
        updatePayload[propKey] = _nextProp;
      } else if (
        typeof attributeConfig.diff === "function" ||
        typeof attributeConfig.process === "function"
      ) {
        // case: CustomAttributeConfiguration
        var nextValue =
          typeof attributeConfig.process === "function"
            ? attributeConfig.process(_nextProp)
            : _nextProp;
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
  var i = void 0;
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
    return diffProperties(
      updatePayload,
      resolveObject(prevProp),
      resolveObject(nextProp),
      validAttributes
    );
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
      updatePayload,
      // $FlowFixMe - We know that this is always an object when the input is.
      flattenStyle(prevProp),
      // $FlowFixMe - We know that this isn't an array because of above flow.
      resolveObject(nextProp),
      validAttributes
    );
  }

  return diffProperties(
    updatePayload,
    resolveObject(prevProp),
    // $FlowFixMe - We know that this is always an object when the input is.
    flattenStyle(nextProp),
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
    return addProperties(
      updatePayload,
      resolveObject(nextProp),
      validAttributes
    );
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
    return clearProperties(
      updatePayload,
      resolveObject(prevProp),
      validAttributes
    );
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
  var attributeConfig = void 0;
  var nextProp = void 0;
  var prevProp = void 0;

  for (var propKey in nextProps) {
    attributeConfig = validAttributes[propKey];
    if (!attributeConfig) {
      continue; // not a valid native prop
    }

    prevProp = prevProps[propKey];
    nextProp = nextProps[propKey];

    // functions are converted to booleans as markers that the associated
    // events should be sent from native.
    if (typeof nextProp === "function") {
      nextProp = true;
      // If nextProp is not a function, then don't bother changing prevProp
      // since nextProp will win and go into the updatePayload regardless.
      if (typeof prevProp === "function") {
        prevProp = true;
      }
    }

    // An explicit value of undefined is treated as a null because it overrides
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
    }

    // Pattern match on: attributeConfig
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
      removedKeyCount = 0;
      // We think that attributeConfig is not CustomAttributeConfiguration at
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
  }

  // Also iterate through all the previous props to catch any that have been
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
    }
    // Pattern match on: attributeConfig
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
  return diffProperties(updatePayload, emptyObject$1, props, validAttributes);
}

/**
 * clearProperties clears all the previous props by adding a null sentinel
 * to the payload for each valid key.
 */
function clearProperties(updatePayload, prevProps, validAttributes) {
  // TODO: Fast path
  return diffProperties(
    updatePayload,
    prevProps,
    emptyObject$1,
    validAttributes
  );
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

/**
 * In the future, we should cleanup callbacks by cancelling them instead of
 * using this.
 */
function mountSafeCallback(context, callback) {
  return function() {
    if (!callback) {
      return undefined;
    }
    if (typeof context.__isMounted === "boolean") {
      // TODO(gaearon): this is gross and should be removed.
      // It is currently necessary because View uses createClass,
      // and so any measure() calls on View (which are done by React
      // DevTools) trigger the isMounted() deprecation warning.
      if (!context.__isMounted) {
        return undefined;
      }
      // The else branch is important so that we don't
      // trigger the deprecation warning by calling isMounted.
    } else if (typeof context.isMounted === "function") {
      if (!context.isMounted()) {
        return undefined;
      }
    }
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

var ReactInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

var ReactCurrentOwner = ReactInternals.ReactCurrentOwner;
var ReactDebugCurrentFrame = ReactInternals.ReactDebugCurrentFrame;

function getComponentName(fiber) {
  var type = fiber.type;

  if (typeof type === "function") {
    return type.displayName || type.name;
  }
  if (typeof type === "string") {
    return type;
  }
  switch (type) {
    case REACT_FRAGMENT_TYPE:
      return "ReactFragment";
    case REACT_PORTAL_TYPE:
      return "ReactPortal";
    case REACT_CALL_TYPE:
      return "ReactCall";
    case REACT_RETURN_TYPE:
      return "ReactReturn";
  }
  return null;
}

// TODO: Share this module between Fabric and React Native renderers
// so that both can be used in the same tree.

var findHostInstance = function(fiber) {
  return null;
};

var findHostInstanceFabric = function(fiber) {
  return null;
};

function injectFindHostInstanceFabric(impl) {
  findHostInstanceFabric = impl;
}

/**
 * ReactNative vs ReactWeb
 * -----------------------
 * React treats some pieces of data opaquely. This means that the information
 * is first class (it can be passed around), but cannot be inspected. This
 * allows us to build infrastructure that reasons about resources, without
 * making assumptions about the nature of those resources, and this allows that
 * infra to be shared across multiple platforms, where the resources are very
 * different. General infra (such as `ReactMultiChild`) reasons opaquely about
 * the data, but platform specific code (such as `ReactNativeBaseComponent`) can
 * make assumptions about the data.
 *
 *
 * `rootNodeID`, uniquely identifies a position in the generated native view
 * tree. Many layers of composite components (created with `React.createClass`)
 * can all share the same `rootNodeID`.
 *
 * `nodeHandle`: A sufficiently unambiguous way to refer to a lower level
 * resource (dom node, native view etc). The `rootNodeID` is sufficient for web
 * `nodeHandle`s, because the position in a tree is always enough to uniquely
 * identify a DOM node (we never have nodes in some bank outside of the
 * document). The same would be true for `ReactNative`, but we must maintain a
 * mapping that we can send efficiently serializable
 * strings across native boundaries.
 *
 * Opaque name      TodaysWebReact   FutureWebWorkerReact   ReactNative
 * ----------------------------------------------------------------------------
 * nodeHandle       N/A              rootNodeID             tag
 */

// TODO (bvaughn) Rename the findNodeHandle module to something more descriptive
// eg findInternalHostInstance. This will reduce the likelihood of someone
// accidentally deep-requiring this version.
function findNodeHandle(componentOrHandle) {
  {
    var owner = ReactCurrentOwner.current;
    if (owner !== null && owner.stateNode !== null) {
      !owner.stateNode._warnedAboutRefsInRender
        ? warning(
            false,
            "%s is accessing findNodeHandle inside its render(). " +
              "render() should be a pure function of props and state. It should " +
              "never access something that requires stale data from the previous " +
              "render, such as refs. Move this logic to componentDidMount and " +
              "componentDidUpdate instead.",
            getComponentName(owner) || "A component"
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

  var component = componentOrHandle;

  // TODO (balpert): Wrap iOS native components in a composite wrapper, then
  // ReactInstanceMap.get here will always succeed for mounted components
  var internalInstance = get(component);
  if (internalInstance) {
    return (
      findHostInstance(internalInstance) ||
      findHostInstanceFabric(internalInstance)
    );
  } else {
    if (component) {
      return component;
    } else {
      invariant(
        // Native
        (typeof component === "object" && "_nativeTag" in component) ||
          // Composite
          (component.render != null && typeof component.render === "function"),
        "findNodeHandle(...): Argument is not a component " +
          "(type: %s, keys: %s)",
        typeof component,
        Object.keys(component)
      );
      invariant(
        false,
        "findNodeHandle(...): Unable to find node handle for unmounted " +
          "component."
      );
    }
  }
}

/**
 * External users of findNodeHandle() expect the host tag number return type.
 * The injected findNodeHandle() strategy returns the instance wrapper though.
 * See NativeMethodsMixin#setNativeProps for more info on why this is done.
 */
function findNumericNodeHandleFiber(componentOrHandle) {
  var instance = findNodeHandle(componentOrHandle);
  if (instance == null || typeof instance === "number") {
    return instance;
  }
  return instance._nativeTag;
}

// Modules provided by RN:
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
    UIManager.measure(
      findNumericNodeHandleFiber(this),
      mountSafeCallback(this, callback)
    );
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
    UIManager.measureInWindow(
      findNumericNodeHandleFiber(this),
      mountSafeCallback(this, callback)
    );
  },

  /**
   * Like [`measure()`](#measure), but measures the view relative an ancestor,
   * specified as `relativeToNativeNode`. This means that the returned x, y
   * are relative to the origin x, y of the ancestor view.
   *
   * As always, to obtain a native node handle for a component, you can use
   * `findNumericNodeHandle(component)`.
   */
  measureLayout: function(
    relativeToNativeNode,
    onSuccess,
    onFail /* currently unused */
  ) {
    UIManager.measureLayout(
      findNumericNodeHandleFiber(this),
      relativeToNativeNode,
      mountSafeCallback(this, onFail),
      mountSafeCallback(this, onSuccess)
    );
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
    // Use findNodeHandle() rather than findNumericNodeHandle() because
    // We want the instance/wrapper (not the native tag).
    var maybeInstance = void 0;

    // Fiber errors if findNodeHandle is called for an umounted component.
    // Tests using ReactTestRenderer will trigger this case indirectly.
    // Mimicking stack behavior, we should silently ignore this case.
    // TODO Fix ReactTestRenderer so we can remove this try/catch.
    try {
      maybeInstance = findNodeHandle(this);
    } catch (error) {}

    // If there is no host component beneath this we should fail silently.
    // This is not an error; it could mean a class component rendered null.
    if (maybeInstance == null) {
      return;
    }

    var viewConfig = maybeInstance.viewConfig;

    {
      warnForStyleProps(nativeProps, viewConfig.validAttributes);
    }

    var updatePayload = create(nativeProps, viewConfig.validAttributes);

    // Avoid the overhead of bridge calls if there's no update.
    // This is an expensive no-op for Android, and causes an unnecessary
    // view invalidation for certain components (eg RCTTextInput) on iOS.
    if (updatePayload != null) {
      UIManager.updateView(
        maybeInstance._nativeTag,
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
    TextInputState.focusTextInput(findNumericNodeHandleFiber(this));
  },

  /**
   * Removes focus from an input or view. This is the opposite of `focus()`.
   */
  blur: function() {
    TextInputState.blurTextInput(findNumericNodeHandleFiber(this));
  }
};

{
  // hide this from Flow since we can't define these properties outside of
  // true without actually implementing them (setting them to undefined
  // isn't allowed by ReactClass)
  var NativeMethodsMixin_DEV = NativeMethodsMixin;
  invariant(
    !NativeMethodsMixin_DEV.componentWillMount &&
      !NativeMethodsMixin_DEV.componentWillReceiveProps &&
      !NativeMethodsMixin_DEV.UNSAFE_componentWillMount &&
      !NativeMethodsMixin_DEV.UNSAFE_componentWillReceiveProps,
    "Do not override existing functions."
  );
  // TODO (bvaughn) Remove cWM and cWRP in a future version of React Native,
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
  NativeMethodsMixin_DEV.UNSAFE_componentWillReceiveProps = function(newProps) {
    throwOnStylesProp(this, newProps);
  };

  // React may warn about cWM/cWRP/cWU methods being deprecated.
  // Add a flag to suppress these warnings for this special case.
  // TODO (bvaughn) Remove this flag once the above methods have been removed.
  NativeMethodsMixin_DEV.componentWillMount.__suppressDeprecationWarning = true;
  NativeMethodsMixin_DEV.componentWillReceiveProps.__suppressDeprecationWarning = true;
}

function _classCallCheck$1(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return call && (typeof call === "object" || typeof call === "function")
    ? call
    : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError(
      "Super expression must either be null or a function, not " +
        typeof superClass
    );
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass)
    Object.setPrototypeOf
      ? Object.setPrototypeOf(subClass, superClass)
      : (subClass.__proto__ = superClass);
}

// Modules provided by RN:
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

var ReactNativeComponent = (function(_React$Component) {
  _inherits(ReactNativeComponent, _React$Component);

  function ReactNativeComponent() {
    _classCallCheck$1(this, ReactNativeComponent);

    return _possibleConstructorReturn(
      this,
      _React$Component.apply(this, arguments)
    );
  }

  /**
   * Removes focus. This is the opposite of `focus()`.
   */

  /**
   * Due to bugs in Flow's handling of React.createClass, some fields already
   * declared in the base class need to be redeclared below.
   */
  ReactNativeComponent.prototype.blur = function blur() {
    TextInputState.blurTextInput(findNumericNodeHandleFiber(this));
  };

  /**
   * Requests focus. The exact behavior depends on the platform and view.
   */

  ReactNativeComponent.prototype.focus = function focus() {
    TextInputState.focusTextInput(findNumericNodeHandleFiber(this));
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

  ReactNativeComponent.prototype.measure = function measure(callback) {
    UIManager.measure(
      findNumericNodeHandleFiber(this),
      mountSafeCallback(this, callback)
    );
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

  ReactNativeComponent.prototype.measureInWindow = function measureInWindow(
    callback
  ) {
    UIManager.measureInWindow(
      findNumericNodeHandleFiber(this),
      mountSafeCallback(this, callback)
    );
  };

  /**
   * Similar to [`measure()`](#measure), but the resulting location will be
   * relative to the supplied ancestor's location.
   *
   * Obtain a native node handle with `ReactNative.findNodeHandle(component)`.
   */

  ReactNativeComponent.prototype.measureLayout = function measureLayout(
    relativeToNativeNode,
    onSuccess,
    onFail /* currently unused */
  ) {
    UIManager.measureLayout(
      findNumericNodeHandleFiber(this),
      relativeToNativeNode,
      mountSafeCallback(this, onFail),
      mountSafeCallback(this, onSuccess)
    );
  };

  /**
   * This function sends props straight to native. They will not participate in
   * future diff process - this means that if you do not include them in the
   * next render, they will remain active (see [Direct
   * Manipulation](docs/direct-manipulation.html)).
   */

  ReactNativeComponent.prototype.setNativeProps = function setNativeProps(
    nativeProps
  ) {
    // Class components don't have viewConfig -> validateAttributes.
    // Nor does it make sense to set native props on a non-native component.
    // Instead, find the nearest host component and set props on it.
    // Use findNodeHandle() rather than ReactNative.findNodeHandle() because
    // We want the instance/wrapper (not the native tag).
    var maybeInstance = void 0;

    // Fiber errors if findNodeHandle is called for an umounted component.
    // Tests using ReactTestRenderer will trigger this case indirectly.
    // Mimicking stack behavior, we should silently ignore this case.
    // TODO Fix ReactTestRenderer so we can remove this try/catch.
    try {
      maybeInstance = findNodeHandle(this);
    } catch (error) {}

    // If there is no host component beneath this we should fail silently.
    // This is not an error; it could mean a class component rendered null.
    if (maybeInstance == null) {
      return;
    }

    var viewConfig =
      maybeInstance.viewConfig || maybeInstance.canonical.viewConfig;

    var updatePayload = create(nativeProps, viewConfig.validAttributes);

    // Avoid the overhead of bridge calls if there's no update.
    // This is an expensive no-op for Android, and causes an unnecessary
    // view invalidation for certain components (eg RCTTextInput) on iOS.
    if (updatePayload != null) {
      UIManager.updateView(
        maybeInstance._nativeTag,
        viewConfig.uiViewClassName,
        updatePayload
      );
    }
  };

  return ReactNativeComponent;
})(React.Component);

var hasNativePerformanceNow =
  typeof performance === "object" && typeof performance.now === "function";

var now = hasNativePerformanceNow
  ? function() {
      return performance.now();
    }
  : function() {
      return Date.now();
    };

var scheduledCallback = null;
var frameDeadline = 0;

var frameDeadlineObject = {
  timeRemaining: function() {
    return frameDeadline - now();
  },
  didTimeout: false
};

function setTimeoutCallback() {
  // TODO (bvaughn) Hard-coded 5ms unblocks initial async testing.
  // React API probably changing to boolean rather than time remaining.
  // Longer-term plan is to rewrite this using shared memory,
  // And just return the value of the bit as the boolean.
  frameDeadline = now() + 5;

  var callback = scheduledCallback;
  scheduledCallback = null;
  if (callback !== null) {
    callback(frameDeadlineObject);
  }
}

// RN has a poor polyfill for requestIdleCallback so we aren't using it.
// This implementation is only intended for short-term use anyway.
// We also don't implement cancel functionality b'c Fiber doesn't currently need it.
function scheduleDeferredCallback(callback) {
  // We assume only one callback is scheduled at a time b'c that's how Fiber works.
  scheduledCallback = callback;
  return setTimeout(setTimeoutCallback, 1);
}

function cancelDeferredCallback(callbackID) {
  scheduledCallback = null;
  clearTimeout(callbackID);
}

var viewConfigCallbacks = new Map();
var viewConfigs = new Map();

/**
 * Registers a native view/component by name.
 * A callback is provided to load the view config from UIManager.
 * The callback is deferred until the view is actually rendered.
 * This is done to avoid causing Prepack deopts.
 */
function register(name, callback) {
  invariant(
    !viewConfigCallbacks.has(name),
    "Tried to register two views with the same name %s",
    name
  );
  viewConfigCallbacks.set(name, callback);
  return name;
}

/**
 * Retrieves a config for the specified view.
 * If this is the first time the view has been used,
 * This configuration will be lazy-loaded from UIManager.
 */
function get$1(name) {
  var viewConfig = void 0;
  if (!viewConfigs.has(name)) {
    var callback = viewConfigCallbacks.get(name);
    invariant(
      typeof callback === "function",
      "View config not found for name %s",
      name
    );
    viewConfigCallbacks.set(name, null);
    viewConfig = callback();
    viewConfigs.set(name, viewConfig);
  } else {
    viewConfig = viewConfigs.get(name);
  }
  invariant(viewConfig, "View config not found for name %s", name);
  return viewConfig;
}

// Don't change these two values. They're used by React Dev Tools.
var NoEffect = /*              */ 0;
var PerformedWork = /*         */ 1;

// You can change the rest (and add more).
var Placement = /*             */ 2;
var Update = /*                */ 4;
var PlacementAndUpdate = /*    */ 6;
var Deletion = /*              */ 8;
var ContentReset = /*          */ 16;
var Callback = /*              */ 32;
var DidCapture = /*            */ 64;
var Ref = /*                   */ 128;
var ErrLog = /*                */ 256;
var Snapshot = /*              */ 2048;

// Union of all host effects
var HostEffectMask = /*        */ 2559;

var Incomplete = /*            */ 512;
var ShouldCapture = /*         */ 1024;

var MOUNTING = 1;
var MOUNTED = 2;
var UNMOUNTED = 3;

function isFiberMountedImpl(fiber) {
  var node = fiber;
  if (!fiber.alternate) {
    // If there is no alternate, this might be a new tree that isn't inserted
    // yet. If it is, then it will have a pending insertion effect on it.
    if ((node.effectTag & Placement) !== NoEffect) {
      return MOUNTING;
    }
    while (node["return"]) {
      node = node["return"];
      if ((node.effectTag & Placement) !== NoEffect) {
        return MOUNTING;
      }
    }
  } else {
    while (node["return"]) {
      node = node["return"];
    }
  }
  if (node.tag === HostRoot) {
    // TODO: Check if this was a nested HostRoot when used with
    // renderContainerIntoSubtree.
    return MOUNTED;
  }
  // If we didn't hit the root, that means that we're in an disconnected tree
  // that has been unmounted.
  return UNMOUNTED;
}

function isFiberMounted(fiber) {
  return isFiberMountedImpl(fiber) === MOUNTED;
}

function isMounted(component) {
  {
    var owner = ReactCurrentOwner.current;
    if (owner !== null && owner.tag === ClassComponent) {
      var ownerFiber = owner;
      var instance = ownerFiber.stateNode;
      !instance._warnedAboutRefsInRender
        ? warning(
            false,
            "%s is accessing isMounted inside its render() function. " +
              "render() should be a pure function of props and state. It should " +
              "never access something that requires stale data from the previous " +
              "render, such as refs. Move this logic to componentDidMount and " +
              "componentDidUpdate instead.",
            getComponentName(ownerFiber) || "A component"
          )
        : void 0;
      instance._warnedAboutRefsInRender = true;
    }
  }

  var fiber = get(component);
  if (!fiber) {
    return false;
  }
  return isFiberMountedImpl(fiber) === MOUNTED;
}

function assertIsMounted(fiber) {
  invariant(
    isFiberMountedImpl(fiber) === MOUNTED,
    "Unable to find node on an unmounted component."
  );
}

function findCurrentFiberUsingSlowPath(fiber) {
  var alternate = fiber.alternate;
  if (!alternate) {
    // If there is no alternate, then we only need to check if it is mounted.
    var state = isFiberMountedImpl(fiber);
    invariant(
      state !== UNMOUNTED,
      "Unable to find node on an unmounted component."
    );
    if (state === MOUNTING) {
      return null;
    }
    return fiber;
  }
  // If we have two possible branches, we'll walk backwards up to the root
  // to see what path the root points to. On the way we may hit one of the
  // special cases and we'll deal with them.
  var a = fiber;
  var b = alternate;
  while (true) {
    var parentA = a["return"];
    var parentB = parentA ? parentA.alternate : null;
    if (!parentA || !parentB) {
      // We're at the root.
      break;
    }

    // If both copies of the parent fiber point to the same child, we can
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
      }
      // We should never have an alternate for any mounting node. So the only
      // way this could possibly happen is if this was unmounted, if at all.
      invariant(false, "Unable to find node on an unmounted component.");
    }

    if (a["return"] !== b["return"]) {
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
        invariant(
          didFindChild,
          "Child was not found in either parent set. This indicates a bug " +
            "in React related to the return pointer. Please file an issue."
        );
      }
    }

    invariant(
      a.alternate === b,
      "Return fibers should always be each others' alternates. " +
        "This error is likely caused by a bug in React. Please file an issue."
    );
  }
  // If the root is not a host container, we're in a disconnected tree. I.e.
  // unmounted.
  invariant(
    a.tag === HostRoot,
    "Unable to find node on an unmounted component."
  );
  if (a.stateNode.current === a) {
    // We've determined that A is the current branch.
    return fiber;
  }
  // Otherwise B has to be current branch.
  return alternate;
}

function findCurrentHostFiber(parent) {
  var currentParent = findCurrentFiberUsingSlowPath(parent);
  if (!currentParent) {
    return null;
  }

  // Next we'll drill down this component to find the first HostComponent/Text.
  var node = currentParent;
  while (true) {
    if (node.tag === HostComponent || node.tag === HostText) {
      return node;
    } else if (node.child) {
      node.child["return"] = node;
      node = node.child;
      continue;
    }
    if (node === currentParent) {
      return null;
    }
    while (!node.sibling) {
      if (!node["return"] || node["return"] === currentParent) {
        return null;
      }
      node = node["return"];
    }
    node.sibling["return"] = node["return"];
    node = node.sibling;
  }
  // Flow needs the return null here, but ESLint complains about it.
  // eslint-disable-next-line no-unreachable
  return null;
}

function findCurrentHostFiberWithNoPortals(parent) {
  var currentParent = findCurrentFiberUsingSlowPath(parent);
  if (!currentParent) {
    return null;
  }

  // Next we'll drill down this component to find the first HostComponent/Text.
  var node = currentParent;
  while (true) {
    if (node.tag === HostComponent || node.tag === HostText) {
      return node;
    } else if (node.child && node.tag !== HostPortal) {
      node.child["return"] = node;
      node = node.child;
      continue;
    }
    if (node === currentParent) {
      return null;
    }
    while (!node.sibling) {
      if (!node["return"] || node["return"] === currentParent) {
        return null;
      }
      node = node["return"];
    }
    node.sibling["return"] = node["return"];
    node = node.sibling;
  }
  // Flow needs the return null here, but ESLint complains about it.
  // eslint-disable-next-line no-unreachable
  return null;
}

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
var MAX_SIGNED_31_BIT_INT = 1073741823;

// TODO: Use an opaque type once ESLint et al support the syntax

var NoWork = 0;
var Sync = 1;
var Never = MAX_SIGNED_31_BIT_INT;

var UNIT_SIZE = 10;
var MAGIC_NUMBER_OFFSET = 2;

// 1 unit of expiration time represents 10ms.
function msToExpirationTime(ms) {
  // Always add an offset so that we don't clash with the magic number for NoWork.
  return ((ms / UNIT_SIZE) | 0) + MAGIC_NUMBER_OFFSET;
}

function expirationTimeToMs(expirationTime) {
  return (expirationTime - MAGIC_NUMBER_OFFSET) * UNIT_SIZE;
}

function ceiling(num, precision) {
  return (((num / precision) | 0) + 1) * precision;
}

function computeExpirationBucket(currentTime, expirationInMs, bucketSizeMs) {
  return ceiling(
    currentTime + expirationInMs / UNIT_SIZE,
    bucketSizeMs / UNIT_SIZE
  );
}

var NoContext = 0;
var AsyncMode = 1;
var StrictMode = 2;

var hasBadMapPolyfill = void 0;

{
  hasBadMapPolyfill = false;
  try {
    var nonExtensibleObject = Object.preventExtensions({});
    var testMap = new Map([[nonExtensibleObject, null]]);
    var testSet = new Set([nonExtensibleObject]);
    // This is necessary for Rollup to not consider these unused.
    // https://github.com/rollup/rollup/issues/1771
    // TODO: we can remove these if Rollup fixes the bug.
    testMap.set(0, 0);
    testSet.add(0);
  } catch (e) {
    // TODO: Consider warning about bad polyfills
    hasBadMapPolyfill = true;
  }
}

// A Fiber is work on a Component that needs to be done or was done. There can
// be more than one per component.

var debugCounter = void 0;

{
  debugCounter = 1;
}

function FiberNode(tag, pendingProps, key, mode) {
  // Instance
  this.tag = tag;
  this.key = key;
  this.type = null;
  this.stateNode = null;

  // Fiber
  this["return"] = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.ref = null;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;

  this.mode = mode;

  // Effects
  this.effectTag = NoEffect;
  this.nextEffect = null;

  this.firstEffect = null;
  this.lastEffect = null;

  this.expirationTime = NoWork;

  this.alternate = null;

  {
    this._debugID = debugCounter++;
    this._debugSource = null;
    this._debugOwner = null;
    this._debugIsCurrentlyTiming = false;
    if (!hasBadMapPolyfill && typeof Object.preventExtensions === "function") {
      Object.preventExtensions(this);
    }
  }
}

// This is a constructor function, rather than a POJO constructor, still
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
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

// This is used to create an alternate fiber to do work on.
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
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    {
      // DEV-only fields
      workInProgress._debugID = current._debugID;
      workInProgress._debugSource = current._debugSource;
      workInProgress._debugOwner = current._debugOwner;
    }

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;

    // We already have an alternate.
    // Reset the effect tag.
    workInProgress.effectTag = NoEffect;

    // The effect list is no longer valid.
    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }

  workInProgress.expirationTime = expirationTime;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  // These will be overridden during the parent's reconciliation
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;

  return workInProgress;
}

function createHostRootFiber(isAsync) {
  var mode = isAsync ? AsyncMode | StrictMode : NoContext;
  return createFiber(HostRoot, null, null, mode);
}

function createFiberFromElement(element, mode, expirationTime) {
  var owner = null;
  {
    owner = element._owner;
  }

  var fiber = void 0;
  var type = element.type;
  var key = element.key;
  var pendingProps = element.props;

  var fiberTag = void 0;
  if (typeof type === "function") {
    fiberTag = shouldConstruct(type) ? ClassComponent : IndeterminateComponent;
  } else if (typeof type === "string") {
    fiberTag = HostComponent;
  } else {
    switch (type) {
      case REACT_FRAGMENT_TYPE:
        return createFiberFromFragment(
          pendingProps.children,
          mode,
          expirationTime,
          key
        );
      case REACT_ASYNC_MODE_TYPE:
        fiberTag = Mode;
        mode |= AsyncMode | StrictMode;
        break;
      case REACT_STRICT_MODE_TYPE:
        fiberTag = Mode;
        mode |= StrictMode;
        break;
      case REACT_CALL_TYPE:
        fiberTag = CallComponent;
        break;
      case REACT_RETURN_TYPE:
        fiberTag = ReturnComponent;
        break;
      default: {
        if (typeof type === "object" && type !== null) {
          switch (type.$$typeof) {
            case REACT_PROVIDER_TYPE:
              fiberTag = ContextProvider;
              break;
            case REACT_CONTEXT_TYPE:
              // This is a consumer
              fiberTag = ContextConsumer;
              break;
            case REACT_FORWARD_REF_TYPE:
              fiberTag = ForwardRef;
              break;
            default:
              if (typeof type.tag === "number") {
                // Currently assumed to be a continuation and therefore is a
                // fiber already.
                // TODO: The yield system is currently broken for updates in
                // some cases. The reified yield stores a fiber, but we don't
                // know which fiber that is; the current or a workInProgress?
                // When the continuation gets rendered here we don't know if we
                // can reuse that fiber or if we need to clone it. There is
                // probably a clever way to restructure this.
                fiber = type;
                fiber.pendingProps = pendingProps;
                fiber.expirationTime = expirationTime;
                return fiber;
              } else {
                throwOnInvalidElementType(type, owner);
              }
              break;
          }
        } else {
          throwOnInvalidElementType(type, owner);
        }
      }
    }
  }

  fiber = createFiber(fiberTag, pendingProps, key, mode);
  fiber.type = type;
  fiber.expirationTime = expirationTime;

  {
    fiber._debugSource = element._source;
    fiber._debugOwner = element._owner;
  }

  return fiber;
}

function throwOnInvalidElementType(type, owner) {
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
    var ownerName = owner ? getComponentName(owner) : null;
    if (ownerName) {
      info += "\n\nCheck the render method of `" + ownerName + "`.";
    }
  }
  invariant(
    false,
    "Element type is invalid: expected a string (for built-in " +
      "components) or a class/function (for composite components) " +
      "but got: %s.%s",
    type == null ? type : typeof type,
    info
  );
}

function createFiberFromFragment(elements, mode, expirationTime, key) {
  var fiber = createFiber(Fragment, elements, key, mode);
  fiber.expirationTime = expirationTime;
  return fiber;
}

function createFiberFromText(content, mode, expirationTime) {
  var fiber = createFiber(HostText, content, null, mode);
  fiber.expirationTime = expirationTime;
  return fiber;
}

function createFiberFromHostInstanceForDeletion() {
  var fiber = createFiber(HostComponent, null, null, NoContext);
  fiber.type = "DELETED";
  return fiber;
}

function createFiberFromPortal(portal, mode, expirationTime) {
  var pendingProps = portal.children !== null ? portal.children : [];
  var fiber = createFiber(HostPortal, pendingProps, portal.key, mode);
  fiber.expirationTime = expirationTime;
  fiber.stateNode = {
    containerInfo: portal.containerInfo,
    pendingChildren: null, // Used by persistent updates
    implementation: portal.implementation
  };
  return fiber;
}

// Used for stashing WIP properties to replay failed work in DEV.
function assignFiberPropertiesInDEV(target, source) {
  if (target === null) {
    // This Fiber's initial properties will always be overwritten.
    // We only use a Fiber to ensure the same hidden class so DEV isn't slow.
    target = createFiber(IndeterminateComponent, null, null, NoContext);
  }

  // This is intentionally written as a list of all properties.
  // We tried to use Object.assign() instead but this is called in
  // the hottest path, and Object.assign() was too slow:
  // https://github.com/facebook/react/issues/12502
  // This code is DEV-only so size is not a concern.

  target.tag = source.tag;
  target.key = source.key;
  target.type = source.type;
  target.stateNode = source.stateNode;
  target["return"] = source["return"];
  target.child = source.child;
  target.sibling = source.sibling;
  target.index = source.index;
  target.ref = source.ref;
  target.pendingProps = source.pendingProps;
  target.memoizedProps = source.memoizedProps;
  target.updateQueue = source.updateQueue;
  target.memoizedState = source.memoizedState;
  target.mode = source.mode;
  target.effectTag = source.effectTag;
  target.nextEffect = source.nextEffect;
  target.firstEffect = source.firstEffect;
  target.lastEffect = source.lastEffect;
  target.expirationTime = source.expirationTime;
  target.alternate = source.alternate;
  target._debugID = source._debugID;
  target._debugSource = source._debugSource;
  target._debugOwner = source._debugOwner;
  target._debugIsCurrentlyTiming = source._debugIsCurrentlyTiming;
  return target;
}

// TODO: This should be lifted into the renderer.

function createFiberRoot(containerInfo, isAsync, hydrate) {
  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.
  var uninitializedFiber = createHostRootFiber(isAsync);
  var root = {
    current: uninitializedFiber,
    containerInfo: containerInfo,
    pendingChildren: null,
    pendingCommitExpirationTime: NoWork,
    finishedWork: null,
    context: null,
    pendingContext: null,
    hydrate: hydrate,
    remainingExpirationTime: NoWork,
    firstBatch: null,
    nextScheduledRoot: null
  };
  uninitializedFiber.stateNode = root;
  return root;
}

var onCommitFiberRoot = null;
var onCommitFiberUnmount = null;
var hasLoggedError = false;

function catchErrors(fn) {
  return function(arg) {
    try {
      return fn(arg);
    } catch (err) {
      if (true && !hasLoggedError) {
        hasLoggedError = true;
        warning(false, "React DevTools encountered an error: %s", err);
      }
    }
  };
}

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
      warning(
        false,
        "The installed version of React DevTools is too old and will not work " +
          "with the current version of React. Please update React DevTools. " +
          "https://fb.me/react-devtools"
      );
    }
    // DevTools exists, even though it doesn't support Fiber.
    return true;
  }
  try {
    var rendererID = hook.inject(internals);
    // We have successfully injected, so now it is safe to set up hooks.
    onCommitFiberRoot = catchErrors(function(root) {
      return hook.onCommitFiberRoot(rendererID, root);
    });
    onCommitFiberUnmount = catchErrors(function(fiber) {
      return hook.onCommitFiberUnmount(rendererID, fiber);
    });
  } catch (err) {
    // Catch all errors because it is unsafe to throw during initialization.
    {
      warning(false, "React DevTools encountered an error: %s.", err);
    }
  }
  // DevTools exists
  return true;
}

function onCommitRoot(root) {
  if (typeof onCommitFiberRoot === "function") {
    onCommitFiberRoot(root);
  }
}

function onCommitUnmount(fiber) {
  if (typeof onCommitFiberUnmount === "function") {
    onCommitFiberUnmount(fiber);
  }
}

var describeComponentFrame = function(name, source, ownerName) {
  return (
    "\n    in " +
    (name || "Unknown") +
    (source
      ? " (at " +
        source.fileName.replace(/^.*[\\\/]/, "") +
        ":" +
        source.lineNumber +
        ")"
      : ownerName ? " (created by " + ownerName + ")" : "")
  );
};

function describeFiber(fiber) {
  switch (fiber.tag) {
    case IndeterminateComponent:
    case FunctionalComponent:
    case ClassComponent:
    case HostComponent:
      var owner = fiber._debugOwner;
      var source = fiber._debugSource;
      var name = getComponentName(fiber);
      var ownerName = null;
      if (owner) {
        ownerName = getComponentName(owner);
      }
      return describeComponentFrame(name, source, ownerName);
    default:
      return "";
  }
}

// This function can only be called with a work-in-progress fiber and
// only during begin or complete phase. Do not call it under any other
// circumstances.
function getStackAddendumByWorkInProgressFiber(workInProgress) {
  var info = "";
  var node = workInProgress;
  do {
    info += describeFiber(node);
    // Otherwise this return pointer might point to the wrong tree:
    node = node["return"];
  } while (node);
  return info;
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

var lowPriorityWarning = function() {};

{
  var printWarning = function(format) {
    for (
      var _len = arguments.length,
        args = Array(_len > 1 ? _len - 1 : 0),
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

  lowPriorityWarning = function(condition, format) {
    if (format === undefined) {
      throw new Error(
        "`warning(condition, format, ...args)` requires a warning " +
          "message argument"
      );
    }
    if (!condition) {
      for (
        var _len2 = arguments.length,
          args = Array(_len2 > 2 ? _len2 - 2 : 0),
          _key2 = 2;
        _key2 < _len2;
        _key2++
      ) {
        args[_key2 - 2] = arguments[_key2];
      }

      printWarning.apply(undefined, [format].concat(args));
    }
  };
}

var lowPriorityWarning$1 = lowPriorityWarning;

var ReactStrictModeWarnings = {
  discardPendingWarnings: function() {},
  flushPendingDeprecationWarnings: function() {},
  flushPendingUnsafeLifecycleWarnings: function() {},
  recordDeprecationWarnings: function(fiber, instance) {},
  recordUnsafeLifecycleWarnings: function(fiber, instance) {}
};

{
  var LIFECYCLE_SUGGESTIONS = {
    UNSAFE_componentWillMount: "componentDidMount",
    UNSAFE_componentWillReceiveProps: "static getDerivedStateFromProps",
    UNSAFE_componentWillUpdate: "componentDidUpdate"
  };

  var pendingComponentWillMountWarnings = [];
  var pendingComponentWillReceivePropsWarnings = [];
  var pendingComponentWillUpdateWarnings = [];
  var pendingUnsafeLifecycleWarnings = new Map();

  // Tracks components we have already warned about.
  var didWarnAboutDeprecatedLifecycles = new Set();
  var didWarnAboutUnsafeLifecycles = new Set();

  ReactStrictModeWarnings.discardPendingWarnings = function() {
    pendingComponentWillMountWarnings = [];
    pendingComponentWillReceivePropsWarnings = [];
    pendingComponentWillUpdateWarnings = [];
    pendingUnsafeLifecycleWarnings = new Map();
  };

  ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings = function() {
    pendingUnsafeLifecycleWarnings.forEach(function(
      lifecycleWarningsMap,
      strictRoot
    ) {
      var lifecyclesWarningMesages = [];

      Object.keys(lifecycleWarningsMap).forEach(function(lifecycle) {
        var lifecycleWarnings = lifecycleWarningsMap[lifecycle];
        if (lifecycleWarnings.length > 0) {
          var componentNames = new Set();
          lifecycleWarnings.forEach(function(fiber) {
            componentNames.add(getComponentName(fiber) || "Component");
            didWarnAboutUnsafeLifecycles.add(fiber.type);
          });

          var formatted = lifecycle.replace("UNSAFE_", "");
          var suggestion = LIFECYCLE_SUGGESTIONS[lifecycle];
          var sortedComponentNames = Array.from(componentNames)
            .sort()
            .join(", ");

          lifecyclesWarningMesages.push(
            formatted +
              ": Please update the following components to use " +
              (suggestion + " instead: " + sortedComponentNames)
          );
        }
      });

      if (lifecyclesWarningMesages.length > 0) {
        var strictRootComponentStack = getStackAddendumByWorkInProgressFiber(
          strictRoot
        );

        warning(
          false,
          "Unsafe lifecycle methods were found within a strict-mode tree:%s" +
            "\n\n%s" +
            "\n\nLearn more about this warning here:" +
            "\nhttps://fb.me/react-strict-mode-warnings",
          strictRootComponentStack,
          lifecyclesWarningMesages.join("\n\n")
        );
      }
    });

    pendingUnsafeLifecycleWarnings = new Map();
  };

  var getStrictRoot = function(fiber) {
    var maybeStrictRoot = null;

    while (fiber !== null) {
      if (fiber.mode & StrictMode) {
        maybeStrictRoot = fiber;
      }

      fiber = fiber["return"];
    }

    return maybeStrictRoot;
  };

  ReactStrictModeWarnings.flushPendingDeprecationWarnings = function() {
    if (pendingComponentWillMountWarnings.length > 0) {
      var uniqueNames = new Set();
      pendingComponentWillMountWarnings.forEach(function(fiber) {
        uniqueNames.add(getComponentName(fiber) || "Component");
        didWarnAboutDeprecatedLifecycles.add(fiber.type);
      });

      var sortedNames = Array.from(uniqueNames)
        .sort()
        .join(", ");

      lowPriorityWarning$1(
        false,
        "componentWillMount is deprecated and will be removed in the next major version. " +
          "Use componentDidMount instead. As a temporary workaround, " +
          "you can rename to UNSAFE_componentWillMount." +
          "\n\nPlease update the following components: %s" +
          "\n\nLearn more about this warning here:" +
          "\nhttps://fb.me/react-async-component-lifecycle-hooks",
        sortedNames
      );

      pendingComponentWillMountWarnings = [];
    }

    if (pendingComponentWillReceivePropsWarnings.length > 0) {
      var _uniqueNames = new Set();
      pendingComponentWillReceivePropsWarnings.forEach(function(fiber) {
        _uniqueNames.add(getComponentName(fiber) || "Component");
        didWarnAboutDeprecatedLifecycles.add(fiber.type);
      });

      var _sortedNames = Array.from(_uniqueNames)
        .sort()
        .join(", ");

      lowPriorityWarning$1(
        false,
        "componentWillReceiveProps is deprecated and will be removed in the next major version. " +
          "Use static getDerivedStateFromProps instead." +
          "\n\nPlease update the following components: %s" +
          "\n\nLearn more about this warning here:" +
          "\nhttps://fb.me/react-async-component-lifecycle-hooks",
        _sortedNames
      );

      pendingComponentWillReceivePropsWarnings = [];
    }

    if (pendingComponentWillUpdateWarnings.length > 0) {
      var _uniqueNames2 = new Set();
      pendingComponentWillUpdateWarnings.forEach(function(fiber) {
        _uniqueNames2.add(getComponentName(fiber) || "Component");
        didWarnAboutDeprecatedLifecycles.add(fiber.type);
      });

      var _sortedNames2 = Array.from(_uniqueNames2)
        .sort()
        .join(", ");

      lowPriorityWarning$1(
        false,
        "componentWillUpdate is deprecated and will be removed in the next major version. " +
          "Use componentDidUpdate instead. As a temporary workaround, " +
          "you can rename to UNSAFE_componentWillUpdate." +
          "\n\nPlease update the following components: %s" +
          "\n\nLearn more about this warning here:" +
          "\nhttps://fb.me/react-async-component-lifecycle-hooks",
        _sortedNames2
      );

      pendingComponentWillUpdateWarnings = [];
    }
  };

  ReactStrictModeWarnings.recordDeprecationWarnings = function(
    fiber,
    instance
  ) {
    // Dedup strategy: Warn once per component.
    if (didWarnAboutDeprecatedLifecycles.has(fiber.type)) {
      return;
    }

    // Don't warn about react-lifecycles-compat polyfilled components.
    if (
      typeof instance.componentWillMount === "function" &&
      instance.componentWillMount.__suppressDeprecationWarning !== true
    ) {
      pendingComponentWillMountWarnings.push(fiber);
    }
    if (
      typeof instance.componentWillReceiveProps === "function" &&
      instance.componentWillReceiveProps.__suppressDeprecationWarning !== true
    ) {
      pendingComponentWillReceivePropsWarnings.push(fiber);
    }
    if (
      typeof instance.componentWillUpdate === "function" &&
      instance.componentWillUpdate.__suppressDeprecationWarning !== true
    ) {
      pendingComponentWillUpdateWarnings.push(fiber);
    }
  };

  ReactStrictModeWarnings.recordUnsafeLifecycleWarnings = function(
    fiber,
    instance
  ) {
    var strictRoot = getStrictRoot(fiber);

    // Dedup strategy: Warn once per component.
    // This is difficult to track any other way since component names
    // are often vague and are likely to collide between 3rd party libraries.
    // An expand property is probably okay to use here since it's DEV-only,
    // and will only be set in the event of serious warnings.
    if (didWarnAboutUnsafeLifecycles.has(fiber.type)) {
      return;
    }

    // Don't warn about react-lifecycles-compat polyfilled components.
    // Note that it is sufficient to check for the presence of a
    // single lifecycle, componentWillMount, with the polyfill flag.
    if (
      typeof instance.componentWillMount === "function" &&
      instance.componentWillMount.__suppressDeprecationWarning === true
    ) {
      return;
    }

    var warningsForRoot = void 0;
    if (!pendingUnsafeLifecycleWarnings.has(strictRoot)) {
      warningsForRoot = {
        UNSAFE_componentWillMount: [],
        UNSAFE_componentWillReceiveProps: [],
        UNSAFE_componentWillUpdate: []
      };

      pendingUnsafeLifecycleWarnings.set(strictRoot, warningsForRoot);
    } else {
      warningsForRoot = pendingUnsafeLifecycleWarnings.get(strictRoot);
    }

    var unsafeLifecycles = [];
    if (
      typeof instance.componentWillMount === "function" ||
      typeof instance.UNSAFE_componentWillMount === "function"
    ) {
      unsafeLifecycles.push("UNSAFE_componentWillMount");
    }
    if (
      typeof instance.componentWillReceiveProps === "function" ||
      typeof instance.UNSAFE_componentWillReceiveProps === "function"
    ) {
      unsafeLifecycles.push("UNSAFE_componentWillReceiveProps");
    }
    if (
      typeof instance.componentWillUpdate === "function" ||
      typeof instance.UNSAFE_componentWillUpdate === "function"
    ) {
      unsafeLifecycles.push("UNSAFE_componentWillUpdate");
    }

    if (unsafeLifecycles.length > 0) {
      unsafeLifecycles.forEach(function(lifecycle) {
        warningsForRoot[lifecycle].push(fiber);
      });
    }
  };
}

var debugRenderPhaseSideEffects = false;
var debugRenderPhaseSideEffectsForStrictMode = false;
var enableUserTimingAPI = true;
var enableGetDerivedStateFromCatch = false;
var warnAboutDeprecatedLifecycles = false;
var replayFailedUnitOfWorkWithInvokeGuardedCallback = true;

// React Fabric uses persistent reconciler.
var enableMutatingReconciler = false;
var enableNoopReconciler = false;
var enablePersistentReconciler = true;

// Only used in www builds.

function getCurrentFiberOwnerName() {
  {
    var fiber = ReactDebugCurrentFiber.current;
    if (fiber === null) {
      return null;
    }
    var owner = fiber._debugOwner;
    if (owner !== null && typeof owner !== "undefined") {
      return getComponentName(owner);
    }
  }
  return null;
}

function getCurrentFiberStackAddendum() {
  {
    var fiber = ReactDebugCurrentFiber.current;
    if (fiber === null) {
      return null;
    }
    // Safe because if current fiber exists, we are reconciling,
    // and it is guaranteed to be the work-in-progress version.
    return getStackAddendumByWorkInProgressFiber(fiber);
  }
  return null;
}

function resetCurrentFiber() {
  ReactDebugCurrentFrame.getCurrentStack = null;
  ReactDebugCurrentFiber.current = null;
  ReactDebugCurrentFiber.phase = null;
}

function setCurrentFiber(fiber) {
  ReactDebugCurrentFrame.getCurrentStack = getCurrentFiberStackAddendum;
  ReactDebugCurrentFiber.current = fiber;
  ReactDebugCurrentFiber.phase = null;
}

function setCurrentPhase(phase) {
  ReactDebugCurrentFiber.phase = phase;
}

var ReactDebugCurrentFiber = {
  current: null,
  phase: null,
  resetCurrentFiber: resetCurrentFiber,
  setCurrentFiber: setCurrentFiber,
  setCurrentPhase: setCurrentPhase,
  getCurrentFiberOwnerName: getCurrentFiberOwnerName,
  getCurrentFiberStackAddendum: getCurrentFiberStackAddendum
};

// Prefix measurements so that it's possible to filter them.
// Longer prefixes are hard to read in DevTools.
var reactEmoji = "\u269B";
var warningEmoji = "\u26D4";
var supportsUserTiming =
  typeof performance !== "undefined" &&
  typeof performance.mark === "function" &&
  typeof performance.clearMarks === "function" &&
  typeof performance.measure === "function" &&
  typeof performance.clearMeasures === "function";

// Keep track of current fiber so that we know the path to unwind on pause.
// TODO: this looks the same as nextUnitOfWork in scheduler. Can we unify them?
var currentFiber = null;
// If we're in the middle of user code, which fiber and method is it?
// Reusing `currentFiber` would be confusing for this because user code fiber
// can change during commit phase too, but we don't need to unwind it (since
// lifecycles in the commit phase don't resemble a tree).
var currentPhase = null;
var currentPhaseFiber = null;
// Did lifecycle hook schedule an update? This is often a performance problem,
// so we will keep track of it, and include it in the report.
// Track commits caused by cascading updates.
var isCommitting = false;
var hasScheduledUpdateInCurrentCommit = false;
var hasScheduledUpdateInCurrentPhase = false;
var commitCountInCurrentWorkLoop = 0;
var effectCountInCurrentCommit = 0;
var isWaitingForCallback = false;
// During commits, we only show a measurement once per method name
// to avoid stretch the commit phase with measurement overhead.
var labelsInCurrentCommit = new Set();

var formatMarkName = function(markName) {
  return reactEmoji + " " + markName;
};

var formatLabel = function(label, warning$$1) {
  var prefix = warning$$1 ? warningEmoji + " " : reactEmoji + " ";
  var suffix = warning$$1 ? " Warning: " + warning$$1 : "";
  return "" + prefix + label + suffix;
};

var beginMark = function(markName) {
  performance.mark(formatMarkName(markName));
};

var clearMark = function(markName) {
  performance.clearMarks(formatMarkName(markName));
};

var endMark = function(label, markName, warning$$1) {
  var formattedMarkName = formatMarkName(markName);
  var formattedLabel = formatLabel(label, warning$$1);
  try {
    performance.measure(formattedLabel, formattedMarkName);
  } catch (err) {}
  // If previous mark was missing for some reason, this will throw.
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
  var componentName = getComponentName(fiber) || "Unknown";
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
  var componentName = getComponentName(fiber) || "Unknown";
  var debugID = fiber._debugID;
  var isMounted = fiber.alternate !== null;
  var label = getFiberLabel(componentName, isMounted, phase);
  var markName = getFiberMarkName(label, debugID);
  clearMark(markName);
};

var endFiberMark = function(fiber, phase, warning$$1) {
  var componentName = getComponentName(fiber) || "Unknown";
  var debugID = fiber._debugID;
  var isMounted = fiber.alternate !== null;
  var label = getFiberLabel(componentName, isMounted, phase);
  var markName = getFiberMarkName(label, debugID);
  endMark(label, markName, warning$$1);
};

var shouldIgnoreFiber = function(fiber) {
  // Host components should be skipped in the timeline.
  // We could check typeof fiber.type, but does this work with RN?
  switch (fiber.tag) {
    case HostRoot:
    case HostComponent:
    case HostText:
    case HostPortal:
    case CallComponent:
    case ReturnComponent:
    case Fragment:
    case ContextProvider:
    case ContextConsumer:
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
    fiber = fiber["return"];
  }
};

var resumeTimersRecursively = function(fiber) {
  if (fiber["return"] !== null) {
    resumeTimersRecursively(fiber["return"]);
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

function startRequestCallbackTimer() {
  if (enableUserTimingAPI) {
    if (supportsUserTiming && !isWaitingForCallback) {
      isWaitingForCallback = true;
      beginMark("(Waiting for async callback...)");
    }
  }
}

function stopRequestCallbackTimer(didExpire, expirationTime) {
  if (enableUserTimingAPI) {
    if (supportsUserTiming) {
      isWaitingForCallback = false;
      var warning$$1 = didExpire ? "React was blocked by main thread" : null;
      endMark(
        "(Waiting for async callback... will force flush in " +
          expirationTime +
          " ms)",
        "(Waiting for async callback...)",
        warning$$1
      );
    }
  }
}

function startWorkTimer(fiber) {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming || shouldIgnoreFiber(fiber)) {
      return;
    }
    // If we pause, this is the fiber to unwind from.
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
    }
    // Remember we shouldn't complete measurement for this fiber.
    // Otherwise flamechart will be deep even for small updates.
    fiber._debugIsCurrentlyTiming = false;
    clearFiberMark(fiber, null);
  }
}

function stopWorkTimer(fiber) {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming || shouldIgnoreFiber(fiber)) {
      return;
    }
    // If we pause, its parent is the fiber to unwind from.
    currentFiber = fiber["return"];
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
    }
    // If we pause, its parent is the fiber to unwind from.
    currentFiber = fiber["return"];
    if (!fiber._debugIsCurrentlyTiming) {
      return;
    }
    fiber._debugIsCurrentlyTiming = false;
    var warning$$1 = "An error was thrown inside this error boundary";
    endFiberMark(fiber, null, warning$$1);
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
      var warning$$1 = hasScheduledUpdateInCurrentPhase
        ? "Scheduled a cascading update"
        : null;
      endFiberMark(currentPhaseFiber, currentPhase, warning$$1);
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
    commitCountInCurrentWorkLoop = 0;
    // This is top level call.
    // Any other measurements are performed within.
    beginMark("(React Tree Reconciliation)");
    // Resume any measurements that were in progress during the last loop.
    resumeTimers();
  }
}

function stopWorkLoopTimer(interruptedBy, didCompleteRoot) {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }
    var warning$$1 = null;
    if (interruptedBy !== null) {
      if (interruptedBy.tag === HostRoot) {
        warning$$1 = "A top-level update interrupted the previous render";
      } else {
        var componentName = getComponentName(interruptedBy) || "Unknown";
        warning$$1 =
          "An update to " + componentName + " interrupted the previous render";
      }
    } else if (commitCountInCurrentWorkLoop > 1) {
      warning$$1 = "There were cascading updates";
    }
    commitCountInCurrentWorkLoop = 0;
    var label = didCompleteRoot
      ? "(React Tree Reconciliation: Completed Root)"
      : "(React Tree Reconciliation: Yielded)";
    // Pause any measurements until the next loop.
    pauseTimers();
    endMark(label, "(React Tree Reconciliation)", warning$$1);
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

    var warning$$1 = null;
    if (hasScheduledUpdateInCurrentCommit) {
      warning$$1 = "Lifecycle hook scheduled a cascading update";
    } else if (commitCountInCurrentWorkLoop > 0) {
      warning$$1 = "Caused by a cascading update in earlier commit";
    }
    hasScheduledUpdateInCurrentCommit = false;
    commitCountInCurrentWorkLoop++;
    isCommitting = false;
    labelsInCurrentCommit.clear();

    endMark("(Committing Changes)", "(Committing Changes)", warning$$1);
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

var didWarnUpdateInsideUpdate = void 0;

{
  didWarnUpdateInsideUpdate = false;
}

// Callbacks are not validated until invocation

// Singly linked-list of updates. When an update is scheduled, it is added to
// the queue of the current fiber and the work-in-progress fiber. The two queues
// are separate but they share a persistent structure.
//
// During reconciliation, updates are removed from the work-in-progress fiber,
// but they remain on the current fiber. That ensures that if a work-in-progress
// is aborted, the aborted updates are recovered by cloning from current.
//
// The work-in-progress queue is always a subset of the current queue.
//
// When the tree is committed, the work-in-progress becomes the current.

function createUpdateQueue(baseState) {
  var queue = {
    baseState: baseState,
    expirationTime: NoWork,
    first: null,
    last: null,
    callbackList: null,
    hasForceUpdate: false,
    isInitialized: false,
    capturedValues: null
  };
  {
    queue.isProcessing = false;
  }
  return queue;
}

function insertUpdateIntoQueue(queue, update) {
  // Append the update to the end of the list.
  if (queue.last === null) {
    // Queue is empty
    queue.first = queue.last = update;
  } else {
    queue.last.next = update;
    queue.last = update;
  }
  if (
    queue.expirationTime === NoWork ||
    queue.expirationTime > update.expirationTime
  ) {
    queue.expirationTime = update.expirationTime;
  }
}

var q1 = void 0;
var q2 = void 0;
function ensureUpdateQueues(fiber) {
  q1 = q2 = null;
  // We'll have at least one and at most two distinct update queues.
  var alternateFiber = fiber.alternate;
  var queue1 = fiber.updateQueue;
  if (queue1 === null) {
    // TODO: We don't know what the base state will be until we begin work.
    // It depends on which fiber is the next current. Initialize with an empty
    // base state, then set to the memoizedState when rendering. Not super
    // happy with this approach.
    queue1 = fiber.updateQueue = createUpdateQueue(null);
  }

  var queue2 = void 0;
  if (alternateFiber !== null) {
    queue2 = alternateFiber.updateQueue;
    if (queue2 === null) {
      queue2 = alternateFiber.updateQueue = createUpdateQueue(null);
    }
  } else {
    queue2 = null;
  }
  queue2 = queue2 !== queue1 ? queue2 : null;

  // Use module variables instead of returning a tuple
  q1 = queue1;
  q2 = queue2;
}

function insertUpdateIntoFiber(fiber, update) {
  ensureUpdateQueues(fiber);
  var queue1 = q1;
  var queue2 = q2;

  // Warn if an update is scheduled from inside an updater function.
  {
    if (
      (queue1.isProcessing || (queue2 !== null && queue2.isProcessing)) &&
      !didWarnUpdateInsideUpdate
    ) {
      warning(
        false,
        "An update (setState, replaceState, or forceUpdate) was scheduled " +
          "from inside an update function. Update functions should be pure, " +
          "with zero side-effects. Consider using componentDidUpdate or a " +
          "callback."
      );
      didWarnUpdateInsideUpdate = true;
    }
  }

  // If there's only one queue, add the update to that queue and exit.
  if (queue2 === null) {
    insertUpdateIntoQueue(queue1, update);
    return;
  }

  // If either queue is empty, we need to add to both queues.
  if (queue1.last === null || queue2.last === null) {
    insertUpdateIntoQueue(queue1, update);
    insertUpdateIntoQueue(queue2, update);
    return;
  }

  // If both lists are not empty, the last update is the same for both lists
  // because of structural sharing. So, we should only append to one of
  // the lists.
  insertUpdateIntoQueue(queue1, update);
  // But we still need to update the `last` pointer of queue2.
  queue2.last = update;
}

function getUpdateExpirationTime(fiber) {
  switch (fiber.tag) {
    case HostRoot:
    case ClassComponent:
      var updateQueue = fiber.updateQueue;
      if (updateQueue === null) {
        return NoWork;
      }
      return updateQueue.expirationTime;
    default:
      return NoWork;
  }
}

function getStateFromUpdate(update, instance, prevState, props) {
  var partialState = update.partialState;
  if (typeof partialState === "function") {
    return partialState.call(instance, prevState, props);
  } else {
    return partialState;
  }
}

function processUpdateQueue(
  current,
  workInProgress,
  queue,
  instance,
  props,
  renderExpirationTime
) {
  if (current !== null && current.updateQueue === queue) {
    // We need to create a work-in-progress queue, by cloning the current queue.
    var currentQueue = queue;
    queue = workInProgress.updateQueue = {
      baseState: currentQueue.baseState,
      expirationTime: currentQueue.expirationTime,
      first: currentQueue.first,
      last: currentQueue.last,
      isInitialized: currentQueue.isInitialized,
      capturedValues: currentQueue.capturedValues,
      // These fields are no longer valid because they were already committed.
      // Reset them.
      callbackList: null,
      hasForceUpdate: false
    };
  }

  {
    // Set this flag so we can warn if setState is called inside the update
    // function of another setState.
    queue.isProcessing = true;
  }

  // Reset the remaining expiration time. If we skip over any updates, we'll
  // increase this accordingly.
  queue.expirationTime = NoWork;

  // TODO: We don't know what the base state will be until we begin work.
  // It depends on which fiber is the next current. Initialize with an empty
  // base state, then set to the memoizedState when rendering. Not super
  // happy with this approach.
  var state = void 0;
  if (queue.isInitialized) {
    state = queue.baseState;
  } else {
    state = queue.baseState = workInProgress.memoizedState;
    queue.isInitialized = true;
  }
  var dontMutatePrevState = true;
  var update = queue.first;
  var didSkip = false;
  while (update !== null) {
    var updateExpirationTime = update.expirationTime;
    if (updateExpirationTime > renderExpirationTime) {
      // This update does not have sufficient priority. Skip it.
      var remainingExpirationTime = queue.expirationTime;
      if (
        remainingExpirationTime === NoWork ||
        remainingExpirationTime > updateExpirationTime
      ) {
        // Update the remaining expiration time.
        queue.expirationTime = updateExpirationTime;
      }
      if (!didSkip) {
        didSkip = true;
        queue.baseState = state;
      }
      // Continue to the next update.
      update = update.next;
      continue;
    }

    // This update does have sufficient priority.

    // If no previous updates were skipped, drop this update from the queue by
    // advancing the head of the list.
    if (!didSkip) {
      queue.first = update.next;
      if (queue.first === null) {
        queue.last = null;
      }
    }

    // Invoke setState callback an extra time to help detect side-effects.
    // Ignore the return value in this case.
    if (
      debugRenderPhaseSideEffects ||
      (debugRenderPhaseSideEffectsForStrictMode &&
        workInProgress.mode & StrictMode)
    ) {
      getStateFromUpdate(update, instance, state, props);
    }

    // Process the update
    var _partialState = void 0;
    if (update.isReplace) {
      state = getStateFromUpdate(update, instance, state, props);
      dontMutatePrevState = true;
    } else {
      _partialState = getStateFromUpdate(update, instance, state, props);
      if (_partialState) {
        if (dontMutatePrevState) {
          // $FlowFixMe: Idk how to type this properly.
          state = Object.assign({}, state, _partialState);
        } else {
          state = Object.assign(state, _partialState);
        }
        dontMutatePrevState = false;
      }
    }
    if (update.isForced) {
      queue.hasForceUpdate = true;
    }
    if (update.callback !== null) {
      // Append to list of callbacks.
      var _callbackList = queue.callbackList;
      if (_callbackList === null) {
        _callbackList = queue.callbackList = [];
      }
      _callbackList.push(update);
    }
    if (update.capturedValue !== null) {
      var _capturedValues = queue.capturedValues;
      if (_capturedValues === null) {
        queue.capturedValues = [update.capturedValue];
      } else {
        _capturedValues.push(update.capturedValue);
      }
    }
    update = update.next;
  }

  if (queue.callbackList !== null) {
    workInProgress.effectTag |= Callback;
  } else if (
    queue.first === null &&
    !queue.hasForceUpdate &&
    queue.capturedValues === null
  ) {
    // The queue is empty. We can reset it.
    workInProgress.updateQueue = null;
  }

  if (!didSkip) {
    didSkip = true;
    queue.baseState = state;
  }

  {
    // No longer processing.
    queue.isProcessing = false;
  }

  return state;
}

function commitCallbacks(queue, context) {
  var callbackList = queue.callbackList;
  if (callbackList === null) {
    return;
  }
  // Set the list to null to make sure they don't get called more than once.
  queue.callbackList = null;
  for (var i = 0; i < callbackList.length; i++) {
    var update = callbackList[i];
    var _callback = update.callback;
    // This update might be processed again. Clear the callback so it's only
    // called once.
    update.callback = null;
    invariant(
      typeof _callback === "function",
      "Invalid argument passed as callback. Expected a function. Instead " +
        "received: %s",
      _callback
    );
    _callback.call(context);
  }
}

var fakeInternalInstance = {};
var isArray = Array.isArray;

var didWarnAboutStateAssignmentForComponent = void 0;
var didWarnAboutUndefinedDerivedState = void 0;
var didWarnAboutUninitializedState = void 0;
var didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate = void 0;
var didWarnAboutLegacyLifecyclesAndDerivedState = void 0;
var warnOnInvalidCallback = void 0;

{
  didWarnAboutStateAssignmentForComponent = new Set();
  didWarnAboutUndefinedDerivedState = new Set();
  didWarnAboutUninitializedState = new Set();
  didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate = new Set();
  didWarnAboutLegacyLifecyclesAndDerivedState = new Set();

  var didWarnOnInvalidCallback = new Set();

  warnOnInvalidCallback = function(callback, callerName) {
    if (callback === null || typeof callback === "function") {
      return;
    }
    var key = callerName + "_" + callback;
    if (!didWarnOnInvalidCallback.has(key)) {
      didWarnOnInvalidCallback.add(key);
      warning(
        false,
        "%s(...): Expected the last optional `callback` argument to be a " +
          "function. Instead received: %s.",
        callerName,
        callback
      );
    }
  };

  // This is so gross but it's at least non-critical and can be removed if
  // it causes problems. This is meant to give a nicer error message for
  // ReactDOM15.unstable_renderSubtreeIntoContainer(reactDOM16Component,
  // ...)) which otherwise throws a "_processChildContext is not a function"
  // exception.
  Object.defineProperty(fakeInternalInstance, "_processChildContext", {
    enumerable: false,
    value: function() {
      invariant(
        false,
        "_processChildContext is not available in React 16+. This likely " +
          "means you have multiple copies of React and are attempting to nest " +
          "a React 15 tree inside a React 16 tree using " +
          "unstable_renderSubtreeIntoContainer, which isn't supported. Try " +
          "to make sure you have only one copy of React (and ideally, switch " +
          "to ReactDOM.createPortal)."
      );
    }
  });
  Object.freeze(fakeInternalInstance);
}
function callGetDerivedStateFromCatch(ctor, capturedValues) {
  var resultState = {};
  for (var i = 0; i < capturedValues.length; i++) {
    var capturedValue = capturedValues[i];
    var error = capturedValue.value;
    var partialState = ctor.getDerivedStateFromCatch.call(null, error);
    if (partialState !== null && partialState !== undefined) {
      Object.assign(resultState, partialState);
    }
  }
  return resultState;
}

var ReactFiberClassComponent = function(
  legacyContext,
  scheduleWork,
  computeExpirationForFiber,
  memoizeProps,
  memoizeState
) {
  var cacheContext = legacyContext.cacheContext,
    getMaskedContext = legacyContext.getMaskedContext,
    getUnmaskedContext = legacyContext.getUnmaskedContext,
    isContextConsumer = legacyContext.isContextConsumer,
    hasContextChanged = legacyContext.hasContextChanged;

  // Class component state updater

  var updater = {
    isMounted: isMounted,
    enqueueSetState: function(instance, partialState, callback) {
      var fiber = get(instance);
      callback = callback === undefined ? null : callback;
      {
        warnOnInvalidCallback(callback, "setState");
      }
      var expirationTime = computeExpirationForFiber(fiber);
      var update = {
        expirationTime: expirationTime,
        partialState: partialState,
        callback: callback,
        isReplace: false,
        isForced: false,
        capturedValue: null,
        next: null
      };
      insertUpdateIntoFiber(fiber, update);
      scheduleWork(fiber, expirationTime);
    },
    enqueueReplaceState: function(instance, state, callback) {
      var fiber = get(instance);
      callback = callback === undefined ? null : callback;
      {
        warnOnInvalidCallback(callback, "replaceState");
      }
      var expirationTime = computeExpirationForFiber(fiber);
      var update = {
        expirationTime: expirationTime,
        partialState: state,
        callback: callback,
        isReplace: true,
        isForced: false,
        capturedValue: null,
        next: null
      };
      insertUpdateIntoFiber(fiber, update);
      scheduleWork(fiber, expirationTime);
    },
    enqueueForceUpdate: function(instance, callback) {
      var fiber = get(instance);
      callback = callback === undefined ? null : callback;
      {
        warnOnInvalidCallback(callback, "forceUpdate");
      }
      var expirationTime = computeExpirationForFiber(fiber);
      var update = {
        expirationTime: expirationTime,
        partialState: null,
        callback: callback,
        isReplace: false,
        isForced: true,
        capturedValue: null,
        next: null
      };
      insertUpdateIntoFiber(fiber, update);
      scheduleWork(fiber, expirationTime);
    }
  };

  function checkShouldComponentUpdate(
    workInProgress,
    oldProps,
    newProps,
    oldState,
    newState,
    newContext
  ) {
    if (
      oldProps === null ||
      (workInProgress.updateQueue !== null &&
        workInProgress.updateQueue.hasForceUpdate)
    ) {
      // If the workInProgress already has an Update effect, return true
      return true;
    }

    var instance = workInProgress.stateNode;
    var ctor = workInProgress.type;
    if (typeof instance.shouldComponentUpdate === "function") {
      startPhaseTimer(workInProgress, "shouldComponentUpdate");
      var shouldUpdate = instance.shouldComponentUpdate(
        newProps,
        newState,
        newContext
      );
      stopPhaseTimer();

      {
        !(shouldUpdate !== undefined)
          ? warning(
              false,
              "%s.shouldComponentUpdate(): Returned undefined instead of a " +
                "boolean value. Make sure to return true or false.",
              getComponentName(workInProgress) || "Component"
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

  function checkClassInstance(workInProgress) {
    var instance = workInProgress.stateNode;
    var type = workInProgress.type;
    {
      var name = getComponentName(workInProgress) || "Component";
      var renderPresent = instance.render;

      if (!renderPresent) {
        if (type.prototype && typeof type.prototype.render === "function") {
          warning(
            false,
            "%s(...): No `render` method found on the returned component " +
              "instance: did you accidentally return an object from the constructor?",
            name
          );
        } else {
          warning(
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
        ? warning(
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
        ? warning(
            false,
            "getDefaultProps was defined on %s, a plain JavaScript class. " +
              "This is only supported for classes created using React.createClass. " +
              "Use a static property to define defaultProps instead.",
            name
          )
        : void 0;
      var noInstancePropTypes = !instance.propTypes;
      !noInstancePropTypes
        ? warning(
            false,
            "propTypes was defined as an instance property on %s. Use a static " +
              "property to define propTypes instead.",
            name
          )
        : void 0;
      var noInstanceContextTypes = !instance.contextTypes;
      !noInstanceContextTypes
        ? warning(
            false,
            "contextTypes was defined as an instance property on %s. Use a static " +
              "property to define contextTypes instead.",
            name
          )
        : void 0;
      var noComponentShouldUpdate =
        typeof instance.componentShouldUpdate !== "function";
      !noComponentShouldUpdate
        ? warning(
            false,
            "%s has a method called " +
              "componentShouldUpdate(). Did you mean shouldComponentUpdate()? " +
              "The name is phrased as a question because the function is " +
              "expected to return a value.",
            name
          )
        : void 0;
      if (
        type.prototype &&
        type.prototype.isPureReactComponent &&
        typeof instance.shouldComponentUpdate !== "undefined"
      ) {
        warning(
          false,
          "%s has a method called shouldComponentUpdate(). " +
            "shouldComponentUpdate should not be used when extending React.PureComponent. " +
            "Please extend React.Component if shouldComponentUpdate is used.",
          getComponentName(workInProgress) || "A pure component"
        );
      }
      var noComponentDidUnmount =
        typeof instance.componentDidUnmount !== "function";
      !noComponentDidUnmount
        ? warning(
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
        ? warning(
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
        ? warning(
            false,
            "%s has a method called " +
              "componentWillRecieveProps(). Did you mean componentWillReceiveProps()?",
            name
          )
        : void 0;
      var noUnsafeComponentWillRecieveProps =
        typeof instance.UNSAFE_componentWillRecieveProps !== "function";
      !noUnsafeComponentWillRecieveProps
        ? warning(
            false,
            "%s has a method called " +
              "UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?",
            name
          )
        : void 0;
      var hasMutatedProps = instance.props !== workInProgress.pendingProps;
      !(instance.props === undefined || !hasMutatedProps)
        ? warning(
            false,
            "%s(...): When calling super() in `%s`, make sure to pass " +
              "up the same props that your component's constructor was passed.",
            name,
            name
          )
        : void 0;
      var noInstanceDefaultProps = !instance.defaultProps;
      !noInstanceDefaultProps
        ? warning(
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
        typeof instance.componentDidUpdate !== "function" &&
        !didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.has(type)
      ) {
        didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.add(type);
        warning(
          false,
          "%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). " +
            "This component defines getSnapshotBeforeUpdate() only.",
          getComponentName(workInProgress)
        );
      }

      var noInstanceGetDerivedStateFromProps =
        typeof instance.getDerivedStateFromProps !== "function";
      !noInstanceGetDerivedStateFromProps
        ? warning(
            false,
            "%s: getDerivedStateFromProps() is defined as an instance method " +
              "and will be ignored. Instead, declare it as a static method.",
            name
          )
        : void 0;
      var noInstanceGetDerivedStateFromCatch =
        typeof instance.getDerivedStateFromCatch !== "function";
      !noInstanceGetDerivedStateFromCatch
        ? warning(
            false,
            "%s: getDerivedStateFromCatch() is defined as an instance method " +
              "and will be ignored. Instead, declare it as a static method.",
            name
          )
        : void 0;
      var noStaticGetSnapshotBeforeUpdate =
        typeof type.getSnapshotBeforeUpdate !== "function";
      !noStaticGetSnapshotBeforeUpdate
        ? warning(
            false,
            "%s: getSnapshotBeforeUpdate() is defined as a static method " +
              "and will be ignored. Instead, declare it as an instance method.",
            name
          )
        : void 0;
      var _state = instance.state;
      if (_state && (typeof _state !== "object" || isArray(_state))) {
        warning(false, "%s.state: must be set to an object or null", name);
      }
      if (typeof instance.getChildContext === "function") {
        !(typeof type.childContextTypes === "object")
          ? warning(
              false,
              "%s.getChildContext(): childContextTypes must be defined in order to " +
                "use getChildContext().",
              name
            )
          : void 0;
      }
    }
  }

  function resetInputPointers(workInProgress, instance) {
    instance.props = workInProgress.memoizedProps;
    instance.state = workInProgress.memoizedState;
  }

  function adoptClassInstance(workInProgress, instance) {
    instance.updater = updater;
    workInProgress.stateNode = instance;
    // The instance needs access to the fiber so that it can schedule updates
    set(instance, workInProgress);
    {
      instance._reactInternalInstance = fakeInternalInstance;
    }
  }

  function constructClassInstance(workInProgress, props) {
    var ctor = workInProgress.type;
    var unmaskedContext = getUnmaskedContext(workInProgress);
    var needsContext = isContextConsumer(workInProgress);
    var context = needsContext
      ? getMaskedContext(workInProgress, unmaskedContext)
      : emptyObject;

    // Instantiate twice to help detect side-effects.
    if (
      debugRenderPhaseSideEffects ||
      (debugRenderPhaseSideEffectsForStrictMode &&
        workInProgress.mode & StrictMode)
    ) {
      new ctor(props, context); // eslint-disable-line no-new
    }

    var instance = new ctor(props, context);
    var state =
      instance.state !== null && instance.state !== undefined
        ? instance.state
        : null;
    adoptClassInstance(workInProgress, instance);

    {
      if (
        typeof ctor.getDerivedStateFromProps === "function" &&
        state === null
      ) {
        var componentName = getComponentName(workInProgress) || "Component";
        if (!didWarnAboutUninitializedState.has(componentName)) {
          didWarnAboutUninitializedState.add(componentName);
          warning(
            false,
            "%s: Did not properly initialize state during construction. " +
              "Expected state to be an object, but it was %s.",
            componentName,
            instance.state === null ? "null" : "undefined"
          );
        }
      }

      // If new component APIs are defined, "unsafe" lifecycles won't be called.
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
          instance.componentWillReceiveProps.__suppressDeprecationWarning !==
            true
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
          var _componentName = getComponentName(workInProgress) || "Component";
          var newApiName =
            typeof ctor.getDerivedStateFromProps === "function"
              ? "getDerivedStateFromProps()"
              : "getSnapshotBeforeUpdate()";
          if (
            !didWarnAboutLegacyLifecyclesAndDerivedState.has(_componentName)
          ) {
            didWarnAboutLegacyLifecyclesAndDerivedState.add(_componentName);
            warning(
              false,
              "Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n" +
                "%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\n" +
                "The above lifecycles should be removed. Learn more about this warning here:\n" +
                "https://fb.me/react-async-component-lifecycle-hooks",
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
    }

    workInProgress.memoizedState = state;

    var partialState = callGetDerivedStateFromProps(
      workInProgress,
      instance,
      props,
      state
    );

    if (partialState !== null && partialState !== undefined) {
      // Render-phase updates (like this) should not be added to the update queue,
      // So that multiple render passes do not enqueue multiple updates.
      // Instead, just synchronously merge the returned state into the instance.
      workInProgress.memoizedState = Object.assign(
        {},
        workInProgress.memoizedState,
        partialState
      );
    }

    // Cache unmasked context so we can avoid recreating masked context unless necessary.
    // ReactFiberContext usually updates this cache but can't for newly-created instances.
    if (needsContext) {
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
        warning(
          false,
          "%s.componentWillMount(): Assigning directly to this.state is " +
            "deprecated (except inside a component's " +
            "constructor). Use setState instead.",
          getComponentName(workInProgress) || "Component"
        );
      }
      updater.enqueueReplaceState(instance, instance.state, null);
    }
  }

  function callComponentWillReceiveProps(
    workInProgress,
    instance,
    newProps,
    newContext
  ) {
    var oldState = instance.state;
    startPhaseTimer(workInProgress, "componentWillReceiveProps");
    if (typeof instance.componentWillReceiveProps === "function") {
      instance.componentWillReceiveProps(newProps, newContext);
    }
    if (typeof instance.UNSAFE_componentWillReceiveProps === "function") {
      instance.UNSAFE_componentWillReceiveProps(newProps, newContext);
    }
    stopPhaseTimer();

    if (instance.state !== oldState) {
      {
        var componentName = getComponentName(workInProgress) || "Component";
        if (!didWarnAboutStateAssignmentForComponent.has(componentName)) {
          didWarnAboutStateAssignmentForComponent.add(componentName);
          warning(
            false,
            "%s.componentWillReceiveProps(): Assigning directly to " +
              "this.state is deprecated (except inside a component's " +
              "constructor). Use setState instead.",
            componentName
          );
        }
      }
      updater.enqueueReplaceState(instance, instance.state, null);
    }
  }

  function callGetDerivedStateFromProps(
    workInProgress,
    instance,
    nextProps,
    prevState
  ) {
    var type = workInProgress.type;

    if (typeof type.getDerivedStateFromProps === "function") {
      if (
        debugRenderPhaseSideEffects ||
        (debugRenderPhaseSideEffectsForStrictMode &&
          workInProgress.mode & StrictMode)
      ) {
        // Invoke method an extra time to help detect side-effects.
        type.getDerivedStateFromProps.call(null, nextProps, prevState);
      }

      var partialState = type.getDerivedStateFromProps.call(
        null,
        nextProps,
        prevState
      );

      {
        if (partialState === undefined) {
          var componentName = getComponentName(workInProgress) || "Component";
          if (!didWarnAboutUndefinedDerivedState.has(componentName)) {
            didWarnAboutUndefinedDerivedState.add(componentName);
            warning(
              false,
              "%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. " +
                "You have returned undefined.",
              componentName
            );
          }
        }
      }

      return partialState;
    }
  }

  // Invokes the mount life-cycles on a previously never rendered instance.
  function mountClassInstance(workInProgress, renderExpirationTime) {
    var ctor = workInProgress.type;
    var current = workInProgress.alternate;

    {
      checkClassInstance(workInProgress);
    }

    var instance = workInProgress.stateNode;
    var props = workInProgress.pendingProps;
    var unmaskedContext = getUnmaskedContext(workInProgress);

    instance.props = props;
    instance.state = workInProgress.memoizedState;
    instance.refs = emptyObject;
    instance.context = getMaskedContext(workInProgress, unmaskedContext);

    {
      if (workInProgress.mode & StrictMode) {
        ReactStrictModeWarnings.recordUnsafeLifecycleWarnings(
          workInProgress,
          instance
        );
      }

      if (warnAboutDeprecatedLifecycles) {
        ReactStrictModeWarnings.recordDeprecationWarnings(
          workInProgress,
          instance
        );
      }
    }

    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for components using the new APIs.
    if (
      typeof ctor.getDerivedStateFromProps !== "function" &&
      typeof instance.getSnapshotBeforeUpdate !== "function" &&
      (typeof instance.UNSAFE_componentWillMount === "function" ||
        typeof instance.componentWillMount === "function")
    ) {
      callComponentWillMount(workInProgress, instance);
      // If we had additional state updates during this life-cycle, let's
      // process them now.
      var updateQueue = workInProgress.updateQueue;
      if (updateQueue !== null) {
        instance.state = processUpdateQueue(
          current,
          workInProgress,
          updateQueue,
          instance,
          props,
          renderExpirationTime
        );
      }
    }
    if (typeof instance.componentDidMount === "function") {
      workInProgress.effectTag |= Update;
    }
  }

  function resumeMountClassInstance(workInProgress, renderExpirationTime) {
    var ctor = workInProgress.type;
    var instance = workInProgress.stateNode;
    resetInputPointers(workInProgress, instance);

    var oldProps = workInProgress.memoizedProps;
    var newProps = workInProgress.pendingProps;
    var oldContext = instance.context;
    var newUnmaskedContext = getUnmaskedContext(workInProgress);
    var newContext = getMaskedContext(workInProgress, newUnmaskedContext);

    var hasNewLifecycles =
      typeof ctor.getDerivedStateFromProps === "function" ||
      typeof instance.getSnapshotBeforeUpdate === "function";

    // Note: During these life-cycles, instance.props/instance.state are what
    // ever the previously attempted to render - not the "current". However,
    // during componentDidUpdate we pass the "current" props.

    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for components using the new APIs.
    if (
      !hasNewLifecycles &&
      (typeof instance.UNSAFE_componentWillReceiveProps === "function" ||
        typeof instance.componentWillReceiveProps === "function")
    ) {
      if (oldProps !== newProps || oldContext !== newContext) {
        callComponentWillReceiveProps(
          workInProgress,
          instance,
          newProps,
          newContext
        );
      }
    }

    // Compute the next state using the memoized state and the update queue.
    var oldState = workInProgress.memoizedState;
    // TODO: Previous state can be null.
    var newState = void 0;
    var derivedStateFromCatch = void 0;
    if (workInProgress.updateQueue !== null) {
      newState = processUpdateQueue(
        null,
        workInProgress,
        workInProgress.updateQueue,
        instance,
        newProps,
        renderExpirationTime
      );

      var updateQueue = workInProgress.updateQueue;
      if (
        updateQueue !== null &&
        updateQueue.capturedValues !== null &&
        enableGetDerivedStateFromCatch &&
        typeof ctor.getDerivedStateFromCatch === "function"
      ) {
        var capturedValues = updateQueue.capturedValues;
        // Don't remove these from the update queue yet. We need them in
        // finishClassComponent. Do the reset there.
        // TODO: This is awkward. Refactor class components.
        // updateQueue.capturedValues = null;
        derivedStateFromCatch = callGetDerivedStateFromCatch(
          ctor,
          capturedValues
        );
      }
    } else {
      newState = oldState;
    }

    var derivedStateFromProps = void 0;
    if (oldProps !== newProps) {
      // The prevState parameter should be the partially updated state.
      // Otherwise, spreading state in return values could override updates.
      derivedStateFromProps = callGetDerivedStateFromProps(
        workInProgress,
        instance,
        newProps,
        newState
      );
    }

    if (derivedStateFromProps !== null && derivedStateFromProps !== undefined) {
      // Render-phase updates (like this) should not be added to the update queue,
      // So that multiple render passes do not enqueue multiple updates.
      // Instead, just synchronously merge the returned state into the instance.
      newState =
        newState === null || newState === undefined
          ? derivedStateFromProps
          : Object.assign({}, newState, derivedStateFromProps);

      // Update the base state of the update queue.
      // FIXME: This is getting ridiculous. Refactor plz!
      var _updateQueue = workInProgress.updateQueue;
      if (_updateQueue !== null) {
        _updateQueue.baseState = Object.assign(
          {},
          _updateQueue.baseState,
          derivedStateFromProps
        );
      }
    }
    if (derivedStateFromCatch !== null && derivedStateFromCatch !== undefined) {
      // Render-phase updates (like this) should not be added to the update queue,
      // So that multiple render passes do not enqueue multiple updates.
      // Instead, just synchronously merge the returned state into the instance.
      newState =
        newState === null || newState === undefined
          ? derivedStateFromCatch
          : Object.assign({}, newState, derivedStateFromCatch);

      // Update the base state of the update queue.
      // FIXME: This is getting ridiculous. Refactor plz!
      var _updateQueue2 = workInProgress.updateQueue;
      if (_updateQueue2 !== null) {
        _updateQueue2.baseState = Object.assign(
          {},
          _updateQueue2.baseState,
          derivedStateFromCatch
        );
      }
    }

    if (
      oldProps === newProps &&
      oldState === newState &&
      !hasContextChanged() &&
      !(
        workInProgress.updateQueue !== null &&
        workInProgress.updateQueue.hasForceUpdate
      )
    ) {
      // If an update was already in progress, we should schedule an Update
      // effect even though we're bailing out, so that cWU/cDU are called.
      if (typeof instance.componentDidMount === "function") {
        workInProgress.effectTag |= Update;
      }
      return false;
    }

    var shouldUpdate = checkShouldComponentUpdate(
      workInProgress,
      oldProps,
      newProps,
      oldState,
      newState,
      newContext
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
      }

      // If shouldComponentUpdate returned false, we should still update the
      // memoized props/state to indicate that this work can be reused.
      memoizeProps(workInProgress, newProps);
      memoizeState(workInProgress, newState);
    }

    // Update the existing instance's state, props, and context pointers even
    // if shouldComponentUpdate returns false.
    instance.props = newProps;
    instance.state = newState;
    instance.context = newContext;

    return shouldUpdate;
  }

  // Invokes the update life-cycles and returns false if it shouldn't rerender.
  function updateClassInstance(current, workInProgress, renderExpirationTime) {
    var ctor = workInProgress.type;
    var instance = workInProgress.stateNode;
    resetInputPointers(workInProgress, instance);

    var oldProps = workInProgress.memoizedProps;
    var newProps = workInProgress.pendingProps;
    var oldContext = instance.context;
    var newUnmaskedContext = getUnmaskedContext(workInProgress);
    var newContext = getMaskedContext(workInProgress, newUnmaskedContext);

    var hasNewLifecycles =
      typeof ctor.getDerivedStateFromProps === "function" ||
      typeof instance.getSnapshotBeforeUpdate === "function";

    // Note: During these life-cycles, instance.props/instance.state are what
    // ever the previously attempted to render - not the "current". However,
    // during componentDidUpdate we pass the "current" props.

    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for components using the new APIs.
    if (
      !hasNewLifecycles &&
      (typeof instance.UNSAFE_componentWillReceiveProps === "function" ||
        typeof instance.componentWillReceiveProps === "function")
    ) {
      if (oldProps !== newProps || oldContext !== newContext) {
        callComponentWillReceiveProps(
          workInProgress,
          instance,
          newProps,
          newContext
        );
      }
    }

    // Compute the next state using the memoized state and the update queue.
    var oldState = workInProgress.memoizedState;
    // TODO: Previous state can be null.
    var newState = void 0;
    var derivedStateFromCatch = void 0;

    if (workInProgress.updateQueue !== null) {
      newState = processUpdateQueue(
        current,
        workInProgress,
        workInProgress.updateQueue,
        instance,
        newProps,
        renderExpirationTime
      );

      var updateQueue = workInProgress.updateQueue;
      if (
        updateQueue !== null &&
        updateQueue.capturedValues !== null &&
        enableGetDerivedStateFromCatch &&
        typeof ctor.getDerivedStateFromCatch === "function"
      ) {
        var capturedValues = updateQueue.capturedValues;
        // Don't remove these from the update queue yet. We need them in
        // finishClassComponent. Do the reset there.
        // TODO: This is awkward. Refactor class components.
        // updateQueue.capturedValues = null;
        derivedStateFromCatch = callGetDerivedStateFromCatch(
          ctor,
          capturedValues
        );
      }
    } else {
      newState = oldState;
    }

    var derivedStateFromProps = void 0;
    if (oldProps !== newProps) {
      // The prevState parameter should be the partially updated state.
      // Otherwise, spreading state in return values could override updates.
      derivedStateFromProps = callGetDerivedStateFromProps(
        workInProgress,
        instance,
        newProps,
        newState
      );
    }

    if (derivedStateFromProps !== null && derivedStateFromProps !== undefined) {
      // Render-phase updates (like this) should not be added to the update queue,
      // So that multiple render passes do not enqueue multiple updates.
      // Instead, just synchronously merge the returned state into the instance.
      newState =
        newState === null || newState === undefined
          ? derivedStateFromProps
          : Object.assign({}, newState, derivedStateFromProps);

      // Update the base state of the update queue.
      // FIXME: This is getting ridiculous. Refactor plz!
      var _updateQueue3 = workInProgress.updateQueue;
      if (_updateQueue3 !== null) {
        _updateQueue3.baseState = Object.assign(
          {},
          _updateQueue3.baseState,
          derivedStateFromProps
        );
      }
    }
    if (derivedStateFromCatch !== null && derivedStateFromCatch !== undefined) {
      // Render-phase updates (like this) should not be added to the update queue,
      // So that multiple render passes do not enqueue multiple updates.
      // Instead, just synchronously merge the returned state into the instance.
      newState =
        newState === null || newState === undefined
          ? derivedStateFromCatch
          : Object.assign({}, newState, derivedStateFromCatch);

      // Update the base state of the update queue.
      // FIXME: This is getting ridiculous. Refactor plz!
      var _updateQueue4 = workInProgress.updateQueue;
      if (_updateQueue4 !== null) {
        _updateQueue4.baseState = Object.assign(
          {},
          _updateQueue4.baseState,
          derivedStateFromCatch
        );
      }
    }

    if (
      oldProps === newProps &&
      oldState === newState &&
      !hasContextChanged() &&
      !(
        workInProgress.updateQueue !== null &&
        workInProgress.updateQueue.hasForceUpdate
      )
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

    var shouldUpdate = checkShouldComponentUpdate(
      workInProgress,
      oldProps,
      newProps,
      oldState,
      newState,
      newContext
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
          instance.componentWillUpdate(newProps, newState, newContext);
        }
        if (typeof instance.UNSAFE_componentWillUpdate === "function") {
          instance.UNSAFE_componentWillUpdate(newProps, newState, newContext);
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
      }

      // If shouldComponentUpdate returned false, we should still update the
      // memoized props/state to indicate that this work can be reused.
      memoizeProps(workInProgress, newProps);
      memoizeState(workInProgress, newState);
    }

    // Update the existing instance's state, props, and context pointers even
    // if shouldComponentUpdate returns false.
    instance.props = newProps;
    instance.state = newState;
    instance.context = newContext;

    return shouldUpdate;
  }

  return {
    adoptClassInstance: adoptClassInstance,
    callGetDerivedStateFromProps: callGetDerivedStateFromProps,
    constructClassInstance: constructClassInstance,
    mountClassInstance: mountClassInstance,
    resumeMountClassInstance: resumeMountClassInstance,
    updateClassInstance: updateClassInstance
  };
};

var getCurrentFiberStackAddendum$1 =
  ReactDebugCurrentFiber.getCurrentFiberStackAddendum;

var didWarnAboutMaps = void 0;
var didWarnAboutStringRefInStrictMode = void 0;
var ownerHasKeyUseWarning = void 0;
var ownerHasFunctionTypeWarning = void 0;
var warnForMissingKey = function(child) {};

{
  didWarnAboutMaps = false;
  didWarnAboutStringRefInStrictMode = {};

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
    invariant(
      typeof child._store === "object",
      "React Component in warnForMissingKey should have a _store. " +
        "This error is likely caused by a bug in React. Please file an issue."
    );
    child._store.validated = true;

    var currentComponentErrorInfo =
      "Each child in an array or iterator should have a unique " +
      '"key" prop. See https://fb.me/react-warning-keys for ' +
      "more information." +
      (getCurrentFiberStackAddendum$1() || "");
    if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
      return;
    }
    ownerHasKeyUseWarning[currentComponentErrorInfo] = true;

    warning(
      false,
      "Each child in an array or iterator should have a unique " +
        '"key" prop. See https://fb.me/react-warning-keys for ' +
        "more information.%s",
      getCurrentFiberStackAddendum$1()
    );
  };
}

var isArray$1 = Array.isArray;

function coerceRef(returnFiber, current, element) {
  var mixedRef = element.ref;
  if (
    mixedRef !== null &&
    typeof mixedRef !== "function" &&
    typeof mixedRef !== "object"
  ) {
    {
      if (returnFiber.mode & StrictMode) {
        var componentName = getComponentName(returnFiber) || "Component";
        if (!didWarnAboutStringRefInStrictMode[componentName]) {
          warning(
            false,
            'A string ref, "%s", has been found within a strict mode tree. ' +
              "String refs are a source of potential bugs and should be avoided. " +
              "We recommend using createRef() instead." +
              "\n%s" +
              "\n\nLearn more about using refs safely here:" +
              "\nhttps://fb.me/react-strict-mode-string-ref",
            mixedRef,
            getStackAddendumByWorkInProgressFiber(returnFiber)
          );
          didWarnAboutStringRefInStrictMode[componentName] = true;
        }
      }
    }

    if (element._owner) {
      var owner = element._owner;
      var inst = void 0;
      if (owner) {
        var ownerFiber = owner;
        invariant(
          ownerFiber.tag === ClassComponent,
          "Stateless function components cannot have refs."
        );
        inst = ownerFiber.stateNode;
      }
      invariant(
        inst,
        "Missing owner for string ref %s. This error is likely caused by a " +
          "bug in React. Please file an issue.",
        mixedRef
      );
      var stringRef = "" + mixedRef;
      // Check if previous string ref matches new string ref
      if (
        current !== null &&
        current.ref !== null &&
        current.ref._stringRef === stringRef
      ) {
        return current.ref;
      }
      var ref = function(value) {
        var refs = inst.refs === emptyObject ? (inst.refs = {}) : inst.refs;
        if (value === null) {
          delete refs[stringRef];
        } else {
          refs[stringRef] = value;
        }
      };
      ref._stringRef = stringRef;
      return ref;
    } else {
      invariant(
        typeof mixedRef === "string",
        "Expected ref to be a function or a string."
      );
      invariant(
        element._owner,
        "Element ref was specified as a string (%s) but no owner was set. This could happen for one of" +
          " the following reasons:\n" +
          "1. You may be adding a ref to a functional component\n" +
          "2. You may be adding a ref to a component that was not created inside a component's render method\n" +
          "3. You have multiple copies of React loaded\n" +
          "See https://fb.me/react-refs-must-have-owner for more information.",
        mixedRef
      );
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
        (getCurrentFiberStackAddendum$1() || "");
    }
    invariant(
      false,
      "Objects are not valid as a React child (found: %s).%s",
      Object.prototype.toString.call(newChild) === "[object Object]"
        ? "object with keys {" + Object.keys(newChild).join(", ") + "}"
        : newChild,
      addendum
    );
  }
}

function warnOnFunctionType() {
  var currentComponentErrorInfo =
    "Functions are not valid as a React child. This may happen if " +
    "you return a Component instead of <Component /> from render. " +
    "Or maybe you meant to call this function rather than return it." +
    (getCurrentFiberStackAddendum$1() || "");

  if (ownerHasFunctionTypeWarning[currentComponentErrorInfo]) {
    return;
  }
  ownerHasFunctionTypeWarning[currentComponentErrorInfo] = true;

  warning(
    false,
    "Functions are not valid as a React child. This may happen if " +
      "you return a Component instead of <Component /> from render. " +
      "Or maybe you meant to call this function rather than return it.%s",
    getCurrentFiberStackAddendum$1() || ""
  );
}

// This wrapper function exists because I expect to clone the code in each path
// to be able to optimize each path individually by branching early. This needs
// a compiler or we can do it manually. Helpers that don't need this branching
// live outside of this function.
function ChildReconciler(shouldTrackSideEffects) {
  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) {
      // Noop.
      return;
    }
    // Deletions are added in reversed order so we add it to the front.
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
    }

    // TODO: For the shouldClone case, this could be micro-optimized a bit by
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
    var current = newFiber.alternate;
    if (current !== null) {
      var oldIndex = current.index;
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

  function updateTextNode(returnFiber, current, textContent, expirationTime) {
    if (current === null || current.tag !== HostText) {
      // Insert
      var created = createFiberFromText(
        textContent,
        returnFiber.mode,
        expirationTime
      );
      created["return"] = returnFiber;
      return created;
    } else {
      // Update
      var existing = useFiber(current, textContent, expirationTime);
      existing["return"] = returnFiber;
      return existing;
    }
  }

  function updateElement(returnFiber, current, element, expirationTime) {
    if (current !== null && current.type === element.type) {
      // Move based on index
      var existing = useFiber(current, element.props, expirationTime);
      existing.ref = coerceRef(returnFiber, current, element);
      existing["return"] = returnFiber;
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
      created.ref = coerceRef(returnFiber, current, element);
      created["return"] = returnFiber;
      return created;
    }
  }

  function updatePortal(returnFiber, current, portal, expirationTime) {
    if (
      current === null ||
      current.tag !== HostPortal ||
      current.stateNode.containerInfo !== portal.containerInfo ||
      current.stateNode.implementation !== portal.implementation
    ) {
      // Insert
      var created = createFiberFromPortal(
        portal,
        returnFiber.mode,
        expirationTime
      );
      created["return"] = returnFiber;
      return created;
    } else {
      // Update
      var existing = useFiber(current, portal.children || [], expirationTime);
      existing["return"] = returnFiber;
      return existing;
    }
  }

  function updateFragment(returnFiber, current, fragment, expirationTime, key) {
    if (current === null || current.tag !== Fragment) {
      // Insert
      var created = createFiberFromFragment(
        fragment,
        returnFiber.mode,
        expirationTime,
        key
      );
      created["return"] = returnFiber;
      return created;
    } else {
      // Update
      var existing = useFiber(current, fragment, expirationTime);
      existing["return"] = returnFiber;
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
      created["return"] = returnFiber;
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
          _created["return"] = returnFiber;
          return _created;
        }
        case REACT_PORTAL_TYPE: {
          var _created2 = createFiberFromPortal(
            newChild,
            returnFiber.mode,
            expirationTime
          );
          _created2["return"] = returnFiber;
          return _created2;
        }
      }

      if (isArray$1(newChild) || getIteratorFn(newChild)) {
        var _created3 = createFiberFromFragment(
          newChild,
          returnFiber.mode,
          expirationTime,
          null
        );
        _created3["return"] = returnFiber;
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

      if (isArray$1(newChild) || getIteratorFn(newChild)) {
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

      if (isArray$1(newChild) || getIteratorFn(newChild)) {
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
          warning(
            false,
            "Encountered two children with the same key, `%s`. " +
              "Keys should be unique so that components maintain their identity " +
              "across updates. Non-unique keys may cause children to be " +
              "duplicated and/or omitted — the behavior is unsupported and " +
              "could change in a future version.%s",
            key,
            getCurrentFiberStackAddendum$1()
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
    // This algorithm can't optimize by searching from boths ends since we
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
        if (!_newFiber) {
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
    }

    // Add all children to a key map for quick lookups.
    var existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    // Keep scanning and use the map to restore deleted items as moves.
    for (; newIdx < newChildren.length; newIdx++) {
      var _newFiber2 = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx],
        expirationTime
      );
      if (_newFiber2) {
        if (shouldTrackSideEffects) {
          if (_newFiber2.alternate !== null) {
            // The new fiber is a work in progress, but if there exists a
            // current, that means that we reused the fiber. We need to delete
            // it from the child list so that we don't add it to the deletion
            // list.
            existingChildren["delete"](
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
    invariant(
      typeof iteratorFn === "function",
      "An object is not an iterable. This error is likely caused by a bug in " +
        "React. Please file an issue."
    );

    {
      // Warn about using Maps as children
      if (typeof newChildrenIterable.entries === "function") {
        var possibleMap = newChildrenIterable;
        if (possibleMap.entries === iteratorFn) {
          !didWarnAboutMaps
            ? warning(
                false,
                "Using Maps as children is unsupported and will likely yield " +
                  "unexpected results. Convert it to a sequence/iterable of keyed " +
                  "ReactElements instead.%s",
                getCurrentFiberStackAddendum$1()
              )
            : void 0;
          didWarnAboutMaps = true;
        }
      }

      // First, validate keys.
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
    invariant(newChildren != null, "An iterable object provided no iterator.");

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
        if (!oldFiber) {
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
    }

    // Add all children to a key map for quick lookups.
    var existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    // Keep scanning and use the map to restore deleted items as moves.
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
            existingChildren["delete"](
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
      existing["return"] = returnFiber;
      return existing;
    }
    // The existing first child is not a text node so we need to create one
    // and delete the existing ones.
    deleteRemainingChildren(returnFiber, currentFirstChild);
    var created = createFiberFromText(
      textContent,
      returnFiber.mode,
      expirationTime
    );
    created["return"] = returnFiber;
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
            : child.type === element.type
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
          existing["return"] = returnFiber;
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
      created["return"] = returnFiber;
      return created;
    } else {
      var _created4 = createFiberFromElement(
        element,
        returnFiber.mode,
        expirationTime
      );
      _created4.ref = coerceRef(returnFiber, currentFirstChild, element);
      _created4["return"] = returnFiber;
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
          existing["return"] = returnFiber;
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
    created["return"] = returnFiber;
    return created;
  }

  // This API will tag the children with the side-effect of the reconciliation
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
    if (
      typeof newChild === "object" &&
      newChild !== null &&
      newChild.type === REACT_FRAGMENT_TYPE &&
      newChild.key === null
    ) {
      newChild = newChild.props.children;
    }

    // Handle object types
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

    if (isArray$1(newChild)) {
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
    if (typeof newChild === "undefined") {
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
        case FunctionalComponent: {
          var Component = returnFiber.type;
          invariant(
            false,
            "%s(...): Nothing was returned from render. This usually means a " +
              "return statement is missing. Or, to render nothing, " +
              "return null.",
            Component.displayName || Component.name || "Component"
          );
        }
      }
    }

    // Remaining cases are all treated as empty.
    return deleteRemainingChildren(returnFiber, currentFirstChild);
  }

  return reconcileChildFibers;
}

var reconcileChildFibers = ChildReconciler(true);
var mountChildFibers = ChildReconciler(false);

function cloneChildFibers(current, workInProgress) {
  invariant(
    current === null || workInProgress.child === current.child,
    "Resuming work not yet implemented."
  );

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

  newChild["return"] = workInProgress;
  while (currentChild.sibling !== null) {
    currentChild = currentChild.sibling;
    newChild = newChild.sibling = createWorkInProgress(
      currentChild,
      currentChild.pendingProps,
      currentChild.expirationTime
    );
    newChild["return"] = workInProgress;
  }
  newChild.sibling = null;
}

var didWarnAboutBadClass = void 0;
var didWarnAboutGetDerivedStateOnFunctionalComponent = void 0;
var didWarnAboutStatelessRefs = void 0;

{
  didWarnAboutBadClass = {};
  didWarnAboutGetDerivedStateOnFunctionalComponent = {};
  didWarnAboutStatelessRefs = {};
}

var ReactFiberBeginWork = function(
  config,
  hostContext,
  legacyContext,
  newContext,
  hydrationContext,
  scheduleWork,
  computeExpirationForFiber
) {
  var shouldSetTextContent = config.shouldSetTextContent,
    shouldDeprioritizeSubtree = config.shouldDeprioritizeSubtree;
  var pushHostContext = hostContext.pushHostContext,
    pushHostContainer = hostContext.pushHostContainer;
  var pushProvider = newContext.pushProvider;
  var getMaskedContext = legacyContext.getMaskedContext,
    getUnmaskedContext = legacyContext.getUnmaskedContext,
    hasLegacyContextChanged = legacyContext.hasContextChanged,
    pushLegacyContextProvider = legacyContext.pushContextProvider,
    pushTopLevelContextObject = legacyContext.pushTopLevelContextObject,
    invalidateContextProvider = legacyContext.invalidateContextProvider;
  var enterHydrationState = hydrationContext.enterHydrationState,
    resetHydrationState = hydrationContext.resetHydrationState,
    tryToClaimNextHydratableInstance =
      hydrationContext.tryToClaimNextHydratableInstance;

  var _ReactFiberClassCompo = ReactFiberClassComponent(
      legacyContext,
      scheduleWork,
      computeExpirationForFiber,
      memoizeProps,
      memoizeState
    ),
    adoptClassInstance = _ReactFiberClassCompo.adoptClassInstance,
    callGetDerivedStateFromProps =
      _ReactFiberClassCompo.callGetDerivedStateFromProps,
    constructClassInstance = _ReactFiberClassCompo.constructClassInstance,
    mountClassInstance = _ReactFiberClassCompo.mountClassInstance,
    resumeMountClassInstance = _ReactFiberClassCompo.resumeMountClassInstance,
    updateClassInstance = _ReactFiberClassCompo.updateClassInstance;

  // TODO: Remove this and use reconcileChildrenAtExpirationTime directly.

  function reconcileChildren(current, workInProgress, nextChildren) {
    reconcileChildrenAtExpirationTime(
      current,
      workInProgress,
      nextChildren,
      workInProgress.expirationTime
    );
  }

  function reconcileChildrenAtExpirationTime(
    current,
    workInProgress,
    nextChildren,
    renderExpirationTime
  ) {
    if (current === null) {
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
        current.child,
        nextChildren,
        renderExpirationTime
      );
    }
  }

  function updateForwardRef(current, workInProgress) {
    var render = workInProgress.type.render;
    var nextChildren = render(workInProgress.pendingProps, workInProgress.ref);
    reconcileChildren(current, workInProgress, nextChildren);
    memoizeProps(workInProgress, nextChildren);
    return workInProgress.child;
  }

  function updateFragment(current, workInProgress) {
    var nextChildren = workInProgress.pendingProps;
    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (workInProgress.memoizedProps === nextChildren) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }
    reconcileChildren(current, workInProgress, nextChildren);
    memoizeProps(workInProgress, nextChildren);
    return workInProgress.child;
  }

  function updateMode(current, workInProgress) {
    var nextChildren = workInProgress.pendingProps.children;
    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (
      nextChildren === null ||
      workInProgress.memoizedProps === nextChildren
    ) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }
    reconcileChildren(current, workInProgress, nextChildren);
    memoizeProps(workInProgress, nextChildren);
    return workInProgress.child;
  }

  function markRef(current, workInProgress) {
    var ref = workInProgress.ref;
    if (
      (current === null && ref !== null) ||
      (current !== null && current.ref !== ref)
    ) {
      // Schedule a Ref effect
      workInProgress.effectTag |= Ref;
    }
  }

  function updateFunctionalComponent(current, workInProgress) {
    var fn = workInProgress.type;
    var nextProps = workInProgress.pendingProps;

    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else {
      if (workInProgress.memoizedProps === nextProps) {
        return bailoutOnAlreadyFinishedWork(current, workInProgress);
      }
      // TODO: consider bringing fn.shouldComponentUpdate() back.
      // It used to be here.
    }

    var unmaskedContext = getUnmaskedContext(workInProgress);
    var context = getMaskedContext(workInProgress, unmaskedContext);

    var nextChildren = void 0;

    {
      ReactCurrentOwner.current = workInProgress;
      ReactDebugCurrentFiber.setCurrentPhase("render");
      nextChildren = fn(nextProps, context);
      ReactDebugCurrentFiber.setCurrentPhase(null);
    }
    // React DevTools reads this flag.
    workInProgress.effectTag |= PerformedWork;
    reconcileChildren(current, workInProgress, nextChildren);
    memoizeProps(workInProgress, nextProps);
    return workInProgress.child;
  }

  function updateClassComponent(current, workInProgress, renderExpirationTime) {
    // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance doesn't exist.
    // We will invalidate the child context in finishClassComponent() right after rendering.
    var hasContext = pushLegacyContextProvider(workInProgress);
    var shouldUpdate = void 0;
    if (current === null) {
      if (workInProgress.stateNode === null) {
        // In the initial pass we might need to construct the instance.
        constructClassInstance(workInProgress, workInProgress.pendingProps);
        mountClassInstance(workInProgress, renderExpirationTime);

        shouldUpdate = true;
      } else {
        // In a resume, we'll already have an instance we can reuse.
        shouldUpdate = resumeMountClassInstance(
          workInProgress,
          renderExpirationTime
        );
      }
    } else {
      shouldUpdate = updateClassInstance(
        current,
        workInProgress,
        renderExpirationTime
      );
    }

    // We processed the update queue inside updateClassInstance. It may have
    // included some errors that were dispatched during the commit phase.
    // TODO: Refactor class components so this is less awkward.
    var didCaptureError = false;
    var updateQueue = workInProgress.updateQueue;
    if (updateQueue !== null && updateQueue.capturedValues !== null) {
      shouldUpdate = true;
      didCaptureError = true;
    }
    return finishClassComponent(
      current,
      workInProgress,
      shouldUpdate,
      hasContext,
      didCaptureError,
      renderExpirationTime
    );
  }

  function finishClassComponent(
    current,
    workInProgress,
    shouldUpdate,
    hasContext,
    didCaptureError,
    renderExpirationTime
  ) {
    // Refs should update even if shouldComponentUpdate returns false
    markRef(current, workInProgress);

    if (!shouldUpdate && !didCaptureError) {
      // Context providers should defer to sCU for rendering
      if (hasContext) {
        invalidateContextProvider(workInProgress, false);
      }

      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    var ctor = workInProgress.type;
    var instance = workInProgress.stateNode;

    // Rerender
    ReactCurrentOwner.current = workInProgress;
    var nextChildren = void 0;
    if (
      didCaptureError &&
      (!enableGetDerivedStateFromCatch ||
        typeof ctor.getDerivedStateFromCatch !== "function")
    ) {
      // If we captured an error, but getDerivedStateFrom catch is not defined,
      // unmount all the children. componentDidCatch will schedule an update to
      // re-render a fallback. This is temporary until we migrate everyone to
      // the new API.
      // TODO: Warn in a future release.
      nextChildren = null;
    } else {
      {
        ReactDebugCurrentFiber.setCurrentPhase("render");
        nextChildren = instance.render();
        if (
          debugRenderPhaseSideEffects ||
          (debugRenderPhaseSideEffectsForStrictMode &&
            workInProgress.mode & StrictMode)
        ) {
          instance.render();
        }
        ReactDebugCurrentFiber.setCurrentPhase(null);
      }
    }

    // React DevTools reads this flag.
    workInProgress.effectTag |= PerformedWork;
    if (didCaptureError) {
      // If we're recovering from an error, reconcile twice: first to delete
      // all the existing children.
      reconcileChildrenAtExpirationTime(
        current,
        workInProgress,
        null,
        renderExpirationTime
      );
      workInProgress.child = null;
      // Now we can continue reconciling like normal. This has the effect of
      // remounting all children regardless of whether their their
      // identity matches.
    }
    reconcileChildrenAtExpirationTime(
      current,
      workInProgress,
      nextChildren,
      renderExpirationTime
    );
    // Memoize props and state using the values we just used to render.
    // TODO: Restructure so we never read values from the instance.
    memoizeState(workInProgress, instance.state);
    memoizeProps(workInProgress, instance.props);

    // The context might have changed so we need to recalculate it.
    if (hasContext) {
      invalidateContextProvider(workInProgress, true);
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

  function updateHostRoot(current, workInProgress, renderExpirationTime) {
    pushHostRootContext(workInProgress);
    var updateQueue = workInProgress.updateQueue;
    if (updateQueue !== null) {
      var prevState = workInProgress.memoizedState;
      var state = processUpdateQueue(
        current,
        workInProgress,
        updateQueue,
        null,
        null,
        renderExpirationTime
      );
      memoizeState(workInProgress, state);
      updateQueue = workInProgress.updateQueue;

      var element = void 0;
      if (updateQueue !== null && updateQueue.capturedValues !== null) {
        // There's an uncaught error. Unmount the whole root.
        element = null;
      } else if (prevState === state) {
        // If the state is the same as before, that's a bailout because we had
        // no work that expires at this time.
        resetHydrationState();
        return bailoutOnAlreadyFinishedWork(current, workInProgress);
      } else {
        element = state.element;
      }
      var root = workInProgress.stateNode;
      if (
        (current === null || current.child === null) &&
        root.hydrate &&
        enterHydrationState(workInProgress)
      ) {
        // If we don't have any current children this might be the first pass.
        // We always try to hydrate. If this isn't a hydration pass there won't
        // be any children to hydrate which is effectively the same thing as
        // not hydrating.

        // This is a bit of a hack. We track the host root as a placement to
        // know that we're currently in a mounting state. That way isMounted
        // works as expected. We must reset this before committing.
        // TODO: Delete this when we delete isMounted and findDOMNode.
        workInProgress.effectTag |= Placement;

        // Ensure that children mount into this root without tracking
        // side-effects. This ensures that we don't store Placement effects on
        // nodes that will be hydrated.
        workInProgress.child = mountChildFibers(
          workInProgress,
          null,
          element,
          renderExpirationTime
        );
      } else {
        // Otherwise reset hydration state in case we aborted and resumed another
        // root.
        resetHydrationState();
        reconcileChildren(current, workInProgress, element);
      }
      memoizeState(workInProgress, state);
      return workInProgress.child;
    }
    resetHydrationState();
    // If there is no update queue, that's a bailout because the root has no props.
    return bailoutOnAlreadyFinishedWork(current, workInProgress);
  }

  function updateHostComponent(current, workInProgress, renderExpirationTime) {
    pushHostContext(workInProgress);

    if (current === null) {
      tryToClaimNextHydratableInstance(workInProgress);
    }

    var type = workInProgress.type;
    var memoizedProps = workInProgress.memoizedProps;
    var nextProps = workInProgress.pendingProps;
    var prevProps = current !== null ? current.memoizedProps : null;

    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (memoizedProps === nextProps) {
      var isHidden =
        workInProgress.mode & AsyncMode &&
        shouldDeprioritizeSubtree(type, nextProps);
      if (isHidden) {
        // Before bailing out, make sure we've deprioritized a hidden component.
        workInProgress.expirationTime = Never;
      }
      if (!isHidden || renderExpirationTime !== Never) {
        return bailoutOnAlreadyFinishedWork(current, workInProgress);
      }
      // If we're rendering a hidden node at hidden priority, don't bailout. The
      // parent is complete, but the children may not be.
    }

    var nextChildren = nextProps.children;
    var isDirectTextChild = shouldSetTextContent(type, nextProps);

    if (isDirectTextChild) {
      // We special case a direct text child of a host node. This is a common
      // case. We won't handle it as a reified child. We will instead handle
      // this in the host environment that also have access to this prop. That
      // avoids allocating another HostText fiber and traversing it.
      nextChildren = null;
    } else if (prevProps && shouldSetTextContent(type, prevProps)) {
      // If we're switching from a direct text child to a normal child, or to
      // empty, we need to schedule the text content to be reset.
      workInProgress.effectTag |= ContentReset;
    }

    markRef(current, workInProgress);

    // Check the host config to see if the children are offscreen/hidden.
    if (
      renderExpirationTime !== Never &&
      workInProgress.mode & AsyncMode &&
      shouldDeprioritizeSubtree(type, nextProps)
    ) {
      // Down-prioritize the children.
      workInProgress.expirationTime = Never;
      // Bailout and come back to this fiber later.
      workInProgress.memoizedProps = nextProps;
      return null;
    }

    reconcileChildren(current, workInProgress, nextChildren);
    memoizeProps(workInProgress, nextProps);
    return workInProgress.child;
  }

  function updateHostText(current, workInProgress) {
    if (current === null) {
      tryToClaimNextHydratableInstance(workInProgress);
    }
    var nextProps = workInProgress.pendingProps;
    memoizeProps(workInProgress, nextProps);
    // Nothing to do here. This is terminal. We'll do the completion step
    // immediately after.
    return null;
  }

  function mountIndeterminateComponent(
    current,
    workInProgress,
    renderExpirationTime
  ) {
    invariant(
      current === null,
      "An indeterminate component should never have mounted. This error is " +
        "likely caused by a bug in React. Please file an issue."
    );
    var fn = workInProgress.type;
    var props = workInProgress.pendingProps;
    var unmaskedContext = getUnmaskedContext(workInProgress);
    var context = getMaskedContext(workInProgress, unmaskedContext);

    var value = void 0;

    {
      if (fn.prototype && typeof fn.prototype.render === "function") {
        var componentName = getComponentName(workInProgress) || "Unknown";

        if (!didWarnAboutBadClass[componentName]) {
          warning(
            false,
            "The <%s /> component appears to have a render method, but doesn't extend React.Component. " +
              "This is likely to cause errors. Change %s to extend React.Component instead.",
            componentName,
            componentName
          );
          didWarnAboutBadClass[componentName] = true;
        }
      }
      ReactCurrentOwner.current = workInProgress;
      value = fn(props, context);
    }
    // React DevTools reads this flag.
    workInProgress.effectTag |= PerformedWork;

    if (
      typeof value === "object" &&
      value !== null &&
      typeof value.render === "function" &&
      value.$$typeof === undefined
    ) {
      var Component = workInProgress.type;

      // Proceed under the assumption that this is a class instance
      workInProgress.tag = ClassComponent;

      workInProgress.memoizedState =
        value.state !== null && value.state !== undefined ? value.state : null;

      if (typeof Component.getDerivedStateFromProps === "function") {
        var partialState = callGetDerivedStateFromProps(
          workInProgress,
          value,
          props,
          workInProgress.memoizedState
        );

        if (partialState !== null && partialState !== undefined) {
          workInProgress.memoizedState = Object.assign(
            {},
            workInProgress.memoizedState,
            partialState
          );
        }
      }

      // Push context providers early to prevent context stack mismatches.
      // During mounting we don't know the child context yet as the instance doesn't exist.
      // We will invalidate the child context in finishClassComponent() right after rendering.
      var hasContext = pushLegacyContextProvider(workInProgress);
      adoptClassInstance(workInProgress, value);
      mountClassInstance(workInProgress, renderExpirationTime);
      return finishClassComponent(
        current,
        workInProgress,
        true,
        hasContext,
        false,
        renderExpirationTime
      );
    } else {
      // Proceed under the assumption that this is a functional component
      workInProgress.tag = FunctionalComponent;
      {
        var _Component = workInProgress.type;

        if (_Component) {
          !!_Component.childContextTypes
            ? warning(
                false,
                "%s(...): childContextTypes cannot be defined on a functional component.",
                _Component.displayName || _Component.name || "Component"
              )
            : void 0;
        }
        if (workInProgress.ref !== null) {
          var info = "";
          var ownerName = ReactDebugCurrentFiber.getCurrentFiberOwnerName();
          if (ownerName) {
            info += "\n\nCheck the render method of `" + ownerName + "`.";
          }

          var warningKey = ownerName || workInProgress._debugID || "";
          var debugSource = workInProgress._debugSource;
          if (debugSource) {
            warningKey = debugSource.fileName + ":" + debugSource.lineNumber;
          }
          if (!didWarnAboutStatelessRefs[warningKey]) {
            didWarnAboutStatelessRefs[warningKey] = true;
            warning(
              false,
              "Stateless function components cannot be given refs. " +
                "Attempts to access this ref will fail.%s%s",
              info,
              ReactDebugCurrentFiber.getCurrentFiberStackAddendum()
            );
          }
        }

        if (typeof fn.getDerivedStateFromProps === "function") {
          var _componentName = getComponentName(workInProgress) || "Unknown";

          if (
            !didWarnAboutGetDerivedStateOnFunctionalComponent[_componentName]
          ) {
            warning(
              false,
              "%s: Stateless functional components do not support getDerivedStateFromProps.",
              _componentName
            );
            didWarnAboutGetDerivedStateOnFunctionalComponent[
              _componentName
            ] = true;
          }
        }
      }
      reconcileChildren(current, workInProgress, value);
      memoizeProps(workInProgress, props);
      return workInProgress.child;
    }
  }

  function updateCallComponent(current, workInProgress, renderExpirationTime) {
    var nextProps = workInProgress.pendingProps;
    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (workInProgress.memoizedProps === nextProps) {
      nextProps = workInProgress.memoizedProps;
      // TODO: When bailing out, we might need to return the stateNode instead
      // of the child. To check it for work.
      // return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    var nextChildren = nextProps.children;

    // The following is a fork of reconcileChildrenAtExpirationTime but using
    // stateNode to store the child.
    if (current === null) {
      workInProgress.stateNode = mountChildFibers(
        workInProgress,
        workInProgress.stateNode,
        nextChildren,
        renderExpirationTime
      );
    } else {
      workInProgress.stateNode = reconcileChildFibers(
        workInProgress,
        current.stateNode,
        nextChildren,
        renderExpirationTime
      );
    }

    memoizeProps(workInProgress, nextProps);
    // This doesn't take arbitrary time so we could synchronously just begin
    // eagerly do the work of workInProgress.child as an optimization.
    return workInProgress.stateNode;
  }

  function updatePortalComponent(
    current,
    workInProgress,
    renderExpirationTime
  ) {
    pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
    var nextChildren = workInProgress.pendingProps;
    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (workInProgress.memoizedProps === nextChildren) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    if (current === null) {
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
      memoizeProps(workInProgress, nextChildren);
    } else {
      reconcileChildren(current, workInProgress, nextChildren);
      memoizeProps(workInProgress, nextChildren);
    }
    return workInProgress.child;
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
      fiber["return"] = workInProgress;
    }
    while (fiber !== null) {
      var nextFiber = void 0;
      // Visit this fiber.
      switch (fiber.tag) {
        case ContextConsumer:
          // Check if the context matches.
          var observedBits = fiber.stateNode | 0;
          if (fiber.type === context && (observedBits & changedBits) !== 0) {
            // Update the expiration time of all the ancestors, including
            // the alternates.
            var node = fiber;
            while (node !== null) {
              var alternate = node.alternate;
              if (
                node.expirationTime === NoWork ||
                node.expirationTime > renderExpirationTime
              ) {
                node.expirationTime = renderExpirationTime;
                if (
                  alternate !== null &&
                  (alternate.expirationTime === NoWork ||
                    alternate.expirationTime > renderExpirationTime)
                ) {
                  alternate.expirationTime = renderExpirationTime;
                }
              } else if (
                alternate !== null &&
                (alternate.expirationTime === NoWork ||
                  alternate.expirationTime > renderExpirationTime)
              ) {
                alternate.expirationTime = renderExpirationTime;
              } else {
                // Neither alternate was updated, which means the rest of the
                // ancestor path already has sufficient priority.
                break;
              }
              node = node["return"];
            }
            // Don't scan deeper than a matching consumer. When we render the
            // consumer, we'll continue scanning from that point. This way the
            // scanning work is time-sliced.
            nextFiber = null;
          } else {
            // Traverse down.
            nextFiber = fiber.child;
          }
          break;
        case ContextProvider:
          // Don't scan deeper if this is a matching provider
          nextFiber = fiber.type === workInProgress.type ? null : fiber.child;
          break;
        default:
          // Traverse down.
          nextFiber = fiber.child;
          break;
      }
      if (nextFiber !== null) {
        // Set the return pointer of the child to the work-in-progress fiber.
        nextFiber["return"] = fiber;
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
            nextFiber = sibling;
            break;
          }
          // No more siblings. Traverse up.
          nextFiber = nextFiber["return"];
        }
      }
      fiber = nextFiber;
    }
  }

  function updateContextProvider(
    current,
    workInProgress,
    renderExpirationTime
  ) {
    var providerType = workInProgress.type;
    var context = providerType._context;

    var newProps = workInProgress.pendingProps;
    var oldProps = workInProgress.memoizedProps;

    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (oldProps === newProps) {
      workInProgress.stateNode = 0;
      pushProvider(workInProgress);
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    var newValue = newProps.value;
    workInProgress.memoizedProps = newProps;

    var changedBits = void 0;
    if (oldProps === null) {
      // Initial render
      changedBits = MAX_SIGNED_31_BIT_INT;
    } else {
      if (oldProps.value === newProps.value) {
        // No change. Bailout early if children are the same.
        if (oldProps.children === newProps.children) {
          workInProgress.stateNode = 0;
          pushProvider(workInProgress);
          return bailoutOnAlreadyFinishedWork(current, workInProgress);
        }
        changedBits = 0;
      } else {
        var oldValue = oldProps.value;
        // Use Object.is to compare the new context value to the old value.
        // Inlined Object.is polyfill.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
        if (
          (oldValue === newValue &&
            (oldValue !== 0 || 1 / oldValue === 1 / newValue)) ||
          (oldValue !== oldValue && newValue !== newValue) // eslint-disable-line no-self-compare
        ) {
          // No change. Bailout early if children are the same.
          if (oldProps.children === newProps.children) {
            workInProgress.stateNode = 0;
            pushProvider(workInProgress);
            return bailoutOnAlreadyFinishedWork(current, workInProgress);
          }
          changedBits = 0;
        } else {
          changedBits =
            typeof context._calculateChangedBits === "function"
              ? context._calculateChangedBits(oldValue, newValue)
              : MAX_SIGNED_31_BIT_INT;
          {
            !((changedBits & MAX_SIGNED_31_BIT_INT) === changedBits)
              ? warning(
                  false,
                  "calculateChangedBits: Expected the return value to be a " +
                    "31-bit integer. Instead received: %s",
                  changedBits
                )
              : void 0;
          }
          changedBits |= 0;

          if (changedBits === 0) {
            // No change. Bailout early if children are the same.
            if (oldProps.children === newProps.children) {
              workInProgress.stateNode = 0;
              pushProvider(workInProgress);
              return bailoutOnAlreadyFinishedWork(current, workInProgress);
            }
          } else {
            propagateContextChange(
              workInProgress,
              context,
              changedBits,
              renderExpirationTime
            );
          }
        }
      }
    }

    workInProgress.stateNode = changedBits;
    pushProvider(workInProgress);

    var newChildren = newProps.children;
    reconcileChildren(current, workInProgress, newChildren);
    return workInProgress.child;
  }

  function updateContextConsumer(
    current,
    workInProgress,
    renderExpirationTime
  ) {
    var context = workInProgress.type;
    var newProps = workInProgress.pendingProps;
    var oldProps = workInProgress.memoizedProps;

    var newValue = context._currentValue;
    var changedBits = context._changedBits;

    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (changedBits === 0 && oldProps === newProps) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }
    workInProgress.memoizedProps = newProps;

    var observedBits = newProps.unstable_observedBits;
    if (observedBits === undefined || observedBits === null) {
      // Subscribe to all changes by default
      observedBits = MAX_SIGNED_31_BIT_INT;
    }
    // Store the observedBits on the fiber's stateNode for quick access.
    workInProgress.stateNode = observedBits;

    if ((changedBits & observedBits) !== 0) {
      // Context change propagation stops at matching consumers, for time-
      // slicing. Continue the propagation here.
      propagateContextChange(
        workInProgress,
        context,
        changedBits,
        renderExpirationTime
      );
    }
    // There is no bailout on `children` equality because we expect people
    // to often pass a bound method as a child, but it may reference
    // `this.state` or `this.props` (and thus needs to re-render on `setState`).

    var render = newProps.children;

    {
      !(typeof render === "function")
        ? warning(
            false,
            "A context consumer was rendered with multiple children, or a child " +
              "that isn't a function. A context consumer expects a single child " +
              "that is a function. If you did pass a function, make sure there " +
              "is no trailing or leading whitespace around it."
          )
        : void 0;
    }

    var newChildren = render(newValue);
    reconcileChildren(current, workInProgress, newChildren);
    return workInProgress.child;
  }

  /*
  function reuseChildrenEffects(returnFiber : Fiber, firstChild : Fiber) {
    let child = firstChild;
    do {
      // Ensure that the first and last effect of the parent corresponds
      // to the children's first and last effect.
      if (!returnFiber.firstEffect) {
        returnFiber.firstEffect = child.firstEffect;
      }
      if (child.lastEffect) {
        if (returnFiber.lastEffect) {
          returnFiber.lastEffect.nextEffect = child.firstEffect;
        }
        returnFiber.lastEffect = child.lastEffect;
      }
    } while (child = child.sibling);
  }
  */

  function bailoutOnAlreadyFinishedWork(current, workInProgress) {
    cancelWorkTimer(workInProgress);

    // TODO: We should ideally be able to bail out early if the children have no
    // more work to do. However, since we don't have a separation of this
    // Fiber's priority and its children yet - we don't know without doing lots
    // of the same work we do anyway. Once we have that separation we can just
    // bail out here if the children has no more work at this priority level.
    // if (workInProgress.priorityOfChildren <= priorityLevel) {
    //   // If there are side-effects in these children that have not yet been
    //   // committed we need to ensure that they get properly transferred up.
    //   if (current && current.child !== workInProgress.child) {
    //     reuseChildrenEffects(workInProgress, child);
    //   }
    //   return null;
    // }

    cloneChildFibers(current, workInProgress);
    return workInProgress.child;
  }

  function bailoutOnLowPriority(current, workInProgress) {
    cancelWorkTimer(workInProgress);

    // TODO: Handle HostComponent tags here as well and call pushHostContext()?
    // See PR 8590 discussion for context
    switch (workInProgress.tag) {
      case HostRoot:
        pushHostRootContext(workInProgress);
        break;
      case ClassComponent:
        pushLegacyContextProvider(workInProgress);
        break;
      case HostPortal:
        pushHostContainer(
          workInProgress,
          workInProgress.stateNode.containerInfo
        );
        break;
      case ContextProvider:
        pushProvider(workInProgress);
        break;
    }
    // TODO: What if this is currently in progress?
    // How can that happen? How is this not being cloned?
    return null;
  }

  // TODO: Delete memoizeProps/State and move to reconcile/bailout instead
  function memoizeProps(workInProgress, nextProps) {
    workInProgress.memoizedProps = nextProps;
  }

  function memoizeState(workInProgress, nextState) {
    workInProgress.memoizedState = nextState;
    // Don't reset the updateQueue, in case there are pending updates. Resetting
    // is handled by processUpdateQueue.
  }

  function beginWork(current, workInProgress, renderExpirationTime) {
    if (
      workInProgress.expirationTime === NoWork ||
      workInProgress.expirationTime > renderExpirationTime
    ) {
      return bailoutOnLowPriority(current, workInProgress);
    }

    switch (workInProgress.tag) {
      case IndeterminateComponent:
        return mountIndeterminateComponent(
          current,
          workInProgress,
          renderExpirationTime
        );
      case FunctionalComponent:
        return updateFunctionalComponent(current, workInProgress);
      case ClassComponent:
        return updateClassComponent(
          current,
          workInProgress,
          renderExpirationTime
        );
      case HostRoot:
        return updateHostRoot(current, workInProgress, renderExpirationTime);
      case HostComponent:
        return updateHostComponent(
          current,
          workInProgress,
          renderExpirationTime
        );
      case HostText:
        return updateHostText(current, workInProgress);
      case CallHandlerPhase:
        // This is a restart. Reset the tag to the initial phase.
        workInProgress.tag = CallComponent;
      // Intentionally fall through since this is now the same.
      case CallComponent:
        return updateCallComponent(
          current,
          workInProgress,
          renderExpirationTime
        );
      case ReturnComponent:
        // A return component is just a placeholder, we can just run through the
        // next one immediately.
        return null;
      case HostPortal:
        return updatePortalComponent(
          current,
          workInProgress,
          renderExpirationTime
        );
      case ForwardRef:
        return updateForwardRef(current, workInProgress);
      case Fragment:
        return updateFragment(current, workInProgress);
      case Mode:
        return updateMode(current, workInProgress);
      case ContextProvider:
        return updateContextProvider(
          current,
          workInProgress,
          renderExpirationTime
        );
      case ContextConsumer:
        return updateContextConsumer(
          current,
          workInProgress,
          renderExpirationTime
        );
      default:
        invariant(
          false,
          "Unknown unit of work tag. This error is likely caused by a bug in " +
            "React. Please file an issue."
        );
    }
  }

  return {
    beginWork: beginWork
  };
};

var ReactFiberCompleteWork = function(
  config,
  hostContext,
  legacyContext,
  newContext,
  hydrationContext
) {
  var createInstance = config.createInstance,
    createTextInstance = config.createTextInstance,
    appendInitialChild = config.appendInitialChild,
    finalizeInitialChildren = config.finalizeInitialChildren,
    prepareUpdate = config.prepareUpdate,
    mutation = config.mutation,
    persistence = config.persistence;
  var getRootHostContainer = hostContext.getRootHostContainer,
    popHostContext = hostContext.popHostContext,
    getHostContext = hostContext.getHostContext,
    popHostContainer = hostContext.popHostContainer;
  var popLegacyContextProvider = legacyContext.popContextProvider,
    popTopLevelLegacyContextObject = legacyContext.popTopLevelContextObject;
  var popProvider = newContext.popProvider;
  var prepareToHydrateHostInstance =
      hydrationContext.prepareToHydrateHostInstance,
    prepareToHydrateHostTextInstance =
      hydrationContext.prepareToHydrateHostTextInstance,
    popHydrationState = hydrationContext.popHydrationState;

  function markUpdate(workInProgress) {
    // Tag the fiber with an update effect. This turns a Placement into
    // an UpdateAndPlacement.
    workInProgress.effectTag |= Update;
  }

  function markRef(workInProgress) {
    workInProgress.effectTag |= Ref;
  }

  function appendAllReturns(returns, workInProgress) {
    var node = workInProgress.stateNode;
    if (node) {
      node["return"] = workInProgress;
    }
    while (node !== null) {
      if (
        node.tag === HostComponent ||
        node.tag === HostText ||
        node.tag === HostPortal
      ) {
        invariant(false, "A call cannot have host component children.");
      } else if (node.tag === ReturnComponent) {
        returns.push(node.pendingProps.value);
      } else if (node.child !== null) {
        node.child["return"] = node;
        node = node.child;
        continue;
      }
      while (node.sibling === null) {
        if (node["return"] === null || node["return"] === workInProgress) {
          return;
        }
        node = node["return"];
      }
      node.sibling["return"] = node["return"];
      node = node.sibling;
    }
  }

  function moveCallToHandlerPhase(
    current,
    workInProgress,
    renderExpirationTime
  ) {
    var props = workInProgress.memoizedProps;
    invariant(
      props,
      "Should be resolved by now. This error is likely caused by a bug in " +
        "React. Please file an issue."
    );

    // First step of the call has completed. Now we need to do the second.
    // TODO: It would be nice to have a multi stage call represented by a
    // single component, or at least tail call optimize nested ones. Currently
    // that requires additional fields that we don't want to add to the fiber.
    // So this requires nested handlers.
    // Note: This doesn't mutate the alternate node. I don't think it needs to
    // since this stage is reset for every pass.
    workInProgress.tag = CallHandlerPhase;

    // Build up the returns.
    // TODO: Compare this to a generator or opaque helpers like Children.
    var returns = [];
    appendAllReturns(returns, workInProgress);
    var fn = props.handler;
    var childProps = props.props;
    var nextChildren = fn(childProps, returns);

    var currentFirstChild = current !== null ? current.child : null;
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      currentFirstChild,
      nextChildren,
      renderExpirationTime
    );
    return workInProgress.child;
  }

  function appendAllChildren(parent, workInProgress) {
    // We only have the top Fiber that was created but we need recurse down its
    // children to find all the terminal nodes.
    var node = workInProgress.child;
    while (node !== null) {
      if (node.tag === HostComponent || node.tag === HostText) {
        appendInitialChild(parent, node.stateNode);
      } else if (node.tag === HostPortal) {
        // If we have a portal child, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
      } else if (node.child !== null) {
        node.child["return"] = node;
        node = node.child;
        continue;
      }
      if (node === workInProgress) {
        return;
      }
      while (node.sibling === null) {
        if (node["return"] === null || node["return"] === workInProgress) {
          return;
        }
        node = node["return"];
      }
      node.sibling["return"] = node["return"];
      node = node.sibling;
    }
  }

  var updateHostContainer = void 0;
  var updateHostComponent = void 0;
  var updateHostText = void 0;
  if (mutation) {
    if (enableMutatingReconciler) {
      // Mutation mode
      updateHostContainer = function(workInProgress) {
        // Noop
      };
      updateHostComponent = function(
        current,
        workInProgress,
        updatePayload,
        type,
        oldProps,
        newProps,
        rootContainerInstance,
        currentHostContext
      ) {
        // TODO: Type this specific to this type of component.
        workInProgress.updateQueue = updatePayload;
        // If the update payload indicates that there is a change or if there
        // is a new ref we mark this as an update. All the work is done in commitWork.
        if (updatePayload) {
          markUpdate(workInProgress);
        }
      };
      updateHostText = function(current, workInProgress, oldText, newText) {
        // If the text differs, mark it as an update. All the work in done in commitWork.
        if (oldText !== newText) {
          markUpdate(workInProgress);
        }
      };
    } else {
      invariant(false, "Mutating reconciler is disabled.");
    }
  } else if (persistence) {
    if (enablePersistentReconciler) {
      // Persistent host tree mode
      var cloneInstance = persistence.cloneInstance,
        createContainerChildSet = persistence.createContainerChildSet,
        appendChildToContainerChildSet =
          persistence.appendChildToContainerChildSet,
        finalizeContainerChildren = persistence.finalizeContainerChildren;

      // An unfortunate fork of appendAllChildren because we have two different parent types.

      var appendAllChildrenToContainer = function(
        containerChildSet,
        workInProgress
      ) {
        // We only have the top Fiber that was created but we need recurse down its
        // children to find all the terminal nodes.
        var node = workInProgress.child;
        while (node !== null) {
          if (node.tag === HostComponent || node.tag === HostText) {
            appendChildToContainerChildSet(containerChildSet, node.stateNode);
          } else if (node.tag === HostPortal) {
            // If we have a portal child, then we don't want to traverse
            // down its children. Instead, we'll get insertions from each child in
            // the portal directly.
          } else if (node.child !== null) {
            node.child["return"] = node;
            node = node.child;
            continue;
          }
          if (node === workInProgress) {
            return;
          }
          while (node.sibling === null) {
            if (node["return"] === null || node["return"] === workInProgress) {
              return;
            }
            node = node["return"];
          }
          node.sibling["return"] = node["return"];
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
          var newChildSet = createContainerChildSet(container);
          // If children might have changed, we have to add them all to the set.
          appendAllChildrenToContainer(newChildSet, workInProgress);
          portalOrRoot.pendingChildren = newChildSet;
          // Schedule an update on the container to swap out the container.
          markUpdate(workInProgress);
          finalizeContainerChildren(container, newChildSet);
        }
      };
      updateHostComponent = function(
        current,
        workInProgress,
        updatePayload,
        type,
        oldProps,
        newProps,
        rootContainerInstance,
        currentHostContext
      ) {
        // If there are no effects associated with this node, then none of our children had any updates.
        // This guarantees that we can reuse all of them.
        var childrenUnchanged = workInProgress.firstEffect === null;
        var currentInstance = current.stateNode;
        if (childrenUnchanged && updatePayload === null) {
          // No changes, just reuse the existing instance.
          // Note that this might release a previous clone.
          workInProgress.stateNode = currentInstance;
        } else {
          var recyclableInstance = workInProgress.stateNode;
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
            appendAllChildren(newInstance, workInProgress);
          }
        }
      };
      updateHostText = function(current, workInProgress, oldText, newText) {
        if (oldText !== newText) {
          // If the text content differs, we'll create a new text instance for it.
          var rootContainerInstance = getRootHostContainer();
          var currentHostContext = getHostContext();
          workInProgress.stateNode = createTextInstance(
            newText,
            rootContainerInstance,
            currentHostContext,
            workInProgress
          );
          // We'll have to mark it as having an effect, even though we won't use the effect for anything.
          // This lets the parents know that at least one of their children has changed.
          markUpdate(workInProgress);
        }
      };
    } else {
      invariant(false, "Persistent reconciler is disabled.");
    }
  } else {
    if (enableNoopReconciler) {
      // No host operations
      updateHostContainer = function(workInProgress) {
        // Noop
      };
      updateHostComponent = function(
        current,
        workInProgress,
        updatePayload,
        type,
        oldProps,
        newProps,
        rootContainerInstance,
        currentHostContext
      ) {
        // Noop
      };
      updateHostText = function(current, workInProgress, oldText, newText) {
        // Noop
      };
    } else {
      invariant(false, "Noop reconciler is disabled.");
    }
  }

  function completeWork(current, workInProgress, renderExpirationTime) {
    var newProps = workInProgress.pendingProps;
    switch (workInProgress.tag) {
      case FunctionalComponent:
        return null;
      case ClassComponent: {
        // We are leaving this subtree, so pop context if any.
        popLegacyContextProvider(workInProgress);

        // If this component caught an error, schedule an error log effect.
        var instance = workInProgress.stateNode;
        var updateQueue = workInProgress.updateQueue;
        if (updateQueue !== null && updateQueue.capturedValues !== null) {
          workInProgress.effectTag &= ~DidCapture;
          if (typeof instance.componentDidCatch === "function") {
            workInProgress.effectTag |= ErrLog;
          } else {
            // Normally we clear this in the commit phase, but since we did not
            // schedule an effect, we need to reset it here.
            updateQueue.capturedValues = null;
          }
        }
        return null;
      }
      case HostRoot: {
        popHostContainer(workInProgress);
        popTopLevelLegacyContextObject(workInProgress);
        var fiberRoot = workInProgress.stateNode;
        if (fiberRoot.pendingContext) {
          fiberRoot.context = fiberRoot.pendingContext;
          fiberRoot.pendingContext = null;
        }
        if (current === null || current.child === null) {
          // If we hydrated, pop so that we can delete any remaining children
          // that weren't hydrated.
          popHydrationState(workInProgress);
          // This resets the hacky state to fix isMounted before committing.
          // TODO: Delete this when we delete isMounted and findDOMNode.
          workInProgress.effectTag &= ~Placement;
        }
        updateHostContainer(workInProgress);

        var _updateQueue = workInProgress.updateQueue;
        if (_updateQueue !== null && _updateQueue.capturedValues !== null) {
          workInProgress.effectTag |= ErrLog;
        }
        return null;
      }
      case HostComponent: {
        popHostContext(workInProgress);
        var rootContainerInstance = getRootHostContainer();
        var type = workInProgress.type;
        if (current !== null && workInProgress.stateNode != null) {
          // If we have an alternate, that means this is an update and we need to
          // schedule a side-effect to do the updates.
          var oldProps = current.memoizedProps;
          // If we get updated because one of our children updated, we don't
          // have newProps so we'll have to reuse them.
          // TODO: Split the update API as separate for the props vs. children.
          // Even better would be if children weren't special cased at all tho.
          var _instance = workInProgress.stateNode;
          var currentHostContext = getHostContext();
          // TODO: Experiencing an error where oldProps is null. Suggests a host
          // component is hitting the resume path. Figure out why. Possibly
          // related to `hidden`.
          var updatePayload = prepareUpdate(
            _instance,
            type,
            oldProps,
            newProps,
            rootContainerInstance,
            currentHostContext
          );

          updateHostComponent(
            current,
            workInProgress,
            updatePayload,
            type,
            oldProps,
            newProps,
            rootContainerInstance,
            currentHostContext
          );

          if (current.ref !== workInProgress.ref) {
            markRef(workInProgress);
          }
        } else {
          if (!newProps) {
            invariant(
              workInProgress.stateNode !== null,
              "We must have new props for new mounts. This error is likely " +
                "caused by a bug in React. Please file an issue."
            );
            // This can happen when we abort work.
            return null;
          }

          var _currentHostContext = getHostContext();
          // TODO: Move createInstance to beginWork and keep it on a context
          // "stack" as the parent. Then append children as we go in beginWork
          // or completeWork depending on we want to add then top->down or
          // bottom->up. Top->down is faster in IE11.
          var wasHydrated = popHydrationState(workInProgress);
          if (wasHydrated) {
            // TODO: Move this and createInstance step into the beginPhase
            // to consolidate.
            if (
              prepareToHydrateHostInstance(
                workInProgress,
                rootContainerInstance,
                _currentHostContext
              )
            ) {
              // If changes to the hydrated node needs to be applied at the
              // commit-phase we mark this as such.
              markUpdate(workInProgress);
            }
          } else {
            var _instance2 = createInstance(
              type,
              newProps,
              rootContainerInstance,
              _currentHostContext,
              workInProgress
            );

            appendAllChildren(_instance2, workInProgress);

            // Certain renderers require commit-time effects for initial mount.
            // (eg DOM renderer supports auto-focus for certain elements).
            // Make sure such renderers get scheduled for later work.
            if (
              finalizeInitialChildren(
                _instance2,
                type,
                newProps,
                rootContainerInstance,
                _currentHostContext
              )
            ) {
              markUpdate(workInProgress);
            }
            workInProgress.stateNode = _instance2;
          }

          if (workInProgress.ref !== null) {
            // If there is a ref on a host node we need to schedule a callback
            markRef(workInProgress);
          }
        }
        return null;
      }
      case HostText: {
        var newText = newProps;
        if (current && workInProgress.stateNode != null) {
          var oldText = current.memoizedProps;
          // If we have an alternate, that means this is an update and we need
          // to schedule a side-effect to do the updates.
          updateHostText(current, workInProgress, oldText, newText);
        } else {
          if (typeof newText !== "string") {
            invariant(
              workInProgress.stateNode !== null,
              "We must have new props for new mounts. This error is likely " +
                "caused by a bug in React. Please file an issue."
            );
            // This can happen when we abort work.
            return null;
          }
          var _rootContainerInstance = getRootHostContainer();
          var _currentHostContext2 = getHostContext();
          var _wasHydrated = popHydrationState(workInProgress);
          if (_wasHydrated) {
            if (prepareToHydrateHostTextInstance(workInProgress)) {
              markUpdate(workInProgress);
            }
          } else {
            workInProgress.stateNode = createTextInstance(
              newText,
              _rootContainerInstance,
              _currentHostContext2,
              workInProgress
            );
          }
        }
        return null;
      }
      case CallComponent:
        return moveCallToHandlerPhase(
          current,
          workInProgress,
          renderExpirationTime
        );
      case CallHandlerPhase:
        // Reset the tag to now be a first phase call.
        workInProgress.tag = CallComponent;
        return null;
      case ReturnComponent:
        // Does nothing.
        return null;
      case ForwardRef:
        return null;
      case Fragment:
        return null;
      case Mode:
        return null;
      case HostPortal:
        popHostContainer(workInProgress);
        updateHostContainer(workInProgress);
        return null;
      case ContextProvider:
        // Pop provider fiber
        popProvider(workInProgress);
        return null;
      case ContextConsumer:
        return null;
      // Error cases
      case IndeterminateComponent:
        invariant(
          false,
          "An indeterminate component should have become determinate before " +
            "completing. This error is likely caused by a bug in React. Please " +
            "file an issue."
        );
      // eslint-disable-next-line no-fallthrough
      default:
        invariant(
          false,
          "Unknown unit of work tag. This error is likely caused by a bug in " +
            "React. Please file an issue."
        );
    }
  }

  return {
    completeWork: completeWork
  };
};

function createCapturedValue(value, source) {
  // If the value is an error, call this function immediately after it is thrown
  // so the stack is accurate.
  return {
    value: value,
    source: source,
    stack: getStackAddendumByWorkInProgressFiber(source)
  };
}

var ReactFiberUnwindWork = function(
  hostContext,
  legacyContext,
  newContext,
  scheduleWork,
  isAlreadyFailedLegacyErrorBoundary
) {
  var popHostContainer = hostContext.popHostContainer,
    popHostContext = hostContext.popHostContext;
  var popLegacyContextProvider = legacyContext.popContextProvider,
    popTopLevelLegacyContextObject = legacyContext.popTopLevelContextObject;
  var popProvider = newContext.popProvider;

  function throwException(returnFiber, sourceFiber, rawValue) {
    // The source fiber did not complete.
    sourceFiber.effectTag |= Incomplete;
    // Its effect list is no longer valid.
    sourceFiber.firstEffect = sourceFiber.lastEffect = null;

    var value = createCapturedValue(rawValue, sourceFiber);

    var workInProgress = returnFiber;
    do {
      switch (workInProgress.tag) {
        case HostRoot: {
          // Uncaught error
          var errorInfo = value;
          ensureUpdateQueues(workInProgress);
          var updateQueue = workInProgress.updateQueue;
          updateQueue.capturedValues = [errorInfo];
          workInProgress.effectTag |= ShouldCapture;
          return;
        }
        case ClassComponent:
          // Capture and retry
          var ctor = workInProgress.type;
          var _instance = workInProgress.stateNode;
          if (
            (workInProgress.effectTag & DidCapture) === NoEffect &&
            ((typeof ctor.getDerivedStateFromCatch === "function" &&
              enableGetDerivedStateFromCatch) ||
              (_instance !== null &&
                typeof _instance.componentDidCatch === "function" &&
                !isAlreadyFailedLegacyErrorBoundary(_instance)))
          ) {
            ensureUpdateQueues(workInProgress);
            var _updateQueue = workInProgress.updateQueue;
            var capturedValues = _updateQueue.capturedValues;
            if (capturedValues === null) {
              _updateQueue.capturedValues = [value];
            } else {
              capturedValues.push(value);
            }
            workInProgress.effectTag |= ShouldCapture;
            return;
          }
          break;
        default:
          break;
      }
      workInProgress = workInProgress["return"];
    } while (workInProgress !== null);
  }

  function unwindWork(workInProgress) {
    switch (workInProgress.tag) {
      case ClassComponent: {
        popLegacyContextProvider(workInProgress);
        var effectTag = workInProgress.effectTag;
        if (effectTag & ShouldCapture) {
          workInProgress.effectTag = (effectTag & ~ShouldCapture) | DidCapture;
          return workInProgress;
        }
        return null;
      }
      case HostRoot: {
        popHostContainer(workInProgress);
        popTopLevelLegacyContextObject(workInProgress);
        var _effectTag = workInProgress.effectTag;
        if (_effectTag & ShouldCapture) {
          workInProgress.effectTag = (_effectTag & ~ShouldCapture) | DidCapture;
          return workInProgress;
        }
        return null;
      }
      case HostComponent: {
        popHostContext(workInProgress);
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
        popLegacyContextProvider(interruptedWork);
        break;
      }
      case HostRoot: {
        popHostContainer(interruptedWork);
        popTopLevelLegacyContextObject(interruptedWork);
        break;
      }
      case HostComponent: {
        popHostContext(interruptedWork);
        break;
      }
      case HostPortal:
        popHostContainer(interruptedWork);
        break;
      case ContextProvider:
        popProvider(interruptedWork);
        break;
      default:
        break;
    }
  }

  return {
    throwException: throwException,
    unwindWork: unwindWork,
    unwindInterruptedWork: unwindInterruptedWork
  };
};

// This module is forked in different environments.
// By default, return `true` to log errors to the console.
// Forks can return `false` if this isn't desirable.
function showErrorDialog(capturedError) {
  return true;
}

function logCapturedError(capturedError) {
  var logError = showErrorDialog(capturedError);

  // Allow injected showErrorDialog() to prevent default console.error logging.
  // This enables renderers like ReactNative to better manage redbox behavior.
  if (logError === false) {
    return;
  }

  var error = capturedError.error;
  var suppressLogging = error && error.suppressReactErrorLogging;
  if (suppressLogging) {
    return;
  }

  {
    var componentName = capturedError.componentName,
      componentStack = capturedError.componentStack,
      errorBoundaryName = capturedError.errorBoundaryName,
      errorBoundaryFound = capturedError.errorBoundaryFound,
      willRetry = capturedError.willRetry;

    var componentNameMessage = componentName
      ? "The above error occurred in the <" + componentName + "> component:"
      : "The above error occurred in one of your React components:";

    var errorBoundaryMessage = void 0;
    // errorBoundaryFound check is sufficient; errorBoundaryName check is to satisfy Flow.
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
      ("" + errorBoundaryMessage);

    // In development, we provide our own message with just the component stack.
    // We don't include the original error message and JS stack because the browser
    // has already printed it. Even if the application swallows the error, it is still
    // displayed by the browser thanks to the DEV-only fake event trick in ReactErrorUtils.
    console.error(combinedMessage);
  }
}

var invokeGuardedCallback$3 = ReactErrorUtils.invokeGuardedCallback;
var hasCaughtError$1 = ReactErrorUtils.hasCaughtError;
var clearCaughtError$1 = ReactErrorUtils.clearCaughtError;

var didWarnAboutUndefinedSnapshotBeforeUpdate = null;
{
  didWarnAboutUndefinedSnapshotBeforeUpdate = new Set();
}

function logError(boundary, errorInfo) {
  var source = errorInfo.source;
  var stack = errorInfo.stack;
  if (stack === null) {
    stack = getStackAddendumByWorkInProgressFiber(source);
  }

  var capturedError = {
    componentName: source !== null ? getComponentName(source) : null,
    componentStack: stack !== null ? stack : "",
    error: errorInfo.value,
    errorBoundary: null,
    errorBoundaryName: null,
    errorBoundaryFound: false,
    willRetry: false
  };

  if (boundary !== null && boundary.tag === ClassComponent) {
    capturedError.errorBoundary = boundary.stateNode;
    capturedError.errorBoundaryName = getComponentName(boundary);
    capturedError.errorBoundaryFound = true;
    capturedError.willRetry = true;
  }

  try {
    logCapturedError(capturedError);
  } catch (e) {
    // Prevent cycle if logCapturedError() throws.
    // A cycle may still occur if logCapturedError renders a component that throws.
    var suppressLogging = e && e.suppressReactErrorLogging;
    if (!suppressLogging) {
      console.error(e);
    }
  }
}

var ReactFiberCommitWork = function(
  config,
  captureError,
  scheduleWork,
  computeExpirationForFiber,
  markLegacyErrorBoundaryAsFailed,
  recalculateCurrentTime
) {
  var getPublicInstance = config.getPublicInstance,
    mutation = config.mutation,
    persistence = config.persistence;

  var callComponentWillUnmountWithTimer = function(current, instance) {
    startPhaseTimer(current, "componentWillUnmount");
    instance.props = current.memoizedProps;
    instance.state = current.memoizedState;
    instance.componentWillUnmount();
    stopPhaseTimer();
  };

  // Capture errors so they don't interrupt unmounting.
  function safelyCallComponentWillUnmount(current, instance) {
    {
      invokeGuardedCallback$3(
        null,
        callComponentWillUnmountWithTimer,
        null,
        current,
        instance
      );
      if (hasCaughtError$1()) {
        var unmountError = clearCaughtError$1();
        captureError(current, unmountError);
      }
    }
  }

  function safelyDetachRef(current) {
    var ref = current.ref;
    if (ref !== null) {
      if (typeof ref === "function") {
        {
          invokeGuardedCallback$3(null, ref, null, null);
          if (hasCaughtError$1()) {
            var refError = clearCaughtError$1();
            captureError(current, refError);
          }
        }
      } else {
        ref.current = null;
      }
    }
  }

  function commitBeforeMutationLifeCycles(current, finishedWork) {
    switch (finishedWork.tag) {
      case ClassComponent: {
        if (finishedWork.effectTag & Snapshot) {
          if (current !== null) {
            var prevProps = current.memoizedProps;
            var prevState = current.memoizedState;
            startPhaseTimer(finishedWork, "getSnapshotBeforeUpdate");
            var _instance = finishedWork.stateNode;
            _instance.props = finishedWork.memoizedProps;
            _instance.state = finishedWork.memoizedState;
            var snapshot = _instance.getSnapshotBeforeUpdate(
              prevProps,
              prevState
            );
            {
              var didWarnSet = didWarnAboutUndefinedSnapshotBeforeUpdate;
              if (
                snapshot === undefined &&
                !didWarnSet.has(finishedWork.type)
              ) {
                didWarnSet.add(finishedWork.type);
                warning(
                  false,
                  "%s.getSnapshotBeforeUpdate(): A snapshot value (or null) " +
                    "must be returned. You have returned undefined.",
                  getComponentName(finishedWork)
                );
              }
            }
            _instance.__reactInternalSnapshotBeforeUpdate = snapshot;
            stopPhaseTimer();
          }
        }
        return;
      }
      case HostRoot:
      case HostComponent:
      case HostText:
      case HostPortal:
        // Nothing to do for these component types
        return;
      default: {
        invariant(
          false,
          "This unit of work tag should not have side-effects. This error is " +
            "likely caused by a bug in React. Please file an issue."
        );
      }
    }
  }

  function commitLifeCycles(
    finishedRoot,
    current,
    finishedWork,
    currentTime,
    committedExpirationTime
  ) {
    switch (finishedWork.tag) {
      case ClassComponent: {
        var _instance2 = finishedWork.stateNode;
        if (finishedWork.effectTag & Update) {
          if (current === null) {
            startPhaseTimer(finishedWork, "componentDidMount");
            _instance2.props = finishedWork.memoizedProps;
            _instance2.state = finishedWork.memoizedState;
            _instance2.componentDidMount();
            stopPhaseTimer();
          } else {
            var prevProps = current.memoizedProps;
            var prevState = current.memoizedState;
            startPhaseTimer(finishedWork, "componentDidUpdate");
            _instance2.props = finishedWork.memoizedProps;
            _instance2.state = finishedWork.memoizedState;
            _instance2.componentDidUpdate(
              prevProps,
              prevState,
              _instance2.__reactInternalSnapshotBeforeUpdate
            );
            stopPhaseTimer();
          }
        }
        var updateQueue = finishedWork.updateQueue;
        if (updateQueue !== null) {
          commitCallbacks(updateQueue, _instance2);
        }
        return;
      }
      case HostRoot: {
        var _updateQueue = finishedWork.updateQueue;
        if (_updateQueue !== null) {
          var _instance3 = null;
          if (finishedWork.child !== null) {
            switch (finishedWork.child.tag) {
              case HostComponent:
                _instance3 = getPublicInstance(finishedWork.child.stateNode);
                break;
              case ClassComponent:
                _instance3 = finishedWork.child.stateNode;
                break;
            }
          }
          commitCallbacks(_updateQueue, _instance3);
        }
        return;
      }
      case HostComponent: {
        var _instance4 = finishedWork.stateNode;

        // Renderers may schedule work to be done after host components are mounted
        // (eg DOM renderer may schedule auto-focus for inputs and form controls).
        // These effects should only be committed when components are first mounted,
        // aka when there is no current/alternate.
        if (current === null && finishedWork.effectTag & Update) {
          var type = finishedWork.type;
          var props = finishedWork.memoizedProps;
          commitMount(_instance4, type, props, finishedWork);
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
      default: {
        invariant(
          false,
          "This unit of work tag should not have side-effects. This error is " +
            "likely caused by a bug in React. Please file an issue."
        );
      }
    }
  }

  function commitErrorLogging(finishedWork, onUncaughtError) {
    switch (finishedWork.tag) {
      case ClassComponent:
        {
          var ctor = finishedWork.type;
          var _instance5 = finishedWork.stateNode;
          var updateQueue = finishedWork.updateQueue;
          invariant(
            updateQueue !== null && updateQueue.capturedValues !== null,
            "An error logging effect should not have been scheduled if no errors " +
              "were captured. This error is likely caused by a bug in React. " +
              "Please file an issue."
          );
          var capturedErrors = updateQueue.capturedValues;
          updateQueue.capturedValues = null;

          if (typeof ctor.getDerivedStateFromCatch !== "function") {
            // To preserve the preexisting retry behavior of error boundaries,
            // we keep track of which ones already failed during this batch.
            // This gets reset before we yield back to the browser.
            // TODO: Warn in strict mode if getDerivedStateFromCatch is
            // not defined.
            markLegacyErrorBoundaryAsFailed(_instance5);
          }

          _instance5.props = finishedWork.memoizedProps;
          _instance5.state = finishedWork.memoizedState;
          for (var i = 0; i < capturedErrors.length; i++) {
            var errorInfo = capturedErrors[i];
            var _error = errorInfo.value;
            var stack = errorInfo.stack;
            logError(finishedWork, errorInfo);
            _instance5.componentDidCatch(_error, {
              componentStack: stack !== null ? stack : ""
            });
          }
        }
        break;
      case HostRoot: {
        var _updateQueue2 = finishedWork.updateQueue;
        invariant(
          _updateQueue2 !== null && _updateQueue2.capturedValues !== null,
          "An error logging effect should not have been scheduled if no errors " +
            "were captured. This error is likely caused by a bug in React. " +
            "Please file an issue."
        );
        var _capturedErrors = _updateQueue2.capturedValues;
        _updateQueue2.capturedValues = null;
        for (var _i = 0; _i < _capturedErrors.length; _i++) {
          var _errorInfo = _capturedErrors[_i];
          logError(finishedWork, _errorInfo);
          onUncaughtError(_errorInfo.value);
        }
        break;
      }
      default:
        invariant(
          false,
          "This unit of work tag cannot capture errors.  This error is " +
            "likely caused by a bug in React. Please file an issue."
        );
    }
  }

  function commitAttachRef(finishedWork) {
    var ref = finishedWork.ref;
    if (ref !== null) {
      var _instance6 = finishedWork.stateNode;
      var instanceToUse = void 0;
      switch (finishedWork.tag) {
        case HostComponent:
          instanceToUse = getPublicInstance(_instance6);
          break;
        default:
          instanceToUse = _instance6;
      }
      if (typeof ref === "function") {
        ref(instanceToUse);
      } else {
        {
          if (!ref.hasOwnProperty("current")) {
            warning(
              false,
              "Unexpected ref object provided for %s. " +
                "Use either a ref-setter function or React.createRef().%s",
              getComponentName(finishedWork),
              getStackAddendumByWorkInProgressFiber(finishedWork)
            );
          }
        }

        ref.current = instanceToUse;
      }
    }
  }

  function commitDetachRef(current) {
    var currentRef = current.ref;
    if (currentRef !== null) {
      if (typeof currentRef === "function") {
        currentRef(null);
      } else {
        currentRef.current = null;
      }
    }
  }

  // User-originating errors (lifecycles and refs) should not interrupt
  // deletion, so don't let them throw. Host-originating errors should
  // interrupt deletion, so it's okay
  function commitUnmount(current) {
    if (typeof onCommitUnmount === "function") {
      onCommitUnmount(current);
    }

    switch (current.tag) {
      case ClassComponent: {
        safelyDetachRef(current);
        var _instance7 = current.stateNode;
        if (typeof _instance7.componentWillUnmount === "function") {
          safelyCallComponentWillUnmount(current, _instance7);
        }
        return;
      }
      case HostComponent: {
        safelyDetachRef(current);
        return;
      }
      case CallComponent: {
        commitNestedUnmounts(current.stateNode);
        return;
      }
      case HostPortal: {
        // TODO: this is recursive.
        // We are also not using this parent because
        // the portal will get pushed immediately.
        if (enableMutatingReconciler && mutation) {
          unmountHostComponents(current);
        } else if (enablePersistentReconciler && persistence) {
          emptyPortalContainer(current);
        }
        return;
      }
    }
  }

  function commitNestedUnmounts(root) {
    // While we're inside a removed host node we don't want to call
    // removeChild on the inner nodes because they're removed by the top
    // call anyway. We also want to call componentWillUnmount on all
    // composites before this host node is removed from the tree. Therefore
    var node = root;
    while (true) {
      commitUnmount(node);
      // Visit children because they may contain more composite or host nodes.
      // Skip portals because commitUnmount() currently visits them recursively.
      if (
        node.child !== null &&
        // If we use mutation we drill down into portals using commitUnmount above.
        // If we don't use mutation we drill down into portals here instead.
        (!mutation || node.tag !== HostPortal)
      ) {
        node.child["return"] = node;
        node = node.child;
        continue;
      }
      if (node === root) {
        return;
      }
      while (node.sibling === null) {
        if (node["return"] === null || node["return"] === root) {
          return;
        }
        node = node["return"];
      }
      node.sibling["return"] = node["return"];
      node = node.sibling;
    }
  }

  function detachFiber(current) {
    // Cut off the return pointers to disconnect it from the tree. Ideally, we
    // should clear the child pointer of the parent alternate to let this
    // get GC:ed but we don't know which for sure which parent is the current
    // one so we'll settle for GC:ing the subtree of this child. This child
    // itself will be GC:ed when the parent updates the next time.
    current["return"] = null;
    current.child = null;
    if (current.alternate) {
      current.alternate.child = null;
      current.alternate["return"] = null;
    }
  }

  var emptyPortalContainer = void 0;

  if (!mutation) {
    var commitContainer = void 0;
    if (persistence) {
      var replaceContainerChildren = persistence.replaceContainerChildren,
        createContainerChildSet = persistence.createContainerChildSet;

      emptyPortalContainer = function(current) {
        var portal = current.stateNode;
        var containerInfo = portal.containerInfo;

        var emptyChildSet = createContainerChildSet(containerInfo);
        replaceContainerChildren(containerInfo, emptyChildSet);
      };
      commitContainer = function(finishedWork) {
        switch (finishedWork.tag) {
          case ClassComponent: {
            return;
          }
          case HostComponent: {
            return;
          }
          case HostText: {
            return;
          }
          case HostRoot:
          case HostPortal: {
            var portalOrRoot = finishedWork.stateNode;
            var containerInfo = portalOrRoot.containerInfo,
              _pendingChildren = portalOrRoot.pendingChildren;

            replaceContainerChildren(containerInfo, _pendingChildren);
            return;
          }
          default: {
            invariant(
              false,
              "This unit of work tag should not have side-effects. This error is " +
                "likely caused by a bug in React. Please file an issue."
            );
          }
        }
      };
    } else {
      commitContainer = function(finishedWork) {
        // Noop
      };
    }
    if (enablePersistentReconciler || enableNoopReconciler) {
      return {
        commitResetTextContent: function(finishedWork) {},
        commitPlacement: function(finishedWork) {},
        commitDeletion: function(current) {
          // Detach refs and call componentWillUnmount() on the whole subtree.
          commitNestedUnmounts(current);
          detachFiber(current);
        },
        commitWork: function(current, finishedWork) {
          commitContainer(finishedWork);
        },

        commitLifeCycles: commitLifeCycles,
        commitBeforeMutationLifeCycles: commitBeforeMutationLifeCycles,
        commitErrorLogging: commitErrorLogging,
        commitAttachRef: commitAttachRef,
        commitDetachRef: commitDetachRef
      };
    } else if (persistence) {
      invariant(false, "Persistent reconciler is disabled.");
    } else {
      invariant(false, "Noop reconciler is disabled.");
    }
  }
  var commitMount = mutation.commitMount,
    commitUpdate = mutation.commitUpdate,
    resetTextContent = mutation.resetTextContent,
    commitTextUpdate = mutation.commitTextUpdate,
    appendChild = mutation.appendChild,
    appendChildToContainer = mutation.appendChildToContainer,
    insertBefore = mutation.insertBefore,
    insertInContainerBefore = mutation.insertInContainerBefore,
    removeChild = mutation.removeChild,
    removeChildFromContainer = mutation.removeChildFromContainer;

  function getHostParentFiber(fiber) {
    var parent = fiber["return"];
    while (parent !== null) {
      if (isHostParent(parent)) {
        return parent;
      }
      parent = parent["return"];
    }
    invariant(
      false,
      "Expected to find a host parent. This error is likely caused by a bug " +
        "in React. Please file an issue."
    );
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
    var node = fiber;
    siblings: while (true) {
      // If we didn't find anything, let's try the next sibling.
      while (node.sibling === null) {
        if (node["return"] === null || isHostParent(node["return"])) {
          // If we pop out of the root or hit the parent the fiber we are the
          // last sibling.
          return null;
        }
        node = node["return"];
      }
      node.sibling["return"] = node["return"];
      node = node.sibling;
      while (node.tag !== HostComponent && node.tag !== HostText) {
        // If it is not host node and, we might have a host node inside it.
        // Try to search down until we find one.
        if (node.effectTag & Placement) {
          // If we don't have a child, try the siblings instead.
          continue siblings;
        }
        // If we don't have a child, try the siblings instead.
        // We also skip portals because they are not part of this host tree.
        if (node.child === null || node.tag === HostPortal) {
          continue siblings;
        } else {
          node.child["return"] = node;
          node = node.child;
        }
      }
      // Check if this host node is stable or about to be placed.
      if (!(node.effectTag & Placement)) {
        // Found it!
        return node.stateNode;
      }
    }
  }

  function commitPlacement(finishedWork) {
    // Recursively insert all host nodes into the parent.
    var parentFiber = getHostParentFiber(finishedWork);
    var parent = void 0;
    var isContainer = void 0;
    switch (parentFiber.tag) {
      case HostComponent:
        parent = parentFiber.stateNode;
        isContainer = false;
        break;
      case HostRoot:
        parent = parentFiber.stateNode.containerInfo;
        isContainer = true;
        break;
      case HostPortal:
        parent = parentFiber.stateNode.containerInfo;
        isContainer = true;
        break;
      default:
        invariant(
          false,
          "Invalid host parent fiber. This error is likely caused by a bug " +
            "in React. Please file an issue."
        );
    }
    if (parentFiber.effectTag & ContentReset) {
      // Reset the text content of the parent before doing any insertions
      resetTextContent(parent);
      // Clear ContentReset from the effect tag
      parentFiber.effectTag &= ~ContentReset;
    }

    var before = getHostSibling(finishedWork);
    // We only have the top Fiber that was inserted but we need recurse down its
    // children to find all the terminal nodes.
    var node = finishedWork;
    while (true) {
      if (node.tag === HostComponent || node.tag === HostText) {
        if (before) {
          if (isContainer) {
            insertInContainerBefore(parent, node.stateNode, before);
          } else {
            insertBefore(parent, node.stateNode, before);
          }
        } else {
          if (isContainer) {
            appendChildToContainer(parent, node.stateNode);
          } else {
            appendChild(parent, node.stateNode);
          }
        }
      } else if (node.tag === HostPortal) {
        // If the insertion itself is a portal, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
      } else if (node.child !== null) {
        node.child["return"] = node;
        node = node.child;
        continue;
      }
      if (node === finishedWork) {
        return;
      }
      while (node.sibling === null) {
        if (node["return"] === null || node["return"] === finishedWork) {
          return;
        }
        node = node["return"];
      }
      node.sibling["return"] = node["return"];
      node = node.sibling;
    }
  }

  function unmountHostComponents(current) {
    // We only have the top Fiber that was inserted but we need recurse down its
    var node = current;

    // Each iteration, currentParent is populated with node's host parent if not
    // currentParentIsValid.
    var currentParentIsValid = false;
    var currentParent = void 0;
    var currentParentIsContainer = void 0;

    while (true) {
      if (!currentParentIsValid) {
        var parent = node["return"];
        findParent: while (true) {
          invariant(
            parent !== null,
            "Expected to find a host parent. This error is likely caused by " +
              "a bug in React. Please file an issue."
          );
          switch (parent.tag) {
            case HostComponent:
              currentParent = parent.stateNode;
              currentParentIsContainer = false;
              break findParent;
            case HostRoot:
              currentParent = parent.stateNode.containerInfo;
              currentParentIsContainer = true;
              break findParent;
            case HostPortal:
              currentParent = parent.stateNode.containerInfo;
              currentParentIsContainer = true;
              break findParent;
          }
          parent = parent["return"];
        }
        currentParentIsValid = true;
      }

      if (node.tag === HostComponent || node.tag === HostText) {
        commitNestedUnmounts(node);
        // After all the children have unmounted, it is now safe to remove the
        // node from the tree.
        if (currentParentIsContainer) {
          removeChildFromContainer(currentParent, node.stateNode);
        } else {
          removeChild(currentParent, node.stateNode);
        }
        // Don't visit children because we already visited them.
      } else if (node.tag === HostPortal) {
        // When we go into a portal, it becomes the parent to remove from.
        // We will reassign it back when we pop the portal on the way up.
        currentParent = node.stateNode.containerInfo;
        // Visit children because portals might contain host components.
        if (node.child !== null) {
          node.child["return"] = node;
          node = node.child;
          continue;
        }
      } else {
        commitUnmount(node);
        // Visit children because we may find more host components below.
        if (node.child !== null) {
          node.child["return"] = node;
          node = node.child;
          continue;
        }
      }
      if (node === current) {
        return;
      }
      while (node.sibling === null) {
        if (node["return"] === null || node["return"] === current) {
          return;
        }
        node = node["return"];
        if (node.tag === HostPortal) {
          // When we go out of the portal, we need to restore the parent.
          // Since we don't keep a stack of them, we will search for it.
          currentParentIsValid = false;
        }
      }
      node.sibling["return"] = node["return"];
      node = node.sibling;
    }
  }

  function commitDeletion(current) {
    // Recursively delete all host nodes from the parent.
    // Detach refs and call componentWillUnmount() on the whole subtree.
    unmountHostComponents(current);
    detachFiber(current);
  }

  function commitWork(current, finishedWork) {
    switch (finishedWork.tag) {
      case ClassComponent: {
        return;
      }
      case HostComponent: {
        var _instance8 = finishedWork.stateNode;
        if (_instance8 != null) {
          // Commit the work prepared earlier.
          var newProps = finishedWork.memoizedProps;
          // For hydration we reuse the update path but we treat the oldProps
          // as the newProps. The updatePayload will contain the real change in
          // this case.
          var oldProps = current !== null ? current.memoizedProps : newProps;
          var type = finishedWork.type;
          // TODO: Type the updateQueue to be specific to host components.
          var updatePayload = finishedWork.updateQueue;
          finishedWork.updateQueue = null;
          if (updatePayload !== null) {
            commitUpdate(
              _instance8,
              updatePayload,
              type,
              oldProps,
              newProps,
              finishedWork
            );
          }
        }
        return;
      }
      case HostText: {
        invariant(
          finishedWork.stateNode !== null,
          "This should have a text node initialized. This error is likely " +
            "caused by a bug in React. Please file an issue."
        );
        var textInstance = finishedWork.stateNode;
        var newText = finishedWork.memoizedProps;
        // For hydration we reuse the update path but we treat the oldProps
        // as the newProps. The updatePayload will contain the real change in
        // this case.
        var oldText = current !== null ? current.memoizedProps : newText;
        commitTextUpdate(textInstance, oldText, newText);
        return;
      }
      case HostRoot: {
        return;
      }
      default: {
        invariant(
          false,
          "This unit of work tag should not have side-effects. This error is " +
            "likely caused by a bug in React. Please file an issue."
        );
      }
    }
  }

  function commitResetTextContent(current) {
    resetTextContent(current.stateNode);
  }

  if (enableMutatingReconciler) {
    return {
      commitBeforeMutationLifeCycles: commitBeforeMutationLifeCycles,
      commitResetTextContent: commitResetTextContent,
      commitPlacement: commitPlacement,
      commitDeletion: commitDeletion,
      commitWork: commitWork,
      commitLifeCycles: commitLifeCycles,
      commitErrorLogging: commitErrorLogging,
      commitAttachRef: commitAttachRef,
      commitDetachRef: commitDetachRef
    };
  } else {
    invariant(false, "Mutating reconciler is disabled.");
  }
};

var NO_CONTEXT = {};

var ReactFiberHostContext = function(config, stack) {
  var getChildHostContext = config.getChildHostContext,
    getRootHostContext = config.getRootHostContext;
  var createCursor = stack.createCursor,
    push = stack.push,
    pop = stack.pop;

  var contextStackCursor = createCursor(NO_CONTEXT);
  var contextFiberStackCursor = createCursor(NO_CONTEXT);
  var rootInstanceStackCursor = createCursor(NO_CONTEXT);

  function requiredContext(c) {
    invariant(
      c !== NO_CONTEXT,
      "Expected host context to exist. This error is likely caused by a bug " +
        "in React. Please file an issue."
    );
    return c;
  }

  function getRootHostContainer() {
    var rootInstance = requiredContext(rootInstanceStackCursor.current);
    return rootInstance;
  }

  function pushHostContainer(fiber, nextRootInstance) {
    // Push current root instance onto the stack;
    // This allows us to reset root when portals are popped.
    push(rootInstanceStackCursor, nextRootInstance, fiber);
    // Track the context and the Fiber that provided it.
    // This enables us to pop only Fibers that provide unique contexts.
    push(contextFiberStackCursor, fiber, fiber);

    // Finally, we need to push the host context to the stack.
    // However, we can't just call getRootHostContext() and push it because
    // we'd have a different number of entries on the stack depending on
    // whether getRootHostContext() throws somewhere in renderer code or not.
    // So we push an empty value first. This lets us safely unwind on errors.
    push(contextStackCursor, NO_CONTEXT, fiber);
    var nextRootContext = getRootHostContext(nextRootInstance);
    // Now that we know this function doesn't throw, replace it.
    pop(contextStackCursor, fiber);
    push(contextStackCursor, nextRootContext, fiber);
  }

  function popHostContainer(fiber) {
    pop(contextStackCursor, fiber);
    pop(contextFiberStackCursor, fiber);
    pop(rootInstanceStackCursor, fiber);
  }

  function getHostContext() {
    var context = requiredContext(contextStackCursor.current);
    return context;
  }

  function pushHostContext(fiber) {
    var rootInstance = requiredContext(rootInstanceStackCursor.current);
    var context = requiredContext(contextStackCursor.current);
    var nextContext = getChildHostContext(context, fiber.type, rootInstance);

    // Don't push this Fiber's context unless it's unique.
    if (context === nextContext) {
      return;
    }

    // Track the context and the Fiber that provided it.
    // This enables us to pop only Fibers that provide unique contexts.
    push(contextFiberStackCursor, fiber, fiber);
    push(contextStackCursor, nextContext, fiber);
  }

  function popHostContext(fiber) {
    // Do not pop unless this Fiber provided the current context.
    // pushHostContext() only pushes Fibers that provide unique contexts.
    if (contextFiberStackCursor.current !== fiber) {
      return;
    }

    pop(contextStackCursor, fiber);
    pop(contextFiberStackCursor, fiber);
  }

  return {
    getHostContext: getHostContext,
    getRootHostContainer: getRootHostContainer,
    popHostContainer: popHostContainer,
    popHostContext: popHostContext,
    pushHostContainer: pushHostContainer,
    pushHostContext: pushHostContext
  };
};

var ReactFiberHydrationContext = function(config) {
  var shouldSetTextContent = config.shouldSetTextContent,
    hydration = config.hydration;

  // If this doesn't have hydration mode.

  if (!hydration) {
    return {
      enterHydrationState: function() {
        return false;
      },
      resetHydrationState: function() {},
      tryToClaimNextHydratableInstance: function() {},
      prepareToHydrateHostInstance: function() {
        invariant(
          false,
          "Expected prepareToHydrateHostInstance() to never be called. " +
            "This error is likely caused by a bug in React. Please file an issue."
        );
      },
      prepareToHydrateHostTextInstance: function() {
        invariant(
          false,
          "Expected prepareToHydrateHostTextInstance() to never be called. " +
            "This error is likely caused by a bug in React. Please file an issue."
        );
      },
      popHydrationState: function(fiber) {
        return false;
      }
    };
  }

  var canHydrateInstance = hydration.canHydrateInstance,
    canHydrateTextInstance = hydration.canHydrateTextInstance,
    getNextHydratableSibling = hydration.getNextHydratableSibling,
    getFirstHydratableChild = hydration.getFirstHydratableChild,
    hydrateInstance = hydration.hydrateInstance,
    hydrateTextInstance = hydration.hydrateTextInstance,
    didNotMatchHydratedContainerTextInstance =
      hydration.didNotMatchHydratedContainerTextInstance,
    didNotMatchHydratedTextInstance = hydration.didNotMatchHydratedTextInstance,
    didNotHydrateContainerInstance = hydration.didNotHydrateContainerInstance,
    didNotHydrateInstance = hydration.didNotHydrateInstance,
    didNotFindHydratableContainerInstance =
      hydration.didNotFindHydratableContainerInstance,
    didNotFindHydratableContainerTextInstance =
      hydration.didNotFindHydratableContainerTextInstance,
    didNotFindHydratableInstance = hydration.didNotFindHydratableInstance,
    didNotFindHydratableTextInstance =
      hydration.didNotFindHydratableTextInstance;

  // The deepest Fiber on the stack involved in a hydration context.
  // This may have been an insertion or a hydration.

  var hydrationParentFiber = null;
  var nextHydratableInstance = null;
  var isHydrating = false;

  function enterHydrationState(fiber) {
    var parentInstance = fiber.stateNode.containerInfo;
    nextHydratableInstance = getFirstHydratableChild(parentInstance);
    hydrationParentFiber = fiber;
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
    childToDelete["return"] = returnFiber;
    childToDelete.effectTag = Deletion;

    // This might seem like it belongs on progressedFirstDeletion. However,
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
    fiber.effectTag |= Placement;
    {
      switch (returnFiber.tag) {
        case HostRoot: {
          var parentContainer = returnFiber.stateNode.containerInfo;
          switch (fiber.tag) {
            case HostComponent:
              var type = fiber.type;
              var props = fiber.pendingProps;
              didNotFindHydratableContainerInstance(
                parentContainer,
                type,
                props
              );
              break;
            case HostText:
              var text = fiber.pendingProps;
              didNotFindHydratableContainerTextInstance(parentContainer, text);
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
    if (!tryHydrate(fiber, nextInstance)) {
      // If we can't hydrate this instance let's try the next one.
      // We use this as a heuristic. It's based on intuition and not data so it
      // might be flawed or unnecessary.
      nextInstance = getNextHydratableSibling(nextInstance);
      if (!nextInstance || !tryHydrate(fiber, nextInstance)) {
        // Nothing to hydrate. Make it an insertion.
        insertNonHydratedInstance(hydrationParentFiber, fiber);
        isHydrating = false;
        hydrationParentFiber = fiber;
        return;
      }
      // We matched the next one, we'll now assume that the first one was
      // superfluous and we'll delete it. Since we can't eagerly delete it
      // we'll have to schedule a deletion. To do that, this node needs a dummy
      // fiber associated with it.
      deleteHydratableInstance(hydrationParentFiber, nextHydratableInstance);
    }
    hydrationParentFiber = fiber;
    nextHydratableInstance = getFirstHydratableChild(nextInstance);
  }

  function prepareToHydrateHostInstance(
    fiber,
    rootContainerInstance,
    hostContext
  ) {
    var instance = fiber.stateNode;
    var updatePayload = hydrateInstance(
      instance,
      fiber.type,
      fiber.memoizedProps,
      rootContainerInstance,
      hostContext,
      fiber
    );
    // TODO: Type this specific to this type of component.
    fiber.updateQueue = updatePayload;
    // If the update payload indicates that there is a change or if there
    // is a new ref we mark this as an update.
    if (updatePayload !== null) {
      return true;
    }
    return false;
  }

  function prepareToHydrateHostTextInstance(fiber) {
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

  function popToNextHostParent(fiber) {
    var parent = fiber["return"];
    while (
      parent !== null &&
      parent.tag !== HostComponent &&
      parent.tag !== HostRoot
    ) {
      parent = parent["return"];
    }
    hydrationParentFiber = parent;
  }

  function popHydrationState(fiber) {
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

    var type = fiber.type;

    // If we have any remaining hydratable nodes, we need to delete them now.
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
    nextHydratableInstance = hydrationParentFiber
      ? getNextHydratableSibling(fiber.stateNode)
      : null;
    return true;
  }

  function resetHydrationState() {
    hydrationParentFiber = null;
    nextHydratableInstance = null;
    isHydrating = false;
  }

  return {
    enterHydrationState: enterHydrationState,
    resetHydrationState: resetHydrationState,
    tryToClaimNextHydratableInstance: tryToClaimNextHydratableInstance,
    prepareToHydrateHostInstance: prepareToHydrateHostInstance,
    prepareToHydrateHostTextInstance: prepareToHydrateHostTextInstance,
    popHydrationState: popHydrationState
  };
};

// This lets us hook into Fiber to debug what it's doing.
// See https://github.com/facebook/react/pull/8033.
// This is not part of the public API, not even for React DevTools.
// You may only inject a debugTool if you work on React Fiber itself.
var ReactFiberInstrumentation = {
  debugTool: null
};

var ReactFiberInstrumentation_1 = ReactFiberInstrumentation;

var warnedAboutMissingGetChildContext = void 0;

{
  warnedAboutMissingGetChildContext = {};
}

var ReactFiberLegacyContext = function(stack) {
  var createCursor = stack.createCursor,
    push = stack.push,
    pop = stack.pop;

  // A cursor to the current merged context object on the stack.

  var contextStackCursor = createCursor(emptyObject);
  // A cursor to a boolean indicating whether the context has changed.
  var didPerformWorkStackCursor = createCursor(false);
  // Keep track of the previous context object that was on the stack.
  // We use this to get access to the parent context after we have already
  // pushed the next context provider, and now need to merge their contexts.
  var previousContext = emptyObject;

  function getUnmaskedContext(workInProgress) {
    var hasOwnContext = isContextProvider(workInProgress);
    if (hasOwnContext) {
      // If the fiber is a context provider itself, when we read its context
      // we have already pushed its own child context on the stack. A context
      // provider should not "see" its own child context. Therefore we read the
      // previous (parent) context instead for a context provider.
      return previousContext;
    }
    return contextStackCursor.current;
  }

  function cacheContext(workInProgress, unmaskedContext, maskedContext) {
    var instance = workInProgress.stateNode;
    instance.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext;
    instance.__reactInternalMemoizedMaskedChildContext = maskedContext;
  }

  function getMaskedContext(workInProgress, unmaskedContext) {
    var type = workInProgress.type;
    var contextTypes = type.contextTypes;
    if (!contextTypes) {
      return emptyObject;
    }

    // Avoid recreating masked context unless unmasked context has changed.
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
      var name = getComponentName(workInProgress) || "Unknown";
      checkPropTypes(
        contextTypes,
        context,
        "context",
        name,
        ReactDebugCurrentFiber.getCurrentFiberStackAddendum
      );
    }

    // Cache unmasked context so we can avoid recreating masked context unless necessary.
    // Context is created before the class component is instantiated so check for instance.
    if (instance) {
      cacheContext(workInProgress, unmaskedContext, context);
    }

    return context;
  }

  function hasContextChanged() {
    return didPerformWorkStackCursor.current;
  }

  function isContextConsumer(fiber) {
    return fiber.tag === ClassComponent && fiber.type.contextTypes != null;
  }

  function isContextProvider(fiber) {
    return fiber.tag === ClassComponent && fiber.type.childContextTypes != null;
  }

  function popContextProvider(fiber) {
    if (!isContextProvider(fiber)) {
      return;
    }

    pop(didPerformWorkStackCursor, fiber);
    pop(contextStackCursor, fiber);
  }

  function popTopLevelContextObject(fiber) {
    pop(didPerformWorkStackCursor, fiber);
    pop(contextStackCursor, fiber);
  }

  function pushTopLevelContextObject(fiber, context, didChange) {
    invariant(
      contextStackCursor.cursor == null,
      "Unexpected context found on stack. " +
        "This error is likely caused by a bug in React. Please file an issue."
    );

    push(contextStackCursor, context, fiber);
    push(didPerformWorkStackCursor, didChange, fiber);
  }

  function processChildContext(fiber, parentContext) {
    var instance = fiber.stateNode;
    var childContextTypes = fiber.type.childContextTypes;

    // TODO (bvaughn) Replace this behavior with an invariant() in the future.
    // It has only been added in Fiber to match the (unintentional) behavior in Stack.
    if (typeof instance.getChildContext !== "function") {
      {
        var componentName = getComponentName(fiber) || "Unknown";

        if (!warnedAboutMissingGetChildContext[componentName]) {
          warnedAboutMissingGetChildContext[componentName] = true;
          warning(
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

    var childContext = void 0;
    {
      ReactDebugCurrentFiber.setCurrentPhase("getChildContext");
    }
    startPhaseTimer(fiber, "getChildContext");
    childContext = instance.getChildContext();
    stopPhaseTimer();
    {
      ReactDebugCurrentFiber.setCurrentPhase(null);
    }
    for (var contextKey in childContext) {
      invariant(
        contextKey in childContextTypes,
        '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
        getComponentName(fiber) || "Unknown",
        contextKey
      );
    }
    {
      var name = getComponentName(fiber) || "Unknown";
      checkPropTypes(
        childContextTypes,
        childContext,
        "child context",
        name,
        // In practice, there is one case in which we won't get a stack. It's when
        // somebody calls unstable_renderSubtreeIntoContainer() and we process
        // context from the parent component instance. The stack will be missing
        // because it's outside of the reconciliation, and so the pointer has not
        // been set. This is rare and doesn't matter. We'll also remove that API.
        ReactDebugCurrentFiber.getCurrentFiberStackAddendum
      );
    }

    return Object.assign({}, parentContext, childContext);
  }

  function pushContextProvider(workInProgress) {
    if (!isContextProvider(workInProgress)) {
      return false;
    }

    var instance = workInProgress.stateNode;
    // We push the context as early as possible to ensure stack integrity.
    // If the instance does not exist yet, we will push null at first,
    // and replace it on the stack later when invalidating the context.
    var memoizedMergedChildContext =
      (instance && instance.__reactInternalMemoizedMergedChildContext) ||
      emptyObject;

    // Remember the parent context so we can merge with it later.
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

  function invalidateContextProvider(workInProgress, didChange) {
    var instance = workInProgress.stateNode;
    invariant(
      instance,
      "Expected to have an instance by this point. " +
        "This error is likely caused by a bug in React. Please file an issue."
    );

    if (didChange) {
      // Merge parent and own context.
      // Skip this if we're not updating due to sCU.
      // This avoids unnecessarily recomputing memoized values.
      var mergedContext = processChildContext(workInProgress, previousContext);
      instance.__reactInternalMemoizedMergedChildContext = mergedContext;

      // Replace the old (or empty) context with the new one.
      // It is important to unwind the context in the reverse order.
      pop(didPerformWorkStackCursor, workInProgress);
      pop(contextStackCursor, workInProgress);
      // Now push the new context and mark that it has changed.
      push(contextStackCursor, mergedContext, workInProgress);
      push(didPerformWorkStackCursor, didChange, workInProgress);
    } else {
      pop(didPerformWorkStackCursor, workInProgress);
      push(didPerformWorkStackCursor, didChange, workInProgress);
    }
  }

  function findCurrentUnmaskedContext(fiber) {
    // Currently this is only used with renderSubtreeIntoContainer; not sure if it
    // makes sense elsewhere
    invariant(
      isFiberMounted(fiber) && fiber.tag === ClassComponent,
      "Expected subtree parent to be a mounted class component. " +
        "This error is likely caused by a bug in React. Please file an issue."
    );

    var node = fiber;
    while (node.tag !== HostRoot) {
      if (isContextProvider(node)) {
        return node.stateNode.__reactInternalMemoizedMergedChildContext;
      }
      var parent = node["return"];
      invariant(
        parent,
        "Found unexpected detached subtree parent. " +
          "This error is likely caused by a bug in React. Please file an issue."
      );
      node = parent;
    }
    return node.stateNode.context;
  }

  return {
    getUnmaskedContext: getUnmaskedContext,
    cacheContext: cacheContext,
    getMaskedContext: getMaskedContext,
    hasContextChanged: hasContextChanged,
    isContextConsumer: isContextConsumer,
    isContextProvider: isContextProvider,
    popContextProvider: popContextProvider,
    popTopLevelContextObject: popTopLevelContextObject,
    pushTopLevelContextObject: pushTopLevelContextObject,
    processChildContext: processChildContext,
    pushContextProvider: pushContextProvider,
    invalidateContextProvider: invalidateContextProvider,
    findCurrentUnmaskedContext: findCurrentUnmaskedContext
  };
};

var ReactFiberNewContext = function(stack) {
  var createCursor = stack.createCursor,
    push = stack.push,
    pop = stack.pop;

  var providerCursor = createCursor(null);
  var valueCursor = createCursor(null);
  var changedBitsCursor = createCursor(0);

  var rendererSigil = void 0;
  {
    // Use this to detect multiple renderers using the same context
    rendererSigil = {};
  }

  function pushProvider(providerFiber) {
    var context = providerFiber.type._context;

    push(changedBitsCursor, context._changedBits, providerFiber);
    push(valueCursor, context._currentValue, providerFiber);
    push(providerCursor, providerFiber, providerFiber);

    context._currentValue = providerFiber.pendingProps.value;
    context._changedBits = providerFiber.stateNode;

    {
      !(
        context._currentRenderer === null ||
        context._currentRenderer === rendererSigil
      )
        ? warning(
            false,
            "Detected multiple renderers concurrently rendering the " +
              "same context provider. This is currently unsupported."
          )
        : void 0;
      context._currentRenderer = rendererSigil;
    }
  }

  function popProvider(providerFiber) {
    var changedBits = changedBitsCursor.current;
    var currentValue = valueCursor.current;

    pop(providerCursor, providerFiber);
    pop(valueCursor, providerFiber);
    pop(changedBitsCursor, providerFiber);

    var context = providerFiber.type._context;
    context._currentValue = currentValue;
    context._changedBits = changedBits;
  }

  return {
    pushProvider: pushProvider,
    popProvider: popProvider
  };
};

var ReactFiberStack = function() {
  var valueStack = [];

  var fiberStack = void 0;

  {
    fiberStack = [];
  }

  var index = -1;

  function createCursor(defaultValue) {
    return {
      current: defaultValue
    };
  }

  function isEmpty() {
    return index === -1;
  }

  function pop(cursor, fiber) {
    if (index < 0) {
      {
        warning(false, "Unexpected pop.");
      }
      return;
    }

    {
      if (fiber !== fiberStack[index]) {
        warning(false, "Unexpected Fiber popped.");
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

  function checkThatStackIsEmpty() {
    {
      if (index !== -1) {
        warning(
          false,
          "Expected an empty stack. Something was not reset properly."
        );
      }
    }
  }

  function resetStackAfterFatalErrorInDev() {
    {
      index = -1;
      valueStack.length = 0;
      fiberStack.length = 0;
    }
  }

  return {
    createCursor: createCursor,
    isEmpty: isEmpty,
    pop: pop,
    push: push,
    checkThatStackIsEmpty: checkThatStackIsEmpty,
    resetStackAfterFatalErrorInDev: resetStackAfterFatalErrorInDev
  };
};

var invokeGuardedCallback$2 = ReactErrorUtils.invokeGuardedCallback;
var hasCaughtError = ReactErrorUtils.hasCaughtError;
var clearCaughtError = ReactErrorUtils.clearCaughtError;

var didWarnAboutStateTransition = void 0;
var didWarnSetStateChildContext = void 0;
var warnAboutUpdateOnUnmounted = void 0;
var warnAboutInvalidUpdates = void 0;

{
  didWarnAboutStateTransition = false;
  didWarnSetStateChildContext = false;
  var didWarnStateUpdateForUnmountedComponent = {};

  warnAboutUpdateOnUnmounted = function(fiber) {
    // We show the whole stack but dedupe on the top component's name because
    // the problematic code almost always lies inside that component.
    var componentName = getComponentName(fiber) || "ReactClass";
    if (didWarnStateUpdateForUnmountedComponent[componentName]) {
      return;
    }
    warning(
      false,
      "Can't call setState (or forceUpdate) on an unmounted component. This " +
        "is a no-op, but it indicates a memory leak in your application. To " +
        "fix, cancel all subscriptions and asynchronous tasks in the " +
        "componentWillUnmount method.%s",
      getStackAddendumByWorkInProgressFiber(fiber)
    );
    didWarnStateUpdateForUnmountedComponent[componentName] = true;
  };

  warnAboutInvalidUpdates = function(instance) {
    switch (ReactDebugCurrentFiber.phase) {
      case "getChildContext":
        if (didWarnSetStateChildContext) {
          return;
        }
        warning(
          false,
          "setState(...): Cannot call setState() inside getChildContext()"
        );
        didWarnSetStateChildContext = true;
        break;
      case "render":
        if (didWarnAboutStateTransition) {
          return;
        }
        warning(
          false,
          "Cannot update during an existing state transition (such as within " +
            "`render` or another component's constructor). Render methods should " +
            "be a pure function of props and state; constructor side-effects are " +
            "an anti-pattern, but can be moved to `componentWillMount`."
        );
        didWarnAboutStateTransition = true;
        break;
    }
  };
}

var ReactFiberScheduler = function(config) {
  var stack = ReactFiberStack();
  var hostContext = ReactFiberHostContext(config, stack);
  var legacyContext = ReactFiberLegacyContext(stack);
  var newContext = ReactFiberNewContext(stack);
  var popHostContext = hostContext.popHostContext,
    popHostContainer = hostContext.popHostContainer;
  var popTopLevelLegacyContextObject = legacyContext.popTopLevelContextObject,
    popLegacyContextProvider = legacyContext.popContextProvider;
  var popProvider = newContext.popProvider;

  var hydrationContext = ReactFiberHydrationContext(config);

  var _ReactFiberBeginWork = ReactFiberBeginWork(
      config,
      hostContext,
      legacyContext,
      newContext,
      hydrationContext,
      scheduleWork,
      computeExpirationForFiber
    ),
    beginWork = _ReactFiberBeginWork.beginWork;

  var _ReactFiberCompleteWo = ReactFiberCompleteWork(
      config,
      hostContext,
      legacyContext,
      newContext,
      hydrationContext
    ),
    completeWork = _ReactFiberCompleteWo.completeWork;

  var _ReactFiberUnwindWork = ReactFiberUnwindWork(
      hostContext,
      legacyContext,
      newContext,
      scheduleWork,
      isAlreadyFailedLegacyErrorBoundary
    ),
    throwException = _ReactFiberUnwindWork.throwException,
    unwindWork = _ReactFiberUnwindWork.unwindWork,
    unwindInterruptedWork = _ReactFiberUnwindWork.unwindInterruptedWork;

  var _ReactFiberCommitWork = ReactFiberCommitWork(
      config,
      onCommitPhaseError,
      scheduleWork,
      computeExpirationForFiber,
      markLegacyErrorBoundaryAsFailed,
      recalculateCurrentTime
    ),
    commitBeforeMutationLifeCycles =
      _ReactFiberCommitWork.commitBeforeMutationLifeCycles,
    commitResetTextContent = _ReactFiberCommitWork.commitResetTextContent,
    commitPlacement = _ReactFiberCommitWork.commitPlacement,
    commitDeletion = _ReactFiberCommitWork.commitDeletion,
    commitWork = _ReactFiberCommitWork.commitWork,
    commitLifeCycles = _ReactFiberCommitWork.commitLifeCycles,
    commitErrorLogging = _ReactFiberCommitWork.commitErrorLogging,
    commitAttachRef = _ReactFiberCommitWork.commitAttachRef,
    commitDetachRef = _ReactFiberCommitWork.commitDetachRef;

  var now = config.now,
    scheduleDeferredCallback = config.scheduleDeferredCallback,
    cancelDeferredCallback = config.cancelDeferredCallback,
    prepareForCommit = config.prepareForCommit,
    resetAfterCommit = config.resetAfterCommit;

  // Represents the current time in ms.

  var originalStartTimeMs = now();
  var mostRecentCurrentTime = msToExpirationTime(0);
  var mostRecentCurrentTimeMs = originalStartTimeMs;

  // Used to ensure computeUniqueAsyncExpiration is monotonically increases.
  var lastUniqueAsyncExpiration = 0;

  // Represents the expiration time that incoming updates should use. (If this
  // is NoWork, use the default strategy: async updates in async mode, sync
  // updates in sync mode.)
  var expirationContext = NoWork;

  var isWorking = false;

  // The next work in progress fiber that we're currently working on.
  var nextUnitOfWork = null;
  var nextRoot = null;
  // The time at which we're currently rendering work.
  var nextRenderExpirationTime = NoWork;

  // The next fiber with an effect that we're currently committing.
  var nextEffect = null;

  var isCommitting = false;

  var isRootReadyForCommit = false;

  var legacyErrorBoundariesThatAlreadyFailed = null;

  // Used for performance tracking.
  var interruptedBy = null;

  var stashedWorkInProgressProperties = void 0;
  var replayUnitOfWork = void 0;
  var isReplayingFailedUnitOfWork = void 0;
  var originalReplayError = void 0;
  var rethrowOriginalError = void 0;
  if (true && replayFailedUnitOfWorkWithInvokeGuardedCallback) {
    stashedWorkInProgressProperties = null;
    isReplayingFailedUnitOfWork = false;
    originalReplayError = null;
    replayUnitOfWork = function(failedUnitOfWork, error, isAsync) {
      // Restore the original state of the work-in-progress
      assignFiberPropertiesInDEV(
        failedUnitOfWork,
        stashedWorkInProgressProperties
      );
      switch (failedUnitOfWork.tag) {
        case HostRoot:
          popHostContainer(failedUnitOfWork);
          popTopLevelLegacyContextObject(failedUnitOfWork);
          break;
        case HostComponent:
          popHostContext(failedUnitOfWork);
          break;
        case ClassComponent:
          popLegacyContextProvider(failedUnitOfWork);
          break;
        case HostPortal:
          popHostContainer(failedUnitOfWork);
          break;
        case ContextProvider:
          popProvider(failedUnitOfWork);
          break;
      }
      // Replay the begin phase.
      isReplayingFailedUnitOfWork = true;
      originalReplayError = error;
      invokeGuardedCallback$2(null, workLoop, null, isAsync);
      isReplayingFailedUnitOfWork = false;
      originalReplayError = null;
      if (hasCaughtError()) {
        clearCaughtError();
      } else {
        // If the begin phase did not fail the second time, set this pointer
        // back to the original value.
        nextUnitOfWork = failedUnitOfWork;
      }
    };
    rethrowOriginalError = function() {
      throw originalReplayError;
    };
  }

  function resetStack() {
    if (nextUnitOfWork !== null) {
      var interruptedWork = nextUnitOfWork["return"];
      while (interruptedWork !== null) {
        unwindInterruptedWork(interruptedWork);
        interruptedWork = interruptedWork["return"];
      }
    }

    {
      ReactStrictModeWarnings.discardPendingWarnings();
      stack.checkThatStackIsEmpty();
    }

    nextRoot = null;
    nextRenderExpirationTime = NoWork;
    nextUnitOfWork = null;

    isRootReadyForCommit = false;
  }

  function commitAllHostEffects() {
    while (nextEffect !== null) {
      {
        ReactDebugCurrentFiber.setCurrentFiber(nextEffect);
      }
      recordEffect();

      var effectTag = nextEffect.effectTag;

      if (effectTag & ContentReset) {
        commitResetTextContent(nextEffect);
      }

      if (effectTag & Ref) {
        var current = nextEffect.alternate;
        if (current !== null) {
          commitDetachRef(current);
        }
      }

      // The following switch statement is only concerned about placement,
      // updates, and deletions. To avoid needing to add a case for every
      // possible bitmap value, we remove the secondary effects from the
      // effect tag and switch on that value.
      var primaryEffectTag = effectTag & (Placement | Update | Deletion);
      switch (primaryEffectTag) {
        case Placement: {
          commitPlacement(nextEffect);
          // Clear the "placement" from effect tag so that we know that this is inserted, before
          // any life-cycles like componentDidMount gets called.
          // TODO: findDOMNode doesn't rely on this any more but isMounted
          // does and isMounted is deprecated anyway so we should be able
          // to kill this.
          nextEffect.effectTag &= ~Placement;
          break;
        }
        case PlacementAndUpdate: {
          // Placement
          commitPlacement(nextEffect);
          // Clear the "placement" from effect tag so that we know that this is inserted, before
          // any life-cycles like componentDidMount gets called.
          nextEffect.effectTag &= ~Placement;

          // Update
          var _current = nextEffect.alternate;
          commitWork(_current, nextEffect);
          break;
        }
        case Update: {
          var _current2 = nextEffect.alternate;
          commitWork(_current2, nextEffect);
          break;
        }
        case Deletion: {
          commitDeletion(nextEffect);
          break;
        }
      }
      nextEffect = nextEffect.nextEffect;
    }

    {
      ReactDebugCurrentFiber.resetCurrentFiber();
    }
  }

  function commitBeforeMutationLifecycles() {
    while (nextEffect !== null) {
      var effectTag = nextEffect.effectTag;

      if (effectTag & Snapshot) {
        recordEffect();
        var current = nextEffect.alternate;
        commitBeforeMutationLifeCycles(current, nextEffect);
      }

      // Don't cleanup effects yet;
      // This will be done by commitAllLifeCycles()
      nextEffect = nextEffect.nextEffect;
    }
  }

  function commitAllLifeCycles(
    finishedRoot,
    currentTime,
    committedExpirationTime
  ) {
    {
      ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings();

      if (warnAboutDeprecatedLifecycles) {
        ReactStrictModeWarnings.flushPendingDeprecationWarnings();
      }
    }
    while (nextEffect !== null) {
      var effectTag = nextEffect.effectTag;

      if (effectTag & (Update | Callback)) {
        recordEffect();
        var current = nextEffect.alternate;
        commitLifeCycles(
          finishedRoot,
          current,
          nextEffect,
          currentTime,
          committedExpirationTime
        );
      }

      if (effectTag & ErrLog) {
        commitErrorLogging(nextEffect, onUncaughtError);
      }

      if (effectTag & Ref) {
        recordEffect();
        commitAttachRef(nextEffect);
      }

      var next = nextEffect.nextEffect;
      // Ensure that we clean these up so that we don't accidentally keep them.
      // I'm not actually sure this matters because we can't reset firstEffect
      // and lastEffect since they're on every node, not just the effectful
      // ones. So we have to clean everything as we reuse nodes anyway.
      nextEffect.nextEffect = null;
      // Ensure that we reset the effectTag here so that we can rely on effect
      // tags to reason about the current life-cycle.
      nextEffect = next;
    }
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

  function commitRoot(finishedWork) {
    isWorking = true;
    isCommitting = true;
    startCommitTimer();

    var root = finishedWork.stateNode;
    invariant(
      root.current !== finishedWork,
      "Cannot commit the same tree as before. This is probably a bug " +
        "related to the return field. This error is likely caused by a bug " +
        "in React. Please file an issue."
    );
    var committedExpirationTime = root.pendingCommitExpirationTime;
    invariant(
      committedExpirationTime !== NoWork,
      "Cannot commit an incomplete root. This error is likely caused by a " +
        "bug in React. Please file an issue."
    );
    root.pendingCommitExpirationTime = NoWork;

    var currentTime = recalculateCurrentTime();

    // Reset this to null before calling lifecycles
    ReactCurrentOwner.current = null;

    var firstEffect = void 0;
    if (finishedWork.effectTag > PerformedWork) {
      // A fiber's effect list consists only of its children, not itself. So if
      // the root has an effect, we need to add it to the end of the list. The
      // resulting list is the set that would belong to the root's parent, if
      // it had one; that is, all the effects in the tree including the root.
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

    prepareForCommit(root.containerInfo);

    // Invoke instances of getSnapshotBeforeUpdate before mutation.
    nextEffect = firstEffect;
    startCommitSnapshotEffectsTimer();
    while (nextEffect !== null) {
      var didError = false;
      var error = void 0;
      {
        invokeGuardedCallback$2(null, commitBeforeMutationLifecycles, null);
        if (hasCaughtError()) {
          didError = true;
          error = clearCaughtError();
        }
      }
      if (didError) {
        invariant(
          nextEffect !== null,
          "Should have next effect. This error is likely caused by a bug " +
            "in React. Please file an issue."
        );
        onCommitPhaseError(nextEffect, error);
        // Clean-up
        if (nextEffect !== null) {
          nextEffect = nextEffect.nextEffect;
        }
      }
    }
    stopCommitSnapshotEffectsTimer();

    // Commit all the side-effects within a tree. We'll do this in two passes.
    // The first pass performs all the host insertions, updates, deletions and
    // ref unmounts.
    nextEffect = firstEffect;
    startCommitHostEffectsTimer();
    while (nextEffect !== null) {
      var _didError = false;
      var _error = void 0;
      {
        invokeGuardedCallback$2(null, commitAllHostEffects, null);
        if (hasCaughtError()) {
          _didError = true;
          _error = clearCaughtError();
        }
      }
      if (_didError) {
        invariant(
          nextEffect !== null,
          "Should have next effect. This error is likely caused by a bug " +
            "in React. Please file an issue."
        );
        onCommitPhaseError(nextEffect, _error);
        // Clean-up
        if (nextEffect !== null) {
          nextEffect = nextEffect.nextEffect;
        }
      }
    }
    stopCommitHostEffectsTimer();

    resetAfterCommit(root.containerInfo);

    // The work-in-progress tree is now the current tree. This must come after
    // the first pass of the commit phase, so that the previous tree is still
    // current during componentWillUnmount, but before the second pass, so that
    // the finished work is current during componentDidMount/Update.
    root.current = finishedWork;

    // In the second pass we'll perform all life-cycles and ref callbacks.
    // Life-cycles happen as a separate pass so that all placements, updates,
    // and deletions in the entire tree have already been invoked.
    // This pass also triggers any renderer-specific initial effects.
    nextEffect = firstEffect;
    startCommitLifeCyclesTimer();
    while (nextEffect !== null) {
      var _didError2 = false;
      var _error2 = void 0;
      {
        invokeGuardedCallback$2(
          null,
          commitAllLifeCycles,
          null,
          root,
          currentTime,
          committedExpirationTime
        );
        if (hasCaughtError()) {
          _didError2 = true;
          _error2 = clearCaughtError();
        }
      }
      if (_didError2) {
        invariant(
          nextEffect !== null,
          "Should have next effect. This error is likely caused by a bug " +
            "in React. Please file an issue."
        );
        onCommitPhaseError(nextEffect, _error2);
        if (nextEffect !== null) {
          nextEffect = nextEffect.nextEffect;
        }
      }
    }

    isCommitting = false;
    isWorking = false;
    stopCommitLifeCyclesTimer();
    stopCommitTimer();
    if (typeof onCommitRoot === "function") {
      onCommitRoot(finishedWork.stateNode);
    }
    if (true && ReactFiberInstrumentation_1.debugTool) {
      ReactFiberInstrumentation_1.debugTool.onCommitWork(finishedWork);
    }

    var remainingTime = root.current.expirationTime;
    if (remainingTime === NoWork) {
      // If there's no remaining work, we can clear the set of already failed
      // error boundaries.
      legacyErrorBoundariesThatAlreadyFailed = null;
    }
    return remainingTime;
  }

  function resetExpirationTime(workInProgress, renderTime) {
    if (renderTime !== Never && workInProgress.expirationTime === Never) {
      // The children of this component are hidden. Don't bubble their
      // expiration times.
      return;
    }

    // Check for pending updates.
    var newExpirationTime = getUpdateExpirationTime(workInProgress);

    // TODO: Calls need to visit stateNode

    // Bubble up the earliest expiration time.
    var child = workInProgress.child;
    while (child !== null) {
      if (
        child.expirationTime !== NoWork &&
        (newExpirationTime === NoWork ||
          newExpirationTime > child.expirationTime)
      ) {
        newExpirationTime = child.expirationTime;
      }
      child = child.sibling;
    }
    workInProgress.expirationTime = newExpirationTime;
  }

  function completeUnitOfWork(workInProgress) {
    // Attempt to complete the current unit of work, then move to the
    // next sibling. If there are no more siblings, return to the
    // parent fiber.
    while (true) {
      // The current, flushed, state of this fiber is the alternate.
      // Ideally nothing should rely on this, but relying on it here
      // means that we don't need an additional field on the work in
      // progress.
      var current = workInProgress.alternate;
      {
        ReactDebugCurrentFiber.setCurrentFiber(workInProgress);
      }

      var returnFiber = workInProgress["return"];
      var siblingFiber = workInProgress.sibling;

      if ((workInProgress.effectTag & Incomplete) === NoEffect) {
        // This fiber completed.
        var next = completeWork(
          current,
          workInProgress,
          nextRenderExpirationTime
        );
        stopWorkTimer(workInProgress);
        resetExpirationTime(workInProgress, nextRenderExpirationTime);
        {
          ReactDebugCurrentFiber.resetCurrentFiber();
        }

        if (next !== null) {
          stopWorkTimer(workInProgress);
          if (true && ReactFiberInstrumentation_1.debugTool) {
            ReactFiberInstrumentation_1.debugTool.onCompleteWork(
              workInProgress
            );
          }
          // If completing this work spawned new work, do that next. We'll come
          // back here again.
          return next;
        }

        if (
          returnFiber !== null &&
          // Do not append effects to parents if a sibling failed to complete
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
          }

          // If this fiber had side-effects, we append it AFTER the children's
          // side-effects. We can perform certain side-effects earlier if
          // needed, by doing multiple passes over the effect list. We don't want
          // to schedule our own side-effect on our own list because if end up
          // reusing children we'll schedule this effect onto itself since we're
          // at the end.
          var effectTag = workInProgress.effectTag;
          // Skip both NoWork and PerformedWork tags when creating the effect list.
          // PerformedWork effect is read by React DevTools but shouldn't be committed.
          if (effectTag > PerformedWork) {
            if (returnFiber.lastEffect !== null) {
              returnFiber.lastEffect.nextEffect = workInProgress;
            } else {
              returnFiber.firstEffect = workInProgress;
            }
            returnFiber.lastEffect = workInProgress;
          }
        }

        if (true && ReactFiberInstrumentation_1.debugTool) {
          ReactFiberInstrumentation_1.debugTool.onCompleteWork(workInProgress);
        }

        if (siblingFiber !== null) {
          // If there is more work to do in this returnFiber, do that next.
          return siblingFiber;
        } else if (returnFiber !== null) {
          // If there's no more work in this returnFiber. Complete the returnFiber.
          workInProgress = returnFiber;
          continue;
        } else {
          // We've reached the root.
          isRootReadyForCommit = true;
          return null;
        }
      } else {
        // This fiber did not complete because something threw. Pop values off
        // the stack without entering the complete phase. If this is a boundary,
        // capture values if possible.
        var _next = unwindWork(workInProgress);
        // Because this fiber did not complete, don't reset its expiration time.
        if (workInProgress.effectTag & DidCapture) {
          // Restarting an error boundary
          stopFailedWorkTimer(workInProgress);
        } else {
          stopWorkTimer(workInProgress);
        }

        {
          ReactDebugCurrentFiber.resetCurrentFiber();
        }

        if (_next !== null) {
          stopWorkTimer(workInProgress);
          if (true && ReactFiberInstrumentation_1.debugTool) {
            ReactFiberInstrumentation_1.debugTool.onCompleteWork(
              workInProgress
            );
          }
          // If completing this work spawned new work, do that next. We'll come
          // back here again.
          // Since we're restarting, remove anything that is not a host effect
          // from the effect tag.
          _next.effectTag &= HostEffectMask;
          return _next;
        }

        if (returnFiber !== null) {
          // Mark the parent fiber as incomplete and clear its effect list.
          returnFiber.firstEffect = returnFiber.lastEffect = null;
          returnFiber.effectTag |= Incomplete;
        }

        if (true && ReactFiberInstrumentation_1.debugTool) {
          ReactFiberInstrumentation_1.debugTool.onCompleteWork(workInProgress);
        }

        if (siblingFiber !== null) {
          // If there is more work to do in this returnFiber, do that next.
          return siblingFiber;
        } else if (returnFiber !== null) {
          // If there's no more work in this returnFiber. Complete the returnFiber.
          workInProgress = returnFiber;
          continue;
        } else {
          return null;
        }
      }
    }

    // Without this explicit null return Flow complains of invalid return type
    // TODO Remove the above while(true) loop
    // eslint-disable-next-line no-unreachable
    return null;
  }

  function performUnitOfWork(workInProgress) {
    // The current, flushed, state of this fiber is the alternate.
    // Ideally nothing should rely on this, but relying on it here
    // means that we don't need an additional field on the work in
    // progress.
    var current = workInProgress.alternate;

    // See if beginning this work spawns more work.
    startWorkTimer(workInProgress);
    {
      ReactDebugCurrentFiber.setCurrentFiber(workInProgress);
    }

    if (true && replayFailedUnitOfWorkWithInvokeGuardedCallback) {
      stashedWorkInProgressProperties = assignFiberPropertiesInDEV(
        stashedWorkInProgressProperties,
        workInProgress
      );
    }
    var next = beginWork(current, workInProgress, nextRenderExpirationTime);
    {
      ReactDebugCurrentFiber.resetCurrentFiber();
      if (isReplayingFailedUnitOfWork) {
        // Currently replaying a failed unit of work. This should be unreachable,
        // because the render phase is meant to be idempotent, and it should
        // have thrown again. Since it didn't, rethrow the original error, so
        // React's internal stack is not misaligned.
        rethrowOriginalError();
      }
    }
    if (true && ReactFiberInstrumentation_1.debugTool) {
      ReactFiberInstrumentation_1.debugTool.onBeginWork(workInProgress);
    }

    if (next === null) {
      // If this doesn't spawn new work, complete the current work.
      next = completeUnitOfWork(workInProgress);
    }

    ReactCurrentOwner.current = null;

    return next;
  }

  function workLoop(isAsync) {
    if (!isAsync) {
      // Flush all expired work.
      while (nextUnitOfWork !== null) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      }
    } else {
      // Flush asynchronous work until the deadline runs out of time.
      while (nextUnitOfWork !== null && !shouldYield()) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      }
    }
  }

  function renderRoot(root, expirationTime, isAsync) {
    invariant(
      !isWorking,
      "renderRoot was called recursively. This error is likely caused " +
        "by a bug in React. Please file an issue."
    );
    isWorking = true;

    // Check if we're starting from a fresh stack, or if we're resuming from
    // previously yielded work.
    if (
      expirationTime !== nextRenderExpirationTime ||
      root !== nextRoot ||
      nextUnitOfWork === null
    ) {
      // Reset the stack and start working from the root.
      resetStack();
      nextRoot = root;
      nextRenderExpirationTime = expirationTime;
      nextUnitOfWork = createWorkInProgress(
        nextRoot.current,
        null,
        nextRenderExpirationTime
      );
      root.pendingCommitExpirationTime = NoWork;
    }

    var didFatal = false;

    startWorkLoopTimer(nextUnitOfWork);

    do {
      try {
        workLoop(isAsync);
      } catch (thrownValue) {
        if (nextUnitOfWork === null) {
          // This is a fatal error.
          didFatal = true;
          onUncaughtError(thrownValue);
          break;
        }

        if (true && replayFailedUnitOfWorkWithInvokeGuardedCallback) {
          var failedUnitOfWork = nextUnitOfWork;
          replayUnitOfWork(failedUnitOfWork, thrownValue, isAsync);
        }

        var sourceFiber = nextUnitOfWork;
        var returnFiber = sourceFiber["return"];
        if (returnFiber === null) {
          // This is the root. The root could capture its own errors. However,
          // we don't know if it errors before or after we pushed the host
          // context. This information is needed to avoid a stack mismatch.
          // Because we're not sure, treat this as a fatal error. We could track
          // which phase it fails in, but doesn't seem worth it. At least
          // for now.
          didFatal = true;
          onUncaughtError(thrownValue);
          break;
        }
        throwException(returnFiber, sourceFiber, thrownValue);
        nextUnitOfWork = completeUnitOfWork(sourceFiber);
      }
      break;
    } while (true);

    // We're done performing work. Time to clean up.
    var didCompleteRoot = false;
    isWorking = false;

    // Yield back to main thread.
    if (didFatal) {
      stopWorkLoopTimer(interruptedBy, didCompleteRoot);
      interruptedBy = null;
      // There was a fatal error.
      {
        stack.resetStackAfterFatalErrorInDev();
      }
      return null;
    } else if (nextUnitOfWork === null) {
      // We reached the root.
      if (isRootReadyForCommit) {
        didCompleteRoot = true;
        stopWorkLoopTimer(interruptedBy, didCompleteRoot);
        interruptedBy = null;
        // The root successfully completed. It's ready for commit.
        root.pendingCommitExpirationTime = expirationTime;
        var finishedWork = root.current.alternate;
        return finishedWork;
      } else {
        // The root did not complete.
        stopWorkLoopTimer(interruptedBy, didCompleteRoot);
        interruptedBy = null;
        invariant(
          false,
          "Expired work should have completed. This error is likely caused " +
            "by a bug in React. Please file an issue."
        );
      }
    } else {
      stopWorkLoopTimer(interruptedBy, didCompleteRoot);
      interruptedBy = null;
      // There's more work to do, but we ran out of time. Yield back to
      // the renderer.
      return null;
    }
  }

  function scheduleCapture(sourceFiber, boundaryFiber, value, expirationTime) {
    // TODO: We only support dispatching errors.
    var capturedValue = createCapturedValue(value, sourceFiber);
    var update = {
      expirationTime: expirationTime,
      partialState: null,
      callback: null,
      isReplace: false,
      isForced: false,
      capturedValue: capturedValue,
      next: null
    };
    insertUpdateIntoFiber(boundaryFiber, update);
    scheduleWork(boundaryFiber, expirationTime);
  }

  function dispatch(sourceFiber, value, expirationTime) {
    invariant(
      !isWorking || isCommitting,
      "dispatch: Cannot dispatch during the render phase."
    );

    // TODO: Handle arrays

    var fiber = sourceFiber["return"];
    while (fiber !== null) {
      switch (fiber.tag) {
        case ClassComponent:
          var ctor = fiber.type;
          var instance = fiber.stateNode;
          if (
            typeof ctor.getDerivedStateFromCatch === "function" ||
            (typeof instance.componentDidCatch === "function" &&
              !isAlreadyFailedLegacyErrorBoundary(instance))
          ) {
            scheduleCapture(sourceFiber, fiber, value, expirationTime);
            return;
          }
          break;
        // TODO: Handle async boundaries
        case HostRoot:
          scheduleCapture(sourceFiber, fiber, value, expirationTime);
          return;
      }
      fiber = fiber["return"];
    }

    if (sourceFiber.tag === HostRoot) {
      // Error was thrown at the root. There is no parent, so the root
      // itself should capture it.
      scheduleCapture(sourceFiber, sourceFiber, value, expirationTime);
    }
  }

  function onCommitPhaseError(fiber, error) {
    return dispatch(fiber, error, Sync);
  }

  function computeAsyncExpiration(currentTime) {
    // Given the current clock time, returns an expiration time. We use rounding
    // to batch like updates together.
    // Should complete within ~1000ms. 1200ms max.
    var expirationMs = 5000;
    var bucketSizeMs = 250;
    return computeExpirationBucket(currentTime, expirationMs, bucketSizeMs);
  }

  function computeInteractiveExpiration(currentTime) {
    // Should complete within ~500ms. 600ms max.
    var expirationMs = 500;
    var bucketSizeMs = 100;
    return computeExpirationBucket(currentTime, expirationMs, bucketSizeMs);
  }

  // Creates a unique async expiration time.
  function computeUniqueAsyncExpiration() {
    var currentTime = recalculateCurrentTime();
    var result = computeAsyncExpiration(currentTime);
    if (result <= lastUniqueAsyncExpiration) {
      // Since we assume the current time monotonically increases, we only hit
      // this branch when computeUniqueAsyncExpiration is fired multiple times
      // within a 200ms window (or whatever the async bucket size is).
      result = lastUniqueAsyncExpiration + 1;
    }
    lastUniqueAsyncExpiration = result;
    return lastUniqueAsyncExpiration;
  }

  function computeExpirationForFiber(fiber) {
    var expirationTime = void 0;
    if (expirationContext !== NoWork) {
      // An explicit expiration context was set;
      expirationTime = expirationContext;
    } else if (isWorking) {
      if (isCommitting) {
        // Updates that occur during the commit phase should have sync priority
        // by default.
        expirationTime = Sync;
      } else {
        // Updates during the render phase should expire at the same time as
        // the work that is being rendered.
        expirationTime = nextRenderExpirationTime;
      }
    } else {
      // No explicit expiration context was set, and we're not currently
      // performing work. Calculate a new expiration time.
      if (fiber.mode & AsyncMode) {
        if (isBatchingInteractiveUpdates) {
          // This is an interactive update
          var currentTime = recalculateCurrentTime();
          expirationTime = computeInteractiveExpiration(currentTime);
        } else {
          // This is an async update
          var _currentTime = recalculateCurrentTime();
          expirationTime = computeAsyncExpiration(_currentTime);
        }
      } else {
        // This is a sync update
        expirationTime = Sync;
      }
    }
    if (isBatchingInteractiveUpdates) {
      // This is an interactive update. Keep track of the lowest pending
      // interactive expiration time. This allows us to synchronously flush
      // all interactive updates when needed.
      if (
        lowestPendingInteractiveExpirationTime === NoWork ||
        expirationTime > lowestPendingInteractiveExpirationTime
      ) {
        lowestPendingInteractiveExpirationTime = expirationTime;
      }
    }
    return expirationTime;
  }

  function scheduleWork(fiber, expirationTime) {
    return scheduleWorkImpl(fiber, expirationTime, false);
  }

  function scheduleWorkImpl(fiber, expirationTime, isErrorRecovery) {
    recordScheduleUpdate();

    {
      if (!isErrorRecovery && fiber.tag === ClassComponent) {
        var instance = fiber.stateNode;
        warnAboutInvalidUpdates(instance);
      }
    }

    var node = fiber;
    while (node !== null) {
      // Walk the parent path to the root and update each node's
      // expiration time.
      if (
        node.expirationTime === NoWork ||
        node.expirationTime > expirationTime
      ) {
        node.expirationTime = expirationTime;
      }
      if (node.alternate !== null) {
        if (
          node.alternate.expirationTime === NoWork ||
          node.alternate.expirationTime > expirationTime
        ) {
          node.alternate.expirationTime = expirationTime;
        }
      }
      if (node["return"] === null) {
        if (node.tag === HostRoot) {
          var root = node.stateNode;
          if (
            !isWorking &&
            nextRenderExpirationTime !== NoWork &&
            expirationTime < nextRenderExpirationTime
          ) {
            // This is an interruption. (Used for performance tracking.)
            interruptedBy = fiber;
            resetStack();
          }
          if (
            // If we're in the render phase, we don't need to schedule this root
            // for an update, because we'll do it before we exit...
            !isWorking ||
            isCommitting ||
            // ...unless this is a different root than the one we're rendering.
            nextRoot !== root
          ) {
            // Add this root to the root schedule.
            requestWork(root, expirationTime);
          }
          if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
            invariant(
              false,
              "Maximum update depth exceeded. This can happen when a " +
                "component repeatedly calls setState inside " +
                "componentWillUpdate or componentDidUpdate. React limits " +
                "the number of nested updates to prevent infinite loops."
            );
          }
        } else {
          {
            if (!isErrorRecovery && fiber.tag === ClassComponent) {
              warnAboutUpdateOnUnmounted(fiber);
            }
          }
          return;
        }
      }
      node = node["return"];
    }
  }

  function recalculateCurrentTime() {
    // Subtract initial time so it fits inside 32bits
    mostRecentCurrentTimeMs = now() - originalStartTimeMs;
    mostRecentCurrentTime = msToExpirationTime(mostRecentCurrentTimeMs);
    return mostRecentCurrentTime;
  }

  function deferredUpdates(fn) {
    var previousExpirationContext = expirationContext;
    var currentTime = recalculateCurrentTime();
    expirationContext = computeAsyncExpiration(currentTime);
    try {
      return fn();
    } finally {
      expirationContext = previousExpirationContext;
    }
  }
  function syncUpdates(fn, a, b, c, d) {
    var previousExpirationContext = expirationContext;
    expirationContext = Sync;
    try {
      return fn(a, b, c, d);
    } finally {
      expirationContext = previousExpirationContext;
    }
  }

  // TODO: Everything below this is written as if it has been lifted to the
  // renderers. I'll do this in a follow-up.

  // Linked-list of roots
  var firstScheduledRoot = null;
  var lastScheduledRoot = null;

  var callbackExpirationTime = NoWork;
  var callbackID = -1;
  var isRendering = false;
  var nextFlushedRoot = null;
  var nextFlushedExpirationTime = NoWork;
  var lowestPendingInteractiveExpirationTime = NoWork;
  var deadlineDidExpire = false;
  var hasUnhandledError = false;
  var unhandledError = null;
  var deadline = null;

  var isBatchingUpdates = false;
  var isUnbatchingUpdates = false;
  var isBatchingInteractiveUpdates = false;

  var completedBatches = null;

  // Use these to prevent an infinite loop of nested updates
  var NESTED_UPDATE_LIMIT = 1000;
  var nestedUpdateCount = 0;

  var timeHeuristicForUnitOfWork = 1;

  function scheduleCallbackWithExpiration(expirationTime) {
    if (callbackExpirationTime !== NoWork) {
      // A callback is already scheduled. Check its expiration time (timeout).
      if (expirationTime > callbackExpirationTime) {
        // Existing callback has sufficient timeout. Exit.
        return;
      } else {
        // Existing callback has insufficient timeout. Cancel and schedule a
        // new one.
        cancelDeferredCallback(callbackID);
      }
      // The request callback timer is already running. Don't start a new one.
    } else {
      startRequestCallbackTimer();
    }

    // Compute a timeout for the given expiration time.
    var currentMs = now() - originalStartTimeMs;
    var expirationMs = expirationTimeToMs(expirationTime);
    var timeout = expirationMs - currentMs;

    callbackExpirationTime = expirationTime;
    callbackID = scheduleDeferredCallback(performAsyncWork, {
      timeout: timeout
    });
  }

  // requestWork is called by the scheduler whenever a root receives an update.
  // It's up to the renderer to call renderRoot at some point in the future.
  function requestWork(root, expirationTime) {
    addRootToSchedule(root, expirationTime);

    if (isRendering) {
      // Prevent reentrancy. Remaining work will be scheduled at the end of
      // the currently rendering batch.
      return;
    }

    if (isBatchingUpdates) {
      // Flush work at the end of the batch.
      if (isUnbatchingUpdates) {
        // ...unless we're inside unbatchedUpdates, in which case we should
        // flush it now.
        nextFlushedRoot = root;
        nextFlushedExpirationTime = Sync;
        performWorkOnRoot(root, Sync, false);
      }
      return;
    }

    // TODO: Get rid of Sync and use current time?
    if (expirationTime === Sync) {
      performSyncWork();
    } else {
      scheduleCallbackWithExpiration(expirationTime);
    }
  }

  function addRootToSchedule(root, expirationTime) {
    // Add the root to the schedule.
    // Check if this root is already part of the schedule.
    if (root.nextScheduledRoot === null) {
      // This root is not already scheduled. Add it.
      root.remainingExpirationTime = expirationTime;
      if (lastScheduledRoot === null) {
        firstScheduledRoot = lastScheduledRoot = root;
        root.nextScheduledRoot = root;
      } else {
        lastScheduledRoot.nextScheduledRoot = root;
        lastScheduledRoot = root;
        lastScheduledRoot.nextScheduledRoot = firstScheduledRoot;
      }
    } else {
      // This root is already scheduled, but its priority may have increased.
      var remainingExpirationTime = root.remainingExpirationTime;
      if (
        remainingExpirationTime === NoWork ||
        expirationTime < remainingExpirationTime
      ) {
        // Update the priority.
        root.remainingExpirationTime = expirationTime;
      }
    }
  }

  function findHighestPriorityRoot() {
    var highestPriorityWork = NoWork;
    var highestPriorityRoot = null;
    if (lastScheduledRoot !== null) {
      var previousScheduledRoot = lastScheduledRoot;
      var root = firstScheduledRoot;
      while (root !== null) {
        var remainingExpirationTime = root.remainingExpirationTime;
        if (remainingExpirationTime === NoWork) {
          // This root no longer has work. Remove it from the scheduler.

          // TODO: This check is redudant, but Flow is confused by the branch
          // below where we set lastScheduledRoot to null, even though we break
          // from the loop right after.
          invariant(
            previousScheduledRoot !== null && lastScheduledRoot !== null,
            "Should have a previous and last root. This error is likely " +
              "caused by a bug in React. Please file an issue."
          );
          if (root === root.nextScheduledRoot) {
            // This is the only root in the list.
            root.nextScheduledRoot = null;
            firstScheduledRoot = lastScheduledRoot = null;
            break;
          } else if (root === firstScheduledRoot) {
            // This is the first root in the list.
            var next = root.nextScheduledRoot;
            firstScheduledRoot = next;
            lastScheduledRoot.nextScheduledRoot = next;
            root.nextScheduledRoot = null;
          } else if (root === lastScheduledRoot) {
            // This is the last root in the list.
            lastScheduledRoot = previousScheduledRoot;
            lastScheduledRoot.nextScheduledRoot = firstScheduledRoot;
            root.nextScheduledRoot = null;
            break;
          } else {
            previousScheduledRoot.nextScheduledRoot = root.nextScheduledRoot;
            root.nextScheduledRoot = null;
          }
          root = previousScheduledRoot.nextScheduledRoot;
        } else {
          if (
            highestPriorityWork === NoWork ||
            remainingExpirationTime < highestPriorityWork
          ) {
            // Update the priority, if it's higher
            highestPriorityWork = remainingExpirationTime;
            highestPriorityRoot = root;
          }
          if (root === lastScheduledRoot) {
            break;
          }
          previousScheduledRoot = root;
          root = root.nextScheduledRoot;
        }
      }
    }

    // If the next root is the same as the previous root, this is a nested
    // update. To prevent an infinite loop, increment the nested update count.
    var previousFlushedRoot = nextFlushedRoot;
    if (
      previousFlushedRoot !== null &&
      previousFlushedRoot === highestPriorityRoot &&
      highestPriorityWork === Sync
    ) {
      nestedUpdateCount++;
    } else {
      // Reset whenever we switch roots.
      nestedUpdateCount = 0;
    }
    nextFlushedRoot = highestPriorityRoot;
    nextFlushedExpirationTime = highestPriorityWork;
  }

  function performAsyncWork(dl) {
    performWork(NoWork, true, dl);
  }

  function performSyncWork() {
    performWork(Sync, false, null);
  }

  function performWork(minExpirationTime, isAsync, dl) {
    deadline = dl;

    // Keep working on roots until there's no more work, or until the we reach
    // the deadline.
    findHighestPriorityRoot();

    if (enableUserTimingAPI && deadline !== null) {
      var didExpire = nextFlushedExpirationTime < recalculateCurrentTime();
      var timeout = expirationTimeToMs(nextFlushedExpirationTime);
      stopRequestCallbackTimer(didExpire, timeout);
    }

    if (isAsync) {
      while (
        nextFlushedRoot !== null &&
        nextFlushedExpirationTime !== NoWork &&
        (minExpirationTime === NoWork ||
          minExpirationTime >= nextFlushedExpirationTime) &&
        (!deadlineDidExpire ||
          recalculateCurrentTime() >= nextFlushedExpirationTime)
      ) {
        performWorkOnRoot(
          nextFlushedRoot,
          nextFlushedExpirationTime,
          !deadlineDidExpire
        );
        findHighestPriorityRoot();
      }
    } else {
      while (
        nextFlushedRoot !== null &&
        nextFlushedExpirationTime !== NoWork &&
        (minExpirationTime === NoWork ||
          minExpirationTime >= nextFlushedExpirationTime)
      ) {
        performWorkOnRoot(nextFlushedRoot, nextFlushedExpirationTime, false);
        findHighestPriorityRoot();
      }
    }

    // We're done flushing work. Either we ran out of time in this callback,
    // or there's no more work left with sufficient priority.

    // If we're inside a callback, set this to false since we just completed it.
    if (deadline !== null) {
      callbackExpirationTime = NoWork;
      callbackID = -1;
    }
    // If there's work left over, schedule a new callback.
    if (nextFlushedExpirationTime !== NoWork) {
      scheduleCallbackWithExpiration(nextFlushedExpirationTime);
    }

    // Clean-up.
    deadline = null;
    deadlineDidExpire = false;

    finishRendering();
  }

  function flushRoot(root, expirationTime) {
    invariant(
      !isRendering,
      "work.commit(): Cannot commit while already rendering. This likely " +
        "means you attempted to commit from inside a lifecycle method."
    );
    // Perform work on root as if the given expiration time is the current time.
    // This has the effect of synchronously flushing all work up to and
    // including the given time.
    nextFlushedRoot = root;
    nextFlushedExpirationTime = expirationTime;
    performWorkOnRoot(root, expirationTime, false);
    // Flush any sync work that was scheduled by lifecycles
    performSyncWork();
    finishRendering();
  }

  function finishRendering() {
    nestedUpdateCount = 0;

    if (completedBatches !== null) {
      var batches = completedBatches;
      completedBatches = null;
      for (var i = 0; i < batches.length; i++) {
        var batch = batches[i];
        try {
          batch._onComplete();
        } catch (error) {
          if (!hasUnhandledError) {
            hasUnhandledError = true;
            unhandledError = error;
          }
        }
      }
    }

    if (hasUnhandledError) {
      var error = unhandledError;
      unhandledError = null;
      hasUnhandledError = false;
      throw error;
    }
  }

  function performWorkOnRoot(root, expirationTime, isAsync) {
    invariant(
      !isRendering,
      "performWorkOnRoot was called recursively. This error is likely caused " +
        "by a bug in React. Please file an issue."
    );

    isRendering = true;

    // Check if this is async work or sync/expired work.
    if (!isAsync) {
      // Flush sync work.
      var finishedWork = root.finishedWork;
      if (finishedWork !== null) {
        // This root is already complete. We can commit it.
        completeRoot(root, finishedWork, expirationTime);
      } else {
        root.finishedWork = null;
        finishedWork = renderRoot(root, expirationTime, false);
        if (finishedWork !== null) {
          // We've completed the root. Commit it.
          completeRoot(root, finishedWork, expirationTime);
        }
      }
    } else {
      // Flush async work.
      var _finishedWork = root.finishedWork;
      if (_finishedWork !== null) {
        // This root is already complete. We can commit it.
        completeRoot(root, _finishedWork, expirationTime);
      } else {
        root.finishedWork = null;
        _finishedWork = renderRoot(root, expirationTime, true);
        if (_finishedWork !== null) {
          // We've completed the root. Check the deadline one more time
          // before committing.
          if (!shouldYield()) {
            // Still time left. Commit the root.
            completeRoot(root, _finishedWork, expirationTime);
          } else {
            // There's no time left. Mark this root as complete. We'll come
            // back and commit it later.
            root.finishedWork = _finishedWork;
          }
        }
      }
    }

    isRendering = false;
  }

  function completeRoot(root, finishedWork, expirationTime) {
    // Check if there's a batch that matches this expiration time.
    var firstBatch = root.firstBatch;
    if (firstBatch !== null && firstBatch._expirationTime <= expirationTime) {
      if (completedBatches === null) {
        completedBatches = [firstBatch];
      } else {
        completedBatches.push(firstBatch);
      }
      if (firstBatch._defer) {
        // This root is blocked from committing by a batch. Unschedule it until
        // we receive another update.
        root.finishedWork = finishedWork;
        root.remainingExpirationTime = NoWork;
        return;
      }
    }

    // Commit the root.
    root.finishedWork = null;
    root.remainingExpirationTime = commitRoot(finishedWork);
  }

  // When working on async work, the reconciler asks the renderer if it should
  // yield execution. For DOM, we implement this with requestIdleCallback.
  function shouldYield() {
    if (deadline === null) {
      return false;
    }
    if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
      // Disregard deadline.didTimeout. Only expired work should be flushed
      // during a timeout. This path is only hit for non-expired work.
      return false;
    }
    deadlineDidExpire = true;
    return true;
  }

  function onUncaughtError(error) {
    invariant(
      nextFlushedRoot !== null,
      "Should be working on a root. This error is likely caused by a bug in " +
        "React. Please file an issue."
    );
    // Unschedule this root so we don't work on it again until there's
    // another update.
    nextFlushedRoot.remainingExpirationTime = NoWork;
    if (!hasUnhandledError) {
      hasUnhandledError = true;
      unhandledError = error;
    }
  }

  // TODO: Batching should be implemented at the renderer level, not inside
  // the reconciler.
  function batchedUpdates(fn, a) {
    var previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = true;
    try {
      return fn(a);
    } finally {
      isBatchingUpdates = previousIsBatchingUpdates;
      if (!isBatchingUpdates && !isRendering) {
        performSyncWork();
      }
    }
  }

  // TODO: Batching should be implemented at the renderer level, not inside
  // the reconciler.
  function unbatchedUpdates(fn, a) {
    if (isBatchingUpdates && !isUnbatchingUpdates) {
      isUnbatchingUpdates = true;
      try {
        return fn(a);
      } finally {
        isUnbatchingUpdates = false;
      }
    }
    return fn(a);
  }

  // TODO: Batching should be implemented at the renderer level, not within
  // the reconciler.
  function flushSync(fn, a) {
    invariant(
      !isRendering,
      "flushSync was called from inside a lifecycle method. It cannot be " +
        "called when React is already rendering."
    );
    var previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = true;
    try {
      return syncUpdates(fn, a);
    } finally {
      isBatchingUpdates = previousIsBatchingUpdates;
      performSyncWork();
    }
  }

  function interactiveUpdates(fn, a, b) {
    if (isBatchingInteractiveUpdates) {
      return fn(a, b);
    }
    // If there are any pending interactive updates, synchronously flush them.
    // This needs to happen before we read any handlers, because the effect of
    // the previous event may influence which handlers are called during
    // this event.
    if (
      !isBatchingUpdates &&
      !isRendering &&
      lowestPendingInteractiveExpirationTime !== NoWork
    ) {
      // Synchronously flush pending interactive updates.
      performWork(lowestPendingInteractiveExpirationTime, false, null);
      lowestPendingInteractiveExpirationTime = NoWork;
    }
    var previousIsBatchingInteractiveUpdates = isBatchingInteractiveUpdates;
    var previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingInteractiveUpdates = true;
    isBatchingUpdates = true;
    try {
      return fn(a, b);
    } finally {
      isBatchingInteractiveUpdates = previousIsBatchingInteractiveUpdates;
      isBatchingUpdates = previousIsBatchingUpdates;
      if (!isBatchingUpdates && !isRendering) {
        performSyncWork();
      }
    }
  }

  function flushInteractiveUpdates() {
    if (!isRendering && lowestPendingInteractiveExpirationTime !== NoWork) {
      // Synchronously flush pending interactive updates.
      performWork(lowestPendingInteractiveExpirationTime, false, null);
      lowestPendingInteractiveExpirationTime = NoWork;
    }
  }

  function flushControlled(fn) {
    var previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = true;
    try {
      syncUpdates(fn);
    } finally {
      isBatchingUpdates = previousIsBatchingUpdates;
      if (!isBatchingUpdates && !isRendering) {
        performWork(Sync, false, null);
      }
    }
  }

  return {
    recalculateCurrentTime: recalculateCurrentTime,
    computeExpirationForFiber: computeExpirationForFiber,
    scheduleWork: scheduleWork,
    requestWork: requestWork,
    flushRoot: flushRoot,
    batchedUpdates: batchedUpdates,
    unbatchedUpdates: unbatchedUpdates,
    flushSync: flushSync,
    flushControlled: flushControlled,
    deferredUpdates: deferredUpdates,
    syncUpdates: syncUpdates,
    interactiveUpdates: interactiveUpdates,
    flushInteractiveUpdates: flushInteractiveUpdates,
    computeUniqueAsyncExpiration: computeUniqueAsyncExpiration,
    legacyContext: legacyContext
  };
};

var didWarnAboutNestedUpdates = void 0;

{
  didWarnAboutNestedUpdates = false;
}

// 0 is PROD, 1 is DEV.
// Might add PROFILE later.

var ReactFiberReconciler$1 = function(config) {
  var getPublicInstance = config.getPublicInstance;

  var _ReactFiberScheduler = ReactFiberScheduler(config),
    computeUniqueAsyncExpiration =
      _ReactFiberScheduler.computeUniqueAsyncExpiration,
    recalculateCurrentTime = _ReactFiberScheduler.recalculateCurrentTime,
    computeExpirationForFiber = _ReactFiberScheduler.computeExpirationForFiber,
    scheduleWork = _ReactFiberScheduler.scheduleWork,
    requestWork = _ReactFiberScheduler.requestWork,
    flushRoot = _ReactFiberScheduler.flushRoot,
    batchedUpdates = _ReactFiberScheduler.batchedUpdates,
    unbatchedUpdates = _ReactFiberScheduler.unbatchedUpdates,
    flushSync = _ReactFiberScheduler.flushSync,
    flushControlled = _ReactFiberScheduler.flushControlled,
    deferredUpdates = _ReactFiberScheduler.deferredUpdates,
    syncUpdates = _ReactFiberScheduler.syncUpdates,
    interactiveUpdates = _ReactFiberScheduler.interactiveUpdates,
    flushInteractiveUpdates = _ReactFiberScheduler.flushInteractiveUpdates,
    legacyContext = _ReactFiberScheduler.legacyContext;

  var findCurrentUnmaskedContext = legacyContext.findCurrentUnmaskedContext,
    isContextProvider = legacyContext.isContextProvider,
    processChildContext = legacyContext.processChildContext;

  function getContextForSubtree(parentComponent) {
    if (!parentComponent) {
      return emptyObject;
    }

    var fiber = get(parentComponent);
    var parentContext = findCurrentUnmaskedContext(fiber);
    return isContextProvider(fiber)
      ? processChildContext(fiber, parentContext)
      : parentContext;
  }

  function scheduleRootUpdate(
    current,
    element,
    currentTime,
    expirationTime,
    callback
  ) {
    {
      if (
        ReactDebugCurrentFiber.phase === "render" &&
        ReactDebugCurrentFiber.current !== null &&
        !didWarnAboutNestedUpdates
      ) {
        didWarnAboutNestedUpdates = true;
        warning(
          false,
          "Render methods should be a pure function of props and state; " +
            "triggering nested component updates from render is not allowed. " +
            "If necessary, trigger nested updates in componentDidUpdate.\n\n" +
            "Check the render method of %s.",
          getComponentName(ReactDebugCurrentFiber.current) || "Unknown"
        );
      }
    }

    callback = callback === undefined ? null : callback;
    {
      !(callback === null || typeof callback === "function")
        ? warning(
            false,
            "render(...): Expected the last optional `callback` argument to be a " +
              "function. Instead received: %s.",
            callback
          )
        : void 0;
    }

    var update = {
      expirationTime: expirationTime,
      partialState: { element: element },
      callback: callback,
      isReplace: false,
      isForced: false,
      capturedValue: null,
      next: null
    };
    insertUpdateIntoFiber(current, update);
    scheduleWork(current, expirationTime);

    return expirationTime;
  }

  function updateContainerAtExpirationTime(
    element,
    container,
    parentComponent,
    currentTime,
    expirationTime,
    callback
  ) {
    // TODO: If this is a nested container, this won't be the root.
    var current = container.current;

    {
      if (ReactFiberInstrumentation_1.debugTool) {
        if (current.alternate === null) {
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

    return scheduleRootUpdate(
      current,
      element,
      currentTime,
      expirationTime,
      callback
    );
  }

  function findHostInstance(fiber) {
    var hostFiber = findCurrentHostFiber(fiber);
    if (hostFiber === null) {
      return null;
    }
    return hostFiber.stateNode;
  }

  return {
    createContainer: function(containerInfo, isAsync, hydrate) {
      return createFiberRoot(containerInfo, isAsync, hydrate);
    },
    updateContainer: function(element, container, parentComponent, callback) {
      var current = container.current;
      var currentTime = recalculateCurrentTime();
      var expirationTime = computeExpirationForFiber(current);
      return updateContainerAtExpirationTime(
        element,
        container,
        parentComponent,
        currentTime,
        expirationTime,
        callback
      );
    },
    updateContainerAtExpirationTime: function(
      element,
      container,
      parentComponent,
      expirationTime,
      callback
    ) {
      var currentTime = recalculateCurrentTime();
      return updateContainerAtExpirationTime(
        element,
        container,
        parentComponent,
        currentTime,
        expirationTime,
        callback
      );
    },

    flushRoot: flushRoot,

    requestWork: requestWork,

    computeUniqueAsyncExpiration: computeUniqueAsyncExpiration,

    batchedUpdates: batchedUpdates,

    unbatchedUpdates: unbatchedUpdates,

    deferredUpdates: deferredUpdates,

    syncUpdates: syncUpdates,

    interactiveUpdates: interactiveUpdates,

    flushInteractiveUpdates: flushInteractiveUpdates,

    flushControlled: flushControlled,

    flushSync: flushSync,

    getPublicRootInstance: function(container) {
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
    },

    findHostInstance: findHostInstance,

    findHostInstanceWithNoPortals: function(fiber) {
      var hostFiber = findCurrentHostFiberWithNoPortals(fiber);
      if (hostFiber === null) {
        return null;
      }
      return hostFiber.stateNode;
    },
    injectIntoDevTools: function(devToolsConfig) {
      var findFiberByHostInstance = devToolsConfig.findFiberByHostInstance;

      return injectInternals(
        Object.assign({}, devToolsConfig, {
          findHostInstanceByFiber: function(fiber) {
            return findHostInstance(fiber);
          },
          findFiberByHostInstance: function(instance) {
            if (!findFiberByHostInstance) {
              // Might not be implemented by the renderer.
              return null;
            }
            return findFiberByHostInstance(instance);
          }
        })
      );
    }
  };
};

var ReactFiberReconciler$2 = Object.freeze({
  default: ReactFiberReconciler$1
});

var ReactFiberReconciler$3 =
  (ReactFiberReconciler$2 && ReactFiberReconciler$1) || ReactFiberReconciler$2;

// TODO: bundle Flow types with the package.

// TODO: decide on the top-level export form.
// This is hacky but makes it work with both Rollup and Jest.
var reactReconciler = ReactFiberReconciler$3["default"]
  ? ReactFiberReconciler$3["default"]
  : ReactFiberReconciler$3;

/**
 * Keeps track of allocating and associating native "tags" which are numeric,
 * unique view IDs. All the native tags are negative numbers, to avoid
 * collisions, but in the JS we keep track of them as positive integers to store
 * them effectively in Arrays. So we must refer to them as "inverses" of the
 * native tags (that are * normally negative).
 *
 * It *must* be the case that every `rootNodeID` always maps to the exact same
 * `tag` forever. The easiest way to accomplish this is to never delete
 * anything from this table.
 * Why: Because `dangerouslyReplaceNodeWithMarkupByID` relies on being able to
 * unmount a component with a `rootNodeID`, then mount a new one in its place,
 */
var INITIAL_TAG_COUNT = 1;
var ReactNativeTagHandles = {
  tagsStartAt: INITIAL_TAG_COUNT,
  tagCount: INITIAL_TAG_COUNT,

  allocateTag: function() {
    // Skip over root IDs as those are reserved for native
    while (this.reactTagIsNativeTopRootID(ReactNativeTagHandles.tagCount)) {
      ReactNativeTagHandles.tagCount++;
    }
    var tag = ReactNativeTagHandles.tagCount;
    ReactNativeTagHandles.tagCount++;
    return tag;
  },

  assertRootTag: function(tag) {
    invariant(
      this.reactTagIsNativeTopRootID(tag),
      "Expect a native root tag, instead got %s",
      tag
    );
  },

  reactTagIsNativeTopRootID: function(reactTag) {
    // We reserve all tags that are 1 mod 10 for native root views
    return reactTag % 10 === 1;
  }
};

function _classCallCheck$2(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

// Modules provided by RN:
/**
 * This is used for refs on host components.
 */

var ReactFabricHostComponent = (function() {
  function ReactFabricHostComponent(tag, viewConfig, props) {
    _classCallCheck$2(this, ReactFabricHostComponent);

    this._nativeTag = tag;
    this.viewConfig = viewConfig;
    this.currentProps = props;
  }

  ReactFabricHostComponent.prototype.blur = function blur() {
    TextInputState.blurTextInput(this._nativeTag);
  };

  ReactFabricHostComponent.prototype.focus = function focus() {
    TextInputState.focusTextInput(this._nativeTag);
  };

  ReactFabricHostComponent.prototype.measure = function measure(callback) {
    UIManager.measure(this._nativeTag, mountSafeCallback(this, callback));
  };

  ReactFabricHostComponent.prototype.measureInWindow = function measureInWindow(
    callback
  ) {
    UIManager.measureInWindow(
      this._nativeTag,
      mountSafeCallback(this, callback)
    );
  };

  ReactFabricHostComponent.prototype.measureLayout = function measureLayout(
    relativeToNativeNode,
    onSuccess,
    onFail /* currently unused */
  ) {
    UIManager.measureLayout(
      this._nativeTag,
      relativeToNativeNode,
      mountSafeCallback(this, onFail),
      mountSafeCallback(this, onSuccess)
    );
  };

  ReactFabricHostComponent.prototype.setNativeProps = function setNativeProps(
    nativeProps
  ) {
    {
      warnForStyleProps(nativeProps, this.viewConfig.validAttributes);
    }

    var updatePayload = create(nativeProps, this.viewConfig.validAttributes);

    // Avoid the overhead of bridge calls if there's no update.
    // This is an expensive no-op for Android, and causes an unnecessary
    // view invalidation for certain components (eg RCTTextInput) on iOS.
    if (updatePayload != null) {
      UIManager.updateView(
        this._nativeTag,
        this.viewConfig.uiViewClassName,
        updatePayload
      );
    }
  };

  return ReactFabricHostComponent;
})();

var ReactFabricRenderer = reactReconciler({
  appendInitialChild: function(parentInstance, child) {
    FabricUIManager.appendChild(parentInstance.node, child.node);
  },
  createInstance: function(
    type,
    props,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    var tag = ReactNativeTagHandles.allocateTag();
    var viewConfig = get$1(type);

    {
      for (var key in viewConfig.validAttributes) {
        if (props.hasOwnProperty(key)) {
          deepFreezeAndThrowOnMutationInDev(props[key]);
        }
      }
    }

    var updatePayload = create(props, viewConfig.validAttributes);

    var node = FabricUIManager.createNode(
      tag, // reactTag
      viewConfig.uiViewClassName, // viewName
      rootContainerInstance, // rootTag
      updatePayload, // props
      internalInstanceHandle
    );

    var component = new ReactFabricHostComponent(tag, viewConfig, props);

    return {
      node: node,
      canonical: component
    };
  },
  createTextInstance: function(
    text,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    var tag = ReactNativeTagHandles.allocateTag();

    var node = FabricUIManager.createNode(
      tag, // reactTag
      "RCTRawText", // viewName
      rootContainerInstance, // rootTag
      { text: text }, // props
      internalInstanceHandle
    );

    return {
      node: node
    };
  },
  finalizeInitialChildren: function(
    parentInstance,
    type,
    props,
    rootContainerInstance
  ) {
    return false;
  },
  getRootHostContext: function() {
    return emptyObject;
  },
  getChildHostContext: function() {
    return emptyObject;
  },
  getPublicInstance: function(instance) {
    return instance.canonical;
  },

  now: now,

  prepareForCommit: function() {
    // Noop
  },
  prepareUpdate: function(
    instance,
    type,
    oldProps,
    newProps,
    rootContainerInstance,
    hostContext
  ) {
    var viewConfig = instance.canonical.viewConfig;
    var updatePayload = diff(oldProps, newProps, viewConfig.validAttributes);
    // TODO: If the event handlers have changed, we need to update the current props
    // in the commit phase but there is no host config hook to do it yet.
    return updatePayload;
  },
  resetAfterCommit: function() {
    // Noop
  },

  scheduleDeferredCallback: scheduleDeferredCallback,
  cancelDeferredCallback: cancelDeferredCallback,

  shouldDeprioritizeSubtree: function(type, props) {
    return false;
  },
  shouldSetTextContent: function(type, props) {
    // TODO (bvaughn) Revisit this decision.
    // Always returning false simplifies the createInstance() implementation,
    // But creates an additional child Fiber for raw text children.
    // No additional native views are created though.
    // It's not clear to me which is better so I'm deferring for now.
    // More context @ github.com/facebook/react/pull/8560#discussion_r92111303
    return false;
  },

  persistence: {
    cloneInstance: function(
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
      var clone = void 0;
      if (keepChildren) {
        if (updatePayload !== null) {
          clone = FabricUIManager.cloneNodeWithNewProps(node, updatePayload);
        } else {
          clone = FabricUIManager.cloneNode(node);
        }
      } else {
        if (updatePayload !== null) {
          clone = FabricUIManager.cloneNodeWithNewChildrenAndProps(
            node,
            updatePayload
          );
        } else {
          clone = FabricUIManager.cloneNodeWithNewChildren(node);
        }
      }
      return {
        node: clone,
        canonical: instance.canonical
      };
    },
    createContainerChildSet: function(container) {
      return FabricUIManager.createChildSet(container);
    },
    appendChildToContainerChildSet: function(childSet, child) {
      FabricUIManager.appendChildToSet(childSet, child.node);
    },
    finalizeContainerChildren: function(container, newChildren) {
      FabricUIManager.completeRoot(container, newChildren);
    },
    replaceContainerChildren: function(container, newChildren) {}
  }
});

// Module provided by RN:
var getInspectorDataForViewTag = void 0;

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
      return host.memoizedProps || emptyObject;
    }
    return emptyObject;
  };

  var getHostNode = function(fiber, findNodeHandle) {
    var hostNode = void 0;
    // look for children first for the hostNode
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
        name: getComponentName(fiber),
        getInspectorData: function(findNodeHandle) {
          return {
            measure: function(callback) {
              return UIManager.measure(
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
    var closestInstance = getInstanceFromTag(viewTag);

    // Handle case where user clicks outside of ReactNative
    if (!closestInstance) {
      return {
        hierarchy: [],
        props: emptyObject,
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

/**
 * Creates a renderable ReactNative host component.
 * Use this method for view configs that are loaded from UIManager.
 * Use createReactNativeComponentClass() for view configs defined within JavaScript.
 *
 * @param {string} config iOS View configuration.
 * @private
 */
var createReactNativeComponentClass = function(name, callback) {
  return register(name, callback);
};

// Module provided by RN:
/**
 * Capture an image of the screen, window or an individual view. The image
 * will be stored in a temporary file that will only exist for as long as the
 * app is running.
 *
 * The `view` argument can be the literal string `window` if you want to
 * capture the entire window, or it can be a reference to a specific
 * React Native component.
 *
 * The `options` argument may include:
 * - width/height (number) - the width and height of the image to capture.
 * - format (string) - either 'png' or 'jpeg'. Defaults to 'png'.
 * - quality (number) - the quality when using jpeg. 0.0 - 1.0 (default).
 *
 * Returns a Promise.
 * @platform ios
 */
function takeSnapshot(view, options) {
  if (typeof view !== "number" && view !== "window") {
    view = findNumericNodeHandleFiber(view) || "window";
  }

  // Call the hidden '__takeSnapshot' method; the main one throws an error to
  // prevent accidental backwards-incompatible usage.
  return UIManager.__takeSnapshot(view, options);
}

injectFindHostInstanceFabric(ReactFabricRenderer.findHostInstance);

injection$2.injectRenderer(ReactFabricRenderer);

var roots = new Map();

var ReactFabric = {
  NativeComponent: ReactNativeComponent,

  findNodeHandle: findNumericNodeHandleFiber,

  render: function(element, containerTag, callback) {
    var root = roots.get(containerTag);

    if (!root) {
      // TODO (bvaughn): If we decide to keep the wrapper component,
      // We could create a wrapper for containerTag as well to reduce special casing.
      root = ReactFabricRenderer.createContainer(containerTag, false, false);
      roots.set(containerTag, root);
    }
    ReactFabricRenderer.updateContainer(element, root, null, callback);

    return ReactFabricRenderer.getPublicRootInstance(root);
  },
  unmountComponentAtNode: function(containerTag) {
    var root = roots.get(containerTag);
    if (root) {
      // TODO: Is it safe to reset this now or should I wait since this unmount could be deferred?
      ReactFabricRenderer.updateContainer(null, root, null, function() {
        roots["delete"](containerTag);
      });
    }
  },
  unmountComponentAtNodeAndRemoveContainer: function(containerTag) {
    ReactFabric.unmountComponentAtNode(containerTag);
  },
  createPortal: function(children, containerTag) {
    var key =
      arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    return createPortal(children, containerTag, null, key);
  },

  unstable_batchedUpdates: batchedUpdates,

  flushSync: ReactFabricRenderer.flushSync,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    // Used as a mixin in many createClass-based components
    NativeMethodsMixin: NativeMethodsMixin,
    // Used by react-native-github/Libraries/ components
    ReactNativeBridgeEventPlugin: ReactNativeBridgeEventPlugin, // requireNativeComponent
    ReactNativeComponentTree: ReactNativeComponentTree, // ScrollResponder
    ReactNativePropRegistry: ReactNativePropRegistry, // flattenStyle, Stylesheet
    TouchHistoryMath: TouchHistoryMath, // PanResponder
    createReactNativeComponentClass: createReactNativeComponentClass, // RCTText, RCTView, ReactNativeART
    takeSnapshot: takeSnapshot
  }
};

{
  // $FlowFixMe
  Object.assign(
    ReactFabric.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    {
      // TODO: none of these work since Fiber. Remove these dependencies.
      // Used by RCTRenderingPerf, Systrace:
      ReactDebugTool: {
        addHook: function() {},
        removeHook: function() {}
      },
      // Used by ReactPerfStallHandler, RCTRenderingPerf:
      ReactPerf: {
        start: function() {},
        stop: function() {},
        printInclusive: function() {},
        printWasted: function() {}
      }
    }
  );
}

ReactFabricRenderer.injectIntoDevTools({
  findFiberByHostInstance: getInstanceFromTag,
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
var fabric = ReactFabric$3["default"]
  ? ReactFabric$3["default"]
  : ReactFabric$3;

module.exports = fabric;

  })();
}
