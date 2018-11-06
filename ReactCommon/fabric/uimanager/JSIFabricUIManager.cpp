// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSIFabricUIManager.h"

#include <fabric/uimanager/FabricUIManager.h>
#include <fabric/uimanager/primitives.h>
#include <fabric/core/ShadowNode.h>
#include <fabric/uimanager/FabricUIManager.h>
#include <jsi/JSIDynamic.h>

namespace facebook {
namespace react {

namespace {

jsi::Value createNode(const UIManager &uiManager, jsi::Runtime &runtime, const jsi::Value *arguments, size_t count) {
  auto reactTag = (Tag)arguments[0].getNumber();
  auto viewName = arguments[1].getString(runtime).utf8(runtime);
  auto rootTag = (Tag)arguments[2].getNumber();
  auto props = folly::dynamic{
      arguments[3].isNull() ? nullptr
                            : jsi::dynamicFromValue(runtime, arguments[3])};
  auto eventTarget = std::make_shared<EventTargetWrapper>(
      jsi::WeakObject(runtime, arguments[4].getObject(runtime)));

  SharedShadowNode node =
      uiManager.createNode(reactTag, viewName, rootTag, props, eventTarget);

  auto shadowNodeWrapper = std::make_shared<ShadowNodeWrapper>(node);
  return jsi::Object::createFromHostObject(runtime, shadowNodeWrapper);
}

jsi::Value cloneNode(
    const UIManager &uiManager,
    jsi::Runtime &runtime,
    const jsi::Value *arguments,
    size_t count) {
  auto previousNode = arguments[0]
                          .getObject(runtime)
                          .getHostObject<ShadowNodeWrapper>(runtime)
                          ->shadowNode;
  auto newNode = uiManager.cloneNode(previousNode);
  auto wrapper = std::make_shared<ShadowNodeWrapper>(std::move(newNode));
  return jsi::Object::createFromHostObject(runtime, std::move(wrapper));
}

jsi::Value cloneNodeWithNewChildren(
    const UIManager &uiManager,
    jsi::Runtime &runtime,
    const jsi::Value *arguments,
    size_t count) {
  auto previousNode = arguments[0]
                          .getObject(runtime)
                          .getHostObject<ShadowNodeWrapper>(runtime)
                          ->shadowNode;
  auto newNode = uiManager.cloneNodeWithNewChildren(previousNode);
  auto wrapper = std::make_shared<ShadowNodeWrapper>(std::move(newNode));
  return jsi::Object::createFromHostObject(runtime, std::move(wrapper));
}

jsi::Value cloneNodeWithNewProps(
    const UIManager &uiManager,
    jsi::Runtime &runtime,
    const jsi::Value *arguments,
    size_t count) {
  auto previousNode = arguments[0]
                          .getObject(runtime)
                          .getHostObject<ShadowNodeWrapper>(runtime)
                          ->shadowNode;
  auto props = dynamicFromValue(runtime, arguments[1]);
  auto newNode = uiManager.cloneNodeWithNewProps(previousNode, props);
  auto wrapper = std::make_shared<ShadowNodeWrapper>(std::move(newNode));
  return jsi::Object::createFromHostObject(runtime, std::move(wrapper));
}

jsi::Value cloneNodeWithNewChildrenAndProps(
    const UIManager &uiManager,
    jsi::Runtime &runtime,
    const jsi::Value *arguments,
    size_t count) {
  auto previousNode = arguments[0]
                          .getObject(runtime)
                          .getHostObject<ShadowNodeWrapper>(runtime)
                          ->shadowNode;
  auto props = dynamicFromValue(runtime, arguments[1]);
  auto newNode =
      uiManager.cloneNodeWithNewChildrenAndProps(previousNode, props);
  auto wrapper = std::make_shared<ShadowNodeWrapper>(std::move(newNode));
  return jsi::Object::createFromHostObject(runtime, std::move(wrapper));
}

jsi::Value appendChild(
    const UIManager &uiManager,
    jsi::Runtime &runtime,
    const jsi::Value *arguments,
    size_t count) {
  auto parentNode = arguments[0]
                        .getObject(runtime)
                        .getHostObject<ShadowNodeWrapper>(runtime)
                        ->shadowNode;
  auto childNode = arguments[1]
                       .getObject(runtime)
                       .getHostObject<ShadowNodeWrapper>(runtime)
                       ->shadowNode;
  uiManager.appendChild(parentNode, childNode);
  return jsi::Value::undefined();
}

jsi::Value createChildSet(
    const UIManager &uiManager,
    jsi::Runtime &runtime,
    const jsi::Value *arguments,
    size_t count) {
  auto rootTag = (Tag)arguments[0].getNumber();

  SharedShadowNodeUnsharedList childSet = uiManager.createChildSet(rootTag);

  return jsi::Object::createFromHostObject(
      runtime, std::make_unique<ShadowNodeListWrapper>(childSet));
}

jsi::Value appendChildToSet(
    const UIManager &uiManager,
    jsi::Runtime &runtime,
    const jsi::Value *arguments,
    size_t count) {
  SharedShadowNodeUnsharedList childSet =
      arguments[0]
          .getObject(runtime)
          .getHostObject<ShadowNodeListWrapper>(runtime)
          ->shadowNodeList;
  SharedShadowNode childNode = arguments[1]
                                   .getObject(runtime)
                                   .getHostObject<ShadowNodeWrapper>(runtime)
                                   ->shadowNode;

  uiManager.appendChildToSet(childSet, childNode);

  return jsi::Value::undefined();
}

jsi::Value completeRoot(
    const UIManager &uiManager,
    jsi::Runtime &runtime,
    const jsi::Value *arguments,
    size_t count) {
  auto rootTag = (Tag)arguments[0].getNumber();
  SharedShadowNodeUnsharedList childSet =
      arguments[1]
          .getObject(runtime)
          .getHostObject<ShadowNodeListWrapper>(runtime)
          ->shadowNodeList;

  uiManager.completeRoot(rootTag, childSet);

  return jsi::Value::undefined();
}

jsi::Value registerEventHandler(
    const UIManager &uiManager,
    jsi::Runtime &runtime,
    const jsi::Value *arguments,
    size_t count) {
  auto eventHandler = arguments[0].getObject(runtime).getFunction(runtime);
  auto eventHandlerWrapper =
      std::make_unique<EventHandlerWrapper>(std::move(eventHandler));

  uiManager.registerEventHandler(std::move(eventHandlerWrapper));

  return jsi::Value::undefined();
}

using Callback = jsi::Value(
    const UIManager &uiManager,
    jsi::Runtime &runtime,
    const jsi::Value *arguments,
    size_t count);

void addMethod(
    const UIManager &uiManager,
    jsi::Runtime &runtime,
    jsi::Object &module,
    const char *name,
    Callback &callback) {
  module.setProperty(
      runtime,
      name,
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, name),
          1,
          [&uiManager, &callback](
              jsi::Runtime &runtime,
              const jsi::Value &value,
              const jsi::Value *args,
              size_t count) {
            return callback(uiManager, runtime, args, count);
          }));
}

void removeMethod(
    jsi::Runtime &runtime,
    jsi::Object &module,
    const char *name) {
  // Step 1: Find and replace the body of the method with noop.
  auto propertyValue = module.getProperty(runtime, name);
  auto propertyObject = propertyValue.asObject(runtime);
  auto propertyFunction = propertyObject.asFunction(runtime);
  auto &propertyHostFunction = propertyFunction.getHostFunction(runtime);
  propertyHostFunction = [](jsi::Runtime &runtime,
                            const jsi::Value &thisVal,
                            const jsi::Value *args,
                            size_t count) {
    // Noop.
    return jsi::Value::undefined();
  };

  // Step 2: Remove the reference to the method from the module.
  module.setProperty(runtime, name, nullptr);
}

jsi::Object getModule(jsi::Runtime &runtime, const std::string &moduleName) {
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

} // namespace

void JSIDispatchFabricEventToEmptyTarget(
    jsi::Runtime &runtime,
    const EventHandler &eventHandler,
    const std::string &type,
    const folly::dynamic &payload) {
  auto &eventHandlerWrapper =
      static_cast<const EventHandlerWrapper &>(eventHandler);
  eventHandlerWrapper.callback.call(
      runtime,
      {jsi::Value::null(),
       jsi::String::createFromUtf8(runtime, type),
       jsi::valueFromDynamic(runtime, payload)});
}

void JSIDispatchFabricEventToTarget(
    jsi::Runtime &runtime,
    const EventHandler &eventHandler,
    const EventTarget &eventTarget,
    const std::string &type,
    const folly::dynamic &payload) {
  auto &eventHandlerWrapper =
      static_cast<const EventHandlerWrapper &>(eventHandler);
  auto &eventTargetWrapper =
      static_cast<const EventTargetWrapper &>(eventTarget);
  auto eventTargetValue = eventTargetWrapper.instanceHandle.lock(runtime);

  if (eventTargetValue.isUndefined()) {
    return;
  }

  eventHandlerWrapper.callback.call(
      runtime,
      {std::move(eventTargetValue),
       jsi::String::createFromUtf8(runtime, type),
       jsi::valueFromDynamic(runtime, payload)});
}

const char *kUIManagerModuleName = "nativeFabricUIManager";

void JSIInstallFabricUIManager(jsi::Runtime &runtime, UIManager &uiManager) {
  auto module = jsi::Object(runtime);

  addMethod(uiManager, runtime, module, "createNode", createNode);
  addMethod(uiManager, runtime, module, "cloneNode", cloneNode);
  addMethod(
      uiManager,
      runtime,
      module,
      "cloneNodeWithNewChildren",
      cloneNodeWithNewChildren);
  addMethod(
      uiManager,
      runtime,
      module,
      "cloneNodeWithNewProps",
      cloneNodeWithNewProps);
  addMethod(
      uiManager,
      runtime,
      module,
      "cloneNodeWithNewChildrenAndProps",
      cloneNodeWithNewChildrenAndProps);
  addMethod(uiManager, runtime, module, "appendChild", appendChild);
  addMethod(uiManager, runtime, module, "createChildSet", createChildSet);
  addMethod(uiManager, runtime, module, "appendChildToSet", appendChildToSet);
  addMethod(uiManager, runtime, module, "completeRoot", completeRoot);
  addMethod(
      uiManager, runtime, module, "registerEventHandler", registerEventHandler);

  uiManager.setDispatchEventToEmptyTargetFunction(
      [&runtime](
          const EventHandler &eventHandler,
          const std::string &type,
          const folly::dynamic &payload) {
        return JSIDispatchFabricEventToEmptyTarget(
            runtime, eventHandler, type, payload);
      });

  uiManager.setDispatchEventToTargetFunction(
      [&runtime](
          const EventHandler &eventHandler,
          const EventTarget &eventTarget,
          const std::string &type,
          const folly::dynamic &payload) {
        return JSIDispatchFabricEventToTarget(
            runtime, eventHandler, eventTarget, type, payload);
      });

  uiManager.setStartSurfaceFunction([&runtime](
                                        SurfaceId surfaceId,
                                        const std::string &moduleName,
                                        const folly::dynamic &initialProps) {
    return JSIStartSurface(runtime, surfaceId, moduleName, initialProps);
  });

  uiManager.setStopSurfaceFunction([&runtime](SurfaceId surfaceId) {
    return JSIStopSurface(runtime, surfaceId);
  });

  runtime.global().setProperty(runtime, kUIManagerModuleName, module);
}

void JSIUninstallFabricUIManager(jsi::Runtime &runtime) {
  auto module =
      runtime.global().getPropertyAsObject(runtime, kUIManagerModuleName);

  removeMethod(runtime, module, "createNode");
  removeMethod(runtime, module, "cloneNode");
  removeMethod(runtime, module, "cloneNodeWithNewChildren");
  removeMethod(runtime, module, "cloneNodeWithNewProps");
  removeMethod(runtime, module, "cloneNodeWithNewChildrenAndProps");
  removeMethod(runtime, module, "appendChild");
  removeMethod(runtime, module, "createChildSet");
  removeMethod(runtime, module, "appendChildToSet");
  removeMethod(runtime, module, "completeRoot");
  removeMethod(runtime, module, "registerEventHandler");

  runtime.global().setProperty(runtime, kUIManagerModuleName, nullptr);
}

void JSIStartSurface(
    jsi::Runtime &runtime,
    SurfaceId surfaceId,
    const std::string &moduleName,
    const folly::dynamic &initalProps) {
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

void JSIStopSurface(jsi::Runtime &runtime, SurfaceId surfaceId) {
  auto module = getModule(runtime, "ReactFabric");
  auto method = module.getPropertyAsFunction(runtime, "unmountComponentAtNode");

  method.callWithThis(runtime, module, {jsi::Value{surfaceId}});
}

} // namespace react
} // namespace facebook
