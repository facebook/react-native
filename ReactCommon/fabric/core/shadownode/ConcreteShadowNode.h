/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/ConcreteState.h>
#include <react/core/Props.h>
#include <react/core/ShadowNode.h>
#include <react/core/StateData.h>

namespace facebook {
namespace react {

/*
 * Base templace class for all `ShadowNode`s which connects exact `ShadowNode`
 * type with exact `Props` type.
 * `ConcreteShadowNode` is a default implementation of `ShadowNode` interface
 * with many handy features.
 */
template <
    const char *concreteComponentName,
    typename PropsT,
    typename EventEmitterT = EventEmitter,
    typename StateDataT = StateData>
class ConcreteShadowNode : public ShadowNode {
  static_assert(
      std::is_base_of<Props, PropsT>::value,
      "PropsT must be a descendant of Props");

 public:
  using ShadowNode::ShadowNode;

  using ConcreteProps = PropsT;
  using SharedConcreteProps = std::shared_ptr<const PropsT>;
  using ConcreteEventEmitter = EventEmitterT;
  using SharedConcreteEventEmitter = std::shared_ptr<const EventEmitterT>;
  using SharedConcreteShadowNode = std::shared_ptr<const ConcreteShadowNode>;
  using ConcreteState = ConcreteState<StateDataT>;
  using ConcreteStateData = StateDataT;

  static ComponentName Name() {
    return ComponentName(concreteComponentName);
  }

  static ComponentHandle Handle() {
    return ComponentHandle(concreteComponentName);
  }

  static SharedConcreteProps Props(
      const RawProps &rawProps,
      const SharedProps &baseProps = nullptr) {
    return std::make_shared<const PropsT>(
        baseProps ? *std::static_pointer_cast<const PropsT>(baseProps)
                  : PropsT(),
        rawProps);
  }

  static SharedConcreteProps defaultSharedProps() {
    static const SharedConcreteProps defaultSharedProps =
        std::make_shared<const PropsT>();
    return defaultSharedProps;
  }

  static ConcreteStateData initialStateData(
      ShadowNodeFragment const &fragment,
      ComponentDescriptor const &componentDescriptor) {
    return {};
  }

  ComponentName getComponentName() const override {
    return ComponentName(concreteComponentName);
  }

  ComponentHandle getComponentHandle() const override {
    return reinterpret_cast<ComponentHandle>(concreteComponentName);
  }

  const SharedConcreteProps getProps() const {
    assert(std::dynamic_pointer_cast<const PropsT>(props_));
    return std::static_pointer_cast<const PropsT>(props_);
  }

  /*
   * Returns a concrete state data associated with the node.
   * Thread-safe after the node is sealed.
   */
  ConcreteStateData const &getStateData() const {
    return std::static_pointer_cast<const ConcreteState>(state_)->getData();
  }

  /*
   * Creates and assigns a new state object containing given state data.
   * Can be called only before the node is sealed (usually during construction).
   */
  void setStateData(ConcreteStateData &&data) {
    ensureUnsealed();
    state_ = std::make_shared<ConcreteState const>(std::move(data), *state_);
  }

  /*
   * Returns subset of children that are inherited from `SpecificShadowNodeT`.
   */
  template <typename SpecificShadowNodeT>
  better::
      small_vector<SpecificShadowNodeT *, kShadowNodeChildrenSmallVectorSize>
      getChildrenSlice() const {
    better::
        small_vector<SpecificShadowNodeT *, kShadowNodeChildrenSmallVectorSize>
            children;
    for (const auto &childShadowNode : getChildren()) {
      auto specificChildShadowNode =
          dynamic_cast<const SpecificShadowNodeT *>(childShadowNode.get());
      if (specificChildShadowNode) {
        children.push_back(
            const_cast<SpecificShadowNodeT *>(specificChildShadowNode));
      }
    }
    return children;
  }
};

} // namespace react
} // namespace facebook
