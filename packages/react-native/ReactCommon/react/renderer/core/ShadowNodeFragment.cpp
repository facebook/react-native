/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNodeFragment.h"

namespace facebook::react {

#if defined(__clang__)
#define NO_DESTROY [[clang::no_destroy]]
#else
#define NO_DESTROY
#endif

const Props::Shared& ShadowNodeFragment::propsPlaceholder() {
  NO_DESTROY static Props::Shared instance;
  return instance;
}

const ShadowNode::SharedListOfShared&
ShadowNodeFragment::childrenPlaceholder() {
  NO_DESTROY static ShadowNode::SharedListOfShared instance;
  return instance;
}

const State::Shared& ShadowNodeFragment::statePlaceholder() {
  NO_DESTROY static State::Shared instance;
  return instance;
}

} // namespace facebook::react
