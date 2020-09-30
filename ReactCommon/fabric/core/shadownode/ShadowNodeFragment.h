/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/EventEmitter.h>
#include <react/core/LocalData.h>
#include <react/core/Props.h>
#include <react/core/ReactPrimitives.h>
#include <react/core/ShadowNode.h>
#include <react/core/State.h>

namespace facebook {
namespace react {

/*
 * An object which supposed to be used as a parameter specifying a shape
 * of created or cloned ShadowNode.
 * Note: Most of the fields are `const &` references (essentially just raw
 * pointers) which means that the Fragment does not copy/store them nor
 * retain ownership of them.
 * Use `ShadowNodeFragment::Value` (see below) to create an owning copy of the
 * fragment content to store or pass the data asynchronously.
 */
struct ShadowNodeFragment {
  Tag const tag = tagPlaceholder();
  SurfaceId const surfaceId = surfaceIdPlaceholder();
  Props::Shared const &props = propsPlaceholder();
  EventEmitter::Shared const &eventEmitter = eventEmitterPlaceholder();
  ShadowNode::SharedListOfShared const &children = childrenPlaceholder();
  LocalData::Shared const &localData = localDataPlaceholder();
  State::Shared const &state = statePlaceholder();

  /*
   * Placeholders.
   * Use as default arguments as an indication that the field does not need to
   * be changed.
   */
  static Tag const tagPlaceholder();
  static SurfaceId const surfaceIdPlaceholder();
  static Props::Shared const &propsPlaceholder();
  static EventEmitter::Shared const &eventEmitterPlaceholder();
  static ShadowNode::SharedListOfShared const &childrenPlaceholder();
  static LocalData::Shared const &localDataPlaceholder();
  static State::Shared const &statePlaceholder();

  /*
   * `ShadowNodeFragment` is not owning data-structure, it only stores raw
   * pointers to the data. `ShadowNodeFragment::Value` is a convenient owning
   * counterpart of that.
   */
  class Value final {
   public:
    /*
     * Creates an object with given `ShadowNodeFragment`.
     */
    Value(ShadowNodeFragment const &fragment);

    /*
     * Creates a `ShadowNodeFragment` from the object.
     */
    explicit operator ShadowNodeFragment() const;

   private:
    Tag const tag_;
    SurfaceId const surfaceId_;
    Props::Shared const props_;
    EventEmitter::Shared const eventEmitter_;
    ShadowNode::SharedListOfShared const children_;
    LocalData::Shared const localData_;
    State::Shared const state_;
  };
};

} // namespace react
} // namespace facebook
