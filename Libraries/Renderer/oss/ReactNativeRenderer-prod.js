/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
var ReactNativeViewConfigRegistry = require("ReactNativeViewConfigRegistry"),
  UIManager = require("UIManager"),
  RCTEventEmitter = require("RCTEventEmitter"),
  React = require("react"),
  deepDiffer = require("deepDiffer"),
  flattenStyle = require("flattenStyle"),
  TextInputState = require("TextInputState");
var scheduler = require("scheduler"),
  ExceptionsManager = require("ExceptionsManager");
function invariant(condition, format, a, b, c, d, e, f) {
  if (!condition) {
    condition = void 0;
    if (void 0 === format)
      condition = Error(
        "Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings."
      );
    else {
      var args = [a, b, c, d, e, f],
        argIndex = 0;
      condition = Error(
        format.replace(/%s/g, function() {
          return args[argIndex++];
        })
      );
      condition.name = "Invariant Violation";
    }
    condition.framesToPop = 1;
    throw condition;
  }
}
function invokeGuardedCallbackImpl(name, func, context, a, b, c, d, e, f) {
  var funcArgs = Array.prototype.slice.call(arguments, 3);
  try {
    func.apply(context, funcArgs);
  } catch (error) {
    this.onError(error);
  }
}
var hasError = !1,
  caughtError = null,
  hasRethrowError = !1,
  rethrowError = null,
  reporter = {
    onError: function(error) {
      hasError = !0;
      caughtError = error;
    }
  };
function invokeGuardedCallback(name, func, context, a, b, c, d, e, f) {
  hasError = !1;
  caughtError = null;
  invokeGuardedCallbackImpl.apply(reporter, arguments);
}
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
    if (hasError) {
      var error = caughtError;
      hasError = !1;
      caughtError = null;
    } else
      invariant(
        !1,
        "clearCaughtError was called but no error was captured. This error is likely caused by a bug in React. Please file an issue."
      ),
        (error = void 0);
    hasRethrowError || ((hasRethrowError = !0), (rethrowError = error));
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
function executeDispatch(event, listener, inst) {
  var type = event.type || "unknown-event";
  event.currentTarget = getNodeFromInstance(inst);
  invokeGuardedCallbackAndCatchFirstError(type, listener, void 0, event);
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
        executeDispatch(e, dispatchListeners[i], dispatchInstances[i]);
    else
      dispatchListeners &&
        executeDispatch(e, dispatchListeners, dispatchInstances);
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
    this.nativeEvent = this._targetInst = this.dispatchConfig = null;
    this.isPropagationStopped = this.isDefaultPrevented = functionThatReturnsFalse;
    this._dispatchInstances = this._dispatchListeners = null;
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
    "Trying to release an event instance into a pool of a different type."
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
      : Array.isArray(next)
        ? [current].concat(next)
        : [current, next];
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
            : depthA
              ? eventTypes$1.responderEnd
              : null)
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
          : topLevelType
            ? eventTypes$1.responderRelease
            : null)
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
  ReactNativeBridgeEventPlugin = {
    eventTypes: ReactNativeViewConfigRegistry.eventTypes,
    extractEvents: function(
      topLevelType,
      targetInst,
      nativeEvent,
      nativeEventTarget
    ) {
      if (null == targetInst) return null;
      var bubbleDispatchConfig =
          ReactNativeViewConfigRegistry.customBubblingEventTypes[topLevelType],
        directDispatchConfig =
          ReactNativeViewConfigRegistry.customDirectEventTypes[topLevelType];
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
function getInstanceFromTag(tag) {
  return instanceCache[tag] || null;
}
var restoreTarget = null,
  restoreQueue = null;
function restoreStateOfTarget(target) {
  if ((target = getInstanceFromNode(target))) {
    invariant(
      !1,
      "setRestoreImplementation() needs to be called to handle a target for controlled events. This error is likely caused by a bug in React. Please file an issue."
    );
    var props = getFiberCurrentPropsFromNode(target.stateNode);
    null(target.stateNode, target.type, props);
  }
}
function _batchedUpdatesImpl(fn, bookkeeping) {
  return fn(bookkeeping);
}
function _flushInteractiveUpdatesImpl() {}
var isBatching = !1;
function batchedUpdates(fn, bookkeeping) {
  if (isBatching) return fn(bookkeeping);
  isBatching = !0;
  try {
    return _batchedUpdatesImpl(fn, bookkeeping);
  } finally {
    if (((isBatching = !1), null !== restoreTarget || null !== restoreQueue))
      if (
        (_flushInteractiveUpdatesImpl(),
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
    if (
      events &&
      (forEachAccumulated(events, executeDispatchesAndReleaseTopLevel),
      invariant(
        !eventQueue,
        "processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented."
      ),
      hasRethrowError)
    )
      throw ((events = rethrowError),
      (hasRethrowError = !1),
      (rethrowError = null),
      events);
  });
}
RCTEventEmitter.register({
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
getFiberCurrentPropsFromNode = function(stateNode) {
  return instanceProps[stateNode._nativeTag] || null;
};
getInstanceFromNode = getInstanceFromTag;
getNodeFromInstance = function(inst) {
  var tag = inst.stateNode._nativeTag;
  void 0 === tag && (tag = inst.stateNode.canonical._nativeTag);
  invariant(tag, "All native instances should have a tag.");
  return tag;
};
ResponderEventPlugin.injection.injectGlobalResponderHandler({
  onChange: function(from, to, blockNativeResponder) {
    null !== to
      ? UIManager.setJSResponder(to.stateNode._nativeTag, blockNativeResponder)
      : UIManager.clearJSResponder();
  }
});
var ReactSharedInternals =
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  hasSymbol = "function" === typeof Symbol && Symbol.for,
  REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for("react.element") : 60103,
  REACT_PORTAL_TYPE = hasSymbol ? Symbol.for("react.portal") : 60106,
  REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for("react.fragment") : 60107,
  REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for("react.strict_mode") : 60108,
  REACT_PROFILER_TYPE = hasSymbol ? Symbol.for("react.profiler") : 60114,
  REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for("react.provider") : 60109,
  REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for("react.context") : 60110,
  REACT_CONCURRENT_MODE_TYPE = hasSymbol
    ? Symbol.for("react.concurrent_mode")
    : 60111,
  REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for("react.forward_ref") : 60112,
  REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for("react.suspense") : 60113,
  REACT_MEMO_TYPE = hasSymbol ? Symbol.for("react.memo") : 60115,
  REACT_LAZY_TYPE = hasSymbol ? Symbol.for("react.lazy") : 60116,
  MAYBE_ITERATOR_SYMBOL = "function" === typeof Symbol && Symbol.iterator;
function getIteratorFn(maybeIterable) {
  if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
  maybeIterable =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable["@@iterator"];
  return "function" === typeof maybeIterable ? maybeIterable : null;
}
function getComponentName(type) {
  if (null == type) return null;
  if ("function" === typeof type) return type.displayName || type.name || null;
  if ("string" === typeof type) return type;
  switch (type) {
    case REACT_CONCURRENT_MODE_TYPE:
      return "ConcurrentMode";
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
  }
  if ("object" === typeof type)
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE:
        return "Context.Consumer";
      case REACT_PROVIDER_TYPE:
        return "Context.Provider";
      case REACT_FORWARD_REF_TYPE:
        var innerType = type.render;
        innerType = innerType.displayName || innerType.name || "";
        return (
          type.displayName ||
          ("" !== innerType ? "ForwardRef(" + innerType + ")" : "ForwardRef")
        );
      case REACT_MEMO_TYPE:
        return getComponentName(type.type);
      case REACT_LAZY_TYPE:
        if ((type = 1 === type._status ? type._result : null))
          return getComponentName(type);
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
var emptyObject = {},
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
      emptyObject,
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
      emptyObject,
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
function mountSafeCallback_NOT_REALLY_SAFE(context, callback) {
  return function() {
    if (
      callback &&
      ("boolean" !== typeof context.__isMounted || context.__isMounted)
    )
      return callback.apply(context, arguments);
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
      UIManager.measure(
        this._nativeTag,
        mountSafeCallback_NOT_REALLY_SAFE(this, callback)
      );
    };
    ReactNativeFiberHostComponent.prototype.measureInWindow = function(
      callback
    ) {
      UIManager.measureInWindow(
        this._nativeTag,
        mountSafeCallback_NOT_REALLY_SAFE(this, callback)
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
        mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
        mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess)
      );
    };
    ReactNativeFiberHostComponent.prototype.setNativeProps = function(
      nativeProps
    ) {
      nativeProps = diffProperties(
        null,
        emptyObject,
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
  frameDeadline = 0;
function setTimeoutCallback() {
  frameDeadline = now$1() + 5;
  var callback = scheduledCallback;
  scheduledCallback = null;
  null !== callback && callback();
}
function shim$1() {
  invariant(
    !1,
    "The current renderer does not support hydration. This error is likely caused by a bug in React. Please file an issue."
  );
}
var UPDATE_SIGNAL = {},
  nextReactTag = 3;
function allocateTag() {
  var tag = nextReactTag;
  1 === tag % 10 && (tag += 2);
  nextReactTag = tag + 2;
  return tag;
}
function recursivelyUncacheFiberNode(node) {
  if ("number" === typeof node)
    delete instanceCache[node], delete instanceProps[node];
  else {
    var tag = node._nativeTag;
    delete instanceCache[tag];
    delete instanceProps[tag];
    node._children.forEach(recursivelyUncacheFiberNode);
  }
}
function finalizeInitialChildren(parentInstance) {
  if (0 === parentInstance._children.length) return !1;
  var nativeTags = parentInstance._children.map(function(child) {
    return "number" === typeof child ? child : child._nativeTag;
  });
  UIManager.setChildren(parentInstance._nativeTag, nativeTags);
  return !1;
}
var scheduleTimeout = setTimeout,
  cancelTimeout = clearTimeout,
  BEFORE_SLASH_RE = /^(.*)[\\\/]/;
function getStackByFiberInDevAndProd(workInProgress) {
  var info = "";
  do {
    a: switch (workInProgress.tag) {
      case 3:
      case 4:
      case 6:
      case 7:
      case 10:
      case 9:
        var JSCompiler_inline_result = "";
        break a;
      default:
        var owner = workInProgress._debugOwner,
          source = workInProgress._debugSource,
          name = getComponentName(workInProgress.type);
        JSCompiler_inline_result = null;
        owner && (JSCompiler_inline_result = getComponentName(owner.type));
        owner = name;
        name = "";
        source
          ? (name =
              " (at " +
              source.fileName.replace(BEFORE_SLASH_RE, "") +
              ":" +
              source.lineNumber +
              ")")
          : JSCompiler_inline_result &&
            (name = " (created by " + JSCompiler_inline_result + ")");
        JSCompiler_inline_result = "\n    in " + (owner || "Unknown") + name;
    }
    info += JSCompiler_inline_result;
    workInProgress = workInProgress.return;
  } while (workInProgress);
  return info;
}
new Set();
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
var emptyContextObject = {},
  contextStackCursor = { current: emptyContextObject },
  didPerformWorkStackCursor = { current: !1 },
  previousContext = emptyContextObject;
function getMaskedContext(workInProgress, unmaskedContext) {
  var contextTypes = workInProgress.type.contextTypes;
  if (!contextTypes) return emptyContextObject;
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
function isContextProvider(type) {
  type = type.childContextTypes;
  return null !== type && void 0 !== type;
}
function popContext(fiber) {
  pop(didPerformWorkStackCursor, fiber);
  pop(contextStackCursor, fiber);
}
function popTopLevelContextObject(fiber) {
  pop(didPerformWorkStackCursor, fiber);
  pop(contextStackCursor, fiber);
}
function pushTopLevelContextObject(fiber, context, didChange) {
  invariant(
    contextStackCursor.current === emptyContextObject,
    "Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue."
  );
  push(contextStackCursor, context, fiber);
  push(didPerformWorkStackCursor, didChange, fiber);
}
function processChildContext(fiber, type, parentContext) {
  var instance = fiber.stateNode;
  fiber = type.childContextTypes;
  if ("function" !== typeof instance.getChildContext) return parentContext;
  instance = instance.getChildContext();
  for (var contextKey in instance)
    invariant(
      contextKey in fiber,
      '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
      getComponentName(type) || "Unknown",
      contextKey
    );
  return Object.assign({}, parentContext, instance);
}
function pushContextProvider(workInProgress) {
  var instance = workInProgress.stateNode;
  instance =
    (instance && instance.__reactInternalMemoizedMergedChildContext) ||
    emptyContextObject;
  previousContext = contextStackCursor.current;
  push(contextStackCursor, instance, workInProgress);
  push(
    didPerformWorkStackCursor,
    didPerformWorkStackCursor.current,
    workInProgress
  );
  return !0;
}
function invalidateContextProvider(workInProgress, type, didChange) {
  var instance = workInProgress.stateNode;
  invariant(
    instance,
    "Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue."
  );
  didChange
    ? ((type = processChildContext(workInProgress, type, previousContext)),
      (instance.__reactInternalMemoizedMergedChildContext = type),
      pop(didPerformWorkStackCursor, workInProgress),
      pop(contextStackCursor, workInProgress),
      push(contextStackCursor, type, workInProgress))
    : pop(didPerformWorkStackCursor, workInProgress);
  push(didPerformWorkStackCursor, didChange, workInProgress);
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
function FiberNode(tag, pendingProps, key, mode) {
  this.tag = tag;
  this.key = key;
  this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
  this.index = 0;
  this.ref = null;
  this.pendingProps = pendingProps;
  this.firstContextDependency = this.memoizedState = this.updateQueue = this.memoizedProps = null;
  this.mode = mode;
  this.effectTag = 0;
  this.lastEffect = this.firstEffect = this.nextEffect = null;
  this.childExpirationTime = this.expirationTime = 0;
  this.alternate = null;
}
function createFiber(tag, pendingProps, key, mode) {
  return new FiberNode(tag, pendingProps, key, mode);
}
function shouldConstruct(Component) {
  Component = Component.prototype;
  return !(!Component || !Component.isReactComponent);
}
function resolveLazyComponentTag(Component) {
  if ("function" === typeof Component)
    return shouldConstruct(Component) ? 1 : 0;
  if (void 0 !== Component && null !== Component) {
    Component = Component.$$typeof;
    if (Component === REACT_FORWARD_REF_TYPE) return 11;
    if (Component === REACT_MEMO_TYPE) return 14;
  }
  return 2;
}
function createWorkInProgress(current, pendingProps) {
  var workInProgress = current.alternate;
  null === workInProgress
    ? ((workInProgress = createFiber(
        current.tag,
        pendingProps,
        current.key,
        current.mode
      )),
      (workInProgress.elementType = current.elementType),
      (workInProgress.type = current.type),
      (workInProgress.stateNode = current.stateNode),
      (workInProgress.alternate = current),
      (current.alternate = workInProgress))
    : ((workInProgress.pendingProps = pendingProps),
      (workInProgress.effectTag = 0),
      (workInProgress.nextEffect = null),
      (workInProgress.firstEffect = null),
      (workInProgress.lastEffect = null));
  workInProgress.childExpirationTime = current.childExpirationTime;
  workInProgress.expirationTime = current.expirationTime;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.firstContextDependency = current.firstContextDependency;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;
  return workInProgress;
}
function createFiberFromTypeAndProps(
  type,
  key,
  pendingProps,
  owner,
  mode,
  expirationTime
) {
  var fiberTag = 2;
  owner = type;
  if ("function" === typeof type) shouldConstruct(type) && (fiberTag = 1);
  else if ("string" === typeof type) fiberTag = 5;
  else
    a: switch (type) {
      case REACT_FRAGMENT_TYPE:
        return createFiberFromFragment(
          pendingProps.children,
          mode,
          expirationTime,
          key
        );
      case REACT_CONCURRENT_MODE_TYPE:
        return createFiberFromMode(pendingProps, mode | 3, expirationTime, key);
      case REACT_STRICT_MODE_TYPE:
        return createFiberFromMode(pendingProps, mode | 2, expirationTime, key);
      case REACT_PROFILER_TYPE:
        return (
          (type = createFiber(12, pendingProps, key, mode | 4)),
          (type.elementType = REACT_PROFILER_TYPE),
          (type.type = REACT_PROFILER_TYPE),
          (type.expirationTime = expirationTime),
          type
        );
      case REACT_SUSPENSE_TYPE:
        return (
          (type = createFiber(13, pendingProps, key, mode)),
          (type.elementType = REACT_SUSPENSE_TYPE),
          (type.type = REACT_SUSPENSE_TYPE),
          (type.expirationTime = expirationTime),
          type
        );
      default:
        if ("object" === typeof type && null !== type)
          switch (type.$$typeof) {
            case REACT_PROVIDER_TYPE:
              fiberTag = 10;
              break a;
            case REACT_CONTEXT_TYPE:
              fiberTag = 9;
              break a;
            case REACT_FORWARD_REF_TYPE:
              fiberTag = 11;
              break a;
            case REACT_MEMO_TYPE:
              fiberTag = 14;
              break a;
            case REACT_LAZY_TYPE:
              fiberTag = 16;
              owner = null;
              break a;
          }
        invariant(
          !1,
          "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s",
          null == type ? type : typeof type,
          ""
        );
    }
  key = createFiber(fiberTag, pendingProps, key, mode);
  key.elementType = type;
  key.type = owner;
  key.expirationTime = expirationTime;
  return key;
}
function createFiberFromFragment(elements, mode, expirationTime, key) {
  elements = createFiber(7, elements, key, mode);
  elements.expirationTime = expirationTime;
  return elements;
}
function createFiberFromMode(pendingProps, mode, expirationTime, key) {
  pendingProps = createFiber(8, pendingProps, key, mode);
  mode = 0 === (mode & 1) ? REACT_STRICT_MODE_TYPE : REACT_CONCURRENT_MODE_TYPE;
  pendingProps.elementType = mode;
  pendingProps.type = mode;
  pendingProps.expirationTime = expirationTime;
  return pendingProps;
}
function createFiberFromText(content, mode, expirationTime) {
  content = createFiber(6, content, null, mode);
  content.expirationTime = expirationTime;
  return content;
}
function createFiberFromPortal(portal, mode, expirationTime) {
  mode = createFiber(
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
function markPendingPriorityLevel(root, expirationTime) {
  root.didError = !1;
  var earliestPendingTime = root.earliestPendingTime;
  0 === earliestPendingTime
    ? (root.earliestPendingTime = root.latestPendingTime = expirationTime)
    : earliestPendingTime < expirationTime
      ? (root.earliestPendingTime = expirationTime)
      : root.latestPendingTime > expirationTime &&
        (root.latestPendingTime = expirationTime);
  findNextExpirationTimeToWorkOn(expirationTime, root);
}
function markSuspendedPriorityLevel(root, suspendedTime) {
  root.didError = !1;
  var latestPingedTime = root.latestPingedTime;
  0 !== latestPingedTime &&
    latestPingedTime >= suspendedTime &&
    (root.latestPingedTime = 0);
  latestPingedTime = root.earliestPendingTime;
  var latestPendingTime = root.latestPendingTime;
  latestPingedTime === suspendedTime
    ? (root.earliestPendingTime =
        latestPendingTime === suspendedTime
          ? (root.latestPendingTime = 0)
          : latestPendingTime)
    : latestPendingTime === suspendedTime &&
      (root.latestPendingTime = latestPingedTime);
  latestPingedTime = root.earliestSuspendedTime;
  latestPendingTime = root.latestSuspendedTime;
  0 === latestPingedTime
    ? (root.earliestSuspendedTime = root.latestSuspendedTime = suspendedTime)
    : latestPingedTime < suspendedTime
      ? (root.earliestSuspendedTime = suspendedTime)
      : latestPendingTime > suspendedTime &&
        (root.latestSuspendedTime = suspendedTime);
  findNextExpirationTimeToWorkOn(suspendedTime, root);
}
function findEarliestOutstandingPriorityLevel(root, renderExpirationTime) {
  var earliestPendingTime = root.earliestPendingTime;
  root = root.earliestSuspendedTime;
  earliestPendingTime > renderExpirationTime &&
    (renderExpirationTime = earliestPendingTime);
  root > renderExpirationTime && (renderExpirationTime = root);
  return renderExpirationTime;
}
function findNextExpirationTimeToWorkOn(completedExpirationTime, root) {
  var earliestSuspendedTime = root.earliestSuspendedTime,
    latestSuspendedTime = root.latestSuspendedTime,
    earliestPendingTime = root.earliestPendingTime,
    latestPingedTime = root.latestPingedTime;
  earliestPendingTime =
    0 !== earliestPendingTime ? earliestPendingTime : latestPingedTime;
  0 === earliestPendingTime &&
    (0 === completedExpirationTime ||
      latestSuspendedTime < completedExpirationTime) &&
    (earliestPendingTime = latestSuspendedTime);
  completedExpirationTime = earliestPendingTime;
  0 !== completedExpirationTime &&
    earliestSuspendedTime > completedExpirationTime &&
    (completedExpirationTime = earliestSuspendedTime);
  root.nextExpirationTimeToWorkOn = earliestPendingTime;
  root.expirationTime = completedExpirationTime;
}
var hasForceUpdate = !1;
function createUpdateQueue(baseState) {
  return {
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
function appendUpdateToQueue(queue, update) {
  null === queue.lastUpdate
    ? (queue.firstUpdate = queue.lastUpdate = update)
    : ((queue.lastUpdate.next = update), (queue.lastUpdate = update));
}
function enqueueUpdate(fiber, update) {
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
    ? appendUpdateToQueue(queue1, update)
    : null === queue1.lastUpdate || null === queue2.lastUpdate
      ? (appendUpdateToQueue(queue1, update),
        appendUpdateToQueue(queue2, update))
      : (appendUpdateToQueue(queue1, update), (queue2.lastUpdate = update));
}
function enqueueCapturedUpdate(workInProgress, update) {
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
      workInProgress.effectTag = (workInProgress.effectTag & -2049) | 64;
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
    updateExpirationTime < renderExpirationTime
      ? (null === newFirstUpdate &&
          ((newFirstUpdate = update), (newBaseState = resultState)),
        newExpirationTime < updateExpirationTime &&
          (newExpirationTime = updateExpirationTime))
      : ((resultState = getStateFromUpdate(
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
              (queue.lastEffect = update))));
    update = update.next;
  }
  updateExpirationTime = null;
  for (update = queue.firstCapturedUpdate; null !== update; ) {
    var _updateExpirationTime = update.expirationTime;
    _updateExpirationTime < renderExpirationTime
      ? (null === updateExpirationTime &&
          ((updateExpirationTime = update),
          null === newFirstUpdate && (newBaseState = resultState)),
        newExpirationTime < _updateExpirationTime &&
          (newExpirationTime = _updateExpirationTime))
      : ((resultState = getStateFromUpdate(
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
              (queue.lastCapturedEffect = update))));
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
  workInProgress.expirationTime = newExpirationTime;
  workInProgress.memoizedState = resultState;
}
function commitUpdateQueue(finishedWork, finishedQueue, instance) {
  null !== finishedQueue.firstCapturedUpdate &&
    (null !== finishedQueue.lastUpdate &&
      ((finishedQueue.lastUpdate.next = finishedQueue.firstCapturedUpdate),
      (finishedQueue.lastUpdate = finishedQueue.lastCapturedUpdate)),
    (finishedQueue.firstCapturedUpdate = finishedQueue.lastCapturedUpdate = null));
  commitUpdateEffects(finishedQueue.firstEffect, instance);
  finishedQueue.firstEffect = finishedQueue.lastEffect = null;
  commitUpdateEffects(finishedQueue.firstCapturedEffect, instance);
  finishedQueue.firstCapturedEffect = finishedQueue.lastCapturedEffect = null;
}
function commitUpdateEffects(effect, instance) {
  for (; null !== effect; ) {
    var _callback3 = effect.callback;
    if (null !== _callback3) {
      effect.callback = null;
      var context = instance;
      invariant(
        "function" === typeof _callback3,
        "Invalid argument passed as callback. Expected a function. Instead received: %s",
        _callback3
      );
      _callback3.call(context);
    }
    effect = effect.nextEffect;
  }
}
function createCapturedValue(value, source) {
  return {
    value: value,
    source: source,
    stack: getStackByFiberInDevAndProd(source)
  };
}
var valueCursor = { current: null },
  currentlyRenderingFiber = null,
  lastContextDependency = null,
  lastContextWithAllBitsObserved = null;
function pushProvider(providerFiber, nextValue) {
  var context = providerFiber.type._context;
  push(valueCursor, context._currentValue, providerFiber);
  context._currentValue = nextValue;
}
function popProvider(providerFiber) {
  var currentValue = valueCursor.current;
  pop(valueCursor, providerFiber);
  providerFiber.type._context._currentValue = currentValue;
}
function prepareToReadContext(workInProgress) {
  currentlyRenderingFiber = workInProgress;
  lastContextWithAllBitsObserved = lastContextDependency = null;
  workInProgress.firstContextDependency = null;
}
function readContext(context, observedBits) {
  if (
    lastContextWithAllBitsObserved !== context &&
    !1 !== observedBits &&
    0 !== observedBits
  ) {
    if ("number" !== typeof observedBits || 1073741823 === observedBits)
      (lastContextWithAllBitsObserved = context), (observedBits = 1073741823);
    observedBits = { context: context, observedBits: observedBits, next: null };
    null === lastContextDependency
      ? (invariant(
          null !== currentlyRenderingFiber,
          "Context can only be read while React is rendering, e.g. inside the render method or getDerivedStateFromProps."
        ),
        (currentlyRenderingFiber.firstContextDependency = lastContextDependency = observedBits))
      : (lastContextDependency = lastContextDependency.next = observedBits);
  }
  return context._currentValue;
}
var NO_CONTEXT = {},
  contextStackCursor$1 = { current: NO_CONTEXT },
  contextFiberStackCursor = { current: NO_CONTEXT },
  rootInstanceStackCursor = { current: NO_CONTEXT };
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
function pushHostContext(fiber) {
  requiredContext(rootInstanceStackCursor.current);
  var context = requiredContext(contextStackCursor$1.current);
  var nextContext = fiber.type;
  nextContext =
    "AndroidTextInput" === nextContext ||
    "RCTMultilineTextInputView" === nextContext ||
    "RCTSinglelineTextInputView" === nextContext ||
    "RCTText" === nextContext ||
    "RCTVirtualText" === nextContext;
  nextContext =
    context.isInAParentText !== nextContext
      ? { isInAParentText: nextContext }
      : context;
  context !== nextContext &&
    (push(contextFiberStackCursor, fiber, fiber),
    push(contextStackCursor$1, nextContext, fiber));
}
function popHostContext(fiber) {
  contextFiberStackCursor.current === fiber &&
    (pop(contextStackCursor$1, fiber), pop(contextFiberStackCursor, fiber));
}
var hasOwnProperty = Object.prototype.hasOwnProperty;
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
function resolveDefaultProps(Component, baseProps) {
  if (Component && Component.defaultProps) {
    baseProps = Object.assign({}, baseProps);
    Component = Component.defaultProps;
    for (var propName in Component)
      void 0 === baseProps[propName] &&
        (baseProps[propName] = Component[propName]);
  }
  return baseProps;
}
function readLazyComponentType(lazyComponent) {
  var result = lazyComponent._result;
  switch (lazyComponent._status) {
    case 1:
      return result;
    case 2:
      throw result;
    case 0:
      throw result;
    default:
      throw ((lazyComponent._status = 0),
      (result = lazyComponent._ctor),
      (result = result()),
      result.then(
        function(moduleObject) {
          0 === lazyComponent._status &&
            ((moduleObject = moduleObject.default),
            (lazyComponent._status = 1),
            (lazyComponent._result = moduleObject));
        },
        function(error) {
          0 === lazyComponent._status &&
            ((lazyComponent._status = 2), (lazyComponent._result = error));
        }
      ),
      (lazyComponent._result = result),
      result);
  }
}
var ReactCurrentOwner$4 = ReactSharedInternals.ReactCurrentOwner,
  emptyRefsObject = new React.Component().refs;
function applyDerivedStateFromProps(
  workInProgress,
  ctor,
  getDerivedStateFromProps,
  nextProps
) {
  ctor = workInProgress.memoizedState;
  getDerivedStateFromProps = getDerivedStateFromProps(nextProps, ctor);
  getDerivedStateFromProps =
    null === getDerivedStateFromProps || void 0 === getDerivedStateFromProps
      ? ctor
      : Object.assign({}, ctor, getDerivedStateFromProps);
  workInProgress.memoizedState = getDerivedStateFromProps;
  nextProps = workInProgress.updateQueue;
  null !== nextProps &&
    0 === workInProgress.expirationTime &&
    (nextProps.baseState = getDerivedStateFromProps);
}
var classComponentUpdater = {
  isMounted: function(component) {
    return (component = component._reactInternalFiber)
      ? 2 === isFiberMountedImpl(component)
      : !1;
  },
  enqueueSetState: function(inst, payload, callback) {
    inst = inst._reactInternalFiber;
    var currentTime = requestCurrentTime();
    currentTime = computeExpirationForFiber(currentTime, inst);
    var update = createUpdate(currentTime);
    update.payload = payload;
    void 0 !== callback && null !== callback && (update.callback = callback);
    flushPassiveEffects();
    enqueueUpdate(inst, update);
    scheduleWork(inst, currentTime);
  },
  enqueueReplaceState: function(inst, payload, callback) {
    inst = inst._reactInternalFiber;
    var currentTime = requestCurrentTime();
    currentTime = computeExpirationForFiber(currentTime, inst);
    var update = createUpdate(currentTime);
    update.tag = 1;
    update.payload = payload;
    void 0 !== callback && null !== callback && (update.callback = callback);
    flushPassiveEffects();
    enqueueUpdate(inst, update);
    scheduleWork(inst, currentTime);
  },
  enqueueForceUpdate: function(inst, callback) {
    inst = inst._reactInternalFiber;
    var currentTime = requestCurrentTime();
    currentTime = computeExpirationForFiber(currentTime, inst);
    var update = createUpdate(currentTime);
    update.tag = 2;
    void 0 !== callback && null !== callback && (update.callback = callback);
    flushPassiveEffects();
    enqueueUpdate(inst, update);
    scheduleWork(inst, currentTime);
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
  workInProgress = workInProgress.stateNode;
  return "function" === typeof workInProgress.shouldComponentUpdate
    ? workInProgress.shouldComponentUpdate(newProps, newState, nextContext)
    : ctor.prototype && ctor.prototype.isPureReactComponent
      ? !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
      : !0;
}
function constructClassInstance(workInProgress, ctor, props) {
  var isLegacyContextConsumer = !1,
    unmaskedContext = emptyContextObject;
  var context = ctor.contextType;
  "object" === typeof context && null !== context
    ? (context = ReactCurrentOwner$4.currentDispatcher.readContext(context))
    : ((unmaskedContext = isContextProvider(ctor)
        ? previousContext
        : contextStackCursor.current),
      (isLegacyContextConsumer = ctor.contextTypes),
      (context = (isLegacyContextConsumer =
        null !== isLegacyContextConsumer && void 0 !== isLegacyContextConsumer)
        ? getMaskedContext(workInProgress, unmaskedContext)
        : emptyContextObject));
  ctor = new ctor(props, context);
  workInProgress.memoizedState =
    null !== ctor.state && void 0 !== ctor.state ? ctor.state : null;
  ctor.updater = classComponentUpdater;
  workInProgress.stateNode = ctor;
  ctor._reactInternalFiber = workInProgress;
  isLegacyContextConsumer &&
    ((workInProgress = workInProgress.stateNode),
    (workInProgress.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext),
    (workInProgress.__reactInternalMemoizedMaskedChildContext = context));
  return ctor;
}
function callComponentWillReceiveProps(
  workInProgress,
  instance,
  newProps,
  nextContext
) {
  workInProgress = instance.state;
  "function" === typeof instance.componentWillReceiveProps &&
    instance.componentWillReceiveProps(newProps, nextContext);
  "function" === typeof instance.UNSAFE_componentWillReceiveProps &&
    instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
  instance.state !== workInProgress &&
    classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
}
function mountClassInstance(
  workInProgress,
  ctor,
  newProps,
  renderExpirationTime
) {
  var instance = workInProgress.stateNode;
  instance.props = newProps;
  instance.state = workInProgress.memoizedState;
  instance.refs = emptyRefsObject;
  var contextType = ctor.contextType;
  "object" === typeof contextType && null !== contextType
    ? (instance.context = ReactCurrentOwner$4.currentDispatcher.readContext(
        contextType
      ))
    : ((contextType = isContextProvider(ctor)
        ? previousContext
        : contextStackCursor.current),
      (instance.context = getMaskedContext(workInProgress, contextType)));
  contextType = workInProgress.updateQueue;
  null !== contextType &&
    (processUpdateQueue(
      workInProgress,
      contextType,
      newProps,
      instance,
      renderExpirationTime
    ),
    (instance.state = workInProgress.memoizedState));
  contextType = ctor.getDerivedStateFromProps;
  "function" === typeof contextType &&
    (applyDerivedStateFromProps(workInProgress, ctor, contextType, newProps),
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
    (contextType = workInProgress.updateQueue),
    null !== contextType &&
      (processUpdateQueue(
        workInProgress,
        contextType,
        newProps,
        instance,
        renderExpirationTime
      ),
      (instance.state = workInProgress.memoizedState)));
  "function" === typeof instance.componentDidMount &&
    (workInProgress.effectTag |= 4);
}
var isArray = Array.isArray;
function coerceRef(returnFiber, current$$1, element) {
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
        (invariant(1 === element.tag, "Function components cannot have refs."),
        (inst = element.stateNode));
      invariant(
        inst,
        "Missing owner for string ref %s. This error is likely caused by a bug in React. Please file an issue.",
        returnFiber
      );
      var stringRef = "" + returnFiber;
      if (
        null !== current$$1 &&
        null !== current$$1.ref &&
        "function" === typeof current$$1.ref &&
        current$$1.ref._stringRef === stringRef
      )
        return current$$1.ref;
      current$$1 = function(value) {
        var refs = inst.refs;
        refs === emptyRefsObject && (refs = inst.refs = {});
        null === value ? delete refs[stringRef] : (refs[stringRef] = value);
      };
      current$$1._stringRef = stringRef;
      return current$$1;
    }
    invariant(
      "string" === typeof returnFiber,
      "Expected ref to be a function, a string, an object returned by React.createRef(), or null."
    );
    invariant(
      element._owner,
      "Element ref was specified as a string (%s) but no owner was set. This could happen for one of the following reasons:\n1. You may be adding a ref to a function component\n2. You may be adding a ref to a component that was not created inside a component's render method\n3. You have multiple copies of React loaded\nSee https://fb.me/react-refs-must-have-owner for more information.",
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
  function updateTextNode(
    returnFiber,
    current$$1,
    textContent,
    expirationTime
  ) {
    if (null === current$$1 || 6 !== current$$1.tag)
      return (
        (current$$1 = createFiberFromText(
          textContent,
          returnFiber.mode,
          expirationTime
        )),
        (current$$1.return = returnFiber),
        current$$1
      );
    current$$1 = useFiber(current$$1, textContent, expirationTime);
    current$$1.return = returnFiber;
    return current$$1;
  }
  function updateElement(returnFiber, current$$1, element, expirationTime) {
    if (null !== current$$1 && current$$1.elementType === element.type)
      return (
        (expirationTime = useFiber(current$$1, element.props, expirationTime)),
        (expirationTime.ref = coerceRef(returnFiber, current$$1, element)),
        (expirationTime.return = returnFiber),
        expirationTime
      );
    expirationTime = createFiberFromTypeAndProps(
      element.type,
      element.key,
      element.props,
      null,
      returnFiber.mode,
      expirationTime
    );
    expirationTime.ref = coerceRef(returnFiber, current$$1, element);
    expirationTime.return = returnFiber;
    return expirationTime;
  }
  function updatePortal(returnFiber, current$$1, portal, expirationTime) {
    if (
      null === current$$1 ||
      4 !== current$$1.tag ||
      current$$1.stateNode.containerInfo !== portal.containerInfo ||
      current$$1.stateNode.implementation !== portal.implementation
    )
      return (
        (current$$1 = createFiberFromPortal(
          portal,
          returnFiber.mode,
          expirationTime
        )),
        (current$$1.return = returnFiber),
        current$$1
      );
    current$$1 = useFiber(current$$1, portal.children || [], expirationTime);
    current$$1.return = returnFiber;
    return current$$1;
  }
  function updateFragment(
    returnFiber,
    current$$1,
    fragment,
    expirationTime,
    key
  ) {
    if (null === current$$1 || 7 !== current$$1.tag)
      return (
        (current$$1 = createFiberFromFragment(
          fragment,
          returnFiber.mode,
          expirationTime,
          key
        )),
        (current$$1.return = returnFiber),
        current$$1
      );
    current$$1 = useFiber(current$$1, fragment, expirationTime);
    current$$1.return = returnFiber;
    return current$$1;
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
            (expirationTime = createFiberFromTypeAndProps(
              newChild.type,
              newChild.key,
              newChild.props,
              null,
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
      if (isArray(newChild) || getIteratorFn(newChild))
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
      if (isArray(newChild) || getIteratorFn(newChild))
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
      if (isArray(newChild) || getIteratorFn(newChild))
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
                  7 === isUnkeyedTopLevelFragment.tag
                    ? newChild.type === REACT_FRAGMENT_TYPE
                    : isUnkeyedTopLevelFragment.elementType === newChild.type
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
              : ((expirationTime = createFiberFromTypeAndProps(
                  newChild.type,
                  newChild.key,
                  newChild.props,
                  null,
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
    if (isArray(newChild))
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
        case 1:
        case 0:
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
          fiber = createFiber(5, null, null, 0);
        fiber.elementType = "DELETED";
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
var ReactCurrentOwner$3 = ReactSharedInternals.ReactCurrentOwner;
function reconcileChildren(
  current$$1,
  workInProgress,
  nextChildren,
  renderExpirationTime
) {
  workInProgress.child =
    null === current$$1
      ? mountChildFibers(
          workInProgress,
          null,
          nextChildren,
          renderExpirationTime
        )
      : reconcileChildFibers(
          workInProgress,
          current$$1.child,
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
  Component = Component.render;
  var ref = workInProgress.ref;
  prepareToReadContext(workInProgress, renderExpirationTime);
  nextProps = Component(nextProps, ref);
  workInProgress.effectTag |= 1;
  reconcileChildren(
    current$$1,
    workInProgress,
    nextProps,
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
  if (null === current$$1) {
    var type = Component.type;
    if (
      "function" === typeof type &&
      !shouldConstruct(type) &&
      void 0 === type.defaultProps &&
      null === Component.compare &&
      void 0 === Component.defaultProps
    )
      return (
        (workInProgress.tag = 15),
        (workInProgress.type = type),
        updateSimpleMemoComponent(
          current$$1,
          workInProgress,
          type,
          nextProps,
          updateExpirationTime,
          renderExpirationTime
        )
      );
    current$$1 = createFiberFromTypeAndProps(
      Component.type,
      null,
      nextProps,
      null,
      workInProgress.mode,
      renderExpirationTime
    );
    current$$1.ref = workInProgress.ref;
    current$$1.return = workInProgress;
    return (workInProgress.child = current$$1);
  }
  type = current$$1.child;
  if (
    updateExpirationTime < renderExpirationTime &&
    ((updateExpirationTime = type.memoizedProps),
    (Component = Component.compare),
    (Component = null !== Component ? Component : shallowEqual),
    Component(updateExpirationTime, nextProps) &&
      current$$1.ref === workInProgress.ref)
  )
    return bailoutOnAlreadyFinishedWork(
      current$$1,
      workInProgress,
      renderExpirationTime
    );
  workInProgress.effectTag |= 1;
  current$$1 = createWorkInProgress(type, nextProps, renderExpirationTime);
  current$$1.ref = workInProgress.ref;
  current$$1.return = workInProgress;
  return (workInProgress.child = current$$1);
}
function updateSimpleMemoComponent(
  current$$1,
  workInProgress,
  Component,
  nextProps,
  updateExpirationTime,
  renderExpirationTime
) {
  return null !== current$$1 &&
    updateExpirationTime < renderExpirationTime &&
    shallowEqual(current$$1.memoizedProps, nextProps) &&
    current$$1.ref === workInProgress.ref
    ? bailoutOnAlreadyFinishedWork(
        current$$1,
        workInProgress,
        renderExpirationTime
      )
    : updateFunctionComponent(
        current$$1,
        workInProgress,
        Component,
        nextProps,
        renderExpirationTime
      );
}
function markRef(current$$1, workInProgress) {
  var ref = workInProgress.ref;
  if (
    (null === current$$1 && null !== ref) ||
    (null !== current$$1 && current$$1.ref !== ref)
  )
    workInProgress.effectTag |= 128;
}
function updateFunctionComponent(
  current$$1,
  workInProgress,
  Component,
  nextProps,
  renderExpirationTime
) {
  var unmaskedContext = isContextProvider(Component)
    ? previousContext
    : contextStackCursor.current;
  unmaskedContext = getMaskedContext(workInProgress, unmaskedContext);
  prepareToReadContext(workInProgress, renderExpirationTime);
  Component = Component(nextProps, unmaskedContext);
  workInProgress.effectTag |= 1;
  reconcileChildren(
    current$$1,
    workInProgress,
    Component,
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
  if (isContextProvider(Component)) {
    var hasContext = !0;
    pushContextProvider(workInProgress);
  } else hasContext = !1;
  prepareToReadContext(workInProgress, renderExpirationTime);
  if (null === workInProgress.stateNode)
    null !== current$$1 &&
      ((current$$1.alternate = null),
      (workInProgress.alternate = null),
      (workInProgress.effectTag |= 2)),
      constructClassInstance(
        workInProgress,
        Component,
        nextProps,
        renderExpirationTime
      ),
      mountClassInstance(
        workInProgress,
        Component,
        nextProps,
        renderExpirationTime
      ),
      (nextProps = !0);
  else if (null === current$$1) {
    var instance = workInProgress.stateNode,
      oldProps = workInProgress.memoizedProps;
    instance.props = oldProps;
    var oldContext = instance.context,
      contextType = Component.contextType;
    "object" === typeof contextType && null !== contextType
      ? (contextType = ReactCurrentOwner$4.currentDispatcher.readContext(
          contextType
        ))
      : ((contextType = isContextProvider(Component)
          ? previousContext
          : contextStackCursor.current),
        (contextType = getMaskedContext(workInProgress, contextType)));
    var getDerivedStateFromProps = Component.getDerivedStateFromProps,
      hasNewLifecycles =
        "function" === typeof getDerivedStateFromProps ||
        "function" === typeof instance.getSnapshotBeforeUpdate;
    hasNewLifecycles ||
      ("function" !== typeof instance.UNSAFE_componentWillReceiveProps &&
        "function" !== typeof instance.componentWillReceiveProps) ||
      ((oldProps !== nextProps || oldContext !== contextType) &&
        callComponentWillReceiveProps(
          workInProgress,
          instance,
          nextProps,
          contextType
        ));
    hasForceUpdate = !1;
    var oldState = workInProgress.memoizedState;
    oldContext = instance.state = oldState;
    var updateQueue = workInProgress.updateQueue;
    null !== updateQueue &&
      (processUpdateQueue(
        workInProgress,
        updateQueue,
        nextProps,
        instance,
        renderExpirationTime
      ),
      (oldContext = workInProgress.memoizedState));
    oldProps !== nextProps ||
    oldState !== oldContext ||
    didPerformWorkStackCursor.current ||
    hasForceUpdate
      ? ("function" === typeof getDerivedStateFromProps &&
          (applyDerivedStateFromProps(
            workInProgress,
            Component,
            getDerivedStateFromProps,
            nextProps
          ),
          (oldContext = workInProgress.memoizedState)),
        (oldProps =
          hasForceUpdate ||
          checkShouldComponentUpdate(
            workInProgress,
            Component,
            oldProps,
            nextProps,
            oldState,
            oldContext,
            contextType
          ))
          ? (hasNewLifecycles ||
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
            (workInProgress.memoizedProps = nextProps),
            (workInProgress.memoizedState = oldContext)),
        (instance.props = nextProps),
        (instance.state = oldContext),
        (instance.context = contextType),
        (nextProps = oldProps))
      : ("function" === typeof instance.componentDidMount &&
          (workInProgress.effectTag |= 4),
        (nextProps = !1));
  } else
    (instance = workInProgress.stateNode),
      (oldProps = workInProgress.memoizedProps),
      (instance.props =
        workInProgress.type === workInProgress.elementType
          ? oldProps
          : resolveDefaultProps(workInProgress.type, oldProps)),
      (oldContext = instance.context),
      (contextType = Component.contextType),
      "object" === typeof contextType && null !== contextType
        ? (contextType = ReactCurrentOwner$4.currentDispatcher.readContext(
            contextType
          ))
        : ((contextType = isContextProvider(Component)
            ? previousContext
            : contextStackCursor.current),
          (contextType = getMaskedContext(workInProgress, contextType))),
      (getDerivedStateFromProps = Component.getDerivedStateFromProps),
      (hasNewLifecycles =
        "function" === typeof getDerivedStateFromProps ||
        "function" === typeof instance.getSnapshotBeforeUpdate) ||
        ("function" !== typeof instance.UNSAFE_componentWillReceiveProps &&
          "function" !== typeof instance.componentWillReceiveProps) ||
        ((oldProps !== nextProps || oldContext !== contextType) &&
          callComponentWillReceiveProps(
            workInProgress,
            instance,
            nextProps,
            contextType
          )),
      (hasForceUpdate = !1),
      (oldContext = workInProgress.memoizedState),
      (oldState = instance.state = oldContext),
      (updateQueue = workInProgress.updateQueue),
      null !== updateQueue &&
        (processUpdateQueue(
          workInProgress,
          updateQueue,
          nextProps,
          instance,
          renderExpirationTime
        ),
        (oldState = workInProgress.memoizedState)),
      oldProps !== nextProps ||
      oldContext !== oldState ||
      didPerformWorkStackCursor.current ||
      hasForceUpdate
        ? ("function" === typeof getDerivedStateFromProps &&
            (applyDerivedStateFromProps(
              workInProgress,
              Component,
              getDerivedStateFromProps,
              nextProps
            ),
            (oldState = workInProgress.memoizedState)),
          (getDerivedStateFromProps =
            hasForceUpdate ||
            checkShouldComponentUpdate(
              workInProgress,
              Component,
              oldProps,
              nextProps,
              oldContext,
              oldState,
              contextType
            ))
            ? (hasNewLifecycles ||
                ("function" !== typeof instance.UNSAFE_componentWillUpdate &&
                  "function" !== typeof instance.componentWillUpdate) ||
                ("function" === typeof instance.componentWillUpdate &&
                  instance.componentWillUpdate(
                    nextProps,
                    oldState,
                    contextType
                  ),
                "function" === typeof instance.UNSAFE_componentWillUpdate &&
                  instance.UNSAFE_componentWillUpdate(
                    nextProps,
                    oldState,
                    contextType
                  )),
              "function" === typeof instance.componentDidUpdate &&
                (workInProgress.effectTag |= 4),
              "function" === typeof instance.getSnapshotBeforeUpdate &&
                (workInProgress.effectTag |= 256))
            : ("function" !== typeof instance.componentDidUpdate ||
                (oldProps === current$$1.memoizedProps &&
                  oldContext === current$$1.memoizedState) ||
                (workInProgress.effectTag |= 4),
              "function" !== typeof instance.getSnapshotBeforeUpdate ||
                (oldProps === current$$1.memoizedProps &&
                  oldContext === current$$1.memoizedState) ||
                (workInProgress.effectTag |= 256),
              (workInProgress.memoizedProps = nextProps),
              (workInProgress.memoizedState = oldState)),
          (instance.props = nextProps),
          (instance.state = oldState),
          (instance.context = contextType),
          (nextProps = getDerivedStateFromProps))
        : ("function" !== typeof instance.componentDidUpdate ||
            (oldProps === current$$1.memoizedProps &&
              oldContext === current$$1.memoizedState) ||
            (workInProgress.effectTag |= 4),
          "function" !== typeof instance.getSnapshotBeforeUpdate ||
            (oldProps === current$$1.memoizedProps &&
              oldContext === current$$1.memoizedState) ||
            (workInProgress.effectTag |= 256),
          (nextProps = !1));
  return finishClassComponent(
    current$$1,
    workInProgress,
    Component,
    nextProps,
    hasContext,
    renderExpirationTime
  );
}
function finishClassComponent(
  current$$1,
  workInProgress,
  Component,
  shouldUpdate,
  hasContext,
  renderExpirationTime
) {
  markRef(current$$1, workInProgress);
  var didCaptureError = 0 !== (workInProgress.effectTag & 64);
  if (!shouldUpdate && !didCaptureError)
    return (
      hasContext && invalidateContextProvider(workInProgress, Component, !1),
      bailoutOnAlreadyFinishedWork(
        current$$1,
        workInProgress,
        renderExpirationTime
      )
    );
  shouldUpdate = workInProgress.stateNode;
  ReactCurrentOwner$3.current = workInProgress;
  var nextChildren =
    didCaptureError && "function" !== typeof Component.getDerivedStateFromError
      ? null
      : shouldUpdate.render();
  workInProgress.effectTag |= 1;
  null !== current$$1 && didCaptureError
    ? ((workInProgress.child = reconcileChildFibers(
        workInProgress,
        current$$1.child,
        null,
        renderExpirationTime
      )),
      (workInProgress.child = reconcileChildFibers(
        workInProgress,
        null,
        nextChildren,
        renderExpirationTime
      )))
    : reconcileChildren(
        current$$1,
        workInProgress,
        nextChildren,
        renderExpirationTime
      );
  workInProgress.memoizedState = shouldUpdate.state;
  hasContext && invalidateContextProvider(workInProgress, Component, !0);
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
function updateSuspenseComponent(
  current$$1,
  workInProgress,
  renderExpirationTime
) {
  var mode = workInProgress.mode,
    nextProps = workInProgress.pendingProps,
    nextState = workInProgress.memoizedState;
  if (0 === (workInProgress.effectTag & 64)) {
    nextState = null;
    var nextDidTimeout = !1;
  } else
    (nextState = { timedOutAt: null !== nextState ? nextState.timedOutAt : 0 }),
      (nextDidTimeout = !0),
      (workInProgress.effectTag &= -65);
  null === current$$1
    ? nextDidTimeout
      ? ((nextDidTimeout = nextProps.fallback),
        (nextProps = createFiberFromFragment(null, mode, 0, null)),
        0 === (workInProgress.mode & 1) &&
          (nextProps.child =
            null !== workInProgress.memoizedState
              ? workInProgress.child.child
              : workInProgress.child),
        (mode = createFiberFromFragment(
          nextDidTimeout,
          mode,
          renderExpirationTime,
          null
        )),
        (nextProps.sibling = mode),
        (renderExpirationTime = nextProps),
        (renderExpirationTime.return = mode.return = workInProgress))
      : (renderExpirationTime = mode = mountChildFibers(
          workInProgress,
          null,
          nextProps.children,
          renderExpirationTime
        ))
    : null !== current$$1.memoizedState
      ? ((mode = current$$1.child),
        (current$$1 = mode.sibling),
        nextDidTimeout
          ? ((renderExpirationTime = nextProps.fallback),
            (nextProps = createWorkInProgress(mode, mode.pendingProps, 0)),
            0 === (workInProgress.mode & 1) &&
              ((nextDidTimeout =
                null !== workInProgress.memoizedState
                  ? workInProgress.child.child
                  : workInProgress.child),
              nextDidTimeout !== mode.child &&
                (nextProps.child = nextDidTimeout)),
            (mode = nextProps.sibling = createWorkInProgress(
              current$$1,
              renderExpirationTime,
              current$$1.expirationTime
            )),
            (renderExpirationTime = nextProps),
            (nextProps.childExpirationTime = 0),
            (renderExpirationTime.return = mode.return = workInProgress))
          : (renderExpirationTime = mode = reconcileChildFibers(
              workInProgress,
              mode.child,
              nextProps.children,
              renderExpirationTime
            )))
      : ((current$$1 = current$$1.child),
        nextDidTimeout
          ? ((nextDidTimeout = nextProps.fallback),
            (nextProps = createFiberFromFragment(null, mode, 0, null)),
            (nextProps.child = current$$1),
            0 === (workInProgress.mode & 1) &&
              (nextProps.child =
                null !== workInProgress.memoizedState
                  ? workInProgress.child.child
                  : workInProgress.child),
            (mode = nextProps.sibling = createFiberFromFragment(
              nextDidTimeout,
              mode,
              renderExpirationTime,
              null
            )),
            (mode.effectTag |= 2),
            (renderExpirationTime = nextProps),
            (nextProps.childExpirationTime = 0),
            (renderExpirationTime.return = mode.return = workInProgress))
          : (mode = renderExpirationTime = reconcileChildFibers(
              workInProgress,
              current$$1,
              nextProps.children,
              renderExpirationTime
            )));
  workInProgress.memoizedState = nextState;
  workInProgress.child = renderExpirationTime;
  return mode;
}
function bailoutOnAlreadyFinishedWork(
  current$$1,
  workInProgress,
  renderExpirationTime
) {
  null !== current$$1 &&
    (workInProgress.firstContextDependency = current$$1.firstContextDependency);
  if (workInProgress.childExpirationTime < renderExpirationTime) return null;
  invariant(
    null === current$$1 || workInProgress.child === current$$1.child,
    "Resuming work not yet implemented."
  );
  if (null !== workInProgress.child) {
    current$$1 = workInProgress.child;
    renderExpirationTime = createWorkInProgress(
      current$$1,
      current$$1.pendingProps,
      current$$1.expirationTime
    );
    workInProgress.child = renderExpirationTime;
    for (
      renderExpirationTime.return = workInProgress;
      null !== current$$1.sibling;

    )
      (current$$1 = current$$1.sibling),
        (renderExpirationTime = renderExpirationTime.sibling = createWorkInProgress(
          current$$1,
          current$$1.pendingProps,
          current$$1.expirationTime
        )),
        (renderExpirationTime.return = workInProgress);
    renderExpirationTime.sibling = null;
  }
  return workInProgress.child;
}
function beginWork(current$$1, workInProgress, renderExpirationTime) {
  var updateExpirationTime = workInProgress.expirationTime;
  if (
    null !== current$$1 &&
    current$$1.memoizedProps === workInProgress.pendingProps &&
    !didPerformWorkStackCursor.current &&
    updateExpirationTime < renderExpirationTime
  ) {
    switch (workInProgress.tag) {
      case 3:
        pushHostRootContext(workInProgress);
        break;
      case 5:
        pushHostContext(workInProgress);
        break;
      case 1:
        isContextProvider(workInProgress.type) &&
          pushContextProvider(workInProgress);
        break;
      case 4:
        pushHostContainer(
          workInProgress,
          workInProgress.stateNode.containerInfo
        );
        break;
      case 10:
        pushProvider(workInProgress, workInProgress.memoizedProps.value);
        break;
      case 13:
        if (null !== workInProgress.memoizedState) {
          updateExpirationTime = workInProgress.child.childExpirationTime;
          if (
            0 !== updateExpirationTime &&
            updateExpirationTime >= renderExpirationTime
          )
            return updateSuspenseComponent(
              current$$1,
              workInProgress,
              renderExpirationTime
            );
          workInProgress = bailoutOnAlreadyFinishedWork(
            current$$1,
            workInProgress,
            renderExpirationTime
          );
          return null !== workInProgress ? workInProgress.sibling : null;
        }
    }
    return bailoutOnAlreadyFinishedWork(
      current$$1,
      workInProgress,
      renderExpirationTime
    );
  }
  workInProgress.expirationTime = 0;
  switch (workInProgress.tag) {
    case 2:
      updateExpirationTime = workInProgress.elementType;
      null !== current$$1 &&
        ((current$$1.alternate = null),
        (workInProgress.alternate = null),
        (workInProgress.effectTag |= 2));
      current$$1 = workInProgress.pendingProps;
      var context = getMaskedContext(
        workInProgress,
        contextStackCursor.current
      );
      prepareToReadContext(workInProgress, renderExpirationTime);
      context = updateExpirationTime(current$$1, context);
      workInProgress.effectTag |= 1;
      if (
        "object" === typeof context &&
        null !== context &&
        "function" === typeof context.render &&
        void 0 === context.$$typeof
      ) {
        workInProgress.tag = 1;
        if (isContextProvider(updateExpirationTime)) {
          var hasContext = !0;
          pushContextProvider(workInProgress);
        } else hasContext = !1;
        workInProgress.memoizedState =
          null !== context.state && void 0 !== context.state
            ? context.state
            : null;
        var getDerivedStateFromProps =
          updateExpirationTime.getDerivedStateFromProps;
        "function" === typeof getDerivedStateFromProps &&
          applyDerivedStateFromProps(
            workInProgress,
            updateExpirationTime,
            getDerivedStateFromProps,
            current$$1
          );
        context.updater = classComponentUpdater;
        workInProgress.stateNode = context;
        context._reactInternalFiber = workInProgress;
        mountClassInstance(
          workInProgress,
          updateExpirationTime,
          current$$1,
          renderExpirationTime
        );
        workInProgress = finishClassComponent(
          null,
          workInProgress,
          updateExpirationTime,
          !0,
          hasContext,
          renderExpirationTime
        );
      } else
        (workInProgress.tag = 0),
          reconcileChildren(
            null,
            workInProgress,
            context,
            renderExpirationTime
          ),
          (workInProgress = workInProgress.child);
      return workInProgress;
    case 16:
      context = workInProgress.elementType;
      null !== current$$1 &&
        ((current$$1.alternate = null),
        (workInProgress.alternate = null),
        (workInProgress.effectTag |= 2));
      hasContext = workInProgress.pendingProps;
      current$$1 = readLazyComponentType(context);
      workInProgress.type = current$$1;
      context = workInProgress.tag = resolveLazyComponentTag(current$$1);
      hasContext = resolveDefaultProps(current$$1, hasContext);
      getDerivedStateFromProps = void 0;
      switch (context) {
        case 0:
          getDerivedStateFromProps = updateFunctionComponent(
            null,
            workInProgress,
            current$$1,
            hasContext,
            renderExpirationTime
          );
          break;
        case 1:
          getDerivedStateFromProps = updateClassComponent(
            null,
            workInProgress,
            current$$1,
            hasContext,
            renderExpirationTime
          );
          break;
        case 11:
          getDerivedStateFromProps = updateForwardRef(
            null,
            workInProgress,
            current$$1,
            hasContext,
            renderExpirationTime
          );
          break;
        case 14:
          getDerivedStateFromProps = updateMemoComponent(
            null,
            workInProgress,
            current$$1,
            resolveDefaultProps(current$$1.type, hasContext),
            updateExpirationTime,
            renderExpirationTime
          );
          break;
        default:
          invariant(
            !1,
            "Element type is invalid. Received a promise that resolves to: %s. Lazy element type must resolve to a class or function.%s",
            current$$1,
            ""
          );
      }
      return getDerivedStateFromProps;
    case 0:
      return (
        (updateExpirationTime = workInProgress.type),
        (context = workInProgress.pendingProps),
        (context =
          workInProgress.elementType === updateExpirationTime
            ? context
            : resolveDefaultProps(updateExpirationTime, context)),
        updateFunctionComponent(
          current$$1,
          workInProgress,
          updateExpirationTime,
          context,
          renderExpirationTime
        )
      );
    case 1:
      return (
        (updateExpirationTime = workInProgress.type),
        (context = workInProgress.pendingProps),
        (context =
          workInProgress.elementType === updateExpirationTime
            ? context
            : resolveDefaultProps(updateExpirationTime, context)),
        updateClassComponent(
          current$$1,
          workInProgress,
          updateExpirationTime,
          context,
          renderExpirationTime
        )
      );
    case 3:
      return (
        pushHostRootContext(workInProgress),
        (updateExpirationTime = workInProgress.updateQueue),
        invariant(
          null !== updateExpirationTime,
          "If the root does not have an updateQueue, we should have already bailed out. This error is likely caused by a bug in React. Please file an issue."
        ),
        (context = workInProgress.memoizedState),
        (context = null !== context ? context.element : null),
        processUpdateQueue(
          workInProgress,
          updateExpirationTime,
          workInProgress.pendingProps,
          null,
          renderExpirationTime
        ),
        (updateExpirationTime = workInProgress.memoizedState.element),
        updateExpirationTime === context
          ? (workInProgress = bailoutOnAlreadyFinishedWork(
              current$$1,
              workInProgress,
              renderExpirationTime
            ))
          : (reconcileChildren(
              current$$1,
              workInProgress,
              updateExpirationTime,
              renderExpirationTime
            ),
            (workInProgress = workInProgress.child)),
        workInProgress
      );
    case 5:
      return (
        pushHostContext(workInProgress),
        null === current$$1 && tryToClaimNextHydratableInstance(workInProgress),
        (updateExpirationTime = workInProgress.pendingProps.children),
        markRef(current$$1, workInProgress),
        reconcileChildren(
          current$$1,
          workInProgress,
          updateExpirationTime,
          renderExpirationTime
        ),
        (workInProgress = workInProgress.child),
        workInProgress
      );
    case 6:
      return (
        null === current$$1 && tryToClaimNextHydratableInstance(workInProgress),
        null
      );
    case 13:
      return updateSuspenseComponent(
        current$$1,
        workInProgress,
        renderExpirationTime
      );
    case 4:
      return (
        pushHostContainer(
          workInProgress,
          workInProgress.stateNode.containerInfo
        ),
        (updateExpirationTime = workInProgress.pendingProps),
        null === current$$1
          ? (workInProgress.child = reconcileChildFibers(
              workInProgress,
              null,
              updateExpirationTime,
              renderExpirationTime
            ))
          : reconcileChildren(
              current$$1,
              workInProgress,
              updateExpirationTime,
              renderExpirationTime
            ),
        workInProgress.child
      );
    case 11:
      return (
        (updateExpirationTime = workInProgress.type),
        (context = workInProgress.pendingProps),
        (context =
          workInProgress.elementType === updateExpirationTime
            ? context
            : resolveDefaultProps(updateExpirationTime, context)),
        updateForwardRef(
          current$$1,
          workInProgress,
          updateExpirationTime,
          context,
          renderExpirationTime
        )
      );
    case 7:
      return (
        reconcileChildren(
          current$$1,
          workInProgress,
          workInProgress.pendingProps,
          renderExpirationTime
        ),
        workInProgress.child
      );
    case 8:
      return (
        reconcileChildren(
          current$$1,
          workInProgress,
          workInProgress.pendingProps.children,
          renderExpirationTime
        ),
        workInProgress.child
      );
    case 12:
      return (
        reconcileChildren(
          current$$1,
          workInProgress,
          workInProgress.pendingProps.children,
          renderExpirationTime
        ),
        workInProgress.child
      );
    case 10:
      a: {
        updateExpirationTime = workInProgress.type._context;
        context = workInProgress.pendingProps;
        getDerivedStateFromProps = workInProgress.memoizedProps;
        hasContext = context.value;
        pushProvider(workInProgress, hasContext);
        if (null !== getDerivedStateFromProps) {
          var oldValue = getDerivedStateFromProps.value;
          hasContext =
            (oldValue === hasContext &&
              (0 !== oldValue || 1 / oldValue === 1 / hasContext)) ||
            (oldValue !== oldValue && hasContext !== hasContext)
              ? 0
              : ("function" ===
                typeof updateExpirationTime._calculateChangedBits
                  ? updateExpirationTime._calculateChangedBits(
                      oldValue,
                      hasContext
                    )
                  : 1073741823) | 0;
          if (0 === hasContext) {
            if (
              getDerivedStateFromProps.children === context.children &&
              !didPerformWorkStackCursor.current
            ) {
              workInProgress = bailoutOnAlreadyFinishedWork(
                current$$1,
                workInProgress,
                renderExpirationTime
              );
              break a;
            }
          } else
            for (
              getDerivedStateFromProps = workInProgress.child,
                null !== getDerivedStateFromProps &&
                  (getDerivedStateFromProps.return = workInProgress);
              null !== getDerivedStateFromProps;

            ) {
              oldValue = getDerivedStateFromProps.firstContextDependency;
              if (null !== oldValue) {
                do {
                  if (
                    oldValue.context === updateExpirationTime &&
                    0 !== (oldValue.observedBits & hasContext)
                  ) {
                    if (1 === getDerivedStateFromProps.tag) {
                      var nextFiber = createUpdate(renderExpirationTime);
                      nextFiber.tag = 2;
                      enqueueUpdate(getDerivedStateFromProps, nextFiber);
                    }
                    getDerivedStateFromProps.expirationTime <
                      renderExpirationTime &&
                      (getDerivedStateFromProps.expirationTime = renderExpirationTime);
                    nextFiber = getDerivedStateFromProps.alternate;
                    null !== nextFiber &&
                      nextFiber.expirationTime < renderExpirationTime &&
                      (nextFiber.expirationTime = renderExpirationTime);
                    for (
                      var node = getDerivedStateFromProps.return;
                      null !== node;

                    ) {
                      nextFiber = node.alternate;
                      if (node.childExpirationTime < renderExpirationTime)
                        (node.childExpirationTime = renderExpirationTime),
                          null !== nextFiber &&
                            nextFiber.childExpirationTime <
                              renderExpirationTime &&
                            (nextFiber.childExpirationTime = renderExpirationTime);
                      else if (
                        null !== nextFiber &&
                        nextFiber.childExpirationTime < renderExpirationTime
                      )
                        nextFiber.childExpirationTime = renderExpirationTime;
                      else break;
                      node = node.return;
                    }
                  }
                  nextFiber = getDerivedStateFromProps.child;
                  oldValue = oldValue.next;
                } while (null !== oldValue);
              } else
                nextFiber =
                  10 === getDerivedStateFromProps.tag
                    ? getDerivedStateFromProps.type === workInProgress.type
                      ? null
                      : getDerivedStateFromProps.child
                    : getDerivedStateFromProps.child;
              if (null !== nextFiber)
                nextFiber.return = getDerivedStateFromProps;
              else
                for (
                  nextFiber = getDerivedStateFromProps;
                  null !== nextFiber;

                ) {
                  if (nextFiber === workInProgress) {
                    nextFiber = null;
                    break;
                  }
                  getDerivedStateFromProps = nextFiber.sibling;
                  if (null !== getDerivedStateFromProps) {
                    getDerivedStateFromProps.return = nextFiber.return;
                    nextFiber = getDerivedStateFromProps;
                    break;
                  }
                  nextFiber = nextFiber.return;
                }
              getDerivedStateFromProps = nextFiber;
            }
        }
        reconcileChildren(
          current$$1,
          workInProgress,
          context.children,
          renderExpirationTime
        );
        workInProgress = workInProgress.child;
      }
      return workInProgress;
    case 9:
      return (
        (context = workInProgress.type),
        (hasContext = workInProgress.pendingProps),
        (updateExpirationTime = hasContext.children),
        prepareToReadContext(workInProgress, renderExpirationTime),
        (context = readContext(context, hasContext.unstable_observedBits)),
        (updateExpirationTime = updateExpirationTime(context)),
        (workInProgress.effectTag |= 1),
        reconcileChildren(
          current$$1,
          workInProgress,
          updateExpirationTime,
          renderExpirationTime
        ),
        workInProgress.child
      );
    case 14:
      return (
        (context = workInProgress.type),
        (hasContext = resolveDefaultProps(
          context,
          workInProgress.pendingProps
        )),
        (hasContext = resolveDefaultProps(context.type, hasContext)),
        updateMemoComponent(
          current$$1,
          workInProgress,
          context,
          hasContext,
          updateExpirationTime,
          renderExpirationTime
        )
      );
    case 15:
      return updateSimpleMemoComponent(
        current$$1,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps,
        updateExpirationTime,
        renderExpirationTime
      );
    case 17:
      return (
        (updateExpirationTime = workInProgress.type),
        (context = workInProgress.pendingProps),
        (context =
          workInProgress.elementType === updateExpirationTime
            ? context
            : resolveDefaultProps(updateExpirationTime, context)),
        null !== current$$1 &&
          ((current$$1.alternate = null),
          (workInProgress.alternate = null),
          (workInProgress.effectTag |= 2)),
        (workInProgress.tag = 1),
        isContextProvider(updateExpirationTime)
          ? ((current$$1 = !0), pushContextProvider(workInProgress))
          : (current$$1 = !1),
        prepareToReadContext(workInProgress, renderExpirationTime),
        constructClassInstance(
          workInProgress,
          updateExpirationTime,
          context,
          renderExpirationTime
        ),
        mountClassInstance(
          workInProgress,
          updateExpirationTime,
          context,
          renderExpirationTime
        ),
        finishClassComponent(
          null,
          workInProgress,
          updateExpirationTime,
          !0,
          current$$1,
          renderExpirationTime
        )
      );
    default:
      invariant(
        !1,
        "Unknown unit of work tag. This error is likely caused by a bug in React. Please file an issue."
      );
  }
}
var appendAllChildren = void 0,
  updateHostContainer = void 0,
  updateHostComponent$1 = void 0,
  updateHostText$1 = void 0;
appendAllChildren = function(parent, workInProgress) {
  for (var node = workInProgress.child; null !== node; ) {
    if (5 === node.tag || 6 === node.tag) parent._children.push(node.stateNode);
    else if (4 !== node.tag && null !== node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === workInProgress) break;
    for (; null === node.sibling; ) {
      if (null === node.return || node.return === workInProgress) return;
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
};
updateHostContainer = function() {};
updateHostComponent$1 = function(current, workInProgress, type, newProps) {
  current.memoizedProps !== newProps &&
    (requiredContext(contextStackCursor$1.current),
    (workInProgress.updateQueue = UPDATE_SIGNAL)) &&
    (workInProgress.effectTag |= 4);
};
updateHostText$1 = function(current, workInProgress, oldText, newText) {
  oldText !== newText && (workInProgress.effectTag |= 4);
};
function logCapturedError(capturedError) {
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
}
function logError(boundary, errorInfo) {
  var source = errorInfo.source,
    stack = errorInfo.stack;
  null === stack &&
    null !== source &&
    (stack = getStackByFiberInDevAndProd(source));
  errorInfo = {
    componentName: null !== source ? getComponentName(source.type) : null,
    componentStack: null !== stack ? stack : "",
    error: errorInfo.value,
    errorBoundary: null,
    errorBoundaryName: null,
    errorBoundaryFound: !1,
    willRetry: !1
  };
  null !== boundary &&
    1 === boundary.tag &&
    ((errorInfo.errorBoundary = boundary.stateNode),
    (errorInfo.errorBoundaryName = getComponentName(boundary.type)),
    (errorInfo.errorBoundaryFound = !0),
    (errorInfo.willRetry = !0));
  try {
    logCapturedError(errorInfo);
  } catch (e) {
    setTimeout(function() {
      throw e;
    });
  }
}
function safelyDetachRef(current$$1) {
  var ref = current$$1.ref;
  if (null !== ref)
    if ("function" === typeof ref)
      try {
        ref(null);
      } catch (refError) {
        captureCommitPhaseError(current$$1, refError);
      }
    else ref.current = null;
}
function commitUnmount(current$$1$jscomp$0) {
  "function" === typeof onCommitFiberUnmount &&
    onCommitFiberUnmount(current$$1$jscomp$0);
  switch (current$$1$jscomp$0.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      var updateQueue = current$$1$jscomp$0.updateQueue;
      if (
        null !== updateQueue &&
        ((updateQueue = updateQueue.lastEffect), null !== updateQueue)
      ) {
        var effect = (updateQueue = updateQueue.next);
        do {
          var destroy = effect.destroy;
          if (null !== destroy) {
            var current$$1 = current$$1$jscomp$0;
            try {
              destroy();
            } catch (error) {
              captureCommitPhaseError(current$$1, error);
            }
          }
          effect = effect.next;
        } while (effect !== updateQueue);
      }
      break;
    case 1:
      safelyDetachRef(current$$1$jscomp$0);
      updateQueue = current$$1$jscomp$0.stateNode;
      if ("function" === typeof updateQueue.componentWillUnmount)
        try {
          (updateQueue.props = current$$1$jscomp$0.memoizedProps),
            (updateQueue.state = current$$1$jscomp$0.memoizedState),
            updateQueue.componentWillUnmount();
        } catch (unmountError) {
          captureCommitPhaseError(current$$1$jscomp$0, unmountError);
        }
      break;
    case 5:
      safelyDetachRef(current$$1$jscomp$0);
      break;
    case 4:
      unmountHostComponents(current$$1$jscomp$0);
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
function unmountHostComponents(current$$1) {
  for (
    var node = current$$1,
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
        ? ((currentParent = node.stateNode.containerInfo),
          (currentParentIsContainer = !0))
        : commitUnmount(node),
      null !== node.child)
    ) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === current$$1) break;
    for (; null === node.sibling; ) {
      if (null === node.return || node.return === current$$1) return;
      node = node.return;
      4 === node.tag && (currentParentIsValid = !1);
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
function commitWork(current$$1, finishedWork) {
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      break;
    case 1:
      break;
    case 5:
      var instance = finishedWork.stateNode;
      if (null != instance) {
        var newProps = finishedWork.memoizedProps;
        current$$1 = null !== current$$1 ? current$$1.memoizedProps : newProps;
        var updatePayload = finishedWork.updateQueue;
        finishedWork.updateQueue = null;
        null !== updatePayload &&
          ((finishedWork = instance.viewConfig),
          (instanceProps[instance._nativeTag] = newProps),
          (newProps = diffProperties(
            null,
            current$$1,
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
    case 12:
      break;
    case 13:
      newProps = finishedWork.memoizedState;
      current$$1 = finishedWork;
      null === newProps
        ? (instance = !1)
        : ((instance = !0),
          (current$$1 = finishedWork.child),
          0 === newProps.timedOutAt &&
            (newProps.timedOutAt = requestCurrentTime()));
      if (null !== current$$1)
        a: for (newProps = finishedWork = current$$1; ; ) {
          if (5 === newProps.tag)
            if (((current$$1 = newProps.stateNode), instance)) {
              updatePayload = current$$1.viewConfig;
              var updatePayload$jscomp$0 = diffProperties(
                null,
                emptyObject,
                { style: { display: "none" } },
                updatePayload.validAttributes
              );
              UIManager.updateView(
                current$$1._nativeTag,
                updatePayload.uiViewClassName,
                updatePayload$jscomp$0
              );
            } else {
              current$$1 = newProps.stateNode;
              updatePayload$jscomp$0 = newProps.memoizedProps;
              updatePayload = current$$1.viewConfig;
              var prevProps = Object.assign({}, updatePayload$jscomp$0, {
                style: [updatePayload$jscomp$0.style, { display: "none" }]
              });
              updatePayload$jscomp$0 = diffProperties(
                null,
                prevProps,
                updatePayload$jscomp$0,
                updatePayload.validAttributes
              );
              UIManager.updateView(
                current$$1._nativeTag,
                updatePayload.uiViewClassName,
                updatePayload$jscomp$0
              );
            }
          else {
            if (6 === newProps.tag) throw Error("Not yet implemented.");
            if (13 === newProps.tag && null !== newProps.memoizedState) {
              current$$1 = newProps.child.sibling;
              current$$1.return = newProps;
              newProps = current$$1;
              continue;
            } else if (null !== newProps.child) {
              newProps.child.return = newProps;
              newProps = newProps.child;
              continue;
            }
          }
          if (newProps === finishedWork) break a;
          for (; null === newProps.sibling; ) {
            if (null === newProps.return || newProps.return === finishedWork)
              break a;
            newProps = newProps.return;
          }
          newProps.sibling.return = newProps.return;
          newProps = newProps.sibling;
        }
      break;
    case 17:
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
  var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
  if ("function" === typeof getDerivedStateFromError) {
    var error$jscomp$0 = errorInfo.value;
    expirationTime.payload = function() {
      return getDerivedStateFromError(error$jscomp$0);
    };
  }
  var inst = fiber.stateNode;
  null !== inst &&
    "function" === typeof inst.componentDidCatch &&
    (expirationTime.callback = function() {
      "function" !== typeof getDerivedStateFromError &&
        (null === legacyErrorBoundariesThatAlreadyFailed
          ? (legacyErrorBoundariesThatAlreadyFailed = new Set([this]))
          : legacyErrorBoundariesThatAlreadyFailed.add(this));
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
  switch (workInProgress.tag) {
    case 1:
      isContextProvider(workInProgress.type) && popContext(workInProgress);
      var effectTag = workInProgress.effectTag;
      return effectTag & 2048
        ? ((workInProgress.effectTag = (effectTag & -2049) | 64),
          workInProgress)
        : null;
    case 3:
      return (
        popHostContainer(workInProgress),
        popTopLevelContextObject(workInProgress),
        (effectTag = workInProgress.effectTag),
        invariant(
          0 === (effectTag & 64),
          "The root failed to unmount after an error. This is likely a bug in React. Please file an issue."
        ),
        (workInProgress.effectTag = (effectTag & -2049) | 64),
        workInProgress
      );
    case 5:
      return popHostContext(workInProgress), null;
    case 13:
      return (
        (effectTag = workInProgress.effectTag),
        effectTag & 2048
          ? ((workInProgress.effectTag = (effectTag & -2049) | 64),
            workInProgress)
          : null
      );
    case 4:
      return popHostContainer(workInProgress), null;
    case 10:
      return popProvider(workInProgress), null;
    default:
      return null;
  }
}
var DispatcherWithoutHooks = { readContext: readContext },
  ReactCurrentOwner$2 = ReactSharedInternals.ReactCurrentOwner,
  isWorking = !1,
  nextUnitOfWork = null,
  nextRoot = null,
  nextRenderExpirationTime = 0,
  nextLatestAbsoluteTimeoutMs = -1,
  nextRenderDidError = !1,
  nextEffect = null,
  isCommitting$1 = !1,
  passiveEffectCallbackHandle = null,
  passiveEffectCallback = null,
  legacyErrorBoundariesThatAlreadyFailed = null;
function resetStack() {
  if (null !== nextUnitOfWork)
    for (
      var interruptedWork = nextUnitOfWork.return;
      null !== interruptedWork;

    ) {
      var interruptedWork$jscomp$0 = interruptedWork;
      switch (interruptedWork$jscomp$0.tag) {
        case 1:
          var childContextTypes =
            interruptedWork$jscomp$0.type.childContextTypes;
          null !== childContextTypes &&
            void 0 !== childContextTypes &&
            popContext(interruptedWork$jscomp$0);
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
        case 10:
          popProvider(interruptedWork$jscomp$0);
      }
      interruptedWork = interruptedWork.return;
    }
  nextRoot = null;
  nextRenderExpirationTime = 0;
  nextLatestAbsoluteTimeoutMs = -1;
  nextRenderDidError = !1;
  nextUnitOfWork = null;
}
function flushPassiveEffects() {
  null !== passiveEffectCallback &&
    (scheduler.unstable_cancelCallback(passiveEffectCallbackHandle),
    passiveEffectCallback());
}
function completeUnitOfWork(workInProgress) {
  for (;;) {
    var current$$1 = workInProgress.alternate,
      returnFiber = workInProgress.return,
      siblingFiber = workInProgress.sibling;
    if (0 === (workInProgress.effectTag & 1024)) {
      nextUnitOfWork = workInProgress;
      a: {
        var current = current$$1;
        current$$1 = workInProgress;
        var renderExpirationTime = nextRenderExpirationTime,
          newProps = current$$1.pendingProps;
        switch (current$$1.tag) {
          case 2:
            break;
          case 16:
            break;
          case 15:
          case 0:
            break;
          case 1:
            isContextProvider(current$$1.type) && popContext(current$$1);
            break;
          case 3:
            popHostContainer(current$$1);
            popTopLevelContextObject(current$$1);
            newProps = current$$1.stateNode;
            newProps.pendingContext &&
              ((newProps.context = newProps.pendingContext),
              (newProps.pendingContext = null));
            if (null === current || null === current.child)
              current$$1.effectTag &= -3;
            updateHostContainer(current$$1);
            break;
          case 5:
            popHostContext(current$$1);
            renderExpirationTime = requiredContext(
              rootInstanceStackCursor.current
            );
            var type = current$$1.type;
            if (null !== current && null != current$$1.stateNode)
              updateHostComponent$1(
                current,
                current$$1,
                type,
                newProps,
                renderExpirationTime
              ),
                current.ref !== current$$1.ref && (current$$1.effectTag |= 128);
            else if (newProps) {
              current = requiredContext(contextStackCursor$1.current);
              var internalInstanceHandle = current$$1,
                tag = allocateTag(),
                viewConfig = ReactNativeViewConfigRegistry.get(type);
              invariant(
                "RCTView" !== type || !current.isInAParentText,
                "Nesting of <View> within <Text> is not currently supported."
              );
              var updatePayload = diffProperties(
                null,
                emptyObject,
                newProps,
                viewConfig.validAttributes
              );
              UIManager.createView(
                tag,
                viewConfig.uiViewClassName,
                renderExpirationTime,
                updatePayload
              );
              viewConfig = new ReactNativeFiberHostComponent(tag, viewConfig);
              instanceCache[tag] = internalInstanceHandle;
              instanceProps[tag] = newProps;
              appendAllChildren(viewConfig, current$$1, !1, !1);
              finalizeInitialChildren(
                viewConfig,
                type,
                newProps,
                renderExpirationTime,
                current
              ) && (current$$1.effectTag |= 4);
              current$$1.stateNode = viewConfig;
              null !== current$$1.ref && (current$$1.effectTag |= 128);
            } else
              invariant(
                null !== current$$1.stateNode,
                "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
              );
            break;
          case 6:
            current && null != current$$1.stateNode
              ? updateHostText$1(
                  current,
                  current$$1,
                  current.memoizedProps,
                  newProps
                )
              : ("string" !== typeof newProps &&
                  invariant(
                    null !== current$$1.stateNode,
                    "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
                  ),
                (current = requiredContext(rootInstanceStackCursor.current)),
                (type = requiredContext(contextStackCursor$1.current)),
                (renderExpirationTime = current$$1),
                invariant(
                  type.isInAParentText,
                  "Text strings must be rendered within a <Text> component."
                ),
                (type = allocateTag()),
                UIManager.createView(type, "RCTRawText", current, {
                  text: newProps
                }),
                (instanceCache[type] = current$$1),
                (renderExpirationTime.stateNode = type));
            break;
          case 11:
            break;
          case 13:
            newProps = current$$1.memoizedState;
            if (0 !== (current$$1.effectTag & 64)) {
              current$$1.expirationTime = renderExpirationTime;
              nextUnitOfWork = current$$1;
              break a;
            }
            newProps = null !== newProps;
            renderExpirationTime =
              null !== current && null !== current.memoizedState;
            null !== current &&
              !newProps &&
              renderExpirationTime &&
              ((type = current.child.sibling),
              null !== type &&
                ((current = current$$1.firstEffect),
                null !== current
                  ? ((current$$1.firstEffect = type),
                    (type.nextEffect = current))
                  : ((current$$1.firstEffect = current$$1.lastEffect = type),
                    (type.nextEffect = null)),
                (type.effectTag = 8)));
            if (
              newProps !== renderExpirationTime ||
              (0 === (current$$1.effectTag & 1) && newProps)
            )
              current$$1.effectTag |= 4;
            break;
          case 7:
            break;
          case 8:
            break;
          case 12:
            break;
          case 4:
            popHostContainer(current$$1);
            updateHostContainer(current$$1);
            break;
          case 10:
            popProvider(current$$1);
            break;
          case 9:
            break;
          case 14:
            break;
          case 17:
            isContextProvider(current$$1.type) && popContext(current$$1);
            break;
          default:
            invariant(
              !1,
              "Unknown unit of work tag. This error is likely caused by a bug in React. Please file an issue."
            );
        }
        nextUnitOfWork = null;
      }
      current$$1 = workInProgress;
      if (
        1 === nextRenderExpirationTime ||
        1 !== current$$1.childExpirationTime
      ) {
        newProps = 0;
        for (
          renderExpirationTime = current$$1.child;
          null !== renderExpirationTime;

        )
          (type = renderExpirationTime.expirationTime),
            (current = renderExpirationTime.childExpirationTime),
            type > newProps && (newProps = type),
            current > newProps && (newProps = current),
            (renderExpirationTime = renderExpirationTime.sibling);
        current$$1.childExpirationTime = newProps;
      }
      if (null !== nextUnitOfWork) return nextUnitOfWork;
      null !== returnFiber &&
        0 === (returnFiber.effectTag & 1024) &&
        (null === returnFiber.firstEffect &&
          (returnFiber.firstEffect = workInProgress.firstEffect),
        null !== workInProgress.lastEffect &&
          (null !== returnFiber.lastEffect &&
            (returnFiber.lastEffect.nextEffect = workInProgress.firstEffect),
          (returnFiber.lastEffect = workInProgress.lastEffect)),
        1 < workInProgress.effectTag &&
          (null !== returnFiber.lastEffect
            ? (returnFiber.lastEffect.nextEffect = workInProgress)
            : (returnFiber.firstEffect = workInProgress),
          (returnFiber.lastEffect = workInProgress)));
    } else {
      workInProgress = unwindWork(workInProgress, nextRenderExpirationTime);
      if (null !== workInProgress)
        return (workInProgress.effectTag &= 1023), workInProgress;
      null !== returnFiber &&
        ((returnFiber.firstEffect = returnFiber.lastEffect = null),
        (returnFiber.effectTag |= 1024));
    }
    if (null !== siblingFiber) return siblingFiber;
    if (null !== returnFiber) workInProgress = returnFiber;
    else break;
  }
  return null;
}
function performUnitOfWork(workInProgress) {
  var next = beginWork(
    workInProgress.alternate,
    workInProgress,
    nextRenderExpirationTime
  );
  workInProgress.memoizedProps = workInProgress.pendingProps;
  null === next && (next = completeUnitOfWork(workInProgress));
  ReactCurrentOwner$2.current = null;
  return next;
}
function renderRoot(root$jscomp$0, isYieldy) {
  invariant(
    !isWorking,
    "renderRoot was called recursively. This error is likely caused by a bug in React. Please file an issue."
  );
  flushPassiveEffects();
  isWorking = !0;
  ReactCurrentOwner$2.currentDispatcher = DispatcherWithoutHooks;
  var expirationTime = root$jscomp$0.nextExpirationTimeToWorkOn;
  if (
    expirationTime !== nextRenderExpirationTime ||
    root$jscomp$0 !== nextRoot ||
    null === nextUnitOfWork
  )
    resetStack(),
      (nextRoot = root$jscomp$0),
      (nextRenderExpirationTime = expirationTime),
      (nextUnitOfWork = createWorkInProgress(
        nextRoot.current,
        null,
        nextRenderExpirationTime
      )),
      (root$jscomp$0.pendingCommitExpirationTime = 0);
  var didFatal = !1;
  do {
    try {
      if (isYieldy)
        for (; null !== nextUnitOfWork && !shouldYieldToRenderer(); )
          nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      else
        for (; null !== nextUnitOfWork; )
          nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    } catch (thrownValue) {
      if (
        ((lastContextWithAllBitsObserved = lastContextDependency = currentlyRenderingFiber = null),
        null === nextUnitOfWork)
      )
        (didFatal = !0), onUncaughtError(thrownValue);
      else {
        invariant(
          null !== nextUnitOfWork,
          "Failed to replay rendering after an error. This is likely caused by a bug in React. Please file an issue with a reproducing case to help us find it."
        );
        var sourceFiber = nextUnitOfWork,
          returnFiber = sourceFiber.return;
        if (null === returnFiber) (didFatal = !0), onUncaughtError(thrownValue);
        else {
          a: {
            var root = root$jscomp$0,
              returnFiber$jscomp$0 = returnFiber,
              sourceFiber$jscomp$0 = sourceFiber,
              value = thrownValue;
            returnFiber = nextRenderExpirationTime;
            sourceFiber$jscomp$0.effectTag |= 1024;
            sourceFiber$jscomp$0.firstEffect = sourceFiber$jscomp$0.lastEffect = null;
            if (
              null !== value &&
              "object" === typeof value &&
              "function" === typeof value.then
            ) {
              var thenable = value;
              value = returnFiber$jscomp$0;
              var earliestTimeoutMs = -1,
                startTimeMs = -1;
              do {
                if (13 === value.tag) {
                  var current$$1 = value.alternate;
                  if (
                    null !== current$$1 &&
                    ((current$$1 = current$$1.memoizedState),
                    null !== current$$1)
                  ) {
                    startTimeMs = 10 * (1073741822 - current$$1.timedOutAt);
                    break;
                  }
                  current$$1 = value.pendingProps.maxDuration;
                  if ("number" === typeof current$$1)
                    if (0 >= current$$1) earliestTimeoutMs = 0;
                    else if (
                      -1 === earliestTimeoutMs ||
                      current$$1 < earliestTimeoutMs
                    )
                      earliestTimeoutMs = current$$1;
                }
                value = value.return;
              } while (null !== value);
              value = returnFiber$jscomp$0;
              do {
                if ((current$$1 = 13 === value.tag))
                  current$$1 =
                    void 0 === value.memoizedProps.fallback
                      ? !1
                      : null === value.memoizedState;
                if (current$$1) {
                  returnFiber$jscomp$0 = retrySuspendedRoot.bind(
                    null,
                    root,
                    value,
                    sourceFiber$jscomp$0,
                    0 === (value.mode & 1) ? 1073741823 : returnFiber
                  );
                  thenable.then(returnFiber$jscomp$0, returnFiber$jscomp$0);
                  if (0 === (value.mode & 1)) {
                    value.effectTag |= 64;
                    sourceFiber$jscomp$0.effectTag &= -1957;
                    1 === sourceFiber$jscomp$0.tag &&
                      null === sourceFiber$jscomp$0.alternate &&
                      (sourceFiber$jscomp$0.tag = 17);
                    sourceFiber$jscomp$0.expirationTime = returnFiber;
                    break a;
                  }
                  -1 === earliestTimeoutMs
                    ? (root = 1073741823)
                    : (-1 === startTimeMs &&
                        (startTimeMs =
                          10 *
                            (1073741822 -
                              findEarliestOutstandingPriorityLevel(
                                root,
                                returnFiber
                              )) -
                          5e3),
                      (root = startTimeMs + earliestTimeoutMs));
                  0 <= root &&
                    nextLatestAbsoluteTimeoutMs < root &&
                    (nextLatestAbsoluteTimeoutMs = root);
                  value.effectTag |= 2048;
                  value.expirationTime = returnFiber;
                  break a;
                }
                value = value.return;
              } while (null !== value);
              value = Error(
                (getComponentName(sourceFiber$jscomp$0.type) ||
                  "A React component") +
                  " suspended while rendering, but no fallback UI was specified.\n\nAdd a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display." +
                  getStackByFiberInDevAndProd(sourceFiber$jscomp$0)
              );
            }
            nextRenderDidError = !0;
            value = createCapturedValue(value, sourceFiber$jscomp$0);
            root = returnFiber$jscomp$0;
            do {
              switch (root.tag) {
                case 3:
                  sourceFiber$jscomp$0 = value;
                  root.effectTag |= 2048;
                  root.expirationTime = returnFiber;
                  returnFiber = createRootErrorUpdate(
                    root,
                    sourceFiber$jscomp$0,
                    returnFiber
                  );
                  enqueueCapturedUpdate(root, returnFiber);
                  break a;
                case 1:
                  if (
                    ((sourceFiber$jscomp$0 = value),
                    (returnFiber$jscomp$0 = root.type),
                    (thenable = root.stateNode),
                    0 === (root.effectTag & 64) &&
                      ("function" ===
                        typeof returnFiber$jscomp$0.getDerivedStateFromError ||
                        (null !== thenable &&
                          "function" === typeof thenable.componentDidCatch &&
                          (null === legacyErrorBoundariesThatAlreadyFailed ||
                            !legacyErrorBoundariesThatAlreadyFailed.has(
                              thenable
                            )))))
                  ) {
                    root.effectTag |= 2048;
                    root.expirationTime = returnFiber;
                    returnFiber = createClassErrorUpdate(
                      root,
                      sourceFiber$jscomp$0,
                      returnFiber
                    );
                    enqueueCapturedUpdate(root, returnFiber);
                    break a;
                  }
              }
              root = root.return;
            } while (null !== root);
          }
          nextUnitOfWork = completeUnitOfWork(sourceFiber);
          continue;
        }
      }
    }
    break;
  } while (1);
  isWorking = !1;
  lastContextWithAllBitsObserved = lastContextDependency = currentlyRenderingFiber = ReactCurrentOwner$2.currentDispatcher = null;
  if (didFatal) (nextRoot = null), (root$jscomp$0.finishedWork = null);
  else if (null !== nextUnitOfWork) root$jscomp$0.finishedWork = null;
  else {
    didFatal = root$jscomp$0.current.alternate;
    invariant(
      null !== didFatal,
      "Finished root should have a work-in-progress. This error is likely caused by a bug in React. Please file an issue."
    );
    nextRoot = null;
    if (nextRenderDidError) {
      sourceFiber = root$jscomp$0.latestPendingTime;
      returnFiber = root$jscomp$0.latestSuspendedTime;
      root = root$jscomp$0.latestPingedTime;
      if (
        (0 !== sourceFiber && sourceFiber < expirationTime) ||
        (0 !== returnFiber && returnFiber < expirationTime) ||
        (0 !== root && root < expirationTime)
      ) {
        markSuspendedPriorityLevel(root$jscomp$0, expirationTime);
        onSuspend(
          root$jscomp$0,
          didFatal,
          expirationTime,
          root$jscomp$0.expirationTime,
          -1
        );
        return;
      }
      if (!root$jscomp$0.didError && isYieldy) {
        root$jscomp$0.didError = !0;
        expirationTime = root$jscomp$0.nextExpirationTimeToWorkOn = expirationTime;
        isYieldy = root$jscomp$0.expirationTime = 1073741823;
        onSuspend(root$jscomp$0, didFatal, expirationTime, isYieldy, -1);
        return;
      }
    }
    isYieldy && -1 !== nextLatestAbsoluteTimeoutMs
      ? (markSuspendedPriorityLevel(root$jscomp$0, expirationTime),
        (isYieldy =
          10 *
          (1073741822 -
            findEarliestOutstandingPriorityLevel(
              root$jscomp$0,
              expirationTime
            ))),
        isYieldy < nextLatestAbsoluteTimeoutMs &&
          (nextLatestAbsoluteTimeoutMs = isYieldy),
        (isYieldy = 10 * (1073741822 - requestCurrentTime())),
        (isYieldy = nextLatestAbsoluteTimeoutMs - isYieldy),
        onSuspend(
          root$jscomp$0,
          didFatal,
          expirationTime,
          root$jscomp$0.expirationTime,
          0 > isYieldy ? 0 : isYieldy
        ))
      : ((root$jscomp$0.pendingCommitExpirationTime = expirationTime),
        (root$jscomp$0.finishedWork = didFatal));
  }
}
function captureCommitPhaseError(sourceFiber, value) {
  for (var fiber = sourceFiber.return; null !== fiber; ) {
    switch (fiber.tag) {
      case 1:
        var instance = fiber.stateNode;
        if (
          "function" === typeof fiber.type.getDerivedStateFromError ||
          ("function" === typeof instance.componentDidCatch &&
            (null === legacyErrorBoundariesThatAlreadyFailed ||
              !legacyErrorBoundariesThatAlreadyFailed.has(instance)))
        ) {
          sourceFiber = createCapturedValue(value, sourceFiber);
          sourceFiber = createClassErrorUpdate(fiber, sourceFiber, 1073741823);
          enqueueUpdate(fiber, sourceFiber);
          scheduleWork(fiber, 1073741823);
          return;
        }
        break;
      case 3:
        sourceFiber = createCapturedValue(value, sourceFiber);
        sourceFiber = createRootErrorUpdate(fiber, sourceFiber, 1073741823);
        enqueueUpdate(fiber, sourceFiber);
        scheduleWork(fiber, 1073741823);
        return;
    }
    fiber = fiber.return;
  }
  3 === sourceFiber.tag &&
    ((fiber = createCapturedValue(value, sourceFiber)),
    (fiber = createRootErrorUpdate(sourceFiber, fiber, 1073741823)),
    enqueueUpdate(sourceFiber, fiber),
    scheduleWork(sourceFiber, 1073741823));
}
function computeExpirationForFiber(currentTime, fiber) {
  isWorking
    ? (currentTime = isCommitting$1 ? 1073741823 : nextRenderExpirationTime)
    : fiber.mode & 1
      ? ((currentTime = isBatchingInteractiveUpdates
          ? 1073741822 - 10 * ((((1073741822 - currentTime + 15) / 10) | 0) + 1)
          : 1073741822 -
            25 * ((((1073741822 - currentTime + 500) / 25) | 0) + 1)),
        null !== nextRoot &&
          currentTime === nextRenderExpirationTime &&
          --currentTime)
      : (currentTime = 1073741823);
  isBatchingInteractiveUpdates &&
    (0 === lowestPriorityPendingInteractiveExpirationTime ||
      currentTime < lowestPriorityPendingInteractiveExpirationTime) &&
    (lowestPriorityPendingInteractiveExpirationTime = currentTime);
  return currentTime;
}
function retrySuspendedRoot(root, boundaryFiber, sourceFiber, suspendedTime) {
  var retryTime = root.earliestSuspendedTime;
  var latestSuspendedTime = root.latestSuspendedTime;
  if (
    0 !== retryTime &&
    suspendedTime <= retryTime &&
    suspendedTime >= latestSuspendedTime
  ) {
    latestSuspendedTime = retryTime = suspendedTime;
    root.didError = !1;
    var latestPingedTime = root.latestPingedTime;
    if (0 === latestPingedTime || latestPingedTime > latestSuspendedTime)
      root.latestPingedTime = latestSuspendedTime;
    findNextExpirationTimeToWorkOn(latestSuspendedTime, root);
  } else
    (retryTime = requestCurrentTime()),
      (retryTime = computeExpirationForFiber(retryTime, boundaryFiber)),
      markPendingPriorityLevel(root, retryTime);
  0 !== (boundaryFiber.mode & 1) &&
    root === nextRoot &&
    nextRenderExpirationTime === suspendedTime &&
    (nextRoot = null);
  scheduleWorkToRoot(boundaryFiber, retryTime);
  0 === (boundaryFiber.mode & 1) &&
    (scheduleWorkToRoot(sourceFiber, retryTime),
    1 === sourceFiber.tag &&
      null !== sourceFiber.stateNode &&
      ((boundaryFiber = createUpdate(retryTime)),
      (boundaryFiber.tag = 2),
      enqueueUpdate(sourceFiber, boundaryFiber)));
  sourceFiber = root.expirationTime;
  0 !== sourceFiber && requestWork(root, sourceFiber);
}
function scheduleWorkToRoot(fiber, expirationTime) {
  fiber.expirationTime < expirationTime &&
    (fiber.expirationTime = expirationTime);
  var alternate = fiber.alternate;
  null !== alternate &&
    alternate.expirationTime < expirationTime &&
    (alternate.expirationTime = expirationTime);
  var node = fiber.return,
    root = null;
  if (null === node && 3 === fiber.tag) root = fiber.stateNode;
  else
    for (; null !== node; ) {
      alternate = node.alternate;
      node.childExpirationTime < expirationTime &&
        (node.childExpirationTime = expirationTime);
      null !== alternate &&
        alternate.childExpirationTime < expirationTime &&
        (alternate.childExpirationTime = expirationTime);
      if (null === node.return && 3 === node.tag) {
        root = node.stateNode;
        break;
      }
      node = node.return;
    }
  return root;
}
function scheduleWork(fiber, expirationTime) {
  fiber = scheduleWorkToRoot(fiber, expirationTime);
  null !== fiber &&
    (!isWorking &&
      0 !== nextRenderExpirationTime &&
      expirationTime > nextRenderExpirationTime &&
      resetStack(),
    markPendingPriorityLevel(fiber, expirationTime),
    (isWorking && !isCommitting$1 && nextRoot === fiber) ||
      requestWork(fiber, fiber.expirationTime),
    nestedUpdateCount > NESTED_UPDATE_LIMIT &&
      ((nestedUpdateCount = 0),
      invariant(
        !1,
        "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops."
      )));
}
var firstScheduledRoot = null,
  lastScheduledRoot = null,
  callbackExpirationTime = 0,
  callbackID = void 0,
  isRendering = !1,
  nextFlushedRoot = null,
  nextFlushedExpirationTime = 0,
  lowestPriorityPendingInteractiveExpirationTime = 0,
  hasUnhandledError = !1,
  unhandledError = null,
  isBatchingUpdates = !1,
  isUnbatchingUpdates = !1,
  isBatchingInteractiveUpdates = !1,
  completedBatches = null,
  originalStartTimeMs = now$1(),
  currentRendererTime = 1073741822 - ((originalStartTimeMs / 10) | 0),
  currentSchedulerTime = currentRendererTime,
  NESTED_UPDATE_LIMIT = 50,
  nestedUpdateCount = 0,
  lastCommittedRootDuringThisBatch = null;
function recomputeCurrentRendererTime() {
  currentRendererTime =
    1073741822 - (((now$1() - originalStartTimeMs) / 10) | 0);
}
function scheduleCallbackWithExpirationTime(root, expirationTime) {
  if (0 !== callbackExpirationTime) {
    if (expirationTime < callbackExpirationTime) return;
    null !== callbackID &&
      ((root = callbackID), (scheduledCallback = null), clearTimeout(root));
  }
  callbackExpirationTime = expirationTime;
  now$1();
  scheduledCallback = performAsyncWork;
  callbackID = setTimeout(setTimeoutCallback, 1);
}
function onSuspend(
  root,
  finishedWork,
  suspendedExpirationTime,
  rootExpirationTime,
  msUntilTimeout
) {
  root.expirationTime = rootExpirationTime;
  0 !== msUntilTimeout || shouldYieldToRenderer()
    ? 0 < msUntilTimeout &&
      (root.timeoutHandle = scheduleTimeout(
        onTimeout.bind(null, root, finishedWork, suspendedExpirationTime),
        msUntilTimeout
      ))
    : ((root.pendingCommitExpirationTime = suspendedExpirationTime),
      (root.finishedWork = finishedWork));
}
function onTimeout(root, finishedWork, suspendedExpirationTime) {
  root.pendingCommitExpirationTime = suspendedExpirationTime;
  root.finishedWork = finishedWork;
  recomputeCurrentRendererTime();
  currentSchedulerTime = currentRendererTime;
  invariant(
    !isRendering,
    "work.commit(): Cannot commit while already rendering. This likely means you attempted to commit from inside a lifecycle method."
  );
  nextFlushedRoot = root;
  nextFlushedExpirationTime = suspendedExpirationTime;
  performWorkOnRoot(root, suspendedExpirationTime, !1);
  performWork(1073741823, !1);
}
function requestCurrentTime() {
  if (isRendering) return currentSchedulerTime;
  findHighestPriorityRoot();
  if (0 === nextFlushedExpirationTime || 1 === nextFlushedExpirationTime)
    recomputeCurrentRendererTime(),
      (currentSchedulerTime = currentRendererTime);
  return currentSchedulerTime;
}
function requestWork(root, expirationTime) {
  null === root.nextScheduledRoot
    ? ((root.expirationTime = expirationTime),
      null === lastScheduledRoot
        ? ((firstScheduledRoot = lastScheduledRoot = root),
          (root.nextScheduledRoot = root))
        : ((lastScheduledRoot = lastScheduledRoot.nextScheduledRoot = root),
          (lastScheduledRoot.nextScheduledRoot = firstScheduledRoot)))
    : expirationTime > root.expirationTime &&
      (root.expirationTime = expirationTime);
  isRendering ||
    (isBatchingUpdates
      ? isUnbatchingUpdates &&
        ((nextFlushedRoot = root),
        (nextFlushedExpirationTime = 1073741823),
        performWorkOnRoot(root, 1073741823, !1))
      : 1073741823 === expirationTime
        ? performWork(1073741823, !1)
        : scheduleCallbackWithExpirationTime(root, expirationTime));
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
        remainingExpirationTime > highestPriorityWork &&
          ((highestPriorityWork = remainingExpirationTime),
          (highestPriorityRoot = root));
        if (root === lastScheduledRoot) break;
        if (1073741823 === highestPriorityWork) break;
        previousScheduledRoot = root;
        root = root.nextScheduledRoot;
      }
    }
  nextFlushedRoot = highestPriorityRoot;
  nextFlushedExpirationTime = highestPriorityWork;
}
var didYield = !1;
function shouldYieldToRenderer() {
  return didYield ? !0 : frameDeadline <= now$1() ? (didYield = !0) : !1;
}
function performAsyncWork() {
  try {
    if (!shouldYieldToRenderer() && null !== firstScheduledRoot) {
      recomputeCurrentRendererTime();
      var root = firstScheduledRoot;
      do {
        var expirationTime = root.expirationTime;
        0 !== expirationTime &&
          currentRendererTime <= expirationTime &&
          (root.nextExpirationTimeToWorkOn = currentRendererTime);
        root = root.nextScheduledRoot;
      } while (root !== firstScheduledRoot);
    }
    performWork(0, !0);
  } finally {
    didYield = !1;
  }
}
function performWork(minExpirationTime, isYieldy) {
  findHighestPriorityRoot();
  if (isYieldy)
    for (
      recomputeCurrentRendererTime(),
        currentSchedulerTime = currentRendererTime;
      null !== nextFlushedRoot &&
      0 !== nextFlushedExpirationTime &&
      minExpirationTime <= nextFlushedExpirationTime &&
      !(didYield && currentRendererTime > nextFlushedExpirationTime);

    )
      performWorkOnRoot(
        nextFlushedRoot,
        nextFlushedExpirationTime,
        currentRendererTime > nextFlushedExpirationTime
      ),
        findHighestPriorityRoot(),
        recomputeCurrentRendererTime(),
        (currentSchedulerTime = currentRendererTime);
  else
    for (
      ;
      null !== nextFlushedRoot &&
      0 !== nextFlushedExpirationTime &&
      minExpirationTime <= nextFlushedExpirationTime;

    )
      performWorkOnRoot(nextFlushedRoot, nextFlushedExpirationTime, !1),
        findHighestPriorityRoot();
  isYieldy && ((callbackExpirationTime = 0), (callbackID = null));
  0 !== nextFlushedExpirationTime &&
    scheduleCallbackWithExpirationTime(
      nextFlushedRoot,
      nextFlushedExpirationTime
    );
  nestedUpdateCount = 0;
  lastCommittedRootDuringThisBatch = null;
  if (null !== completedBatches)
    for (
      minExpirationTime = completedBatches,
        completedBatches = null,
        isYieldy = 0;
      isYieldy < minExpirationTime.length;
      isYieldy++
    ) {
      var batch = minExpirationTime[isYieldy];
      try {
        batch._onComplete();
      } catch (error) {
        hasUnhandledError ||
          ((hasUnhandledError = !0), (unhandledError = error));
      }
    }
  if (hasUnhandledError)
    throw ((minExpirationTime = unhandledError),
    (unhandledError = null),
    (hasUnhandledError = !1),
    minExpirationTime);
}
function performWorkOnRoot(root, expirationTime, isYieldy) {
  invariant(
    !isRendering,
    "performWorkOnRoot was called recursively. This error is likely caused by a bug in React. Please file an issue."
  );
  isRendering = !0;
  if (isYieldy) {
    var _finishedWork = root.finishedWork;
    null !== _finishedWork
      ? completeRoot(root, _finishedWork, expirationTime)
      : ((root.finishedWork = null),
        (_finishedWork = root.timeoutHandle),
        -1 !== _finishedWork &&
          ((root.timeoutHandle = -1), cancelTimeout(_finishedWork)),
        renderRoot(root, isYieldy),
        (_finishedWork = root.finishedWork),
        null !== _finishedWork &&
          (shouldYieldToRenderer()
            ? (root.finishedWork = _finishedWork)
            : completeRoot(root, _finishedWork, expirationTime)));
  } else
    (_finishedWork = root.finishedWork),
      null !== _finishedWork
        ? completeRoot(root, _finishedWork, expirationTime)
        : ((root.finishedWork = null),
          (_finishedWork = root.timeoutHandle),
          -1 !== _finishedWork &&
            ((root.timeoutHandle = -1), cancelTimeout(_finishedWork)),
          renderRoot(root, isYieldy),
          (_finishedWork = root.finishedWork),
          null !== _finishedWork &&
            completeRoot(root, _finishedWork, expirationTime));
  isRendering = !1;
}
function completeRoot(root, finishedWork$jscomp$0, expirationTime) {
  var firstBatch = root.firstBatch;
  if (
    null !== firstBatch &&
    firstBatch._expirationTime >= expirationTime &&
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
  root === lastCommittedRootDuringThisBatch
    ? nestedUpdateCount++
    : ((lastCommittedRootDuringThisBatch = root), (nestedUpdateCount = 0));
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
  var childExpirationTimeBeforeCommit =
    finishedWork$jscomp$0.childExpirationTime;
  firstBatch =
    childExpirationTimeBeforeCommit > firstBatch
      ? childExpirationTimeBeforeCommit
      : firstBatch;
  root.didError = !1;
  0 === firstBatch
    ? ((root.earliestPendingTime = 0),
      (root.latestPendingTime = 0),
      (root.earliestSuspendedTime = 0),
      (root.latestSuspendedTime = 0),
      (root.latestPingedTime = 0))
    : ((childExpirationTimeBeforeCommit = root.latestPendingTime),
      0 !== childExpirationTimeBeforeCommit &&
        (childExpirationTimeBeforeCommit > firstBatch
          ? (root.earliestPendingTime = root.latestPendingTime = 0)
          : root.earliestPendingTime > firstBatch &&
            (root.earliestPendingTime = root.latestPendingTime)),
      (childExpirationTimeBeforeCommit = root.earliestSuspendedTime),
      0 === childExpirationTimeBeforeCommit
        ? markPendingPriorityLevel(root, firstBatch)
        : firstBatch < root.latestSuspendedTime
          ? ((root.earliestSuspendedTime = 0),
            (root.latestSuspendedTime = 0),
            (root.latestPingedTime = 0),
            markPendingPriorityLevel(root, firstBatch))
          : firstBatch > childExpirationTimeBeforeCommit &&
            markPendingPriorityLevel(root, firstBatch));
  findNextExpirationTimeToWorkOn(0, root);
  ReactCurrentOwner$2.current = null;
  1 < finishedWork$jscomp$0.effectTag
    ? null !== finishedWork$jscomp$0.lastEffect
      ? ((finishedWork$jscomp$0.lastEffect.nextEffect = finishedWork$jscomp$0),
        (firstBatch = finishedWork$jscomp$0.firstEffect))
      : (firstBatch = finishedWork$jscomp$0)
    : (firstBatch = finishedWork$jscomp$0.firstEffect);
  for (nextEffect = firstBatch; null !== nextEffect; ) {
    childExpirationTimeBeforeCommit = !1;
    var error = void 0;
    try {
      for (; null !== nextEffect; ) {
        if (nextEffect.effectTag & 256)
          a: {
            var current$$1 = nextEffect.alternate,
              finishedWork = nextEffect;
            switch (finishedWork.tag) {
              case 0:
              case 11:
              case 15:
                break a;
              case 1:
                if (finishedWork.effectTag & 256 && null !== current$$1) {
                  var prevProps = current$$1.memoizedProps,
                    prevState = current$$1.memoizedState,
                    instance = finishedWork.stateNode,
                    snapshot = instance.getSnapshotBeforeUpdate(
                      finishedWork.elementType === finishedWork.type
                        ? prevProps
                        : resolveDefaultProps(finishedWork.type, prevProps),
                      prevState
                    );
                  instance.__reactInternalSnapshotBeforeUpdate = snapshot;
                }
                break a;
              case 3:
              case 5:
              case 6:
              case 4:
              case 17:
                break a;
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
      (childExpirationTimeBeforeCommit = !0), (error = e);
    }
    childExpirationTimeBeforeCommit &&
      (invariant(
        null !== nextEffect,
        "Should have next effect. This error is likely caused by a bug in React. Please file an issue."
      ),
      captureCommitPhaseError(nextEffect, error),
      null !== nextEffect && (nextEffect = nextEffect.nextEffect));
  }
  for (nextEffect = firstBatch; null !== nextEffect; ) {
    current$$1 = !1;
    prevProps = void 0;
    try {
      for (; null !== nextEffect; ) {
        var effectTag = nextEffect.effectTag;
        if (effectTag & 128) {
          var current$$1$jscomp$0 = nextEffect.alternate;
          if (null !== current$$1$jscomp$0) {
            var currentRef = current$$1$jscomp$0.ref;
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
            prevState = nextEffect;
            unmountHostComponents(prevState);
            prevState.return = null;
            prevState.child = null;
            prevState.memoizedState = null;
            prevState.updateQueue = null;
            var alternate = prevState.alternate;
            null !== alternate &&
              ((alternate.return = null),
              (alternate.child = null),
              (alternate.memoizedState = null),
              (alternate.updateQueue = null));
        }
        nextEffect = nextEffect.nextEffect;
      }
    } catch (e) {
      (current$$1 = !0), (prevProps = e);
    }
    current$$1 &&
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
    current$$1$jscomp$0 = void 0;
    try {
      for (currentRef = expirationTime; null !== nextEffect; ) {
        var effectTag$jscomp$0 = nextEffect.effectTag;
        if (effectTag$jscomp$0 & 36) {
          var current$$1$jscomp$1 = nextEffect.alternate;
          alternate = nextEffect;
          current$$1 = currentRef;
          switch (alternate.tag) {
            case 0:
            case 11:
            case 15:
              break;
            case 1:
              var instance$jscomp$0 = alternate.stateNode;
              if (alternate.effectTag & 4)
                if (null === current$$1$jscomp$1)
                  instance$jscomp$0.componentDidMount();
                else {
                  var prevProps$jscomp$0 =
                    alternate.elementType === alternate.type
                      ? current$$1$jscomp$1.memoizedProps
                      : resolveDefaultProps(
                          alternate.type,
                          current$$1$jscomp$1.memoizedProps
                        );
                  instance$jscomp$0.componentDidUpdate(
                    prevProps$jscomp$0,
                    current$$1$jscomp$1.memoizedState,
                    instance$jscomp$0.__reactInternalSnapshotBeforeUpdate
                  );
                }
              var updateQueue = alternate.updateQueue;
              null !== updateQueue &&
                commitUpdateQueue(
                  alternate,
                  updateQueue,
                  instance$jscomp$0,
                  current$$1
                );
              break;
            case 3:
              var _updateQueue = alternate.updateQueue;
              if (null !== _updateQueue) {
                prevProps = null;
                if (null !== alternate.child)
                  switch (alternate.child.tag) {
                    case 5:
                      prevProps = alternate.child.stateNode;
                      break;
                    case 1:
                      prevProps = alternate.child.stateNode;
                  }
                commitUpdateQueue(
                  alternate,
                  _updateQueue,
                  prevProps,
                  current$$1
                );
              }
              break;
            case 5:
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              break;
            case 17:
              break;
            default:
              invariant(
                !1,
                "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
              );
          }
        }
        if (effectTag$jscomp$0 & 128) {
          var ref = nextEffect.ref;
          if (null !== ref) {
            var instance$jscomp$1 = nextEffect.stateNode;
            switch (nextEffect.tag) {
              case 5:
                var instanceToUse = instance$jscomp$1;
                break;
              default:
                instanceToUse = instance$jscomp$1;
            }
            "function" === typeof ref
              ? ref(instanceToUse)
              : (ref.current = instanceToUse);
          }
        }
        nextEffect = nextEffect.nextEffect;
      }
    } catch (e) {
      (effectTag = !0), (current$$1$jscomp$0 = e);
    }
    effectTag &&
      (invariant(
        null !== nextEffect,
        "Should have next effect. This error is likely caused by a bug in React. Please file an issue."
      ),
      captureCommitPhaseError(nextEffect, current$$1$jscomp$0),
      null !== nextEffect && (nextEffect = nextEffect.nextEffect));
  }
  isWorking = isCommitting$1 = !1;
  "function" === typeof onCommitFiberRoot &&
    onCommitFiberRoot(finishedWork$jscomp$0.stateNode);
  effectTag$jscomp$0 = finishedWork$jscomp$0.expirationTime;
  finishedWork$jscomp$0 = finishedWork$jscomp$0.childExpirationTime;
  finishedWork$jscomp$0 =
    finishedWork$jscomp$0 > effectTag$jscomp$0
      ? finishedWork$jscomp$0
      : effectTag$jscomp$0;
  0 === finishedWork$jscomp$0 &&
    (legacyErrorBoundariesThatAlreadyFailed = null);
  root.expirationTime = finishedWork$jscomp$0;
  root.finishedWork = null;
}
function onUncaughtError(error) {
  invariant(
    null !== nextFlushedRoot,
    "Should be working on a root. This error is likely caused by a bug in React. Please file an issue."
  );
  nextFlushedRoot.expirationTime = 0;
  hasUnhandledError || ((hasUnhandledError = !0), (unhandledError = error));
}
function findHostInstance(component) {
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
  var current$$1 = container.current,
    currentTime = requestCurrentTime();
  current$$1 = computeExpirationForFiber(currentTime, current$$1);
  currentTime = container.current;
  a: if (parentComponent) {
    parentComponent = parentComponent._reactInternalFiber;
    b: {
      invariant(
        2 === isFiberMountedImpl(parentComponent) && 1 === parentComponent.tag,
        "Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue."
      );
      var parentContext = parentComponent;
      do {
        switch (parentContext.tag) {
          case 3:
            parentContext = parentContext.stateNode.context;
            break b;
          case 1:
            if (isContextProvider(parentContext.type)) {
              parentContext =
                parentContext.stateNode
                  .__reactInternalMemoizedMergedChildContext;
              break b;
            }
        }
        parentContext = parentContext.return;
      } while (null !== parentContext);
      invariant(
        !1,
        "Found unexpected detached subtree parent. This error is likely caused by a bug in React. Please file an issue."
      );
      parentContext = void 0;
    }
    if (1 === parentComponent.tag) {
      var Component = parentComponent.type;
      if (isContextProvider(Component)) {
        parentComponent = processChildContext(
          parentComponent,
          Component,
          parentContext
        );
        break a;
      }
    }
    parentComponent = parentContext;
  } else parentComponent = emptyContextObject;
  null === container.context
    ? (container.context = parentComponent)
    : (container.pendingContext = parentComponent);
  container = callback;
  callback = createUpdate(current$$1);
  callback.payload = { element: element };
  container = void 0 === container ? null : container;
  null !== container && (callback.callback = container);
  flushPassiveEffects();
  enqueueUpdate(currentTime, callback);
  scheduleWork(currentTime, current$$1);
  return current$$1;
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
  componentOrHandle = findHostInstance(componentOrHandle);
  return null == componentOrHandle
    ? componentOrHandle
    : componentOrHandle.canonical
      ? componentOrHandle.canonical._nativeTag
      : componentOrHandle._nativeTag;
}
_batchedUpdatesImpl = function(fn, a) {
  var previousIsBatchingUpdates = isBatchingUpdates;
  isBatchingUpdates = !0;
  try {
    return fn(a);
  } finally {
    (isBatchingUpdates = previousIsBatchingUpdates) ||
      isRendering ||
      performWork(1073741823, !1);
  }
};
_flushInteractiveUpdatesImpl = function() {
  isRendering ||
    0 === lowestPriorityPendingInteractiveExpirationTime ||
    (performWork(lowestPriorityPendingInteractiveExpirationTime, !1),
    (lowestPriorityPendingInteractiveExpirationTime = 0));
};
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
            mountSafeCallback_NOT_REALLY_SAFE(this, callback)
          );
        };
        ReactNativeComponent.prototype.measureInWindow = function(callback) {
          UIManager.measureInWindow(
            findNodeHandle(this),
            mountSafeCallback_NOT_REALLY_SAFE(this, callback)
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
            mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
            mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess)
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
              emptyObject,
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
      if (!root) {
        root = createFiber(3, null, null, 0);
        var root$jscomp$0 = {
          current: root,
          containerInfo: containerTag,
          pendingChildren: null,
          earliestPendingTime: 0,
          latestPendingTime: 0,
          earliestSuspendedTime: 0,
          latestSuspendedTime: 0,
          latestPingedTime: 0,
          didError: !1,
          pendingCommitExpirationTime: 0,
          finishedWork: null,
          timeoutHandle: -1,
          context: null,
          pendingContext: null,
          hydrate: !1,
          nextExpirationTimeToWorkOn: 0,
          expirationTime: 0,
          firstBatch: null,
          nextScheduledRoot: null
        };
        root = root.stateNode = root$jscomp$0;
        roots.set(containerTag, root);
      }
      updateContainer(element, root, null, callback);
      a: if (((element = root.current), element.child))
        switch (element.child.tag) {
          case 5:
            element = element.child.stateNode;
            break a;
          default:
            element = element.child.stateNode;
        }
      else element = null;
      return element;
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
              mountSafeCallback_NOT_REALLY_SAFE(this, callback)
            );
          },
          measureInWindow: function(callback) {
            UIManager.measureInWindow(
              findNodeHandle(this),
              mountSafeCallback_NOT_REALLY_SAFE(this, callback)
            );
          },
          measureLayout: function(relativeToNativeNode, onSuccess, onFail) {
            UIManager.measureLayout(
              findNodeHandle(this),
              relativeToNativeNode,
              mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
              mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess)
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
                emptyObject,
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
      computeComponentStackForErrorReporting: function(reactTag) {
        return (reactTag = getInstanceFromTag(reactTag))
          ? getStackByFiberInDevAndProd(reactTag)
          : "";
      }
    }
  };
(function(devToolsConfig) {
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
})({
  findFiberByHostInstance: getInstanceFromTag,
  getInspectorDataForViewTag: getInspectorDataForViewTag,
  bundleType: 0,
  version: "16.6.1",
  rendererPackageName: "react-native-renderer"
});
var ReactNativeRenderer$2 = { default: ReactNativeRenderer },
  ReactNativeRenderer$3 =
    (ReactNativeRenderer$2 && ReactNativeRenderer) || ReactNativeRenderer$2;
module.exports = ReactNativeRenderer$3.default || ReactNativeRenderer$3;
