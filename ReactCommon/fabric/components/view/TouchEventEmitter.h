/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <react/core/EventEmitter.h>
#include <react/core/LayoutMetrics.h>
#include <react/core/ReactPrimitives.h>

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
   * The time in seconds when the touch occurred or when it was last mutated.
   */
  Float timestamp;

  /*
   * The particular implementation of `Hasher` and (especially) `Comparator`
   * make sense only when `Touch` object is used as a *key* in indexed
   * collections. Because of that they are expressed as separate classes.
   */
  struct Hasher {
    size_t operator()(const Touch &touch) const {
      return std::hash<decltype(touch.identifier)>()(touch.identifier);
    }
  };

  struct Comparator {
    bool operator()(const Touch &lhs, const Touch &rhs) const {
      return lhs.identifier == rhs.identifier;
    }
  };
};

using Touches = std::unordered_set<Touch, Touch::Hasher, Touch::Comparator>;

/*
 * Defines the `touchstart`, `touchend`, `touchmove`, and `touchcancel` event
 * types.
 */
struct TouchEvent {
  /*
   * A list of Touches for every point of contact currently touching the
   * surface.
   */
  Touches touches;

  /*
   * A list of Touches for every point of contact which contributed to the
   * event.
   */
  Touches changedTouches;

  /*
   * A list of Touches for every point of contact that is touching the surface
   * and started on the element that is the target of the current event.
   */
  Touches targetTouches;
};

class TouchEventEmitter;
using SharedTouchEventEmitter = std::shared_ptr<const TouchEventEmitter>;

class TouchEventEmitter : public EventEmitter {
 public:
  using EventEmitter::EventEmitter;

  void onTouchStart(const TouchEvent &event) const;
  void onTouchMove(const TouchEvent &event) const;
  void onTouchEnd(const TouchEvent &event) const;
  void onTouchCancel(const TouchEvent &event) const;

 private:
  void dispatchTouchEvent(
      const std::string &type,
      const TouchEvent &event,
      const EventPriority &priority) const;
};

} // namespace react
} // namespace facebook
