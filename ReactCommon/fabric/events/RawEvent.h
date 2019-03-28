/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <memory>

#include <folly/dynamic.h>
#include <react/events/primitives.h>

namespace facebook {
namespace react {

/*
 * Represents ready-to-dispatch event object.
 */
class RawEvent {
 public:
  RawEvent(
      std::string type,
      folly::dynamic payload,
      WeakEventTarget eventTarget);

  const std::string type;
  const folly::dynamic payload;
  const WeakEventTarget eventTarget;
};

} // namespace react
} // namespace facebook
