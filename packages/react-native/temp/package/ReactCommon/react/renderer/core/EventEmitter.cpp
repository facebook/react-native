/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventEmitter.h"

#include <cxxreact/SystraceSection.h>
#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>

#include "RawEvent.h"

namespace facebook::react {

static bool hasPrefix(const std::string& str, const std::string& prefix) {
  return str.compare(0, prefix.length(), prefix) == 0;
}

// TODO(T29874519): Get rid of "top" prefix once and for all.
/*
 * Replaces "on" with "top" if present. Or capitalizes the first letter and adds
 * "top" prefix. E.g. "eventName" becomes "topEventName", "onEventName" also
 * becomes "topEventName".
 */
/* static */ std::string EventEmitter::normalizeEventType(std::string type) {
  auto prefixedType = std::move(type);
  if (facebook::react::hasPrefix(prefixedType, "top")) {
    return prefixedType;
  }
  if (facebook::react::hasPrefix(prefixedType, "on")) {
    return "top" + prefixedType.substr(2);
  }
  prefixedType[0] = static_cast<char>(toupper(prefixedType[0]));
  return "top" + prefixedType;
}

std::mutex& EventEmitter::DispatchMutex() {
  static std::mutex mutex;
  return mutex;
}

ValueFactory EventEmitter::defaultPayloadFactory() {
  static auto payloadFactory =
      ValueFactory{[](jsi::Runtime& runtime) { return jsi::Object(runtime); }};
  return payloadFactory;
}

EventEmitter::EventEmitter(
    SharedEventTarget eventTarget,
    EventDispatcher::Weak eventDispatcher)
    : eventTarget_(std::move(eventTarget)),
      eventDispatcher_(std::move(eventDispatcher)) {}

void EventEmitter::dispatchEvent(
    std::string type,
    const folly::dynamic& payload,
    RawEvent::Category category) const {
  dispatchEvent(
      std::move(type),
      [payload](jsi::Runtime& runtime) {
        return valueFromDynamic(runtime, payload);
      },
      category);
}

void EventEmitter::dispatchUniqueEvent(
    std::string type,
    const folly::dynamic& payload) const {
  dispatchUniqueEvent(std::move(type), [payload](jsi::Runtime& runtime) {
    return valueFromDynamic(runtime, payload);
  });
}

void EventEmitter::dispatchEvent(
    std::string type,
    const ValueFactory& payloadFactory,
    RawEvent::Category category) const {
  dispatchEvent(
      std::move(type),
      std::make_shared<ValueFactoryEventPayload>(payloadFactory),
      category);
}

void EventEmitter::dispatchEvent(
    std::string type,
    SharedEventPayload payload,
    RawEvent::Category category) const {
  SystraceSection s("EventEmitter::dispatchEvent", "type", type);

  auto eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  eventDispatcher->dispatchEvent(RawEvent(
      normalizeEventType(std::move(type)),
      std::move(payload),
      eventTarget_,
      category));
}

void EventEmitter::dispatchUniqueEvent(
    std::string type,
    const ValueFactory& payloadFactory) const {
  dispatchUniqueEvent(
      std::move(type),
      std::make_shared<ValueFactoryEventPayload>(payloadFactory));
}

void EventEmitter::dispatchUniqueEvent(
    std::string type,
    SharedEventPayload payload) const {
  SystraceSection s("EventEmitter::dispatchUniqueEvent");

  auto eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  eventDispatcher->dispatchUniqueEvent(RawEvent(
      normalizeEventType(std::move(type)),
      std::move(payload),
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

const SharedEventTarget& EventEmitter::getEventTarget() const {
  return eventTarget_;
}

} // namespace facebook::react
