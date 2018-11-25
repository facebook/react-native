// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <folly/Optional.h>
#include <folly/dynamic.h>
#include <jsi/jsi.h>

#include <react/core/ShadowNode.h>
#include <react/uimanager/ComponentDescriptorRegistry.h>
#include <react/uimanager/ShadowTreeRegistry.h>
#include <react/uimanager/UIManagerDelegate.h>

namespace facebook {
namespace react {

class UIManager {
 public:
  void setShadowTreeRegistry(ShadowTreeRegistry *shadowTreeRegistry);

  void setComponentDescriptorRegistry(
      const SharedComponentDescriptorRegistry &componentDescriptorRegistry);

  /*
   * Sets and gets the UIManager's delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setDelegate(UIManagerDelegate *delegate);
  UIManagerDelegate *getDelegate();

 private:
  friend class UIManagerBinding;

  SharedShadowNode createNode(
      Tag tag,
      const std::string &name,
      SurfaceId surfaceId,
      const RawProps &props,
      SharedEventTarget eventTarget) const;

  SharedShadowNode cloneNode(
      const SharedShadowNode &shadowNode,
      const SharedShadowNodeSharedList &children = nullptr,
      const folly::Optional<RawProps> &rawProps = {}) const;

  void appendChild(
      const SharedShadowNode &parentShadowNode,
      const SharedShadowNode &childShadowNode) const;

  void completeSurface(
      SurfaceId surfaceId,
      const SharedShadowNodeUnsharedList &rootChildren) const;

  /*
   * Returns layout metrics of given `shadowNode` relative to
   * `ancestorShadowNode` (relative to the root node in case if provided
   * `ancestorShadowNode` is nullptr).
   */
  LayoutMetrics getRelativeLayoutMetrics(
      const ShadowNode &shadowNode,
      const ShadowNode *ancestorShadowNode) const;

  ShadowTreeRegistry *shadowTreeRegistry_;
  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  UIManagerDelegate *delegate_;
};

} // namespace react
} // namespace facebook
