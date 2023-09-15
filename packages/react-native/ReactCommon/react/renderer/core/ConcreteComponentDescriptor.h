/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/EventDispatcher.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/core/State.h>
#include <react/renderer/graphics/Float.h>
#include <react/utils/CoreFeatures.h>

namespace facebook::react {

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

  ConcreteComponentDescriptor(const ComponentDescriptorParameters& parameters)
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
      const ShadowNodeFragment& fragment,
      const ShadowNodeFamily::Shared& family) const override {
    auto shadowNode =
        std::make_shared<ShadowNodeT>(fragment, family, getTraits());

    adopt(*shadowNode);

    return shadowNode;
  }

  ShadowNode::Unshared cloneShadowNode(
      const ShadowNode& sourceShadowNode,
      const ShadowNodeFragment& fragment) const override {
    auto shadowNode = std::make_shared<ShadowNodeT>(sourceShadowNode, fragment);

    adopt(*shadowNode);
    return shadowNode;
  }

  void appendChild(
      const ShadowNode::Shared& parentShadowNode,
      const ShadowNode::Shared& childShadowNode) const override {
    auto& concreteParentShadowNode =
        static_cast<const ShadowNodeT&>(*parentShadowNode);
    const_cast<ShadowNodeT&>(concreteParentShadowNode)
        .appendChild(childShadowNode);
  }

  virtual Props::Shared cloneProps(
      const PropsParserContext& context,
      const Props::Shared& props,
      const RawProps& rawProps) const override {
    // Optimization:
    // Quite often nodes are constructed with default/empty props: the base
    // `props` object is `null` (there no base because it's not cloning) and the
    // `rawProps` is empty. In this case, we can return the default props object
    // of a concrete type entirely bypassing parsing.
    if (!props && rawProps.isEmpty()) {
      return ShadowNodeT::defaultSharedProps();
    }

    rawProps.parse(rawPropsParser_, context);

    // Call old-style constructor
    auto shadowNodeProps = ShadowNodeT::Props(context, rawProps, props);

    // Use the new-style iterator
    // Note that we just check if `Props` has this flag set, no matter
    // the type of ShadowNode; it acts as the single global flag.
    if (CoreFeatures::enablePropIteratorSetter) {
      rawProps.iterateOverValues([&](RawPropsPropNameHash hash,
                                     const char* propName,
                                     const RawValue& fn) {
        shadowNodeProps.get()->setProp(context, hash, propName, fn);
      });
    }

    return shadowNodeProps;
  };

  virtual State::Shared createInitialState(
      const Props::Shared& props,
      const ShadowNodeFamily::Shared& family) const override {
    if (std::is_same<ConcreteStateData, StateData>::value) {
      // Default case: Returning `null` for nodes that don't use `State`.
      return nullptr;
    }

    return std::make_shared<ConcreteState>(
        std::make_shared<const ConcreteStateData>(
            ConcreteShadowNode::initialStateData(props, family, *this)),
        family);
  }

  virtual State::Shared createState(
      const ShadowNodeFamily& family,
      const StateData::Shared& data) const override {
    if (std::is_same<ConcreteStateData, StateData>::value) {
      // Default case: Returning `null` for nodes that don't use `State`.
      return nullptr;
    }

    react_native_assert(data && "Provided `data` is nullptr.");

    return std::make_shared<const ConcreteState>(
        std::static_pointer_cast<const ConcreteStateData>(data),
        *family.getMostRecentState());
  }

  ShadowNodeFamily::Shared createFamily(
      const ShadowNodeFamilyFragment& fragment) const override {
    return std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            fragment.tag, fragment.surfaceId, fragment.instanceHandle},
        eventDispatcher_,
        *this);
  }

  SharedEventEmitter createEventEmitter(
      const InstanceHandle::Shared& instanceHandle) const override {
    return std::make_shared<const ConcreteEventEmitter>(
        std::make_shared<EventTarget>(instanceHandle), eventDispatcher_);
  }

 protected:
  virtual void adopt(ShadowNode& shadowNode) const override {
    // Default implementation does nothing.
    react_native_assert(
        shadowNode.getComponentHandle() == getComponentHandle());
  }
};

} // namespace facebook::react
