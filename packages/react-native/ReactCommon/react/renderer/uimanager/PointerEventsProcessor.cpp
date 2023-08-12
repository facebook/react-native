/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PointerEventsProcessor.h"

namespace facebook::react {

static PointerEventTarget retargetPointerEvent(
    PointerEvent const &event,
    ShadowNode const &nodeToTarget,
    UIManager const &uiManager) {
  PointerEvent retargetedEvent(event);

  // TODO: is dereferencing latestNodeToTarget without null checking safe?
  auto latestNodeToTarget = uiManager.getNewestCloneOfShadowNode(nodeToTarget);

  // Adjust offsetX/Y to be relative to the retargeted node
  // HACK: This is a basic/incomplete implementation which simply subtracts
  // the retargeted node's origin from the original event's client coordinates.
  // More work will be needed to properly take non-trival transforms into
  // account.
  auto layoutMetrics = uiManager.getRelativeLayoutMetrics(
      *latestNodeToTarget, nullptr, {/* .includeTransform */ true});
  retargetedEvent.offsetPoint = {
      event.clientPoint.x - layoutMetrics.frame.origin.x,
      event.clientPoint.y - layoutMetrics.frame.origin.y,
  };

  // Retrieve the event target of the retargeted node
  auto retargetedEventTarget =
      latestNodeToTarget->getEventEmitter()->getEventTarget();

  PointerEventTarget result = {};
  result.event = retargetedEvent;
  result.target = retargetedEventTarget;
  return result;
}

static ShadowNode::Shared getCaptureTargetOverride(
    PointerIdentifier pointerId,
    CaptureTargetOverrideRegistry &registry) {
  auto pendingPointerItr = registry.find(pointerId);
  if (pendingPointerItr == registry.end()) {
    return nullptr;
  }

  ShadowNode::Weak maybeTarget = pendingPointerItr->second;
  if (maybeTarget.expired()) {
    // target has expired so it should functionally behave the same as if it
    // was removed from the override list.
    registry.erase(pointerId);
    return nullptr;
  }

  return maybeTarget.lock();
}

void PointerEventsProcessor::interceptPointerEvent(
    jsi::Runtime &runtime,
    EventTarget const *target,
    std::string const &type,
    ReactEventPriority priority,
    PointerEvent const &event,
    DispatchEvent const &eventDispatcher,
    UIManager const &uiManager) {
  // Process all pending pointer capture assignments
  processPendingPointerCapture(event, runtime, eventDispatcher, uiManager);

  PointerEvent pointerEvent(event);
  EventTarget const *eventTarget = target;

  // Retarget the event if it has a pointer capture override target
  auto overrideTarget = getCaptureTargetOverride(
      pointerEvent.pointerId, pendingPointerCaptureTargetOverrides_);
  if (overrideTarget != nullptr &&
      overrideTarget->getTag() != eventTarget->getTag()) {
    auto retargeted =
        retargetPointerEvent(pointerEvent, *overrideTarget, uiManager);

    pointerEvent = retargeted.event;
    eventTarget = retargeted.target.get();
  }

  eventTarget->retain(runtime);
  eventDispatcher(runtime, eventTarget, type, priority, pointerEvent);
  eventTarget->release(runtime);

  // Implicit pointer capture release
  if (overrideTarget != nullptr &&
      (type == "topPointerUp" || type == "topPointerCancel")) {
    releasePointerCapture(pointerEvent.pointerId, overrideTarget.get());
    processPendingPointerCapture(
        pointerEvent, runtime, eventDispatcher, uiManager);
  }
}

void PointerEventsProcessor::setPointerCapture(
    PointerIdentifier pointerId,
    ShadowNode::Shared const &shadowNode) {
  // TODO: Throw DOMException with name "NotFoundError" when pointerId does not
  // match any of the active pointers
  pendingPointerCaptureTargetOverrides_[pointerId] = shadowNode;
}

void PointerEventsProcessor::releasePointerCapture(
    PointerIdentifier pointerId,
    ShadowNode const *shadowNode) {
  // TODO: Throw DOMException with name "NotFoundError" when pointerId does not
  // match any of the active pointers

  // We only clear the pointer's capture target override if release was called
  // on the shadowNode which has the capture override, otherwise the result
  // should no-op
  auto pendingTarget = getCaptureTargetOverride(
      pointerId, pendingPointerCaptureTargetOverrides_);
  if (pendingTarget != nullptr &&
      pendingTarget->getTag() == shadowNode->getTag()) {
    pendingPointerCaptureTargetOverrides_.erase(pointerId);
  }
}

bool PointerEventsProcessor::hasPointerCapture(
    PointerIdentifier pointerId,
    ShadowNode const *shadowNode) {
  ShadowNode::Shared pendingTarget = getCaptureTargetOverride(
      pointerId, pendingPointerCaptureTargetOverrides_);
  if (pendingTarget != nullptr) {
    return pendingTarget->getTag() == shadowNode->getTag();
  }
  return false;
}

void PointerEventsProcessor::processPendingPointerCapture(
    PointerEvent const &event,
    jsi::Runtime &runtime,
    DispatchEvent const &eventDispatcher,
    UIManager const &uiManager) {
  auto pendingOverride = getCaptureTargetOverride(
      event.pointerId, pendingPointerCaptureTargetOverrides_);
  bool hasPendingOverride = pendingOverride != nullptr;

  auto activeOverride = getCaptureTargetOverride(
      event.pointerId, activePointerCaptureTargetOverrides_);
  bool hasActiveOverride = activeOverride != nullptr;

  if (!hasPendingOverride && !hasActiveOverride) {
    return;
  }

  auto pendingOverrideTag =
      (hasPendingOverride) ? pendingOverride->getTag() : -1;
  auto activeOverrideTag = (hasActiveOverride) ? activeOverride->getTag() : -1;

  if (hasActiveOverride && activeOverrideTag != pendingOverrideTag) {
    auto retargeted = retargetPointerEvent(event, *activeOverride, uiManager);

    retargeted.target->retain(runtime);
    eventDispatcher(
        runtime,
        retargeted.target.get(),
        "topLostPointerCapture",
        ReactEventPriority::Discrete,
        retargeted.event);
    retargeted.target->release(runtime);
  }

  if (hasPendingOverride && activeOverrideTag != pendingOverrideTag) {
    auto retargeted = retargetPointerEvent(event, *pendingOverride, uiManager);

    retargeted.target->retain(runtime);
    eventDispatcher(
        runtime,
        retargeted.target.get(),
        "topGotPointerCapture",
        ReactEventPriority::Discrete,
        retargeted.event);
    retargeted.target->release(runtime);
  }

  if (!hasPendingOverride) {
    activePointerCaptureTargetOverrides_.erase(event.pointerId);
  } else {
    activePointerCaptureTargetOverrides_[event.pointerId] = pendingOverride;
  }
}

} // namespace facebook::react
