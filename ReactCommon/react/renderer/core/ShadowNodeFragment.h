/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/EventEmitter.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/State.h>

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
  Props::Shared const &props = propsPlaceholder();
  ShadowNode::SharedListOfShared const &children = childrenPlaceholder();
  State::Shared const &state = statePlaceholder();

  /*
   * Placeholders.
   * Use as default arguments as an indication that the field does not need to
   * be changed.
   */
  static Props::Shared const &propsPlaceholder();
  static ShadowNode::SharedListOfShared const &childrenPlaceholder();
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

    Props::Shared props;
    ShadowNode::SharedListOfShared children;
    State::Shared state;
  };
};

} // namespace react
} // namespace facebook
