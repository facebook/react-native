/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNodeFragment.h"

namespace facebook {
namespace react {

Tag ShadowNodeFragment::tagPlaceholder() {
  return 0;
}

Tag ShadowNodeFragment::surfaceIdPlaceholder() {
  return 0;
}

SharedProps &ShadowNodeFragment::propsPlaceholder() {
  static auto &instance = *new SharedProps();
  return instance;
}

SharedEventEmitter &ShadowNodeFragment::eventEmitterPlaceholder() {
  static auto &instance = *new SharedEventEmitter();
  return instance;
}

SharedShadowNodeSharedList &ShadowNodeFragment::childrenPlaceholder() {
  static auto &instance = *new SharedShadowNodeSharedList();
  return instance;
}

SharedLocalData &ShadowNodeFragment::localDataPlaceholder() {
  static auto &instance = *new SharedLocalData();
  return instance;
}

State::Shared &ShadowNodeFragment::statePlaceholder() {
  static auto &instance = *new State::Shared();
  return instance;
}

} // namespace react
} // namespace facebook
