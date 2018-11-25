// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Scheduler.h"

#include <jsi/jsi.h>

#include <react/core/LayoutContext.h>
#include <react/uimanager/ComponentDescriptorRegistry.h>
#include <react/uimanager/UIManager.h>
#include <react/uimanager/UIManagerBinding.h>
#include <react/uimanager/UITemplateProcessor.h>

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

  runtimeExecutor_ =
      contextContainer->getInstance<RuntimeExecutor>("runtime-executor");

  auto uiManager = std::make_unique<UIManager>();
  auto &uiManagerRef = *uiManager;
  uiManagerBinding_ =
      std::make_shared<UIManagerBinding>(std::move(uiManager));

  auto eventPipe = [uiManagerBinding = uiManagerBinding_.get()](
                       jsi::Runtime &runtime,
                       const EventTarget *eventTarget,
                       const std::string &type,
                       const folly::dynamic &payload) {
    uiManagerBinding->dispatchEvent(runtime, eventTarget, type, payload);
  };

  auto eventDispatcher = std::make_shared<EventDispatcher>(
      eventPipe, synchronousEventBeatFactory, asynchronousEventBeatFactory);

  componentDescriptorRegistry_ = ComponentDescriptorFactory::buildRegistry(
      eventDispatcher, contextContainer);

  uiManagerRef.setDelegate(this);
  uiManagerRef.setShadowTreeRegistry(&shadowTreeRegistry_);
  uiManagerRef.setComponentDescriptorRegistry(componentDescriptorRegistry_);

  runtimeExecutor_([=](jsi::Runtime &runtime) {
    UIManagerBinding::install(runtime, uiManagerBinding_);
  });
}

Scheduler::~Scheduler() {
  uiManagerBinding_->invalidate();
}

void Scheduler::startSurface(
    SurfaceId surfaceId,
    const std::string &moduleName,
    const folly::dynamic &initialProps,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  auto shadowTree =
      std::make_unique<ShadowTree>(surfaceId, layoutConstraints, layoutContext);
  shadowTree->setDelegate(this);

  shadowTreeRegistry_.add(std::move(shadowTree));

#ifndef ANDROID
  runtimeExecutor_([=](jsi::Runtime &runtime) {
    uiManagerBinding_->startSurface(
        runtime, surfaceId, moduleName, initialProps);
  });
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

    shadowTreeRegistry_.get(surfaceId, [=](const ShadowTree &shadowTree) {
      shadowTree.complete(
          std::make_shared<SharedShadowNodeList>(SharedShadowNodeList{tree}));
    });
  } catch (const std::exception &e) {
    LOG(ERROR) << "    >>>> EXCEPTION <<<  rendering uiTemplate in "
               << "Scheduler::renderTemplateToSurface: " << e.what();
  }
}

void Scheduler::stopSurface(SurfaceId surfaceId) const {
  shadowTreeRegistry_.get(surfaceId, [](const ShadowTree &shadowTree) {
    // As part of stopping the Surface, we have to commit an empty tree.
    shadowTree.complete(std::const_pointer_cast<SharedShadowNodeList>(
        ShadowNode::emptySharedShadowNodeSharedList()));
  });

  auto shadowTree = shadowTreeRegistry_.remove(surfaceId);
  shadowTree->setDelegate(nullptr);

#ifndef ANDROID
  runtimeExecutor_([=](jsi::Runtime &runtime) {
    uiManagerBinding_->stopSurface(runtime, surfaceId);
  });
#endif
}

Size Scheduler::measureSurface(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  Size size;
  shadowTreeRegistry_.get(surfaceId, [&](const ShadowTree &shadowTree) {
    size = shadowTree.measure(layoutConstraints, layoutContext);
  });
  return size;
}

void Scheduler::constraintSurfaceLayout(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  shadowTreeRegistry_.get(surfaceId, [&](const ShadowTree &shadowTree) {
    shadowTree.synchronize([&]() {
      shadowTree.constraintLayout(layoutConstraints, layoutContext);
    });
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
    SurfaceId surfaceId,
    const SharedShadowNodeUnsharedList &rootChildNodes) {
  shadowTreeRegistry_.get(surfaceId, [&](const ShadowTree &shadowTree) {
    shadowTree.complete(rootChildNodes);
  });
}

void Scheduler::uiManagerDidCreateShadowNode(
    const SharedShadowNode &shadowNode) {
  if (delegate_) {
    auto layoutableShadowNode =
        dynamic_cast<const LayoutableShadowNode *>(shadowNode.get());
    auto isLayoutable = layoutableShadowNode != nullptr;

    delegate_->schedulerDidRequestPreliminaryViewAllocation(
        shadowNode->getRootTag(),
        shadowNode->getComponentName(),
        isLayoutable,
        shadowNode->getComponentHandle());
  }
}

} // namespace react
} // namespace facebook
