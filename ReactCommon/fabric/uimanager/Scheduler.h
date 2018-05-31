// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>

#include <fabric/core/ComponentDescriptor.h>
#include <fabric/core/LayoutConstraints.h>
#include <fabric/uimanager/SchedulerDelegate.h>
#include <fabric/uimanager/SchedulerEventDispatcher.h>
#include <fabric/uimanager/UIManagerDelegate.h>
#include <fabric/uimanager/ShadowTree.h>
#include <fabric/uimanager/ShadowTreeDelegate.h>
#include <fabric/view/ViewShadowNode.h>
#include <fabric/view/RootShadowNode.h>

namespace facebook {
namespace react {

class FabricUIManager;

/*
 * Scheduler coordinates Shadow Tree updates and event flows.
 */
class Scheduler final:
  public UIManagerDelegate,
  public ShadowTreeDelegate {

public:

  Scheduler();
  ~Scheduler();

#pragma mark - Shadow Tree Management

  void registerRootTag(Tag rootTag);
  void unregisterRootTag(Tag rootTag);

  Size measure(const Tag &rootTag, const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext) const;
  void constraintLayout(const Tag &rootTag, const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext);

#pragma mark - Delegate

  /*
   * Sets and gets the Scheduler's delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setDelegate(SchedulerDelegate *delegate);
  SchedulerDelegate *getDelegate() const;

#pragma mark - UIManagerDelegate

  void uiManagerDidFinishTransaction(Tag rootTag, const SharedShadowNodeUnsharedList &rootChildNodes) override;
  void uiManagerDidCreateShadowNode(const SharedShadowNode &shadowNode) override;

#pragma mark - ShadowTreeDelegate

  void shadowTreeDidCommit(const SharedShadowTree &shadowTree, const TreeMutationInstructionList &instructions) override;

#pragma mark - Deprecated

  /*
   * UIManager instance must be temporarily exposed for registration purposes.
   */
  std::shared_ptr<FabricUIManager> getUIManager_DO_NOT_USE();

private:

  SchedulerDelegate *delegate_;
  std::shared_ptr<FabricUIManager> uiManager_;
  std::unordered_map<Tag, SharedShadowTree> shadowTreeRegistry_;
  std::shared_ptr<SchedulerEventDispatcher> eventDispatcher_;
};

} // namespace react
} // namespace facebook
