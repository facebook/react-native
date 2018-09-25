// Copyright 2004-present Facebook. All Rights Reserved.

#include "FabricJSIBinding.h"
#include <fb/fbjni.h>
#include <jsi/jsi.h>
#include <jsi/JSIDynamic.h>

using namespace facebook::jni;
using namespace facebook::jsi;

namespace facebook {
namespace react {

namespace {

struct JList : public JavaClass<JList> {
  static constexpr auto kJavaDescriptor = "Ljava/util/List;";
};

struct JShadowNode : public JavaClass<JShadowNode> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/uimanager/ReactShadowNode;";
};

// This wrapper is only needed because JSI doesn't expose its underlying
// raw pointer. It could change implementation details.
struct EventTarget {
  // TODO: This will cause a leak. It needs to be a weak reference.
  jsi::Object instanceHandle;
  EventTarget(jsi::Object instance) : instanceHandle(std::move(instance)) {}
};

// This wrapper is only needed because JSI doesn't expose its underlying
// raw pointer. It could change implementation details.
struct EventHandler {
  jsi::Function callback;
  EventHandler(jsi::Function eventHandler) : callback(std::move(eventHandler)) {}
};

// This wrapper is needed since we can only store HostObjects in JSI.
// Ideally we could just store the raw pointer in there along with a
// finalizer specified in the class. Alternatively we could make all
// our shadow nodes C++ objects but that seems unlikely at this point.
struct ShadowViewWrapper : public HostObject {
  global_ref<JShadowNode> node;

  ShadowViewWrapper(alias_ref<JShadowNode> shadowNode) : node(make_global(shadowNode)) {}
};

struct ChildSetWrapper : public HostObject {
  global_ref<JList> childSet;

  ChildSetWrapper(alias_ref<JList> list) : childSet(make_global(list)) {}
};

local_ref<JString> ValueAsJString(Runtime& runtime, const Value& value) {
  std::string str = value.getString(runtime).utf8(runtime);
  return make_jstring(str);
}

local_ref<ReadableNativeMap::jhybridobject> ValueAsReadableMap(Runtime& runtime, const Value& value) {
  auto dynamicValue = dynamicFromValue(runtime, value);
  return ReadableNativeMap::newObjectCxxArgs(std::move(dynamicValue));
}

Value createNode(jni::alias_ref<jobject> manager, Runtime& runtime, const Value* arguments, size_t count) {
  static auto createNode =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<alias_ref<JShadowNode>(jint, jstring, jint, ReadableNativeMap::javaobject, jlong)>("createNode");

  int reactTag = (int)arguments[0].getNumber();
  auto viewName = ValueAsJString(runtime, arguments[1]);
  int rootTag = (int)arguments[2].getNumber();
  auto props = arguments[3].isNull() ? local_ref<ReadableNativeMap::jhybridobject>(nullptr) :
               ValueAsReadableMap(runtime, arguments[3]);
  auto eventTarget = arguments[4].getObject(runtime);
  auto eventTargetWrapper = new EventTarget(std::move(eventTarget));

  auto node = createNode(manager, reactTag, viewName.get(), rootTag, props.get(), (jlong)eventTargetWrapper);
  auto wrapper = std::make_unique<ShadowViewWrapper>(node);

  return Object::createFromHostObject(runtime, std::move(wrapper));
}

Value cloneNode(jni::alias_ref<jobject> manager, Runtime& runtime, const Value* arguments, size_t count) {
  static auto cloneNode =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<alias_ref<JShadowNode>(JShadowNode::javaobject)>("cloneNode");

  auto previousNode = arguments[0].getObject(runtime).getHostObject<ShadowViewWrapper>(runtime)->node;
  auto instance = arguments[1].getObject(runtime);
  auto newNode = cloneNode(manager, previousNode.get());
  auto wrapper = std::make_unique<ShadowViewWrapper>(newNode);

  return Object::createFromHostObject(runtime, std::move(wrapper));
}

Value cloneNodeWithNewChildren(jni::alias_ref<jobject> manager, Runtime& runtime, const Value* arguments, size_t count) {
  static auto cloneNodeWithNewChildren =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<alias_ref<JShadowNode>(JShadowNode::javaobject)>("cloneNodeWithNewChildren");

  auto previousNode = arguments[0].getObject(runtime).getHostObject<ShadowViewWrapper>(runtime)->node;
  auto instance = arguments[1].getObject(runtime);
  auto newNode = cloneNodeWithNewChildren(manager, previousNode.get());
  auto wrapper = std::make_unique<ShadowViewWrapper>(newNode);

  return Object::createFromHostObject(runtime, std::move(wrapper));
}

Value cloneNodeWithNewProps(jni::alias_ref<jobject> manager, Runtime& runtime, const Value* arguments, size_t count) {
  static auto cloneNodeWithNewProps =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<alias_ref<JShadowNode>(JShadowNode::javaobject, ReadableNativeMap::javaobject)>("cloneNodeWithNewProps");

  auto previousNode = arguments[0].getObject(runtime).getHostObject<ShadowViewWrapper>(runtime)->node;
  auto props = ValueAsReadableMap(runtime, arguments[1]);
  auto instance = arguments[2].getObject(runtime);
  auto newNode = cloneNodeWithNewProps(manager, previousNode.get(), props.get());
  auto wrapper = std::make_unique<ShadowViewWrapper>(newNode);

  return Object::createFromHostObject(runtime, std::move(wrapper));
}

Value cloneNodeWithNewChildrenAndProps(jni::alias_ref<jobject> manager, Runtime& runtime, const Value* arguments, size_t count) {
  static auto cloneNodeWithNewChildrenAndProps =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<alias_ref<JShadowNode>(JShadowNode::javaobject, ReadableNativeMap::javaobject)>("cloneNodeWithNewChildrenAndProps");

  auto previousNode = arguments[0].getObject(runtime).getHostObject<ShadowViewWrapper>(runtime)->node;
  auto props = ValueAsReadableMap(runtime, arguments[1]);
  auto instance = arguments[2].getObject(runtime);
  auto newNode = cloneNodeWithNewChildrenAndProps(manager, previousNode.get(), props.get());
  auto wrapper = std::make_unique<ShadowViewWrapper>(newNode);

  return Object::createFromHostObject(runtime, std::move(wrapper));
}

Value appendChild(jni::alias_ref<jobject> manager, Runtime& runtime, const Value* arguments, size_t count) {
  static auto appendChild =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<void(JShadowNode::javaobject, JShadowNode::javaobject)>("appendChild");

  auto parentNode = arguments[0].getObject(runtime).getHostObject<ShadowViewWrapper>(runtime)->node;
  auto childNode = arguments[1].getObject(runtime).getHostObject<ShadowViewWrapper>(runtime)->node;

  appendChild(manager, parentNode.get(), childNode.get());

  return Value::undefined();
}

Value createChildSet(jni::alias_ref<jobject> manager, Runtime& runtime, const Value* arguments, size_t count) {
  static auto createChildSet =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<alias_ref<JList>(jint)>("createChildSet");

  int rootTag = (int)arguments[0].getNumber();
  auto childSet = createChildSet(manager, rootTag);

  return Object::createFromHostObject(
    runtime,
    std::make_unique<ChildSetWrapper>(childSet)
  );
}

Value appendChildToSet(jni::alias_ref<jobject> manager, Runtime& runtime, const Value* arguments, size_t count) {
  static auto appendChildToSet =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<void(JList::javaobject, JShadowNode::javaobject)>("appendChildToSet");

  auto childSet = arguments[0].getObject(runtime).getHostObject<ChildSetWrapper>(runtime)->childSet;
  auto childNode = arguments[1].getObject(runtime).getHostObject<ShadowViewWrapper>(runtime)->node;

  appendChildToSet(manager, childSet.get(), childNode.get());

  return Value::undefined();
}

Value completeRoot(jni::alias_ref<jobject> manager, Runtime& runtime, const Value* arguments, size_t count) {
  static auto completeRoot =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<void(jint, JList::javaobject)>("completeRoot");

  int rootTag = (int)arguments[0].getNumber();
  auto childSet = arguments[1].getObject(runtime).getHostObject<ChildSetWrapper>(runtime)->childSet;

  completeRoot(manager, rootTag, childSet.get());

  return Value::undefined();
}

Value registerEventHandler(jni::alias_ref<jobject> manager, Runtime& runtime, const Value* arguments, size_t count) {
  static auto registerEventHandler =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<void(jlong)>("registerEventHandler");

  auto eventHandler = arguments[0].getObject(runtime).getFunction(runtime);

  registerEventHandler(manager, (jlong)new EventHandler(std::move(eventHandler)));

  return Value::undefined();
}

typedef Value(*FabricCallback)(jni::alias_ref<jobject> manager, Runtime& runtime, const Value* arguments, size_t count);

void addFabricMethod(
  jni::alias_ref<jobject> manager,
  Runtime *runtime,
  Object *module,
  const char *name,
  FabricCallback callback
) {
  jni::global_ref<jobject> retainedManager = make_global(manager);
  module->setProperty(
    *runtime,
    name,
    Function::createFromHostFunction(
      *runtime,
      PropNameID::forAscii(*runtime, name),
      1,
      [retainedManager, callback] (Runtime& runtime, const Value&, const Value* args, size_t count) {
        return callback(retainedManager, runtime, args, count);
      }
    )
  );
}

}

jni::local_ref<FabricJSIBinding::jhybriddata> FabricJSIBinding::initHybrid(
    jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

void FabricJSIBinding::releaseEventTarget(
  jlong jsContextNativePointer,
  jlong eventTargetPointer
) {
  EventTarget *target = (EventTarget *)((void *)eventTargetPointer);
  delete target;
}

void FabricJSIBinding::releaseEventHandler(
  jlong jsContextNativePointer,
  jlong eventHandlerPointer
) {
  EventHandler *target = (EventHandler *)((void *)eventHandlerPointer);
  delete target;
}

void FabricJSIBinding::dispatchEventToEmptyTarget(
  jlong jsContextNativePointer,
  jlong eventHandlerPointer,
  std::string type,
  NativeMap *payload
) {
  Runtime *runtime = (Runtime *)jsContextNativePointer;
  auto eventHandler = (EventHandler *)eventHandlerPointer;
  eventHandler->callback.call(*runtime, {
    jsi::Value::null(),
    jsi::String::createFromUtf8(*runtime, type),
    jsi::valueFromDynamic(*runtime, payload->consume())
  });
}

void FabricJSIBinding::dispatchEventToTarget(
  jlong jsContextNativePointer,
  jlong eventHandlerPointer,
  jlong eventTargetPointer,
  std::string type,
  NativeMap *payload
) {
  Runtime *runtime = (Runtime *)jsContextNativePointer;
  auto eventHandler = (EventHandler *)eventHandlerPointer;
  auto eventTarget = (EventTarget *)eventTargetPointer;
  eventHandler->callback.call(*runtime, {
    jsi::Value(*runtime, eventTarget->instanceHandle),
    jsi::String::createFromUtf8(*runtime, type),
    jsi::valueFromDynamic(*runtime, payload->consume())
  });
}

void FabricJSIBinding::installFabric(jlong jsContextNativePointer,
    jni::alias_ref<jobject> fabricUiManager) {
  Runtime* runtime = (Runtime*)jsContextNativePointer;

  Object module = Object(*runtime);

  addFabricMethod(fabricUiManager, runtime, &module, "createNode", createNode);
  addFabricMethod(fabricUiManager, runtime, &module, "cloneNode", cloneNode);
  addFabricMethod(fabricUiManager, runtime, &module, "cloneNodeWithNewChildren", cloneNodeWithNewChildren);
  addFabricMethod(fabricUiManager, runtime, &module, "cloneNodeWithNewProps", cloneNodeWithNewProps);
  addFabricMethod(fabricUiManager, runtime, &module, "cloneNodeWithNewChildrenAndProps", cloneNodeWithNewChildrenAndProps);

  addFabricMethod(fabricUiManager, runtime, &module, "appendChild", appendChild);
  addFabricMethod(fabricUiManager, runtime, &module, "createChildSet", createChildSet);
  addFabricMethod(fabricUiManager, runtime, &module, "appendChildToSet", appendChildToSet);
  addFabricMethod(fabricUiManager, runtime, &module, "completeRoot", completeRoot);

  addFabricMethod(fabricUiManager, runtime, &module, "registerEventHandler", registerEventHandler);

  runtime->global().setProperty(*runtime, "nativeFabricUIManager", module);
}

void FabricJSIBinding::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", FabricJSIBinding::initHybrid),
    makeNativeMethod("installFabric", FabricJSIBinding::installFabric),
    makeNativeMethod("releaseEventTarget", FabricJSIBinding::releaseEventTarget),
    makeNativeMethod("releaseEventHandler", FabricJSIBinding::releaseEventHandler),
    makeNativeMethod("dispatchEventToEmptyTarget", FabricJSIBinding::dispatchEventToEmptyTarget),
    makeNativeMethod("dispatchEventToTarget", FabricJSIBinding::dispatchEventToTarget),
  });
}

}
}
