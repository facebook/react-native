/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeMutationObserver.h"
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/debug/SystraceSection.h>
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
    AsyncCallback<> notifyMutationObservers,
    jsi::Function getPublicInstanceFromInstanceHandle) {
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

  getPublicInstanceFromInstanceHandle_ =
      jsi::Value(runtime, getPublicInstanceFromInstanceHandle);

  // This should always be called from the JS thread, as it's unsafe to call
  // into JS otherwise (via `getPublicInstanceFromInstanceHandle`).
  getPublicInstanceFromShadowNode_ = [&](const ShadowNode& shadowNode) {
    auto instanceHandle = shadowNode.getInstanceHandle(runtime);
    if (!instanceHandle.isObject() ||
        !getPublicInstanceFromInstanceHandle_.isObject() ||
        !getPublicInstanceFromInstanceHandle_.asObject(runtime).isFunction(
            runtime)) {
      return jsi::Value::null();
    }
    return getPublicInstanceFromInstanceHandle_.asObject(runtime)
        .asFunction(runtime)
        .call(runtime, instanceHandle);
  };

  notifyMutationObservers_ = std::move(notifyMutationObservers);

  auto onMutationsCallback = [&](std::vector<MutationRecord>& records) {
    return onMutations(records);
  };

  mutationObserverManager_.connect(uiManager, std::move(onMutationsCallback));
}

void NativeMutationObserver::disconnect(jsi::Runtime& runtime) {
  auto& uiManager = getUIManagerFromRuntime(runtime);
  mutationObserverManager_.disconnect(uiManager);
  getPublicInstanceFromInstanceHandle_ = jsi::Value::undefined();
  getPublicInstanceFromShadowNode_ = nullptr;
  notifyMutationObservers_ = nullptr;
}

std::vector<NativeMutationRecord> NativeMutationObserver::takeRecords(
    jsi::Runtime& /*runtime*/) {
  notifiedMutationObservers_ = false;

  std::vector<NativeMutationRecord> records;
  pendingRecords_.swap(records);
  return records;
}

std::vector<jsi::Value>
NativeMutationObserver::getPublicInstancesFromShadowNodes(
    const std::vector<ShadowNode::Shared>& shadowNodes) const {
  std::vector<jsi::Value> publicInstances;
  publicInstances.reserve(shadowNodes.size());

  for (const auto& shadowNode : shadowNodes) {
    publicInstances.push_back(getPublicInstanceFromShadowNode_(*shadowNode));
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
        getPublicInstanceFromShadowNode_(*record.targetShadowNode),
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
    notifyMutationObservers_();
  }
}

} // namespace facebook::react
