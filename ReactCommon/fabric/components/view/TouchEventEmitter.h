/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/view/TouchEvent.h>
#include <react/core/EventEmitter.h>
#include <react/core/LayoutMetrics.h>
#include <react/core/ReactPrimitives.h>
#include <react/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class TouchEventEmitter;

using SharedTouchEventEmitter = std::shared_ptr<TouchEventEmitter const>;

class TouchEventEmitter : public EventEmitter {
 public:
  using EventEmitter::EventEmitter;

  void onTouchStart(TouchEvent const &event) const;
  void onTouchMove(TouchEvent const &event) const;
  void onTouchEnd(TouchEvent const &event) const;
  void onTouchCancel(TouchEvent const &event) const;

 private:
  void dispatchTouchEvent(
      std::string const &type,
      TouchEvent const &event,
      EventPriority const &priority) const;
};

} // namespace react
} // namespace facebook
