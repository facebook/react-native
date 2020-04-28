/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

/** @file CoreClasses.h
 *
 * In CoreClasses.h wrappers for the core classes (jobject, jclass, and jstring) is defined
 * to provide access to corresponding JNI functions + some convenience.
 */

#include "References-forward.h"
#include "Meta-forward.h"
#include "TypeTraits.h"

#include <memory>

#include <jni.h>

#include <fb/visibility.h>

namespace facebook {
namespace jni {

class JClass;
class JObject;

/// Lookup a class by name. Note this functions returns an alias_ref that
/// points to a leaked global reference.  This is appropriate for classes
/// that are never unloaded (which is any class in an Android app and most
/// Java programs).
///
/// The most common use case for this is storing the result
/// in a "static auto" variable, or a static global.
///
/// @return Returns a leaked global reference to the class
FBEXPORT alias_ref<JClass> findClassStatic(const char* name);

/// Lookup a class by name. Note this functions returns a local reference,
/// which means that it must not be stored in a static variable.
///
/// The most common use case for this is one-time initialization
/// (like caching method ids).
///
/// @return Returns a global reference to the class
FBEXPORT local_ref<JClass> findClassLocal(const char* name);

/// Check to see if two references refer to the same object. Comparison with nullptr
/// returns true if and only if compared to another nullptr. A weak reference that
/// refers to a reclaimed object count as nullptr.
FBEXPORT bool isSameObject(alias_ref<JObject> lhs, alias_ref<JObject> rhs) noexcept;

// Together, these classes allow convenient use of any class with the fbjni
// helpers.  To use:
//
// struct MyClass : public JavaClass<MyClass> {
//   constexpr static auto kJavaDescriptor = "Lcom/example/package/MyClass;";
// };
//
// Then, an alias_ref<MyClass::javaobject> will be backed by an instance of
// MyClass. JavaClass provides a convenient way to add functionality to these
// smart references.
//
// For example:
//
// struct MyClass : public JavaClass<MyClass> {
//   constexpr static auto kJavaDescriptor = "Lcom/example/package/MyClass;";
//
//   void foo() {
//     static auto method = javaClassStatic()->getMethod<void()>("foo");
//     method(self());
//   }
//
//   static local_ref<javaobject> create(int i) {
//     return newInstance(i);
//   }
// };
//
// auto obj = MyClass::create(10);
// obj->foo();
//
// While users of a JavaClass-type can lookup methods and fields through the
// underlying JClass, those calls can only be checked at runtime. It is recommended
// that the JavaClass-type instead explicitly expose it's methods as in the example
// above.

namespace detail {
template<typename JC, typename... Args>
static local_ref<JC> newInstance(Args... args);
}

class MonitorLock;

class FBEXPORT JObject : detail::JObjectBase {
public:
  static constexpr auto kJavaDescriptor = "Ljava/lang/Object;";

  static constexpr const char* get_instantiated_java_descriptor() { return nullptr; }
  static constexpr const char* get_instantiated_base_name() { return nullptr; }

  /// Get a @ref local_ref of the object's class
  local_ref<JClass> getClass() const noexcept;

  /// Checks if the object is an instance of a class
  bool isInstanceOf(alias_ref<JClass> cls) const noexcept;

  /// Get the primitive value of a field
  template<typename T>
  T getFieldValue(JField<T> field) const noexcept;

  /// Get and wrap the value of a field in a @ref local_ref
  template<typename T>
  local_ref<T*> getFieldValue(JField<T*> field) const noexcept;

  /// Set the value of field. Any Java type is accepted, including the primitive types
  /// and raw reference types.
  template<typename T>
  void setFieldValue(JField<T> field, T value) noexcept;

  /// Convenience method to create a std::string representing the object
  std::string toString() const;

  // Take this object's monitor lock
  MonitorLock lock() const noexcept;

  typedef _jobject _javaobject;
  typedef _javaobject* javaobject;

protected:
  jobject self() const noexcept;
private:
  friend void swap(JObject& a, JObject& b) noexcept;
  template<typename>
  friend struct detail::ReprAccess;
  template<typename, typename, typename>
  friend class JavaClass;

  template <typename, typename>
  friend class JObjectWrapper;
};

// This is only to maintain backwards compatibility with things that are
// already providing a specialization of JObjectWrapper. Any such instances
// should be updated to use a JavaClass.
template<>
class JObjectWrapper<jobject> : public JObject {
};


namespace detail {
template <typename, typename Base, typename JType>
struct JTypeFor {
  static_assert(
      std::is_base_of<
        std::remove_pointer<jobject>::type,
        typename std::remove_pointer<JType>::type
      >::value, "");
  using _javaobject = typename std::remove_pointer<JType>::type;
  using javaobject = JType;
};

template <typename T, typename Base>
struct JTypeFor<T, Base, void> {
  // JNI pattern for jobject assignable pointer
  struct _javaobject :  Base::_javaobject {
    // This allows us to map back to the defining type (in ReprType, for
    // example).
    typedef T JniRefRepr;
  };
  using javaobject = _javaobject*;
};
}

// JavaClass provides a method to inform fbjni about user-defined Java types.
// Given a class:
// struct Foo : JavaClass<Foo> {
//   static constexpr auto kJavaDescriptor = "Lcom/example/package/Foo;";
// };
// fbjni can determine the java type/method signatures for Foo::javaobject and
// smart refs (like alias_ref<Foo::javaobject>) will hold an instance of Foo
// and provide access to it through the -> and * operators.
//
// The "Base" template argument can be used to specify the JavaClass superclass
// of this type (for instance, JString's Base is JObject).
//
// The "JType" template argument is used to provide a jni type (like jstring,
// jthrowable) to be used as javaobject. This should only be necessary for
// built-in jni types and not user-defined ones.
template <typename T, typename Base = JObject, typename JType = void>
class FBEXPORT JavaClass : public Base {
  using JObjType = typename detail::JTypeFor<T, Base, JType>;
public:
  using _javaobject = typename JObjType::_javaobject;
  using javaobject = typename JObjType::javaobject;

  using JavaBase = JavaClass;

  static alias_ref<JClass> javaClassStatic();
  static local_ref<JClass> javaClassLocal();
protected:
  /// Allocates a new object and invokes the specified constructor
  /// Like JClass's getConstructor, this function can only check at runtime if
  /// the class actually has a constructor that accepts the corresponding types.
  /// While a JavaClass-type can expose this function directly, it is recommended
  /// to instead to use this to explicitly only expose those constructors that
  /// the Java class actually has (i.e. with static create() functions).
  template<typename... Args>
  static local_ref<T> newInstance(Args... args) {
    return detail::newInstance<T>(args...);
  }

  javaobject self() const noexcept;
};

/// Wrapper to provide functionality to jclass references
struct NativeMethod;

class FBEXPORT JClass : public JavaClass<JClass, JObject, jclass> {
 public:
  /// Java type descriptor
  static constexpr const char* kJavaDescriptor = "Ljava/lang/Class;";

  /// Get a @local_ref to the super class of this class
  local_ref<JClass> getSuperclass() const noexcept;

  /// Register native methods for the class.  Usage looks like this:
  ///
  /// classRef->registerNatives({
  ///     makeNativeMethod("nativeMethodWithAutomaticDescriptor",
  ///                      methodWithAutomaticDescriptor),
  ///     makeNativeMethod("nativeMethodWithExplicitDescriptor",
  ///                      "(Lcom/facebook/example/MyClass;)V",
  ///                      methodWithExplicitDescriptor),
  ///     makeCriticalNativeMethod_DO_NOT_USE_OR_YOU_WILL_BE_FIRED("criticalNativeMethodWithAutomaticDescriptor",
  ///                              criticalNativeMethodWithAutomaticDescriptor),
  ///     makeCriticalNativeMethod_DO_NOT_USE_OR_YOU_WILL_BE_FIRED("criticalNativeMethodWithExplicitDescriptor",
  ///                              "(IIF)Z",
  ///                              criticalNativeMethodWithExplicitDescriptor),
  ///  });
  ///
  /// By default, C++ exceptions raised will be converted to Java exceptions.
  /// To avoid this and get the "standard" JNI behavior of a crash when a C++
  /// exception is crashing out of the JNI method, declare the method noexcept.
  /// This does NOT apply to critical native methods, where exceptions causes
  /// a crash.
  void registerNatives(std::initializer_list<NativeMethod> methods);

  /// Check to see if the class is assignable from another class
  /// @pre cls != nullptr
  bool isAssignableFrom(alias_ref<JClass> cls) const noexcept;

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

// Convenience method to register methods on a class without holding
// onto the class object.
void registerNatives(const char* name, std::initializer_list<NativeMethod> methods);

/// Wrapper to provide functionality to jstring references
class FBEXPORT JString : public JavaClass<JString, JObject, jstring> {
 public:
  /// Java type descriptor
  static constexpr const char* kJavaDescriptor = "Ljava/lang/String;";

  /// Convenience method to convert a jstring object to a std::string
  std::string toStdString() const;
};

/// Convenience functions to convert a std::string or const char* into a @ref local_ref to a
/// jstring
FBEXPORT local_ref<JString> make_jstring(const char* modifiedUtf8);
FBEXPORT local_ref<JString> make_jstring(const std::string& modifiedUtf8);

namespace detail {
template<typename Target>
class ElementProxy {
 private:
  Target* target_;
  size_t idx_;

 public:
  using T = typename Target::javaentry;
  ElementProxy(Target* target, size_t idx);

  ElementProxy& operator=(const T& o);

  ElementProxy& operator=(alias_ref<T>& o);

  ElementProxy& operator=(alias_ref<T>&& o);

  ElementProxy& operator=(const ElementProxy& o);

  operator const local_ref<T> () const;

  operator local_ref<T> ();
};
}

namespace detail {
class FBEXPORT JArray : public JavaClass<JArray, JObject, jarray> {
 public:
  // This cannot be used in a scope that derives a descriptor (like in a method
  // signature). Use a more derived type instead (like JArrayInt or
  // JArrayClass<T>).
  static constexpr const char* kJavaDescriptor = nullptr;
  size_t size() const noexcept;
};

// This is used so that the JArrayClass<T> javaobject extends jni's
// jobjectArray. This class should not be used directly. A general Object[]
// should use JArrayClass<jobject>.
class FBEXPORT JTypeArray : public JavaClass<JTypeArray, JArray, jobjectArray> {
  // This cannot be used in a scope that derives a descriptor (like in a method
  // signature).
  static constexpr const char* kJavaDescriptor = nullptr;
};
}

template<typename T>
class JArrayClass : public JavaClass<JArrayClass<T>, detail::JTypeArray> {
 public:
  static_assert(is_plain_jni_reference<T>(), "");
  // javaentry is the jni type of an entry in the array (i.e. jint).
  using javaentry = T;
  // javaobject is the jni type of the array.
  using javaobject = typename JavaClass<JArrayClass<T>, detail::JTypeArray>::javaobject;
  static constexpr const char* kJavaDescriptor = nullptr;
  static std::string get_instantiated_java_descriptor();
  static std::string get_instantiated_base_name();

  /// Allocate a new array from Java heap, for passing as a JNI parameter or return value.
  /// NOTE: if using as a return value, you want to call release() instead of get() on the
  /// smart pointer.
  static local_ref<javaobject> newArray(size_t count);

  /// Assign an object to the array.
  /// Typically you will use the shorthand (*ref)[idx]=value;
  void setElement(size_t idx, const T& value);

  /// Read an object from the array.
  /// Typically you will use the shorthand
  ///   T value = (*ref)[idx];
  /// If you use auto, you'll get an ElementProxy, which may need to be cast.
  local_ref<T> getElement(size_t idx);

  /// EXPERIMENTAL SUBSCRIPT SUPPORT
  /// This implementation of [] returns a proxy object which then has a bunch of specializations
  /// (adopt_local free function, operator= and casting overloads on the ElementProxy) that can
  /// make code look like it is dealing with a T rather than an obvious proxy. In particular, the
  /// proxy in this iteration does not read a value and therefore does not create a LocalRef
  /// until one of these other operators is used. There are certainly holes that you may find
  /// by using idioms that haven't been tried yet. Consider yourself warned. On the other hand,
  /// it does make for some idiomatic assignment code; see TestBuildStringArray in fbjni_tests
  /// for some examples.
  detail::ElementProxy<JArrayClass> operator[](size_t idx);
};

template <typename T>
using jtypeArray = typename JArrayClass<T>::javaobject;

template<typename T>
local_ref<typename JArrayClass<T>::javaobject> adopt_local_array(jobjectArray ref) {
  return adopt_local(static_cast<typename JArrayClass<T>::javaobject>(ref));
}

template<typename Target>
local_ref<typename Target::javaentry> adopt_local(detail::ElementProxy<Target> elementProxy) {
  return static_cast<local_ref<typename Target::javaentry>>(elementProxy);
}

template <typename T, typename PinAlloc>
class PinnedPrimitiveArray;

template <typename T> class PinnedArrayAlloc;
template <typename T> class PinnedRegionAlloc;
template <typename T> class PinnedCriticalAlloc;

/// Wrapper to provide functionality to jarray references.
/// This is an empty holder by itself. Construct a PinnedPrimitiveArray to actually interact with
/// the elements of the array.
template <typename JArrayType>
class FBEXPORT JPrimitiveArray :
    public JavaClass<JPrimitiveArray<JArrayType>, detail::JArray, JArrayType> {
  static_assert(is_jni_primitive_array<JArrayType>(), "");
 public:
  static constexpr const char* kJavaDescriptor = nullptr;
  static std::string get_instantiated_java_descriptor();
  static std::string get_instantiated_base_name();

  using T = typename jtype_traits<JArrayType>::entry_type;

  static local_ref<JArrayType> newArray(size_t count);

  void getRegion(jsize start, jsize length, T* buf);
  std::unique_ptr<T[]> getRegion(jsize start, jsize length);
  void setRegion(jsize start, jsize length, const T* buf);

  /// Returns a view of the underlying array. This will either be a "pinned"
  /// version of the array (in which case changes to one immediately affect the
  /// other) or a copy of the array (in which cases changes to the view will take
  /// affect when destroyed or on calls to release()/commit()).
  PinnedPrimitiveArray<T, PinnedArrayAlloc<T>> pin();

  /// Returns a view of part of the underlying array. A pinned region is always
  /// backed by a copy of the region.
  PinnedPrimitiveArray<T, PinnedRegionAlloc<T>> pinRegion(jsize start, jsize length);

  /// Returns a view of the underlying array like pin(). However, while the pin
  /// is held, the code is considered within a "critical region". In a critical
  /// region, native code must not call JNI functions or make any calls that may
  /// block on other Java threads. These restrictions make it more likely that
  /// the view will be "pinned" rather than copied (for example, the VM may
  /// suspend garbage collection within a critical region).
  PinnedPrimitiveArray<T, PinnedCriticalAlloc<T>> pinCritical();

private:
  friend class PinnedArrayAlloc<T>;
  T* getElements(jboolean* isCopy);
  void releaseElements(T* elements, jint mode);
};

FBEXPORT local_ref<jbooleanArray> make_boolean_array(jsize size);
FBEXPORT local_ref<jbyteArray> make_byte_array(jsize size);
FBEXPORT local_ref<jcharArray> make_char_array(jsize size);
FBEXPORT local_ref<jshortArray> make_short_array(jsize size);
FBEXPORT local_ref<jintArray> make_int_array(jsize size);
FBEXPORT local_ref<jlongArray> make_long_array(jsize size);
FBEXPORT local_ref<jfloatArray> make_float_array(jsize size);
FBEXPORT local_ref<jdoubleArray> make_double_array(jsize size);

using JArrayBoolean = JPrimitiveArray<jbooleanArray>;
using JArrayByte = JPrimitiveArray<jbyteArray>;
using JArrayChar = JPrimitiveArray<jcharArray>;
using JArrayShort = JPrimitiveArray<jshortArray>;
using JArrayInt = JPrimitiveArray<jintArray>;
using JArrayLong = JPrimitiveArray<jlongArray>;
using JArrayFloat = JPrimitiveArray<jfloatArray>;
using JArrayDouble = JPrimitiveArray<jdoubleArray>;

/// RAII class for pinned primitive arrays
/// This currently only supports read/write access to existing java arrays. You can't create a
/// primitive array this way yet. This class also pins the entire array into memory during the
/// lifetime of the PinnedPrimitiveArray. If you need to unpin the array manually, call the
/// release() or abort() functions. During a long-running block of code, you
/// should unpin the array as soon as you're done with it, to avoid holding up
/// the Java garbage collector.
template <typename T, typename PinAlloc>
class PinnedPrimitiveArray {
  public:
   static_assert(is_jni_primitive<T>::value,
       "PinnedPrimitiveArray requires primitive jni type.");

   using ArrayType = typename jtype_traits<T>::array_type;

   PinnedPrimitiveArray(PinnedPrimitiveArray&&);
   PinnedPrimitiveArray(const PinnedPrimitiveArray&) = delete;
   ~PinnedPrimitiveArray() noexcept;

   PinnedPrimitiveArray& operator=(PinnedPrimitiveArray&&);
   PinnedPrimitiveArray& operator=(const PinnedPrimitiveArray&) = delete;

   T* get();
   void release();
   /// Unpins the array. If the array is a copy, pending changes are discarded.
   void abort();
   /// If the array is a copy, copies pending changes to the underlying java array.
   void commit();

   bool isCopy() const noexcept;

   const T& operator[](size_t index) const;
   T& operator[](size_t index);
   size_t size() const noexcept;

  private:
   alias_ref<ArrayType> array_;
   size_t start_;
   T* elements_;
   jboolean isCopy_;
   size_t size_;

   void allocate(alias_ref<ArrayType>, jint start, jint length);
   void releaseImpl(jint mode);
   void clear() noexcept;

   PinnedPrimitiveArray(alias_ref<ArrayType>, jint start, jint length);

   friend class JPrimitiveArray<typename jtype_traits<T>::array_type>;
};

struct FBEXPORT JStackTraceElement : JavaClass<JStackTraceElement> {
  static auto constexpr kJavaDescriptor = "Ljava/lang/StackTraceElement;";

  static local_ref<javaobject> create(const std::string& declaringClass, const std::string& methodName, const std::string& file, int line);

  std::string getClassName() const;
  std::string getMethodName() const;
  std::string getFileName() const;
  int getLineNumber() const;
};

/// Wrapper to provide functionality to jthrowable references
class FBEXPORT JThrowable : public JavaClass<JThrowable, JObject, jthrowable> {
 public:
  static constexpr const char* kJavaDescriptor = "Ljava/lang/Throwable;";

  using JStackTrace = JArrayClass<JStackTraceElement::javaobject>;

  local_ref<JThrowable> initCause(alias_ref<JThrowable> cause);
  local_ref<JStackTrace> getStackTrace();
  void setStackTrace(alias_ref<JArrayClass<JStackTraceElement::javaobject>>);
};

#pragma push_macro("PlainJniRefMap")
#undef PlainJniRefMap
#define PlainJniRefMap(rtype, jtype) \
namespace detail { \
template<> \
struct RefReprType<jtype> { \
  using type = rtype; \
}; \
}

PlainJniRefMap(JArrayBoolean, jbooleanArray);
PlainJniRefMap(JArrayByte, jbyteArray);
PlainJniRefMap(JArrayChar, jcharArray);
PlainJniRefMap(JArrayShort, jshortArray);
PlainJniRefMap(JArrayInt, jintArray);
PlainJniRefMap(JArrayLong, jlongArray);
PlainJniRefMap(JArrayFloat, jfloatArray);
PlainJniRefMap(JArrayDouble, jdoubleArray);
PlainJniRefMap(JObject, jobject);
PlainJniRefMap(JClass, jclass);
PlainJniRefMap(JString, jstring);
PlainJniRefMap(JThrowable, jthrowable);

#pragma pop_macro("PlainJniRefMap")

}}

#include "CoreClasses-inl.h"
