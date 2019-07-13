/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <sstream>
#include <string>

#include <fb/fbjni.h>
#include <jsi/jsi.h>

#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <jsi/JSIDynamic.h>
#include <react/jni/JCallback.h>
#include <react/jni/NativeMap.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/jni/WritableNativeMap.h>

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

namespace {

template <typename T>
std::string to_string(T v) {
  std::ostringstream stream;
  stream << v;
  return stream.str();
}

// This is used for generating short exception strings.
std::string stringifyJSIValue(const jsi::Value &v, jsi::Runtime *rt = nullptr) {
  if (v.isUndefined()) {
    return "undefined";
  }

  if (v.isNull()) {
    return "null";
  }

  if (v.isBool()) {
    return std::string("a boolean (") + (v.getBool() ? "true" : "false") + ")";
  }

  if (v.isNumber()) {
    return "a number (" + to_string(v.getNumber()) + ")";
  }

  if (v.isString()) {
    return "a string (\"" + v.getString(*rt).utf8(*rt) + "\")";
  }

  assert(v.isObject() && "Expecting object.");
  return rt != nullptr && v.getObject(*rt).isFunction(*rt) ? "a function"
                                                           : "an object";
}

class JavaTurboModuleArgumentConversionException : public std::runtime_error {
 public:
  JavaTurboModuleArgumentConversionException(
      const std::string &expectedType,
      int index,
      const std::string &methodName,
      const jsi::Value *arg,
      jsi::Runtime *rt)
      : std::runtime_error(
            "Expected argument " + to_string(index) + " of method \"" +
            methodName + "\" to be a " + expectedType + ", but got " +
            stringifyJSIValue(*arg, rt)) {}
};

class JavaTurboModuleInvalidArgumentTypeException : public std::runtime_error {
 public:
  JavaTurboModuleInvalidArgumentTypeException(
      const std::string &actualType,
      int argIndex,
      const std::string &methodName)
      : std::runtime_error(
            "Called method \"" + methodName + "\" with unsupported type " +
            actualType + " at argument " + to_string(argIndex)) {}
};

class JavaTurboModuleInvalidArgumentCountException : public std::runtime_error {
 public:
  JavaTurboModuleInvalidArgumentCountException(
      const std::string &methodName,
      int actualArgCount,
      int expectedArgCount)
      : std::runtime_error(
            "TurboModule method \"" + methodName + "\" called with " +
            to_string(actualArgCount) +
            " arguments (expected argument count: " +
            to_string(expectedArgCount) + ").") {}
};

/**
 * See
 * https://docs.oracle.com/javase/7/docs/technotes/guides/jni/spec/types.html
 * for a description of Java method signature structure.
 */
std::vector<std::string> getMethodArgTypesFromSignature(
    const std::string &methodSignature) {
  std::vector<std::string> methodArgs;

  for (auto it = methodSignature.begin(); it != methodSignature.end();
       it += 1) {
    if (*it == '(') {
      continue;
    }

    if (*it == ')') {
      break;
    }

    std::string type;

    if (*it == '[') {
      type += *it;
      it += 1;
    }

    if (*it == 'L') {
      for (; it != methodSignature.end(); it += 1) {
        type += *it;

        if (*it == ';') {
          break;
        }
      }
    } else {
      type += *it;
    }

    methodArgs.push_back(type);
  }

  return methodArgs;
}

} // namespace

// fnjni already does this conversion, but since we are using plain JNI, this
// needs to be done again
// TODO (axe) Reuse existing implementation as needed - the exist in
// MethodInvoker.cpp
std::vector<jvalue> convertJSIArgsToJNIArgs(
    JNIEnv *env,
    jsi::Runtime &rt,
    std::string methodName,
    std::vector<std::string> methodArgTypes,
    const jsi::Value *args,
    size_t count,
    std::shared_ptr<JSCallInvoker> jsInvoker,
    TurboModuleMethodValueKind valueKind) {
  unsigned int expectedArgumentCount = valueKind == PromiseKind
      ? methodArgTypes.size() - 1
      : methodArgTypes.size();

  if (expectedArgumentCount != count) {
    throw JavaTurboModuleInvalidArgumentCountException(
        methodName, count, expectedArgumentCount);
  }

  auto jargs =
      std::vector<jvalue>(valueKind == PromiseKind ? count + 1 : count);

  for (unsigned int argIndex = 0; argIndex < count; argIndex += 1) {
    std::string type = methodArgTypes.at(argIndex);

    const jsi::Value *arg = &args[argIndex];
    jvalue *jarg = &jargs[argIndex];

    if (type == "D") {
      if (!arg->isNumber()) {
        throw JavaTurboModuleArgumentConversionException(
            "number", argIndex, methodName, arg, &rt);
      }

      jarg->d = arg->getNumber();
      continue;
    }

    if (type == "Z") {
      if (!arg->isBool()) {
        throw JavaTurboModuleArgumentConversionException(
            "boolean", argIndex, methodName, arg, &rt);
      }

      jarg->z = (jboolean)arg->getBool();
      continue;
    }

    if (!(type == "Ljava/lang/Double;" || type == "Ljava/lang/Boolean;" ||
          type == "Ljava/lang/String;" ||
          type == "Lcom/facebook/react/bridge/ReadableArray;" ||
          type == "Lcom/facebook/react/bridge/Callback;" ||
          type == "Lcom/facebook/react/bridge/ReadableMap;")) {
      throw JavaTurboModuleInvalidArgumentTypeException(
          type, argIndex, methodName);
    }

    if (arg->isNull() || arg->isUndefined()) {
      jarg->l = nullptr;
      continue;
    }

    if (type == "Ljava/lang/Double;") {
      if (!arg->isNumber()) {
        throw JavaTurboModuleArgumentConversionException(
            "number", argIndex, methodName, arg, &rt);
      }

      jclass doubleClass = env->FindClass("java/lang/Double");
      jmethodID doubleConstructor =
          env->GetMethodID(doubleClass, "<init>", "(D)V");
      jarg->l =
          env->NewObject(doubleClass, doubleConstructor, arg->getNumber());
      continue;
    }

    if (type == "Ljava/lang/Boolean;") {
      if (!arg->isBool()) {
        throw JavaTurboModuleArgumentConversionException(
            "boolean", argIndex, methodName, arg, &rt);
      }

      jclass booleanClass = env->FindClass("java/lang/Boolean");
      jmethodID booleanConstructor =
          env->GetMethodID(booleanClass, "<init>", "(Z)V");
      jarg->l =
          env->NewObject(booleanClass, booleanConstructor, arg->getBool());
      continue;
    }

    if (type == "Ljava/lang/String;") {
      if (!arg->isString()) {
        throw JavaTurboModuleArgumentConversionException(
            "string", argIndex, methodName, arg, &rt);
      }

      jarg->l = env->NewStringUTF(arg->getString(rt).utf8(rt).c_str());
      continue;
    }

    if (type == "Lcom/facebook/react/bridge/ReadableArray;") {
      if (!(arg->isObject() && arg->getObject(rt).isArray(rt))) {
        throw JavaTurboModuleArgumentConversionException(
            "Array", argIndex, methodName, arg, &rt);
      }

      auto dynamicFromValue = jsi::dynamicFromValue(rt, *arg);
      auto jParams =
          ReadableNativeArray::newObjectCxxArgs(std::move(dynamicFromValue));
      jarg->l = jParams.release();
      continue;
    }

    if (type == "Lcom/facebook/react/bridge/Callback;") {
      if (!(arg->isObject() && arg->getObject(rt).isFunction(rt))) {
        throw JavaTurboModuleArgumentConversionException(
            "Function", argIndex, methodName, arg, &rt);
      }

      jsi::Function fn = arg->getObject(rt).getFunction(rt);
      jarg->l = createJavaCallbackFromJSIFunction(fn, rt, jsInvoker).release();
      continue;
    }

    if (type == "Lcom/facebook/react/bridge/ReadableMap;") {
      if (!(arg->isObject())) {
        throw JavaTurboModuleArgumentConversionException(
            "Object", argIndex, methodName, arg, &rt);
      }

      auto dynamicFromValue = jsi::dynamicFromValue(rt, *arg);
      auto jParams =
          ReadableNativeMap::createWithContents(std::move(dynamicFromValue));
      jarg->l = jParams.release();
      continue;
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

  std::vector<std::string> methodArgTypes =
      getMethodArgTypesFromSignature(methodSignature);
  std::vector<jvalue> jargs = convertJSIArgsToJNIArgs(
      env,
      runtime,
      methodName,
      methodArgTypes,
      args,
      count,
      jsInvoker_,
      valueKind);

  switch (valueKind) {
    case VoidKind: {
      env->CallVoidMethodA(instance, methodID, jargs.data());
      FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

      return jsi::Value::undefined();
    }
    case BooleanKind: {
      std::string returnType =
          methodSignature.substr(methodSignature.find_last_of(')') + 1);
      if (returnType == "Ljava/lang/Boolean;") {
        auto returnObject =
            (jobject)env->CallObjectMethodA(instance, methodID, jargs.data());
        FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

        if (returnObject == nullptr) {
          return jsi::Value::null();
        }

        jclass booleanClass = env->FindClass("java/lang/Boolean");
        jmethodID booleanValueMethod =
            env->GetMethodID(booleanClass, "booleanValue", "()Z");
        bool returnBoolean =
            (bool)env->CallBooleanMethod(returnObject, booleanValueMethod);
        FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

        return jsi::Value(returnBoolean);
      }

      bool returnBoolean =
          (bool)env->CallBooleanMethodA(instance, methodID, jargs.data());
      FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

      return jsi::Value(returnBoolean);
    }
    case NumberKind: {
      std::string returnType =
          methodSignature.substr(methodSignature.find_last_of(')') + 1);
      if (returnType == "Ljava/lang/Double;") {
        auto returnObject =
            (jobject)env->CallObjectMethodA(instance, methodID, jargs.data());
        FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

        if (returnObject == nullptr) {
          return jsi::Value::null();
        }

        jclass doubleClass = env->FindClass("java/lang/Double");
        jmethodID doubleValueMethod =
            env->GetMethodID(doubleClass, "doubleValue", "()D");
        double returnDouble =
            (double)env->CallDoubleMethod(returnObject, doubleValueMethod);
        FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

        return jsi::Value(returnDouble);
      }

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
