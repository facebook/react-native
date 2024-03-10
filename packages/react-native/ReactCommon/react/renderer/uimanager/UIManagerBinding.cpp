/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UIManagerBinding.h"

#include <glog/logging.h>
#include <jsi/JSIDynamic.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/components/view/PointerEvent.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/debug/SystraceSection.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>
#include <react/renderer/uimanager/primitives.h>

#include <utility>

#include "bindingUtils.h"

namespace facebook::react {

void UIManagerBinding::createAndInstallIfNeeded(
    jsi::Runtime& runtime,
    const std::shared_ptr<UIManager>& uiManager) {
  auto uiManagerModuleName = "nativeFabricUIManager";

  auto uiManagerValue =
      runtime.global().getProperty(runtime, uiManagerModuleName);
  if (uiManagerValue.isUndefined()) {
    // The global namespace does not have an instance of the binding;
    // we need to create, install and return it.
    auto uiManagerBinding = std::make_shared<UIManagerBinding>(uiManager);
    auto object = jsi::Object::createFromHostObject(runtime, uiManagerBinding);
    runtime.global().setProperty(
        runtime, uiManagerModuleName, std::move(object));
  }
}

std::shared_ptr<UIManagerBinding> UIManagerBinding::getBinding(
    jsi::Runtime& runtime) {
  auto uiManagerModuleName = "nativeFabricUIManager";

  auto uiManagerValue =
      runtime.global().getProperty(runtime, uiManagerModuleName);
  if (uiManagerValue.isUndefined()) {
    return nullptr;
  }

  auto uiManagerObject = uiManagerValue.asObject(runtime);
  return uiManagerObject.getHostObject<UIManagerBinding>(runtime);
}

UIManagerBinding::UIManagerBinding(std::shared_ptr<UIManager> uiManager)
    : uiManager_(std::move(uiManager)) {}

UIManagerBinding::~UIManagerBinding() {
  LOG(WARNING) << "UIManagerBinding::~UIManagerBinding() was called (address: "
               << this << ").";
}

jsi::Value UIManagerBinding::getInspectorDataForInstance(
    jsi::Runtime& runtime,
    const EventEmitter& eventEmitter) const {
  auto eventTarget = eventEmitter.eventTarget_;
  EventEmitter::DispatchMutex().lock();

  if (!runtime.global().hasProperty(runtime, "__fbBatchedBridge") ||
      !eventTarget) {
    return jsi::Value::undefined();
  }

  eventTarget->retain(runtime);
  auto instanceHandle = eventTarget->getInstanceHandle(runtime);
  eventTarget->release(runtime);
  EventEmitter::DispatchMutex().unlock();

  if (instanceHandle.isUndefined()) {
    return jsi::Value::undefined();
  }

  return callMethodOfModule(
      runtime,
      "ReactFabric",
      "getInspectorDataForInstance",
      {std::move(instanceHandle)});
}

void UIManagerBinding::dispatchEvent(
    jsi::Runtime& runtime,
    const EventTarget* eventTarget,
    const std::string& type,
    ReactEventPriority priority,
    const EventPayload& eventPayload) const {
  SystraceSection s("UIManagerBinding::dispatchEvent", "type", type);

  if (eventPayload.getType() == EventPayloadType::PointerEvent) {
    auto pointerEvent = static_cast<const PointerEvent&>(eventPayload);
    auto dispatchCallback = [this, &runtime](
                                const ShadowNode& targetNode,
                                const std::string& type,
                                ReactEventPriority priority,
                                const EventPayload& eventPayload) {
      auto eventTarget = targetNode.getEventEmitter()->getEventTarget();
      if (eventTarget != nullptr) {
        eventTarget->retain(runtime);
        this->dispatchEventToJS(
            runtime, eventTarget.get(), type, priority, eventPayload);
        eventTarget->release(runtime);
      }
    };
    auto targetNode = PointerEventsProcessor::getShadowNodeFromEventTarget(
        runtime, eventTarget);
    if (targetNode != nullptr) {
      pointerEventsProcessor_.interceptPointerEvent(
          targetNode,
          type,
          priority,
          pointerEvent,
          dispatchCallback,
          *uiManager_);
    }
  } else {
    dispatchEventToJS(runtime, eventTarget, type, priority, eventPayload);
  }
}

void UIManagerBinding::dispatchEventToJS(
    jsi::Runtime& runtime,
    const EventTarget* eventTarget,
    const std::string& type,
    ReactEventPriority priority,
    const EventPayload& eventPayload) const {
  auto payload = eventPayload.asJSIValue(runtime);

  // If a payload is null, the factory has decided to cancel the event
  if (payload.isNull()) {
    return;
  }

  auto instanceHandle = eventTarget != nullptr
    ? [&]() {
      auto instanceHandle = eventTarget->getInstanceHandle(runtime);
      if (instanceHandle.isUndefined()) {
        return jsi::Value::null();
      }

      // Mixing `target` into `payload`.
      if (!payload.isObject()) {
        LOG(ERROR) << "payload for dispatchEvent is not an object: " << eventTarget->getTag();
      }
      react_native_assert(payload.isObject());
      payload.asObject(runtime).setProperty(runtime, "target", eventTarget->getTag());
      return instanceHandle;
    }()
    : jsi::Value::null();

  if (instanceHandle.isNull()) {
    LOG(WARNING) << "instanceHandle is null, event will be dropped";
  }

  currentEventPriority_ = priority;
  if (eventHandler_) {
    eventHandler_->call(
        runtime,
        std::move(instanceHandle),
        jsi::String::createFromUtf8(runtime, type),
        std::move(payload));
  }
  currentEventPriority_ = ReactEventPriority::Default;
}

void UIManagerBinding::invalidate() const {
  uiManager_->setDelegate(nullptr);
}

static void validateArgumentCount(
    jsi::Runtime& runtime,
    const std::string& methodName,
    size_t expected,
    size_t actual) {
  if (actual < expected) {
    throw jsi::JSError(
        runtime,
        methodName + " requires " + std::to_string(expected) +
            " arguments, but only " + std::to_string(actual) + " were passed");
  }
}

jsi::Value UIManagerBinding::get(
    jsi::Runtime& runtime,
    const jsi::PropNameID& name) {
  auto methodName = name.utf8(runtime);
  SystraceSection s("UIManagerBinding::get", "name", methodName);

  // Convert shared_ptr<UIManager> to a raw ptr
  // Why? Because:
  // 1) UIManagerBinding strongly retains UIManager. The JS VM
  //    strongly retains UIManagerBinding (through the JSI).
  //    These functions are JSI functions and are only called via
  //    the JS VM; if the JS VM is torn down, those functions can't
  //    execute and these lambdas won't execute.
  // 2) The UIManager is only deallocated when all references to it
  //    are deallocated, including the UIManagerBinding. That only
  //    happens when the JS VM is deallocated. So, the raw pointer
  //    is safe.
  //
  // Even if it's safe, why not just use shared_ptr anyway as
  //  extra insurance?
  // 1) Using shared_ptr or weak_ptr when they're not needed is
  //    a pessimisation. It's more instructions executed without
  //    any additional value in this case.
  // 2) How and when exactly these lambdas is deallocated is
  //    complex. Adding shared_ptr to them which causes the UIManager
  //    to potentially live longer is unnecessary, complicated cognitive
  //    overhead.
  // 3) There is a strong suspicion that retaining UIManager from
  //    these C++ lambdas, which are retained by an object that is held onto
  //    by the JSI, caused some crashes upon deallocation of the
  //    Scheduler and JS VM. This could happen if, for instance, C++
  //    semantics cause these lambda to not be deallocated until
  //    a CPU tick (or more) after the JS VM is deallocated.
  UIManager* uiManager = uiManager_.get();

  // Semantic: Creates a new node with given pieces.
  if (methodName == "createNode") {
    auto paramCount = 5;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          try {
            validateArgumentCount(runtime, methodName, paramCount, count);

            auto instanceHandle =
                instanceHandleFromValue(runtime, arguments[4], arguments[0]);
            if (!instanceHandle) {
              react_native_assert(false);
              return jsi::Value::undefined();
            }

            return valueFromShadowNode(
                runtime,
                uiManager->createNode(
                    tagFromValue(arguments[0]),
                    stringFromValue(runtime, arguments[1]),
                    surfaceIdFromValue(runtime, arguments[2]),
                    RawProps(runtime, arguments[3]),
                    std::move(instanceHandle)));
          } catch (const std::logic_error& ex) {
            LOG(FATAL) << "logic_error in createNode: " << ex.what();
          }
        });
  }

  // Semantic: Clones the node with *same* props and *same* children.
  if (methodName == "cloneNode") {
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          return valueFromShadowNode(
              runtime,
              uiManager->cloneNode(
                  *shadowNodeFromValue(runtime, arguments[0]),
                  nullptr,
                  RawProps()));
        });
  }

  if (methodName == "setIsJSResponder") {
    auto paramCount = 3;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          uiManager->setIsJSResponder(
              shadowNodeFromValue(runtime, arguments[0]),
              arguments[1].getBool(),
              arguments[2].getBool());

          return jsi::Value::undefined();
        });
  }

  if (methodName == "findNodeAtPoint") {
    auto paramCount = 4;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto node = shadowNodeFromValue(runtime, arguments[0]);
          auto locationX = (Float)arguments[1].getNumber();
          auto locationY = (Float)arguments[2].getNumber();
          auto onSuccessFunction =
              arguments[3].getObject(runtime).getFunction(runtime);
          auto targetNode =
              uiManager->findNodeAtPoint(node, Point{locationX, locationY});

          if (!targetNode) {
            onSuccessFunction.call(runtime, jsi::Value::null());
            return jsi::Value::undefined();
          }

          auto& eventTarget = targetNode->getEventEmitter()->eventTarget_;

          EventEmitter::DispatchMutex().lock();
          eventTarget->retain(runtime);
          auto instanceHandle = eventTarget->getInstanceHandle(runtime);
          eventTarget->release(runtime);
          EventEmitter::DispatchMutex().unlock();

          onSuccessFunction.call(runtime, std::move(instanceHandle));
          return jsi::Value::undefined();
        });
  }

  // Semantic: Clones the node with *same* props and *given* children.
  if (methodName == "cloneNodeWithNewChildren") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          // TODO: re-enable when passChildrenWhenCloningPersistedNodes is
          // rolled out
          // validateArgumentCount(runtime, methodName, paramCount, count);

          return valueFromShadowNode(
              runtime,
              uiManager->cloneNode(
                  *shadowNodeFromValue(runtime, arguments[0]),
                  count > 1 ? shadowNodeListFromValue(runtime, arguments[1])
                            : ShadowNode::emptySharedShadowNodeSharedList(),
                  RawProps()));
        });
  }

  // Semantic: Clones the node with *given* props and *same* children.
  if (methodName == "cloneNodeWithNewProps") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          return valueFromShadowNode(
              runtime,
              uiManager->cloneNode(
                  *shadowNodeFromValue(runtime, arguments[0]),
                  nullptr,
                  RawProps(runtime, arguments[1])));
        });
  }

  // Semantic: Clones the node with *given* props and *given* children.
  if (methodName == "cloneNodeWithNewChildrenAndProps") {
    auto paramCount = 3;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          // TODO: re-enable when passChildrenWhenCloningPersistedNodes is
          // rolled out
          // validateArgumentCount(runtime, methodName, paramCount, count);

          bool hasChildrenArg = count == 3;
          return valueFromShadowNode(
              runtime,
              uiManager->cloneNode(
                  *shadowNodeFromValue(runtime, arguments[0]),
                  hasChildrenArg
                      ? shadowNodeListFromValue(runtime, arguments[1])
                      : ShadowNode::emptySharedShadowNodeSharedList(),
                  RawProps(runtime, arguments[hasChildrenArg ? 2 : 1])));
        });
  }

  if (methodName == "appendChild") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          uiManager->appendChild(
              shadowNodeFromValue(runtime, arguments[0]),
              shadowNodeFromValue(runtime, arguments[1]));
          return jsi::Value::undefined();
        });
  }

  // TODO: remove when passChildrenWhenCloningPersistedNodes is rolled out
  if (methodName == "createChildSet") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        0,
        [](jsi::Runtime& runtime,
           const jsi::Value& /*thisValue*/,
           const jsi::Value* /*arguments*/,
           size_t /*count*/) -> jsi::Value {
          auto shadowNodeList = std::make_shared<ShadowNode::ListOfShared>(
              ShadowNode::ListOfShared({}));
          return valueFromShadowNodeList(runtime, shadowNodeList);
        });
  }

  // TODO: remove when passChildrenWhenCloningPersistedNodes is rolled out
  if (methodName == "appendChildToSet") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNodeList = shadowNodeListFromValue(runtime, arguments[0]);
          auto shadowNode = shadowNodeFromValue(runtime, arguments[1]);
          shadowNodeList->push_back(shadowNode);
          return jsi::Value::undefined();
        });
  }

  if (methodName == "completeRoot") {
    auto paramCount = 2;
    std::weak_ptr<UIManager> weakUIManager = uiManager_;
    // Enhanced version of the method that uses `backgroundExecutor` and
    // captures a shared pointer to `UIManager`.
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [weakUIManager, uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto runtimeSchedulerBinding =
              RuntimeSchedulerBinding::getBinding(runtime);
          auto surfaceId = surfaceIdFromValue(runtime, arguments[0]);

          if (!uiManager->backgroundExecutor_ ||
              (runtimeSchedulerBinding &&
               runtimeSchedulerBinding->getIsSynchronous())) {
            auto shadowNodeList =
                shadowNodeListFromValue(runtime, arguments[1]);
            uiManager->completeSurface(
                surfaceId,
                shadowNodeList,
                {.enableStateReconciliation = true,
                 .mountSynchronously = false,
                 .shouldYield = nullptr});
          } else {
            auto weakShadowNodeList =
                weakShadowNodeListFromValue(runtime, arguments[1]);
            static std::atomic_uint_fast8_t completeRootEventCounter{0};
            static std::atomic_uint_fast32_t mostRecentSurfaceId{0};
            completeRootEventCounter += 1;
            mostRecentSurfaceId = surfaceId;
            uiManager->backgroundExecutor_(
                [weakUIManager,
                 weakShadowNodeList,
                 surfaceId,
                 eventCount = completeRootEventCounter.load()] {
                  auto shouldYield = [=]() -> bool {
                    // If `completeRootEventCounter` was incremented, another
                    // `completeSurface` call has been scheduled and current
                    // `completeSurface` should yield to it.
                    return completeRootEventCounter > eventCount &&
                        mostRecentSurfaceId == surfaceId;
                  };
                  auto shadowNodeList =
                      shadowNodeListFromWeakList(weakShadowNodeList);
                  auto strongUIManager = weakUIManager.lock();
                  if (shadowNodeList && strongUIManager) {
                    strongUIManager->completeSurface(
                        surfaceId,
                        shadowNodeList,
                        {/* .enableStateReconciliation = */ true,
                         /* .mountSynchronously = */ false,
                         /* .shouldYield = */ shouldYield});
                  }
                });
          }

          return jsi::Value::undefined();
        });
  }

  if (methodName == "registerEventHandler") {
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [this, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto eventHandler =
              arguments[0].getObject(runtime).getFunction(runtime);
          eventHandler_ =
              std::make_unique<jsi::Function>(std::move(eventHandler));
          return jsi::Value::undefined();
        });
  }

  if (methodName == "getRelativeLayoutMetrics") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto layoutMetrics = uiManager->getRelativeLayoutMetrics(
              *shadowNodeFromValue(runtime, arguments[0]),
              shadowNodeFromValue(runtime, arguments[1]).get(),
              {/* .includeTransform = */ true});
          auto frame = layoutMetrics.frame;
          auto result = jsi::Object(runtime);
          result.setProperty(runtime, "left", frame.origin.x);
          result.setProperty(runtime, "top", frame.origin.y);
          result.setProperty(runtime, "width", frame.size.width);
          result.setProperty(runtime, "height", frame.size.height);
          return result;
        });
  }

  if (methodName == "dispatchCommand") {
    auto paramCount = 3;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);
          if (shadowNode) {
            uiManager->dispatchCommand(
                shadowNode,
                stringFromValue(runtime, arguments[1]),
                commandArgsFromValue(runtime, arguments[2]));
          }
          return jsi::Value::undefined();
        });
  }

  if (methodName == "setNativeProps") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value&,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          uiManager->setNativeProps_DEPRECATED(
              shadowNodeFromValue(runtime, arguments[0]),
              RawProps(runtime, arguments[1]));

          return jsi::Value::undefined();
        });
  }

  // Legacy API
  if (methodName == "measureLayout") {
    auto paramCount = 4;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto layoutMetrics = uiManager->getRelativeLayoutMetrics(
              *shadowNodeFromValue(runtime, arguments[0]),
              shadowNodeFromValue(runtime, arguments[1]).get(),
              {/* .includeTransform = */ false});

          if (layoutMetrics == EmptyLayoutMetrics) {
            auto onFailFunction =
                arguments[2].getObject(runtime).getFunction(runtime);
            onFailFunction.call(runtime);
            return jsi::Value::undefined();
          }

          auto onSuccessFunction =
              arguments[3].getObject(runtime).getFunction(runtime);
          auto frame = layoutMetrics.frame;

          onSuccessFunction.call(
              runtime,
              {jsi::Value{runtime, (double)frame.origin.x},
               jsi::Value{runtime, (double)frame.origin.y},
               jsi::Value{runtime, (double)frame.size.width},
               jsi::Value{runtime, (double)frame.size.height}});
          return jsi::Value::undefined();
        });
  }

  if (methodName == "measure") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);
          auto layoutMetrics = uiManager->getRelativeLayoutMetrics(
              *shadowNode, nullptr, {/* .includeTransform = */ true});
          auto onSuccessFunction =
              arguments[1].getObject(runtime).getFunction(runtime);

          if (layoutMetrics == EmptyLayoutMetrics) {
            onSuccessFunction.call(runtime, {0, 0, 0, 0, 0, 0});
            return jsi::Value::undefined();
          }
          auto newestCloneOfShadowNode =
              uiManager->getNewestCloneOfShadowNode(*shadowNode);

          auto layoutableShadowNode = dynamic_cast<const LayoutableShadowNode*>(
              newestCloneOfShadowNode.get());
          Point originRelativeToParent = layoutableShadowNode != nullptr
              ? layoutableShadowNode->getLayoutMetrics().frame.origin
              : Point();

          auto frame = layoutMetrics.frame;
          onSuccessFunction.call(
              runtime,
              {jsi::Value{runtime, (double)originRelativeToParent.x},
               jsi::Value{runtime, (double)originRelativeToParent.y},
               jsi::Value{runtime, (double)frame.size.width},
               jsi::Value{runtime, (double)frame.size.height},
               jsi::Value{runtime, (double)frame.origin.x},
               jsi::Value{runtime, (double)frame.origin.y}});
          return jsi::Value::undefined();
        });
  }

  if (methodName == "measureInWindow") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto layoutMetrics = uiManager->getRelativeLayoutMetrics(
              *shadowNodeFromValue(runtime, arguments[0]),
              nullptr,
              {/* .includeTransform = */ true,
               /* .includeViewportOffset = */ true});

          auto onSuccessFunction =
              arguments[1].getObject(runtime).getFunction(runtime);

          if (layoutMetrics == EmptyLayoutMetrics) {
            onSuccessFunction.call(runtime, {0, 0, 0, 0});
            return jsi::Value::undefined();
          }

          auto frame = layoutMetrics.frame;
          onSuccessFunction.call(
              runtime,
              {jsi::Value{runtime, (double)frame.origin.x},
               jsi::Value{runtime, (double)frame.origin.y},
               jsi::Value{runtime, (double)frame.size.width},
               jsi::Value{runtime, (double)frame.size.height}});
          return jsi::Value::undefined();
        });
  }

  if (methodName == "sendAccessibilityEvent") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          uiManager->sendAccessibilityEvent(
              shadowNodeFromValue(runtime, arguments[0]),
              stringFromValue(runtime, arguments[1]));

          return jsi::Value::undefined();
        });
  }

  if (methodName == "configureNextLayoutAnimation") {
    auto paramCount = 3;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          uiManager->configureNextLayoutAnimation(
              runtime,
              // TODO: pass in JSI value instead of folly::dynamic to RawValue
              RawValue(commandArgsFromValue(runtime, arguments[0])),
              arguments[1],
              arguments[2]);
          return jsi::Value::undefined();
        });
  }

  if (methodName == "unstable_getCurrentEventPriority") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        0,
        [this](
            jsi::Runtime& /*runtime*/,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* /*arguments*/,
            size_t /*count*/) -> jsi::Value {
          return {serialize(currentEventPriority_)};
        });
  }

  if (methodName == "unstable_DefaultEventPriority") {
    return {serialize(ReactEventPriority::Default)};
  }

  if (methodName == "unstable_DiscreteEventPriority") {
    return {serialize(ReactEventPriority::Discrete)};
  }

  if (methodName == "findShadowNodeByTag_DEPRECATED") {
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value&,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = uiManager->findShadowNodeByTag_DEPRECATED(
              tagFromValue(arguments[0]));

          if (!shadowNode) {
            return jsi::Value::null();
          }

          return valueFromShadowNode(runtime, shadowNode);
        });
  }

  /**
   * DOM traversal and layout APIs
   */

  if (methodName == "getBoundingClientRect") {
    // This is a React Native implementation of
    // `Element.prototype.getBoundingClientRect` (see
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).

    // This is similar to `measureInWindow`, except it's explicitly synchronous
    // (returns the result instead of passing it to a callback).

    // It allows indicating whether to include transforms so it can also be used
    // to implement methods like
    // [`offsetWidth`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetWidth)
    // and
    // [`offsetHeight`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight).

    // getBoundingClientRect(shadowNode: ShadowNode, includeTransform: boolean):
    //   [
    //     /* x: */ number,
    //     /* y: */ number,
    //     /* width: */ number,
    //     /* height: */ number
    //   ]
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          bool includeTransform = arguments[1].getBool();

          auto layoutMetrics = uiManager->getRelativeLayoutMetrics(
              *shadowNodeFromValue(runtime, arguments[0]),
              nullptr,
              {/* .includeTransform = */ includeTransform,
               /* .includeViewportOffset = */ true});

          if (layoutMetrics == EmptyLayoutMetrics) {
            return jsi::Value::undefined();
          }

          auto frame = layoutMetrics.frame;
          return jsi::Array::createWithElements(
              runtime,
              jsi::Value{runtime, (double)frame.origin.x},
              jsi::Value{runtime, (double)frame.origin.y},
              jsi::Value{runtime, (double)frame.size.width},
              jsi::Value{runtime, (double)frame.size.height});
        });
  }

  if (methodName == "getParentNode") {
    // This is a React Native implementation of `Node.prototype.parentNode`
    // (see https://developer.mozilla.org/en-US/docs/Web/API/Node/parentNode).

    // If a version of the given shadow node is present in the current revision
    // of an active shadow tree, it returns the instance handle of its parent.
    // Otherwise, it returns null.

    // getParent(shadowNode: ShadowNode): ?InstanceHandle
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);
          auto parentShadowNode =
              uiManager->getNewestParentOfShadowNode(*shadowNode);

          // shadowNode is a RootShadowNode
          if (!parentShadowNode) {
            return jsi::Value::null();
          }

          return (*parentShadowNode).getInstanceHandle(runtime);
        });
  }

  if (methodName == "getChildNodes") {
    // This is a React Native implementation of `Node.prototype.childNodes`
    // (see https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes).

    // If a version of the given shadow node is present in the current revision
    // of an active shadow tree, it returns an array of instance handles of its
    // children. Otherwise, it returns an empty array.

    // getChildren(shadowNode: ShadowNode): Array<InstanceHandle>
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);

          auto newestCloneOfShadowNode =
              uiManager->getNewestCloneOfShadowNode(*shadowNode);

          // There's no version of this node in the current shadow tree
          if (newestCloneOfShadowNode == nullptr) {
            return jsi::Array(runtime, 0);
          }

          auto childShadowNodes = newestCloneOfShadowNode->getChildren();
          return getArrayOfInstanceHandlesFromShadowNodes(
              childShadowNodes, runtime);
        });
  }

  if (methodName == "isConnected") {
    // This is a React Native implementation of `Node.prototype.isConnected`
    // (see https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected).

    // Indicates whether a version of the given shadow node is present in
    // the current revision of an active shadow tree.

    // isConnected(shadowNode: ShadowNode): boolean
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);

          auto newestCloneOfShadowNode =
              uiManager->getNewestCloneOfShadowNode(*shadowNode);

          return jsi::Value(newestCloneOfShadowNode != nullptr);
        });
  }

  if (methodName == "compareDocumentPosition") {
    // This is a React Native implementation of
    // `Node.prototype.compareDocumentPosition` (see
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition).

    // It uses the version of the shadow nodes that are present in the current
    // revision of the shadow tree (if any). If any of the nodes is not present,
    // it just indicates they are disconnected.

    // compareDocumentPosition(shadowNode: ShadowNode, otherShadowNode:
    // ShadowNode): number
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);
          auto otherShadowNode = shadowNodeFromValue(runtime, arguments[1]);

          auto documentPosition =
              uiManager->compareDocumentPosition(*shadowNode, *otherShadowNode);

          return jsi::Value(documentPosition);
        });
  }

  if (methodName == "getTextContent") {
    // This is a React Native implementation of
    // `Element.prototype.textContent` (see
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/textContent).

    // It uses the version of the shadow node that is present in the current
    // revision of the shadow tree.
    // If the version is present, is traverses all its children in DFS and
    // concatenates all the text contents. Otherwise, it returns an empty
    // string.

    // This is also used to access the text content of text nodes, which does
    // not need any traversal.

    // getTextContent(shadowNode: ShadowNode): string
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);

          auto textContent =
              uiManager->getTextContentInNewestCloneOfShadowNode(*shadowNode);

          return jsi::Value(
              runtime, jsi::String::createFromUtf8(runtime, textContent));
        });
  }

  if (methodName == "getOffset") {
    // This is a method to access the offset information for a shadow node, to
    // implement these methods:
    // * `HTMLElement.prototype.offsetParent`: see
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent.
    // * `HTMLElement.prototype.offsetTop`: see
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetTop.
    // * `HTMLElement.prototype.offsetLeft`: see
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetLeft.

    // It uses the version of the shadow node that is present in the current
    // revision of the shadow tree. If the node is not present or is not
    // displayed (because any of its ancestors or itself have 'display: none'),
    // it returns undefined. Otherwise, it returns its parent (as all nodes in
    // React Native are currently "positioned") and its offset relative to its
    // parent.

    // getOffset(shadowNode: ShadowNode):
    //   ?[
    //     /* parent: */ InstanceHandle,
    //     /* top: */ number,
    //     /* left: */ number,
    //   ]
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);

          auto newestCloneOfShadowNode =
              uiManager->getNewestCloneOfShadowNode(*shadowNode);
          auto newestPositionedAncestorOfShadowNode =
              uiManager->getNewestPositionedAncestorOfShadowNode(*shadowNode);
          // The node is no longer part of an active shadow tree, or it is the
          // root node
          if (newestCloneOfShadowNode == nullptr ||
              newestPositionedAncestorOfShadowNode == nullptr) {
            return jsi::Value::undefined();
          }

          // If the node is not displayed (itself or any of its ancestors has
          // "display: none"), this returns an empty layout metrics object.
          auto shadowNodeLayoutMetricsRelativeToRoot =
              uiManager->getRelativeLayoutMetrics(
                  *shadowNode, nullptr, {/* .includeTransform = */ false});
          if (shadowNodeLayoutMetricsRelativeToRoot == EmptyLayoutMetrics) {
            return jsi::Value::undefined();
          }

          auto positionedAncestorLayoutMetricsRelativeToRoot =
              uiManager->getRelativeLayoutMetrics(
                  *newestPositionedAncestorOfShadowNode,
                  nullptr,
                  {/* .includeTransform = */ false});
          if (positionedAncestorLayoutMetricsRelativeToRoot ==
              EmptyLayoutMetrics) {
            return jsi::Value::undefined();
          }

          auto shadowNodeOriginRelativeToRoot =
              shadowNodeLayoutMetricsRelativeToRoot.frame.origin;
          auto positionedAncestorOriginRelativeToRoot =
              positionedAncestorLayoutMetricsRelativeToRoot.frame.origin;

          // On the Web, offsets are computed from the inner border of the
          // parent.
          auto offsetTop = shadowNodeOriginRelativeToRoot.y -
              positionedAncestorOriginRelativeToRoot.y -
              positionedAncestorLayoutMetricsRelativeToRoot.borderWidth.top;
          auto offsetLeft = shadowNodeOriginRelativeToRoot.x -
              positionedAncestorOriginRelativeToRoot.x -
              positionedAncestorLayoutMetricsRelativeToRoot.borderWidth.left;

          return jsi::Array::createWithElements(
              runtime,
              (*newestPositionedAncestorOfShadowNode)
                  .getInstanceHandle(runtime),
              jsi::Value{runtime, (double)offsetTop},
              jsi::Value{runtime, (double)offsetLeft});
        });
  }

  if (methodName == "getScrollPosition") {
    // This is a method to access scroll information for a shadow node, to
    // implement these methods:
    // * `Element.prototype.scrollLeft`: see
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft.
    // * `Element.prototype.scrollTop`: see
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop.

    // It uses the version of the shadow node that is present in the current
    // revision of the shadow tree. If the node is not present or is not
    // displayed (because any of its ancestors or itself have 'display: none'),
    // it returns undefined. Otherwise, it returns the scroll position.

    // getScrollPosition(shadowNode: ShadowNode):
    //   ?[
    //     /* scrollLeft: */ number,
    //     /* scrollTop: */ number,
    //   ]
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);

          auto newestCloneOfShadowNode =
              uiManager->getNewestCloneOfShadowNode(*shadowNode);
          // The node is no longer part of an active shadow tree, or it is the
          // root node
          if (newestCloneOfShadowNode == nullptr) {
            return jsi::Value::undefined();
          }

          // If the node is not displayed (itself or any of its ancestors has
          // "display: none"), this returns an empty layout metrics object.
          auto layoutMetrics = uiManager->getRelativeLayoutMetrics(
              *shadowNode, nullptr, {/* .includeTransform = */ true});

          if (layoutMetrics == EmptyLayoutMetrics) {
            return jsi::Value::undefined();
          }

          auto layoutableShadowNode = dynamic_cast<LayoutableShadowNode const*>(
              newestCloneOfShadowNode.get());
          // This should never happen
          if (layoutableShadowNode == nullptr) {
            return jsi::Value::undefined();
          }

          auto scrollPosition = layoutableShadowNode->getContentOriginOffset();

          return jsi::Array::createWithElements(
              runtime,
              jsi::Value{
                  runtime,
                  scrollPosition.x == 0 ? 0 : (double)-scrollPosition.x},
              jsi::Value{
                  runtime,
                  scrollPosition.y == 0 ? 0 : (double)-scrollPosition.y});
        });
  }

  if (methodName == "getScrollSize") {
    // This is a method to access the scroll information of a shadow node, to
    // implement these methods:
    // * `Element.prototype.scrollWidth`: see
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollWidth.
    // * `Element.prototype.scrollHeight`: see
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight.

    // It uses the version of the shadow node that is present in the current
    // revision of the shadow tree. If the node is not present or is not
    // displayed (because any of its ancestors or itself have 'display: none'),
    // it returns undefined. Otherwise, it returns the scroll size.

    // getScrollSize(shadowNode: ShadowNode):
    //   ?[
    //     /* scrollWidth: */ number,
    //     /* scrollHeight: */ number,
    //   ]
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);

          auto newestCloneOfShadowNode =
              uiManager->getNewestCloneOfShadowNode(*shadowNode);
          // The node is no longer part of an active shadow tree, or it is the
          // root node
          if (newestCloneOfShadowNode == nullptr) {
            return jsi::Value::undefined();
          }

          // If the node is not displayed (itself or any of its ancestors has
          // "display: none"), this returns an empty layout metrics object.
          auto layoutMetrics = uiManager->getRelativeLayoutMetrics(
              *shadowNode, nullptr, {/* .includeTransform = */ false});

          if (layoutMetrics == EmptyLayoutMetrics ||
              layoutMetrics.displayType == DisplayType::Inline) {
            return jsi::Value::undefined();
          }

          auto layoutableShadowNode =
              dynamic_cast<YogaLayoutableShadowNode const*>(
                  newestCloneOfShadowNode.get());
          // This should never happen
          if (layoutableShadowNode == nullptr) {
            return jsi::Value::undefined();
          }

          Size scrollSize = getScrollSize(
              layoutMetrics, layoutableShadowNode->getContentBounds());

          return jsi::Array::createWithElements(
              runtime,
              jsi::Value{runtime, std::round(scrollSize.width)},
              jsi::Value{runtime, std::round(scrollSize.height)});
        });
  }

  if (methodName == "getInnerSize") {
    // This is a method to access the inner size of a shadow node, to implement
    // these methods:
    // * `Element.prototype.clientWidth`: see
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/clientWidth.
    // * `Element.prototype.clientHeight`: see
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight.

    // It uses the version of the shadow node that is present in the current
    // revision of the shadow tree. If the node is not present, it is not
    // displayed (because any of its ancestors or itself have 'display: none'),
    // or it has an inline display, it returns undefined.
    // Otherwise, it returns its inner size.

    // getInnerSize(shadowNode: ShadowNode):
    //   ?[
    //     /* width: */ number,
    //     /* height: */ number,
    //   ]
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);

          // If the node is not displayed (itself or any of its ancestors has
          // "display: none"), this returns an empty layout metrics object.
          auto layoutMetrics = uiManager->getRelativeLayoutMetrics(
              *shadowNode, nullptr, {/* .includeTransform = */ false});

          if (layoutMetrics == EmptyLayoutMetrics ||
              layoutMetrics.displayType == DisplayType::Inline) {
            return jsi::Value::undefined();
          }

          auto paddingFrame = layoutMetrics.getPaddingFrame();

          return jsi::Array::createWithElements(
              runtime,
              jsi::Value{runtime, std::round(paddingFrame.size.width)},
              jsi::Value{runtime, std::round(paddingFrame.size.height)});
        });
  }

  if (methodName == "getBorderSize") {
    // This is a method to access the border size of a shadow node, to implement
    // these methods:
    // * `Element.prototype.clientLeft`: see
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/clientLeft.
    // * `Element.prototype.clientTop`: see
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/clientTop.

    // It uses the version of the shadow node that is present in the current
    // revision of the shadow tree. If the node is not present, it is not
    // displayed (because any of its ancestors or itself have 'display: none'),
    // or it has an inline display, it returns undefined.
    // Otherwise, it returns its border size.

    // getBorderSize(shadowNode: ShadowNode):
    //   ?[
    //     /* topWidth: */ number,
    //     /* rightWidth: */ number,
    //     /* bottomWidth: */ number,
    //     /* leftWidth: */ number,
    //   ]
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);

          // If the node is not displayed (itself or any of its ancestors has
          // "display: none"), this returns an empty layout metrics object.
          auto layoutMetrics = uiManager->getRelativeLayoutMetrics(
              *shadowNode, nullptr, {/* .includeTransform = */ false});

          if (layoutMetrics == EmptyLayoutMetrics ||
              layoutMetrics.displayType == DisplayType::Inline) {
            return jsi::Value::undefined();
          }

          return jsi::Array::createWithElements(
              runtime,
              jsi::Value{runtime, std::round(layoutMetrics.borderWidth.top)},
              jsi::Value{runtime, std::round(layoutMetrics.borderWidth.right)},
              jsi::Value{runtime, std::round(layoutMetrics.borderWidth.bottom)},
              jsi::Value{runtime, std::round(layoutMetrics.borderWidth.left)});
        });
  }

  if (methodName == "getTagName") {
    // This is a method to access the normalized tag name of a shadow node, to
    // implement `Element.prototype.tagName` (see
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/tagName).

    // getTagName(shadowNode: ShadowNode): string
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);

          std::string canonicalComponentName = shadowNode->getComponentName();

          // FIXME(T162807327): Remove Android-specific prefixes and unify
          // shadow node implementations
          if (canonicalComponentName == "AndroidTextInput") {
            canonicalComponentName = "TextInput";
          } else if (canonicalComponentName == "AndroidSwitch") {
            canonicalComponentName = "Switch";
          }

          // Prefix with RN:
          canonicalComponentName.insert(0, "RN:");

          return jsi::String::createFromUtf8(runtime, canonicalComponentName);
        });
  }

  /**
   * Pointer Capture APIs
   */
  if (methodName == "hasPointerCapture") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [this, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);
          bool isCapturing = pointerEventsProcessor_.hasPointerCapture(
              static_cast<int>(arguments[1].asNumber()),
              shadowNodeFromValue(runtime, arguments[0]).get());
          return jsi::Value(isCapturing);
        });
  }

  if (methodName == "setPointerCapture") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [this, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);
          pointerEventsProcessor_.setPointerCapture(
              static_cast<int>(arguments[1].asNumber()),
              shadowNodeFromValue(runtime, arguments[0]));
          return jsi::Value::undefined();
        });
  }

  if (methodName == "releasePointerCapture") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [this, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);
          pointerEventsProcessor_.releasePointerCapture(
              static_cast<int>(arguments[1].asNumber()),
              shadowNodeFromValue(runtime, arguments[0]).get());
          return jsi::Value::undefined();
        });
  }

  return jsi::Value::undefined();
}

UIManager& UIManagerBinding::getUIManager() {
  return *uiManager_;
}

} // namespace facebook::react
