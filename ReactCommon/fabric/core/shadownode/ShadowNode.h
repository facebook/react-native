/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <vector>

#include <fabric/core/Props.h>
#include <fabric/core/Sealable.h>
#include <fabric/core/ReactPrimitives.h>
#include <fabric/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class ShadowNode;

using SharedShadowNode = std::shared_ptr<const ShadowNode>;
using SharedShadowNodeList = std::vector<std::shared_ptr<const ShadowNode>>;
using SharedShadowNodeSharedList = std::shared_ptr<const SharedShadowNodeList>;
using SharedShadowNodeUnsharedList = std::shared_ptr<SharedShadowNodeList>;
using WeakShadowNode = std::weak_ptr<const ShadowNode>;

class ShadowNode:
  public virtual Sealable,
  public virtual DebugStringConvertible {
public:
  static SharedShadowNodeSharedList emptySharedShadowNodeSharedList();

#pragma mark - Constructors

  ShadowNode(
    Tag tag,
    Tag rootTag,
    InstanceHandle instanceHandle,
    SharedProps props = SharedProps(),
    SharedShadowNodeSharedList children = SharedShadowNodeSharedList()
  );

  ShadowNode(
    SharedShadowNode shadowNode,
    SharedProps props = nullptr,
    SharedShadowNodeSharedList children = nullptr
  );

#pragma mark - Getters

  virtual ComponentHandle getComponentHandle() const = 0;
  virtual ComponentName getComponentName() const = 0;

  SharedShadowNodeSharedList getChildren() const;
  SharedProps getProps() const;
  Tag getTag() const;
  Tag getRootTag() const;
  InstanceHandle getInstanceHandle() const;
  SharedShadowNode getSourceNode() const;
  void sealRecursive() const;

#pragma mark - Mutating Methods

  void appendChild(const SharedShadowNode &child);
  void replaceChild(const SharedShadowNode &oldChild, const SharedShadowNode &newChild);
  void clearSourceNode();

#pragma mark - DebugStringConvertible

  std::string getDebugName() const override;
  std::string getDebugValue() const override;
  SharedDebugStringConvertibleList getDebugChildren() const override;
  SharedDebugStringConvertibleList getDebugProps() const override;

protected:
  Tag tag_;
  Tag rootTag_;
  InstanceHandle instanceHandle_;
  SharedProps props_;
  SharedShadowNodeSharedList children_;
  WeakShadowNode sourceNode_;
};

} // namespace react
} // namespace facebook
