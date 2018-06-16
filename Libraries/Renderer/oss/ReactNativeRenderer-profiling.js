/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @providesModule ReactNativeRenderer-profiling
 * @preventMunge
 * @generated
 */

"use strict";
require("InitializeCore");
var invariant = require("fbjs/lib/invariant"),
  ReactNativeViewConfigRegistry = require("ReactNativeViewConfigRegistry"),
  UIManager = require("UIManager"),
  RCTEventEmitter = require("RCTEventEmitter"),
  React = require("react"),
  emptyObject = require("fbjs/lib/emptyObject"),
  deepDiffer = require("deepDiffer"),
  flattenStyle = require("flattenStyle"),
  TextInputState = require("TextInputState"),
  ExceptionsManager = require("ExceptionsManager");
function invokeGuardedCallback(name, func, context, a, b, c, d, e, f) {
  this._hasCaughtError = !1;
  this._caughtError = null;
  var funcArgs = Array.prototype.slice.call(arguments, 3);
  try {
    func.apply(context, funcArgs);
  } catch (error) {
    (this._caughtError = error), (this._hasCaughtError = !0);
  }
}
var ReactErrorUtils = {
  _caughtError: null,
  _hasCaughtError: !1,
  _rethrowError: null,
  _hasRethrowError: !1,
  invokeGuardedCallback: function(name, func, context, a, b, c, d, e, f) {
    invokeGuardedCallback.apply(ReactErrorUtils, arguments);
  },
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
      ReactErrorUtils._hasRethrowError ||
        ((ReactErrorUtils._hasRethrowError = !0),
        (ReactErrorUtils._rethrowError = error));
    }
  },
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
      ReactErrorUtils._hasCaughtError = !1;
      return error;
    }
    invariant(
      !1,
      "clearCaughtError was called but no error was captured. This error is likely caused by a bug in React. Please file an issue."
    );
  }
};
function rethrowCaughtError() {
  if (ReactErrorUtils._hasRethrowError) {
    var error = ReactErrorUtils._rethrowError;
    ReactErrorUtils._rethrowError = null;
    ReactErrorUtils._hasRethrowError = !1;
    throw error;
  }
}
var eventPluginOrder = null,
  namesToPlugins = {};
function recomputePluginOrdering() {
  if (eventPluginOrder)
    for (var pluginName in namesToPlugins) {
      var pluginModule = namesToPlugins[pluginName],
        pluginIndex = eventPluginOrder.indexOf(pluginName);
      invariant(
        -1 < pluginIndex,
        "EventPluginRegistry: Cannot inject event plugins that do not exist in the plugin ordering, `%s`.",
        pluginName
      );
      if (!plugins[pluginIndex]) {
        invariant(
          pluginModule.extractEvents,
          "EventPluginRegistry: Event plugins must implement an `extractEvents` method, but `%s` does not.",
          pluginName
        );
        plugins[pluginIndex] = pluginModule;
        pluginIndex = pluginModule.eventTypes;
        for (var eventName in pluginIndex) {
          var JSCompiler_inline_result = void 0;
          var dispatchConfig = pluginIndex[eventName],
            pluginModule$jscomp$0 = pluginModule,
            eventName$jscomp$0 = eventName;
          invariant(
            !eventNameDispatchConfigs.hasOwnProperty(eventName$jscomp$0),
            "EventPluginHub: More than one plugin attempted to publish the same event name, `%s`.",
            eventName$jscomp$0
          );
          eventNameDispatchConfigs[eventName$jscomp$0] = dispatchConfig;
          var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
          if (phasedRegistrationNames) {
            for (JSCompiler_inline_result in phasedRegistrationNames)
              phasedRegistrationNames.hasOwnProperty(
                JSCompiler_inline_result
              ) &&
                publishRegistrationName(
                  phasedRegistrationNames[JSCompiler_inline_result],
                  pluginModule$jscomp$0,
                  eventName$jscomp$0
                );
            JSCompiler_inline_result = !0;
          } else
            dispatchConfig.registrationName
              ? (publishRegistrationName(
                  dispatchConfig.registrationName,
                  pluginModule$jscomp$0,
                  eventName$jscomp$0
                ),
                (JSCompiler_inline_result = !0))
              : (JSCompiler_inline_result = !1);
          invariant(
            JSCompiler_inline_result,
            "EventPluginRegistry: Failed to publish event `%s` for plugin `%s`.",
            eventName,
            pluginName
          );
        }
      }
    }
}
function publishRegistrationName(registrationName, pluginModule) {
  invariant(
    !registrationNameModules[registrationName],
    "EventPluginHub: More than one plugin attempted to publish the same registration name, `%s`.",
    registrationName
  );
  registrationNameModules[registrationName] = pluginModule;
}
var plugins = [],
  eventNameDispatchConfigs = {},
  registrationNameModules = {},
  getFiberCurrentPropsFromNode = null,
  getInstanceFromNode = null,
  getNodeFromInstance = null;
function executeDispatch(event, simulated, listener, inst) {
  simulated = event.type || "unknown-event";
  event.currentTarget = getNodeFromInstance(inst);
  ReactErrorUtils.invokeGuardedCallbackAndCatchFirstError(
    simulated,
    listener,
    void 0,
    event
  );
  event.currentTarget = null;
}
function executeDirectDispatch(event) {
  var dispatchListener = event._dispatchListeners,
    dispatchInstance = event._dispatchInstances;
  invariant(
    !Array.isArray(dispatchListener),
    "executeDirectDispatch(...): Invalid `event`."
  );
  event.currentTarget = dispatchListener
    ? getNodeFromInstance(dispatchInstance)
    : null;
  dispatchListener = dispatchListener ? dispatchListener(event) : null;
  event.currentTarget = null;
  event._dispatchListeners = null;
  event._dispatchInstances = null;
  return dispatchListener;
}
function accumulateInto(current, next) {
  invariant(
    null != next,
    "accumulateInto(...): Accumulated items must not be null or undefined."
  );
  if (null == current) return next;
  if (Array.isArray(current)) {
    if (Array.isArray(next)) return current.push.apply(current, next), current;
    current.push(next);
    return current;
  }
  return Array.isArray(next) ? [current].concat(next) : [current, next];
}
function forEachAccumulated(arr, cb, scope) {
  Array.isArray(arr) ? arr.forEach(cb, scope) : arr && cb.call(scope, arr);
}
var eventQueue = null;
function executeDispatchesAndReleaseTopLevel(e) {
  if (e) {
    var dispatchListeners = e._dispatchListeners,
      dispatchInstances = e._dispatchInstances;
    if (Array.isArray(dispatchListeners))
      for (
        var i = 0;
        i < dispatchListeners.length && !e.isPropagationStopped();
        i++
      )
        executeDispatch(e, !1, dispatchListeners[i], dispatchInstances[i]);
    else
      dispatchListeners &&
        executeDispatch(e, !1, dispatchListeners, dispatchInstances);
    e._dispatchListeners = null;
    e._dispatchInstances = null;
    e.isPersistent() || e.constructor.release(e);
  }
}
var injection = {
  injectEventPluginOrder: function(injectedEventPluginOrder) {
    invariant(
      !eventPluginOrder,
      "EventPluginRegistry: Cannot inject event plugin ordering more than once. You are likely trying to load more than one copy of React."
    );
    eventPluginOrder = Array.prototype.slice.call(injectedEventPluginOrder);
    recomputePluginOrdering();
  },
  injectEventPluginsByName: function(injectedNamesToPlugins) {
    var isOrderingDirty = !1,
      pluginName;
    for (pluginName in injectedNamesToPlugins)
      if (injectedNamesToPlugins.hasOwnProperty(pluginName)) {
        var pluginModule = injectedNamesToPlugins[pluginName];
        (namesToPlugins.hasOwnProperty(pluginName) &&
          namesToPlugins[pluginName] === pluginModule) ||
          (invariant(
            !namesToPlugins[pluginName],
            "EventPluginRegistry: Cannot inject two different event plugins using the same name, `%s`.",
            pluginName
          ),
          (namesToPlugins[pluginName] = pluginModule),
          (isOrderingDirty = !0));
      }
    isOrderingDirty && recomputePluginOrdering();
  }
};
function getListener(inst, registrationName) {
  var listener = inst.stateNode;
  if (!listener) return null;
  var props = getFiberCurrentPropsFromNode(listener);
  if (!props) return null;
  listener = props[registrationName];
  a: switch (registrationName) {
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
      (props = !props.disabled) ||
        ((inst = inst.type),
        (props = !(
          "button" === inst ||
          "input" === inst ||
          "select" === inst ||
          "textarea" === inst
        )));
      inst = !props;
      break a;
    default:
      inst = !1;
  }
  if (inst) return null;
  invariant(
    !listener || "function" === typeof listener,
    "Expected `%s` listener to be a function, instead got a value of `%s` type.",
    registrationName,
    typeof listener
  );
  return listener;
}
function getParent(inst) {
  do inst = inst.return;
  while (inst && 5 !== inst.tag);
  return inst ? inst : null;
}
function traverseTwoPhase(inst, fn, arg) {
  for (var path = []; inst; ) path.push(inst), (inst = getParent(inst));
  for (inst = path.length; 0 < inst--; ) fn(path[inst], "captured", arg);
  for (inst = 0; inst < path.length; inst++) fn(path[inst], "bubbled", arg);
}
function accumulateDirectionalDispatches(inst, phase, event) {
  if (
    (phase = getListener(
      inst,
      event.dispatchConfig.phasedRegistrationNames[phase]
    ))
  )
    (event._dispatchListeners = accumulateInto(
      event._dispatchListeners,
      phase
    )),
      (event._dispatchInstances = accumulateInto(
        event._dispatchInstances,
        inst
      ));
}
function accumulateTwoPhaseDispatchesSingle(event) {
  event &&
    event.dispatchConfig.phasedRegistrationNames &&
    traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
}
function accumulateTwoPhaseDispatchesSingleSkipTarget(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    var targetInst = event._targetInst;
    targetInst = targetInst ? getParent(targetInst) : null;
    traverseTwoPhase(targetInst, accumulateDirectionalDispatches, event);
  }
}
function accumulateDirectDispatchesSingle(event) {
  if (event && event.dispatchConfig.registrationName) {
    var inst = event._targetInst;
    if (inst && event && event.dispatchConfig.registrationName) {
      var listener = getListener(inst, event.dispatchConfig.registrationName);
      listener &&
        ((event._dispatchListeners = accumulateInto(
          event._dispatchListeners,
          listener
        )),
        (event._dispatchInstances = accumulateInto(
          event._dispatchInstances,
          inst
        )));
    }
  }
}
var shouldBeReleasedProperties = "dispatchConfig _targetInst nativeEvent isDefaultPrevented isPropagationStopped _dispatchListeners _dispatchInstances".split(
  " "
);
function functionThatReturnsTrue() {
  return !0;
}
function functionThatReturnsFalse() {
  return !1;
}
function SyntheticEvent(
  dispatchConfig,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {
  this.dispatchConfig = dispatchConfig;
  this._targetInst = targetInst;
  this.nativeEvent = nativeEvent;
  dispatchConfig = this.constructor.Interface;
  for (var propName in dispatchConfig)
    dispatchConfig.hasOwnProperty(propName) &&
      ((targetInst = dispatchConfig[propName])
        ? (this[propName] = targetInst(nativeEvent))
        : "target" === propName
          ? (this.target = nativeEventTarget)
          : (this[propName] = nativeEvent[propName]));
  this.isDefaultPrevented = (null != nativeEvent.defaultPrevented
  ? nativeEvent.defaultPrevented
  : !1 === nativeEvent.returnValue)
    ? functionThatReturnsTrue
    : functionThatReturnsFalse;
  this.isPropagationStopped = functionThatReturnsFalse;
  return this;
}
Object.assign(SyntheticEvent.prototype, {
  preventDefault: function() {
    this.defaultPrevented = !0;
    var event = this.nativeEvent;
    event &&
      (event.preventDefault
        ? event.preventDefault()
        : "unknown" !== typeof event.returnValue && (event.returnValue = !1),
      (this.isDefaultPrevented = functionThatReturnsTrue));
  },
  stopPropagation: function() {
    var event = this.nativeEvent;
    event &&
      (event.stopPropagation
        ? event.stopPropagation()
        : "unknown" !== typeof event.cancelBubble && (event.cancelBubble = !0),
      (this.isPropagationStopped = functionThatReturnsTrue));
  },
  persist: function() {
    this.isPersistent = functionThatReturnsTrue;
  },
  isPersistent: functionThatReturnsFalse,
  destructor: function() {
    var Interface = this.constructor.Interface,
      propName;
    for (propName in Interface) this[propName] = null;
    for (
      Interface = 0;
      Interface < shouldBeReleasedProperties.length;
      Interface++
    )
      this[shouldBeReleasedProperties[Interface]] = null;
  }
});
SyntheticEvent.Interface = {
  type: null,
  target: null,
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
SyntheticEvent.extend = function(Interface) {
  function E() {}
  function Class() {
    return Super.apply(this, arguments);
  }
  var Super = this;
  E.prototype = Super.prototype;
  var prototype = new E();
  Object.assign(prototype, Class.prototype);
  Class.prototype = prototype;
  Class.prototype.constructor = Class;
  Class.Interface = Object.assign({}, Super.Interface, Interface);
  Class.extend = Super.extend;
  addEventPoolingTo(Class);
  return Class;
};
addEventPoolingTo(SyntheticEvent);
function getPooledEvent(dispatchConfig, targetInst, nativeEvent, nativeInst) {
  if (this.eventPool.length) {
    var instance = this.eventPool.pop();
    this.call(instance, dispatchConfig, targetInst, nativeEvent, nativeInst);
    return instance;
  }
  return new this(dispatchConfig, targetInst, nativeEvent, nativeInst);
}
function releasePooledEvent(event) {
  invariant(
    event instanceof this,
    "Trying to release an event instance  into a pool of a different type."
  );
  event.destructor();
  10 > this.eventPool.length && this.eventPool.push(event);
}
function addEventPoolingTo(EventConstructor) {
  EventConstructor.eventPool = [];
  EventConstructor.getPooled = getPooledEvent;
  EventConstructor.release = releasePooledEvent;
}
var ResponderSyntheticEvent = SyntheticEvent.extend({
  touchHistory: function() {
    return null;
  }
});
function isStartish(topLevelType) {
  return "topTouchStart" === topLevelType;
}
function isMoveish(topLevelType) {
  return "topTouchMove" === topLevelType;
}
var startDependencies = ["topTouchStart"],
  moveDependencies = ["topTouchMove"],
  endDependencies = ["topTouchCancel", "topTouchEnd"],
  touchBank = [],
  touchHistory = {
    touchBank: touchBank,
    numberActiveTouches: 0,
    indexOfSingleActiveTouch: -1,
    mostRecentTimeStamp: 0
  };
function timestampForTouch(touch) {
  return touch.timeStamp || touch.timestamp;
}
function getTouchIdentifier(_ref) {
  _ref = _ref.identifier;
  invariant(null != _ref, "Touch object is missing identifier.");
  return _ref;
}
function recordTouchStart(touch) {
  var identifier = getTouchIdentifier(touch),
    touchRecord = touchBank[identifier];
  touchRecord
    ? ((touchRecord.touchActive = !0),
      (touchRecord.startPageX = touch.pageX),
      (touchRecord.startPageY = touch.pageY),
      (touchRecord.startTimeStamp = timestampForTouch(touch)),
      (touchRecord.currentPageX = touch.pageX),
      (touchRecord.currentPageY = touch.pageY),
      (touchRecord.currentTimeStamp = timestampForTouch(touch)),
      (touchRecord.previousPageX = touch.pageX),
      (touchRecord.previousPageY = touch.pageY),
      (touchRecord.previousTimeStamp = timestampForTouch(touch)))
    : ((touchRecord = {
        touchActive: !0,
        startPageX: touch.pageX,
        startPageY: touch.pageY,
        startTimeStamp: timestampForTouch(touch),
        currentPageX: touch.pageX,
        currentPageY: touch.pageY,
        currentTimeStamp: timestampForTouch(touch),
        previousPageX: touch.pageX,
        previousPageY: touch.pageY,
        previousTimeStamp: timestampForTouch(touch)
      }),
      (touchBank[identifier] = touchRecord));
  touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
}
function recordTouchMove(touch) {
  var touchRecord = touchBank[getTouchIdentifier(touch)];
  touchRecord
    ? ((touchRecord.touchActive = !0),
      (touchRecord.previousPageX = touchRecord.currentPageX),
      (touchRecord.previousPageY = touchRecord.currentPageY),
      (touchRecord.previousTimeStamp = touchRecord.currentTimeStamp),
      (touchRecord.currentPageX = touch.pageX),
      (touchRecord.currentPageY = touch.pageY),
      (touchRecord.currentTimeStamp = timestampForTouch(touch)),
      (touchHistory.mostRecentTimeStamp = timestampForTouch(touch)))
    : console.error(
        "Cannot record touch move without a touch start.\nTouch Move: %s\n",
        "Touch Bank: %s",
        printTouch(touch),
        printTouchBank()
      );
}
function recordTouchEnd(touch) {
  var touchRecord = touchBank[getTouchIdentifier(touch)];
  touchRecord
    ? ((touchRecord.touchActive = !1),
      (touchRecord.previousPageX = touchRecord.currentPageX),
      (touchRecord.previousPageY = touchRecord.currentPageY),
      (touchRecord.previousTimeStamp = touchRecord.currentTimeStamp),
      (touchRecord.currentPageX = touch.pageX),
      (touchRecord.currentPageY = touch.pageY),
      (touchRecord.currentTimeStamp = timestampForTouch(touch)),
      (touchHistory.mostRecentTimeStamp = timestampForTouch(touch)))
    : console.error(
        "Cannot record touch end without a touch start.\nTouch End: %s\n",
        "Touch Bank: %s",
        printTouch(touch),
        printTouchBank()
      );
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
  var printed = JSON.stringify(touchBank.slice(0, 20));
  20 < touchBank.length &&
    (printed += " (original size: " + touchBank.length + ")");
  return printed;
}
var ResponderTouchHistoryStore = {
  recordTouchTrack: function(topLevelType, nativeEvent) {
    if (isMoveish(topLevelType))
      nativeEvent.changedTouches.forEach(recordTouchMove);
    else if (isStartish(topLevelType))
      nativeEvent.changedTouches.forEach(recordTouchStart),
        (touchHistory.numberActiveTouches = nativeEvent.touches.length),
        1 === touchHistory.numberActiveTouches &&
          (touchHistory.indexOfSingleActiveTouch =
            nativeEvent.touches[0].identifier);
    else if (
      "topTouchEnd" === topLevelType ||
      "topTouchCancel" === topLevelType
    )
      if (
        (nativeEvent.changedTouches.forEach(recordTouchEnd),
        (touchHistory.numberActiveTouches = nativeEvent.touches.length),
        1 === touchHistory.numberActiveTouches)
      )
        for (topLevelType = 0; topLevelType < touchBank.length; topLevelType++)
          if (
            ((nativeEvent = touchBank[topLevelType]),
            null != nativeEvent && nativeEvent.touchActive)
          ) {
            touchHistory.indexOfSingleActiveTouch = topLevelType;
            break;
          }
  },
  touchHistory: touchHistory
};
function accumulate(current, next) {
  invariant(
    null != next,
    "accumulate(...): Accumulated items must be not be null or undefined."
  );
  return null == current
    ? next
    : Array.isArray(current)
      ? current.concat(next)
      : Array.isArray(next) ? [current].concat(next) : [current, next];
}
var responderInst = null,
  trackedTouchCount = 0;
function changeResponder(nextResponderInst, blockHostResponder) {
  var oldResponderInst = responderInst;
  responderInst = nextResponderInst;
  if (null !== ResponderEventPlugin.GlobalResponderHandler)
    ResponderEventPlugin.GlobalResponderHandler.onChange(
      oldResponderInst,
      nextResponderInst,
      blockHostResponder
    );
}
var eventTypes$1 = {
    startShouldSetResponder: {
      phasedRegistrationNames: {
        bubbled: "onStartShouldSetResponder",
        captured: "onStartShouldSetResponderCapture"
      },
      dependencies: startDependencies
    },
    scrollShouldSetResponder: {
      phasedRegistrationNames: {
        bubbled: "onScrollShouldSetResponder",
        captured: "onScrollShouldSetResponderCapture"
      },
      dependencies: ["topScroll"]
    },
    selectionChangeShouldSetResponder: {
      phasedRegistrationNames: {
        bubbled: "onSelectionChangeShouldSetResponder",
        captured: "onSelectionChangeShouldSetResponderCapture"
      },
      dependencies: ["topSelectionChange"]
    },
    moveShouldSetResponder: {
      phasedRegistrationNames: {
        bubbled: "onMoveShouldSetResponder",
        captured: "onMoveShouldSetResponderCapture"
      },
      dependencies: moveDependencies
    },
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
    responderGrant: { registrationName: "onResponderGrant", dependencies: [] },
    responderReject: {
      registrationName: "onResponderReject",
      dependencies: []
    },
    responderTerminate: {
      registrationName: "onResponderTerminate",
      dependencies: []
    }
  },
  ResponderEventPlugin = {
    _getResponder: function() {
      return responderInst;
    },
    eventTypes: eventTypes$1,
    extractEvents: function(
      topLevelType,
      targetInst,
      nativeEvent,
      nativeEventTarget
    ) {
      if (isStartish(topLevelType)) trackedTouchCount += 1;
      else if (
        "topTouchEnd" === topLevelType ||
        "topTouchCancel" === topLevelType
      )
        if (0 <= trackedTouchCount) --trackedTouchCount;
        else
          return (
            console.error(
              "Ended a touch event which was not counted in `trackedTouchCount`."
            ),
            null
          );
      ResponderTouchHistoryStore.recordTouchTrack(topLevelType, nativeEvent);
      if (
        targetInst &&
        (("topScroll" === topLevelType && !nativeEvent.responderIgnoreScroll) ||
          (0 < trackedTouchCount && "topSelectionChange" === topLevelType) ||
          isStartish(topLevelType) ||
          isMoveish(topLevelType))
      ) {
        var JSCompiler_temp = isStartish(topLevelType)
          ? eventTypes$1.startShouldSetResponder
          : isMoveish(topLevelType)
            ? eventTypes$1.moveShouldSetResponder
            : "topSelectionChange" === topLevelType
              ? eventTypes$1.selectionChangeShouldSetResponder
              : eventTypes$1.scrollShouldSetResponder;
        if (responderInst)
          b: {
            var JSCompiler_temp$jscomp$0 = responderInst;
            for (
              var depthA = 0, tempA = JSCompiler_temp$jscomp$0;
              tempA;
              tempA = getParent(tempA)
            )
              depthA++;
            tempA = 0;
            for (var tempB = targetInst; tempB; tempB = getParent(tempB))
              tempA++;
            for (; 0 < depthA - tempA; )
              (JSCompiler_temp$jscomp$0 = getParent(JSCompiler_temp$jscomp$0)),
                depthA--;
            for (; 0 < tempA - depthA; )
              (targetInst = getParent(targetInst)), tempA--;
            for (; depthA--; ) {
              if (
                JSCompiler_temp$jscomp$0 === targetInst ||
                JSCompiler_temp$jscomp$0 === targetInst.alternate
              )
                break b;
              JSCompiler_temp$jscomp$0 = getParent(JSCompiler_temp$jscomp$0);
              targetInst = getParent(targetInst);
            }
            JSCompiler_temp$jscomp$0 = null;
          }
        else JSCompiler_temp$jscomp$0 = targetInst;
        targetInst = JSCompiler_temp$jscomp$0 === responderInst;
        JSCompiler_temp$jscomp$0 = ResponderSyntheticEvent.getPooled(
          JSCompiler_temp,
          JSCompiler_temp$jscomp$0,
          nativeEvent,
          nativeEventTarget
        );
        JSCompiler_temp$jscomp$0.touchHistory =
          ResponderTouchHistoryStore.touchHistory;
        targetInst
          ? forEachAccumulated(
              JSCompiler_temp$jscomp$0,
              accumulateTwoPhaseDispatchesSingleSkipTarget
            )
          : forEachAccumulated(
              JSCompiler_temp$jscomp$0,
              accumulateTwoPhaseDispatchesSingle
            );
        b: {
          JSCompiler_temp = JSCompiler_temp$jscomp$0._dispatchListeners;
          targetInst = JSCompiler_temp$jscomp$0._dispatchInstances;
          if (Array.isArray(JSCompiler_temp))
            for (
              depthA = 0;
              depthA < JSCompiler_temp.length &&
              !JSCompiler_temp$jscomp$0.isPropagationStopped();
              depthA++
            ) {
              if (
                JSCompiler_temp[depthA](
                  JSCompiler_temp$jscomp$0,
                  targetInst[depthA]
                )
              ) {
                JSCompiler_temp = targetInst[depthA];
                break b;
              }
            }
          else if (
            JSCompiler_temp &&
            JSCompiler_temp(JSCompiler_temp$jscomp$0, targetInst)
          ) {
            JSCompiler_temp = targetInst;
            break b;
          }
          JSCompiler_temp = null;
        }
        JSCompiler_temp$jscomp$0._dispatchInstances = null;
        JSCompiler_temp$jscomp$0._dispatchListeners = null;
        JSCompiler_temp$jscomp$0.isPersistent() ||
          JSCompiler_temp$jscomp$0.constructor.release(
            JSCompiler_temp$jscomp$0
          );
        JSCompiler_temp && JSCompiler_temp !== responderInst
          ? ((JSCompiler_temp$jscomp$0 = void 0),
            (targetInst = ResponderSyntheticEvent.getPooled(
              eventTypes$1.responderGrant,
              JSCompiler_temp,
              nativeEvent,
              nativeEventTarget
            )),
            (targetInst.touchHistory = ResponderTouchHistoryStore.touchHistory),
            forEachAccumulated(targetInst, accumulateDirectDispatchesSingle),
            (depthA = !0 === executeDirectDispatch(targetInst)),
            responderInst
              ? ((tempA = ResponderSyntheticEvent.getPooled(
                  eventTypes$1.responderTerminationRequest,
                  responderInst,
                  nativeEvent,
                  nativeEventTarget
                )),
                (tempA.touchHistory = ResponderTouchHistoryStore.touchHistory),
                forEachAccumulated(tempA, accumulateDirectDispatchesSingle),
                (tempB =
                  !tempA._dispatchListeners || executeDirectDispatch(tempA)),
                tempA.isPersistent() || tempA.constructor.release(tempA),
                tempB
                  ? ((tempA = ResponderSyntheticEvent.getPooled(
                      eventTypes$1.responderTerminate,
                      responderInst,
                      nativeEvent,
                      nativeEventTarget
                    )),
                    (tempA.touchHistory =
                      ResponderTouchHistoryStore.touchHistory),
                    forEachAccumulated(tempA, accumulateDirectDispatchesSingle),
                    (JSCompiler_temp$jscomp$0 = accumulate(
                      JSCompiler_temp$jscomp$0,
                      [targetInst, tempA]
                    )),
                    changeResponder(JSCompiler_temp, depthA))
                  : ((JSCompiler_temp = ResponderSyntheticEvent.getPooled(
                      eventTypes$1.responderReject,
                      JSCompiler_temp,
                      nativeEvent,
                      nativeEventTarget
                    )),
                    (JSCompiler_temp.touchHistory =
                      ResponderTouchHistoryStore.touchHistory),
                    forEachAccumulated(
                      JSCompiler_temp,
                      accumulateDirectDispatchesSingle
                    ),
                    (JSCompiler_temp$jscomp$0 = accumulate(
                      JSCompiler_temp$jscomp$0,
                      JSCompiler_temp
                    ))))
              : ((JSCompiler_temp$jscomp$0 = accumulate(
                  JSCompiler_temp$jscomp$0,
                  targetInst
                )),
                changeResponder(JSCompiler_temp, depthA)),
            (JSCompiler_temp = JSCompiler_temp$jscomp$0))
          : (JSCompiler_temp = null);
      } else JSCompiler_temp = null;
      JSCompiler_temp$jscomp$0 = responderInst && isStartish(topLevelType);
      targetInst = responderInst && isMoveish(topLevelType);
      depthA =
        responderInst &&
        ("topTouchEnd" === topLevelType || "topTouchCancel" === topLevelType);
      if (
        (JSCompiler_temp$jscomp$0 = JSCompiler_temp$jscomp$0
          ? eventTypes$1.responderStart
          : targetInst
            ? eventTypes$1.responderMove
            : depthA ? eventTypes$1.responderEnd : null)
      )
        (JSCompiler_temp$jscomp$0 = ResponderSyntheticEvent.getPooled(
          JSCompiler_temp$jscomp$0,
          responderInst,
          nativeEvent,
          nativeEventTarget
        )),
          (JSCompiler_temp$jscomp$0.touchHistory =
            ResponderTouchHistoryStore.touchHistory),
          forEachAccumulated(
            JSCompiler_temp$jscomp$0,
            accumulateDirectDispatchesSingle
          ),
          (JSCompiler_temp = accumulate(
            JSCompiler_temp,
            JSCompiler_temp$jscomp$0
          ));
      JSCompiler_temp$jscomp$0 =
        responderInst && "topTouchCancel" === topLevelType;
      if (
        (topLevelType =
          responderInst &&
          !JSCompiler_temp$jscomp$0 &&
          ("topTouchEnd" === topLevelType || "topTouchCancel" === topLevelType))
      )
        a: {
          if ((topLevelType = nativeEvent.touches) && 0 !== topLevelType.length)
            for (targetInst = 0; targetInst < topLevelType.length; targetInst++)
              if (
                ((depthA = topLevelType[targetInst].target),
                null !== depthA && void 0 !== depthA && 0 !== depthA)
              ) {
                tempA = getInstanceFromNode(depthA);
                b: {
                  for (depthA = responderInst; tempA; ) {
                    if (depthA === tempA || depthA === tempA.alternate) {
                      depthA = !0;
                      break b;
                    }
                    tempA = getParent(tempA);
                  }
                  depthA = !1;
                }
                if (depthA) {
                  topLevelType = !1;
                  break a;
                }
              }
          topLevelType = !0;
        }
      if (
        (topLevelType = JSCompiler_temp$jscomp$0
          ? eventTypes$1.responderTerminate
          : topLevelType ? eventTypes$1.responderRelease : null)
      )
        (nativeEvent = ResponderSyntheticEvent.getPooled(
          topLevelType,
          responderInst,
          nativeEvent,
          nativeEventTarget
        )),
          (nativeEvent.touchHistory = ResponderTouchHistoryStore.touchHistory),
          forEachAccumulated(nativeEvent, accumulateDirectDispatchesSingle),
          (JSCompiler_temp = accumulate(JSCompiler_temp, nativeEvent)),
          changeResponder(null);
      return JSCompiler_temp;
    },
    GlobalResponderHandler: null,
    injection: {
      injectGlobalResponderHandler: function(GlobalResponderHandler) {
        ResponderEventPlugin.GlobalResponderHandler = GlobalResponderHandler;
      }
    }
  },
  customBubblingEventTypes$1 =
    ReactNativeViewConfigRegistry.customBubblingEventTypes,
  customDirectEventTypes$1 =
    ReactNativeViewConfigRegistry.customDirectEventTypes,
  ReactNativeBridgeEventPlugin = {
    eventTypes: ReactNativeViewConfigRegistry.eventTypes,
    extractEvents: function(
      topLevelType,
      targetInst,
      nativeEvent,
      nativeEventTarget
    ) {
      if (null == targetInst) return null;
      var bubbleDispatchConfig = customBubblingEventTypes$1[topLevelType],
        directDispatchConfig = customDirectEventTypes$1[topLevelType];
      invariant(
        bubbleDispatchConfig || directDispatchConfig,
        'Unsupported top level event type "%s" dispatched',
        topLevelType
      );
      topLevelType = SyntheticEvent.getPooled(
        bubbleDispatchConfig || directDispatchConfig,
        targetInst,
        nativeEvent,
        nativeEventTarget
      );
      if (bubbleDispatchConfig)
        forEachAccumulated(topLevelType, accumulateTwoPhaseDispatchesSingle);
      else if (directDispatchConfig)
        forEachAccumulated(topLevelType, accumulateDirectDispatchesSingle);
      else return null;
      return topLevelType;
    }
  };
injection.injectEventPluginOrder([
  "ResponderEventPlugin",
  "ReactNativeBridgeEventPlugin"
]);
injection.injectEventPluginsByName({
  ResponderEventPlugin: ResponderEventPlugin,
  ReactNativeBridgeEventPlugin: ReactNativeBridgeEventPlugin
});
var instanceCache = {},
  instanceProps = {};
function uncacheFiberNode(tag) {
  delete instanceCache[tag];
  delete instanceProps[tag];
}
function getInstanceFromTag(tag) {
  return instanceCache[tag] || null;
}
var ReactNativeComponentTree = {
    precacheFiberNode: function(hostInst, tag) {
      instanceCache[tag] = hostInst;
    },
    uncacheFiberNode: uncacheFiberNode,
    getClosestInstanceFromNode: getInstanceFromTag,
    getInstanceFromNode: getInstanceFromTag,
    getNodeFromInstance: function(inst) {
      var tag = inst.stateNode._nativeTag;
      void 0 === tag && (tag = inst.stateNode.canonical._nativeTag);
      invariant(tag, "All native instances should have a tag.");
      return tag;
    },
    getFiberCurrentPropsFromNode: function(stateNode) {
      return instanceProps[stateNode._nativeTag] || null;
    },
    updateFiberProps: function(tag, props) {
      instanceProps[tag] = props;
    }
  },
  restoreTarget = null,
  restoreQueue = null;
function restoreStateOfTarget(target) {
  if ((target = getInstanceFromNode(target))) {
    invariant(
      null,
      "Fiber needs to be injected to handle a fiber target for controlled events. This error is likely caused by a bug in React. Please file an issue."
    );
    var props = getFiberCurrentPropsFromNode(target.stateNode);
    null.restoreControlledState(target.stateNode, target.type, props);
  }
}
function _batchedUpdates(fn, bookkeeping) {
  return fn(bookkeeping);
}
function _flushInteractiveUpdates() {}
var isBatching = !1;
function batchedUpdates(fn, bookkeeping) {
  if (isBatching) return fn(bookkeeping);
  isBatching = !0;
  try {
    return _batchedUpdates(fn, bookkeeping);
  } finally {
    if (((isBatching = !1), null !== restoreTarget || null !== restoreQueue))
      if (
        (_flushInteractiveUpdates(),
        restoreTarget &&
          ((bookkeeping = restoreTarget),
          (fn = restoreQueue),
          (restoreQueue = restoreTarget = null),
          restoreStateOfTarget(bookkeeping),
          fn))
      )
        for (bookkeeping = 0; bookkeeping < fn.length; bookkeeping++)
          restoreStateOfTarget(fn[bookkeeping]);
  }
}
var EMPTY_NATIVE_EVENT = {};
function _receiveRootNodeIDEvent(rootNodeID, topLevelType, nativeEventParam) {
  var nativeEvent = nativeEventParam || EMPTY_NATIVE_EVENT,
    inst = getInstanceFromTag(rootNodeID);
  batchedUpdates(function() {
    var events = nativeEvent.target;
    for (var events$jscomp$0 = null, i = 0; i < plugins.length; i++) {
      var possiblePlugin = plugins[i];
      possiblePlugin &&
        (possiblePlugin = possiblePlugin.extractEvents(
          topLevelType,
          inst,
          nativeEvent,
          events
        )) &&
        (events$jscomp$0 = accumulateInto(events$jscomp$0, possiblePlugin));
    }
    events = events$jscomp$0;
    null !== events && (eventQueue = accumulateInto(eventQueue, events));
    events = eventQueue;
    eventQueue = null;
    events &&
      (forEachAccumulated(events, executeDispatchesAndReleaseTopLevel),
      invariant(
        !eventQueue,
        "processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented."
      ),
      ReactErrorUtils.rethrowCaughtError());
  });
}
RCTEventEmitter.register({
  getListener: getListener,
  registrationNames: registrationNameModules,
  _receiveRootNodeIDEvent: _receiveRootNodeIDEvent,
  receiveEvent: function(rootNodeID, topLevelType, nativeEventParam) {
    _receiveRootNodeIDEvent(rootNodeID, topLevelType, nativeEventParam);
  },
  receiveTouches: function(eventTopLevelType, touches, changedIndices) {
    if (
      "topTouchEnd" === eventTopLevelType ||
      "topTouchCancel" === eventTopLevelType
    ) {
      var JSCompiler_temp = [];
      for (var i = 0; i < changedIndices.length; i++) {
        var index = changedIndices[i];
        JSCompiler_temp.push(touches[index]);
        touches[index] = null;
      }
      for (i = changedIndices = 0; i < touches.length; i++)
        (index = touches[i]),
          null !== index && (touches[changedIndices++] = index);
      touches.length = changedIndices;
    } else
      for (JSCompiler_temp = [], i = 0; i < changedIndices.length; i++)
        JSCompiler_temp.push(touches[changedIndices[i]]);
    for (
      changedIndices = 0;
      changedIndices < JSCompiler_temp.length;
      changedIndices++
    ) {
      i = JSCompiler_temp[changedIndices];
      i.changedTouches = JSCompiler_temp;
      i.touches = touches;
      index = null;
      var target = i.target;
      null === target || void 0 === target || 1 > target || (index = target);
      _receiveRootNodeIDEvent(index, eventTopLevelType, i);
    }
  }
});
getFiberCurrentPropsFromNode =
  ReactNativeComponentTree.getFiberCurrentPropsFromNode;
getInstanceFromNode = ReactNativeComponentTree.getInstanceFromNode;
getNodeFromInstance = ReactNativeComponentTree.getNodeFromInstance;
ResponderEventPlugin.injection.injectGlobalResponderHandler({
  onChange: function(from, to, blockNativeResponder) {
    null !== to
      ? UIManager.setJSResponder(to.stateNode._nativeTag, blockNativeResponder)
      : UIManager.clearJSResponder();
  }
});
var ReactCurrentOwner =
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
  hasSymbol = "function" === typeof Symbol && Symbol.for,
  REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for("react.element") : 60103,
  REACT_PORTAL_TYPE = hasSymbol ? Symbol.for("react.portal") : 60106,
  REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for("react.fragment") : 60107,
  REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for("react.strict_mode") : 60108,
  REACT_PROFILER_TYPE = hasSymbol ? Symbol.for("react.profiler") : 60114,
  REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for("react.provider") : 60109,
  REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for("react.context") : 60110,
  REACT_ASYNC_MODE_TYPE = hasSymbol ? Symbol.for("react.async_mode") : 60111,
  REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for("react.forward_ref") : 60112,
  REACT_TIMEOUT_TYPE = hasSymbol ? Symbol.for("react.timeout") : 60113,
  MAYBE_ITERATOR_SYMBOL = "function" === typeof Symbol && Symbol.iterator;
function getIteratorFn(maybeIterable) {
  if (null === maybeIterable || "undefined" === typeof maybeIterable)
    return null;
  maybeIterable =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable["@@iterator"];
  return "function" === typeof maybeIterable ? maybeIterable : null;
}
function getComponentName(fiber) {
  var type = fiber.type;
  if ("function" === typeof type) return type.displayName || type.name;
  if ("string" === typeof type) return type;
  switch (type) {
    case REACT_ASYNC_MODE_TYPE:
      return "AsyncMode";
    case REACT_CONTEXT_TYPE:
      return "Context.Consumer";
    case REACT_FRAGMENT_TYPE:
      return "ReactFragment";
    case REACT_PORTAL_TYPE:
      return "ReactPortal";
    case REACT_PROFILER_TYPE:
      return "Profiler(" + fiber.pendingProps.id + ")";
    case REACT_PROVIDER_TYPE:
      return "Context.Provider";
    case REACT_STRICT_MODE_TYPE:
      return "StrictMode";
    case REACT_TIMEOUT_TYPE:
      return "Timeout";
  }
  if ("object" === typeof type && null !== type)
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE:
        return (
          (fiber = type.render.displayName || type.render.name || ""),
          "" !== fiber ? "ForwardRef(" + fiber + ")" : "ForwardRef"
        );
    }
  return null;
}
function isFiberMountedImpl(fiber) {
  var node = fiber;
  if (fiber.alternate) for (; node.return; ) node = node.return;
  else {
    if (0 !== (node.effectTag & 2)) return 1;
    for (; node.return; )
      if (((node = node.return), 0 !== (node.effectTag & 2))) return 1;
  }
  return 3 === node.tag ? 2 : 3;
}
function assertIsMounted(fiber) {
  invariant(
    2 === isFiberMountedImpl(fiber),
    "Unable to find node on an unmounted component."
  );
}
function findCurrentFiberUsingSlowPath(fiber) {
  var alternate = fiber.alternate;
  if (!alternate)
    return (
      (alternate = isFiberMountedImpl(fiber)),
      invariant(
        3 !== alternate,
        "Unable to find node on an unmounted component."
      ),
      1 === alternate ? null : fiber
    );
  for (var a = fiber, b = alternate; ; ) {
    var parentA = a.return,
      parentB = parentA ? parentA.alternate : null;
    if (!parentA || !parentB) break;
    if (parentA.child === parentB.child) {
      for (var child = parentA.child; child; ) {
        if (child === a) return assertIsMounted(parentA), fiber;
        if (child === b) return assertIsMounted(parentA), alternate;
        child = child.sibling;
      }
      invariant(!1, "Unable to find node on an unmounted component.");
    }
    if (a.return !== b.return) (a = parentA), (b = parentB);
    else {
      child = !1;
      for (var _child = parentA.child; _child; ) {
        if (_child === a) {
          child = !0;
          a = parentA;
          b = parentB;
          break;
        }
        if (_child === b) {
          child = !0;
          b = parentA;
          a = parentB;
          break;
        }
        _child = _child.sibling;
      }
      if (!child) {
        for (_child = parentB.child; _child; ) {
          if (_child === a) {
            child = !0;
            a = parentB;
            b = parentA;
            break;
          }
          if (_child === b) {
            child = !0;
            b = parentB;
            a = parentA;
            break;
          }
          _child = _child.sibling;
        }
        invariant(
          child,
          "Child was not found in either parent set. This indicates a bug in React related to the return pointer. Please file an issue."
        );
      }
    }
    invariant(
      a.alternate === b,
      "Return fibers should always be each others' alternates. This error is likely caused by a bug in React. Please file an issue."
    );
  }
  invariant(3 === a.tag, "Unable to find node on an unmounted component.");
  return a.stateNode.current === a ? fiber : alternate;
}
function findCurrentHostFiber(parent) {
  parent = findCurrentFiberUsingSlowPath(parent);
  if (!parent) return null;
  for (var node = parent; ; ) {
    if (5 === node.tag || 6 === node.tag) return node;
    if (node.child) (node.child.return = node), (node = node.child);
    else {
      if (node === parent) break;
      for (; !node.sibling; ) {
        if (!node.return || node.return === parent) return null;
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }
  return null;
}
function findCurrentHostFiberWithNoPortals(parent) {
  parent = findCurrentFiberUsingSlowPath(parent);
  if (!parent) return null;
  for (var node = parent; ; ) {
    if (5 === node.tag || 6 === node.tag) return node;
    if (node.child && 4 !== node.tag)
      (node.child.return = node), (node = node.child);
    else {
      if (node === parent) break;
      for (; !node.sibling; ) {
        if (!node.return || node.return === parent) return null;
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }
  return null;
}
var emptyObject$1 = {},
  removedKeys = null,
  removedKeyCount = 0;
function restoreDeletedValuesInNestedArray(
  updatePayload,
  node,
  validAttributes
) {
  if (Array.isArray(node))
    for (var i = node.length; i-- && 0 < removedKeyCount; )
      restoreDeletedValuesInNestedArray(
        updatePayload,
        node[i],
        validAttributes
      );
  else if (node && 0 < removedKeyCount)
    for (i in removedKeys)
      if (removedKeys[i]) {
        var _nextProp = node[i];
        if (void 0 !== _nextProp) {
          var attributeConfig = validAttributes[i];
          if (attributeConfig) {
            "function" === typeof _nextProp && (_nextProp = !0);
            "undefined" === typeof _nextProp && (_nextProp = null);
            if ("object" !== typeof attributeConfig)
              updatePayload[i] = _nextProp;
            else if (
              "function" === typeof attributeConfig.diff ||
              "function" === typeof attributeConfig.process
            )
              (_nextProp =
                "function" === typeof attributeConfig.process
                  ? attributeConfig.process(_nextProp)
                  : _nextProp),
                (updatePayload[i] = _nextProp);
            removedKeys[i] = !1;
            removedKeyCount--;
          }
        }
      }
}
function diffNestedProperty(
  updatePayload,
  prevProp,
  nextProp,
  validAttributes
) {
  if (!updatePayload && prevProp === nextProp) return updatePayload;
  if (!prevProp || !nextProp)
    return nextProp
      ? addNestedProperty(updatePayload, nextProp, validAttributes)
      : prevProp
        ? clearNestedProperty(updatePayload, prevProp, validAttributes)
        : updatePayload;
  if (!Array.isArray(prevProp) && !Array.isArray(nextProp))
    return diffProperties(updatePayload, prevProp, nextProp, validAttributes);
  if (Array.isArray(prevProp) && Array.isArray(nextProp)) {
    var minLength =
        prevProp.length < nextProp.length ? prevProp.length : nextProp.length,
      i;
    for (i = 0; i < minLength; i++)
      updatePayload = diffNestedProperty(
        updatePayload,
        prevProp[i],
        nextProp[i],
        validAttributes
      );
    for (; i < prevProp.length; i++)
      updatePayload = clearNestedProperty(
        updatePayload,
        prevProp[i],
        validAttributes
      );
    for (; i < nextProp.length; i++)
      updatePayload = addNestedProperty(
        updatePayload,
        nextProp[i],
        validAttributes
      );
    return updatePayload;
  }
  return Array.isArray(prevProp)
    ? diffProperties(
        updatePayload,
        flattenStyle(prevProp),
        nextProp,
        validAttributes
      )
    : diffProperties(
        updatePayload,
        prevProp,
        flattenStyle(nextProp),
        validAttributes
      );
}
function addNestedProperty(updatePayload, nextProp, validAttributes) {
  if (!nextProp) return updatePayload;
  if (!Array.isArray(nextProp))
    return diffProperties(
      updatePayload,
      emptyObject$1,
      nextProp,
      validAttributes
    );
  for (var i = 0; i < nextProp.length; i++)
    updatePayload = addNestedProperty(
      updatePayload,
      nextProp[i],
      validAttributes
    );
  return updatePayload;
}
function clearNestedProperty(updatePayload, prevProp, validAttributes) {
  if (!prevProp) return updatePayload;
  if (!Array.isArray(prevProp))
    return diffProperties(
      updatePayload,
      prevProp,
      emptyObject$1,
      validAttributes
    );
  for (var i = 0; i < prevProp.length; i++)
    updatePayload = clearNestedProperty(
      updatePayload,
      prevProp[i],
      validAttributes
    );
  return updatePayload;
}
function diffProperties(updatePayload, prevProps, nextProps, validAttributes) {
  var attributeConfig, propKey;
  for (propKey in nextProps)
    if ((attributeConfig = validAttributes[propKey])) {
      var prevProp = prevProps[propKey];
      var nextProp = nextProps[propKey];
      "function" === typeof nextProp &&
        ((nextProp = !0), "function" === typeof prevProp && (prevProp = !0));
      "undefined" === typeof nextProp &&
        ((nextProp = null),
        "undefined" === typeof prevProp && (prevProp = null));
      removedKeys && (removedKeys[propKey] = !1);
      if (updatePayload && void 0 !== updatePayload[propKey])
        if ("object" !== typeof attributeConfig)
          updatePayload[propKey] = nextProp;
        else {
          if (
            "function" === typeof attributeConfig.diff ||
            "function" === typeof attributeConfig.process
          )
            (attributeConfig =
              "function" === typeof attributeConfig.process
                ? attributeConfig.process(nextProp)
                : nextProp),
              (updatePayload[propKey] = attributeConfig);
        }
      else if (prevProp !== nextProp)
        if ("object" !== typeof attributeConfig)
          ("object" !== typeof nextProp ||
            null === nextProp ||
            deepDiffer(prevProp, nextProp)) &&
            ((updatePayload || (updatePayload = {}))[propKey] = nextProp);
        else if (
          "function" === typeof attributeConfig.diff ||
          "function" === typeof attributeConfig.process
        ) {
          if (
            void 0 === prevProp ||
            ("function" === typeof attributeConfig.diff
              ? attributeConfig.diff(prevProp, nextProp)
              : "object" !== typeof nextProp ||
                null === nextProp ||
                deepDiffer(prevProp, nextProp))
          )
            (attributeConfig =
              "function" === typeof attributeConfig.process
                ? attributeConfig.process(nextProp)
                : nextProp),
              ((updatePayload || (updatePayload = {}))[
                propKey
              ] = attributeConfig);
        } else
          (removedKeys = null),
            (removedKeyCount = 0),
            (updatePayload = diffNestedProperty(
              updatePayload,
              prevProp,
              nextProp,
              attributeConfig
            )),
            0 < removedKeyCount &&
              updatePayload &&
              (restoreDeletedValuesInNestedArray(
                updatePayload,
                nextProp,
                attributeConfig
              ),
              (removedKeys = null));
    }
  for (var _propKey in prevProps)
    void 0 === nextProps[_propKey] &&
      (!(attributeConfig = validAttributes[_propKey]) ||
        (updatePayload && void 0 !== updatePayload[_propKey]) ||
        ((prevProp = prevProps[_propKey]),
        void 0 !== prevProp &&
          ("object" !== typeof attributeConfig ||
          "function" === typeof attributeConfig.diff ||
          "function" === typeof attributeConfig.process
            ? (((updatePayload || (updatePayload = {}))[_propKey] = null),
              removedKeys || (removedKeys = {}),
              removedKeys[_propKey] ||
                ((removedKeys[_propKey] = !0), removedKeyCount++))
            : (updatePayload = clearNestedProperty(
                updatePayload,
                prevProp,
                attributeConfig
              )))));
  return updatePayload;
}
function mountSafeCallback(context, callback) {
  return function() {
    if (callback) {
      if ("boolean" === typeof context.__isMounted) {
        if (!context.__isMounted) return;
      } else if (
        "function" === typeof context.isMounted &&
        !context.isMounted()
      )
        return;
      return callback.apply(context, arguments);
    }
  };
}
var ReactNativeFiberHostComponent = (function() {
    function ReactNativeFiberHostComponent(tag, viewConfig) {
      if (!(this instanceof ReactNativeFiberHostComponent))
        throw new TypeError("Cannot call a class as a function");
      this._nativeTag = tag;
      this._children = [];
      this.viewConfig = viewConfig;
    }
    ReactNativeFiberHostComponent.prototype.blur = function() {
      TextInputState.blurTextInput(this._nativeTag);
    };
    ReactNativeFiberHostComponent.prototype.focus = function() {
      TextInputState.focusTextInput(this._nativeTag);
    };
    ReactNativeFiberHostComponent.prototype.measure = function(callback) {
      UIManager.measure(this._nativeTag, mountSafeCallback(this, callback));
    };
    ReactNativeFiberHostComponent.prototype.measureInWindow = function(
      callback
    ) {
      UIManager.measureInWindow(
        this._nativeTag,
        mountSafeCallback(this, callback)
      );
    };
    ReactNativeFiberHostComponent.prototype.measureLayout = function(
      relativeToNativeNode,
      onSuccess,
      onFail
    ) {
      UIManager.measureLayout(
        this._nativeTag,
        relativeToNativeNode,
        mountSafeCallback(this, onFail),
        mountSafeCallback(this, onSuccess)
      );
    };
    ReactNativeFiberHostComponent.prototype.setNativeProps = function(
      nativeProps
    ) {
      nativeProps = diffProperties(
        null,
        emptyObject$1,
        nativeProps,
        this.viewConfig.validAttributes
      );
      null != nativeProps &&
        UIManager.updateView(
          this._nativeTag,
          this.viewConfig.uiViewClassName,
          nativeProps
        );
    };
    return ReactNativeFiberHostComponent;
  })(),
  now$1 =
    "object" === typeof performance && "function" === typeof performance.now
      ? function() {
          return performance.now();
        }
      : function() {
          return Date.now();
        },
  scheduledCallback = null,
  frameDeadline = 0,
  frameDeadlineObject = {
    timeRemaining: function() {
      return frameDeadline - now$1();
    },
    didTimeout: !1
  };
function setTimeoutCallback() {
  frameDeadline = now$1() + 5;
  var callback = scheduledCallback;
  scheduledCallback = null;
  null !== callback && callback(frameDeadlineObject);
}
function shim$1() {
  invariant(
    !1,
    "The current renderer does not support hyration. This error is likely caused by a bug in React. Please file an issue."
  );
}
var nextReactTag = 3;
function allocateTag() {
  var tag = nextReactTag;
  1 === tag % 10 && (tag += 2);
  nextReactTag = tag + 2;
  return tag;
}
function recursivelyUncacheFiberNode(node) {
  "number" === typeof node
    ? uncacheFiberNode(node)
    : (uncacheFiberNode(node._nativeTag),
      node._children.forEach(recursivelyUncacheFiberNode));
}
function finalizeInitialChildren(parentInstance) {
  if (0 === parentInstance._children.length) return !1;
  var nativeTags = parentInstance._children.map(function(child) {
    return "number" === typeof child ? child : child._nativeTag;
  });
  UIManager.setChildren(parentInstance._nativeTag, nativeTags);
  return !1;
}
function getStackAddendumByWorkInProgressFiber(workInProgress) {
  var info = "";
  do {
    a: switch (workInProgress.tag) {
      case 0:
      case 1:
      case 2:
      case 5:
        var owner = workInProgress._debugOwner,
          source = workInProgress._debugSource;
        var JSCompiler_inline_result = getComponentName(workInProgress);
        var ownerName = null;
        owner && (ownerName = getComponentName(owner));
        owner = source;
        JSCompiler_inline_result =
          "\n    in " +
          (JSCompiler_inline_result || "Unknown") +
          (owner
            ? " (at " +
              owner.fileName.replace(/^.*[\\\/]/, "") +
              ":" +
              owner.lineNumber +
              ")"
            : ownerName ? " (created by " + ownerName + ")" : "");
        break a;
      default:
        JSCompiler_inline_result = "";
    }
    info += JSCompiler_inline_result;
    workInProgress = workInProgress.return;
  } while (workInProgress);
  return info;
}
new Set();
var valueStack = [],
  index = -1;
function createCursor(defaultValue) {
  return { current: defaultValue };
}
function pop(cursor) {
  0 > index ||
    ((cursor.current = valueStack[index]), (valueStack[index] = null), index--);
}
function push(cursor, value) {
  index++;
  valueStack[index] = cursor.current;
  cursor.current = value;
}
var contextStackCursor = createCursor(emptyObject),
  didPerformWorkStackCursor = createCursor(!1),
  previousContext = emptyObject;
function getUnmaskedContext(workInProgress) {
  return isContextProvider(workInProgress)
    ? previousContext
    : contextStackCursor.current;
}
function getMaskedContext(workInProgress, unmaskedContext) {
  var contextTypes = workInProgress.type.contextTypes;
  if (!contextTypes) return emptyObject;
  var instance = workInProgress.stateNode;
  if (
    instance &&
    instance.__reactInternalMemoizedUnmaskedChildContext === unmaskedContext
  )
    return instance.__reactInternalMemoizedMaskedChildContext;
  var context = {},
    key;
  for (key in contextTypes) context[key] = unmaskedContext[key];
  instance &&
    ((workInProgress = workInProgress.stateNode),
    (workInProgress.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext),
    (workInProgress.__reactInternalMemoizedMaskedChildContext = context));
  return context;
}
function isContextProvider(fiber) {
  return 2 === fiber.tag && null != fiber.type.childContextTypes;
}
function popContextProvider(fiber) {
  isContextProvider(fiber) &&
    (pop(didPerformWorkStackCursor, fiber), pop(contextStackCursor, fiber));
}
function popTopLevelContextObject(fiber) {
  pop(didPerformWorkStackCursor, fiber);
  pop(contextStackCursor, fiber);
}
function pushTopLevelContextObject(fiber, context, didChange) {
  invariant(
    contextStackCursor.current === emptyObject,
    "Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue."
  );
  push(contextStackCursor, context, fiber);
  push(didPerformWorkStackCursor, didChange, fiber);
}
function processChildContext(fiber, parentContext) {
  var instance = fiber.stateNode,
    childContextTypes = fiber.type.childContextTypes;
  if ("function" !== typeof instance.getChildContext) return parentContext;
  instance = instance.getChildContext();
  for (var contextKey in instance)
    invariant(
      contextKey in childContextTypes,
      '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
      getComponentName(fiber) || "Unknown",
      contextKey
    );
  return Object.assign({}, parentContext, instance);
}
function pushContextProvider(workInProgress) {
  if (!isContextProvider(workInProgress)) return !1;
  var instance = workInProgress.stateNode;
  instance =
    (instance && instance.__reactInternalMemoizedMergedChildContext) ||
    emptyObject;
  previousContext = contextStackCursor.current;
  push(contextStackCursor, instance, workInProgress);
  push(
    didPerformWorkStackCursor,
    didPerformWorkStackCursor.current,
    workInProgress
  );
  return !0;
}
function invalidateContextProvider(workInProgress, didChange) {
  var instance = workInProgress.stateNode;
  invariant(
    instance,
    "Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue."
  );
  if (didChange) {
    var mergedContext = processChildContext(workInProgress, previousContext);
    instance.__reactInternalMemoizedMergedChildContext = mergedContext;
    pop(didPerformWorkStackCursor, workInProgress);
    pop(contextStackCursor, workInProgress);
    push(contextStackCursor, mergedContext, workInProgress);
  } else pop(didPerformWorkStackCursor, workInProgress);
  push(didPerformWorkStackCursor, didChange, workInProgress);
}
function FiberNode(tag, pendingProps, key, mode) {
  this.tag = tag;
  this.key = key;
  this.sibling = this.child = this.return = this.stateNode = this.type = null;
  this.index = 0;
  this.ref = null;
  this.pendingProps = pendingProps;
  this.memoizedState = this.updateQueue = this.memoizedProps = null;
  this.mode = mode;
  this.effectTag = 0;
  this.lastEffect = this.firstEffect = this.nextEffect = null;
  this.expirationTime = 0;
  this.alternate = null;
  this.treeBaseTime = this.selfBaseTime = this.actualStartTime = this.actualDuration = 0;
}
function createWorkInProgress(current, pendingProps, expirationTime) {
  var workInProgress = current.alternate;
  null === workInProgress
    ? ((workInProgress = new FiberNode(
        current.tag,
        pendingProps,
        current.key,
        current.mode
      )),
      (workInProgress.type = current.type),
      (workInProgress.stateNode = current.stateNode),
      (workInProgress.alternate = current),
      (current.alternate = workInProgress))
    : ((workInProgress.pendingProps = pendingProps),
      (workInProgress.effectTag = 0),
      (workInProgress.nextEffect = null),
      (workInProgress.firstEffect = null),
      (workInProgress.lastEffect = null),
      (workInProgress.actualDuration = 0),
      (workInProgress.actualStartTime = 0));
  workInProgress.expirationTime = expirationTime;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;
  workInProgress.selfBaseTime = current.selfBaseTime;
  workInProgress.treeBaseTime = current.treeBaseTime;
  return workInProgress;
}
function createFiberFromElement(element, mode, expirationTime) {
  var type = element.type,
    key = element.key;
  element = element.props;
  if ("function" === typeof type)
    var fiberTag = type.prototype && type.prototype.isReactComponent ? 2 : 0;
  else if ("string" === typeof type) fiberTag = 5;
  else
    switch (type) {
      case REACT_FRAGMENT_TYPE:
        return createFiberFromFragment(
          element.children,
          mode,
          expirationTime,
          key
        );
      case REACT_ASYNC_MODE_TYPE:
        fiberTag = 11;
        mode |= 3;
        break;
      case REACT_STRICT_MODE_TYPE:
        fiberTag = 11;
        mode |= 2;
        break;
      case REACT_PROFILER_TYPE:
        return (
          (type = new FiberNode(15, element, key, mode | 4)),
          (type.type = REACT_PROFILER_TYPE),
          (type.expirationTime = expirationTime),
          type
        );
      case REACT_TIMEOUT_TYPE:
        fiberTag = 16;
        mode |= 2;
        break;
      default:
        a: {
          switch ("object" === typeof type && null !== type
            ? type.$$typeof
            : null) {
            case REACT_PROVIDER_TYPE:
              fiberTag = 13;
              break a;
            case REACT_CONTEXT_TYPE:
              fiberTag = 12;
              break a;
            case REACT_FORWARD_REF_TYPE:
              fiberTag = 14;
              break a;
            default:
              invariant(
                !1,
                "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s",
                null == type ? type : typeof type,
                ""
              );
          }
          fiberTag = void 0;
        }
    }
  mode = new FiberNode(fiberTag, element, key, mode);
  mode.type = type;
  mode.expirationTime = expirationTime;
  return mode;
}
function createFiberFromFragment(elements, mode, expirationTime, key) {
  elements = new FiberNode(10, elements, key, mode);
  elements.expirationTime = expirationTime;
  return elements;
}
function createFiberFromText(content, mode, expirationTime) {
  content = new FiberNode(6, content, null, mode);
  content.expirationTime = expirationTime;
  return content;
}
function createFiberFromPortal(portal, mode, expirationTime) {
  mode = new FiberNode(
    4,
    null !== portal.children ? portal.children : [],
    portal.key,
    mode
  );
  mode.expirationTime = expirationTime;
  mode.stateNode = {
    containerInfo: portal.containerInfo,
    pendingChildren: null,
    implementation: portal.implementation
  };
  return mode;
}
function createFiberRoot(containerInfo, isAsync, hydrate) {
  isAsync = new FiberNode(3, null, null, isAsync ? 3 : 0);
  containerInfo = {
    current: isAsync,
    containerInfo: containerInfo,
    pendingChildren: null,
    earliestPendingTime: 0,
    latestPendingTime: 0,
    earliestSuspendedTime: 0,
    latestSuspendedTime: 0,
    latestPingedTime: 0,
    didError: !1,
    pendingCommitExpirationTime: 0,
    finishedWork: null,
    context: null,
    pendingContext: null,
    hydrate: hydrate,
    nextExpirationTimeToWorkOn: 0,
    expirationTime: 0,
    firstBatch: null,
    nextScheduledRoot: null
  };
  return (isAsync.stateNode = containerInfo);
}
var onCommitFiberRoot = null,
  onCommitFiberUnmount = null;
function catchErrors(fn) {
  return function(arg) {
    try {
      return fn(arg);
    } catch (err) {}
  };
}
function injectInternals(internals) {
  if ("undefined" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) return !1;
  var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook.isDisabled || !hook.supportsFiber) return !0;
  try {
    var rendererID = hook.inject(internals);
    onCommitFiberRoot = catchErrors(function(root) {
      return hook.onCommitFiberRoot(rendererID, root);
    });
    onCommitFiberUnmount = catchErrors(function(fiber) {
      return hook.onCommitFiberUnmount(rendererID, fiber);
    });
  } catch (err) {}
  return !0;
}
function onCommitRoot(root) {
  "function" === typeof onCommitFiberRoot && onCommitFiberRoot(root);
}
function onCommitUnmount(fiber) {
  "function" === typeof onCommitFiberUnmount && onCommitFiberUnmount(fiber);
}
function markPendingPriorityLevel(root, expirationTime) {
  root.didError = !1;
  var earliestPendingTime = root.earliestPendingTime;
  0 === earliestPendingTime
    ? (root.earliestPendingTime = root.latestPendingTime = expirationTime)
    : earliestPendingTime > expirationTime
      ? (root.earliestPendingTime = expirationTime)
      : root.latestPendingTime < expirationTime &&
        (root.latestPendingTime = expirationTime);
  findNextPendingPriorityLevel(root);
}
function findNextPendingPriorityLevel(root) {
  var earliestSuspendedTime = root.earliestSuspendedTime,
    earliestPendingTime = root.earliestPendingTime;
  if (0 === earliestSuspendedTime)
    var nextExpirationTimeToWorkOn = (earliestSuspendedTime = earliestPendingTime);
  else
    0 !== earliestPendingTime
      ? ((nextExpirationTimeToWorkOn = earliestPendingTime),
        (earliestSuspendedTime =
          earliestSuspendedTime < earliestPendingTime
            ? earliestSuspendedTime
            : earliestPendingTime))
      : (nextExpirationTimeToWorkOn = earliestSuspendedTime =
          root.latestPingedTime);
  root.didError && (earliestSuspendedTime = 1);
  root.nextExpirationTimeToWorkOn = nextExpirationTimeToWorkOn;
  root.expirationTime = earliestSuspendedTime;
}
var hasForceUpdate = !1;
function createUpdateQueue(baseState) {
  return {
    expirationTime: 0,
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
}
function cloneUpdateQueue(currentQueue) {
  return {
    expirationTime: currentQueue.expirationTime,
    baseState: currentQueue.baseState,
    firstUpdate: currentQueue.firstUpdate,
    lastUpdate: currentQueue.lastUpdate,
    firstCapturedUpdate: null,
    lastCapturedUpdate: null,
    firstEffect: null,
    lastEffect: null,
    firstCapturedEffect: null,
    lastCapturedEffect: null
  };
}
function createUpdate(expirationTime) {
  return {
    expirationTime: expirationTime,
    tag: 0,
    payload: null,
    callback: null,
    next: null,
    nextEffect: null
  };
}
function appendUpdateToQueue(queue, update, expirationTime) {
  null === queue.lastUpdate
    ? (queue.firstUpdate = queue.lastUpdate = update)
    : ((queue.lastUpdate.next = update), (queue.lastUpdate = update));
  if (0 === queue.expirationTime || queue.expirationTime > expirationTime)
    queue.expirationTime = expirationTime;
}
function enqueueUpdate(fiber, update, expirationTime) {
  var alternate = fiber.alternate;
  if (null === alternate) {
    var queue1 = fiber.updateQueue;
    var queue2 = null;
    null === queue1 &&
      (queue1 = fiber.updateQueue = createUpdateQueue(fiber.memoizedState));
  } else
    (queue1 = fiber.updateQueue),
      (queue2 = alternate.updateQueue),
      null === queue1
        ? null === queue2
          ? ((queue1 = fiber.updateQueue = createUpdateQueue(
              fiber.memoizedState
            )),
            (queue2 = alternate.updateQueue = createUpdateQueue(
              alternate.memoizedState
            )))
          : (queue1 = fiber.updateQueue = cloneUpdateQueue(queue2))
        : null === queue2 &&
          (queue2 = alternate.updateQueue = cloneUpdateQueue(queue1));
  null === queue2 || queue1 === queue2
    ? appendUpdateToQueue(queue1, update, expirationTime)
    : null === queue1.lastUpdate || null === queue2.lastUpdate
      ? (appendUpdateToQueue(queue1, update, expirationTime),
        appendUpdateToQueue(queue2, update, expirationTime))
      : (appendUpdateToQueue(queue1, update, expirationTime),
        (queue2.lastUpdate = update));
}
function enqueueCapturedUpdate(workInProgress, update, renderExpirationTime) {
  var workInProgressQueue = workInProgress.updateQueue;
  workInProgressQueue =
    null === workInProgressQueue
      ? (workInProgress.updateQueue = createUpdateQueue(
          workInProgress.memoizedState
        ))
      : ensureWorkInProgressQueueIsAClone(workInProgress, workInProgressQueue);
  null === workInProgressQueue.lastCapturedUpdate
    ? (workInProgressQueue.firstCapturedUpdate = workInProgressQueue.lastCapturedUpdate = update)
    : ((workInProgressQueue.lastCapturedUpdate.next = update),
      (workInProgressQueue.lastCapturedUpdate = update));
  if (
    0 === workInProgressQueue.expirationTime ||
    workInProgressQueue.expirationTime > renderExpirationTime
  )
    workInProgressQueue.expirationTime = renderExpirationTime;
}
function ensureWorkInProgressQueueIsAClone(workInProgress, queue) {
  var current = workInProgress.alternate;
  null !== current &&
    queue === current.updateQueue &&
    (queue = workInProgress.updateQueue = cloneUpdateQueue(queue));
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
    case 1:
      return (
        (workInProgress = update.payload),
        "function" === typeof workInProgress
          ? workInProgress.call(instance, prevState, nextProps)
          : workInProgress
      );
    case 3:
      workInProgress.effectTag = (workInProgress.effectTag & -1025) | 64;
    case 0:
      workInProgress = update.payload;
      nextProps =
        "function" === typeof workInProgress
          ? workInProgress.call(instance, prevState, nextProps)
          : workInProgress;
      if (null === nextProps || void 0 === nextProps) break;
      return Object.assign({}, prevState, nextProps);
    case 2:
      hasForceUpdate = !0;
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
  hasForceUpdate = !1;
  if (
    !(0 === queue.expirationTime || queue.expirationTime > renderExpirationTime)
  ) {
    queue = ensureWorkInProgressQueueIsAClone(workInProgress, queue);
    for (
      var newBaseState = queue.baseState,
        newFirstUpdate = null,
        newExpirationTime = 0,
        update = queue.firstUpdate,
        resultState = newBaseState;
      null !== update;

    ) {
      var updateExpirationTime = update.expirationTime;
      if (updateExpirationTime > renderExpirationTime) {
        if (
          (null === newFirstUpdate &&
            ((newFirstUpdate = update), (newBaseState = resultState)),
          0 === newExpirationTime || newExpirationTime > updateExpirationTime)
        )
          newExpirationTime = updateExpirationTime;
      } else
        (resultState = getStateFromUpdate(
          workInProgress,
          queue,
          update,
          resultState,
          props,
          instance
        )),
          null !== update.callback &&
            ((workInProgress.effectTag |= 32),
            (update.nextEffect = null),
            null === queue.lastEffect
              ? (queue.firstEffect = queue.lastEffect = update)
              : ((queue.lastEffect.nextEffect = update),
                (queue.lastEffect = update)));
      update = update.next;
    }
    updateExpirationTime = null;
    for (update = queue.firstCapturedUpdate; null !== update; ) {
      var _updateExpirationTime = update.expirationTime;
      if (_updateExpirationTime > renderExpirationTime) {
        if (
          (null === updateExpirationTime &&
            ((updateExpirationTime = update),
            null === newFirstUpdate && (newBaseState = resultState)),
          0 === newExpirationTime || newExpirationTime > _updateExpirationTime)
        )
          newExpirationTime = _updateExpirationTime;
      } else
        (resultState = getStateFromUpdate(
          workInProgress,
          queue,
          update,
          resultState,
          props,
          instance
        )),
          null !== update.callback &&
            ((workInProgress.effectTag |= 32),
            (update.nextEffect = null),
            null === queue.lastCapturedEffect
              ? (queue.firstCapturedEffect = queue.lastCapturedEffect = update)
              : ((queue.lastCapturedEffect.nextEffect = update),
                (queue.lastCapturedEffect = update)));
      update = update.next;
    }
    null === newFirstUpdate && (queue.lastUpdate = null);
    null === updateExpirationTime
      ? (queue.lastCapturedUpdate = null)
      : (workInProgress.effectTag |= 32);
    null === newFirstUpdate &&
      null === updateExpirationTime &&
      (newBaseState = resultState);
    queue.baseState = newBaseState;
    queue.firstUpdate = newFirstUpdate;
    queue.firstCapturedUpdate = updateExpirationTime;
    queue.expirationTime = newExpirationTime;
    workInProgress.memoizedState = resultState;
  }
}
function callCallback(callback, context) {
  invariant(
    "function" === typeof callback,
    "Invalid argument passed as callback. Expected a function. Instead received: %s",
    callback
  );
  callback.call(context);
}
function commitUpdateQueue(finishedWork, finishedQueue, instance) {
  null !== finishedQueue.firstCapturedUpdate &&
    (null !== finishedQueue.lastUpdate &&
      ((finishedQueue.lastUpdate.next = finishedQueue.firstCapturedUpdate),
      (finishedQueue.lastUpdate = finishedQueue.lastCapturedUpdate)),
    (finishedQueue.firstCapturedUpdate = finishedQueue.lastCapturedUpdate = null));
  finishedWork = finishedQueue.firstEffect;
  for (
    finishedQueue.firstEffect = finishedQueue.lastEffect = null;
    null !== finishedWork;

  ) {
    var _callback3 = finishedWork.callback;
    null !== _callback3 &&
      ((finishedWork.callback = null), callCallback(_callback3, instance));
    finishedWork = finishedWork.nextEffect;
  }
  finishedWork = finishedQueue.firstCapturedEffect;
  for (
    finishedQueue.firstCapturedEffect = finishedQueue.lastCapturedEffect = null;
    null !== finishedWork;

  )
    (finishedQueue = finishedWork.callback),
      null !== finishedQueue &&
        ((finishedWork.callback = null), callCallback(finishedQueue, instance)),
      (finishedWork = finishedWork.nextEffect);
}
function createCapturedValue(value, source) {
  return {
    value: value,
    source: source,
    stack: getStackAddendumByWorkInProgressFiber(source)
  };
}
var providerCursor = createCursor(null),
  valueCursor = createCursor(null),
  changedBitsCursor = createCursor(0);
function pushProvider(providerFiber) {
  var context = providerFiber.type._context;
  push(changedBitsCursor, context._changedBits, providerFiber);
  push(valueCursor, context._currentValue, providerFiber);
  push(providerCursor, providerFiber, providerFiber);
  context._currentValue = providerFiber.pendingProps.value;
  context._changedBits = providerFiber.stateNode;
}
function popProvider(providerFiber) {
  var changedBits = changedBitsCursor.current,
    currentValue = valueCursor.current;
  pop(providerCursor, providerFiber);
  pop(valueCursor, providerFiber);
  pop(changedBitsCursor, providerFiber);
  providerFiber = providerFiber.type._context;
  providerFiber._currentValue = currentValue;
  providerFiber._changedBits = changedBits;
}
var NO_CONTEXT = {},
  contextStackCursor$1 = createCursor(NO_CONTEXT),
  contextFiberStackCursor = createCursor(NO_CONTEXT),
  rootInstanceStackCursor = createCursor(NO_CONTEXT);
function requiredContext(c) {
  invariant(
    c !== NO_CONTEXT,
    "Expected host context to exist. This error is likely caused by a bug in React. Please file an issue."
  );
  return c;
}
function pushHostContainer(fiber, nextRootInstance) {
  push(rootInstanceStackCursor, nextRootInstance, fiber);
  push(contextFiberStackCursor, fiber, fiber);
  push(contextStackCursor$1, NO_CONTEXT, fiber);
  pop(contextStackCursor$1, fiber);
  push(contextStackCursor$1, { isInAParentText: !1 }, fiber);
}
function popHostContainer(fiber) {
  pop(contextStackCursor$1, fiber);
  pop(contextFiberStackCursor, fiber);
  pop(rootInstanceStackCursor, fiber);
}
function popHostContext(fiber) {
  contextFiberStackCursor.current === fiber &&
    (pop(contextStackCursor$1, fiber), pop(contextFiberStackCursor, fiber));
}
var commitTime = 0,
  timerPausedAt = 0,
  totalElapsedPauseTime = 0;
function recordElapsedActualRenderTime(fiber) {
  fiber.actualDuration = now$1() - totalElapsedPauseTime - fiber.actualDuration;
}
function resumeActualRenderTimerIfPaused() {
  0 < timerPausedAt &&
    ((totalElapsedPauseTime += now$1() - timerPausedAt), (timerPausedAt = 0));
}
var baseStartTime = -1,
  hasOwnProperty = Object.prototype.hasOwnProperty;
function is(x, y) {
  return x === y ? 0 !== x || 0 !== y || 1 / x === 1 / y : x !== x && y !== y;
}
function shallowEqual(objA, objB) {
  if (is(objA, objB)) return !0;
  if (
    "object" !== typeof objA ||
    null === objA ||
    "object" !== typeof objB ||
    null === objB
  )
    return !1;
  var keysA = Object.keys(objA),
    keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return !1;
  for (keysB = 0; keysB < keysA.length; keysB++)
    if (
      !hasOwnProperty.call(objB, keysA[keysB]) ||
      !is(objA[keysA[keysB]], objB[keysA[keysB]])
    )
      return !1;
  return !0;
}
function applyDerivedStateFromProps(
  workInProgress,
  getDerivedStateFromProps,
  nextProps
) {
  var prevState = workInProgress.memoizedState;
  getDerivedStateFromProps = getDerivedStateFromProps(nextProps, prevState);
  prevState =
    null === getDerivedStateFromProps || void 0 === getDerivedStateFromProps
      ? prevState
      : Object.assign({}, prevState, getDerivedStateFromProps);
  workInProgress.memoizedState = prevState;
  workInProgress = workInProgress.updateQueue;
  null !== workInProgress &&
    0 === workInProgress.expirationTime &&
    (workInProgress.baseState = prevState);
}
var classComponentUpdater = {
  isMounted: function(component) {
    return (component = component._reactInternalFiber)
      ? 2 === isFiberMountedImpl(component)
      : !1;
  },
  enqueueSetState: function(inst, payload, callback) {
    inst = inst._reactInternalFiber;
    var currentTime = recalculateCurrentTime();
    currentTime = computeExpirationForFiber(currentTime, inst);
    var update = createUpdate(currentTime);
    update.payload = payload;
    void 0 !== callback && null !== callback && (update.callback = callback);
    enqueueUpdate(inst, update, currentTime);
    scheduleWork(inst, currentTime);
  },
  enqueueReplaceState: function(inst, payload, callback) {
    inst = inst._reactInternalFiber;
    var currentTime = recalculateCurrentTime();
    currentTime = computeExpirationForFiber(currentTime, inst);
    var update = createUpdate(currentTime);
    update.tag = 1;
    update.payload = payload;
    void 0 !== callback && null !== callback && (update.callback = callback);
    enqueueUpdate(inst, update, currentTime);
    scheduleWork(inst, currentTime);
  },
  enqueueForceUpdate: function(inst, callback) {
    inst = inst._reactInternalFiber;
    var currentTime = recalculateCurrentTime();
    currentTime = computeExpirationForFiber(currentTime, inst);
    var update = createUpdate(currentTime);
    update.tag = 2;
    void 0 !== callback && null !== callback && (update.callback = callback);
    enqueueUpdate(inst, update, currentTime);
    scheduleWork(inst, currentTime);
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
  var instance = workInProgress.stateNode;
  workInProgress = workInProgress.type;
  return "function" === typeof instance.shouldComponentUpdate
    ? instance.shouldComponentUpdate(newProps, newState, newContext)
    : workInProgress.prototype && workInProgress.prototype.isPureReactComponent
      ? !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
      : !0;
}
function callComponentWillReceiveProps(
  workInProgress,
  instance,
  newProps,
  newContext
) {
  workInProgress = instance.state;
  "function" === typeof instance.componentWillReceiveProps &&
    instance.componentWillReceiveProps(newProps, newContext);
  "function" === typeof instance.UNSAFE_componentWillReceiveProps &&
    instance.UNSAFE_componentWillReceiveProps(newProps, newContext);
  instance.state !== workInProgress &&
    classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
}
function mountClassInstance(workInProgress, renderExpirationTime) {
  var ctor = workInProgress.type,
    instance = workInProgress.stateNode,
    props = workInProgress.pendingProps,
    unmaskedContext = getUnmaskedContext(workInProgress);
  instance.props = props;
  instance.state = workInProgress.memoizedState;
  instance.refs = emptyObject;
  instance.context = getMaskedContext(workInProgress, unmaskedContext);
  unmaskedContext = workInProgress.updateQueue;
  null !== unmaskedContext &&
    (processUpdateQueue(
      workInProgress,
      unmaskedContext,
      props,
      instance,
      renderExpirationTime
    ),
    (instance.state = workInProgress.memoizedState));
  unmaskedContext = workInProgress.type.getDerivedStateFromProps;
  "function" === typeof unmaskedContext &&
    (applyDerivedStateFromProps(workInProgress, unmaskedContext, props),
    (instance.state = workInProgress.memoizedState));
  "function" === typeof ctor.getDerivedStateFromProps ||
    "function" === typeof instance.getSnapshotBeforeUpdate ||
    ("function" !== typeof instance.UNSAFE_componentWillMount &&
      "function" !== typeof instance.componentWillMount) ||
    ((ctor = instance.state),
    "function" === typeof instance.componentWillMount &&
      instance.componentWillMount(),
    "function" === typeof instance.UNSAFE_componentWillMount &&
      instance.UNSAFE_componentWillMount(),
    ctor !== instance.state &&
      classComponentUpdater.enqueueReplaceState(instance, instance.state, null),
    (unmaskedContext = workInProgress.updateQueue),
    null !== unmaskedContext &&
      (processUpdateQueue(
        workInProgress,
        unmaskedContext,
        props,
        instance,
        renderExpirationTime
      ),
      (instance.state = workInProgress.memoizedState)));
  "function" === typeof instance.componentDidMount &&
    (workInProgress.effectTag |= 4);
}
var isArray$1 = Array.isArray;
function coerceRef(returnFiber, current, element) {
  returnFiber = element.ref;
  if (
    null !== returnFiber &&
    "function" !== typeof returnFiber &&
    "object" !== typeof returnFiber
  ) {
    if (element._owner) {
      element = element._owner;
      var inst = void 0;
      element &&
        (invariant(
          2 === element.tag,
          "Stateless function components cannot have refs."
        ),
        (inst = element.stateNode));
      invariant(
        inst,
        "Missing owner for string ref %s. This error is likely caused by a bug in React. Please file an issue.",
        returnFiber
      );
      var stringRef = "" + returnFiber;
      if (
        null !== current &&
        null !== current.ref &&
        "function" === typeof current.ref &&
        current.ref._stringRef === stringRef
      )
        return current.ref;
      current = function(value) {
        var refs = inst.refs === emptyObject ? (inst.refs = {}) : inst.refs;
        null === value ? delete refs[stringRef] : (refs[stringRef] = value);
      };
      current._stringRef = stringRef;
      return current;
    }
    invariant(
      "string" === typeof returnFiber,
      "Expected ref to be a function or a string."
    );
    invariant(
      element._owner,
      "Element ref was specified as a string (%s) but no owner was set. This could happen for one of the following reasons:\n1. You may be adding a ref to a functional component\n2. You may be adding a ref to a component that was not created inside a component's render method\n3. You have multiple copies of React loaded\nSee https://fb.me/react-refs-must-have-owner for more information.",
      returnFiber
    );
  }
  return returnFiber;
}
function throwOnInvalidObjectType(returnFiber, newChild) {
  "textarea" !== returnFiber.type &&
    invariant(
      !1,
      "Objects are not valid as a React child (found: %s).%s",
      "[object Object]" === Object.prototype.toString.call(newChild)
        ? "object with keys {" + Object.keys(newChild).join(", ") + "}"
        : newChild,
      ""
    );
}
function ChildReconciler(shouldTrackSideEffects) {
  function deleteChild(returnFiber, childToDelete) {
    if (shouldTrackSideEffects) {
      var last = returnFiber.lastEffect;
      null !== last
        ? ((last.nextEffect = childToDelete),
          (returnFiber.lastEffect = childToDelete))
        : (returnFiber.firstEffect = returnFiber.lastEffect = childToDelete);
      childToDelete.nextEffect = null;
      childToDelete.effectTag = 8;
    }
  }
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) return null;
    for (; null !== currentFirstChild; )
      deleteChild(returnFiber, currentFirstChild),
        (currentFirstChild = currentFirstChild.sibling);
    return null;
  }
  function mapRemainingChildren(returnFiber, currentFirstChild) {
    for (returnFiber = new Map(); null !== currentFirstChild; )
      null !== currentFirstChild.key
        ? returnFiber.set(currentFirstChild.key, currentFirstChild)
        : returnFiber.set(currentFirstChild.index, currentFirstChild),
        (currentFirstChild = currentFirstChild.sibling);
    return returnFiber;
  }
  function useFiber(fiber, pendingProps, expirationTime) {
    fiber = createWorkInProgress(fiber, pendingProps, expirationTime);
    fiber.index = 0;
    fiber.sibling = null;
    return fiber;
  }
  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects) return lastPlacedIndex;
    newIndex = newFiber.alternate;
    if (null !== newIndex)
      return (
        (newIndex = newIndex.index),
        newIndex < lastPlacedIndex
          ? ((newFiber.effectTag = 2), lastPlacedIndex)
          : newIndex
      );
    newFiber.effectTag = 2;
    return lastPlacedIndex;
  }
  function placeSingleChild(newFiber) {
    shouldTrackSideEffects &&
      null === newFiber.alternate &&
      (newFiber.effectTag = 2);
    return newFiber;
  }
  function updateTextNode(returnFiber, current, textContent, expirationTime) {
    if (null === current || 6 !== current.tag)
      return (
        (current = createFiberFromText(
          textContent,
          returnFiber.mode,
          expirationTime
        )),
        (current.return = returnFiber),
        current
      );
    current = useFiber(current, textContent, expirationTime);
    current.return = returnFiber;
    return current;
  }
  function updateElement(returnFiber, current, element, expirationTime) {
    if (null !== current && current.type === element.type)
      return (
        (expirationTime = useFiber(current, element.props, expirationTime)),
        (expirationTime.ref = coerceRef(returnFiber, current, element)),
        (expirationTime.return = returnFiber),
        expirationTime
      );
    expirationTime = createFiberFromElement(
      element,
      returnFiber.mode,
      expirationTime
    );
    expirationTime.ref = coerceRef(returnFiber, current, element);
    expirationTime.return = returnFiber;
    return expirationTime;
  }
  function updatePortal(returnFiber, current, portal, expirationTime) {
    if (
      null === current ||
      4 !== current.tag ||
      current.stateNode.containerInfo !== portal.containerInfo ||
      current.stateNode.implementation !== portal.implementation
    )
      return (
        (current = createFiberFromPortal(
          portal,
          returnFiber.mode,
          expirationTime
        )),
        (current.return = returnFiber),
        current
      );
    current = useFiber(current, portal.children || [], expirationTime);
    current.return = returnFiber;
    return current;
  }
  function updateFragment(returnFiber, current, fragment, expirationTime, key) {
    if (null === current || 10 !== current.tag)
      return (
        (current = createFiberFromFragment(
          fragment,
          returnFiber.mode,
          expirationTime,
          key
        )),
        (current.return = returnFiber),
        current
      );
    current = useFiber(current, fragment, expirationTime);
    current.return = returnFiber;
    return current;
  }
  function createChild(returnFiber, newChild, expirationTime) {
    if ("string" === typeof newChild || "number" === typeof newChild)
      return (
        (newChild = createFiberFromText(
          "" + newChild,
          returnFiber.mode,
          expirationTime
        )),
        (newChild.return = returnFiber),
        newChild
      );
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return (
            (expirationTime = createFiberFromElement(
              newChild,
              returnFiber.mode,
              expirationTime
            )),
            (expirationTime.ref = coerceRef(returnFiber, null, newChild)),
            (expirationTime.return = returnFiber),
            expirationTime
          );
        case REACT_PORTAL_TYPE:
          return (
            (newChild = createFiberFromPortal(
              newChild,
              returnFiber.mode,
              expirationTime
            )),
            (newChild.return = returnFiber),
            newChild
          );
      }
      if (isArray$1(newChild) || getIteratorFn(newChild))
        return (
          (newChild = createFiberFromFragment(
            newChild,
            returnFiber.mode,
            expirationTime,
            null
          )),
          (newChild.return = returnFiber),
          newChild
        );
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    return null;
  }
  function updateSlot(returnFiber, oldFiber, newChild, expirationTime) {
    var key = null !== oldFiber ? oldFiber.key : null;
    if ("string" === typeof newChild || "number" === typeof newChild)
      return null !== key
        ? null
        : updateTextNode(returnFiber, oldFiber, "" + newChild, expirationTime);
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return newChild.key === key
            ? newChild.type === REACT_FRAGMENT_TYPE
              ? updateFragment(
                  returnFiber,
                  oldFiber,
                  newChild.props.children,
                  expirationTime,
                  key
                )
              : updateElement(returnFiber, oldFiber, newChild, expirationTime)
            : null;
        case REACT_PORTAL_TYPE:
          return newChild.key === key
            ? updatePortal(returnFiber, oldFiber, newChild, expirationTime)
            : null;
      }
      if (isArray$1(newChild) || getIteratorFn(newChild))
        return null !== key
          ? null
          : updateFragment(
              returnFiber,
              oldFiber,
              newChild,
              expirationTime,
              null
            );
      throwOnInvalidObjectType(returnFiber, newChild);
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
    if ("string" === typeof newChild || "number" === typeof newChild)
      return (
        (existingChildren = existingChildren.get(newIdx) || null),
        updateTextNode(
          returnFiber,
          existingChildren,
          "" + newChild,
          expirationTime
        )
      );
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return (
            (existingChildren =
              existingChildren.get(
                null === newChild.key ? newIdx : newChild.key
              ) || null),
            newChild.type === REACT_FRAGMENT_TYPE
              ? updateFragment(
                  returnFiber,
                  existingChildren,
                  newChild.props.children,
                  expirationTime,
                  newChild.key
                )
              : updateElement(
                  returnFiber,
                  existingChildren,
                  newChild,
                  expirationTime
                )
          );
        case REACT_PORTAL_TYPE:
          return (
            (existingChildren =
              existingChildren.get(
                null === newChild.key ? newIdx : newChild.key
              ) || null),
            updatePortal(
              returnFiber,
              existingChildren,
              newChild,
              expirationTime
            )
          );
      }
      if (isArray$1(newChild) || getIteratorFn(newChild))
        return (
          (existingChildren = existingChildren.get(newIdx) || null),
          updateFragment(
            returnFiber,
            existingChildren,
            newChild,
            expirationTime,
            null
          )
        );
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    return null;
  }
  function reconcileChildrenArray(
    returnFiber,
    currentFirstChild,
    newChildren,
    expirationTime
  ) {
    for (
      var resultingFirstChild = null,
        previousNewFiber = null,
        oldFiber = currentFirstChild,
        newIdx = (currentFirstChild = 0),
        nextOldFiber = null;
      null !== oldFiber && newIdx < newChildren.length;
      newIdx++
    ) {
      oldFiber.index > newIdx
        ? ((nextOldFiber = oldFiber), (oldFiber = null))
        : (nextOldFiber = oldFiber.sibling);
      var newFiber = updateSlot(
        returnFiber,
        oldFiber,
        newChildren[newIdx],
        expirationTime
      );
      if (null === newFiber) {
        null === oldFiber && (oldFiber = nextOldFiber);
        break;
      }
      shouldTrackSideEffects &&
        oldFiber &&
        null === newFiber.alternate &&
        deleteChild(returnFiber, oldFiber);
      currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
      null === previousNewFiber
        ? (resultingFirstChild = newFiber)
        : (previousNewFiber.sibling = newFiber);
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }
    if (newIdx === newChildren.length)
      return (
        deleteRemainingChildren(returnFiber, oldFiber), resultingFirstChild
      );
    if (null === oldFiber) {
      for (; newIdx < newChildren.length; newIdx++)
        if (
          (oldFiber = createChild(
            returnFiber,
            newChildren[newIdx],
            expirationTime
          ))
        )
          (currentFirstChild = placeChild(oldFiber, currentFirstChild, newIdx)),
            null === previousNewFiber
              ? (resultingFirstChild = oldFiber)
              : (previousNewFiber.sibling = oldFiber),
            (previousNewFiber = oldFiber);
      return resultingFirstChild;
    }
    for (
      oldFiber = mapRemainingChildren(returnFiber, oldFiber);
      newIdx < newChildren.length;
      newIdx++
    )
      if (
        (nextOldFiber = updateFromMap(
          oldFiber,
          returnFiber,
          newIdx,
          newChildren[newIdx],
          expirationTime
        ))
      )
        shouldTrackSideEffects &&
          null !== nextOldFiber.alternate &&
          oldFiber.delete(
            null === nextOldFiber.key ? newIdx : nextOldFiber.key
          ),
          (currentFirstChild = placeChild(
            nextOldFiber,
            currentFirstChild,
            newIdx
          )),
          null === previousNewFiber
            ? (resultingFirstChild = nextOldFiber)
            : (previousNewFiber.sibling = nextOldFiber),
          (previousNewFiber = nextOldFiber);
    shouldTrackSideEffects &&
      oldFiber.forEach(function(child) {
        return deleteChild(returnFiber, child);
      });
    return resultingFirstChild;
  }
  function reconcileChildrenIterator(
    returnFiber,
    currentFirstChild,
    newChildrenIterable,
    expirationTime
  ) {
    var iteratorFn = getIteratorFn(newChildrenIterable);
    invariant(
      "function" === typeof iteratorFn,
      "An object is not an iterable. This error is likely caused by a bug in React. Please file an issue."
    );
    newChildrenIterable = iteratorFn.call(newChildrenIterable);
    invariant(
      null != newChildrenIterable,
      "An iterable object provided no iterator."
    );
    for (
      var previousNewFiber = (iteratorFn = null),
        oldFiber = currentFirstChild,
        newIdx = (currentFirstChild = 0),
        nextOldFiber = null,
        step = newChildrenIterable.next();
      null !== oldFiber && !step.done;
      newIdx++, step = newChildrenIterable.next()
    ) {
      oldFiber.index > newIdx
        ? ((nextOldFiber = oldFiber), (oldFiber = null))
        : (nextOldFiber = oldFiber.sibling);
      var newFiber = updateSlot(
        returnFiber,
        oldFiber,
        step.value,
        expirationTime
      );
      if (null === newFiber) {
        oldFiber || (oldFiber = nextOldFiber);
        break;
      }
      shouldTrackSideEffects &&
        oldFiber &&
        null === newFiber.alternate &&
        deleteChild(returnFiber, oldFiber);
      currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
      null === previousNewFiber
        ? (iteratorFn = newFiber)
        : (previousNewFiber.sibling = newFiber);
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }
    if (step.done)
      return deleteRemainingChildren(returnFiber, oldFiber), iteratorFn;
    if (null === oldFiber) {
      for (; !step.done; newIdx++, step = newChildrenIterable.next())
        (step = createChild(returnFiber, step.value, expirationTime)),
          null !== step &&
            ((currentFirstChild = placeChild(step, currentFirstChild, newIdx)),
            null === previousNewFiber
              ? (iteratorFn = step)
              : (previousNewFiber.sibling = step),
            (previousNewFiber = step));
      return iteratorFn;
    }
    for (
      oldFiber = mapRemainingChildren(returnFiber, oldFiber);
      !step.done;
      newIdx++, step = newChildrenIterable.next()
    )
      (step = updateFromMap(
        oldFiber,
        returnFiber,
        newIdx,
        step.value,
        expirationTime
      )),
        null !== step &&
          (shouldTrackSideEffects &&
            null !== step.alternate &&
            oldFiber.delete(null === step.key ? newIdx : step.key),
          (currentFirstChild = placeChild(step, currentFirstChild, newIdx)),
          null === previousNewFiber
            ? (iteratorFn = step)
            : (previousNewFiber.sibling = step),
          (previousNewFiber = step));
    shouldTrackSideEffects &&
      oldFiber.forEach(function(child) {
        return deleteChild(returnFiber, child);
      });
    return iteratorFn;
  }
  return function(returnFiber, currentFirstChild, newChild, expirationTime) {
    var isUnkeyedTopLevelFragment =
      "object" === typeof newChild &&
      null !== newChild &&
      newChild.type === REACT_FRAGMENT_TYPE &&
      null === newChild.key;
    isUnkeyedTopLevelFragment && (newChild = newChild.props.children);
    var isObject = "object" === typeof newChild && null !== newChild;
    if (isObject)
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          a: {
            isObject = newChild.key;
            for (
              isUnkeyedTopLevelFragment = currentFirstChild;
              null !== isUnkeyedTopLevelFragment;

            ) {
              if (isUnkeyedTopLevelFragment.key === isObject)
                if (
                  10 === isUnkeyedTopLevelFragment.tag
                    ? newChild.type === REACT_FRAGMENT_TYPE
                    : isUnkeyedTopLevelFragment.type === newChild.type
                ) {
                  deleteRemainingChildren(
                    returnFiber,
                    isUnkeyedTopLevelFragment.sibling
                  );
                  currentFirstChild = useFiber(
                    isUnkeyedTopLevelFragment,
                    newChild.type === REACT_FRAGMENT_TYPE
                      ? newChild.props.children
                      : newChild.props,
                    expirationTime
                  );
                  currentFirstChild.ref = coerceRef(
                    returnFiber,
                    isUnkeyedTopLevelFragment,
                    newChild
                  );
                  currentFirstChild.return = returnFiber;
                  returnFiber = currentFirstChild;
                  break a;
                } else {
                  deleteRemainingChildren(
                    returnFiber,
                    isUnkeyedTopLevelFragment
                  );
                  break;
                }
              else deleteChild(returnFiber, isUnkeyedTopLevelFragment);
              isUnkeyedTopLevelFragment = isUnkeyedTopLevelFragment.sibling;
            }
            newChild.type === REACT_FRAGMENT_TYPE
              ? ((currentFirstChild = createFiberFromFragment(
                  newChild.props.children,
                  returnFiber.mode,
                  expirationTime,
                  newChild.key
                )),
                (currentFirstChild.return = returnFiber),
                (returnFiber = currentFirstChild))
              : ((expirationTime = createFiberFromElement(
                  newChild,
                  returnFiber.mode,
                  expirationTime
                )),
                (expirationTime.ref = coerceRef(
                  returnFiber,
                  currentFirstChild,
                  newChild
                )),
                (expirationTime.return = returnFiber),
                (returnFiber = expirationTime));
          }
          return placeSingleChild(returnFiber);
        case REACT_PORTAL_TYPE:
          a: {
            for (
              isUnkeyedTopLevelFragment = newChild.key;
              null !== currentFirstChild;

            ) {
              if (currentFirstChild.key === isUnkeyedTopLevelFragment)
                if (
                  4 === currentFirstChild.tag &&
                  currentFirstChild.stateNode.containerInfo ===
                    newChild.containerInfo &&
                  currentFirstChild.stateNode.implementation ===
                    newChild.implementation
                ) {
                  deleteRemainingChildren(
                    returnFiber,
                    currentFirstChild.sibling
                  );
                  currentFirstChild = useFiber(
                    currentFirstChild,
                    newChild.children || [],
                    expirationTime
                  );
                  currentFirstChild.return = returnFiber;
                  returnFiber = currentFirstChild;
                  break a;
                } else {
                  deleteRemainingChildren(returnFiber, currentFirstChild);
                  break;
                }
              else deleteChild(returnFiber, currentFirstChild);
              currentFirstChild = currentFirstChild.sibling;
            }
            currentFirstChild = createFiberFromPortal(
              newChild,
              returnFiber.mode,
              expirationTime
            );
            currentFirstChild.return = returnFiber;
            returnFiber = currentFirstChild;
          }
          return placeSingleChild(returnFiber);
      }
    if ("string" === typeof newChild || "number" === typeof newChild)
      return (
        (newChild = "" + newChild),
        null !== currentFirstChild && 6 === currentFirstChild.tag
          ? (deleteRemainingChildren(returnFiber, currentFirstChild.sibling),
            (currentFirstChild = useFiber(
              currentFirstChild,
              newChild,
              expirationTime
            )),
            (currentFirstChild.return = returnFiber),
            (returnFiber = currentFirstChild))
          : (deleteRemainingChildren(returnFiber, currentFirstChild),
            (currentFirstChild = createFiberFromText(
              newChild,
              returnFiber.mode,
              expirationTime
            )),
            (currentFirstChild.return = returnFiber),
            (returnFiber = currentFirstChild)),
        placeSingleChild(returnFiber)
      );
    if (isArray$1(newChild))
      return reconcileChildrenArray(
        returnFiber,
        currentFirstChild,
        newChild,
        expirationTime
      );
    if (getIteratorFn(newChild))
      return reconcileChildrenIterator(
        returnFiber,
        currentFirstChild,
        newChild,
        expirationTime
      );
    isObject && throwOnInvalidObjectType(returnFiber, newChild);
    if ("undefined" === typeof newChild && !isUnkeyedTopLevelFragment)
      switch (returnFiber.tag) {
        case 2:
        case 1:
          (expirationTime = returnFiber.type),
            invariant(
              !1,
              "%s(...): Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null.",
              expirationTime.displayName || expirationTime.name || "Component"
            );
      }
    return deleteRemainingChildren(returnFiber, currentFirstChild);
  };
}
var reconcileChildFibers = ChildReconciler(!0),
  mountChildFibers = ChildReconciler(!1),
  hydrationParentFiber = null,
  nextHydratableInstance = null,
  isHydrating = !1;
function tryHydrate(fiber, nextInstance) {
  switch (fiber.tag) {
    case 5:
      return (
        (nextInstance = shim$1(nextInstance, fiber.type, fiber.pendingProps)),
        null !== nextInstance ? ((fiber.stateNode = nextInstance), !0) : !1
      );
    case 6:
      return (
        (nextInstance = shim$1(nextInstance, fiber.pendingProps)),
        null !== nextInstance ? ((fiber.stateNode = nextInstance), !0) : !1
      );
    default:
      return !1;
  }
}
function tryToClaimNextHydratableInstance(fiber$jscomp$0) {
  if (isHydrating) {
    var nextInstance = nextHydratableInstance;
    if (nextInstance) {
      var firstAttemptedInstance = nextInstance;
      if (!tryHydrate(fiber$jscomp$0, nextInstance)) {
        nextInstance = shim$1(firstAttemptedInstance);
        if (!nextInstance || !tryHydrate(fiber$jscomp$0, nextInstance)) {
          fiber$jscomp$0.effectTag |= 2;
          isHydrating = !1;
          hydrationParentFiber = fiber$jscomp$0;
          return;
        }
        var returnFiber = hydrationParentFiber,
          fiber = new FiberNode(5, null, null, 0);
        fiber.type = "DELETED";
        fiber.stateNode = firstAttemptedInstance;
        fiber.return = returnFiber;
        fiber.effectTag = 8;
        null !== returnFiber.lastEffect
          ? ((returnFiber.lastEffect.nextEffect = fiber),
            (returnFiber.lastEffect = fiber))
          : (returnFiber.firstEffect = returnFiber.lastEffect = fiber);
      }
      hydrationParentFiber = fiber$jscomp$0;
      nextHydratableInstance = shim$1(nextInstance);
    } else
      (fiber$jscomp$0.effectTag |= 2),
        (isHydrating = !1),
        (hydrationParentFiber = fiber$jscomp$0);
  }
}
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
  workInProgress.child =
    null === current
      ? mountChildFibers(
          workInProgress,
          null,
          nextChildren,
          renderExpirationTime
        )
      : reconcileChildFibers(
          workInProgress,
          current.child,
          nextChildren,
          renderExpirationTime
        );
}
function markRef(current, workInProgress) {
  var ref = workInProgress.ref;
  if (
    (null === current && null !== ref) ||
    (null !== current && current.ref !== ref)
  )
    workInProgress.effectTag |= 128;
}
function finishClassComponent(
  current,
  workInProgress,
  shouldUpdate,
  hasContext,
  renderExpirationTime
) {
  markRef(current, workInProgress);
  var didCaptureError = 0 !== (workInProgress.effectTag & 64);
  if (!shouldUpdate && !didCaptureError)
    return (
      hasContext && invalidateContextProvider(workInProgress, !1),
      bailoutOnAlreadyFinishedWork(current, workInProgress)
    );
  shouldUpdate = workInProgress.stateNode;
  ReactCurrentOwner.current = workInProgress;
  if (didCaptureError) {
    var nextChildren = null;
    baseStartTime = -1;
  } else nextChildren = shouldUpdate.render();
  workInProgress.effectTag |= 1;
  didCaptureError &&
    (reconcileChildrenAtExpirationTime(
      current,
      workInProgress,
      null,
      renderExpirationTime
    ),
    (workInProgress.child = null));
  reconcileChildrenAtExpirationTime(
    current,
    workInProgress,
    nextChildren,
    renderExpirationTime
  );
  workInProgress.memoizedState = shouldUpdate.state;
  workInProgress.memoizedProps = shouldUpdate.props;
  hasContext && invalidateContextProvider(workInProgress, !0);
  return workInProgress.child;
}
function pushHostRootContext(workInProgress) {
  var root = workInProgress.stateNode;
  root.pendingContext
    ? pushTopLevelContextObject(
        workInProgress,
        root.pendingContext,
        root.pendingContext !== root.context
      )
    : root.context &&
      pushTopLevelContextObject(workInProgress, root.context, !1);
  pushHostContainer(workInProgress, root.containerInfo);
}
function propagateContextChange(
  workInProgress,
  context,
  changedBits,
  renderExpirationTime
) {
  var fiber = workInProgress.child;
  null !== fiber && (fiber.return = workInProgress);
  for (; null !== fiber; ) {
    switch (fiber.tag) {
      case 12:
        var nextFiber = fiber.stateNode | 0;
        if (fiber.type === context && 0 !== (nextFiber & changedBits)) {
          for (nextFiber = fiber; null !== nextFiber; ) {
            var alternate = nextFiber.alternate;
            if (
              0 === nextFiber.expirationTime ||
              nextFiber.expirationTime > renderExpirationTime
            )
              (nextFiber.expirationTime = renderExpirationTime),
                null !== alternate &&
                  (0 === alternate.expirationTime ||
                    alternate.expirationTime > renderExpirationTime) &&
                  (alternate.expirationTime = renderExpirationTime);
            else if (
              null !== alternate &&
              (0 === alternate.expirationTime ||
                alternate.expirationTime > renderExpirationTime)
            )
              alternate.expirationTime = renderExpirationTime;
            else break;
            nextFiber = nextFiber.return;
          }
          nextFiber = null;
        } else nextFiber = fiber.child;
        break;
      case 13:
        nextFiber = fiber.type === workInProgress.type ? null : fiber.child;
        break;
      default:
        nextFiber = fiber.child;
    }
    if (null !== nextFiber) nextFiber.return = fiber;
    else
      for (nextFiber = fiber; null !== nextFiber; ) {
        if (nextFiber === workInProgress) {
          nextFiber = null;
          break;
        }
        fiber = nextFiber.sibling;
        if (null !== fiber) {
          fiber.return = nextFiber.return;
          nextFiber = fiber;
          break;
        }
        nextFiber = nextFiber.return;
      }
    fiber = nextFiber;
  }
}
function updateContextProvider(current, workInProgress, renderExpirationTime) {
  var context = workInProgress.type._context,
    newProps = workInProgress.pendingProps,
    oldProps = workInProgress.memoizedProps,
    canBailOnProps = !0;
  if (didPerformWorkStackCursor.current) canBailOnProps = !1;
  else if (oldProps === newProps)
    return (
      (workInProgress.stateNode = 0),
      pushProvider(workInProgress),
      bailoutOnAlreadyFinishedWork(current, workInProgress)
    );
  var newValue = newProps.value;
  workInProgress.memoizedProps = newProps;
  if (null === oldProps) newValue = 1073741823;
  else if (oldProps.value === newProps.value) {
    if (oldProps.children === newProps.children && canBailOnProps)
      return (
        (workInProgress.stateNode = 0),
        pushProvider(workInProgress),
        bailoutOnAlreadyFinishedWork(current, workInProgress)
      );
    newValue = 0;
  } else {
    var oldValue = oldProps.value;
    if (
      (oldValue === newValue &&
        (0 !== oldValue || 1 / oldValue === 1 / newValue)) ||
      (oldValue !== oldValue && newValue !== newValue)
    ) {
      if (oldProps.children === newProps.children && canBailOnProps)
        return (
          (workInProgress.stateNode = 0),
          pushProvider(workInProgress),
          bailoutOnAlreadyFinishedWork(current, workInProgress)
        );
      newValue = 0;
    } else if (
      ((newValue =
        "function" === typeof context._calculateChangedBits
          ? context._calculateChangedBits(oldValue, newValue)
          : 1073741823),
      (newValue |= 0),
      0 === newValue)
    ) {
      if (oldProps.children === newProps.children && canBailOnProps)
        return (
          (workInProgress.stateNode = 0),
          pushProvider(workInProgress),
          bailoutOnAlreadyFinishedWork(current, workInProgress)
        );
    } else
      propagateContextChange(
        workInProgress,
        context,
        newValue,
        renderExpirationTime
      );
  }
  workInProgress.stateNode = newValue;
  pushProvider(workInProgress);
  reconcileChildren(current, workInProgress, newProps.children);
  return workInProgress.child;
}
function bailoutOnAlreadyFinishedWork(current, workInProgress) {
  baseStartTime = -1;
  invariant(
    null === current || workInProgress.child === current.child,
    "Resuming work not yet implemented."
  );
  if (null !== workInProgress.child) {
    current = workInProgress.child;
    var newChild = createWorkInProgress(
      current,
      current.pendingProps,
      current.expirationTime
    );
    workInProgress.child = newChild;
    for (newChild.return = workInProgress; null !== current.sibling; )
      (current = current.sibling),
        (newChild = newChild.sibling = createWorkInProgress(
          current,
          current.pendingProps,
          current.expirationTime
        )),
        (newChild.return = workInProgress);
    newChild.sibling = null;
  }
  return workInProgress.child;
}
function beginWork(current, workInProgress, renderExpirationTime) {
  workInProgress.mode & 4 &&
    ((workInProgress.actualDuration =
      now$1() - workInProgress.actualDuration - totalElapsedPauseTime),
    (workInProgress.actualStartTime = now$1()));
  if (
    0 === workInProgress.expirationTime ||
    workInProgress.expirationTime > renderExpirationTime
  ) {
    baseStartTime = -1;
    switch (workInProgress.tag) {
      case 3:
        pushHostRootContext(workInProgress);
        break;
      case 2:
        pushContextProvider(workInProgress);
        break;
      case 4:
        pushHostContainer(
          workInProgress,
          workInProgress.stateNode.containerInfo
        );
        break;
      case 13:
        pushProvider(workInProgress);
    }
    return null;
  }
  switch (workInProgress.tag) {
    case 0:
      invariant(
        null === current,
        "An indeterminate component should never have mounted. This error is likely caused by a bug in React. Please file an issue."
      );
      var fn = workInProgress.type,
        props = workInProgress.pendingProps,
        unmaskedContext = getUnmaskedContext(workInProgress);
      unmaskedContext = getMaskedContext(workInProgress, unmaskedContext);
      fn = fn(props, unmaskedContext);
      workInProgress.effectTag |= 1;
      "object" === typeof fn &&
      null !== fn &&
      "function" === typeof fn.render &&
      void 0 === fn.$$typeof
        ? ((unmaskedContext = workInProgress.type),
          (workInProgress.tag = 2),
          (workInProgress.memoizedState =
            null !== fn.state && void 0 !== fn.state ? fn.state : null),
          (unmaskedContext = unmaskedContext.getDerivedStateFromProps),
          "function" === typeof unmaskedContext &&
            applyDerivedStateFromProps(workInProgress, unmaskedContext, props),
          (props = pushContextProvider(workInProgress)),
          (fn.updater = classComponentUpdater),
          (workInProgress.stateNode = fn),
          (fn._reactInternalFiber = workInProgress),
          mountClassInstance(workInProgress, renderExpirationTime),
          (current = finishClassComponent(
            current,
            workInProgress,
            !0,
            props,
            renderExpirationTime
          )))
        : ((workInProgress.tag = 1),
          reconcileChildren(current, workInProgress, fn),
          (workInProgress.memoizedProps = props),
          (current = workInProgress.child));
      return current;
    case 1:
      return (
        (props = workInProgress.type),
        (renderExpirationTime = workInProgress.pendingProps),
        didPerformWorkStackCursor.current ||
        workInProgress.memoizedProps !== renderExpirationTime
          ? ((fn = getUnmaskedContext(workInProgress)),
            (fn = getMaskedContext(workInProgress, fn)),
            (props = props(renderExpirationTime, fn)),
            (workInProgress.effectTag |= 1),
            reconcileChildren(current, workInProgress, props),
            (workInProgress.memoizedProps = renderExpirationTime),
            (current = workInProgress.child))
          : (current = bailoutOnAlreadyFinishedWork(current, workInProgress)),
        current
      );
    case 2:
      props = pushContextProvider(workInProgress);
      if (null === current)
        if (null === workInProgress.stateNode) {
          var props$jscomp$0 = workInProgress.pendingProps,
            ctor = workInProgress.type;
          fn = getUnmaskedContext(workInProgress);
          var needsContext =
            2 === workInProgress.tag &&
            null != workInProgress.type.contextTypes;
          unmaskedContext = needsContext
            ? getMaskedContext(workInProgress, fn)
            : emptyObject;
          props$jscomp$0 = new ctor(props$jscomp$0, unmaskedContext);
          workInProgress.memoizedState =
            null !== props$jscomp$0.state && void 0 !== props$jscomp$0.state
              ? props$jscomp$0.state
              : null;
          props$jscomp$0.updater = classComponentUpdater;
          workInProgress.stateNode = props$jscomp$0;
          props$jscomp$0._reactInternalFiber = workInProgress;
          needsContext &&
            ((needsContext = workInProgress.stateNode),
            (needsContext.__reactInternalMemoizedUnmaskedChildContext = fn),
            (needsContext.__reactInternalMemoizedMaskedChildContext = unmaskedContext));
          mountClassInstance(workInProgress, renderExpirationTime);
          fn = !0;
        } else {
          ctor = workInProgress.type;
          fn = workInProgress.stateNode;
          needsContext = workInProgress.memoizedProps;
          unmaskedContext = workInProgress.pendingProps;
          fn.props = needsContext;
          var oldContext = fn.context;
          props$jscomp$0 = getUnmaskedContext(workInProgress);
          props$jscomp$0 = getMaskedContext(workInProgress, props$jscomp$0);
          var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
          (ctor =
            "function" === typeof getDerivedStateFromProps ||
            "function" === typeof fn.getSnapshotBeforeUpdate) ||
            ("function" !== typeof fn.UNSAFE_componentWillReceiveProps &&
              "function" !== typeof fn.componentWillReceiveProps) ||
            ((needsContext !== unmaskedContext ||
              oldContext !== props$jscomp$0) &&
              callComponentWillReceiveProps(
                workInProgress,
                fn,
                unmaskedContext,
                props$jscomp$0
              ));
          hasForceUpdate = !1;
          var oldState = workInProgress.memoizedState;
          oldContext = fn.state = oldState;
          var updateQueue = workInProgress.updateQueue;
          null !== updateQueue &&
            (processUpdateQueue(
              workInProgress,
              updateQueue,
              unmaskedContext,
              fn,
              renderExpirationTime
            ),
            (oldContext = workInProgress.memoizedState));
          needsContext !== unmaskedContext ||
          oldState !== oldContext ||
          didPerformWorkStackCursor.current ||
          hasForceUpdate
            ? ("function" === typeof getDerivedStateFromProps &&
                (applyDerivedStateFromProps(
                  workInProgress,
                  getDerivedStateFromProps,
                  unmaskedContext
                ),
                (oldContext = workInProgress.memoizedState)),
              (needsContext =
                hasForceUpdate ||
                checkShouldComponentUpdate(
                  workInProgress,
                  needsContext,
                  unmaskedContext,
                  oldState,
                  oldContext,
                  props$jscomp$0
                ))
                ? (ctor ||
                    ("function" !== typeof fn.UNSAFE_componentWillMount &&
                      "function" !== typeof fn.componentWillMount) ||
                    ("function" === typeof fn.componentWillMount &&
                      fn.componentWillMount(),
                    "function" === typeof fn.UNSAFE_componentWillMount &&
                      fn.UNSAFE_componentWillMount()),
                  "function" === typeof fn.componentDidMount &&
                    (workInProgress.effectTag |= 4))
                : ("function" === typeof fn.componentDidMount &&
                    (workInProgress.effectTag |= 4),
                  (workInProgress.memoizedProps = unmaskedContext),
                  (workInProgress.memoizedState = oldContext)),
              (fn.props = unmaskedContext),
              (fn.state = oldContext),
              (fn.context = props$jscomp$0),
              (fn = needsContext))
            : ("function" === typeof fn.componentDidMount &&
                (workInProgress.effectTag |= 4),
              (fn = !1));
        }
      else
        (ctor = workInProgress.type),
          (fn = workInProgress.stateNode),
          (unmaskedContext = workInProgress.memoizedProps),
          (needsContext = workInProgress.pendingProps),
          (fn.props = unmaskedContext),
          (oldContext = fn.context),
          (props$jscomp$0 = getUnmaskedContext(workInProgress)),
          (props$jscomp$0 = getMaskedContext(workInProgress, props$jscomp$0)),
          (getDerivedStateFromProps = ctor.getDerivedStateFromProps),
          (ctor =
            "function" === typeof getDerivedStateFromProps ||
            "function" === typeof fn.getSnapshotBeforeUpdate) ||
            ("function" !== typeof fn.UNSAFE_componentWillReceiveProps &&
              "function" !== typeof fn.componentWillReceiveProps) ||
            ((unmaskedContext !== needsContext ||
              oldContext !== props$jscomp$0) &&
              callComponentWillReceiveProps(
                workInProgress,
                fn,
                needsContext,
                props$jscomp$0
              )),
          (hasForceUpdate = !1),
          (oldContext = workInProgress.memoizedState),
          (oldState = fn.state = oldContext),
          (updateQueue = workInProgress.updateQueue),
          null !== updateQueue &&
            (processUpdateQueue(
              workInProgress,
              updateQueue,
              needsContext,
              fn,
              renderExpirationTime
            ),
            (oldState = workInProgress.memoizedState)),
          unmaskedContext !== needsContext ||
          oldContext !== oldState ||
          didPerformWorkStackCursor.current ||
          hasForceUpdate
            ? ("function" === typeof getDerivedStateFromProps &&
                (applyDerivedStateFromProps(
                  workInProgress,
                  getDerivedStateFromProps,
                  needsContext
                ),
                (oldState = workInProgress.memoizedState)),
              (getDerivedStateFromProps =
                hasForceUpdate ||
                checkShouldComponentUpdate(
                  workInProgress,
                  unmaskedContext,
                  needsContext,
                  oldContext,
                  oldState,
                  props$jscomp$0
                ))
                ? (ctor ||
                    ("function" !== typeof fn.UNSAFE_componentWillUpdate &&
                      "function" !== typeof fn.componentWillUpdate) ||
                    ("function" === typeof fn.componentWillUpdate &&
                      fn.componentWillUpdate(
                        needsContext,
                        oldState,
                        props$jscomp$0
                      ),
                    "function" === typeof fn.UNSAFE_componentWillUpdate &&
                      fn.UNSAFE_componentWillUpdate(
                        needsContext,
                        oldState,
                        props$jscomp$0
                      )),
                  "function" === typeof fn.componentDidUpdate &&
                    (workInProgress.effectTag |= 4),
                  "function" === typeof fn.getSnapshotBeforeUpdate &&
                    (workInProgress.effectTag |= 256))
                : ("function" !== typeof fn.componentDidUpdate ||
                    (unmaskedContext === current.memoizedProps &&
                      oldContext === current.memoizedState) ||
                    (workInProgress.effectTag |= 4),
                  "function" !== typeof fn.getSnapshotBeforeUpdate ||
                    (unmaskedContext === current.memoizedProps &&
                      oldContext === current.memoizedState) ||
                    (workInProgress.effectTag |= 256),
                  (workInProgress.memoizedProps = needsContext),
                  (workInProgress.memoizedState = oldState)),
              (fn.props = needsContext),
              (fn.state = oldState),
              (fn.context = props$jscomp$0),
              (fn = getDerivedStateFromProps))
            : ("function" !== typeof fn.componentDidUpdate ||
                (unmaskedContext === current.memoizedProps &&
                  oldContext === current.memoizedState) ||
                (workInProgress.effectTag |= 4),
              "function" !== typeof fn.getSnapshotBeforeUpdate ||
                (unmaskedContext === current.memoizedProps &&
                  oldContext === current.memoizedState) ||
                (workInProgress.effectTag |= 256),
              (fn = !1));
      return finishClassComponent(
        current,
        workInProgress,
        fn,
        props,
        renderExpirationTime
      );
    case 3:
      return (
        pushHostRootContext(workInProgress),
        (props = workInProgress.updateQueue),
        null !== props
          ? ((fn = workInProgress.memoizedState),
            (fn = null !== fn ? fn.element : null),
            processUpdateQueue(
              workInProgress,
              props,
              workInProgress.pendingProps,
              null,
              renderExpirationTime
            ),
            (renderExpirationTime = workInProgress.memoizedState.element),
            renderExpirationTime === fn
              ? (current = bailoutOnAlreadyFinishedWork(
                  current,
                  workInProgress
                ))
              : (reconcileChildren(
                  current,
                  workInProgress,
                  renderExpirationTime
                ),
                (current = workInProgress.child)))
          : (current = bailoutOnAlreadyFinishedWork(current, workInProgress)),
        current
      );
    case 5:
      return (
        requiredContext(rootInstanceStackCursor.current),
        (renderExpirationTime = requiredContext(contextStackCursor$1.current)),
        (props = workInProgress.type),
        (props =
          "AndroidTextInput" === props ||
          "RCTMultilineTextInputView" === props ||
          "RCTSinglelineTextInputView" === props ||
          "RCTText" === props ||
          "RCTVirtualText" === props),
        (props =
          renderExpirationTime.isInAParentText !== props
            ? { isInAParentText: props }
            : renderExpirationTime),
        renderExpirationTime !== props &&
          (push(contextFiberStackCursor, workInProgress, workInProgress),
          push(contextStackCursor$1, props, workInProgress)),
        null === current && tryToClaimNextHydratableInstance(workInProgress),
        (props = workInProgress.memoizedProps),
        (renderExpirationTime = workInProgress.pendingProps),
        didPerformWorkStackCursor.current || props !== renderExpirationTime
          ? ((props = renderExpirationTime.children),
            markRef(current, workInProgress),
            reconcileChildren(current, workInProgress, props),
            (workInProgress.memoizedProps = renderExpirationTime),
            (current = workInProgress.child))
          : (current = bailoutOnAlreadyFinishedWork(current, workInProgress)),
        current
      );
    case 6:
      return (
        null === current && tryToClaimNextHydratableInstance(workInProgress),
        (workInProgress.memoizedProps = workInProgress.pendingProps),
        null
      );
    case 16:
      return null;
    case 4:
      return (
        pushHostContainer(
          workInProgress,
          workInProgress.stateNode.containerInfo
        ),
        (props = workInProgress.pendingProps),
        didPerformWorkStackCursor.current ||
        workInProgress.memoizedProps !== props
          ? (null === current
              ? (workInProgress.child = reconcileChildFibers(
                  workInProgress,
                  null,
                  props,
                  renderExpirationTime
                ))
              : reconcileChildren(current, workInProgress, props),
            (workInProgress.memoizedProps = props),
            (current = workInProgress.child))
          : (current = bailoutOnAlreadyFinishedWork(current, workInProgress)),
        current
      );
    case 14:
      return (
        (props = workInProgress.type.render),
        (renderExpirationTime = workInProgress.pendingProps),
        (fn = workInProgress.ref),
        didPerformWorkStackCursor.current ||
        workInProgress.memoizedProps !== renderExpirationTime ||
        fn !== (null !== current ? current.ref : null)
          ? ((props = props(renderExpirationTime, fn)),
            reconcileChildren(current, workInProgress, props),
            (workInProgress.memoizedProps = renderExpirationTime),
            (current = workInProgress.child))
          : (current = bailoutOnAlreadyFinishedWork(current, workInProgress)),
        current
      );
    case 10:
      return (
        (renderExpirationTime = workInProgress.pendingProps),
        didPerformWorkStackCursor.current ||
        workInProgress.memoizedProps !== renderExpirationTime
          ? (reconcileChildren(current, workInProgress, renderExpirationTime),
            (workInProgress.memoizedProps = renderExpirationTime),
            (current = workInProgress.child))
          : (current = bailoutOnAlreadyFinishedWork(current, workInProgress)),
        current
      );
    case 11:
      return (
        (renderExpirationTime = workInProgress.pendingProps.children),
        didPerformWorkStackCursor.current ||
        (null !== renderExpirationTime &&
          workInProgress.memoizedProps !== renderExpirationTime)
          ? (reconcileChildren(current, workInProgress, renderExpirationTime),
            (workInProgress.memoizedProps = renderExpirationTime),
            (current = workInProgress.child))
          : (current = bailoutOnAlreadyFinishedWork(current, workInProgress)),
        current
      );
    case 15:
      return (
        (renderExpirationTime = workInProgress.pendingProps),
        (workInProgress.effectTag |= 4),
        workInProgress.memoizedProps === renderExpirationTime
          ? (current = bailoutOnAlreadyFinishedWork(current, workInProgress))
          : (reconcileChildren(
              current,
              workInProgress,
              renderExpirationTime.children
            ),
            (workInProgress.memoizedProps = renderExpirationTime),
            (current = workInProgress.child)),
        current
      );
    case 13:
      return updateContextProvider(
        current,
        workInProgress,
        renderExpirationTime
      );
    case 12:
      a: if (
        ((fn = workInProgress.type),
        (unmaskedContext = workInProgress.pendingProps),
        (needsContext = workInProgress.memoizedProps),
        (props = fn._currentValue),
        (props$jscomp$0 = fn._changedBits),
        didPerformWorkStackCursor.current ||
          0 !== props$jscomp$0 ||
          needsContext !== unmaskedContext)
      ) {
        workInProgress.memoizedProps = unmaskedContext;
        ctor = unmaskedContext.unstable_observedBits;
        if (void 0 === ctor || null === ctor) ctor = 1073741823;
        workInProgress.stateNode = ctor;
        if (0 !== (props$jscomp$0 & ctor))
          propagateContextChange(
            workInProgress,
            fn,
            props$jscomp$0,
            renderExpirationTime
          );
        else if (needsContext === unmaskedContext) {
          current = bailoutOnAlreadyFinishedWork(current, workInProgress);
          break a;
        }
        renderExpirationTime = unmaskedContext.children;
        renderExpirationTime = renderExpirationTime(props);
        workInProgress.effectTag |= 1;
        reconcileChildren(current, workInProgress, renderExpirationTime);
        current = workInProgress.child;
      } else current = bailoutOnAlreadyFinishedWork(current, workInProgress);
      return current;
    default:
      invariant(
        !1,
        "Unknown unit of work tag. This error is likely caused by a bug in React. Please file an issue."
      );
  }
}
var updateHostContainer = void 0,
  updateHostComponent$1 = void 0,
  updateHostText$1 = void 0;
updateHostContainer = function() {};
updateHostComponent$1 = function(current, workInProgress, updatePayload) {
  if ((workInProgress.updateQueue = updatePayload))
    workInProgress.effectTag |= 4;
};
updateHostText$1 = function(current, workInProgress, oldText, newText) {
  oldText !== newText && (workInProgress.effectTag |= 4);
};
function completeWork(current, workInProgress) {
  var newProps = workInProgress.pendingProps;
  workInProgress.mode & 4 && recordElapsedActualRenderTime(workInProgress);
  switch (workInProgress.tag) {
    case 1:
      return null;
    case 2:
      return popContextProvider(workInProgress), null;
    case 3:
      popHostContainer(workInProgress);
      popTopLevelContextObject(workInProgress);
      newProps = workInProgress.stateNode;
      newProps.pendingContext &&
        ((newProps.context = newProps.pendingContext),
        (newProps.pendingContext = null));
      if (null === current || null === current.child)
        workInProgress.effectTag &= -3;
      updateHostContainer(workInProgress);
      return null;
    case 5:
      popHostContext(workInProgress);
      var rootContainerInstance = requiredContext(
          rootInstanceStackCursor.current
        ),
        type = workInProgress.type;
      if (null !== current && null != workInProgress.stateNode) {
        var oldProps = current.memoizedProps,
          currentHostContext = requiredContext(contextStackCursor$1.current);
        updateHostComponent$1(
          current,
          workInProgress,
          emptyObject,
          type,
          oldProps,
          newProps,
          rootContainerInstance,
          currentHostContext
        );
        current.ref !== workInProgress.ref && (workInProgress.effectTag |= 128);
      } else {
        if (!newProps)
          return (
            invariant(
              null !== workInProgress.stateNode,
              "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
            ),
            null
          );
        current = requiredContext(contextStackCursor$1.current);
        oldProps = allocateTag();
        currentHostContext = ReactNativeViewConfigRegistry.get(type);
        invariant(
          "RCTView" !== type || !current.isInAParentText,
          "Nesting of <View> within <Text> is not currently supported."
        );
        var updatePayload = diffProperties(
          null,
          emptyObject$1,
          newProps,
          currentHostContext.validAttributes
        );
        UIManager.createView(
          oldProps,
          currentHostContext.uiViewClassName,
          rootContainerInstance,
          updatePayload
        );
        currentHostContext = new ReactNativeFiberHostComponent(
          oldProps,
          currentHostContext
        );
        instanceCache[oldProps] = workInProgress;
        instanceProps[oldProps] = newProps;
        a: for (oldProps = workInProgress.child; null !== oldProps; ) {
          if (5 === oldProps.tag || 6 === oldProps.tag)
            currentHostContext._children.push(oldProps.stateNode);
          else if (4 !== oldProps.tag && null !== oldProps.child) {
            oldProps.child.return = oldProps;
            oldProps = oldProps.child;
            continue;
          }
          if (oldProps === workInProgress) break;
          for (; null === oldProps.sibling; ) {
            if (null === oldProps.return || oldProps.return === workInProgress)
              break a;
            oldProps = oldProps.return;
          }
          oldProps.sibling.return = oldProps.return;
          oldProps = oldProps.sibling;
        }
        finalizeInitialChildren(
          currentHostContext,
          type,
          newProps,
          rootContainerInstance,
          current
        ) && (workInProgress.effectTag |= 4);
        workInProgress.stateNode = currentHostContext;
        null !== workInProgress.ref && (workInProgress.effectTag |= 128);
      }
      return null;
    case 6:
      if (current && null != workInProgress.stateNode)
        updateHostText$1(
          current,
          workInProgress,
          current.memoizedProps,
          newProps
        );
      else {
        if ("string" !== typeof newProps)
          return (
            invariant(
              null !== workInProgress.stateNode,
              "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
            ),
            null
          );
        rootContainerInstance = requiredContext(
          rootInstanceStackCursor.current
        );
        type = requiredContext(contextStackCursor$1.current);
        invariant(
          type.isInAParentText,
          "Text strings must be rendered within a <Text> component."
        );
        type = allocateTag();
        UIManager.createView(type, "RCTRawText", rootContainerInstance, {
          text: newProps
        });
        instanceCache[type] = workInProgress;
        workInProgress.stateNode = type;
      }
      return null;
    case 14:
      return null;
    case 16:
      return null;
    case 10:
      return null;
    case 11:
      return null;
    case 15:
      return null;
    case 4:
      return (
        popHostContainer(workInProgress),
        updateHostContainer(workInProgress),
        null
      );
    case 13:
      return popProvider(workInProgress), null;
    case 12:
      return null;
    case 0:
      invariant(
        !1,
        "An indeterminate component should have become determinate before completing. This error is likely caused by a bug in React. Please file an issue."
      );
    default:
      invariant(
        !1,
        "Unknown unit of work tag. This error is likely caused by a bug in React. Please file an issue."
      );
  }
}
function logError(boundary, errorInfo) {
  var source = errorInfo.source,
    stack = errorInfo.stack;
  null === stack &&
    null !== source &&
    (stack = getStackAddendumByWorkInProgressFiber(source));
  null !== source && getComponentName(source);
  source = null !== stack ? stack : "";
  errorInfo = errorInfo.value;
  null !== boundary && 2 === boundary.tag && getComponentName(boundary);
  try {
    if (errorInfo instanceof Error) {
      var message = errorInfo.message,
        name = errorInfo.name;
      var errorToHandle = errorInfo;
      try {
        errorToHandle.message =
          (message ? name + ": " + message : name) +
          "\n\nThis error is located at:" +
          source;
      } catch (e) {}
    } else
      errorToHandle =
        "string" === typeof errorInfo
          ? Error(errorInfo + "\n\nThis error is located at:" + source)
          : Error("Unspecified error at:" + source);
    ExceptionsManager.handleException(errorToHandle, !1);
  } catch (e) {
    (e && e.suppressReactErrorLogging) || console.error(e);
  }
}
function safelyDetachRef(current) {
  var ref = current.ref;
  if (null !== ref)
    if ("function" === typeof ref)
      try {
        ref(null);
      } catch (refError) {
        captureCommitPhaseError(current, refError);
      }
    else ref.current = null;
}
function commitUnmount(current) {
  "function" === typeof onCommitUnmount && onCommitUnmount(current);
  switch (current.tag) {
    case 2:
      safelyDetachRef(current);
      var instance = current.stateNode;
      if ("function" === typeof instance.componentWillUnmount)
        try {
          (instance.props = current.memoizedProps),
            (instance.state = current.memoizedState),
            instance.componentWillUnmount();
        } catch (unmountError) {
          captureCommitPhaseError(current, unmountError);
        }
      break;
    case 5:
      safelyDetachRef(current);
      break;
    case 4:
      unmountHostComponents(current);
  }
}
function isHostParent(fiber) {
  return 5 === fiber.tag || 3 === fiber.tag || 4 === fiber.tag;
}
function commitPlacement(finishedWork) {
  a: {
    for (var parent = finishedWork.return; null !== parent; ) {
      if (isHostParent(parent)) {
        var parentFiber = parent;
        break a;
      }
      parent = parent.return;
    }
    invariant(
      !1,
      "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue."
    );
    parentFiber = void 0;
  }
  var isContainer = (parent = void 0);
  switch (parentFiber.tag) {
    case 5:
      parent = parentFiber.stateNode;
      isContainer = !1;
      break;
    case 3:
      parent = parentFiber.stateNode.containerInfo;
      isContainer = !0;
      break;
    case 4:
      parent = parentFiber.stateNode.containerInfo;
      isContainer = !0;
      break;
    default:
      invariant(
        !1,
        "Invalid host parent fiber. This error is likely caused by a bug in React. Please file an issue."
      );
  }
  parentFiber.effectTag & 16 && (parentFiber.effectTag &= -17);
  a: b: for (parentFiber = finishedWork; ; ) {
    for (; null === parentFiber.sibling; ) {
      if (null === parentFiber.return || isHostParent(parentFiber.return)) {
        parentFiber = null;
        break a;
      }
      parentFiber = parentFiber.return;
    }
    parentFiber.sibling.return = parentFiber.return;
    for (
      parentFiber = parentFiber.sibling;
      5 !== parentFiber.tag && 6 !== parentFiber.tag;

    ) {
      if (parentFiber.effectTag & 2) continue b;
      if (null === parentFiber.child || 4 === parentFiber.tag) continue b;
      else
        (parentFiber.child.return = parentFiber),
          (parentFiber = parentFiber.child);
    }
    if (!(parentFiber.effectTag & 2)) {
      parentFiber = parentFiber.stateNode;
      break a;
    }
  }
  for (var node = finishedWork; ; ) {
    if (5 === node.tag || 6 === node.tag)
      if (parentFiber)
        if (isContainer)
          invariant(
            "number" !== typeof parent,
            "Container does not support insertBefore operation"
          );
        else {
          var parentInstance = parent,
            child = node.stateNode,
            beforeChild = parentFiber,
            children = parentInstance._children,
            index = children.indexOf(child);
          0 <= index
            ? (children.splice(index, 1),
              (beforeChild = children.indexOf(beforeChild)),
              children.splice(beforeChild, 0, child),
              UIManager.manageChildren(
                parentInstance._nativeTag,
                [index],
                [beforeChild],
                [],
                [],
                []
              ))
            : ((index = children.indexOf(beforeChild)),
              children.splice(index, 0, child),
              UIManager.manageChildren(
                parentInstance._nativeTag,
                [],
                [],
                ["number" === typeof child ? child : child._nativeTag],
                [index],
                []
              ));
        }
      else
        isContainer
          ? ((parentInstance = node.stateNode),
            UIManager.setChildren(parent, [
              "number" === typeof parentInstance
                ? parentInstance
                : parentInstance._nativeTag
            ]))
          : ((parentInstance = parent),
            (child = node.stateNode),
            (children = "number" === typeof child ? child : child._nativeTag),
            (index = parentInstance._children),
            (beforeChild = index.indexOf(child)),
            0 <= beforeChild
              ? (index.splice(beforeChild, 1),
                index.push(child),
                UIManager.manageChildren(
                  parentInstance._nativeTag,
                  [beforeChild],
                  [index.length - 1],
                  [],
                  [],
                  []
                ))
              : (index.push(child),
                UIManager.manageChildren(
                  parentInstance._nativeTag,
                  [],
                  [],
                  [children],
                  [index.length - 1],
                  []
                )));
    else if (4 !== node.tag && null !== node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === finishedWork) break;
    for (; null === node.sibling; ) {
      if (null === node.return || node.return === finishedWork) return;
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
function unmountHostComponents(current) {
  for (
    var node = current,
      currentParentIsValid = !1,
      currentParent = void 0,
      currentParentIsContainer = void 0;
    ;

  ) {
    if (!currentParentIsValid) {
      currentParentIsValid = node.return;
      a: for (;;) {
        invariant(
          null !== currentParentIsValid,
          "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue."
        );
        switch (currentParentIsValid.tag) {
          case 5:
            currentParent = currentParentIsValid.stateNode;
            currentParentIsContainer = !1;
            break a;
          case 3:
            currentParent = currentParentIsValid.stateNode.containerInfo;
            currentParentIsContainer = !0;
            break a;
          case 4:
            currentParent = currentParentIsValid.stateNode.containerInfo;
            currentParentIsContainer = !0;
            break a;
        }
        currentParentIsValid = currentParentIsValid.return;
      }
      currentParentIsValid = !0;
    }
    if (5 === node.tag || 6 === node.tag) {
      a: for (var root = node, node$jscomp$0 = root; ; )
        if (
          (commitUnmount(node$jscomp$0),
          null !== node$jscomp$0.child && 4 !== node$jscomp$0.tag)
        )
          (node$jscomp$0.child.return = node$jscomp$0),
            (node$jscomp$0 = node$jscomp$0.child);
        else {
          if (node$jscomp$0 === root) break;
          for (; null === node$jscomp$0.sibling; ) {
            if (null === node$jscomp$0.return || node$jscomp$0.return === root)
              break a;
            node$jscomp$0 = node$jscomp$0.return;
          }
          node$jscomp$0.sibling.return = node$jscomp$0.return;
          node$jscomp$0 = node$jscomp$0.sibling;
        }
      if (currentParentIsContainer)
        (root = currentParent),
          recursivelyUncacheFiberNode(node.stateNode),
          UIManager.manageChildren(root, [], [], [], [], [0]);
      else {
        root = currentParent;
        var child = node.stateNode;
        recursivelyUncacheFiberNode(child);
        node$jscomp$0 = root._children;
        child = node$jscomp$0.indexOf(child);
        node$jscomp$0.splice(child, 1);
        UIManager.manageChildren(root._nativeTag, [], [], [], [], [child]);
      }
    } else if (
      (4 === node.tag
        ? (currentParent = node.stateNode.containerInfo)
        : commitUnmount(node),
      null !== node.child)
    ) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === current) break;
    for (; null === node.sibling; ) {
      if (null === node.return || node.return === current) return;
      node = node.return;
      4 === node.tag && (currentParentIsValid = !1);
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
function commitWork(current, finishedWork) {
  switch (finishedWork.tag) {
    case 2:
      break;
    case 5:
      var instance = finishedWork.stateNode;
      if (null != instance) {
        var newProps = finishedWork.memoizedProps;
        current = null !== current ? current.memoizedProps : newProps;
        var updatePayload = finishedWork.updateQueue;
        finishedWork.updateQueue = null;
        null !== updatePayload &&
          ((finishedWork = instance.viewConfig),
          (instanceProps[instance._nativeTag] = newProps),
          (newProps = diffProperties(
            null,
            current,
            newProps,
            finishedWork.validAttributes
          )),
          null != newProps &&
            UIManager.updateView(
              instance._nativeTag,
              finishedWork.uiViewClassName,
              newProps
            ));
      }
      break;
    case 6:
      invariant(
        null !== finishedWork.stateNode,
        "This should have a text node initialized. This error is likely caused by a bug in React. Please file an issue."
      );
      UIManager.updateView(finishedWork.stateNode, "RCTRawText", {
        text: finishedWork.memoizedProps
      });
      break;
    case 3:
      break;
    case 15:
      instance = finishedWork.memoizedProps.onRender;
      instance(
        finishedWork.memoizedProps.id,
        null === current ? "mount" : "update",
        finishedWork.actualDuration,
        finishedWork.treeBaseTime,
        finishedWork.actualStartTime,
        commitTime
      );
      break;
    case 16:
      break;
    default:
      invariant(
        !1,
        "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
      );
  }
}
function createRootErrorUpdate(fiber, errorInfo, expirationTime) {
  expirationTime = createUpdate(expirationTime);
  expirationTime.tag = 3;
  expirationTime.payload = { element: null };
  var error = errorInfo.value;
  expirationTime.callback = function() {
    onUncaughtError(error);
    logError(fiber, errorInfo);
  };
  return expirationTime;
}
function createClassErrorUpdate(fiber, errorInfo, expirationTime) {
  expirationTime = createUpdate(expirationTime);
  expirationTime.tag = 3;
  var inst = fiber.stateNode;
  null !== inst &&
    "function" === typeof inst.componentDidCatch &&
    (expirationTime.callback = function() {
      null === legacyErrorBoundariesThatAlreadyFailed
        ? (legacyErrorBoundariesThatAlreadyFailed = new Set([this]))
        : legacyErrorBoundariesThatAlreadyFailed.add(this);
      var error = errorInfo.value,
        stack = errorInfo.stack;
      logError(fiber, errorInfo);
      this.componentDidCatch(error, {
        componentStack: null !== stack ? stack : ""
      });
    });
  return expirationTime;
}
function unwindWork(workInProgress) {
  workInProgress.mode & 4 && recordElapsedActualRenderTime(workInProgress);
  switch (workInProgress.tag) {
    case 2:
      popContextProvider(workInProgress);
      var effectTag = workInProgress.effectTag;
      return effectTag & 1024
        ? ((workInProgress.effectTag = (effectTag & -1025) | 64),
          workInProgress)
        : null;
    case 3:
      return (
        popHostContainer(workInProgress),
        popTopLevelContextObject(workInProgress),
        (effectTag = workInProgress.effectTag),
        effectTag & 1024
          ? ((workInProgress.effectTag = (effectTag & -1025) | 64),
            workInProgress)
          : null
      );
    case 5:
      return popHostContext(workInProgress), null;
    case 16:
      return (
        (effectTag = workInProgress.effectTag),
        effectTag & 1024
          ? ((workInProgress.effectTag = (effectTag & -1025) | 64),
            workInProgress)
          : null
      );
    case 4:
      return popHostContainer(workInProgress), null;
    case 13:
      return popProvider(workInProgress), null;
    default:
      return null;
  }
}
var originalStartTimeMs = now$1(),
  mostRecentCurrentTime = 2,
  mostRecentCurrentTimeMs = originalStartTimeMs,
  lastUniqueAsyncExpiration = 0,
  expirationContext = 0,
  isWorking = !1,
  nextUnitOfWork = null,
  nextRoot = null,
  nextRenderExpirationTime = 0,
  nextLatestTimeoutMs = -1,
  nextRenderDidError = !1,
  nextEffect = null,
  isCommitting$1 = !1,
  legacyErrorBoundariesThatAlreadyFailed = null;
function resetStack() {
  if (null !== nextUnitOfWork)
    for (
      var interruptedWork = nextUnitOfWork.return;
      null !== interruptedWork;

    ) {
      var interruptedWork$jscomp$0 = interruptedWork;
      interruptedWork$jscomp$0.mode & 4 &&
        (resumeActualRenderTimerIfPaused(),
        recordElapsedActualRenderTime(interruptedWork$jscomp$0));
      switch (interruptedWork$jscomp$0.tag) {
        case 2:
          popContextProvider(interruptedWork$jscomp$0);
          break;
        case 3:
          popHostContainer(interruptedWork$jscomp$0);
          popTopLevelContextObject(interruptedWork$jscomp$0);
          break;
        case 5:
          popHostContext(interruptedWork$jscomp$0);
          break;
        case 4:
          popHostContainer(interruptedWork$jscomp$0);
          break;
        case 13:
          popProvider(interruptedWork$jscomp$0);
      }
      interruptedWork = interruptedWork.return;
    }
  nextRoot = null;
  nextRenderExpirationTime = 0;
  nextLatestTimeoutMs = -1;
  nextRenderDidError = !1;
  nextUnitOfWork = null;
}
function completeUnitOfWork(workInProgress$jscomp$0) {
  for (;;) {
    var current = workInProgress$jscomp$0.alternate,
      returnFiber = workInProgress$jscomp$0.return,
      siblingFiber = workInProgress$jscomp$0.sibling;
    if (0 === (workInProgress$jscomp$0.effectTag & 512)) {
      current = completeWork(
        current,
        workInProgress$jscomp$0,
        nextRenderExpirationTime
      );
      var workInProgress = workInProgress$jscomp$0;
      if (
        1073741823 === nextRenderExpirationTime ||
        1073741823 !== workInProgress.expirationTime
      ) {
        var newExpirationTime = 0;
        switch (workInProgress.tag) {
          case 3:
          case 2:
            var updateQueue = workInProgress.updateQueue;
            null !== updateQueue &&
              (newExpirationTime = updateQueue.expirationTime);
        }
        if (workInProgress.mode & 4) {
          updateQueue = workInProgress.selfBaseTime;
          for (var child = workInProgress.child; null !== child; )
            (updateQueue += child.treeBaseTime),
              0 !== child.expirationTime &&
                (0 === newExpirationTime ||
                  newExpirationTime > child.expirationTime) &&
                (newExpirationTime = child.expirationTime),
              (child = child.sibling);
          workInProgress.treeBaseTime = updateQueue;
        } else
          for (updateQueue = workInProgress.child; null !== updateQueue; )
            0 !== updateQueue.expirationTime &&
              (0 === newExpirationTime ||
                newExpirationTime > updateQueue.expirationTime) &&
              (newExpirationTime = updateQueue.expirationTime),
              (updateQueue = updateQueue.sibling);
        workInProgress.expirationTime = newExpirationTime;
      }
      if (null !== current) return current;
      null !== returnFiber &&
        0 === (returnFiber.effectTag & 512) &&
        (null === returnFiber.firstEffect &&
          (returnFiber.firstEffect = workInProgress$jscomp$0.firstEffect),
        null !== workInProgress$jscomp$0.lastEffect &&
          (null !== returnFiber.lastEffect &&
            (returnFiber.lastEffect.nextEffect =
              workInProgress$jscomp$0.firstEffect),
          (returnFiber.lastEffect = workInProgress$jscomp$0.lastEffect)),
        1 < workInProgress$jscomp$0.effectTag &&
          (null !== returnFiber.lastEffect
            ? (returnFiber.lastEffect.nextEffect = workInProgress$jscomp$0)
            : (returnFiber.firstEffect = workInProgress$jscomp$0),
          (returnFiber.lastEffect = workInProgress$jscomp$0)));
    } else {
      workInProgress$jscomp$0 = unwindWork(
        workInProgress$jscomp$0,
        nextRenderExpirationTime
      );
      if (null !== workInProgress$jscomp$0)
        return (
          (workInProgress$jscomp$0.effectTag &= 511), workInProgress$jscomp$0
        );
      null !== returnFiber &&
        ((returnFiber.firstEffect = returnFiber.lastEffect = null),
        (returnFiber.effectTag |= 512));
    }
    if (null !== siblingFiber) return siblingFiber;
    if (null !== returnFiber) workInProgress$jscomp$0 = returnFiber;
    else break;
  }
  return null;
}
function performUnitOfWork(workInProgress) {
  var current = workInProgress.alternate;
  workInProgress.mode & 4 && (baseStartTime = now$1());
  current = beginWork(current, workInProgress, nextRenderExpirationTime);
  workInProgress.mode & 4 &&
    (-1 !== baseStartTime &&
      (workInProgress.selfBaseTime = now$1() - baseStartTime),
    (baseStartTime = -1));
  null === current && (current = completeUnitOfWork(workInProgress));
  ReactCurrentOwner.current = null;
  return current;
}
function renderRoot(root$jscomp$0, isYieldy) {
  invariant(
    !isWorking,
    "renderRoot was called recursively. This error is likely caused by a bug in React. Please file an issue."
  );
  isWorking = !0;
  var expirationTime = root$jscomp$0.nextExpirationTimeToWorkOn;
  if (
    expirationTime !== nextRenderExpirationTime ||
    root$jscomp$0 !== nextRoot ||
    null === nextUnitOfWork
  )
    resetStack(),
      (nextRoot = root$jscomp$0),
      (nextRenderExpirationTime = expirationTime),
      (nextLatestTimeoutMs = -1),
      (nextRenderDidError = !1),
      (nextUnitOfWork = createWorkInProgress(
        nextRoot.current,
        null,
        nextRenderExpirationTime
      )),
      (root$jscomp$0.pendingCommitExpirationTime = 0);
  var didFatal = !1;
  do {
    try {
      if (isYieldy) {
        for (; null !== nextUnitOfWork && !shouldYield(); )
          nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        0 === timerPausedAt && (timerPausedAt = now$1());
      } else
        for (; null !== nextUnitOfWork; )
          nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    } catch (thrownValue) {
      if (((baseStartTime = -1), null === nextUnitOfWork))
        (didFatal = !0), onUncaughtError(thrownValue);
      else {
        invariant(
          null !== nextUnitOfWork,
          "Failed to replay rendering after an error. This is likely caused by a bug in React. Please file an issue with a reproducing case to help us find it."
        );
        isYieldy = nextUnitOfWork;
        var returnFiber = isYieldy.return;
        if (null === returnFiber) {
          didFatal = !0;
          onUncaughtError(thrownValue);
          break;
        }
        a: {
          var root = root$jscomp$0,
            returnFiber$jscomp$0 = returnFiber,
            sourceFiber = isYieldy,
            value = thrownValue;
          returnFiber = nextRenderExpirationTime;
          sourceFiber.effectTag |= 512;
          sourceFiber.firstEffect = sourceFiber.lastEffect = null;
          nextRenderDidError = !0;
          if (
            (root.didError || 1 === returnFiber) &&
            (returnFiber === root.latestPendingTime ||
              returnFiber === root.latestSuspendedTime)
          ) {
            value = createCapturedValue(value, sourceFiber);
            root = returnFiber$jscomp$0;
            do {
              switch (root.tag) {
                case 3:
                  root.effectTag |= 1024;
                  value = createRootErrorUpdate(root, value, returnFiber);
                  enqueueCapturedUpdate(root, value, returnFiber);
                  break a;
                case 2:
                  if (
                    ((returnFiber$jscomp$0 = value),
                    (sourceFiber = root.stateNode),
                    0 === (root.effectTag & 64) &&
                      null !== sourceFiber &&
                      "function" === typeof sourceFiber.componentDidCatch &&
                      (null === legacyErrorBoundariesThatAlreadyFailed ||
                        !legacyErrorBoundariesThatAlreadyFailed.has(
                          sourceFiber
                        )))
                  ) {
                    root.effectTag |= 1024;
                    value = createClassErrorUpdate(
                      root,
                      returnFiber$jscomp$0,
                      returnFiber
                    );
                    enqueueCapturedUpdate(root, value, returnFiber);
                    break a;
                  }
              }
              root = root.return;
            } while (null !== root);
          }
        }
        nextUnitOfWork = completeUnitOfWork(isYieldy);
      }
    }
    break;
  } while (1);
  isWorking = !1;
  didFatal
    ? (root$jscomp$0.finishedWork = null)
    : null === nextUnitOfWork
      ? ((didFatal = root$jscomp$0.current.alternate),
        invariant(
          null !== didFatal,
          "Finished root should have a work-in-progress. This error is likely caused by a bug in React. Please file an issue."
        ),
        0 === (didFatal.effectTag & 512)
          ? ((root$jscomp$0.pendingCommitExpirationTime = expirationTime),
            (root$jscomp$0.finishedWork = didFatal))
          : (!nextRenderDidError ||
            (expirationTime !== root$jscomp$0.latestPendingTime &&
              expirationTime !== root$jscomp$0.latestSuspendedTime)
              ? ((didFatal = root$jscomp$0.earliestPendingTime),
                (isYieldy = root$jscomp$0.latestPendingTime),
                didFatal === expirationTime
                  ? (root$jscomp$0.earliestPendingTime =
                      isYieldy === expirationTime
                        ? (root$jscomp$0.latestPendingTime = 0)
                        : isYieldy)
                  : isYieldy === expirationTime &&
                    (root$jscomp$0.latestPendingTime = didFatal),
                (didFatal = root$jscomp$0.latestSuspendedTime),
                didFatal === expirationTime &&
                  (root$jscomp$0.latestPingedTime = 0),
                (isYieldy = root$jscomp$0.earliestSuspendedTime),
                0 === isYieldy
                  ? (root$jscomp$0.earliestSuspendedTime = root$jscomp$0.latestSuspendedTime = expirationTime)
                  : isYieldy > expirationTime
                    ? (root$jscomp$0.earliestSuspendedTime = expirationTime)
                    : didFatal < expirationTime &&
                      (root$jscomp$0.latestSuspendedTime = expirationTime))
              : (root$jscomp$0.didError = !0),
            findNextPendingPriorityLevel(root$jscomp$0),
            onSuspend(
              root$jscomp$0,
              expirationTime,
              root$jscomp$0.expirationTime,
              nextLatestTimeoutMs
            )))
      : (root$jscomp$0.finishedWork = null);
}
function captureCommitPhaseError(fiber, error) {
  var JSCompiler_inline_result;
  a: {
    invariant(
      !isWorking || isCommitting$1,
      "dispatch: Cannot dispatch during the render phase."
    );
    for (
      JSCompiler_inline_result = fiber.return;
      null !== JSCompiler_inline_result;

    ) {
      switch (JSCompiler_inline_result.tag) {
        case 2:
          var instance = JSCompiler_inline_result.stateNode;
          if (
            "function" ===
              typeof JSCompiler_inline_result.type.getDerivedStateFromCatch ||
            ("function" === typeof instance.componentDidCatch &&
              (null === legacyErrorBoundariesThatAlreadyFailed ||
                !legacyErrorBoundariesThatAlreadyFailed.has(instance)))
          ) {
            fiber = createCapturedValue(error, fiber);
            fiber = createClassErrorUpdate(JSCompiler_inline_result, fiber, 1);
            enqueueUpdate(JSCompiler_inline_result, fiber, 1);
            scheduleWork(JSCompiler_inline_result, 1);
            JSCompiler_inline_result = void 0;
            break a;
          }
          break;
        case 3:
          fiber = createCapturedValue(error, fiber);
          fiber = createRootErrorUpdate(JSCompiler_inline_result, fiber, 1);
          enqueueUpdate(JSCompiler_inline_result, fiber, 1);
          scheduleWork(JSCompiler_inline_result, 1);
          JSCompiler_inline_result = void 0;
          break a;
      }
      JSCompiler_inline_result = JSCompiler_inline_result.return;
    }
    3 === fiber.tag &&
      ((JSCompiler_inline_result = createCapturedValue(error, fiber)),
      (JSCompiler_inline_result = createRootErrorUpdate(
        fiber,
        JSCompiler_inline_result,
        1
      )),
      enqueueUpdate(fiber, JSCompiler_inline_result, 1),
      scheduleWork(fiber, 1));
    JSCompiler_inline_result = void 0;
  }
  return JSCompiler_inline_result;
}
function computeExpirationForFiber(currentTime, fiber) {
  currentTime =
    0 !== expirationContext
      ? expirationContext
      : isWorking
        ? isCommitting$1 ? 1 : nextRenderExpirationTime
        : fiber.mode & 1
          ? isBatchingInteractiveUpdates
            ? 2 + 10 * ((((currentTime - 2 + 15) / 10) | 0) + 1)
            : 2 + 25 * ((((currentTime - 2 + 500) / 25) | 0) + 1)
          : 1;
  isBatchingInteractiveUpdates &&
    (0 === lowestPendingInteractiveExpirationTime ||
      currentTime > lowestPendingInteractiveExpirationTime) &&
    (lowestPendingInteractiveExpirationTime = currentTime);
  return currentTime;
}
function scheduleWork(fiber, expirationTime) {
  for (; null !== fiber; ) {
    if (0 === fiber.expirationTime || fiber.expirationTime > expirationTime)
      fiber.expirationTime = expirationTime;
    null !== fiber.alternate &&
      (0 === fiber.alternate.expirationTime ||
        fiber.alternate.expirationTime > expirationTime) &&
      (fiber.alternate.expirationTime = expirationTime);
    if (null === fiber.return)
      if (3 === fiber.tag) {
        var root = fiber.stateNode;
        !isWorking &&
          0 !== nextRenderExpirationTime &&
          expirationTime < nextRenderExpirationTime &&
          resetStack();
        markPendingPriorityLevel(root, expirationTime);
        (isWorking && !isCommitting$1 && nextRoot === root) ||
          requestWork(root, root.expirationTime);
        nestedUpdateCount > NESTED_UPDATE_LIMIT &&
          invariant(
            !1,
            "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops."
          );
      } else break;
    fiber = fiber.return;
  }
}
function recalculateCurrentTime() {
  mostRecentCurrentTimeMs = now$1() - originalStartTimeMs;
  return (mostRecentCurrentTime = ((mostRecentCurrentTimeMs / 10) | 0) + 2);
}
function syncUpdates(fn, a, b, c, d) {
  var previousExpirationContext = expirationContext;
  expirationContext = 1;
  try {
    return fn(a, b, c, d);
  } finally {
    expirationContext = previousExpirationContext;
  }
}
var firstScheduledRoot = null,
  lastScheduledRoot = null,
  callbackExpirationTime = 0,
  callbackID = void 0,
  isRendering = !1,
  nextFlushedRoot = null,
  nextFlushedExpirationTime = 0,
  lowestPendingInteractiveExpirationTime = 0,
  deadlineDidExpire = !1,
  hasUnhandledError = !1,
  unhandledError = null,
  deadline = null,
  isBatchingUpdates = !1,
  isUnbatchingUpdates = !1,
  isBatchingInteractiveUpdates = !1,
  completedBatches = null,
  NESTED_UPDATE_LIMIT = 1e3,
  nestedUpdateCount = 0,
  timeHeuristicForUnitOfWork = 1;
function scheduleCallbackWithExpirationTime(expirationTime) {
  if (0 !== callbackExpirationTime) {
    if (expirationTime > callbackExpirationTime) return;
    if (null !== callbackID) {
      var callbackID$jscomp$0 = callbackID;
      scheduledCallback = null;
      clearTimeout(callbackID$jscomp$0);
    }
  }
  callbackExpirationTime = expirationTime;
  now$1();
  scheduledCallback = performAsyncWork;
  callbackID = setTimeout(setTimeoutCallback, 1);
}
function onSuspend(root, suspendedExpirationTime, expirationTime, timeoutMs) {
  0 <= timeoutMs &&
    setTimeout(function() {
      var latestSuspendedTime = root.latestSuspendedTime;
      0 !== latestSuspendedTime &&
        latestSuspendedTime <= suspendedExpirationTime &&
        ((latestSuspendedTime = root.latestPingedTime),
        0 === latestSuspendedTime ||
          latestSuspendedTime < suspendedExpirationTime) &&
        (root.latestPingedTime = suspendedExpirationTime);
      findNextPendingPriorityLevel(root);
      latestSuspendedTime = root.expirationTime;
      0 !== latestSuspendedTime && requestWork(root, latestSuspendedTime);
    }, timeoutMs);
  root.expirationTime = expirationTime;
}
function requestWork(root, expirationTime) {
  if (null === root.nextScheduledRoot)
    (root.expirationTime = expirationTime),
      null === lastScheduledRoot
        ? ((firstScheduledRoot = lastScheduledRoot = root),
          (root.nextScheduledRoot = root))
        : ((lastScheduledRoot = lastScheduledRoot.nextScheduledRoot = root),
          (lastScheduledRoot.nextScheduledRoot = firstScheduledRoot));
  else {
    var remainingExpirationTime = root.expirationTime;
    if (
      0 === remainingExpirationTime ||
      expirationTime < remainingExpirationTime
    )
      root.expirationTime = expirationTime;
  }
  isRendering ||
    (isBatchingUpdates
      ? isUnbatchingUpdates &&
        ((nextFlushedRoot = root),
        (nextFlushedExpirationTime = 1),
        performWorkOnRoot(root, 1, !1))
      : 1 === expirationTime
        ? performWork(1, null)
        : scheduleCallbackWithExpirationTime(expirationTime));
}
function findHighestPriorityRoot() {
  var highestPriorityWork = 0,
    highestPriorityRoot = null;
  if (null !== lastScheduledRoot)
    for (
      var previousScheduledRoot = lastScheduledRoot, root = firstScheduledRoot;
      null !== root;

    ) {
      var remainingExpirationTime = root.expirationTime;
      if (0 === remainingExpirationTime) {
        invariant(
          null !== previousScheduledRoot && null !== lastScheduledRoot,
          "Should have a previous and last root. This error is likely caused by a bug in React. Please file an issue."
        );
        if (root === root.nextScheduledRoot) {
          firstScheduledRoot = lastScheduledRoot = root.nextScheduledRoot = null;
          break;
        } else if (root === firstScheduledRoot)
          (firstScheduledRoot = remainingExpirationTime =
            root.nextScheduledRoot),
            (lastScheduledRoot.nextScheduledRoot = remainingExpirationTime),
            (root.nextScheduledRoot = null);
        else if (root === lastScheduledRoot) {
          lastScheduledRoot = previousScheduledRoot;
          lastScheduledRoot.nextScheduledRoot = firstScheduledRoot;
          root.nextScheduledRoot = null;
          break;
        } else
          (previousScheduledRoot.nextScheduledRoot = root.nextScheduledRoot),
            (root.nextScheduledRoot = null);
        root = previousScheduledRoot.nextScheduledRoot;
      } else {
        if (
          0 === highestPriorityWork ||
          remainingExpirationTime < highestPriorityWork
        )
          (highestPriorityWork = remainingExpirationTime),
            (highestPriorityRoot = root);
        if (root === lastScheduledRoot) break;
        previousScheduledRoot = root;
        root = root.nextScheduledRoot;
      }
    }
  previousScheduledRoot = nextFlushedRoot;
  null !== previousScheduledRoot &&
  previousScheduledRoot === highestPriorityRoot &&
  1 === highestPriorityWork
    ? nestedUpdateCount++
    : (nestedUpdateCount = 0);
  nextFlushedRoot = highestPriorityRoot;
  nextFlushedExpirationTime = highestPriorityWork;
}
function performAsyncWork(dl) {
  performWork(0, dl);
}
function performWork(minExpirationTime, dl) {
  deadline = dl;
  findHighestPriorityRoot();
  resumeActualRenderTimerIfPaused();
  if (null !== deadline)
    for (
      ;
      null !== nextFlushedRoot &&
      0 !== nextFlushedExpirationTime &&
      (0 === minExpirationTime ||
        minExpirationTime >= nextFlushedExpirationTime) &&
      (!deadlineDidExpire ||
        recalculateCurrentTime() >= nextFlushedExpirationTime);

    )
      recalculateCurrentTime(),
        performWorkOnRoot(nextFlushedRoot, nextFlushedExpirationTime, !0),
        findHighestPriorityRoot();
  else
    for (
      ;
      null !== nextFlushedRoot &&
      0 !== nextFlushedExpirationTime &&
      (0 === minExpirationTime ||
        minExpirationTime >= nextFlushedExpirationTime);

    )
      performWorkOnRoot(nextFlushedRoot, nextFlushedExpirationTime, !1),
        findHighestPriorityRoot();
  null !== deadline && ((callbackExpirationTime = 0), (callbackID = null));
  0 !== nextFlushedExpirationTime &&
    scheduleCallbackWithExpirationTime(nextFlushedExpirationTime);
  deadline = null;
  deadlineDidExpire = !1;
  finishRendering();
}
function finishRendering() {
  nestedUpdateCount = 0;
  if (null !== completedBatches) {
    var batches = completedBatches;
    completedBatches = null;
    for (var i = 0; i < batches.length; i++) {
      var batch = batches[i];
      try {
        batch._onComplete();
      } catch (error) {
        hasUnhandledError ||
          ((hasUnhandledError = !0), (unhandledError = error));
      }
    }
  }
  if (hasUnhandledError)
    throw ((batches = unhandledError),
    (unhandledError = null),
    (hasUnhandledError = !1),
    batches);
}
function performWorkOnRoot(root, expirationTime, isYieldy) {
  invariant(
    !isRendering,
    "performWorkOnRoot was called recursively. This error is likely caused by a bug in React. Please file an issue."
  );
  isRendering = !0;
  isYieldy
    ? ((isYieldy = root.finishedWork),
      null !== isYieldy
        ? completeRoot(root, isYieldy, expirationTime)
        : ((root.finishedWork = null),
          renderRoot(root, !0),
          (isYieldy = root.finishedWork),
          null !== isYieldy &&
            (shouldYield()
              ? ((root.finishedWork = isYieldy),
                0 === timerPausedAt && (timerPausedAt = now$1()))
              : completeRoot(root, isYieldy, expirationTime))))
    : ((isYieldy = root.finishedWork),
      null !== isYieldy
        ? completeRoot(root, isYieldy, expirationTime)
        : ((root.finishedWork = null),
          renderRoot(root, !1),
          (isYieldy = root.finishedWork),
          null !== isYieldy && completeRoot(root, isYieldy, expirationTime)));
  isRendering = !1;
}
function completeRoot(root, finishedWork$jscomp$0, expirationTime) {
  var firstBatch = root.firstBatch;
  if (
    null !== firstBatch &&
    firstBatch._expirationTime <= expirationTime &&
    (null === completedBatches
      ? (completedBatches = [firstBatch])
      : completedBatches.push(firstBatch),
    firstBatch._defer)
  ) {
    root.finishedWork = finishedWork$jscomp$0;
    root.expirationTime = 0;
    return;
  }
  root.finishedWork = null;
  isCommitting$1 = isWorking = !0;
  invariant(
    root.current !== finishedWork$jscomp$0,
    "Cannot commit the same tree as before. This is probably a bug related to the return field. This error is likely caused by a bug in React. Please file an issue."
  );
  expirationTime = root.pendingCommitExpirationTime;
  invariant(
    0 !== expirationTime,
    "Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue."
  );
  root.pendingCommitExpirationTime = 0;
  firstBatch = finishedWork$jscomp$0.expirationTime;
  recalculateCurrentTime();
  root.didError = !1;
  if (0 === firstBatch)
    (root.earliestPendingTime = 0),
      (root.latestPendingTime = 0),
      (root.earliestSuspendedTime = 0),
      (root.latestSuspendedTime = 0),
      (root.latestPingedTime = 0);
  else {
    var latestPendingTime = root.latestPendingTime;
    0 !== latestPendingTime &&
      (latestPendingTime < firstBatch
        ? (root.earliestPendingTime = root.latestPendingTime = 0)
        : root.earliestPendingTime < firstBatch &&
          (root.earliestPendingTime = root.latestPendingTime));
    latestPendingTime = root.earliestSuspendedTime;
    0 === latestPendingTime
      ? markPendingPriorityLevel(root, firstBatch)
      : firstBatch > root.latestSuspendedTime
        ? ((root.earliestSuspendedTime = 0),
          (root.latestSuspendedTime = 0),
          (root.latestPingedTime = 0),
          markPendingPriorityLevel(root, firstBatch))
        : firstBatch < latestPendingTime &&
          markPendingPriorityLevel(root, firstBatch);
  }
  findNextPendingPriorityLevel(root);
  ReactCurrentOwner.current = null;
  1 < finishedWork$jscomp$0.effectTag
    ? null !== finishedWork$jscomp$0.lastEffect
      ? ((finishedWork$jscomp$0.lastEffect.nextEffect = finishedWork$jscomp$0),
        (firstBatch = finishedWork$jscomp$0.firstEffect))
      : (firstBatch = finishedWork$jscomp$0)
    : (firstBatch = finishedWork$jscomp$0.firstEffect);
  for (nextEffect = firstBatch; null !== nextEffect; ) {
    latestPendingTime = !1;
    var error = void 0;
    try {
      for (; null !== nextEffect; ) {
        if (nextEffect.effectTag & 256) {
          var current = nextEffect.alternate,
            finishedWork = nextEffect;
          switch (finishedWork.tag) {
            case 2:
              if (finishedWork.effectTag & 256 && null !== current) {
                var prevProps = current.memoizedProps,
                  prevState = current.memoizedState,
                  instance = finishedWork.stateNode;
                instance.props = finishedWork.memoizedProps;
                instance.state = finishedWork.memoizedState;
                var snapshot = instance.getSnapshotBeforeUpdate(
                  prevProps,
                  prevState
                );
                instance.__reactInternalSnapshotBeforeUpdate = snapshot;
              }
              break;
            case 3:
            case 5:
            case 6:
            case 4:
              break;
            default:
              invariant(
                !1,
                "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
              );
          }
        }
        nextEffect = nextEffect.nextEffect;
      }
    } catch (e) {
      (latestPendingTime = !0), (error = e);
    }
    latestPendingTime &&
      (invariant(
        null !== nextEffect,
        "Should have next effect. This error is likely caused by a bug in React. Please file an issue."
      ),
      captureCommitPhaseError(nextEffect, error),
      null !== nextEffect && (nextEffect = nextEffect.nextEffect));
  }
  commitTime = now$1();
  for (nextEffect = firstBatch; null !== nextEffect; ) {
    current = !1;
    prevProps = void 0;
    try {
      for (; null !== nextEffect; ) {
        var effectTag = nextEffect.effectTag;
        if (effectTag & 128) {
          var current$jscomp$0 = nextEffect.alternate;
          if (null !== current$jscomp$0) {
            var currentRef = current$jscomp$0.ref;
            null !== currentRef &&
              ("function" === typeof currentRef
                ? currentRef(null)
                : (currentRef.current = null));
          }
        }
        switch (effectTag & 14) {
          case 2:
            commitPlacement(nextEffect);
            nextEffect.effectTag &= -3;
            break;
          case 6:
            commitPlacement(nextEffect);
            nextEffect.effectTag &= -3;
            commitWork(nextEffect.alternate, nextEffect);
            break;
          case 4:
            commitWork(nextEffect.alternate, nextEffect);
            break;
          case 8:
            (prevState = nextEffect),
              unmountHostComponents(prevState),
              (prevState.return = null),
              (prevState.child = null),
              prevState.alternate &&
                ((prevState.alternate.child = null),
                (prevState.alternate.return = null));
        }
        nextEffect = nextEffect.nextEffect;
      }
    } catch (e) {
      (current = !0), (prevProps = e);
    }
    current &&
      (invariant(
        null !== nextEffect,
        "Should have next effect. This error is likely caused by a bug in React. Please file an issue."
      ),
      captureCommitPhaseError(nextEffect, prevProps),
      null !== nextEffect && (nextEffect = nextEffect.nextEffect));
  }
  root.current = finishedWork$jscomp$0;
  for (nextEffect = firstBatch; null !== nextEffect; ) {
    effectTag = !1;
    current$jscomp$0 = void 0;
    try {
      for (currentRef = expirationTime; null !== nextEffect; ) {
        var effectTag$jscomp$0 = nextEffect.effectTag;
        if (effectTag$jscomp$0 & 36) {
          var current$jscomp$1 = nextEffect.alternate;
          current = nextEffect;
          prevProps = currentRef;
          switch (current.tag) {
            case 2:
              var instance$jscomp$0 = current.stateNode;
              if (current.effectTag & 4)
                if (null === current$jscomp$1)
                  (instance$jscomp$0.props = current.memoizedProps),
                    (instance$jscomp$0.state = current.memoizedState),
                    instance$jscomp$0.componentDidMount();
                else {
                  var prevProps$jscomp$0 = current$jscomp$1.memoizedProps,
                    prevState$jscomp$0 = current$jscomp$1.memoizedState;
                  instance$jscomp$0.props = current.memoizedProps;
                  instance$jscomp$0.state = current.memoizedState;
                  instance$jscomp$0.componentDidUpdate(
                    prevProps$jscomp$0,
                    prevState$jscomp$0,
                    instance$jscomp$0.__reactInternalSnapshotBeforeUpdate
                  );
                }
              var updateQueue = current.updateQueue;
              null !== updateQueue &&
                ((instance$jscomp$0.props = current.memoizedProps),
                (instance$jscomp$0.state = current.memoizedState),
                commitUpdateQueue(
                  current,
                  updateQueue,
                  instance$jscomp$0,
                  prevProps
                ));
              break;
            case 3:
              var _updateQueue = current.updateQueue;
              if (null !== _updateQueue) {
                prevState = null;
                if (null !== current.child)
                  switch (current.child.tag) {
                    case 5:
                      prevState = current.child.stateNode;
                      break;
                    case 2:
                      prevState = current.child.stateNode;
                  }
                commitUpdateQueue(current, _updateQueue, prevState, prevProps);
              }
              break;
            case 5:
              break;
            case 6:
              break;
            case 4:
              break;
            case 15:
              break;
            case 16:
              break;
            default:
              invariant(
                !1,
                "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
              );
          }
        }
        if (effectTag$jscomp$0 & 128) {
          current = void 0;
          var ref = nextEffect.ref;
          if (null !== ref) {
            var instance$jscomp$1 = nextEffect.stateNode;
            switch (nextEffect.tag) {
              case 5:
                current = instance$jscomp$1;
                break;
              default:
                current = instance$jscomp$1;
            }
            "function" === typeof ref ? ref(current) : (ref.current = current);
          }
        }
        var next = nextEffect.nextEffect;
        nextEffect.nextEffect = null;
        nextEffect = next;
      }
    } catch (e) {
      (effectTag = !0), (current$jscomp$0 = e);
    }
    effectTag &&
      (invariant(
        null !== nextEffect,
        "Should have next effect. This error is likely caused by a bug in React. Please file an issue."
      ),
      captureCommitPhaseError(nextEffect, current$jscomp$0),
      null !== nextEffect && (nextEffect = nextEffect.nextEffect));
  }
  totalElapsedPauseTime = 0;
  isWorking = isCommitting$1 = !1;
  "function" === typeof onCommitRoot &&
    onCommitRoot(finishedWork$jscomp$0.stateNode);
  finishedWork$jscomp$0 = root.expirationTime;
  0 === finishedWork$jscomp$0 &&
    (legacyErrorBoundariesThatAlreadyFailed = null);
  root.expirationTime = finishedWork$jscomp$0;
  root.finishedWork = null;
}
function shouldYield() {
  return null === deadline ||
    deadlineDidExpire ||
    deadline.timeRemaining() > timeHeuristicForUnitOfWork
    ? !1
    : (deadlineDidExpire = !0);
}
function onUncaughtError(error) {
  invariant(
    null !== nextFlushedRoot,
    "Should be working on a root. This error is likely caused by a bug in React. Please file an issue."
  );
  nextFlushedRoot.expirationTime = 0;
  hasUnhandledError || ((hasUnhandledError = !0), (unhandledError = error));
}
function updateContainerAtExpirationTime(
  element,
  container,
  parentComponent,
  expirationTime,
  callback
) {
  var current = container.current;
  if (parentComponent) {
    parentComponent = parentComponent._reactInternalFiber;
    var parentContext;
    b: {
      invariant(
        2 === isFiberMountedImpl(parentComponent) && 2 === parentComponent.tag,
        "Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue."
      );
      for (parentContext = parentComponent; 3 !== parentContext.tag; ) {
        if (isContextProvider(parentContext)) {
          parentContext =
            parentContext.stateNode.__reactInternalMemoizedMergedChildContext;
          break b;
        }
        parentContext = parentContext.return;
        invariant(
          parentContext,
          "Found unexpected detached subtree parent. This error is likely caused by a bug in React. Please file an issue."
        );
      }
      parentContext = parentContext.stateNode.context;
    }
    parentComponent = isContextProvider(parentComponent)
      ? processChildContext(parentComponent, parentContext)
      : parentContext;
  } else parentComponent = emptyObject;
  null === container.context
    ? (container.context = parentComponent)
    : (container.pendingContext = parentComponent);
  container = callback;
  callback = createUpdate(expirationTime);
  callback.payload = { element: element };
  container = void 0 === container ? null : container;
  null !== container && (callback.callback = container);
  enqueueUpdate(current, callback, expirationTime);
  scheduleWork(current, expirationTime);
  return expirationTime;
}
function findHostInstance$1(component) {
  var fiber = component._reactInternalFiber;
  void 0 === fiber &&
    ("function" === typeof component.render
      ? invariant(!1, "Unable to find node on an unmounted component.")
      : invariant(
          !1,
          "Argument appears to not be a ReactComponent. Keys: %s",
          Object.keys(component)
        ));
  component = findCurrentHostFiber(fiber);
  return null === component ? null : component.stateNode;
}
function updateContainer(element, container, parentComponent, callback) {
  var current = container.current,
    currentTime = recalculateCurrentTime();
  current = computeExpirationForFiber(currentTime, current);
  return updateContainerAtExpirationTime(
    element,
    container,
    parentComponent,
    current,
    callback
  );
}
function getPublicRootInstance(container) {
  container = container.current;
  if (!container.child) return null;
  switch (container.child.tag) {
    case 5:
      return container.child.stateNode;
    default:
      return container.child.stateNode;
  }
}
function injectIntoDevTools(devToolsConfig) {
  var findFiberByHostInstance = devToolsConfig.findFiberByHostInstance;
  return injectInternals(
    Object.assign({}, devToolsConfig, {
      findHostInstanceByFiber: function(fiber) {
        fiber = findCurrentHostFiber(fiber);
        return null === fiber ? null : fiber.stateNode;
      },
      findFiberByHostInstance: function(instance) {
        return findFiberByHostInstance
          ? findFiberByHostInstance(instance)
          : null;
      }
    })
  );
}
var ReactNativeFiberRenderer = {
  updateContainerAtExpirationTime: updateContainerAtExpirationTime,
  createContainer: function(containerInfo, isAsync, hydrate) {
    return createFiberRoot(containerInfo, isAsync, hydrate);
  },
  updateContainer: updateContainer,
  flushRoot: function(root, expirationTime) {
    invariant(
      !isRendering,
      "work.commit(): Cannot commit while already rendering. This likely means you attempted to commit from inside a lifecycle method."
    );
    nextFlushedRoot = root;
    nextFlushedExpirationTime = expirationTime;
    performWorkOnRoot(root, expirationTime, !1);
    performWork(1, null);
    finishRendering();
  },
  requestWork: requestWork,
  computeUniqueAsyncExpiration: function() {
    var result =
      2 + 25 * ((((recalculateCurrentTime() - 2 + 500) / 25) | 0) + 1);
    result <= lastUniqueAsyncExpiration &&
      (result = lastUniqueAsyncExpiration + 1);
    return (lastUniqueAsyncExpiration = result);
  },
  batchedUpdates: function(fn, a) {
    var previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = !0;
    try {
      return fn(a);
    } finally {
      (isBatchingUpdates = previousIsBatchingUpdates) ||
        isRendering ||
        performWork(1, null);
    }
  },
  unbatchedUpdates: function(fn, a) {
    if (isBatchingUpdates && !isUnbatchingUpdates) {
      isUnbatchingUpdates = !0;
      try {
        return fn(a);
      } finally {
        isUnbatchingUpdates = !1;
      }
    }
    return fn(a);
  },
  deferredUpdates: function(fn) {
    var previousExpirationContext = expirationContext;
    expirationContext =
      2 + 25 * ((((recalculateCurrentTime() - 2 + 500) / 25) | 0) + 1);
    try {
      return fn();
    } finally {
      expirationContext = previousExpirationContext;
    }
  },
  syncUpdates: syncUpdates,
  interactiveUpdates: function(fn, a, b) {
    if (isBatchingInteractiveUpdates) return fn(a, b);
    isBatchingUpdates ||
      isRendering ||
      0 === lowestPendingInteractiveExpirationTime ||
      (performWork(lowestPendingInteractiveExpirationTime, null),
      (lowestPendingInteractiveExpirationTime = 0));
    var previousIsBatchingInteractiveUpdates = isBatchingInteractiveUpdates,
      previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = isBatchingInteractiveUpdates = !0;
    try {
      return fn(a, b);
    } finally {
      (isBatchingInteractiveUpdates = previousIsBatchingInteractiveUpdates),
        (isBatchingUpdates = previousIsBatchingUpdates) ||
          isRendering ||
          performWork(1, null);
    }
  },
  flushInteractiveUpdates: function() {
    isRendering ||
      0 === lowestPendingInteractiveExpirationTime ||
      (performWork(lowestPendingInteractiveExpirationTime, null),
      (lowestPendingInteractiveExpirationTime = 0));
  },
  flushControlled: function(fn) {
    var previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = !0;
    try {
      syncUpdates(fn);
    } finally {
      (isBatchingUpdates = previousIsBatchingUpdates) ||
        isRendering ||
        performWork(1, null);
    }
  },
  flushSync: function(fn, a) {
    invariant(
      !isRendering,
      "flushSync was called from inside a lifecycle method. It cannot be called when React is already rendering."
    );
    var previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = !0;
    try {
      return syncUpdates(fn, a);
    } finally {
      (isBatchingUpdates = previousIsBatchingUpdates), performWork(1, null);
    }
  },
  getPublicRootInstance: getPublicRootInstance,
  findHostInstance: findHostInstance$1,
  findHostInstanceWithNoPortals: function(fiber) {
    fiber = findCurrentHostFiberWithNoPortals(fiber);
    return null === fiber ? null : fiber.stateNode;
  },
  injectIntoDevTools: injectIntoDevTools
};
function createPortal(children, containerInfo, implementation) {
  var key =
    3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
  return {
    $$typeof: REACT_PORTAL_TYPE,
    key: null == key ? null : "" + key,
    children: children,
    containerInfo: containerInfo,
    implementation: implementation
  };
}
function _inherits(subClass, superClass) {
  if ("function" !== typeof superClass && null !== superClass)
    throw new TypeError(
      "Super expression must either be null or a function, not " +
        typeof superClass
    );
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: !1,
      writable: !0,
      configurable: !0
    }
  });
  superClass &&
    (Object.setPrototypeOf
      ? Object.setPrototypeOf(subClass, superClass)
      : (subClass.__proto__ = superClass));
}
var getInspectorDataForViewTag = void 0;
getInspectorDataForViewTag = function() {
  invariant(!1, "getInspectorDataForViewTag() is not available in production");
};
function findNodeHandle(componentOrHandle) {
  if (null == componentOrHandle) return null;
  if ("number" === typeof componentOrHandle) return componentOrHandle;
  if (componentOrHandle._nativeTag) return componentOrHandle._nativeTag;
  if (componentOrHandle.canonical && componentOrHandle.canonical._nativeTag)
    return componentOrHandle.canonical._nativeTag;
  componentOrHandle = findHostInstance$1(componentOrHandle);
  return null == componentOrHandle
    ? componentOrHandle
    : componentOrHandle.canonical
      ? componentOrHandle.canonical._nativeTag
      : componentOrHandle._nativeTag;
}
_batchedUpdates = ReactNativeFiberRenderer.batchedUpdates;
_flushInteractiveUpdates = ReactNativeFiberRenderer.flushInteractiveUpdates;
var roots = new Map(),
  ReactNativeRenderer = {
    NativeComponent: (function(findNodeHandle, findHostInstance) {
      return (function(_React$Component) {
        function ReactNativeComponent() {
          if (!(this instanceof ReactNativeComponent))
            throw new TypeError("Cannot call a class as a function");
          var call = _React$Component.apply(this, arguments);
          if (!this)
            throw new ReferenceError(
              "this hasn't been initialised - super() hasn't been called"
            );
          return !call ||
            ("object" !== typeof call && "function" !== typeof call)
            ? this
            : call;
        }
        _inherits(ReactNativeComponent, _React$Component);
        ReactNativeComponent.prototype.blur = function() {
          TextInputState.blurTextInput(findNodeHandle(this));
        };
        ReactNativeComponent.prototype.focus = function() {
          TextInputState.focusTextInput(findNodeHandle(this));
        };
        ReactNativeComponent.prototype.measure = function(callback) {
          UIManager.measure(
            findNodeHandle(this),
            mountSafeCallback(this, callback)
          );
        };
        ReactNativeComponent.prototype.measureInWindow = function(callback) {
          UIManager.measureInWindow(
            findNodeHandle(this),
            mountSafeCallback(this, callback)
          );
        };
        ReactNativeComponent.prototype.measureLayout = function(
          relativeToNativeNode,
          onSuccess,
          onFail
        ) {
          UIManager.measureLayout(
            findNodeHandle(this),
            relativeToNativeNode,
            mountSafeCallback(this, onFail),
            mountSafeCallback(this, onSuccess)
          );
        };
        ReactNativeComponent.prototype.setNativeProps = function(nativeProps) {
          var maybeInstance = void 0;
          try {
            maybeInstance = findHostInstance(this);
          } catch (error) {}
          if (null != maybeInstance) {
            var viewConfig =
              maybeInstance.viewConfig || maybeInstance.canonical.viewConfig;
            nativeProps = diffProperties(
              null,
              emptyObject$1,
              nativeProps,
              viewConfig.validAttributes
            );
            null != nativeProps &&
              UIManager.updateView(
                maybeInstance._nativeTag,
                viewConfig.uiViewClassName,
                nativeProps
              );
          }
        };
        return ReactNativeComponent;
      })(React.Component);
    })(findNodeHandle, findHostInstance$1),
    findNodeHandle: findNodeHandle,
    render: function(element, containerTag, callback) {
      var root = roots.get(containerTag);
      root ||
        ((root = createFiberRoot(containerTag, !1, !1)),
        roots.set(containerTag, root));
      updateContainer(element, root, null, callback);
      return getPublicRootInstance(root);
    },
    unmountComponentAtNode: function(containerTag) {
      var root = roots.get(containerTag);
      root &&
        updateContainer(null, root, null, function() {
          roots.delete(containerTag);
        });
    },
    unmountComponentAtNodeAndRemoveContainer: function(containerTag) {
      ReactNativeRenderer.unmountComponentAtNode(containerTag);
      UIManager.removeRootView(containerTag);
    },
    createPortal: function(children, containerTag) {
      return createPortal(
        children,
        containerTag,
        null,
        2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null
      );
    },
    unstable_batchedUpdates: batchedUpdates,
    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
      NativeMethodsMixin: (function(findNodeHandle, findHostInstance) {
        return {
          measure: function(callback) {
            UIManager.measure(
              findNodeHandle(this),
              mountSafeCallback(this, callback)
            );
          },
          measureInWindow: function(callback) {
            UIManager.measureInWindow(
              findNodeHandle(this),
              mountSafeCallback(this, callback)
            );
          },
          measureLayout: function(relativeToNativeNode, onSuccess, onFail) {
            UIManager.measureLayout(
              findNodeHandle(this),
              relativeToNativeNode,
              mountSafeCallback(this, onFail),
              mountSafeCallback(this, onSuccess)
            );
          },
          setNativeProps: function(nativeProps) {
            var maybeInstance = void 0;
            try {
              maybeInstance = findHostInstance(this);
            } catch (error) {}
            if (null != maybeInstance) {
              var viewConfig = maybeInstance.viewConfig;
              nativeProps = diffProperties(
                null,
                emptyObject$1,
                nativeProps,
                viewConfig.validAttributes
              );
              null != nativeProps &&
                UIManager.updateView(
                  maybeInstance._nativeTag,
                  viewConfig.uiViewClassName,
                  nativeProps
                );
            }
          },
          focus: function() {
            TextInputState.focusTextInput(findNodeHandle(this));
          },
          blur: function() {
            TextInputState.blurTextInput(findNodeHandle(this));
          }
        };
      })(findNodeHandle, findHostInstance$1),
      computeComponentStackForErrorReporting: function(reactTag) {
        return (reactTag = getInstanceFromTag(reactTag))
          ? getStackAddendumByWorkInProgressFiber(reactTag)
          : "";
      }
    }
  };
injectIntoDevTools({
  findFiberByHostInstance: getInstanceFromTag,
  getInspectorDataForViewTag: getInspectorDataForViewTag,
  bundleType: 0,
  version: "16.4.1",
  rendererPackageName: "react-native-renderer"
});
var ReactNativeRenderer$2 = { default: ReactNativeRenderer },
  ReactNativeRenderer$3 =
    (ReactNativeRenderer$2 && ReactNativeRenderer) || ReactNativeRenderer$2;
module.exports = ReactNativeRenderer$3.default
  ? ReactNativeRenderer$3.default
  : ReactNativeRenderer$3;
