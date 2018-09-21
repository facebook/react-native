// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Scheduler.h"

#include <fabric/core/LayoutContext.h>
#include <fabric/uimanager/ComponentDescriptorRegistry.h>
#include <fabric/uimanager/FabricUIManager.h>

#include "ComponentDescriptorFactory.h"
#include "Differentiator.h"

namespace facebook {
namespace react {

Scheduler::Scheduler(const SharedContextContainer &contextContainer):
  contextContainer_(contextContainer) {

  uiManager_ = std::make_shared<FabricUIManager>();

  auto eventDispatcher =
    std::make_shared<EventDispatcher>(
      std::bind(
        &FabricUIManager::dispatchEventToTarget,
        uiManager_.get(),
        std::placeholders::_1,
        std::placeholders::_2,
        std::placeholders::_3
      ),
      contextContainer->getInstance<EventBeatFactory>("synchronous"),
      contextContainer->getInstance<EventBeatFactory>("asynchronous")
    );

  uiManager_->setComponentDescriptorRegistry(
    ComponentDescriptorFactory::buildRegistry(eventDispatcher, contextContainer)
  );

  uiManager_->setDelegate(this);
}

Scheduler::~Scheduler() {
  uiManager_->setDelegate(nullptr);
}

void Scheduler::registerRootTag(Tag rootTag) {
  auto shadowTree = std::make_unique<ShadowTree>(rootTag);
  shadowTree->setDelegate(this);
  shadowTreeRegistry_.emplace(rootTag, std::move(shadowTree));
}

void Scheduler::unregisterRootTag(Tag rootTag) {
  const auto &iterator = shadowTreeRegistry_.find(rootTag);
  const auto &shadowTree = iterator->second;
  assert(shadowTree);
  shadowTree->setDelegate(nullptr);
  shadowTreeRegistry_.erase(iterator);
}

Size Scheduler::measure(const Tag &rootTag, const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext) const {
  const auto &shadowTree = shadowTreeRegistry_.at(rootTag);
  assert(shadowTree);
  return shadowTree->measure(layoutConstraints, layoutContext);
}

void Scheduler::constraintLayout(const Tag &rootTag, const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext) {
  const auto &shadowTree = shadowTreeRegistry_.at(rootTag);
  assert(shadowTree);
  return shadowTree->constraintLayout(layoutConstraints, layoutContext);
}

#pragma mark - Delegate

void Scheduler::setDelegate(SchedulerDelegate *delegate) {
  delegate_ = delegate;
}

SchedulerDelegate *Scheduler::getDelegate() const {
  return delegate_;
}

#pragma mark - ShadowTreeDelegate

void Scheduler::shadowTreeDidCommit(const ShadowTree &shadowTree, const ShadowViewMutationList &mutations) {
  if (delegate_) {
    delegate_->schedulerDidFinishTransaction(shadowTree.getRootTag(), mutations);
  }
}

#pragma mark - UIManagerDelegate

void Scheduler::uiManagerDidFinishTransaction(Tag rootTag, const SharedShadowNodeUnsharedList &rootChildNodes) {
  const auto iterator = shadowTreeRegistry_.find(rootTag);
  if (iterator == shadowTreeRegistry_.end()) {
    // This might happen during surface unmounting/deallocation process
    // due to the asynchronous nature of JS calls.
    return;
  }

  return iterator->second->complete(rootChildNodes);
}

void Scheduler::uiManagerDidCreateShadowNode(const SharedShadowNode &shadowNode) {
  if (delegate_) {
    delegate_->schedulerDidRequestPreliminaryViewAllocation(shadowNode->getComponentName());
  }
}

#pragma mark - Deprecated

std::shared_ptr<FabricUIManager> Scheduler::getUIManager_DO_NOT_USE() {
  return uiManager_;
}

} // namespace react
} // namespace facebook
