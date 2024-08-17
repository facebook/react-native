/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeMutationObserver.h"
#include <cxxreact/SystraceSection.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/primitives.h>

#include "Plugins.h"

std::shared_ptr<facebook::react::TurboModule>
NativeMutationObserverModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeMutationObserver>(
      std::move(jsInvoker));
}

namespace facebook::react {

static UIManager& getUIManagerFromRuntime(jsi::Runtime& runtime) {
  return UIManagerBinding::getBinding(runtime)->getUIManager();
}

NativeMutationObserver::NativeMutationObserver(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeMutationObserverCxxSpec(std::move(jsInvoker)) {}

void NativeMutationObserver::observe(
    jsi::Runtime& runtime,
    NativeMutationObserverObserveOptions options) {
  auto mutationObserverId = options.mutationObserverId;
  auto subtree = options.subtree;
  auto shadowNode =
      shadowNodeFromValue(runtime, std::move(options).targetShadowNode);
  auto& uiManager = getUIManagerFromRuntime(runtime);

  mutationObserverManager_.observe(
      mutationObserverId, shadowNode, subtree, uiManager);
}

void NativeMutationObserver::unobserve(
    jsi::Runtime& runtime,
    MutationObserverId mutationObserverId,
    jsi::Object targetShadowNode) {
  auto shadowNode = shadowNodeFromValue(runtime, std::move(targetShadowNode));
  mutationObserverManager_.unobserve(mutationObserverId, *shadowNode);
}

void NativeMutationObserver::connect(
    jsi::Runtime& runtime,
    jsi::Function notifyMutationObservers,
    SyncCallback<jsi::Value(jsi::Value)> getPublicInstanceFromInstanceHandle) {
  auto& uiManager = getUIManagerFromRuntime(runtime);

  // MutationObserver is not compatible with background executor.
  // When using background executor, we commit trees outside the JS thread.
  // In that case, we can't safely access the JS runtime in commit hooks to
  // get references to mutated nodes (which we need to do at that point
  // to ensure we are retaining removed nodes).
  if (uiManager.hasBackgroundExecutor()) {
    throw jsi::JSError(
        runtime,
        "MutationObserver: could not start observation because MutationObserver is incompatible with UIManager using background executor.");
  }

  runtime_ = &runtime;
  notifyMutationObservers_.emplace(std::move(notifyMutationObservers));
  getPublicInstanceFromInstanceHandle_.emplace(
      std::move(getPublicInstanceFromInstanceHandle));

  auto onMutationsCallback = [&](std::vector<MutationRecord>& records) {
    return onMutations(records);
  };

  mutationObserverManager_.connect(uiManager, std::move(onMutationsCallback));
}

void NativeMutationObserver::disconnect(jsi::Runtime& runtime) {
  auto& uiManager = getUIManagerFromRuntime(runtime);
  mutationObserverManager_.disconnect(uiManager);
  runtime_ = nullptr;
  notifyMutationObservers_.reset();
  getPublicInstanceFromInstanceHandle_.reset();
}

std::vector<NativeMutationRecord> NativeMutationObserver::takeRecords(
    jsi::Runtime& /*runtime*/) {
  notifiedMutationObservers_ = false;

  std::vector<NativeMutationRecord> records;
  pendingRecords_.swap(records);
  return records;
}

jsi::Value NativeMutationObserver::getPublicInstanceFromShadowNode(
    const ShadowNode& shadowNode) const {
  auto instanceHandle = shadowNode.getInstanceHandle(*runtime_);
  if (!instanceHandle.isObject()) {
    return jsi::Value::null();
  }
  return getPublicInstanceFromInstanceHandle_.value().call(
      std::move(instanceHandle));
}

std::vector<jsi::Value>
NativeMutationObserver::getPublicInstancesFromShadowNodes(
    const std::vector<ShadowNode::Shared>& shadowNodes) const {
  std::vector<jsi::Value> publicInstances;
  publicInstances.reserve(shadowNodes.size());

  for (const auto& shadowNode : shadowNodes) {
    publicInstances.push_back(getPublicInstanceFromShadowNode(*shadowNode));
  }

  return publicInstances;
}

void NativeMutationObserver::onMutations(std::vector<MutationRecord>& records) {
  SystraceSection s("NativeMutationObserver::onMutations");

  for (const auto& record : records) {
    pendingRecords_.emplace_back(NativeMutationRecord{
        record.mutationObserverId,
        // FIXME(T157129303) Instead of assuming we can call into JS from here,
        // we should use an API that explicitly indicates it.
        getPublicInstanceFromShadowNode(*record.targetShadowNode),
        getPublicInstancesFromShadowNodes(record.addedShadowNodes),
        getPublicInstancesFromShadowNodes(record.removedShadowNodes)});
  }

  notifyMutationObserversIfNecessary();
}

/**
 * This method allows us to avoid scheduling multiple calls to notify observers
 * in the JS thread. We schedule one and skip subsequent ones (we just append
 * the records to the pending list and wait for the scheduled task to consume
 * all of them).
 */
void NativeMutationObserver::notifyMutationObserversIfNecessary() {
  bool dispatchNotification = false;

  if (!pendingRecords_.empty() && !notifiedMutationObservers_) {
    notifiedMutationObservers_ = true;
    dispatchNotification = true;
  }

  if (dispatchNotification) {
    SystraceSection s("NativeMutationObserver::notifyObservers");
    if (ReactNativeFeatureFlags::enableMicrotasks()) {
      runtime_->queueMicrotask(notifyMutationObservers_.value());
    } else {
      jsInvoker_->invokeAsync([&](jsi::Runtime& runtime) {
        // It's possible that the last observer was disconnected before we could
        // dispatch this notification.
        if (notifyMutationObservers_) {
          notifyMutationObservers_.value().call(runtime);
        }
      });
    }
  }
}

} // namespace facebook::react
