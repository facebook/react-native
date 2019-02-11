// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>
#include <mutex>

#include <react/config/ReactNativeConfig.h>
#include <react/core/ComponentDescriptor.h>
#include <react/core/LayoutConstraints.h>
#include <react/uimanager/ComponentDescriptorFactory.h>
#include <react/uimanager/ComponentDescriptorRegistry.h>
#include <react/uimanager/ContextContainer.h>
#include <react/uimanager/SchedulerDelegate.h>
#include <react/uimanager/ShadowTree.h>
#include <react/uimanager/ShadowTreeDelegate.h>
#include <react/uimanager/ShadowTreeRegistry.h>
#include <react/uimanager/UIManagerBinding.h>
#include <react/uimanager/UIManagerDelegate.h>
#include <react/uimanager/primitives.h>

namespace facebook {
namespace react {

/*
 * Scheduler coordinates Shadow Tree updates and event flows.
 */
class Scheduler final : public UIManagerDelegate, public ShadowTreeDelegate {
 public:
  Scheduler(
      const SharedContextContainer &contextContainer,
      ComponentRegistryFactory buildRegistryFunction);
  ~Scheduler();

#pragma mark - Surface Management

  void startSurface(
      SurfaceId surfaceId,
      const std::string &moduleName,
      const folly::dynamic &initialProps,
      const LayoutConstraints &layoutConstraints = {},
      const LayoutContext &layoutContext = {}) const;

  void renderTemplateToSurface(
      SurfaceId surfaceId,
      const std::string &uiTemplate);

  void stopSurface(SurfaceId surfaceId) const;

  Size measureSurface(
      SurfaceId surfaceId,
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext) const;

  /*
   * Applies given `layoutConstraints` and `layoutContext` to a Surface.
   * The user interface will be relaid out as a result. The operation will be
   * performed synchronously (including mounting) if the method is called
   * on the main thread.
   * Can be called from any thread.
   */
  void constraintSurfaceLayout(
      SurfaceId surfaceId,
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext) const;

#pragma mark - Delegate

  /*
   * Sets and gets the Scheduler's delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setDelegate(SchedulerDelegate *delegate);
  SchedulerDelegate *getDelegate() const;

#pragma mark - UIManagerDelegate

  void uiManagerDidFinishTransaction(
      SurfaceId surfaceId,
      const SharedShadowNodeUnsharedList &rootChildNodes,
      long startCommitTime) override;
  void uiManagerDidCreateShadowNode(
      const SharedShadowNode &shadowNode) override;

#pragma mark - ShadowTreeDelegate

  void shadowTreeDidCommit(
      const ShadowTree &shadowTree,
      const ShadowViewMutationList &mutations,
      long commitStartTime,
      long layoutTime) const override;

 private:
  SchedulerDelegate *delegate_;
  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  ShadowTreeRegistry shadowTreeRegistry_;
  RuntimeExecutor runtimeExecutor_;
  std::shared_ptr<UIManagerBinding> uiManagerBinding_;
  std::shared_ptr<const ReactNativeConfig> reactNativeConfig_;
};

} // namespace react
} // namespace facebook
