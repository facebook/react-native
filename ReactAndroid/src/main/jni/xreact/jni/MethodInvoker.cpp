// Copyright 2004-present Facebook. All Rights Reserved.

#include "MethodInvoker.h"

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
#endif

#include <cxxreact/CxxNativeModule.h>

#include "JCallback.h"
#include "JExecutorToken.h"
#include "ReadableNativeArray.h"
#include "ReadableNativeMap.h"

namespace facebook {
namespace react {

namespace {

using dynamic_iterator = folly::dynamic::const_iterator;

struct JPromiseImpl : public jni::JavaClass<JPromiseImpl> {
  constexpr static auto kJavaDescriptor = "Lcom/facebook/react/bridge/PromiseImpl;";

  static jni::local_ref<javaobject> create(jni::local_ref<JCallback::javaobject> resolve, jni::local_ref<JCallback::javaobject> reject) {
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

jni::local_ref<JCallbackImpl::jhybridobject> extractCallback(std::weak_ptr<Instance>& instance, ExecutorToken token, const folly::dynamic& value) {
  if (value.isNull()) {
    return jni::local_ref<JCallbackImpl::jhybridobject>(nullptr);
  } else {
    return JCallbackImpl::newObjectCxxArgs(makeCallback(instance, token, value));
  }
}

jni::local_ref<JPromiseImpl::javaobject> extractPromise(std::weak_ptr<Instance>& instance, ExecutorToken token, dynamic_iterator& it, dynamic_iterator& end) {
  auto resolve = extractCallback(instance, token, *it++);
  CHECK(it != end);
  auto reject = extractCallback(instance, token, *it++);
  return JPromiseImpl::create(resolve, reject);
}

jobject valueOf(jboolean value) {
  static auto kClass = jni::findClassStatic("java/lang/Boolean");
  static auto kValueOf = kClass->getStaticMethod<jobject(jboolean)>("valueOf");
  return kValueOf(kClass, value).release();
}

jobject valueOf(jint value) {
  static auto kClass = jni::findClassStatic("java/lang/Integer");
  static auto kValueOf = kClass->getStaticMethod<jobject(jint)>("valueOf");
  return kValueOf(kClass, value).release();
}

jobject valueOf(jdouble value) {
  static auto kClass = jni::findClassStatic("java/lang/Double");
  static auto kValueOf = kClass->getStaticMethod<jobject(jdouble)>("valueOf");
  return kValueOf(kClass, value).release();
}

jobject valueOf(jfloat value) {
  static auto kClass = jni::findClassStatic("java/lang/Float");
  static auto kValueOf = kClass->getStaticMethod<jobject(jfloat)>("valueOf");
  return kValueOf(kClass, value).release();
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

jvalue extract(std::weak_ptr<Instance>& instance, ExecutorToken token, char type, dynamic_iterator& it, dynamic_iterator& end) {
  CHECK(it != end);
  jvalue value;
  if (type == 'P') {
    value.l = extractPromise(instance, token, it, end).release();
    return value;
  } else if (type == 'T') {
    value.l = JExecutorToken::extractJavaPartFromToken(token).release();
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
      value.l = valueOf(static_cast<jboolean>(arg.getBool()));
      break;
    case 'i':
      value.i = static_cast<jint>(arg.getInt());
      break;
    case 'I':
      value.l = valueOf(static_cast<jint>(arg.getInt()));
      break;
    case 'f':
      value.f = static_cast<jfloat>(extractDouble(arg));
      break;
    case 'F':
      value.l = valueOf(static_cast<jfloat>(extractDouble(arg)));
      break;
    case 'd':
      value.d = extractDouble(arg);
      break;
    case 'D':
      value.l = valueOf(extractDouble(arg));
      break;
    case 'S':
      value.l = jni::make_jstring(arg.getString().c_str()).release();
      break;
    case 'A':
      value.l = ReadableNativeArray::newObjectCxxArgs(arg).release();
      break;
    case 'M':
      value.l = ReadableNativeMap::newObjectCxxArgs(arg).release();
      break;
    case 'X':
      value.l = extractCallback(instance, token, arg).release();
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
      case 'T':
        break;
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

MethodInvoker::MethodInvoker(jni::alias_ref<JReflectMethod::javaobject> method, std::string signature, std::string traceName, bool isSync)
 : method_(method->getMethodID()),
 jsArgCount_(countJsArgs(signature) - 2),
 signature_(std::move(signature)),
 traceName_(std::move(traceName)),
 isSync_(isSync) {
   CHECK(signature_.at(1) == '.') << "Improper module method signature";
   CHECK(!isSync || signature_.at(0) == 'v') << "Non-sync hooks cannot have a non-void return type";
 }

MethodCallResult MethodInvoker::invoke(std::weak_ptr<Instance>& instance, JBaseJavaModule::javaobject module, ExecutorToken token, const folly::dynamic& params) {
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
  auto argCount = signature_.size() - 2;
  jni::JniLocalScope scope(jni::Environment::current(), argCount);
  jvalue args[argCount];
  std::transform(
    signature_.begin() + 2,
    signature_.end(),
    args,
    [&instance, token, it = params.begin(), end = params.end()] (char type) mutable {
      return extract(instance, token, type, it, end);
  });

  // TODO(t10768795): Use fbjni here
  folly::dynamic ret = folly::dynamic::object();
  bool isReturnUndefined = false;
  char returnType = signature_.at(0);
  switch (returnType) {
    case 'v':
      jni::Environment::current()->CallVoidMethodA(module, method_, args);
      ret = nullptr;
      isReturnUndefined = true;
      break;
    default:
      LOG(FATAL) << "Unknown return type: " << returnType;
    // TODO: other cases
  }

  jni::throwPendingJniExceptionAsCppException();

  return MethodCallResult{ret, isReturnUndefined};
}

}
}
