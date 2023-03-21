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
#include <react/renderer/components/view/ViewPropsInterpolation.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/CoreFeatures.h>
#include <react/renderer/core/EventDispatcher.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/core/State.h>
#include <react/renderer/graphics/Float.h>

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
    auto shadowNode =
        std::make_shared<ShadowNodeT>(fragment, family, getTraits());

    adopt(shadowNode);

    return shadowNode;
  }

  ShadowNode::Unshared cloneShadowNode(
      const ShadowNode &sourceShadowNode,
      const ShadowNodeFragment &fragment) const override {
    auto shadowNode = std::make_shared<ShadowNodeT>(sourceShadowNode, fragment);

    adopt(shadowNode);
    return shadowNode;
  }

  void appendChild(
      const ShadowNode::Shared &parentShadowNode,
      const ShadowNode::Shared &childShadowNode) const override {
    auto concreteParentShadowNode =
        std::static_pointer_cast<const ShadowNodeT>(parentShadowNode);
    auto concreteNonConstParentShadowNode =
        std::const_pointer_cast<ShadowNodeT>(concreteParentShadowNode);
    concreteNonConstParentShadowNode->appendChild(childShadowNode);
  }

  virtual Props::Shared cloneProps(
      const PropsParserContext &context,
      const Props::Shared &props,
      const RawProps &rawProps) const override {
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
                                     const char *propName,
                                     RawValue const &fn) {
        shadowNodeProps.get()->setProp(context, hash, propName, fn);
      });
    }

    return shadowNodeProps;
  };

  Props::Shared interpolateProps(
      const PropsParserContext &context,
      Float animationProgress,
      const Props::Shared &props,
      const Props::Shared &newProps) const override {
#ifdef ANDROID
    // On Android only, the merged props should have the same RawProps as the
    // final props struct
    Props::Shared interpolatedPropsShared =
        (newProps != nullptr ? cloneProps(context, newProps, newProps->rawProps)
                             : cloneProps(context, newProps, {}));
#else
    Props::Shared interpolatedPropsShared = cloneProps(context, newProps, {});
#endif

    if (ConcreteShadowNode::BaseTraits().check(
            ShadowNodeTraits::Trait::ViewKind)) {
      interpolateViewProps(
          animationProgress, props, newProps, interpolatedPropsShared);
    }

    return interpolatedPropsShared;
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
                fragment, ShadowNodeFamilyFragment::build(*family), *this)),
        family);
  }

  virtual State::Shared createState(
      ShadowNodeFamily const &family,
      StateData::Shared const &data) const override {
    if (std::is_same<ConcreteStateData, StateData>::value) {
      // Default case: Returning `null` for nodes that don't use `State`.
      return nullptr;
    }

    react_native_assert(data && "Provided `data` is nullptr.");

    return std::make_shared<ConcreteState const>(
        std::static_pointer_cast<ConcreteStateData const>(data),
        *family.getMostRecentState());
  }

  ShadowNodeFamily::Shared createFamily(
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
  /*
   * Called immediatelly after `ShadowNode` is created or cloned.
   *
   * Override this method to pass information from custom `ComponentDescriptor`
   * to new instance of `ShadowNode`.
   *
   * Example usages:
   *   - Inject image manager to `ImageShadowNode` in
   * `ImageComponentDescriptor`.
   *   - Set `ShadowNode`'s size from state in
   * `ModalHostViewComponentDescriptor`.
   */
  virtual void adopt(ShadowNode::Unshared const &shadowNode) const {
    // Default implementation does nothing.
    react_native_assert(
        shadowNode->getComponentHandle() == getComponentHandle());
  }
};

} // namespace react
} // namespace facebook
