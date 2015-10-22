/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include <memory>
#include <type_traits>
#include <fb/assert.h>
#include "CoreClasses.h"

namespace facebook {
namespace jni {

namespace detail {

class BaseHybridClass : public BaseJavaClass {
public:
  virtual ~BaseHybridClass() {}
};

struct HybridData : public JavaClass<HybridData> {
  constexpr static auto kJavaDescriptor = "Lcom/facebook/jni/HybridData;";
};

void setNativePointer(alias_ref<HybridData::javaobject> hybridData,
                      std::unique_ptr<BaseHybridClass> new_value);
BaseHybridClass* getNativePointer(alias_ref<HybridData::javaobject> hybridData);
local_ref<HybridData::javaobject> getHybridData(alias_ref<jobject> jthis,
                                                JField<HybridData::javaobject> field);

// Normally, pass through types unmolested.
template <typename T, typename Enabled = void>
struct Convert {
  typedef T jniType;
  static jniType fromJni(jniType t) {
    return t;
  }
  static jniType toJniRet(jniType t) {
    return t;
  }
  static jniType toCall(jniType t) {
    return t;
  }
};

// This is needed for return conversion
template <>
struct Convert<void> {
  typedef void jniType;
};

// convert to std::string from jstring
template <>
struct Convert<std::string> {
  typedef jstring jniType;
  static std::string fromJni(jniType t) {
    return wrap_alias(t)->toStdString();
  }
  static jniType toJniRet(const std::string& t) {
    return make_jstring(t).release();
  }
  static local_ref<jstring> toCall(const std::string& t) {
    return make_jstring(t);
  }
};

// convert return from const char*
template <>
struct Convert<const char*> {
  typedef jstring jniType;
  // no automatic synthesis of const char*.  (It can't be freed.)
  static jniType toJniRet(const char* t) {
    return make_jstring(t).release();
  }
  static local_ref<jstring> toCall(const char* t) {
    return make_jstring(t);
  }
};

// jboolean is an unsigned char, not a bool. Allow it to work either way.
template<>
struct Convert<bool> {
  typedef jboolean jniType;
  static bool fromJni(jniType t) {
    return t;
  }
  static jniType toJniRet(bool t) {
    return t;
  }
  static jniType toCall(bool t) {
    return t;
  }
};

// convert to alias_ref<T> from T
template <typename T>
struct Convert<alias_ref<T>> {
  typedef T jniType;
  static alias_ref<jniType> fromJni(jniType t) {
    return wrap_alias(t);
  }
  static jniType toJniRet(alias_ref<jniType> t) {
    return t.get();
  }
  static jniType toCall(alias_ref<jniType> t) {
    return t.get();
  }
};

// convert return from local_ref<T>
template <typename T>
struct Convert<local_ref<T>> {
  typedef T jniType;
  // No automatic synthesis of local_ref
  static jniType toJniRet(local_ref<jniType> t) {
    return t.release();
  }
  static jniType toCall(local_ref<jniType> t) {
    return t.get();
  }
};

// convert return from global_ref<T>
template <typename T>
struct Convert<global_ref<T>> {
  typedef T jniType;
  // No automatic synthesis of global_ref
  static jniType toJniRet(global_ref<jniType> t) {
    return t.get();
  }
  static jniType toCall(global_ref<jniType> t) {
    return t.get();
  }
};

// In order to avoid potentially filling the jni locals table,
// temporary objects (right now, this is just jstrings) need to be
// released.  This is done by returning a holder which autoconverts to
// jstring.  This is only relevant when the jniType is passed down, as
// in newObjectJavaArgs.

template <typename T>
inline T callToJni(T&& t) {
  return t;
}

inline jstring callToJni(local_ref<jstring>&& sref) {
  return sref.get();
}

struct jstring_holder {
  local_ref<jstring> s_;
  jstring_holder(const char* s) : s_(make_jstring(s)) {}
  operator jstring() { return s_.get(); }
};

template <typename T, typename Enabled = void>
struct HybridRoot {};

template <typename T>
struct HybridRoot<T,
                  typename std::enable_if<!std::is_base_of<BaseHybridClass, T>::value>::type>
    : public BaseHybridClass {};

}

template <typename T, typename Base = detail::BaseHybridClass>
class HybridClass : public Base
                  , public detail::HybridRoot<Base>
                  , public JavaClass<T, Base> {
public:
  typedef detail::HybridData::javaobject jhybriddata;
  typedef typename JavaClass<T, Base>::javaobject jhybridobject;

  using JavaClass<T, Base>::javaClassStatic;
  using JavaClass<T, Base>::javaClassLocal;
  using JavaClass<T, Base>::javaobject;
  typedef typename JavaClass<T, Base>::_javaobject _javaobject;

protected:
  typedef HybridClass HybridBase;

  // This ensures that a C++ hybrid part cannot be created on its own
  // by default.  If a hybrid wants to enable this, it can provide its
  // own public ctor, or change the accessibility of this to public.
  using Base::Base;

  static void registerHybrid(std::initializer_list<NativeMethod> methods) {
    javaClassStatic()->registerNatives(methods);
  }

  static local_ref<jhybriddata> makeHybridData(std::unique_ptr<T> cxxPart) {
    static auto dataCtor = detail::HybridData::javaClassStatic()->getConstructor<jhybriddata()>();
    auto hybridData = detail::HybridData::javaClassStatic()->newObject(dataCtor);
    detail::setNativePointer(hybridData, std::move(cxxPart));
    return hybridData;
  }

  template <typename... Args>
  static local_ref<jhybriddata> makeCxxInstance(Args&&... args) {
    return makeHybridData(std::unique_ptr<T>(new T(std::forward<Args>(args)...)));
  }

public:
  // Factory method for creating a hybrid object where the arguments
  // are used to initialize the C++ part directly without passing them
  // through java.  This method requires the Java part to have a ctor
  // which takes a HybridData, and for the C++ part to have a ctor
  // compatible with the arguments passed here.  For safety, the ctor
  // can be private, and the hybrid declared a friend of its base, so
  // the hybrid can only be created from here.
  //
  // Exception behavior: This can throw an exception if creating the
  // C++ object fails, or any JNI methods throw.
  template <typename... Args>
  static local_ref<jhybridobject> newObjectCxxArgs(Args&&... args) {
    auto hybridData = makeCxxInstance(std::forward<Args>(args)...);
    static auto ctor = javaClassStatic()->template getConstructor<jhybridobject(jhybriddata)>();
    return javaClassStatic()->newObject(ctor, hybridData.get());
  }

  // Factory method for creating a hybrid object where the arguments
  // are passed to the java ctor.
  template <typename... Args>
  static local_ref<jhybridobject> newObjectJavaArgs(Args&&... args) {
    static auto ctor =
      javaClassStatic()->template getConstructor<
        jhybridobject(typename detail::Convert<typename std::decay<Args>::type>::jniType...)>();
    // This can't use the same impl as Convert::toJniRet because that
    // function sometimes creates and then releases local_refs, which
    // could potentially cause the locals table to fill.  Instead, we
    // use two calls, one which can return a local_ref if needed, and
    // a second which extracts its value.  The lifetime of the
    // local_ref is the expression, after which it is destroyed and
    // the local_ref is cleaned up.
    auto lref =
      javaClassStatic()->newObject(
        ctor, detail::callToJni(
          detail::Convert<typename std::decay<Args>::type>::toCall(args))...);
    return lref;
  }

  // If a hybrid class throws an exception which derives from
  // std::exception, it will be passed to mapException on the hybrid
  // class, or nearest ancestor.  This allows boilerplate exception
  // translation code (for example, calling throwNewJavaException on a
  // particular java class) to be hoisted to a common function.  If
  // mapException returns, then the std::exception will be translated
  // to Java.
  static void mapException(const std::exception& ex) {}
};

// Given a *_ref object which refers to a hybrid class, this will reach inside
// of it, find the mHybridData, extract the C++ instance pointer, cast it to
// the appropriate type, and return it.
template <typename T>
inline typename std::remove_pointer<typename T::PlainJniType>::type::javaClass* cthis(T jthis) {
  static auto dataField =
    jthis->getClass()->template getField<detail::HybridData::javaobject>("mHybridData");
  // I'd like to use dynamic_cast here, but -fno-rtti is the default.
  auto* value = static_cast<typename std::remove_pointer<typename T::PlainJniType>::type::javaClass*>(
    detail::getNativePointer(detail::getHybridData(jthis, dataField)));
  // This would require some serious programmer error.
  FBASSERTMSGF(value != 0, "Incorrect C++ type in hybrid field");
  return value;
}

void HybridDataOnLoad();

}
}
