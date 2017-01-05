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

#ifdef __i386__
// X86 ABI forces 16 byte stack allignment on calls. Unfortunately
// sometimes Dalvik chooses not to obey the ABI:
// - https://code.google.com/p/android/issues/detail?id=61012
// - https://android.googlesource.com/platform/ndk/+/81696d2%5E!/
// Therefore, we tell the compiler to re-align the stack on entry
// to our JNI functions.
#define JNI_ENTRY_POINT __attribute__((force_align_arg_pointer))
#else
#define JNI_ENTRY_POINT
#endif

// registration wrapper for legacy JNI-style functions

template<typename F, F func, typename C, typename... Args>
inline NativeMethodWrapper* exceptionWrapJNIMethod(void (*)(JNIEnv*, C, Args... args)) {
  struct funcWrapper {
    JNI_ENTRY_POINT static void call(JNIEnv* env, jobject obj, Args... args) {
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
    JNI_ENTRY_POINT static R call(JNIEnv* env, jobject obj, Args... args) {
      try {
        return (*func)(env, static_cast<JniType<C>>(obj), args...);
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
    JNI_ENTRY_POINT static void call(JNIEnv*, jobject obj,
                                     typename Convert<typename std::decay<Args>::type>::jniType... args) {
      try {
        (*func)(static_cast<JniType<C>>(obj), Convert<typename std::decay<Args>::type>::fromJni(args)...);
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

    JNI_ENTRY_POINT static typename Convert<typename std::decay<R>::type>::jniType call(JNIEnv*, jobject obj,
                                       typename Convert<typename std::decay<Args>::type>::jniType... args) {
      try {
        return Convert<typename std::decay<R>::type>::toJniRet(
          (*func)(static_cast<JniType<C>>(obj), Convert<typename std::decay<Args>::type>::fromJni(args)...));
      } catch (...) {
        using jniRet = typename Convert<typename std::decay<R>::type>::jniType;
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
    JNI_ENTRY_POINT static void call(JNIEnv* env, jobject obj,
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

    JNI_ENTRY_POINT static typename Convert<typename std::decay<R>::type>::jniType call(JNIEnv* env, jobject obj,
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
        using jniRet = typename Convert<typename std::decay<R>::type>::jniType;
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
  return jmethod_traits_from_cxx<R(Args...)>::descriptor();
}

template<typename R, typename C, typename... Args>
inline std::string makeDescriptor(R (C::*)(Args... args)) {
  return jmethod_traits_from_cxx<R(Args...)>::descriptor();
}

}

}}
