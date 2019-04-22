/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <string>

#include <fb/fbjni.h>
#include <jsi/jsi.h>

#include <jsireact/TurboModule.h>
#import <jsireact/TurboModuleUtils.h>

#include <jsi/JSIDynamic.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/jni/WritableNativeMap.h>
#include <react/jni/NativeMap.h>
#include <react/jni/JCallback.h>

#include "JavaTurboModule.h"

namespace facebook {
namespace react {

JavaTurboModule::JavaTurboModule(const std::string &name, jni::global_ref<JTurboModule> instance, std::shared_ptr<JSCallInvoker> jsInvoker)
  : TurboModule(name, jsInvoker), instance_(instance) {}

// fnjni already does this conversion, but since we are using plain JNI, this needs to be done again
// TODO (axe) Reuse existing implementation as needed - the exist in MethodInvoker.cpp
// TODO (axe) If at runtime, JS sends incorrect arguments and this is not typechecked, conversion here will fail. Check for that case (OSS)
std::unique_ptr<jvalue[]> convertFromJValueArgsToJNIArgs(
    JNIEnv *env,
    jsi::Runtime &rt,
    const jsi::Value *args,
    size_t count,
    std::shared_ptr<JSCallInvoker> jsInvoker
  ) {
  auto jargs = std::make_unique<jvalue[]>(count);
  for (size_t i = 0; i < count; i++) {
   const jsi::Value *arg = &args[i];
   if (arg->isBool()) {
     jargs[i].z = arg->getBool();
   } else if (arg->isNumber()) {
     jargs[i].d = arg->getNumber();
   } else if (arg->isNull() || arg->isUndefined()) {
     // What happens if Java is expecting a bool or a number, and JS sends a null or undefined?
     jargs[i].l = nullptr;
   } else if (arg->isString()) {
     // We are basically creating a whole new string here
     // TODO (axe) Is there a way to copy this instead of creating a whole new string ?
     jargs[i].l = env->NewStringUTF(arg->getString(rt).utf8(rt).c_str());
   } else if (arg->isObject()) {
     auto objectArg = arg->getObject(rt);
     // We are currently using folly:dynamic to convert JSON to Writable Map
     // TODO (axe) Don't use folly:dynamic, instead construct Java map directly
     if (objectArg.isArray(rt)) {
       auto dynamicFromValue = jsi::dynamicFromValue(rt, args[i]);
       auto jParams = ReadableNativeArray::newObjectCxxArgs(std::move(dynamicFromValue));
       jargs[i].l = jParams.release();
     } else if (objectArg.isFunction(rt)) {
       auto wrapper = std::make_shared<react::CallbackWrapper>(objectArg.getFunction(rt), rt, jsInvoker);
       std::function<void(folly::dynamic)> fn = [wrapper](folly::dynamic responses){
         if (wrapper == nullptr) {
           throw std::runtime_error("callback arg cannot be called more than once");
         }
         std::shared_ptr<react::CallbackWrapper> rw = wrapper;
         wrapper->jsInvoker->invokeAsync([rw, responses]() {
           // TODO (axe) valueFromDynamic already returns a Value array. Don't iterate again
           jsi::Value args = jsi::valueFromDynamic(rw->runtime, responses);
           auto argsArray = args.getObject(rw->runtime).asArray(rw->runtime);
           std::vector<jsi::Value> result;
           for (size_t i = 0; i < argsArray.size(rw->runtime); i++) {
             result.emplace_back(rw->runtime, argsArray.getValueAtIndex(rw->runtime, i));
           }
           rw->callback.call(rw->runtime, (const jsi::Value *)result.data(), result.size());
         });
       };
       wrapper = nullptr;
       // TODO Use our own implementation of callback instead of relying on JCxxCallbackImpl
       auto callback = JCxxCallbackImpl::newObjectCxxArgs(fn);
       jargs[i].l = callback.release();
     } else {
       auto dynamicFromValue = jsi::dynamicFromValue(rt, args[i]);
       auto jParams = ReadableNativeMap::createWithContents(std::move(dynamicFromValue));
       jargs[i].l =  jParams.release();
     }
   }
 }
  return jargs;
}

jsi::Value convertFromJMapToValue(JNIEnv *env, jsi::Runtime &rt, jobject arg) {
    // We currently use Java Argument.makeNativeMap() method to do this conversion
    // This could also be done purely in C++, but iterative over map methods
    // but those may end up calling reflection methods anyway
    // TODO (axe) Investigate the best way to convert Java Map to Value
    static jclass jArguments = env->FindClass("com/facebook/react/bridge/Arguments");
    static jmethodID jMakeNativeMap = env->GetStaticMethodID(jArguments, "makeNativeMap", "(Ljava/util/Map;)Lcom/facebook/react/bridge/WritableNativeMap;");
    auto constants = (jobject) env->CallStaticObjectMethod(jArguments, jMakeNativeMap, arg);
    auto jResult = jni::adopt_local(constants);
    auto result = jni::static_ref_cast<NativeMap::jhybridobject>(jResult);
    return jsi::valueFromDynamic(rt, result->cthis()->consume());
}

jsi::Value JavaTurboModule::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  std::string propNameUtf8 = propName.utf8(runtime);
  if (propNameUtf8 == "getConstants") {
    // This is the special method to get the constants from the module.
    // Since `getConstants` in Java only returns a Map, this function takes the map
    // and converts it to a WritableMap.
    return jsi::Function::createFromHostFunction(
      runtime,
      propName,
      0,
      [this](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) {
        JNIEnv *env = jni::Environment::current();
        jclass cls = env->FindClass(jClassName_.c_str());
        static jmethodID methodID = env->GetMethodID(cls, "getConstants", "()Ljava/util/Map;");
        auto constantsMap = (jobject) env->CallObjectMethod(instance_.get(), methodID);
        if (constantsMap == nullptr) {
          return jsi::Value::undefined();
        }
        return convertFromJMapToValue(env, rt, constantsMap);
      }
    );
  } else {
    return TurboModule::get(runtime, propName);
  }
}

jsi::Value JavaTurboModule::invokeJavaMethod(
    jsi::Runtime &rt,
    TurboModuleMethodValueKind valueKind,
    const std::string &methodName,
    const std::string &methodSignature,
    const jsi::Value *args,
    size_t count) {

  // We are using JNI directly instead of fbjni since we don't want template functiosn
  // when finding methods.
  JNIEnv *env = jni::Environment::current();
  // TODO (axe) Memoize this class, so that we don't have to find it for every calls
  jclass cls = env->FindClass(jClassName_.c_str());

  // TODO (axe) Memoize method call, so we don't look it up each time the method is called
  jmethodID methodID = env->GetMethodID(cls, methodName.c_str(), methodSignature.c_str());

  std::unique_ptr<jvalue[]>jargs = convertFromJValueArgsToJNIArgs(env, rt, args, count, jsInvoker_);
  auto instance = instance_.get();

  switch (valueKind) {
    case VoidKind: {
      env->CallVoidMethodA(instance, methodID, jargs.get());
      return jsi::Value::undefined();
    }
    case BooleanKind: {
      return jsi::Value((bool)env->CallBooleanMethodA(instance, methodID, jargs.get()));
    }
    case NumberKind: {
      return jsi::Value((double)env->CallDoubleMethodA(instance, methodID, jargs.get()));
    }
    case StringKind: {
      auto returnString = (jstring) env->CallObjectMethodA(instance, methodID, jargs.get());
      if (returnString == nullptr) {
        return jsi::Value::null();
      }
      const char *js = env->GetStringUTFChars(returnString, nullptr);
      std::string result = js;
      env->ReleaseStringUTFChars(returnString, js);
      return jsi::Value(rt, jsi::String::createFromUtf8(rt, result));
    }
    case ObjectKind: {
      auto returnObject = (jobject) env->CallObjectMethodA(instance, methodID, jargs.get());
      if (returnObject == nullptr) {
        return jsi::Value::null();
      }
      auto jResult = jni::adopt_local(returnObject);
      auto result = jni::static_ref_cast<NativeMap::jhybridobject>(jResult);
      return jsi::valueFromDynamic(rt, result->cthis()->consume());
    }
    case ArrayKind: {
      auto returnObject = (jobject) env->CallObjectMethodA(instance, methodID, jargs.get());
      if (returnObject == nullptr) {
        return jsi::Value::null();
      }
      auto jResult = jni::adopt_local(returnObject);
      auto result = jni::static_ref_cast<NativeArray::jhybridobject>(jResult);
      return jsi::valueFromDynamic(rt, result->cthis()->consume());
    }
    default:
      throw std::runtime_error("Unable to find method module: " + methodName + "(" + methodSignature + ")" + "in module " + jClassName_);
  }
}

} // namespace react
} // namespace facebook
