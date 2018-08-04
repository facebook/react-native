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
    return ShadowNodeT::Handle();
  }

  ComponentName getComponentName() const override {
    return ShadowNodeT::Name();
  }

  SharedShadowNode createShadowNode(
    const Tag &tag,
    const Tag &rootTag,
    const SharedEventEmitter &eventEmitter,
    const SharedProps &props
  ) const override {
    assert(std::dynamic_pointer_cast<const ConcreteProps>(props));
    assert(std::dynamic_pointer_cast<const ConcreteEventEmitter>(eventEmitter));

    const auto &shadowNode = std::make_shared<ShadowNodeT>(
      ShadowNodeFragment {
        .tag = tag,
        .rootTag = rootTag,
        .props = props,
        .eventEmitter = eventEmitter,
        .children = ShadowNode::emptySharedShadowNodeSharedList()
      },
      getCloneFunction()
    );

    adopt(shadowNode);

    return shadowNode;
  }

  UnsharedShadowNode cloneShadowNode(
    const SharedShadowNode &sourceShadowNode,
    const SharedProps &props = nullptr,
    const SharedEventEmitter &eventEmitter = nullptr,
    const SharedShadowNodeSharedList &children = nullptr
  ) const override {
    assert(std::dynamic_pointer_cast<const ShadowNodeT>(sourceShadowNode));

    const auto &shadowNode = std::make_shared<ShadowNodeT>(
      std::static_pointer_cast<const ShadowNodeT>(sourceShadowNode),
      ShadowNodeFragment {
        .props = props,
        .eventEmitter = eventEmitter,
        .children = children
      }
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
    const EventTarget &eventTarget,
    const Tag &tag
  ) const override {
    return std::make_shared<ConcreteEventEmitter>(eventTarget, tag, eventDispatcher_);
  }

protected:

  virtual void adopt(UnsharedShadowNode shadowNode) const {
    // Default implementation does nothing.
    assert(shadowNode->getComponentHandle() == getComponentHandle());
  }

private:

  mutable SharedEventDispatcher eventDispatcher_ {nullptr};

  mutable ShadowNodeCloneFunction cloneFunction_;

  ShadowNodeCloneFunction getCloneFunction() const {
    if (!cloneFunction_) {
      cloneFunction_ = [this](const SharedShadowNode &shadowNode, const ShadowNodeFragment &fragment) {
        assert(std::dynamic_pointer_cast<const ShadowNodeT>(shadowNode));
        return this->cloneShadowNode(shadowNode, fragment.props, fragment.eventEmitter, fragment.children);
      };
    }

    return cloneFunction_;
  }
};

} // namespace react
} // namespace facebook
