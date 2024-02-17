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
#include <optional>
#include <string>
#include <vector>

namespace facebook::react {

using NativeMutationObserverObserveOptions =
    NativeMutationObserverCxxNativeMutationObserverObserveOptions<
        // mutationObserverId
        MutationObserverId,
        // targetShadowNode
        jsi::Object,
        // subtree
        bool>;

template <>
struct Bridging<NativeMutationObserverObserveOptions>
    : NativeMutationObserverCxxNativeMutationObserverObserveOptionsBridging<
          NativeMutationObserverObserveOptions> {};

using NativeMutationRecord = NativeMutationObserverCxxNativeMutationRecord<
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
    : NativeMutationObserverCxxNativeMutationRecordBridging<
          NativeMutationRecord> {};

class NativeMutationObserver
    : public NativeMutationObserverCxxSpec<NativeMutationObserver>,
      std::enable_shared_from_this<NativeMutationObserver> {
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
      AsyncCallback<> notifyMutationObservers,
      jsi::Function getPublicInstanceFromInstanceHandle);

  void disconnect(jsi::Runtime& runtime);

  std::vector<NativeMutationRecord> takeRecords(jsi::Runtime& runtime);

 private:
  MutationObserverManager mutationObserverManager_{};

  std::vector<NativeMutationRecord> pendingRecords_;

  // This is passed to `connect` so we can retain references to public instances
  // when mutation occur, before React cleans up unmounted instances.
  jsi::Value getPublicInstanceFromInstanceHandle_ = jsi::Value::undefined();
  std::function<jsi::Value(const ShadowNode&)> getPublicInstanceFromShadowNode_;

  bool notifiedMutationObservers_{};
  std::function<void()> notifyMutationObservers_;

  void onMutations(std::vector<MutationRecord>& records);
  void notifyMutationObserversIfNecessary();

  std::vector<jsi::Value> getPublicInstancesFromShadowNodes(
      const std::vector<ShadowNode::Shared>& shadowNodes) const;
};

} // namespace facebook::react
