/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <react/renderer/observers/mutation/MutationObserverManager.h>
#include <react/renderer/uimanager/UIManager.h>
#include <vector>

namespace facebook::react {

using NativeMutationObserverObserveOptions =
    NativeMutationObserverNativeMutationObserverObserveOptions<
        // mutationObserverId
        MutationObserverId,
        // targetShadowNode
        jsi::Object,
        // subtree
        bool>;

template <>
struct Bridging<NativeMutationObserverObserveOptions>
    : NativeMutationObserverNativeMutationObserverObserveOptionsBridging<
          NativeMutationObserverObserveOptions> {};

using NativeMutationRecord = NativeMutationObserverNativeMutationRecord<
    // mutationObserverId
    MutationObserverId,
    // target
    jsi::Value,
    // addedNodes
    std::vector<jsi::Value>,
    // removedNodes
    std::vector<jsi::Value>>;

template <>
struct Bridging<NativeMutationRecord>
    : NativeMutationObserverNativeMutationRecordBridging<NativeMutationRecord> {
};

class NativeMutationObserver
    : public NativeMutationObserverCxxSpec<NativeMutationObserver> {
 public:
  NativeMutationObserver(std::shared_ptr<CallInvoker> jsInvoker);

  void observe(
      jsi::Runtime& runtime,
      NativeMutationObserverObserveOptions options);

  void unobserve(
      jsi::Runtime& runtime,
      MutationObserverId mutationObserverId,
      jsi::Object targetShadowNode);

  void connect(
      jsi::Runtime& runtime,
      jsi::Function notifyMutationObservers,
      SyncCallback<jsi::Value(jsi::Value)> getPublicInstanceFromInstanceHandle);

  void disconnect(jsi::Runtime& runtime);

  std::vector<NativeMutationRecord> takeRecords(jsi::Runtime& runtime);

 private:
  MutationObserverManager mutationObserverManager_{};

  std::vector<NativeMutationRecord> pendingRecords_;

  // We need to keep a reference to the JS runtime so we can schedule the
  // notifications as microtasks when mutations occur. This is safe because
  // mutations will only happen when executing JavaScript and because this
  // native module will never survive the runtime.
  jsi::Runtime* runtime_{};

  bool notifiedMutationObservers_{};
  std::optional<jsi::Function> notifyMutationObservers_;
  std::optional<SyncCallback<jsi::Value(jsi::Value)>>
      getPublicInstanceFromInstanceHandle_;

  void onMutations(std::vector<MutationRecord>& records);
  void notifyMutationObserversIfNecessary();

  jsi::Value getPublicInstanceFromShadowNode(
      const ShadowNode& shadowNode) const;
  std::vector<jsi::Value> getPublicInstancesFromShadowNodes(
      const std::vector<ShadowNode::Shared>& shadowNodes) const;
};

} // namespace facebook::react
