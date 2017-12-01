/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @providesModule ReactNativeRenderer-prod
 * @preventMunge
 */

"use strict";
require("InitializeCore");
var invariant = require("fbjs/lib/invariant"),
  emptyFunction = require("fbjs/lib/emptyFunction"),
  RCTEventEmitter = require("RCTEventEmitter"),
  UIManager = require("UIManager"),
  React = require("react"),
  ExceptionsManager = require("ExceptionsManager"),
  TextInputState = require("TextInputState"),
  deepDiffer = require("deepDiffer"),
  flattenStyle = require("flattenStyle"),
  emptyObject = require("fbjs/lib/emptyObject"),
  shallowEqual = require("fbjs/lib/shallowEqual"),
  ReactErrorUtils = {
    _caughtError: null,
    _hasCaughtError: !1,
    _rethrowError: null,
    _hasRethrowError: !1,
    injection: {
      injectErrorUtils: function(injectedErrorUtils) {
        invariant(
          "function" === typeof injectedErrorUtils.invokeGuardedCallback,
          "Injected invokeGuardedCallback() must be a function."
        );
        invokeGuardedCallback = injectedErrorUtils.invokeGuardedCallback;
      }
    },
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
function invokeGuardedCallback(name, func, context, a, b, c, d, e, f) {
  ReactErrorUtils._hasCaughtError = !1;
  ReactErrorUtils._caughtError = null;
  var funcArgs = Array.prototype.slice.call(arguments, 3);
  try {
    func.apply(context, funcArgs);
  } catch (error) {
    (ReactErrorUtils._caughtError = error),
      (ReactErrorUtils._hasCaughtError = !0);
  }
}
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
function isEndish(topLevelType) {
  return (
    "topMouseUp" === topLevelType ||
    "topTouchEnd" === topLevelType ||
    "topTouchCancel" === topLevelType
  );
}
function isMoveish(topLevelType) {
  return "topMouseMove" === topLevelType || "topTouchMove" === topLevelType;
}
function isStartish(topLevelType) {
  return "topMouseDown" === topLevelType || "topTouchStart" === topLevelType;
}
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
  do inst = inst["return"];
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
  ),
  EventInterface = {
    type: null,
    target: null,
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
    ? emptyFunction.thatReturnsTrue
    : emptyFunction.thatReturnsFalse;
  this.isPropagationStopped = emptyFunction.thatReturnsFalse;
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
      (this.isDefaultPrevented = emptyFunction.thatReturnsTrue));
  },
  stopPropagation: function() {
    var event = this.nativeEvent;
    event &&
      (event.stopPropagation
        ? event.stopPropagation()
        : "unknown" !== typeof event.cancelBubble && (event.cancelBubble = !0),
      (this.isPropagationStopped = emptyFunction.thatReturnsTrue));
  },
  persist: function() {
    this.isPersistent = emptyFunction.thatReturnsTrue;
  },
  isPersistent: emptyFunction.thatReturnsFalse,
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
SyntheticEvent.Interface = EventInterface;
SyntheticEvent.augmentClass = function(Class, Interface) {
  function E() {}
  E.prototype = this.prototype;
  var prototype = new E();
  Object.assign(prototype, Class.prototype);
  Class.prototype = prototype;
  Class.prototype.constructor = Class;
  Class.Interface = Object.assign({}, this.Interface, Interface);
  Class.augmentClass = this.augmentClass;
  addEventPoolingTo(Class);
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
function ResponderSyntheticEvent(
  dispatchConfig,
  dispatchMarker,
  nativeEvent,
  nativeEventTarget
) {
  return SyntheticEvent.call(
    this,
    dispatchConfig,
    dispatchMarker,
    nativeEvent,
    nativeEventTarget
  );
}
SyntheticEvent.augmentClass(ResponderSyntheticEvent, {
  touchHistory: function() {
    return null;
  }
});
var touchBank = [],
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
      isEndish(topLevelType) &&
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
  trackedTouchCount = 0,
  previousActiveTouches = 0;
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
var eventTypes = {
    startShouldSetResponder: {
      phasedRegistrationNames: {
        bubbled: "onStartShouldSetResponder",
        captured: "onStartShouldSetResponderCapture"
      }
    },
    scrollShouldSetResponder: {
      phasedRegistrationNames: {
        bubbled: "onScrollShouldSetResponder",
        captured: "onScrollShouldSetResponderCapture"
      }
    },
    selectionChangeShouldSetResponder: {
      phasedRegistrationNames: {
        bubbled: "onSelectionChangeShouldSetResponder",
        captured: "onSelectionChangeShouldSetResponderCapture"
      }
    },
    moveShouldSetResponder: {
      phasedRegistrationNames: {
        bubbled: "onMoveShouldSetResponder",
        captured: "onMoveShouldSetResponderCapture"
      }
    },
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
  },
  ResponderEventPlugin = {
    _getResponder: function() {
      return responderInst;
    },
    eventTypes: eventTypes,
    extractEvents: function(
      topLevelType,
      targetInst,
      nativeEvent,
      nativeEventTarget
    ) {
      if (isStartish(topLevelType)) trackedTouchCount += 1;
      else if (isEndish(topLevelType))
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
        var shouldSetEventType = isStartish(topLevelType)
          ? eventTypes.startShouldSetResponder
          : isMoveish(topLevelType)
            ? eventTypes.moveShouldSetResponder
            : "topSelectionChange" === topLevelType
              ? eventTypes.selectionChangeShouldSetResponder
              : eventTypes.scrollShouldSetResponder;
        if (responderInst)
          b: {
            var JSCompiler_temp = responderInst;
            for (
              var depthA = 0, tempA = JSCompiler_temp;
              tempA;
              tempA = getParent(tempA)
            )
              depthA++;
            tempA = 0;
            for (var tempB = targetInst; tempB; tempB = getParent(tempB))
              tempA++;
            for (; 0 < depthA - tempA; )
              (JSCompiler_temp = getParent(JSCompiler_temp)), depthA--;
            for (; 0 < tempA - depthA; )
              (targetInst = getParent(targetInst)), tempA--;
            for (; depthA--; ) {
              if (
                JSCompiler_temp === targetInst ||
                JSCompiler_temp === targetInst.alternate
              )
                break b;
              JSCompiler_temp = getParent(JSCompiler_temp);
              targetInst = getParent(targetInst);
            }
            JSCompiler_temp = null;
          }
        else JSCompiler_temp = targetInst;
        targetInst = JSCompiler_temp === responderInst;
        JSCompiler_temp = ResponderSyntheticEvent.getPooled(
          shouldSetEventType,
          JSCompiler_temp,
          nativeEvent,
          nativeEventTarget
        );
        JSCompiler_temp.touchHistory = ResponderTouchHistoryStore.touchHistory;
        targetInst
          ? forEachAccumulated(
              JSCompiler_temp,
              accumulateTwoPhaseDispatchesSingleSkipTarget
            )
          : forEachAccumulated(
              JSCompiler_temp,
              accumulateTwoPhaseDispatchesSingle
            );
        b: {
          shouldSetEventType = JSCompiler_temp._dispatchListeners;
          targetInst = JSCompiler_temp._dispatchInstances;
          if (Array.isArray(shouldSetEventType))
            for (
              depthA = 0;
              depthA < shouldSetEventType.length &&
              !JSCompiler_temp.isPropagationStopped();
              depthA++
            ) {
              if (
                shouldSetEventType[depthA](JSCompiler_temp, targetInst[depthA])
              ) {
                shouldSetEventType = targetInst[depthA];
                break b;
              }
            }
          else if (
            shouldSetEventType &&
            shouldSetEventType(JSCompiler_temp, targetInst)
          ) {
            shouldSetEventType = targetInst;
            break b;
          }
          shouldSetEventType = null;
        }
        JSCompiler_temp._dispatchInstances = null;
        JSCompiler_temp._dispatchListeners = null;
        JSCompiler_temp.isPersistent() ||
          JSCompiler_temp.constructor.release(JSCompiler_temp);
        if (shouldSetEventType && shouldSetEventType !== responderInst)
          if (
            ((JSCompiler_temp = ResponderSyntheticEvent.getPooled(
              eventTypes.responderGrant,
              shouldSetEventType,
              nativeEvent,
              nativeEventTarget
            )),
            (JSCompiler_temp.touchHistory =
              ResponderTouchHistoryStore.touchHistory),
            forEachAccumulated(
              JSCompiler_temp,
              accumulateDirectDispatchesSingle
            ),
            (targetInst = !0 === executeDirectDispatch(JSCompiler_temp)),
            responderInst)
          )
            if (
              ((depthA = ResponderSyntheticEvent.getPooled(
                eventTypes.responderTerminationRequest,
                responderInst,
                nativeEvent,
                nativeEventTarget
              )),
              (depthA.touchHistory = ResponderTouchHistoryStore.touchHistory),
              forEachAccumulated(depthA, accumulateDirectDispatchesSingle),
              (tempA =
                !depthA._dispatchListeners || executeDirectDispatch(depthA)),
              depthA.isPersistent() || depthA.constructor.release(depthA),
              tempA)
            ) {
              depthA = ResponderSyntheticEvent.getPooled(
                eventTypes.responderTerminate,
                responderInst,
                nativeEvent,
                nativeEventTarget
              );
              depthA.touchHistory = ResponderTouchHistoryStore.touchHistory;
              forEachAccumulated(depthA, accumulateDirectDispatchesSingle);
              var JSCompiler_temp$jscomp$0 = accumulate(
                JSCompiler_temp$jscomp$0,
                [JSCompiler_temp, depthA]
              );
              changeResponder(shouldSetEventType, targetInst);
            } else
              (shouldSetEventType = ResponderSyntheticEvent.getPooled(
                eventTypes.responderReject,
                shouldSetEventType,
                nativeEvent,
                nativeEventTarget
              )),
                (shouldSetEventType.touchHistory =
                  ResponderTouchHistoryStore.touchHistory),
                forEachAccumulated(
                  shouldSetEventType,
                  accumulateDirectDispatchesSingle
                ),
                (JSCompiler_temp$jscomp$0 = accumulate(
                  JSCompiler_temp$jscomp$0,
                  shouldSetEventType
                ));
          else
            (JSCompiler_temp$jscomp$0 = accumulate(
              JSCompiler_temp$jscomp$0,
              JSCompiler_temp
            )),
              changeResponder(shouldSetEventType, targetInst);
        else JSCompiler_temp$jscomp$0 = null;
      } else JSCompiler_temp$jscomp$0 = null;
      shouldSetEventType = responderInst && isStartish(topLevelType);
      JSCompiler_temp = responderInst && isMoveish(topLevelType);
      targetInst = responderInst && isEndish(topLevelType);
      if (
        (shouldSetEventType = shouldSetEventType
          ? eventTypes.responderStart
          : JSCompiler_temp
            ? eventTypes.responderMove
            : targetInst ? eventTypes.responderEnd : null)
      )
        (shouldSetEventType = ResponderSyntheticEvent.getPooled(
          shouldSetEventType,
          responderInst,
          nativeEvent,
          nativeEventTarget
        )),
          (shouldSetEventType.touchHistory =
            ResponderTouchHistoryStore.touchHistory),
          forEachAccumulated(
            shouldSetEventType,
            accumulateDirectDispatchesSingle
          ),
          (JSCompiler_temp$jscomp$0 = accumulate(
            JSCompiler_temp$jscomp$0,
            shouldSetEventType
          ));
      shouldSetEventType = responderInst && "topTouchCancel" === topLevelType;
      if (
        (topLevelType =
          responderInst && !shouldSetEventType && isEndish(topLevelType))
      )
        a: {
          if ((topLevelType = nativeEvent.touches) && 0 !== topLevelType.length)
            for (
              JSCompiler_temp = 0;
              JSCompiler_temp < topLevelType.length;
              JSCompiler_temp++
            )
              if (
                ((targetInst = topLevelType[JSCompiler_temp].target),
                null !== targetInst &&
                  void 0 !== targetInst &&
                  0 !== targetInst)
              ) {
                depthA = getInstanceFromNode(targetInst);
                b: {
                  for (targetInst = responderInst; depthA; ) {
                    if (
                      targetInst === depthA ||
                      targetInst === depthA.alternate
                    ) {
                      targetInst = !0;
                      break b;
                    }
                    depthA = getParent(depthA);
                  }
                  targetInst = !1;
                }
                if (targetInst) {
                  topLevelType = !1;
                  break a;
                }
              }
          topLevelType = !0;
        }
      if (
        (topLevelType = shouldSetEventType
          ? eventTypes.responderTerminate
          : topLevelType ? eventTypes.responderRelease : null)
      )
        (nativeEvent = ResponderSyntheticEvent.getPooled(
          topLevelType,
          responderInst,
          nativeEvent,
          nativeEventTarget
        )),
          (nativeEvent.touchHistory = ResponderTouchHistoryStore.touchHistory),
          forEachAccumulated(nativeEvent, accumulateDirectDispatchesSingle),
          (JSCompiler_temp$jscomp$0 = accumulate(
            JSCompiler_temp$jscomp$0,
            nativeEvent
          )),
          changeResponder(null);
      nativeEvent = ResponderTouchHistoryStore.touchHistory.numberActiveTouches;
      if (
        ResponderEventPlugin.GlobalInteractionHandler &&
        nativeEvent !== previousActiveTouches
      )
        ResponderEventPlugin.GlobalInteractionHandler.onChange(nativeEvent);
      previousActiveTouches = nativeEvent;
      return JSCompiler_temp$jscomp$0;
    },
    GlobalResponderHandler: null,
    GlobalInteractionHandler: null,
    injection: {
      injectGlobalResponderHandler: function(GlobalResponderHandler) {
        ResponderEventPlugin.GlobalResponderHandler = GlobalResponderHandler;
      },
      injectGlobalInteractionHandler: function(GlobalInteractionHandler) {
        ResponderEventPlugin.GlobalInteractionHandler = GlobalInteractionHandler;
      }
    }
  },
  customBubblingEventTypes = {},
  customDirectEventTypes = {},
  ReactNativeBridgeEventPlugin = {
    eventTypes: {},
    extractEvents: function(
      topLevelType,
      targetInst,
      nativeEvent,
      nativeEventTarget
    ) {
      var bubbleDispatchConfig = customBubblingEventTypes[topLevelType],
        directDispatchConfig = customDirectEventTypes[topLevelType];
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
    },
    processEventTypes: function(viewConfig) {
      var bubblingEventTypes = viewConfig.bubblingEventTypes;
      viewConfig = viewConfig.directEventTypes;
      if (null != bubblingEventTypes)
        for (var _topLevelType in bubblingEventTypes)
          null == customBubblingEventTypes[_topLevelType] &&
            (ReactNativeBridgeEventPlugin.eventTypes[
              _topLevelType
            ] = customBubblingEventTypes[_topLevelType] =
              bubblingEventTypes[_topLevelType]);
      if (null != viewConfig)
        for (var _topLevelType2 in viewConfig)
          null == customDirectEventTypes[_topLevelType2] &&
            (ReactNativeBridgeEventPlugin.eventTypes[
              _topLevelType2
            ] = customDirectEventTypes[_topLevelType2] =
              viewConfig[_topLevelType2]);
    }
  },
  instanceCache = {},
  instanceProps = {};
function uncacheFiberNode(tag) {
  delete instanceCache[tag];
  delete instanceProps[tag];
}
function getInstanceFromTag(tag) {
  return instanceCache[tag] || null;
}
var ReactNativeComponentTree = Object.freeze({
    precacheFiberNode: function(hostInst, tag) {
      instanceCache[tag] = hostInst;
    },
    uncacheFiberNode: uncacheFiberNode,
    getClosestInstanceFromNode: getInstanceFromTag,
    getInstanceFromNode: getInstanceFromTag,
    getNodeFromInstance: function(inst) {
      inst = inst.stateNode._nativeTag;
      invariant(inst, "All native instances should have a tag.");
      return inst;
    },
    getFiberCurrentPropsFromNode: function(stateNode) {
      return instanceProps[stateNode._nativeTag] || null;
    },
    updateFiberProps: function(tag, props) {
      instanceProps[tag] = props;
    }
  }),
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
function fiberBatchedUpdates(fn, bookkeeping) {
  return fn(bookkeeping);
}
var isNestingBatched = !1;
function batchedUpdates(fn, bookkeeping) {
  if (isNestingBatched) return fiberBatchedUpdates(fn, bookkeeping);
  isNestingBatched = !0;
  try {
    return fiberBatchedUpdates(fn, bookkeeping);
  } finally {
    if (
      ((isNestingBatched = !1),
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
function handleTopLevel(
  topLevelType,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {
  for (var events, i = 0; i < plugins.length; i++) {
    var possiblePlugin = plugins[i];
    possiblePlugin &&
      (possiblePlugin = possiblePlugin.extractEvents(
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget
      )) &&
      (events = accumulateInto(events, possiblePlugin));
  }
  events && (eventQueue = accumulateInto(eventQueue, events));
  topLevelType = eventQueue;
  eventQueue = null;
  topLevelType &&
    (forEachAccumulated(topLevelType, executeDispatchesAndReleaseTopLevel),
    invariant(
      !eventQueue,
      "processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented."
    ),
    ReactErrorUtils.rethrowCaughtError());
}
var ReactNativeTagHandles = {
    tagsStartAt: 1,
    tagCount: 1,
    allocateTag: function() {
      for (; this.reactTagIsNativeTopRootID(ReactNativeTagHandles.tagCount); )
        ReactNativeTagHandles.tagCount++;
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
      return 1 === reactTag % 10;
    }
  },
  EMPTY_NATIVE_EVENT = {};
function _receiveRootNodeIDEvent(rootNodeID, topLevelType, nativeEventParam) {
  var nativeEvent = nativeEventParam || EMPTY_NATIVE_EVENT,
    inst = getInstanceFromTag(rootNodeID);
  batchedUpdates(function() {
    handleTopLevel(topLevelType, inst, nativeEvent, nativeEvent.target);
  });
}
var ReactNativeEventEmitter = Object.freeze({
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
      null === target ||
        void 0 === target ||
        target < ReactNativeTagHandles.tagsStartAt ||
        (index = target);
      _receiveRootNodeIDEvent(index, eventTopLevelType, i);
    }
  },
  handleTopLevel: handleTopLevel
});
RCTEventEmitter.register(ReactNativeEventEmitter);
injection.injectEventPluginOrder([
  "ResponderEventPlugin",
  "ReactNativeBridgeEventPlugin"
]);
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
injection.injectEventPluginsByName({
  ResponderEventPlugin: ResponderEventPlugin,
  ReactNativeBridgeEventPlugin: ReactNativeBridgeEventPlugin
});
function defaultShowDialog() {
  return !0;
}
var showDialog = defaultShowDialog,
  hasSymbol = "function" === typeof Symbol && Symbol["for"],
  REACT_ELEMENT_TYPE = hasSymbol ? Symbol["for"]("react.element") : 60103,
  REACT_CALL_TYPE = hasSymbol ? Symbol["for"]("react.call") : 60104,
  REACT_RETURN_TYPE = hasSymbol ? Symbol["for"]("react.return") : 60105,
  REACT_PORTAL_TYPE = hasSymbol ? Symbol["for"]("react.portal") : 60106,
  REACT_FRAGMENT_TYPE = hasSymbol ? Symbol["for"]("react.fragment") : 60107,
  MAYBE_ITERATOR_SYMBOL = "function" === typeof Symbol && Symbol.iterator;
function getIteratorFn(maybeIterable) {
  if (null === maybeIterable || "undefined" === typeof maybeIterable)
    return null;
  maybeIterable =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable["@@iterator"];
  return "function" === typeof maybeIterable ? maybeIterable : null;
}
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
var TouchHistoryMath = {
    centroidDimension: function(
      touchHistory,
      touchesChangedAfter,
      isXAxis,
      ofCurrent
    ) {
      var touchBank = touchHistory.touchBank,
        total = 0,
        count = 0;
      touchHistory =
        1 === touchHistory.numberActiveTouches
          ? touchHistory.touchBank[touchHistory.indexOfSingleActiveTouch]
          : null;
      if (null !== touchHistory)
        touchHistory.touchActive &&
          touchHistory.currentTimeStamp > touchesChangedAfter &&
          ((total +=
            ofCurrent && isXAxis
              ? touchHistory.currentPageX
              : ofCurrent && !isXAxis
                ? touchHistory.currentPageY
                : !ofCurrent && isXAxis
                  ? touchHistory.previousPageX
                  : touchHistory.previousPageY),
          (count = 1));
      else
        for (
          touchHistory = 0;
          touchHistory < touchBank.length;
          touchHistory++
        ) {
          var touchTrack = touchBank[touchHistory];
          null !== touchTrack &&
            void 0 !== touchTrack &&
            touchTrack.touchActive &&
            touchTrack.currentTimeStamp >= touchesChangedAfter &&
            ((total +=
              ofCurrent && isXAxis
                ? touchTrack.currentPageX
                : ofCurrent && !isXAxis
                  ? touchTrack.currentPageY
                  : !ofCurrent && isXAxis
                    ? touchTrack.previousPageX
                    : touchTrack.previousPageY),
            count++);
        }
      return 0 < count ? total / count : TouchHistoryMath.noCentroid;
    },
    currentCentroidXOfTouchesChangedAfter: function(
      touchHistory,
      touchesChangedAfter
    ) {
      return TouchHistoryMath.centroidDimension(
        touchHistory,
        touchesChangedAfter,
        !0,
        !0
      );
    },
    currentCentroidYOfTouchesChangedAfter: function(
      touchHistory,
      touchesChangedAfter
    ) {
      return TouchHistoryMath.centroidDimension(
        touchHistory,
        touchesChangedAfter,
        !1,
        !0
      );
    },
    previousCentroidXOfTouchesChangedAfter: function(
      touchHistory,
      touchesChangedAfter
    ) {
      return TouchHistoryMath.centroidDimension(
        touchHistory,
        touchesChangedAfter,
        !0,
        !1
      );
    },
    previousCentroidYOfTouchesChangedAfter: function(
      touchHistory,
      touchesChangedAfter
    ) {
      return TouchHistoryMath.centroidDimension(
        touchHistory,
        touchesChangedAfter,
        !1,
        !1
      );
    },
    currentCentroidX: function(touchHistory) {
      return TouchHistoryMath.centroidDimension(touchHistory, 0, !0, !0);
    },
    currentCentroidY: function(touchHistory) {
      return TouchHistoryMath.centroidDimension(touchHistory, 0, !1, !0);
    },
    noCentroid: -1
  },
  ReactCurrentOwner =
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
  ReactGlobalSharedState = Object.freeze({
    ReactCurrentOwner: ReactCurrentOwner,
    ReactDebugCurrentFrame: null
  }),
  objects = {},
  uniqueID = 1,
  emptyObject$2 = {},
  ReactNativePropRegistry = (function() {
    function ReactNativePropRegistry() {
      if (!(this instanceof ReactNativePropRegistry))
        throw new TypeError("Cannot call a class as a function");
    }
    ReactNativePropRegistry.register = function(object) {
      var id = ++uniqueID;
      objects[id] = object;
      return id;
    };
    ReactNativePropRegistry.getByID = function(id) {
      if (!id) return emptyObject$2;
      var object = objects[id];
      return object
        ? object
        : (console.warn("Invalid style with id `" + id + "`. Skipping ..."),
          emptyObject$2);
    };
    return ReactNativePropRegistry;
  })(),
  emptyObject$1 = {},
  removedKeys = null,
  removedKeyCount = 0;
function resolveObject(idOrObject) {
  return "number" === typeof idOrObject
    ? ReactNativePropRegistry.getByID(idOrObject)
    : idOrObject;
}
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
    for (i in ((node = resolveObject(node)), removedKeys))
      if (removedKeys[i]) {
        var nextProp = node[i];
        if (void 0 !== nextProp) {
          var attributeConfig = validAttributes[i];
          if (attributeConfig) {
            "function" === typeof nextProp && (nextProp = !0);
            "undefined" === typeof nextProp && (nextProp = null);
            if ("object" !== typeof attributeConfig)
              updatePayload[i] = nextProp;
            else if (
              "function" === typeof attributeConfig.diff ||
              "function" === typeof attributeConfig.process
            )
              (nextProp =
                "function" === typeof attributeConfig.process
                  ? attributeConfig.process(nextProp)
                  : nextProp),
                (updatePayload[i] = nextProp);
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
    return diffProperties(
      updatePayload,
      resolveObject(prevProp),
      resolveObject(nextProp),
      validAttributes
    );
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
        resolveObject(nextProp),
        validAttributes
      )
    : diffProperties(
        updatePayload,
        resolveObject(prevProp),
        flattenStyle(nextProp),
        validAttributes
      );
}
function addNestedProperty(updatePayload, nextProp, validAttributes) {
  if (!nextProp) return updatePayload;
  if (!Array.isArray(nextProp))
    return (
      (nextProp = resolveObject(nextProp)),
      diffProperties(updatePayload, emptyObject$1, nextProp, validAttributes)
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
    return (
      (prevProp = resolveObject(prevProp)),
      diffProperties(updatePayload, prevProp, emptyObject$1, validAttributes)
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
  for (propKey in prevProps)
    void 0 === nextProps[propKey] &&
      (!(attributeConfig = validAttributes[propKey]) ||
        (updatePayload && void 0 !== updatePayload[propKey]) ||
        ((prevProp = prevProps[propKey]),
        void 0 !== prevProp &&
          ("object" !== typeof attributeConfig ||
          "function" === typeof attributeConfig.diff ||
          "function" === typeof attributeConfig.process
            ? (((updatePayload || (updatePayload = {}))[propKey] = null),
              removedKeys || (removedKeys = {}),
              removedKeys[propKey] ||
                ((removedKeys[propKey] = !0), removedKeyCount++))
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
function getComponentName(fiber) {
  fiber = fiber.type;
  return "string" === typeof fiber
    ? fiber
    : "function" === typeof fiber ? fiber.displayName || fiber.name : null;
}
var debugRenderPhaseSideEffects = require("ReactFeatureFlags")
  .debugRenderPhaseSideEffects;
function isFiberMountedImpl(fiber) {
  var node = fiber;
  if (fiber.alternate) for (; node["return"]; ) node = node["return"];
  else {
    if (0 !== (node.effectTag & 2)) return 1;
    for (; node["return"]; )
      if (((node = node["return"]), 0 !== (node.effectTag & 2))) return 1;
  }
  return 3 === node.tag ? 2 : 3;
}
function isMounted(component) {
  return (component = component._reactInternalFiber)
    ? 2 === isFiberMountedImpl(component)
    : !1;
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
    var parentA = a["return"],
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
    if (a["return"] !== b["return"]) (a = parentA), (b = parentB);
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
    if (node.child) (node.child["return"] = node), (node = node.child);
    else {
      if (node === parent) break;
      for (; !node.sibling; ) {
        if (!node["return"] || node["return"] === parent) return null;
        node = node["return"];
      }
      node.sibling["return"] = node["return"];
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
      (node.child["return"] = node), (node = node.child);
    else {
      if (node === parent) break;
      for (; !node.sibling; ) {
        if (!node["return"] || node["return"] === parent) return null;
        node = node["return"];
      }
      node.sibling["return"] = node["return"];
      node = node.sibling;
    }
  }
  return null;
}
var valueStack = [],
  index = -1;
function pop(cursor) {
  0 > index ||
    ((cursor.current = valueStack[index]), (valueStack[index] = null), index--);
}
function push(cursor, value) {
  index++;
  valueStack[index] = cursor.current;
  cursor.current = value;
}
new Set();
var contextStackCursor = { current: emptyObject },
  didPerformWorkStackCursor = { current: !1 },
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
function pushTopLevelContextObject(fiber, context, didChange) {
  invariant(
    null == contextStackCursor.cursor,
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
function FiberNode(tag, pendingProps, key, internalContextTag) {
  this.tag = tag;
  this.key = key;
  this.stateNode = this.type = null;
  this.sibling = this.child = this["return"] = null;
  this.index = 0;
  this.ref = null;
  this.pendingProps = pendingProps;
  this.memoizedState = this.updateQueue = this.memoizedProps = null;
  this.internalContextTag = internalContextTag;
  this.effectTag = 0;
  this.lastEffect = this.firstEffect = this.nextEffect = null;
  this.expirationTime = 0;
  this.alternate = null;
}
function createFiber(tag, pendingProps, key, internalContextTag) {
  return new FiberNode(tag, pendingProps, key, internalContextTag);
}
function createWorkInProgress(current, pendingProps, expirationTime) {
  var workInProgress = current.alternate;
  null === workInProgress
    ? ((workInProgress = createFiber(
        current.tag,
        pendingProps,
        current.key,
        current.internalContextTag
      )),
      (workInProgress.type = current.type),
      (workInProgress.stateNode = current.stateNode),
      (workInProgress.alternate = current),
      (current.alternate = workInProgress))
    : ((workInProgress.pendingProps = pendingProps),
      (workInProgress.effectTag = 0),
      (workInProgress.nextEffect = null),
      (workInProgress.firstEffect = null),
      (workInProgress.lastEffect = null));
  workInProgress.expirationTime = expirationTime;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;
  return workInProgress;
}
function createFiberFromElement(element, internalContextTag, expirationTime) {
  var fiber = void 0,
    type = element.type,
    key = element.key;
  element = element.props;
  "function" === typeof type
    ? ((fiber =
        type.prototype && type.prototype.isReactComponent
          ? createFiber(2, element, key, internalContextTag)
          : createFiber(0, element, key, internalContextTag)),
      (fiber.type = type))
    : "string" === typeof type
      ? ((fiber = createFiber(5, element, key, internalContextTag)),
        (fiber.type = type))
      : "object" === typeof type &&
        null !== type &&
        "number" === typeof type.tag
        ? ((fiber = type), (fiber.pendingProps = element))
        : invariant(
            !1,
            "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s",
            null == type ? type : typeof type,
            ""
          );
  fiber.expirationTime = expirationTime;
  return fiber;
}
function createFiberFromFragment(
  elements,
  internalContextTag,
  expirationTime,
  key
) {
  elements = createFiber(10, elements, key, internalContextTag);
  elements.expirationTime = expirationTime;
  return elements;
}
function createFiberFromText(content, internalContextTag, expirationTime) {
  content = createFiber(6, content, null, internalContextTag);
  content.expirationTime = expirationTime;
  return content;
}
function createFiberFromCall(call, internalContextTag, expirationTime) {
  internalContextTag = createFiber(7, call, call.key, internalContextTag);
  internalContextTag.type = call.handler;
  internalContextTag.expirationTime = expirationTime;
  return internalContextTag;
}
function createFiberFromReturn(returnNode, internalContextTag, expirationTime) {
  returnNode = createFiber(9, null, null, internalContextTag);
  returnNode.expirationTime = expirationTime;
  return returnNode;
}
function createFiberFromPortal(portal, internalContextTag, expirationTime) {
  internalContextTag = createFiber(
    4,
    null !== portal.children ? portal.children : [],
    portal.key,
    internalContextTag
  );
  internalContextTag.expirationTime = expirationTime;
  internalContextTag.stateNode = {
    containerInfo: portal.containerInfo,
    pendingChildren: null,
    implementation: portal.implementation
  };
  return internalContextTag;
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
function createUpdateQueue(baseState) {
  return {
    baseState: baseState,
    expirationTime: 0,
    first: null,
    last: null,
    callbackList: null,
    hasForceUpdate: !1,
    isInitialized: !1
  };
}
function insertUpdateIntoQueue(queue, update) {
  null === queue.last
    ? (queue.first = queue.last = update)
    : ((queue.last.next = update), (queue.last = update));
  if (
    0 === queue.expirationTime ||
    queue.expirationTime > update.expirationTime
  )
    queue.expirationTime = update.expirationTime;
}
function insertUpdateIntoFiber(fiber, update) {
  var alternateFiber = fiber.alternate,
    queue1 = fiber.updateQueue;
  null === queue1 && (queue1 = fiber.updateQueue = createUpdateQueue(null));
  null !== alternateFiber
    ? ((fiber = alternateFiber.updateQueue),
      null === fiber &&
        (fiber = alternateFiber.updateQueue = createUpdateQueue(null)))
    : (fiber = null);
  fiber = fiber !== queue1 ? fiber : null;
  null === fiber
    ? insertUpdateIntoQueue(queue1, update)
    : null === queue1.last || null === fiber.last
      ? (insertUpdateIntoQueue(queue1, update),
        insertUpdateIntoQueue(fiber, update))
      : (insertUpdateIntoQueue(queue1, update), (fiber.last = update));
}
function getStateFromUpdate(update, instance, prevState, props) {
  update = update.partialState;
  return "function" === typeof update
    ? (debugRenderPhaseSideEffects && update.call(instance, prevState, props),
      update.call(instance, prevState, props))
    : update;
}
function processUpdateQueue(
  current,
  workInProgress,
  queue,
  instance,
  props,
  renderExpirationTime
) {
  null !== current &&
    current.updateQueue === queue &&
    (queue = workInProgress.updateQueue = {
      baseState: queue.baseState,
      expirationTime: queue.expirationTime,
      first: queue.first,
      last: queue.last,
      isInitialized: queue.isInitialized,
      callbackList: null,
      hasForceUpdate: !1
    });
  queue.expirationTime = 0;
  queue.isInitialized
    ? (current = queue.baseState)
    : ((current = queue.baseState = workInProgress.memoizedState),
      (queue.isInitialized = !0));
  for (
    var dontMutatePrevState = !0, update = queue.first, didSkip = !1;
    null !== update;

  ) {
    var updateExpirationTime = update.expirationTime;
    if (updateExpirationTime > renderExpirationTime) {
      var remainingExpirationTime = queue.expirationTime;
      if (
        0 === remainingExpirationTime ||
        remainingExpirationTime > updateExpirationTime
      )
        queue.expirationTime = updateExpirationTime;
      didSkip || ((didSkip = !0), (queue.baseState = current));
    } else {
      didSkip ||
        ((queue.first = update.next),
        null === queue.first && (queue.last = null));
      if (update.isReplace)
        (current = getStateFromUpdate(update, instance, current, props)),
          (dontMutatePrevState = !0);
      else if (
        (updateExpirationTime = getStateFromUpdate(
          update,
          instance,
          current,
          props
        ))
      )
        (current = dontMutatePrevState
          ? Object.assign({}, current, updateExpirationTime)
          : Object.assign(current, updateExpirationTime)),
          (dontMutatePrevState = !1);
      update.isForced && (queue.hasForceUpdate = !0);
      null !== update.callback &&
        ((updateExpirationTime = queue.callbackList),
        null === updateExpirationTime &&
          (updateExpirationTime = queue.callbackList = []),
        updateExpirationTime.push(update));
    }
    update = update.next;
  }
  null !== queue.callbackList
    ? (workInProgress.effectTag |= 32)
    : null !== queue.first ||
      queue.hasForceUpdate ||
      (workInProgress.updateQueue = null);
  didSkip || (queue.baseState = current);
  return current;
}
function commitCallbacks(queue, context) {
  var callbackList = queue.callbackList;
  if (null !== callbackList)
    for (
      queue.callbackList = null, queue = 0;
      queue < callbackList.length;
      queue++
    ) {
      var update = callbackList[queue],
        _callback = update.callback;
      update.callback = null;
      invariant(
        "function" === typeof _callback,
        "Invalid argument passed as callback. Expected a function. Instead received: %s",
        _callback
      );
      _callback.call(context);
    }
}
function ReactFiberClassComponent(
  scheduleWork,
  computeExpirationForFiber,
  memoizeProps,
  memoizeState
) {
  function adoptClassInstance(workInProgress, instance) {
    instance.updater = updater;
    workInProgress.stateNode = instance;
    instance._reactInternalFiber = workInProgress;
  }
  var updater = {
    isMounted: isMounted,
    enqueueSetState: function(instance, partialState, callback) {
      instance = instance._reactInternalFiber;
      callback = void 0 === callback ? null : callback;
      var expirationTime = computeExpirationForFiber(instance);
      insertUpdateIntoFiber(instance, {
        expirationTime: expirationTime,
        partialState: partialState,
        callback: callback,
        isReplace: !1,
        isForced: !1,
        nextCallback: null,
        next: null
      });
      scheduleWork(instance, expirationTime);
    },
    enqueueReplaceState: function(instance, state, callback) {
      instance = instance._reactInternalFiber;
      callback = void 0 === callback ? null : callback;
      var expirationTime = computeExpirationForFiber(instance);
      insertUpdateIntoFiber(instance, {
        expirationTime: expirationTime,
        partialState: state,
        callback: callback,
        isReplace: !0,
        isForced: !1,
        nextCallback: null,
        next: null
      });
      scheduleWork(instance, expirationTime);
    },
    enqueueForceUpdate: function(instance, callback) {
      instance = instance._reactInternalFiber;
      callback = void 0 === callback ? null : callback;
      var expirationTime = computeExpirationForFiber(instance);
      insertUpdateIntoFiber(instance, {
        expirationTime: expirationTime,
        partialState: null,
        callback: callback,
        isReplace: !1,
        isForced: !0,
        nextCallback: null,
        next: null
      });
      scheduleWork(instance, expirationTime);
    }
  };
  return {
    adoptClassInstance: adoptClassInstance,
    constructClassInstance: function(workInProgress, props) {
      var ctor = workInProgress.type,
        unmaskedContext = getUnmaskedContext(workInProgress),
        needsContext =
          2 === workInProgress.tag && null != workInProgress.type.contextTypes,
        context = needsContext
          ? getMaskedContext(workInProgress, unmaskedContext)
          : emptyObject;
      props = new ctor(props, context);
      adoptClassInstance(workInProgress, props);
      needsContext &&
        ((workInProgress = workInProgress.stateNode),
        (workInProgress.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext),
        (workInProgress.__reactInternalMemoizedMaskedChildContext = context));
      return props;
    },
    mountClassInstance: function(workInProgress, renderExpirationTime) {
      var current = workInProgress.alternate,
        instance = workInProgress.stateNode,
        state = instance.state || null,
        props = workInProgress.pendingProps,
        unmaskedContext = getUnmaskedContext(workInProgress);
      instance.props = props;
      instance.state = workInProgress.memoizedState = state;
      instance.refs = emptyObject;
      instance.context = getMaskedContext(workInProgress, unmaskedContext);
      null != workInProgress.type &&
        null != workInProgress.type.prototype &&
        !0 === workInProgress.type.prototype.unstable_isAsyncReactComponent &&
        (workInProgress.internalContextTag |= 1);
      "function" === typeof instance.componentWillMount &&
        ((state = instance.state),
        instance.componentWillMount(),
        debugRenderPhaseSideEffects && instance.componentWillMount(),
        state !== instance.state &&
          updater.enqueueReplaceState(instance, instance.state, null),
        (state = workInProgress.updateQueue),
        null !== state &&
          (instance.state = processUpdateQueue(
            current,
            workInProgress,
            state,
            instance,
            props,
            renderExpirationTime
          )));
      "function" === typeof instance.componentDidMount &&
        (workInProgress.effectTag |= 4);
    },
    updateClassInstance: function(
      current,
      workInProgress,
      renderExpirationTime
    ) {
      var instance = workInProgress.stateNode;
      instance.props = workInProgress.memoizedProps;
      instance.state = workInProgress.memoizedState;
      var oldProps = workInProgress.memoizedProps,
        newProps = workInProgress.pendingProps,
        oldContext = instance.context,
        newUnmaskedContext = getUnmaskedContext(workInProgress);
      newUnmaskedContext = getMaskedContext(workInProgress, newUnmaskedContext);
      "function" !== typeof instance.componentWillReceiveProps ||
        (oldProps === newProps && oldContext === newUnmaskedContext) ||
        ((oldContext = instance.state),
        instance.componentWillReceiveProps(newProps, newUnmaskedContext),
        debugRenderPhaseSideEffects &&
          instance.componentWillReceiveProps(newProps, newUnmaskedContext),
        instance.state !== oldContext &&
          updater.enqueueReplaceState(instance, instance.state, null));
      oldContext = workInProgress.memoizedState;
      renderExpirationTime =
        null !== workInProgress.updateQueue
          ? processUpdateQueue(
              current,
              workInProgress,
              workInProgress.updateQueue,
              instance,
              newProps,
              renderExpirationTime
            )
          : oldContext;
      if (
        !(
          oldProps !== newProps ||
          oldContext !== renderExpirationTime ||
          didPerformWorkStackCursor.current ||
          (null !== workInProgress.updateQueue &&
            workInProgress.updateQueue.hasForceUpdate)
        )
      )
        return (
          "function" !== typeof instance.componentDidUpdate ||
            (oldProps === current.memoizedProps &&
              oldContext === current.memoizedState) ||
            (workInProgress.effectTag |= 4),
          !1
        );
      if (
        null === oldProps ||
        (null !== workInProgress.updateQueue &&
          workInProgress.updateQueue.hasForceUpdate)
      )
        var shouldUpdate = !0;
      else {
        shouldUpdate = workInProgress.stateNode;
        var type = workInProgress.type;
        "function" === typeof shouldUpdate.shouldComponentUpdate
          ? ((type = shouldUpdate.shouldComponentUpdate(
              newProps,
              renderExpirationTime,
              newUnmaskedContext
            )),
            debugRenderPhaseSideEffects &&
              shouldUpdate.shouldComponentUpdate(
                newProps,
                renderExpirationTime,
                newUnmaskedContext
              ),
            (shouldUpdate = type))
          : (shouldUpdate =
              type.prototype && type.prototype.isPureReactComponent
                ? !shallowEqual(oldProps, newProps) ||
                  !shallowEqual(oldContext, renderExpirationTime)
                : !0);
      }
      shouldUpdate
        ? ("function" === typeof instance.componentWillUpdate &&
            (instance.componentWillUpdate(
              newProps,
              renderExpirationTime,
              newUnmaskedContext
            ),
            debugRenderPhaseSideEffects &&
              instance.componentWillUpdate(
                newProps,
                renderExpirationTime,
                newUnmaskedContext
              )),
          "function" === typeof instance.componentDidUpdate &&
            (workInProgress.effectTag |= 4))
        : ("function" !== typeof instance.componentDidUpdate ||
            (oldProps === current.memoizedProps &&
              oldContext === current.memoizedState) ||
            (workInProgress.effectTag |= 4),
          memoizeProps(workInProgress, newProps),
          memoizeState(workInProgress, renderExpirationTime));
      instance.props = newProps;
      instance.state = renderExpirationTime;
      instance.context = newUnmaskedContext;
      return shouldUpdate;
    }
  };
}
var isArray$1 = Array.isArray;
function coerceRef(current, element) {
  var mixedRef = element.ref;
  if (null !== mixedRef && "function" !== typeof mixedRef) {
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
        mixedRef
      );
      var stringRef = "" + mixedRef;
      if (
        null !== current &&
        null !== current.ref &&
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
      "string" === typeof mixedRef,
      "Expected ref to be a function or a string."
    );
    invariant(
      element._owner,
      "Element ref was specified as a string (%s) but no owner was set. You may have multiple copies of React loaded. (details: https://fb.me/react-refs-must-have-owner).",
      mixedRef
    );
  }
  return mixedRef;
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
          returnFiber.internalContextTag,
          expirationTime
        )),
        (current["return"] = returnFiber),
        current
      );
    current = useFiber(current, textContent, expirationTime);
    current["return"] = returnFiber;
    return current;
  }
  function updateElement(returnFiber, current, element, expirationTime) {
    if (null !== current && current.type === element.type)
      return (
        (expirationTime = useFiber(current, element.props, expirationTime)),
        (expirationTime.ref = coerceRef(current, element)),
        (expirationTime["return"] = returnFiber),
        expirationTime
      );
    expirationTime = createFiberFromElement(
      element,
      returnFiber.internalContextTag,
      expirationTime
    );
    expirationTime.ref = coerceRef(current, element);
    expirationTime["return"] = returnFiber;
    return expirationTime;
  }
  function updateCall(returnFiber, current, call, expirationTime) {
    if (null === current || 7 !== current.tag)
      return (
        (current = createFiberFromCall(
          call,
          returnFiber.internalContextTag,
          expirationTime
        )),
        (current["return"] = returnFiber),
        current
      );
    current = useFiber(current, call, expirationTime);
    current["return"] = returnFiber;
    return current;
  }
  function updateReturn(returnFiber, current, returnNode, expirationTime) {
    if (null === current || 9 !== current.tag)
      return (
        (current = createFiberFromReturn(
          returnNode,
          returnFiber.internalContextTag,
          expirationTime
        )),
        (current.type = returnNode.value),
        (current["return"] = returnFiber),
        current
      );
    current = useFiber(current, null, expirationTime);
    current.type = returnNode.value;
    current["return"] = returnFiber;
    return current;
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
          returnFiber.internalContextTag,
          expirationTime
        )),
        (current["return"] = returnFiber),
        current
      );
    current = useFiber(current, portal.children || [], expirationTime);
    current["return"] = returnFiber;
    return current;
  }
  function updateFragment(returnFiber, current, fragment, expirationTime, key) {
    if (null === current || 10 !== current.tag)
      return (
        (current = createFiberFromFragment(
          fragment,
          returnFiber.internalContextTag,
          expirationTime,
          key
        )),
        (current["return"] = returnFiber),
        current
      );
    current = useFiber(current, fragment, expirationTime);
    current["return"] = returnFiber;
    return current;
  }
  function createChild(returnFiber, newChild, expirationTime) {
    if ("string" === typeof newChild || "number" === typeof newChild)
      return (
        (newChild = createFiberFromText(
          "" + newChild,
          returnFiber.internalContextTag,
          expirationTime
        )),
        (newChild["return"] = returnFiber),
        newChild
      );
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (newChild.type === REACT_FRAGMENT_TYPE)
            return (
              (newChild = createFiberFromFragment(
                newChild.props.children,
                returnFiber.internalContextTag,
                expirationTime,
                newChild.key
              )),
              (newChild["return"] = returnFiber),
              newChild
            );
          expirationTime = createFiberFromElement(
            newChild,
            returnFiber.internalContextTag,
            expirationTime
          );
          expirationTime.ref = coerceRef(null, newChild);
          expirationTime["return"] = returnFiber;
          return expirationTime;
        case REACT_CALL_TYPE:
          return (
            (newChild = createFiberFromCall(
              newChild,
              returnFiber.internalContextTag,
              expirationTime
            )),
            (newChild["return"] = returnFiber),
            newChild
          );
        case REACT_RETURN_TYPE:
          return (
            (expirationTime = createFiberFromReturn(
              newChild,
              returnFiber.internalContextTag,
              expirationTime
            )),
            (expirationTime.type = newChild.value),
            (expirationTime["return"] = returnFiber),
            expirationTime
          );
        case REACT_PORTAL_TYPE:
          return (
            (newChild = createFiberFromPortal(
              newChild,
              returnFiber.internalContextTag,
              expirationTime
            )),
            (newChild["return"] = returnFiber),
            newChild
          );
      }
      if (isArray$1(newChild) || getIteratorFn(newChild))
        return (
          (newChild = createFiberFromFragment(
            newChild,
            returnFiber.internalContextTag,
            expirationTime,
            null
          )),
          (newChild["return"] = returnFiber),
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
        case REACT_CALL_TYPE:
          return newChild.key === key
            ? updateCall(returnFiber, oldFiber, newChild, expirationTime)
            : null;
        case REACT_RETURN_TYPE:
          return null === key
            ? updateReturn(returnFiber, oldFiber, newChild, expirationTime)
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
        case REACT_CALL_TYPE:
          return (
            (existingChildren =
              existingChildren.get(
                null === newChild.key ? newIdx : newChild.key
              ) || null),
            updateCall(returnFiber, existingChildren, newChild, expirationTime)
          );
        case REACT_RETURN_TYPE:
          return (
            (existingChildren = existingChildren.get(newIdx) || null),
            updateReturn(
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
      ) {
        if (shouldTrackSideEffects && null !== nextOldFiber.alternate)
          oldFiber["delete"](
            null === nextOldFiber.key ? newIdx : nextOldFiber.key
          );
        currentFirstChild = placeChild(nextOldFiber, currentFirstChild, newIdx);
        null === previousNewFiber
          ? (resultingFirstChild = nextOldFiber)
          : (previousNewFiber.sibling = nextOldFiber);
        previousNewFiber = nextOldFiber;
      }
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
      if (
        ((step = updateFromMap(
          oldFiber,
          returnFiber,
          newIdx,
          step.value,
          expirationTime
        )),
        null !== step)
      ) {
        if (shouldTrackSideEffects && null !== step.alternate)
          oldFiber["delete"](null === step.key ? newIdx : step.key);
        currentFirstChild = placeChild(step, currentFirstChild, newIdx);
        null === previousNewFiber
          ? (iteratorFn = step)
          : (previousNewFiber.sibling = step);
        previousNewFiber = step;
      }
    shouldTrackSideEffects &&
      oldFiber.forEach(function(child) {
        return deleteChild(returnFiber, child);
      });
    return iteratorFn;
  }
  return function(returnFiber, currentFirstChild, newChild, expirationTime) {
    "object" === typeof newChild &&
      null !== newChild &&
      newChild.type === REACT_FRAGMENT_TYPE &&
      null === newChild.key &&
      (newChild = newChild.props.children);
    var isObject = "object" === typeof newChild && null !== newChild;
    if (isObject)
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          a: {
            var key = newChild.key;
            for (isObject = currentFirstChild; null !== isObject; ) {
              if (isObject.key === key)
                if (
                  10 === isObject.tag
                    ? newChild.type === REACT_FRAGMENT_TYPE
                    : isObject.type === newChild.type
                ) {
                  deleteRemainingChildren(returnFiber, isObject.sibling);
                  currentFirstChild = useFiber(
                    isObject,
                    newChild.type === REACT_FRAGMENT_TYPE
                      ? newChild.props.children
                      : newChild.props,
                    expirationTime
                  );
                  currentFirstChild.ref = coerceRef(isObject, newChild);
                  currentFirstChild["return"] = returnFiber;
                  returnFiber = currentFirstChild;
                  break a;
                } else {
                  deleteRemainingChildren(returnFiber, isObject);
                  break;
                }
              else deleteChild(returnFiber, isObject);
              isObject = isObject.sibling;
            }
            newChild.type === REACT_FRAGMENT_TYPE
              ? ((currentFirstChild = createFiberFromFragment(
                  newChild.props.children,
                  returnFiber.internalContextTag,
                  expirationTime,
                  newChild.key
                )),
                (currentFirstChild["return"] = returnFiber),
                (returnFiber = currentFirstChild))
              : ((expirationTime = createFiberFromElement(
                  newChild,
                  returnFiber.internalContextTag,
                  expirationTime
                )),
                (expirationTime.ref = coerceRef(currentFirstChild, newChild)),
                (expirationTime["return"] = returnFiber),
                (returnFiber = expirationTime));
          }
          return placeSingleChild(returnFiber);
        case REACT_CALL_TYPE:
          a: {
            for (isObject = newChild.key; null !== currentFirstChild; ) {
              if (currentFirstChild.key === isObject)
                if (7 === currentFirstChild.tag) {
                  deleteRemainingChildren(
                    returnFiber,
                    currentFirstChild.sibling
                  );
                  currentFirstChild = useFiber(
                    currentFirstChild,
                    newChild,
                    expirationTime
                  );
                  currentFirstChild["return"] = returnFiber;
                  returnFiber = currentFirstChild;
                  break a;
                } else {
                  deleteRemainingChildren(returnFiber, currentFirstChild);
                  break;
                }
              else deleteChild(returnFiber, currentFirstChild);
              currentFirstChild = currentFirstChild.sibling;
            }
            currentFirstChild = createFiberFromCall(
              newChild,
              returnFiber.internalContextTag,
              expirationTime
            );
            currentFirstChild["return"] = returnFiber;
            returnFiber = currentFirstChild;
          }
          return placeSingleChild(returnFiber);
        case REACT_RETURN_TYPE:
          a: {
            if (null !== currentFirstChild)
              if (9 === currentFirstChild.tag) {
                deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
                currentFirstChild = useFiber(
                  currentFirstChild,
                  null,
                  expirationTime
                );
                currentFirstChild.type = newChild.value;
                currentFirstChild["return"] = returnFiber;
                returnFiber = currentFirstChild;
                break a;
              } else deleteRemainingChildren(returnFiber, currentFirstChild);
            currentFirstChild = createFiberFromReturn(
              newChild,
              returnFiber.internalContextTag,
              expirationTime
            );
            currentFirstChild.type = newChild.value;
            currentFirstChild["return"] = returnFiber;
            returnFiber = currentFirstChild;
          }
          return placeSingleChild(returnFiber);
        case REACT_PORTAL_TYPE:
          a: {
            for (isObject = newChild.key; null !== currentFirstChild; ) {
              if (currentFirstChild.key === isObject)
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
                  currentFirstChild["return"] = returnFiber;
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
              returnFiber.internalContextTag,
              expirationTime
            );
            currentFirstChild["return"] = returnFiber;
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
            )))
          : (deleteRemainingChildren(returnFiber, currentFirstChild),
            (currentFirstChild = createFiberFromText(
              newChild,
              returnFiber.internalContextTag,
              expirationTime
            ))),
        (currentFirstChild["return"] = returnFiber),
        (returnFiber = currentFirstChild),
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
    if ("undefined" === typeof newChild)
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
  mountChildFibers = ChildReconciler(!1);
function ReactFiberBeginWork(
  config,
  hostContext,
  hydrationContext,
  scheduleWork,
  computeExpirationForFiber
) {
  function reconcileChildren(current, workInProgress, nextChildren) {
    var renderExpirationTime = workInProgress.expirationTime;
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
    null === ref ||
      (current && current.ref === ref) ||
      (workInProgress.effectTag |= 128);
  }
  function finishClassComponent(
    current,
    workInProgress,
    shouldUpdate,
    hasContext
  ) {
    markRef(current, workInProgress);
    if (!shouldUpdate)
      return (
        hasContext && invalidateContextProvider(workInProgress, !1),
        bailoutOnAlreadyFinishedWork(current, workInProgress)
      );
    shouldUpdate = workInProgress.stateNode;
    ReactCurrentOwner.current = workInProgress;
    debugRenderPhaseSideEffects && shouldUpdate.render();
    var nextChildren = shouldUpdate.render();
    workInProgress.effectTag |= 1;
    reconcileChildren(current, workInProgress, nextChildren);
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
  function bailoutOnAlreadyFinishedWork(current, workInProgress) {
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
      for (newChild["return"] = workInProgress; null !== current.sibling; )
        (current = current.sibling),
          (newChild = newChild.sibling = createWorkInProgress(
            current,
            current.pendingProps,
            current.expirationTime
          )),
          (newChild["return"] = workInProgress);
      newChild.sibling = null;
    }
    return workInProgress.child;
  }
  function bailoutOnLowPriority(current, workInProgress) {
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
    }
    return null;
  }
  var shouldSetTextContent = config.shouldSetTextContent,
    useSyncScheduling = config.useSyncScheduling,
    shouldDeprioritizeSubtree = config.shouldDeprioritizeSubtree,
    pushHostContext = hostContext.pushHostContext,
    pushHostContainer = hostContext.pushHostContainer,
    enterHydrationState = hydrationContext.enterHydrationState,
    resetHydrationState = hydrationContext.resetHydrationState,
    tryToClaimNextHydratableInstance =
      hydrationContext.tryToClaimNextHydratableInstance;
  config = ReactFiberClassComponent(
    scheduleWork,
    computeExpirationForFiber,
    function(workInProgress, nextProps) {
      workInProgress.memoizedProps = nextProps;
    },
    function(workInProgress, nextState) {
      workInProgress.memoizedState = nextState;
    }
  );
  var adoptClassInstance = config.adoptClassInstance,
    constructClassInstance = config.constructClassInstance,
    mountClassInstance = config.mountClassInstance,
    updateClassInstance = config.updateClassInstance;
  return {
    beginWork: function(current, workInProgress, renderExpirationTime) {
      if (
        0 === workInProgress.expirationTime ||
        workInProgress.expirationTime > renderExpirationTime
      )
        return bailoutOnLowPriority(current, workInProgress);
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
          "function" === typeof fn.render
            ? ((workInProgress.tag = 2),
              (props = pushContextProvider(workInProgress)),
              adoptClassInstance(workInProgress, fn),
              mountClassInstance(workInProgress, renderExpirationTime),
              (current = finishClassComponent(
                current,
                workInProgress,
                !0,
                props
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
              : (current = bailoutOnAlreadyFinishedWork(
                  current,
                  workInProgress
                )),
            current
          );
        case 2:
          return (
            (props = pushContextProvider(workInProgress)),
            (fn = void 0),
            null === current
              ? workInProgress.stateNode
                ? invariant(!1, "Resuming work not yet implemented.")
                : (constructClassInstance(
                    workInProgress,
                    workInProgress.pendingProps
                  ),
                  mountClassInstance(workInProgress, renderExpirationTime),
                  (fn = !0))
              : (fn = updateClassInstance(
                  current,
                  workInProgress,
                  renderExpirationTime
                )),
            finishClassComponent(current, workInProgress, fn, props)
          );
        case 3:
          return (
            pushHostRootContext(workInProgress),
            (props = workInProgress.updateQueue),
            null !== props
              ? ((fn = workInProgress.memoizedState),
                (props = processUpdateQueue(
                  current,
                  workInProgress,
                  props,
                  null,
                  null,
                  renderExpirationTime
                )),
                fn === props
                  ? (resetHydrationState(),
                    (current = bailoutOnAlreadyFinishedWork(
                      current,
                      workInProgress
                    )))
                  : ((fn = props.element),
                    (unmaskedContext = workInProgress.stateNode),
                    (null === current || null === current.child) &&
                    unmaskedContext.hydrate &&
                    enterHydrationState(workInProgress)
                      ? ((workInProgress.effectTag |= 2),
                        (workInProgress.child = mountChildFibers(
                          workInProgress,
                          null,
                          fn,
                          renderExpirationTime
                        )))
                      : (resetHydrationState(),
                        reconcileChildren(current, workInProgress, fn)),
                    (workInProgress.memoizedState = props),
                    (current = workInProgress.child)))
              : (resetHydrationState(),
                (current = bailoutOnAlreadyFinishedWork(
                  current,
                  workInProgress
                ))),
            current
          );
        case 5:
          pushHostContext(workInProgress);
          null === current && tryToClaimNextHydratableInstance(workInProgress);
          props = workInProgress.type;
          var memoizedProps = workInProgress.memoizedProps;
          fn = workInProgress.pendingProps;
          unmaskedContext = null !== current ? current.memoizedProps : null;
          didPerformWorkStackCursor.current || memoizedProps !== fn
            ? ((memoizedProps = fn.children),
              shouldSetTextContent(props, fn)
                ? (memoizedProps = null)
                : unmaskedContext &&
                  shouldSetTextContent(props, unmaskedContext) &&
                  (workInProgress.effectTag |= 16),
              markRef(current, workInProgress),
              2147483647 !== renderExpirationTime &&
              !useSyncScheduling &&
              shouldDeprioritizeSubtree(props, fn)
                ? ((workInProgress.expirationTime = 2147483647),
                  (current = null))
                : (reconcileChildren(current, workInProgress, memoizedProps),
                  (workInProgress.memoizedProps = fn),
                  (current = workInProgress.child)))
            : (current = bailoutOnAlreadyFinishedWork(current, workInProgress));
          return current;
        case 6:
          return (
            null === current &&
              tryToClaimNextHydratableInstance(workInProgress),
            (workInProgress.memoizedProps = workInProgress.pendingProps),
            null
          );
        case 8:
          workInProgress.tag = 7;
        case 7:
          return (
            (props = workInProgress.pendingProps),
            didPerformWorkStackCursor.current ||
              workInProgress.memoizedProps !== props ||
              (props = workInProgress.memoizedProps),
            (fn = props.children),
            (workInProgress.stateNode =
              null === current
                ? mountChildFibers(
                    workInProgress,
                    workInProgress.stateNode,
                    fn,
                    renderExpirationTime
                  )
                : reconcileChildFibers(
                    workInProgress,
                    workInProgress.stateNode,
                    fn,
                    renderExpirationTime
                  )),
            (workInProgress.memoizedProps = props),
            workInProgress.stateNode
          );
        case 9:
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
              : (current = bailoutOnAlreadyFinishedWork(
                  current,
                  workInProgress
                )),
            current
          );
        case 10:
          return (
            (renderExpirationTime = workInProgress.pendingProps),
            didPerformWorkStackCursor.current ||
            (null !== renderExpirationTime &&
              workInProgress.memoizedProps !== renderExpirationTime)
              ? (reconcileChildren(
                  current,
                  workInProgress,
                  renderExpirationTime
                ),
                (workInProgress.memoizedProps = renderExpirationTime),
                (current = workInProgress.child))
              : (current = bailoutOnAlreadyFinishedWork(
                  current,
                  workInProgress
                )),
            current
          );
        default:
          invariant(
            !1,
            "Unknown unit of work tag. This error is likely caused by a bug in React. Please file an issue."
          );
      }
    },
    beginFailedWork: function(current, workInProgress, renderExpirationTime) {
      switch (workInProgress.tag) {
        case 2:
          pushContextProvider(workInProgress);
          break;
        case 3:
          pushHostRootContext(workInProgress);
          break;
        default:
          invariant(
            !1,
            "Invalid type of work. This error is likely caused by a bug in React. Please file an issue."
          );
      }
      workInProgress.effectTag |= 64;
      null === current
        ? (workInProgress.child = null)
        : workInProgress.child !== current.child &&
          (workInProgress.child = current.child);
      if (
        0 === workInProgress.expirationTime ||
        workInProgress.expirationTime > renderExpirationTime
      )
        return bailoutOnLowPriority(current, workInProgress);
      workInProgress.firstEffect = null;
      workInProgress.lastEffect = null;
      workInProgress.child =
        null === current
          ? mountChildFibers(workInProgress, null, null, renderExpirationTime)
          : reconcileChildFibers(
              workInProgress,
              current.child,
              null,
              renderExpirationTime
            );
      2 === workInProgress.tag &&
        ((current = workInProgress.stateNode),
        (workInProgress.memoizedProps = current.props),
        (workInProgress.memoizedState = current.state));
      return workInProgress.child;
    }
  };
}
function ReactFiberCompleteWork(config, hostContext, hydrationContext) {
  function markUpdate(workInProgress) {
    workInProgress.effectTag |= 4;
  }
  var createInstance = config.createInstance,
    createTextInstance = config.createTextInstance,
    appendInitialChild = config.appendInitialChild,
    finalizeInitialChildren = config.finalizeInitialChildren,
    prepareUpdate = config.prepareUpdate,
    persistence = config.persistence,
    getRootHostContainer = hostContext.getRootHostContainer,
    popHostContext = hostContext.popHostContext,
    getHostContext = hostContext.getHostContext,
    popHostContainer = hostContext.popHostContainer,
    prepareToHydrateHostInstance =
      hydrationContext.prepareToHydrateHostInstance,
    prepareToHydrateHostTextInstance =
      hydrationContext.prepareToHydrateHostTextInstance,
    popHydrationState = hydrationContext.popHydrationState,
    updateHostContainer = void 0,
    updateHostComponent = void 0,
    updateHostText = void 0;
  config.mutation
    ? ((updateHostContainer = function() {}),
      (updateHostComponent = function(current, workInProgress, updatePayload) {
        (workInProgress.updateQueue = updatePayload) &&
          markUpdate(workInProgress);
      }),
      (updateHostText = function(current, workInProgress, oldText, newText) {
        oldText !== newText && markUpdate(workInProgress);
      }))
    : persistence
      ? invariant(!1, "Persistent reconciler is disabled.")
      : invariant(!1, "Noop reconciler is disabled.");
  return {
    completeWork: function(current, workInProgress, renderExpirationTime) {
      var newProps = workInProgress.pendingProps;
      switch (workInProgress.tag) {
        case 1:
          return null;
        case 2:
          return popContextProvider(workInProgress), null;
        case 3:
          popHostContainer(workInProgress);
          pop(didPerformWorkStackCursor, workInProgress);
          pop(contextStackCursor, workInProgress);
          newProps = workInProgress.stateNode;
          newProps.pendingContext &&
            ((newProps.context = newProps.pendingContext),
            (newProps.pendingContext = null));
          if (null === current || null === current.child)
            popHydrationState(workInProgress), (workInProgress.effectTag &= -3);
          updateHostContainer(workInProgress);
          return null;
        case 5:
          popHostContext(workInProgress);
          renderExpirationTime = getRootHostContainer();
          var type = workInProgress.type;
          if (null !== current && null != workInProgress.stateNode) {
            var oldProps = current.memoizedProps,
              instance = workInProgress.stateNode,
              currentHostContext = getHostContext();
            instance = prepareUpdate(
              instance,
              type,
              oldProps,
              newProps,
              renderExpirationTime,
              currentHostContext
            );
            updateHostComponent(
              current,
              workInProgress,
              instance,
              type,
              oldProps,
              newProps,
              renderExpirationTime
            );
            current.ref !== workInProgress.ref &&
              (workInProgress.effectTag |= 128);
          } else {
            if (!newProps)
              return (
                invariant(
                  null !== workInProgress.stateNode,
                  "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
                ),
                null
              );
            current = getHostContext();
            if (popHydrationState(workInProgress))
              prepareToHydrateHostInstance(
                workInProgress,
                renderExpirationTime,
                current
              ) && markUpdate(workInProgress);
            else {
              current = createInstance(
                type,
                newProps,
                renderExpirationTime,
                current,
                workInProgress
              );
              a: for (oldProps = workInProgress.child; null !== oldProps; ) {
                if (5 === oldProps.tag || 6 === oldProps.tag)
                  appendInitialChild(current, oldProps.stateNode);
                else if (4 !== oldProps.tag && null !== oldProps.child) {
                  oldProps.child["return"] = oldProps;
                  oldProps = oldProps.child;
                  continue;
                }
                if (oldProps === workInProgress) break;
                for (; null === oldProps.sibling; ) {
                  if (
                    null === oldProps["return"] ||
                    oldProps["return"] === workInProgress
                  )
                    break a;
                  oldProps = oldProps["return"];
                }
                oldProps.sibling["return"] = oldProps["return"];
                oldProps = oldProps.sibling;
              }
              finalizeInitialChildren(
                current,
                type,
                newProps,
                renderExpirationTime
              ) && markUpdate(workInProgress);
              workInProgress.stateNode = current;
            }
            null !== workInProgress.ref && (workInProgress.effectTag |= 128);
          }
          return null;
        case 6:
          if (current && null != workInProgress.stateNode)
            updateHostText(
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
            current = getRootHostContainer();
            renderExpirationTime = getHostContext();
            popHydrationState(workInProgress)
              ? prepareToHydrateHostTextInstance(workInProgress) &&
                markUpdate(workInProgress)
              : (workInProgress.stateNode = createTextInstance(
                  newProps,
                  current,
                  renderExpirationTime,
                  workInProgress
                ));
          }
          return null;
        case 7:
          newProps = workInProgress.memoizedProps;
          invariant(
            newProps,
            "Should be resolved by now. This error is likely caused by a bug in React. Please file an issue."
          );
          workInProgress.tag = 8;
          type = [];
          a: for (
            (oldProps = workInProgress.stateNode) &&
            (oldProps["return"] = workInProgress);
            null !== oldProps;

          ) {
            if (5 === oldProps.tag || 6 === oldProps.tag || 4 === oldProps.tag)
              invariant(!1, "A call cannot have host component children.");
            else if (9 === oldProps.tag) type.push(oldProps.type);
            else if (null !== oldProps.child) {
              oldProps.child["return"] = oldProps;
              oldProps = oldProps.child;
              continue;
            }
            for (; null === oldProps.sibling; ) {
              if (
                null === oldProps["return"] ||
                oldProps["return"] === workInProgress
              )
                break a;
              oldProps = oldProps["return"];
            }
            oldProps.sibling["return"] = oldProps["return"];
            oldProps = oldProps.sibling;
          }
          oldProps = newProps.handler;
          newProps = oldProps(newProps.props, type);
          workInProgress.child = reconcileChildFibers(
            workInProgress,
            null !== current ? current.child : null,
            newProps,
            renderExpirationTime
          );
          return workInProgress.child;
        case 8:
          return (workInProgress.tag = 7), null;
        case 9:
          return null;
        case 10:
          return null;
        case 4:
          return (
            popHostContainer(workInProgress),
            updateHostContainer(workInProgress),
            null
          );
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
  };
}
function ReactFiberCommitWork(config, captureError) {
  function safelyDetachRef(current) {
    var ref = current.ref;
    if (null !== ref)
      try {
        ref(null);
      } catch (refError) {
        captureError(current, refError);
      }
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
            captureError(current, unmountError);
          }
        break;
      case 5:
        safelyDetachRef(current);
        break;
      case 7:
        commitNestedUnmounts(current.stateNode);
        break;
      case 4:
        mutation && unmountHostComponents(current);
    }
  }
  function commitNestedUnmounts(root) {
    for (var node = root; ; )
      if (
        (commitUnmount(node),
        null === node.child || (mutation && 4 === node.tag))
      ) {
        if (node === root) break;
        for (; null === node.sibling; ) {
          if (null === node["return"] || node["return"] === root) return;
          node = node["return"];
        }
        node.sibling["return"] = node["return"];
        node = node.sibling;
      } else (node.child["return"] = node), (node = node.child);
  }
  function isHostParent(fiber) {
    return 5 === fiber.tag || 3 === fiber.tag || 4 === fiber.tag;
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
        currentParentIsValid = node["return"];
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
          currentParentIsValid = currentParentIsValid["return"];
        }
        currentParentIsValid = !0;
      }
      if (5 === node.tag || 6 === node.tag)
        commitNestedUnmounts(node),
          currentParentIsContainer
            ? removeChildFromContainer(currentParent, node.stateNode)
            : removeChild(currentParent, node.stateNode);
      else if (
        (4 === node.tag
          ? (currentParent = node.stateNode.containerInfo)
          : commitUnmount(node),
        null !== node.child)
      ) {
        node.child["return"] = node;
        node = node.child;
        continue;
      }
      if (node === current) break;
      for (; null === node.sibling; ) {
        if (null === node["return"] || node["return"] === current) return;
        node = node["return"];
        4 === node.tag && (currentParentIsValid = !1);
      }
      node.sibling["return"] = node["return"];
      node = node.sibling;
    }
  }
  var getPublicInstance = config.getPublicInstance,
    mutation = config.mutation;
  config = config.persistence;
  mutation ||
    (config
      ? invariant(!1, "Persistent reconciler is disabled.")
      : invariant(!1, "Noop reconciler is disabled."));
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
  return {
    commitResetTextContent: function(current) {
      resetTextContent(current.stateNode);
    },
    commitPlacement: function(finishedWork) {
      a: {
        for (var parent = finishedWork["return"]; null !== parent; ) {
          if (isHostParent(parent)) {
            var parentFiber = parent;
            break a;
          }
          parent = parent["return"];
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
      parentFiber.effectTag & 16 &&
        (resetTextContent(parent), (parentFiber.effectTag &= -17));
      a: b: for (parentFiber = finishedWork; ; ) {
        for (; null === parentFiber.sibling; ) {
          if (
            null === parentFiber["return"] ||
            isHostParent(parentFiber["return"])
          ) {
            parentFiber = null;
            break a;
          }
          parentFiber = parentFiber["return"];
        }
        parentFiber.sibling["return"] = parentFiber["return"];
        for (
          parentFiber = parentFiber.sibling;
          5 !== parentFiber.tag && 6 !== parentFiber.tag;

        ) {
          if (parentFiber.effectTag & 2) continue b;
          if (null === parentFiber.child || 4 === parentFiber.tag) continue b;
          else
            (parentFiber.child["return"] = parentFiber),
              (parentFiber = parentFiber.child);
        }
        if (!(parentFiber.effectTag & 2)) {
          parentFiber = parentFiber.stateNode;
          break a;
        }
      }
      for (var node = finishedWork; ; ) {
        if (5 === node.tag || 6 === node.tag)
          parentFiber
            ? isContainer
              ? insertInContainerBefore(parent, node.stateNode, parentFiber)
              : insertBefore(parent, node.stateNode, parentFiber)
            : isContainer
              ? appendChildToContainer(parent, node.stateNode)
              : appendChild(parent, node.stateNode);
        else if (4 !== node.tag && null !== node.child) {
          node.child["return"] = node;
          node = node.child;
          continue;
        }
        if (node === finishedWork) break;
        for (; null === node.sibling; ) {
          if (null === node["return"] || node["return"] === finishedWork)
            return;
          node = node["return"];
        }
        node.sibling["return"] = node["return"];
        node = node.sibling;
      }
    },
    commitDeletion: function(current) {
      unmountHostComponents(current);
      current["return"] = null;
      current.child = null;
      current.alternate &&
        ((current.alternate.child = null),
        (current.alternate["return"] = null));
    },
    commitWork: function(current, finishedWork) {
      switch (finishedWork.tag) {
        case 2:
          break;
        case 5:
          var instance = finishedWork.stateNode;
          if (null != instance) {
            var newProps = finishedWork.memoizedProps;
            current = null !== current ? current.memoizedProps : newProps;
            var type = finishedWork.type,
              updatePayload = finishedWork.updateQueue;
            finishedWork.updateQueue = null;
            null !== updatePayload &&
              commitUpdate(
                instance,
                updatePayload,
                type,
                current,
                newProps,
                finishedWork
              );
          }
          break;
        case 6:
          invariant(
            null !== finishedWork.stateNode,
            "This should have a text node initialized. This error is likely caused by a bug in React. Please file an issue."
          );
          instance = finishedWork.memoizedProps;
          commitTextUpdate(
            finishedWork.stateNode,
            null !== current ? current.memoizedProps : instance,
            instance
          );
          break;
        case 3:
          break;
        default:
          invariant(
            !1,
            "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
          );
      }
    },
    commitLifeCycles: function(current, finishedWork) {
      switch (finishedWork.tag) {
        case 2:
          var instance = finishedWork.stateNode;
          if (finishedWork.effectTag & 4)
            if (null === current)
              (instance.props = finishedWork.memoizedProps),
                (instance.state = finishedWork.memoizedState),
                instance.componentDidMount();
            else {
              var prevProps = current.memoizedProps;
              current = current.memoizedState;
              instance.props = finishedWork.memoizedProps;
              instance.state = finishedWork.memoizedState;
              instance.componentDidUpdate(prevProps, current);
            }
          finishedWork = finishedWork.updateQueue;
          null !== finishedWork && commitCallbacks(finishedWork, instance);
          break;
        case 3:
          instance = finishedWork.updateQueue;
          null !== instance &&
            commitCallbacks(
              instance,
              null !== finishedWork.child ? finishedWork.child.stateNode : null
            );
          break;
        case 5:
          instance = finishedWork.stateNode;
          null === current &&
            finishedWork.effectTag & 4 &&
            commitMount(
              instance,
              finishedWork.type,
              finishedWork.memoizedProps,
              finishedWork
            );
          break;
        case 6:
          break;
        case 4:
          break;
        default:
          invariant(
            !1,
            "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
          );
      }
    },
    commitAttachRef: function(finishedWork) {
      var ref = finishedWork.ref;
      if (null !== ref) {
        var instance = finishedWork.stateNode;
        switch (finishedWork.tag) {
          case 5:
            ref(getPublicInstance(instance));
            break;
          default:
            ref(instance);
        }
      }
    },
    commitDetachRef: function(current) {
      current = current.ref;
      null !== current && current(null);
    }
  };
}
var NO_CONTEXT = {};
function ReactFiberHostContext(config) {
  function requiredContext(c) {
    invariant(
      c !== NO_CONTEXT,
      "Expected host context to exist. This error is likely caused by a bug in React. Please file an issue."
    );
    return c;
  }
  var getChildHostContext = config.getChildHostContext,
    getRootHostContext = config.getRootHostContext,
    contextStackCursor = { current: NO_CONTEXT },
    contextFiberStackCursor = { current: NO_CONTEXT },
    rootInstanceStackCursor = { current: NO_CONTEXT };
  return {
    getHostContext: function() {
      return requiredContext(contextStackCursor.current);
    },
    getRootHostContainer: function() {
      return requiredContext(rootInstanceStackCursor.current);
    },
    popHostContainer: function(fiber) {
      pop(contextStackCursor, fiber);
      pop(contextFiberStackCursor, fiber);
      pop(rootInstanceStackCursor, fiber);
    },
    popHostContext: function(fiber) {
      contextFiberStackCursor.current === fiber &&
        (pop(contextStackCursor, fiber), pop(contextFiberStackCursor, fiber));
    },
    pushHostContainer: function(fiber, nextRootInstance) {
      push(rootInstanceStackCursor, nextRootInstance, fiber);
      nextRootInstance = getRootHostContext(nextRootInstance);
      push(contextFiberStackCursor, fiber, fiber);
      push(contextStackCursor, nextRootInstance, fiber);
    },
    pushHostContext: function(fiber) {
      var rootInstance = requiredContext(rootInstanceStackCursor.current),
        context = requiredContext(contextStackCursor.current);
      rootInstance = getChildHostContext(context, fiber.type, rootInstance);
      context !== rootInstance &&
        (push(contextFiberStackCursor, fiber, fiber),
        push(contextStackCursor, rootInstance, fiber));
    },
    resetHostContainer: function() {
      contextStackCursor.current = NO_CONTEXT;
      rootInstanceStackCursor.current = NO_CONTEXT;
    }
  };
}
function ReactFiberHydrationContext(config) {
  function deleteHydratableInstance(returnFiber, instance) {
    var fiber = createFiber(5, null, null, 0);
    fiber.type = "DELETED";
    fiber.stateNode = instance;
    fiber["return"] = returnFiber;
    fiber.effectTag = 8;
    null !== returnFiber.lastEffect
      ? ((returnFiber.lastEffect.nextEffect = fiber),
        (returnFiber.lastEffect = fiber))
      : (returnFiber.firstEffect = returnFiber.lastEffect = fiber);
  }
  function tryHydrate(fiber, nextInstance) {
    switch (fiber.tag) {
      case 5:
        return (
          (nextInstance = canHydrateInstance(
            nextInstance,
            fiber.type,
            fiber.pendingProps
          )),
          null !== nextInstance ? ((fiber.stateNode = nextInstance), !0) : !1
        );
      case 6:
        return (
          (nextInstance = canHydrateTextInstance(
            nextInstance,
            fiber.pendingProps
          )),
          null !== nextInstance ? ((fiber.stateNode = nextInstance), !0) : !1
        );
      default:
        return !1;
    }
  }
  function popToNextHostParent(fiber) {
    for (
      fiber = fiber["return"];
      null !== fiber && 5 !== fiber.tag && 3 !== fiber.tag;

    )
      fiber = fiber["return"];
    hydrationParentFiber = fiber;
  }
  var shouldSetTextContent = config.shouldSetTextContent;
  config = config.hydration;
  if (!config)
    return {
      enterHydrationState: function() {
        return !1;
      },
      resetHydrationState: function() {},
      tryToClaimNextHydratableInstance: function() {},
      prepareToHydrateHostInstance: function() {
        invariant(
          !1,
          "Expected prepareToHydrateHostInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
        );
      },
      prepareToHydrateHostTextInstance: function() {
        invariant(
          !1,
          "Expected prepareToHydrateHostTextInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
        );
      },
      popHydrationState: function() {
        return !1;
      }
    };
  var canHydrateInstance = config.canHydrateInstance,
    canHydrateTextInstance = config.canHydrateTextInstance,
    getNextHydratableSibling = config.getNextHydratableSibling,
    getFirstHydratableChild = config.getFirstHydratableChild,
    hydrateInstance = config.hydrateInstance,
    hydrateTextInstance = config.hydrateTextInstance,
    hydrationParentFiber = null,
    nextHydratableInstance = null,
    isHydrating = !1;
  return {
    enterHydrationState: function(fiber) {
      nextHydratableInstance = getFirstHydratableChild(
        fiber.stateNode.containerInfo
      );
      hydrationParentFiber = fiber;
      return (isHydrating = !0);
    },
    resetHydrationState: function() {
      nextHydratableInstance = hydrationParentFiber = null;
      isHydrating = !1;
    },
    tryToClaimNextHydratableInstance: function(fiber) {
      if (isHydrating) {
        var nextInstance = nextHydratableInstance;
        if (nextInstance) {
          if (!tryHydrate(fiber, nextInstance)) {
            nextInstance = getNextHydratableSibling(nextInstance);
            if (!nextInstance || !tryHydrate(fiber, nextInstance)) {
              fiber.effectTag |= 2;
              isHydrating = !1;
              hydrationParentFiber = fiber;
              return;
            }
            deleteHydratableInstance(
              hydrationParentFiber,
              nextHydratableInstance
            );
          }
          hydrationParentFiber = fiber;
          nextHydratableInstance = getFirstHydratableChild(nextInstance);
        } else
          (fiber.effectTag |= 2),
            (isHydrating = !1),
            (hydrationParentFiber = fiber);
      }
    },
    prepareToHydrateHostInstance: function(
      fiber,
      rootContainerInstance,
      hostContext
    ) {
      rootContainerInstance = hydrateInstance(
        fiber.stateNode,
        fiber.type,
        fiber.memoizedProps,
        rootContainerInstance,
        hostContext,
        fiber
      );
      fiber.updateQueue = rootContainerInstance;
      return null !== rootContainerInstance ? !0 : !1;
    },
    prepareToHydrateHostTextInstance: function(fiber) {
      return hydrateTextInstance(fiber.stateNode, fiber.memoizedProps, fiber);
    },
    popHydrationState: function(fiber) {
      if (fiber !== hydrationParentFiber) return !1;
      if (!isHydrating)
        return popToNextHostParent(fiber), (isHydrating = !0), !1;
      var type = fiber.type;
      if (
        5 !== fiber.tag ||
        ("head" !== type &&
          "body" !== type &&
          !shouldSetTextContent(type, fiber.memoizedProps))
      )
        for (type = nextHydratableInstance; type; )
          deleteHydratableInstance(fiber, type),
            (type = getNextHydratableSibling(type));
      popToNextHostParent(fiber);
      nextHydratableInstance = hydrationParentFiber
        ? getNextHydratableSibling(fiber.stateNode)
        : null;
      return !0;
    }
  };
}
function ReactFiberScheduler(config) {
  function completeUnitOfWork(workInProgress$jscomp$0) {
    for (;;) {
      var next = completeWork(
          workInProgress$jscomp$0.alternate,
          workInProgress$jscomp$0,
          nextRenderExpirationTime
        ),
        returnFiber = workInProgress$jscomp$0["return"],
        siblingFiber = workInProgress$jscomp$0.sibling;
      var workInProgress = workInProgress$jscomp$0;
      if (
        2147483647 === nextRenderExpirationTime ||
        2147483647 !== workInProgress.expirationTime
      ) {
        if (2 !== workInProgress.tag && 3 !== workInProgress.tag)
          var newExpirationTime = 0;
        else
          (newExpirationTime = workInProgress.updateQueue),
            (newExpirationTime =
              null === newExpirationTime
                ? 0
                : newExpirationTime.expirationTime);
        for (var child = workInProgress.child; null !== child; )
          0 !== child.expirationTime &&
            (0 === newExpirationTime ||
              newExpirationTime > child.expirationTime) &&
            (newExpirationTime = child.expirationTime),
            (child = child.sibling);
        workInProgress.expirationTime = newExpirationTime;
      }
      if (null !== next) return next;
      null !== returnFiber &&
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
      if (null !== siblingFiber) return siblingFiber;
      if (null !== returnFiber) workInProgress$jscomp$0 = returnFiber;
      else {
        workInProgress$jscomp$0.stateNode.isReadyForCommit = !0;
        break;
      }
    }
    return null;
  }
  function performUnitOfWork(workInProgress) {
    var next = beginWork(
      workInProgress.alternate,
      workInProgress,
      nextRenderExpirationTime
    );
    null === next && (next = completeUnitOfWork(workInProgress));
    ReactCurrentOwner.current = null;
    return next;
  }
  function performFailedUnitOfWork(workInProgress) {
    var next = beginFailedWork(
      workInProgress.alternate,
      workInProgress,
      nextRenderExpirationTime
    );
    null === next && (next = completeUnitOfWork(workInProgress));
    ReactCurrentOwner.current = null;
    return next;
  }
  function workLoop(expirationTime) {
    if (null !== capturedErrors) {
      if (
        !(
          0 === nextRenderExpirationTime ||
          nextRenderExpirationTime > expirationTime
        )
      )
        if (nextRenderExpirationTime <= mostRecentCurrentTime)
          for (; null !== nextUnitOfWork; )
            nextUnitOfWork = hasCapturedError(nextUnitOfWork)
              ? performFailedUnitOfWork(nextUnitOfWork)
              : performUnitOfWork(nextUnitOfWork);
        else
          for (; null !== nextUnitOfWork && !shouldYield(); )
            nextUnitOfWork = hasCapturedError(nextUnitOfWork)
              ? performFailedUnitOfWork(nextUnitOfWork)
              : performUnitOfWork(nextUnitOfWork);
    } else if (
      !(
        0 === nextRenderExpirationTime ||
        nextRenderExpirationTime > expirationTime
      )
    )
      if (nextRenderExpirationTime <= mostRecentCurrentTime)
        for (; null !== nextUnitOfWork; )
          nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      else
        for (; null !== nextUnitOfWork && !shouldYield(); )
          nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  function renderRoot(root, expirationTime) {
    invariant(
      !isWorking,
      "renderRoot was called recursively. This error is likely caused by a bug in React. Please file an issue."
    );
    isWorking = !0;
    root.isReadyForCommit = !1;
    if (
      root !== nextRoot ||
      expirationTime !== nextRenderExpirationTime ||
      null === nextUnitOfWork
    ) {
      for (; -1 < index; ) (valueStack[index] = null), index--;
      previousContext = emptyObject;
      contextStackCursor.current = emptyObject;
      didPerformWorkStackCursor.current = !1;
      resetHostContainer();
      nextRoot = root;
      nextRenderExpirationTime = expirationTime;
      nextUnitOfWork = createWorkInProgress(
        nextRoot.current,
        null,
        expirationTime
      );
    }
    var didError = !1,
      error = null;
    try {
      workLoop(expirationTime);
    } catch (e) {
      (didError = !0), (error = e);
    }
    for (; didError; ) {
      if (didFatal) {
        firstUncaughtError = error;
        break;
      }
      var failedWork = nextUnitOfWork;
      if (null === failedWork) didFatal = !0;
      else {
        var boundary = captureError(failedWork, error);
        invariant(
          null !== boundary,
          "Should have found an error boundary. This error is likely caused by a bug in React. Please file an issue."
        );
        if (!didFatal) {
          try {
            didError = boundary;
            error = expirationTime;
            for (boundary = didError; null !== failedWork; ) {
              switch (failedWork.tag) {
                case 2:
                  popContextProvider(failedWork);
                  break;
                case 5:
                  popHostContext(failedWork);
                  break;
                case 3:
                  popHostContainer(failedWork);
                  break;
                case 4:
                  popHostContainer(failedWork);
              }
              if (failedWork === boundary || failedWork.alternate === boundary)
                break;
              failedWork = failedWork["return"];
            }
            nextUnitOfWork = performFailedUnitOfWork(didError);
            workLoop(error);
          } catch (e) {
            didError = !0;
            error = e;
            continue;
          }
          break;
        }
      }
    }
    expirationTime = firstUncaughtError;
    didFatal = isWorking = !1;
    firstUncaughtError = null;
    null !== expirationTime && onUncaughtError(expirationTime);
    return root.isReadyForCommit ? root.current.alternate : null;
  }
  function captureError(failedWork, error$jscomp$0) {
    var boundary = (ReactCurrentOwner.current = null),
      errorBoundaryFound = !1,
      willRetry = !1,
      errorBoundaryName = null;
    if (3 === failedWork.tag)
      (boundary = failedWork), isFailedBoundary(failedWork) && (didFatal = !0);
    else
      for (
        var node = failedWork["return"];
        null !== node && null === boundary;

      ) {
        2 === node.tag
          ? "function" === typeof node.stateNode.componentDidCatch &&
            ((errorBoundaryFound = !0),
            (errorBoundaryName = getComponentName(node)),
            (boundary = node),
            (willRetry = !0))
          : 3 === node.tag && (boundary = node);
        if (isFailedBoundary(node)) {
          if (
            isUnmounting ||
            (null !== commitPhaseBoundaries &&
              (commitPhaseBoundaries.has(node) ||
                (null !== node.alternate &&
                  commitPhaseBoundaries.has(node.alternate))))
          )
            return null;
          boundary = null;
          willRetry = !1;
        }
        node = node["return"];
      }
    if (null !== boundary) {
      null === failedBoundaries && (failedBoundaries = new Set());
      failedBoundaries.add(boundary);
      var info = "";
      node = failedWork;
      do {
        a: switch (node.tag) {
          case 0:
          case 1:
          case 2:
          case 5:
            var owner = node._debugOwner,
              source = node._debugSource;
            var JSCompiler_inline_result = getComponentName(node);
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
        node = node["return"];
      } while (node);
      node = info;
      failedWork = getComponentName(failedWork);
      null === capturedErrors && (capturedErrors = new Map());
      error$jscomp$0 = {
        componentName: failedWork,
        componentStack: node,
        error: error$jscomp$0,
        errorBoundary: errorBoundaryFound ? boundary.stateNode : null,
        errorBoundaryFound: errorBoundaryFound,
        errorBoundaryName: errorBoundaryName,
        willRetry: willRetry
      };
      capturedErrors.set(boundary, error$jscomp$0);
      try {
        if (!1 !== showDialog(error$jscomp$0)) {
          var error = error$jscomp$0.error;
          (error && error.suppressReactErrorLogging) || console.error(error);
        }
      } catch (e) {
        (e && e.suppressReactErrorLogging) || console.error(e);
      }
      isCommitting
        ? (null === commitPhaseBoundaries &&
            (commitPhaseBoundaries = new Set()),
          commitPhaseBoundaries.add(boundary))
        : scheduleErrorRecovery(boundary);
      return boundary;
    }
    null === firstUncaughtError && (firstUncaughtError = error$jscomp$0);
    return null;
  }
  function hasCapturedError(fiber) {
    return (
      null !== capturedErrors &&
      (capturedErrors.has(fiber) ||
        (null !== fiber.alternate && capturedErrors.has(fiber.alternate)))
    );
  }
  function isFailedBoundary(fiber) {
    return (
      null !== failedBoundaries &&
      (failedBoundaries.has(fiber) ||
        (null !== fiber.alternate && failedBoundaries.has(fiber.alternate)))
    );
  }
  function computeAsyncExpiration() {
    return 20 * ((((recalculateCurrentTime() + 100) / 20) | 0) + 1);
  }
  function computeExpirationForFiber(fiber) {
    return 0 !== expirationContext
      ? expirationContext
      : isWorking
        ? isCommitting ? 1 : nextRenderExpirationTime
        : !useSyncScheduling || fiber.internalContextTag & 1
          ? computeAsyncExpiration()
          : 1;
  }
  function scheduleWork(fiber, expirationTime) {
    return scheduleWorkImpl(fiber, expirationTime, !1);
  }
  function scheduleWorkImpl(fiber, expirationTime) {
    for (; null !== fiber; ) {
      if (0 === fiber.expirationTime || fiber.expirationTime > expirationTime)
        fiber.expirationTime = expirationTime;
      null !== fiber.alternate &&
        (0 === fiber.alternate.expirationTime ||
          fiber.alternate.expirationTime > expirationTime) &&
        (fiber.alternate.expirationTime = expirationTime);
      if (null === fiber["return"])
        if (3 === fiber.tag) {
          var root = fiber.stateNode;
          !isWorking &&
            root === nextRoot &&
            expirationTime < nextRenderExpirationTime &&
            ((nextUnitOfWork = nextRoot = null),
            (nextRenderExpirationTime = 0));
          requestWork(root, expirationTime);
          !isWorking &&
            root === nextRoot &&
            expirationTime < nextRenderExpirationTime &&
            ((nextUnitOfWork = nextRoot = null),
            (nextRenderExpirationTime = 0));
        } else break;
      fiber = fiber["return"];
    }
  }
  function scheduleErrorRecovery(fiber) {
    scheduleWorkImpl(fiber, 1, !0);
  }
  function recalculateCurrentTime() {
    return (mostRecentCurrentTime = (((now() - startTime) / 10) | 0) + 2);
  }
  function scheduleCallbackWithExpiration(expirationTime) {
    if (0 !== callbackExpirationTime) {
      if (expirationTime > callbackExpirationTime) return;
      cancelDeferredCallback(callbackID);
    }
    var currentMs = now() - startTime;
    callbackExpirationTime = expirationTime;
    callbackID = scheduleDeferredCallback(performAsyncWork, {
      timeout: 10 * (expirationTime - 2) - currentMs
    });
  }
  function requestWork(root, expirationTime) {
    nestedUpdateCount > NESTED_UPDATE_LIMIT &&
      invariant(
        !1,
        "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops."
      );
    if (null === root.nextScheduledRoot)
      (root.remainingExpirationTime = expirationTime),
        null === lastScheduledRoot
          ? ((firstScheduledRoot = lastScheduledRoot = root),
            (root.nextScheduledRoot = root))
          : ((lastScheduledRoot = lastScheduledRoot.nextScheduledRoot = root),
            (lastScheduledRoot.nextScheduledRoot = firstScheduledRoot));
    else {
      var remainingExpirationTime = root.remainingExpirationTime;
      if (
        0 === remainingExpirationTime ||
        expirationTime < remainingExpirationTime
      )
        root.remainingExpirationTime = expirationTime;
    }
    isRendering ||
      (isBatchingUpdates
        ? isUnbatchingUpdates &&
          ((nextFlushedRoot = root),
          (nextFlushedExpirationTime = 1),
          performWorkOnRoot(root, 1, recalculateCurrentTime()))
        : 1 === expirationTime
          ? performWork(1, null)
          : scheduleCallbackWithExpiration(expirationTime));
  }
  function findHighestPriorityRoot() {
    var highestPriorityWork = 0,
      highestPriorityRoot = null;
    if (null !== lastScheduledRoot)
      for (
        var previousScheduledRoot = lastScheduledRoot,
          root = firstScheduledRoot;
        null !== root;

      ) {
        var remainingExpirationTime = root.remainingExpirationTime;
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
    previousScheduledRoot === highestPriorityRoot
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
    for (
      findHighestPriorityRoot();
      null !== nextFlushedRoot &&
      0 !== nextFlushedExpirationTime &&
      (0 === minExpirationTime ||
        nextFlushedExpirationTime <= minExpirationTime) &&
      !deadlineDidExpire;

    )
      performWorkOnRoot(
        nextFlushedRoot,
        nextFlushedExpirationTime,
        recalculateCurrentTime()
      ),
        findHighestPriorityRoot();
    null !== deadline && ((callbackExpirationTime = 0), (callbackID = -1));
    0 !== nextFlushedExpirationTime &&
      scheduleCallbackWithExpiration(nextFlushedExpirationTime);
    deadline = null;
    deadlineDidExpire = !1;
    nestedUpdateCount = 0;
    finishRendering();
  }
  function finishRendering() {
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
  function performWorkOnRoot(root, expirationTime, currentTime) {
    invariant(
      !isRendering,
      "performWorkOnRoot was called recursively. This error is likely caused by a bug in React. Please file an issue."
    );
    isRendering = !0;
    expirationTime <= currentTime
      ? ((currentTime = root.finishedWork),
        null !== currentTime
          ? completeRoot(root, currentTime, expirationTime)
          : ((root.finishedWork = null),
            (currentTime = renderRoot(root, expirationTime)),
            null !== currentTime &&
              completeRoot(root, currentTime, expirationTime)))
      : ((currentTime = root.finishedWork),
        null !== currentTime
          ? completeRoot(root, currentTime, expirationTime)
          : ((root.finishedWork = null),
            (currentTime = renderRoot(root, expirationTime)),
            null !== currentTime &&
              (shouldYield()
                ? (root.finishedWork = currentTime)
                : completeRoot(root, currentTime, expirationTime))));
    isRendering = !1;
  }
  function completeRoot(root, finishedWork, expirationTime) {
    var firstBatch = root.firstBatch;
    if (
      null !== firstBatch &&
      firstBatch._expirationTime <= expirationTime &&
      (null === completedBatches
        ? (completedBatches = [firstBatch])
        : completedBatches.push(firstBatch),
      firstBatch._defer)
    ) {
      root.finishedWork = finishedWork;
      root.remainingExpirationTime = 0;
      return;
    }
    root.finishedWork = null;
    isCommitting = isWorking = !0;
    expirationTime = finishedWork.stateNode;
    invariant(
      expirationTime.current !== finishedWork,
      "Cannot commit the same tree as before. This is probably a bug related to the return field. This error is likely caused by a bug in React. Please file an issue."
    );
    expirationTime.isReadyForCommit = !1;
    ReactCurrentOwner.current = null;
    1 < finishedWork.effectTag
      ? null !== finishedWork.lastEffect
        ? ((finishedWork.lastEffect.nextEffect = finishedWork),
          (firstBatch = finishedWork.firstEffect))
        : (firstBatch = finishedWork)
      : (firstBatch = finishedWork.firstEffect);
    prepareForCommit();
    for (nextEffect = firstBatch; null !== nextEffect; ) {
      var didError = !1,
        _error = void 0;
      try {
        for (; null !== nextEffect; ) {
          var effectTag = nextEffect.effectTag;
          effectTag & 16 && commitResetTextContent(nextEffect);
          if (effectTag & 128) {
            var current = nextEffect.alternate;
            null !== current && commitDetachRef(current);
          }
          switch (effectTag & -242) {
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
              (isUnmounting = !0),
                commitDeletion(nextEffect),
                (isUnmounting = !1);
          }
          nextEffect = nextEffect.nextEffect;
        }
      } catch (e) {
        (didError = !0), (_error = e);
      }
      didError &&
        (invariant(
          null !== nextEffect,
          "Should have next effect. This error is likely caused by a bug in React. Please file an issue."
        ),
        captureError(nextEffect, _error),
        null !== nextEffect && (nextEffect = nextEffect.nextEffect));
    }
    resetAfterCommit();
    expirationTime.current = finishedWork;
    for (nextEffect = firstBatch; null !== nextEffect; ) {
      effectTag = !1;
      current = void 0;
      try {
        for (; null !== nextEffect; ) {
          var effectTag$jscomp$0 = nextEffect.effectTag;
          effectTag$jscomp$0 & 36 &&
            commitLifeCycles(nextEffect.alternate, nextEffect);
          effectTag$jscomp$0 & 128 && commitAttachRef(nextEffect);
          if (effectTag$jscomp$0 & 64)
            switch (((firstBatch = nextEffect),
            (didError = void 0),
            null !== capturedErrors &&
              ((didError = capturedErrors.get(firstBatch)),
              capturedErrors["delete"](firstBatch),
              null == didError &&
                null !== firstBatch.alternate &&
                ((firstBatch = firstBatch.alternate),
                (didError = capturedErrors.get(firstBatch)),
                capturedErrors["delete"](firstBatch))),
            invariant(
              null != didError,
              "No error for given unit of work. This error is likely caused by a bug in React. Please file an issue."
            ),
            firstBatch.tag)) {
              case 2:
                firstBatch.stateNode.componentDidCatch(didError.error, {
                  componentStack: didError.componentStack
                });
                break;
              case 3:
                null === firstUncaughtError &&
                  (firstUncaughtError = didError.error);
                break;
              default:
                invariant(
                  !1,
                  "Invalid type of work. This error is likely caused by a bug in React. Please file an issue."
                );
            }
          var next = nextEffect.nextEffect;
          nextEffect.nextEffect = null;
          nextEffect = next;
        }
      } catch (e) {
        (effectTag = !0), (current = e);
      }
      effectTag &&
        (invariant(
          null !== nextEffect,
          "Should have next effect. This error is likely caused by a bug in React. Please file an issue."
        ),
        captureError(nextEffect, current),
        null !== nextEffect && (nextEffect = nextEffect.nextEffect));
    }
    isWorking = isCommitting = !1;
    "function" === typeof onCommitRoot && onCommitRoot(finishedWork.stateNode);
    commitPhaseBoundaries &&
      (commitPhaseBoundaries.forEach(scheduleErrorRecovery),
      (commitPhaseBoundaries = null));
    null !== firstUncaughtError &&
      ((finishedWork = firstUncaughtError),
      (firstUncaughtError = null),
      onUncaughtError(finishedWork));
    finishedWork = expirationTime.current.expirationTime;
    0 === finishedWork && (failedBoundaries = capturedErrors = null);
    root.remainingExpirationTime = finishedWork;
  }
  function shouldYield() {
    return null === deadline ||
      deadline.timeRemaining() > timeHeuristicForUnitOfWork
      ? !1
      : (deadlineDidExpire = !0);
  }
  function onUncaughtError(error) {
    invariant(
      null !== nextFlushedRoot,
      "Should be working on a root. This error is likely caused by a bug in React. Please file an issue."
    );
    nextFlushedRoot.remainingExpirationTime = 0;
    hasUnhandledError || ((hasUnhandledError = !0), (unhandledError = error));
  }
  var hostContext = ReactFiberHostContext(config),
    hydrationContext = ReactFiberHydrationContext(config),
    popHostContainer = hostContext.popHostContainer,
    popHostContext = hostContext.popHostContext,
    resetHostContainer = hostContext.resetHostContainer,
    _ReactFiberBeginWork = ReactFiberBeginWork(
      config,
      hostContext,
      hydrationContext,
      scheduleWork,
      computeExpirationForFiber
    ),
    beginWork = _ReactFiberBeginWork.beginWork,
    beginFailedWork = _ReactFiberBeginWork.beginFailedWork,
    completeWork = ReactFiberCompleteWork(config, hostContext, hydrationContext)
      .completeWork;
  hostContext = ReactFiberCommitWork(config, captureError);
  var commitResetTextContent = hostContext.commitResetTextContent,
    commitPlacement = hostContext.commitPlacement,
    commitDeletion = hostContext.commitDeletion,
    commitWork = hostContext.commitWork,
    commitLifeCycles = hostContext.commitLifeCycles,
    commitAttachRef = hostContext.commitAttachRef,
    commitDetachRef = hostContext.commitDetachRef,
    now = config.now,
    scheduleDeferredCallback = config.scheduleDeferredCallback,
    cancelDeferredCallback = config.cancelDeferredCallback,
    useSyncScheduling = config.useSyncScheduling,
    prepareForCommit = config.prepareForCommit,
    resetAfterCommit = config.resetAfterCommit,
    startTime = now(),
    mostRecentCurrentTime = 2,
    lastUniqueAsyncExpiration = 0,
    expirationContext = 0,
    isWorking = !1,
    nextUnitOfWork = null,
    nextRoot = null,
    nextRenderExpirationTime = 0,
    nextEffect = null,
    capturedErrors = null,
    failedBoundaries = null,
    commitPhaseBoundaries = null,
    firstUncaughtError = null,
    didFatal = !1,
    isCommitting = !1,
    isUnmounting = !1,
    firstScheduledRoot = null,
    lastScheduledRoot = null,
    callbackExpirationTime = 0,
    callbackID = -1,
    isRendering = !1,
    nextFlushedRoot = null,
    nextFlushedExpirationTime = 0,
    deadlineDidExpire = !1,
    hasUnhandledError = !1,
    unhandledError = null,
    deadline = null,
    isBatchingUpdates = !1,
    isUnbatchingUpdates = !1,
    completedBatches = null,
    NESTED_UPDATE_LIMIT = 1e3,
    nestedUpdateCount = 0,
    timeHeuristicForUnitOfWork = 1;
  return {
    computeAsyncExpiration: computeAsyncExpiration,
    computeExpirationForFiber: computeExpirationForFiber,
    scheduleWork: scheduleWork,
    requestWork: requestWork,
    flushRoot: function(root, expirationTime) {
      invariant(
        !isRendering,
        "work.commit(): Cannot commit while already rendering. This likely means you attempted to commit from inside a lifecycle method."
      );
      performWorkOnRoot(root, expirationTime, expirationTime);
      finishRendering();
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
    unbatchedUpdates: function(fn) {
      if (isBatchingUpdates && !isUnbatchingUpdates) {
        isUnbatchingUpdates = !0;
        try {
          return fn();
        } finally {
          isUnbatchingUpdates = !1;
        }
      }
      return fn();
    },
    flushSync: function(fn) {
      var previousIsBatchingUpdates = isBatchingUpdates;
      isBatchingUpdates = !0;
      try {
        a: {
          var previousExpirationContext = expirationContext;
          expirationContext = 1;
          try {
            var JSCompiler_inline_result = fn();
            break a;
          } finally {
            expirationContext = previousExpirationContext;
          }
          JSCompiler_inline_result = void 0;
        }
        return JSCompiler_inline_result;
      } finally {
        (isBatchingUpdates = previousIsBatchingUpdates),
          invariant(
            !isRendering,
            "flushSync was called from inside a lifecycle method. It cannot be called when React is already rendering."
          ),
          performWork(1, null);
      }
    },
    deferredUpdates: function(fn) {
      var previousExpirationContext = expirationContext;
      expirationContext = computeAsyncExpiration();
      try {
        return fn();
      } finally {
        expirationContext = previousExpirationContext;
      }
    },
    computeUniqueAsyncExpiration: function() {
      var result = computeAsyncExpiration();
      result <= lastUniqueAsyncExpiration &&
        (result = lastUniqueAsyncExpiration + 1);
      return (lastUniqueAsyncExpiration = result);
    }
  };
}
function ReactFiberReconciler$1(config) {
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
          2 === isFiberMountedImpl(parentComponent) &&
            2 === parentComponent.tag,
          "Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue."
        );
        for (parentContext = parentComponent; 3 !== parentContext.tag; ) {
          if (isContextProvider(parentContext)) {
            parentContext =
              parentContext.stateNode.__reactInternalMemoizedMergedChildContext;
            break b;
          }
          parentContext = parentContext["return"];
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
    insertUpdateIntoFiber(current, {
      expirationTime: expirationTime,
      partialState: { element: element },
      callback: void 0 === container ? null : container,
      isReplace: !1,
      isForced: !1,
      next: null
    });
    scheduleWork(current, expirationTime);
    return expirationTime;
  }
  function findHostInstance(fiber) {
    fiber = findCurrentHostFiber(fiber);
    return null === fiber ? null : fiber.stateNode;
  }
  var getPublicInstance = config.getPublicInstance;
  config = ReactFiberScheduler(config);
  var computeAsyncExpiration = config.computeAsyncExpiration,
    computeExpirationForFiber = config.computeExpirationForFiber,
    scheduleWork = config.scheduleWork;
  return {
    createContainer: function(containerInfo, hydrate) {
      var uninitializedFiber = createFiber(3, null, 0);
      containerInfo = {
        current: uninitializedFiber,
        containerInfo: containerInfo,
        pendingChildren: null,
        remainingExpirationTime: 0,
        isReadyForCommit: !1,
        finishedWork: null,
        context: null,
        pendingContext: null,
        hydrate: hydrate,
        firstBatch: null,
        nextScheduledRoot: null
      };
      return (uninitializedFiber.stateNode = containerInfo);
    },
    updateContainer: function(element, container, parentComponent, callback) {
      var current = container.current;
      current =
        null != element &&
        null != element.type &&
        null != element.type.prototype &&
        !0 === element.type.prototype.unstable_isAsyncReactComponent
          ? computeAsyncExpiration()
          : computeExpirationForFiber(current);
      return updateContainerAtExpirationTime(
        element,
        container,
        parentComponent,
        current,
        callback
      );
    },
    updateContainerAtExpirationTime: updateContainerAtExpirationTime,
    flushRoot: config.flushRoot,
    requestWork: config.requestWork,
    computeUniqueAsyncExpiration: config.computeUniqueAsyncExpiration,
    batchedUpdates: config.batchedUpdates,
    unbatchedUpdates: config.unbatchedUpdates,
    deferredUpdates: config.deferredUpdates,
    flushSync: config.flushSync,
    getPublicRootInstance: function(container) {
      container = container.current;
      if (!container.child) return null;
      switch (container.child.tag) {
        case 5:
          return getPublicInstance(container.child.stateNode);
        default:
          return container.child.stateNode;
      }
    },
    findHostInstance: findHostInstance,
    findHostInstanceWithNoPortals: function(fiber) {
      fiber = findCurrentHostFiberWithNoPortals(fiber);
      return null === fiber ? null : fiber.stateNode;
    },
    injectIntoDevTools: function(devToolsConfig) {
      var findFiberByHostInstance = devToolsConfig.findFiberByHostInstance;
      return injectInternals(
        Object.assign({}, devToolsConfig, {
          findHostInstanceByFiber: function(fiber) {
            return findHostInstance(fiber);
          },
          findFiberByHostInstance: function(instance) {
            return findFiberByHostInstance
              ? findFiberByHostInstance(instance)
              : null;
          }
        })
      );
    }
  };
}
var ReactFiberReconciler$2 = Object.freeze({ default: ReactFiberReconciler$1 }),
  ReactFiberReconciler$3 =
    (ReactFiberReconciler$2 && ReactFiberReconciler$1) ||
    ReactFiberReconciler$2,
  reactReconciler = ReactFiberReconciler$3["default"]
    ? ReactFiberReconciler$3["default"]
    : ReactFiberReconciler$3,
  viewConfigCallbacks = new Map(),
  viewConfigs = new Map(),
  ReactNativeFiberHostComponent = (function() {
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
  now =
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
      return frameDeadline - now();
    }
  };
function setTimeoutCallback() {
  frameDeadline = now() + 5;
  var callback = scheduledCallback;
  scheduledCallback = null;
  null !== callback && callback(frameDeadlineObject);
}
function recursivelyUncacheFiberNode(node) {
  "number" === typeof node
    ? uncacheFiberNode(node)
    : (uncacheFiberNode(node._nativeTag),
      node._children.forEach(recursivelyUncacheFiberNode));
}
var NativeRenderer = reactReconciler({
  appendInitialChild: function(parentInstance, child) {
    parentInstance._children.push(child);
  },
  createInstance: function(
    type,
    props,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    hostContext = ReactNativeTagHandles.allocateTag();
    if (viewConfigs.has(type)) var viewConfig = viewConfigs.get(type);
    else
      (viewConfig = viewConfigCallbacks.get(type)),
        invariant(
          "function" === typeof viewConfig,
          "View config not found for name %s",
          type
        ),
        viewConfigCallbacks.set(type, null),
        (viewConfig = viewConfig()),
        viewConfigs.set(type, viewConfig);
    invariant(viewConfig, "View config not found for name %s", type);
    type = viewConfig;
    viewConfig = diffProperties(
      null,
      emptyObject$1,
      props,
      type.validAttributes
    );
    UIManager.createView(
      hostContext,
      type.uiViewClassName,
      rootContainerInstance,
      viewConfig
    );
    rootContainerInstance = new ReactNativeFiberHostComponent(
      hostContext,
      type
    );
    instanceCache[hostContext] = internalInstanceHandle;
    instanceProps[hostContext] = props;
    return rootContainerInstance;
  },
  createTextInstance: function(
    text,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    hostContext = ReactNativeTagHandles.allocateTag();
    UIManager.createView(hostContext, "RCTRawText", rootContainerInstance, {
      text: text
    });
    instanceCache[hostContext] = internalInstanceHandle;
    return hostContext;
  },
  finalizeInitialChildren: function(parentInstance) {
    if (0 === parentInstance._children.length) return !1;
    var nativeTags = parentInstance._children.map(function(child) {
      return "number" === typeof child ? child : child._nativeTag;
    });
    UIManager.setChildren(parentInstance._nativeTag, nativeTags);
    return !1;
  },
  getRootHostContext: function() {
    return emptyObject;
  },
  getChildHostContext: function() {
    return emptyObject;
  },
  getPublicInstance: function(instance) {
    return instance;
  },
  now: now,
  prepareForCommit: function() {},
  prepareUpdate: function() {
    return emptyObject;
  },
  resetAfterCommit: function() {},
  scheduleDeferredCallback: function(callback) {
    scheduledCallback = callback;
    return setTimeout(setTimeoutCallback, 1);
  },
  cancelDeferredCallback: function(callbackID) {
    scheduledCallback = null;
    clearTimeout(callbackID);
  },
  shouldDeprioritizeSubtree: function() {
    return !1;
  },
  shouldSetTextContent: function() {
    return !1;
  },
  useSyncScheduling: !0,
  mutation: {
    appendChild: function(parentInstance, child) {
      var childTag = "number" === typeof child ? child : child._nativeTag,
        children = parentInstance._children,
        index = children.indexOf(child);
      0 <= index
        ? (children.splice(index, 1),
          children.push(child),
          UIManager.manageChildren(
            parentInstance._nativeTag,
            [index],
            [children.length - 1],
            [],
            [],
            []
          ))
        : (children.push(child),
          UIManager.manageChildren(
            parentInstance._nativeTag,
            [],
            [],
            [childTag],
            [children.length - 1],
            []
          ));
    },
    appendChildToContainer: function(parentInstance, child) {
      UIManager.setChildren(parentInstance, [
        "number" === typeof child ? child : child._nativeTag
      ]);
    },
    commitTextUpdate: function(textInstance, oldText, newText) {
      UIManager.updateView(textInstance, "RCTRawText", { text: newText });
    },
    commitMount: function() {},
    commitUpdate: function(
      instance,
      updatePayloadTODO,
      type,
      oldProps,
      newProps
    ) {
      updatePayloadTODO = instance.viewConfig;
      instanceProps[instance._nativeTag] = newProps;
      oldProps = diffProperties(
        null,
        oldProps,
        newProps,
        updatePayloadTODO.validAttributes
      );
      null != oldProps &&
        UIManager.updateView(
          instance._nativeTag,
          updatePayloadTODO.uiViewClassName,
          oldProps
        );
    },
    insertBefore: function(parentInstance, child, beforeChild) {
      var children = parentInstance._children,
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
    },
    insertInContainerBefore: function(parentInstance) {
      invariant(
        "number" !== typeof parentInstance,
        "Container does not support insertBefore operation"
      );
    },
    removeChild: function(parentInstance, child) {
      recursivelyUncacheFiberNode(child);
      var children = parentInstance._children;
      child = children.indexOf(child);
      children.splice(child, 1);
      UIManager.manageChildren(
        parentInstance._nativeTag,
        [],
        [],
        [],
        [],
        [child]
      );
    },
    removeChildFromContainer: function(parentInstance, child) {
      recursivelyUncacheFiberNode(child);
      UIManager.manageChildren(parentInstance, [], [], [], [], [0]);
    },
    resetTextContent: function() {}
  }
});
function findNodeHandle(componentOrHandle) {
  if (null == componentOrHandle) return null;
  if ("number" === typeof componentOrHandle) return componentOrHandle;
  var internalInstance = componentOrHandle._reactInternalFiber;
  if (internalInstance)
    return NativeRenderer.findHostInstance(internalInstance);
  if (componentOrHandle) return componentOrHandle;
  invariant(
    ("object" === typeof componentOrHandle &&
      "_nativeTag" in componentOrHandle) ||
      (null != componentOrHandle.render &&
        "function" === typeof componentOrHandle.render),
    "findNodeHandle(...): Argument is not a component (type: %s, keys: %s)",
    typeof componentOrHandle,
    Object.keys(componentOrHandle)
  );
  invariant(
    !1,
    "findNodeHandle(...): Unable to find node handle for unmounted component."
  );
}
function findNumericNodeHandleFiber(componentOrHandle) {
  componentOrHandle = findNodeHandle(componentOrHandle);
  return null == componentOrHandle || "number" === typeof componentOrHandle
    ? componentOrHandle
    : componentOrHandle._nativeTag;
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
var ReactNativeComponent = (function(_React$Component) {
    function ReactNativeComponent() {
      if (!(this instanceof ReactNativeComponent))
        throw new TypeError("Cannot call a class as a function");
      var call = _React$Component.apply(this, arguments);
      if (!this)
        throw new ReferenceError(
          "this hasn't been initialised - super() hasn't been called"
        );
      return !call || ("object" !== typeof call && "function" !== typeof call)
        ? this
        : call;
    }
    _inherits(ReactNativeComponent, _React$Component);
    ReactNativeComponent.prototype.blur = function() {
      TextInputState.blurTextInput(findNumericNodeHandleFiber(this));
    };
    ReactNativeComponent.prototype.focus = function() {
      TextInputState.focusTextInput(findNumericNodeHandleFiber(this));
    };
    ReactNativeComponent.prototype.measure = function(callback) {
      UIManager.measure(
        findNumericNodeHandleFiber(this),
        mountSafeCallback(this, callback)
      );
    };
    ReactNativeComponent.prototype.measureInWindow = function(callback) {
      UIManager.measureInWindow(
        findNumericNodeHandleFiber(this),
        mountSafeCallback(this, callback)
      );
    };
    ReactNativeComponent.prototype.measureLayout = function(
      relativeToNativeNode,
      onSuccess,
      onFail
    ) {
      UIManager.measureLayout(
        findNumericNodeHandleFiber(this),
        relativeToNativeNode,
        mountSafeCallback(this, onFail),
        mountSafeCallback(this, onSuccess)
      );
    };
    ReactNativeComponent.prototype.setNativeProps = function(nativeProps) {
      var maybeInstance = void 0;
      try {
        maybeInstance = findNodeHandle(this);
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
    };
    return ReactNativeComponent;
  })(React.Component),
  getInspectorDataForViewTag = void 0;
getInspectorDataForViewTag = function() {
  invariant(!1, "getInspectorDataForViewTag() is not available in production");
};
fiberBatchedUpdates = NativeRenderer.batchedUpdates;
var roots = new Map();
function fn$jscomp$inline_616(capturedError) {
  var componentStack = capturedError.componentStack,
    error = capturedError.error;
  if (error instanceof Error) {
    capturedError = error.message;
    var name = error.name;
    try {
      error.message =
        (capturedError ? name + ": " + capturedError : name) +
        "\n\nThis error is located at:" +
        componentStack;
    } catch (e) {}
  } else
    error =
      "string" === typeof error
        ? Error(error + "\n\nThis error is located at:" + componentStack)
        : Error("Unspecified error at:" + componentStack);
  ExceptionsManager.handleException(error, !1);
  return !1;
}
invariant(
  showDialog === defaultShowDialog,
  "The custom dialog was already injected."
);
invariant(
  "function" === typeof fn$jscomp$inline_616,
  "Injected showDialog() must be a function."
);
showDialog = fn$jscomp$inline_616;
var ReactNativeRenderer = {
  NativeComponent: ReactNativeComponent,
  findNodeHandle: findNumericNodeHandleFiber,
  render: function(element, containerTag, callback) {
    var root = roots.get(containerTag);
    root ||
      ((root = NativeRenderer.createContainer(containerTag, !1)),
      roots.set(containerTag, root));
    NativeRenderer.updateContainer(element, root, null, callback);
    return NativeRenderer.getPublicRootInstance(root);
  },
  unmountComponentAtNode: function(containerTag) {
    var root = roots.get(containerTag);
    root &&
      NativeRenderer.updateContainer(null, root, null, function() {
        roots["delete"](containerTag);
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
  flushSync: NativeRenderer.flushSync,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    NativeMethodsMixin: {
      measure: function(callback) {
        UIManager.measure(
          findNumericNodeHandleFiber(this),
          mountSafeCallback(this, callback)
        );
      },
      measureInWindow: function(callback) {
        UIManager.measureInWindow(
          findNumericNodeHandleFiber(this),
          mountSafeCallback(this, callback)
        );
      },
      measureLayout: function(relativeToNativeNode, onSuccess, onFail) {
        UIManager.measureLayout(
          findNumericNodeHandleFiber(this),
          relativeToNativeNode,
          mountSafeCallback(this, onFail),
          mountSafeCallback(this, onSuccess)
        );
      },
      setNativeProps: function(nativeProps) {
        var maybeInstance = void 0;
        try {
          maybeInstance = findNodeHandle(this);
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
        TextInputState.focusTextInput(findNumericNodeHandleFiber(this));
      },
      blur: function() {
        TextInputState.blurTextInput(findNumericNodeHandleFiber(this));
      }
    },
    ReactNativeBridgeEventPlugin: ReactNativeBridgeEventPlugin,
    ReactGlobalSharedState: ReactGlobalSharedState,
    ReactNativeComponentTree: ReactNativeComponentTree,
    ReactNativePropRegistry: ReactNativePropRegistry,
    TouchHistoryMath: TouchHistoryMath,
    createReactNativeComponentClass: function(name, callback) {
      invariant(
        !viewConfigCallbacks.has(name),
        "Tried to register two views with the same name %s",
        name
      );
      viewConfigCallbacks.set(name, callback);
      return name;
    },
    takeSnapshot: function(view, options) {
      "number" !== typeof view &&
        "window" !== view &&
        (view = findNumericNodeHandleFiber(view) || "window");
      return UIManager.__takeSnapshot(view, options);
    }
  }
};
NativeRenderer.injectIntoDevTools({
  findFiberByHostInstance: getInstanceFromTag,
  getInspectorDataForViewTag: getInspectorDataForViewTag,
  bundleType: 0,
  version: "16.2.0",
  rendererPackageName: "react-native-renderer"
});
var ReactNativeRenderer$2 = Object.freeze({ default: ReactNativeRenderer }),
  ReactNativeRenderer$3 =
    (ReactNativeRenderer$2 && ReactNativeRenderer) || ReactNativeRenderer$2;
module.exports = ReactNativeRenderer$3["default"]
  ? ReactNativeRenderer$3["default"]
  : ReactNativeRenderer$3;
