/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @providesModule ReactNativeRenderer-prod
 * @preventMunge
 * @generated
 */

"use strict";
require("InitializeCore");
var invariant = require("fbjs/lib/invariant"),
  emptyFunction = require("fbjs/lib/emptyFunction"),
  ReactNativeViewConfigRegistry = require("ReactNativeViewConfigRegistry"),
  UIManager = require("UIManager"),
  RCTEventEmitter = require("RCTEventEmitter"),
  React = require("react"),
  emptyObject = require("fbjs/lib/emptyObject"),
  shallowEqual = require("fbjs/lib/shallowEqual"),
  ExceptionsManager = require("ExceptionsManager"),
  deepDiffer = require("deepDiffer"),
  flattenStyle = require("flattenStyle"),
  TextInputState = require("TextInputState");
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
  },
  instanceCache = {},
  instanceProps = {};
function uncacheFiberNode(tag) {
  delete instanceCache[tag];
  delete instanceProps[tag];
}
function getInstanceFromTag(tag) {
  return "number" === typeof tag ? instanceCache[tag] || null : tag;
}
var ReactNativeComponentTree = Object.freeze({
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
});
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
var restoreTarget = null,
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
      null === target || void 0 === target || 1 > target || (index = target);
      _receiveRootNodeIDEvent(index, eventTopLevelType, i);
    }
  }
});
RCTEventEmitter.register(ReactNativeEventEmitter);
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
          (type.stateNode = { duration: 0, startTime: 0 }),
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
function createProfilerTimer() {
  return {
    checkActualRenderTimeStackEmpty: function() {},
    markActualRenderTimeStarted: function() {},
    pauseActualRenderTimerIfRunning: function() {},
    recordElapsedActualRenderTime: function() {},
    resetActualRenderTimer: function() {},
    resumeActualRenderTimerIfPaused: function() {},
    recordElapsedBaseRenderTimeIfRunning: function() {},
    startBaseRenderTimer: function() {},
    stopBaseRenderTimerIfRunning: function() {}
  };
}
new Set();
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
function ReactFiberClassComponent(
  legacyContext,
  scheduleWork,
  computeExpirationForFiber,
  memoizeProps,
  memoizeState,
  recalculateCurrentTime
) {
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
      : workInProgress.prototype &&
        workInProgress.prototype.isPureReactComponent
        ? !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
        : !0;
  }
  function adoptClassInstance(workInProgress, instance) {
    instance.updater = classComponentUpdater;
    workInProgress.stateNode = instance;
    instance._reactInternalFiber = workInProgress;
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
  var cacheContext = legacyContext.cacheContext,
    getMaskedContext = legacyContext.getMaskedContext,
    getUnmaskedContext = legacyContext.getUnmaskedContext,
    isContextConsumer = legacyContext.isContextConsumer,
    hasContextChanged = legacyContext.hasContextChanged,
    classComponentUpdater = {
      isMounted: isMounted,
      enqueueSetState: function(inst, payload, callback) {
        inst = inst._reactInternalFiber;
        var currentTime = recalculateCurrentTime();
        currentTime = computeExpirationForFiber(currentTime, inst);
        var update = createUpdate(currentTime);
        update.payload = payload;
        void 0 !== callback &&
          null !== callback &&
          (update.callback = callback);
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
        void 0 !== callback &&
          null !== callback &&
          (update.callback = callback);
        enqueueUpdate(inst, update, currentTime);
        scheduleWork(inst, currentTime);
      },
      enqueueForceUpdate: function(inst, callback) {
        inst = inst._reactInternalFiber;
        var currentTime = recalculateCurrentTime();
        currentTime = computeExpirationForFiber(currentTime, inst);
        var update = createUpdate(currentTime);
        update.tag = 2;
        void 0 !== callback &&
          null !== callback &&
          (update.callback = callback);
        enqueueUpdate(inst, update, currentTime);
        scheduleWork(inst, currentTime);
      }
    };
  return {
    adoptClassInstance: adoptClassInstance,
    constructClassInstance: function(workInProgress, props) {
      var ctor = workInProgress.type,
        unmaskedContext = getUnmaskedContext(workInProgress),
        needsContext = isContextConsumer(workInProgress),
        context = needsContext
          ? getMaskedContext(workInProgress, unmaskedContext)
          : emptyObject;
      props = new ctor(props, context);
      workInProgress.memoizedState =
        null !== props.state && void 0 !== props.state ? props.state : null;
      adoptClassInstance(workInProgress, props);
      needsContext && cacheContext(workInProgress, unmaskedContext, context);
      return props;
    },
    mountClassInstance: function(workInProgress, renderExpirationTime) {
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
          classComponentUpdater.enqueueReplaceState(
            instance,
            instance.state,
            null
          ),
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
    },
    resumeMountClassInstance: function(workInProgress, renderExpirationTime) {
      var ctor = workInProgress.type,
        instance = workInProgress.stateNode,
        oldProps = workInProgress.memoizedProps,
        newProps = workInProgress.pendingProps;
      instance.props = oldProps;
      var oldContext = instance.context,
        newUnmaskedContext = getUnmaskedContext(workInProgress);
      newUnmaskedContext = getMaskedContext(workInProgress, newUnmaskedContext);
      var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
      (ctor =
        "function" === typeof getDerivedStateFromProps ||
        "function" === typeof instance.getSnapshotBeforeUpdate) ||
        ("function" !== typeof instance.UNSAFE_componentWillReceiveProps &&
          "function" !== typeof instance.componentWillReceiveProps) ||
        ((oldProps !== newProps || oldContext !== newUnmaskedContext) &&
          callComponentWillReceiveProps(
            workInProgress,
            instance,
            newProps,
            newUnmaskedContext
          ));
      hasForceUpdate = !1;
      var oldState = workInProgress.memoizedState;
      oldContext = instance.state = oldState;
      var updateQueue = workInProgress.updateQueue;
      null !== updateQueue &&
        (processUpdateQueue(
          workInProgress,
          updateQueue,
          newProps,
          instance,
          renderExpirationTime
        ),
        (oldContext = workInProgress.memoizedState));
      if (
        oldProps === newProps &&
        oldState === oldContext &&
        !hasContextChanged() &&
        !hasForceUpdate
      )
        return (
          "function" === typeof instance.componentDidMount &&
            (workInProgress.effectTag |= 4),
          !1
        );
      "function" === typeof getDerivedStateFromProps &&
        (applyDerivedStateFromProps(
          workInProgress,
          getDerivedStateFromProps,
          newProps
        ),
        (oldContext = workInProgress.memoizedState));
      (renderExpirationTime =
        hasForceUpdate ||
        checkShouldComponentUpdate(
          workInProgress,
          oldProps,
          newProps,
          oldState,
          oldContext,
          newUnmaskedContext
        ))
        ? (ctor ||
            ("function" !== typeof instance.UNSAFE_componentWillMount &&
              "function" !== typeof instance.componentWillMount) ||
            ("function" === typeof instance.componentWillMount &&
              instance.componentWillMount(),
            "function" === typeof instance.UNSAFE_componentWillMount &&
              instance.UNSAFE_componentWillMount()),
          "function" === typeof instance.componentDidMount &&
            (workInProgress.effectTag |= 4))
        : ("function" === typeof instance.componentDidMount &&
            (workInProgress.effectTag |= 4),
          (workInProgress.memoizedProps = newProps),
          (workInProgress.memoizedState = oldContext));
      instance.props = newProps;
      instance.state = oldContext;
      instance.context = newUnmaskedContext;
      return renderExpirationTime;
    },
    updateClassInstance: function(
      current,
      workInProgress,
      renderExpirationTime
    ) {
      var ctor = workInProgress.type,
        instance = workInProgress.stateNode,
        oldProps = workInProgress.memoizedProps,
        newProps = workInProgress.pendingProps;
      instance.props = oldProps;
      var oldContext = instance.context,
        newUnmaskedContext = getUnmaskedContext(workInProgress);
      newUnmaskedContext = getMaskedContext(workInProgress, newUnmaskedContext);
      var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
      (ctor =
        "function" === typeof getDerivedStateFromProps ||
        "function" === typeof instance.getSnapshotBeforeUpdate) ||
        ("function" !== typeof instance.UNSAFE_componentWillReceiveProps &&
          "function" !== typeof instance.componentWillReceiveProps) ||
        ((oldProps !== newProps || oldContext !== newUnmaskedContext) &&
          callComponentWillReceiveProps(
            workInProgress,
            instance,
            newProps,
            newUnmaskedContext
          ));
      hasForceUpdate = !1;
      oldContext = workInProgress.memoizedState;
      var newState = (instance.state = oldContext),
        updateQueue = workInProgress.updateQueue;
      null !== updateQueue &&
        (processUpdateQueue(
          workInProgress,
          updateQueue,
          newProps,
          instance,
          renderExpirationTime
        ),
        (newState = workInProgress.memoizedState));
      if (
        oldProps === newProps &&
        oldContext === newState &&
        !hasContextChanged() &&
        !hasForceUpdate
      )
        return (
          "function" !== typeof instance.componentDidUpdate ||
            (oldProps === current.memoizedProps &&
              oldContext === current.memoizedState) ||
            (workInProgress.effectTag |= 4),
          "function" !== typeof instance.getSnapshotBeforeUpdate ||
            (oldProps === current.memoizedProps &&
              oldContext === current.memoizedState) ||
            (workInProgress.effectTag |= 256),
          !1
        );
      "function" === typeof getDerivedStateFromProps &&
        (applyDerivedStateFromProps(
          workInProgress,
          getDerivedStateFromProps,
          newProps
        ),
        (newState = workInProgress.memoizedState));
      (renderExpirationTime =
        hasForceUpdate ||
        checkShouldComponentUpdate(
          workInProgress,
          oldProps,
          newProps,
          oldContext,
          newState,
          newUnmaskedContext
        ))
        ? (ctor ||
            ("function" !== typeof instance.UNSAFE_componentWillUpdate &&
              "function" !== typeof instance.componentWillUpdate) ||
            ("function" === typeof instance.componentWillUpdate &&
              instance.componentWillUpdate(
                newProps,
                newState,
                newUnmaskedContext
              ),
            "function" === typeof instance.UNSAFE_componentWillUpdate &&
              instance.UNSAFE_componentWillUpdate(
                newProps,
                newState,
                newUnmaskedContext
              )),
          "function" === typeof instance.componentDidUpdate &&
            (workInProgress.effectTag |= 4),
          "function" === typeof instance.getSnapshotBeforeUpdate &&
            (workInProgress.effectTag |= 256))
        : ("function" !== typeof instance.componentDidUpdate ||
            (oldProps === current.memoizedProps &&
              oldContext === current.memoizedState) ||
            (workInProgress.effectTag |= 4),
          "function" !== typeof instance.getSnapshotBeforeUpdate ||
            (oldProps === current.memoizedProps &&
              oldContext === current.memoizedState) ||
            (workInProgress.effectTag |= 256),
          (workInProgress.memoizedProps = newProps),
          (workInProgress.memoizedState = newState));
      instance.props = newProps;
      instance.state = newState;
      instance.context = newUnmaskedContext;
      return renderExpirationTime;
    }
  };
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
                  currentFirstChild.ref = coerceRef(
                    returnFiber,
                    isObject,
                    newChild
                  );
                  currentFirstChild.return = returnFiber;
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
  legacyContext,
  newContext,
  hydrationContext,
  scheduleWork,
  computeExpirationForFiber,
  profilerTimer,
  recalculateCurrentTime
) {
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
    var nextChildren = didCaptureError ? null : shouldUpdate.render();
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
  function updateContextProvider(
    current,
    workInProgress,
    renderExpirationTime
  ) {
    var context = workInProgress.type._context,
      newProps = workInProgress.pendingProps,
      oldProps = workInProgress.memoizedProps,
      canBailOnProps = !0;
    if (hasLegacyContextChanged()) canBailOnProps = !1;
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
  var shouldSetTextContent = config.shouldSetTextContent,
    shouldDeprioritizeSubtree = config.shouldDeprioritizeSubtree,
    pushHostContext = hostContext.pushHostContext,
    pushHostContainer = hostContext.pushHostContainer,
    pushProvider = newContext.pushProvider,
    getContextCurrentValue = newContext.getContextCurrentValue,
    getContextChangedBits = newContext.getContextChangedBits,
    getMaskedContext = legacyContext.getMaskedContext,
    getUnmaskedContext = legacyContext.getUnmaskedContext,
    hasLegacyContextChanged = legacyContext.hasContextChanged,
    pushLegacyContextProvider = legacyContext.pushContextProvider,
    pushTopLevelContextObject = legacyContext.pushTopLevelContextObject,
    invalidateContextProvider = legacyContext.invalidateContextProvider,
    enterHydrationState = hydrationContext.enterHydrationState,
    resetHydrationState = hydrationContext.resetHydrationState,
    tryToClaimNextHydratableInstance =
      hydrationContext.tryToClaimNextHydratableInstance;
  config = ReactFiberClassComponent(
    legacyContext,
    scheduleWork,
    computeExpirationForFiber,
    function(workInProgress, nextProps) {
      workInProgress.memoizedProps = nextProps;
    },
    function(workInProgress, nextState) {
      workInProgress.memoizedState = nextState;
    },
    recalculateCurrentTime
  );
  var adoptClassInstance = config.adoptClassInstance,
    constructClassInstance = config.constructClassInstance,
    mountClassInstance = config.mountClassInstance,
    resumeMountClassInstance = config.resumeMountClassInstance,
    updateClassInstance = config.updateClassInstance;
  return {
    beginWork: function(current, workInProgress, renderExpirationTime) {
      if (
        0 === workInProgress.expirationTime ||
        workInProgress.expirationTime > renderExpirationTime
      ) {
        switch (workInProgress.tag) {
          case 3:
            pushHostRootContext(workInProgress);
            break;
          case 2:
            pushLegacyContextProvider(workInProgress);
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
                applyDerivedStateFromProps(
                  workInProgress,
                  unmaskedContext,
                  props
                ),
              (props = pushLegacyContextProvider(workInProgress)),
              adoptClassInstance(workInProgress, fn),
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
            hasLegacyContextChanged() ||
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
            (props = pushLegacyContextProvider(workInProgress)),
            null === current
              ? null === workInProgress.stateNode
                ? (constructClassInstance(
                    workInProgress,
                    workInProgress.pendingProps,
                    renderExpirationTime
                  ),
                  mountClassInstance(workInProgress, renderExpirationTime),
                  (fn = !0))
                : (fn = resumeMountClassInstance(
                    workInProgress,
                    renderExpirationTime
                  ))
              : (fn = updateClassInstance(
                  current,
                  workInProgress,
                  renderExpirationTime
                )),
            finishClassComponent(
              current,
              workInProgress,
              fn,
              props,
              renderExpirationTime
            )
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
                (props = workInProgress.memoizedState.element),
                props === fn
                  ? (resetHydrationState(),
                    (current = bailoutOnAlreadyFinishedWork(
                      current,
                      workInProgress
                    )))
                  : ((fn = workInProgress.stateNode),
                    (null === current || null === current.child) &&
                    fn.hydrate &&
                    enterHydrationState(workInProgress)
                      ? ((workInProgress.effectTag |= 2),
                        (workInProgress.child = mountChildFibers(
                          workInProgress,
                          null,
                          props,
                          renderExpirationTime
                        )))
                      : (resetHydrationState(),
                        reconcileChildren(current, workInProgress, props)),
                    (current = workInProgress.child)))
              : (resetHydrationState(),
                (current = bailoutOnAlreadyFinishedWork(
                  current,
                  workInProgress
                ))),
            current
          );
        case 5:
          a: {
            pushHostContext(workInProgress);
            null === current &&
              tryToClaimNextHydratableInstance(workInProgress);
            props = workInProgress.type;
            var memoizedProps = workInProgress.memoizedProps;
            fn = workInProgress.pendingProps;
            unmaskedContext = null !== current ? current.memoizedProps : null;
            if (!hasLegacyContextChanged() && memoizedProps === fn) {
              if (
                (memoizedProps =
                  workInProgress.mode & 1 &&
                  shouldDeprioritizeSubtree(props, fn))
              )
                workInProgress.expirationTime = 1073741823;
              if (!memoizedProps || 1073741823 !== renderExpirationTime) {
                current = bailoutOnAlreadyFinishedWork(current, workInProgress);
                break a;
              }
            }
            memoizedProps = fn.children;
            shouldSetTextContent(props, fn)
              ? (memoizedProps = null)
              : unmaskedContext &&
                shouldSetTextContent(props, unmaskedContext) &&
                (workInProgress.effectTag |= 16);
            markRef(current, workInProgress);
            1073741823 !== renderExpirationTime &&
            workInProgress.mode & 1 &&
            shouldDeprioritizeSubtree(props, fn)
              ? ((workInProgress.expirationTime = 1073741823),
                (workInProgress.memoizedProps = fn),
                (current = null))
              : (reconcileChildren(current, workInProgress, memoizedProps),
                (workInProgress.memoizedProps = fn),
                (current = workInProgress.child));
          }
          return current;
        case 6:
          return (
            null === current &&
              tryToClaimNextHydratableInstance(workInProgress),
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
            hasLegacyContextChanged() || workInProgress.memoizedProps !== props
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
        case 14:
          return (
            (props = workInProgress.type.render),
            (renderExpirationTime = workInProgress.pendingProps),
            (fn = workInProgress.ref),
            hasLegacyContextChanged() ||
            workInProgress.memoizedProps !== renderExpirationTime ||
            fn !== (null !== current ? current.ref : null)
              ? ((props = props(renderExpirationTime, fn)),
                reconcileChildren(current, workInProgress, props),
                (workInProgress.memoizedProps = renderExpirationTime),
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
            hasLegacyContextChanged() ||
            workInProgress.memoizedProps !== renderExpirationTime
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
        case 11:
          return (
            (renderExpirationTime = workInProgress.pendingProps.children),
            hasLegacyContextChanged() ||
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
        case 15:
          return (
            (renderExpirationTime = workInProgress.pendingProps),
            workInProgress.memoizedProps === renderExpirationTime
              ? (current = bailoutOnAlreadyFinishedWork(
                  current,
                  workInProgress
                ))
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
          a: {
            fn = workInProgress.type;
            unmaskedContext = workInProgress.pendingProps;
            memoizedProps = workInProgress.memoizedProps;
            props = getContextCurrentValue(fn);
            var changedBits = getContextChangedBits(fn);
            if (
              hasLegacyContextChanged() ||
              0 !== changedBits ||
              memoizedProps !== unmaskedContext
            ) {
              workInProgress.memoizedProps = unmaskedContext;
              var observedBits = unmaskedContext.unstable_observedBits;
              if (void 0 === observedBits || null === observedBits)
                observedBits = 1073741823;
              workInProgress.stateNode = observedBits;
              if (0 !== (changedBits & observedBits))
                propagateContextChange(
                  workInProgress,
                  fn,
                  changedBits,
                  renderExpirationTime
                );
              else if (memoizedProps === unmaskedContext) {
                current = bailoutOnAlreadyFinishedWork(current, workInProgress);
                break a;
              }
              renderExpirationTime = unmaskedContext.children;
              renderExpirationTime = renderExpirationTime(props);
              workInProgress.effectTag |= 1;
              reconcileChildren(current, workInProgress, renderExpirationTime);
              current = workInProgress.child;
            } else
              current = bailoutOnAlreadyFinishedWork(current, workInProgress);
          }
          return current;
        default:
          invariant(
            !1,
            "Unknown unit of work tag. This error is likely caused by a bug in React. Please file an issue."
          );
      }
    }
  };
}
function ReactFiberCompleteWork(
  config,
  hostContext,
  legacyContext,
  newContext,
  hydrationContext
) {
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
    popLegacyContextProvider = legacyContext.popContextProvider,
    popTopLevelLegacyContextObject = legacyContext.popTopLevelContextObject,
    popProvider = newContext.popProvider,
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
    completeWork: function(current, workInProgress) {
      var newProps = workInProgress.pendingProps;
      switch (workInProgress.tag) {
        case 1:
          return null;
        case 2:
          return popLegacyContextProvider(workInProgress), null;
        case 3:
          popHostContainer(workInProgress);
          popTopLevelLegacyContextObject(workInProgress);
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
          var rootContainerInstance = getRootHostContainer(),
            type = workInProgress.type;
          if (null !== current && null != workInProgress.stateNode) {
            var oldProps = current.memoizedProps,
              instance = workInProgress.stateNode,
              currentHostContext = getHostContext();
            instance = prepareUpdate(
              instance,
              type,
              oldProps,
              newProps,
              rootContainerInstance,
              currentHostContext
            );
            updateHostComponent(
              current,
              workInProgress,
              instance,
              type,
              oldProps,
              newProps,
              rootContainerInstance,
              currentHostContext
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
                rootContainerInstance,
                current
              ) && markUpdate(workInProgress);
            else {
              oldProps = createInstance(
                type,
                newProps,
                rootContainerInstance,
                current,
                workInProgress
              );
              a: for (
                currentHostContext = workInProgress.child;
                null !== currentHostContext;

              ) {
                if (
                  5 === currentHostContext.tag ||
                  6 === currentHostContext.tag
                )
                  appendInitialChild(oldProps, currentHostContext.stateNode);
                else if (
                  4 !== currentHostContext.tag &&
                  null !== currentHostContext.child
                ) {
                  currentHostContext.child.return = currentHostContext;
                  currentHostContext = currentHostContext.child;
                  continue;
                }
                if (currentHostContext === workInProgress) break;
                for (; null === currentHostContext.sibling; ) {
                  if (
                    null === currentHostContext.return ||
                    currentHostContext.return === workInProgress
                  )
                    break a;
                  currentHostContext = currentHostContext.return;
                }
                currentHostContext.sibling.return = currentHostContext.return;
                currentHostContext = currentHostContext.sibling;
              }
              finalizeInitialChildren(
                oldProps,
                type,
                newProps,
                rootContainerInstance,
                current
              ) && markUpdate(workInProgress);
              workInProgress.stateNode = oldProps;
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
            rootContainerInstance = getRootHostContainer();
            type = getHostContext();
            popHydrationState(workInProgress)
              ? prepareToHydrateHostTextInstance(workInProgress) &&
                markUpdate(workInProgress)
              : (workInProgress.stateNode = createTextInstance(
                  newProps,
                  rootContainerInstance,
                  type,
                  workInProgress
                ));
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
  };
}
function createCapturedValue(value, source) {
  return {
    value: value,
    source: source,
    stack: getStackAddendumByWorkInProgressFiber(source)
  };
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
function ReactFiberCommitWork(config, captureError) {
  function safelyDetachRef(current) {
    var ref = current.ref;
    if (null !== ref)
      if ("function" === typeof ref)
        try {
          ref(null);
        } catch (refError) {
          captureError(current, refError);
        }
      else ref.current = null;
  }
  function commitUnmount(current) {
    "function" === typeof onCommitUnmount && onCommitUnmount(current);
    switch (current.tag) {
      case 2:
        safelyDetachRef(current);
        var _instance6 = current.stateNode;
        if ("function" === typeof _instance6.componentWillUnmount)
          try {
            (_instance6.props = current.memoizedProps),
              (_instance6.state = current.memoizedState),
              _instance6.componentWillUnmount();
          } catch (unmountError) {
            captureError(current, unmountError);
          }
        break;
      case 5:
        safelyDetachRef(current);
        break;
      case 4:
        mutation && unmountHostComponents(current);
    }
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
            null === node$jscomp$0.child ||
              (mutation && 4 === node$jscomp$0.tag))
          ) {
            if (node$jscomp$0 === root) break;
            for (; null === node$jscomp$0.sibling; ) {
              if (
                null === node$jscomp$0.return ||
                node$jscomp$0.return === root
              )
                break a;
              node$jscomp$0 = node$jscomp$0.return;
            }
            node$jscomp$0.sibling.return = node$jscomp$0.return;
            node$jscomp$0 = node$jscomp$0.sibling;
          } else
            (node$jscomp$0.child.return = node$jscomp$0),
              (node$jscomp$0 = node$jscomp$0.child);
        currentParentIsContainer
          ? removeChildFromContainer(currentParent, node.stateNode)
          : removeChild(currentParent, node.stateNode);
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
    commitBeforeMutationLifeCycles: function(current, finishedWork) {
      switch (finishedWork.tag) {
        case 2:
          if (finishedWork.effectTag & 256 && null !== current) {
            var prevProps = current.memoizedProps,
              prevState = current.memoizedState;
            current = finishedWork.stateNode;
            current.props = finishedWork.memoizedProps;
            current.state = finishedWork.memoizedState;
            finishedWork = current.getSnapshotBeforeUpdate(
              prevProps,
              prevState
            );
            current.__reactInternalSnapshotBeforeUpdate = finishedWork;
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
    },
    commitResetTextContent: function(current) {
      resetTextContent(current.stateNode);
    },
    commitPlacement: function(finishedWork) {
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
      parentFiber.effectTag & 16 &&
        (resetTextContent(parent), (parentFiber.effectTag &= -17));
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
          parentFiber
            ? isContainer
              ? insertInContainerBefore(parent, node.stateNode, parentFiber)
              : insertBefore(parent, node.stateNode, parentFiber)
            : isContainer
              ? appendChildToContainer(parent, node.stateNode)
              : appendChild(parent, node.stateNode);
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
    },
    commitDeletion: function(current) {
      unmountHostComponents(current);
      current.return = null;
      current.child = null;
      current.alternate &&
        ((current.alternate.child = null), (current.alternate.return = null));
    },
    commitWork: function(current, finishedWork) {
      switch (finishedWork.tag) {
        case 2:
          break;
        case 5:
          var _instance7 = finishedWork.stateNode;
          if (null != _instance7) {
            var newProps = finishedWork.memoizedProps;
            current = null !== current ? current.memoizedProps : newProps;
            var type = finishedWork.type,
              updatePayload = finishedWork.updateQueue;
            finishedWork.updateQueue = null;
            null !== updatePayload &&
              commitUpdate(
                _instance7,
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
          _instance7 = finishedWork.memoizedProps;
          commitTextUpdate(
            finishedWork.stateNode,
            null !== current ? current.memoizedProps : _instance7,
            _instance7
          );
          break;
        case 3:
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
    },
    commitLifeCycles: function(
      finishedRoot,
      current,
      finishedWork,
      currentTime,
      committedExpirationTime
    ) {
      switch (finishedWork.tag) {
        case 2:
          finishedRoot = finishedWork.stateNode;
          finishedWork.effectTag & 4 &&
            (null === current
              ? ((finishedRoot.props = finishedWork.memoizedProps),
                (finishedRoot.state = finishedWork.memoizedState),
                finishedRoot.componentDidMount())
              : ((currentTime = current.memoizedProps),
                (current = current.memoizedState),
                (finishedRoot.props = finishedWork.memoizedProps),
                (finishedRoot.state = finishedWork.memoizedState),
                finishedRoot.componentDidUpdate(
                  currentTime,
                  current,
                  finishedRoot.__reactInternalSnapshotBeforeUpdate
                )));
          current = finishedWork.updateQueue;
          null !== current &&
            ((finishedRoot.props = finishedWork.memoizedProps),
            (finishedRoot.state = finishedWork.memoizedState),
            commitUpdateQueue(
              finishedWork,
              current,
              finishedRoot,
              committedExpirationTime
            ));
          break;
        case 3:
          current = finishedWork.updateQueue;
          if (null !== current) {
            finishedRoot = null;
            if (null !== finishedWork.child)
              switch (finishedWork.child.tag) {
                case 5:
                  finishedRoot = getPublicInstance(
                    finishedWork.child.stateNode
                  );
                  break;
                case 2:
                  finishedRoot = finishedWork.child.stateNode;
              }
            commitUpdateQueue(
              finishedWork,
              current,
              finishedRoot,
              committedExpirationTime
            );
          }
          break;
        case 5:
          committedExpirationTime = finishedWork.stateNode;
          null === current &&
            finishedWork.effectTag & 4 &&
            commitMount(
              committedExpirationTime,
              finishedWork.type,
              finishedWork.memoizedProps,
              finishedWork
            );
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
    },
    commitAttachRef: function(finishedWork) {
      var ref = finishedWork.ref;
      if (null !== ref) {
        var _instance5 = finishedWork.stateNode;
        switch (finishedWork.tag) {
          case 5:
            finishedWork = getPublicInstance(_instance5);
            break;
          default:
            finishedWork = _instance5;
        }
        "function" === typeof ref
          ? ref(finishedWork)
          : (ref.current = finishedWork);
      }
    },
    commitDetachRef: function(current) {
      current = current.ref;
      null !== current &&
        ("function" === typeof current
          ? current(null)
          : (current.current = null));
    }
  };
}
function ReactFiberUnwindWork(
  config,
  hostContext,
  legacyContext,
  newContext,
  scheduleWork,
  computeExpirationForFiber,
  recalculateCurrentTime,
  markLegacyErrorBoundaryAsFailed,
  isAlreadyFailedLegacyErrorBoundary,
  onUncaughtError
) {
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
        markLegacyErrorBoundaryAsFailed(this);
        var error = errorInfo.value,
          stack = errorInfo.stack;
        logError(fiber, errorInfo);
        this.componentDidCatch(error, {
          componentStack: null !== stack ? stack : ""
        });
      });
    return expirationTime;
  }
  var popHostContainer = hostContext.popHostContainer,
    popHostContext = hostContext.popHostContext,
    popLegacyContextProvider = legacyContext.popContextProvider,
    popTopLevelLegacyContextObject = legacyContext.popTopLevelContextObject,
    popProvider = newContext.popProvider;
  return {
    throwException: function(
      root,
      returnFiber,
      sourceFiber,
      value,
      renderIsExpired,
      renderExpirationTime
    ) {
      sourceFiber.effectTag |= 512;
      sourceFiber.firstEffect = sourceFiber.lastEffect = null;
      value = createCapturedValue(value, sourceFiber);
      root = returnFiber;
      do {
        switch (root.tag) {
          case 3:
            root.effectTag |= 1024;
            value = createRootErrorUpdate(root, value, renderExpirationTime);
            enqueueCapturedUpdate(root, value, renderExpirationTime);
            return;
          case 2:
            if (
              ((returnFiber = value),
              (sourceFiber = root.stateNode),
              0 === (root.effectTag & 64) &&
                null !== sourceFiber &&
                "function" === typeof sourceFiber.componentDidCatch &&
                !isAlreadyFailedLegacyErrorBoundary(sourceFiber))
            ) {
              root.effectTag |= 1024;
              value = createClassErrorUpdate(
                root,
                returnFiber,
                renderExpirationTime
              );
              enqueueCapturedUpdate(root, value, renderExpirationTime);
              return;
            }
        }
        root = root.return;
      } while (null !== root);
    },
    unwindWork: function(workInProgress) {
      switch (workInProgress.tag) {
        case 2:
          popLegacyContextProvider(workInProgress);
          var effectTag = workInProgress.effectTag;
          return effectTag & 1024
            ? ((workInProgress.effectTag = (effectTag & -1025) | 64),
              workInProgress)
            : null;
        case 3:
          return (
            popHostContainer(workInProgress),
            popTopLevelLegacyContextObject(workInProgress),
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
    },
    unwindInterruptedWork: function(interruptedWork) {
      switch (interruptedWork.tag) {
        case 2:
          popLegacyContextProvider(interruptedWork);
          break;
        case 3:
          popHostContainer(interruptedWork);
          popTopLevelLegacyContextObject(interruptedWork);
          break;
        case 5:
          popHostContext(interruptedWork);
          break;
        case 4:
          popHostContainer(interruptedWork);
          break;
        case 13:
          popProvider(interruptedWork);
      }
    },
    createRootErrorUpdate: createRootErrorUpdate,
    createClassErrorUpdate: createClassErrorUpdate
  };
}
var NO_CONTEXT = {};
function ReactFiberHostContext(config, stack) {
  function requiredContext(c) {
    invariant(
      c !== NO_CONTEXT,
      "Expected host context to exist. This error is likely caused by a bug in React. Please file an issue."
    );
    return c;
  }
  var getChildHostContext = config.getChildHostContext,
    getRootHostContext = config.getRootHostContext;
  config = stack.createCursor;
  var push = stack.push,
    pop = stack.pop,
    contextStackCursor = config(NO_CONTEXT),
    contextFiberStackCursor = config(NO_CONTEXT),
    rootInstanceStackCursor = config(NO_CONTEXT);
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
      push(contextFiberStackCursor, fiber, fiber);
      push(contextStackCursor, NO_CONTEXT, fiber);
      nextRootInstance = getRootHostContext(nextRootInstance);
      pop(contextStackCursor, fiber);
      push(contextStackCursor, nextRootInstance, fiber);
    },
    pushHostContext: function(fiber) {
      var rootInstance = requiredContext(rootInstanceStackCursor.current),
        context = requiredContext(contextStackCursor.current);
      rootInstance = getChildHostContext(context, fiber.type, rootInstance);
      context !== rootInstance &&
        (push(contextFiberStackCursor, fiber, fiber),
        push(contextStackCursor, rootInstance, fiber));
    }
  };
}
function ReactFiberHydrationContext(config) {
  function deleteHydratableInstance(returnFiber, instance) {
    var fiber = new FiberNode(5, null, null, 0);
    fiber.type = "DELETED";
    fiber.stateNode = instance;
    fiber.return = returnFiber;
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
      fiber = fiber.return;
      null !== fiber && 5 !== fiber.tag && 3 !== fiber.tag;

    )
      fiber = fiber.return;
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
function ReactFiberLegacyContext(stack) {
  function cacheContext(workInProgress, unmaskedContext, maskedContext) {
    workInProgress = workInProgress.stateNode;
    workInProgress.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext;
    workInProgress.__reactInternalMemoizedMaskedChildContext = maskedContext;
  }
  function isContextProvider(fiber) {
    return 2 === fiber.tag && null != fiber.type.childContextTypes;
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
  var createCursor = stack.createCursor,
    push = stack.push,
    pop = stack.pop,
    contextStackCursor = createCursor(emptyObject),
    didPerformWorkStackCursor = createCursor(!1),
    previousContext = emptyObject;
  return {
    getUnmaskedContext: function(workInProgress) {
      return isContextProvider(workInProgress)
        ? previousContext
        : contextStackCursor.current;
    },
    cacheContext: cacheContext,
    getMaskedContext: function(workInProgress, unmaskedContext) {
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
      instance && cacheContext(workInProgress, unmaskedContext, context);
      return context;
    },
    hasContextChanged: function() {
      return didPerformWorkStackCursor.current;
    },
    isContextConsumer: function(fiber) {
      return 2 === fiber.tag && null != fiber.type.contextTypes;
    },
    isContextProvider: isContextProvider,
    popContextProvider: function(fiber) {
      isContextProvider(fiber) &&
        (pop(didPerformWorkStackCursor, fiber), pop(contextStackCursor, fiber));
    },
    popTopLevelContextObject: function(fiber) {
      pop(didPerformWorkStackCursor, fiber);
      pop(contextStackCursor, fiber);
    },
    pushTopLevelContextObject: function(fiber, context, didChange) {
      invariant(
        null == contextStackCursor.cursor,
        "Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue."
      );
      push(contextStackCursor, context, fiber);
      push(didPerformWorkStackCursor, didChange, fiber);
    },
    processChildContext: processChildContext,
    pushContextProvider: function(workInProgress) {
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
    },
    invalidateContextProvider: function(workInProgress, didChange) {
      var instance = workInProgress.stateNode;
      invariant(
        instance,
        "Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue."
      );
      if (didChange) {
        var mergedContext = processChildContext(
          workInProgress,
          previousContext
        );
        instance.__reactInternalMemoizedMergedChildContext = mergedContext;
        pop(didPerformWorkStackCursor, workInProgress);
        pop(contextStackCursor, workInProgress);
        push(contextStackCursor, mergedContext, workInProgress);
      } else pop(didPerformWorkStackCursor, workInProgress);
      push(didPerformWorkStackCursor, didChange, workInProgress);
    },
    findCurrentUnmaskedContext: function(fiber) {
      for (
        invariant(
          2 === isFiberMountedImpl(fiber) && 2 === fiber.tag,
          "Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue."
        );
        3 !== fiber.tag;

      ) {
        if (isContextProvider(fiber))
          return fiber.stateNode.__reactInternalMemoizedMergedChildContext;
        fiber = fiber.return;
        invariant(
          fiber,
          "Found unexpected detached subtree parent. This error is likely caused by a bug in React. Please file an issue."
        );
      }
      return fiber.stateNode.context;
    }
  };
}
function ReactFiberNewContext(stack, isPrimaryRenderer) {
  var createCursor = stack.createCursor,
    push = stack.push,
    pop = stack.pop,
    providerCursor = createCursor(null),
    valueCursor = createCursor(null),
    changedBitsCursor = createCursor(0);
  return {
    pushProvider: function(providerFiber) {
      var context = providerFiber.type._context;
      isPrimaryRenderer
        ? (push(changedBitsCursor, context._changedBits, providerFiber),
          push(valueCursor, context._currentValue, providerFiber),
          push(providerCursor, providerFiber, providerFiber),
          (context._currentValue = providerFiber.pendingProps.value),
          (context._changedBits = providerFiber.stateNode))
        : (push(changedBitsCursor, context._changedBits2, providerFiber),
          push(valueCursor, context._currentValue2, providerFiber),
          push(providerCursor, providerFiber, providerFiber),
          (context._currentValue2 = providerFiber.pendingProps.value),
          (context._changedBits2 = providerFiber.stateNode));
    },
    popProvider: function(providerFiber) {
      var changedBits = changedBitsCursor.current,
        currentValue = valueCursor.current;
      pop(providerCursor, providerFiber);
      pop(valueCursor, providerFiber);
      pop(changedBitsCursor, providerFiber);
      providerFiber = providerFiber.type._context;
      isPrimaryRenderer
        ? ((providerFiber._currentValue = currentValue),
          (providerFiber._changedBits = changedBits))
        : ((providerFiber._currentValue2 = currentValue),
          (providerFiber._changedBits2 = changedBits));
    },
    getContextCurrentValue: function(context) {
      return isPrimaryRenderer ? context._currentValue : context._currentValue2;
    },
    getContextChangedBits: function(context) {
      return isPrimaryRenderer ? context._changedBits : context._changedBits2;
    }
  };
}
function ReactFiberStack() {
  var valueStack = [],
    index = -1;
  return {
    createCursor: function(defaultValue) {
      return { current: defaultValue };
    },
    isEmpty: function() {
      return -1 === index;
    },
    pop: function(cursor) {
      0 > index ||
        ((cursor.current = valueStack[index]),
        (valueStack[index] = null),
        index--);
    },
    push: function(cursor, value) {
      index++;
      valueStack[index] = cursor.current;
      cursor.current = value;
    },
    checkThatStackIsEmpty: function() {},
    resetStackAfterFatalErrorInDev: function() {}
  };
}
function ReactFiberScheduler(config) {
  function resetStack() {
    if (null !== nextUnitOfWork)
      for (
        var interruptedWork = nextUnitOfWork.return;
        null !== interruptedWork;

      )
        unwindInterruptedWork(interruptedWork),
          (interruptedWork = interruptedWork.return);
    nextRoot = null;
    nextRenderExpirationTime = 0;
    nextLatestTimeoutMs = -1;
    nextRenderIsExpired = !1;
    nextUnitOfWork = null;
    isRootReadyForCommit = !1;
  }
  function isAlreadyFailedLegacyErrorBoundary(instance) {
    return (
      null !== legacyErrorBoundariesThatAlreadyFailed &&
      legacyErrorBoundariesThatAlreadyFailed.has(instance)
    );
  }
  function markLegacyErrorBoundaryAsFailed(instance) {
    null === legacyErrorBoundariesThatAlreadyFailed
      ? (legacyErrorBoundariesThatAlreadyFailed = new Set([instance]))
      : legacyErrorBoundariesThatAlreadyFailed.add(instance);
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
        if (null !== siblingFiber) return siblingFiber;
        if (null !== returnFiber) workInProgress$jscomp$0 = returnFiber;
        else {
          isRootReadyForCommit = !0;
          break;
        }
      } else {
        workInProgress$jscomp$0 = unwindWork(
          workInProgress$jscomp$0,
          nextRenderIsExpired,
          nextRenderExpirationTime
        );
        if (null !== workInProgress$jscomp$0)
          return (
            (workInProgress$jscomp$0.effectTag &= 511), workInProgress$jscomp$0
          );
        null !== returnFiber &&
          ((returnFiber.firstEffect = returnFiber.lastEffect = null),
          (returnFiber.effectTag |= 512));
        if (null !== siblingFiber) return siblingFiber;
        if (null !== returnFiber) workInProgress$jscomp$0 = returnFiber;
        else break;
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
  function renderRoot(root, expirationTime, isAsync) {
    invariant(
      !isWorking,
      "renderRoot was called recursively. This error is likely caused by a bug in React. Please file an issue."
    );
    isWorking = !0;
    if (
      expirationTime !== nextRenderExpirationTime ||
      root !== nextRoot ||
      null === nextUnitOfWork
    )
      resetStack(),
        (nextRoot = root),
        (nextRenderExpirationTime = expirationTime),
        (nextLatestTimeoutMs = -1),
        (nextUnitOfWork = createWorkInProgress(
          nextRoot.current,
          null,
          nextRenderExpirationTime
        )),
        (root.pendingCommitExpirationTime = 0);
    var didFatal = !1;
    nextRenderIsExpired =
      !isAsync || nextRenderExpirationTime <= mostRecentCurrentTime;
    do {
      try {
        if (isAsync)
          for (; null !== nextUnitOfWork && !shouldYield(); )
            nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        else
          for (; null !== nextUnitOfWork; )
            nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      } catch (thrownValue) {
        if (null === nextUnitOfWork)
          (didFatal = !0), onUncaughtError(thrownValue);
        else {
          invariant(
            null !== nextUnitOfWork,
            "Failed to replay rendering after an error. This is likely caused by a bug in React. Please file an issue with a reproducing case to help us find it."
          );
          isAsync = nextUnitOfWork;
          var returnFiber = isAsync.return;
          if (null === returnFiber) {
            didFatal = !0;
            onUncaughtError(thrownValue);
            break;
          }
          throwException(
            root,
            returnFiber,
            isAsync,
            thrownValue,
            nextRenderIsExpired,
            nextRenderExpirationTime,
            mostRecentCurrentTimeMs
          );
          nextUnitOfWork = completeUnitOfWork(isAsync);
        }
      }
      break;
    } while (1);
    isWorking = !1;
    if (didFatal) return null;
    if (null === nextUnitOfWork) {
      if (isRootReadyForCommit)
        return (
          (root.pendingCommitExpirationTime = expirationTime),
          root.current.alternate
        );
      invariant(
        !nextRenderIsExpired,
        "Expired work should have completed. This error is likely caused by a bug in React. Please file an issue."
      );
      0 <= nextLatestTimeoutMs &&
        setTimeout(function() {
          retrySuspendedRoot(root, expirationTime);
        }, nextLatestTimeoutMs);
      onBlock(root.current.expirationTime);
    }
    return null;
  }
  function onCommitPhaseError(fiber, error) {
    var JSCompiler_inline_result;
    a: {
      invariant(
        !isWorking || isCommitting,
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
                !isAlreadyFailedLegacyErrorBoundary(instance))
            ) {
              fiber = createCapturedValue(error, fiber);
              fiber = createClassErrorUpdate(
                JSCompiler_inline_result,
                fiber,
                1
              );
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
          ? isCommitting ? 1 : nextRenderExpirationTime
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
  function retrySuspendedRoot(root) {
    var retryTime = root.current.expirationTime;
    0 !== retryTime &&
      (0 === root.remainingExpirationTime ||
        root.remainingExpirationTime < retryTime) &&
      requestWork(root, retryTime);
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
          var nextExpirationTimeToWorkOn = root.current.expirationTime;
          (isWorking && !isCommitting && nextRoot === root) ||
            requestWork(root, nextExpirationTimeToWorkOn);
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
    mostRecentCurrentTimeMs = now() - originalStartTimeMs;
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
  function scheduleCallbackWithExpiration(expirationTime) {
    if (0 !== callbackExpirationTime) {
      if (expirationTime > callbackExpirationTime) return;
      cancelDeferredCallback(callbackID);
    }
    var currentMs = now() - originalStartTimeMs;
    callbackExpirationTime = expirationTime;
    callbackID = scheduleDeferredCallback(performAsyncWork, {
      timeout: 10 * (expirationTime - 2) - currentMs
    });
  }
  function requestWork(root, expirationTime) {
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
          performWorkOnRoot(root, 1, !1))
        : 1 === expirationTime
          ? performSyncWork()
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
    previousScheduledRoot === highestPriorityRoot &&
    1 === highestPriorityWork
      ? nestedUpdateCount++
      : (nestedUpdateCount = 0);
    nextFlushedRoot = highestPriorityRoot;
    nextFlushedExpirationTime = highestPriorityWork;
  }
  function performAsyncWork(dl) {
    performWork(0, !0, dl);
  }
  function performSyncWork() {
    performWork(1, !1, null);
  }
  function performWork(minExpirationTime, isAsync, dl) {
    deadline = dl;
    findHighestPriorityRoot();
    if (isAsync)
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
          performWorkOnRoot(
            nextFlushedRoot,
            nextFlushedExpirationTime,
            !deadlineDidExpire
          ),
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
    null !== deadline && ((callbackExpirationTime = 0), (callbackID = -1));
    0 !== nextFlushedExpirationTime &&
      scheduleCallbackWithExpiration(nextFlushedExpirationTime);
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
  function performWorkOnRoot(root, expirationTime, isAsync) {
    invariant(
      !isRendering,
      "performWorkOnRoot was called recursively. This error is likely caused by a bug in React. Please file an issue."
    );
    isRendering = !0;
    isAsync
      ? ((isAsync = root.finishedWork),
        null !== isAsync
          ? completeRoot(root, isAsync, expirationTime)
          : ((root.finishedWork = null),
            (isAsync = renderRoot(root, expirationTime, !0)),
            null !== isAsync &&
              (shouldYield()
                ? (root.finishedWork = isAsync)
                : completeRoot(root, isAsync, expirationTime))))
      : ((isAsync = root.finishedWork),
        null !== isAsync
          ? completeRoot(root, isAsync, expirationTime)
          : ((root.finishedWork = null),
            (isAsync = renderRoot(root, expirationTime, !1)),
            null !== isAsync && completeRoot(root, isAsync, expirationTime)));
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
    firstBatch = expirationTime.pendingCommitExpirationTime;
    invariant(
      0 !== firstBatch,
      "Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue."
    );
    expirationTime.pendingCommitExpirationTime = 0;
    var currentTime = recalculateCurrentTime();
    ReactCurrentOwner.current = null;
    if (1 < finishedWork.effectTag)
      if (null !== finishedWork.lastEffect) {
        finishedWork.lastEffect.nextEffect = finishedWork;
        var firstEffect = finishedWork.firstEffect;
      } else firstEffect = finishedWork;
    else firstEffect = finishedWork.firstEffect;
    prepareForCommit(expirationTime.containerInfo);
    for (nextEffect = firstEffect; null !== nextEffect; ) {
      var didError = !1,
        error = void 0;
      try {
        for (; null !== nextEffect; )
          nextEffect.effectTag & 256 &&
            commitBeforeMutationLifeCycles(nextEffect.alternate, nextEffect),
            (nextEffect = nextEffect.nextEffect);
      } catch (e) {
        (didError = !0), (error = e);
      }
      didError &&
        (invariant(
          null !== nextEffect,
          "Should have next effect. This error is likely caused by a bug in React. Please file an issue."
        ),
        onCommitPhaseError(nextEffect, error),
        null !== nextEffect && (nextEffect = nextEffect.nextEffect));
    }
    for (nextEffect = firstEffect; null !== nextEffect; ) {
      didError = !1;
      error = void 0;
      try {
        for (; null !== nextEffect; ) {
          var effectTag = nextEffect.effectTag;
          effectTag & 16 && commitResetTextContent(nextEffect);
          if (effectTag & 128) {
            var current = nextEffect.alternate;
            null !== current && commitDetachRef(current);
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
              commitDeletion(nextEffect);
          }
          nextEffect = nextEffect.nextEffect;
        }
      } catch (e) {
        (didError = !0), (error = e);
      }
      didError &&
        (invariant(
          null !== nextEffect,
          "Should have next effect. This error is likely caused by a bug in React. Please file an issue."
        ),
        onCommitPhaseError(nextEffect, error),
        null !== nextEffect && (nextEffect = nextEffect.nextEffect));
    }
    resetAfterCommit(expirationTime.containerInfo);
    expirationTime.current = finishedWork;
    for (nextEffect = firstEffect; null !== nextEffect; ) {
      effectTag = !1;
      current = void 0;
      try {
        for (
          firstEffect = expirationTime,
            didError = currentTime,
            error = firstBatch;
          null !== nextEffect;

        ) {
          var effectTag$jscomp$0 = nextEffect.effectTag;
          effectTag$jscomp$0 & 36 &&
            commitLifeCycles(
              firstEffect,
              nextEffect.alternate,
              nextEffect,
              didError,
              error
            );
          effectTag$jscomp$0 & 128 && commitAttachRef(nextEffect);
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
        onCommitPhaseError(nextEffect, current),
        null !== nextEffect && (nextEffect = nextEffect.nextEffect));
    }
    isWorking = isCommitting = !1;
    "function" === typeof onCommitRoot && onCommitRoot(finishedWork.stateNode);
    finishedWork = expirationTime.current.expirationTime;
    0 === finishedWork && (legacyErrorBoundariesThatAlreadyFailed = null);
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
  function onBlock(remainingExpirationTime) {
    invariant(
      null !== nextFlushedRoot,
      "Should be working on a root. This error is likely caused by a bug in React. Please file an issue."
    );
    nextFlushedRoot.remainingExpirationTime = remainingExpirationTime;
  }
  var now = config.now,
    scheduleDeferredCallback = config.scheduleDeferredCallback,
    cancelDeferredCallback = config.cancelDeferredCallback,
    prepareForCommit = config.prepareForCommit,
    resetAfterCommit = config.resetAfterCommit,
    stack = ReactFiberStack(),
    hostContext = ReactFiberHostContext(config, stack),
    legacyContext = ReactFiberLegacyContext(stack);
  stack = ReactFiberNewContext(stack, config.isPrimaryRenderer);
  var profilerTimer = createProfilerTimer(now),
    hydrationContext = ReactFiberHydrationContext(config),
    beginWork = ReactFiberBeginWork(
      config,
      hostContext,
      legacyContext,
      stack,
      hydrationContext,
      scheduleWork,
      computeExpirationForFiber,
      profilerTimer,
      recalculateCurrentTime
    ).beginWork,
    completeWork = ReactFiberCompleteWork(
      config,
      hostContext,
      legacyContext,
      stack,
      hydrationContext,
      profilerTimer
    ).completeWork;
  hostContext = ReactFiberUnwindWork(
    config,
    hostContext,
    legacyContext,
    stack,
    scheduleWork,
    computeExpirationForFiber,
    recalculateCurrentTime,
    markLegacyErrorBoundaryAsFailed,
    isAlreadyFailedLegacyErrorBoundary,
    onUncaughtError,
    profilerTimer,
    function(root, thenable, timeoutMs) {
      0 <= timeoutMs &&
        nextLatestTimeoutMs < timeoutMs &&
        (nextLatestTimeoutMs = timeoutMs);
    },
    retrySuspendedRoot
  );
  var throwException = hostContext.throwException,
    unwindWork = hostContext.unwindWork,
    unwindInterruptedWork = hostContext.unwindInterruptedWork,
    createRootErrorUpdate = hostContext.createRootErrorUpdate,
    createClassErrorUpdate = hostContext.createClassErrorUpdate;
  config = ReactFiberCommitWork(
    config,
    onCommitPhaseError,
    scheduleWork,
    computeExpirationForFiber,
    markLegacyErrorBoundaryAsFailed,
    recalculateCurrentTime
  );
  var commitBeforeMutationLifeCycles = config.commitBeforeMutationLifeCycles,
    commitResetTextContent = config.commitResetTextContent,
    commitPlacement = config.commitPlacement,
    commitDeletion = config.commitDeletion,
    commitWork = config.commitWork,
    commitLifeCycles = config.commitLifeCycles,
    commitAttachRef = config.commitAttachRef,
    commitDetachRef = config.commitDetachRef,
    originalStartTimeMs = now(),
    mostRecentCurrentTime = 2,
    mostRecentCurrentTimeMs = originalStartTimeMs,
    lastUniqueAsyncExpiration = 0,
    expirationContext = 0,
    isWorking = !1,
    nextUnitOfWork = null,
    nextRoot = null,
    nextRenderExpirationTime = 0,
    nextLatestTimeoutMs = -1,
    nextRenderIsExpired = !1,
    nextEffect = null,
    isCommitting = !1,
    isRootReadyForCommit = !1,
    legacyErrorBoundariesThatAlreadyFailed = null,
    firstScheduledRoot = null,
    lastScheduledRoot = null,
    callbackExpirationTime = 0,
    callbackID = -1,
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
  return {
    recalculateCurrentTime: recalculateCurrentTime,
    computeExpirationForFiber: computeExpirationForFiber,
    scheduleWork: scheduleWork,
    requestWork: requestWork,
    flushRoot: function(root, expirationTime) {
      invariant(
        !isRendering,
        "work.commit(): Cannot commit while already rendering. This likely means you attempted to commit from inside a lifecycle method."
      );
      nextFlushedRoot = root;
      nextFlushedExpirationTime = expirationTime;
      performWorkOnRoot(root, expirationTime, !1);
      performSyncWork();
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
          performSyncWork();
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
        (isBatchingUpdates = previousIsBatchingUpdates), performSyncWork();
      }
    },
    flushControlled: function(fn) {
      var previousIsBatchingUpdates = isBatchingUpdates;
      isBatchingUpdates = !0;
      try {
        syncUpdates(fn);
      } finally {
        (isBatchingUpdates = previousIsBatchingUpdates) ||
          isRendering ||
          performWork(1, !1, null);
      }
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
        (performWork(lowestPendingInteractiveExpirationTime, !1, null),
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
            performSyncWork();
      }
    },
    flushInteractiveUpdates: function() {
      isRendering ||
        0 === lowestPendingInteractiveExpirationTime ||
        (performWork(lowestPendingInteractiveExpirationTime, !1, null),
        (lowestPendingInteractiveExpirationTime = 0));
    },
    computeUniqueAsyncExpiration: function() {
      var result =
        2 + 25 * ((((recalculateCurrentTime() - 2 + 500) / 25) | 0) + 1);
      result <= lastUniqueAsyncExpiration &&
        (result = lastUniqueAsyncExpiration + 1);
      return (lastUniqueAsyncExpiration = result);
    },
    legacyContext: legacyContext
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
      var parentContext = findCurrentUnmaskedContext(parentComponent);
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
  var getPublicInstance = config.getPublicInstance;
  config = ReactFiberScheduler(config);
  var recalculateCurrentTime = config.recalculateCurrentTime,
    computeExpirationForFiber = config.computeExpirationForFiber,
    scheduleWork = config.scheduleWork,
    legacyContext = config.legacyContext,
    findCurrentUnmaskedContext = legacyContext.findCurrentUnmaskedContext,
    isContextProvider = legacyContext.isContextProvider,
    processChildContext = legacyContext.processChildContext;
  return {
    createContainer: function(containerInfo, isAsync, hydrate) {
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
        pendingCommitExpirationTime: 0,
        finishedWork: null,
        context: null,
        pendingContext: null,
        hydrate: hydrate,
        remainingExpirationTime: 0,
        firstBatch: null,
        nextScheduledRoot: null
      };
      return (isAsync.stateNode = containerInfo);
    },
    updateContainer: function(element, container, parentComponent, callback) {
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
    },
    updateContainerAtExpirationTime: function(
      element,
      container,
      parentComponent,
      expirationTime,
      callback
    ) {
      return updateContainerAtExpirationTime(
        element,
        container,
        parentComponent,
        expirationTime,
        callback
      );
    },
    flushRoot: config.flushRoot,
    requestWork: config.requestWork,
    computeUniqueAsyncExpiration: config.computeUniqueAsyncExpiration,
    batchedUpdates: config.batchedUpdates,
    unbatchedUpdates: config.unbatchedUpdates,
    deferredUpdates: config.deferredUpdates,
    syncUpdates: config.syncUpdates,
    interactiveUpdates: config.interactiveUpdates,
    flushInteractiveUpdates: config.flushInteractiveUpdates,
    flushControlled: config.flushControlled,
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
    findHostInstance: function(component) {
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
    },
    findHostInstanceWithNoPortals: function(fiber) {
      fiber = findCurrentHostFiberWithNoPortals(fiber);
      return null === fiber ? null : fiber.stateNode;
    },
    injectIntoDevTools: function(devToolsConfig) {
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
  };
}
var ReactFiberReconciler$2 = Object.freeze({ default: ReactFiberReconciler$1 }),
  ReactFiberReconciler$3 =
    (ReactFiberReconciler$2 && ReactFiberReconciler$1) ||
    ReactFiberReconciler$2,
  reactReconciler = ReactFiberReconciler$3.default
    ? ReactFiberReconciler$3.default
    : ReactFiberReconciler$3;
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
    },
    didTimeout: !1
  };
function setTimeoutCallback() {
  frameDeadline = now() + 5;
  var callback = scheduledCallback;
  scheduledCallback = null;
  null !== callback && callback(frameDeadlineObject);
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
var ReactNativeHostConfig = {
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
    var tag = allocateTag(),
      viewConfig = ReactNativeViewConfigRegistry.get(type);
    invariant(
      "RCTView" !== type || !hostContext.isInAParentText,
      "Nesting of <View> within <Text> is not currently supported."
    );
    type = diffProperties(
      null,
      emptyObject$1,
      props,
      viewConfig.validAttributes
    );
    UIManager.createView(
      tag,
      viewConfig.uiViewClassName,
      rootContainerInstance,
      type
    );
    rootContainerInstance = new ReactNativeFiberHostComponent(tag, viewConfig);
    instanceCache[tag] = internalInstanceHandle;
    instanceProps[tag] = props;
    return rootContainerInstance;
  },
  createTextInstance: function(
    text,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    invariant(
      hostContext.isInAParentText,
      "Text strings must be rendered within a <Text> component."
    );
    hostContext = allocateTag();
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
    return { isInAParentText: !1 };
  },
  getChildHostContext: function(parentHostContext, type) {
    type =
      "AndroidTextInput" === type ||
      "RCTMultilineTextInputView" === type ||
      "RCTSinglelineTextInputView" === type ||
      "RCTText" === type ||
      "RCTVirtualText" === type;
    return parentHostContext.isInAParentText !== type
      ? { isInAParentText: type }
      : parentHostContext;
  },
  getPublicInstance: function(instance) {
    return instance;
  },
  now: now,
  isPrimaryRenderer: !0,
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
};
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
var ReactNativeFiberRenderer = reactReconciler(ReactNativeHostConfig),
  findHostInstance = ReactNativeFiberRenderer.findHostInstance;
function findNodeHandle(componentOrHandle) {
  if (null == componentOrHandle) return null;
  if ("number" === typeof componentOrHandle) return componentOrHandle;
  if (componentOrHandle._nativeTag) return componentOrHandle._nativeTag;
  if (componentOrHandle.canonical && componentOrHandle.canonical._nativeTag)
    return componentOrHandle.canonical._nativeTag;
  componentOrHandle = findHostInstance(componentOrHandle);
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
    })(findNodeHandle, findHostInstance),
    findNodeHandle: findNodeHandle,
    render: function(element, containerTag, callback) {
      var root = roots.get(containerTag);
      root ||
        ((root = ReactNativeFiberRenderer.createContainer(
          containerTag,
          !1,
          !1
        )),
        roots.set(containerTag, root));
      ReactNativeFiberRenderer.updateContainer(element, root, null, callback);
      return ReactNativeFiberRenderer.getPublicRootInstance(root);
    },
    unmountComponentAtNode: function(containerTag) {
      var root = roots.get(containerTag);
      root &&
        ReactNativeFiberRenderer.updateContainer(null, root, null, function() {
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
      })(findNodeHandle, findHostInstance),
      ReactNativeComponentTree: ReactNativeComponentTree,
      computeComponentStackForErrorReporting: function(reactTag) {
        return (reactTag = getInstanceFromTag(reactTag))
          ? getStackAddendumByWorkInProgressFiber(reactTag)
          : "";
      }
    }
  };
ReactNativeFiberRenderer.injectIntoDevTools({
  findFiberByHostInstance: getInstanceFromTag,
  getInspectorDataForViewTag: getInspectorDataForViewTag,
  bundleType: 0,
  version: "16.3.2",
  rendererPackageName: "react-native-renderer"
});
var ReactNativeRenderer$2 = Object.freeze({ default: ReactNativeRenderer }),
  ReactNativeRenderer$3 =
    (ReactNativeRenderer$2 && ReactNativeRenderer) || ReactNativeRenderer$2;
module.exports = ReactNativeRenderer$3.default
  ? ReactNativeRenderer$3.default
  : ReactNativeRenderer$3;
