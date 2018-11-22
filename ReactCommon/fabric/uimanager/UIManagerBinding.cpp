// Copyright 2004-present Facebook. All Rights Reserved.

#include "UIManagerBinding.h"

#include <react/debug/SystraceSection.h>

#include <jsi/JSIDynamic.h>

namespace facebook {
namespace react {

static jsi::Object getModule(
    jsi::Runtime &runtime,
    const std::string &moduleName) {
  auto batchedBridge =
      runtime.global().getPropertyAsObject(runtime, "__fbBatchedBridge");
  auto getCallableModule =
      batchedBridge.getPropertyAsFunction(runtime, "getCallableModule");
  auto module = getCallableModule
                    .callWithThis(
                        runtime,
                        batchedBridge,
                        {jsi::String::createFromUtf8(runtime, moduleName)})
                    .asObject(runtime);
  return module;
}

void UIManagerBinding::install(
    jsi::Runtime &runtime,
    std::shared_ptr<UIManagerBinding> uiManagerBinding) {
  auto uiManagerModuleName = "nativeFabricUIManager";
  auto object = jsi::Object::createFromHostObject(runtime, uiManagerBinding);
  runtime.global().setProperty(runtime, uiManagerModuleName, std::move(object));
}

UIManagerBinding::UIManagerBinding(std::unique_ptr<UIManager> uiManager)
    : uiManager_(std::move(uiManager)) {}

void UIManagerBinding::startSurface(
    jsi::Runtime &runtime,
    SurfaceId surfaceId,
    const std::string &moduleName,
    const folly::dynamic &initalProps) const {
  folly::dynamic parameters = folly::dynamic::object();
  parameters["rootTag"] = surfaceId;
  parameters["initialProps"] = initalProps;

  auto module = getModule(runtime, "AppRegistry");
  auto method = module.getPropertyAsFunction(runtime, "runApplication");

  method.callWithThis(
      runtime,
      module,
      {jsi::String::createFromUtf8(runtime, moduleName),
       jsi::valueFromDynamic(runtime, parameters)});
}

void UIManagerBinding::stopSurface(jsi::Runtime &runtime, SurfaceId surfaceId)
    const {
  auto module = getModule(runtime, "ReactFabric");
  auto method = module.getPropertyAsFunction(runtime, "unmountComponentAtNode");

  method.callWithThis(runtime, module, {jsi::Value{surfaceId}});
}

void UIManagerBinding::dispatchEvent(
    jsi::Runtime &runtime,
    const EventTarget *eventTarget,
    const std::string &type,
    const folly::dynamic &payload) const {
  auto eventTargetValue = jsi::Value::null();

  if (eventTarget) {
    SystraceSection s("UIManagerBinding::JSIDispatchFabricEventToTarget");
    auto &eventTargetWrapper =
        static_cast<const EventTargetWrapper &>(*eventTarget);
    eventTargetValue = eventTargetWrapper.instanceHandle.lock(runtime);
    if (eventTargetValue.isUndefined()) {
      return;
    }
  }

  auto &eventHandlerWrapper =
      static_cast<const EventHandlerWrapper &>(*eventHandler_);
  eventHandlerWrapper.callback.call(
      runtime,
      {std::move(eventTargetValue),
       jsi::String::createFromUtf8(runtime, type),
       jsi::valueFromDynamic(runtime, payload)});
}

void UIManagerBinding::invalidate() const {
  uiManager_->setShadowTreeRegistry(nullptr);
  uiManager_->setDelegate(nullptr);
}

jsi::Value UIManagerBinding::get(
    jsi::Runtime &runtime,
    const jsi::PropNameID &name) {
  auto methodName = name.utf8(runtime);
  auto &uiManager = *uiManager_;

  // Semantic: Creates a new node with given pieces.
  if (methodName == "createNode") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        5,
        [&uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          return valueFromShadowNode(
              runtime,
              uiManager.createNode(
                  tagFromValue(runtime, arguments[0]),
                  componentNameFromValue(runtime, arguments[1]),
                  surfaceIdFromValue(runtime, arguments[2]),
                  rawPropsFromValue(runtime, arguments[3]),
                  eventTargetFromValue(runtime, arguments[4])));
        });
  }

  // Semantic: Clones the node with *same* props and *same* children.
  if (methodName == "cloneNode") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        1,
        [&uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          return valueFromShadowNode(
              runtime,
              uiManager.cloneNode(shadowNodeFromValue(runtime, arguments[0])));
        });
  }

  // Semantic: Clones the node with *same* props and *empty* children.
  if (methodName == "cloneNodeWithNewChildren") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        1,
        [&uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          return valueFromShadowNode(
              runtime,
              uiManager.cloneNode(
                  shadowNodeFromValue(runtime, arguments[0]),
                  ShadowNode::emptySharedShadowNodeSharedList()));
        });
  }

  // Semantic: Clones the node with *given* props and *same* children.
  if (methodName == "cloneNodeWithNewProps") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [&uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          return valueFromShadowNode(
              runtime,
              uiManager.cloneNode(
                  shadowNodeFromValue(runtime, arguments[0]),
                  nullptr,
                  rawPropsFromValue(runtime, arguments[1])));
        });
  }

  // Semantic: Clones the node with *given* props and *empty* children.
  if (methodName == "cloneNodeWithNewChildrenAndProps") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [&uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          return valueFromShadowNode(
              runtime,
              uiManager.cloneNode(
                  shadowNodeFromValue(runtime, arguments[0]),
                  ShadowNode::emptySharedShadowNodeSharedList(),
                  rawPropsFromValue(runtime, arguments[1])));
        });
  }

  if (methodName == "appendChild") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [&uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          uiManager.appendChild(
              shadowNodeFromValue(runtime, arguments[0]),
              shadowNodeFromValue(runtime, arguments[1]));
          return jsi::Value::undefined();
        });
  }

  if (methodName == "createChildSet") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        1,
        [](jsi::Runtime &runtime,
           const jsi::Value &thisValue,
           const jsi::Value *arguments,
           size_t count) -> jsi::Value {
          auto shadowNodeList =
              std::make_shared<SharedShadowNodeList>(SharedShadowNodeList({}));
          return valueFromShadowNodeList(runtime, shadowNodeList);
        });
  }

  if (methodName == "appendChildToSet") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [](jsi::Runtime &runtime,
           const jsi::Value &thisValue,
           const jsi::Value *arguments,
           size_t count) -> jsi::Value {
          auto shadowNodeList = shadowNodeListFromValue(runtime, arguments[0]);
          auto shadowNode = shadowNodeFromValue(runtime, arguments[1]);
          shadowNodeList->push_back(shadowNode);
          return jsi::Value::undefined();
        });
  }

  if (methodName == "completeRoot") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [&uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          uiManager.completeSurface(
              surfaceIdFromValue(runtime, arguments[0]),
              shadowNodeListFromValue(runtime, arguments[1]));
          return jsi::Value::undefined();
        });
  }

  if (methodName == "registerEventHandler") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        1,
        [this](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          auto eventHandler =
              arguments[0].getObject(runtime).getFunction(runtime);
          eventHandler_ =
              std::make_unique<EventHandlerWrapper>(std::move(eventHandler));
          return jsi::Value::undefined();
        });
  }

  return jsi::Value::undefined();
}

} // namespace react
} // namespace facebook
