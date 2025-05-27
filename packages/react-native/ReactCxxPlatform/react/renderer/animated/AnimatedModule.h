/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <ReactCommon/TurboModuleWithJSIBindings.h>
#include <react/renderer/animated/NativeAnimatedNodesManager.h>
#include <react/renderer/animated/NativeAnimatedNodesManagerProvider.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <memory>
#include <string>

namespace facebook::react {

class AnimatedModule : public NativeAnimatedModuleCxxSpec<AnimatedModule>,
                       public TurboModuleWithJSIBindings {
  using Operation =
      std::function<void(NativeAnimatedNodesManager& nodesManager)>;

 public:
  AnimatedModule(
      std::shared_ptr<CallInvoker> jsInvoker,
      std::shared_ptr<NativeAnimatedNodesManagerProvider> nodesManagerProvider);

  void startOperationBatch(jsi::Runtime& rt);

  void finishOperationBatch(jsi::Runtime& rt);

  void createAnimatedNode(jsi::Runtime& rt, Tag tag, jsi::Object config);

  void updateAnimatedNodeConfig(jsi::Runtime& rt, Tag tag, jsi::Object config);

  void getValue(
      jsi::Runtime& rt,
      Tag tag,
      const AsyncCallback<double>& saveValueCallback);

  void startListeningToAnimatedNodeValue(jsi::Runtime& rt, Tag tag);

  void stopListeningToAnimatedNodeValue(jsi::Runtime& rt, Tag tag);

  void connectAnimatedNodes(jsi::Runtime& rt, Tag parentTag, Tag childTag);

  void disconnectAnimatedNodes(jsi::Runtime& rt, Tag parentTag, Tag childTag);

  void startAnimatingNode(
      jsi::Runtime& rt,
      int animationId,
      Tag nodeTag,
      jsi::Object config,
      AnimationEndCallback endCallback);

  void stopAnimation(jsi::Runtime& rt, int animationId);

  void setAnimatedNodeValue(jsi::Runtime& rt, Tag nodeTag, double value);

  void setAnimatedNodeOffset(jsi::Runtime& rt, Tag nodeTag, double offset);

  void flattenAnimatedNodeOffset(jsi::Runtime& rt, Tag nodeTag);

  void extractAnimatedNodeOffset(jsi::Runtime& rt, Tag nodeTag);

  void connectAnimatedNodeToView(jsi::Runtime& rt, Tag nodeTag, Tag viewTag);

  void
  disconnectAnimatedNodeFromView(jsi::Runtime& rt, Tag nodeTag, Tag viewTag);

  void restoreDefaultValues(jsi::Runtime& rt, Tag nodeTag);

  void dropAnimatedNode(jsi::Runtime& rt, Tag tag);

  void addAnimatedEventToView(
      jsi::Runtime& rt,
      Tag viewTag,
      const std::string& eventName,
      jsi::Object eventMapping);

  void removeAnimatedEventFromView(
      jsi::Runtime& rt,
      Tag viewTag,
      const std::string& eventName,
      Tag animatedNodeTag);

  void addListener(jsi::Runtime& rt, const std::string& eventName);

  void removeListeners(jsi::Runtime& rt, int count);

  void queueAndExecuteBatchedOperations(
      jsi::Runtime& rt,
      jsi::Array operationsAndArgs);

  void scheduleOperationOnUI(Operation&& fn) {
    if (nodesManager_) {
      nodesManager_->scheduleOnUI(
          [fn = std::move(fn),
           weakNodesManager =
               std::weak_ptr<NativeAnimatedNodesManager>(nodesManager_)]() {
            if (auto nodesManager = weakNodesManager.lock()) {
              fn(*nodesManager);
            }
          });
    }
  }

 protected:
  std::shared_ptr<NativeAnimatedNodesManagerProvider> nodesManagerProvider_;

 private:
  std::shared_ptr<NativeAnimatedNodesManager> nodesManager_;
  std::vector<Operation> preOperations_;
  std::vector<Operation> operations_;

  void addOperation(Operation&& operation, bool preOperation = false);

  void installJSIBindingsWithRuntime(jsi::Runtime& runtime) override;
};

} // namespace facebook::react
