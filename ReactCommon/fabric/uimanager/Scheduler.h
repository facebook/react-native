// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>

#include <fabric/core/ComponentDescriptor.h>
#include <fabric/core/LayoutConstraints.h>
#include <fabric/uimanager/SchedulerDelegate.h>
#include <fabric/uimanager/UIManagerDelegate.h>
#include <fabric/view/ViewShadowNode.h>

namespace facebook {
namespace react {

/*
 * We expect having a dedicated subclass for root shadow node.
 */
using SharedRootShadowNode = SharedViewShadowNode;
using RootShadowNode = ViewShadowNode;

class FabricUIManager;

/*
 * Scheduler coordinates Shadow Tree updates and event flows.
 */
class Scheduler:
  public UIManagerDelegate {

public:
  Scheduler();
  virtual ~Scheduler();

#pragma mark - Root Nodes Managerment

  void registerRootTag(Tag rootTag);
  void unregisterRootTag(Tag rootTag);

  void setLayoutConstraints(Tag rootTag, LayoutConstraints layoutConstraints);

#pragma mark - Delegate

  /*
   * Sets and gets the Scheduler's delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setDelegate(SchedulerDelegate *delegate);
  SchedulerDelegate *getDelegate();

#pragma mark - UIManagerDelegate

  void uiManagerDidFinishTransaction(Tag rootTag, const SharedShadowNodeUnsharedList &rootChildNodes) override;
  void uiManagerDidCreateShadowNode(const SharedShadowNode &shadowNode) override;

#pragma mark - Deprecated

  /*
   * UIManager instance must be temporarily exposed for registration purposes.
   */
  std::shared_ptr<FabricUIManager> getUIManager_DO_NOT_USE();

private:
  SchedulerDelegate *delegate_;
  std::shared_ptr<FabricUIManager> uiManager_;

  /*
   * All commited `RootShadowNode` instances to differentiate against.
   */
  std::unordered_map<Tag, SharedRootShadowNode> rootNodeRegistry_;
};

} // namespace react
} // namespace facebook
