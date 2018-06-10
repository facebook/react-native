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
  using ConcreteEventEmitter = typename ShadowNodeT::ConcreteEventEmitter;
  using SharedConcreteEventEmitter = typename ShadowNodeT::SharedConcreteEventEmitter;

public:
  ConcreteComponentDescriptor(SharedEventDispatcher eventDispatcher):
    eventDispatcher_(eventDispatcher) {}

  ComponentHandle getComponentHandle() const override {
    return typeid(ShadowNodeT).hash_code();
  }

  ComponentName getComponentName() const override {
    // Even if this looks suboptimal, it is the only way to call
    // a virtual non-static method of `ShadowNodeT`.
    // Because it is not a hot path (it is executed once per an app run),
    // it's fine.
    return std::make_shared<ShadowNodeT>(
      0,
      0,
      std::make_shared<const ConcreteProps>(),
      nullptr,
      ShadowNode::emptySharedShadowNodeSharedList(),
      nullptr
    )->ShadowNodeT::getComponentName();
  }

  SharedShadowNode createShadowNode(
    const Tag &tag,
    const Tag &rootTag,
    const SharedEventEmitter &eventEmitter,
    const SharedProps &props
  ) const override {
    assert(std::dynamic_pointer_cast<const ConcreteProps>(props));
    assert(std::dynamic_pointer_cast<const ConcreteEventEmitter>(eventEmitter));

    auto &&shadowNode = std::make_shared<ShadowNodeT>(
      tag,
      rootTag,
      std::static_pointer_cast<const ConcreteProps>(props),
      std::static_pointer_cast<const ConcreteEventEmitter>(eventEmitter),
      ShadowNode::emptySharedShadowNodeSharedList(),
      getCloneFunction()
    );

    adopt(shadowNode);
    return shadowNode;
  }

  SharedShadowNode cloneShadowNode(
    const SharedShadowNode &sourceShadowNode,
    const SharedProps &props = nullptr,
    const SharedEventEmitter &eventEmitter = nullptr,
    const SharedShadowNodeSharedList &children = nullptr
  ) const override {
    assert(std::dynamic_pointer_cast<const ShadowNodeT>(sourceShadowNode));

    auto &&shadowNode = std::make_shared<ShadowNodeT>(
      std::static_pointer_cast<const ShadowNodeT>(sourceShadowNode),
      std::static_pointer_cast<const ConcreteProps>(props),
      std::static_pointer_cast<const ConcreteEventEmitter>(eventEmitter),
      children
    );

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

  virtual SharedEventEmitter createEventEmitter(
    const InstanceHandle &instanceHandle,
    const Tag &tag
  ) const override {
    return std::make_shared<ConcreteEventEmitter>(instanceHandle, tag, eventDispatcher_);
  }

protected:

  virtual void adopt(UnsharedShadowNode shadowNode) const {
    // Default implementation does nothing.
  }

private:

  mutable SharedEventDispatcher eventDispatcher_ {nullptr};

  mutable ShadowNodeCloneFunction cloneFunction_;

  ShadowNodeCloneFunction getCloneFunction() const {
    if (!cloneFunction_) {
      cloneFunction_ = [this](const SharedShadowNode &shadowNode, const SharedProps &props, const SharedEventEmitter &eventEmitter, const SharedShadowNodeSharedList &children) {
        assert(std::dynamic_pointer_cast<const ShadowNodeT>(shadowNode));
        return this->cloneShadowNode(shadowNode, props, eventEmitter, children);
      };
    }

    return cloneFunction_;
  }
};

} // namespace react
} // namespace facebook
