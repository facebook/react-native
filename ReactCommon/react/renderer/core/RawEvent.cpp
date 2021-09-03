/*
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
    ValueFactory payloadFactory,
    SharedEventTarget eventTarget,
    Category category)
    : type(std::move(type)),
      payloadFactory(std::move(payloadFactory)),
      eventTarget(std::move(eventTarget)),
      category(category) {}

} // namespace react
} // namespace facebook
