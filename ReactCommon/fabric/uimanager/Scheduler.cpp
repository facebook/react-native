// Copyright 2004-present Facebook. All Rights Reserved.

#include "Scheduler.h"

#include <fabric/core/LayoutContext.h>
#include <fabric/uimanager/ComponentDescriptorRegistry.h>
#include <fabric/uimanager/FabricUIManager.h>
#include <fabric/view/ViewComponentDescriptor.h>
#include <fabric/view/ViewProps.h>
#include <fabric/view/ViewShadowNode.h>

#include "Differentiator.h"

namespace facebook {
namespace react {

Scheduler::Scheduler() {
  auto componentDescriptorRegistry = std::make_shared<ComponentDescriptorRegistry>();
  SharedComponentDescriptor viewComponentDescriptor = std::make_shared<ViewComponentDescriptor>();
  componentDescriptorRegistry->registerComponentDescriptor(viewComponentDescriptor);

  uiManager_ = std::make_shared<FabricUIManager>(componentDescriptorRegistry);
  uiManager_->setDelegate(this);
}

Scheduler::~Scheduler() {
  uiManager_->setDelegate(nullptr);
}

void Scheduler::registerRootTag(Tag rootTag) {
  auto rootShadowNode = std::make_shared<RootShadowNode>(rootTag, rootTag, nullptr);
  rootNodeRegistry_.insert({rootTag, rootShadowNode});
}

void Scheduler::unregisterRootTag(Tag rootTag) {
  rootNodeRegistry_.erase(rootTag);
}

#pragma mark - Delegate

void Scheduler::setDelegate(SchedulerDelegate *delegate) {
  delegate_ = delegate;
}

SchedulerDelegate *Scheduler::getDelegate() {
  return delegate_;
}

#pragma mark - UIManagerDelegate
  
void Scheduler::uiManagerDidFinishTransaction(Tag rootTag, const SharedShadowNodeUnsharedList &rootChildNodes) {
  SharedRootShadowNode oldRootShadowNode = rootNodeRegistry_[rootTag];
  assert(oldRootShadowNode);

  SharedRootShadowNode newRootShadowNode =
    std::make_shared<RootShadowNode>(oldRootShadowNode, nullptr, SharedShadowNodeSharedList(rootChildNodes));

  auto nonConstOldRootShadowNode = std::const_pointer_cast<RootShadowNode>(oldRootShadowNode);
  auto nonConstNewRootShadowNode = std::const_pointer_cast<RootShadowNode>(newRootShadowNode);

  LayoutContext layoutContext = LayoutContext();
  layoutContext.affectedShadowNodes = std::make_shared<std::unordered_set<SharedLayoutableShadowNode>>();

  LOG(INFO) << "Old Shadow Tree: \n" << oldRootShadowNode->getDebugDescription();
  LOG(INFO) << "New Shadow Tree *before* layout: \n" << newRootShadowNode->getDebugDescription();

  nonConstNewRootShadowNode->layout(layoutContext);

  nonConstNewRootShadowNode->sealRecursive();

  LOG(INFO) << "New Shadow Tree *after* layout: \n" << nonConstNewRootShadowNode->getDebugDescription();

  TreeMutationInstructionList instructions = TreeMutationInstructionList();

  calculateMutationInstructions(
    instructions,
    oldRootShadowNode,
    oldRootShadowNode->ShadowNode::getChildren(),
    newRootShadowNode->ShadowNode::getChildren()
  );

  LOG(INFO) << "TreeMutationInstructionList:";

  for (auto instruction : instructions) {
    LOG(INFO) << "Instruction: " << instruction.getDebugDescription();
  }

  rootNodeRegistry_[rootTag] = newRootShadowNode;

  if (delegate_) {
    delegate_->schedulerDidComputeMutationInstructions(rootTag, instructions);
  }
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
