/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cassert>
#include <cstring>
#include <exception>
#include <functional>
#include <memory>
#include <string>
#include <vector>

#ifndef JSI_EXPORT
#ifdef _MSC_VER
#ifdef CREATE_SHARED_LIBRARY
#define JSI_EXPORT __declspec(dllexport)
#else
#define JSI_EXPORT
#endif // CREATE_SHARED_LIBRARY
#else // _MSC_VER
#define JSI_EXPORT __attribute__((visibility("default")))
#endif // _MSC_VER
#endif // !defined(JSI_EXPORT)

class FBJSRuntime;
namespace facebook {
namespace jsi {

/// Base class for buffers of data or bytecode that need to be passed to the
/// runtime. The buffer is expected to be fully immutable, so the result of
/// size(), data(), and the contents of the pointer returned by data() must not
/// change after construction.
class JSI_EXPORT Buffer {
 public:
  virtual ~Buffer();
  virtual size_t size() const = 0;
  virtual const uint8_t* data() const = 0;
};

class JSI_EXPORT StringBuffer : public Buffer {
 public:
  StringBuffer(std::string s) : s_(std::move(s)) {}
  size_t size() const override {
    return s_.size();
  }
  const uint8_t* data() const override {
    return reinterpret_cast<const uint8_t*>(s_.data());
  }

 private:
  std::string s_;
};

/// Base class for buffers of data that need to be passed to the runtime. The
/// result of size() and data() must not change after construction. However, the
/// region pointed to by data() may be modified by the user or the runtime. The
/// user must ensure that access to the contents of the buffer is properly
/// synchronised.
class JSI_EXPORT MutableBuffer {
 public:
  virtual ~MutableBuffer();
  virtual size_t size() const = 0;
  virtual uint8_t* data() = 0;
};

/// PreparedJavaScript is a base class representing JavaScript which is in a
/// form optimized for execution, in a runtime-specific way. Construct one via
/// jsi::Runtime::prepareJavaScript().
/// ** This is an experimental API that is subject to change. **
class JSI_EXPORT PreparedJavaScript {
 protected:
  PreparedJavaScript() = default;

 public:
  virtual ~PreparedJavaScript() = 0;
};

class Runtime;
class Pointer;
class PropNameID;
class Symbol;
class BigInt;
class String;
class Object;
class WeakObject;
class Array;
class ArrayBuffer;
class Function;
class Value;
class Instrumentation;
class Scope;
class JSIException;
class JSError;

/// A function which has this type can be registered as a function
/// callable from JavaScript using Function::createFromHostFunction().
/// When the function is called, args will point to the arguments, and
/// count will indicate how many arguments are passed.  The function
/// can return a Value to the caller, or throw an exception.  If a C++
/// exception is thrown, a JS Error will be created and thrown into
/// JS; if the C++ exception extends std::exception, the Error's
/// message will be whatever what() returns. Note that it is undefined whether
/// HostFunctions may or may not be called in strict mode; that is `thisVal`
/// can be any value - it will not necessarily be coerced to an object or
/// or set to the global object.
using HostFunctionType = std::function<
    Value(Runtime& rt, const Value& thisVal, const Value* args, size_t count)>;

/// An object which implements this interface can be registered as an
/// Object with the JS runtime.
class JSI_EXPORT HostObject {
 public:
  // The C++ object's dtor will be called when the GC finalizes this
  // object.  (This may be as late as when the Runtime is shut down.)
  // You have no control over which thread it is called on.  This will
  // be called from inside the GC, so it is unsafe to do any VM
  // operations which require a Runtime&.  Derived classes' dtors
  // should also avoid doing anything expensive.  Calling the dtor on
  // a jsi object is explicitly ok.  If you want to do JS operations,
  // or any nontrivial work, you should add it to a work queue, and
  // manage it externally.
  virtual ~HostObject();

  // When JS wants a property with a given name from the HostObject,
  // it will call this method.  If it throws an exception, the call
  // will throw a JS \c Error object. By default this returns undefined.
  // \return the value for the property.
  virtual Value get(Runtime&, const PropNameID& name);

  // When JS wants to set a property with a given name on the HostObject,
  // it will call this method. If it throws an exception, the call will
  // throw a JS \c Error object. By default this throws a type error exception
  // mimicking the behavior of a frozen object in strict mode.
  virtual void set(Runtime&, const PropNameID& name, const Value& value);

  // When JS wants a list of property names for the HostObject, it will
  // call this method. If it throws an exception, the call will throw a
  // JS \c Error object. The default implementation returns empty vector.
  virtual std::vector<PropNameID> getPropertyNames(Runtime& rt);
};

/// Native state (and destructor) that can be attached to any JS object
/// using setNativeState.
class JSI_EXPORT NativeState {
 public:
  virtual ~NativeState();
};

/// Represents a JS runtime.  Movable, but not copyable.  Note that
/// this object may not be thread-aware, but cannot be used safely from
/// multiple threads at once.  The application is responsible for
/// ensuring that it is used safely.  This could mean using the
/// Runtime from a single thread, using a mutex, doing all work on a
/// serial queue, etc.  This restriction applies to the methods of
/// this class, and any method in the API which take a Runtime& as an
/// argument.  Destructors (all but ~Scope), operators, or other methods
/// which do not take Runtime& as an argument are safe to call from any
/// thread, but it is still forbidden to make write operations on a single
/// instance of any class from more than one thread.  In addition, to
/// make shutdown safe, destruction of objects associated with the Runtime
/// must be destroyed before the Runtime is destroyed, or from the
/// destructor of a managed HostObject or HostFunction.  Informally, this
/// means that the main source of unsafe behavior is to hold a jsi object
/// in a non-Runtime-managed object, and not clean it up before the Runtime
/// is shut down.  If your lifecycle is such that avoiding this is hard,
/// you will probably need to do use your own locks.
class JSI_EXPORT Runtime {
 public:
  virtual ~Runtime();

  /// Evaluates the given JavaScript \c buffer.  \c sourceURL is used
  /// to annotate the stack trace if there is an exception.  The
  /// contents may be utf8-encoded JS source code, or binary bytecode
  /// whose format is specific to the implementation.  If the input
  /// format is unknown, or evaluation causes an error, a JSIException
  /// will be thrown.
  /// Note this function should ONLY be used when there isn't another means
  /// through the JSI API. For example, it will be much slower to use this to
  /// call a global function than using the JSI APIs to read the function
  /// property from the global object and then calling it explicitly.
  virtual Value evaluateJavaScript(
      const std::shared_ptr<const Buffer>& buffer,
      const std::string& sourceURL) = 0;

  /// Prepares to evaluate the given JavaScript \c buffer by processing it into
  /// a form optimized for execution. This may include pre-parsing, compiling,
  /// etc. If the input is invalid (for example, cannot be parsed), a
  /// JSIException will be thrown. The resulting object is tied to the
  /// particular concrete type of Runtime from which it was created. It may be
  /// used (via evaluatePreparedJavaScript) in any Runtime of the same concrete
  /// type.
  /// The PreparedJavaScript object may be passed to multiple VM instances, so
  /// they can all share and benefit from the prepared script.
  /// As with evaluateJavaScript(), using JavaScript code should be avoided
  /// when the JSI API is sufficient.
  virtual std::shared_ptr<const PreparedJavaScript> prepareJavaScript(
      const std::shared_ptr<const Buffer>& buffer,
      std::string sourceURL) = 0;

  /// Evaluates a PreparedJavaScript. If evaluation causes an error, a
  /// JSIException will be thrown.
  /// As with evaluateJavaScript(), using JavaScript code should be avoided
  /// when the JSI API is sufficient.
  virtual Value evaluatePreparedJavaScript(
      const std::shared_ptr<const PreparedJavaScript>& js) = 0;

  /// Queues a microtask in the JavaScript VM internal Microtask (a.k.a. Job in
  /// ECMA262) queue, to be executed when the host drains microtasks in
  /// its event loop implementation.
  ///
  /// \param callback a function to be executed as a microtask.
  virtual void queueMicrotask(const jsi::Function& callback) = 0;

  /// Drain the JavaScript VM internal Microtask (a.k.a. Job in ECMA262) queue.
  ///
  /// \param maxMicrotasksHint a hint to tell an implementation that it should
  /// make a best effort not execute more than the given number. It's default
  /// to -1 for infinity (unbounded execution).
  /// \return true if the queue is drained or false if there is more work to do.
  ///
  /// When there were exceptions thrown from the execution of microtasks,
  /// implementations shall discard the exceptional jobs. An implementation may
  /// \throw a \c JSError object to signal the hosts to handle. In that case, an
  /// implementation may or may not suspend the draining.
  ///
  /// Hosts may call this function again to resume the draining if it was
  /// suspended due to either exceptions or the \p maxMicrotasksHint bound.
  /// E.g. a host may repetitively invoke this function until the queue is
  /// drained to implement the "microtask checkpoint" defined in WHATWG HTML
  /// event loop: https://html.spec.whatwg.org/C#perform-a-microtask-checkpoint.
  ///
  /// Note that error propagation is only a concern if a host needs to implement
  /// `queueMicrotask`, a recent API that allows enqueueing arbitrary functions
  /// (hence may throw) as microtasks. Exceptions from ECMA-262 Promise Jobs are
  /// handled internally to VMs and are never propagated to hosts.
  ///
  /// This API offers some queue management to hosts at its best effort due to
  /// different behaviors and limitations imposed by different VMs and APIs. By
  /// the time this is written, An implementation may swallow exceptions (JSC),
  /// may not pause (V8), and may not support bounded executions.
  virtual bool drainMicrotasks(int maxMicrotasksHint = -1) = 0;

  /// \return the global object
  virtual Object global() = 0;

  /// \return a short printable description of the instance.  It should
  /// at least include some human-readable indication of the runtime
  /// implementation.  This should only be used by logging, debugging,
  /// and other developer-facing callers.
  virtual std::string description() = 0;

  /// \return whether or not the underlying runtime supports debugging via the
  /// Chrome remote debugging protocol.
  ///
  /// NOTE: the API for determining whether a runtime is debuggable and
  /// registering a runtime with the debugger is still in flux, so please don't
  /// use this API unless you know what you're doing.
  virtual bool isInspectable() = 0;

  /// \return an interface to extract metrics from this \c Runtime.  The default
  /// implementation of this function returns an \c Instrumentation instance
  /// which returns no metrics.
  virtual Instrumentation& instrumentation();

 protected:
  friend class Pointer;
  friend class PropNameID;
  friend class Symbol;
  friend class BigInt;
  friend class String;
  friend class Object;
  friend class WeakObject;
  friend class Array;
  friend class ArrayBuffer;
  friend class Function;
  friend class Value;
  friend class Scope;
  friend class JSError;

  // Potential optimization: avoid the cloneFoo() virtual dispatch,
  // and instead just fix the number of fields, and copy them, since
  // in practice they are trivially copyable.  Sufficient use of
  // rvalue arguments/methods would also reduce the number of clones.

  struct PointerValue {
    virtual void invalidate() noexcept = 0;

   protected:
    virtual ~PointerValue() = default;
  };

  virtual PointerValue* cloneSymbol(const Runtime::PointerValue* pv) = 0;
  virtual PointerValue* cloneBigInt(const Runtime::PointerValue* pv) = 0;
  virtual PointerValue* cloneString(const Runtime::PointerValue* pv) = 0;
  virtual PointerValue* cloneObject(const Runtime::PointerValue* pv) = 0;
  virtual PointerValue* clonePropNameID(const Runtime::PointerValue* pv) = 0;

  virtual PropNameID createPropNameIDFromAscii(
      const char* str,
      size_t length) = 0;
  virtual PropNameID createPropNameIDFromUtf8(
      const uint8_t* utf8,
      size_t length) = 0;
  virtual PropNameID createPropNameIDFromUtf16(
      const char16_t* utf16,
      size_t length);
  virtual PropNameID createPropNameIDFromString(const String& str) = 0;
  virtual PropNameID createPropNameIDFromSymbol(const Symbol& sym) = 0;
  virtual std::string utf8(const PropNameID&) = 0;
  virtual bool compare(const PropNameID&, const PropNameID&) = 0;

  virtual std::string symbolToString(const Symbol&) = 0;

  virtual BigInt createBigIntFromInt64(int64_t) = 0;
  virtual BigInt createBigIntFromUint64(uint64_t) = 0;
  virtual bool bigintIsInt64(const BigInt&) = 0;
  virtual bool bigintIsUint64(const BigInt&) = 0;
  virtual uint64_t truncate(const BigInt&) = 0;
  virtual String bigintToString(const BigInt&, int) = 0;

  virtual String createStringFromAscii(const char* str, size_t length) = 0;
  virtual String createStringFromUtf8(const uint8_t* utf8, size_t length) = 0;
  virtual String createStringFromUtf16(const char16_t* utf16, size_t length);
  virtual std::string utf8(const String&) = 0;

  // \return a \c Value created from a utf8-encoded JSON string. The default
  // implementation creates a \c String and invokes JSON.parse.
  virtual Value createValueFromJsonUtf8(const uint8_t* json, size_t length);

  virtual Object createObject() = 0;
  virtual Object createObject(std::shared_ptr<HostObject> ho) = 0;
  virtual std::shared_ptr<HostObject> getHostObject(const jsi::Object&) = 0;
  virtual HostFunctionType& getHostFunction(const jsi::Function&) = 0;

  // Creates a new Object with the custom prototype
  virtual Object createObjectWithPrototype(const Value& prototype);

  virtual bool hasNativeState(const jsi::Object&) = 0;
  virtual std::shared_ptr<NativeState> getNativeState(const jsi::Object&) = 0;
  virtual void setNativeState(
      const jsi::Object&,
      std::shared_ptr<NativeState> state) = 0;

  virtual void setPrototypeOf(const Object& object, const Value& prototype);
  virtual Value getPrototypeOf(const Object& object);

  virtual Value getProperty(const Object&, const PropNameID& name) = 0;
  virtual Value getProperty(const Object&, const String& name) = 0;
  virtual bool hasProperty(const Object&, const PropNameID& name) = 0;
  virtual bool hasProperty(const Object&, const String& name) = 0;
  virtual void setPropertyValue(
      const Object&,
      const PropNameID& name,
      const Value& value) = 0;
  virtual void
  setPropertyValue(const Object&, const String& name, const Value& value) = 0;

  virtual bool isArray(const Object&) const = 0;
  virtual bool isArrayBuffer(const Object&) const = 0;
  virtual bool isFunction(const Object&) const = 0;
  virtual bool isHostObject(const jsi::Object&) const = 0;
  virtual bool isHostFunction(const jsi::Function&) const = 0;
  virtual Array getPropertyNames(const Object&) = 0;

  virtual WeakObject createWeakObject(const Object&) = 0;
  virtual Value lockWeakObject(const WeakObject&) = 0;

  virtual Array createArray(size_t length) = 0;
  virtual ArrayBuffer createArrayBuffer(
      std::shared_ptr<MutableBuffer> buffer) = 0;
  virtual size_t size(const Array&) = 0;
  virtual size_t size(const ArrayBuffer&) = 0;
  virtual uint8_t* data(const ArrayBuffer&) = 0;
  virtual Value getValueAtIndex(const Array&, size_t i) = 0;
  virtual void
  setValueAtIndexImpl(const Array&, size_t i, const Value& value) = 0;

  virtual Function createFunctionFromHostFunction(
      const PropNameID& name,
      unsigned int paramCount,
      HostFunctionType func) = 0;
  virtual Value call(
      const Function&,
      const Value& jsThis,
      const Value* args,
      size_t count) = 0;
  virtual Value
  callAsConstructor(const Function&, const Value* args, size_t count) = 0;

  // Private data for managing scopes.
  struct ScopeState;
  virtual ScopeState* pushScope();
  virtual void popScope(ScopeState*);

  virtual bool strictEquals(const Symbol& a, const Symbol& b) const = 0;
  virtual bool strictEquals(const BigInt& a, const BigInt& b) const = 0;
  virtual bool strictEquals(const String& a, const String& b) const = 0;
  virtual bool strictEquals(const Object& a, const Object& b) const = 0;

  virtual bool instanceOf(const Object& o, const Function& f) = 0;

  /// See Object::setExternalMemoryPressure.
  virtual void setExternalMemoryPressure(
      const jsi::Object& obj,
      size_t amount) = 0;

  virtual std::u16string utf16(const String& str);
  virtual std::u16string utf16(const PropNameID& sym);

  /// Invokes the provided callback \p cb with the String content in \p str.
  /// The callback must take in three arguments: bool ascii, const void* data,
  /// and size_t num, respectively. \p ascii indicates whether the \p data
  /// passed to the callback should be interpreted as a pointer to a sequence of
  /// \p num ASCII characters or UTF16 characters. Depending on the internal
  /// representation of the string, the function may invoke the callback
  /// multiple times, with a different format on each invocation. The callback
  /// must not access runtime functionality, as any operation on the runtime may
  /// invalidate the data pointers.
  virtual void getStringData(
      const jsi::String& str,
      void* ctx,
      void (*cb)(void* ctx, bool ascii, const void* data, size_t num));

  /// Invokes the provided callback \p cb with the PropNameID content in \p sym.
  /// The callback must take in three arguments: bool ascii, const void* data,
  /// and size_t num, respectively. \p ascii indicates whether the \p data
  /// passed to the callback should be interpreted as a pointer to a sequence of
  /// \p num ASCII characters or UTF16 characters. Depending on the internal
  /// representation of the string, the function may invoke the callback
  /// multiple times, with a different format on each invocation. The callback
  /// must not access runtime functionality, as any operation on the runtime may
  /// invalidate the data pointers.
  virtual void getPropNameIdData(
      const jsi::PropNameID& sym,
      void* ctx,
      void (*cb)(void* ctx, bool ascii, const void* data, size_t num));

  // These exist so derived classes can access the private parts of
  // Value, Symbol, String, and Object, which are all friends of Runtime.
  template <typename T>
  static T make(PointerValue* pv);
  static PointerValue* getPointerValue(Pointer& pointer);
  static const PointerValue* getPointerValue(const Pointer& pointer);
  static const PointerValue* getPointerValue(const Value& value);

  friend class ::FBJSRuntime;
  template <typename Plain, typename Base>
  friend class RuntimeDecorator;
};

// Base class for pointer-storing types.
class JSI_EXPORT Pointer {
 protected:
  explicit Pointer(Pointer&& other) noexcept : ptr_(other.ptr_) {
    other.ptr_ = nullptr;
  }

  ~Pointer() {
    if (ptr_) {
      ptr_->invalidate();
    }
  }

  Pointer& operator=(Pointer&& other) noexcept;

  friend class Runtime;
  friend class Value;

  explicit Pointer(Runtime::PointerValue* ptr) : ptr_(ptr) {}

  typename Runtime::PointerValue* ptr_;
};

/// Represents something that can be a JS property key.  Movable, not copyable.
class JSI_EXPORT PropNameID : public Pointer {
 public:
  using Pointer::Pointer;

  PropNameID(Runtime& runtime, const PropNameID& other)
      : Pointer(runtime.clonePropNameID(other.ptr_)) {}

  PropNameID(PropNameID&& other) = default;
  PropNameID& operator=(PropNameID&& other) = default;

  /// Create a JS property name id from ascii values.  The data is
  /// copied.
  static PropNameID forAscii(Runtime& runtime, const char* str, size_t length) {
    return runtime.createPropNameIDFromAscii(str, length);
  }

  /// Create a property name id from a nul-terminated C ascii name.  The data is
  /// copied.
  static PropNameID forAscii(Runtime& runtime, const char* str) {
    return forAscii(runtime, str, strlen(str));
  }

  /// Create a PropNameID from a C++ string. The string is copied.
  static PropNameID forAscii(Runtime& runtime, const std::string& str) {
    return forAscii(runtime, str.c_str(), str.size());
  }

  /// Create a PropNameID from utf8 values.  The data is copied.
  /// Results are undefined if \p utf8 contains invalid code points.
  static PropNameID
  forUtf8(Runtime& runtime, const uint8_t* utf8, size_t length) {
    return runtime.createPropNameIDFromUtf8(utf8, length);
  }

  /// Create a PropNameID from utf8-encoded octets stored in a
  /// std::string.  The string data is transformed and copied.
  /// Results are undefined if \p utf8 contains invalid code points.
  static PropNameID forUtf8(Runtime& runtime, const std::string& utf8) {
    return runtime.createPropNameIDFromUtf8(
        reinterpret_cast<const uint8_t*>(utf8.data()), utf8.size());
  }

  /// Given a series of UTF-16 encoded code units, create a PropNameId. The
  /// input may contain unpaired surrogates, which will be interpreted as a code
  /// point of the same value.
  static PropNameID
  forUtf16(Runtime& runtime, const char16_t* utf16, size_t length) {
    return runtime.createPropNameIDFromUtf16(utf16, length);
  }

  /// Given a series of UTF-16 encoded code units stored inside std::u16string,
  /// create a PropNameId.  The input may contain unpaired surrogates, which
  /// will be interpreted as a code point of the same value.
  static PropNameID forUtf16(Runtime& runtime, const std::u16string& str) {
    return runtime.createPropNameIDFromUtf16(str.data(), str.size());
  }

  /// Create a PropNameID from a JS string.
  static PropNameID forString(Runtime& runtime, const jsi::String& str) {
    return runtime.createPropNameIDFromString(str);
  }

  /// Create a PropNameID from a JS symbol.
  static PropNameID forSymbol(Runtime& runtime, const jsi::Symbol& sym) {
    return runtime.createPropNameIDFromSymbol(sym);
  }

  // Creates a vector of PropNameIDs constructed from given arguments.
  template <typename... Args>
  static std::vector<PropNameID> names(Runtime& runtime, Args&&... args);

  // Creates a vector of given PropNameIDs.
  template <size_t N>
  static std::vector<PropNameID> names(PropNameID (&&propertyNames)[N]);

  /// Copies the data in a PropNameID as utf8 into a C++ string.
  std::string utf8(Runtime& runtime) const {
    return runtime.utf8(*this);
  }

  /// Copies the data in a PropNameID as utf16 into a C++ string.
  std::u16string utf16(Runtime& runtime) const {
    return runtime.utf16(*this);
  }

  /// Invokes the user provided callback to process the content in PropNameId.
  /// The callback must take in three arguments: bool ascii, const void* data,
  /// and size_t num, respectively. \p ascii indicates whether the \p data
  /// passed to the callback should be interpreted as a pointer to a sequence of
  /// \p num ASCII characters or UTF16 characters. The function may invoke the
  /// callback multiple times, with a different format on each invocation. The
  /// callback must not access runtime functionality, as any operation on the
  /// runtime may invalidate the data pointers.
  template <typename CB>
  void getPropNameIdData(Runtime& runtime, CB& cb) const {
    runtime.getPropNameIdData(
        *this, &cb, [](void* ctx, bool ascii, const void* data, size_t num) {
          (*((CB*)ctx))(ascii, data, num);
        });
  }

  static bool compare(
      Runtime& runtime,
      const jsi::PropNameID& a,
      const jsi::PropNameID& b) {
    return runtime.compare(a, b);
  }

  friend class Runtime;
  friend class Value;
};

/// Represents a JS Symbol (es6).  Movable, not copyable.
/// TODO T40778724: this is a limited implementation sufficient for
/// the debugger not to crash when a Symbol is a property in an Object
/// or element in an array.  Complete support for creating will come
/// later.
class JSI_EXPORT Symbol : public Pointer {
 public:
  using Pointer::Pointer;

  Symbol(Symbol&& other) = default;
  Symbol& operator=(Symbol&& other) = default;

  /// \return whether a and b refer to the same symbol.
  static bool strictEquals(Runtime& runtime, const Symbol& a, const Symbol& b) {
    return runtime.strictEquals(a, b);
  }

  /// Converts a Symbol into a C++ string as JS .toString would.  The output
  /// will look like \c Symbol(description) .
  std::string toString(Runtime& runtime) const {
    return runtime.symbolToString(*this);
  }

  friend class Runtime;
  friend class Value;
};

/// Represents a JS BigInt.  Movable, not copyable.
class JSI_EXPORT BigInt : public Pointer {
 public:
  using Pointer::Pointer;

  BigInt(BigInt&& other) = default;
  BigInt& operator=(BigInt&& other) = default;

  /// Create a BigInt representing the signed 64-bit \p value.
  static BigInt fromInt64(Runtime& runtime, int64_t value) {
    return runtime.createBigIntFromInt64(value);
  }

  /// Create a BigInt representing the unsigned 64-bit \p value.
  static BigInt fromUint64(Runtime& runtime, uint64_t value) {
    return runtime.createBigIntFromUint64(value);
  }

  /// \return whether a === b.
  static bool strictEquals(Runtime& runtime, const BigInt& a, const BigInt& b) {
    return runtime.strictEquals(a, b);
  }

  /// \returns This bigint truncated to a signed 64-bit integer.
  int64_t getInt64(Runtime& runtime) const {
    return runtime.truncate(*this);
  }

  /// \returns Whether this bigint can be losslessly converted to int64_t.
  bool isInt64(Runtime& runtime) const {
    return runtime.bigintIsInt64(*this);
  }

  /// \returns This bigint truncated to a signed 64-bit integer. Throws a
  /// JSIException if the truncation is lossy.
  int64_t asInt64(Runtime& runtime) const;

  /// \returns This bigint truncated to an unsigned 64-bit integer.
  uint64_t getUint64(Runtime& runtime) const {
    return runtime.truncate(*this);
  }

  /// \returns Whether this bigint can be losslessly converted to uint64_t.
  bool isUint64(Runtime& runtime) const {
    return runtime.bigintIsUint64(*this);
  }

  /// \returns This bigint truncated to an unsigned 64-bit integer. Throws a
  /// JSIException if the truncation is lossy.
  uint64_t asUint64(Runtime& runtime) const;

  /// \returns this BigInt converted to a String in base \p radix. Throws a
  /// JSIException if radix is not in the [2, 36] range.
  inline String toString(Runtime& runtime, int radix = 10) const;

  friend class Runtime;
  friend class Value;
};

/// Represents a JS String.  Movable, not copyable.
class JSI_EXPORT String : public Pointer {
 public:
  using Pointer::Pointer;

  String(String&& other) = default;
  String& operator=(String&& other) = default;

  /// Create a JS string from ascii values.  The string data is
  /// copied.
  static String
  createFromAscii(Runtime& runtime, const char* str, size_t length) {
    return runtime.createStringFromAscii(str, length);
  }

  /// Create a JS string from a nul-terminated C ascii string.  The
  /// string data is copied.
  static String createFromAscii(Runtime& runtime, const char* str) {
    return createFromAscii(runtime, str, strlen(str));
  }

  /// Create a JS string from a C++ string.  The string data is
  /// copied.
  static String createFromAscii(Runtime& runtime, const std::string& str) {
    return createFromAscii(runtime, str.c_str(), str.size());
  }

  /// Create a JS string from utf8-encoded octets.  The string data is
  /// transformed and copied.  Results are undefined if \p utf8 contains invalid
  /// code points.
  static String
  createFromUtf8(Runtime& runtime, const uint8_t* utf8, size_t length) {
    return runtime.createStringFromUtf8(utf8, length);
  }

  /// Create a JS string from utf8-encoded octets stored in a
  /// std::string.  The string data is transformed and copied.  Results are
  /// undefined if \p utf8 contains invalid code points.
  static String createFromUtf8(Runtime& runtime, const std::string& utf8) {
    return runtime.createStringFromUtf8(
        reinterpret_cast<const uint8_t*>(utf8.data()), utf8.length());
  }

  /// Given a series of UTF-16 encoded code units, create a JS String. The input
  /// may contain unpaired surrogates, which will be interpreted as a code point
  /// of the same value.
  static String
  createFromUtf16(Runtime& runtime, const char16_t* utf16, size_t length) {
    return runtime.createStringFromUtf16(utf16, length);
  }

  /// Given a series of UTF-16 encoded code units stored inside std::u16string,
  /// create a JS String. The input may contain unpaired surrogates, which will
  /// be interpreted as a code point of the same value.
  static String createFromUtf16(Runtime& runtime, const std::u16string& utf16) {
    return runtime.createStringFromUtf16(utf16.data(), utf16.length());
  }

  /// \return whether a and b contain the same characters.
  static bool strictEquals(Runtime& runtime, const String& a, const String& b) {
    return runtime.strictEquals(a, b);
  }

  /// Copies the data in a JS string as utf8 into a C++ string.
  std::string utf8(Runtime& runtime) const {
    return runtime.utf8(*this);
  }

  /// Copies the data in a JS string as utf16 into a C++ string.
  std::u16string utf16(Runtime& runtime) const {
    return runtime.utf16(*this);
  }

  /// Invokes the user provided callback to process content in String. The
  /// callback must take in three arguments: bool ascii, const void* data, and
  /// size_t num, respectively. \p ascii indicates whether the \p data passed to
  /// the callback should be interpreted as a pointer to a sequence of \p num
  /// ASCII characters or UTF16 characters. The function may invoke the callback
  /// multiple times, with a different format on each invocation. The callback
  /// must not access runtime functionality, as any operation on the runtime may
  /// invalidate the data pointers.
  template <typename CB>
  void getStringData(Runtime& runtime, CB& cb) const {
    runtime.getStringData(
        *this, &cb, [](void* ctx, bool ascii, const void* data, size_t num) {
          (*((CB*)ctx))(ascii, data, num);
        });
  }

  friend class Runtime;
  friend class Value;
};

class Array;
class Function;

/// Represents a JS Object.  Movable, not copyable.
class JSI_EXPORT Object : public Pointer {
 public:
  using Pointer::Pointer;

  Object(Object&& other) = default;
  Object& operator=(Object&& other) = default;

  /// Creates a new Object instance, like '{}' in JS.
  Object(Runtime& runtime) : Object(runtime.createObject()) {}

  static Object createFromHostObject(
      Runtime& runtime,
      std::shared_ptr<HostObject> ho) {
    return runtime.createObject(ho);
  }

  /// Creates a new Object with the custom prototype
  static Object create(Runtime& runtime, const Value& prototype) {
    return runtime.createObjectWithPrototype(prototype);
  }

  /// \return whether this and \c obj are the same JSObject or not.
  static bool strictEquals(Runtime& runtime, const Object& a, const Object& b) {
    return runtime.strictEquals(a, b);
  }

  /// \return the result of `this instanceOf ctor` in JS.
  bool instanceOf(Runtime& rt, const Function& ctor) const {
    return rt.instanceOf(*this, ctor);
  }

  /// Sets \p prototype as the prototype of the object. The prototype must be
  /// either an Object or null. If the prototype was not set successfully, this
  /// method will throw.
  void setPrototype(Runtime& runtime, const Value& prototype) const {
    return runtime.setPrototypeOf(*this, prototype);
  }

  /// \return the prototype of the object
  inline Value getPrototype(Runtime& runtime) const;

  /// \return the property of the object with the given ascii name.
  /// If the name isn't a property on the object, returns the
  /// undefined value.
  Value getProperty(Runtime& runtime, const char* name) const;

  /// \return the property of the object with the String name.
  /// If the name isn't a property on the object, returns the
  /// undefined value.
  Value getProperty(Runtime& runtime, const String& name) const;

  /// \return the property of the object with the given JS PropNameID
  /// name.  If the name isn't a property on the object, returns the
  /// undefined value.
  Value getProperty(Runtime& runtime, const PropNameID& name) const;

  /// \return true if and only if the object has a property with the
  /// given ascii name.
  bool hasProperty(Runtime& runtime, const char* name) const;

  /// \return true if and only if the object has a property with the
  /// given String name.
  bool hasProperty(Runtime& runtime, const String& name) const;

  /// \return true if and only if the object has a property with the
  /// given PropNameID name.
  bool hasProperty(Runtime& runtime, const PropNameID& name) const;

  /// Sets the property value from a Value or anything which can be
  /// used to make one: nullptr_t, bool, double, int, const char*,
  /// String, or Object.
  template <typename T>
  void setProperty(Runtime& runtime, const char* name, T&& value) const;

  /// Sets the property value from a Value or anything which can be
  /// used to make one: nullptr_t, bool, double, int, const char*,
  /// String, or Object.
  template <typename T>
  void setProperty(Runtime& runtime, const String& name, T&& value) const;

  /// Sets the property value from a Value or anything which can be
  /// used to make one: nullptr_t, bool, double, int, const char*,
  /// String, or Object.
  template <typename T>
  void setProperty(Runtime& runtime, const PropNameID& name, T&& value) const;

  /// \return true iff JS \c Array.isArray() would return \c true.  If
  /// so, then \c getArray() will succeed.
  bool isArray(Runtime& runtime) const {
    return runtime.isArray(*this);
  }

  /// \return true iff the Object is an ArrayBuffer. If so, then \c
  /// getArrayBuffer() will succeed.
  bool isArrayBuffer(Runtime& runtime) const {
    return runtime.isArrayBuffer(*this);
  }

  /// \return true iff the Object is callable.  If so, then \c
  /// getFunction will succeed.
  bool isFunction(Runtime& runtime) const {
    return runtime.isFunction(*this);
  }

  /// \return true iff the Object was initialized with \c createFromHostObject
  /// and the HostObject passed is of type \c T. If returns \c true then
  /// \c getHostObject<T> will succeed.
  template <typename T = HostObject>
  bool isHostObject(Runtime& runtime) const;

  /// \return an Array instance which refers to the same underlying
  /// object.  If \c isArray() would return false, this will assert.
  Array getArray(Runtime& runtime) const&;

  /// \return an Array instance which refers to the same underlying
  /// object.  If \c isArray() would return false, this will assert.
  Array getArray(Runtime& runtime) &&;

  /// \return an Array instance which refers to the same underlying
  /// object.  If \c isArray() would return false, this will throw
  /// JSIException.
  Array asArray(Runtime& runtime) const&;

  /// \return an Array instance which refers to the same underlying
  /// object.  If \c isArray() would return false, this will throw
  /// JSIException.
  Array asArray(Runtime& runtime) &&;

  /// \return an ArrayBuffer instance which refers to the same underlying
  /// object.  If \c isArrayBuffer() would return false, this will assert.
  ArrayBuffer getArrayBuffer(Runtime& runtime) const&;

  /// \return an ArrayBuffer instance which refers to the same underlying
  /// object.  If \c isArrayBuffer() would return false, this will assert.
  ArrayBuffer getArrayBuffer(Runtime& runtime) &&;

  /// \return a Function instance which refers to the same underlying
  /// object.  If \c isFunction() would return false, this will assert.
  Function getFunction(Runtime& runtime) const&;

  /// \return a Function instance which refers to the same underlying
  /// object.  If \c isFunction() would return false, this will assert.
  Function getFunction(Runtime& runtime) &&;

  /// \return a Function instance which refers to the same underlying
  /// object.  If \c isFunction() would return false, this will throw
  /// JSIException.
  Function asFunction(Runtime& runtime) const&;

  /// \return a Function instance which refers to the same underlying
  /// object.  If \c isFunction() would return false, this will throw
  /// JSIException.
  Function asFunction(Runtime& runtime) &&;

  /// \return a shared_ptr<T> which refers to the same underlying
  /// \c HostObject that was used to create this object. If \c isHostObject<T>
  /// is false, this will assert. Note that this does a type check and will
  /// assert if the underlying HostObject isn't of type \c T
  template <typename T = HostObject>
  std::shared_ptr<T> getHostObject(Runtime& runtime) const;

  /// \return a shared_ptr<T> which refers to the same underlying
  /// \c HostObject that was used to create this object. If \c isHostObject<T>
  /// is false, this will throw.
  template <typename T = HostObject>
  std::shared_ptr<T> asHostObject(Runtime& runtime) const;

  /// \return whether this object has native state of type T previously set by
  /// \c setNativeState.
  template <typename T = NativeState>
  bool hasNativeState(Runtime& runtime) const;

  /// \return a shared_ptr to the state previously set by \c setNativeState.
  /// If \c hasNativeState<T> is false, this will assert. Note that this does a
  /// type check and will assert if the native state isn't of type \c T
  template <typename T = NativeState>
  std::shared_ptr<T> getNativeState(Runtime& runtime) const;

  /// Set the internal native state property of this object, overwriting any old
  /// value. Creates a new shared_ptr to the object managed by \p state, which
  /// will live until the value at this property becomes unreachable.
  ///
  /// Throws a type error if this object is a proxy or host object.
  void setNativeState(Runtime& runtime, std::shared_ptr<NativeState> state)
      const;

  /// \return same as \c getProperty(name).asObject(), except with
  /// a better exception message.
  Object getPropertyAsObject(Runtime& runtime, const char* name) const;

  /// \return similar to \c
  /// getProperty(name).getObject().getFunction(), except it will
  /// throw JSIException instead of asserting if the property is
  /// not an object, or the object is not callable.
  Function getPropertyAsFunction(Runtime& runtime, const char* name) const;

  /// \return an Array consisting of all enumerable property names in
  /// the object and its prototype chain.  All values in the return
  /// will be isString().  (This is probably not optimal, but it
  /// works.  I only need it in one place.)
  Array getPropertyNames(Runtime& runtime) const;

  /// Inform the runtime that there is additional memory associated with a given
  /// JavaScript object that is not visible to the GC. This can be used if an
  /// object is known to retain some native memory, and may be used to guide
  /// decisions about when to run garbage collection.
  /// This method may be invoked multiple times on an object, and subsequent
  /// calls will overwrite any previously set value. Once the object is garbage
  /// collected, the associated external memory will be considered freed and may
  /// no longer factor into GC decisions.
  void setExternalMemoryPressure(Runtime& runtime, size_t amt) const;

 protected:
  void setPropertyValue(
      Runtime& runtime,
      const String& name,
      const Value& value) const {
    return runtime.setPropertyValue(*this, name, value);
  }

  void setPropertyValue(
      Runtime& runtime,
      const PropNameID& name,
      const Value& value) const {
    return runtime.setPropertyValue(*this, name, value);
  }

  friend class Runtime;
  friend class Value;
};

/// Represents a weak reference to a JS Object.  If the only reference
/// to an Object are these, the object is eligible for GC.  Method
/// names are inspired by C++ weak_ptr.  Movable, not copyable.
class JSI_EXPORT WeakObject : public Pointer {
 public:
  using Pointer::Pointer;

  WeakObject(WeakObject&& other) = default;
  WeakObject& operator=(WeakObject&& other) = default;

  /// Create a WeakObject from an Object.
  WeakObject(Runtime& runtime, const Object& o)
      : WeakObject(runtime.createWeakObject(o)) {}

  /// \return a Value representing the underlying Object if it is still valid;
  /// otherwise returns \c undefined.  Note that this method has nothing to do
  /// with threads or concurrency.  The name is based on std::weak_ptr::lock()
  /// which serves a similar purpose.
  Value lock(Runtime& runtime) const;

  friend class Runtime;
};

/// Represents a JS Object which can be efficiently used as an array
/// with integral indices.
class JSI_EXPORT Array : public Object {
 public:
  Array(Array&&) = default;
  /// Creates a new Array instance, with \c length undefined elements.
  Array(Runtime& runtime, size_t length) : Array(runtime.createArray(length)) {}

  Array& operator=(Array&&) = default;

  /// \return the size of the Array, according to its length property.
  /// (C++ naming convention)
  size_t size(Runtime& runtime) const {
    return runtime.size(*this);
  }

  /// \return the size of the Array, according to its length property.
  /// (JS naming convention)
  size_t length(Runtime& runtime) const {
    return size(runtime);
  }

  /// \return the property of the array at index \c i.  If there is no
  /// such property, returns the undefined value.  If \c i is out of
  /// range [ 0..\c length ] throws a JSIException.
  Value getValueAtIndex(Runtime& runtime, size_t i) const;

  /// Sets the property of the array at index \c i.  The argument
  /// value behaves as with Object::setProperty().  If \c i is out of
  /// range [ 0..\c length ] throws a JSIException.
  template <typename T>
  void setValueAtIndex(Runtime& runtime, size_t i, T&& value) const;

  /// There is no current API for changing the size of an array once
  /// created.  We'll probably need that eventually.

  /// Creates a new Array instance from provided values
  template <typename... Args>
  static Array createWithElements(Runtime&, Args&&... args);

  /// Creates a new Array instance from initializer list.
  static Array createWithElements(
      Runtime& runtime,
      std::initializer_list<Value> elements);

 private:
  friend class Object;
  friend class Value;
  friend class Runtime;

  void setValueAtIndexImpl(Runtime& runtime, size_t i, const Value& value)
      const {
    return runtime.setValueAtIndexImpl(*this, i, value);
  }

  Array(Runtime::PointerValue* value) : Object(value) {}
};

/// Represents a JSArrayBuffer
class JSI_EXPORT ArrayBuffer : public Object {
 public:
  ArrayBuffer(ArrayBuffer&&) = default;
  ArrayBuffer& operator=(ArrayBuffer&&) = default;

  ArrayBuffer(Runtime& runtime, std::shared_ptr<MutableBuffer> buffer)
      : ArrayBuffer(runtime.createArrayBuffer(std::move(buffer))) {}

  /// \return the size of the ArrayBuffer storage. This is not affected by
  /// overriding the byteLength property.
  /// (C++ naming convention)
  size_t size(Runtime& runtime) const {
    return runtime.size(*this);
  }

  size_t length(Runtime& runtime) const {
    return runtime.size(*this);
  }

  uint8_t* data(Runtime& runtime) const {
    return runtime.data(*this);
  }

 private:
  friend class Object;
  friend class Value;
  friend class Runtime;

  ArrayBuffer(Runtime::PointerValue* value) : Object(value) {}
};

/// Represents a JS Object which is guaranteed to be Callable.
class JSI_EXPORT Function : public Object {
 public:
  Function(Function&&) = default;
  Function& operator=(Function&&) = default;

  /// Create a function which, when invoked, calls C++ code. If the
  /// function throws an exception, a JS Error will be created and
  /// thrown.
  /// \param name the name property for the function.
  /// \param paramCount the length property for the function, which
  /// may not be the number of arguments the function is passed.
  /// \note The std::function's dtor will be called when the GC finalizes this
  /// function. As with HostObject, this may be as late as when the Runtime is
  /// shut down, and may occur on an arbitrary thread. If the function contains
  /// any captured values, you are responsible for ensuring that their
  /// destructors are safe to call on any thread.
  static Function createFromHostFunction(
      Runtime& runtime,
      const jsi::PropNameID& name,
      unsigned int paramCount,
      jsi::HostFunctionType func);

  /// Calls the function with \c count \c args.  The \c this value of the JS
  /// function will not be set by the C++ caller, similar to calling
  /// Function.prototype.apply(undefined, args) in JS.
  /// \b Note: as with Function.prototype.apply, \c this may not always be
  /// \c undefined in the function itself.  If the function is non-strict,
  /// \c this will be set to the global object.
  Value call(Runtime& runtime, const Value* args, size_t count) const;

  /// Calls the function with a \c std::initializer_list of Value
  /// arguments.  The \c this value of the JS function will not be set by the
  /// C++ caller, similar to calling Function.prototype.apply(undefined, args)
  /// in JS.
  /// \b Note: as with Function.prototype.apply, \c this may not always be
  /// \c undefined in the function itself.  If the function is non-strict,
  /// \c this will be set to the global object.
  Value call(Runtime& runtime, std::initializer_list<Value> args) const;

  /// Calls the function with any number of arguments similarly to
  /// Object::setProperty().  The \c this value of the JS function will not be
  /// set by the C++ caller, similar to calling
  /// Function.prototype.call(undefined, ...args) in JS.
  /// \b Note: as with Function.prototype.call, \c this may not always be
  /// \c undefined in the function itself.  If the function is non-strict,
  /// \c this will be set to the global object.
  template <typename... Args>
  Value call(Runtime& runtime, Args&&... args) const;

  /// Calls the function with \c count \c args and \c jsThis value passed
  /// as the \c this value.
  Value callWithThis(
      Runtime& Runtime,
      const Object& jsThis,
      const Value* args,
      size_t count) const;

  /// Calls the function with a \c std::initializer_list of Value
  /// arguments and \c jsThis passed as the \c this value.
  Value callWithThis(
      Runtime& runtime,
      const Object& jsThis,
      std::initializer_list<Value> args) const;

  /// Calls the function with any number of arguments similarly to
  /// Object::setProperty(), and with \c jsThis passed as the \c this value.
  template <typename... Args>
  Value callWithThis(Runtime& runtime, const Object& jsThis, Args&&... args)
      const;

  /// Calls the function as a constructor with \c count \c args. Equivalent
  /// to calling `new Func` where `Func` is the js function reqresented by
  /// this.
  Value callAsConstructor(Runtime& runtime, const Value* args, size_t count)
      const;

  /// Same as above `callAsConstructor`, except use an initializer_list to
  /// supply the arguments.
  Value callAsConstructor(Runtime& runtime, std::initializer_list<Value> args)
      const;

  /// Same as above `callAsConstructor`, but automatically converts/wraps
  /// any argument with a jsi Value.
  template <typename... Args>
  Value callAsConstructor(Runtime& runtime, Args&&... args) const;

  /// Returns whether this was created with Function::createFromHostFunction.
  /// If true then you can use getHostFunction to get the underlying
  /// HostFunctionType.
  bool isHostFunction(Runtime& runtime) const {
    return runtime.isHostFunction(*this);
  }

  /// Returns the underlying HostFunctionType iff isHostFunction returns true
  /// and asserts otherwise. You can use this to use std::function<>::target
  /// to get the object that was passed to create the HostFunctionType.
  ///
  /// Note: The reference returned is borrowed from the JS object underlying
  ///       \c this, and thus only lasts as long as the object underlying
  ///       \c this does.
  HostFunctionType& getHostFunction(Runtime& runtime) const {
    assert(isHostFunction(runtime));
    return runtime.getHostFunction(*this);
  }

 private:
  friend class Object;
  friend class Value;
  friend class Runtime;

  Function(Runtime::PointerValue* value) : Object(value) {}
};

/// Represents any JS Value (undefined, null, boolean, number, symbol,
/// string, or object).  Movable, or explicitly copyable (has no copy
/// ctor).
class JSI_EXPORT Value {
 public:
  /// Default ctor creates an \c undefined JS value.
  Value() noexcept : Value(UndefinedKind) {}

  /// Creates a \c null JS value.
  /* implicit */ Value(std::nullptr_t) : kind_(NullKind) {}

  /// Creates a boolean JS value.
  /* implicit */ Value(bool b) : Value(BooleanKind) {
    data_.boolean = b;
  }

  /// Creates a number JS value.
  /* implicit */ Value(double d) : Value(NumberKind) {
    data_.number = d;
  }

  /// Creates a number JS value.
  /* implicit */ Value(int i) : Value(NumberKind) {
    data_.number = i;
  }

  /// Moves a Symbol, String, or Object rvalue into a new JS value.
  template <
      typename T,
      typename = std::enable_if_t<
          std::is_base_of<Symbol, T>::value ||
          std::is_base_of<BigInt, T>::value ||
          std::is_base_of<String, T>::value ||
          std::is_base_of<Object, T>::value>>
  /* implicit */ Value(T&& other) : Value(kindOf(other)) {
    new (&data_.pointer) T(std::move(other));
  }

  /// Value("foo") will treat foo as a bool.  This makes doing that a
  /// compile error.
  template <typename T = void>
  Value(const char*) {
    static_assert(
        !std::is_same<void, T>::value,
        "Value cannot be constructed directly from const char*");
  }

  Value(Value&& other) noexcept;

  /// Copies a Symbol lvalue into a new JS value.
  Value(Runtime& runtime, const Symbol& sym) : Value(SymbolKind) {
    new (&data_.pointer) Symbol(runtime.cloneSymbol(sym.ptr_));
  }

  /// Copies a BigInt lvalue into a new JS value.
  Value(Runtime& runtime, const BigInt& bigint) : Value(BigIntKind) {
    new (&data_.pointer) BigInt(runtime.cloneBigInt(bigint.ptr_));
  }

  /// Copies a String lvalue into a new JS value.
  Value(Runtime& runtime, const String& str) : Value(StringKind) {
    new (&data_.pointer) String(runtime.cloneString(str.ptr_));
  }

  /// Copies a Object lvalue into a new JS value.
  Value(Runtime& runtime, const Object& obj) : Value(ObjectKind) {
    new (&data_.pointer) Object(runtime.cloneObject(obj.ptr_));
  }

  /// Creates a JS value from another Value lvalue.
  Value(Runtime& runtime, const Value& value);

  /// Value(rt, "foo") will treat foo as a bool.  This makes doing
  /// that a compile error.
  template <typename T = void>
  Value(Runtime&, const char*) {
    static_assert(
        !std::is_same<T, void>::value,
        "Value cannot be constructed directly from const char*");
  }

  ~Value();
  // \return the undefined \c Value.
  static Value undefined() {
    return Value();
  }

  // \return the null \c Value.
  static Value null() {
    return Value(nullptr);
  }

  // \return a \c Value created from a utf8-encoded JSON string.
  static Value
  createFromJsonUtf8(Runtime& runtime, const uint8_t* json, size_t length) {
    return runtime.createValueFromJsonUtf8(json, length);
  }

  /// \return according to the Strict Equality Comparison algorithm, see:
  /// https://262.ecma-international.org/11.0/#sec-strict-equality-comparison
  static bool strictEquals(Runtime& runtime, const Value& a, const Value& b);

  Value& operator=(Value&& other) noexcept {
    this->~Value();
    new (this) Value(std::move(other));
    return *this;
  }

  bool isUndefined() const {
    return kind_ == UndefinedKind;
  }

  bool isNull() const {
    return kind_ == NullKind;
  }

  bool isBool() const {
    return kind_ == BooleanKind;
  }

  bool isNumber() const {
    return kind_ == NumberKind;
  }

  bool isString() const {
    return kind_ == StringKind;
  }

  bool isBigInt() const {
    return kind_ == BigIntKind;
  }

  bool isSymbol() const {
    return kind_ == SymbolKind;
  }

  bool isObject() const {
    return kind_ == ObjectKind;
  }

  /// \return the boolean value, or asserts if not a boolean.
  bool getBool() const {
    assert(isBool());
    return data_.boolean;
  }

  /// \return the boolean value, or throws JSIException if not a
  /// boolean.
  bool asBool() const;

  /// \return the number value, or asserts if not a number.
  double getNumber() const {
    assert(isNumber());
    return data_.number;
  }

  /// \return the number value, or throws JSIException if not a
  /// number.
  double asNumber() const;

  /// \return the Symbol value, or asserts if not a symbol.
  Symbol getSymbol(Runtime& runtime) const& {
    assert(isSymbol());
    return Symbol(runtime.cloneSymbol(data_.pointer.ptr_));
  }

  /// \return the Symbol value, or asserts if not a symbol.
  /// Can be used on rvalue references to avoid cloning more symbols.
  Symbol getSymbol(Runtime&) && {
    assert(isSymbol());
    auto ptr = data_.pointer.ptr_;
    data_.pointer.ptr_ = nullptr;
    return static_cast<Symbol>(ptr);
  }

  /// \return the Symbol value, or throws JSIException if not a
  /// symbol
  Symbol asSymbol(Runtime& runtime) const&;
  Symbol asSymbol(Runtime& runtime) &&;

  /// \return the BigInt value, or asserts if not a bigint.
  BigInt getBigInt(Runtime& runtime) const& {
    assert(isBigInt());
    return BigInt(runtime.cloneBigInt(data_.pointer.ptr_));
  }

  /// \return the BigInt value, or asserts if not a bigint.
  /// Can be used on rvalue references to avoid cloning more bigints.
  BigInt getBigInt(Runtime&) && {
    assert(isBigInt());
    auto ptr = data_.pointer.ptr_;
    data_.pointer.ptr_ = nullptr;
    return static_cast<BigInt>(ptr);
  }

  /// \return the BigInt value, or throws JSIException if not a
  /// bigint
  BigInt asBigInt(Runtime& runtime) const&;
  BigInt asBigInt(Runtime& runtime) &&;

  /// \return the String value, or asserts if not a string.
  String getString(Runtime& runtime) const& {
    assert(isString());
    return String(runtime.cloneString(data_.pointer.ptr_));
  }

  /// \return the String value, or asserts if not a string.
  /// Can be used on rvalue references to avoid cloning more strings.
  String getString(Runtime&) && {
    assert(isString());
    auto ptr = data_.pointer.ptr_;
    data_.pointer.ptr_ = nullptr;
    return static_cast<String>(ptr);
  }

  /// \return the String value, or throws JSIException if not a
  /// string.
  String asString(Runtime& runtime) const&;
  String asString(Runtime& runtime) &&;

  /// \return the Object value, or asserts if not an object.
  Object getObject(Runtime& runtime) const& {
    assert(isObject());
    return Object(runtime.cloneObject(data_.pointer.ptr_));
  }

  /// \return the Object value, or asserts if not an object.
  /// Can be used on rvalue references to avoid cloning more objects.
  Object getObject(Runtime&) && {
    assert(isObject());
    auto ptr = data_.pointer.ptr_;
    data_.pointer.ptr_ = nullptr;
    return static_cast<Object>(ptr);
  }

  /// \return the Object value, or throws JSIException if not an
  /// object.
  Object asObject(Runtime& runtime) const&;
  Object asObject(Runtime& runtime) &&;

  // \return a String like JS .toString() would do.
  String toString(Runtime& runtime) const;

 private:
  friend class Runtime;

  enum ValueKind {
    UndefinedKind,
    NullKind,
    BooleanKind,
    NumberKind,
    SymbolKind,
    BigIntKind,
    StringKind,
    ObjectKind,
    PointerKind = SymbolKind,
  };

  union Data {
    // Value's ctor and dtor will manage the lifecycle of the contained Data.
    Data() {
      static_assert(
          sizeof(Data) == sizeof(uint64_t),
          "Value data should fit in a 64-bit register");
    }
    ~Data() {}

    // scalars
    bool boolean;
    double number;
    // pointers
    Pointer pointer; // Symbol, String, Object, Array, Function
  };

  Value(ValueKind kind) : kind_(kind) {}

  constexpr static ValueKind kindOf(const Symbol&) {
    return SymbolKind;
  }
  constexpr static ValueKind kindOf(const BigInt&) {
    return BigIntKind;
  }
  constexpr static ValueKind kindOf(const String&) {
    return StringKind;
  }
  constexpr static ValueKind kindOf(const Object&) {
    return ObjectKind;
  }

  ValueKind kind_;
  Data data_;

  // In the future: Value becomes NaN-boxed. See T40538354.
};

/// Not movable and not copyable RAII marker advising the underlying
/// JavaScript VM to track resources allocated since creation until
/// destruction so that they can be recycled eagerly when the Scope
/// goes out of scope instead of floating in the air until the next
/// garbage collection or any other delayed release occurs.
///
/// This API should be treated only as advice, implementations can
/// choose to ignore the fact that Scopes are created or destroyed.
///
/// This class is an exception to the rule allowing destructors to be
/// called without proper synchronization (see Runtime documentation).
/// The whole point of this class is to enable all sorts of clean ups
/// when the destructor is called and this proper synchronization is
/// required at that time.
///
/// Instances of this class are intended to be created as automatic stack
/// variables in which case destructor calls don't require any additional
/// locking, provided that the lock (if any) is managed with RAII helpers.
class JSI_EXPORT Scope {
 public:
  explicit Scope(Runtime& rt) : rt_(rt), prv_(rt.pushScope()) {}
  ~Scope() {
    rt_.popScope(prv_);
  }

  Scope(const Scope&) = delete;
  Scope(Scope&&) = delete;

  Scope& operator=(const Scope&) = delete;
  Scope& operator=(Scope&&) = delete;

  template <typename F>
  static auto callInNewScope(Runtime& rt, F f) -> decltype(f()) {
    Scope s(rt);
    return f();
  }

 private:
  Runtime& rt_;
  Runtime::ScopeState* prv_;
};

/// Base class for jsi exceptions
class JSI_EXPORT JSIException : public std::exception {
 protected:
  JSIException() {}
  JSIException(std::string what) : what_(std::move(what)) {}

 public:
  JSIException(const JSIException&) = default;

  virtual const char* what() const noexcept override {
    return what_.c_str();
  }

  virtual ~JSIException() override;

 protected:
  std::string what_;
};

/// This exception will be thrown by API functions on errors not related to
/// JavaScript execution.
class JSI_EXPORT JSINativeException : public JSIException {
 public:
  JSINativeException(std::string what) : JSIException(std::move(what)) {}

  JSINativeException(const JSINativeException&) = default;

  virtual ~JSINativeException();
};

/// This exception will be thrown by API functions whenever a JS
/// operation causes an exception as described by the spec, or as
/// otherwise described.
class JSI_EXPORT JSError : public JSIException {
 public:
  /// Creates a JSError referring to provided \c value
  JSError(Runtime& r, Value&& value);

  /// Creates a JSError referring to new \c Error instance capturing current
  /// JavaScript stack. The error message property is set to given \c message.
  JSError(Runtime& rt, std::string message);

  /// Creates a JSError referring to new \c Error instance capturing current
  /// JavaScript stack. The error message property is set to given \c message.
  JSError(Runtime& rt, const char* message)
      : JSError(rt, std::string(message)) {}

  /// Creates a JSError referring to a JavaScript Object having message and
  /// stack properties set to provided values.
  JSError(Runtime& rt, std::string message, std::string stack);

  /// Creates a JSError referring to provided value and what string
  /// set to provided message.  This argument order is a bit weird,
  /// but necessary to avoid ambiguity with the above.
  JSError(std::string what, Runtime& rt, Value&& value);

  /// Creates a JSError referring to the provided value, message and stack. This
  /// constructor does not take a Runtime parameter, and therefore cannot result
  /// in recursively invoking the JSError constructor.
  JSError(Value&& value, std::string message, std::string stack);

  JSError(const JSError&) = default;

  virtual ~JSError();

  const std::string& getStack() const {
    return stack_;
  }

  const std::string& getMessage() const {
    return message_;
  }

  const jsi::Value& value() const {
    assert(value_);
    return *value_;
  }

 private:
  // This initializes the value_ member and does some other
  // validation, so it must be called by every branch through the
  // constructors.
  void setValue(Runtime& rt, Value&& value);

  // This needs to be on the heap, because throw requires the object
  // be copyable, and Value is not.
  std::shared_ptr<jsi::Value> value_;
  std::string message_;
  std::string stack_;
};

} // namespace jsi
} // namespace facebook

#include <jsi/jsi-inl.h>
