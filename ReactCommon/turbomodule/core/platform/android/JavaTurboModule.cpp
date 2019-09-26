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

jni::local_ref<JCxxCallbackImpl::JavaPart> createJavaCallbackFromJSIFunction(
    jsi::Function &function,
    jsi::Runtime &rt,
    std::shared_ptr<JSCallInvoker> jsInvoker) {
  auto wrapper = std::make_shared<react::CallbackWrapper>(
      std::move(function), rt, jsInvoker);
  std::function<void(folly::dynamic)> fn = [wrapper](folly::dynamic responses) {
    if (wrapper == nullptr) {
      throw std::runtime_error("callback arg cannot be called more than once");
    }
    std::shared_ptr<react::CallbackWrapper> rw = wrapper;
    wrapper->jsInvoker->invokeAsync([rw, responses]() {
      // TODO (T43155926) valueFromDynamic already returns a Value array. Don't
      // iterate again
      jsi::Value args = jsi::valueFromDynamic(rw->runtime, responses);
      auto argsArray = args.getObject(rw->runtime).asArray(rw->runtime);
      std::vector<jsi::Value> result;
      for (size_t i = 0; i < argsArray.size(rw->runtime); i++) {
        result.emplace_back(
            rw->runtime, argsArray.getValueAtIndex(rw->runtime, i));
      }
      rw->callback.call(
          rw->runtime, (const jsi::Value *)result.data(), result.size());
    });
  };
  wrapper = nullptr;
  return JCxxCallbackImpl::newObjectCxxArgs(fn);
}

// fnjni already does this conversion, but since we are using plain JNI, this needs to be done again
// TODO (axe) Reuse existing implementation as needed - the exist in MethodInvoker.cpp
// TODO (axe) If at runtime, JS sends incorrect arguments and this is not typechecked, conversion here will fail. Check for that case (OSS)
std::vector<jvalue> convertJSIArgsToJNIArgs(
    JNIEnv *env,
    jsi::Runtime &rt,
    const jsi::Value *args,
    size_t count,
    std::shared_ptr<JSCallInvoker> jsInvoker,
    TurboModuleMethodValueKind valueKind) {
  auto jargs =
      std::vector<jvalue>(valueKind == PromiseKind ? count + 1 : count);
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
       jsi::Function fn = objectArg.getFunction(rt);
       jargs[i].l =
           createJavaCallbackFromJSIFunction(fn, rt, jsInvoker).release();
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
    jclass jArguments = env->FindClass("com/facebook/react/bridge/Arguments");
    static jmethodID jMakeNativeMap = env->GetStaticMethodID(jArguments, "makeNativeMap", "(Ljava/util/Map;)Lcom/facebook/react/bridge/WritableNativeMap;");
    auto constants = (jobject) env->CallStaticObjectMethod(jArguments, jMakeNativeMap, arg);
    auto jResult = jni::adopt_local(constants);
    auto result = jni::static_ref_cast<NativeMap::jhybridobject>(jResult);
    return jsi::valueFromDynamic(rt, result->cthis()->consume());
}

jsi::Value JavaTurboModule::invokeJavaMethod(
    jsi::Runtime &runtime,
    TurboModuleMethodValueKind valueKind,
    const std::string &methodName,
    const std::string &methodSignature,
    const jsi::Value *args,
    size_t count) {
  JNIEnv *env = jni::Environment::current();
  auto instance = instance_.get();

  jclass cls = env->GetObjectClass(instance);
  jmethodID methodID =
      env->GetMethodID(cls, methodName.c_str(), methodSignature.c_str());

  // TODO(T43933641): Refactor to remove this special-casing
  if (methodName == "getConstants") {
    auto constantsMap = (jobject)env->CallObjectMethod(instance, methodID);
    FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

    if (constantsMap == nullptr) {
      return jsi::Value::undefined();
    }

    return convertFromJMapToValue(env, runtime, constantsMap);
  }

  std::vector<jvalue> jargs =
      convertJSIArgsToJNIArgs(env, runtime, args, count, jsInvoker_, valueKind);

  switch (valueKind) {
    case VoidKind: {
      env->CallVoidMethodA(instance, methodID, jargs.data());
      FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

      return jsi::Value::undefined();
    }
    case BooleanKind: {
      bool returnBoolean =
          (bool)env->CallBooleanMethodA(instance, methodID, jargs.data());
      FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

      return jsi::Value(returnBoolean);
    }
    case NumberKind: {
      double returnDouble =
          (double)env->CallDoubleMethodA(instance, methodID, jargs.data());
      FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

      return jsi::Value(returnDouble);
    }
    case StringKind: {
      auto returnString =
          (jstring)env->CallObjectMethodA(instance, methodID, jargs.data());
      FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

      if (returnString == nullptr) {
        return jsi::Value::null();
      }
      const char *js = env->GetStringUTFChars(returnString, nullptr);
      std::string result = js;
      env->ReleaseStringUTFChars(returnString, js);
      return jsi::Value(runtime, jsi::String::createFromUtf8(runtime, result));
    }
    case ObjectKind: {
      auto returnObject =
          (jobject)env->CallObjectMethodA(instance, methodID, jargs.data());
      FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

      if (returnObject == nullptr) {
        return jsi::Value::null();
      }
      auto jResult = jni::adopt_local(returnObject);
      auto result = jni::static_ref_cast<NativeMap::jhybridobject>(jResult);
      return jsi::valueFromDynamic(runtime, result->cthis()->consume());
    }
    case ArrayKind: {
      auto returnObject =
          (jobject)env->CallObjectMethodA(instance, methodID, jargs.data());
      FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

      if (returnObject == nullptr) {
        return jsi::Value::null();
      }
      auto jResult = jni::adopt_local(returnObject);
      auto result = jni::static_ref_cast<NativeArray::jhybridobject>(jResult);
      return jsi::valueFromDynamic(runtime, result->cthis()->consume());
    }
    case PromiseKind: {
      jsi::Function Promise =
          runtime.global().getPropertyAsFunction(runtime, "Promise");

      jsi::Function promiseConstructorArg = jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "fn"),
          2,
          [this, &jargs, count, instance, methodID, env](
              jsi::Runtime &runtime,
              const jsi::Value &thisVal,
              const jsi::Value *promiseConstructorArgs,
              size_t promiseConstructorArgCount) {
            if (promiseConstructorArgCount != 2) {
              throw std::invalid_argument("Promise fn arg count must be 2");
            }

            jsi::Function resolveJSIFn =
                promiseConstructorArgs[0].getObject(runtime).getFunction(
                    runtime);
            jsi::Function rejectJSIFn =
                promiseConstructorArgs[1].getObject(runtime).getFunction(
                    runtime);

            auto resolve = createJavaCallbackFromJSIFunction(
                               resolveJSIFn, runtime, jsInvoker_)
                               .release();
            auto reject = createJavaCallbackFromJSIFunction(
                              rejectJSIFn, runtime, jsInvoker_)
                              .release();

            jclass cls =
                env->FindClass("com/facebook/react/bridge/PromiseImpl");
            jmethodID constructor = env->GetMethodID(
                cls,
                "<init>",
                "(Lcom/facebook/react/bridge/Callback;Lcom/facebook/react/bridge/Callback;)V");
            jobject promise = env->NewObject(cls, constructor, resolve, reject);

            jargs[count].l = promise;
            env->CallVoidMethodA(instance, methodID, jargs.data());

            return jsi::Value::undefined();
          });

      jsi::Value promise =
          Promise.callAsConstructor(runtime, promiseConstructorArg);
      FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

      return promise;
    }
    default:
      throw std::runtime_error(
          "Unable to find method module: " + methodName + "(" +
          methodSignature + ")");
  }
}

} // namespace react
} // namespace facebook
