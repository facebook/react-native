/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricJSCBinding.h"
#include <fb/fbjni.h>
#include <jschelpers/JavaScriptCore.h>
#include <jschelpers/Unicode.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

namespace {

bool useCustomJSC = false;

struct JList : public JavaClass<JList> {
  static constexpr auto kJavaDescriptor = "Ljava/util/List;";
};

struct JShadowNode : public JavaClass<JShadowNode> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/uimanager/ReactShadowNode;";
};

typedef struct FabricJSCUIManager {
  FabricJSCUIManager(alias_ref<jobject> module, JSClassRef classRef, bool customJSC)
    : wrapperObjectClassRef(classRef)
    , useCustomJSC(customJSC) {
    fabricUiManager = make_global(module);
    JSC_JSClassRetain(useCustomJSC, wrapperObjectClassRef);
  }
  global_ref<jobject> fabricUiManager;
  JSClassRef wrapperObjectClassRef;
  bool useCustomJSC;

  ~FabricJSCUIManager() {
    JSC_JSClassRelease(useCustomJSC, wrapperObjectClassRef);
  }
} FabricJSCUIManager;

jobject makePlainGlobalRef(jobject object) {
  // When storing the global reference we need it to be a plain
  // pointer. That's why we use plain jni instead of fbjni here.
  return Environment::current()->NewGlobalRef(object);
}

local_ref<JString> JSValueToJString(JSContextRef ctx, JSValueRef value) {
  JSStringRef strRef = JSC_JSValueToStringCopy(ctx, value, NULL);
  const size_t size = JSStringGetMaximumUTF8CStringSize(strRef);
  char buffer[size];
  JSStringGetUTF8CString(strRef, buffer, size);
  JSC_JSStringRelease(ctx, strRef);
  return make_jstring(buffer);
}

local_ref<JShadowNode> JSValueToJShadowNode(JSContextRef ctx, JSValueRef value) {
  JSObjectRef obj = JSC_JSValueToObject(ctx, value, NULL);
  auto node = static_cast<JShadowNode::javaobject>(JSC_JSObjectGetPrivate(useCustomJSC, obj));
  return make_local(node);
}

local_ref<JList> JSValueToJList(JSContextRef ctx, JSValueRef value) {
  JSObjectRef obj = JSC_JSValueToObject(ctx, value, NULL);
  auto node = static_cast<JList::javaobject>(JSC_JSObjectGetPrivate(useCustomJSC, obj));
  return make_local(node);
}

local_ref<ReadableNativeMap::jhybridobject> JSValueToReadableMapViaJSON(JSContextRef ctx, JSValueRef value) {
  JSStringRef jsonRef = JSC_JSValueCreateJSONString(ctx, value, 0, NULL);
  size_t size = JSC_JSStringGetLength(ctx, jsonRef);
  const JSChar* utf16 = JSC_JSStringGetCharactersPtr(ctx, jsonRef);
  std::string json = unicode::utf16toUTF8(utf16, size);
  JSC_JSStringRelease(ctx, jsonRef);
  folly::dynamic dynamicValue = folly::parseJson(json);
  return ReadableNativeMap::newObjectCxxArgs(std::move(dynamicValue));
}

JSValueRef ReadableMapToJSValueViaJSON(JSContextRef ctx, NativeMap *map) {
  folly::dynamic dynamicValue = map->consume();
  auto json = folly::toJson(dynamicValue);
  JSStringRef jsonRef = JSC_JSStringCreateWithUTF8CString(ctx, json.c_str());
  auto value = JSC_JSValueMakeFromJSONString(ctx, jsonRef);
  JSC_JSStringRelease(ctx, jsonRef);
  return value;
}

JSValueRef createNode(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception) {
  FabricJSCUIManager *managerWrapper = (FabricJSCUIManager *)JSC_JSObjectGetPrivate(useCustomJSC, function);
  alias_ref<jobject> manager = managerWrapper->fabricUiManager;
  JSClassRef classRef = managerWrapper->wrapperObjectClassRef;

  static auto createNode =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<alias_ref<JShadowNode>(jint, jstring, jint, ReadableNativeMap::javaobject, jlong)>("createNode");

  int reactTag = (int)JSC_JSValueToNumber(ctx, arguments[0], NULL);
  auto viewName = JSValueToJString(ctx, arguments[1]);
  int rootTag = (int)JSC_JSValueToNumber(ctx, arguments[2], NULL);
  auto props = JSC_JSValueIsNull(ctx, arguments[3]) ? local_ref<ReadableNativeMap::jhybridobject>(nullptr) :
               JSValueToReadableMapViaJSON(ctx, arguments[3]);;
  auto instanceHandle = (void *)arguments[4];

  auto node = createNode(manager, reactTag, viewName.get(), rootTag, props.get(), (jlong)instanceHandle);

  return JSC_JSObjectMake(ctx, classRef, makePlainGlobalRef(node.get()));
}

JSValueRef cloneNode(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception) {
  FabricJSCUIManager *managerWrapper = (FabricJSCUIManager *)JSC_JSObjectGetPrivate(useCustomJSC, function);
  alias_ref<jobject> manager = managerWrapper->fabricUiManager;
  JSClassRef classRef = managerWrapper->wrapperObjectClassRef;

  static auto cloneNode =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<alias_ref<JShadowNode>(JShadowNode::javaobject, jlong)>("cloneNode");

  auto previousNode = JSValueToJShadowNode(ctx, arguments[0]);
  auto instanceHandle = (void *)arguments[1];
  auto newNode = cloneNode(manager, previousNode.get(), (jlong)instanceHandle);

  return JSC_JSObjectMake(ctx, classRef, makePlainGlobalRef(newNode.get()));
}

JSValueRef cloneNodeWithNewChildren(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception) {
  FabricJSCUIManager *managerWrapper = (FabricJSCUIManager *)JSC_JSObjectGetPrivate(useCustomJSC, function);
  alias_ref<jobject> manager = managerWrapper->fabricUiManager;
  JSClassRef classRef = managerWrapper->wrapperObjectClassRef;

  static auto cloneNodeWithNewChildren =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<alias_ref<JShadowNode>(JShadowNode::javaobject, jlong)>("cloneNodeWithNewChildren");

  auto previousNode = JSValueToJShadowNode(ctx, arguments[0]);
  auto instanceHandle = (void *)arguments[1];
  auto newNode = cloneNodeWithNewChildren(manager, previousNode.get(), (jlong)instanceHandle);

  return JSC_JSObjectMake(ctx, classRef, makePlainGlobalRef(newNode.get()));
}

JSValueRef cloneNodeWithNewProps(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception) {
  FabricJSCUIManager *managerWrapper = (FabricJSCUIManager *)JSC_JSObjectGetPrivate(useCustomJSC, function);
  alias_ref<jobject> manager = managerWrapper->fabricUiManager;
  JSClassRef classRef = managerWrapper->wrapperObjectClassRef;

  static auto cloneNodeWithNewProps =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<alias_ref<JShadowNode>(JShadowNode::javaobject, ReadableNativeMap::javaobject, jlong)>("cloneNodeWithNewProps");

  auto previousNode = JSValueToJShadowNode(ctx, arguments[0]);
  auto props = JSValueToReadableMapViaJSON(ctx, arguments[1]);
  auto instanceHandle = (void *)arguments[2];
  auto newNode = cloneNodeWithNewProps(manager, previousNode.get(), props.get(), (jlong)instanceHandle);

  return JSC_JSObjectMake(ctx, classRef, makePlainGlobalRef(newNode.get()));
}

JSValueRef cloneNodeWithNewChildrenAndProps(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception) {
  FabricJSCUIManager *managerWrapper = (FabricJSCUIManager *)JSC_JSObjectGetPrivate(useCustomJSC, function);
  alias_ref<jobject> manager = managerWrapper->fabricUiManager;
  JSClassRef classRef = managerWrapper->wrapperObjectClassRef;

  static auto cloneNodeWithNewChildrenAndProps =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<alias_ref<JShadowNode>(JShadowNode::javaobject, ReadableNativeMap::javaobject, jlong)>("cloneNodeWithNewChildrenAndProps");

  auto previousNode = JSValueToJShadowNode(ctx, arguments[0]);
  auto props = JSValueToReadableMapViaJSON(ctx, arguments[1]);
  auto instanceHandle = (void *)arguments[2];
  auto newNode = cloneNodeWithNewChildrenAndProps(manager, previousNode.get(), props.get(), (jlong)instanceHandle);

  return JSC_JSObjectMake(ctx, classRef, makePlainGlobalRef(newNode.get()));
}

JSValueRef appendChild(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception) {
  FabricJSCUIManager *managerWrapper = (FabricJSCUIManager *)JSC_JSObjectGetPrivate(useCustomJSC, function);
  alias_ref<jobject> manager = managerWrapper->fabricUiManager;

  static auto appendChild =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<void(JShadowNode::javaobject, JShadowNode::javaobject)>("appendChild");

  auto parentNode = JSValueToJShadowNode(ctx, arguments[0]);
  auto childNode = JSValueToJShadowNode(ctx, arguments[1]);

  appendChild(manager, parentNode.get(), childNode.get());

  return JSC_JSValueMakeUndefined(ctx);
}

JSValueRef createChildSet(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception) {
  FabricJSCUIManager *managerWrapper = (FabricJSCUIManager *)JSC_JSObjectGetPrivate(useCustomJSC, function);
  alias_ref<jobject> manager = managerWrapper->fabricUiManager;
  JSClassRef classRef = managerWrapper->wrapperObjectClassRef;

  static auto createChildSet =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<alias_ref<JList>(jint)>("createChildSet");

  int rootTag = (int)JSC_JSValueToNumber(ctx, arguments[0], NULL);
  auto childSet = createChildSet(manager, rootTag);

  return JSC_JSObjectMake(ctx, classRef, makePlainGlobalRef(childSet.get()));
}

JSValueRef appendChildToSet(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception) {
  FabricJSCUIManager *managerWrapper = (FabricJSCUIManager *)JSC_JSObjectGetPrivate(useCustomJSC, function);
  alias_ref<jobject> manager = managerWrapper->fabricUiManager;

  static auto appendChildToSet =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<void(JList::javaobject, JShadowNode::javaobject)>("appendChildToSet");

  auto childSet = JSValueToJList(ctx, arguments[0]);
  auto childNode = JSValueToJShadowNode(ctx, arguments[1]);

  appendChildToSet(manager, childSet.get(), childNode.get());

  return JSC_JSValueMakeUndefined(ctx);
}

JSValueRef completeRoot(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception) {
  FabricJSCUIManager *managerWrapper = (FabricJSCUIManager *)JSC_JSObjectGetPrivate(useCustomJSC, function);
  alias_ref<jobject> manager = managerWrapper->fabricUiManager;

  static auto completeRoot =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<void(jint, JList::javaobject)>("completeRoot");

  int rootTag = (int)JSC_JSValueToNumber(ctx, arguments[0], NULL);
  auto childSet = JSValueToJList(ctx, arguments[1]);

  completeRoot(manager, rootTag, childSet.get());

  return JSC_JSValueMakeUndefined(ctx);
}

JSValueRef registerEventHandler(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception) {
  FabricJSCUIManager *managerWrapper = (FabricJSCUIManager *)JSC_JSObjectGetPrivate(useCustomJSC, function);
  alias_ref<jobject> manager = managerWrapper->fabricUiManager;

  static auto registerEventHandler =
    jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<void(jlong)>("registerEventHandler");

  auto eventHandler = arguments[0];
  JSC_JSValueProtect(ctx, eventHandler);
  registerEventHandler(manager, (jlong)eventHandler);

  return JSC_JSValueMakeUndefined(ctx);
}

void finalizeJNIObject(JSObjectRef object) {
  // Release whatever global ref object we're storing here.
  jobject globalRef = (jobject)JSC_JSObjectGetPrivate(useCustomJSC, object);
  Environment::current()->DeleteGlobalRef(globalRef);
}

void finalizeWrapper(JSObjectRef object) {
  FabricJSCUIManager *managerWrapper = (FabricJSCUIManager *)JSC_JSObjectGetPrivate(useCustomJSC, object);
  delete managerWrapper;
}

void addFabricMethod(
  JSContextRef context,
  jni::alias_ref<jobject> fabricModule,
  JSClassRef nodeClassRef,
  JSObjectRef module,
  const char *name,
  JSObjectCallAsFunctionCallback callback
) {
  JSClassDefinition definition = kJSClassDefinitionEmpty;
  definition.callAsFunction = callback;
  definition.finalize = finalizeWrapper;
  JSClassRef classRef = JSC_JSClassCreate(useCustomJSC, &definition);
  FabricJSCUIManager *managerWrapper = new FabricJSCUIManager(fabricModule, nodeClassRef, useCustomJSC);
  JSObjectRef functionRef = JSC_JSObjectMake(context, classRef, managerWrapper);
  JSC_JSClassRelease(useCustomJSC, classRef);

  JSStringRef nameStr = JSC_JSStringCreateWithUTF8CString(context, name);
  JSC_JSObjectSetProperty(context, module, nameStr, functionRef, kJSPropertyAttributeNone, NULL);
  JSC_JSStringRelease(context, nameStr);
}

}

jni::local_ref<FabricJSCBinding::jhybriddata> FabricJSCBinding::initHybrid(
    jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

jlong FabricJSCBinding::createEventTarget(
  jlong jsContextNativePointer,
  jlong instanceHandlePointer
) {
  JSContextRef context = (JSContextRef)jsContextNativePointer;
  JSValueRef value = (JSValueRef)instanceHandlePointer;
  // Retain a strong reference to this object.
  JSC_JSValueProtect(context, value);
  return (jlong)((void *)value);
}

void FabricJSCBinding::releaseEventTarget(
  jlong jsContextNativePointer,
  jlong eventTargetPointer
) {
  JSContextRef context = (JSContextRef)jsContextNativePointer;
  JSValueRef value = (JSValueRef)((void *)eventTargetPointer);
  // Release this object.
  JSC_JSValueUnprotect(context, value);
}

void FabricJSCBinding::releaseEventHandler(
  jlong jsContextNativePointer,
  jlong eventHandlerPointer
) {
  JSContextRef context = (JSContextRef)jsContextNativePointer;
  JSValueRef value = (JSValueRef)((void *)eventHandlerPointer);
  // Release this function.
  JSC_JSValueUnprotect(context, value);
}

void FabricJSCBinding::dispatchEventToTarget(
  jlong jsContextNativePointer,
  jlong eventHandlerPointer,
  jlong eventTargetPointer,
  std::string type,
  NativeMap *payloadMap
) {
  JSContextRef context = (JSContextRef)jsContextNativePointer;
  JSObjectRef eventHandler = (JSObjectRef)((void *)eventHandlerPointer);
  JSObjectRef eventTarget = (JSObjectRef)((void *)eventTargetPointer);

  JSObjectRef thisArg = (JSObjectRef)JSC_JSValueMakeUndefined(context);
  JSStringRef typeStr = JSC_JSStringCreateWithUTF8CString(context, type.c_str());
  JSValueRef typeRef = JSC_JSValueMakeString(context, typeStr);
  JSC_JSStringRelease(context, typeStr);
  JSValueRef payloadRef = ReadableMapToJSValueViaJSON(context, payloadMap);
  JSValueRef args[] = {eventTarget, typeRef, payloadRef};
  JSValueRef exn;
  JSValueRef result = JSC_JSObjectCallAsFunction(
    context,
    eventHandler,
    thisArg,
    3,
    args,
    &exn
  );
  if (!result) {
    // TODO: Handle error in exn
  }
}

void FabricJSCBinding::installFabric(jlong jsContextNativePointer,
    jni::alias_ref<jobject> fabricModule) {
  JSContextRef context = (JSContextRef)jsContextNativePointer;
  useCustomJSC = facebook::react::isCustomJSCPtr(context);

  JSObjectRef module = JSC_JSObjectMake(context, NULL, NULL);

  // Class definition for wrapper objects around nodes and sets
  JSClassDefinition definition = kJSClassDefinitionEmpty;
  definition.finalize = finalizeJNIObject;
  JSClassRef classRef = JSC_JSClassCreate(useCustomJSC, &definition);

  addFabricMethod(context, fabricModule, classRef, module, "createNode", createNode);
  addFabricMethod(context, fabricModule, classRef, module, "cloneNode", cloneNode);
  addFabricMethod(context, fabricModule, classRef, module, "cloneNodeWithNewChildren", cloneNodeWithNewChildren);
  addFabricMethod(context, fabricModule, classRef, module, "cloneNodeWithNewProps", cloneNodeWithNewProps);
  addFabricMethod(context, fabricModule, classRef, module, "cloneNodeWithNewChildrenAndProps", cloneNodeWithNewChildrenAndProps);

  addFabricMethod(context, fabricModule, classRef, module, "appendChild", appendChild);
  addFabricMethod(context, fabricModule, classRef, module, "createChildSet", createChildSet);
  addFabricMethod(context, fabricModule, classRef, module, "appendChildToSet", appendChildToSet);
  addFabricMethod(context, fabricModule, classRef, module, "completeRoot", completeRoot);

  addFabricMethod(context, fabricModule, classRef, module, "registerEventHandler", registerEventHandler);

  JSC_JSClassRelease(useCustomJSC, classRef);

  JSObjectRef globalObject = JSC_JSContextGetGlobalObject(context);
  JSStringRef globalName = JSC_JSStringCreateWithUTF8CString(context, "nativeFabricUIManager");
  JSC_JSObjectSetProperty(context, globalObject, globalName, module, kJSPropertyAttributeNone, NULL);
  JSC_JSStringRelease(context, globalName);
}

void FabricJSCBinding::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", FabricJSCBinding::initHybrid),
    makeNativeMethod("installFabric", FabricJSCBinding::installFabric),
    makeNativeMethod("createEventTarget", FabricJSCBinding::createEventTarget),
    makeNativeMethod("releaseEventTarget", FabricJSCBinding::releaseEventTarget),
    makeNativeMethod("releaseEventHandler", FabricJSCBinding::releaseEventHandler),
    makeNativeMethod("dispatchEventToTarget", FabricJSCBinding::dispatchEventToTarget),
  });
}

}
}
