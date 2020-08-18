/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

#include <react/core/EventTarget.h>
#include <react/core/ValueFactory.h>

namespace facebook {
namespace react {

/*
 * Represents ready-to-dispatch event object.
 */
class RawEvent {
 public:
  RawEvent(
      std::string type,
      ValueFactory payloadFactory,
      SharedEventTarget eventTarget);

  const std::string type;
  const ValueFactory payloadFactory;
  const SharedEventTarget eventTarget;
};

} // namespace react
} // namespace facebook
