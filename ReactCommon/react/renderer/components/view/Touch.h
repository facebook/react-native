/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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

/*
 * Describes an individual touch point for a touch event.
 * See https://www.w3.org/TR/touch-events/ for more details.
 */
struct Touch {
  /*
   * The coordinate of point relative to the root component in points.
   */
  Point pagePoint;

  /*
   * The coordinate of point relative to the target component in points.
   */
  Point offsetPoint;

  /*
   * The coordinate of point relative to the screen component in points.
   */
  Point screenPoint;

  /*
   * An identification number for each touch point.
   */
  int identifier;

  /*
   * The tag of a component on which the touch point started when it was first
   * placed on the surface, even if the touch point has since moved outside the
   * interactive area of that element.
   */
  Tag target;

  /*
   * The force of the touch.
   */
  Float force;

  /*
   * The time in seconds (with fractional milliseconds) when the touch occurred
   * or when it was last mutated.
   *
   * Whenever possible this should be computed as:
   * 1. Pick MONO_CLOCK_NOW, a monotonic system clock. Generally, something like
   * `systemUptimeMillis`.
   * 2. BASIS_TIME = unix timestamp from unix epoch (ms) - MONO_CLOCK_NOW
   * 3. Then assign timestamp = BASIS_TIME + MONO_CLOCK_NOW
   *
   * The effect should be UNIX timestamp from UNIX epoch, but as a monotonic
   * clock (if you just assign to current system time, it can move backwards due
   * to clock adjustements, leap seconds, etc etc). So the vast majority of the
   * time it will look identical to current UNIX time, but there are some
   * edge-cases where it can drift.
   *
   * If you are not able to use the scheme above for some reason, prefer to use
   * a monotonic clock. This timestamp MUST be monotonic. Do NOT just pass along
   * system time.
   *
   * The goal is to allow touch latency to be computed in JS. JS does not have
   * access to something like `systemUptimeMillis`, it generally can only access
   * the current system time. This *does* mean that the touch latency could be
   * computed incorrectly in cases of clock drift, so you should only use this
   * as telemetry to get a decent, but not totally perfect, idea of performance.
   * Do not use this latency information for anything "mission critical". You
   * can assume it's probably reasonably accurate 99% of the time.
   *
   * Note that we attempt to adhere to the spec of timestamp here:
   * https://dom.spec.whatwg.org/#dom-event-timestamp
   * Notably, since `global` is not a Window object in React Native, we have
   * some flexibility in how we define the time origin:
   * https://w3c.github.io/hr-time/#dfn-time-origin
   */
  Float timestamp;

  /*
   * The particular implementation of `Hasher` and (especially) `Comparator`
   * make sense only when `Touch` object is used as a *key* in indexed
   * collections. Because of that they are expressed as separate classes.
   */
  struct Hasher {
    size_t operator()(Touch const &touch) const {
      return std::hash<decltype(touch.identifier)>()(touch.identifier);
    }
  };

  struct Comparator {
    bool operator()(Touch const &lhs, Touch const &rhs) const {
      return lhs.identifier == rhs.identifier;
    }
  };
};

using Touches = std::unordered_set<Touch, Touch::Hasher, Touch::Comparator>;

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(Touch const &touch);
std::vector<DebugStringConvertibleObject> getDebugProps(
    Touch const &object,
    DebugStringConvertibleOptions options);

#endif

} // namespace react
} // namespace facebook
