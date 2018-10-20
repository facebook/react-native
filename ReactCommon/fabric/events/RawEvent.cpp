/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawEvent.h"

namespace facebook {
namespace react {

RawEvent::RawEvent(
    std::string type,
    folly::dynamic payload,
    WeakEventTarget eventTarget)
    : type(std::move(type)),
      payload(std::move(payload)),
      eventTarget(std::move(eventTarget)) {}

} // namespace react
} // namespace facebook
