/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/core/Props.h>
#include <fabric/core/ShadowNode.h>

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
  typename EventEmitterT = EventEmitter
>
class ConcreteShadowNode: public ShadowNode {
  static_assert(std::is_base_of<Props, PropsT>::value, "PropsT must be a descendant of Props");

public:
  using ShadowNode::ShadowNode;

  using ConcreteProps = PropsT;
  using SharedConcreteProps = std::shared_ptr<const PropsT>;
  using ConcreteEventEmitter = EventEmitterT;
  using SharedConcreteEventEmitter = std::shared_ptr<const EventEmitterT>;
  using SharedConcreteShadowNode = std::shared_ptr<const ConcreteShadowNode>;

  static ComponentName Name() {
    return ComponentName(concreteComponentName);
  }

  static ComponentHandle Handle() {
    return ComponentHandle(concreteComponentName);
  }

  static SharedConcreteProps Props(const RawProps &rawProps, const SharedProps &baseProps = nullptr) {
    return std::make_shared<const PropsT>(baseProps ? *std::static_pointer_cast<const PropsT>(baseProps) : PropsT(), rawProps);
  }

  static SharedConcreteProps defaultSharedProps() {
    static const SharedConcreteProps defaultSharedProps = std::make_shared<const PropsT>();
    return defaultSharedProps;
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
   * Returns subset of children that are inherited from `SpecificShadowNodeT`.
   */
  template<typename SpecificShadowNodeT>
  std::vector<SpecificShadowNodeT *> getChildrenSlice() const {
    std::vector<SpecificShadowNodeT *> children;
    for (const auto &childShadowNode : getChildren()) {
      auto specificChildShadowNode = dynamic_cast<const SpecificShadowNodeT *>(childShadowNode.get());
      if (specificChildShadowNode) {
        children.push_back(const_cast<SpecificShadowNodeT *>(specificChildShadowNode));
      }
    }
    return children;
  }
};

} // namespace react
} // namespace facebook
