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
#include <fabric/core/ShadowNodeFragment.h>
#include <fabric/events/EventDispatcher.h>

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
    const ShadowNodeFragment &fragment
  ) const override {
    assert(std::dynamic_pointer_cast<const ConcreteProps>(fragment.props));
    assert(std::dynamic_pointer_cast<const ConcreteEventEmitter>(fragment.eventEmitter));

    auto shadowNode = std::make_shared<ShadowNodeT>(
      fragment,
      getCloneFunction()
    );

    adopt(shadowNode);

    return shadowNode;
  }

  UnsharedShadowNode cloneShadowNode(
    const ShadowNode &sourceShadowNode,
    const ShadowNodeFragment &fragment
  ) const override {
    auto shadowNode = std::make_shared<ShadowNodeT>(
      sourceShadowNode,
      fragment
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
      cloneFunction_ = [this](const ShadowNode &shadowNode, const ShadowNodeFragment &fragment) {
        return this->cloneShadowNode(shadowNode, fragment);
      };
    }

    return cloneFunction_;
  }
};

} // namespace react
} // namespace facebook
