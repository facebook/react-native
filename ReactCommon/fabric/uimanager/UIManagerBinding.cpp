/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UIManagerBinding.h"

#include <react/debug/SystraceSection.h>

#include <glog/logging.h>
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

std::shared_ptr<UIManagerBinding> UIManagerBinding::createAndInstallIfNeeded(
    jsi::Runtime &runtime) {
  auto uiManagerModuleName = "nativeFabricUIManager";

  auto uiManagerValue =
      runtime.global().getProperty(runtime, uiManagerModuleName);
  if (uiManagerValue.isUndefined()) {
    // The global namespace does not have an instance of the binding;
    // we need to create, install and return it.
    auto uiManagerBinding = std::make_shared<UIManagerBinding>();
    auto object = jsi::Object::createFromHostObject(runtime, uiManagerBinding);
    runtime.global().setProperty(
        runtime, uiManagerModuleName, std::move(object));
    return uiManagerBinding;
  }

  // The global namespace already has an instance of the binding;
  // we need to return that.
  auto uiManagerObject = uiManagerValue.asObject(runtime);
  return uiManagerObject.getHostObject<UIManagerBinding>(runtime);
}

UIManagerBinding::~UIManagerBinding() {
  LOG(WARNING) << "UIManager::~UIManager() was called (address: " << this
               << ").";

  // We must detach the `UIBinding` on deallocation to prevent accessing
  // deallocated `UIManagerBinding`.
  // Since `UIManagerBinding` retains `UIManager`, `UIManager` always overlive
  // `UIManagerBinding`, therefore we don't need similar logic in `UIManager`'s
  // destructor.
  attach(nullptr);
}

void UIManagerBinding::attach(std::shared_ptr<UIManager> const &uiManager) {
  if (uiManager_) {
    uiManager_->uiManagerBinding_ = nullptr;
  }

  uiManager_ = uiManager;

  if (uiManager_) {
    uiManager_->uiManagerBinding_ = this;
  }
}

void UIManagerBinding::startSurface(
    jsi::Runtime &runtime,
    SurfaceId surfaceId,
    const std::string &moduleName,
    const folly::dynamic &initalProps) const {
  folly::dynamic parameters = folly::dynamic::object();
  parameters["rootTag"] = surfaceId;
  parameters["initialProps"] = initalProps;
  parameters["fabric"] = true;

  if (runtime.global().hasProperty(runtime, "RN$SurfaceRegistry")) {
    auto registry =
        runtime.global().getPropertyAsObject(runtime, "RN$SurfaceRegistry");
    auto method = registry.getPropertyAsFunction(runtime, "renderSurface");

    method.call(
        runtime,
        {jsi::String::createFromUtf8(runtime, moduleName),
         jsi::valueFromDynamic(runtime, parameters)});
  } else {
    auto module = getModule(runtime, "AppRegistry");
    auto method = module.getPropertyAsFunction(runtime, "runApplication");

    method.callWithThis(
        runtime,
        module,
        {jsi::String::createFromUtf8(runtime, moduleName),
         jsi::valueFromDynamic(runtime, parameters)});
  }
}

void UIManagerBinding::stopSurface(jsi::Runtime &runtime, SurfaceId surfaceId)
    const {
  if (runtime.global().hasProperty(runtime, "RN$stopSurface")) {
    auto method =
        runtime.global().getPropertyAsFunction(runtime, "RN$stopSurface");
    method.call(runtime, {jsi::Value{surfaceId}});
  } else {
    auto module = getModule(runtime, "ReactFabric");
    auto method =
        module.getPropertyAsFunction(runtime, "unmountComponentAtNode");

    method.callWithThis(runtime, module, {jsi::Value{surfaceId}});
  }
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
  uiManager_->setDelegate(nullptr);
}

jsi::Value UIManagerBinding::get(
    jsi::Runtime &runtime,
    const jsi::PropNameID &name) {
  auto methodName = name.utf8(runtime);

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
  UIManager *uiManager = uiManager_.get();

  // Semantic: Creates a new node with given pieces.
  if (methodName == "createNode") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        5,
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          return valueFromShadowNode(
              runtime,
              uiManager->createNode(
                  tagFromValue(runtime, arguments[0]),
                  stringFromValue(runtime, arguments[1]),
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
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          return valueFromShadowNode(
              runtime,
              uiManager->cloneNode(shadowNodeFromValue(runtime, arguments[0])));
        });
  }

  if (methodName == "setJSResponder") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          uiManager->setJSResponder(
              shadowNodeFromValue(runtime, arguments[0]),
              arguments[1].getBool());

          return jsi::Value::undefined();
        });
  }

  if (methodName == "clearJSResponder") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        0,
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          uiManager->clearJSResponder();

          return jsi::Value::undefined();
        });
  }

  // Semantic: Clones the node with *same* props and *empty* children.
  if (methodName == "cloneNodeWithNewChildren") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        1,
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          return valueFromShadowNode(
              runtime,
              uiManager->cloneNode(
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
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          const auto &rawProps = RawProps(runtime, arguments[1]);
          return valueFromShadowNode(
              runtime,
              uiManager->cloneNode(
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
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          const auto &rawProps = RawProps(runtime, arguments[1]);
          return valueFromShadowNode(
              runtime,
              uiManager->cloneNode(
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
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          uiManager->appendChild(
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
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          uiManager->completeSurface(
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
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          auto layoutMetrics = uiManager->getRelativeLayoutMetrics(
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

  if (methodName == "dispatchCommand") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        3,
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          uiManager->dispatchCommand(
              shadowNodeFromValue(runtime, arguments[0]),
              stringFromValue(runtime, arguments[1]),
              commandArgsFromValue(runtime, arguments[2]));

          return jsi::Value::undefined();
        });
  }

  // Legacy API
  if (methodName == "measureLayout") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        4,
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          auto layoutMetrics = uiManager->getRelativeLayoutMetrics(
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

  if (methodName == "measure") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          auto layoutMetrics = uiManager->getRelativeLayoutMetrics(
              *shadowNodeFromValue(runtime, arguments[0]), nullptr);
          auto frame = layoutMetrics.frame;
          auto onSuccessFunction =
              arguments[1].getObject(runtime).getFunction(runtime);

          onSuccessFunction.call(
              runtime,
              {0,
               0,
               jsi::Value{runtime, (double)frame.origin.x},
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
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          auto layoutMetrics = uiManager->getRelativeLayoutMetrics(
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
        [uiManager](
            jsi::Runtime &runtime,
            const jsi::Value &thisValue,
            const jsi::Value *arguments,
            size_t count) -> jsi::Value {
          uiManager->setNativeProps(
              *shadowNodeFromValue(runtime, arguments[0]),
              RawProps(runtime, arguments[1]));

          return jsi::Value::undefined();
        });
  }

  if (methodName == "findShadowNodeByTag_DEPRECATED") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        1,
        [uiManager](
            jsi::Runtime &runtime,
            jsi::Value const &thisValue,
            jsi::Value const *arguments,
            size_t count) -> jsi::Value {
          auto shadowNode = uiManager->findShadowNodeByTag_DEPRECATED(
              tagFromValue(runtime, arguments[0]));

          if (!shadowNode) {
            return jsi::Value::null();
          }

          return valueFromShadowNode(runtime, shadowNode);
        });
  }

  return jsi::Value::undefined();
}

} // namespace react
} // namespace facebook
