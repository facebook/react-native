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

  ConcreteComponentDescriptor(ComponentDescriptorParameters const &parameters)
      : ComponentDescriptor(parameters) {
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

  ShadowNode::Shared createShadowNode(
      const ShadowNodeFragment &fragment,
      ShadowNodeFamily::Shared const &family) const override {
    assert(std::dynamic_pointer_cast<const ConcreteProps>(fragment.props));

    auto shadowNode =
        std::make_shared<ShadowNodeT>(fragment, family, getTraits());

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
      const ShadowNode::Shared &parentShadowNode,
      const ShadowNode::Shared &childShadowNode) const override {
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

  virtual State::Shared createInitialState(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamily::Shared const &family) const override {
    if (std::is_same<ConcreteStateData, StateData>::value) {
      // Default case: Returning `null` for nodes that don't use `State`.
      return nullptr;
    }

    return std::make_shared<ConcreteState>(
        std::make_shared<ConcreteStateData const>(
            ConcreteShadowNode::initialStateData(
                fragment, family->getSurfaceId(), *this)),
        family);
  }

  virtual State::Shared createState(
      ShadowNodeFamily const &family,
      StateData::Shared const &data) const override {
    if (std::is_same<ConcreteStateData, StateData>::value) {
      // Default case: Returning `null` for nodes that don't use `State`.
      return nullptr;
    }

    assert(data && "Provided `data` is nullptr.");

    return std::make_shared<ConcreteState const>(
        std::static_pointer_cast<ConcreteStateData const>(data),
        *family.getMostRecentState());
  }

  virtual ShadowNodeFamily::Shared createFamily(
      ShadowNodeFamilyFragment const &fragment,
      SharedEventTarget eventTarget) const override {
    auto eventEmitter = std::make_shared<ConcreteEventEmitter const>(
        std::move(eventTarget), fragment.tag, eventDispatcher_);
    return std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            fragment.tag, fragment.surfaceId, eventEmitter},
        eventDispatcher_,
        *this);
  }

 protected:
  virtual void adopt(UnsharedShadowNode shadowNode) const {
    // Default implementation does nothing.
    assert(shadowNode->getComponentHandle() == getComponentHandle());
  }
};

} // namespace react
} // namespace facebook
