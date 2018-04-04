/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @providesModule ReactFabric-prod
 * @preventMunge
 */

"use strict";
require("InitializeCore");
var invariant = require("fbjs/lib/invariant"),
  emptyFunction = require("fbjs/lib/emptyFunction"),
  UIManager = require("UIManager"),
  TextInputState = require("TextInputState"),
  deepDiffer = require("deepDiffer"),
  flattenStyle = require("flattenStyle"),
  React = require("react"),
  emptyObject = require("fbjs/lib/emptyObject"),
  shallowEqual = require("fbjs/lib/shallowEqual"),
  FabricUIManager = require("FabricUIManager"),
  eventPluginOrder = null,
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
  }),
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
      depthA = responderInst && isEndish(topLevelType);
      if (
        (JSCompiler_temp$jscomp$0 = JSCompiler_temp$jscomp$0
          ? eventTypes.responderStart
          : targetInst
            ? eventTypes.responderMove
            : depthA ? eventTypes.responderEnd : null)
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
          responderInst && !JSCompiler_temp$jscomp$0 && isEndish(topLevelType))
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
          (JSCompiler_temp = accumulate(JSCompiler_temp, nativeEvent)),
          changeResponder(null);
      nativeEvent = ResponderTouchHistoryStore.touchHistory.numberActiveTouches;
      if (
        ResponderEventPlugin.GlobalInteractionHandler &&
        nativeEvent !== previousActiveTouches
      )
        ResponderEventPlugin.GlobalInteractionHandler.onChange(nativeEvent);
      previousActiveTouches = nativeEvent;
      return JSCompiler_temp;
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
      if (null == targetInst) return null;
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
function getInstanceFromTag(tag) {
  return "number" === typeof tag ? instanceCache[tag] || null : tag;
}
var ReactNativeComponentTree = Object.freeze({
  precacheFiberNode: function(hostInst, tag) {
    instanceCache[tag] = hostInst;
  },
  uncacheFiberNode: function(tag) {
    delete instanceCache[tag];
    delete instanceProps[tag];
  },
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
var hasSymbol = "function" === typeof Symbol && Symbol["for"],
  REACT_ELEMENT_TYPE = hasSymbol ? Symbol["for"]("react.element") : 60103,
  REACT_CALL_TYPE = hasSymbol ? Symbol["for"]("react.call") : 60104,
  REACT_RETURN_TYPE = hasSymbol ? Symbol["for"]("react.return") : 60105,
  REACT_PORTAL_TYPE = hasSymbol ? Symbol["for"]("react.portal") : 60106,
  REACT_FRAGMENT_TYPE = hasSymbol ? Symbol["for"]("react.fragment") : 60107,
  REACT_STRICT_MODE_TYPE = hasSymbol
    ? Symbol["for"]("react.strict_mode")
    : 60108,
  REACT_PROVIDER_TYPE = hasSymbol ? Symbol["for"]("react.provider") : 60109,
  REACT_CONTEXT_TYPE = hasSymbol ? Symbol["for"]("react.context") : 60110,
  REACT_ASYNC_MODE_TYPE = hasSymbol ? Symbol["for"]("react.async_mode") : 60111,
  REACT_FORWARD_REF_TYPE = hasSymbol
    ? Symbol["for"]("react.forward_ref")
    : 60112,
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
var isBatching = !1,
  TouchHistoryMath = {
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
var ReactCurrentOwner =
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
function getComponentName(fiber) {
  fiber = fiber.type;
  if ("function" === typeof fiber) return fiber.displayName || fiber.name;
  if ("string" === typeof fiber) return fiber;
  switch (fiber) {
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
function findHostInstanceFabric() {
  return null;
}
function findNodeHandle(componentOrHandle) {
  if (null == componentOrHandle) return null;
  if ("number" === typeof componentOrHandle) return componentOrHandle;
  var internalInstance = componentOrHandle._reactInternalFiber;
  if (internalInstance) return findHostInstanceFabric(internalInstance);
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
  })(React.Component),
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
var viewConfigCallbacks = new Map(),
  viewConfigs = new Map();
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
function FiberNode(tag, pendingProps, key, mode) {
  this.tag = tag;
  this.key = key;
  this.stateNode = this.type = null;
  this.sibling = this.child = this["return"] = null;
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
  var fiberTag = void 0;
  if ("function" === typeof type)
    fiberTag = type.prototype && type.prototype.isReactComponent ? 2 : 0;
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
      case REACT_CALL_TYPE:
        fiberTag = 7;
        break;
      case REACT_RETURN_TYPE:
        fiberTag = 9;
        break;
      default:
        if ("object" === typeof type && null !== type)
          switch (type.$$typeof) {
            case REACT_PROVIDER_TYPE:
              fiberTag = 13;
              break;
            case REACT_CONTEXT_TYPE:
              fiberTag = 12;
              break;
            case REACT_FORWARD_REF_TYPE:
              fiberTag = 14;
              break;
            default:
              if ("number" === typeof type.tag)
                return (
                  (mode = type),
                  (mode.pendingProps = element),
                  (mode.expirationTime = expirationTime),
                  mode
                );
              throwOnInvalidElementType(type, null);
          }
        else throwOnInvalidElementType(type, null);
    }
  mode = new FiberNode(fiberTag, element, key, mode);
  mode.type = type;
  mode.expirationTime = expirationTime;
  return mode;
}
function throwOnInvalidElementType(type) {
  invariant(
    !1,
    "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s",
    null == type ? type : typeof type,
    ""
  );
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
    workInProgress = workInProgress["return"];
  } while (workInProgress);
  return info;
}
new Set();
function createUpdateQueue(baseState) {
  return {
    baseState: baseState,
    expirationTime: 0,
    first: null,
    last: null,
    callbackList: null,
    hasForceUpdate: !1,
    isInitialized: !1,
    capturedValues: null
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
var q1 = void 0,
  q2 = void 0;
function ensureUpdateQueues(fiber) {
  q1 = q2 = null;
  var alternateFiber = fiber.alternate,
    queue1 = fiber.updateQueue;
  null === queue1 && (queue1 = fiber.updateQueue = createUpdateQueue(null));
  null !== alternateFiber
    ? ((fiber = alternateFiber.updateQueue),
      null === fiber &&
        (fiber = alternateFiber.updateQueue = createUpdateQueue(null)))
    : (fiber = null);
  q1 = queue1;
  q2 = fiber !== queue1 ? fiber : null;
}
function insertUpdateIntoFiber(fiber, update) {
  ensureUpdateQueues(fiber);
  fiber = q1;
  var queue2 = q2;
  null === queue2
    ? insertUpdateIntoQueue(fiber, update)
    : null === fiber.last || null === queue2.last
      ? (insertUpdateIntoQueue(fiber, update),
        insertUpdateIntoQueue(queue2, update))
      : (insertUpdateIntoQueue(fiber, update), (queue2.last = update));
}
function getStateFromUpdate(update, instance, prevState, props) {
  update = update.partialState;
  return "function" === typeof update
    ? update.call(instance, prevState, props)
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
      capturedValues: queue.capturedValues,
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
      null !== update.capturedValue &&
        ((updateExpirationTime = queue.capturedValues),
        null === updateExpirationTime
          ? (queue.capturedValues = [update.capturedValue])
          : updateExpirationTime.push(update.capturedValue));
    }
    update = update.next;
  }
  null !== queue.callbackList
    ? (workInProgress.effectTag |= 32)
    : null !== queue.first ||
      queue.hasForceUpdate ||
      null !== queue.capturedValues ||
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
  legacyContext,
  scheduleWork,
  computeExpirationForFiber,
  memoizeProps,
  memoizeState
) {
  function checkShouldComponentUpdate(
    workInProgress,
    oldProps,
    newProps,
    oldState,
    newState,
    newContext
  ) {
    if (
      null === oldProps ||
      (null !== workInProgress.updateQueue &&
        workInProgress.updateQueue.hasForceUpdate)
    )
      return !0;
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
    instance.updater = updater;
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
      updater.enqueueReplaceState(instance, instance.state, null);
  }
  function callGetDerivedStateFromProps(
    workInProgress,
    instance,
    nextProps,
    prevState
  ) {
    workInProgress = workInProgress.type;
    if ("function" === typeof workInProgress.getDerivedStateFromProps)
      return workInProgress.getDerivedStateFromProps.call(
        null,
        nextProps,
        prevState
      );
  }
  var cacheContext = legacyContext.cacheContext,
    getMaskedContext = legacyContext.getMaskedContext,
    getUnmaskedContext = legacyContext.getUnmaskedContext,
    isContextConsumer = legacyContext.isContextConsumer,
    hasContextChanged = legacyContext.hasContextChanged,
    updater = {
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
          capturedValue: null,
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
          capturedValue: null,
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
          capturedValue: null,
          next: null
        });
        scheduleWork(instance, expirationTime);
      }
    };
  return {
    adoptClassInstance: adoptClassInstance,
    callGetDerivedStateFromProps: callGetDerivedStateFromProps,
    constructClassInstance: function(workInProgress, props) {
      var ctor = workInProgress.type,
        unmaskedContext = getUnmaskedContext(workInProgress),
        needsContext = isContextConsumer(workInProgress),
        context = needsContext
          ? getMaskedContext(workInProgress, unmaskedContext)
          : emptyObject;
      ctor = new ctor(props, context);
      var state =
        null !== ctor.state && void 0 !== ctor.state ? ctor.state : null;
      adoptClassInstance(workInProgress, ctor);
      workInProgress.memoizedState = state;
      props = callGetDerivedStateFromProps(workInProgress, ctor, props, state);
      null !== props &&
        void 0 !== props &&
        (workInProgress.memoizedState = Object.assign(
          {},
          workInProgress.memoizedState,
          props
        ));
      needsContext && cacheContext(workInProgress, unmaskedContext, context);
      return ctor;
    },
    mountClassInstance: function(workInProgress, renderExpirationTime) {
      var ctor = workInProgress.type,
        current = workInProgress.alternate,
        instance = workInProgress.stateNode,
        props = workInProgress.pendingProps,
        unmaskedContext = getUnmaskedContext(workInProgress);
      instance.props = props;
      instance.state = workInProgress.memoizedState;
      instance.refs = emptyObject;
      instance.context = getMaskedContext(workInProgress, unmaskedContext);
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
          updater.enqueueReplaceState(instance, instance.state, null),
        (ctor = workInProgress.updateQueue),
        null !== ctor &&
          (instance.state = processUpdateQueue(
            current,
            workInProgress,
            ctor,
            instance,
            props,
            renderExpirationTime
          )));
      "function" === typeof instance.componentDidMount &&
        (workInProgress.effectTag |= 4);
    },
    resumeMountClassInstance: function(workInProgress, renderExpirationTime) {
      var ctor = workInProgress.type,
        instance = workInProgress.stateNode;
      instance.props = workInProgress.memoizedProps;
      instance.state = workInProgress.memoizedState;
      var oldProps = workInProgress.memoizedProps,
        newProps = workInProgress.pendingProps,
        oldContext = instance.context,
        newUnmaskedContext = getUnmaskedContext(workInProgress);
      newUnmaskedContext = getMaskedContext(workInProgress, newUnmaskedContext);
      (ctor =
        "function" === typeof ctor.getDerivedStateFromProps ||
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
      oldContext = workInProgress.memoizedState;
      renderExpirationTime =
        null !== workInProgress.updateQueue
          ? processUpdateQueue(
              null,
              workInProgress,
              workInProgress.updateQueue,
              instance,
              newProps,
              renderExpirationTime
            )
          : oldContext;
      var derivedStateFromProps = void 0;
      oldProps !== newProps &&
        (derivedStateFromProps = callGetDerivedStateFromProps(
          workInProgress,
          instance,
          newProps,
          renderExpirationTime
        ));
      if (null !== derivedStateFromProps && void 0 !== derivedStateFromProps) {
        renderExpirationTime =
          null === renderExpirationTime || void 0 === renderExpirationTime
            ? derivedStateFromProps
            : Object.assign({}, renderExpirationTime, derivedStateFromProps);
        var _updateQueue = workInProgress.updateQueue;
        null !== _updateQueue &&
          (_updateQueue.baseState = Object.assign(
            {},
            _updateQueue.baseState,
            derivedStateFromProps
          ));
      }
      if (
        !(
          oldProps !== newProps ||
          oldContext !== renderExpirationTime ||
          hasContextChanged() ||
          (null !== workInProgress.updateQueue &&
            workInProgress.updateQueue.hasForceUpdate)
        )
      )
        return (
          "function" === typeof instance.componentDidMount &&
            (workInProgress.effectTag |= 4),
          !1
        );
      (oldProps = checkShouldComponentUpdate(
        workInProgress,
        oldProps,
        newProps,
        oldContext,
        renderExpirationTime,
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
          memoizeProps(workInProgress, newProps),
          memoizeState(workInProgress, renderExpirationTime));
      instance.props = newProps;
      instance.state = renderExpirationTime;
      instance.context = newUnmaskedContext;
      return oldProps;
    },
    updateClassInstance: function(
      current,
      workInProgress,
      renderExpirationTime
    ) {
      var ctor = workInProgress.type,
        instance = workInProgress.stateNode;
      instance.props = workInProgress.memoizedProps;
      instance.state = workInProgress.memoizedState;
      var oldProps = workInProgress.memoizedProps,
        newProps = workInProgress.pendingProps,
        oldContext = instance.context,
        newUnmaskedContext = getUnmaskedContext(workInProgress);
      newUnmaskedContext = getMaskedContext(workInProgress, newUnmaskedContext);
      (ctor =
        "function" === typeof ctor.getDerivedStateFromProps ||
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
      var derivedStateFromProps = void 0;
      oldProps !== newProps &&
        (derivedStateFromProps = callGetDerivedStateFromProps(
          workInProgress,
          instance,
          newProps,
          renderExpirationTime
        ));
      if (null !== derivedStateFromProps && void 0 !== derivedStateFromProps) {
        renderExpirationTime =
          null === renderExpirationTime || void 0 === renderExpirationTime
            ? derivedStateFromProps
            : Object.assign({}, renderExpirationTime, derivedStateFromProps);
        var _updateQueue3 = workInProgress.updateQueue;
        null !== _updateQueue3 &&
          (_updateQueue3.baseState = Object.assign(
            {},
            _updateQueue3.baseState,
            derivedStateFromProps
          ));
      }
      if (
        !(
          oldProps !== newProps ||
          oldContext !== renderExpirationTime ||
          hasContextChanged() ||
          (null !== workInProgress.updateQueue &&
            workInProgress.updateQueue.hasForceUpdate)
        )
      )
        return (
          "function" !== typeof instance.componentDidUpdate ||
            (oldProps === current.memoizedProps &&
              oldContext === current.memoizedState) ||
            (workInProgress.effectTag |= 4),
          "function" !== typeof instance.getSnapshotBeforeUpdate ||
            (oldProps === current.memoizedProps &&
              oldContext === current.memoizedState) ||
            (workInProgress.effectTag |= 2048),
          !1
        );
      (derivedStateFromProps = checkShouldComponentUpdate(
        workInProgress,
        oldProps,
        newProps,
        oldContext,
        renderExpirationTime,
        newUnmaskedContext
      ))
        ? (ctor ||
            ("function" !== typeof instance.UNSAFE_componentWillUpdate &&
              "function" !== typeof instance.componentWillUpdate) ||
            ("function" === typeof instance.componentWillUpdate &&
              instance.componentWillUpdate(
                newProps,
                renderExpirationTime,
                newUnmaskedContext
              ),
            "function" === typeof instance.UNSAFE_componentWillUpdate &&
              instance.UNSAFE_componentWillUpdate(
                newProps,
                renderExpirationTime,
                newUnmaskedContext
              )),
          "function" === typeof instance.componentDidUpdate &&
            (workInProgress.effectTag |= 4),
          "function" === typeof instance.getSnapshotBeforeUpdate &&
            (workInProgress.effectTag |= 2048))
        : ("function" !== typeof instance.componentDidUpdate ||
            (oldProps === current.memoizedProps &&
              oldContext === current.memoizedState) ||
            (workInProgress.effectTag |= 4),
          "function" !== typeof instance.getSnapshotBeforeUpdate ||
            (oldProps === current.memoizedProps &&
              oldContext === current.memoizedState) ||
            (workInProgress.effectTag |= 2048),
          memoizeProps(workInProgress, newProps),
          memoizeState(workInProgress, renderExpirationTime));
      instance.props = newProps;
      instance.state = renderExpirationTime;
      instance.context = newUnmaskedContext;
      return derivedStateFromProps;
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
        (expirationTime.ref = coerceRef(returnFiber, current, element)),
        (expirationTime["return"] = returnFiber),
        expirationTime
      );
    expirationTime = createFiberFromElement(
      element,
      returnFiber.mode,
      expirationTime
    );
    expirationTime.ref = coerceRef(returnFiber, current, element);
    expirationTime["return"] = returnFiber;
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
          returnFiber.mode,
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
          returnFiber.mode,
          expirationTime
        )),
        (newChild["return"] = returnFiber),
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
            (expirationTime["return"] = returnFiber),
            expirationTime
          );
        case REACT_PORTAL_TYPE:
          return (
            (newChild = createFiberFromPortal(
              newChild,
              returnFiber.mode,
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
            returnFiber.mode,
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
                  currentFirstChild.ref = coerceRef(
                    returnFiber,
                    isObject,
                    newChild
                  );
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
                  returnFiber.mode,
                  expirationTime,
                  newChild.key
                )),
                (currentFirstChild["return"] = returnFiber),
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
                (expirationTime["return"] = returnFiber),
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
              returnFiber.mode,
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
              returnFiber.mode,
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
  legacyContext,
  newContext,
  hydrationContext,
  scheduleWork,
  computeExpirationForFiber
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
    didCaptureError,
    renderExpirationTime
  ) {
    markRef(current, workInProgress);
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
    for (
      null !== fiber && (fiber["return"] = workInProgress);
      null !== fiber;

    ) {
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
              nextFiber = nextFiber["return"];
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
      if (null !== nextFiber) nextFiber["return"] = fiber;
      else
        for (nextFiber = fiber; null !== nextFiber; ) {
          if (nextFiber === workInProgress) {
            nextFiber = null;
            break;
          }
          fiber = nextFiber.sibling;
          if (null !== fiber) {
            nextFiber = fiber;
            break;
          }
          nextFiber = nextFiber["return"];
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
      oldProps = workInProgress.memoizedProps;
    if (!hasLegacyContextChanged() && oldProps === newProps)
      return (
        (workInProgress.stateNode = 0),
        pushProvider(workInProgress),
        bailoutOnAlreadyFinishedWork(current, workInProgress)
      );
    var newValue = newProps.value;
    workInProgress.memoizedProps = newProps;
    if (null === oldProps) newValue = 1073741823;
    else if (oldProps.value === newProps.value) {
      if (oldProps.children === newProps.children)
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
        if (oldProps.children === newProps.children)
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
        if (oldProps.children === newProps.children)
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
  var shouldSetTextContent = config.shouldSetTextContent,
    shouldDeprioritizeSubtree = config.shouldDeprioritizeSubtree,
    pushHostContext = hostContext.pushHostContext,
    pushHostContainer = hostContext.pushHostContainer,
    pushProvider = newContext.pushProvider,
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
    }
  );
  var adoptClassInstance = config.adoptClassInstance,
    callGetDerivedStateFromProps = config.callGetDerivedStateFromProps,
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
              "function" === typeof unmaskedContext.getDerivedStateFromProps &&
                ((props = callGetDerivedStateFromProps(
                  workInProgress,
                  fn,
                  props,
                  workInProgress.memoizedState
                )),
                null !== props &&
                  void 0 !== props &&
                  (workInProgress.memoizedState = Object.assign(
                    {},
                    workInProgress.memoizedState,
                    props
                  ))),
              (props = pushLegacyContextProvider(workInProgress)),
              adoptClassInstance(workInProgress, fn),
              mountClassInstance(workInProgress, renderExpirationTime),
              (current = finishClassComponent(
                current,
                workInProgress,
                !0,
                props,
                !1,
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
          props = pushLegacyContextProvider(workInProgress);
          null === current
            ? null === workInProgress.stateNode
              ? (constructClassInstance(
                  workInProgress,
                  workInProgress.pendingProps
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
              ));
          unmaskedContext = !1;
          var updateQueue = workInProgress.updateQueue;
          null !== updateQueue &&
            null !== updateQueue.capturedValues &&
            (unmaskedContext = fn = !0);
          return finishClassComponent(
            current,
            workInProgress,
            fn,
            props,
            unmaskedContext,
            renderExpirationTime
          );
        case 3:
          a: if (
            (pushHostRootContext(workInProgress),
            (fn = workInProgress.updateQueue),
            null !== fn)
          ) {
            unmaskedContext = workInProgress.memoizedState;
            props = processUpdateQueue(
              current,
              workInProgress,
              fn,
              null,
              null,
              renderExpirationTime
            );
            workInProgress.memoizedState = props;
            fn = workInProgress.updateQueue;
            if (null !== fn && null !== fn.capturedValues) fn = null;
            else if (unmaskedContext === props) {
              resetHydrationState();
              current = bailoutOnAlreadyFinishedWork(current, workInProgress);
              break a;
            } else fn = props.element;
            unmaskedContext = workInProgress.stateNode;
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
                reconcileChildren(current, workInProgress, fn));
            workInProgress.memoizedState = props;
            current = workInProgress.child;
          } else
            resetHydrationState(),
              (current = bailoutOnAlreadyFinishedWork(current, workInProgress));
          return current;
        case 5:
          a: {
            pushHostContext(workInProgress);
            null === current &&
              tryToClaimNextHydratableInstance(workInProgress);
            props = workInProgress.type;
            updateQueue = workInProgress.memoizedProps;
            fn = workInProgress.pendingProps;
            unmaskedContext = null !== current ? current.memoizedProps : null;
            if (!hasLegacyContextChanged() && updateQueue === fn) {
              if (
                (updateQueue =
                  workInProgress.mode & 1 &&
                  shouldDeprioritizeSubtree(props, fn))
              )
                workInProgress.expirationTime = 1073741823;
              if (!updateQueue || 1073741823 !== renderExpirationTime) {
                current = bailoutOnAlreadyFinishedWork(current, workInProgress);
                break a;
              }
            }
            updateQueue = fn.children;
            shouldSetTextContent(props, fn)
              ? (updateQueue = null)
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
              : (reconcileChildren(current, workInProgress, updateQueue),
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
        case 8:
          workInProgress.tag = 7;
        case 7:
          return (
            (props = workInProgress.pendingProps),
            hasLegacyContextChanged() ||
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
                    current.stateNode,
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
            (renderExpirationTime = workInProgress.type.render),
            (renderExpirationTime = renderExpirationTime(
              workInProgress.pendingProps,
              workInProgress.ref
            )),
            reconcileChildren(current, workInProgress, renderExpirationTime),
            (workInProgress.memoizedProps = renderExpirationTime),
            workInProgress.child
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
        case 13:
          return updateContextProvider(
            current,
            workInProgress,
            renderExpirationTime
          );
        case 12:
          fn = workInProgress.type;
          unmaskedContext = workInProgress.pendingProps;
          var oldProps = workInProgress.memoizedProps;
          props = fn._currentValue;
          updateQueue = fn._changedBits;
          if (
            hasLegacyContextChanged() ||
            0 !== updateQueue ||
            oldProps !== unmaskedContext
          ) {
            workInProgress.memoizedProps = unmaskedContext;
            oldProps = unmaskedContext.unstable_observedBits;
            if (void 0 === oldProps || null === oldProps) oldProps = 1073741823;
            workInProgress.stateNode = oldProps;
            0 !== (updateQueue & oldProps) &&
              propagateContextChange(
                workInProgress,
                fn,
                updateQueue,
                renderExpirationTime
              );
            renderExpirationTime = unmaskedContext.children;
            renderExpirationTime = renderExpirationTime(props);
            reconcileChildren(current, workInProgress, renderExpirationTime);
            current = workInProgress.child;
          } else
            current = bailoutOnAlreadyFinishedWork(current, workInProgress);
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
  function appendAllChildren(parent, workInProgress) {
    for (var node = workInProgress.child; null !== node; ) {
      if (5 === node.tag || 6 === node.tag)
        appendInitialChild(parent, node.stateNode);
      else if (4 !== node.tag && null !== node.child) {
        node.child["return"] = node;
        node = node.child;
        continue;
      }
      if (node === workInProgress) break;
      for (; null === node.sibling; ) {
        if (null === node["return"] || node["return"] === workInProgress)
          return;
        node = node["return"];
      }
      node.sibling["return"] = node["return"];
      node = node.sibling;
    }
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
  if (config.mutation) invariant(!1, "Mutating reconciler is disabled.");
  else if (persistence) {
    var cloneInstance = persistence.cloneInstance,
      createContainerChildSet = persistence.createContainerChildSet,
      appendChildToContainerChildSet =
        persistence.appendChildToContainerChildSet,
      finalizeContainerChildren = persistence.finalizeContainerChildren;
    updateHostContainer = function(workInProgress) {
      var portalOrRoot = workInProgress.stateNode;
      if (null !== workInProgress.firstEffect) {
        var container = portalOrRoot.containerInfo,
          newChildSet = createContainerChildSet(container);
        a: for (var node = workInProgress.child; null !== node; ) {
          if (5 === node.tag || 6 === node.tag)
            appendChildToContainerChildSet(newChildSet, node.stateNode);
          else if (4 !== node.tag && null !== node.child) {
            node.child["return"] = node;
            node = node.child;
            continue;
          }
          if (node === workInProgress) break a;
          for (; null === node.sibling; ) {
            if (null === node["return"] || node["return"] === workInProgress)
              break a;
            node = node["return"];
          }
          node.sibling["return"] = node["return"];
          node = node.sibling;
        }
        portalOrRoot.pendingChildren = newChildSet;
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
      var childrenUnchanged = null === workInProgress.firstEffect;
      current = current.stateNode;
      childrenUnchanged && null === updatePayload
        ? (workInProgress.stateNode = current)
        : ((updatePayload = cloneInstance(
            current,
            updatePayload,
            type,
            oldProps,
            newProps,
            workInProgress,
            childrenUnchanged,
            workInProgress.stateNode
          )),
          finalizeInitialChildren(
            updatePayload,
            type,
            newProps,
            rootContainerInstance,
            currentHostContext
          ) && markUpdate(workInProgress),
          (workInProgress.stateNode = updatePayload),
          childrenUnchanged
            ? markUpdate(workInProgress)
            : appendAllChildren(updatePayload, workInProgress));
    };
    updateHostText = function(current, workInProgress, oldText, newText) {
      oldText !== newText &&
        ((current = getRootHostContainer()),
        (oldText = getHostContext()),
        (workInProgress.stateNode = createTextInstance(
          newText,
          current,
          oldText,
          workInProgress
        )),
        markUpdate(workInProgress));
    };
  } else invariant(!1, "Noop reconciler is disabled.");
  return {
    completeWork: function(current, workInProgress, renderExpirationTime) {
      var newProps = workInProgress.pendingProps;
      switch (workInProgress.tag) {
        case 1:
          return null;
        case 2:
          return (
            popLegacyContextProvider(workInProgress),
            (current = workInProgress.stateNode),
            (newProps = workInProgress.updateQueue),
            null !== newProps &&
              null !== newProps.capturedValues &&
              ((workInProgress.effectTag &= -65),
              "function" === typeof current.componentDidCatch
                ? (workInProgress.effectTag |= 256)
                : (newProps.capturedValues = null)),
            null
          );
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
          current = workInProgress.updateQueue;
          null !== current &&
            null !== current.capturedValues &&
            (workInProgress.effectTag |= 256);
          return null;
        case 5:
          popHostContext(workInProgress);
          renderExpirationTime = getRootHostContainer();
          var type = workInProgress.type;
          if (null !== current && null != workInProgress.stateNode) {
            var oldProps = current.memoizedProps,
              _instance = workInProgress.stateNode,
              currentHostContext = getHostContext();
            _instance = prepareUpdate(
              _instance,
              type,
              oldProps,
              newProps,
              renderExpirationTime,
              currentHostContext
            );
            updateHostComponent(
              current,
              workInProgress,
              _instance,
              type,
              oldProps,
              newProps,
              renderExpirationTime,
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
            popHydrationState(workInProgress)
              ? prepareToHydrateHostInstance(
                  workInProgress,
                  renderExpirationTime,
                  current
                ) && markUpdate(workInProgress)
              : ((oldProps = createInstance(
                  type,
                  newProps,
                  renderExpirationTime,
                  current,
                  workInProgress
                )),
                appendAllChildren(oldProps, workInProgress),
                finalizeInitialChildren(
                  oldProps,
                  type,
                  newProps,
                  renderExpirationTime,
                  current
                ) && markUpdate(workInProgress),
                (workInProgress.stateNode = oldProps));
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
            else if (9 === oldProps.tag) type.push(oldProps.pendingProps.value);
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
        case 14:
          return null;
        case 10:
          return null;
        case 11:
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
function ReactFiberUnwindWork(
  hostContext,
  legacyContext,
  newContext,
  scheduleWork,
  isAlreadyFailedLegacyErrorBoundary
) {
  var popHostContainer = hostContext.popHostContainer,
    popHostContext = hostContext.popHostContext,
    popLegacyContextProvider = legacyContext.popContextProvider,
    popTopLevelLegacyContextObject = legacyContext.popTopLevelContextObject,
    popProvider = newContext.popProvider;
  return {
    throwException: function(returnFiber, sourceFiber, rawValue) {
      sourceFiber.effectTag |= 512;
      sourceFiber.firstEffect = sourceFiber.lastEffect = null;
      sourceFiber = {
        value: rawValue,
        source: sourceFiber,
        stack: getStackAddendumByWorkInProgressFiber(sourceFiber)
      };
      do {
        switch (returnFiber.tag) {
          case 3:
            ensureUpdateQueues(returnFiber);
            returnFiber.updateQueue.capturedValues = [sourceFiber];
            returnFiber.effectTag |= 1024;
            return;
          case 2:
            if (
              ((rawValue = returnFiber.stateNode),
              0 === (returnFiber.effectTag & 64) &&
                null !== rawValue &&
                "function" === typeof rawValue.componentDidCatch &&
                !isAlreadyFailedLegacyErrorBoundary(rawValue))
            ) {
              ensureUpdateQueues(returnFiber);
              rawValue = returnFiber.updateQueue;
              var capturedValues = rawValue.capturedValues;
              null === capturedValues
                ? (rawValue.capturedValues = [sourceFiber])
                : capturedValues.push(sourceFiber);
              returnFiber.effectTag |= 1024;
              return;
            }
        }
        returnFiber = returnFiber["return"];
      } while (null !== returnFiber);
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
    }
  };
}
function logError(boundary, errorInfo) {
  var source = errorInfo.source;
  null === errorInfo.stack && getStackAddendumByWorkInProgressFiber(source);
  null !== source && getComponentName(source);
  errorInfo = errorInfo.value;
  null !== boundary && 2 === boundary.tag && getComponentName(boundary);
  try {
    (errorInfo && errorInfo.suppressReactErrorLogging) ||
      console.error(errorInfo);
  } catch (e) {
    (e && e.suppressReactErrorLogging) || console.error(e);
  }
}
function ReactFiberCommitWork(
  config,
  captureError,
  scheduleWork,
  computeExpirationForFiber,
  markLegacyErrorBoundaryAsFailed
) {
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
  function commitBeforeMutationLifeCycles(current, finishedWork) {
    switch (finishedWork.tag) {
      case 2:
        if (finishedWork.effectTag & 2048 && null !== current) {
          var prevProps = current.memoizedProps,
            prevState = current.memoizedState;
          current = finishedWork.stateNode;
          current.props = finishedWork.memoizedProps;
          current.state = finishedWork.memoizedState;
          finishedWork = current.getSnapshotBeforeUpdate(prevProps, prevState);
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
  }
  function commitLifeCycles(finishedRoot, current, finishedWork) {
    switch (finishedWork.tag) {
      case 2:
        finishedRoot = finishedWork.stateNode;
        if (finishedWork.effectTag & 4)
          if (null === current)
            (finishedRoot.props = finishedWork.memoizedProps),
              (finishedRoot.state = finishedWork.memoizedState),
              finishedRoot.componentDidMount();
          else {
            var prevProps = current.memoizedProps;
            current = current.memoizedState;
            finishedRoot.props = finishedWork.memoizedProps;
            finishedRoot.state = finishedWork.memoizedState;
            finishedRoot.componentDidUpdate(
              prevProps,
              current,
              finishedRoot.__reactInternalSnapshotBeforeUpdate
            );
          }
        finishedWork = finishedWork.updateQueue;
        null !== finishedWork && commitCallbacks(finishedWork, finishedRoot);
        break;
      case 3:
        current = finishedWork.updateQueue;
        if (null !== current) {
          finishedRoot = null;
          if (null !== finishedWork.child)
            switch (finishedWork.child.tag) {
              case 5:
                finishedRoot = getPublicInstance(finishedWork.child.stateNode);
                break;
              case 2:
                finishedRoot = finishedWork.child.stateNode;
            }
          commitCallbacks(current, finishedRoot);
        }
        break;
      case 5:
        finishedRoot = finishedWork.stateNode;
        null === current &&
          finishedWork.effectTag & 4 &&
          commitMount(
            finishedRoot,
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
  }
  function commitErrorLogging(finishedWork, onUncaughtError) {
    switch (finishedWork.tag) {
      case 2:
        var ctor = finishedWork.type;
        onUncaughtError = finishedWork.stateNode;
        var updateQueue = finishedWork.updateQueue;
        invariant(
          null !== updateQueue && null !== updateQueue.capturedValues,
          "An error logging effect should not have been scheduled if no errors were captured. This error is likely caused by a bug in React. Please file an issue."
        );
        var capturedErrors = updateQueue.capturedValues;
        updateQueue.capturedValues = null;
        "function" !== typeof ctor.getDerivedStateFromCatch &&
          markLegacyErrorBoundaryAsFailed(onUncaughtError);
        onUncaughtError.props = finishedWork.memoizedProps;
        onUncaughtError.state = finishedWork.memoizedState;
        for (ctor = 0; ctor < capturedErrors.length; ctor++) {
          updateQueue = capturedErrors[ctor];
          var _error = updateQueue.value,
            stack = updateQueue.stack;
          logError(finishedWork, updateQueue);
          onUncaughtError.componentDidCatch(_error, {
            componentStack: null !== stack ? stack : ""
          });
        }
        break;
      case 3:
        ctor = finishedWork.updateQueue;
        invariant(
          null !== ctor && null !== ctor.capturedValues,
          "An error logging effect should not have been scheduled if no errors were captured. This error is likely caused by a bug in React. Please file an issue."
        );
        capturedErrors = ctor.capturedValues;
        ctor.capturedValues = null;
        for (ctor = 0; ctor < capturedErrors.length; ctor++)
          (updateQueue = capturedErrors[ctor]),
            logError(finishedWork, updateQueue),
            onUncaughtError(updateQueue.value);
        break;
      default:
        invariant(
          !1,
          "This unit of work tag cannot capture errors.  This error is likely caused by a bug in React. Please file an issue."
        );
    }
  }
  function commitAttachRef(finishedWork) {
    var ref = finishedWork.ref;
    if (null !== ref) {
      var _instance6 = finishedWork.stateNode;
      switch (finishedWork.tag) {
        case 5:
          finishedWork = getPublicInstance(_instance6);
          break;
        default:
          finishedWork = _instance6;
      }
      "function" === typeof ref
        ? ref(finishedWork)
        : (ref.current = finishedWork);
    }
  }
  function commitDetachRef(current) {
    current = current.ref;
    null !== current &&
      ("function" === typeof current
        ? current(null)
        : (current.current = null));
  }
  function commitNestedUnmounts(root) {
    for (var node = root; ; ) {
      var current = node;
      "function" === typeof onCommitUnmount && onCommitUnmount(current);
      switch (current.tag) {
        case 2:
          safelyDetachRef(current);
          var _instance7 = current.stateNode;
          if ("function" === typeof _instance7.componentWillUnmount)
            try {
              (_instance7.props = current.memoizedProps),
                (_instance7.state = current.memoizedState),
                _instance7.componentWillUnmount();
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
          persistence && emptyPortalContainer(current);
      }
      if (null === node.child || (mutation && 4 === node.tag)) {
        if (node === root) break;
        for (; null === node.sibling; ) {
          if (null === node["return"] || node["return"] === root) return;
          node = node["return"];
        }
        node.sibling["return"] = node["return"];
        node = node.sibling;
      } else (node.child["return"] = node), (node = node.child);
    }
  }
  var getPublicInstance = config.getPublicInstance,
    mutation = config.mutation,
    persistence = config.persistence,
    emptyPortalContainer = void 0;
  if (!mutation) {
    var commitContainer = void 0;
    if (persistence) {
      var replaceContainerChildren = persistence.replaceContainerChildren,
        createContainerChildSet = persistence.createContainerChildSet;
      emptyPortalContainer = function(current) {
        current = current.stateNode.containerInfo;
        var emptyChildSet = createContainerChildSet(current);
        replaceContainerChildren(current, emptyChildSet);
      };
      commitContainer = function(finishedWork) {
        switch (finishedWork.tag) {
          case 2:
            break;
          case 5:
            break;
          case 6:
            break;
          case 3:
          case 4:
            finishedWork = finishedWork.stateNode;
            replaceContainerChildren(
              finishedWork.containerInfo,
              finishedWork.pendingChildren
            );
            break;
          default:
            invariant(
              !1,
              "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
            );
        }
      };
    } else commitContainer = function() {};
    return {
      commitResetTextContent: function() {},
      commitPlacement: function() {},
      commitDeletion: function(current) {
        commitNestedUnmounts(current);
        current["return"] = null;
        current.child = null;
        current.alternate &&
          ((current.alternate.child = null),
          (current.alternate["return"] = null));
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
  }
  var commitMount = mutation.commitMount;
  invariant(!1, "Mutating reconciler is disabled.");
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
        fiber = fiber["return"];
        invariant(
          fiber,
          "Found unexpected detached subtree parent. This error is likely caused by a bug in React. Please file an issue."
        );
      }
      return fiber.stateNode.context;
    }
  };
}
function ReactFiberNewContext(stack) {
  var createCursor = stack.createCursor,
    push = stack.push,
    pop = stack.pop,
    providerCursor = createCursor(null),
    valueCursor = createCursor(null),
    changedBitsCursor = createCursor(0);
  return {
    pushProvider: function(providerFiber) {
      var context = providerFiber.type._context;
      push(changedBitsCursor, context._changedBits, providerFiber);
      push(valueCursor, context._currentValue, providerFiber);
      push(providerCursor, providerFiber, providerFiber);
      context._currentValue = providerFiber.pendingProps.value;
      context._changedBits = providerFiber.stateNode;
    },
    popProvider: function(providerFiber) {
      var changedBits = changedBitsCursor.current,
        currentValue = valueCursor.current;
      pop(providerCursor, providerFiber);
      pop(valueCursor, providerFiber);
      pop(changedBitsCursor, providerFiber);
      providerFiber = providerFiber.type._context;
      providerFiber._currentValue = currentValue;
      providerFiber._changedBits = changedBits;
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
        var interruptedWork = nextUnitOfWork["return"];
        null !== interruptedWork;

      )
        unwindInterruptedWork(interruptedWork),
          (interruptedWork = interruptedWork["return"]);
    nextRoot = null;
    nextRenderExpirationTime = 0;
    nextUnitOfWork = null;
    isRootReadyForCommit = !1;
  }
  function isAlreadyFailedLegacyErrorBoundary(instance) {
    return (
      null !== legacyErrorBoundariesThatAlreadyFailed &&
      legacyErrorBoundariesThatAlreadyFailed.has(instance)
    );
  }
  function completeUnitOfWork(workInProgress$jscomp$0) {
    for (;;) {
      var current = workInProgress$jscomp$0.alternate,
        returnFiber = workInProgress$jscomp$0["return"],
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
          b: switch (workInProgress.tag) {
            case 3:
            case 2:
              var newExpirationTime = workInProgress.updateQueue;
              newExpirationTime =
                null === newExpirationTime
                  ? 0
                  : newExpirationTime.expirationTime;
              break b;
            default:
              newExpirationTime = 0;
          }
          for (var child = workInProgress.child; null !== child; )
            0 !== child.expirationTime &&
              (0 === newExpirationTime ||
                newExpirationTime > child.expirationTime) &&
              (newExpirationTime = child.expirationTime),
              (child = child.sibling);
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
        workInProgress$jscomp$0 = unwindWork(workInProgress$jscomp$0);
        if (null !== workInProgress$jscomp$0)
          return (
            (workInProgress$jscomp$0.effectTag &= 2559), workInProgress$jscomp$0
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
        (nextUnitOfWork = createWorkInProgress(
          nextRoot.current,
          null,
          nextRenderExpirationTime
        )),
        (root.pendingCommitExpirationTime = 0);
    var didFatal = !1;
    do {
      try {
        if (isAsync)
          for (; null !== nextUnitOfWork && !shouldYield(); )
            nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        else
          for (; null !== nextUnitOfWork; )
            nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      } catch (thrownValue) {
        if (null === nextUnitOfWork) {
          didFatal = !0;
          onUncaughtError(thrownValue);
          break;
        }
        isAsync = nextUnitOfWork;
        var returnFiber = isAsync["return"];
        if (null === returnFiber) {
          didFatal = !0;
          onUncaughtError(thrownValue);
          break;
        }
        throwException(returnFiber, isAsync, thrownValue);
        nextUnitOfWork = completeUnitOfWork(isAsync);
      }
      break;
    } while (1);
    isWorking = !1;
    if (didFatal || null !== nextUnitOfWork) return null;
    if (isRootReadyForCommit)
      return (
        (root.pendingCommitExpirationTime = expirationTime),
        root.current.alternate
      );
    invariant(
      !1,
      "Expired work should have completed. This error is likely caused by a bug in React. Please file an issue."
    );
  }
  function scheduleCapture(sourceFiber, boundaryFiber, value, expirationTime) {
    sourceFiber = {
      value: value,
      source: sourceFiber,
      stack: getStackAddendumByWorkInProgressFiber(sourceFiber)
    };
    insertUpdateIntoFiber(boundaryFiber, {
      expirationTime: expirationTime,
      partialState: null,
      callback: null,
      isReplace: !1,
      isForced: !1,
      capturedValue: sourceFiber,
      next: null
    });
    scheduleWork(boundaryFiber, expirationTime);
  }
  function onCommitPhaseError(fiber$jscomp$0, error) {
    a: {
      invariant(
        !isWorking || isCommitting,
        "dispatch: Cannot dispatch during the render phase."
      );
      for (var fiber = fiber$jscomp$0["return"]; null !== fiber; ) {
        switch (fiber.tag) {
          case 2:
            var instance = fiber.stateNode;
            if (
              "function" === typeof fiber.type.getDerivedStateFromCatch ||
              ("function" === typeof instance.componentDidCatch &&
                !isAlreadyFailedLegacyErrorBoundary(instance))
            ) {
              scheduleCapture(fiber$jscomp$0, fiber, error, 1);
              fiber$jscomp$0 = void 0;
              break a;
            }
            break;
          case 3:
            scheduleCapture(fiber$jscomp$0, fiber, error, 1);
            fiber$jscomp$0 = void 0;
            break a;
        }
        fiber = fiber["return"];
      }
      3 === fiber$jscomp$0.tag &&
        scheduleCapture(fiber$jscomp$0, fiber$jscomp$0, error, 1);
      fiber$jscomp$0 = void 0;
    }
    return fiber$jscomp$0;
  }
  function computeExpirationForFiber(fiber) {
    fiber =
      0 !== expirationContext
        ? expirationContext
        : isWorking
          ? isCommitting ? 1 : nextRenderExpirationTime
          : fiber.mode & 1
            ? isBatchingInteractiveUpdates
              ? 10 * ((((recalculateCurrentTime() + 50) / 10) | 0) + 1)
              : 25 * ((((recalculateCurrentTime() + 500) / 25) | 0) + 1)
            : 1;
    isBatchingInteractiveUpdates &&
      (0 === lowestPendingInteractiveExpirationTime ||
        fiber > lowestPendingInteractiveExpirationTime) &&
      (lowestPendingInteractiveExpirationTime = fiber);
    return fiber;
  }
  function scheduleWork(fiber, expirationTime) {
    a: {
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
              0 !== nextRenderExpirationTime &&
              expirationTime < nextRenderExpirationTime &&
              resetStack();
            (isWorking && !isCommitting && nextRoot === root) ||
              requestWork(root, expirationTime);
            nestedUpdateCount > NESTED_UPDATE_LIMIT &&
              invariant(
                !1,
                "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops."
              );
          } else {
            expirationTime = void 0;
            break a;
          }
        fiber = fiber["return"];
      }
      expirationTime = void 0;
    }
    return expirationTime;
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
          nextEffect.effectTag & 2048 &&
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
          effectTag$jscomp$0 & 256 &&
            commitErrorLogging(nextEffect, onUncaughtError);
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
  var stack = ReactFiberStack(),
    hostContext = ReactFiberHostContext(config, stack),
    legacyContext = ReactFiberLegacyContext(stack);
  stack = ReactFiberNewContext(stack);
  var hydrationContext = ReactFiberHydrationContext(config),
    beginWork = ReactFiberBeginWork(
      config,
      hostContext,
      legacyContext,
      stack,
      hydrationContext,
      scheduleWork,
      computeExpirationForFiber
    ).beginWork,
    completeWork = ReactFiberCompleteWork(
      config,
      hostContext,
      legacyContext,
      stack,
      hydrationContext
    ).completeWork;
  hostContext = ReactFiberUnwindWork(
    hostContext,
    legacyContext,
    stack,
    scheduleWork,
    isAlreadyFailedLegacyErrorBoundary
  );
  var throwException = hostContext.throwException,
    unwindWork = hostContext.unwindWork,
    unwindInterruptedWork = hostContext.unwindInterruptedWork;
  hostContext = ReactFiberCommitWork(
    config,
    onCommitPhaseError,
    scheduleWork,
    computeExpirationForFiber,
    function(instance) {
      null === legacyErrorBoundariesThatAlreadyFailed
        ? (legacyErrorBoundariesThatAlreadyFailed = new Set([instance]))
        : legacyErrorBoundariesThatAlreadyFailed.add(instance);
    },
    recalculateCurrentTime
  );
  var commitBeforeMutationLifeCycles =
      hostContext.commitBeforeMutationLifeCycles,
    commitResetTextContent = hostContext.commitResetTextContent,
    commitPlacement = hostContext.commitPlacement,
    commitDeletion = hostContext.commitDeletion,
    commitWork = hostContext.commitWork,
    commitLifeCycles = hostContext.commitLifeCycles,
    commitErrorLogging = hostContext.commitErrorLogging,
    commitAttachRef = hostContext.commitAttachRef,
    commitDetachRef = hostContext.commitDetachRef,
    now = config.now,
    scheduleDeferredCallback = config.scheduleDeferredCallback,
    cancelDeferredCallback = config.cancelDeferredCallback,
    prepareForCommit = config.prepareForCommit,
    resetAfterCommit = config.resetAfterCommit,
    originalStartTimeMs = now(),
    mostRecentCurrentTime = 2,
    mostRecentCurrentTimeMs = originalStartTimeMs,
    lastUniqueAsyncExpiration = 0,
    expirationContext = 0,
    isWorking = !1,
    nextUnitOfWork = null,
    nextRoot = null,
    nextRenderExpirationTime = 0,
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
        25 * ((((recalculateCurrentTime() + 500) / 25) | 0) + 1);
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
      var result = 25 * ((((recalculateCurrentTime() + 500) / 25) | 0) + 1);
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
    currentTime,
    expirationTime,
    callback
  ) {
    currentTime = container.current;
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
    insertUpdateIntoFiber(currentTime, {
      expirationTime: expirationTime,
      partialState: { element: element },
      callback: void 0 === container ? null : container,
      isReplace: !1,
      isForced: !1,
      capturedValue: null,
      next: null
    });
    scheduleWork(currentTime, expirationTime);
    return expirationTime;
  }
  function findHostInstance(fiber) {
    fiber = findCurrentHostFiber(fiber);
    return null === fiber ? null : fiber.stateNode;
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
      current = computeExpirationForFiber(current);
      return updateContainerAtExpirationTime(
        element,
        container,
        parentComponent,
        currentTime,
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
  ReactNativeTagHandles = {
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
  ReactFabricHostComponent = (function() {
    function ReactFabricHostComponent(tag, viewConfig, props) {
      if (!(this instanceof ReactFabricHostComponent))
        throw new TypeError("Cannot call a class as a function");
      this._nativeTag = tag;
      this.viewConfig = viewConfig;
      this.currentProps = props;
    }
    ReactFabricHostComponent.prototype.blur = function() {
      TextInputState.blurTextInput(this._nativeTag);
    };
    ReactFabricHostComponent.prototype.focus = function() {
      TextInputState.focusTextInput(this._nativeTag);
    };
    ReactFabricHostComponent.prototype.measure = function(callback) {
      UIManager.measure(this._nativeTag, mountSafeCallback(this, callback));
    };
    ReactFabricHostComponent.prototype.measureInWindow = function(callback) {
      UIManager.measureInWindow(
        this._nativeTag,
        mountSafeCallback(this, callback)
      );
    };
    ReactFabricHostComponent.prototype.measureLayout = function(
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
    ReactFabricHostComponent.prototype.setNativeProps = function(nativeProps) {
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
    return ReactFabricHostComponent;
  })(),
  ReactFabricRenderer = reactReconciler({
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
      rootContainerInstance = FabricUIManager.createNode(
        hostContext,
        type.uiViewClassName,
        rootContainerInstance,
        viewConfig,
        internalInstanceHandle
      );
      props = new ReactFabricHostComponent(hostContext, type, props);
      return { node: rootContainerInstance, canonical: props };
    },
    createTextInstance: function(
      text,
      rootContainerInstance,
      hostContext,
      internalInstanceHandle
    ) {
      hostContext = ReactNativeTagHandles.allocateTag();
      return {
        node: FabricUIManager.createNode(
          hostContext,
          "RCTRawText",
          rootContainerInstance,
          { text: text },
          internalInstanceHandle
        )
      };
    },
    finalizeInitialChildren: function() {
      return !1;
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
    prepareForCommit: function() {},
    prepareUpdate: function(instance, type, oldProps, newProps) {
      return diffProperties(
        null,
        oldProps,
        newProps,
        instance.canonical.viewConfig.validAttributes
      );
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
    persistence: {
      cloneInstance: function(
        instance,
        updatePayload,
        type,
        oldProps,
        newProps,
        internalInstanceHandle,
        keepChildren
      ) {
        type = instance.node;
        return {
          node: keepChildren
            ? null !== updatePayload
              ? FabricUIManager.cloneNodeWithNewProps(type, updatePayload)
              : FabricUIManager.cloneNode(type)
            : null !== updatePayload
              ? FabricUIManager.cloneNodeWithNewChildrenAndProps(
                  type,
                  updatePayload
                )
              : FabricUIManager.cloneNodeWithNewChildren(type),
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
      replaceContainerChildren: function() {}
    }
  }),
  getInspectorDataForViewTag = void 0;
getInspectorDataForViewTag = function() {
  invariant(!1, "getInspectorDataForViewTag() is not available in production");
};
findHostInstanceFabric = ReactFabricRenderer.findHostInstance;
_batchedUpdates = ReactFabricRenderer.batchedUpdates;
_flushInteractiveUpdates = ReactFabricRenderer.flushInteractiveUpdates;
var roots = new Map(),
  ReactFabric = {
    NativeComponent: ReactNativeComponent,
    findNodeHandle: findNumericNodeHandleFiber,
    render: function(element, containerTag, callback) {
      var root = roots.get(containerTag);
      root ||
        ((root = ReactFabricRenderer.createContainer(containerTag, !1, !1)),
        roots.set(containerTag, root));
      ReactFabricRenderer.updateContainer(element, root, null, callback);
      return ReactFabricRenderer.getPublicRootInstance(root);
    },
    unmountComponentAtNode: function(containerTag) {
      var root = roots.get(containerTag);
      root &&
        ReactFabricRenderer.updateContainer(null, root, null, function() {
          roots["delete"](containerTag);
        });
    },
    unmountComponentAtNodeAndRemoveContainer: function(containerTag) {
      ReactFabric.unmountComponentAtNode(containerTag);
    },
    createPortal: function(children, containerTag) {
      return createPortal(
        children,
        containerTag,
        null,
        2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null
      );
    },
    unstable_batchedUpdates: function(fn, bookkeeping) {
      if (isBatching) return fn(bookkeeping);
      isBatching = !0;
      try {
        return _batchedUpdates(fn, bookkeeping);
      } finally {
        if (
          ((isBatching = !1), null !== restoreTarget || null !== restoreQueue)
        )
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
    },
    flushSync: ReactFabricRenderer.flushSync,
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
ReactFabricRenderer.injectIntoDevTools({
  findFiberByHostInstance: getInstanceFromTag,
  getInspectorDataForViewTag: getInspectorDataForViewTag,
  bundleType: 0,
  version: "16.3.1",
  rendererPackageName: "react-native-renderer"
});
var ReactFabric$2 = Object.freeze({ default: ReactFabric }),
  ReactFabric$3 = (ReactFabric$2 && ReactFabric) || ReactFabric$2;
module.exports = ReactFabric$3["default"]
  ? ReactFabric$3["default"]
  : ReactFabric$3;
