/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimatedModule.h"

#include <glog/logging.h>
#include <jsi/JSIDynamic.h>

namespace facebook::react {

AnimatedModule::AnimatedModule(
    std::shared_ptr<CallInvoker> jsInvoker,
    std::shared_ptr<NativeAnimatedNodesManagerProvider> nodesManagerProvider)
    : NativeAnimatedModuleCxxSpec(jsInvoker),
      nodesManagerProvider_(std::move(nodesManagerProvider)) {}

void AnimatedModule::startOperationBatch(jsi::Runtime& /*rt*/) {}

void AnimatedModule::finishOperationBatch(jsi::Runtime& /*rt*/) {
  // No mutex needed, operations only added via TurboModule method invocation
  std::vector<Operation> preOperations;
  std::vector<Operation> operations;
  std::swap(preOperations_, preOperations);
  std::swap(operations_, operations);

  if (nodesManager_) {
    // TODO: nodesManager_ must exist at all times. But without this check
    // AnimatedProps-itest.js fails.
    nodesManager_->scheduleOnUI([this,
                                 preOperations = std::move(preOperations),
                                 operations = std::move(operations)]() {
      for (auto& preOperation : preOperations) {
        executeOperation(preOperation);
      }
      for (auto& operation : operations) {
        executeOperation(operation);
      }
    });
  }
}

void AnimatedModule::createAnimatedNode(
    jsi::Runtime& rt,
    Tag tag,
    jsi::Object config) {
  auto configDynamic = dynamicFromValue(rt, jsi::Value(rt, config));
  operations_.emplace_back(
      CreateAnimatedNodeOp{.tag = tag, .config = std::move(configDynamic)});
}

void AnimatedModule::updateAnimatedNodeConfig(
    jsi::Runtime& rt,
    Tag tag,
    jsi::Object config) {
  // TODO(T196513045): missing implementation
}

void AnimatedModule::getValue(
    jsi::Runtime& /*rt*/,
    Tag tag,
    AsyncCallback<double> saveValueCallback) {
  operations_.emplace_back(
      GetValueOp{.tag = tag, .callback = std::move(saveValueCallback)});
}

void AnimatedModule::startListeningToAnimatedNodeValue(
    jsi::Runtime& /*rt*/,
    Tag tag) {
  operations_.emplace_back(StartListeningToAnimatedNodeValueOp{tag});
}

void AnimatedModule::stopListeningToAnimatedNodeValue(
    jsi::Runtime& /*rt*/,
    Tag tag) {
  operations_.emplace_back(StopListeningToAnimatedNodeValueOp{tag});
}

void AnimatedModule::connectAnimatedNodes(
    jsi::Runtime& /*rt*/,
    Tag parentTag,
    Tag childTag) {
  operations_.emplace_back(
      ConnectAnimatedNodesOp{.parentTag = parentTag, .childTag = childTag});
}

void AnimatedModule::disconnectAnimatedNodes(
    jsi::Runtime& /*rt*/,
    Tag parentTag,
    Tag childTag) {
  operations_.emplace_back(
      DisconnectAnimatedNodesOp{.parentTag = parentTag, .childTag = childTag});
}

void AnimatedModule::startAnimatingNode(
    jsi::Runtime& rt,
    int animationId,
    Tag nodeTag,
    jsi::Object config,
    AnimationEndCallback endCallback) {
  auto configDynamic = dynamicFromValue(rt, jsi::Value(rt, config));
  operations_.emplace_back(StartAnimatingNodeOp{
      .animationId = animationId,
      .nodeTag = nodeTag,
      .config = std::move(configDynamic),
      .endCallback = std::move(endCallback)});
}

void AnimatedModule::stopAnimation(jsi::Runtime& /*rt*/, int animationId) {
  operations_.emplace_back(StopAnimationOp{animationId});
}

void AnimatedModule::setAnimatedNodeValue(
    jsi::Runtime& /*rt*/,
    Tag nodeTag,
    double value) {
  operations_.emplace_back(SetAnimatedNodeValueOp{nodeTag, value});
}

void AnimatedModule::setAnimatedNodeOffset(
    jsi::Runtime& /*rt*/,
    Tag /*nodeTag*/,
    double /*offset*/) {
  // TODO(T196512946): missing implementation
}

void AnimatedModule::flattenAnimatedNodeOffset(
    jsi::Runtime& /*rt*/,
    Tag /*nodeTag*/) {
  // TODO(T196512986): missing implementation
}

void AnimatedModule::extractAnimatedNodeOffset(
    jsi::Runtime& /*rt*/,
    Tag /*nodeTag*/) {
  // TODO(T196513004): missing implementation
}

void AnimatedModule::connectAnimatedNodeToView(
    jsi::Runtime& /*rt*/,
    Tag nodeTag,
    Tag viewTag) {
  operations_.emplace_back(ConnectAnimatedNodeToViewOp{nodeTag, viewTag});
}

void AnimatedModule::disconnectAnimatedNodeFromView(
    jsi::Runtime& /*rt*/,
    Tag nodeTag,
    Tag viewTag) {
  operations_.emplace_back(DisconnectAnimatedNodeFromViewOp{nodeTag, viewTag});
}

void AnimatedModule::restoreDefaultValues(jsi::Runtime& /*rt*/, Tag nodeTag) {
  preOperations_.emplace_back(RestoreDefaultValuesOp{nodeTag});
}

void AnimatedModule::dropAnimatedNode(jsi::Runtime& /*rt*/, Tag tag) {
  operations_.emplace_back(DropAnimatedNodeOp{tag});
}

void AnimatedModule::addAnimatedEventToView(
    jsi::Runtime& rt,
    Tag viewTag,
    std::string eventName,
    jsi::Object eventMapping) {
  auto eventMappingDynamic = dynamicFromValue(rt, jsi::Value(rt, eventMapping));
  operations_.emplace_back(AddAnimatedEventToViewOp{
      .viewTag = viewTag,
      .eventName = std::move(eventName),
      .eventMapping = std::move(eventMappingDynamic)});
}

void AnimatedModule::removeAnimatedEventFromView(
    jsi::Runtime& /*rt*/,
    Tag viewTag,
    std::string eventName,
    Tag animatedNodeTag) {
  operations_.emplace_back(RemoveAnimatedEventFromViewOp{
      .viewTag = viewTag,
      .eventName = std::move(eventName),
      .animatedNodeTag = animatedNodeTag});
}

void AnimatedModule::addListener(
    jsi::Runtime& /*rt*/,
    const std::string& /*eventName*/) {
  // TODO(T225953415): missing implementation
}

void AnimatedModule::removeListeners(jsi::Runtime& /*rt*/, int /*count*/) {
  // TODO(T225953457): missing implementation
}

void AnimatedModule::queueAndExecuteBatchedOperations(
    jsi::Runtime& /*rt*/,
    jsi::Array /*operationsAndArgs*/) {
  // TODO(T225953475): missing implementation
}

void AnimatedModule::executeOperation(const Operation& operation) {
  std::visit(
      [&](const auto& op) {
        using T = std::decay_t<decltype(op)>;

        if constexpr (std::is_same_v<T, CreateAnimatedNodeOp>) {
          nodesManager_->createAnimatedNode(op.tag, op.config);
        } else if constexpr (std::is_same_v<T, GetValueOp>) {
          auto animValue = nodesManager_->getValue(op.tag);
          if (animValue) {
            op.callback.call(animValue.value());
          }
        } else if constexpr (std::is_same_v<
                                 T,
                                 StartListeningToAnimatedNodeValueOp>) {
          nodesManager_->startListeningToAnimatedNodeValue(
              op.tag, [this, tag = op.tag](double value) {
                emitDeviceEvent(
                    "onAnimatedValueUpdate",
                    [tag, value](
                        jsi::Runtime& rt, std::vector<jsi::Value>& args) {
                      auto arg = jsi::Object(rt);
                      arg.setProperty(rt, "tag", jsi::Value(tag));
                      arg.setProperty(rt, "value", jsi::Value(value));
                      args.emplace_back(rt, arg);
                    });
              });
        } else if constexpr (std::is_same_v<
                                 T,
                                 StopListeningToAnimatedNodeValueOp>) {
          nodesManager_->stopListeningToAnimatedNodeValue(op.tag);
        } else if constexpr (std::is_same_v<T, ConnectAnimatedNodesOp>) {
          nodesManager_->connectAnimatedNodes(op.parentTag, op.childTag);
        } else if constexpr (std::is_same_v<T, DisconnectAnimatedNodesOp>) {
          nodesManager_->disconnectAnimatedNodes(op.parentTag, op.childTag);
        } else if constexpr (std::is_same_v<T, StartAnimatingNodeOp>) {
          nodesManager_->startAnimatingNode(
              op.animationId, op.nodeTag, op.config, op.endCallback);
        } else if constexpr (std::is_same_v<T, StopAnimationOp>) {
          nodesManager_->stopAnimation(op.animationId, false);
        } else if constexpr (std::is_same_v<T, SetAnimatedNodeValueOp>) {
          nodesManager_->setAnimatedNodeValue(op.nodeTag, op.value);
        } else if constexpr (std::is_same_v<T, ConnectAnimatedNodeToViewOp>) {
          nodesManager_->connectAnimatedNodeToView(op.nodeTag, op.viewTag);
        } else if constexpr (std::is_same_v<
                                 T,
                                 DisconnectAnimatedNodeFromViewOp>) {
          nodesManager_->disconnectAnimatedNodeFromView(op.nodeTag, op.viewTag);
        } else if constexpr (std::is_same_v<T, RestoreDefaultValuesOp>) {
          nodesManager_->restoreDefaultValues(op.nodeTag);
        } else if constexpr (std::is_same_v<T, DropAnimatedNodeOp>) {
          nodesManager_->dropAnimatedNode(op.tag);
        } else if constexpr (std::is_same_v<T, AddAnimatedEventToViewOp>) {
          nodesManager_->addAnimatedEventToView(
              op.viewTag, op.eventName, op.eventMapping);
        } else if constexpr (std::is_same_v<T, RemoveAnimatedEventFromViewOp>) {
          nodesManager_->removeAnimatedEventFromView(
              op.viewTag, op.eventName, op.animatedNodeTag);
        }
      },
      operation);
}

void AnimatedModule::installJSIBindingsWithRuntime(jsi::Runtime& runtime) {
  if (nodesManagerProvider_) {
    nodesManager_ = nodesManagerProvider_->getOrCreate(runtime);
  }
}

} // namespace facebook::react
