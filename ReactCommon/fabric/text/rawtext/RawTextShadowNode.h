/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fabric/core/ConcreteShadowNode.h>
#include <fabric/core/ShadowNode.h>
#include <fabric/text/RawTextProps.h>

namespace facebook {
namespace react {

class RawTextShadowNode;

using SharedRawTextShadowNode = std::shared_ptr<const RawTextShadowNode>;

/*
 * `ShadowNode` for <RawText> component, represents a purely regular string
 * object in React. In a code fragment `<Text>Hello!</Text>`, "Hello!" part
 * is represented as `<RawText text="Hello!"/>`.
 * <RawText> component must not have any children.
 */
class RawTextShadowNode:
  public ConcreteShadowNode<RawTextProps> {

public:
  using ConcreteShadowNode::ConcreteShadowNode;

  ComponentName getComponentName() const override;
};

} // namespace react
} // namespace facebook
