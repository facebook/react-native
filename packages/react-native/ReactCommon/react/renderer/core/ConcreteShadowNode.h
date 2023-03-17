/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/ConcreteState.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/StateData.h>

namespace facebook {
namespace react {

/*
 * Base templace class for all `ShadowNode`s which connects exact `ShadowNode`
 * type with exact `Props` type.
 * `ConcreteShadowNode` is a default implementation of `ShadowNode` interface
 * with many handy features.
 */
template <
    ComponentName concreteComponentName,
    typename BaseShadowNodeT,
    typename PropsT,
    typename EventEmitterT = EventEmitter,
    typename StateDataT = StateData>
class ConcreteShadowNode : public BaseShadowNodeT {
  static_assert(
      std::is_base_of<ShadowNode, BaseShadowNodeT>::value,
      "BaseShadowNodeT must be a descendant of ShadowNode");
  static_assert(
      std::is_base_of<Props, PropsT>::value,
      "PropsT must be a descendant of Props");

 protected:
  using ShadowNode::props_;
  using ShadowNode::state_;

 public:
  using BaseShadowNodeT::BaseShadowNodeT;

  using ConcreteProps = PropsT;
  using SharedConcreteProps = std::shared_ptr<PropsT const>;
  using UnsharedConcreteProps = std::shared_ptr<PropsT>;
  using ConcreteEventEmitter = EventEmitterT;
  using SharedConcreteEventEmitter = std::shared_ptr<EventEmitterT const>;
  using SharedConcreteShadowNode = std::shared_ptr<ConcreteShadowNode const>;
  using ConcreteState = ConcreteState<StateDataT>;
  using ConcreteStateData = StateDataT;

  static ComponentName Name() {
    return ComponentName(concreteComponentName);
  }

  static ComponentHandle Handle() {
    return ComponentHandle(concreteComponentName);
  }

  /*
   * A set of traits associated with a particular class.
   * Reimplement in subclasses to declare class-specific traits.
   */
  static ShadowNodeTraits BaseTraits() {
    return BaseShadowNodeT::BaseTraits();
  }

  static UnsharedConcreteProps Props(
      const PropsParserContext &context,
      RawProps const &rawProps,
      Props::Shared const &baseProps = nullptr) {
    return std::make_shared<PropsT>(
        context,
        baseProps ? static_cast<PropsT const &>(*baseProps) : PropsT(),
        rawProps);
  }

  static SharedConcreteProps defaultSharedProps() {
    static const SharedConcreteProps defaultSharedProps =
        std::make_shared<const PropsT>();
    return defaultSharedProps;
  }

  static ConcreteStateData initialStateData(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamilyFragment const &familyFragment,
      ComponentDescriptor const &componentDescriptor) {
    return {};
  }

  /*
   * Returns a concrete props object associated with the node.
   * Thread-safe after the node is sealed.
   */
  ConcreteProps const &getConcreteProps() const {
    react_native_assert(
        BaseShadowNodeT::props_ && "Props must not be `nullptr`.");
    return static_cast<ConcreteProps const &>(*props_);
  }

  /*
   * Returns a concrete event emitter object associated with the node.
   * Thread-safe after the node is sealed.
   */
  ConcreteEventEmitter const &getConcreteEventEmitter() const {
    return static_cast<ConcreteEventEmitter const &>(
        *BaseShadowNodeT::getEventEmitter());
  }

  /*
   * Returns a concrete state data associated with the node.
   * Thread-safe after the node is sealed.
   */
  ConcreteStateData const &getStateData() const {
    react_native_assert(state_ && "State must not be `nullptr`.");
    return static_cast<ConcreteState const *>(state_.get())->getData();
  }

  /*
   * Creates and assigns a new state object containing given state data.
   * Can be called only before the node is sealed (usually during construction).
   */
  void setStateData(ConcreteStateData &&data) {
    Sealable::ensureUnsealed();
    state_ = std::make_shared<ConcreteState const>(
        std::make_shared<ConcreteStateData const>(std::move(data)), *state_);
  }
};

} // namespace react
} // namespace facebook
