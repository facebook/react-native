/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <sstream>
#include <string>

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <ReactCommon/TurboModule.h>
#include <jsi/JSIDynamic.h>
#include <react/jni/NativeMap.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/jni/WritableNativeMap.h>

#include "JavaTurboModule.h"

namespace facebook {
namespace react {

JavaTurboModule::JavaTurboModule(
    const std::string &name,
    jni::alias_ref<JTurboModule> instance,
    std::shared_ptr<CallInvoker> jsInvoker,
    std::shared_ptr<CallInvoker> nativeInvoker)
    : TurboModule(name, jsInvoker),
      instance_(jni::make_global(instance)),
      nativeInvoker_(nativeInvoker) {}

namespace {

jni::local_ref<JCxxCallbackImpl::JavaPart> createJavaCallbackFromJSIFunction(
    jsi::Function &&function,
    jsi::Runtime &rt,
    std::shared_ptr<CallInvoker> jsInvoker) {
  auto weakWrapper =
      react::CallbackWrapper::createWeak(std::move(function), rt, jsInvoker);

  std::function<void(folly::dynamic)> fn =
      [weakWrapper,
       wrapperWasCalled = false](folly::dynamic responses) mutable {
        if (wrapperWasCalled) {
          throw std::runtime_error(
              "callback 2 arg cannot be called more than once");
        }

        auto strongWrapper = weakWrapper.lock();
        if (!strongWrapper) {
          return;
        }

        strongWrapper->jsInvoker().invokeAsync([weakWrapper, responses]() {
          auto strongWrapper2 = weakWrapper.lock();
          if (!strongWrapper2) {
            return;
          }

          // TODO (T43155926) valueFromDynamic already returns a Value array.
          // Don't iterate again
          jsi::Value args =
              jsi::valueFromDynamic(strongWrapper2->runtime(), responses);
          auto argsArray = args.getObject(strongWrapper2->runtime())
                               .asArray(strongWrapper2->runtime());
          std::vector<jsi::Value> result;
          for (size_t i = 0; i < argsArray.size(strongWrapper2->runtime());
               i++) {
            result.emplace_back(
                strongWrapper2->runtime(),
                argsArray.getValueAtIndex(strongWrapper2->runtime(), i));
          }
          strongWrapper2->callback().call(
              strongWrapper2->runtime(),
              (const jsi::Value *)result.data(),
              result.size());

          strongWrapper2->destroy();
        });

        wrapperWasCalled = true;
      };
  return JCxxCallbackImpl::newObjectCxxArgs(fn);
}

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
JNIArgs JavaTurboModule::convertJSIArgsToJNIArgs(
    JNIEnv *env,
    jsi::Runtime &rt,
    std::string methodName,
    std::vector<std::string> methodArgTypes,
    const jsi::Value *args,
    size_t count,
    std::shared_ptr<CallInvoker> jsInvoker,
    TurboModuleMethodValueKind valueKind) {
  unsigned int expectedArgumentCount = valueKind == PromiseKind
      ? methodArgTypes.size() - 1
      : methodArgTypes.size();

  if (expectedArgumentCount != count) {
    throw JavaTurboModuleInvalidArgumentCountException(
        methodName, count, expectedArgumentCount);
  }

  JNIArgs jniArgs(valueKind == PromiseKind ? count + 1 : count);
  auto &jargs = jniArgs.args_;
  auto &globalRefs = jniArgs.globalRefs_;

  auto makeGlobalIfNecessary =
      [&globalRefs, env, valueKind](jobject obj) -> jobject {
    if (valueKind == VoidKind) {
      jobject globalObj = env->NewGlobalRef(obj);
      globalRefs.push_back(globalObj);
      env->DeleteLocalRef(obj);
      return globalObj;
    }

    return obj;
  };

  jclass booleanClass = nullptr;
  jclass doubleClass = nullptr;

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

      if (doubleClass == nullptr) {
        doubleClass = env->FindClass("java/lang/Double");
      }

      jmethodID doubleConstructor =
          env->GetMethodID(doubleClass, "<init>", "(D)V");
      jarg->l = makeGlobalIfNecessary(
          env->NewObject(doubleClass, doubleConstructor, arg->getNumber()));
      continue;
    }

    if (type == "Ljava/lang/Boolean;") {
      if (!arg->isBool()) {
        throw JavaTurboModuleArgumentConversionException(
            "boolean", argIndex, methodName, arg, &rt);
      }

      if (booleanClass == nullptr) {
        booleanClass = env->FindClass("java/lang/Boolean");
      }

      jmethodID booleanConstructor =
          env->GetMethodID(booleanClass, "<init>", "(Z)V");
      jarg->l = makeGlobalIfNecessary(
          env->NewObject(booleanClass, booleanConstructor, arg->getBool()));
      continue;
    }

    if (type == "Ljava/lang/String;") {
      if (!arg->isString()) {
        throw JavaTurboModuleArgumentConversionException(
            "string", argIndex, methodName, arg, &rt);
      }

      jarg->l = makeGlobalIfNecessary(
          env->NewStringUTF(arg->getString(rt).utf8(rt).c_str()));
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
      jarg->l = makeGlobalIfNecessary(jParams.release());
      continue;
    }

    if (type == "Lcom/facebook/react/bridge/Callback;") {
      if (!(arg->isObject() && arg->getObject(rt).isFunction(rt))) {
        throw JavaTurboModuleArgumentConversionException(
            "Function", argIndex, methodName, arg, &rt);
      }

      jsi::Function fn = arg->getObject(rt).getFunction(rt);
      jarg->l = makeGlobalIfNecessary(
          createJavaCallbackFromJSIFunction(std::move(fn), rt, jsInvoker)
              .release());
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
      jarg->l = makeGlobalIfNecessary(jParams.release());
      continue;
    }
  }

  return jniArgs;
}

jsi::Value convertFromJMapToValue(JNIEnv *env, jsi::Runtime &rt, jobject arg) {
  // We currently use Java Argument.makeNativeMap() method to do this conversion
  // This could also be done purely in C++, but iterative over map methods
  // but those may end up calling reflection methods anyway
  // TODO (axe) Investigate the best way to convert Java Map to Value
  jclass jArguments = env->FindClass("com/facebook/react/bridge/Arguments");
  static jmethodID jMakeNativeMap = env->GetStaticMethodID(
      jArguments,
      "makeNativeMap",
      "(Ljava/util/Map;)Lcom/facebook/react/bridge/WritableNativeMap;");
  auto constants =
      (jobject)env->CallStaticObjectMethod(jArguments, jMakeNativeMap, arg);
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
    size_t argCount) {
  JNIEnv *env = jni::Environment::current();
  auto instance = instance_.get();

  /**
   * To account for jclasses and other misc LocalReferences we create.
   */
  unsigned int buffer = 6;
  /**
   * For promises, we have to create a resolve fn, a reject fn, and a promise
   * object. For normal returns, we just create the return object.
   */
  unsigned int maxReturnObjects = 3;

  /**
   * When the return type is void, all JNI LocalReferences are converted to
   * GlobalReferences. The LocalReferences are then promptly deleted
   * after the conversion.
   */
  unsigned int actualArgCount = valueKind == VoidKind ? 0 : argCount;
  unsigned int estimatedLocalRefCount =
      actualArgCount + maxReturnObjects + buffer;

  /**
   * This will push a new JNI stack frame for the LocalReferences in this
   * function call. When the stack frame for invokeJavaMethod is popped,
   * all LocalReferences are deleted.
   *
   * In total, there can be at most kJniLocalRefMax (= 512) Jni
   * LocalReferences alive at a time. estimatedLocalRefCount is provided
   * so that PushLocalFrame can throw an out of memory error when the total
   * number of alive LocalReferences is estimatedLocalRefCount smaller than
   * kJniLocalRefMax.
   */
  jni::JniLocalScope scope(env, estimatedLocalRefCount);

  jclass cls = env->GetObjectClass(instance);
  jmethodID methodID =
      env->GetMethodID(cls, methodName.c_str(), methodSignature.c_str());

  // If the method signature doesn't match, show a redbox here instead of
  // crashing later.
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

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

  JNIArgs jniArgs = convertJSIArgsToJNIArgs(
      env,
      runtime,
      methodName,
      methodArgTypes,
      args,
      argCount,
      jsInvoker_,
      valueKind);

  auto &jargs = jniArgs.args_;
  auto &globalRefs = jniArgs.globalRefs_;

  switch (valueKind) {
    case VoidKind: {
      nativeInvoker_->invokeAsync(
          [jargs, globalRefs, methodID, instance_ = instance_]() mutable
          -> void {
            /**
             * TODO(ramanpreet): Why do we have to require the environment
             * again? Why does JNI crash when we use the env from the upper
             * scope?
             */
            JNIEnv *env = jni::Environment::current();

            env->CallVoidMethodA(instance_.get(), methodID, jargs.data());
            FACEBOOK_JNI_THROW_PENDING_EXCEPTION();

            for (auto globalRef : globalRefs) {
              env->DeleteGlobalRef(globalRef);
            }
          });

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
          [this, &jargs, argCount, instance, methodID, env](
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
                               std::move(resolveJSIFn), runtime, jsInvoker_)
                               .release();
            auto reject = createJavaCallbackFromJSIFunction(
                              std::move(rejectJSIFn), runtime, jsInvoker_)
                              .release();

            jclass jPromiseImpl =
                env->FindClass("com/facebook/react/bridge/PromiseImpl");
            jmethodID jPromiseImplConstructor = env->GetMethodID(
                jPromiseImpl,
                "<init>",
                "(Lcom/facebook/react/bridge/Callback;Lcom/facebook/react/bridge/Callback;)V");

            jobject promise = env->NewObject(
                jPromiseImpl, jPromiseImplConstructor, resolve, reject);

            jargs[argCount].l = promise;
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
