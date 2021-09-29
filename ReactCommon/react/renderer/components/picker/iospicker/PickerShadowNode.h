/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/iospicker/PickerEventEmitter.h>
#include <react/renderer/components/iospicker/PickerProps.h>
#include <react/renderer/components/iospicker/PickerState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

extern const char PickerComponentName[];

/*
 * `ShadowNode` for <Picker> component.
 */
class PickerShadowNode final : public ConcreteViewShadowNode<
                                   PickerComponentName,
                                   PickerProps,
                                   PickerEventEmitter,
                                   PickerState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;
};

} // namespace react
} // namespace facebook
