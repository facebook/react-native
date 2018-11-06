// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Scheduler.h"

#include <jsi/jsi.h>

#include <fabric/core/LayoutContext.h>
#include <fabric/uimanager/ComponentDescriptorRegistry.h>
#include <fabric/uimanager/FabricUIManager.h>
#include <fabric/uimanager/JSIFabricUIManager.h>
#include <fabric/uimanager/UITemplateProcessor.h>

#include "ComponentDescriptorFactory.h"
#include "Differentiator.h"

namespace facebook {
namespace react {

Scheduler::Scheduler(const SharedContextContainer &contextContainer)
    : contextContainer_(contextContainer) {
  const auto asynchronousEventBeatFactory =
      contextContainer->getInstance<EventBeatFactory>("asynchronous");
  const auto synchronousEventBeatFactory =
      contextContainer->getInstance<EventBeatFactory>("synchronous");

  const auto runtimeExecutor =
      contextContainer->getInstance<RuntimeExecutor>("runtime-executor");

  uiManager_ = std::make_shared<FabricUIManager>(
      std::make_unique<EventBeatBasedExecutor>(asynchronousEventBeatFactory()),
      [](UIManager &uiManager) { /* Not implemented. */ },
      []() { /* Not implemented. */ });

  runtimeExecutor([this](jsi::Runtime &runtime) {
    JSIInstallFabricUIManager(runtime, *uiManager_);
  });

  auto eventDispatcher = std::make_shared<EventDispatcher>(
      std::bind(
          &FabricUIManager::dispatchEventToTarget,
          uiManager_.get(),
          std::placeholders::_1,
          std::placeholders::_2,
          std::placeholders::_3,
          std::placeholders::_4),
      synchronousEventBeatFactory,
      asynchronousEventBeatFactory);

  componentDescriptorRegistry_ = ComponentDescriptorFactory::buildRegistry(
      eventDispatcher, contextContainer);
  uiManager_->setComponentDescriptorRegistry(componentDescriptorRegistry_);

  uiManager_->setDelegate(this);
}

Scheduler::~Scheduler() {
  uiManager_->setDelegate(nullptr);
}

void Scheduler::startSurface(
    SurfaceId surfaceId,
    const std::string &moduleName,
    const folly::dynamic &initialProps,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  std::lock_guard<std::mutex> lock(mutex_);

  auto shadowTree =
      std::make_unique<ShadowTree>(surfaceId, layoutConstraints, layoutContext);
  shadowTree->setDelegate(this);
  shadowTreeRegistry_.emplace(surfaceId, std::move(shadowTree));

#ifndef ANDROID
  uiManager_->startSurface(surfaceId, moduleName, initialProps);
#endif
}

void Scheduler::renderTemplateToSurface(
    SurfaceId surfaceId,
    const std::string &uiTemplate) {
  try {
    if (uiTemplate.size() == 0) {
      return;
    }
    NativeModuleRegistry nMR;
    auto tree = UITemplateProcessor::buildShadowTree(
        uiTemplate,
        surfaceId,
        folly::dynamic::object(),
        *componentDescriptorRegistry_,
        nMR);

    std::lock_guard<std::mutex> lock(mutex_);
    const auto &shadowTree = shadowTreeRegistry_.at(surfaceId);
    assert(shadowTree);
    shadowTree->complete(
        std::make_shared<SharedShadowNodeList>(SharedShadowNodeList{tree}));
  } catch (const std::exception &e) {
    LOG(ERROR) << "    >>>> EXCEPTION <<<  rendering uiTemplate in "
               << "Scheduler::renderTemplateToSurface: " << e.what();
  }
}

void Scheduler::stopSurface(SurfaceId surfaceId) const {
  std::lock_guard<std::mutex> lock(mutex_);

#ifndef ANDROID
  uiManager_->stopSurface(surfaceId);
#endif

  const auto &iterator = shadowTreeRegistry_.find(surfaceId);
  const auto &shadowTree = iterator->second;
  assert(shadowTree);
  // As part of stopping the Surface, we have to commit an empty tree.
  shadowTree->complete(std::const_pointer_cast<SharedShadowNodeList>(
      ShadowNode::emptySharedShadowNodeSharedList()));
  shadowTree->setDelegate(nullptr);
  shadowTreeRegistry_.erase(iterator);
}

Size Scheduler::measureSurface(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  std::lock_guard<std::mutex> lock(mutex_);
  const auto &shadowTree = shadowTreeRegistry_.at(surfaceId);
  assert(shadowTree);
  return shadowTree->measure(layoutConstraints, layoutContext);
}

void Scheduler::constraintSurfaceLayout(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  std::lock_guard<std::mutex> lock(mutex_);
  const auto &shadowTree = shadowTreeRegistry_.at(surfaceId);
  assert(shadowTree);
  shadowTree->synchronize([&]() {
    shadowTree->constraintLayout(layoutConstraints, layoutContext);
  });
}

#pragma mark - Delegate

void Scheduler::setDelegate(SchedulerDelegate *delegate) {
  delegate_ = delegate;
}

SchedulerDelegate *Scheduler::getDelegate() const {
  return delegate_;
}

#pragma mark - ShadowTreeDelegate

void Scheduler::shadowTreeDidCommit(
    const ShadowTree &shadowTree,
    const ShadowViewMutationList &mutations) const {
  if (delegate_) {
    delegate_->schedulerDidFinishTransaction(
        shadowTree.getSurfaceId(), mutations);
  }
}

#pragma mark - UIManagerDelegate

void Scheduler::uiManagerDidFinishTransaction(
    Tag rootTag,
    const SharedShadowNodeUnsharedList &rootChildNodes) {
  std::lock_guard<std::mutex> lock(mutex_);
  const auto iterator = shadowTreeRegistry_.find(rootTag);
  if (iterator == shadowTreeRegistry_.end()) {
    // This might happen during surface unmounting/deallocation process
    // due to the asynchronous nature of JS calls.
    return;
  }
  iterator->second->complete(rootChildNodes);
}

void Scheduler::uiManagerDidCreateShadowNode(
    const SharedShadowNode &shadowNode) {
  if (delegate_) {
    delegate_->schedulerDidRequestPreliminaryViewAllocation(
        shadowNode->getComponentName());
  }
}

#pragma mark - Deprecated

std::shared_ptr<FabricUIManager> Scheduler::getUIManager_DO_NOT_USE() {
  return uiManager_;
}

} // namespace react
} // namespace facebook
