/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

/** @file CoreClasses.h
 *
 * In CoreClasses.h wrappers for the core classes (jobject, jclass, and jstring) is defined
 * to provide access to corresponding JNI functions + some conveniance.
 */

#include "Meta.h"
#include "References.h"

#include <memory>

#include <jni.h>

namespace facebook {
namespace jni {

/// Lookup a class by name. Note this functions returns an alias_ref that
/// points to a leaked global reference.  This is appropriate for classes
/// that are never unloaded (which is any class in an Android app and most
/// Java programs).
///
/// The most common use case for this is storing the result
/// in a "static auto" variable, or a static global.
///
/// @return Returns a leaked global reference to the class
alias_ref<jclass> findClassStatic(const char* name);

/// Lookup a class by name. Note this functions returns a local reference,
/// which means that it must not be stored in a static variable.
///
/// The most common use case for this is one-time initialization
/// (like caching method ids).
///
/// @return Returns a global reference to the class
local_ref<jclass> findClassLocal(const char* name);

/// Check to see if two references refer to the same object. Comparison with nullptr
/// returns true if and only if compared to another nullptr. A weak reference that
/// refers to a reclaimed object count as nullptr.
bool isSameObject(alias_ref<jobject> lhs, alias_ref<jobject> rhs) noexcept;


/// Wrapper to provide functionality to jobject references
template<>
class JObjectWrapper<jobject> {
 public:
  /// Java type descriptor
  static constexpr const char* kJavaDescriptor = "Ljava/lang/Object;";

  static constexpr const char* get_instantiated_java_descriptor() { return nullptr; }

  /// Wrap an existing JNI reference
  JObjectWrapper(jobject reference = nullptr) noexcept;

  // Copy constructor
  JObjectWrapper(const JObjectWrapper& other) noexcept;

  /// Get a @ref local_ref of the object's class
  local_ref<jclass> getClass() const noexcept;

  /// Checks if the object is an instance of a class
  bool isInstanceOf(alias_ref<jclass> cls) const noexcept;

  /// Get the primitive value of a field
  template<typename T>
  T getFieldValue(JField<T> field) const noexcept;

  /// Get and wrap the value of a field in a @ref local_ref
  template<typename T>
  local_ref<T*> getFieldValue(JField<T*> field) noexcept;

  /// Set the value of field. Any Java type is accepted, including the primitive types
  /// and raw reference types.
  template<typename T>
  void setFieldValue(JField<T> field, T value) noexcept;

  /// Convenience method to create a std::string representing the object
  std::string toString() const;

 protected:
  jobject this_;

 private:
  template<typename T, typename A>
  friend class base_owned_ref;

  template<typename T>
  friend class alias_ref;

  friend void swap(JObjectWrapper<jobject>& a, JObjectWrapper<jobject>& b) noexcept;

  void set(jobject reference) noexcept;
  jobject get() const noexcept;
  jobject self() const noexcept;
};

using JObject = JObjectWrapper<jobject>;

void swap(JObjectWrapper<jobject>& a, JObjectWrapper<jobject>& b) noexcept;


/// Wrapper to provide functionality to jclass references
struct NativeMethod;

template<>
class JObjectWrapper<jclass> : public JObjectWrapper<jobject> {
 public:
  /// Java type descriptor
  static constexpr const char* kJavaDescriptor = "Ljava/lang/Class;";

  using JObjectWrapper<jobject>::JObjectWrapper;

  /// Get a @local_ref to the super class of this class
  local_ref<jclass> getSuperclass() const noexcept;

  /// Register native methods for the class.  Usage looks like this:
  ///
  /// classRef->registerNatives({
  ///     makeNativeMethod("nativeMethodWithAutomaticDescriptor",
  ///                      methodWithAutomaticDescriptor),
  ///     makeNativeMethod("nativeMethodWithExplicitDescriptor",
  ///                      "(Lcom/facebook/example/MyClass;)V",
  ///                      methodWithExplicitDescriptor),
  ///  });
  ///
  /// By default, C++ exceptions raised will be converted to Java exceptions.
  /// To avoid this and get the "standard" JNI behavior of a crash when a C++
  /// exception is crashing out of the JNI method, declare the method noexcept.
  void registerNatives(std::initializer_list<NativeMethod> methods);

  /// Check to see if the class is assignable from another class
  /// @pre cls != nullptr
  bool isAssignableFrom(alias_ref<jclass> cls) const noexcept;

  /// Convenience method to lookup the constructor with descriptor as specified by the
  /// type arguments
  template<typename F>
  JConstructor<F> getConstructor() const;

  /// Convenience method to lookup the constructor with specified descriptor
  template<typename F>
  JConstructor<F> getConstructor(const char* descriptor) const;

  /// Look up the method with given name and descriptor as specified with the type arguments
  template<typename F>
  JMethod<F> getMethod(const char* name) const;

  /// Look up the method with given name and descriptor
  template<typename F>
  JMethod<F> getMethod(const char* name, const char* descriptor) const;

  /// Lookup the field with the given name and deduced descriptor
  template<typename T>
  JField<enable_if_t<IsJniScalar<T>(), T>> getField(const char* name) const;

  /// Lookup the field with the given name and descriptor
  template<typename T>
  JField<enable_if_t<IsJniScalar<T>(), T>> getField(const char* name, const char* descriptor) const;

  /// Lookup the static field with the given name and deduced descriptor
  template<typename T>
  JStaticField<enable_if_t<IsJniScalar<T>(), T>> getStaticField(const char* name) const;

  /// Lookup the static field with the given name and descriptor
  template<typename T>
  JStaticField<enable_if_t<IsJniScalar<T>(), T>> getStaticField(
      const char* name,
      const char* descriptor) const;

  /// Get the primitive value of a static field
  template<typename T>
  T getStaticFieldValue(JStaticField<T> field) const noexcept;

  /// Get and wrap the value of a field in a @ref local_ref
  template<typename T>
  local_ref<T*> getStaticFieldValue(JStaticField<T*> field) noexcept;

  /// Set the value of field. Any Java type is accepted, including the primitive types
  /// and raw reference types.
  template<typename T>
  void setStaticFieldValue(JStaticField<T> field, T value) noexcept;

  /// Allocates a new object and invokes the specified constructor
  template<typename R, typename... Args>
  local_ref<R> newObject(JConstructor<R(Args...)> constructor, Args... args) const;

  /// Look up the static method with given name and descriptor as specified with the type arguments
  template<typename F>
  JStaticMethod<F> getStaticMethod(const char* name) const;

  /// Look up the static method with given name and descriptor
  template<typename F>
  JStaticMethod<F> getStaticMethod(const char* name, const char* descriptor) const;

  /// Look up the non virtual method with given name and descriptor as specified with the
  /// type arguments
  template<typename F>
  JNonvirtualMethod<F> getNonvirtualMethod(const char* name) const;

  /// Look up the non virtual method with given name and descriptor
  template<typename F>
  JNonvirtualMethod<F> getNonvirtualMethod(const char* name, const char* descriptor) const;

 private:
  jclass self() const noexcept;
};

using JClass = JObjectWrapper<jclass>;

// Convenience method to register methods on a class without holding
// onto the class object.
void registerNatives(const char* name, std::initializer_list<NativeMethod> methods);

/// Wrapper to provide functionality to jstring references
template<>
class JObjectWrapper<jstring> : public JObjectWrapper<jobject> {
 public:
  /// Java type descriptor
  static constexpr const char* kJavaDescriptor = "Ljava/lang/String;";

  using JObjectWrapper<jobject>::JObjectWrapper;

  /// Convenience method to convert a jstring object to a std::string
  std::string toStdString() const;

 private:
  jstring self() const noexcept;
};

/// Convenience functions to convert a std::string or const char* into a @ref local_ref to a
/// jstring
local_ref<jstring> make_jstring(const char* modifiedUtf8);
local_ref<jstring> make_jstring(const std::string& modifiedUtf8);

using JString = JObjectWrapper<jstring>;

/// Wrapper to provide functionality to jthrowable references
template<>
class JObjectWrapper<jthrowable> : public JObjectWrapper<jobject> {
 public:
  /// Java type descriptor
  static constexpr const char* kJavaDescriptor = "Ljava/lang/Throwable;";

  using JObjectWrapper<jobject>::JObjectWrapper;

 private:
  jthrowable self() const noexcept;
};


/// @cond INTERNAL
template<class T> class _jtypeArray : public _jobjectArray {};
// @endcond
/// Wrapper to provide functionality for arrays of j-types
template<class T> using jtypeArray = _jtypeArray<T>*;

template<typename T>
class ElementProxy {
   private:
    JObjectWrapper<_jtypeArray<T>*>* target_;
    size_t idx_;

   public:
    ElementProxy(JObjectWrapper<_jtypeArray<T>*>* target, size_t idx);

    ElementProxy<T>& operator=(const T& o);

    ElementProxy<T>& operator=(alias_ref<T>& o);

    ElementProxy<T>& operator=(alias_ref<T>&& o);

    ElementProxy<T>& operator=(const ElementProxy<T>& o);

    operator const local_ref<T> () const;

    operator local_ref<T> ();
  };

template<typename T>
class JObjectWrapper<jtypeArray<T>> : public JObjectWrapper<jobject> {
 public:
  static constexpr const char* kJavaDescriptor = nullptr;
  static std::string get_instantiated_java_descriptor() {
    return "[" + jtype_traits<T>::descriptor();
  };

  using JObjectWrapper<jobject>::JObjectWrapper;

  /// Allocate a new array from Java heap, for passing as a JNI parameter or return value.
  /// NOTE: if using as a return value, you want to call release() instead of get() on the
  /// smart pointer.
  static local_ref<jtypeArray<T>> newArray(size_t count);

  /// Assign an object to the array.
  /// Typically you will use the shorthand (*ref)[idx]=value;
  void setElement(size_t idx, const T& value);

  /// Read an object from the array.
  /// Typically you will use the shorthand
  ///   T value = (*ref)[idx];
  /// If you use auto, you'll get an ElementProxy, which may need to be cast.
  local_ref<T> getElement(size_t idx);

  /// Get the size of the array.
  size_t size();

  /// EXPERIMENTAL SUBSCRIPT SUPPORT
  /// This implementation of [] returns a proxy object which then has a bunch of specializations
  /// (adopt_local free function, operator= and casting overloads on the ElementProxy) that can
  /// make code look like it is dealing with a T rather than an obvious proxy. In particular, the
  /// proxy in this iteration does not read a value and therefore does not create a LocalRef
  /// until one of these other operators is used. There are certainly holes that you may find
  /// by using idioms that haven't been tried yet. Consider yourself warned. On the other hand,
  /// it does make for some idiomatic assignment code; see TestBuildStringArray in fbjni_tests
  /// for some examples.
  ElementProxy<T> operator[](size_t idx);

 private:
  jtypeArray<T> self() const noexcept;
};

template <class T>
using JArrayClass = JObjectWrapper<jtypeArray<T>>;

template<typename T>
local_ref<jtypeArray<T>> adopt_local_array(jobjectArray ref) {
  return adopt_local(static_cast<jtypeArray<T>>(ref));
}

template<typename T>
local_ref<T> adopt_local(ElementProxy<T> elementProxy) {
  return static_cast<local_ref<T>>(elementProxy);
}

/// Wrapper to provide functionality to jarray references.
/// This is an empty holder by itself. Construct a PinnedPrimitiveArray to actually interact with
/// the elements of the array.
template<>
class JObjectWrapper<jarray> : public JObjectWrapper<jobject> {
 public:
  static constexpr const char* kJavaDescriptor = nullptr;

  using JObjectWrapper<jobject>::JObjectWrapper;
  size_t size() const noexcept;

 private:
  jarray self() const noexcept;
};

using JArray = JObjectWrapper<jarray>;

template <typename T>
class PinnedPrimitiveArray;

#pragma push_macro("DECLARE_PRIMITIVE_ARRAY_UTILS")
#undef DECLARE_PRIMITIVE_ARRAY_UTILS
#define DECLARE_PRIMITIVE_ARRAY_UTILS(TYPE, NAME, DESC)                \
                                                                       \
local_ref<j ## TYPE ## Array> make_ ## TYPE ## _array(jsize size);     \
                                                                       \
template<> class JObjectWrapper<j ## TYPE ## Array> : public JArray {  \
 public:                                                               \
  static constexpr const char* kJavaDescriptor = "[" # DESC;           \
                                                                       \
  using JArray::JArray;                                                \
                                                                       \
  static local_ref<j ## TYPE ## Array> newArray(size_t count);         \
                                                                       \
  j ## TYPE* getRegion(jsize start, jsize length, j ## TYPE* buf);     \
  std::unique_ptr<j ## TYPE[]> getRegion(jsize start, jsize length);   \
  void setRegion(jsize start, jsize length, const j ## TYPE* buf);     \
  PinnedPrimitiveArray<j ## TYPE> pin();                               \
                                                                       \
 private:                                                              \
  j ## TYPE ## Array self() const noexcept {                           \
    return static_cast<j ## TYPE ## Array>(this_);                     \
  }                                                                    \
};                                                                     \
                                                                       \
using JArray ## NAME = JObjectWrapper<j ## TYPE ## Array>              \


DECLARE_PRIMITIVE_ARRAY_UTILS(boolean, Boolean, "Z");
DECLARE_PRIMITIVE_ARRAY_UTILS(byte, Byte, "B");
DECLARE_PRIMITIVE_ARRAY_UTILS(char, Char, "C");
DECLARE_PRIMITIVE_ARRAY_UTILS(short, Short, "S");
DECLARE_PRIMITIVE_ARRAY_UTILS(int, Int, "I");
DECLARE_PRIMITIVE_ARRAY_UTILS(long, Long, "J");
DECLARE_PRIMITIVE_ARRAY_UTILS(float, Float, "F");
DECLARE_PRIMITIVE_ARRAY_UTILS(double, Double, "D");

#pragma pop_macro("DECLARE_PRIMITIVE_ARRAY_UTILS")


/// RAII class for pinned primitive arrays
/// This currently only supports read/write access to existing java arrays. You can't create a
/// primitive array this way yet. This class also pins the entire array into memory during the
/// lifetime of the PinnedPrimitiveArray. If you need to unpin the array manually, call the
/// release() function. During a long-running block of code, you should unpin the array as soon
/// as you're done with it, to avoid holding up the Java garbage collector.
template <typename T>
class PinnedPrimitiveArray {
  public:
   static_assert(is_jni_primitive<T>::value,
       "PinnedPrimitiveArray requires primitive jni type.");

   PinnedPrimitiveArray(PinnedPrimitiveArray&&) noexcept;
   PinnedPrimitiveArray(const PinnedPrimitiveArray&) = delete;
   ~PinnedPrimitiveArray() noexcept;

   PinnedPrimitiveArray& operator=(PinnedPrimitiveArray&&) noexcept;
   PinnedPrimitiveArray& operator=(const PinnedPrimitiveArray&) = delete;

   T* get();
   void release();

   const T& operator[](size_t index) const;
   T& operator[](size_t index);
   bool isCopy() const noexcept;
   size_t size() const noexcept;

  private:
   alias_ref<jarray> array_;
   T* elements_;
   jboolean isCopy_;
   size_t size_;

   PinnedPrimitiveArray(alias_ref<jarray>) noexcept;

   friend class JObjectWrapper<jbooleanArray>;
   friend class JObjectWrapper<jbyteArray>;
   friend class JObjectWrapper<jcharArray>;
   friend class JObjectWrapper<jshortArray>;
   friend class JObjectWrapper<jintArray>;
   friend class JObjectWrapper<jlongArray>;
   friend class JObjectWrapper<jfloatArray>;
   friend class JObjectWrapper<jdoubleArray>;
};


namespace detail {

class BaseJavaClass {
public:
  typedef _jobject _javaobject;
  typedef _javaobject* javaobject;
};

}

// Together, these classes allow convenient use of any class with the fbjni
// helpers.  To use:
//
// struct MyClass : public JavaClass<MyClass> {
//   constexpr static auto kJavaDescriptor = "Lcom/example/package/MyClass;";
// };
//
// alias_ref<MyClass::javaobject> myClass = foo();

template <typename T, typename Base = detail::BaseJavaClass>
class JavaClass {
public:
  // JNI pattern for jobject assignable pointer
  struct _javaobject : public Base::_javaobject {
    typedef T javaClass;
  };
  typedef _javaobject* javaobject;

  static alias_ref<jclass> javaClassStatic();
  static local_ref<jclass> javaClassLocal();
};

template <typename T>
class JObjectWrapper<T,
    typename std::enable_if<
      is_plain_jni_reference<T>::value &&
      std::is_class<typename std::remove_pointer<T>::type::javaClass>::value
    >::type>
  : public JObjectWrapper<jobject> {
public:
  static constexpr const char* kJavaDescriptor =
    std::remove_pointer<T>::type::javaClass::kJavaDescriptor;

  using JObjectWrapper<jobject>::JObjectWrapper;

  template<typename U>
  JObjectWrapper(const JObjectWrapper<U>& w)
    : JObjectWrapper<jobject>(w) {
    static_assert(std::is_convertible<U, T>::value,
                  "U must be convertible to T");
  }
};

}}

#include "CoreClasses-inl.h"
// This is here because code in Meta-inl.h uses alias_ref, which
// requires JObjectWrapper<jobject> to be concrete before it can work.
#include "Meta-inl.h"
