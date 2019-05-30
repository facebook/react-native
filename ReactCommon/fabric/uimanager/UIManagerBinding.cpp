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
  parameters["fabric"] = true;

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
    const ValueFactory &payloadFactory) const {
  SystraceSection s("UIManagerBinding::dispatchEvent");

  auto payload = payloadFactory(runtime);

  auto instanceHandle = eventTarget
    ? [&]() {
      auto instanceHandle = eventTarget->getInstanceHandle(runtime);
      if (instanceHandle.isUndefined()) {
        return jsi::Value::null();
      }

      // Mixing `target` into `payload`.
      assert(payload.isObject());
      payload.asObject(runtime).setProperty(runtime, "target", eventTarget->getTag());
      return instanceHandle;
    }()
    : jsi::Value::null();

  auto &eventHandlerWrapper =
      static_cast<const EventHandlerWrapper &>(*eventHandler_);

  eventHandlerWrapper.callback.call(
      runtime,
      {std::move(instanceHandle),
       jsi::String::createFromUtf8(runtime, type),
       std::move(payload)});
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
                  RawProps(runtime, arguments[3]),
                  eventTargetFromValue(runtime, arguments[4], arguments[0])));
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
          const auto &rawProps = RawProps(runtime, arguments[1]);
          return valueFromShadowNode(
              runtime,
              uiManager.cloneNode(
                  shadowNodeFromValue(runtime, arguments[0]),
                  nullptr,
                  &rawProps));
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
          const auto &rawProps = RawProps(runtime, arguments[1]);
          return valueFromShadowNode(
              runtime,
              uiManager.cloneNode(
                  shadowNodeFromValue(runtime, arguments[0]),
                  ShadowNode::emptySharedShadowNodeSharedList(),
                  &rawProps));
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

  if (methodName == "getRelativeLayoutMetrics") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [&uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          auto layoutMetrics = uiManager.getRelativeLayoutMetrics(
              *shadowNodeFromValue(runtime, arguments[0]),
              shadowNodeFromValue(runtime, arguments[1]).get());
          auto frame = layoutMetrics.frame;
          auto result = jsi::Object(runtime);
          result.setProperty(runtime, "left", frame.origin.x);
          result.setProperty(runtime, "top", frame.origin.y);
          result.setProperty(runtime, "width", frame.size.width);
          result.setProperty(runtime, "height", frame.size.height);
          return result;
        });
  }

  // Legacy API
  if (methodName == "measureLayout") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        4,
        [&uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          auto layoutMetrics = uiManager.getRelativeLayoutMetrics(
              *shadowNodeFromValue(runtime, arguments[0]),
              shadowNodeFromValue(runtime, arguments[1]).get());

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

  if (methodName == "measureInWindow") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [&uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          auto layoutMetrics = uiManager.getRelativeLayoutMetrics(
              *shadowNodeFromValue(runtime, arguments[0]), nullptr);

          auto onSuccessFunction =
              arguments[1].getObject(runtime).getFunction(runtime);
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

  if (methodName == "setNativeProps") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [&uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          uiManager.setNativeProps(
              shadowNodeFromValue(runtime, arguments[0]),
              RawProps(runtime, arguments[1]));

          return jsi::Value::undefined();
        });
  }

  return jsi::Value::undefined();
}

} // namespace react
} // namespace facebook
