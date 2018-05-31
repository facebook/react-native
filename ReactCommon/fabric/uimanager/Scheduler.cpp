// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Scheduler.h"

#include <fabric/core/LayoutContext.h>
#include <fabric/scrollview/ScrollViewComponentDescriptor.h>
#include <fabric/text/ParagraphComponentDescriptor.h>
#include <fabric/text/RawTextComponentDescriptor.h>
#include <fabric/text/TextComponentDescriptor.h>
#include <fabric/uimanager/ComponentDescriptorRegistry.h>
#include <fabric/uimanager/FabricUIManager.h>
#include <fabric/view/ViewComponentDescriptor.h>
#include <fabric/view/ViewProps.h>
#include <fabric/view/ViewShadowNode.h>

#include "ComponentDescriptorFactory.h"
#include "Differentiator.h"

namespace facebook {
namespace react {

Scheduler::Scheduler() {
  eventDispatcher_ = std::make_shared<SchedulerEventDispatcher>();
  auto componentDescriptorRegistry = ComponentDescriptorFactory::buildRegistry(eventDispatcher_);
  uiManager_ = std::make_shared<FabricUIManager>(componentDescriptorRegistry);
  uiManager_->setDelegate(this);
}

Scheduler::~Scheduler() {
  uiManager_->setDelegate(nullptr);
}

void Scheduler::registerRootTag(Tag rootTag) {
  auto &&shadowTree = std::make_shared<ShadowTree>(rootTag);
  shadowTree->setDelegate(this);
  shadowTreeRegistry_.insert({rootTag, shadowTree});
}

void Scheduler::unregisterRootTag(Tag rootTag) {
  auto &&iterator = shadowTreeRegistry_.find(rootTag);
  auto &&shadowTree = iterator->second;
  assert(shadowTree);
  shadowTree->setDelegate(nullptr);
  shadowTreeRegistry_.erase(iterator);
}

Size Scheduler::measure(const Tag &rootTag, const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext) const {
  auto &&shadowTree = shadowTreeRegistry_.at(rootTag);
  assert(shadowTree);
  return shadowTree->measure(layoutConstraints, layoutContext);
}

void Scheduler::constraintLayout(const Tag &rootTag, const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext) {
  auto &&shadowTree = shadowTreeRegistry_.at(rootTag);
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

void Scheduler::shadowTreeDidCommit(const SharedShadowTree &shadowTree, const TreeMutationInstructionList &instructions) {
  if (delegate_) {
    delegate_->schedulerDidComputeMutationInstructions(shadowTree->getRootTag(), instructions);
  }
}

#pragma mark - UIManagerDelegate

void Scheduler::uiManagerDidFinishTransaction(Tag rootTag, const SharedShadowNodeUnsharedList &rootChildNodes) {
  auto &&iterator = shadowTreeRegistry_.find(rootTag);
  auto &&shadowTree = iterator->second;
  assert(shadowTree);
  return shadowTree->complete(rootChildNodes);
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
