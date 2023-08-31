/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNodeFragment.h"

namespace facebook::react {

const Props::Shared &ShadowNodeFragment::propsPlaceholder() {
  static auto &instance = *new Props::Shared();
  return instance;
}

const ShadowNode::SharedListOfShared &
ShadowNodeFragment::childrenPlaceholder() {
  static auto &instance = *new ShadowNode::SharedListOfShared();
  return instance;
}

const State::Shared &ShadowNodeFragment::statePlaceholder() {
  static auto &instance = *new State::Shared();
  return instance;
}

using Value = ShadowNodeFragment::Value;

Value::Value(const ShadowNodeFragment &fragment)
    : props(fragment.props),
      children(fragment.children),
      state(fragment.state) {}

Value::operator ShadowNodeFragment() const {
  return ShadowNodeFragment{props, children, state};
}

} // namespace facebook::react
