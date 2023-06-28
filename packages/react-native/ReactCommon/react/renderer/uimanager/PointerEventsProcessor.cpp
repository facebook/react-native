/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PointerEventsProcessor.h"

namespace facebook::react {

bool PointerEventsProcessor::isPointerEvent(std::string const &type) {
  return pointerEventNames().find(type) != pointerEventNames().end();
}

PointerEvent PointerEventsProcessor::pointerEventFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &value) {
  auto object = value.asObject(runtime);

  PointerEvent event = {};
  event.pointerId =
      static_cast<int>(object.getProperty(runtime, "pointerId").asNumber());
  event.pressure =
      static_cast<float>(object.getProperty(runtime, "pressure").asNumber());
  event.pointerType = object.getProperty(runtime, "pointerType")
                          .asString(runtime)
                          .utf8(runtime);
  event.clientPoint = {
      static_cast<float>(object.getProperty(runtime, "clientX").asNumber()),
      static_cast<float>(object.getProperty(runtime, "clientY").asNumber())};
  event.screenPoint = {
      static_cast<float>(object.getProperty(runtime, "screenX").asNumber()),
      static_cast<float>(object.getProperty(runtime, "screenY").asNumber())};
  event.offsetPoint = {
      static_cast<float>(object.getProperty(runtime, "offsetX").asNumber()),
      static_cast<float>(object.getProperty(runtime, "offsetY").asNumber())};
  event.width =
      static_cast<float>(object.getProperty(runtime, "width").asNumber());
  event.height =
      static_cast<float>(object.getProperty(runtime, "height").asNumber());
  event.tiltX =
      static_cast<int>(object.getProperty(runtime, "tiltX").asNumber());
  event.tiltY =
      static_cast<int>(object.getProperty(runtime, "tiltY").asNumber());
  event.detail =
      static_cast<int>(object.getProperty(runtime, "detail").asNumber());
  event.buttons =
      static_cast<int>(object.getProperty(runtime, "buttons").asNumber());
  event.tangentialPressure = static_cast<float>(
      object.getProperty(runtime, "tangentialPressure").asNumber());
  event.twist =
      static_cast<int>(object.getProperty(runtime, "twist").asNumber());
  event.ctrlKey = object.getProperty(runtime, "ctrlKey").asBool();
  event.shiftKey = object.getProperty(runtime, "shiftKey").asBool();
  event.metaKey = object.getProperty(runtime, "metaKey").asBool();
  event.isPrimary = object.getProperty(runtime, "isPrimary").asBool();
  event.button =
      static_cast<int>(object.getProperty(runtime, "button").asNumber());

  return event;
}

jsi::Value PointerEventsProcessor::valueFromPointerEvent(
    jsi::Runtime &runtime,
    PointerEvent const &event) {
  auto object = jsi::Object(runtime);
  object.setProperty(runtime, "pointerId", event.pointerId);
  object.setProperty(runtime, "pressure", event.pressure);
  object.setProperty(runtime, "pointerType", event.pointerType);
  object.setProperty(runtime, "clientX", event.clientPoint.x);
  object.setProperty(runtime, "clientY", event.clientPoint.y);
  object.setProperty(runtime, "x", event.clientPoint.x);
  object.setProperty(runtime, "y", event.clientPoint.y);
  object.setProperty(runtime, "pageX", event.clientPoint.x);
  object.setProperty(runtime, "pageY", event.clientPoint.y);
  object.setProperty(runtime, "screenX", event.screenPoint.x);
  object.setProperty(runtime, "screenY", event.screenPoint.y);
  object.setProperty(runtime, "offsetX", event.offsetPoint.x);
  object.setProperty(runtime, "offsetY", event.offsetPoint.y);
  object.setProperty(runtime, "width", event.width);
  object.setProperty(runtime, "height", event.height);
  object.setProperty(runtime, "tiltX", event.tiltX);
  object.setProperty(runtime, "tiltY", event.tiltY);
  object.setProperty(runtime, "detail", event.detail);
  object.setProperty(runtime, "buttons", event.buttons);
  object.setProperty(runtime, "tangentialPressure", event.tangentialPressure);
  object.setProperty(runtime, "twist", event.twist);
  object.setProperty(runtime, "ctrlKey", event.ctrlKey);
  object.setProperty(runtime, "shiftKey", event.shiftKey);
  object.setProperty(runtime, "altKey", event.altKey);
  object.setProperty(runtime, "metaKey", event.metaKey);
  object.setProperty(runtime, "isPrimary", event.isPrimary);
  object.setProperty(runtime, "button", event.button);
  return object;
}

PointerEventsProcessor::PointerEventsProcessor(
    std::shared_ptr<UIManager> uiManager)
    : uiManager_(std::move(uiManager)) {}

void PointerEventsProcessor::interceptPointerEvent(
    jsi::Runtime &runtime,
    EventTarget const *eventTarget,
    std::string const &type,
    ReactEventPriority priority,
    jsi::Value &payload,
    DispatchEvent const &eventDispatcher) {
  PointerEvent event = pointerEventFromValue(runtime, payload);

  // Process all pending pointer capture assignments
  processPendingPointerCapture(event, runtime, eventDispatcher);

  // Check if event needs retargeting
  auto overrideIter =
      pendingPointerCaptureTargetOverrides_.find(event.pointerId);
  bool hasPendingOverride =
      overrideIter != pendingPointerCaptureTargetOverrides_.end();
  if (hasPendingOverride &&
      overrideIter->second->getTag() != eventTarget->getTag()) {
    // Retarget event
    auto nodeToTarget =
        uiManager_->getNewestCloneOfShadowNode(*overrideIter->second);

    // Update offsetPoint to account for change in target
    auto layoutMetrics = uiManager_->getRelativeLayoutMetrics(
        *nodeToTarget, nullptr, {/* .includeTransform = */ true});
    event.offsetPoint = {
        event.clientPoint.x - layoutMetrics.frame.origin.x,
        event.clientPoint.y - layoutMetrics.frame.origin.y};

    // Retrieve the event target of the retargeted node
    auto retargetedEventTarget =
        nodeToTarget->getEventEmitter()->getEventTarget();

    // Regenerate an updated jsi value from the updated PointerEvent
    auto retargetedPayload = valueFromPointerEvent(runtime, event);

    EventTargetWrapper wrapper(retargetedEventTarget, runtime);
    eventDispatcher(
        runtime,
        retargetedEventTarget.get(),
        type,
        priority,
        retargetedPayload);
  } else {
    // Pass through event
    eventDispatcher(runtime, eventTarget, type, priority, payload);
  }

  // Implicit release of pointer capture
  if (hasPendingOverride &&
      (type == "topPointerUp" || type == "topPointerCancel")) {
    releasePointerCapture(event.pointerId, overrideIter->second.get());
    processPendingPointerCapture(event, runtime, eventDispatcher);
  }
}

void PointerEventsProcessor::setPointerCapture(
    PointerIdentifier pointerId,
    ShadowNode::Shared const &shadowNode) {
  pendingPointerCaptureTargetOverrides_[pointerId] = shadowNode;
}

void PointerEventsProcessor::releasePointerCapture(
    PointerIdentifier pointerId,
    ShadowNode const * /*shadowNode*/) {
  pendingPointerCaptureTargetOverrides_.erase(pointerId);
}

bool PointerEventsProcessor::hasPointerCapture(
    PointerIdentifier pointerId,
    ShadowNode const *shadowNode) {
  auto pendingPointerItr =
      pendingPointerCaptureTargetOverrides_.find(pointerId);
  if (pendingPointerItr == pendingPointerCaptureTargetOverrides_.end()) {
    return false;
  }
  return pendingPointerItr->second->getTag() == shadowNode->getTag();
}

void PointerEventsProcessor::processPendingPointerCapture(
    const PointerEvent &event,
    jsi::Runtime &runtime,
    DispatchEvent const &eventDispatcher) {
  auto activeOverrideIter =
      activePointerCaptureTargetOverrides_.find(event.pointerId);
  bool hasActiveOverride =
      activeOverrideIter != activePointerCaptureTargetOverrides_.end();

  auto pendingOverrideIter =
      pendingPointerCaptureTargetOverrides_.find(event.pointerId);
  bool hasPendingOverride =
      pendingOverrideIter != pendingPointerCaptureTargetOverrides_.end();

  if (!hasPendingOverride && !hasActiveOverride) {
    return;
  }

  auto activeOverrideTag =
      (hasActiveOverride) ? activeOverrideIter->second->getTag() : -1;
  auto pendingOverrideTag =
      (hasPendingOverride) ? pendingOverrideIter->second->getTag() : -1;

  if (hasActiveOverride && activeOverrideTag != pendingOverrideTag) {
    auto shadowNodeToEmitTo =
        uiManager_->getNewestCloneOfShadowNode(*activeOverrideIter->second);
    auto eventTarget = shadowNodeToEmitTo->getEventEmitter()->getEventTarget();
    auto payload = valueFromPointerEvent(runtime, event);

    EventTargetWrapper wrapper(eventTarget, runtime);
    eventDispatcher(
        runtime,
        eventTarget.get(),
        "topLostPointerCapture",
        ReactEventPriority::Discrete,
        payload);
  }

  if (hasPendingOverride && activeOverrideTag != pendingOverrideTag) {
    auto shadowNodeToEmitTo =
        uiManager_->getNewestCloneOfShadowNode(*pendingOverrideIter->second);
    auto eventTarget = shadowNodeToEmitTo->getEventEmitter()->getEventTarget();
    auto payload = valueFromPointerEvent(runtime, event);

    EventTargetWrapper wrapper(eventTarget, runtime);
    eventDispatcher(
        runtime,
        eventTarget.get(),
        "topGotPointerCapture",
        ReactEventPriority::Discrete,
        payload);
  }

  if (!hasPendingOverride) {
    activePointerCaptureTargetOverrides_.erase(event.pointerId);
  } else {
    activePointerCaptureTargetOverrides_[event.pointerId] =
        pendingOverrideIter->second;
  }
}

} // namespace facebook::react
