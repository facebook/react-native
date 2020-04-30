/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

#include <react/core/ComponentDescriptor.h>
#include <react/core/EventDispatcher.h>
#include <react/core/Props.h>
#include <react/core/ShadowNode.h>
#include <react/core/ShadowNodeFragment.h>
#include <react/core/State.h>
#include <react/core/StateCoordinator.h>
#include <react/core/StateUpdate.h>

namespace facebook {
namespace react {

/*
 * Default template-based implementation of ComponentDescriptor.
 * Use your `ShadowNode` type as a template argument and override any methods
 * if necessary.
 */
template <typename ShadowNodeT>
class ConcreteComponentDescriptor : public ComponentDescriptor {
  static_assert(
      std::is_base_of<ShadowNode, ShadowNodeT>::value,
      "ShadowNodeT must be a descendant of ShadowNode");

  using SharedShadowNodeT = std::shared_ptr<const ShadowNodeT>;

 public:
  using ConcreteShadowNode = ShadowNodeT;
  using ConcreteProps = typename ShadowNodeT::ConcreteProps;
  using SharedConcreteProps = typename ShadowNodeT::SharedConcreteProps;
  using ConcreteEventEmitter = typename ShadowNodeT::ConcreteEventEmitter;
  using SharedConcreteEventEmitter =
      typename ShadowNodeT::SharedConcreteEventEmitter;
  using ConcreteState = typename ShadowNodeT::ConcreteState;
  using ConcreteStateData = typename ShadowNodeT::ConcreteState::Data;

  ConcreteComponentDescriptor(
      EventDispatcher::Weak const &eventDispatcher,
      ContextContainer::Shared const &contextContainer = {},
      ComponentDescriptor::Flavor const &flavor = {})
      : ComponentDescriptor(eventDispatcher, contextContainer, flavor) {
    rawPropsParser_.prepare<ConcreteProps>();
  }

  ComponentHandle getComponentHandle() const override {
    return ShadowNodeT::Handle();
  }

  ComponentName getComponentName() const override {
    return ShadowNodeT::Name();
  }

  ShadowNodeTraits getTraits() const override {
    return ShadowNodeT::BaseTraits();
  }

  SharedShadowNode createShadowNode(
      const ShadowNodeFragment &fragment) const override {
    assert(std::dynamic_pointer_cast<const ConcreteProps>(fragment.props));
    assert(std::dynamic_pointer_cast<const ConcreteEventEmitter>(
        fragment.eventEmitter));

    auto shadowNode =
        std::make_shared<ShadowNodeT>(fragment, *this, getTraits());

    adopt(shadowNode);

    return shadowNode;
  }

  UnsharedShadowNode cloneShadowNode(
      const ShadowNode &sourceShadowNode,
      const ShadowNodeFragment &fragment) const override {
    assert(
        dynamic_cast<ConcreteShadowNode const *>(&sourceShadowNode) &&
        "Provided `sourceShadowNode` has an incompatible type.");

    auto shadowNode = std::make_shared<ShadowNodeT>(sourceShadowNode, fragment);

    adopt(shadowNode);
    return shadowNode;
  }

  void appendChild(
      const SharedShadowNode &parentShadowNode,
      const SharedShadowNode &childShadowNode) const override {
    assert(
        dynamic_cast<ConcreteShadowNode const *>(parentShadowNode.get()) &&
        "Provided `parentShadowNode` has an incompatible type.");

    auto concreteParentShadowNode =
        std::static_pointer_cast<const ShadowNodeT>(parentShadowNode);
    auto concreteNonConstParentShadowNode =
        std::const_pointer_cast<ShadowNodeT>(concreteParentShadowNode);
    concreteNonConstParentShadowNode->appendChild(childShadowNode);
  }

  virtual SharedProps cloneProps(
      const SharedProps &props,
      const RawProps &rawProps) const override {
    assert(
        !props ||
        dynamic_cast<ConcreteProps const *>(props.get()) &&
            "Provided `props` has an incompatible type.");

    if (rawProps.isEmpty()) {
      return props ? props : ShadowNodeT::defaultSharedProps();
    }

    rawProps.parse(rawPropsParser_);

    return ShadowNodeT::Props(rawProps, props);
  };

  virtual SharedEventEmitter createEventEmitter(
      SharedEventTarget eventTarget,
      const Tag &tag) const override {
    return std::make_shared<ConcreteEventEmitter>(
        std::move(eventTarget), tag, eventDispatcher_);
  }

  virtual State::Shared createInitialState(
      ShadowNodeFragment const &fragment) const override {
    if (std::is_same<ConcreteStateData, StateData>::value) {
      // Default case: Returning `null` for nodes that don't use `State`.
      return nullptr;
    }

    return std::make_shared<ConcreteState>(
        ConcreteShadowNode::initialStateData(fragment, *this),
        std::make_shared<StateCoordinator>(eventDispatcher_));
  }

  virtual State::Shared createState(
      const State::Shared &previousState,
      const StateData::Shared &data) const override {
    if (std::is_same<ConcreteStateData, StateData>::value) {
      // Default case: Returning `null` for nodes that don't use `State`.
      return nullptr;
    }

    assert(previousState && "Provided `previousState` is nullptr.");
    assert(data && "Provided `data` is nullptr.");
    assert(
        dynamic_cast<ConcreteState const *>(previousState.get()) &&
        "Provided `previousState` has an incompatible type.");

    return std::make_shared<const ConcreteState>(
        std::move(*std::static_pointer_cast<ConcreteStateData>(data)),
        *std::static_pointer_cast<const ConcreteState>(previousState));
  }

 protected:
  virtual void adopt(UnsharedShadowNode shadowNode) const {
    // Default implementation does nothing.
    assert(shadowNode->getComponentHandle() == getComponentHandle());
  }
};

} // namespace react
} // namespace facebook
