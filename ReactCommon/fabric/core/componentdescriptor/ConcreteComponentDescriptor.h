/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <functional>

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
    UnsharedShadowNode shadowNode = std::make_shared<ShadowNodeT>(
      tag,
      rootTag,
      instanceHandle,
      std::static_pointer_cast<const ConcreteProps>(props),
      ShadowNode::emptySharedShadowNodeSharedList(),
      getCloneFunction()
    );
    adopt(shadowNode);
    return shadowNode;
  }

  SharedShadowNode cloneShadowNode(
    const SharedShadowNode &sourceShadowNode,
    const SharedProps &props = nullptr,
    const SharedShadowNodeSharedList &children = nullptr
  ) const override {
    assert(std::dynamic_pointer_cast<const ShadowNodeT>(sourceShadowNode));
    UnsharedShadowNode shadowNode = std::make_shared<ShadowNodeT>(std::static_pointer_cast<const ShadowNodeT>(sourceShadowNode), std::static_pointer_cast<const ConcreteProps>(props), children);
    adopt(shadowNode);
    return shadowNode;
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

protected:

  virtual void adopt(UnsharedShadowNode shadowNode) const {
    // Default implementation does nothing.
  }

private:

  mutable ShadowNodeCloneFunction cloneFunction_;

  ShadowNodeCloneFunction getCloneFunction() const {
    if (!cloneFunction_) {
      cloneFunction_ = [this](const SharedShadowNode &shadowNode, const SharedProps &props, const SharedShadowNodeSharedList &children) {
        assert(std::dynamic_pointer_cast<const ShadowNodeT>(shadowNode));
        return this->cloneShadowNode(shadowNode, props, children);
      };
    }

    return cloneFunction_;
  }
};

} // namespace react
} // namespace facebook
