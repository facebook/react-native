/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @providesModule ReactFabric-profiling
 * @preventMunge
 * @generated
 */

"use strict";
require("react-native/Libraries/ReactPrivate/ReactNativePrivateInitializeCore");
var ReactNativePrivateInterface = require("react-native/Libraries/ReactPrivate/ReactNativePrivateInterface"),
  React = require("react"),
  Scheduler = require("scheduler"),
  tracing = require("scheduler/tracing");
function ReactError(error) {
  error.name = "Invariant Violation";
  return error;
}
var eventPluginOrder = null,
  namesToPlugins = {};
function recomputePluginOrdering() {
  if (eventPluginOrder)
    for (var pluginName in namesToPlugins) {
      var pluginModule = namesToPlugins[pluginName],
        pluginIndex = eventPluginOrder.indexOf(pluginName);
      if (!(-1 < pluginIndex))
        throw ReactError(
          Error(
            "EventPluginRegistry: Cannot inject event plugins that do not exist in the plugin ordering, `" +
              pluginName +
              "`."
          )
        );
      if (!plugins[pluginIndex]) {
        if (!pluginModule.extractEvents)
          throw ReactError(
            Error(
              "EventPluginRegistry: Event plugins must implement an `extractEvents` method, but `" +
                pluginName +
                "` does not."
            )
          );
        plugins[pluginIndex] = pluginModule;
        pluginIndex = pluginModule.eventTypes;
        for (var eventName in pluginIndex) {
          var JSCompiler_inline_result = void 0;
          var dispatchConfig = pluginIndex[eventName],
            pluginModule$jscomp$0 = pluginModule,
            eventName$jscomp$0 = eventName;
          if (eventNameDispatchConfigs.hasOwnProperty(eventName$jscomp$0))
            throw ReactError(
              Error(
                "EventPluginHub: More than one plugin attempted to publish the same event name, `" +
                  eventName$jscomp$0 +
                  "`."
              )
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
          if (!JSCompiler_inline_result)
            throw ReactError(
              Error(
                "EventPluginRegistry: Failed to publish event `" +
                  eventName +
                  "` for plugin `" +
                  pluginName +
                  "`."
              )
            );
        }
      }
    }
}
function publishRegistrationName(registrationName, pluginModule) {
  if (registrationNameModules[registrationName])
    throw ReactError(
      Error(
        "EventPluginHub: More than one plugin attempted to publish the same registration name, `" +
          registrationName +
          "`."
      )
    );
  registrationNameModules[registrationName] = pluginModule;
}
var plugins = [],
  eventNameDispatchConfigs = {},
  registrationNameModules = {};
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
      throw ReactError(
        Error(
          "clearCaughtError was called but no error was captured. This error is likely caused by a bug in React. Please file an issue."
        )
      );
    hasRethrowError || ((hasRethrowError = !0), (rethrowError = error));
  }
}
var getFiberCurrentPropsFromNode = null,
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
  if (Array.isArray(dispatchListener))
    throw ReactError(Error("executeDirectDispatch(...): Invalid `event`."));
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
  if (null == next)
    throw ReactError(
      Error(
        "accumulateInto(...): Accumulated items must not be null or undefined."
      )
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
    if (eventPluginOrder)
      throw ReactError(
        Error(
          "EventPluginRegistry: Cannot inject event plugin ordering more than once. You are likely trying to load more than one copy of React."
        )
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
        if (
          !namesToPlugins.hasOwnProperty(pluginName) ||
          namesToPlugins[pluginName] !== pluginModule
        ) {
          if (namesToPlugins[pluginName])
            throw ReactError(
              Error(
                "EventPluginRegistry: Cannot inject two different event plugins using the same name, `" +
                  pluginName +
                  "`."
              )
            );
          namesToPlugins[pluginName] = pluginModule;
          isOrderingDirty = !0;
        }
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
  if (listener && "function" !== typeof listener)
    throw ReactError(
      Error(
        "Expected `" +
          registrationName +
          "` listener to be a function, instead got a value of `" +
          typeof listener +
          "` type."
      )
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
  if (!(event instanceof this))
    throw ReactError(
      Error(
        "Trying to release an event instance into a pool of a different type."
      )
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
  if (null == _ref)
    throw ReactError(Error("Touch object is missing identifier."));
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
    : console.warn(
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
    : console.warn(
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
  if (null == next)
    throw ReactError(
      Error("accumulate(...): Accumulated items must not be null or undefined.")
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
var eventTypes = {
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
    eventTypes: eventTypes,
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
          ? eventTypes.startShouldSetResponder
          : isMoveish(topLevelType)
            ? eventTypes.moveShouldSetResponder
            : "topSelectionChange" === topLevelType
              ? eventTypes.selectionChangeShouldSetResponder
              : eventTypes.scrollShouldSetResponder;
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
              eventTypes.responderGrant,
              JSCompiler_temp,
              nativeEvent,
              nativeEventTarget
            )),
            (targetInst.touchHistory = ResponderTouchHistoryStore.touchHistory),
            forEachAccumulated(targetInst, accumulateDirectDispatchesSingle),
            (depthA = !0 === executeDirectDispatch(targetInst)),
            responderInst
              ? ((tempA = ResponderSyntheticEvent.getPooled(
                  eventTypes.responderTerminationRequest,
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
                      eventTypes.responderTerminate,
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
                      eventTypes.responderReject,
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
          ? eventTypes.responderStart
          : targetInst
            ? eventTypes.responderMove
            : depthA
              ? eventTypes.responderEnd
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
          ? eventTypes.responderTerminate
          : topLevelType
            ? eventTypes.responderRelease
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
  customBubblingEventTypes =
    ReactNativePrivateInterface.ReactNativeViewConfigRegistry
      .customBubblingEventTypes,
  customDirectEventTypes =
    ReactNativePrivateInterface.ReactNativeViewConfigRegistry
      .customDirectEventTypes;
injection.injectEventPluginOrder([
  "ResponderEventPlugin",
  "ReactNativeBridgeEventPlugin"
]);
injection.injectEventPluginsByName({
  ResponderEventPlugin: ResponderEventPlugin,
  ReactNativeBridgeEventPlugin: {
    eventTypes: {},
    extractEvents: function(
      topLevelType,
      targetInst,
      nativeEvent,
      nativeEventTarget
    ) {
      if (null == targetInst) return null;
      var bubbleDispatchConfig = customBubblingEventTypes[topLevelType],
        directDispatchConfig = customDirectEventTypes[topLevelType];
      if (!bubbleDispatchConfig && !directDispatchConfig)
        throw ReactError(
          Error(
            'Unsupported top level event type "' + topLevelType + '" dispatched'
          )
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
  }
});
function getInstanceFromInstance(instanceHandle) {
  return instanceHandle;
}
getFiberCurrentPropsFromNode = function(inst) {
  return inst.canonical.currentProps;
};
getInstanceFromNode = getInstanceFromInstance;
getNodeFromInstance = function(inst) {
  inst = inst.stateNode.canonical._nativeTag;
  if (!inst) throw ReactError(Error("All native instances should have a tag."));
  return inst;
};
ResponderEventPlugin.injection.injectGlobalResponderHandler({
  onChange: function(from, to, blockNativeResponder) {
    null !== to
      ? ReactNativePrivateInterface.UIManager.setJSResponder(
          to.stateNode.canonical._nativeTag,
          blockNativeResponder
        )
      : ReactNativePrivateInterface.UIManager.clearJSResponder();
  }
});
var ReactSharedInternals =
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
ReactSharedInternals.hasOwnProperty("ReactCurrentDispatcher") ||
  (ReactSharedInternals.ReactCurrentDispatcher = { current: null });
ReactSharedInternals.hasOwnProperty("ReactCurrentBatchConfig") ||
  (ReactSharedInternals.ReactCurrentBatchConfig = { suspense: null });
var hasSymbol = "function" === typeof Symbol && Symbol.for,
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
  REACT_SUSPENSE_LIST_TYPE = hasSymbol
    ? Symbol.for("react.suspense_list")
    : 60120,
  REACT_MEMO_TYPE = hasSymbol ? Symbol.for("react.memo") : 60115,
  REACT_LAZY_TYPE = hasSymbol ? Symbol.for("react.lazy") : 60116;
hasSymbol && Symbol.for("react.fundamental");
hasSymbol && Symbol.for("react.responder");
var MAYBE_ITERATOR_SYMBOL = "function" === typeof Symbol && Symbol.iterator;
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
  if (2 !== isFiberMountedImpl(fiber))
    throw ReactError(Error("Unable to find node on an unmounted component."));
}
function findCurrentFiberUsingSlowPath(fiber) {
  var alternate = fiber.alternate;
  if (!alternate) {
    alternate = isFiberMountedImpl(fiber);
    if (3 === alternate)
      throw ReactError(Error("Unable to find node on an unmounted component."));
    return 1 === alternate ? null : fiber;
  }
  for (var a = fiber, b = alternate; ; ) {
    var parentA = a.return;
    if (null === parentA) break;
    var parentB = parentA.alternate;
    if (null === parentB) {
      b = parentA.return;
      if (null !== b) {
        a = b;
        continue;
      }
      break;
    }
    if (parentA.child === parentB.child) {
      for (parentB = parentA.child; parentB; ) {
        if (parentB === a) return assertIsMounted(parentA), fiber;
        if (parentB === b) return assertIsMounted(parentA), alternate;
        parentB = parentB.sibling;
      }
      throw ReactError(Error("Unable to find node on an unmounted component."));
    }
    if (a.return !== b.return) (a = parentA), (b = parentB);
    else {
      for (var didFindChild = !1, _child = parentA.child; _child; ) {
        if (_child === a) {
          didFindChild = !0;
          a = parentA;
          b = parentB;
          break;
        }
        if (_child === b) {
          didFindChild = !0;
          b = parentA;
          a = parentB;
          break;
        }
        _child = _child.sibling;
      }
      if (!didFindChild) {
        for (_child = parentB.child; _child; ) {
          if (_child === a) {
            didFindChild = !0;
            a = parentB;
            b = parentA;
            break;
          }
          if (_child === b) {
            didFindChild = !0;
            b = parentB;
            a = parentA;
            break;
          }
          _child = _child.sibling;
        }
        if (!didFindChild)
          throw ReactError(
            Error(
              "Child was not found in either parent set. This indicates a bug in React related to the return pointer. Please file an issue."
            )
          );
      }
    }
    if (a.alternate !== b)
      throw ReactError(
        Error(
          "Return fibers should always be each others' alternates. This error is likely caused by a bug in React. Please file an issue."
        )
      );
  }
  if (3 !== a.tag)
    throw ReactError(Error("Unable to find node on an unmounted component."));
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
function mountSafeCallback_NOT_REALLY_SAFE(context, callback) {
  return function() {
    if (
      callback &&
      ("boolean" !== typeof context.__isMounted || context.__isMounted)
    )
      return callback.apply(context, arguments);
  };
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
        ReactNativePrivateInterface.flattenStyle(prevProp),
        nextProp,
        validAttributes
      )
    : diffProperties(
        updatePayload,
        prevProp,
        ReactNativePrivateInterface.flattenStyle(nextProp),
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
            ReactNativePrivateInterface.deepDiffer(prevProp, nextProp)) &&
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
                ReactNativePrivateInterface.deepDiffer(prevProp, nextProp))
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
var restoreTarget = null,
  restoreQueue = null;
function restoreStateOfTarget(target) {
  if (getInstanceFromNode(target))
    throw ReactError(
      Error(
        "setRestoreImplementation() needs to be called to handle a target for controlled events. This error is likely caused by a bug in React. Please file an issue."
      )
    );
}
function batchedUpdatesImpl(fn, bookkeeping) {
  return fn(bookkeeping);
}
function flushDiscreteUpdatesImpl() {}
var isInsideEventHandler = !1;
function batchedUpdates(fn, bookkeeping) {
  if (isInsideEventHandler) return fn(bookkeeping);
  isInsideEventHandler = !0;
  try {
    return batchedUpdatesImpl(fn, bookkeeping);
  } finally {
    if (
      ((isInsideEventHandler = !1),
      null !== restoreTarget || null !== restoreQueue)
    )
      if (
        (flushDiscreteUpdatesImpl(),
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
(function(_React$Component) {
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
  ReactNativeComponent.prototype.blur = function() {};
  ReactNativeComponent.prototype.focus = function() {};
  ReactNativeComponent.prototype.measure = function() {};
  ReactNativeComponent.prototype.measureInWindow = function() {};
  ReactNativeComponent.prototype.measureLayout = function() {};
  ReactNativeComponent.prototype.setNativeProps = function() {};
  return ReactNativeComponent;
})(React.Component);
new Map();
new Map();
new Set();
new Map();
function dispatchEvent(target, topLevelType, nativeEvent) {
  batchedUpdates(function() {
    var events = nativeEvent.target;
    for (var events$jscomp$0 = null, i = 0; i < plugins.length; i++) {
      var possiblePlugin = plugins[i];
      possiblePlugin &&
        (possiblePlugin = possiblePlugin.extractEvents(
          topLevelType,
          target,
          nativeEvent,
          events
        )) &&
        (events$jscomp$0 = accumulateInto(events$jscomp$0, possiblePlugin));
    }
    events = events$jscomp$0;
    null !== events && (eventQueue = accumulateInto(eventQueue, events));
    events = eventQueue;
    eventQueue = null;
    if (events) {
      forEachAccumulated(events, executeDispatchesAndReleaseTopLevel);
      if (eventQueue)
        throw ReactError(
          Error(
            "processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented."
          )
        );
      if (hasRethrowError)
        throw ((events = rethrowError),
        (hasRethrowError = !1),
        (rethrowError = null),
        events);
    }
  });
}
function shim$1() {
  throw ReactError(
    Error(
      "The current renderer does not support hydration. This error is likely caused by a bug in React. Please file an issue."
    )
  );
}
var _nativeFabricUIManage$1 = nativeFabricUIManager,
  createNode = _nativeFabricUIManage$1.createNode,
  cloneNode = _nativeFabricUIManage$1.cloneNode,
  cloneNodeWithNewChildren = _nativeFabricUIManage$1.cloneNodeWithNewChildren,
  cloneNodeWithNewChildrenAndProps =
    _nativeFabricUIManage$1.cloneNodeWithNewChildrenAndProps,
  cloneNodeWithNewProps = _nativeFabricUIManage$1.cloneNodeWithNewProps,
  createChildNodeSet = _nativeFabricUIManage$1.createChildSet,
  appendChildNode = _nativeFabricUIManage$1.appendChild,
  appendChildNodeToSet = _nativeFabricUIManage$1.appendChildToSet,
  completeRoot = _nativeFabricUIManage$1.completeRoot,
  registerEventHandler = _nativeFabricUIManage$1.registerEventHandler,
  fabricMeasure = _nativeFabricUIManage$1.measure,
  fabricMeasureInWindow = _nativeFabricUIManage$1.measureInWindow,
  fabricMeasureLayout = _nativeFabricUIManage$1.measureLayout,
  getViewConfigForType =
    ReactNativePrivateInterface.ReactNativeViewConfigRegistry.get,
  nextReactTag = 2;
registerEventHandler && registerEventHandler(dispatchEvent);
var ReactFabricHostComponent = (function() {
  function ReactFabricHostComponent(
    tag,
    viewConfig,
    props,
    internalInstanceHandle
  ) {
    if (!(this instanceof ReactFabricHostComponent))
      throw new TypeError("Cannot call a class as a function");
    this._nativeTag = tag;
    this.viewConfig = viewConfig;
    this.currentProps = props;
    this._internalInstanceHandle = internalInstanceHandle;
  }
  ReactFabricHostComponent.prototype.blur = function() {
    ReactNativePrivateInterface.TextInputState.blurTextInput(this._nativeTag);
  };
  ReactFabricHostComponent.prototype.focus = function() {
    ReactNativePrivateInterface.TextInputState.focusTextInput(this._nativeTag);
  };
  ReactFabricHostComponent.prototype.measure = function(callback) {
    fabricMeasure(
      this._internalInstanceHandle.stateNode.node,
      mountSafeCallback_NOT_REALLY_SAFE(this, callback)
    );
  };
  ReactFabricHostComponent.prototype.measureInWindow = function(callback) {
    fabricMeasureInWindow(
      this._internalInstanceHandle.stateNode.node,
      mountSafeCallback_NOT_REALLY_SAFE(this, callback)
    );
  };
  ReactFabricHostComponent.prototype.measureLayout = function(
    relativeToNativeNode,
    onSuccess,
    onFail
  ) {
    "number" !== typeof relativeToNativeNode &&
      relativeToNativeNode instanceof ReactFabricHostComponent &&
      fabricMeasureLayout(
        this._internalInstanceHandle.stateNode.node,
        relativeToNativeNode._internalInstanceHandle.stateNode.node,
        mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
        mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess)
      );
  };
  ReactFabricHostComponent.prototype.setNativeProps = function() {};
  return ReactFabricHostComponent;
})();
function createTextInstance(
  text,
  rootContainerInstance,
  hostContext,
  internalInstanceHandle
) {
  if (!hostContext.isInAParentText)
    throw ReactError(
      Error("Text strings must be rendered within a <Text> component.")
    );
  hostContext = nextReactTag;
  nextReactTag += 2;
  return {
    node: createNode(
      hostContext,
      "RCTRawText",
      rootContainerInstance,
      { text: text },
      internalInstanceHandle
    )
  };
}
var scheduleTimeout = setTimeout,
  cancelTimeout = clearTimeout;
function cloneHiddenInstance(instance) {
  var node = instance.node;
  var updatePayload = diffProperties(
    null,
    emptyObject,
    { style: { display: "none" } },
    instance.canonical.viewConfig.validAttributes
  );
  return {
    node: cloneNodeWithNewProps(node, updatePayload),
    canonical: instance.canonical
  };
}
var BEFORE_SLASH_RE = /^(.*)[\\\/]/;
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
  if (contextStackCursor.current !== emptyContextObject)
    throw ReactError(
      Error(
        "Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue."
      )
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
    if (!(contextKey in fiber))
      throw ReactError(
        Error(
          (getComponentName(type) || "Unknown") +
            '.getChildContext(): key "' +
            contextKey +
            '" is not defined in childContextTypes.'
        )
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
  if (!instance)
    throw ReactError(
      Error(
        "Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue."
      )
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
var Scheduler_runWithPriority = Scheduler.unstable_runWithPriority,
  Scheduler_scheduleCallback = Scheduler.unstable_scheduleCallback,
  Scheduler_cancelCallback = Scheduler.unstable_cancelCallback,
  Scheduler_shouldYield = Scheduler.unstable_shouldYield,
  Scheduler_requestPaint = Scheduler.unstable_requestPaint,
  Scheduler_now = Scheduler.unstable_now,
  Scheduler_getCurrentPriorityLevel =
    Scheduler.unstable_getCurrentPriorityLevel,
  Scheduler_ImmediatePriority = Scheduler.unstable_ImmediatePriority,
  Scheduler_UserBlockingPriority = Scheduler.unstable_UserBlockingPriority,
  Scheduler_NormalPriority = Scheduler.unstable_NormalPriority,
  Scheduler_LowPriority = Scheduler.unstable_LowPriority,
  Scheduler_IdlePriority = Scheduler.unstable_IdlePriority;
if (
  null == tracing.__interactionsRef ||
  null == tracing.__interactionsRef.current
)
  throw ReactError(
    Error(
      "It is not supported to run the profiling version of a renderer (for example, `react-dom/profiling`) without also replacing the `scheduler/tracing` module with `scheduler/tracing-profiling`. Your bundler might have a setting for aliasing both modules. Learn more at http://fb.me/react-profiling"
    )
  );
var fakeCallbackNode = {},
  requestPaint =
    void 0 !== Scheduler_requestPaint ? Scheduler_requestPaint : function() {},
  syncQueue = null,
  immediateQueueCallbackNode = null,
  isFlushingSyncQueue = !1,
  initialTimeMs = Scheduler_now(),
  now =
    1e4 > initialTimeMs
      ? Scheduler_now
      : function() {
          return Scheduler_now() - initialTimeMs;
        };
function getCurrentPriorityLevel() {
  switch (Scheduler_getCurrentPriorityLevel()) {
    case Scheduler_ImmediatePriority:
      return 99;
    case Scheduler_UserBlockingPriority:
      return 98;
    case Scheduler_NormalPriority:
      return 97;
    case Scheduler_LowPriority:
      return 96;
    case Scheduler_IdlePriority:
      return 95;
    default:
      throw ReactError(Error("Unknown priority level."));
  }
}
function reactPriorityToSchedulerPriority(reactPriorityLevel) {
  switch (reactPriorityLevel) {
    case 99:
      return Scheduler_ImmediatePriority;
    case 98:
      return Scheduler_UserBlockingPriority;
    case 97:
      return Scheduler_NormalPriority;
    case 96:
      return Scheduler_LowPriority;
    case 95:
      return Scheduler_IdlePriority;
    default:
      throw ReactError(Error("Unknown priority level."));
  }
}
function runWithPriority$1(reactPriorityLevel, fn) {
  reactPriorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  return Scheduler_runWithPriority(reactPriorityLevel, fn);
}
function scheduleCallback(reactPriorityLevel, callback, options) {
  reactPriorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  return Scheduler_scheduleCallback(reactPriorityLevel, callback, options);
}
function scheduleSyncCallback(callback) {
  null === syncQueue
    ? ((syncQueue = [callback]),
      (immediateQueueCallbackNode = Scheduler_scheduleCallback(
        Scheduler_ImmediatePriority,
        flushSyncCallbackQueueImpl
      )))
    : syncQueue.push(callback);
  return fakeCallbackNode;
}
function flushSyncCallbackQueue() {
  null !== immediateQueueCallbackNode &&
    Scheduler_cancelCallback(immediateQueueCallbackNode);
  flushSyncCallbackQueueImpl();
}
function flushSyncCallbackQueueImpl() {
  if (!isFlushingSyncQueue && null !== syncQueue) {
    isFlushingSyncQueue = !0;
    var i = 0;
    try {
      var queue = syncQueue;
      runWithPriority$1(99, function() {
        for (; i < queue.length; i++) {
          var callback = queue[i];
          do callback = callback(!0);
          while (null !== callback);
        }
      });
      syncQueue = null;
    } catch (error) {
      throw (null !== syncQueue && (syncQueue = syncQueue.slice(i + 1)),
      Scheduler_scheduleCallback(
        Scheduler_ImmediatePriority,
        flushSyncCallbackQueue
      ),
      error);
    } finally {
      isFlushingSyncQueue = !1;
    }
  }
}
function inferPriorityFromExpirationTime(currentTime, expirationTime) {
  if (1073741823 === expirationTime) return 99;
  if (1 === expirationTime) return 95;
  currentTime =
    10 * (1073741821 - expirationTime) - 10 * (1073741821 - currentTime);
  return 0 >= currentTime
    ? 99
    : 250 >= currentTime
      ? 98
      : 5250 >= currentTime
        ? 97
        : 95;
}
function is(x, y) {
  return (x === y && (0 !== x || 1 / x === 1 / y)) || (x !== x && y !== y);
}
var hasOwnProperty = Object.prototype.hasOwnProperty;
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
      lazyComponent._status = 0;
      result = lazyComponent._ctor;
      result = result();
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
      );
      switch (lazyComponent._status) {
        case 1:
          return lazyComponent._result;
        case 2:
          throw lazyComponent._result;
      }
      lazyComponent._result = result;
      throw result;
  }
}
var valueCursor = { current: null },
  currentlyRenderingFiber = null,
  lastContextDependency = null,
  lastContextWithAllBitsObserved = null;
function resetContextDependencies() {
  lastContextWithAllBitsObserved = lastContextDependency = currentlyRenderingFiber = null;
}
function pushProvider(providerFiber, nextValue) {
  var context = providerFiber.type._context;
  push(valueCursor, context._currentValue2, providerFiber);
  context._currentValue2 = nextValue;
}
function popProvider(providerFiber) {
  var currentValue = valueCursor.current;
  pop(valueCursor, providerFiber);
  providerFiber.type._context._currentValue2 = currentValue;
}
function scheduleWorkOnParentPath(parent, renderExpirationTime) {
  for (; null !== parent; ) {
    var alternate = parent.alternate;
    if (parent.childExpirationTime < renderExpirationTime)
      (parent.childExpirationTime = renderExpirationTime),
        null !== alternate &&
          alternate.childExpirationTime < renderExpirationTime &&
          (alternate.childExpirationTime = renderExpirationTime);
    else if (
      null !== alternate &&
      alternate.childExpirationTime < renderExpirationTime
    )
      alternate.childExpirationTime = renderExpirationTime;
    else break;
    parent = parent.return;
  }
}
function prepareToReadContext(workInProgress, renderExpirationTime) {
  currentlyRenderingFiber = workInProgress;
  lastContextWithAllBitsObserved = lastContextDependency = null;
  workInProgress = workInProgress.dependencies;
  null !== workInProgress &&
    null !== workInProgress.firstContext &&
    (workInProgress.expirationTime >= renderExpirationTime &&
      (didReceiveUpdate = !0),
    (workInProgress.firstContext = null));
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
    if (null === lastContextDependency) {
      if (null === currentlyRenderingFiber)
        throw ReactError(
          Error(
            "Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."
          )
        );
      lastContextDependency = observedBits;
      currentlyRenderingFiber.dependencies = {
        expirationTime: 0,
        firstContext: observedBits,
        responders: null
      };
    } else lastContextDependency = lastContextDependency.next = observedBits;
  }
  return context._currentValue2;
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
function createUpdate(expirationTime, suspenseConfig) {
  return {
    expirationTime: expirationTime,
    suspenseConfig: suspenseConfig,
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
      : (markRenderEventTimeAndConfig(
          updateExpirationTime,
          update.suspenseConfig
        ),
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
      if ("function" !== typeof _callback3)
        throw ReactError(
          Error(
            "Invalid argument passed as callback. Expected a function. Instead received: " +
              _callback3
          )
        );
      _callback3.call(context);
    }
    effect = effect.nextEffect;
  }
}
var ReactCurrentBatchConfig = ReactSharedInternals.ReactCurrentBatchConfig,
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
    var currentTime = requestCurrentTime(),
      suspenseConfig = ReactCurrentBatchConfig.suspense;
    currentTime = computeExpirationForFiber(currentTime, inst, suspenseConfig);
    suspenseConfig = createUpdate(currentTime, suspenseConfig);
    suspenseConfig.payload = payload;
    void 0 !== callback &&
      null !== callback &&
      (suspenseConfig.callback = callback);
    enqueueUpdate(inst, suspenseConfig);
    scheduleUpdateOnFiber(inst, currentTime);
  },
  enqueueReplaceState: function(inst, payload, callback) {
    inst = inst._reactInternalFiber;
    var currentTime = requestCurrentTime(),
      suspenseConfig = ReactCurrentBatchConfig.suspense;
    currentTime = computeExpirationForFiber(currentTime, inst, suspenseConfig);
    suspenseConfig = createUpdate(currentTime, suspenseConfig);
    suspenseConfig.tag = 1;
    suspenseConfig.payload = payload;
    void 0 !== callback &&
      null !== callback &&
      (suspenseConfig.callback = callback);
    enqueueUpdate(inst, suspenseConfig);
    scheduleUpdateOnFiber(inst, currentTime);
  },
  enqueueForceUpdate: function(inst, callback) {
    inst = inst._reactInternalFiber;
    var currentTime = requestCurrentTime(),
      suspenseConfig = ReactCurrentBatchConfig.suspense;
    currentTime = computeExpirationForFiber(currentTime, inst, suspenseConfig);
    suspenseConfig = createUpdate(currentTime, suspenseConfig);
    suspenseConfig.tag = 2;
    void 0 !== callback &&
      null !== callback &&
      (suspenseConfig.callback = callback);
    enqueueUpdate(inst, suspenseConfig);
    scheduleUpdateOnFiber(inst, currentTime);
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
    ? (context = readContext(context))
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
    ? (instance.context = readContext(contextType))
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
      if (element) {
        if (1 !== element.tag)
          throw ReactError(
            Error(
              "Function components cannot have refs. Did you mean to use React.forwardRef()?"
            )
          );
        inst = element.stateNode;
      }
      if (!inst)
        throw ReactError(
          Error(
            "Missing owner for string ref " +
              returnFiber +
              ". This error is likely caused by a bug in React. Please file an issue."
          )
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
    if ("string" !== typeof returnFiber)
      throw ReactError(
        Error(
          "Expected ref to be a function, a string, an object returned by React.createRef(), or null."
        )
      );
    if (!element._owner)
      throw ReactError(
        Error(
          "Element ref was specified as a string (" +
            returnFiber +
            ") but no owner was set. This could happen for one of the following reasons:\n1. You may be adding a ref to a function component\n2. You may be adding a ref to a component that was not created inside a component's render method\n3. You have multiple copies of React loaded\nSee https://fb.me/react-refs-must-have-owner for more information."
        )
      );
  }
  return returnFiber;
}
function throwOnInvalidObjectType(returnFiber, newChild) {
  if ("textarea" !== returnFiber.type)
    throw ReactError(
      Error(
        "Objects are not valid as a React child (found: " +
          ("[object Object]" === Object.prototype.toString.call(newChild)
            ? "object with keys {" + Object.keys(newChild).join(", ") + "}"
            : newChild) +
          ")."
      )
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
        (oldFiber = createChild(
          returnFiber,
          newChildren[newIdx],
          expirationTime
        )),
          null !== oldFiber &&
            ((currentFirstChild = placeChild(
              oldFiber,
              currentFirstChild,
              newIdx
            )),
            null === previousNewFiber
              ? (resultingFirstChild = oldFiber)
              : (previousNewFiber.sibling = oldFiber),
            (previousNewFiber = oldFiber));
      return resultingFirstChild;
    }
    for (
      oldFiber = mapRemainingChildren(returnFiber, oldFiber);
      newIdx < newChildren.length;
      newIdx++
    )
      (nextOldFiber = updateFromMap(
        oldFiber,
        returnFiber,
        newIdx,
        newChildren[newIdx],
        expirationTime
      )),
        null !== nextOldFiber &&
          (shouldTrackSideEffects &&
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
          (previousNewFiber = nextOldFiber));
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
    if ("function" !== typeof iteratorFn)
      throw ReactError(
        Error(
          "An object is not an iterable. This error is likely caused by a bug in React. Please file an issue."
        )
      );
    newChildrenIterable = iteratorFn.call(newChildrenIterable);
    if (null == newChildrenIterable)
      throw ReactError(Error("An iterable object provided no iterator."));
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
        null === oldFiber && (oldFiber = nextOldFiber);
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
              if (isUnkeyedTopLevelFragment.key === isObject) {
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
                }
                deleteRemainingChildren(returnFiber, isUnkeyedTopLevelFragment);
                break;
              } else deleteChild(returnFiber, isUnkeyedTopLevelFragment);
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
              if (currentFirstChild.key === isUnkeyedTopLevelFragment) {
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
                }
                deleteRemainingChildren(returnFiber, currentFirstChild);
                break;
              } else deleteChild(returnFiber, currentFirstChild);
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
          throw ((returnFiber = returnFiber.type),
          ReactError(
            Error(
              (returnFiber.displayName || returnFiber.name || "Component") +
                "(...): Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null."
            )
          ));
      }
    return deleteRemainingChildren(returnFiber, currentFirstChild);
  };
}
var reconcileChildFibers = ChildReconciler(!0),
  mountChildFibers = ChildReconciler(!1),
  NO_CONTEXT = {},
  contextStackCursor$1 = { current: NO_CONTEXT },
  contextFiberStackCursor = { current: NO_CONTEXT },
  rootInstanceStackCursor = { current: NO_CONTEXT };
function requiredContext(c) {
  if (c === NO_CONTEXT)
    throw ReactError(
      Error(
        "Expected host context to exist. This error is likely caused by a bug in React. Please file an issue."
      )
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
var SubtreeSuspenseContextMask = 1,
  InvisibleParentSuspenseContext = 1,
  ForceSuspenseFallback = 2,
  suspenseStackCursor = { current: 0 };
function findFirstSuspended(row) {
  for (var node = row; null !== node; ) {
    if (13 === node.tag) {
      if (null !== node.memoizedState) return node;
    } else if (19 === node.tag && void 0 !== node.memoizedProps.revealOrder) {
      if (0 !== (node.effectTag & 64)) return node;
    } else if (null !== node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === row) break;
    for (; null === node.sibling; ) {
      if (null === node.return || node.return === row) return null;
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
  return null;
}
function createResponderListener(responder, props) {
  return { responder: responder, props: props };
}
var NoEffect$1 = 0,
  UnmountSnapshot = 2,
  UnmountMutation = 4,
  MountMutation = 8,
  UnmountLayout = 16,
  MountLayout = 32,
  MountPassive = 64,
  UnmountPassive = 128,
  ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher,
  renderExpirationTime$1 = 0,
  currentlyRenderingFiber$1 = null,
  currentHook = null,
  nextCurrentHook = null,
  firstWorkInProgressHook = null,
  workInProgressHook = null,
  nextWorkInProgressHook = null,
  remainingExpirationTime = 0,
  componentUpdateQueue = null,
  sideEffectTag = 0,
  didScheduleRenderPhaseUpdate = !1,
  renderPhaseUpdates = null,
  numberOfReRenders = 0;
function throwInvalidHookError() {
  throw ReactError(
    Error(
      "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem."
    )
  );
}
function areHookInputsEqual(nextDeps, prevDeps) {
  if (null === prevDeps) return !1;
  for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++)
    if (!is(nextDeps[i], prevDeps[i])) return !1;
  return !0;
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
  nextCurrentHook = null !== current ? current.memoizedState : null;
  ReactCurrentDispatcher$1.current =
    null === nextCurrentHook ? HooksDispatcherOnMount : HooksDispatcherOnUpdate;
  workInProgress = Component(props, refOrContext);
  if (didScheduleRenderPhaseUpdate) {
    do
      (didScheduleRenderPhaseUpdate = !1),
        (numberOfReRenders += 1),
        (nextCurrentHook = null !== current ? current.memoizedState : null),
        (nextWorkInProgressHook = firstWorkInProgressHook),
        (componentUpdateQueue = workInProgressHook = currentHook = null),
        (ReactCurrentDispatcher$1.current = HooksDispatcherOnUpdate),
        (workInProgress = Component(props, refOrContext));
    while (didScheduleRenderPhaseUpdate);
    renderPhaseUpdates = null;
    numberOfReRenders = 0;
  }
  ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
  current = currentlyRenderingFiber$1;
  current.memoizedState = firstWorkInProgressHook;
  current.expirationTime = remainingExpirationTime;
  current.updateQueue = componentUpdateQueue;
  current.effectTag |= sideEffectTag;
  current = null !== currentHook && null !== currentHook.next;
  renderExpirationTime$1 = 0;
  nextWorkInProgressHook = workInProgressHook = firstWorkInProgressHook = nextCurrentHook = currentHook = currentlyRenderingFiber$1 = null;
  remainingExpirationTime = 0;
  componentUpdateQueue = null;
  sideEffectTag = 0;
  if (current)
    throw ReactError(
      Error(
        "Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
      )
    );
  return workInProgress;
}
function resetHooks() {
  ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
  renderExpirationTime$1 = 0;
  nextWorkInProgressHook = workInProgressHook = firstWorkInProgressHook = nextCurrentHook = currentHook = currentlyRenderingFiber$1 = null;
  remainingExpirationTime = 0;
  componentUpdateQueue = null;
  sideEffectTag = 0;
  didScheduleRenderPhaseUpdate = !1;
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
  null === workInProgressHook
    ? (firstWorkInProgressHook = workInProgressHook = hook)
    : (workInProgressHook = workInProgressHook.next = hook);
  return workInProgressHook;
}
function updateWorkInProgressHook() {
  if (null !== nextWorkInProgressHook)
    (workInProgressHook = nextWorkInProgressHook),
      (nextWorkInProgressHook = workInProgressHook.next),
      (currentHook = nextCurrentHook),
      (nextCurrentHook = null !== currentHook ? currentHook.next : null);
  else {
    if (null === nextCurrentHook)
      throw ReactError(
        Error("Rendered more hooks than during the previous render.")
      );
    currentHook = nextCurrentHook;
    var newHook = {
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      queue: currentHook.queue,
      baseUpdate: currentHook.baseUpdate,
      next: null
    };
    workInProgressHook =
      null === workInProgressHook
        ? (firstWorkInProgressHook = newHook)
        : (workInProgressHook.next = newHook);
    nextCurrentHook = currentHook.next;
  }
  return workInProgressHook;
}
function basicStateReducer(state, action) {
  return "function" === typeof action ? action(state) : action;
}
function updateReducer(reducer) {
  var hook = updateWorkInProgressHook(),
    queue = hook.queue;
  if (null === queue)
    throw ReactError(
      Error(
        "Should have a queue. This is likely a bug in React. Please file an issue."
      )
    );
  queue.lastRenderedReducer = reducer;
  if (0 < numberOfReRenders) {
    var _dispatch = queue.dispatch;
    if (null !== renderPhaseUpdates) {
      var firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
      if (void 0 !== firstRenderPhaseUpdate) {
        renderPhaseUpdates.delete(queue);
        var newState = hook.memoizedState;
        do
          (newState = reducer(newState, firstRenderPhaseUpdate.action)),
            (firstRenderPhaseUpdate = firstRenderPhaseUpdate.next);
        while (null !== firstRenderPhaseUpdate);
        is(newState, hook.memoizedState) || (didReceiveUpdate = !0);
        hook.memoizedState = newState;
        hook.baseUpdate === queue.last && (hook.baseState = newState);
        queue.lastRenderedState = newState;
        return [newState, _dispatch];
      }
    }
    return [hook.memoizedState, _dispatch];
  }
  _dispatch = queue.last;
  var baseUpdate = hook.baseUpdate;
  newState = hook.baseState;
  null !== baseUpdate
    ? (null !== _dispatch && (_dispatch.next = null),
      (_dispatch = baseUpdate.next))
    : (_dispatch = null !== _dispatch ? _dispatch.next : null);
  if (null !== _dispatch) {
    var newBaseUpdate = (firstRenderPhaseUpdate = null),
      _update = _dispatch,
      didSkip = !1;
    do {
      var updateExpirationTime = _update.expirationTime;
      updateExpirationTime < renderExpirationTime$1
        ? (didSkip ||
            ((didSkip = !0),
            (newBaseUpdate = baseUpdate),
            (firstRenderPhaseUpdate = newState)),
          updateExpirationTime > remainingExpirationTime &&
            (remainingExpirationTime = updateExpirationTime))
        : (markRenderEventTimeAndConfig(
            updateExpirationTime,
            _update.suspenseConfig
          ),
          (newState =
            _update.eagerReducer === reducer
              ? _update.eagerState
              : reducer(newState, _update.action)));
      baseUpdate = _update;
      _update = _update.next;
    } while (null !== _update && _update !== _dispatch);
    didSkip ||
      ((newBaseUpdate = baseUpdate), (firstRenderPhaseUpdate = newState));
    is(newState, hook.memoizedState) || (didReceiveUpdate = !0);
    hook.memoizedState = newState;
    hook.baseUpdate = newBaseUpdate;
    hook.baseState = firstRenderPhaseUpdate;
    queue.lastRenderedState = newState;
  }
  return [hook.memoizedState, queue.dispatch];
}
function pushEffect(tag, create, destroy, deps) {
  tag = { tag: tag, create: create, destroy: destroy, deps: deps, next: null };
  null === componentUpdateQueue
    ? ((componentUpdateQueue = { lastEffect: null }),
      (componentUpdateQueue.lastEffect = tag.next = tag))
    : ((create = componentUpdateQueue.lastEffect),
      null === create
        ? (componentUpdateQueue.lastEffect = tag.next = tag)
        : ((destroy = create.next),
          (create.next = tag),
          (tag.next = destroy),
          (componentUpdateQueue.lastEffect = tag)));
  return tag;
}
function mountEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
  var hook = mountWorkInProgressHook();
  sideEffectTag |= fiberEffectTag;
  hook.memoizedState = pushEffect(
    hookEffectTag,
    create,
    void 0,
    void 0 === deps ? null : deps
  );
}
function updateEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
  var hook = updateWorkInProgressHook();
  deps = void 0 === deps ? null : deps;
  var destroy = void 0;
  if (null !== currentHook) {
    var prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (null !== deps && areHookInputsEqual(deps, prevEffect.deps)) {
      pushEffect(NoEffect$1, create, destroy, deps);
      return;
    }
  }
  sideEffectTag |= fiberEffectTag;
  hook.memoizedState = pushEffect(hookEffectTag, create, destroy, deps);
}
function imperativeHandleEffect(create, ref) {
  if ("function" === typeof ref)
    return (
      (create = create()),
      ref(create),
      function() {
        ref(null);
      }
    );
  if (null !== ref && void 0 !== ref)
    return (
      (create = create()),
      (ref.current = create),
      function() {
        ref.current = null;
      }
    );
}
function mountDebugValue() {}
function dispatchAction(fiber, queue, action) {
  if (!(25 > numberOfReRenders))
    throw ReactError(
      Error(
        "Too many re-renders. React limits the number of renders to prevent an infinite loop."
      )
    );
  var alternate = fiber.alternate;
  if (
    fiber === currentlyRenderingFiber$1 ||
    (null !== alternate && alternate === currentlyRenderingFiber$1)
  )
    if (
      ((didScheduleRenderPhaseUpdate = !0),
      (fiber = {
        expirationTime: renderExpirationTime$1,
        suspenseConfig: null,
        action: action,
        eagerReducer: null,
        eagerState: null,
        next: null
      }),
      null === renderPhaseUpdates && (renderPhaseUpdates = new Map()),
      (action = renderPhaseUpdates.get(queue)),
      void 0 === action)
    )
      renderPhaseUpdates.set(queue, fiber);
    else {
      for (queue = action; null !== queue.next; ) queue = queue.next;
      queue.next = fiber;
    }
  else {
    var currentTime = requestCurrentTime(),
      _suspenseConfig = ReactCurrentBatchConfig.suspense;
    currentTime = computeExpirationForFiber(
      currentTime,
      fiber,
      _suspenseConfig
    );
    _suspenseConfig = {
      expirationTime: currentTime,
      suspenseConfig: _suspenseConfig,
      action: action,
      eagerReducer: null,
      eagerState: null,
      next: null
    };
    var _last = queue.last;
    if (null === _last) _suspenseConfig.next = _suspenseConfig;
    else {
      var first = _last.next;
      null !== first && (_suspenseConfig.next = first);
      _last.next = _suspenseConfig;
    }
    queue.last = _suspenseConfig;
    if (
      0 === fiber.expirationTime &&
      (null === alternate || 0 === alternate.expirationTime) &&
      ((alternate = queue.lastRenderedReducer), null !== alternate)
    )
      try {
        var currentState = queue.lastRenderedState,
          _eagerState = alternate(currentState, action);
        _suspenseConfig.eagerReducer = alternate;
        _suspenseConfig.eagerState = _eagerState;
        if (is(_eagerState, currentState)) return;
      } catch (error) {
      } finally {
      }
    scheduleUpdateOnFiber(fiber, currentTime);
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
    useResponder: throwInvalidHookError
  },
  HooksDispatcherOnMount = {
    readContext: readContext,
    useCallback: function(callback, deps) {
      mountWorkInProgressHook().memoizedState = [
        callback,
        void 0 === deps ? null : deps
      ];
      return callback;
    },
    useContext: readContext,
    useEffect: function(create, deps) {
      return mountEffectImpl(516, UnmountPassive | MountPassive, create, deps);
    },
    useImperativeHandle: function(ref, create, deps) {
      deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
      return mountEffectImpl(
        4,
        UnmountMutation | MountLayout,
        imperativeHandleEffect.bind(null, create, ref),
        deps
      );
    },
    useLayoutEffect: function(create, deps) {
      return mountEffectImpl(4, UnmountMutation | MountLayout, create, deps);
    },
    useMemo: function(nextCreate, deps) {
      var hook = mountWorkInProgressHook();
      deps = void 0 === deps ? null : deps;
      nextCreate = nextCreate();
      hook.memoizedState = [nextCreate, deps];
      return nextCreate;
    },
    useReducer: function(reducer, initialArg, init) {
      var hook = mountWorkInProgressHook();
      initialArg = void 0 !== init ? init(initialArg) : initialArg;
      hook.memoizedState = hook.baseState = initialArg;
      reducer = hook.queue = {
        last: null,
        dispatch: null,
        lastRenderedReducer: reducer,
        lastRenderedState: initialArg
      };
      reducer = reducer.dispatch = dispatchAction.bind(
        null,
        currentlyRenderingFiber$1,
        reducer
      );
      return [hook.memoizedState, reducer];
    },
    useRef: function(initialValue) {
      var hook = mountWorkInProgressHook();
      initialValue = { current: initialValue };
      return (hook.memoizedState = initialValue);
    },
    useState: function(initialState) {
      var hook = mountWorkInProgressHook();
      "function" === typeof initialState && (initialState = initialState());
      hook.memoizedState = hook.baseState = initialState;
      initialState = hook.queue = {
        last: null,
        dispatch: null,
        lastRenderedReducer: basicStateReducer,
        lastRenderedState: initialState
      };
      initialState = initialState.dispatch = dispatchAction.bind(
        null,
        currentlyRenderingFiber$1,
        initialState
      );
      return [hook.memoizedState, initialState];
    },
    useDebugValue: mountDebugValue,
    useResponder: createResponderListener
  },
  HooksDispatcherOnUpdate = {
    readContext: readContext,
    useCallback: function(callback, deps) {
      var hook = updateWorkInProgressHook();
      deps = void 0 === deps ? null : deps;
      var prevState = hook.memoizedState;
      if (
        null !== prevState &&
        null !== deps &&
        areHookInputsEqual(deps, prevState[1])
      )
        return prevState[0];
      hook.memoizedState = [callback, deps];
      return callback;
    },
    useContext: readContext,
    useEffect: function(create, deps) {
      return updateEffectImpl(516, UnmountPassive | MountPassive, create, deps);
    },
    useImperativeHandle: function(ref, create, deps) {
      deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
      return updateEffectImpl(
        4,
        UnmountMutation | MountLayout,
        imperativeHandleEffect.bind(null, create, ref),
        deps
      );
    },
    useLayoutEffect: function(create, deps) {
      return updateEffectImpl(4, UnmountMutation | MountLayout, create, deps);
    },
    useMemo: function(nextCreate, deps) {
      var hook = updateWorkInProgressHook();
      deps = void 0 === deps ? null : deps;
      var prevState = hook.memoizedState;
      if (
        null !== prevState &&
        null !== deps &&
        areHookInputsEqual(deps, prevState[1])
      )
        return prevState[0];
      nextCreate = nextCreate();
      hook.memoizedState = [nextCreate, deps];
      return nextCreate;
    },
    useReducer: updateReducer,
    useRef: function() {
      return updateWorkInProgressHook().memoizedState;
    },
    useState: function(initialState) {
      return updateReducer(basicStateReducer, initialState);
    },
    useDebugValue: mountDebugValue,
    useResponder: createResponderListener
  },
  now$1 = Scheduler.unstable_now,
  commitTime = 0,
  profilerStartTime = -1;
function stopProfilerTimerIfRunningAndRecordDelta(fiber, overrideBaseTime) {
  if (0 <= profilerStartTime) {
    var elapsedTime = now$1() - profilerStartTime;
    fiber.actualDuration += elapsedTime;
    overrideBaseTime && (fiber.selfBaseDuration = elapsedTime);
    profilerStartTime = -1;
  }
}
var hydrationParentFiber = null,
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
    case 13:
      return !1;
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
var ReactCurrentOwner$3 = ReactSharedInternals.ReactCurrentOwner,
  didReceiveUpdate = !1;
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
  nextProps = renderWithHooks(
    current$$1,
    workInProgress,
    Component,
    nextProps,
    ref,
    renderExpirationTime
  );
  if (null !== current$$1 && !didReceiveUpdate)
    return (
      (workInProgress.updateQueue = current$$1.updateQueue),
      (workInProgress.effectTag &= -517),
      current$$1.expirationTime <= renderExpirationTime &&
        (current$$1.expirationTime = 0),
      bailoutOnAlreadyFinishedWork(
        current$$1,
        workInProgress,
        renderExpirationTime
      )
    );
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
    shallowEqual(current$$1.memoizedProps, nextProps) &&
    current$$1.ref === workInProgress.ref &&
    ((didReceiveUpdate = !1), updateExpirationTime < renderExpirationTime)
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
  var context = isContextProvider(Component)
    ? previousContext
    : contextStackCursor.current;
  context = getMaskedContext(workInProgress, context);
  prepareToReadContext(workInProgress, renderExpirationTime);
  Component = renderWithHooks(
    current$$1,
    workInProgress,
    Component,
    nextProps,
    context,
    renderExpirationTime
  );
  if (null !== current$$1 && !didReceiveUpdate)
    return (
      (workInProgress.updateQueue = current$$1.updateQueue),
      (workInProgress.effectTag &= -517),
      current$$1.expirationTime <= renderExpirationTime &&
        (current$$1.expirationTime = 0),
      bailoutOnAlreadyFinishedWork(
        current$$1,
        workInProgress,
        renderExpirationTime
      )
    );
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
      ? (contextType = readContext(contextType))
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
        ? (contextType = readContext(contextType))
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
  if (
    didCaptureError &&
    "function" !== typeof Component.getDerivedStateFromError
  ) {
    var nextChildren = null;
    profilerStartTime = -1;
  } else nextChildren = shouldUpdate.render();
  workInProgress.effectTag |= 1;
  null !== current$$1 && didCaptureError
    ? ((didCaptureError = nextChildren),
      (workInProgress.child = reconcileChildFibers(
        workInProgress,
        current$$1.child,
        null,
        renderExpirationTime
      )),
      (workInProgress.child = reconcileChildFibers(
        workInProgress,
        null,
        didCaptureError,
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
var SUSPENDED_MARKER = {};
function updateSuspenseComponent(
  current$$1,
  workInProgress,
  renderExpirationTime
) {
  var mode = workInProgress.mode,
    nextProps = workInProgress.pendingProps,
    suspenseContext = suspenseStackCursor.current,
    nextState = null,
    nextDidTimeout = !1,
    JSCompiler_temp;
  (JSCompiler_temp = 0 !== (workInProgress.effectTag & 64)) ||
    (JSCompiler_temp =
      0 !== (suspenseContext & ForceSuspenseFallback) &&
      (null === current$$1 || null !== current$$1.memoizedState));
  JSCompiler_temp
    ? ((nextState = SUSPENDED_MARKER),
      (nextDidTimeout = !0),
      (workInProgress.effectTag &= -65))
    : (null !== current$$1 && null === current$$1.memoizedState) ||
      void 0 === nextProps.fallback ||
      !0 === nextProps.unstable_avoidThisFallback ||
      (suspenseContext |= InvisibleParentSuspenseContext);
  suspenseContext &= SubtreeSuspenseContextMask;
  push(suspenseStackCursor, suspenseContext, workInProgress);
  if (null === current$$1)
    if (nextDidTimeout) {
      nextProps = nextProps.fallback;
      current$$1 = createFiberFromFragment(null, mode, 0, null);
      current$$1.return = workInProgress;
      if (0 === (workInProgress.mode & 2))
        for (
          nextDidTimeout =
            null !== workInProgress.memoizedState
              ? workInProgress.child.child
              : workInProgress.child,
            current$$1.child = nextDidTimeout;
          null !== nextDidTimeout;

        )
          (nextDidTimeout.return = current$$1),
            (nextDidTimeout = nextDidTimeout.sibling);
      renderExpirationTime = createFiberFromFragment(
        nextProps,
        mode,
        renderExpirationTime,
        null
      );
      renderExpirationTime.return = workInProgress;
      current$$1.sibling = renderExpirationTime;
      mode = current$$1;
    } else
      mode = renderExpirationTime = mountChildFibers(
        workInProgress,
        null,
        nextProps.children,
        renderExpirationTime
      );
  else {
    if (null !== current$$1.memoizedState)
      if (
        ((suspenseContext = current$$1.child),
        (mode = suspenseContext.sibling),
        nextDidTimeout)
      ) {
        nextProps = nextProps.fallback;
        renderExpirationTime = createWorkInProgress(
          suspenseContext,
          suspenseContext.pendingProps,
          0
        );
        renderExpirationTime.return = workInProgress;
        if (
          0 === (workInProgress.mode & 2) &&
          ((nextDidTimeout =
            null !== workInProgress.memoizedState
              ? workInProgress.child.child
              : workInProgress.child),
          nextDidTimeout !== suspenseContext.child)
        )
          for (
            renderExpirationTime.child = nextDidTimeout;
            null !== nextDidTimeout;

          )
            (nextDidTimeout.return = renderExpirationTime),
              (nextDidTimeout = nextDidTimeout.sibling);
        if (workInProgress.mode & 8) {
          nextDidTimeout = 0;
          for (
            suspenseContext = renderExpirationTime.child;
            null !== suspenseContext;

          )
            (nextDidTimeout += suspenseContext.treeBaseDuration),
              (suspenseContext = suspenseContext.sibling);
          renderExpirationTime.treeBaseDuration = nextDidTimeout;
        }
        nextProps = createWorkInProgress(mode, nextProps, mode.expirationTime);
        nextProps.return = workInProgress;
        renderExpirationTime.sibling = nextProps;
        mode = renderExpirationTime;
        renderExpirationTime.childExpirationTime = 0;
        renderExpirationTime = nextProps;
      } else
        mode = renderExpirationTime = reconcileChildFibers(
          workInProgress,
          suspenseContext.child,
          nextProps.children,
          renderExpirationTime
        );
    else if (((suspenseContext = current$$1.child), nextDidTimeout)) {
      nextDidTimeout = nextProps.fallback;
      nextProps = createFiberFromFragment(null, mode, 0, null);
      nextProps.return = workInProgress;
      nextProps.child = suspenseContext;
      null !== suspenseContext && (suspenseContext.return = nextProps);
      if (0 === (workInProgress.mode & 2))
        for (
          suspenseContext =
            null !== workInProgress.memoizedState
              ? workInProgress.child.child
              : workInProgress.child,
            nextProps.child = suspenseContext;
          null !== suspenseContext;

        )
          (suspenseContext.return = nextProps),
            (suspenseContext = suspenseContext.sibling);
      if (workInProgress.mode & 8) {
        suspenseContext = 0;
        for (JSCompiler_temp = nextProps.child; null !== JSCompiler_temp; )
          (suspenseContext += JSCompiler_temp.treeBaseDuration),
            (JSCompiler_temp = JSCompiler_temp.sibling);
        nextProps.treeBaseDuration = suspenseContext;
      }
      renderExpirationTime = createFiberFromFragment(
        nextDidTimeout,
        mode,
        renderExpirationTime,
        null
      );
      renderExpirationTime.return = workInProgress;
      nextProps.sibling = renderExpirationTime;
      renderExpirationTime.effectTag |= 2;
      mode = nextProps;
      nextProps.childExpirationTime = 0;
    } else
      renderExpirationTime = mode = reconcileChildFibers(
        workInProgress,
        suspenseContext,
        nextProps.children,
        renderExpirationTime
      );
    workInProgress.stateNode = current$$1.stateNode;
  }
  workInProgress.memoizedState = nextState;
  workInProgress.child = mode;
  return renderExpirationTime;
}
function initSuspenseListRenderState(
  workInProgress,
  isBackwards,
  tail,
  lastContentRow,
  tailMode
) {
  var renderState = workInProgress.memoizedState;
  null === renderState
    ? (workInProgress.memoizedState = {
        isBackwards: isBackwards,
        rendering: null,
        last: lastContentRow,
        tail: tail,
        tailExpiration: 0,
        tailMode: tailMode
      })
    : ((renderState.isBackwards = isBackwards),
      (renderState.rendering = null),
      (renderState.last = lastContentRow),
      (renderState.tail = tail),
      (renderState.tailExpiration = 0),
      (renderState.tailMode = tailMode));
}
function updateSuspenseListComponent(
  current$$1,
  workInProgress,
  renderExpirationTime
) {
  var nextProps = workInProgress.pendingProps,
    revealOrder = nextProps.revealOrder,
    tailMode = nextProps.tail;
  reconcileChildren(
    current$$1,
    workInProgress,
    nextProps.children,
    renderExpirationTime
  );
  nextProps = suspenseStackCursor.current;
  if (0 !== (nextProps & ForceSuspenseFallback))
    (nextProps =
      (nextProps & SubtreeSuspenseContextMask) | ForceSuspenseFallback),
      (workInProgress.effectTag |= 64);
  else {
    if (null !== current$$1 && 0 !== (current$$1.effectTag & 64))
      a: for (current$$1 = workInProgress.child; null !== current$$1; ) {
        if (13 === current$$1.tag) {
          if (null !== current$$1.memoizedState) {
            current$$1.expirationTime < renderExpirationTime &&
              (current$$1.expirationTime = renderExpirationTime);
            var alternate = current$$1.alternate;
            null !== alternate &&
              alternate.expirationTime < renderExpirationTime &&
              (alternate.expirationTime = renderExpirationTime);
            scheduleWorkOnParentPath(current$$1.return, renderExpirationTime);
          }
        } else if (null !== current$$1.child) {
          current$$1.child.return = current$$1;
          current$$1 = current$$1.child;
          continue;
        }
        if (current$$1 === workInProgress) break a;
        for (; null === current$$1.sibling; ) {
          if (
            null === current$$1.return ||
            current$$1.return === workInProgress
          )
            break a;
          current$$1 = current$$1.return;
        }
        current$$1.sibling.return = current$$1.return;
        current$$1 = current$$1.sibling;
      }
    nextProps &= SubtreeSuspenseContextMask;
  }
  push(suspenseStackCursor, nextProps, workInProgress);
  if (0 === (workInProgress.mode & 2)) workInProgress.memoizedState = null;
  else
    switch (revealOrder) {
      case "forwards":
        renderExpirationTime = workInProgress.child;
        for (revealOrder = null; null !== renderExpirationTime; )
          (nextProps = renderExpirationTime.alternate),
            null !== nextProps &&
              null === findFirstSuspended(nextProps) &&
              (revealOrder = renderExpirationTime),
            (renderExpirationTime = renderExpirationTime.sibling);
        renderExpirationTime = revealOrder;
        null === renderExpirationTime
          ? ((revealOrder = workInProgress.child),
            (workInProgress.child = null))
          : ((revealOrder = renderExpirationTime.sibling),
            (renderExpirationTime.sibling = null));
        initSuspenseListRenderState(
          workInProgress,
          !1,
          revealOrder,
          renderExpirationTime,
          tailMode
        );
        break;
      case "backwards":
        renderExpirationTime = null;
        revealOrder = workInProgress.child;
        for (workInProgress.child = null; null !== revealOrder; ) {
          nextProps = revealOrder.alternate;
          if (null !== nextProps && null === findFirstSuspended(nextProps)) {
            workInProgress.child = revealOrder;
            break;
          }
          nextProps = revealOrder.sibling;
          revealOrder.sibling = renderExpirationTime;
          renderExpirationTime = revealOrder;
          revealOrder = nextProps;
        }
        initSuspenseListRenderState(
          workInProgress,
          !0,
          renderExpirationTime,
          null,
          tailMode
        );
        break;
      case "together":
        initSuspenseListRenderState(workInProgress, !1, null, null, void 0);
        break;
      default:
        workInProgress.memoizedState = null;
    }
  return workInProgress.child;
}
function bailoutOnAlreadyFinishedWork(
  current$$1,
  workInProgress,
  renderExpirationTime
) {
  null !== current$$1 &&
    (workInProgress.dependencies = current$$1.dependencies);
  profilerStartTime = -1;
  if (workInProgress.childExpirationTime < renderExpirationTime) return null;
  if (null !== current$$1 && workInProgress.child !== current$$1.child)
    throw ReactError(Error("Resuming work not yet implemented."));
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
var appendAllChildren = void 0,
  updateHostContainer = void 0,
  updateHostComponent$1 = void 0,
  updateHostText$1 = void 0;
appendAllChildren = function(
  parent,
  workInProgress,
  needsVisibilityToggle,
  isHidden
) {
  for (var node = workInProgress.child; null !== node; ) {
    if (5 === node.tag) {
      var instance = node.stateNode;
      needsVisibilityToggle &&
        isHidden &&
        (instance = cloneHiddenInstance(
          instance,
          node.type,
          node.memoizedProps,
          node
        ));
      appendChildNode(parent.node, instance.node);
    } else if (6 === node.tag) {
      instance = node.stateNode;
      if (needsVisibilityToggle && isHidden)
        throw Error("Not yet implemented.");
      appendChildNode(parent.node, instance.node);
    } else if (4 !== node.tag) {
      if (
        13 === node.tag &&
        0 !== (node.effectTag & 4) &&
        (instance = null !== node.memoizedState)
      ) {
        var primaryChildParent = node.child;
        if (
          null !== primaryChildParent &&
          (null !== primaryChildParent.child &&
            ((primaryChildParent.child.return = primaryChildParent),
            appendAllChildren(parent, primaryChildParent, !0, instance)),
          (instance = primaryChildParent.sibling),
          null !== instance)
        ) {
          instance.return = node;
          node = instance;
          continue;
        }
      }
      if (null !== node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
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
function appendAllChildrenToContainer(
  containerChildSet,
  workInProgress,
  needsVisibilityToggle,
  isHidden
) {
  for (var node = workInProgress.child; null !== node; ) {
    if (5 === node.tag) {
      var instance = node.stateNode;
      needsVisibilityToggle &&
        isHidden &&
        (instance = cloneHiddenInstance(
          instance,
          node.type,
          node.memoizedProps,
          node
        ));
      appendChildNodeToSet(containerChildSet, instance.node);
    } else if (6 === node.tag) {
      instance = node.stateNode;
      if (needsVisibilityToggle && isHidden)
        throw Error("Not yet implemented.");
      appendChildNodeToSet(containerChildSet, instance.node);
    } else if (4 !== node.tag) {
      if (
        13 === node.tag &&
        0 !== (node.effectTag & 4) &&
        (instance = null !== node.memoizedState)
      ) {
        var primaryChildParent = node.child;
        if (
          null !== primaryChildParent &&
          (null !== primaryChildParent.child &&
            ((primaryChildParent.child.return = primaryChildParent),
            appendAllChildrenToContainer(
              containerChildSet,
              primaryChildParent,
              !0,
              instance
            )),
          (instance = primaryChildParent.sibling),
          null !== instance)
        ) {
          instance.return = node;
          node = instance;
          continue;
        }
      }
      if (null !== node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
    }
    if (node === workInProgress) break;
    for (; null === node.sibling; ) {
      if (null === node.return || node.return === workInProgress) return;
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
updateHostContainer = function(workInProgress) {
  var portalOrRoot = workInProgress.stateNode;
  if (null !== workInProgress.firstEffect) {
    var container = portalOrRoot.containerInfo,
      newChildSet = createChildNodeSet(container);
    appendAllChildrenToContainer(newChildSet, workInProgress, !1, !1);
    portalOrRoot.pendingChildren = newChildSet;
    workInProgress.effectTag |= 4;
    completeRoot(container, newChildSet);
  }
};
updateHostComponent$1 = function(current, workInProgress, type, newProps) {
  type = current.stateNode;
  var oldProps = current.memoizedProps;
  if ((current = null === workInProgress.firstEffect) && oldProps === newProps)
    workInProgress.stateNode = type;
  else {
    var recyclableInstance = workInProgress.stateNode;
    requiredContext(contextStackCursor$1.current);
    var updatePayload = null;
    oldProps !== newProps &&
      ((oldProps = diffProperties(
        null,
        oldProps,
        newProps,
        recyclableInstance.canonical.viewConfig.validAttributes
      )),
      (recyclableInstance.canonical.currentProps = newProps),
      (updatePayload = oldProps));
    current && null === updatePayload
      ? (workInProgress.stateNode = type)
      : ((newProps = updatePayload),
        (recyclableInstance = type.node),
        (type = {
          node: current
            ? null !== newProps
              ? cloneNodeWithNewProps(recyclableInstance, newProps)
              : cloneNode(recyclableInstance)
            : null !== newProps
              ? cloneNodeWithNewChildrenAndProps(recyclableInstance, newProps)
              : cloneNodeWithNewChildren(recyclableInstance),
          canonical: type.canonical
        }),
        (workInProgress.stateNode = type),
        current
          ? (workInProgress.effectTag |= 4)
          : appendAllChildren(type, workInProgress, !1, !1));
  }
};
updateHostText$1 = function(current, workInProgress, oldText, newText) {
  oldText !== newText &&
    ((current = requiredContext(rootInstanceStackCursor.current)),
    (oldText = requiredContext(contextStackCursor$1.current)),
    (workInProgress.stateNode = createTextInstance(
      newText,
      current,
      oldText,
      workInProgress
    )),
    (workInProgress.effectTag |= 4));
};
function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
  switch (renderState.tailMode) {
    case "hidden":
      hasRenderedATailFallback = renderState.tail;
      for (var lastTailNode = null; null !== hasRenderedATailFallback; )
        null !== hasRenderedATailFallback.alternate &&
          (lastTailNode = hasRenderedATailFallback),
          (hasRenderedATailFallback = hasRenderedATailFallback.sibling);
      null === lastTailNode
        ? (renderState.tail = null)
        : (lastTailNode.sibling = null);
      break;
    case "collapsed":
      lastTailNode = renderState.tail;
      for (var _lastTailNode = null; null !== lastTailNode; )
        null !== lastTailNode.alternate && (_lastTailNode = lastTailNode),
          (lastTailNode = lastTailNode.sibling);
      null === _lastTailNode
        ? hasRenderedATailFallback || null === renderState.tail
          ? (renderState.tail = null)
          : (renderState.tail.sibling = null)
        : (_lastTailNode.sibling = null);
  }
}
function completeWork(current, workInProgress, renderExpirationTime) {
  var newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case 2:
      break;
    case 16:
      break;
    case 15:
    case 0:
      break;
    case 1:
      isContextProvider(workInProgress.type) && popContext(workInProgress);
      break;
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
      break;
    case 5:
      popHostContext(workInProgress);
      var rootContainerInstance = requiredContext(
        rootInstanceStackCursor.current
      );
      renderExpirationTime = workInProgress.type;
      if (null !== current && null != workInProgress.stateNode)
        updateHostComponent$1(
          current,
          workInProgress,
          renderExpirationTime,
          newProps,
          rootContainerInstance
        ),
          current.ref !== workInProgress.ref &&
            (workInProgress.effectTag |= 128);
      else if (newProps) {
        requiredContext(contextStackCursor$1.current);
        current = nextReactTag;
        nextReactTag += 2;
        renderExpirationTime = getViewConfigForType(renderExpirationTime);
        var updatePayload = diffProperties(
          null,
          emptyObject,
          newProps,
          renderExpirationTime.validAttributes
        );
        rootContainerInstance = createNode(
          current,
          renderExpirationTime.uiViewClassName,
          rootContainerInstance,
          updatePayload,
          workInProgress
        );
        current = new ReactFabricHostComponent(
          current,
          renderExpirationTime,
          newProps,
          workInProgress
        );
        current = { node: rootContainerInstance, canonical: current };
        appendAllChildren(current, workInProgress, !1, !1);
        workInProgress.stateNode = current;
        null !== workInProgress.ref && (workInProgress.effectTag |= 128);
      } else if (null === workInProgress.stateNode)
        throw ReactError(
          Error(
            "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
          )
        );
      break;
    case 6:
      if (current && null != workInProgress.stateNode)
        updateHostText$1(
          current,
          workInProgress,
          current.memoizedProps,
          newProps
        );
      else {
        if ("string" !== typeof newProps && null === workInProgress.stateNode)
          throw ReactError(
            Error(
              "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
            )
          );
        current = requiredContext(rootInstanceStackCursor.current);
        rootContainerInstance = requiredContext(contextStackCursor$1.current);
        workInProgress.stateNode = createTextInstance(
          newProps,
          current,
          rootContainerInstance,
          workInProgress
        );
      }
      break;
    case 11:
      break;
    case 13:
      pop(suspenseStackCursor, workInProgress);
      newProps = workInProgress.memoizedState;
      if (0 !== (workInProgress.effectTag & 64))
        return (
          (workInProgress.expirationTime = renderExpirationTime), workInProgress
        );
      newProps = null !== newProps;
      rootContainerInstance = !1;
      null !== current &&
        ((renderExpirationTime = current.memoizedState),
        (rootContainerInstance = null !== renderExpirationTime),
        newProps ||
          null === renderExpirationTime ||
          ((renderExpirationTime = current.child.sibling),
          null !== renderExpirationTime &&
            ((updatePayload = workInProgress.firstEffect),
            null !== updatePayload
              ? ((workInProgress.firstEffect = renderExpirationTime),
                (renderExpirationTime.nextEffect = updatePayload))
              : ((workInProgress.firstEffect = workInProgress.lastEffect = renderExpirationTime),
                (renderExpirationTime.nextEffect = null)),
            (renderExpirationTime.effectTag = 8))));
      if (newProps && !rootContainerInstance && 0 !== (workInProgress.mode & 2))
        if (
          (null === current &&
            !0 !== workInProgress.memoizedProps.unstable_avoidThisFallback) ||
          0 !== (suspenseStackCursor.current & InvisibleParentSuspenseContext)
        )
          workInProgressRootExitStatus === RootIncomplete &&
            (workInProgressRootExitStatus = RootSuspended);
        else if (
          workInProgressRootExitStatus === RootIncomplete ||
          workInProgressRootExitStatus === RootSuspended
        )
          workInProgressRootExitStatus = RootSuspendedWithDelay;
      newProps && (workInProgress.effectTag |= 4);
      break;
    case 7:
      break;
    case 8:
      break;
    case 12:
      break;
    case 4:
      popHostContainer(workInProgress);
      updateHostContainer(workInProgress);
      break;
    case 10:
      popProvider(workInProgress);
      break;
    case 9:
      break;
    case 14:
      break;
    case 17:
      isContextProvider(workInProgress.type) && popContext(workInProgress);
      break;
    case 18:
      break;
    case 19:
      pop(suspenseStackCursor, workInProgress);
      newProps = workInProgress.memoizedState;
      if (null === newProps) break;
      rootContainerInstance = 0 !== (workInProgress.effectTag & 64);
      updatePayload = newProps.rendering;
      if (null === updatePayload)
        if (rootContainerInstance) cutOffTailIfNeeded(newProps, !1);
        else {
          if (
            workInProgressRootExitStatus !== RootIncomplete ||
            (null !== current && 0 !== (current.effectTag & 64))
          )
            for (current = workInProgress.child; null !== current; ) {
              updatePayload = findFirstSuspended(current);
              if (null !== updatePayload) {
                workInProgress.effectTag |= 64;
                cutOffTailIfNeeded(newProps, !1);
                current = updatePayload.updateQueue;
                null !== current &&
                  ((workInProgress.updateQueue = current),
                  (workInProgress.effectTag |= 4));
                workInProgress.firstEffect = workInProgress.lastEffect = null;
                current = renderExpirationTime;
                for (newProps = workInProgress.child; null !== newProps; )
                  (rootContainerInstance = newProps),
                    (updatePayload = current),
                    (rootContainerInstance.effectTag &= 2),
                    (rootContainerInstance.nextEffect = null),
                    (rootContainerInstance.firstEffect = null),
                    (rootContainerInstance.lastEffect = null),
                    (renderExpirationTime = rootContainerInstance.alternate),
                    null === renderExpirationTime
                      ? ((rootContainerInstance.childExpirationTime = 0),
                        (rootContainerInstance.expirationTime = updatePayload),
                        (rootContainerInstance.child = null),
                        (rootContainerInstance.memoizedProps = null),
                        (rootContainerInstance.memoizedState = null),
                        (rootContainerInstance.updateQueue = null),
                        (rootContainerInstance.dependencies = null),
                        (rootContainerInstance.selfBaseDuration = 0),
                        (rootContainerInstance.treeBaseDuration = 0))
                      : ((rootContainerInstance.childExpirationTime =
                          renderExpirationTime.childExpirationTime),
                        (rootContainerInstance.expirationTime =
                          renderExpirationTime.expirationTime),
                        (rootContainerInstance.child =
                          renderExpirationTime.child),
                        (rootContainerInstance.memoizedProps =
                          renderExpirationTime.memoizedProps),
                        (rootContainerInstance.memoizedState =
                          renderExpirationTime.memoizedState),
                        (rootContainerInstance.updateQueue =
                          renderExpirationTime.updateQueue),
                        (updatePayload = renderExpirationTime.dependencies),
                        (rootContainerInstance.dependencies =
                          null === updatePayload
                            ? null
                            : {
                                expirationTime: updatePayload.expirationTime,
                                firstContext: updatePayload.firstContext,
                                responders: updatePayload.responders
                              }),
                        (rootContainerInstance.selfBaseDuration =
                          renderExpirationTime.selfBaseDuration),
                        (rootContainerInstance.treeBaseDuration =
                          renderExpirationTime.treeBaseDuration)),
                    (newProps = newProps.sibling);
                push(
                  suspenseStackCursor,
                  (suspenseStackCursor.current & SubtreeSuspenseContextMask) |
                    ForceSuspenseFallback,
                  workInProgress
                );
                return workInProgress.child;
              }
              current = current.sibling;
            }
        }
      else {
        if (!rootContainerInstance)
          if (
            ((current = findFirstSuspended(updatePayload)), null !== current)
          ) {
            if (
              ((workInProgress.effectTag |= 64),
              (rootContainerInstance = !0),
              cutOffTailIfNeeded(newProps, !0),
              null === newProps.tail && "hidden" === newProps.tailMode)
            ) {
              current = current.updateQueue;
              null !== current &&
                ((workInProgress.updateQueue = current),
                (workInProgress.effectTag |= 4));
              workInProgress = workInProgress.lastEffect = newProps.lastEffect;
              null !== workInProgress && (workInProgress.nextEffect = null);
              break;
            }
          } else
            now() > newProps.tailExpiration &&
              1 < renderExpirationTime &&
              ((workInProgress.effectTag |= 64),
              (rootContainerInstance = !0),
              cutOffTailIfNeeded(newProps, !1),
              (current = renderExpirationTime - 1),
              (workInProgress.expirationTime = workInProgress.childExpirationTime = current),
              null === spawnedWorkDuringRender
                ? (spawnedWorkDuringRender = [current])
                : spawnedWorkDuringRender.push(current));
        newProps.isBackwards
          ? ((updatePayload.sibling = workInProgress.child),
            (workInProgress.child = updatePayload))
          : ((current = newProps.last),
            null !== current
              ? (current.sibling = updatePayload)
              : (workInProgress.child = updatePayload),
            (newProps.last = updatePayload));
      }
      if (null !== newProps.tail)
        return (
          0 === newProps.tailExpiration &&
            (newProps.tailExpiration = now() + 500),
          (current = newProps.tail),
          (newProps.rendering = current),
          (newProps.tail = current.sibling),
          (newProps.lastEffect = workInProgress.lastEffect),
          (current.sibling = null),
          (newProps = suspenseStackCursor.current),
          (newProps = rootContainerInstance
            ? (newProps & SubtreeSuspenseContextMask) | ForceSuspenseFallback
            : newProps & SubtreeSuspenseContextMask),
          push(suspenseStackCursor, newProps, workInProgress),
          current
        );
      break;
    case 20:
      break;
    default:
      throw ReactError(
        Error(
          "Unknown unit of work tag. This error is likely caused by a bug in React. Please file an issue."
        )
      );
  }
  return null;
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
      popHostContainer(workInProgress);
      popTopLevelContextObject(workInProgress);
      effectTag = workInProgress.effectTag;
      if (0 !== (effectTag & 64))
        throw ReactError(
          Error(
            "The root failed to unmount after an error. This is likely a bug in React. Please file an issue."
          )
        );
      workInProgress.effectTag = (effectTag & -2049) | 64;
      return workInProgress;
    case 5:
      return popHostContext(workInProgress), null;
    case 13:
      return (
        pop(suspenseStackCursor, workInProgress),
        (effectTag = workInProgress.effectTag),
        effectTag & 2048
          ? ((workInProgress.effectTag = (effectTag & -2049) | 64),
            workInProgress)
          : null
      );
    case 18:
      return null;
    case 19:
      return pop(suspenseStackCursor, workInProgress), null;
    case 4:
      return popHostContainer(workInProgress), null;
    case 10:
      return popProvider(workInProgress), null;
    default:
      return null;
  }
}
function createCapturedValue(value, source) {
  return {
    value: value,
    source: source,
    stack: getStackByFiberInDevAndProd(source)
  };
}
if (
  "function" !==
  typeof ReactNativePrivateInterface.ReactFiberErrorDialog.showErrorDialog
)
  throw ReactError(
    Error("Expected ReactFiberErrorDialog.showErrorDialog to be a function.")
  );
function logCapturedError(capturedError) {
  !1 !==
    ReactNativePrivateInterface.ReactFiberErrorDialog.showErrorDialog(
      capturedError
    ) && console.error(capturedError.error);
}
var PossiblyWeakSet$1 = "function" === typeof WeakSet ? WeakSet : Set;
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
function safelyCallComponentWillUnmount(current$$1, instance) {
  try {
    (instance.props = current$$1.memoizedProps),
      (instance.state = current$$1.memoizedState),
      instance.componentWillUnmount();
  } catch (unmountError) {
    captureCommitPhaseError(current$$1, unmountError);
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
function commitHookEffectList(unmountTag, mountTag, finishedWork) {
  finishedWork = finishedWork.updateQueue;
  finishedWork = null !== finishedWork ? finishedWork.lastEffect : null;
  if (null !== finishedWork) {
    var effect = (finishedWork = finishedWork.next);
    do {
      if ((effect.tag & unmountTag) !== NoEffect$1) {
        var destroy = effect.destroy;
        effect.destroy = void 0;
        void 0 !== destroy && destroy();
      }
      (effect.tag & mountTag) !== NoEffect$1 &&
        ((destroy = effect.create), (effect.destroy = destroy()));
      effect = effect.next;
    } while (effect !== finishedWork);
  }
}
function commitUnmount(current$$1$jscomp$0, renderPriorityLevel) {
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
        var firstEffect = updateQueue.next;
        runWithPriority$1(
          97 < renderPriorityLevel ? 97 : renderPriorityLevel,
          function() {
            var effect = firstEffect;
            do {
              var destroy = effect.destroy;
              if (void 0 !== destroy) {
                var current$$1 = current$$1$jscomp$0;
                try {
                  destroy();
                } catch (error) {
                  captureCommitPhaseError(current$$1, error);
                }
              }
              effect = effect.next;
            } while (effect !== firstEffect);
          }
        );
      }
      break;
    case 1:
      safelyDetachRef(current$$1$jscomp$0);
      renderPriorityLevel = current$$1$jscomp$0.stateNode;
      "function" === typeof renderPriorityLevel.componentWillUnmount &&
        safelyCallComponentWillUnmount(
          current$$1$jscomp$0,
          renderPriorityLevel
        );
      break;
    case 5:
      safelyDetachRef(current$$1$jscomp$0);
      break;
    case 4:
      createChildNodeSet(current$$1$jscomp$0.stateNode.containerInfo);
  }
}
function detachFiber(current$$1) {
  var alternate = current$$1.alternate;
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
  null !== alternate && detachFiber(alternate);
}
function commitWork(current$$1, finishedWork) {
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      commitHookEffectList(UnmountMutation, MountMutation, finishedWork);
      return;
    case 12:
      return;
    case 13:
      null !== finishedWork.memoizedState &&
        (globalMostRecentFallbackTime = now());
      attachSuspenseRetryListeners(finishedWork);
      return;
    case 19:
      attachSuspenseRetryListeners(finishedWork);
      return;
  }
  switch (finishedWork.tag) {
    case 1:
    case 5:
    case 6:
    case 20:
      break;
    case 3:
    case 4:
      break;
    default:
      throw ReactError(
        Error(
          "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
        )
      );
  }
}
function attachSuspenseRetryListeners(finishedWork) {
  var thenables = finishedWork.updateQueue;
  if (null !== thenables) {
    finishedWork.updateQueue = null;
    var retryCache = finishedWork.stateNode;
    null === retryCache &&
      (retryCache = finishedWork.stateNode = new PossiblyWeakSet$1());
    thenables.forEach(function(thenable) {
      var retry = resolveRetryThenable.bind(null, finishedWork, thenable);
      retryCache.has(thenable) ||
        ((retry = tracing.unstable_wrap(retry)),
        retryCache.add(thenable),
        thenable.then(retry, retry));
    });
  }
}
var PossiblyWeakMap = "function" === typeof WeakMap ? WeakMap : Map;
function createRootErrorUpdate(fiber, errorInfo, expirationTime) {
  expirationTime = createUpdate(expirationTime, null);
  expirationTime.tag = 3;
  expirationTime.payload = { element: null };
  var error = errorInfo.value;
  expirationTime.callback = function() {
    hasUncaughtError || ((hasUncaughtError = !0), (firstUncaughtError = error));
    logError(fiber, errorInfo);
  };
  return expirationTime;
}
function createClassErrorUpdate(fiber, errorInfo, expirationTime) {
  expirationTime = createUpdate(expirationTime, null);
  expirationTime.tag = 3;
  var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
  if ("function" === typeof getDerivedStateFromError) {
    var error = errorInfo.value;
    expirationTime.payload = function() {
      logError(fiber, errorInfo);
      return getDerivedStateFromError(error);
    };
  }
  var inst = fiber.stateNode;
  null !== inst &&
    "function" === typeof inst.componentDidCatch &&
    (expirationTime.callback = function() {
      "function" !== typeof getDerivedStateFromError &&
        (null === legacyErrorBoundariesThatAlreadyFailed
          ? (legacyErrorBoundariesThatAlreadyFailed = new Set([this]))
          : legacyErrorBoundariesThatAlreadyFailed.add(this),
        logError(fiber, errorInfo));
      var stack = errorInfo.stack;
      this.componentDidCatch(errorInfo.value, {
        componentStack: null !== stack ? stack : ""
      });
    });
  return expirationTime;
}
var ceil = Math.ceil,
  ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher,
  ReactCurrentOwner$2 = ReactSharedInternals.ReactCurrentOwner,
  NoContext = 0,
  LegacyUnbatchedContext = 8,
  RenderContext = 16,
  CommitContext = 32,
  RootIncomplete = 0,
  RootErrored = 1,
  RootSuspended = 2,
  RootSuspendedWithDelay = 3,
  RootCompleted = 4,
  executionContext = NoContext,
  workInProgressRoot = null,
  workInProgress = null,
  renderExpirationTime = 0,
  workInProgressRootExitStatus = RootIncomplete,
  workInProgressRootLatestProcessedExpirationTime = 1073741823,
  workInProgressRootLatestSuspenseTimeout = 1073741823,
  workInProgressRootCanSuspendUsingConfig = null,
  workInProgressRootHasPendingPing = !1,
  globalMostRecentFallbackTime = 0,
  FALLBACK_THROTTLE_MS = 500,
  nextEffect = null,
  hasUncaughtError = !1,
  firstUncaughtError = null,
  legacyErrorBoundariesThatAlreadyFailed = null,
  rootDoesHavePassiveEffects = !1,
  rootWithPendingPassiveEffects = null,
  pendingPassiveEffectsRenderPriority = 90,
  pendingPassiveEffectsExpirationTime = 0,
  rootsWithPendingDiscreteUpdates = null,
  nestedUpdateCount = 0,
  rootWithNestedUpdates = null,
  spawnedWorkDuringRender = null,
  currentEventTime = 0;
function requestCurrentTime() {
  return (executionContext & (RenderContext | CommitContext)) !== NoContext
    ? 1073741821 - ((now() / 10) | 0)
    : 0 !== currentEventTime
      ? currentEventTime
      : (currentEventTime = 1073741821 - ((now() / 10) | 0));
}
function computeExpirationForFiber(currentTime, fiber, suspenseConfig) {
  fiber = fiber.mode;
  if (0 === (fiber & 2)) return 1073741823;
  var priorityLevel = getCurrentPriorityLevel();
  if (0 === (fiber & 4)) return 99 === priorityLevel ? 1073741823 : 1073741822;
  if ((executionContext & RenderContext) !== NoContext)
    return renderExpirationTime;
  if (null !== suspenseConfig)
    currentTime =
      1073741821 -
      25 *
        ((((1073741821 -
          currentTime +
          (suspenseConfig.timeoutMs | 0 || 5e3) / 10) /
          25) |
          0) +
          1);
  else
    switch (priorityLevel) {
      case 99:
        currentTime = 1073741823;
        break;
      case 98:
        currentTime =
          1073741821 - 10 * ((((1073741821 - currentTime + 15) / 10) | 0) + 1);
        break;
      case 97:
      case 96:
        currentTime =
          1073741821 - 25 * ((((1073741821 - currentTime + 500) / 25) | 0) + 1);
        break;
      case 95:
        currentTime = 1;
        break;
      default:
        throw ReactError(Error("Expected a valid priority level"));
    }
  null !== workInProgressRoot &&
    currentTime === renderExpirationTime &&
    --currentTime;
  return currentTime;
}
function scheduleUpdateOnFiber(fiber, expirationTime) {
  if (50 < nestedUpdateCount)
    throw ((nestedUpdateCount = 0),
    (rootWithNestedUpdates = null),
    ReactError(
      Error(
        "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops."
      )
    ));
  fiber = markUpdateTimeFromFiberToRoot(fiber, expirationTime);
  if (null !== fiber) {
    fiber.pingTime = 0;
    var priorityLevel = getCurrentPriorityLevel();
    if (1073741823 === expirationTime)
      if (
        (executionContext & LegacyUnbatchedContext) !== NoContext &&
        (executionContext & (RenderContext | CommitContext)) === NoContext
      ) {
        scheduleInteractions(
          fiber,
          expirationTime,
          tracing.__interactionsRef.current
        );
        for (
          var callback = renderRoot(fiber, 1073741823, !0);
          null !== callback;

        )
          callback = callback(!0);
      } else
        scheduleCallbackForRoot(fiber, 99, 1073741823),
          executionContext === NoContext && flushSyncCallbackQueue();
    else scheduleCallbackForRoot(fiber, priorityLevel, expirationTime);
    (executionContext & 4) === NoContext ||
      (98 !== priorityLevel && 99 !== priorityLevel) ||
      (null === rootsWithPendingDiscreteUpdates
        ? (rootsWithPendingDiscreteUpdates = new Map([[fiber, expirationTime]]))
        : ((priorityLevel = rootsWithPendingDiscreteUpdates.get(fiber)),
          (void 0 === priorityLevel || priorityLevel > expirationTime) &&
            rootsWithPendingDiscreteUpdates.set(fiber, expirationTime)));
  }
}
function markUpdateTimeFromFiberToRoot(fiber, expirationTime) {
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
  null !== root &&
    (expirationTime > root.firstPendingTime &&
      (root.firstPendingTime = expirationTime),
    (fiber = root.lastPendingTime),
    0 === fiber || expirationTime < fiber) &&
    (root.lastPendingTime = expirationTime);
  return root;
}
function scheduleCallbackForRoot(root, priorityLevel, expirationTime) {
  if (root.callbackExpirationTime < expirationTime) {
    var existingCallbackNode = root.callbackNode;
    null !== existingCallbackNode &&
      existingCallbackNode !== fakeCallbackNode &&
      Scheduler_cancelCallback(existingCallbackNode);
    root.callbackExpirationTime = expirationTime;
    1073741823 === expirationTime
      ? (root.callbackNode = scheduleSyncCallback(
          runRootCallback.bind(
            null,
            root,
            renderRoot.bind(null, root, expirationTime)
          )
        ))
      : ((existingCallbackNode = null),
        1 !== expirationTime &&
          (existingCallbackNode = {
            timeout: 10 * (1073741821 - expirationTime) - now()
          }),
        (root.callbackNode = scheduleCallback(
          priorityLevel,
          runRootCallback.bind(
            null,
            root,
            renderRoot.bind(null, root, expirationTime)
          ),
          existingCallbackNode
        )));
  }
  scheduleInteractions(root, expirationTime, tracing.__interactionsRef.current);
}
function runRootCallback(root, callback, isSync) {
  var prevCallbackNode = root.callbackNode,
    continuation = null;
  try {
    return (
      (continuation = callback(isSync)),
      null !== continuation
        ? runRootCallback.bind(null, root, continuation)
        : null
    );
  } finally {
    null === continuation &&
      prevCallbackNode === root.callbackNode &&
      ((root.callbackNode = null), (root.callbackExpirationTime = 0));
  }
}
function resolveLocksOnRoot(root, expirationTime) {
  var firstBatch = root.firstBatch;
  return null !== firstBatch &&
    firstBatch._defer &&
    firstBatch._expirationTime >= expirationTime
    ? (scheduleCallback(97, function() {
        firstBatch._onComplete();
        return null;
      }),
      !0)
    : !1;
}
function flushPendingDiscreteUpdates() {
  if (null !== rootsWithPendingDiscreteUpdates) {
    var roots = rootsWithPendingDiscreteUpdates;
    rootsWithPendingDiscreteUpdates = null;
    roots.forEach(function(expirationTime, root) {
      scheduleSyncCallback(renderRoot.bind(null, root, expirationTime));
    });
    flushSyncCallbackQueue();
  }
}
function prepareFreshStack(root, expirationTime) {
  root.finishedWork = null;
  root.finishedExpirationTime = 0;
  var timeoutHandle = root.timeoutHandle;
  -1 !== timeoutHandle &&
    ((root.timeoutHandle = -1), cancelTimeout(timeoutHandle));
  if (null !== workInProgress)
    for (timeoutHandle = workInProgress.return; null !== timeoutHandle; ) {
      var interruptedWork = timeoutHandle;
      switch (interruptedWork.tag) {
        case 1:
          var childContextTypes = interruptedWork.type.childContextTypes;
          null !== childContextTypes &&
            void 0 !== childContextTypes &&
            popContext(interruptedWork);
          break;
        case 3:
          popHostContainer(interruptedWork);
          popTopLevelContextObject(interruptedWork);
          break;
        case 5:
          popHostContext(interruptedWork);
          break;
        case 4:
          popHostContainer(interruptedWork);
          break;
        case 13:
          pop(suspenseStackCursor, interruptedWork);
          break;
        case 19:
          pop(suspenseStackCursor, interruptedWork);
          break;
        case 10:
          popProvider(interruptedWork);
      }
      timeoutHandle = timeoutHandle.return;
    }
  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null, expirationTime);
  renderExpirationTime = expirationTime;
  workInProgressRootExitStatus = RootIncomplete;
  workInProgressRootLatestSuspenseTimeout = workInProgressRootLatestProcessedExpirationTime = 1073741823;
  workInProgressRootCanSuspendUsingConfig = null;
  workInProgressRootHasPendingPing = !1;
  spawnedWorkDuringRender = null;
}
function renderRoot(root$jscomp$0, expirationTime, isSync) {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
    throw ReactError(Error("Should not already be working."));
  if (root$jscomp$0.firstPendingTime < expirationTime) return null;
  if (isSync && root$jscomp$0.finishedExpirationTime === expirationTime)
    return commitRoot.bind(null, root$jscomp$0);
  flushPassiveEffects();
  if (
    root$jscomp$0 !== workInProgressRoot ||
    expirationTime !== renderExpirationTime
  )
    prepareFreshStack(root$jscomp$0, expirationTime),
      startWorkOnPendingInteractions(root$jscomp$0, expirationTime);
  else if (workInProgressRootExitStatus === RootSuspendedWithDelay)
    if (workInProgressRootHasPendingPing)
      prepareFreshStack(root$jscomp$0, expirationTime);
    else {
      var lastPendingTime = root$jscomp$0.lastPendingTime;
      if (lastPendingTime < expirationTime)
        return renderRoot.bind(null, root$jscomp$0, lastPendingTime);
    }
  if (null !== workInProgress) {
    lastPendingTime = executionContext;
    executionContext |= RenderContext;
    var prevDispatcher = ReactCurrentDispatcher.current;
    null === prevDispatcher && (prevDispatcher = ContextOnlyDispatcher);
    ReactCurrentDispatcher.current = ContextOnlyDispatcher;
    var prevInteractions = tracing.__interactionsRef.current;
    tracing.__interactionsRef.current = root$jscomp$0.memoizedInteractions;
    if (isSync) {
      if (1073741823 !== expirationTime) {
        var currentTime = requestCurrentTime();
        if (currentTime < expirationTime)
          return (
            (executionContext = lastPendingTime),
            resetContextDependencies(),
            (ReactCurrentDispatcher.current = prevDispatcher),
            (tracing.__interactionsRef.current = prevInteractions),
            renderRoot.bind(null, root$jscomp$0, currentTime)
          );
      }
    } else currentEventTime = 0;
    do
      try {
        if (isSync)
          for (; null !== workInProgress; )
            workInProgress = performUnitOfWork(workInProgress);
        else
          for (; null !== workInProgress && !Scheduler_shouldYield(); )
            workInProgress = performUnitOfWork(workInProgress);
        break;
      } catch (thrownValue) {
        resetContextDependencies();
        resetHooks();
        currentTime = workInProgress;
        if (null === currentTime || null === currentTime.return)
          throw (prepareFreshStack(root$jscomp$0, expirationTime),
          (executionContext = lastPendingTime),
          thrownValue);
        currentTime.mode & 8 &&
          stopProfilerTimerIfRunningAndRecordDelta(currentTime, !0);
        a: {
          var root = root$jscomp$0,
            returnFiber = currentTime.return,
            sourceFiber = currentTime,
            value = thrownValue,
            renderExpirationTime$jscomp$0 = renderExpirationTime;
          sourceFiber.effectTag |= 1024;
          sourceFiber.firstEffect = sourceFiber.lastEffect = null;
          if (
            null !== value &&
            "object" === typeof value &&
            "function" === typeof value.then
          ) {
            var thenable = value,
              hasInvisibleParentBoundary =
                0 !==
                (suspenseStackCursor.current & InvisibleParentSuspenseContext);
            value = returnFiber;
            do {
              var JSCompiler_temp;
              if ((JSCompiler_temp = 13 === value.tag))
                null !== value.memoizedState
                  ? (JSCompiler_temp = !1)
                  : ((JSCompiler_temp = value.memoizedProps),
                    (JSCompiler_temp =
                      void 0 === JSCompiler_temp.fallback
                        ? !1
                        : !0 !== JSCompiler_temp.unstable_avoidThisFallback
                          ? !0
                          : hasInvisibleParentBoundary
                            ? !1
                            : !0));
              if (JSCompiler_temp) {
                returnFiber = value.updateQueue;
                null === returnFiber
                  ? ((returnFiber = new Set()),
                    returnFiber.add(thenable),
                    (value.updateQueue = returnFiber))
                  : returnFiber.add(thenable);
                if (0 === (value.mode & 2)) {
                  value.effectTag |= 64;
                  sourceFiber.effectTag &= -1957;
                  1 === sourceFiber.tag &&
                    (null === sourceFiber.alternate
                      ? (sourceFiber.tag = 17)
                      : ((renderExpirationTime$jscomp$0 = createUpdate(
                          1073741823,
                          null
                        )),
                        (renderExpirationTime$jscomp$0.tag = 2),
                        enqueueUpdate(
                          sourceFiber,
                          renderExpirationTime$jscomp$0
                        )));
                  sourceFiber.expirationTime = 1073741823;
                  break a;
                }
                sourceFiber = root;
                root = renderExpirationTime$jscomp$0;
                hasInvisibleParentBoundary = sourceFiber.pingCache;
                null === hasInvisibleParentBoundary
                  ? ((hasInvisibleParentBoundary = sourceFiber.pingCache = new PossiblyWeakMap()),
                    (returnFiber = new Set()),
                    hasInvisibleParentBoundary.set(thenable, returnFiber))
                  : ((returnFiber = hasInvisibleParentBoundary.get(thenable)),
                    void 0 === returnFiber &&
                      ((returnFiber = new Set()),
                      hasInvisibleParentBoundary.set(thenable, returnFiber)));
                returnFiber.has(root) ||
                  (returnFiber.add(root),
                  (sourceFiber = pingSuspendedRoot.bind(
                    null,
                    sourceFiber,
                    thenable,
                    root
                  )),
                  (sourceFiber = tracing.unstable_wrap(sourceFiber)),
                  thenable.then(sourceFiber, sourceFiber));
                value.effectTag |= 2048;
                value.expirationTime = renderExpirationTime$jscomp$0;
                break a;
              }
              value = value.return;
            } while (null !== value);
            value = Error(
              (getComponentName(sourceFiber.type) || "A React component") +
                " suspended while rendering, but no fallback UI was specified.\n\nAdd a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display." +
                getStackByFiberInDevAndProd(sourceFiber)
            );
          }
          workInProgressRootExitStatus !== RootCompleted &&
            (workInProgressRootExitStatus = RootErrored);
          value = createCapturedValue(value, sourceFiber);
          sourceFiber = returnFiber;
          do {
            switch (sourceFiber.tag) {
              case 3:
                sourceFiber.effectTag |= 2048;
                sourceFiber.expirationTime = renderExpirationTime$jscomp$0;
                renderExpirationTime$jscomp$0 = createRootErrorUpdate(
                  sourceFiber,
                  value,
                  renderExpirationTime$jscomp$0
                );
                enqueueCapturedUpdate(
                  sourceFiber,
                  renderExpirationTime$jscomp$0
                );
                break a;
              case 1:
                if (
                  ((thenable = value),
                  (root = sourceFiber.type),
                  (returnFiber = sourceFiber.stateNode),
                  0 === (sourceFiber.effectTag & 64) &&
                    ("function" === typeof root.getDerivedStateFromError ||
                      (null !== returnFiber &&
                        "function" === typeof returnFiber.componentDidCatch &&
                        (null === legacyErrorBoundariesThatAlreadyFailed ||
                          !legacyErrorBoundariesThatAlreadyFailed.has(
                            returnFiber
                          )))))
                ) {
                  sourceFiber.effectTag |= 2048;
                  sourceFiber.expirationTime = renderExpirationTime$jscomp$0;
                  renderExpirationTime$jscomp$0 = createClassErrorUpdate(
                    sourceFiber,
                    thenable,
                    renderExpirationTime$jscomp$0
                  );
                  enqueueCapturedUpdate(
                    sourceFiber,
                    renderExpirationTime$jscomp$0
                  );
                  break a;
                }
            }
            sourceFiber = sourceFiber.return;
          } while (null !== sourceFiber);
        }
        workInProgress = completeUnitOfWork(currentTime);
      }
    while (1);
    executionContext = lastPendingTime;
    resetContextDependencies();
    ReactCurrentDispatcher.current = prevDispatcher;
    tracing.__interactionsRef.current = prevInteractions;
    if (null !== workInProgress)
      return renderRoot.bind(null, root$jscomp$0, expirationTime);
  }
  root$jscomp$0.finishedWork = root$jscomp$0.current.alternate;
  root$jscomp$0.finishedExpirationTime = expirationTime;
  if (resolveLocksOnRoot(root$jscomp$0, expirationTime)) return null;
  workInProgressRoot = null;
  switch (workInProgressRootExitStatus) {
    case RootIncomplete:
      throw ReactError(Error("Should have a work-in-progress."));
    case RootErrored:
      return (
        (lastPendingTime = root$jscomp$0.lastPendingTime),
        lastPendingTime < expirationTime
          ? renderRoot.bind(null, root$jscomp$0, lastPendingTime)
          : isSync
            ? commitRoot.bind(null, root$jscomp$0)
            : (prepareFreshStack(root$jscomp$0, expirationTime),
              scheduleSyncCallback(
                renderRoot.bind(null, root$jscomp$0, expirationTime)
              ),
              null)
      );
    case RootSuspended:
      if (
        1073741823 === workInProgressRootLatestProcessedExpirationTime &&
        !isSync &&
        ((isSync = globalMostRecentFallbackTime + FALLBACK_THROTTLE_MS - now()),
        10 < isSync)
      ) {
        if (workInProgressRootHasPendingPing)
          return (
            prepareFreshStack(root$jscomp$0, expirationTime),
            renderRoot.bind(null, root$jscomp$0, expirationTime)
          );
        lastPendingTime = root$jscomp$0.lastPendingTime;
        if (lastPendingTime < expirationTime)
          return renderRoot.bind(null, root$jscomp$0, lastPendingTime);
        root$jscomp$0.timeoutHandle = scheduleTimeout(
          commitRoot.bind(null, root$jscomp$0),
          isSync
        );
        return null;
      }
      return commitRoot.bind(null, root$jscomp$0);
    case RootSuspendedWithDelay:
      if (!isSync) {
        if (workInProgressRootHasPendingPing)
          return (
            prepareFreshStack(root$jscomp$0, expirationTime),
            renderRoot.bind(null, root$jscomp$0, expirationTime)
          );
        isSync = root$jscomp$0.lastPendingTime;
        if (isSync < expirationTime)
          return renderRoot.bind(null, root$jscomp$0, isSync);
        1073741823 !== workInProgressRootLatestSuspenseTimeout
          ? (isSync =
              10 * (1073741821 - workInProgressRootLatestSuspenseTimeout) -
              now())
          : 1073741823 === workInProgressRootLatestProcessedExpirationTime
            ? (isSync = 0)
            : ((isSync =
                10 *
                  (1073741821 -
                    workInProgressRootLatestProcessedExpirationTime) -
                5e3),
              (lastPendingTime = now()),
              (expirationTime =
                10 * (1073741821 - expirationTime) - lastPendingTime),
              (isSync = lastPendingTime - isSync),
              0 > isSync && (isSync = 0),
              (isSync =
                (120 > isSync
                  ? 120
                  : 480 > isSync
                    ? 480
                    : 1080 > isSync
                      ? 1080
                      : 1920 > isSync
                        ? 1920
                        : 3e3 > isSync
                          ? 3e3
                          : 4320 > isSync
                            ? 4320
                            : 1960 * ceil(isSync / 1960)) - isSync),
              expirationTime < isSync && (isSync = expirationTime));
        if (10 < isSync)
          return (
            (root$jscomp$0.timeoutHandle = scheduleTimeout(
              commitRoot.bind(null, root$jscomp$0),
              isSync
            )),
            null
          );
      }
      return commitRoot.bind(null, root$jscomp$0);
    case RootCompleted:
      return !isSync &&
        1073741823 !== workInProgressRootLatestProcessedExpirationTime &&
        null !== workInProgressRootCanSuspendUsingConfig &&
        ((lastPendingTime = workInProgressRootLatestProcessedExpirationTime),
        (prevDispatcher = workInProgressRootCanSuspendUsingConfig),
        (expirationTime = prevDispatcher.busyMinDurationMs | 0),
        0 >= expirationTime
          ? (expirationTime = 0)
          : ((isSync = prevDispatcher.busyDelayMs | 0),
            (lastPendingTime =
              now() -
              (10 * (1073741821 - lastPendingTime) -
                (prevDispatcher.timeoutMs | 0 || 5e3))),
            (expirationTime =
              lastPendingTime <= isSync
                ? 0
                : isSync + expirationTime - lastPendingTime)),
        10 < expirationTime)
        ? ((root$jscomp$0.timeoutHandle = scheduleTimeout(
            commitRoot.bind(null, root$jscomp$0),
            expirationTime
          )),
          null)
        : commitRoot.bind(null, root$jscomp$0);
    default:
      throw ReactError(Error("Unknown root exit status."));
  }
}
function markRenderEventTimeAndConfig(expirationTime, suspenseConfig) {
  expirationTime < workInProgressRootLatestProcessedExpirationTime &&
    1 < expirationTime &&
    (workInProgressRootLatestProcessedExpirationTime = expirationTime);
  null !== suspenseConfig &&
    expirationTime < workInProgressRootLatestSuspenseTimeout &&
    1 < expirationTime &&
    ((workInProgressRootLatestSuspenseTimeout = expirationTime),
    (workInProgressRootCanSuspendUsingConfig = suspenseConfig));
}
function performUnitOfWork(unitOfWork) {
  var current$$1 = unitOfWork.alternate;
  0 !== (unitOfWork.mode & 8)
    ? ((profilerStartTime = now$1()),
      0 > unitOfWork.actualStartTime && (unitOfWork.actualStartTime = now$1()),
      (current$$1 = beginWork$$1(current$$1, unitOfWork, renderExpirationTime)),
      stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, !0))
    : (current$$1 = beginWork$$1(current$$1, unitOfWork, renderExpirationTime));
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  null === current$$1 && (current$$1 = completeUnitOfWork(unitOfWork));
  ReactCurrentOwner$2.current = null;
  return current$$1;
}
function completeUnitOfWork(unitOfWork) {
  workInProgress = unitOfWork;
  do {
    var current$$1 = workInProgress.alternate;
    unitOfWork = workInProgress.return;
    if (0 === (workInProgress.effectTag & 1024)) {
      if (0 === (workInProgress.mode & 8))
        current$$1 = completeWork(
          current$$1,
          workInProgress,
          renderExpirationTime
        );
      else {
        var fiber = workInProgress;
        profilerStartTime = now$1();
        0 > fiber.actualStartTime && (fiber.actualStartTime = now$1());
        current$$1 = completeWork(
          current$$1,
          workInProgress,
          renderExpirationTime
        );
        stopProfilerTimerIfRunningAndRecordDelta(workInProgress, !1);
      }
      fiber = workInProgress;
      if (1 === renderExpirationTime || 1 !== fiber.childExpirationTime) {
        var newChildExpirationTime = 0;
        if (0 !== (fiber.mode & 8)) {
          for (
            var actualDuration = fiber.actualDuration,
              treeBaseDuration = fiber.selfBaseDuration,
              shouldBubbleActualDurations =
                null === fiber.alternate ||
                fiber.child !== fiber.alternate.child,
              child = fiber.child;
            null !== child;

          ) {
            var childUpdateExpirationTime = child.expirationTime,
              childChildExpirationTime = child.childExpirationTime;
            childUpdateExpirationTime > newChildExpirationTime &&
              (newChildExpirationTime = childUpdateExpirationTime);
            childChildExpirationTime > newChildExpirationTime &&
              (newChildExpirationTime = childChildExpirationTime);
            shouldBubbleActualDurations &&
              (actualDuration += child.actualDuration);
            treeBaseDuration += child.treeBaseDuration;
            child = child.sibling;
          }
          fiber.actualDuration = actualDuration;
          fiber.treeBaseDuration = treeBaseDuration;
        } else
          for (actualDuration = fiber.child; null !== actualDuration; )
            (treeBaseDuration = actualDuration.expirationTime),
              (shouldBubbleActualDurations =
                actualDuration.childExpirationTime),
              treeBaseDuration > newChildExpirationTime &&
                (newChildExpirationTime = treeBaseDuration),
              shouldBubbleActualDurations > newChildExpirationTime &&
                (newChildExpirationTime = shouldBubbleActualDurations),
              (actualDuration = actualDuration.sibling);
        fiber.childExpirationTime = newChildExpirationTime;
      }
      if (null !== current$$1) return current$$1;
      null !== unitOfWork &&
        0 === (unitOfWork.effectTag & 1024) &&
        (null === unitOfWork.firstEffect &&
          (unitOfWork.firstEffect = workInProgress.firstEffect),
        null !== workInProgress.lastEffect &&
          (null !== unitOfWork.lastEffect &&
            (unitOfWork.lastEffect.nextEffect = workInProgress.firstEffect),
          (unitOfWork.lastEffect = workInProgress.lastEffect)),
        1 < workInProgress.effectTag &&
          (null !== unitOfWork.lastEffect
            ? (unitOfWork.lastEffect.nextEffect = workInProgress)
            : (unitOfWork.firstEffect = workInProgress),
          (unitOfWork.lastEffect = workInProgress)));
    } else {
      current$$1 = unwindWork(workInProgress, renderExpirationTime);
      if (0 !== (workInProgress.mode & 8)) {
        stopProfilerTimerIfRunningAndRecordDelta(workInProgress, !1);
        fiber = workInProgress.actualDuration;
        for (
          newChildExpirationTime = workInProgress.child;
          null !== newChildExpirationTime;

        )
          (fiber += newChildExpirationTime.actualDuration),
            (newChildExpirationTime = newChildExpirationTime.sibling);
        workInProgress.actualDuration = fiber;
      }
      if (null !== current$$1)
        return (current$$1.effectTag &= 1023), current$$1;
      null !== unitOfWork &&
        ((unitOfWork.firstEffect = unitOfWork.lastEffect = null),
        (unitOfWork.effectTag |= 1024));
    }
    current$$1 = workInProgress.sibling;
    if (null !== current$$1) return current$$1;
    workInProgress = unitOfWork;
  } while (null !== workInProgress);
  workInProgressRootExitStatus === RootIncomplete &&
    (workInProgressRootExitStatus = RootCompleted);
  return null;
}
function commitRoot(root) {
  var renderPriorityLevel = getCurrentPriorityLevel();
  runWithPriority$1(99, commitRootImpl.bind(null, root, renderPriorityLevel));
  null !== rootWithPendingPassiveEffects &&
    scheduleCallback(97, function() {
      flushPassiveEffects();
      return null;
    });
  return null;
}
function commitRootImpl(root, renderPriorityLevel) {
  flushPassiveEffects();
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
    throw ReactError(Error("Should not already be working."));
  var finishedWork = root.finishedWork,
    expirationTime = root.finishedExpirationTime;
  if (null === finishedWork) return null;
  root.finishedWork = null;
  root.finishedExpirationTime = 0;
  if (finishedWork === root.current)
    throw ReactError(
      Error(
        "Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue."
      )
    );
  root.callbackNode = null;
  root.callbackExpirationTime = 0;
  var updateExpirationTimeBeforeCommit = finishedWork.expirationTime,
    childExpirationTimeBeforeCommit = finishedWork.childExpirationTime;
  updateExpirationTimeBeforeCommit =
    childExpirationTimeBeforeCommit > updateExpirationTimeBeforeCommit
      ? childExpirationTimeBeforeCommit
      : updateExpirationTimeBeforeCommit;
  root.firstPendingTime = updateExpirationTimeBeforeCommit;
  updateExpirationTimeBeforeCommit < root.lastPendingTime &&
    (root.lastPendingTime = updateExpirationTimeBeforeCommit);
  root === workInProgressRoot &&
    ((workInProgress = workInProgressRoot = null), (renderExpirationTime = 0));
  1 < finishedWork.effectTag
    ? null !== finishedWork.lastEffect
      ? ((finishedWork.lastEffect.nextEffect = finishedWork),
        (updateExpirationTimeBeforeCommit = finishedWork.firstEffect))
      : (updateExpirationTimeBeforeCommit = finishedWork)
    : (updateExpirationTimeBeforeCommit = finishedWork.firstEffect);
  if (null !== updateExpirationTimeBeforeCommit) {
    childExpirationTimeBeforeCommit = executionContext;
    executionContext |= CommitContext;
    var prevInteractions = tracing.__interactionsRef.current;
    tracing.__interactionsRef.current = root.memoizedInteractions;
    ReactCurrentOwner$2.current = null;
    nextEffect = updateExpirationTimeBeforeCommit;
    do
      try {
        for (; null !== nextEffect; ) {
          if (0 !== (nextEffect.effectTag & 256)) {
            var current$$1 = nextEffect.alternate,
              finishedWork$jscomp$0 = nextEffect;
            switch (finishedWork$jscomp$0.tag) {
              case 0:
              case 11:
              case 15:
                commitHookEffectList(
                  UnmountSnapshot,
                  NoEffect$1,
                  finishedWork$jscomp$0
                );
                break;
              case 1:
                if (
                  finishedWork$jscomp$0.effectTag & 256 &&
                  null !== current$$1
                ) {
                  var prevProps = current$$1.memoizedProps,
                    prevState = current$$1.memoizedState,
                    instance = finishedWork$jscomp$0.stateNode,
                    snapshot = instance.getSnapshotBeforeUpdate(
                      finishedWork$jscomp$0.elementType ===
                      finishedWork$jscomp$0.type
                        ? prevProps
                        : resolveDefaultProps(
                            finishedWork$jscomp$0.type,
                            prevProps
                          ),
                      prevState
                    );
                  instance.__reactInternalSnapshotBeforeUpdate = snapshot;
                }
                break;
              case 3:
              case 5:
              case 6:
              case 4:
              case 17:
                break;
              default:
                throw ReactError(
                  Error(
                    "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
                  )
                );
            }
          }
          nextEffect = nextEffect.nextEffect;
        }
      } catch (error) {
        if (null === nextEffect)
          throw ReactError(Error("Should be working on an effect."));
        captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    while (null !== nextEffect);
    commitTime = now$1();
    nextEffect = updateExpirationTimeBeforeCommit;
    do
      try {
        for (current$$1 = renderPriorityLevel; null !== nextEffect; ) {
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
              nextEffect.effectTag &= -3;
              break;
            case 6:
              nextEffect.effectTag &= -3;
              commitWork(nextEffect.alternate, nextEffect);
              break;
            case 4:
              commitWork(nextEffect.alternate, nextEffect);
              break;
            case 8:
              prevProps = nextEffect;
              a: for (
                prevState = prevProps,
                  instance = current$$1,
                  snapshot = prevState;
                ;

              )
                if (
                  (commitUnmount(snapshot, instance), null !== snapshot.child)
                )
                  (snapshot.child.return = snapshot),
                    (snapshot = snapshot.child);
                else {
                  if (snapshot === prevState) break;
                  for (; null === snapshot.sibling; ) {
                    if (
                      null === snapshot.return ||
                      snapshot.return === prevState
                    )
                      break a;
                    snapshot = snapshot.return;
                  }
                  snapshot.sibling.return = snapshot.return;
                  snapshot = snapshot.sibling;
                }
              detachFiber(prevProps);
          }
          nextEffect = nextEffect.nextEffect;
        }
      } catch (error) {
        if (null === nextEffect)
          throw ReactError(Error("Should be working on an effect."));
        captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    while (null !== nextEffect);
    root.current = finishedWork;
    nextEffect = updateExpirationTimeBeforeCommit;
    do
      try {
        for (
          effectTag = root, current$$1$jscomp$0 = expirationTime;
          null !== nextEffect;

        ) {
          var effectTag$jscomp$0 = nextEffect.effectTag;
          if (effectTag$jscomp$0 & 36) {
            prevProps = effectTag;
            var current$$1$jscomp$1 = nextEffect.alternate;
            currentRef = nextEffect;
            current$$1 = current$$1$jscomp$0;
            switch (currentRef.tag) {
              case 0:
              case 11:
              case 15:
                commitHookEffectList(UnmountLayout, MountLayout, currentRef);
                break;
              case 1:
                var instance$jscomp$0 = currentRef.stateNode;
                if (currentRef.effectTag & 4)
                  if (null === current$$1$jscomp$1)
                    instance$jscomp$0.componentDidMount();
                  else {
                    var prevProps$jscomp$0 =
                      currentRef.elementType === currentRef.type
                        ? current$$1$jscomp$1.memoizedProps
                        : resolveDefaultProps(
                            currentRef.type,
                            current$$1$jscomp$1.memoizedProps
                          );
                    instance$jscomp$0.componentDidUpdate(
                      prevProps$jscomp$0,
                      current$$1$jscomp$1.memoizedState,
                      instance$jscomp$0.__reactInternalSnapshotBeforeUpdate
                    );
                  }
                var updateQueue = currentRef.updateQueue;
                null !== updateQueue &&
                  commitUpdateQueue(
                    currentRef,
                    updateQueue,
                    instance$jscomp$0,
                    current$$1
                  );
                break;
              case 3:
                var _updateQueue = currentRef.updateQueue;
                if (null !== _updateQueue) {
                  prevProps = null;
                  if (null !== currentRef.child)
                    switch (currentRef.child.tag) {
                      case 5:
                        prevProps = currentRef.child.stateNode.canonical;
                        break;
                      case 1:
                        prevProps = currentRef.child.stateNode;
                    }
                  commitUpdateQueue(
                    currentRef,
                    _updateQueue,
                    prevProps,
                    current$$1
                  );
                }
                break;
              case 5:
                if (null === current$$1$jscomp$1 && currentRef.effectTag & 4)
                  throw ReactError(
                    Error(
                      "The current renderer does not support mutation. This error is likely caused by a bug in React. Please file an issue."
                    )
                  );
                break;
              case 6:
                break;
              case 4:
                break;
              case 12:
                var onRender = currentRef.memoizedProps.onRender;
                "function" === typeof onRender &&
                  onRender(
                    currentRef.memoizedProps.id,
                    null === current$$1$jscomp$1 ? "mount" : "update",
                    currentRef.actualDuration,
                    currentRef.treeBaseDuration,
                    currentRef.actualStartTime,
                    commitTime,
                    prevProps.memoizedInteractions
                  );
                break;
              case 13:
              case 19:
              case 17:
              case 20:
                break;
              default:
                throw ReactError(
                  Error(
                    "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
                  )
                );
            }
          }
          if (effectTag$jscomp$0 & 128) {
            var ref = nextEffect.ref;
            if (null !== ref) {
              var instance$jscomp$1 = nextEffect.stateNode;
              switch (nextEffect.tag) {
                case 5:
                  var instanceToUse = instance$jscomp$1.canonical;
                  break;
                default:
                  instanceToUse = instance$jscomp$1;
              }
              "function" === typeof ref
                ? ref(instanceToUse)
                : (ref.current = instanceToUse);
            }
          }
          effectTag$jscomp$0 & 512 && (rootDoesHavePassiveEffects = !0);
          nextEffect = nextEffect.nextEffect;
        }
      } catch (error) {
        if (null === nextEffect)
          throw ReactError(Error("Should be working on an effect."));
        captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    while (null !== nextEffect);
    nextEffect = null;
    requestPaint();
    tracing.__interactionsRef.current = prevInteractions;
    executionContext = childExpirationTimeBeforeCommit;
  } else (root.current = finishedWork), (commitTime = now$1());
  if ((effectTag$jscomp$0 = rootDoesHavePassiveEffects))
    (rootDoesHavePassiveEffects = !1),
      (rootWithPendingPassiveEffects = root),
      (pendingPassiveEffectsExpirationTime = expirationTime),
      (pendingPassiveEffectsRenderPriority = renderPriorityLevel);
  else
    for (nextEffect = updateExpirationTimeBeforeCommit; null !== nextEffect; )
      (renderPriorityLevel = nextEffect.nextEffect),
        (nextEffect.nextEffect = null),
        (nextEffect = renderPriorityLevel);
  renderPriorityLevel = root.firstPendingTime;
  if (0 !== renderPriorityLevel) {
    current$$1$jscomp$1 = requestCurrentTime();
    current$$1$jscomp$1 = inferPriorityFromExpirationTime(
      current$$1$jscomp$1,
      renderPriorityLevel
    );
    if (null !== spawnedWorkDuringRender)
      for (
        instance$jscomp$0 = spawnedWorkDuringRender,
          spawnedWorkDuringRender = null,
          prevProps$jscomp$0 = 0;
        prevProps$jscomp$0 < instance$jscomp$0.length;
        prevProps$jscomp$0++
      )
        scheduleInteractions(
          root,
          instance$jscomp$0[prevProps$jscomp$0],
          root.memoizedInteractions
        );
    scheduleCallbackForRoot(root, current$$1$jscomp$1, renderPriorityLevel);
  } else legacyErrorBoundariesThatAlreadyFailed = null;
  effectTag$jscomp$0 || finishPendingInteractions(root, expirationTime);
  "function" === typeof onCommitFiberRoot &&
    onCommitFiberRoot(finishedWork.stateNode, expirationTime);
  1073741823 === renderPriorityLevel
    ? root === rootWithNestedUpdates
      ? nestedUpdateCount++
      : ((nestedUpdateCount = 0), (rootWithNestedUpdates = root))
    : (nestedUpdateCount = 0);
  if (hasUncaughtError)
    throw ((hasUncaughtError = !1),
    (root = firstUncaughtError),
    (firstUncaughtError = null),
    root);
  if ((executionContext & LegacyUnbatchedContext) !== NoContext) return null;
  flushSyncCallbackQueue();
  return null;
}
function flushPassiveEffects() {
  if (null === rootWithPendingPassiveEffects) return !1;
  var root = rootWithPendingPassiveEffects,
    expirationTime = pendingPassiveEffectsExpirationTime,
    renderPriorityLevel = pendingPassiveEffectsRenderPriority;
  rootWithPendingPassiveEffects = null;
  pendingPassiveEffectsExpirationTime = 0;
  pendingPassiveEffectsRenderPriority = 90;
  return runWithPriority$1(
    97 < renderPriorityLevel ? 97 : renderPriorityLevel,
    flushPassiveEffectsImpl.bind(null, root, expirationTime)
  );
}
function flushPassiveEffectsImpl(root, expirationTime) {
  var prevInteractions = tracing.__interactionsRef.current;
  tracing.__interactionsRef.current = root.memoizedInteractions;
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
    throw ReactError(
      Error("Cannot flush passive effects while already rendering.")
    );
  var prevExecutionContext = executionContext;
  executionContext |= CommitContext;
  for (var effect = root.current.firstEffect; null !== effect; ) {
    try {
      var finishedWork = effect;
      if (0 !== (finishedWork.effectTag & 512))
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            commitHookEffectList(UnmountPassive, NoEffect$1, finishedWork),
              commitHookEffectList(NoEffect$1, MountPassive, finishedWork);
        }
    } catch (error) {
      if (null === effect)
        throw ReactError(Error("Should be working on an effect."));
      captureCommitPhaseError(effect, error);
    }
    finishedWork = effect.nextEffect;
    effect.nextEffect = null;
    effect = finishedWork;
  }
  tracing.__interactionsRef.current = prevInteractions;
  finishPendingInteractions(root, expirationTime);
  executionContext = prevExecutionContext;
  flushSyncCallbackQueue();
  return !0;
}
function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
  sourceFiber = createCapturedValue(error, sourceFiber);
  sourceFiber = createRootErrorUpdate(rootFiber, sourceFiber, 1073741823);
  enqueueUpdate(rootFiber, sourceFiber);
  rootFiber = markUpdateTimeFromFiberToRoot(rootFiber, 1073741823);
  null !== rootFiber && scheduleCallbackForRoot(rootFiber, 99, 1073741823);
}
function captureCommitPhaseError(sourceFiber, error) {
  if (3 === sourceFiber.tag)
    captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
  else
    for (var fiber = sourceFiber.return; null !== fiber; ) {
      if (3 === fiber.tag) {
        captureCommitPhaseErrorOnRoot(fiber, sourceFiber, error);
        break;
      } else if (1 === fiber.tag) {
        var instance = fiber.stateNode;
        if (
          "function" === typeof fiber.type.getDerivedStateFromError ||
          ("function" === typeof instance.componentDidCatch &&
            (null === legacyErrorBoundariesThatAlreadyFailed ||
              !legacyErrorBoundariesThatAlreadyFailed.has(instance)))
        ) {
          sourceFiber = createCapturedValue(error, sourceFiber);
          sourceFiber = createClassErrorUpdate(fiber, sourceFiber, 1073741823);
          enqueueUpdate(fiber, sourceFiber);
          fiber = markUpdateTimeFromFiberToRoot(fiber, 1073741823);
          null !== fiber && scheduleCallbackForRoot(fiber, 99, 1073741823);
          break;
        }
      }
      fiber = fiber.return;
    }
}
function pingSuspendedRoot(root, thenable, suspendedTime) {
  var pingCache = root.pingCache;
  null !== pingCache && pingCache.delete(thenable);
  workInProgressRoot === root && renderExpirationTime === suspendedTime
    ? workInProgressRootExitStatus === RootSuspendedWithDelay ||
      (workInProgressRootExitStatus === RootSuspended &&
        1073741823 === workInProgressRootLatestProcessedExpirationTime &&
        now() - globalMostRecentFallbackTime < FALLBACK_THROTTLE_MS)
      ? prepareFreshStack(root, renderExpirationTime)
      : (workInProgressRootHasPendingPing = !0)
    : root.lastPendingTime < suspendedTime ||
      ((thenable = root.pingTime),
      (0 !== thenable && thenable < suspendedTime) ||
        ((root.pingTime = suspendedTime),
        root.finishedExpirationTime === suspendedTime &&
          ((root.finishedExpirationTime = 0), (root.finishedWork = null)),
        (thenable = requestCurrentTime()),
        (thenable = inferPriorityFromExpirationTime(thenable, suspendedTime)),
        scheduleCallbackForRoot(root, thenable, suspendedTime)));
}
function resolveRetryThenable(boundaryFiber, thenable) {
  var retryCache = boundaryFiber.stateNode;
  null !== retryCache && retryCache.delete(thenable);
  retryCache = requestCurrentTime();
  thenable = computeExpirationForFiber(retryCache, boundaryFiber, null);
  retryCache = inferPriorityFromExpirationTime(retryCache, thenable);
  boundaryFiber = markUpdateTimeFromFiberToRoot(boundaryFiber, thenable);
  null !== boundaryFiber &&
    scheduleCallbackForRoot(boundaryFiber, retryCache, thenable);
}
var beginWork$$1 = void 0;
beginWork$$1 = function(current$$1, workInProgress, renderExpirationTime) {
  var updateExpirationTime = workInProgress.expirationTime;
  if (null !== current$$1)
    if (
      current$$1.memoizedProps !== workInProgress.pendingProps ||
      didPerformWorkStackCursor.current
    )
      didReceiveUpdate = !0;
    else {
      if (updateExpirationTime < renderExpirationTime) {
        didReceiveUpdate = !1;
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
          case 12:
            workInProgress.effectTag |= 4;
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
              push(
                suspenseStackCursor,
                suspenseStackCursor.current & SubtreeSuspenseContextMask,
                workInProgress
              );
              workInProgress = bailoutOnAlreadyFinishedWork(
                current$$1,
                workInProgress,
                renderExpirationTime
              );
              return null !== workInProgress ? workInProgress.sibling : null;
            }
            push(
              suspenseStackCursor,
              suspenseStackCursor.current & SubtreeSuspenseContextMask,
              workInProgress
            );
            break;
          case 19:
            updateExpirationTime =
              workInProgress.childExpirationTime >= renderExpirationTime;
            if (0 !== (current$$1.effectTag & 64)) {
              if (updateExpirationTime)
                return updateSuspenseListComponent(
                  current$$1,
                  workInProgress,
                  renderExpirationTime
                );
              workInProgress.effectTag |= 64;
            }
            var renderState = workInProgress.memoizedState;
            null !== renderState &&
              ((renderState.rendering = null), (renderState.tail = null));
            push(
              suspenseStackCursor,
              suspenseStackCursor.current,
              workInProgress
            );
            if (!updateExpirationTime) return null;
        }
        return bailoutOnAlreadyFinishedWork(
          current$$1,
          workInProgress,
          renderExpirationTime
        );
      }
    }
  else didReceiveUpdate = !1;
  workInProgress.expirationTime = 0;
  switch (workInProgress.tag) {
    case 2:
      updateExpirationTime = workInProgress.type;
      null !== current$$1 &&
        ((current$$1.alternate = null),
        (workInProgress.alternate = null),
        (workInProgress.effectTag |= 2));
      current$$1 = workInProgress.pendingProps;
      renderState = getMaskedContext(
        workInProgress,
        contextStackCursor.current
      );
      prepareToReadContext(workInProgress, renderExpirationTime);
      renderState = renderWithHooks(
        null,
        workInProgress,
        updateExpirationTime,
        current$$1,
        renderState,
        renderExpirationTime
      );
      workInProgress.effectTag |= 1;
      if (
        "object" === typeof renderState &&
        null !== renderState &&
        "function" === typeof renderState.render &&
        void 0 === renderState.$$typeof
      ) {
        workInProgress.tag = 1;
        resetHooks();
        if (isContextProvider(updateExpirationTime)) {
          var hasContext = !0;
          pushContextProvider(workInProgress);
        } else hasContext = !1;
        workInProgress.memoizedState =
          null !== renderState.state && void 0 !== renderState.state
            ? renderState.state
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
        renderState.updater = classComponentUpdater;
        workInProgress.stateNode = renderState;
        renderState._reactInternalFiber = workInProgress;
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
            renderState,
            renderExpirationTime
          ),
          (workInProgress = workInProgress.child);
      return workInProgress;
    case 16:
      renderState = workInProgress.elementType;
      null !== current$$1 &&
        ((current$$1.alternate = null),
        (workInProgress.alternate = null),
        (workInProgress.effectTag |= 2));
      current$$1 = workInProgress.pendingProps;
      renderState = readLazyComponentType(renderState);
      workInProgress.type = renderState;
      hasContext = workInProgress.tag = resolveLazyComponentTag(renderState);
      current$$1 = resolveDefaultProps(renderState, current$$1);
      switch (hasContext) {
        case 0:
          workInProgress = updateFunctionComponent(
            null,
            workInProgress,
            renderState,
            current$$1,
            renderExpirationTime
          );
          break;
        case 1:
          workInProgress = updateClassComponent(
            null,
            workInProgress,
            renderState,
            current$$1,
            renderExpirationTime
          );
          break;
        case 11:
          workInProgress = updateForwardRef(
            null,
            workInProgress,
            renderState,
            current$$1,
            renderExpirationTime
          );
          break;
        case 14:
          workInProgress = updateMemoComponent(
            null,
            workInProgress,
            renderState,
            resolveDefaultProps(renderState.type, current$$1),
            updateExpirationTime,
            renderExpirationTime
          );
          break;
        default:
          throw ReactError(
            Error(
              "Element type is invalid. Received a promise that resolves to: " +
                renderState +
                ". Lazy element type must resolve to a class or function."
            )
          );
      }
      return workInProgress;
    case 0:
      return (
        (updateExpirationTime = workInProgress.type),
        (renderState = workInProgress.pendingProps),
        (renderState =
          workInProgress.elementType === updateExpirationTime
            ? renderState
            : resolveDefaultProps(updateExpirationTime, renderState)),
        updateFunctionComponent(
          current$$1,
          workInProgress,
          updateExpirationTime,
          renderState,
          renderExpirationTime
        )
      );
    case 1:
      return (
        (updateExpirationTime = workInProgress.type),
        (renderState = workInProgress.pendingProps),
        (renderState =
          workInProgress.elementType === updateExpirationTime
            ? renderState
            : resolveDefaultProps(updateExpirationTime, renderState)),
        updateClassComponent(
          current$$1,
          workInProgress,
          updateExpirationTime,
          renderState,
          renderExpirationTime
        )
      );
    case 3:
      pushHostRootContext(workInProgress);
      updateExpirationTime = workInProgress.updateQueue;
      if (null === updateExpirationTime)
        throw ReactError(
          Error(
            "If the root does not have an updateQueue, we should have already bailed out. This error is likely caused by a bug in React. Please file an issue."
          )
        );
      renderState = workInProgress.memoizedState;
      renderState = null !== renderState ? renderState.element : null;
      processUpdateQueue(
        workInProgress,
        updateExpirationTime,
        workInProgress.pendingProps,
        null,
        renderExpirationTime
      );
      updateExpirationTime = workInProgress.memoizedState.element;
      updateExpirationTime === renderState
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
          (workInProgress = workInProgress.child));
      return workInProgress;
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
        workInProgress.child
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
        (renderState = workInProgress.pendingProps),
        (renderState =
          workInProgress.elementType === updateExpirationTime
            ? renderState
            : resolveDefaultProps(updateExpirationTime, renderState)),
        updateForwardRef(
          current$$1,
          workInProgress,
          updateExpirationTime,
          renderState,
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
        (workInProgress.effectTag |= 4),
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
        renderState = workInProgress.pendingProps;
        getDerivedStateFromProps = workInProgress.memoizedProps;
        hasContext = renderState.value;
        pushProvider(workInProgress, hasContext);
        if (null !== getDerivedStateFromProps) {
          var oldValue = getDerivedStateFromProps.value;
          hasContext = is(oldValue, hasContext)
            ? 0
            : ("function" === typeof updateExpirationTime._calculateChangedBits
                ? updateExpirationTime._calculateChangedBits(
                    oldValue,
                    hasContext
                  )
                : 1073741823) | 0;
          if (0 === hasContext) {
            if (
              getDerivedStateFromProps.children === renderState.children &&
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
              oldValue = workInProgress.child,
                null !== oldValue && (oldValue.return = workInProgress);
              null !== oldValue;

            ) {
              var list = oldValue.dependencies;
              if (null !== list) {
                getDerivedStateFromProps = oldValue.child;
                for (
                  var dependency = list.firstContext;
                  null !== dependency;

                ) {
                  if (
                    dependency.context === updateExpirationTime &&
                    0 !== (dependency.observedBits & hasContext)
                  ) {
                    1 === oldValue.tag &&
                      ((dependency = createUpdate(renderExpirationTime, null)),
                      (dependency.tag = 2),
                      enqueueUpdate(oldValue, dependency));
                    oldValue.expirationTime < renderExpirationTime &&
                      (oldValue.expirationTime = renderExpirationTime);
                    dependency = oldValue.alternate;
                    null !== dependency &&
                      dependency.expirationTime < renderExpirationTime &&
                      (dependency.expirationTime = renderExpirationTime);
                    scheduleWorkOnParentPath(
                      oldValue.return,
                      renderExpirationTime
                    );
                    list.expirationTime < renderExpirationTime &&
                      (list.expirationTime = renderExpirationTime);
                    break;
                  }
                  dependency = dependency.next;
                }
              } else
                getDerivedStateFromProps =
                  10 === oldValue.tag
                    ? oldValue.type === workInProgress.type
                      ? null
                      : oldValue.child
                    : oldValue.child;
              if (null !== getDerivedStateFromProps)
                getDerivedStateFromProps.return = oldValue;
              else
                for (
                  getDerivedStateFromProps = oldValue;
                  null !== getDerivedStateFromProps;

                ) {
                  if (getDerivedStateFromProps === workInProgress) {
                    getDerivedStateFromProps = null;
                    break;
                  }
                  oldValue = getDerivedStateFromProps.sibling;
                  if (null !== oldValue) {
                    oldValue.return = getDerivedStateFromProps.return;
                    getDerivedStateFromProps = oldValue;
                    break;
                  }
                  getDerivedStateFromProps = getDerivedStateFromProps.return;
                }
              oldValue = getDerivedStateFromProps;
            }
        }
        reconcileChildren(
          current$$1,
          workInProgress,
          renderState.children,
          renderExpirationTime
        );
        workInProgress = workInProgress.child;
      }
      return workInProgress;
    case 9:
      return (
        (renderState = workInProgress.type),
        (hasContext = workInProgress.pendingProps),
        (updateExpirationTime = hasContext.children),
        prepareToReadContext(workInProgress, renderExpirationTime),
        (renderState = readContext(
          renderState,
          hasContext.unstable_observedBits
        )),
        (updateExpirationTime = updateExpirationTime(renderState)),
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
        (renderState = workInProgress.type),
        (hasContext = resolveDefaultProps(
          renderState,
          workInProgress.pendingProps
        )),
        (hasContext = resolveDefaultProps(renderState.type, hasContext)),
        updateMemoComponent(
          current$$1,
          workInProgress,
          renderState,
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
        (renderState = workInProgress.pendingProps),
        (renderState =
          workInProgress.elementType === updateExpirationTime
            ? renderState
            : resolveDefaultProps(updateExpirationTime, renderState)),
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
          renderState,
          renderExpirationTime
        ),
        mountClassInstance(
          workInProgress,
          updateExpirationTime,
          renderState,
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
    case 19:
      return updateSuspenseListComponent(
        current$$1,
        workInProgress,
        renderExpirationTime
      );
  }
  throw ReactError(
    Error(
      "Unknown unit of work tag. This error is likely caused by a bug in React. Please file an issue."
    )
  );
};
function scheduleInteractions(root, expirationTime, interactions) {
  if (0 < interactions.size) {
    var pendingInteractionMap = root.pendingInteractionMap,
      pendingInteractions = pendingInteractionMap.get(expirationTime);
    null != pendingInteractions
      ? interactions.forEach(function(interaction) {
          pendingInteractions.has(interaction) || interaction.__count++;
          pendingInteractions.add(interaction);
        })
      : (pendingInteractionMap.set(expirationTime, new Set(interactions)),
        interactions.forEach(function(interaction) {
          interaction.__count++;
        }));
    pendingInteractionMap = tracing.__subscriberRef.current;
    if (null !== pendingInteractionMap)
      pendingInteractionMap.onWorkScheduled(
        interactions,
        1e3 * expirationTime + root.interactionThreadID
      );
  }
}
function startWorkOnPendingInteractions(root, expirationTime) {
  var interactions = new Set();
  root.pendingInteractionMap.forEach(function(
    scheduledInteractions,
    scheduledExpirationTime
  ) {
    scheduledExpirationTime >= expirationTime &&
      scheduledInteractions.forEach(function(interaction) {
        return interactions.add(interaction);
      });
  });
  root.memoizedInteractions = interactions;
  if (0 < interactions.size) {
    var subscriber = tracing.__subscriberRef.current;
    if (null !== subscriber) {
      root = 1e3 * expirationTime + root.interactionThreadID;
      try {
        subscriber.onWorkStarted(interactions, root);
      } catch (error) {
        scheduleCallback(99, function() {
          throw error;
        });
      }
    }
  }
}
function finishPendingInteractions(root, committedExpirationTime) {
  var earliestRemainingTimeAfterCommit = root.firstPendingTime,
    subscriber = void 0;
  try {
    if (
      ((subscriber = tracing.__subscriberRef.current),
      null !== subscriber && 0 < root.memoizedInteractions.size)
    )
      subscriber.onWorkStopped(
        root.memoizedInteractions,
        1e3 * committedExpirationTime + root.interactionThreadID
      );
  } catch (error) {
    scheduleCallback(99, function() {
      throw error;
    });
  } finally {
    var pendingInteractionMap = root.pendingInteractionMap;
    pendingInteractionMap.forEach(function(
      scheduledInteractions,
      scheduledExpirationTime
    ) {
      scheduledExpirationTime > earliestRemainingTimeAfterCommit &&
        (pendingInteractionMap.delete(scheduledExpirationTime),
        scheduledInteractions.forEach(function(interaction) {
          interaction.__count--;
          if (null !== subscriber && 0 === interaction.__count)
            try {
              subscriber.onInteractionScheduledWorkCompleted(interaction);
            } catch (error) {
              scheduleCallback(99, function() {
                throw error;
              });
            }
        }));
    });
  }
}
var onCommitFiberRoot = null,
  onCommitFiberUnmount = null,
  isDevToolsPresent = "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__;
function injectInternals(internals) {
  if ("undefined" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) return !1;
  var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook.isDisabled || !hook.supportsFiber) return !0;
  try {
    var rendererID = hook.inject(internals);
    onCommitFiberRoot = function(root, expirationTime) {
      try {
        var didError = 64 === (root.current.effectTag & 64),
          currentTime = requestCurrentTime(),
          priorityLevel = inferPriorityFromExpirationTime(
            currentTime,
            expirationTime
          );
        hook.onCommitFiberRoot(rendererID, root, priorityLevel, didError);
      } catch (err) {}
    };
    onCommitFiberUnmount = function(fiber) {
      try {
        hook.onCommitFiberUnmount(rendererID, fiber);
      } catch (err) {}
    };
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
  this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
  this.mode = mode;
  this.effectTag = 0;
  this.lastEffect = this.firstEffect = this.nextEffect = null;
  this.childExpirationTime = this.expirationTime = 0;
  this.alternate = null;
  this.actualDuration = 0;
  this.actualStartTime = -1;
  this.treeBaseDuration = this.selfBaseDuration = 0;
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
      (workInProgress.lastEffect = null),
      (workInProgress.actualDuration = 0),
      (workInProgress.actualStartTime = -1));
  workInProgress.childExpirationTime = current.childExpirationTime;
  workInProgress.expirationTime = current.expirationTime;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  pendingProps = current.dependencies;
  workInProgress.dependencies =
    null === pendingProps
      ? null
      : {
          expirationTime: pendingProps.expirationTime,
          firstContext: pendingProps.firstContext,
          responders: pendingProps.responders
        };
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;
  workInProgress.selfBaseDuration = current.selfBaseDuration;
  workInProgress.treeBaseDuration = current.treeBaseDuration;
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
        fiberTag = 8;
        mode |= 7;
        break;
      case REACT_STRICT_MODE_TYPE:
        fiberTag = 8;
        mode |= 1;
        break;
      case REACT_PROFILER_TYPE:
        return (
          (type = createFiber(12, pendingProps, key, mode | 8)),
          (type.elementType = REACT_PROFILER_TYPE),
          (type.type = REACT_PROFILER_TYPE),
          (type.expirationTime = expirationTime),
          type
        );
      case REACT_SUSPENSE_TYPE:
        return (
          (type = createFiber(13, pendingProps, key, mode)),
          (type.type = REACT_SUSPENSE_TYPE),
          (type.elementType = REACT_SUSPENSE_TYPE),
          (type.expirationTime = expirationTime),
          type
        );
      case REACT_SUSPENSE_LIST_TYPE:
        return (
          (type = createFiber(19, pendingProps, key, mode)),
          (type.elementType = REACT_SUSPENSE_LIST_TYPE),
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
        throw ReactError(
          Error(
            "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " +
              (null == type ? type : typeof type) +
              "."
          )
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
function FiberRootNode(containerInfo, tag, hydrate) {
  this.tag = tag;
  this.current = null;
  this.containerInfo = containerInfo;
  this.pingCache = this.pendingChildren = null;
  this.finishedExpirationTime = 0;
  this.finishedWork = null;
  this.timeoutHandle = -1;
  this.pendingContext = this.context = null;
  this.hydrate = hydrate;
  this.callbackNode = this.firstBatch = null;
  this.pingTime = this.lastPendingTime = this.firstPendingTime = this.callbackExpirationTime = 0;
  this.interactionThreadID = tracing.unstable_getThreadID();
  this.memoizedInteractions = new Set();
  this.pendingInteractionMap = new Map();
}
function findHostInstance(component) {
  var fiber = component._reactInternalFiber;
  if (void 0 === fiber) {
    if ("function" === typeof component.render)
      throw ReactError(Error("Unable to find node on an unmounted component."));
    throw ReactError(
      Error(
        "Argument appears to not be a ReactComponent. Keys: " +
          Object.keys(component)
      )
    );
  }
  component = findCurrentHostFiber(fiber);
  return null === component ? null : component.stateNode;
}
function updateContainer(element, container, parentComponent, callback) {
  var current$$1 = container.current,
    currentTime = requestCurrentTime(),
    suspenseConfig = ReactCurrentBatchConfig.suspense;
  current$$1 = computeExpirationForFiber(
    currentTime,
    current$$1,
    suspenseConfig
  );
  currentTime = container.current;
  a: if (parentComponent) {
    parentComponent = parentComponent._reactInternalFiber;
    b: {
      if (
        2 !== isFiberMountedImpl(parentComponent) ||
        1 !== parentComponent.tag
      )
        throw ReactError(
          Error(
            "Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue."
          )
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
      throw ReactError(
        Error(
          "Found unexpected detached subtree parent. This error is likely caused by a bug in React. Please file an issue."
        )
      );
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
  suspenseConfig = createUpdate(current$$1, suspenseConfig);
  suspenseConfig.payload = { element: element };
  container = void 0 === container ? null : container;
  null !== container && (suspenseConfig.callback = container);
  enqueueUpdate(currentTime, suspenseConfig);
  scheduleUpdateOnFiber(currentTime, current$$1);
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
function _inherits$1(subClass, superClass) {
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
  throw ReactError(
    Error("getInspectorDataForViewTag() is not available in production")
  );
};
var fabricDispatchCommand = nativeFabricUIManager.dispatchCommand;
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
batchedUpdatesImpl = function(fn, a) {
  var prevExecutionContext = executionContext;
  executionContext |= 1;
  try {
    return fn(a);
  } finally {
    (executionContext = prevExecutionContext),
      executionContext === NoContext && flushSyncCallbackQueue();
  }
};
flushDiscreteUpdatesImpl = function() {
  (executionContext & (1 | RenderContext | CommitContext)) === NoContext &&
    (flushPendingDiscreteUpdates(), flushPassiveEffects());
};
var roots = new Map(),
  ReactFabric = {
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
        _inherits$1(ReactNativeComponent, _React$Component);
        ReactNativeComponent.prototype.blur = function() {
          ReactNativePrivateInterface.TextInputState.blurTextInput(
            findNodeHandle(this)
          );
        };
        ReactNativeComponent.prototype.focus = function() {
          ReactNativePrivateInterface.TextInputState.focusTextInput(
            findNodeHandle(this)
          );
        };
        ReactNativeComponent.prototype.measure = function(callback) {
          var maybeInstance = void 0;
          try {
            maybeInstance = findHostInstance(this);
          } catch (error) {}
          null != maybeInstance &&
            (maybeInstance.canonical
              ? nativeFabricUIManager.measure(
                  maybeInstance.node,
                  mountSafeCallback_NOT_REALLY_SAFE(this, callback)
                )
              : ReactNativePrivateInterface.UIManager.measure(
                  findNodeHandle(this),
                  mountSafeCallback_NOT_REALLY_SAFE(this, callback)
                ));
        };
        ReactNativeComponent.prototype.measureInWindow = function(callback) {
          var maybeInstance = void 0;
          try {
            maybeInstance = findHostInstance(this);
          } catch (error) {}
          null != maybeInstance &&
            (maybeInstance.canonical
              ? nativeFabricUIManager.measureInWindow(
                  maybeInstance.node,
                  mountSafeCallback_NOT_REALLY_SAFE(this, callback)
                )
              : ReactNativePrivateInterface.UIManager.measureInWindow(
                  findNodeHandle(this),
                  mountSafeCallback_NOT_REALLY_SAFE(this, callback)
                ));
        };
        ReactNativeComponent.prototype.measureLayout = function(
          relativeToNativeNode,
          onSuccess,
          onFail
        ) {
          var maybeInstance = void 0;
          try {
            maybeInstance = findHostInstance(this);
          } catch (error) {}
          null == maybeInstance ||
            maybeInstance.canonical ||
            ((maybeInstance = void 0),
            "number" === typeof relativeToNativeNode
              ? (maybeInstance = relativeToNativeNode)
              : relativeToNativeNode._nativeTag &&
                (maybeInstance = relativeToNativeNode._nativeTag),
            null != maybeInstance &&
              ReactNativePrivateInterface.UIManager.measureLayout(
                findNodeHandle(this),
                maybeInstance,
                mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
                mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess)
              ));
        };
        ReactNativeComponent.prototype.setNativeProps = function(nativeProps) {
          var maybeInstance = void 0;
          try {
            maybeInstance = findHostInstance(this);
          } catch (error) {}
          if (null != maybeInstance && !maybeInstance.canonical) {
            var nativeTag =
              maybeInstance._nativeTag || maybeInstance.canonical._nativeTag;
            maybeInstance =
              maybeInstance.viewConfig || maybeInstance.canonical.viewConfig;
            nativeProps = diffProperties(
              null,
              emptyObject,
              nativeProps,
              maybeInstance.validAttributes
            );
            null != nativeProps &&
              ReactNativePrivateInterface.UIManager.updateView(
                nativeTag,
                maybeInstance.uiViewClassName,
                nativeProps
              );
          }
        };
        return ReactNativeComponent;
      })(React.Component);
    })(findNodeHandle, findHostInstance),
    findNodeHandle: findNodeHandle,
    setNativeProps: function() {},
    dispatchCommand: function(handle, command, args) {
      null != handle._nativeTag &&
        null != handle._internalInstanceHandle &&
        fabricDispatchCommand(
          handle._internalInstanceHandle.stateNode.node,
          command,
          args
        );
    },
    render: function(element, containerTag, callback) {
      var root = roots.get(containerTag);
      if (!root) {
        root = new FiberRootNode(containerTag, 0, !1);
        var uninitializedFiber = 0;
        isDevToolsPresent && (uninitializedFiber |= 8);
        uninitializedFiber = createFiber(3, null, null, uninitializedFiber);
        root.current = uninitializedFiber;
        uninitializedFiber.stateNode = root;
        roots.set(containerTag, root);
      }
      updateContainer(element, root, null, callback);
      a: if (((element = root.current), element.child))
        switch (element.child.tag) {
          case 5:
            element = element.child.stateNode.canonical;
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
    createPortal: function(children, containerTag) {
      return createPortal(
        children,
        containerTag,
        null,
        2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null
      );
    },
    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
      NativeMethodsMixin: (function(findNodeHandle, findHostInstance) {
        return {
          measure: function(callback) {
            var maybeInstance = void 0;
            try {
              maybeInstance = findHostInstance(this);
            } catch (error) {}
            null != maybeInstance &&
              (maybeInstance.canonical
                ? nativeFabricUIManager.measure(
                    maybeInstance.node,
                    mountSafeCallback_NOT_REALLY_SAFE(this, callback)
                  )
                : ReactNativePrivateInterface.UIManager.measure(
                    findNodeHandle(this),
                    mountSafeCallback_NOT_REALLY_SAFE(this, callback)
                  ));
          },
          measureInWindow: function(callback) {
            var maybeInstance = void 0;
            try {
              maybeInstance = findHostInstance(this);
            } catch (error) {}
            null != maybeInstance &&
              (maybeInstance.canonical
                ? nativeFabricUIManager.measureInWindow(
                    maybeInstance.node,
                    mountSafeCallback_NOT_REALLY_SAFE(this, callback)
                  )
                : ReactNativePrivateInterface.UIManager.measureInWindow(
                    findNodeHandle(this),
                    mountSafeCallback_NOT_REALLY_SAFE(this, callback)
                  ));
          },
          measureLayout: function(relativeToNativeNode, onSuccess, onFail) {
            var maybeInstance = void 0;
            try {
              maybeInstance = findHostInstance(this);
            } catch (error) {}
            null == maybeInstance ||
              maybeInstance.canonical ||
              ((maybeInstance = void 0),
              "number" === typeof relativeToNativeNode
                ? (maybeInstance = relativeToNativeNode)
                : relativeToNativeNode._nativeTag &&
                  (maybeInstance = relativeToNativeNode._nativeTag),
              null != maybeInstance &&
                ReactNativePrivateInterface.UIManager.measureLayout(
                  findNodeHandle(this),
                  maybeInstance,
                  mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
                  mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess)
                ));
          },
          setNativeProps: function(nativeProps) {
            var maybeInstance = void 0;
            try {
              maybeInstance = findHostInstance(this);
            } catch (error) {}
            if (null != maybeInstance && !maybeInstance.canonical) {
              var nativeTag =
                maybeInstance._nativeTag || maybeInstance.canonical._nativeTag;
              maybeInstance =
                maybeInstance.viewConfig || maybeInstance.canonical.viewConfig;
              nativeProps = diffProperties(
                null,
                emptyObject,
                nativeProps,
                maybeInstance.validAttributes
              );
              null != nativeProps &&
                ReactNativePrivateInterface.UIManager.updateView(
                  nativeTag,
                  maybeInstance.uiViewClassName,
                  nativeProps
                );
            }
          },
          focus: function() {
            ReactNativePrivateInterface.TextInputState.focusTextInput(
              findNodeHandle(this)
            );
          },
          blur: function() {
            ReactNativePrivateInterface.TextInputState.blurTextInput(
              findNodeHandle(this)
            );
          }
        };
      })(findNodeHandle, findHostInstance)
    }
  };
(function(devToolsConfig) {
  var findFiberByHostInstance = devToolsConfig.findFiberByHostInstance;
  return injectInternals(
    Object.assign({}, devToolsConfig, {
      overrideHookState: null,
      overrideProps: null,
      setSuspenseHandler: null,
      scheduleUpdate: null,
      currentDispatcherRef: ReactSharedInternals.ReactCurrentDispatcher,
      findHostInstanceByFiber: function(fiber) {
        fiber = findCurrentHostFiber(fiber);
        return null === fiber ? null : fiber.stateNode;
      },
      findFiberByHostInstance: function(instance) {
        return findFiberByHostInstance
          ? findFiberByHostInstance(instance)
          : null;
      },
      findHostInstancesForRefresh: null,
      scheduleRefresh: null,
      scheduleRoot: null,
      setRefreshHandler: null,
      getCurrentFiber: null
    })
  );
})({
  findFiberByHostInstance: getInstanceFromInstance,
  getInspectorDataForViewTag: getInspectorDataForViewTag,
  bundleType: 0,
  version: "16.8.6",
  rendererPackageName: "react-native-renderer"
});
var ReactFabric$2 = { default: ReactFabric },
  ReactFabric$3 = (ReactFabric$2 && ReactFabric) || ReactFabric$2;
module.exports = ReactFabric$3.default || ReactFabric$3;
