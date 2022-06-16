/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/graphics/Geometry.h>

namespace facebook {
namespace react {

struct PointerEvent {
  /*
   * A unique identifier for the pointer causing the event.
   */
  int pointerId;
  /*
   * The normalized pressure of the pointer input in the range 0 to 1, where 0
   * and 1 represent the minimum and maximum pressure the hardware is capable of
   * detecting, respectively.
   */
  Float pressure;
  /*
   * Indicates the device type that caused the event (mouse, pen, touch, etc.)
   */
  std::string pointerType;
  /*
   * Point within the application's viewport at which the event occurred (as
   * opposed to the coordinate within the page).
   */
  Point clientPoint;
};

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(PointerEvent const &pointerEvent);
std::vector<DebugStringConvertibleObject> getDebugProps(
    PointerEvent const &pointerEvent,
    DebugStringConvertibleOptions options);

#endif

} // namespace react
} // namespace facebook
