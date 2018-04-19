/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fabric/core/ComponentDescriptor.h>
#include <fabric/core/Props.h>
#include <fabric/core/ShadowNode.h>

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
  using ConcreteProps = typename ShadowNodeT::ConcreteProps;
  using SharedConcreteProps = typename ShadowNodeT::SharedConcreteProps;

public:
  ComponentHandle getComponentHandle() const override {
    return typeid(ShadowNodeT).hash_code();
  }

  SharedShadowNode createShadowNode(
    const Tag &tag,
    const Tag &rootTag,
    const InstanceHandle &instanceHandle,
    const SharedProps &props
  ) const override {
    return std::make_shared<ShadowNodeT>(tag, rootTag, instanceHandle, std::static_pointer_cast<const ConcreteProps>(props));
  }

  SharedShadowNode cloneShadowNode(
    const SharedShadowNode &shadowNode,
    const SharedProps &props = nullptr,
    const SharedShadowNodeSharedList &children = nullptr
  ) const override {
    return std::make_shared<ShadowNodeT>(std::static_pointer_cast<const ShadowNodeT>(shadowNode), std::static_pointer_cast<const ConcreteProps>(props), children);
  }

  void appendChild(
    const SharedShadowNode &parentShadowNode,
    const SharedShadowNode &childShadowNode
  ) const override {
    auto concreteParentShadowNode = std::static_pointer_cast<const ShadowNodeT>(parentShadowNode);
    auto concreteNonConstParentShadowNode = std::const_pointer_cast<ShadowNodeT>(concreteParentShadowNode);
    concreteNonConstParentShadowNode->appendChild(childShadowNode);
  }

  virtual SharedProps cloneProps(
    const SharedProps &props,
    const RawProps &rawProps
  ) const override {
    return ShadowNodeT::Props(rawProps, props);
  };

};

} // namespace react
} // namespace facebook
