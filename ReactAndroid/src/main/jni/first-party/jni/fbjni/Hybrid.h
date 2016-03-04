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

class BaseHybridClass {
public:
  virtual ~BaseHybridClass() {}
};

struct HybridData : public JavaClass<HybridData> {
  constexpr static auto kJavaDescriptor = "Lcom/facebook/jni/HybridData;";
  void setNativePointer(std::unique_ptr<BaseHybridClass> new_value);
  BaseHybridClass* getNativePointer();
  static local_ref<HybridData> create();
};

template <typename Base, typename Enabled = void>
struct HybridTraits {
  // This static assert should actually always fail if we don't use one of the
  // specializations below.
  static_assert(
      std::is_base_of<JObject, Base>::value ||
      std::is_base_of<BaseHybridClass, Base>::value,
      "The base of a HybridClass must be either another HybridClass or derived from JObject.");
};

template <>
struct HybridTraits<BaseHybridClass> {
 using CxxBase = BaseHybridClass;
 using JavaBase = JObject;
};

template <typename Base>
struct HybridTraits<
    Base,
    typename std::enable_if<std::is_base_of<BaseHybridClass, Base>::value>::type> {
 using CxxBase = Base;
 using JavaBase = typename Base::JavaPart;
};

template <typename Base>
struct HybridTraits<
    Base,
    typename std::enable_if<std::is_base_of<JObject, Base>::value>::type> {
 using CxxBase = BaseHybridClass;
 using JavaBase = Base;
};

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
    return wrap_alias(t)->cthis();
  }
  // There is no automatic return conversion for objects.
};

template<typename T>
struct RefReprType<T, typename std::enable_if<std::is_base_of<BaseHybridClass, T>::value, void>::type> {
  static_assert(std::is_same<T, void>::value,
      "HybridFoo (where HybridFoo derives from HybridClass<HybridFoo>) is not supported in this context. "
      "For an xxx_ref<HybridFoo>, you may want: xxx_ref<HybridFoo::javaobject> or HybridFoo*.");
  using Repr = T;
};


}

template <typename T, typename Base = detail::BaseHybridClass>
class HybridClass : public detail::HybridTraits<Base>::CxxBase {
public:
  struct JavaPart : JavaClass<JavaPart, typename detail::HybridTraits<Base>::JavaBase> {
    // At this point, T is incomplete, and so we cannot access
    // T::kJavaDescriptor directly. jtype_traits support this escape hatch for
    // such a case.
    static constexpr const char* kJavaDescriptor = nullptr;
    static std::string get_instantiated_java_descriptor();
    static std::string get_instantiated_base_name();

    using HybridType = T;

    // This will reach into the java object and extract the C++ instance from
    // the mHybridData and return it.
    T* cthis();

    friend class HybridClass;
  };

  using jhybridobject = typename JavaPart::javaobject;
  using javaobject = typename JavaPart::javaobject;
  typedef detail::HybridData::javaobject jhybriddata;

  static alias_ref<JClass> javaClassStatic() {
    return JavaPart::javaClassStatic();
  }

  static local_ref<JClass> javaClassLocal() {
    std::string className(T::kJavaDescriptor + 1, strlen(T::kJavaDescriptor) - 2);
    return findClassLocal(className.c_str());
  }

protected:
  typedef HybridClass HybridBase;

  // This ensures that a C++ hybrid part cannot be created on its own
  // by default.  If a hybrid wants to enable this, it can provide its
  // own public ctor, or change the accessibility of this to public.
  using detail::HybridTraits<Base>::CxxBase::CxxBase;

  static void registerHybrid(std::initializer_list<NativeMethod> methods) {
    javaClassStatic()->registerNatives(methods);
  }

  static local_ref<detail::HybridData> makeHybridData(std::unique_ptr<T> cxxPart) {
    auto hybridData = detail::HybridData::create();
    hybridData->setNativePointer(std::move(cxxPart));
    return hybridData;
  }

  template <typename... Args>
  static local_ref<detail::HybridData> makeCxxInstance(Args&&... args) {
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
  static local_ref<JavaPart> newObjectCxxArgs(Args&&... args) {
    auto hybridData = makeCxxInstance(std::forward<Args>(args)...);
    return JavaPart::newInstance(hybridData);
  }

  // TODO? Create reusable interface for Allocatable classes and use it to
  // strengthen type-checking (and possibly provide a default
  // implementation of allocate().)
  template <typename... Args>
  static local_ref<jhybridobject> allocateWithCxxArgs(Args&&... args) {
    auto hybridData = makeCxxInstance(std::forward<Args>(args)...);
    static auto allocateMethod =
        javaClassStatic()->template getStaticMethod<jhybridobject(jhybriddata)>("allocate");
    return allocateMethod(javaClassStatic(), hybridData.get());
  }

  // Factory method for creating a hybrid object where the arguments
  // are passed to the java ctor.
  template <typename... Args>
  static local_ref<JavaPart> newObjectJavaArgs(Args&&... args) {
    return JavaPart::newInstance(std::move(args)...);
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

template <typename T, typename B>
inline T* HybridClass<T, B>::JavaPart::cthis() {
  static auto field =
    HybridClass<T, B>::JavaPart::javaClassStatic()->template getField<detail::HybridData::javaobject>("mHybridData");
  auto hybridData = this->getFieldValue(field);
  if (!hybridData) {
    throwNewJavaException("java/lang/NullPointerException", "java.lang.NullPointerException");
  }
  // I'd like to use dynamic_cast here, but -fno-rtti is the default.
  T* value = static_cast<T*>(hybridData->getNativePointer());
  // This would require some serious programmer error.
  FBASSERTMSGF(value != 0, "Incorrect C++ type in hybrid field");
  return value;
};

template <typename T, typename B>
/* static */ inline std::string HybridClass<T, B>::JavaPart::get_instantiated_java_descriptor() {
  return T::kJavaDescriptor;
}

template <typename T, typename B>
/* static */ inline std::string HybridClass<T, B>::JavaPart::get_instantiated_base_name() {
  auto name = get_instantiated_java_descriptor();
  return name.substr(1, name.size() - 2);
}

// Given a *_ref object which refers to a hybrid class, this will reach inside
// of it, find the mHybridData, extract the C++ instance pointer, cast it to
// the appropriate type, and return it.
template <typename T>
inline auto cthis(T jthis) -> decltype(jthis->cthis()) {
  return jthis->cthis();
}

void HybridDataOnLoad();

}
}
