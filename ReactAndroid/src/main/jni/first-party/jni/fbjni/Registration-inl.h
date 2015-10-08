/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "Exceptions.h"
#include "Hybrid.h"

namespace facebook {
namespace jni {

namespace detail {

// convert to HybridClass* from jhybridobject
template <typename T>
struct Convert<
  T, typename std::enable_if<
    std::is_base_of<BaseHybridClass, typename std::remove_pointer<T>::type>::value>::type> {
  typedef typename std::remove_pointer<T>::type::jhybridobject jniType;
  static T fromJni(jniType t) {
    if (t == nullptr) {
      return nullptr;
    }
    return facebook::jni::cthis(wrap_alias(t));
  }
  // There is no automatic return conversion for objects.
};

// registration wrapper for legacy JNI-style functions

template<typename F, F func, typename C, typename... Args>
inline NativeMethodWrapper* exceptionWrapJNIMethod(void (*)(JNIEnv*, C, Args... args)) {
  struct funcWrapper {
    static void call(JNIEnv* env, jobject obj, Args... args) {
      // Note that if func was declared noexcept, then both gcc and clang are smart
      // enough to elide the try/catch.
      try {
        (*func)(env, static_cast<C>(obj), args...);
      } catch (...) {
        translatePendingCppExceptionToJavaException();
      }
    }
  };

  // This intentionally erases the real type; JNI will do it anyway
  return reinterpret_cast<NativeMethodWrapper*>(&(funcWrapper::call));
}

template<typename F, F func, typename C, typename R, typename... Args>
inline NativeMethodWrapper* exceptionWrapJNIMethod(R (*)(JNIEnv*, C, Args... args)) {
  struct funcWrapper {
    static R call(JNIEnv* env, jobject obj, Args... args) {
      try {
        return (*func)(env, static_cast<C>(obj), args...);
      } catch (...) {
        translatePendingCppExceptionToJavaException();
        return R{};
      }
    }
  };

  // This intentionally erases the real type; JNI will do it anyway
  return reinterpret_cast<NativeMethodWrapper*>(&(funcWrapper::call));
}

// registration wrappers for functions, with autoconversion of arguments.

template<typename F, F func, typename C, typename... Args>
inline NativeMethodWrapper* exceptionWrapJNIMethod(void (*)(alias_ref<C>, Args... args)) {
  struct funcWrapper {
    static void call(JNIEnv*, jobject obj,
                     typename Convert<typename std::decay<Args>::type>::jniType... args) {
      try {
        (*func)(static_cast<C>(obj), Convert<typename std::decay<Args>::type>::fromJni(args)...);
      } catch (...) {
        translatePendingCppExceptionToJavaException();
      }
    }
  };

  // This intentionally erases the real type; JNI will do it anyway
  return reinterpret_cast<NativeMethodWrapper*>(&(funcWrapper::call));
}

template<typename F, F func, typename C, typename R, typename... Args>
inline NativeMethodWrapper* exceptionWrapJNIMethod(R (*)(alias_ref<C>, Args... args)) {
  struct funcWrapper {
    typedef typename Convert<typename std::decay<R>::type>::jniType jniRet;

    static jniRet call(JNIEnv*, jobject obj,
                       typename Convert<typename std::decay<Args>::type>::jniType... args) {
      try {
        return Convert<typename std::decay<R>::type>::toJniRet(
          (*func)(static_cast<C>(obj), Convert<typename std::decay<Args>::type>::fromJni(args)...));
      } catch (...) {
        translatePendingCppExceptionToJavaException();
        return jniRet{};
      }
    }
  };

  // This intentionally erases the real type; JNI will do it anyway
  return reinterpret_cast<NativeMethodWrapper*>(&(funcWrapper::call));
}

// registration wrappers for non-static methods, with autoconvertion of arguments.

template<typename M, M method, typename C, typename... Args>
inline NativeMethodWrapper* exceptionWrapJNIMethod(void (C::*method0)(Args... args)) {
  struct funcWrapper {
    static void call(JNIEnv* env, jobject obj,
                     typename Convert<typename std::decay<Args>::type>::jniType... args) {
      try {
        try {
          auto aref = wrap_alias(static_cast<typename C::jhybridobject>(obj));
          // This is usually a noop, but if the hybrid object is a
          // base class of other classes which register JNI methods,
          // this will get the right type for the registered method.
          auto cobj = static_cast<C*>(facebook::jni::cthis(aref));
          (cobj->*method)(Convert<typename std::decay<Args>::type>::fromJni(args)...);
        } catch (const std::exception& ex) {
          C::mapException(ex);
          throw;
        }
      } catch (...) {
        translatePendingCppExceptionToJavaException();
      }
    }
  };

  // This intentionally erases the real type; JNI will do it anyway
  return reinterpret_cast<NativeMethodWrapper*>(&(funcWrapper::call));
}

template<typename M, M method, typename C, typename R, typename... Args>
inline NativeMethodWrapper* exceptionWrapJNIMethod(R (C::*method0)(Args... args)) {
  struct funcWrapper {
    typedef typename Convert<typename std::decay<R>::type>::jniType jniRet;

    static jniRet call(JNIEnv* env, jobject obj,
                       typename Convert<typename std::decay<Args>::type>::jniType... args) {
      try {
        try {
          auto aref = wrap_alias(static_cast<typename C::jhybridobject>(obj));
          // This is usually a noop, but if the hybrid object is a
          // base class of other classes which register JNI methods,
          // this will get the right type for the registered method.
          auto cobj = static_cast<C*>(facebook::jni::cthis(aref));
          return Convert<typename std::decay<R>::type>::toJniRet(
            (cobj->*method)(Convert<typename std::decay<Args>::type>::fromJni(args)...));
        } catch (const std::exception& ex) {
          C::mapException(ex);
          throw;
        }
      } catch (...) {
        translatePendingCppExceptionToJavaException();
        return jniRet{};
      }
    }
  };

  // This intentionally erases the real type; JNI will do it anyway
  return reinterpret_cast<NativeMethodWrapper*>(&(funcWrapper::call));
}

template<typename R, typename C, typename... Args>
inline std::string makeDescriptor(R (*)(JNIEnv*, C, Args... args)) {
  return jmethod_traits<R(Args...)>::descriptor();
}

template<typename R, typename C, typename... Args>
inline std::string makeDescriptor(R (*)(alias_ref<C>, Args... args)) {
  typedef typename Convert<typename std::decay<R>::type>::jniType jniRet;
  return jmethod_traits<jniRet(typename Convert<typename std::decay<Args>::type>::jniType...)>
    ::descriptor();
}

template<typename R, typename C, typename... Args>
inline std::string makeDescriptor(R (C::*)(Args... args)) {
  typedef typename Convert<typename std::decay<R>::type>::jniType jniRet;
  return jmethod_traits<jniRet(typename Convert<typename std::decay<Args>::type>::jniType...)>
    ::descriptor();
}

}

}}
