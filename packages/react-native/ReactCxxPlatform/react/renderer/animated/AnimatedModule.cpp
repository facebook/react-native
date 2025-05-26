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
  scheduleOperationOnUI([preOperations = std::move(preOperations),
                         operations = std::move(operations)](
                            NativeAnimatedNodesManager& nodesManager) {
    for (auto& preOperation : preOperations) {
      preOperation(nodesManager);
    }

    for (auto& operation : operations) {
      operation(nodesManager);
    }
  });
}

void AnimatedModule::createAnimatedNode(
    jsi::Runtime& rt,
    Tag tag,
    jsi::Object config) {
  auto configDynamic = dynamicFromValue(rt, jsi::Value(rt, config));
  addOperation([tag, configDynamic = std::move(configDynamic)](
                   NativeAnimatedNodesManager& nodesManager) {
    nodesManager.createAnimatedNode(tag, configDynamic);
  });
}

void AnimatedModule::updateAnimatedNodeConfig(
    jsi::Runtime& rt,
    Tag tag,
    jsi::Object config) {
  // TODO: missing implementation
}

void AnimatedModule::getValue(
    jsi::Runtime& /*rt*/,
    Tag tag,
    const AsyncCallback<double>& saveValueCallback) {
  addOperation([tag,
                saveValueCallback,
                weakJsInvoker = std::weak_ptr<CallInvoker>(jsInvoker_)](
                   NativeAnimatedNodesManager& nodesManager) {
    auto animValue = nodesManager.getValue(tag);
    auto jsInvoker = weakJsInvoker.lock();
    if (animValue && jsInvoker) {
      jsInvoker->invokeAsync(
          [animValue, saveValueCallback = saveValueCallback]() {
            saveValueCallback.call(animValue.value());
          });
    };
  });
}

void AnimatedModule::startListeningToAnimatedNodeValue(
    jsi::Runtime& /*rt*/,
    Tag tag) {
  addOperation([tag, weakThis = weak_from_this()](
                   NativeAnimatedNodesManager& nodesManager) {
    nodesManager.startListeningToAnimatedNodeValue(
        tag, [weakThis, tag](double value) {
          if (auto strongThis = weakThis.lock()) {
            strongThis->emitDeviceEvent(
                "onAnimatedValueUpdate",
                [tag, value](jsi::Runtime& rt, std::vector<jsi::Value>& args) {
                  auto arg = jsi::Object(rt);
                  arg.setProperty(rt, "tag", jsi::Value(tag));
                  arg.setProperty(rt, "value", jsi::Value(value));
                  args.emplace_back(rt, arg);
                });
          }
        });
  });
}

void AnimatedModule::stopListeningToAnimatedNodeValue(
    jsi::Runtime& /*rt*/,
    Tag tag) {
  addOperation([tag](NativeAnimatedNodesManager& nodesManager) {
    nodesManager.stopListeningToAnimatedNodeValue(tag);
  });
}

void AnimatedModule::connectAnimatedNodes(
    jsi::Runtime& /*rt*/,
    Tag parentTag,
    Tag childTag) {
  addOperation([parentTag, childTag](NativeAnimatedNodesManager& nodesManager) {
    nodesManager.connectAnimatedNodes(parentTag, childTag);
  });
}

void AnimatedModule::disconnectAnimatedNodes(
    jsi::Runtime& /*rt*/,
    Tag parentTag,
    Tag childTag) {
  addOperation([parentTag, childTag](NativeAnimatedNodesManager& nodesManager) {
    nodesManager.disconnectAnimatedNodes(parentTag, childTag);
  });
}

void AnimatedModule::startAnimatingNode(
    jsi::Runtime& rt,
    int animationId,
    Tag nodeTag,
    jsi::Object config,
    AnimationEndCallback endCallback) {
  auto configDynamic = dynamicFromValue(rt, jsi::Value(rt, config));
  addOperation([animationId,
                nodeTag,
                configDynamic = std::move(configDynamic),
                endCallback = std::move(endCallback)](
                   NativeAnimatedNodesManager& nodesManager) {
    nodesManager.startAnimatingNode(
        animationId, nodeTag, configDynamic, endCallback);
  });
}

void AnimatedModule::stopAnimation(jsi::Runtime& /*rt*/, int animationId) {
  addOperation([animationId](NativeAnimatedNodesManager& nodesManager) {
    nodesManager.stopAnimation(
        animationId, false /* TODO: isTrackingAnimation */);
  });
}

void AnimatedModule::setAnimatedNodeValue(
    jsi::Runtime& /*rt*/,
    Tag nodeTag,
    double value) {
  addOperation([nodeTag, value](NativeAnimatedNodesManager& nodesManager) {
    nodesManager.setAnimatedNodeValue(nodeTag, value);
  });
}

void AnimatedModule::setAnimatedNodeOffset(
    jsi::Runtime& /*rt*/,
    Tag nodeTag,
    double offset) {
  // TODO: missing implementation
}

void AnimatedModule::flattenAnimatedNodeOffset(
    jsi::Runtime& /*rt*/,
    Tag nodeTag) {
  // TODO: missing implementation
}

void AnimatedModule::extractAnimatedNodeOffset(
    jsi::Runtime& /*rt*/,
    Tag nodeTag) {
  // TODO: missing implementation
}

void AnimatedModule::connectAnimatedNodeToView(
    jsi::Runtime& /*rt*/,
    Tag nodeTag,
    Tag viewTag) {
  addOperation([nodeTag, viewTag](NativeAnimatedNodesManager& nodesManager) {
    nodesManager.connectAnimatedNodeToView(nodeTag, viewTag);
  });
}

void AnimatedModule::disconnectAnimatedNodeFromView(
    jsi::Runtime& /*rt*/,
    Tag nodeTag,
    Tag viewTag) {
  addOperation([nodeTag, viewTag](NativeAnimatedNodesManager& nodesManager) {
    nodesManager.disconnectAnimatedNodeFromView(nodeTag, viewTag);
  });
}

void AnimatedModule::restoreDefaultValues(jsi::Runtime& /*rt*/, Tag nodeTag) {
  addOperation(
      [nodeTag](NativeAnimatedNodesManager& nodesManager) {
        nodesManager.restoreDefaultValues(nodeTag);
      },
      /* preOperation = */ true);
}

void AnimatedModule::dropAnimatedNode(jsi::Runtime& /*rt*/, Tag tag) {
  addOperation([tag](NativeAnimatedNodesManager& nodesManager) {
    nodesManager.dropAnimatedNode(tag);
  });
}

void AnimatedModule::addAnimatedEventToView(
    jsi::Runtime& rt,
    Tag viewTag,
    const std::string& eventName,
    jsi::Object eventMapping) {
  auto eventMappingDynamic = dynamicFromValue(rt, jsi::Value(rt, eventMapping));
  addOperation([viewTag, eventName, eventMappingDynamic](
                   NativeAnimatedNodesManager& nodesManager) {
    nodesManager.addAnimatedEventToView(
        viewTag, eventName, eventMappingDynamic);
  });
}

void AnimatedModule::removeAnimatedEventFromView(
    jsi::Runtime& /*rt*/,
    Tag viewTag,
    const std::string& eventName,
    Tag animatedNodeTag) {
  addOperation([viewTag, eventName, animatedNodeTag](
                   NativeAnimatedNodesManager& nodesManager) {
    nodesManager.removeAnimatedEventFromView(
        viewTag, eventName, animatedNodeTag);
  });
}

void AnimatedModule::addListener(
    jsi::Runtime& rt,
    const std::string& eventName) {}

void AnimatedModule::removeListeners(jsi::Runtime& rt, int count) {}

void AnimatedModule::queueAndExecuteBatchedOperations(
    jsi::Runtime& rt,
    jsi::Array operationsAndArgs) {}

void AnimatedModule::addOperation(Operation&& operation, bool preOperation) {
  // No mutex needed, operations only added via TurboModule method invocation
  auto& queue = preOperation ? preOperations_ : operations_;
  queue.push_back(std::move(operation));
}

void AnimatedModule::installJSIBindingsWithRuntime(jsi::Runtime& runtime) {
  if (nodesManagerProvider_) {
    nodesManager_ = nodesManagerProvider_->getOrCreate(runtime);
  }
}

} // namespace facebook::react
