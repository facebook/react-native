/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNodeFragment.h"

namespace facebook {
namespace react {

Tag const ShadowNodeFragment::tagPlaceholder() {
  return 0;
}

SurfaceId const ShadowNodeFragment::surfaceIdPlaceholder() {
  return 0;
}

Props::Shared const &ShadowNodeFragment::propsPlaceholder() {
  static auto &instance = *new Props::Shared();
  return instance;
}

EventEmitter::Shared const &ShadowNodeFragment::eventEmitterPlaceholder() {
  static auto &instance = *new EventEmitter::Shared();
  return instance;
}

ShadowNode::SharedListOfShared const &
ShadowNodeFragment::childrenPlaceholder() {
  static auto &instance = *new ShadowNode::SharedListOfShared();
  return instance;
}

LocalData::Shared const &ShadowNodeFragment::localDataPlaceholder() {
  static auto &instance = *new LocalData::Shared();
  return instance;
}

State::Shared const &ShadowNodeFragment::statePlaceholder() {
  static auto &instance = *new State::Shared();
  return instance;
}

using Value = ShadowNodeFragment::Value;

Value::Value(ShadowNodeFragment const &fragment)
    : tag_(fragment.tag),
      surfaceId_(fragment.surfaceId),
      props_(fragment.props),
      eventEmitter_(fragment.eventEmitter),
      children_(fragment.children),
      localData_(fragment.localData),
      state_(fragment.state) {}

Value::operator ShadowNodeFragment() const {
  return ShadowNodeFragment{
      tag_, surfaceId_, props_, eventEmitter_, children_, localData_, state_};
}

} // namespace react
} // namespace facebook
