/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fabric/core/ShadowNode.h>
#include <fabric/core/Props.h>

namespace facebook {
namespace react {

/*
 * Default template-based implementation of ComponentDescriptor.
 * Use your `ShadowNode` type as a template argument and override any methods
 * if necessary.
 */
template <typename ShadowNodeT>
class ConcreteComponentDescriptor: public ComponentDescriptor {
  static_assert(std::is_base_of<ShadowNode, ShadowNodeT>::value, "ShadowNodeT must be a descendant of ShadowNode");

  using SharedShadowNodeT = std::shared_ptr<const ShadowNodeT>;
  using SharedConcreteProps = typename ShadowNodeT::SharedConcreteProps;

public:
  ComponentHandle getComponentHandle() const override {
    return typeid(ShadowNodeT).hash_code();
  }

  SharedShadowNode createShadowNode(
    const Tag &tag,
    const Tag &rootTag,
    const InstanceHandle &instanceHandle,
    const RawProps &rawProps
  ) const override {
    auto props = ShadowNodeT::Props(rawProps);
    return std::make_shared<ShadowNodeT>(tag, rootTag, instanceHandle, props);
  }

  SharedShadowNode cloneShadowNode(
    const SharedShadowNode &shadowNode,
    const SharedRawProps &rawProps = nullptr,
    const SharedShadowNodeSharedList &children = nullptr
  ) const override {
    const SharedConcreteProps props = rawProps ? ShadowNodeT::Props(*rawProps, shadowNode->getProps()) : nullptr;
    return std::make_shared<ShadowNodeT>(std::static_pointer_cast<const ShadowNodeT>(shadowNode), props, children);
  }

  void appendChild(
    const SharedShadowNode &parentShadowNode,
    const SharedShadowNode &childShadowNode
  ) const override {
    auto concreteParentShadowNode = std::static_pointer_cast<const ShadowNodeT>(parentShadowNode);
    auto concreteNonConstParentShadowNode = std::const_pointer_cast<ShadowNodeT>(concreteParentShadowNode);
    concreteNonConstParentShadowNode->appendChild(childShadowNode);
  }

};

} // namespace react
} // namespace facebook
