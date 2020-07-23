/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @providesModule ReactNativeRenderer-prod
 * @preventMunge
 * @generated
 */

"use strict";
require("react-native/Libraries/ReactPrivate/ReactNativePrivateInitializeCore");
var ReactNativePrivateInterface = require("react-native/Libraries/ReactPrivate/ReactNativePrivateInterface"),
  React = require("react"),
  Scheduler = require("scheduler");
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
      throw Error(
        "clearCaughtError was called but no error was captured. This error is likely caused by a bug in React. Please file an issue."
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
    throw Error("executeDirectDispatch(...): Invalid `event`.");
  event.currentTarget = dispatchListener
    ? getNodeFromInstance(dispatchInstance)
    : null;
  dispatchListener = dispatchListener ? dispatchListener(event) : null;
  event.currentTarget = null;
  event._dispatchListeners = null;
  event._dispatchInstances = null;
  return dispatchListener;
}
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
    case "onMouseEnter":
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
    throw Error(
      "Expected `" +
        registrationName +
        "` listener to be a function, instead got a value of `" +
        typeof listener +
        "` type."
    );
  return listener;
}
function accumulateInto(current, next) {
  if (null == next)
    throw Error(
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
    throw Error(
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
  if (null == _ref) throw Error("Touch object is missing identifier.");
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
  touchRecord &&
    ((touchRecord.touchActive = !0),
    (touchRecord.previousPageX = touchRecord.currentPageX),
    (touchRecord.previousPageY = touchRecord.currentPageY),
    (touchRecord.previousTimeStamp = touchRecord.currentTimeStamp),
    (touchRecord.currentPageX = touch.pageX),
    (touchRecord.currentPageY = touch.pageY),
    (touchRecord.currentTimeStamp = timestampForTouch(touch)),
    (touchHistory.mostRecentTimeStamp = timestampForTouch(touch)));
}
function recordTouchEnd(touch) {
  var touchRecord = touchBank[getTouchIdentifier(touch)];
  touchRecord &&
    ((touchRecord.touchActive = !1),
    (touchRecord.previousPageX = touchRecord.currentPageX),
    (touchRecord.previousPageY = touchRecord.currentPageY),
    (touchRecord.previousTimeStamp = touchRecord.currentTimeStamp),
    (touchRecord.currentPageX = touch.pageX),
    (touchRecord.currentPageY = touch.pageY),
    (touchRecord.currentTimeStamp = timestampForTouch(touch)),
    (touchHistory.mostRecentTimeStamp = timestampForTouch(touch)));
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
    throw Error(
      "accumulate(...): Accumulated items must not be null or undefined."
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
        else return null;
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
      targetInst =
        responderInst &&
        ("topTouchEnd" === topLevelType || "topTouchCancel" === topLevelType);
      if (
        (shouldSetEventType = shouldSetEventType
          ? eventTypes.responderStart
          : JSCompiler_temp
          ? eventTypes.responderMove
          : targetInst
          ? eventTypes.responderEnd
          : null)
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
          responderInst &&
          !shouldSetEventType &&
          ("topTouchEnd" === topLevelType || "topTouchCancel" === topLevelType))
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
          (JSCompiler_temp$jscomp$0 = accumulate(
            JSCompiler_temp$jscomp$0,
            nativeEvent
          )),
          changeResponder(null);
      return JSCompiler_temp$jscomp$0;
    },
    GlobalResponderHandler: null,
    injection: {
      injectGlobalResponderHandler: function(GlobalResponderHandler) {
        ResponderEventPlugin.GlobalResponderHandler = GlobalResponderHandler;
      }
    }
  },
  eventPluginOrder = null,
  namesToPlugins = {};
function recomputePluginOrdering() {
  if (eventPluginOrder)
    for (var pluginName in namesToPlugins) {
      var pluginModule = namesToPlugins[pluginName],
        pluginIndex = eventPluginOrder.indexOf(pluginName);
      if (!(-1 < pluginIndex))
        throw Error(
          "EventPluginRegistry: Cannot inject event plugins that do not exist in the plugin ordering, `" +
            pluginName +
            "`."
        );
      if (!plugins[pluginIndex]) {
        if (!pluginModule.extractEvents)
          throw Error(
            "EventPluginRegistry: Event plugins must implement an `extractEvents` method, but `" +
              pluginName +
              "` does not."
          );
        plugins[pluginIndex] = pluginModule;
        pluginIndex = pluginModule.eventTypes;
        for (var eventName in pluginIndex) {
          var JSCompiler_inline_result = void 0;
          var dispatchConfig = pluginIndex[eventName],
            pluginModule$jscomp$0 = pluginModule,
            eventName$jscomp$0 = eventName;
          if (eventNameDispatchConfigs.hasOwnProperty(eventName$jscomp$0))
            throw Error(
              "EventPluginRegistry: More than one plugin attempted to publish the same event name, `" +
                eventName$jscomp$0 +
                "`."
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
function publishRegistrationName(registrationName, pluginModule) {
  if (registrationNameModules[registrationName])
    throw Error(
      "EventPluginRegistry: More than one plugin attempted to publish the same registration name, `" +
        registrationName +
        "`."
    );
  registrationNameModules[registrationName] = pluginModule;
}
var plugins = [],
  eventNameDispatchConfigs = {},
  registrationNameModules = {},
  customBubblingEventTypes =
    ReactNativePrivateInterface.ReactNativeViewConfigRegistry
      .customBubblingEventTypes,
  customDirectEventTypes =
    ReactNativePrivateInterface.ReactNativeViewConfigRegistry
      .customDirectEventTypes;
if (eventPluginOrder)
  throw Error(
    "EventPluginRegistry: Cannot inject event plugin ordering more than once. You are likely trying to load more than one copy of React."
  );
eventPluginOrder = Array.prototype.slice.call([
  "ResponderEventPlugin",
  "ReactNativeBridgeEventPlugin"
]);
recomputePluginOrdering();
var injectedNamesToPlugins$jscomp$inline_94 = {
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
          throw Error(
            'Unsupported top level event type "' + topLevelType + '" dispatched'
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
  },
  isOrderingDirty$jscomp$inline_95 = !1,
  pluginName$jscomp$inline_96;
for (pluginName$jscomp$inline_96 in injectedNamesToPlugins$jscomp$inline_94)
  if (
    injectedNamesToPlugins$jscomp$inline_94.hasOwnProperty(
      pluginName$jscomp$inline_96
    )
  ) {
    var pluginModule$jscomp$inline_97 =
      injectedNamesToPlugins$jscomp$inline_94[pluginName$jscomp$inline_96];
    if (
      !namesToPlugins.hasOwnProperty(pluginName$jscomp$inline_96) ||
      namesToPlugins[pluginName$jscomp$inline_96] !==
        pluginModule$jscomp$inline_97
    ) {
      if (namesToPlugins[pluginName$jscomp$inline_96])
        throw Error(
          "EventPluginRegistry: Cannot inject two different event plugins using the same name, `" +
            pluginName$jscomp$inline_96 +
            "`."
        );
      namesToPlugins[
        pluginName$jscomp$inline_96
      ] = pluginModule$jscomp$inline_97;
      isOrderingDirty$jscomp$inline_95 = !0;
    }
  }
isOrderingDirty$jscomp$inline_95 && recomputePluginOrdering();
var instanceCache = new Map(),
  instanceProps = new Map();
function getInstanceFromTag(tag) {
  return instanceCache.get(tag) || null;
}
function batchedUpdatesImpl(fn, bookkeeping) {
  return fn(bookkeeping);
}
var isInsideEventHandler = !1;
function batchedUpdates(fn, bookkeeping) {
  if (isInsideEventHandler) return fn(bookkeeping);
  isInsideEventHandler = !0;
  try {
    return batchedUpdatesImpl(fn, bookkeeping);
  } finally {
    isInsideEventHandler = !1;
  }
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
var EMPTY_NATIVE_EVENT = {};
function _receiveRootNodeIDEvent(rootNodeID, topLevelType, nativeEventParam) {
  var nativeEvent = nativeEventParam || EMPTY_NATIVE_EVENT,
    inst = getInstanceFromTag(rootNodeID),
    target = null;
  null != inst && (target = inst.stateNode);
  batchedUpdates(function() {
    var events = target;
    for (var events$jscomp$0 = null, i = 0; i < plugins.length; i++) {
      var possiblePlugin = plugins[i];
      possiblePlugin &&
        (possiblePlugin = possiblePlugin.extractEvents(
          topLevelType,
          inst,
          nativeEvent,
          events,
          1
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
        throw Error(
          "processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented."
        );
      if (hasRethrowError)
        throw ((events = rethrowError),
        (hasRethrowError = !1),
        (rethrowError = null),
        events);
    }
  });
}
ReactNativePrivateInterface.RCTEventEmitter.register({
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
  return instanceProps.get(stateNode._nativeTag) || null;
};
getInstanceFromNode = getInstanceFromTag;
getNodeFromInstance = function(inst) {
  inst = inst.stateNode;
  var tag = inst._nativeTag;
  void 0 === tag && ((inst = inst.canonical), (tag = inst._nativeTag));
  if (!tag) throw Error("All native instances should have a tag.");
  return inst;
};
ResponderEventPlugin.injection.injectGlobalResponderHandler({
  onChange: function(from, to, blockNativeResponder) {
    null !== to
      ? ReactNativePrivateInterface.UIManager.setJSResponder(
          to.stateNode._nativeTag,
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
  REACT_LAZY_TYPE = hasSymbol ? Symbol.for("react.lazy") : 60116,
  REACT_BLOCK_TYPE = hasSymbol ? Symbol.for("react.block") : 60121,
  MAYBE_ITERATOR_SYMBOL = "function" === typeof Symbol && Symbol.iterator;
function getIteratorFn(maybeIterable) {
  if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
  maybeIterable =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable["@@iterator"];
  return "function" === typeof maybeIterable ? maybeIterable : null;
}
function initializeLazyComponentType(lazyComponent) {
  if (-1 === lazyComponent._status) {
    var ctor = lazyComponent._result;
    ctor || (ctor = lazyComponent._ctor);
    ctor = ctor();
    lazyComponent._status = 0;
    lazyComponent._result = ctor;
    ctor.then(
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
  }
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
        return (type.displayName || "Context") + ".Consumer";
      case REACT_PROVIDER_TYPE:
        return (type._context.displayName || "Context") + ".Provider";
      case REACT_FORWARD_REF_TYPE:
        var innerType = type.render;
        innerType = innerType.displayName || innerType.name || "";
        return (
          type.displayName ||
          ("" !== innerType ? "ForwardRef(" + innerType + ")" : "ForwardRef")
        );
      case REACT_MEMO_TYPE:
        return getComponentName(type.type);
      case REACT_BLOCK_TYPE:
        return getComponentName(type.render);
      case REACT_LAZY_TYPE:
        if ((type = 1 === type._status ? type._result : null))
          return getComponentName(type);
    }
  return null;
}
function getNearestMountedFiber(fiber) {
  var node = fiber,
    nearestMounted = fiber;
  if (fiber.alternate) for (; node.return; ) node = node.return;
  else {
    fiber = node;
    do
      (node = fiber),
        0 !== (node.effectTag & 1026) && (nearestMounted = node.return),
        (fiber = node.return);
    while (fiber);
  }
  return 3 === node.tag ? nearestMounted : null;
}
function assertIsMounted(fiber) {
  if (getNearestMountedFiber(fiber) !== fiber)
    throw Error("Unable to find node on an unmounted component.");
}
function findCurrentFiberUsingSlowPath(fiber) {
  var alternate = fiber.alternate;
  if (!alternate) {
    alternate = getNearestMountedFiber(fiber);
    if (null === alternate)
      throw Error("Unable to find node on an unmounted component.");
    return alternate !== fiber ? null : fiber;
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
      throw Error("Unable to find node on an unmounted component.");
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
          throw Error(
            "Child was not found in either parent set. This indicates a bug in React related to the return pointer. Please file an issue."
          );
      }
    }
    if (a.alternate !== b)
      throw Error(
        "Return fibers should always be each others' alternates. This error is likely caused by a bug in React. Please file an issue."
      );
  }
  if (3 !== a.tag)
    throw Error("Unable to find node on an unmounted component.");
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
  removedKeyCount = 0,
  deepDifferOptions = { unsafelyIgnoreFunctions: !0 };
function defaultDiffer(prevProp, nextProp) {
  return "object" !== typeof nextProp || null === nextProp
    ? !0
    : ReactNativePrivateInterface.deepDiffer(
        prevProp,
        nextProp,
        deepDifferOptions
      );
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
          defaultDiffer(prevProp, nextProp) &&
            ((updatePayload || (updatePayload = {}))[propKey] = nextProp);
        else if (
          "function" === typeof attributeConfig.diff ||
          "function" === typeof attributeConfig.process
        ) {
          if (
            void 0 === prevProp ||
            ("function" === typeof attributeConfig.diff
              ? attributeConfig.diff(prevProp, nextProp)
              : defaultDiffer(prevProp, nextProp))
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
    this._nativeTag = tag;
    this._children = [];
    this.viewConfig = viewConfig;
  }
  var _proto = ReactNativeFiberHostComponent.prototype;
  _proto.blur = function() {
    ReactNativePrivateInterface.TextInputState.blurTextInput(this);
  };
  _proto.focus = function() {
    ReactNativePrivateInterface.TextInputState.focusTextInput(this);
  };
  _proto.measure = function(callback) {
    ReactNativePrivateInterface.UIManager.measure(
      this._nativeTag,
      mountSafeCallback_NOT_REALLY_SAFE(this, callback)
    );
  };
  _proto.measureInWindow = function(callback) {
    ReactNativePrivateInterface.UIManager.measureInWindow(
      this._nativeTag,
      mountSafeCallback_NOT_REALLY_SAFE(this, callback)
    );
  };
  _proto.measureLayout = function(relativeToNativeNode, onSuccess, onFail) {
    if ("number" === typeof relativeToNativeNode)
      var relativeNode = relativeToNativeNode;
    else
      relativeToNativeNode._nativeTag &&
        (relativeNode = relativeToNativeNode._nativeTag);
    null != relativeNode &&
      ReactNativePrivateInterface.UIManager.measureLayout(
        this._nativeTag,
        relativeNode,
        mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
        mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess)
      );
  };
  _proto.setNativeProps = function(nativeProps) {
    nativeProps = diffProperties(
      null,
      emptyObject,
      nativeProps,
      this.viewConfig.validAttributes
    );
    null != nativeProps &&
      ReactNativePrivateInterface.UIManager.updateView(
        this._nativeTag,
        this.viewConfig.uiViewClassName,
        nativeProps
      );
  };
  return ReactNativeFiberHostComponent;
})();
function shim() {
  throw Error(
    "The current renderer does not support hydration. This error is likely caused by a bug in React. Please file an issue."
  );
}
var getViewConfigForType =
    ReactNativePrivateInterface.ReactNativeViewConfigRegistry.get,
  UPDATE_SIGNAL = {},
  nextReactTag = 3;
function allocateTag() {
  var tag = nextReactTag;
  1 === tag % 10 && (tag += 2);
  nextReactTag = tag + 2;
  return tag;
}
function recursivelyUncacheFiberNode(node) {
  if ("number" === typeof node)
    instanceCache.delete(node), instanceProps.delete(node);
  else {
    var tag = node._nativeTag;
    instanceCache.delete(tag);
    instanceProps.delete(tag);
    node._children.forEach(recursivelyUncacheFiberNode);
  }
}
function finalizeInitialChildren(parentInstance) {
  if (0 === parentInstance._children.length) return !1;
  var nativeTags = parentInstance._children.map(function(child) {
    return "number" === typeof child ? child : child._nativeTag;
  });
  ReactNativePrivateInterface.UIManager.setChildren(
    parentInstance._nativeTag,
    nativeTags
  );
  return !1;
}
var scheduleTimeout = setTimeout,
  cancelTimeout = clearTimeout,
  valueStack = [],
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
function popContext() {
  pop(didPerformWorkStackCursor);
  pop(contextStackCursor);
}
function pushTopLevelContextObject(fiber, context, didChange) {
  if (contextStackCursor.current !== emptyContextObject)
    throw Error(
      "Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue."
    );
  push(contextStackCursor, context);
  push(didPerformWorkStackCursor, didChange);
}
function processChildContext(fiber, type, parentContext) {
  var instance = fiber.stateNode;
  fiber = type.childContextTypes;
  if ("function" !== typeof instance.getChildContext) return parentContext;
  instance = instance.getChildContext();
  for (var contextKey in instance)
    if (!(contextKey in fiber))
      throw Error(
        (getComponentName(type) || "Unknown") +
          '.getChildContext(): key "' +
          contextKey +
          '" is not defined in childContextTypes.'
      );
  return Object.assign({}, parentContext, {}, instance);
}
function pushContextProvider(workInProgress) {
  workInProgress =
    ((workInProgress = workInProgress.stateNode) &&
      workInProgress.__reactInternalMemoizedMergedChildContext) ||
    emptyContextObject;
  previousContext = contextStackCursor.current;
  push(contextStackCursor, workInProgress);
  push(didPerformWorkStackCursor, didPerformWorkStackCursor.current);
  return !0;
}
function invalidateContextProvider(workInProgress, type, didChange) {
  var instance = workInProgress.stateNode;
  if (!instance)
    throw Error(
      "Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue."
    );
  didChange
    ? ((workInProgress = processChildContext(
        workInProgress,
        type,
        previousContext
      )),
      (instance.__reactInternalMemoizedMergedChildContext = workInProgress),
      pop(didPerformWorkStackCursor),
      pop(contextStackCursor),
      push(contextStackCursor, workInProgress))
    : pop(didPerformWorkStackCursor);
  push(didPerformWorkStackCursor, didChange);
}
var Scheduler_runWithPriority = Scheduler.unstable_runWithPriority,
  Scheduler_scheduleCallback = Scheduler.unstable_scheduleCallback,
  Scheduler_cancelCallback = Scheduler.unstable_cancelCallback,
  Scheduler_requestPaint = Scheduler.unstable_requestPaint,
  Scheduler_now = Scheduler.unstable_now,
  Scheduler_getCurrentPriorityLevel =
    Scheduler.unstable_getCurrentPriorityLevel,
  Scheduler_ImmediatePriority = Scheduler.unstable_ImmediatePriority,
  Scheduler_UserBlockingPriority = Scheduler.unstable_UserBlockingPriority,
  Scheduler_NormalPriority = Scheduler.unstable_NormalPriority,
  Scheduler_LowPriority = Scheduler.unstable_LowPriority,
  Scheduler_IdlePriority = Scheduler.unstable_IdlePriority,
  fakeCallbackNode = {},
  shouldYield = Scheduler.unstable_shouldYield,
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
      throw Error("Unknown priority level.");
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
      throw Error("Unknown priority level.");
  }
}
function runWithPriority(reactPriorityLevel, fn) {
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
  if (null !== immediateQueueCallbackNode) {
    var node = immediateQueueCallbackNode;
    immediateQueueCallbackNode = null;
    Scheduler_cancelCallback(node);
  }
  flushSyncCallbackQueueImpl();
}
function flushSyncCallbackQueueImpl() {
  if (!isFlushingSyncQueue && null !== syncQueue) {
    isFlushingSyncQueue = !0;
    var i = 0;
    try {
      var queue = syncQueue;
      runWithPriority(99, function() {
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
function is(x, y) {
  return (x === y && (0 !== x || 1 / x === 1 / y)) || (x !== x && y !== y);
}
var objectIs = "function" === typeof Object.is ? Object.is : is,
  hasOwnProperty = Object.prototype.hasOwnProperty;
function shallowEqual(objA, objB) {
  if (objectIs(objA, objB)) return !0;
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
      !objectIs(objA[keysA[keysB]], objB[keysA[keysB]])
    )
      return !1;
  return !0;
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
var valueCursor = { current: null },
  currentlyRenderingFiber = null,
  lastContextDependency = null,
  lastContextWithAllBitsObserved = null;
function resetContextDependencies() {
  lastContextWithAllBitsObserved = lastContextDependency = currentlyRenderingFiber = null;
}
function popProvider(providerFiber) {
  var currentValue = valueCursor.current;
  pop(valueCursor);
  providerFiber.type._context._currentValue = currentValue;
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
        throw Error(
          "Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."
        );
      lastContextDependency = observedBits;
      currentlyRenderingFiber.dependencies = {
        expirationTime: 0,
        firstContext: observedBits,
        responders: null
      };
    } else lastContextDependency = lastContextDependency.next = observedBits;
  }
  return context._currentValue;
}
var hasForceUpdate = !1;
function initializeUpdateQueue(fiber) {
  fiber.updateQueue = {
    baseState: fiber.memoizedState,
    baseQueue: null,
    shared: { pending: null },
    effects: null
  };
}
function cloneUpdateQueue(current, workInProgress) {
  current = current.updateQueue;
  workInProgress.updateQueue === current &&
    (workInProgress.updateQueue = {
      baseState: current.baseState,
      baseQueue: current.baseQueue,
      shared: current.shared,
      effects: current.effects
    });
}
function createUpdate(expirationTime, suspenseConfig) {
  expirationTime = {
    expirationTime: expirationTime,
    suspenseConfig: suspenseConfig,
    tag: 0,
    payload: null,
    callback: null,
    next: null
  };
  return (expirationTime.next = expirationTime);
}
function enqueueUpdate(fiber, update) {
  fiber = fiber.updateQueue;
  if (null !== fiber) {
    fiber = fiber.shared;
    var pending = fiber.pending;
    null === pending
      ? (update.next = update)
      : ((update.next = pending.next), (pending.next = update));
    fiber.pending = update;
  }
}
function enqueueCapturedUpdate(workInProgress, update) {
  var current = workInProgress.alternate;
  null !== current && cloneUpdateQueue(current, workInProgress);
  workInProgress = workInProgress.updateQueue;
  current = workInProgress.baseQueue;
  null === current
    ? ((workInProgress.baseQueue = update.next = update),
      (update.next = update))
    : ((update.next = current.next), (current.next = update));
}
function processUpdateQueue(
  workInProgress$jscomp$0,
  props,
  instance,
  renderExpirationTime
) {
  var queue = workInProgress$jscomp$0.updateQueue;
  hasForceUpdate = !1;
  var baseQueue = queue.baseQueue,
    pendingQueue = queue.shared.pending;
  if (null !== pendingQueue) {
    if (null !== baseQueue) {
      var baseFirst = baseQueue.next;
      baseQueue.next = pendingQueue.next;
      pendingQueue.next = baseFirst;
    }
    baseQueue = pendingQueue;
    queue.shared.pending = null;
    baseFirst = workInProgress$jscomp$0.alternate;
    null !== baseFirst &&
      ((baseFirst = baseFirst.updateQueue),
      null !== baseFirst && (baseFirst.baseQueue = pendingQueue));
  }
  if (null !== baseQueue) {
    baseFirst = baseQueue.next;
    var newState = queue.baseState,
      newExpirationTime = 0,
      newBaseState = null,
      newBaseQueueFirst = null,
      newBaseQueueLast = null;
    if (null !== baseFirst) {
      var update = baseFirst;
      do {
        pendingQueue = update.expirationTime;
        if (pendingQueue < renderExpirationTime) {
          var clone = {
            expirationTime: update.expirationTime,
            suspenseConfig: update.suspenseConfig,
            tag: update.tag,
            payload: update.payload,
            callback: update.callback,
            next: null
          };
          null === newBaseQueueLast
            ? ((newBaseQueueFirst = newBaseQueueLast = clone),
              (newBaseState = newState))
            : (newBaseQueueLast = newBaseQueueLast.next = clone);
          pendingQueue > newExpirationTime &&
            (newExpirationTime = pendingQueue);
        } else {
          null !== newBaseQueueLast &&
            (newBaseQueueLast = newBaseQueueLast.next = {
              expirationTime: 1073741823,
              suspenseConfig: update.suspenseConfig,
              tag: update.tag,
              payload: update.payload,
              callback: update.callback,
              next: null
            });
          markRenderEventTimeAndConfig(pendingQueue, update.suspenseConfig);
          a: {
            var workInProgress = workInProgress$jscomp$0,
              update$jscomp$0 = update;
            pendingQueue = props;
            clone = instance;
            switch (update$jscomp$0.tag) {
              case 1:
                workInProgress = update$jscomp$0.payload;
                if ("function" === typeof workInProgress) {
                  newState = workInProgress.call(clone, newState, pendingQueue);
                  break a;
                }
                newState = workInProgress;
                break a;
              case 3:
                workInProgress.effectTag =
                  (workInProgress.effectTag & -4097) | 64;
              case 0:
                workInProgress = update$jscomp$0.payload;
                pendingQueue =
                  "function" === typeof workInProgress
                    ? workInProgress.call(clone, newState, pendingQueue)
                    : workInProgress;
                if (null === pendingQueue || void 0 === pendingQueue) break a;
                newState = Object.assign({}, newState, pendingQueue);
                break a;
              case 2:
                hasForceUpdate = !0;
            }
          }
          null !== update.callback &&
            ((workInProgress$jscomp$0.effectTag |= 32),
            (pendingQueue = queue.effects),
            null === pendingQueue
              ? (queue.effects = [update])
              : pendingQueue.push(update));
        }
        update = update.next;
        if (null === update || update === baseFirst)
          if (((pendingQueue = queue.shared.pending), null === pendingQueue))
            break;
          else
            (update = baseQueue.next = pendingQueue.next),
              (pendingQueue.next = baseFirst),
              (queue.baseQueue = baseQueue = pendingQueue),
              (queue.shared.pending = null);
      } while (1);
    }
    null === newBaseQueueLast
      ? (newBaseState = newState)
      : (newBaseQueueLast.next = newBaseQueueFirst);
    queue.baseState = newBaseState;
    queue.baseQueue = newBaseQueueLast;
    markUnprocessedUpdateTime(newExpirationTime);
    workInProgress$jscomp$0.expirationTime = newExpirationTime;
    workInProgress$jscomp$0.memoizedState = newState;
  }
}
function commitUpdateQueue(finishedWork, finishedQueue, instance) {
  finishedWork = finishedQueue.effects;
  finishedQueue.effects = null;
  if (null !== finishedWork)
    for (
      finishedQueue = 0;
      finishedQueue < finishedWork.length;
      finishedQueue++
    ) {
      var effect = finishedWork[finishedQueue],
        callback = effect.callback;
      if (null !== callback) {
        effect.callback = null;
        if ("function" !== typeof callback)
          throw Error(
            "Invalid argument passed as callback. Expected a function. Instead received: " +
              callback
          );
        callback.call(instance);
      }
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
  0 === workInProgress.expirationTime &&
    (workInProgress.updateQueue.baseState = getDerivedStateFromProps);
}
var classComponentUpdater = {
  isMounted: function(component) {
    return (component = component._reactInternalFiber)
      ? getNearestMountedFiber(component) === component
      : !1;
  },
  enqueueSetState: function(inst, payload, callback) {
    inst = inst._reactInternalFiber;
    var currentTime = requestCurrentTimeForUpdate(),
      suspenseConfig = ReactCurrentBatchConfig.suspense;
    currentTime = computeExpirationForFiber(currentTime, inst, suspenseConfig);
    suspenseConfig = createUpdate(currentTime, suspenseConfig);
    suspenseConfig.payload = payload;
    void 0 !== callback &&
      null !== callback &&
      (suspenseConfig.callback = callback);
    enqueueUpdate(inst, suspenseConfig);
    scheduleWork(inst, currentTime);
  },
  enqueueReplaceState: function(inst, payload, callback) {
    inst = inst._reactInternalFiber;
    var currentTime = requestCurrentTimeForUpdate(),
      suspenseConfig = ReactCurrentBatchConfig.suspense;
    currentTime = computeExpirationForFiber(currentTime, inst, suspenseConfig);
    suspenseConfig = createUpdate(currentTime, suspenseConfig);
    suspenseConfig.tag = 1;
    suspenseConfig.payload = payload;
    void 0 !== callback &&
      null !== callback &&
      (suspenseConfig.callback = callback);
    enqueueUpdate(inst, suspenseConfig);
    scheduleWork(inst, currentTime);
  },
  enqueueForceUpdate: function(inst, callback) {
    inst = inst._reactInternalFiber;
    var currentTime = requestCurrentTimeForUpdate(),
      suspenseConfig = ReactCurrentBatchConfig.suspense;
    currentTime = computeExpirationForFiber(currentTime, inst, suspenseConfig);
    suspenseConfig = createUpdate(currentTime, suspenseConfig);
    suspenseConfig.tag = 2;
    void 0 !== callback &&
      null !== callback &&
      (suspenseConfig.callback = callback);
    enqueueUpdate(inst, suspenseConfig);
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
  initializeUpdateQueue(workInProgress);
  var contextType = ctor.contextType;
  "object" === typeof contextType && null !== contextType
    ? (instance.context = readContext(contextType))
    : ((contextType = isContextProvider(ctor)
        ? previousContext
        : contextStackCursor.current),
      (instance.context = getMaskedContext(workInProgress, contextType)));
  processUpdateQueue(workInProgress, newProps, instance, renderExpirationTime);
  instance.state = workInProgress.memoizedState;
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
    processUpdateQueue(
      workInProgress,
      newProps,
      instance,
      renderExpirationTime
    ),
    (instance.state = workInProgress.memoizedState));
  "function" === typeof instance.componentDidMount &&
    (workInProgress.effectTag |= 4);
}
var isArray = Array.isArray;
function coerceRef(returnFiber, current, element) {
  returnFiber = element.ref;
  if (
    null !== returnFiber &&
    "function" !== typeof returnFiber &&
    "object" !== typeof returnFiber
  ) {
    if (element._owner) {
      element = element._owner;
      if (element) {
        if (1 !== element.tag)
          throw Error(
            "Function components cannot have string refs. We recommend using useRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref"
          );
        var inst = element.stateNode;
      }
      if (!inst)
        throw Error(
          "Missing owner for string ref " +
            returnFiber +
            ". This error is likely caused by a bug in React. Please file an issue."
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
        var refs = inst.refs;
        refs === emptyRefsObject && (refs = inst.refs = {});
        null === value ? delete refs[stringRef] : (refs[stringRef] = value);
      };
      current._stringRef = stringRef;
      return current;
    }
    if ("string" !== typeof returnFiber)
      throw Error(
        "Expected ref to be a function, a string, an object returned by React.createRef(), or null."
      );
    if (!element._owner)
      throw Error(
        "Element ref was specified as a string (" +
          returnFiber +
          ") but no owner was set. This could happen for one of the following reasons:\n1. You may be adding a ref to a function component\n2. You may be adding a ref to a component that was not created inside a component's render method\n3. You have multiple copies of React loaded\nSee https://fb.me/react-refs-must-have-owner for more information."
      );
  }
  return returnFiber;
}
function throwOnInvalidObjectType(returnFiber, newChild) {
  if ("textarea" !== returnFiber.type)
    throw Error(
      "Objects are not valid as a React child (found: " +
        ("[object Object]" === Object.prototype.toString.call(newChild)
          ? "object with keys {" + Object.keys(newChild).join(", ") + "}"
          : newChild) +
        ")."
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
  function useFiber(fiber, pendingProps) {
    fiber = createWorkInProgress(fiber, pendingProps);
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
    current = useFiber(current, textContent);
    current.return = returnFiber;
    return current;
  }
  function updateElement(returnFiber, current, element, expirationTime) {
    if (null !== current && current.elementType === element.type)
      return (
        (expirationTime = useFiber(current, element.props)),
        (expirationTime.ref = coerceRef(returnFiber, current, element)),
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
    current = useFiber(current, portal.children || []);
    current.return = returnFiber;
    return current;
  }
  function updateFragment(returnFiber, current, fragment, expirationTime, key) {
    if (null === current || 7 !== current.tag)
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
    current = useFiber(current, fragment);
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
      throw Error(
        "An object is not an iterable. This error is likely caused by a bug in React. Please file an issue."
      );
    newChildrenIterable = iteratorFn.call(newChildrenIterable);
    if (null == newChildrenIterable)
      throw Error("An iterable object provided no iterator.");
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
                switch (isUnkeyedTopLevelFragment.tag) {
                  case 7:
                    if (newChild.type === REACT_FRAGMENT_TYPE) {
                      deleteRemainingChildren(
                        returnFiber,
                        isUnkeyedTopLevelFragment.sibling
                      );
                      currentFirstChild = useFiber(
                        isUnkeyedTopLevelFragment,
                        newChild.props.children
                      );
                      currentFirstChild.return = returnFiber;
                      returnFiber = currentFirstChild;
                      break a;
                    }
                    break;
                  default:
                    if (
                      isUnkeyedTopLevelFragment.elementType === newChild.type
                    ) {
                      deleteRemainingChildren(
                        returnFiber,
                        isUnkeyedTopLevelFragment.sibling
                      );
                      currentFirstChild = useFiber(
                        isUnkeyedTopLevelFragment,
                        newChild.props
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
                    newChild.children || []
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
            (currentFirstChild = useFiber(currentFirstChild, newChild)),
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
          Error(
            (returnFiber.displayName || returnFiber.name || "Component") +
              "(...): Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null."
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
    throw Error(
      "Expected host context to exist. This error is likely caused by a bug in React. Please file an issue."
    );
  return c;
}
function pushHostContainer(fiber, nextRootInstance) {
  push(rootInstanceStackCursor, nextRootInstance);
  push(contextFiberStackCursor, fiber);
  push(contextStackCursor$1, NO_CONTEXT);
  pop(contextStackCursor$1);
  push(contextStackCursor$1, { isInAParentText: !1 });
}
function popHostContainer() {
  pop(contextStackCursor$1);
  pop(contextFiberStackCursor);
  pop(rootInstanceStackCursor);
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
    (push(contextFiberStackCursor, fiber),
    push(contextStackCursor$1, nextContext));
}
function popHostContext(fiber) {
  contextFiberStackCursor.current === fiber &&
    (pop(contextStackCursor$1), pop(contextFiberStackCursor));
}
var suspenseStackCursor = { current: 0 };
function findFirstSuspended(row) {
  for (var node = row; null !== node; ) {
    if (13 === node.tag) {
      var state = node.memoizedState;
      if (null !== state && (null === state.dehydrated || shim() || shim()))
        return node;
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
function createDeprecatedResponderListener(responder, props) {
  return { responder: responder, props: props };
}
var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher,
  ReactCurrentBatchConfig$1 = ReactSharedInternals.ReactCurrentBatchConfig,
  renderExpirationTime = 0,
  currentlyRenderingFiber$1 = null,
  currentHook = null,
  workInProgressHook = null,
  didScheduleRenderPhaseUpdate = !1;
function throwInvalidHookError() {
  throw Error(
    "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem."
  );
}
function areHookInputsEqual(nextDeps, prevDeps) {
  if (null === prevDeps) return !1;
  for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++)
    if (!objectIs(nextDeps[i], prevDeps[i])) return !1;
  return !0;
}
function renderWithHooks(
  current,
  workInProgress,
  Component,
  props,
  secondArg,
  nextRenderExpirationTime
) {
  renderExpirationTime = nextRenderExpirationTime;
  currentlyRenderingFiber$1 = workInProgress;
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.expirationTime = 0;
  ReactCurrentDispatcher.current =
    null === current || null === current.memoizedState
      ? HooksDispatcherOnMount
      : HooksDispatcherOnUpdate;
  current = Component(props, secondArg);
  if (workInProgress.expirationTime === renderExpirationTime) {
    nextRenderExpirationTime = 0;
    do {
      workInProgress.expirationTime = 0;
      if (!(25 > nextRenderExpirationTime))
        throw Error(
          "Too many re-renders. React limits the number of renders to prevent an infinite loop."
        );
      nextRenderExpirationTime += 1;
      workInProgressHook = currentHook = null;
      workInProgress.updateQueue = null;
      ReactCurrentDispatcher.current = HooksDispatcherOnRerender;
      current = Component(props, secondArg);
    } while (workInProgress.expirationTime === renderExpirationTime);
  }
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;
  workInProgress = null !== currentHook && null !== currentHook.next;
  renderExpirationTime = 0;
  workInProgressHook = currentHook = currentlyRenderingFiber$1 = null;
  didScheduleRenderPhaseUpdate = !1;
  if (workInProgress)
    throw Error(
      "Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
    );
  return current;
}
function mountWorkInProgressHook() {
  var hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null
  };
  null === workInProgressHook
    ? (currentlyRenderingFiber$1.memoizedState = workInProgressHook = hook)
    : (workInProgressHook = workInProgressHook.next = hook);
  return workInProgressHook;
}
function updateWorkInProgressHook() {
  if (null === currentHook) {
    var nextCurrentHook = currentlyRenderingFiber$1.alternate;
    nextCurrentHook =
      null !== nextCurrentHook ? nextCurrentHook.memoizedState : null;
  } else nextCurrentHook = currentHook.next;
  var nextWorkInProgressHook =
    null === workInProgressHook
      ? currentlyRenderingFiber$1.memoizedState
      : workInProgressHook.next;
  if (null !== nextWorkInProgressHook)
    (workInProgressHook = nextWorkInProgressHook),
      (currentHook = nextCurrentHook);
  else {
    if (null === nextCurrentHook)
      throw Error("Rendered more hooks than during the previous render.");
    currentHook = nextCurrentHook;
    nextCurrentHook = {
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,
      next: null
    };
    null === workInProgressHook
      ? (currentlyRenderingFiber$1.memoizedState = workInProgressHook = nextCurrentHook)
      : (workInProgressHook = workInProgressHook.next = nextCurrentHook);
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
    throw Error(
      "Should have a queue. This is likely a bug in React. Please file an issue."
    );
  queue.lastRenderedReducer = reducer;
  var current = currentHook,
    baseQueue = current.baseQueue,
    pendingQueue = queue.pending;
  if (null !== pendingQueue) {
    if (null !== baseQueue) {
      var baseFirst = baseQueue.next;
      baseQueue.next = pendingQueue.next;
      pendingQueue.next = baseFirst;
    }
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }
  if (null !== baseQueue) {
    baseQueue = baseQueue.next;
    current = current.baseState;
    var newBaseQueueLast = (baseFirst = pendingQueue = null),
      update = baseQueue;
    do {
      var updateExpirationTime = update.expirationTime;
      if (updateExpirationTime < renderExpirationTime) {
        var clone = {
          expirationTime: update.expirationTime,
          suspenseConfig: update.suspenseConfig,
          action: update.action,
          eagerReducer: update.eagerReducer,
          eagerState: update.eagerState,
          next: null
        };
        null === newBaseQueueLast
          ? ((baseFirst = newBaseQueueLast = clone), (pendingQueue = current))
          : (newBaseQueueLast = newBaseQueueLast.next = clone);
        updateExpirationTime > currentlyRenderingFiber$1.expirationTime &&
          ((currentlyRenderingFiber$1.expirationTime = updateExpirationTime),
          markUnprocessedUpdateTime(updateExpirationTime));
      } else
        null !== newBaseQueueLast &&
          (newBaseQueueLast = newBaseQueueLast.next = {
            expirationTime: 1073741823,
            suspenseConfig: update.suspenseConfig,
            action: update.action,
            eagerReducer: update.eagerReducer,
            eagerState: update.eagerState,
            next: null
          }),
          markRenderEventTimeAndConfig(
            updateExpirationTime,
            update.suspenseConfig
          ),
          (current =
            update.eagerReducer === reducer
              ? update.eagerState
              : reducer(current, update.action));
      update = update.next;
    } while (null !== update && update !== baseQueue);
    null === newBaseQueueLast
      ? (pendingQueue = current)
      : (newBaseQueueLast.next = baseFirst);
    objectIs(current, hook.memoizedState) || (didReceiveUpdate = !0);
    hook.memoizedState = current;
    hook.baseState = pendingQueue;
    hook.baseQueue = newBaseQueueLast;
    queue.lastRenderedState = current;
  }
  return [hook.memoizedState, queue.dispatch];
}
function rerenderReducer(reducer) {
  var hook = updateWorkInProgressHook(),
    queue = hook.queue;
  if (null === queue)
    throw Error(
      "Should have a queue. This is likely a bug in React. Please file an issue."
    );
  queue.lastRenderedReducer = reducer;
  var dispatch = queue.dispatch,
    lastRenderPhaseUpdate = queue.pending,
    newState = hook.memoizedState;
  if (null !== lastRenderPhaseUpdate) {
    queue.pending = null;
    var update = (lastRenderPhaseUpdate = lastRenderPhaseUpdate.next);
    do (newState = reducer(newState, update.action)), (update = update.next);
    while (update !== lastRenderPhaseUpdate);
    objectIs(newState, hook.memoizedState) || (didReceiveUpdate = !0);
    hook.memoizedState = newState;
    null === hook.baseQueue && (hook.baseState = newState);
    queue.lastRenderedState = newState;
  }
  return [newState, dispatch];
}
function mountState(initialState) {
  var hook = mountWorkInProgressHook();
  "function" === typeof initialState && (initialState = initialState());
  hook.memoizedState = hook.baseState = initialState;
  initialState = hook.queue = {
    pending: null,
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
}
function pushEffect(tag, create, destroy, deps) {
  tag = { tag: tag, create: create, destroy: destroy, deps: deps, next: null };
  create = currentlyRenderingFiber$1.updateQueue;
  null === create
    ? ((create = { lastEffect: null }),
      (currentlyRenderingFiber$1.updateQueue = create),
      (create.lastEffect = tag.next = tag))
    : ((destroy = create.lastEffect),
      null === destroy
        ? (create.lastEffect = tag.next = tag)
        : ((deps = destroy.next),
          (destroy.next = tag),
          (tag.next = deps),
          (create.lastEffect = tag)));
  return tag;
}
function updateRef() {
  return updateWorkInProgressHook().memoizedState;
}
function mountEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
  var hook = mountWorkInProgressHook();
  currentlyRenderingFiber$1.effectTag |= fiberEffectTag;
  hook.memoizedState = pushEffect(
    1 | hookEffectTag,
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
      pushEffect(hookEffectTag, create, destroy, deps);
      return;
    }
  }
  currentlyRenderingFiber$1.effectTag |= fiberEffectTag;
  hook.memoizedState = pushEffect(1 | hookEffectTag, create, destroy, deps);
}
function mountEffect(create, deps) {
  return mountEffectImpl(516, 4, create, deps);
}
function updateEffect(create, deps) {
  return updateEffectImpl(516, 4, create, deps);
}
function updateLayoutEffect(create, deps) {
  return updateEffectImpl(4, 2, create, deps);
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
function updateImperativeHandle(ref, create, deps) {
  deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
  return updateEffectImpl(
    4,
    2,
    imperativeHandleEffect.bind(null, create, ref),
    deps
  );
}
function mountDebugValue() {}
function mountCallback(callback, deps) {
  mountWorkInProgressHook().memoizedState = [
    callback,
    void 0 === deps ? null : deps
  ];
  return callback;
}
function updateCallback(callback, deps) {
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
}
function updateMemo(nextCreate, deps) {
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
}
function startTransition(setPending, config, callback) {
  var priorityLevel = getCurrentPriorityLevel();
  runWithPriority(98 > priorityLevel ? 98 : priorityLevel, function() {
    setPending(!0);
  });
  runWithPriority(97 < priorityLevel ? 97 : priorityLevel, function() {
    var previousConfig = ReactCurrentBatchConfig$1.suspense;
    ReactCurrentBatchConfig$1.suspense = void 0 === config ? null : config;
    try {
      setPending(!1), callback();
    } finally {
      ReactCurrentBatchConfig$1.suspense = previousConfig;
    }
  });
}
function dispatchAction(fiber, queue, action) {
  var currentTime = requestCurrentTimeForUpdate(),
    suspenseConfig = ReactCurrentBatchConfig.suspense;
  currentTime = computeExpirationForFiber(currentTime, fiber, suspenseConfig);
  suspenseConfig = {
    expirationTime: currentTime,
    suspenseConfig: suspenseConfig,
    action: action,
    eagerReducer: null,
    eagerState: null,
    next: null
  };
  var pending = queue.pending;
  null === pending
    ? (suspenseConfig.next = suspenseConfig)
    : ((suspenseConfig.next = pending.next), (pending.next = suspenseConfig));
  queue.pending = suspenseConfig;
  pending = fiber.alternate;
  if (
    fiber === currentlyRenderingFiber$1 ||
    (null !== pending && pending === currentlyRenderingFiber$1)
  )
    (didScheduleRenderPhaseUpdate = !0),
      (suspenseConfig.expirationTime = renderExpirationTime),
      (currentlyRenderingFiber$1.expirationTime = renderExpirationTime);
  else {
    if (
      0 === fiber.expirationTime &&
      (null === pending || 0 === pending.expirationTime) &&
      ((pending = queue.lastRenderedReducer), null !== pending)
    )
      try {
        var currentState = queue.lastRenderedState,
          eagerState = pending(currentState, action);
        suspenseConfig.eagerReducer = pending;
        suspenseConfig.eagerState = eagerState;
        if (objectIs(eagerState, currentState)) return;
      } catch (error) {
      } finally {
      }
    scheduleWork(fiber, currentTime);
  }
}
function updateEventListener() {}
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
    useTransition: throwInvalidHookError,
    useEvent: throwInvalidHookError
  },
  HooksDispatcherOnMount = {
    readContext: readContext,
    useCallback: mountCallback,
    useContext: readContext,
    useEffect: mountEffect,
    useImperativeHandle: function(ref, create, deps) {
      deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
      return mountEffectImpl(
        4,
        2,
        imperativeHandleEffect.bind(null, create, ref),
        deps
      );
    },
    useLayoutEffect: function(create, deps) {
      return mountEffectImpl(4, 2, create, deps);
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
        pending: null,
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
    useState: mountState,
    useDebugValue: mountDebugValue,
    useResponder: createDeprecatedResponderListener,
    useDeferredValue: function(value, config) {
      var _mountState = mountState(value),
        prevValue = _mountState[0],
        setValue = _mountState[1];
      mountEffect(
        function() {
          var previousConfig = ReactCurrentBatchConfig$1.suspense;
          ReactCurrentBatchConfig$1.suspense =
            void 0 === config ? null : config;
          try {
            setValue(value);
          } finally {
            ReactCurrentBatchConfig$1.suspense = previousConfig;
          }
        },
        [value, config]
      );
      return prevValue;
    },
    useTransition: function(config) {
      var _mountState2 = mountState(!1),
        isPending = _mountState2[0];
      _mountState2 = _mountState2[1];
      return [
        mountCallback(startTransition.bind(null, _mountState2, config), [
          _mountState2,
          config
        ]),
        isPending
      ];
    },
    useEvent: function() {}
  },
  HooksDispatcherOnUpdate = {
    readContext: readContext,
    useCallback: updateCallback,
    useContext: readContext,
    useEffect: updateEffect,
    useImperativeHandle: updateImperativeHandle,
    useLayoutEffect: updateLayoutEffect,
    useMemo: updateMemo,
    useReducer: updateReducer,
    useRef: updateRef,
    useState: function() {
      return updateReducer(basicStateReducer);
    },
    useDebugValue: mountDebugValue,
    useResponder: createDeprecatedResponderListener,
    useDeferredValue: function(value, config) {
      var _updateState = updateReducer(basicStateReducer),
        prevValue = _updateState[0],
        setValue = _updateState[1];
      updateEffect(
        function() {
          var previousConfig = ReactCurrentBatchConfig$1.suspense;
          ReactCurrentBatchConfig$1.suspense =
            void 0 === config ? null : config;
          try {
            setValue(value);
          } finally {
            ReactCurrentBatchConfig$1.suspense = previousConfig;
          }
        },
        [value, config]
      );
      return prevValue;
    },
    useTransition: function(config) {
      var _updateState2 = updateReducer(basicStateReducer),
        isPending = _updateState2[0];
      _updateState2 = _updateState2[1];
      return [
        updateCallback(startTransition.bind(null, _updateState2, config), [
          _updateState2,
          config
        ]),
        isPending
      ];
    },
    useEvent: updateEventListener
  },
  HooksDispatcherOnRerender = {
    readContext: readContext,
    useCallback: updateCallback,
    useContext: readContext,
    useEffect: updateEffect,
    useImperativeHandle: updateImperativeHandle,
    useLayoutEffect: updateLayoutEffect,
    useMemo: updateMemo,
    useReducer: rerenderReducer,
    useRef: updateRef,
    useState: function() {
      return rerenderReducer(basicStateReducer);
    },
    useDebugValue: mountDebugValue,
    useResponder: createDeprecatedResponderListener,
    useDeferredValue: function(value, config) {
      var _rerenderState = rerenderReducer(basicStateReducer),
        prevValue = _rerenderState[0],
        setValue = _rerenderState[1];
      updateEffect(
        function() {
          var previousConfig = ReactCurrentBatchConfig$1.suspense;
          ReactCurrentBatchConfig$1.suspense =
            void 0 === config ? null : config;
          try {
            setValue(value);
          } finally {
            ReactCurrentBatchConfig$1.suspense = previousConfig;
          }
        },
        [value, config]
      );
      return prevValue;
    },
    useTransition: function(config) {
      var _rerenderState2 = rerenderReducer(basicStateReducer),
        isPending = _rerenderState2[0];
      _rerenderState2 = _rerenderState2[1];
      return [
        updateCallback(startTransition.bind(null, _rerenderState2, config), [
          _rerenderState2,
          config
        ]),
        isPending
      ];
    },
    useEvent: updateEventListener
  },
  ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner,
  didReceiveUpdate = !1;
function reconcileChildren(
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
function updateForwardRef(
  current,
  workInProgress,
  Component,
  nextProps,
  renderExpirationTime
) {
  Component = Component.render;
  var ref = workInProgress.ref;
  prepareToReadContext(workInProgress, renderExpirationTime);
  nextProps = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps,
    ref,
    renderExpirationTime
  );
  if (null !== current && !didReceiveUpdate)
    return (
      (workInProgress.updateQueue = current.updateQueue),
      (workInProgress.effectTag &= -517),
      current.expirationTime <= renderExpirationTime &&
        (current.expirationTime = 0),
      bailoutOnAlreadyFinishedWork(
        current,
        workInProgress,
        renderExpirationTime
      )
    );
  workInProgress.effectTag |= 1;
  reconcileChildren(current, workInProgress, nextProps, renderExpirationTime);
  return workInProgress.child;
}
function updateMemoComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  updateExpirationTime,
  renderExpirationTime
) {
  if (null === current) {
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
          current,
          workInProgress,
          type,
          nextProps,
          updateExpirationTime,
          renderExpirationTime
        )
      );
    current = createFiberFromTypeAndProps(
      Component.type,
      null,
      nextProps,
      null,
      workInProgress.mode,
      renderExpirationTime
    );
    current.ref = workInProgress.ref;
    current.return = workInProgress;
    return (workInProgress.child = current);
  }
  type = current.child;
  if (
    updateExpirationTime < renderExpirationTime &&
    ((updateExpirationTime = type.memoizedProps),
    (Component = Component.compare),
    (Component = null !== Component ? Component : shallowEqual),
    Component(updateExpirationTime, nextProps) &&
      current.ref === workInProgress.ref)
  )
    return bailoutOnAlreadyFinishedWork(
      current,
      workInProgress,
      renderExpirationTime
    );
  workInProgress.effectTag |= 1;
  current = createWorkInProgress(type, nextProps);
  current.ref = workInProgress.ref;
  current.return = workInProgress;
  return (workInProgress.child = current);
}
function updateSimpleMemoComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  updateExpirationTime,
  renderExpirationTime
) {
  return null !== current &&
    shallowEqual(current.memoizedProps, nextProps) &&
    current.ref === workInProgress.ref &&
    ((didReceiveUpdate = !1), updateExpirationTime < renderExpirationTime)
    ? ((workInProgress.expirationTime = current.expirationTime),
      bailoutOnAlreadyFinishedWork(
        current,
        workInProgress,
        renderExpirationTime
      ))
    : updateFunctionComponent(
        current,
        workInProgress,
        Component,
        nextProps,
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
function updateFunctionComponent(
  current,
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
    current,
    workInProgress,
    Component,
    nextProps,
    context,
    renderExpirationTime
  );
  if (null !== current && !didReceiveUpdate)
    return (
      (workInProgress.updateQueue = current.updateQueue),
      (workInProgress.effectTag &= -517),
      current.expirationTime <= renderExpirationTime &&
        (current.expirationTime = 0),
      bailoutOnAlreadyFinishedWork(
        current,
        workInProgress,
        renderExpirationTime
      )
    );
  workInProgress.effectTag |= 1;
  reconcileChildren(current, workInProgress, Component, renderExpirationTime);
  return workInProgress.child;
}
function updateClassComponent(
  current,
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
    null !== current &&
      ((current.alternate = null),
      (workInProgress.alternate = null),
      (workInProgress.effectTag |= 2)),
      constructClassInstance(workInProgress, Component, nextProps),
      mountClassInstance(
        workInProgress,
        Component,
        nextProps,
        renderExpirationTime
      ),
      (nextProps = !0);
  else if (null === current) {
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
    instance.state = oldState;
    processUpdateQueue(
      workInProgress,
      nextProps,
      instance,
      renderExpirationTime
    );
    oldContext = workInProgress.memoizedState;
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
      cloneUpdateQueue(current, workInProgress),
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
      (instance.state = oldContext),
      processUpdateQueue(
        workInProgress,
        nextProps,
        instance,
        renderExpirationTime
      ),
      (oldState = workInProgress.memoizedState),
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
                (oldProps === current.memoizedProps &&
                  oldContext === current.memoizedState) ||
                (workInProgress.effectTag |= 4),
              "function" !== typeof instance.getSnapshotBeforeUpdate ||
                (oldProps === current.memoizedProps &&
                  oldContext === current.memoizedState) ||
                (workInProgress.effectTag |= 256),
              (workInProgress.memoizedProps = nextProps),
              (workInProgress.memoizedState = oldState)),
          (instance.props = nextProps),
          (instance.state = oldState),
          (instance.context = contextType),
          (nextProps = getDerivedStateFromProps))
        : ("function" !== typeof instance.componentDidUpdate ||
            (oldProps === current.memoizedProps &&
              oldContext === current.memoizedState) ||
            (workInProgress.effectTag |= 4),
          "function" !== typeof instance.getSnapshotBeforeUpdate ||
            (oldProps === current.memoizedProps &&
              oldContext === current.memoizedState) ||
            (workInProgress.effectTag |= 256),
          (nextProps = !1));
  return finishClassComponent(
    current,
    workInProgress,
    Component,
    nextProps,
    hasContext,
    renderExpirationTime
  );
}
function finishClassComponent(
  current,
  workInProgress,
  Component,
  shouldUpdate,
  hasContext,
  renderExpirationTime
) {
  markRef(current, workInProgress);
  var didCaptureError = 0 !== (workInProgress.effectTag & 64);
  if (!shouldUpdate && !didCaptureError)
    return (
      hasContext && invalidateContextProvider(workInProgress, Component, !1),
      bailoutOnAlreadyFinishedWork(
        current,
        workInProgress,
        renderExpirationTime
      )
    );
  shouldUpdate = workInProgress.stateNode;
  ReactCurrentOwner$1.current = workInProgress;
  var nextChildren =
    didCaptureError && "function" !== typeof Component.getDerivedStateFromError
      ? null
      : shouldUpdate.render();
  workInProgress.effectTag |= 1;
  null !== current && didCaptureError
    ? ((workInProgress.child = reconcileChildFibers(
        workInProgress,
        current.child,
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
        current,
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
var SUSPENDED_MARKER = { dehydrated: null, retryTime: 0 };
function updateSuspenseComponent(
  current,
  workInProgress,
  renderExpirationTime
) {
  var mode = workInProgress.mode,
    nextProps = workInProgress.pendingProps,
    suspenseContext = suspenseStackCursor.current,
    nextDidTimeout = !1,
    JSCompiler_temp;
  (JSCompiler_temp = 0 !== (workInProgress.effectTag & 64)) ||
    (JSCompiler_temp =
      0 !== (suspenseContext & 2) &&
      (null === current || null !== current.memoizedState));
  JSCompiler_temp
    ? ((nextDidTimeout = !0), (workInProgress.effectTag &= -65))
    : (null !== current && null === current.memoizedState) ||
      void 0 === nextProps.fallback ||
      !0 === nextProps.unstable_avoidThisFallback ||
      (suspenseContext |= 1);
  push(suspenseStackCursor, suspenseContext & 1);
  if (null === current) {
    if (nextDidTimeout) {
      nextDidTimeout = nextProps.fallback;
      nextProps = createFiberFromFragment(null, mode, 0, null);
      nextProps.return = workInProgress;
      if (0 === (workInProgress.mode & 2))
        for (
          current =
            null !== workInProgress.memoizedState
              ? workInProgress.child.child
              : workInProgress.child,
            nextProps.child = current;
          null !== current;

        )
          (current.return = nextProps), (current = current.sibling);
      renderExpirationTime = createFiberFromFragment(
        nextDidTimeout,
        mode,
        renderExpirationTime,
        null
      );
      renderExpirationTime.return = workInProgress;
      nextProps.sibling = renderExpirationTime;
      workInProgress.memoizedState = SUSPENDED_MARKER;
      workInProgress.child = nextProps;
      return renderExpirationTime;
    }
    mode = nextProps.children;
    workInProgress.memoizedState = null;
    return (workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      mode,
      renderExpirationTime
    ));
  }
  if (null !== current.memoizedState) {
    current = current.child;
    mode = current.sibling;
    if (nextDidTimeout) {
      nextProps = nextProps.fallback;
      renderExpirationTime = createWorkInProgress(
        current,
        current.pendingProps
      );
      renderExpirationTime.return = workInProgress;
      if (
        0 === (workInProgress.mode & 2) &&
        ((nextDidTimeout =
          null !== workInProgress.memoizedState
            ? workInProgress.child.child
            : workInProgress.child),
        nextDidTimeout !== current.child)
      )
        for (
          renderExpirationTime.child = nextDidTimeout;
          null !== nextDidTimeout;

        )
          (nextDidTimeout.return = renderExpirationTime),
            (nextDidTimeout = nextDidTimeout.sibling);
      mode = createWorkInProgress(mode, nextProps);
      mode.return = workInProgress;
      renderExpirationTime.sibling = mode;
      renderExpirationTime.childExpirationTime = 0;
      workInProgress.memoizedState = SUSPENDED_MARKER;
      workInProgress.child = renderExpirationTime;
      return mode;
    }
    renderExpirationTime = reconcileChildFibers(
      workInProgress,
      current.child,
      nextProps.children,
      renderExpirationTime
    );
    workInProgress.memoizedState = null;
    return (workInProgress.child = renderExpirationTime);
  }
  current = current.child;
  if (nextDidTimeout) {
    nextDidTimeout = nextProps.fallback;
    nextProps = createFiberFromFragment(null, mode, 0, null);
    nextProps.return = workInProgress;
    nextProps.child = current;
    null !== current && (current.return = nextProps);
    if (0 === (workInProgress.mode & 2))
      for (
        current =
          null !== workInProgress.memoizedState
            ? workInProgress.child.child
            : workInProgress.child,
          nextProps.child = current;
        null !== current;

      )
        (current.return = nextProps), (current = current.sibling);
    renderExpirationTime = createFiberFromFragment(
      nextDidTimeout,
      mode,
      renderExpirationTime,
      null
    );
    renderExpirationTime.return = workInProgress;
    nextProps.sibling = renderExpirationTime;
    renderExpirationTime.effectTag |= 2;
    nextProps.childExpirationTime = 0;
    workInProgress.memoizedState = SUSPENDED_MARKER;
    workInProgress.child = nextProps;
    return renderExpirationTime;
  }
  workInProgress.memoizedState = null;
  return (workInProgress.child = reconcileChildFibers(
    workInProgress,
    current,
    nextProps.children,
    renderExpirationTime
  ));
}
function scheduleWorkOnFiber(fiber, renderExpirationTime) {
  fiber.expirationTime < renderExpirationTime &&
    (fiber.expirationTime = renderExpirationTime);
  var alternate = fiber.alternate;
  null !== alternate &&
    alternate.expirationTime < renderExpirationTime &&
    (alternate.expirationTime = renderExpirationTime);
  scheduleWorkOnParentPath(fiber.return, renderExpirationTime);
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
  null === renderState
    ? (workInProgress.memoizedState = {
        isBackwards: isBackwards,
        rendering: null,
        renderingStartTime: 0,
        last: lastContentRow,
        tail: tail,
        tailExpiration: 0,
        tailMode: tailMode,
        lastEffect: lastEffectBeforeRendering
      })
    : ((renderState.isBackwards = isBackwards),
      (renderState.rendering = null),
      (renderState.renderingStartTime = 0),
      (renderState.last = lastContentRow),
      (renderState.tail = tail),
      (renderState.tailExpiration = 0),
      (renderState.tailMode = tailMode),
      (renderState.lastEffect = lastEffectBeforeRendering));
}
function updateSuspenseListComponent(
  current,
  workInProgress,
  renderExpirationTime
) {
  var nextProps = workInProgress.pendingProps,
    revealOrder = nextProps.revealOrder,
    tailMode = nextProps.tail;
  reconcileChildren(
    current,
    workInProgress,
    nextProps.children,
    renderExpirationTime
  );
  nextProps = suspenseStackCursor.current;
  if (0 !== (nextProps & 2))
    (nextProps = (nextProps & 1) | 2), (workInProgress.effectTag |= 64);
  else {
    if (null !== current && 0 !== (current.effectTag & 64))
      a: for (current = workInProgress.child; null !== current; ) {
        if (13 === current.tag)
          null !== current.memoizedState &&
            scheduleWorkOnFiber(current, renderExpirationTime);
        else if (19 === current.tag)
          scheduleWorkOnFiber(current, renderExpirationTime);
        else if (null !== current.child) {
          current.child.return = current;
          current = current.child;
          continue;
        }
        if (current === workInProgress) break a;
        for (; null === current.sibling; ) {
          if (null === current.return || current.return === workInProgress)
            break a;
          current = current.return;
        }
        current.sibling.return = current.return;
        current = current.sibling;
      }
    nextProps &= 1;
  }
  push(suspenseStackCursor, nextProps);
  if (0 === (workInProgress.mode & 2)) workInProgress.memoizedState = null;
  else
    switch (revealOrder) {
      case "forwards":
        renderExpirationTime = workInProgress.child;
        for (revealOrder = null; null !== renderExpirationTime; )
          (current = renderExpirationTime.alternate),
            null !== current &&
              null === findFirstSuspended(current) &&
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
          tailMode,
          workInProgress.lastEffect
        );
        break;
      case "backwards":
        renderExpirationTime = null;
        revealOrder = workInProgress.child;
        for (workInProgress.child = null; null !== revealOrder; ) {
          current = revealOrder.alternate;
          if (null !== current && null === findFirstSuspended(current)) {
            workInProgress.child = revealOrder;
            break;
          }
          current = revealOrder.sibling;
          revealOrder.sibling = renderExpirationTime;
          renderExpirationTime = revealOrder;
          revealOrder = current;
        }
        initSuspenseListRenderState(
          workInProgress,
          !0,
          renderExpirationTime,
          null,
          tailMode,
          workInProgress.lastEffect
        );
        break;
      case "together":
        initSuspenseListRenderState(
          workInProgress,
          !1,
          null,
          null,
          void 0,
          workInProgress.lastEffect
        );
        break;
      default:
        workInProgress.memoizedState = null;
    }
  return workInProgress.child;
}
function bailoutOnAlreadyFinishedWork(
  current,
  workInProgress,
  renderExpirationTime
) {
  null !== current && (workInProgress.dependencies = current.dependencies);
  var updateExpirationTime = workInProgress.expirationTime;
  0 !== updateExpirationTime && markUnprocessedUpdateTime(updateExpirationTime);
  if (workInProgress.childExpirationTime < renderExpirationTime) return null;
  if (null !== current && workInProgress.child !== current.child)
    throw Error("Resuming work not yet implemented.");
  if (null !== workInProgress.child) {
    current = workInProgress.child;
    renderExpirationTime = createWorkInProgress(current, current.pendingProps);
    workInProgress.child = renderExpirationTime;
    for (
      renderExpirationTime.return = workInProgress;
      null !== current.sibling;

    )
      (current = current.sibling),
        (renderExpirationTime = renderExpirationTime.sibling = createWorkInProgress(
          current,
          current.pendingProps
        )),
        (renderExpirationTime.return = workInProgress);
    renderExpirationTime.sibling = null;
  }
  return workInProgress.child;
}
var appendAllChildren,
  updateHostContainer,
  updateHostComponent$1,
  updateHostText$1;
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
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return null;
    case 1:
      return isContextProvider(workInProgress.type) && popContext(), null;
    case 3:
      return (
        popHostContainer(),
        pop(didPerformWorkStackCursor),
        pop(contextStackCursor),
        (current = workInProgress.stateNode),
        current.pendingContext &&
          ((current.context = current.pendingContext),
          (current.pendingContext = null)),
        updateHostContainer(workInProgress),
        null
      );
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
      else {
        if (!newProps) {
          if (null === workInProgress.stateNode)
            throw Error(
              "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
            );
          return null;
        }
        requiredContext(contextStackCursor$1.current);
        current = allocateTag();
        renderExpirationTime = getViewConfigForType(renderExpirationTime);
        var updatePayload = diffProperties(
          null,
          emptyObject,
          newProps,
          renderExpirationTime.validAttributes
        );
        ReactNativePrivateInterface.UIManager.createView(
          current,
          renderExpirationTime.uiViewClassName,
          rootContainerInstance,
          updatePayload
        );
        rootContainerInstance = new ReactNativeFiberHostComponent(
          current,
          renderExpirationTime,
          workInProgress
        );
        instanceCache.set(current, workInProgress);
        instanceProps.set(current, newProps);
        appendAllChildren(rootContainerInstance, workInProgress, !1, !1);
        workInProgress.stateNode = rootContainerInstance;
        finalizeInitialChildren(rootContainerInstance) &&
          (workInProgress.effectTag |= 4);
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
        if ("string" !== typeof newProps && null === workInProgress.stateNode)
          throw Error(
            "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
          );
        current = requiredContext(rootInstanceStackCursor.current);
        if (!requiredContext(contextStackCursor$1.current).isInAParentText)
          throw Error(
            "Text strings must be rendered within a <Text> component."
          );
        rootContainerInstance = allocateTag();
        ReactNativePrivateInterface.UIManager.createView(
          rootContainerInstance,
          "RCTRawText",
          current,
          { text: newProps }
        );
        instanceCache.set(rootContainerInstance, workInProgress);
        workInProgress.stateNode = rootContainerInstance;
      }
      return null;
    case 13:
      pop(suspenseStackCursor);
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
          0 !== (suspenseStackCursor.current & 1)
        )
          workInProgressRootExitStatus === RootIncomplete &&
            (workInProgressRootExitStatus = RootSuspended);
        else {
          if (
            workInProgressRootExitStatus === RootIncomplete ||
            workInProgressRootExitStatus === RootSuspended
          )
            workInProgressRootExitStatus = RootSuspendedWithDelay;
          0 !== workInProgressRootNextUnprocessedUpdateTime &&
            null !== workInProgressRoot &&
            (markRootSuspendedAtTime(
              workInProgressRoot,
              renderExpirationTime$1
            ),
            markRootUpdatedAtTime(
              workInProgressRoot,
              workInProgressRootNextUnprocessedUpdateTime
            ));
        }
      if (newProps || rootContainerInstance) workInProgress.effectTag |= 4;
      return null;
    case 4:
      return popHostContainer(), updateHostContainer(workInProgress), null;
    case 10:
      return popProvider(workInProgress), null;
    case 17:
      return isContextProvider(workInProgress.type) && popContext(), null;
    case 19:
      pop(suspenseStackCursor);
      newProps = workInProgress.memoizedState;
      if (null === newProps) return null;
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
                null === newProps.lastEffect &&
                  (workInProgress.firstEffect = null);
                workInProgress.lastEffect = newProps.lastEffect;
                current = renderExpirationTime;
                for (newProps = workInProgress.child; null !== newProps; )
                  (rootContainerInstance = newProps),
                    (renderExpirationTime = current),
                    (rootContainerInstance.effectTag &= 2),
                    (rootContainerInstance.nextEffect = null),
                    (rootContainerInstance.firstEffect = null),
                    (rootContainerInstance.lastEffect = null),
                    (updatePayload = rootContainerInstance.alternate),
                    null === updatePayload
                      ? ((rootContainerInstance.childExpirationTime = 0),
                        (rootContainerInstance.expirationTime = renderExpirationTime),
                        (rootContainerInstance.child = null),
                        (rootContainerInstance.memoizedProps = null),
                        (rootContainerInstance.memoizedState = null),
                        (rootContainerInstance.updateQueue = null),
                        (rootContainerInstance.dependencies = null))
                      : ((rootContainerInstance.childExpirationTime =
                          updatePayload.childExpirationTime),
                        (rootContainerInstance.expirationTime =
                          updatePayload.expirationTime),
                        (rootContainerInstance.child = updatePayload.child),
                        (rootContainerInstance.memoizedProps =
                          updatePayload.memoizedProps),
                        (rootContainerInstance.memoizedState =
                          updatePayload.memoizedState),
                        (rootContainerInstance.updateQueue =
                          updatePayload.updateQueue),
                        (renderExpirationTime = updatePayload.dependencies),
                        (rootContainerInstance.dependencies =
                          null === renderExpirationTime
                            ? null
                            : {
                                expirationTime:
                                  renderExpirationTime.expirationTime,
                                firstContext: renderExpirationTime.firstContext,
                                responders: renderExpirationTime.responders
                              })),
                    (newProps = newProps.sibling);
                push(
                  suspenseStackCursor,
                  (suspenseStackCursor.current & 1) | 2
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
              (current = current.updateQueue),
              null !== current &&
                ((workInProgress.updateQueue = current),
                (workInProgress.effectTag |= 4)),
              cutOffTailIfNeeded(newProps, !0),
              null === newProps.tail &&
                "hidden" === newProps.tailMode &&
                !updatePayload.alternate)
            )
              return (
                (workInProgress = workInProgress.lastEffect =
                  newProps.lastEffect),
                null !== workInProgress && (workInProgress.nextEffect = null),
                null
              );
          } else
            2 * now() - newProps.renderingStartTime > newProps.tailExpiration &&
              1 < renderExpirationTime &&
              ((workInProgress.effectTag |= 64),
              (rootContainerInstance = !0),
              cutOffTailIfNeeded(newProps, !1),
              (workInProgress.expirationTime = workInProgress.childExpirationTime =
                renderExpirationTime - 1));
        newProps.isBackwards
          ? ((updatePayload.sibling = workInProgress.child),
            (workInProgress.child = updatePayload))
          : ((current = newProps.last),
            null !== current
              ? (current.sibling = updatePayload)
              : (workInProgress.child = updatePayload),
            (newProps.last = updatePayload));
      }
      return null !== newProps.tail
        ? (0 === newProps.tailExpiration &&
            (newProps.tailExpiration = now() + 500),
          (current = newProps.tail),
          (newProps.rendering = current),
          (newProps.tail = current.sibling),
          (newProps.lastEffect = workInProgress.lastEffect),
          (newProps.renderingStartTime = now()),
          (current.sibling = null),
          (workInProgress = suspenseStackCursor.current),
          push(
            suspenseStackCursor,
            rootContainerInstance
              ? (workInProgress & 1) | 2
              : workInProgress & 1
          ),
          current)
        : null;
  }
  throw Error(
    "Unknown unit of work tag (" +
      workInProgress.tag +
      "). This error is likely caused by a bug in React. Please file an issue."
  );
}
function unwindWork(workInProgress) {
  switch (workInProgress.tag) {
    case 1:
      isContextProvider(workInProgress.type) && popContext();
      var effectTag = workInProgress.effectTag;
      return effectTag & 4096
        ? ((workInProgress.effectTag = (effectTag & -4097) | 64),
          workInProgress)
        : null;
    case 3:
      popHostContainer();
      pop(didPerformWorkStackCursor);
      pop(contextStackCursor);
      effectTag = workInProgress.effectTag;
      if (0 !== (effectTag & 64))
        throw Error(
          "The root failed to unmount after an error. This is likely a bug in React. Please file an issue."
        );
      workInProgress.effectTag = (effectTag & -4097) | 64;
      return workInProgress;
    case 5:
      return popHostContext(workInProgress), null;
    case 13:
      return (
        pop(suspenseStackCursor),
        (effectTag = workInProgress.effectTag),
        effectTag & 4096
          ? ((workInProgress.effectTag = (effectTag & -4097) | 64),
            workInProgress)
          : null
      );
    case 19:
      return pop(suspenseStackCursor), null;
    case 4:
      return popHostContainer(), null;
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
  throw Error(
    "Expected ReactFiberErrorDialog.showErrorDialog to be a function."
  );
function logCapturedError(capturedError) {
  !1 !==
    ReactNativePrivateInterface.ReactFiberErrorDialog.showErrorDialog(
      capturedError
    ) && console.error(capturedError.error);
}
var PossiblyWeakSet = "function" === typeof WeakSet ? WeakSet : Set;
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
function safelyCallComponentWillUnmount(current, instance) {
  try {
    (instance.props = current.memoizedProps),
      (instance.state = current.memoizedState),
      instance.componentWillUnmount();
  } catch (unmountError) {
    captureCommitPhaseError(current, unmountError);
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
function commitBeforeMutationLifeCycles(current, finishedWork) {
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 15:
    case 22:
      return;
    case 1:
      if (finishedWork.effectTag & 256 && null !== current) {
        var prevProps = current.memoizedProps,
          prevState = current.memoizedState;
        current = finishedWork.stateNode;
        finishedWork = current.getSnapshotBeforeUpdate(
          finishedWork.elementType === finishedWork.type
            ? prevProps
            : resolveDefaultProps(finishedWork.type, prevProps),
          prevState
        );
        current.__reactInternalSnapshotBeforeUpdate = finishedWork;
      }
      return;
    case 3:
    case 5:
    case 6:
    case 4:
    case 17:
      return;
  }
  throw Error(
    "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
  );
}
function commitHookEffectListUnmount(tag, finishedWork) {
  finishedWork = finishedWork.updateQueue;
  finishedWork = null !== finishedWork ? finishedWork.lastEffect : null;
  if (null !== finishedWork) {
    var effect = (finishedWork = finishedWork.next);
    do {
      if ((effect.tag & tag) === tag) {
        var destroy = effect.destroy;
        effect.destroy = void 0;
        void 0 !== destroy && destroy();
      }
      effect = effect.next;
    } while (effect !== finishedWork);
  }
}
function commitHookEffectListMount(tag, finishedWork) {
  finishedWork = finishedWork.updateQueue;
  finishedWork = null !== finishedWork ? finishedWork.lastEffect : null;
  if (null !== finishedWork) {
    var effect = (finishedWork = finishedWork.next);
    do {
      if ((effect.tag & tag) === tag) {
        var create = effect.create;
        effect.destroy = create();
      }
      effect = effect.next;
    } while (effect !== finishedWork);
  }
}
function commitLifeCycles(finishedRoot, current, finishedWork) {
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 15:
    case 22:
      commitHookEffectListMount(3, finishedWork);
      return;
    case 1:
      finishedRoot = finishedWork.stateNode;
      if (finishedWork.effectTag & 4)
        if (null === current) finishedRoot.componentDidMount();
        else {
          var prevProps =
            finishedWork.elementType === finishedWork.type
              ? current.memoizedProps
              : resolveDefaultProps(finishedWork.type, current.memoizedProps);
          finishedRoot.componentDidUpdate(
            prevProps,
            current.memoizedState,
            finishedRoot.__reactInternalSnapshotBeforeUpdate
          );
        }
      current = finishedWork.updateQueue;
      null !== current &&
        commitUpdateQueue(finishedWork, current, finishedRoot);
      return;
    case 3:
      current = finishedWork.updateQueue;
      if (null !== current) {
        finishedRoot = null;
        if (null !== finishedWork.child)
          switch (finishedWork.child.tag) {
            case 5:
              finishedRoot = finishedWork.child.stateNode;
              break;
            case 1:
              finishedRoot = finishedWork.child.stateNode;
          }
        commitUpdateQueue(finishedWork, current, finishedRoot);
      }
      return;
    case 5:
      return;
    case 6:
      return;
    case 4:
      return;
    case 12:
      return;
    case 13:
      return;
    case 19:
    case 17:
    case 20:
    case 21:
      return;
  }
  throw Error(
    "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
  );
}
function commitUnmount(finishedRoot, current$jscomp$0, renderPriorityLevel) {
  "function" === typeof onCommitFiberUnmount &&
    onCommitFiberUnmount(current$jscomp$0);
  switch (current$jscomp$0.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
    case 22:
      finishedRoot = current$jscomp$0.updateQueue;
      if (
        null !== finishedRoot &&
        ((finishedRoot = finishedRoot.lastEffect), null !== finishedRoot)
      ) {
        var firstEffect = finishedRoot.next;
        runWithPriority(
          97 < renderPriorityLevel ? 97 : renderPriorityLevel,
          function() {
            var effect = firstEffect;
            do {
              var _destroy = effect.destroy;
              if (void 0 !== _destroy) {
                var current = current$jscomp$0;
                try {
                  _destroy();
                } catch (error) {
                  captureCommitPhaseError(current, error);
                }
              }
              effect = effect.next;
            } while (effect !== firstEffect);
          }
        );
      }
      break;
    case 1:
      safelyDetachRef(current$jscomp$0);
      renderPriorityLevel = current$jscomp$0.stateNode;
      "function" === typeof renderPriorityLevel.componentWillUnmount &&
        safelyCallComponentWillUnmount(current$jscomp$0, renderPriorityLevel);
      break;
    case 5:
      safelyDetachRef(current$jscomp$0);
      break;
    case 4:
      unmountHostComponents(
        finishedRoot,
        current$jscomp$0,
        renderPriorityLevel
      );
  }
}
function detachFiber(current) {
  var alternate = current.alternate;
  current.return = null;
  current.child = null;
  current.memoizedState = null;
  current.updateQueue = null;
  current.dependencies = null;
  current.alternate = null;
  current.firstEffect = null;
  current.lastEffect = null;
  current.pendingProps = null;
  current.memoizedProps = null;
  current.stateNode = null;
  null !== alternate && detachFiber(alternate);
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
    throw Error(
      "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue."
    );
  }
  parent = parentFiber.stateNode;
  switch (parentFiber.tag) {
    case 5:
      var isContainer = !1;
      break;
    case 3:
      parent = parent.containerInfo;
      isContainer = !0;
      break;
    case 4:
      parent = parent.containerInfo;
      isContainer = !0;
      break;
    default:
      throw Error(
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
      5 !== parentFiber.tag && 6 !== parentFiber.tag && 18 !== parentFiber.tag;

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
  isContainer
    ? insertOrAppendPlacementNodeIntoContainer(
        finishedWork,
        parentFiber,
        parent
      )
    : insertOrAppendPlacementNode(finishedWork, parentFiber, parent);
}
function insertOrAppendPlacementNodeIntoContainer(node, before, parent) {
  var tag = node.tag,
    isHost = 5 === tag || 6 === tag;
  if (isHost)
    if (((node = isHost ? node.stateNode : node.stateNode.instance), before)) {
      if ("number" === typeof parent)
        throw Error("Container does not support insertBefore operation");
    } else
      ReactNativePrivateInterface.UIManager.setChildren(parent, [
        "number" === typeof node ? node : node._nativeTag
      ]);
  else if (4 !== tag && ((node = node.child), null !== node))
    for (
      insertOrAppendPlacementNodeIntoContainer(node, before, parent),
        node = node.sibling;
      null !== node;

    )
      insertOrAppendPlacementNodeIntoContainer(node, before, parent),
        (node = node.sibling);
}
function insertOrAppendPlacementNode(node, before, parent) {
  var tag = node.tag,
    isHost = 5 === tag || 6 === tag;
  if (isHost)
    (node = isHost ? node.stateNode : node.stateNode.instance),
      before
        ? ((tag = parent._children),
          (isHost = tag.indexOf(node)),
          0 <= isHost
            ? (tag.splice(isHost, 1),
              (before = tag.indexOf(before)),
              tag.splice(before, 0, node),
              ReactNativePrivateInterface.UIManager.manageChildren(
                parent._nativeTag,
                [isHost],
                [before],
                [],
                [],
                []
              ))
            : ((before = tag.indexOf(before)),
              tag.splice(before, 0, node),
              ReactNativePrivateInterface.UIManager.manageChildren(
                parent._nativeTag,
                [],
                [],
                ["number" === typeof node ? node : node._nativeTag],
                [before],
                []
              )))
        : ((before = "number" === typeof node ? node : node._nativeTag),
          (tag = parent._children),
          (isHost = tag.indexOf(node)),
          0 <= isHost
            ? (tag.splice(isHost, 1),
              tag.push(node),
              ReactNativePrivateInterface.UIManager.manageChildren(
                parent._nativeTag,
                [isHost],
                [tag.length - 1],
                [],
                [],
                []
              ))
            : (tag.push(node),
              ReactNativePrivateInterface.UIManager.manageChildren(
                parent._nativeTag,
                [],
                [],
                [before],
                [tag.length - 1],
                []
              )));
  else if (4 !== tag && ((node = node.child), null !== node))
    for (
      insertOrAppendPlacementNode(node, before, parent), node = node.sibling;
      null !== node;

    )
      insertOrAppendPlacementNode(node, before, parent), (node = node.sibling);
}
function unmountHostComponents(
  finishedRoot$jscomp$0,
  current,
  renderPriorityLevel$jscomp$0
) {
  for (
    var node = current,
      currentParentIsValid = !1,
      currentParent,
      currentParentIsContainer;
    ;

  ) {
    if (!currentParentIsValid) {
      currentParentIsValid = node.return;
      a: for (;;) {
        if (null === currentParentIsValid)
          throw Error(
            "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue."
          );
        currentParent = currentParentIsValid.stateNode;
        switch (currentParentIsValid.tag) {
          case 5:
            currentParentIsContainer = !1;
            break a;
          case 3:
            currentParent = currentParent.containerInfo;
            currentParentIsContainer = !0;
            break a;
          case 4:
            currentParent = currentParent.containerInfo;
            currentParentIsContainer = !0;
            break a;
        }
        currentParentIsValid = currentParentIsValid.return;
      }
      currentParentIsValid = !0;
    }
    if (5 === node.tag || 6 === node.tag) {
      a: for (
        var finishedRoot = finishedRoot$jscomp$0,
          root = node,
          renderPriorityLevel = renderPriorityLevel$jscomp$0,
          node$jscomp$0 = root;
        ;

      )
        if (
          (commitUnmount(finishedRoot, node$jscomp$0, renderPriorityLevel),
          null !== node$jscomp$0.child && 4 !== node$jscomp$0.tag)
        )
          (node$jscomp$0.child.return = node$jscomp$0),
            (node$jscomp$0 = node$jscomp$0.child);
        else {
          if (node$jscomp$0 === root) break a;
          for (; null === node$jscomp$0.sibling; ) {
            if (null === node$jscomp$0.return || node$jscomp$0.return === root)
              break a;
            node$jscomp$0 = node$jscomp$0.return;
          }
          node$jscomp$0.sibling.return = node$jscomp$0.return;
          node$jscomp$0 = node$jscomp$0.sibling;
        }
      currentParentIsContainer
        ? ((finishedRoot = currentParent),
          recursivelyUncacheFiberNode(node.stateNode),
          ReactNativePrivateInterface.UIManager.manageChildren(
            finishedRoot,
            [],
            [],
            [],
            [],
            [0]
          ))
        : ((finishedRoot = currentParent),
          (renderPriorityLevel = node.stateNode),
          recursivelyUncacheFiberNode(renderPriorityLevel),
          (root = finishedRoot._children),
          (renderPriorityLevel = root.indexOf(renderPriorityLevel)),
          root.splice(renderPriorityLevel, 1),
          ReactNativePrivateInterface.UIManager.manageChildren(
            finishedRoot._nativeTag,
            [],
            [],
            [],
            [],
            [renderPriorityLevel]
          ));
    } else if (4 === node.tag) {
      if (null !== node.child) {
        currentParent = node.stateNode.containerInfo;
        currentParentIsContainer = !0;
        node.child.return = node;
        node = node.child;
        continue;
      }
    } else if (
      (commitUnmount(finishedRoot$jscomp$0, node, renderPriorityLevel$jscomp$0),
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
    case 0:
    case 11:
    case 14:
    case 15:
    case 22:
      commitHookEffectListUnmount(3, finishedWork);
      return;
    case 1:
      return;
    case 5:
      var instance = finishedWork.stateNode;
      if (null != instance) {
        var newProps = finishedWork.memoizedProps;
        current = null !== current ? current.memoizedProps : newProps;
        var updatePayload = finishedWork.updateQueue;
        finishedWork.updateQueue = null;
        null !== updatePayload &&
          ((finishedWork = instance.viewConfig),
          instanceProps.set(instance._nativeTag, newProps),
          (newProps = diffProperties(
            null,
            current,
            newProps,
            finishedWork.validAttributes
          )),
          null != newProps &&
            ReactNativePrivateInterface.UIManager.updateView(
              instance._nativeTag,
              finishedWork.uiViewClassName,
              newProps
            ));
      }
      return;
    case 6:
      if (null === finishedWork.stateNode)
        throw Error(
          "This should have a text node initialized. This error is likely caused by a bug in React. Please file an issue."
        );
      ReactNativePrivateInterface.UIManager.updateView(
        finishedWork.stateNode,
        "RCTRawText",
        { text: finishedWork.memoizedProps }
      );
      return;
    case 3:
      return;
    case 12:
      return;
    case 13:
      instance = finishedWork;
      null === finishedWork.memoizedState
        ? (newProps = !1)
        : ((newProps = !0),
          (instance = finishedWork.child),
          (globalMostRecentFallbackTime = now()));
      if (null !== instance)
        a: for (current = instance; ; ) {
          if (5 === current.tag)
            if (((updatePayload = current.stateNode), newProps)) {
              var viewConfig = updatePayload.viewConfig;
              var updatePayload$jscomp$0 = diffProperties(
                null,
                emptyObject,
                { style: { display: "none" } },
                viewConfig.validAttributes
              );
              ReactNativePrivateInterface.UIManager.updateView(
                updatePayload._nativeTag,
                viewConfig.uiViewClassName,
                updatePayload$jscomp$0
              );
            } else {
              updatePayload = current.stateNode;
              updatePayload$jscomp$0 = current.memoizedProps;
              viewConfig = updatePayload.viewConfig;
              var prevProps = Object.assign({}, updatePayload$jscomp$0, {
                style: [updatePayload$jscomp$0.style, { display: "none" }]
              });
              updatePayload$jscomp$0 = diffProperties(
                null,
                prevProps,
                updatePayload$jscomp$0,
                viewConfig.validAttributes
              );
              ReactNativePrivateInterface.UIManager.updateView(
                updatePayload._nativeTag,
                viewConfig.uiViewClassName,
                updatePayload$jscomp$0
              );
            }
          else {
            if (6 === current.tag) throw Error("Not yet implemented.");
            if (
              13 === current.tag &&
              null !== current.memoizedState &&
              null === current.memoizedState.dehydrated
            ) {
              updatePayload = current.child.sibling;
              updatePayload.return = current;
              current = updatePayload;
              continue;
            } else if (null !== current.child) {
              current.child.return = current;
              current = current.child;
              continue;
            }
          }
          if (current === instance) break;
          for (; null === current.sibling; ) {
            if (null === current.return || current.return === instance) break a;
            current = current.return;
          }
          current.sibling.return = current.return;
          current = current.sibling;
        }
      attachSuspenseRetryListeners(finishedWork);
      return;
    case 19:
      attachSuspenseRetryListeners(finishedWork);
      return;
    case 17:
      return;
  }
  throw Error(
    "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
  );
}
function attachSuspenseRetryListeners(finishedWork) {
  var thenables = finishedWork.updateQueue;
  if (null !== thenables) {
    finishedWork.updateQueue = null;
    var retryCache = finishedWork.stateNode;
    null === retryCache &&
      (retryCache = finishedWork.stateNode = new PossiblyWeakSet());
    thenables.forEach(function(thenable) {
      var retry = resolveRetryThenable.bind(null, finishedWork, thenable);
      retryCache.has(thenable) ||
        (retryCache.add(thenable), thenable.then(retry, retry));
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
  ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher,
  ReactCurrentOwner$2 = ReactSharedInternals.ReactCurrentOwner,
  NoContext = 0,
  LegacyUnbatchedContext = 8,
  RenderContext = 16,
  CommitContext = 32,
  RootIncomplete = 0,
  RootFatalErrored = 1,
  RootErrored = 2,
  RootSuspended = 3,
  RootSuspendedWithDelay = 4,
  RootCompleted = 5,
  executionContext = NoContext,
  workInProgressRoot = null,
  workInProgress = null,
  renderExpirationTime$1 = 0,
  workInProgressRootExitStatus = RootIncomplete,
  workInProgressRootFatalError = null,
  workInProgressRootLatestProcessedExpirationTime = 1073741823,
  workInProgressRootLatestSuspenseTimeout = 1073741823,
  workInProgressRootCanSuspendUsingConfig = null,
  workInProgressRootNextUnprocessedUpdateTime = 0,
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
  rootsWithPendingDiscreteUpdates = null,
  nestedUpdateCount = 0,
  rootWithNestedUpdates = null,
  currentEventTime = 0;
function requestCurrentTimeForUpdate() {
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
    return renderExpirationTime$1;
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
        currentTime = 2;
        break;
      default:
        throw Error("Expected a valid priority level");
    }
  null !== workInProgressRoot &&
    currentTime === renderExpirationTime$1 &&
    --currentTime;
  return currentTime;
}
function scheduleWork(fiber, expirationTime) {
  if (50 < nestedUpdateCount)
    throw ((nestedUpdateCount = 0),
    (rootWithNestedUpdates = null),
    Error(
      "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops."
    ));
  fiber = markUpdateTimeFromFiberToRoot(fiber, expirationTime);
  if (null !== fiber) {
    var priorityLevel = getCurrentPriorityLevel();
    1073741823 === expirationTime
      ? (executionContext & LegacyUnbatchedContext) !== NoContext &&
        (executionContext & (RenderContext | CommitContext)) === NoContext
        ? performSyncWorkOnRoot(fiber)
        : (ensureRootIsScheduled(fiber),
          executionContext === NoContext && flushSyncCallbackQueue())
      : ensureRootIsScheduled(fiber);
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
    (workInProgressRoot === root &&
      (markUnprocessedUpdateTime(expirationTime),
      workInProgressRootExitStatus === RootSuspendedWithDelay &&
        markRootSuspendedAtTime(root, renderExpirationTime$1)),
    markRootUpdatedAtTime(root, expirationTime));
  return root;
}
function getNextRootExpirationTimeToWorkOn(root) {
  var lastExpiredTime = root.lastExpiredTime;
  if (0 !== lastExpiredTime) return lastExpiredTime;
  lastExpiredTime = root.firstPendingTime;
  if (!isRootSuspendedAtTime(root, lastExpiredTime)) return lastExpiredTime;
  var lastPingedTime = root.lastPingedTime;
  root = root.nextKnownPendingLevel;
  root = lastPingedTime > root ? lastPingedTime : root;
  return 2 >= root && lastExpiredTime !== root ? 0 : root;
}
function ensureRootIsScheduled(root) {
  if (0 !== root.lastExpiredTime)
    (root.callbackExpirationTime = 1073741823),
      (root.callbackPriority = 99),
      (root.callbackNode = scheduleSyncCallback(
        performSyncWorkOnRoot.bind(null, root)
      ));
  else {
    var expirationTime = getNextRootExpirationTimeToWorkOn(root),
      existingCallbackNode = root.callbackNode;
    if (0 === expirationTime)
      null !== existingCallbackNode &&
        ((root.callbackNode = null),
        (root.callbackExpirationTime = 0),
        (root.callbackPriority = 90));
    else {
      var priorityLevel = requestCurrentTimeForUpdate();
      1073741823 === expirationTime
        ? (priorityLevel = 99)
        : 1 === expirationTime || 2 === expirationTime
        ? (priorityLevel = 95)
        : ((priorityLevel =
            10 * (1073741821 - expirationTime) -
            10 * (1073741821 - priorityLevel)),
          (priorityLevel =
            0 >= priorityLevel
              ? 99
              : 250 >= priorityLevel
              ? 98
              : 5250 >= priorityLevel
              ? 97
              : 95));
      if (null !== existingCallbackNode) {
        var existingCallbackPriority = root.callbackPriority;
        if (
          root.callbackExpirationTime === expirationTime &&
          existingCallbackPriority >= priorityLevel
        )
          return;
        existingCallbackNode !== fakeCallbackNode &&
          Scheduler_cancelCallback(existingCallbackNode);
      }
      root.callbackExpirationTime = expirationTime;
      root.callbackPriority = priorityLevel;
      expirationTime =
        1073741823 === expirationTime
          ? scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root))
          : scheduleCallback(
              priorityLevel,
              performConcurrentWorkOnRoot.bind(null, root),
              { timeout: 10 * (1073741821 - expirationTime) - now() }
            );
      root.callbackNode = expirationTime;
    }
  }
}
function performConcurrentWorkOnRoot(root, didTimeout) {
  currentEventTime = 0;
  if (didTimeout) {
    didTimeout = requestCurrentTimeForUpdate();
    var lastExpiredTime = root.lastExpiredTime;
    if (0 === lastExpiredTime || lastExpiredTime > didTimeout)
      root.lastExpiredTime = didTimeout;
    ensureRootIsScheduled(root);
    return null;
  }
  lastExpiredTime = getNextRootExpirationTimeToWorkOn(root);
  if (0 === lastExpiredTime) return null;
  didTimeout = root.callbackNode;
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
    throw Error("Should not already be working.");
  flushPassiveEffects();
  var expirationTime = lastExpiredTime;
  var exitStatus = executionContext;
  executionContext |= RenderContext;
  var prevDispatcher = pushDispatcher();
  (root === workInProgressRoot && expirationTime === renderExpirationTime$1) ||
    prepareFreshStack(root, expirationTime);
  do
    try {
      workLoopConcurrent();
      break;
    } catch (thrownValue) {
      handleError(root, thrownValue);
    }
  while (1);
  resetContextDependencies();
  ReactCurrentDispatcher$1.current = prevDispatcher;
  executionContext = exitStatus;
  null !== workInProgress
    ? (exitStatus = RootIncomplete)
    : ((workInProgressRoot = null),
      (exitStatus = workInProgressRootExitStatus));
  if (exitStatus !== RootIncomplete) {
    exitStatus === RootErrored &&
      ((lastExpiredTime = 2 < lastExpiredTime ? 2 : lastExpiredTime),
      (exitStatus = renderRootSync(root, lastExpiredTime)));
    if (exitStatus === RootFatalErrored)
      throw ((didTimeout = workInProgressRootFatalError),
      prepareFreshStack(root, lastExpiredTime),
      markRootSuspendedAtTime(root, lastExpiredTime),
      ensureRootIsScheduled(root),
      didTimeout);
    expirationTime = root.finishedWork = root.current.alternate;
    root.finishedExpirationTime = lastExpiredTime;
    switch (exitStatus) {
      case RootIncomplete:
      case RootFatalErrored:
        throw Error("Root did not complete. This is a bug in React.");
      case RootErrored:
        commitRoot(root);
        break;
      case RootSuspended:
        markRootSuspendedAtTime(root, lastExpiredTime);
        exitStatus = root.lastSuspendedTime;
        lastExpiredTime === exitStatus &&
          (root.nextKnownPendingLevel = getRemainingExpirationTime(
            expirationTime
          ));
        if (
          1073741823 === workInProgressRootLatestProcessedExpirationTime &&
          ((expirationTime =
            globalMostRecentFallbackTime + FALLBACK_THROTTLE_MS - now()),
          10 < expirationTime)
        ) {
          if (
            workInProgressRootHasPendingPing &&
            ((prevDispatcher = root.lastPingedTime),
            0 === prevDispatcher || prevDispatcher >= lastExpiredTime)
          ) {
            root.lastPingedTime = lastExpiredTime;
            prepareFreshStack(root, lastExpiredTime);
            break;
          }
          prevDispatcher = getNextRootExpirationTimeToWorkOn(root);
          if (0 !== prevDispatcher && prevDispatcher !== lastExpiredTime) break;
          if (0 !== exitStatus && exitStatus !== lastExpiredTime) {
            root.lastPingedTime = exitStatus;
            break;
          }
          root.timeoutHandle = scheduleTimeout(
            commitRoot.bind(null, root),
            expirationTime
          );
          break;
        }
        commitRoot(root);
        break;
      case RootSuspendedWithDelay:
        markRootSuspendedAtTime(root, lastExpiredTime);
        exitStatus = root.lastSuspendedTime;
        lastExpiredTime === exitStatus &&
          (root.nextKnownPendingLevel = getRemainingExpirationTime(
            expirationTime
          ));
        if (
          workInProgressRootHasPendingPing &&
          ((expirationTime = root.lastPingedTime),
          0 === expirationTime || expirationTime >= lastExpiredTime)
        ) {
          root.lastPingedTime = lastExpiredTime;
          prepareFreshStack(root, lastExpiredTime);
          break;
        }
        expirationTime = getNextRootExpirationTimeToWorkOn(root);
        if (0 !== expirationTime && expirationTime !== lastExpiredTime) break;
        if (0 !== exitStatus && exitStatus !== lastExpiredTime) {
          root.lastPingedTime = exitStatus;
          break;
        }
        1073741823 !== workInProgressRootLatestSuspenseTimeout
          ? (expirationTime =
              10 * (1073741821 - workInProgressRootLatestSuspenseTimeout) -
              now())
          : 1073741823 === workInProgressRootLatestProcessedExpirationTime
          ? (expirationTime = 0)
          : ((expirationTime =
              10 *
                (1073741821 - workInProgressRootLatestProcessedExpirationTime) -
              5e3),
            (exitStatus = now()),
            (lastExpiredTime =
              10 * (1073741821 - lastExpiredTime) - exitStatus),
            (expirationTime = exitStatus - expirationTime),
            0 > expirationTime && (expirationTime = 0),
            (expirationTime =
              (120 > expirationTime
                ? 120
                : 480 > expirationTime
                ? 480
                : 1080 > expirationTime
                ? 1080
                : 1920 > expirationTime
                ? 1920
                : 3e3 > expirationTime
                ? 3e3
                : 4320 > expirationTime
                ? 4320
                : 1960 * ceil(expirationTime / 1960)) - expirationTime),
            lastExpiredTime < expirationTime &&
              (expirationTime = lastExpiredTime));
        if (10 < expirationTime) {
          root.timeoutHandle = scheduleTimeout(
            commitRoot.bind(null, root),
            expirationTime
          );
          break;
        }
        commitRoot(root);
        break;
      case RootCompleted:
        if (
          1073741823 !== workInProgressRootLatestProcessedExpirationTime &&
          null !== workInProgressRootCanSuspendUsingConfig
        ) {
          prevDispatcher = workInProgressRootLatestProcessedExpirationTime;
          var suspenseConfig = workInProgressRootCanSuspendUsingConfig;
          expirationTime = suspenseConfig.busyMinDurationMs | 0;
          0 >= expirationTime
            ? (expirationTime = 0)
            : ((exitStatus = suspenseConfig.busyDelayMs | 0),
              (prevDispatcher =
                now() -
                (10 * (1073741821 - prevDispatcher) -
                  (suspenseConfig.timeoutMs | 0 || 5e3))),
              (expirationTime =
                prevDispatcher <= exitStatus
                  ? 0
                  : exitStatus + expirationTime - prevDispatcher));
          if (10 < expirationTime) {
            markRootSuspendedAtTime(root, lastExpiredTime);
            root.timeoutHandle = scheduleTimeout(
              commitRoot.bind(null, root),
              expirationTime
            );
            break;
          }
        }
        commitRoot(root);
        break;
      default:
        throw Error("Unknown root exit status.");
    }
  }
  ensureRootIsScheduled(root);
  return root.callbackNode === didTimeout
    ? performConcurrentWorkOnRoot.bind(null, root)
    : null;
}
function performSyncWorkOnRoot(root) {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
    throw Error("Should not already be working.");
  flushPassiveEffects();
  var lastExpiredTime = root.lastExpiredTime;
  lastExpiredTime =
    0 !== lastExpiredTime
      ? root === workInProgressRoot && renderExpirationTime$1 >= lastExpiredTime
        ? renderExpirationTime$1
        : lastExpiredTime
      : 1073741823;
  var exitStatus = renderRootSync(root, lastExpiredTime);
  0 !== root.tag &&
    exitStatus === RootErrored &&
    ((lastExpiredTime = 2 < lastExpiredTime ? 2 : lastExpiredTime),
    (exitStatus = renderRootSync(root, lastExpiredTime)));
  if (exitStatus === RootFatalErrored)
    throw ((exitStatus = workInProgressRootFatalError),
    prepareFreshStack(root, lastExpiredTime),
    markRootSuspendedAtTime(root, lastExpiredTime),
    ensureRootIsScheduled(root),
    exitStatus);
  root.finishedWork = root.current.alternate;
  root.finishedExpirationTime = lastExpiredTime;
  commitRoot(root);
  ensureRootIsScheduled(root);
  return null;
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
          interruptedWork = interruptedWork.type.childContextTypes;
          null !== interruptedWork &&
            void 0 !== interruptedWork &&
            popContext();
          break;
        case 3:
          popHostContainer();
          pop(didPerformWorkStackCursor);
          pop(contextStackCursor);
          break;
        case 5:
          popHostContext(interruptedWork);
          break;
        case 4:
          popHostContainer();
          break;
        case 13:
          pop(suspenseStackCursor);
          break;
        case 19:
          pop(suspenseStackCursor);
          break;
        case 10:
          popProvider(interruptedWork);
      }
      timeoutHandle = timeoutHandle.return;
    }
  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null);
  renderExpirationTime$1 = expirationTime;
  workInProgressRootExitStatus = RootIncomplete;
  workInProgressRootFatalError = null;
  workInProgressRootLatestSuspenseTimeout = workInProgressRootLatestProcessedExpirationTime = 1073741823;
  workInProgressRootCanSuspendUsingConfig = null;
  workInProgressRootNextUnprocessedUpdateTime = 0;
  workInProgressRootHasPendingPing = !1;
}
function handleError(root$jscomp$0, thrownValue) {
  do {
    try {
      resetContextDependencies();
      ReactCurrentDispatcher.current = ContextOnlyDispatcher;
      if (didScheduleRenderPhaseUpdate)
        for (
          var hook = currentlyRenderingFiber$1.memoizedState;
          null !== hook;

        ) {
          var queue = hook.queue;
          null !== queue && (queue.pending = null);
          hook = hook.next;
        }
      renderExpirationTime = 0;
      workInProgressHook = currentHook = currentlyRenderingFiber$1 = null;
      didScheduleRenderPhaseUpdate = !1;
      if (null === workInProgress || null === workInProgress.return)
        return (
          (workInProgressRootExitStatus = RootFatalErrored),
          (workInProgressRootFatalError = thrownValue),
          (workInProgress = null)
        );
      a: {
        var root = root$jscomp$0,
          returnFiber = workInProgress.return,
          sourceFiber = workInProgress,
          value = thrownValue;
        thrownValue = renderExpirationTime$1;
        sourceFiber.effectTag |= 2048;
        sourceFiber.firstEffect = sourceFiber.lastEffect = null;
        if (
          null !== value &&
          "object" === typeof value &&
          "function" === typeof value.then
        ) {
          var thenable = value;
          if (0 === (sourceFiber.mode & 2)) {
            var currentSource = sourceFiber.alternate;
            currentSource
              ? ((sourceFiber.updateQueue = currentSource.updateQueue),
                (sourceFiber.memoizedState = currentSource.memoizedState),
                (sourceFiber.expirationTime = currentSource.expirationTime))
              : ((sourceFiber.updateQueue = null),
                (sourceFiber.memoizedState = null));
          }
          var hasInvisibleParentBoundary =
              0 !== (suspenseStackCursor.current & 1),
            _workInProgress = returnFiber;
          do {
            var JSCompiler_temp;
            if ((JSCompiler_temp = 13 === _workInProgress.tag)) {
              var nextState = _workInProgress.memoizedState;
              if (null !== nextState)
                JSCompiler_temp = null !== nextState.dehydrated ? !0 : !1;
              else {
                var props = _workInProgress.memoizedProps;
                JSCompiler_temp =
                  void 0 === props.fallback
                    ? !1
                    : !0 !== props.unstable_avoidThisFallback
                    ? !0
                    : hasInvisibleParentBoundary
                    ? !1
                    : !0;
              }
            }
            if (JSCompiler_temp) {
              var thenables = _workInProgress.updateQueue;
              if (null === thenables) {
                var updateQueue = new Set();
                updateQueue.add(thenable);
                _workInProgress.updateQueue = updateQueue;
              } else thenables.add(thenable);
              if (0 === (_workInProgress.mode & 2)) {
                _workInProgress.effectTag |= 64;
                sourceFiber.effectTag &= -2981;
                if (1 === sourceFiber.tag)
                  if (null === sourceFiber.alternate) sourceFiber.tag = 17;
                  else {
                    var update = createUpdate(1073741823, null);
                    update.tag = 2;
                    enqueueUpdate(sourceFiber, update);
                  }
                sourceFiber.expirationTime = 1073741823;
                break a;
              }
              value = void 0;
              sourceFiber = thrownValue;
              var pingCache = root.pingCache;
              null === pingCache
                ? ((pingCache = root.pingCache = new PossiblyWeakMap()),
                  (value = new Set()),
                  pingCache.set(thenable, value))
                : ((value = pingCache.get(thenable)),
                  void 0 === value &&
                    ((value = new Set()), pingCache.set(thenable, value)));
              if (!value.has(sourceFiber)) {
                value.add(sourceFiber);
                var ping = pingSuspendedRoot.bind(
                  null,
                  root,
                  thenable,
                  sourceFiber
                );
                thenable.then(ping, ping);
              }
              _workInProgress.effectTag |= 4096;
              _workInProgress.expirationTime = thrownValue;
              break a;
            }
            _workInProgress = _workInProgress.return;
          } while (null !== _workInProgress);
          value = Error(
            (getComponentName(sourceFiber.type) || "A React component") +
              " suspended while rendering, but no fallback UI was specified.\n\nAdd a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display." +
              getStackByFiberInDevAndProd(sourceFiber)
          );
        }
        workInProgressRootExitStatus !== RootCompleted &&
          (workInProgressRootExitStatus = RootErrored);
        value = createCapturedValue(value, sourceFiber);
        _workInProgress = returnFiber;
        do {
          switch (_workInProgress.tag) {
            case 3:
              thenable = value;
              _workInProgress.effectTag |= 4096;
              _workInProgress.expirationTime = thrownValue;
              var _update = createRootErrorUpdate(
                _workInProgress,
                thenable,
                thrownValue
              );
              enqueueCapturedUpdate(_workInProgress, _update);
              break a;
            case 1:
              thenable = value;
              var ctor = _workInProgress.type,
                instance = _workInProgress.stateNode;
              if (
                0 === (_workInProgress.effectTag & 64) &&
                ("function" === typeof ctor.getDerivedStateFromError ||
                  (null !== instance &&
                    "function" === typeof instance.componentDidCatch &&
                    (null === legacyErrorBoundariesThatAlreadyFailed ||
                      !legacyErrorBoundariesThatAlreadyFailed.has(instance))))
              ) {
                _workInProgress.effectTag |= 4096;
                _workInProgress.expirationTime = thrownValue;
                var _update2 = createClassErrorUpdate(
                  _workInProgress,
                  thenable,
                  thrownValue
                );
                enqueueCapturedUpdate(_workInProgress, _update2);
                break a;
              }
          }
          _workInProgress = _workInProgress.return;
        } while (null !== _workInProgress);
      }
      workInProgress = completeUnitOfWork(workInProgress);
    } catch (yetAnotherThrownValue) {
      thrownValue = yetAnotherThrownValue;
      continue;
    }
    break;
  } while (1);
}
function pushDispatcher() {
  var prevDispatcher = ReactCurrentDispatcher$1.current;
  ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
  return null === prevDispatcher ? ContextOnlyDispatcher : prevDispatcher;
}
function markRenderEventTimeAndConfig(expirationTime, suspenseConfig) {
  expirationTime < workInProgressRootLatestProcessedExpirationTime &&
    2 < expirationTime &&
    (workInProgressRootLatestProcessedExpirationTime = expirationTime);
  null !== suspenseConfig &&
    expirationTime < workInProgressRootLatestSuspenseTimeout &&
    2 < expirationTime &&
    ((workInProgressRootLatestSuspenseTimeout = expirationTime),
    (workInProgressRootCanSuspendUsingConfig = suspenseConfig));
}
function markUnprocessedUpdateTime(expirationTime) {
  expirationTime > workInProgressRootNextUnprocessedUpdateTime &&
    (workInProgressRootNextUnprocessedUpdateTime = expirationTime);
}
function renderRootSync(root, expirationTime) {
  var prevExecutionContext = executionContext;
  executionContext |= RenderContext;
  var prevDispatcher = pushDispatcher();
  (root === workInProgressRoot && expirationTime === renderExpirationTime$1) ||
    prepareFreshStack(root, expirationTime);
  do
    try {
      workLoopSync();
      break;
    } catch (thrownValue) {
      handleError(root, thrownValue);
    }
  while (1);
  resetContextDependencies();
  executionContext = prevExecutionContext;
  ReactCurrentDispatcher$1.current = prevDispatcher;
  if (null !== workInProgress)
    throw Error(
      "Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue."
    );
  workInProgressRoot = null;
  return workInProgressRootExitStatus;
}
function workLoopSync() {
  for (; null !== workInProgress; )
    workInProgress = performUnitOfWork(workInProgress);
}
function workLoopConcurrent() {
  for (; null !== workInProgress && !shouldYield(); )
    workInProgress = performUnitOfWork(workInProgress);
}
function performUnitOfWork(unitOfWork) {
  var next = beginWork$1(
    unitOfWork.alternate,
    unitOfWork,
    renderExpirationTime$1
  );
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  null === next && (next = completeUnitOfWork(unitOfWork));
  ReactCurrentOwner$2.current = null;
  return next;
}
function completeUnitOfWork(unitOfWork) {
  workInProgress = unitOfWork;
  do {
    var current = workInProgress.alternate;
    unitOfWork = workInProgress.return;
    if (0 === (workInProgress.effectTag & 2048)) {
      current = completeWork(current, workInProgress, renderExpirationTime$1);
      if (
        1 === renderExpirationTime$1 ||
        1 !== workInProgress.childExpirationTime
      ) {
        for (
          var newChildExpirationTime = 0, _child = workInProgress.child;
          null !== _child;

        ) {
          var _childUpdateExpirationTime = _child.expirationTime,
            _childChildExpirationTime = _child.childExpirationTime;
          _childUpdateExpirationTime > newChildExpirationTime &&
            (newChildExpirationTime = _childUpdateExpirationTime);
          _childChildExpirationTime > newChildExpirationTime &&
            (newChildExpirationTime = _childChildExpirationTime);
          _child = _child.sibling;
        }
        workInProgress.childExpirationTime = newChildExpirationTime;
      }
      if (null !== current) return current;
      null !== unitOfWork &&
        0 === (unitOfWork.effectTag & 2048) &&
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
      current = unwindWork(workInProgress);
      if (null !== current) return (current.effectTag &= 2047), current;
      null !== unitOfWork &&
        ((unitOfWork.firstEffect = unitOfWork.lastEffect = null),
        (unitOfWork.effectTag |= 2048));
    }
    current = workInProgress.sibling;
    if (null !== current) return current;
    workInProgress = unitOfWork;
  } while (null !== workInProgress);
  workInProgressRootExitStatus === RootIncomplete &&
    (workInProgressRootExitStatus = RootCompleted);
  return null;
}
function getRemainingExpirationTime(fiber) {
  var updateExpirationTime = fiber.expirationTime;
  fiber = fiber.childExpirationTime;
  return updateExpirationTime > fiber ? updateExpirationTime : fiber;
}
function commitRoot(root) {
  var renderPriorityLevel = getCurrentPriorityLevel();
  runWithPriority(99, commitRootImpl.bind(null, root, renderPriorityLevel));
  return null;
}
function commitRootImpl(root$jscomp$0, renderPriorityLevel$jscomp$0) {
  do flushPassiveEffects();
  while (null !== rootWithPendingPassiveEffects);
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
    throw Error("Should not already be working.");
  var finishedWork = root$jscomp$0.finishedWork,
    expirationTime = root$jscomp$0.finishedExpirationTime;
  if (null === finishedWork) return null;
  root$jscomp$0.finishedWork = null;
  root$jscomp$0.finishedExpirationTime = 0;
  if (finishedWork === root$jscomp$0.current)
    throw Error(
      "Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue."
    );
  root$jscomp$0.callbackNode = null;
  root$jscomp$0.callbackExpirationTime = 0;
  root$jscomp$0.callbackPriority = 90;
  root$jscomp$0.nextKnownPendingLevel = 0;
  var remainingExpirationTimeBeforeCommit = getRemainingExpirationTime(
    finishedWork
  );
  root$jscomp$0.firstPendingTime = remainingExpirationTimeBeforeCommit;
  expirationTime <= root$jscomp$0.lastSuspendedTime
    ? (root$jscomp$0.firstSuspendedTime = root$jscomp$0.lastSuspendedTime = root$jscomp$0.nextKnownPendingLevel = 0)
    : expirationTime <= root$jscomp$0.firstSuspendedTime &&
      (root$jscomp$0.firstSuspendedTime = expirationTime - 1);
  expirationTime <= root$jscomp$0.lastPingedTime &&
    (root$jscomp$0.lastPingedTime = 0);
  expirationTime <= root$jscomp$0.lastExpiredTime &&
    (root$jscomp$0.lastExpiredTime = 0);
  root$jscomp$0 === workInProgressRoot &&
    ((workInProgress = workInProgressRoot = null),
    (renderExpirationTime$1 = 0));
  1 < finishedWork.effectTag
    ? null !== finishedWork.lastEffect
      ? ((finishedWork.lastEffect.nextEffect = finishedWork),
        (remainingExpirationTimeBeforeCommit = finishedWork.firstEffect))
      : (remainingExpirationTimeBeforeCommit = finishedWork)
    : (remainingExpirationTimeBeforeCommit = finishedWork.firstEffect);
  if (null !== remainingExpirationTimeBeforeCommit) {
    var prevExecutionContext = executionContext;
    executionContext |= CommitContext;
    ReactCurrentOwner$2.current = null;
    nextEffect = remainingExpirationTimeBeforeCommit;
    do
      try {
        commitBeforeMutationEffects();
      } catch (error) {
        if (null === nextEffect) throw Error("Should be working on an effect.");
        captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    while (null !== nextEffect);
    nextEffect = remainingExpirationTimeBeforeCommit;
    do
      try {
        for (
          var root = root$jscomp$0,
            renderPriorityLevel = renderPriorityLevel$jscomp$0;
          null !== nextEffect;

        ) {
          var effectTag = nextEffect.effectTag;
          if (effectTag & 128) {
            var current = nextEffect.alternate;
            if (null !== current) {
              var currentRef = current.ref;
              null !== currentRef &&
                ("function" === typeof currentRef
                  ? currentRef(null)
                  : (currentRef.current = null));
            }
          }
          switch (effectTag & 1038) {
            case 2:
              commitPlacement(nextEffect);
              nextEffect.effectTag &= -3;
              break;
            case 6:
              commitPlacement(nextEffect);
              nextEffect.effectTag &= -3;
              commitWork(nextEffect.alternate, nextEffect);
              break;
            case 1024:
              nextEffect.effectTag &= -1025;
              break;
            case 1028:
              nextEffect.effectTag &= -1025;
              commitWork(nextEffect.alternate, nextEffect);
              break;
            case 4:
              commitWork(nextEffect.alternate, nextEffect);
              break;
            case 8:
              var current$jscomp$0 = nextEffect;
              unmountHostComponents(
                root,
                current$jscomp$0,
                renderPriorityLevel
              );
              detachFiber(current$jscomp$0);
          }
          nextEffect = nextEffect.nextEffect;
        }
      } catch (error) {
        if (null === nextEffect) throw Error("Should be working on an effect.");
        captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    while (null !== nextEffect);
    root$jscomp$0.current = finishedWork;
    nextEffect = remainingExpirationTimeBeforeCommit;
    do
      try {
        for (effectTag = root$jscomp$0; null !== nextEffect; ) {
          var effectTag$jscomp$0 = nextEffect.effectTag;
          effectTag$jscomp$0 & 36 &&
            commitLifeCycles(effectTag, nextEffect.alternate, nextEffect);
          if (effectTag$jscomp$0 & 128) {
            current = void 0;
            var ref = nextEffect.ref;
            if (null !== ref) {
              var instance = nextEffect.stateNode;
              switch (nextEffect.tag) {
                case 5:
                  current = instance;
                  break;
                default:
                  current = instance;
              }
              "function" === typeof ref
                ? ref(current)
                : (ref.current = current);
            }
          }
          nextEffect = nextEffect.nextEffect;
        }
      } catch (error) {
        if (null === nextEffect) throw Error("Should be working on an effect.");
        captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    while (null !== nextEffect);
    nextEffect = null;
    requestPaint();
    executionContext = prevExecutionContext;
  } else root$jscomp$0.current = finishedWork;
  if (rootDoesHavePassiveEffects)
    (rootDoesHavePassiveEffects = !1),
      (rootWithPendingPassiveEffects = root$jscomp$0),
      (pendingPassiveEffectsRenderPriority = renderPriorityLevel$jscomp$0);
  else
    for (
      nextEffect = remainingExpirationTimeBeforeCommit;
      null !== nextEffect;

    )
      (renderPriorityLevel$jscomp$0 = nextEffect.nextEffect),
        (nextEffect.nextEffect = null),
        (nextEffect = renderPriorityLevel$jscomp$0);
  renderPriorityLevel$jscomp$0 = root$jscomp$0.firstPendingTime;
  0 === renderPriorityLevel$jscomp$0 &&
    (legacyErrorBoundariesThatAlreadyFailed = null);
  1073741823 === renderPriorityLevel$jscomp$0
    ? root$jscomp$0 === rootWithNestedUpdates
      ? nestedUpdateCount++
      : ((nestedUpdateCount = 0), (rootWithNestedUpdates = root$jscomp$0))
    : (nestedUpdateCount = 0);
  "function" === typeof onCommitFiberRoot &&
    onCommitFiberRoot(finishedWork.stateNode, expirationTime);
  ensureRootIsScheduled(root$jscomp$0);
  if (hasUncaughtError)
    throw ((hasUncaughtError = !1),
    (root$jscomp$0 = firstUncaughtError),
    (firstUncaughtError = null),
    root$jscomp$0);
  if ((executionContext & LegacyUnbatchedContext) !== NoContext) return null;
  flushSyncCallbackQueue();
  return null;
}
function commitBeforeMutationEffects() {
  for (; null !== nextEffect; ) {
    var effectTag = nextEffect.effectTag;
    0 !== (effectTag & 256) &&
      commitBeforeMutationLifeCycles(nextEffect.alternate, nextEffect);
    0 === (effectTag & 512) ||
      rootDoesHavePassiveEffects ||
      ((rootDoesHavePassiveEffects = !0),
      scheduleCallback(97, function() {
        flushPassiveEffects();
        return null;
      }));
    nextEffect = nextEffect.nextEffect;
  }
}
function flushPassiveEffects() {
  if (90 !== pendingPassiveEffectsRenderPriority) {
    var priorityLevel =
      97 < pendingPassiveEffectsRenderPriority
        ? 97
        : pendingPassiveEffectsRenderPriority;
    pendingPassiveEffectsRenderPriority = 90;
    return runWithPriority(priorityLevel, flushPassiveEffectsImpl);
  }
}
function flushPassiveEffectsImpl() {
  if (null === rootWithPendingPassiveEffects) return !1;
  var root = rootWithPendingPassiveEffects;
  rootWithPendingPassiveEffects = null;
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
    throw Error("Cannot flush passive effects while already rendering.");
  var prevExecutionContext = executionContext;
  executionContext |= CommitContext;
  for (root = root.current.firstEffect; null !== root; ) {
    try {
      var finishedWork = root;
      if (0 !== (finishedWork.effectTag & 512))
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
          case 22:
            commitHookEffectListUnmount(5, finishedWork),
              commitHookEffectListMount(5, finishedWork);
        }
    } catch (error) {
      if (null === root) throw Error("Should be working on an effect.");
      captureCommitPhaseError(root, error);
    }
    finishedWork = root.nextEffect;
    root.nextEffect = null;
    root = finishedWork;
  }
  executionContext = prevExecutionContext;
  flushSyncCallbackQueue();
  return !0;
}
function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
  sourceFiber = createCapturedValue(error, sourceFiber);
  sourceFiber = createRootErrorUpdate(rootFiber, sourceFiber, 1073741823);
  enqueueUpdate(rootFiber, sourceFiber);
  rootFiber = markUpdateTimeFromFiberToRoot(rootFiber, 1073741823);
  null !== rootFiber && ensureRootIsScheduled(rootFiber);
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
          null !== fiber && ensureRootIsScheduled(fiber);
          break;
        }
      }
      fiber = fiber.return;
    }
}
function pingSuspendedRoot(root, thenable, suspendedTime) {
  var pingCache = root.pingCache;
  null !== pingCache && pingCache.delete(thenable);
  workInProgressRoot === root && renderExpirationTime$1 === suspendedTime
    ? workInProgressRootExitStatus === RootSuspendedWithDelay ||
      (workInProgressRootExitStatus === RootSuspended &&
        1073741823 === workInProgressRootLatestProcessedExpirationTime &&
        now() - globalMostRecentFallbackTime < FALLBACK_THROTTLE_MS)
      ? prepareFreshStack(root, renderExpirationTime$1)
      : (workInProgressRootHasPendingPing = !0)
    : isRootSuspendedAtTime(root, suspendedTime) &&
      ((thenable = root.lastPingedTime),
      (0 !== thenable && thenable < suspendedTime) ||
        ((root.lastPingedTime = suspendedTime), ensureRootIsScheduled(root)));
}
function resolveRetryThenable(boundaryFiber, thenable) {
  var retryCache = boundaryFiber.stateNode;
  null !== retryCache && retryCache.delete(thenable);
  thenable = 0;
  0 === thenable &&
    ((thenable = requestCurrentTimeForUpdate()),
    (thenable = computeExpirationForFiber(thenable, boundaryFiber, null)));
  boundaryFiber = markUpdateTimeFromFiberToRoot(boundaryFiber, thenable);
  null !== boundaryFiber && ensureRootIsScheduled(boundaryFiber);
}
var beginWork$1;
beginWork$1 = function(current, workInProgress, renderExpirationTime) {
  var updateExpirationTime = workInProgress.expirationTime;
  if (null !== current)
    if (
      current.memoizedProps !== workInProgress.pendingProps ||
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
            updateExpirationTime = workInProgress.memoizedProps.value;
            var context = workInProgress.type._context;
            push(valueCursor, context._currentValue);
            context._currentValue = updateExpirationTime;
            break;
          case 13:
            if (null !== workInProgress.memoizedState) {
              updateExpirationTime = workInProgress.child.childExpirationTime;
              if (
                0 !== updateExpirationTime &&
                updateExpirationTime >= renderExpirationTime
              )
                return updateSuspenseComponent(
                  current,
                  workInProgress,
                  renderExpirationTime
                );
              push(suspenseStackCursor, suspenseStackCursor.current & 1);
              workInProgress = bailoutOnAlreadyFinishedWork(
                current,
                workInProgress,
                renderExpirationTime
              );
              return null !== workInProgress ? workInProgress.sibling : null;
            }
            push(suspenseStackCursor, suspenseStackCursor.current & 1);
            break;
          case 19:
            updateExpirationTime =
              workInProgress.childExpirationTime >= renderExpirationTime;
            if (0 !== (current.effectTag & 64)) {
              if (updateExpirationTime)
                return updateSuspenseListComponent(
                  current,
                  workInProgress,
                  renderExpirationTime
                );
              workInProgress.effectTag |= 64;
            }
            context = workInProgress.memoizedState;
            null !== context &&
              ((context.rendering = null), (context.tail = null));
            push(suspenseStackCursor, suspenseStackCursor.current);
            if (!updateExpirationTime) return null;
        }
        return bailoutOnAlreadyFinishedWork(
          current,
          workInProgress,
          renderExpirationTime
        );
      }
      didReceiveUpdate = !1;
    }
  else didReceiveUpdate = !1;
  workInProgress.expirationTime = 0;
  switch (workInProgress.tag) {
    case 2:
      updateExpirationTime = workInProgress.type;
      null !== current &&
        ((current.alternate = null),
        (workInProgress.alternate = null),
        (workInProgress.effectTag |= 2));
      current = workInProgress.pendingProps;
      context = getMaskedContext(workInProgress, contextStackCursor.current);
      prepareToReadContext(workInProgress, renderExpirationTime);
      context = renderWithHooks(
        null,
        workInProgress,
        updateExpirationTime,
        current,
        context,
        renderExpirationTime
      );
      workInProgress.effectTag |= 1;
      if (
        "object" === typeof context &&
        null !== context &&
        "function" === typeof context.render &&
        void 0 === context.$$typeof
      ) {
        workInProgress.tag = 1;
        workInProgress.memoizedState = null;
        workInProgress.updateQueue = null;
        if (isContextProvider(updateExpirationTime)) {
          var hasContext = !0;
          pushContextProvider(workInProgress);
        } else hasContext = !1;
        workInProgress.memoizedState =
          null !== context.state && void 0 !== context.state
            ? context.state
            : null;
        initializeUpdateQueue(workInProgress);
        var getDerivedStateFromProps =
          updateExpirationTime.getDerivedStateFromProps;
        "function" === typeof getDerivedStateFromProps &&
          applyDerivedStateFromProps(
            workInProgress,
            updateExpirationTime,
            getDerivedStateFromProps,
            current
          );
        context.updater = classComponentUpdater;
        workInProgress.stateNode = context;
        context._reactInternalFiber = workInProgress;
        mountClassInstance(
          workInProgress,
          updateExpirationTime,
          current,
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
      a: {
        context = workInProgress.elementType;
        null !== current &&
          ((current.alternate = null),
          (workInProgress.alternate = null),
          (workInProgress.effectTag |= 2));
        current = workInProgress.pendingProps;
        initializeLazyComponentType(context);
        if (1 !== context._status) throw context._result;
        context = context._result;
        workInProgress.type = context;
        hasContext = workInProgress.tag = resolveLazyComponentTag(context);
        current = resolveDefaultProps(context, current);
        switch (hasContext) {
          case 0:
            workInProgress = updateFunctionComponent(
              null,
              workInProgress,
              context,
              current,
              renderExpirationTime
            );
            break a;
          case 1:
            workInProgress = updateClassComponent(
              null,
              workInProgress,
              context,
              current,
              renderExpirationTime
            );
            break a;
          case 11:
            workInProgress = updateForwardRef(
              null,
              workInProgress,
              context,
              current,
              renderExpirationTime
            );
            break a;
          case 14:
            workInProgress = updateMemoComponent(
              null,
              workInProgress,
              context,
              resolveDefaultProps(context.type, current),
              updateExpirationTime,
              renderExpirationTime
            );
            break a;
        }
        throw Error(
          "Element type is invalid. Received a promise that resolves to: " +
            context +
            ". Lazy element type must resolve to a class or function."
        );
      }
      return workInProgress;
    case 0:
      return (
        (updateExpirationTime = workInProgress.type),
        (context = workInProgress.pendingProps),
        (context =
          workInProgress.elementType === updateExpirationTime
            ? context
            : resolveDefaultProps(updateExpirationTime, context)),
        updateFunctionComponent(
          current,
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
          current,
          workInProgress,
          updateExpirationTime,
          context,
          renderExpirationTime
        )
      );
    case 3:
      pushHostRootContext(workInProgress);
      updateExpirationTime = workInProgress.updateQueue;
      if (null === current || null === updateExpirationTime)
        throw Error(
          "If the root does not have an updateQueue, we should have already bailed out. This error is likely caused by a bug in React. Please file an issue."
        );
      updateExpirationTime = workInProgress.pendingProps;
      context = workInProgress.memoizedState;
      context = null !== context ? context.element : null;
      cloneUpdateQueue(current, workInProgress);
      processUpdateQueue(
        workInProgress,
        updateExpirationTime,
        null,
        renderExpirationTime
      );
      updateExpirationTime = workInProgress.memoizedState.element;
      updateExpirationTime === context
        ? (workInProgress = bailoutOnAlreadyFinishedWork(
            current,
            workInProgress,
            renderExpirationTime
          ))
        : (reconcileChildren(
            current,
            workInProgress,
            updateExpirationTime,
            renderExpirationTime
          ),
          (workInProgress = workInProgress.child));
      return workInProgress;
    case 5:
      return (
        pushHostContext(workInProgress),
        (updateExpirationTime = workInProgress.pendingProps.children),
        markRef(current, workInProgress),
        reconcileChildren(
          current,
          workInProgress,
          updateExpirationTime,
          renderExpirationTime
        ),
        (workInProgress = workInProgress.child),
        workInProgress
      );
    case 6:
      return null;
    case 13:
      return updateSuspenseComponent(
        current,
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
        null === current
          ? (workInProgress.child = reconcileChildFibers(
              workInProgress,
              null,
              updateExpirationTime,
              renderExpirationTime
            ))
          : reconcileChildren(
              current,
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
          current,
          workInProgress,
          updateExpirationTime,
          context,
          renderExpirationTime
        )
      );
    case 7:
      return (
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps,
          renderExpirationTime
        ),
        workInProgress.child
      );
    case 8:
      return (
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps.children,
          renderExpirationTime
        ),
        workInProgress.child
      );
    case 12:
      return (
        reconcileChildren(
          current,
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
        var context$jscomp$0 = workInProgress.type._context;
        push(valueCursor, context$jscomp$0._currentValue);
        context$jscomp$0._currentValue = hasContext;
        if (null !== getDerivedStateFromProps)
          if (
            ((context$jscomp$0 = getDerivedStateFromProps.value),
            (hasContext = objectIs(context$jscomp$0, hasContext)
              ? 0
              : ("function" ===
                typeof updateExpirationTime._calculateChangedBits
                  ? updateExpirationTime._calculateChangedBits(
                      context$jscomp$0,
                      hasContext
                    )
                  : 1073741823) | 0),
            0 === hasContext)
          ) {
            if (
              getDerivedStateFromProps.children === context.children &&
              !didPerformWorkStackCursor.current
            ) {
              workInProgress = bailoutOnAlreadyFinishedWork(
                current,
                workInProgress,
                renderExpirationTime
              );
              break a;
            }
          } else
            for (
              context$jscomp$0 = workInProgress.child,
                null !== context$jscomp$0 &&
                  (context$jscomp$0.return = workInProgress);
              null !== context$jscomp$0;

            ) {
              var list = context$jscomp$0.dependencies;
              if (null !== list) {
                getDerivedStateFromProps = context$jscomp$0.child;
                for (
                  var dependency = list.firstContext;
                  null !== dependency;

                ) {
                  if (
                    dependency.context === updateExpirationTime &&
                    0 !== (dependency.observedBits & hasContext)
                  ) {
                    1 === context$jscomp$0.tag &&
                      ((dependency = createUpdate(renderExpirationTime, null)),
                      (dependency.tag = 2),
                      enqueueUpdate(context$jscomp$0, dependency));
                    context$jscomp$0.expirationTime < renderExpirationTime &&
                      (context$jscomp$0.expirationTime = renderExpirationTime);
                    dependency = context$jscomp$0.alternate;
                    null !== dependency &&
                      dependency.expirationTime < renderExpirationTime &&
                      (dependency.expirationTime = renderExpirationTime);
                    scheduleWorkOnParentPath(
                      context$jscomp$0.return,
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
                  10 === context$jscomp$0.tag
                    ? context$jscomp$0.type === workInProgress.type
                      ? null
                      : context$jscomp$0.child
                    : context$jscomp$0.child;
              if (null !== getDerivedStateFromProps)
                getDerivedStateFromProps.return = context$jscomp$0;
              else
                for (
                  getDerivedStateFromProps = context$jscomp$0;
                  null !== getDerivedStateFromProps;

                ) {
                  if (getDerivedStateFromProps === workInProgress) {
                    getDerivedStateFromProps = null;
                    break;
                  }
                  context$jscomp$0 = getDerivedStateFromProps.sibling;
                  if (null !== context$jscomp$0) {
                    context$jscomp$0.return = getDerivedStateFromProps.return;
                    getDerivedStateFromProps = context$jscomp$0;
                    break;
                  }
                  getDerivedStateFromProps = getDerivedStateFromProps.return;
                }
              context$jscomp$0 = getDerivedStateFromProps;
            }
        reconcileChildren(
          current,
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
          current,
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
          current,
          workInProgress,
          context,
          hasContext,
          updateExpirationTime,
          renderExpirationTime
        )
      );
    case 15:
      return updateSimpleMemoComponent(
        current,
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
        null !== current &&
          ((current.alternate = null),
          (workInProgress.alternate = null),
          (workInProgress.effectTag |= 2)),
        (workInProgress.tag = 1),
        isContextProvider(updateExpirationTime)
          ? ((current = !0), pushContextProvider(workInProgress))
          : (current = !1),
        prepareToReadContext(workInProgress, renderExpirationTime),
        constructClassInstance(workInProgress, updateExpirationTime, context),
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
          current,
          renderExpirationTime
        )
      );
    case 19:
      return updateSuspenseListComponent(
        current,
        workInProgress,
        renderExpirationTime
      );
  }
  throw Error(
    "Unknown unit of work tag (" +
      workInProgress.tag +
      "). This error is likely caused by a bug in React. Please file an issue."
  );
};
var onCommitFiberRoot = null,
  onCommitFiberUnmount = null;
function injectInternals(internals) {
  if ("undefined" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) return !1;
  var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook.isDisabled || !hook.supportsFiber) return !0;
  try {
    var rendererID = hook.inject(internals);
    onCommitFiberRoot = function(root) {
      try {
        hook.onCommitFiberRoot(
          rendererID,
          root,
          void 0,
          64 === (root.current.effectTag & 64)
        );
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
    ? ((workInProgress = new FiberNode(
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
          (type = new FiberNode(12, pendingProps, key, mode | 8)),
          (type.elementType = REACT_PROFILER_TYPE),
          (type.type = REACT_PROFILER_TYPE),
          (type.expirationTime = expirationTime),
          type
        );
      case REACT_SUSPENSE_TYPE:
        return (
          (type = new FiberNode(13, pendingProps, key, mode)),
          (type.type = REACT_SUSPENSE_TYPE),
          (type.elementType = REACT_SUSPENSE_TYPE),
          (type.expirationTime = expirationTime),
          type
        );
      case REACT_SUSPENSE_LIST_TYPE:
        return (
          (type = new FiberNode(19, pendingProps, key, mode)),
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
            case REACT_BLOCK_TYPE:
              fiberTag = 22;
              break a;
          }
        throw Error(
          "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " +
            (null == type ? type : typeof type) +
            "."
        );
    }
  key = new FiberNode(fiberTag, pendingProps, key, mode);
  key.elementType = type;
  key.type = owner;
  key.expirationTime = expirationTime;
  return key;
}
function createFiberFromFragment(elements, mode, expirationTime, key) {
  elements = new FiberNode(7, elements, key, mode);
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
  this.callbackNode = null;
  this.callbackPriority = 90;
  this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
}
function isRootSuspendedAtTime(root, expirationTime) {
  var firstSuspendedTime = root.firstSuspendedTime;
  root = root.lastSuspendedTime;
  return (
    0 !== firstSuspendedTime &&
    firstSuspendedTime >= expirationTime &&
    root <= expirationTime
  );
}
function markRootSuspendedAtTime(root, expirationTime) {
  var firstSuspendedTime = root.firstSuspendedTime,
    lastSuspendedTime = root.lastSuspendedTime;
  firstSuspendedTime < expirationTime &&
    (root.firstSuspendedTime = expirationTime);
  if (lastSuspendedTime > expirationTime || 0 === firstSuspendedTime)
    root.lastSuspendedTime = expirationTime;
  expirationTime <= root.lastPingedTime && (root.lastPingedTime = 0);
  expirationTime <= root.lastExpiredTime && (root.lastExpiredTime = 0);
}
function markRootUpdatedAtTime(root, expirationTime) {
  expirationTime > root.firstPendingTime &&
    (root.firstPendingTime = expirationTime);
  var firstSuspendedTime = root.firstSuspendedTime;
  0 !== firstSuspendedTime &&
    (expirationTime >= firstSuspendedTime
      ? (root.firstSuspendedTime = root.lastSuspendedTime = root.nextKnownPendingLevel = 0)
      : expirationTime >= root.lastSuspendedTime &&
        (root.lastSuspendedTime = expirationTime + 1),
    expirationTime > root.nextKnownPendingLevel &&
      (root.nextKnownPendingLevel = expirationTime));
}
function findHostInstance(component) {
  var fiber = component._reactInternalFiber;
  if (void 0 === fiber) {
    if ("function" === typeof component.render)
      throw Error("Unable to find node on an unmounted component.");
    throw Error(
      "Argument appears to not be a ReactComponent. Keys: " +
        Object.keys(component)
    );
  }
  component = findCurrentHostFiber(fiber);
  return null === component ? null : component.stateNode;
}
function updateContainer(element, container, parentComponent, callback) {
  var current = container.current,
    currentTime = requestCurrentTimeForUpdate(),
    suspenseConfig = ReactCurrentBatchConfig.suspense;
  currentTime = computeExpirationForFiber(currentTime, current, suspenseConfig);
  a: if (parentComponent) {
    parentComponent = parentComponent._reactInternalFiber;
    b: {
      if (
        getNearestMountedFiber(parentComponent) !== parentComponent ||
        1 !== parentComponent.tag
      )
        throw Error(
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
      throw Error(
        "Found unexpected detached subtree parent. This error is likely caused by a bug in React. Please file an issue."
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
  container = createUpdate(currentTime, suspenseConfig);
  container.payload = { element: element };
  callback = void 0 === callback ? null : callback;
  null !== callback && (container.callback = callback);
  enqueueUpdate(current, container);
  scheduleWork(current, currentTime);
  return currentTime;
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
function unmountComponentAtNode(containerTag) {
  var root = roots.get(containerTag);
  root &&
    updateContainer(null, root, null, function() {
      roots.delete(containerTag);
    });
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
var roots = new Map();
(function(devToolsConfig) {
  var findFiberByHostInstance = devToolsConfig.findFiberByHostInstance;
  return injectInternals({
    bundleType: devToolsConfig.bundleType,
    version: devToolsConfig.version,
    rendererPackageName: devToolsConfig.rendererPackageName,
    rendererConfig: devToolsConfig.rendererConfig,
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
      return findFiberByHostInstance ? findFiberByHostInstance(instance) : null;
    },
    findHostInstancesForRefresh: null,
    scheduleRefresh: null,
    scheduleRoot: null,
    setRefreshHandler: null,
    getCurrentFiber: null
  });
})({
  findFiberByHostInstance: getInstanceFromTag,
  bundleType: 0,
  version: "16.13.0",
  rendererPackageName: "react-native-renderer",
  rendererConfig: {
    getInspectorDataForViewTag: function() {
      throw Error(
        "getInspectorDataForViewTag() is not available in production"
      );
    },
    getInspectorDataForViewAtPoint: function() {
      throw Error(
        "getInspectorDataForViewAtPoint() is not available in production."
      );
    }.bind(null, findNodeHandle)
  }
});
exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  computeComponentStackForErrorReporting: function(reactTag) {
    return (reactTag = getInstanceFromTag(reactTag))
      ? getStackByFiberInDevAndProd(reactTag)
      : "";
  }
};
exports.createPortal = function(children, containerTag) {
  return createPortal(
    children,
    containerTag,
    null,
    2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null
  );
};
exports.dispatchCommand = function(handle, command, args) {
  null != handle._nativeTag &&
    (handle._internalInstanceHandle
      ? nativeFabricUIManager.dispatchCommand(
          handle._internalInstanceHandle.stateNode.node,
          command,
          args
        )
      : ReactNativePrivateInterface.UIManager.dispatchViewManagerCommand(
          handle._nativeTag,
          command,
          args
        ));
};
exports.findHostInstance_DEPRECATED = function(componentOrHandle) {
  if (null == componentOrHandle) return null;
  if (componentOrHandle._nativeTag) return componentOrHandle;
  if (componentOrHandle.canonical && componentOrHandle.canonical._nativeTag)
    return componentOrHandle.canonical;
  componentOrHandle = findHostInstance(componentOrHandle);
  return null == componentOrHandle
    ? componentOrHandle
    : componentOrHandle.canonical
    ? componentOrHandle.canonical
    : componentOrHandle;
};
exports.findNodeHandle = findNodeHandle;
exports.render = function(element, containerTag, callback) {
  var root = roots.get(containerTag);
  if (!root) {
    root = new FiberRootNode(containerTag, 0, !1);
    var uninitializedFiber = new FiberNode(3, null, null, 0);
    root.current = uninitializedFiber;
    uninitializedFiber.stateNode = root;
    initializeUpdateQueue(uninitializedFiber);
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
};
exports.unmountComponentAtNode = unmountComponentAtNode;
exports.unmountComponentAtNodeAndRemoveContainer = function(containerTag) {
  unmountComponentAtNode(containerTag);
  ReactNativePrivateInterface.UIManager.removeRootView(containerTag);
};
exports.unstable_batchedUpdates = batchedUpdates;
