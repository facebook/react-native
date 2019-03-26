// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "MethodInvoker.h"

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
#endif

#include <cxxreact/CxxNativeModule.h>
#include <fb/fbjni.h>

#include "JCallback.h"
#include "ReadableNativeArray.h"
#include "ReadableNativeMap.h"
#include "WritableNativeArray.h"
#include "WritableNativeMap.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

namespace {

using dynamic_iterator = folly::dynamic::const_iterator;

struct JPromiseImpl : public JavaClass<JPromiseImpl> {
  constexpr static auto kJavaDescriptor = "Lcom/facebook/react/bridge/PromiseImpl;";

  static local_ref<javaobject> create(local_ref<JCallback::javaobject> resolve, local_ref<JCallback::javaobject> reject) {
    return newInstance(resolve, reject);
  }
};

// HACK: Exposes constructor
struct ExposedReadableNativeArray : public ReadableNativeArray {
  explicit ExposedReadableNativeArray(folly::dynamic array)
    : ReadableNativeArray(std::move(array)) {}
};

jdouble extractDouble(const folly::dynamic& value) {
  if (value.isInt()) {
    return static_cast<jdouble>(value.getInt());
  } else {
    return static_cast<jdouble>(value.getDouble());
  }
}

local_ref<JCxxCallbackImpl::jhybridobject> extractCallback(std::weak_ptr<Instance>& instance, const folly::dynamic& value) {
  if (value.isNull()) {
    return local_ref<JCxxCallbackImpl::jhybridobject>(nullptr);
  } else {
    return JCxxCallbackImpl::newObjectCxxArgs(makeCallback(instance, value));
  }
}

local_ref<JPromiseImpl::javaobject> extractPromise(std::weak_ptr<Instance>& instance, dynamic_iterator& it, dynamic_iterator& end) {
  auto resolve = extractCallback(instance, *it++);
  CHECK(it != end);
  auto reject = extractCallback(instance, *it++);
  return JPromiseImpl::create(resolve, reject);
}

bool isNullable(char type) {
  switch (type) {
    case 'Z':
    case 'I':
    case 'F':
    case 'S':
    case 'A':
    case 'M':
    case 'X':
      return true;
    default:
      return false;;
  }
}

jvalue extract(std::weak_ptr<Instance>& instance, char type, dynamic_iterator& it, dynamic_iterator& end) {
  CHECK(it != end);
  jvalue value;
  if (type == 'P') {
    value.l = extractPromise(instance, it, end).release();
    return value;
  }

  const auto& arg = *it++;
  if (isNullable(type) && arg.isNull()) {
    value.l = nullptr;
    return value;
  }

  switch (type) {
    case 'z':
      value.z = static_cast<jboolean>(arg.getBool());
      break;
    case 'Z':
      value.l = JBoolean::valueOf(static_cast<jboolean>(arg.getBool())).release();
      break;
    case 'i':
      value.i = static_cast<jint>(arg.getInt());
      break;
    case 'I':
      value.l = JInteger::valueOf(static_cast<jint>(arg.getInt())).release();
      break;
    case 'f':
      value.f = static_cast<jfloat>(extractDouble(arg));
      break;
    case 'F':
      value.l = JFloat::valueOf(static_cast<jfloat>(extractDouble(arg))).release();
      break;
    case 'd':
      value.d = extractDouble(arg);
      break;
    case 'D':
      value.l = JDouble::valueOf(extractDouble(arg)).release();
      break;
    case 'S':
      value.l = make_jstring(arg.getString().c_str()).release();
      break;
    case 'A':
      value.l = ReadableNativeArray::newObjectCxxArgs(arg).release();
      break;
    case 'M':
      value.l = ReadableNativeMap::newObjectCxxArgs(arg).release();
      break;
    case 'X':
      value.l = extractCallback(instance, arg).release();
      break;
    default:
      LOG(FATAL) << "Unknown param type: " << type;
  }
  return value;
}

std::size_t countJsArgs(const std::string& signature) {
  std::size_t count = 0;
  for (char c : signature) {
    switch (c) {
      case 'P':
        count += 2;
        break;
      default:
        count += 1;
        break;
    }
  }
  return count;
}

}

MethodInvoker::MethodInvoker(alias_ref<JReflectMethod::javaobject> method, std::string signature, std::string traceName, bool isSync)
 : method_(method->getMethodID()),
 signature_(signature),
 jsArgCount_(countJsArgs(signature) -2),
 traceName_(std::move(traceName)),
 isSync_(isSync) {
     CHECK(signature_.at(1) == '.') << "Improper module method signature";
     CHECK(isSync_ || signature_.at(0) == 'v') << "Non-sync hooks cannot have a non-void return type";
}

MethodCallResult MethodInvoker::invoke(std::weak_ptr<Instance>& instance, alias_ref<JBaseJavaModule::javaobject> module, const folly::dynamic& params) {
  #ifdef WITH_FBSYSTRACE
  fbsystrace::FbSystraceSection s(
      TRACE_TAG_REACT_CXX_BRIDGE,
      isSync_ ? "callJavaSyncHook" : "callJavaModuleMethod",
      "method",
      traceName_);
  #endif

  if (params.size() != jsArgCount_) {
    throw std::invalid_argument(folly::to<std::string>("expected ", jsArgCount_, " arguments, got ", params.size()));
  }

  auto env = Environment::current();
  auto argCount = signature_.size() - 2;
  JniLocalScope scope(env, argCount);
  jvalue args[argCount];
  std::transform(
    signature_.begin() + 2,
    signature_.end(),
    args,
    [&instance, it = params.begin(), end = params.end()] (char type) mutable {
      return extract(instance, type, it, end);
  });

#define PRIMITIVE_CASE(METHOD) {                                             \
  auto result = env->Call ## METHOD ## MethodA(module.get(), method_, args); \
  throwPendingJniExceptionAsCppException();                                  \
  return folly::dynamic(result);                                             \
}

#define PRIMITIVE_CASE_CASTING(METHOD, RESULT_TYPE) {                        \
  auto result = env->Call ## METHOD ## MethodA(module.get(), method_, args); \
  throwPendingJniExceptionAsCppException();                                  \
  return folly::dynamic(static_cast<RESULT_TYPE>(result));                   \
}

#define OBJECT_CASE(JNI_CLASS, ACTIONS) {                                 \
  auto jobject = env->CallObjectMethodA(module.get(), method_, args);     \
  throwPendingJniExceptionAsCppException();                               \
  auto result = adopt_local(static_cast<JNI_CLASS::javaobject>(jobject)); \
  return folly::dynamic(result->ACTIONS());                               \
}

#define OBJECT_CASE_CASTING(JNI_CLASS, ACTIONS, RESULT_TYPE) {            \
  auto jobject = env->CallObjectMethodA(module.get(), method_, args);     \
  throwPendingJniExceptionAsCppException();                               \
  auto result = adopt_local(static_cast<JNI_CLASS::javaobject>(jobject)); \
  return folly::dynamic(static_cast<RESULT_TYPE>(result->ACTIONS()));     \
}

  char returnType = signature_.at(0);
  switch (returnType) {
    case 'v':
      env->CallVoidMethodA(module.get(), method_, args);
      throwPendingJniExceptionAsCppException();
      return folly::none;

    case 'z':
      PRIMITIVE_CASE_CASTING(Boolean, bool)
    case 'Z':
      OBJECT_CASE_CASTING(JBoolean, value, bool)
    case 'i':
      PRIMITIVE_CASE(Int)
    case 'I':
      OBJECT_CASE(JInteger, value)
    case 'd':
      PRIMITIVE_CASE(Double)
    case 'D':
      OBJECT_CASE(JDouble, value)
    case 'f':
      PRIMITIVE_CASE(Float)
    case 'F':
      OBJECT_CASE(JFloat, value)

    case 'S':
      OBJECT_CASE(JString, toStdString)
    case 'M':
      OBJECT_CASE(WritableNativeMap, cthis()->consume)
    case 'A':
      OBJECT_CASE(WritableNativeArray, cthis()->consume)

    default:
      LOG(FATAL) << "Unknown return type: " << returnType;
      return folly::none;
  }
}

}
}
