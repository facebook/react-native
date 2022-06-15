/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventEmitter.h"

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/renderer/debug/SystraceSection.h>

#include "RawEvent.h"

namespace facebook {
namespace react {

// TODO(T29874519): Get rid of "top" prefix once and for all.
/*
 * Capitalizes the first letter of the event type and adds "top" prefix if
 * necessary (e.g. "layout" becames "topLayout").
 */
static std::string normalizeEventType(std::string type) {
  auto prefixedType = std::move(type);
  if (prefixedType.find("top", 0) != 0) {
    prefixedType.insert(0, "top");
    prefixedType[3] = static_cast<char>(toupper(prefixedType[3]));
  }
  return prefixedType;
}

std::mutex &EventEmitter::DispatchMutex() {
  static std::mutex mutex;
  return mutex;
}

ValueFactory EventEmitter::defaultPayloadFactory() {
  static auto payloadFactory =
      ValueFactory{[](jsi::Runtime &runtime) { return jsi::Object(runtime); }};
  return payloadFactory;
}

EventEmitter::EventEmitter(
    SharedEventTarget eventTarget,
    Tag tag,
    EventDispatcher::Weak eventDispatcher)
    : eventTarget_(std::move(eventTarget)),
      eventDispatcher_(std::move(eventDispatcher)) {}

void EventEmitter::dispatchEvent(
    std::string type,
    const folly::dynamic &payload,
    EventPriority priority,
    RawEvent::Category category) const {
  dispatchEvent(
      std::move(type),
      [payload](jsi::Runtime &runtime) {
        return valueFromDynamic(runtime, payload);
      },
      priority,
      category);
}

void EventEmitter::dispatchUniqueEvent(
    std::string type,
    const folly::dynamic &payload) const {
  dispatchUniqueEvent(std::move(type), [payload](jsi::Runtime &runtime) {
    return valueFromDynamic(runtime, payload);
  });
}

void EventEmitter::dispatchEvent(
    std::string type,
    const ValueFactory &payloadFactory,
    EventPriority priority,
    RawEvent::Category category) const {
  SystraceSection s("EventEmitter::dispatchEvent", "type", type);

  auto eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  eventDispatcher->dispatchEvent(
      RawEvent(
          normalizeEventType(std::move(type)),
          payloadFactory,
          eventTarget_,
          category),
      priority);
}

void EventEmitter::dispatchUniqueEvent(
    std::string type,
    const ValueFactory &payloadFactory) const {
  SystraceSection s("EventEmitter::dispatchUniqueEvent");

  auto eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  eventDispatcher->dispatchUniqueEvent(RawEvent(
      normalizeEventType(std::move(type)),
      payloadFactory,
      eventTarget_,
      RawEvent::Category::Continuous));
}

void EventEmitter::setEnabled(bool enabled) const {
  enableCounter_ += enabled ? 1 : -1;

  bool shouldBeEnabled = enableCounter_ > 0;
  if (isEnabled_ != shouldBeEnabled) {
    isEnabled_ = shouldBeEnabled;
    if (eventTarget_) {
      eventTarget_->setEnabled(isEnabled_);
    }
  }

  // Note: Initially, the state of `eventTarget_` and the value `enableCounter_`
  // is mismatched intentionally (it's `non-null` and `0` accordingly). We need
  // this to support an initial nebula state where the event target must be
  // retained without any associated mounted node.
  bool shouldBeRetained = enableCounter_ > 0;
  if (shouldBeRetained != (eventTarget_ != nullptr)) {
    if (!shouldBeRetained) {
      eventTarget_.reset();
    }
  }
}

} // namespace react
} // namespace facebook
