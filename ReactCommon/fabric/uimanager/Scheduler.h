// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>
#include <mutex>

#include <fabric/core/ComponentDescriptor.h>
#include <fabric/core/LayoutConstraints.h>
#include <fabric/uimanager/ContextContainer.h>
#include <fabric/uimanager/SchedulerDelegate.h>
#include <fabric/uimanager/UIManagerDelegate.h>
#include <fabric/uimanager/ShadowTree.h>
#include <fabric/uimanager/ShadowTreeDelegate.h>

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
  Scheduler(const SharedContextContainer &contextContainer);
  ~Scheduler();

#pragma mark - Surface Management

  void startSurface(
    SurfaceId surfaceId,
    const std::string &moduleName,
    const folly::dynamic &initialProps
  ) const;

  void stopSurface(SurfaceId surfaceId) const;

  Size measureSurface(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext
  ) const;

  void constraintSurfaceLayout(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext
  ) const;

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

  void shadowTreeDidCommit(const ShadowTree &shadowTree, const ShadowViewMutationList &mutations) const override;

#pragma mark - Deprecated

  /*
   * UIManager instance must be temporarily exposed for registration purposes.
   */
  std::shared_ptr<FabricUIManager> getUIManager_DO_NOT_USE();

private:
  SchedulerDelegate *delegate_;
  std::shared_ptr<FabricUIManager> uiManager_;
  mutable std::mutex mutex_;
  mutable std::unordered_map<SurfaceId, std::unique_ptr<ShadowTree>> shadowTreeRegistry_; // Protected by `mutex_`.
  SharedEventDispatcher eventDispatcher_;
  SharedContextContainer contextContainer_;
};

} // namespace react
} // namespace facebook
