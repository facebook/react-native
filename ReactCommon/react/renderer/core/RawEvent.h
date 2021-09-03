/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

#include <react/renderer/core/EventTarget.h>
#include <react/renderer/core/ValueFactory.h>

namespace facebook {
namespace react {

/*
 * Represents ready-to-dispatch event object.
 */
struct RawEvent {
  /*
   * Defines category of a native platform event. This is used to deduce types
   * of events for Concurrent Mode.
   */
  enum class Category {
    /*
     * Start of a continuous event. To be used with touchStart.
     */
    ContinuousStart,

    /*
     * End of a continuous event. To be used with touchEnd.
     */
    ContinuousEnd,

    /*
     * Priority for this event will be determined from other events in the
     * queue. If it is triggered by continuous event, its priority will be
     * default. If it is not triggered by continuous event, its priority will be
     * discrete.
     */
    Unspecified,

    /*
     * Forces discrete type for the event. Regardless if continuous event is
     * ongoing.
     */
    Discrete,

    /*
     * Forces continuous type for the event. Regardless if continuous event
     * isn't ongoing.
     */
    Continuous
  };

  RawEvent(
      std::string type,
      ValueFactory payloadFactory,
      SharedEventTarget eventTarget,
      Category category = Category::Unspecified);

  std::string type;
  ValueFactory payloadFactory;
  SharedEventTarget eventTarget;
  Category category;
};

} // namespace react
} // namespace facebook
