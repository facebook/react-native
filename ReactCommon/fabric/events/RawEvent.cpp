/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawEvent.h"

namespace facebook {
namespace react {

RawEvent::RawEvent(
  const std::string &type,
  const folly::dynamic &payload,
  const EventTarget &eventTarget,
  const std::function<bool()> &isDispatchable
):
  type(type),
  payload(payload),
  eventTarget(eventTarget),
  isDispachable_(isDispatchable) {}

bool RawEvent::isDispachable() const {
  return isDispachable_();
}

} // namespace react
} // namespace facebook
