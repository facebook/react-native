/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/core/ConcreteComponentDescriptor.h>
#include <fabric/text/RawTextShadowNode.h>

namespace facebook {
namespace react {

/*
 * Descriptor for <RawText> component.
 */
class RawTextComponentDescriptor: public ConcreteComponentDescriptor<RawTextShadowNode> {
public:
  ComponentName getComponentName() const override {
    return "RawText";
  }
};

} // namespace react
} // namespace facebook
