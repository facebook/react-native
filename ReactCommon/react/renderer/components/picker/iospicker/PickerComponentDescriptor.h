/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/iospicker/PickerShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

/*
 * Descriptor for <Picker> component.
 */
namespace facebook {
namespace react {

class PickerComponentDescriptor final
    : public ConcreteComponentDescriptor<PickerShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
};

} // namespace react
} // namespace facebook
