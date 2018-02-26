/*
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <type_traits>

#include <fb/assert.h>
#include <fb/visibility.h>

#include "CoreClasses.h"

namespace facebook {
namespace jni {

namespace detail {

class BaseHybridClass {
public:
  virtual ~BaseHybridClass() {}
};

struct FBEXPORT HybridData : public JavaClass<HybridData> {
  constexpr static auto kJavaDescriptor = "Lcom/facebook/jni/HybridData;";
  static local_ref<HybridData> create();
};

class HybridDestructor : public JavaClass<HybridDestructor> {
  public:
    static auto constexpr kJavaDescriptor = "Lcom/facebook/jni/HybridData$Destructor;";

  template <typename T=detail::BaseHybridClass>
  T* getNativePointer() {
    static auto pointerField = javaClassStatic()->getField<jlong>("mNativePointer");
    auto* value = reinterpret_cast<detail::BaseHybridClass*>(getFieldValue(pointerField));
    if (!value) {
      throwNewJavaException("java/lang/NullPointerException", "java.lang.NullPointerException");
    }
    return value;
  }

  template <typename T=detail::BaseHybridClass>
  void setNativePointer(std::unique_ptr<T> new_value) {
    static auto pointerField = javaClassStatic()->getField<jlong>("mNativePointer");
    auto old_value = std::unique_ptr<T>(reinterpret_cast<T*>(getFieldValue(pointerField)));
    if (new_value && old_value) {
        FBCRASH("Attempt to set C++ native pointer twice");
    }
    setFieldValue(pointerField, reinterpret_cast<jlong>(new_value.release()));
  }
};

template<typename T>
detail::BaseHybridClass* getNativePointer(T t) {
  return getHolder(t)->getNativePointer();
}

template<typename T>
void setNativePointer(T t, std::unique_ptr<detail::BaseHybridClass> new_value) {
  getHolder(t)->setNativePointer(std::move(new_value));
}

template<typename T>
local_ref<HybridDestructor> getHolder(T t) {
  static auto holderField = t->getClass()->template getField<HybridDestructor::javaobject>("mDestructor");
  return t->getFieldValue(holderField);
}

// JavaClass for HybridClassBase
struct FBEXPORT HybridClassBase : public JavaClass<HybridClassBase> {
  constexpr static auto kJavaDescriptor = "Lcom/facebook/jni/HybridClassBase;";

  static bool isHybridClassBase(alias_ref<jclass> jclass) {
    return HybridClassBase::javaClassStatic()->isAssignableFrom(jclass);
  }
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
struct FBEXPORT Convert<
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
class FBEXPORT HybridClass : public detail::HybridTraits<Base>::CxxBase {
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
    setNativePointer(hybridData, std::move(cxxPart));
    return hybridData;
  }

  template <typename... Args>
  static local_ref<detail::HybridData> makeCxxInstance(Args&&... args) {
    return makeHybridData(std::unique_ptr<T>(new T(std::forward<Args>(args)...)));
  }

  template <typename... Args>
  static void setCxxInstance(alias_ref<jhybridobject> o, Args&&... args) {
    setNativePointer(o, std::unique_ptr<T>(new T(std::forward<Args>(args)...)));
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
    static bool isHybrid = detail::HybridClassBase::isHybridClassBase(javaClassStatic());
    auto cxxPart = std::unique_ptr<T>(new T(std::forward<Args>(args)...));

    local_ref<JavaPart> result;
    if (isHybrid) {
      result = JavaPart::newInstance();
      setNativePointer(result, std::move(cxxPart));
    }
    else {
      auto hybridData = makeHybridData(std::move(cxxPart));
      result = JavaPart::newInstance(hybridData);
    }

    return result;
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
  detail::BaseHybridClass* result = 0;
  static bool isHybrid = detail::HybridClassBase::isHybridClassBase(this->getClass());
  if (isHybrid) {
    result = getNativePointer(this);
  } else {
    static auto field =
      HybridClass<T, B>::JavaPart::javaClassStatic()->template getField<detail::HybridData::javaobject>("mHybridData");
    auto hybridData = this->getFieldValue(field);
    if (!hybridData) {
      throwNewJavaException("java/lang/NullPointerException", "java.lang.NullPointerException");
    }

    result = getNativePointer(hybridData);
  }

  // This would require some serious programmer error.
  FBASSERTMSGF(result != 0, "Incorrect C++ type in hybrid field");
  // I'd like to use dynamic_cast here, but -fno-rtti is the default.
  return static_cast<T*>(result);
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
