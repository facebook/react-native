/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <tuple>

#include <jsi/instrumentation.h>
#include <jsi/jsi.h>

// This file contains objects to help API users create their own
// runtime adapters, i.e. if you want to compose runtimes to add your
// own behavior.

namespace facebook {
namespace jsi {

// Use this to wrap host functions. It will pass the member runtime as
// the first arg to the callback.  The first argument to the ctor
// should be the decorated runtime, not the plain one.
class DecoratedHostFunction {
 public:
  DecoratedHostFunction(Runtime& drt, HostFunctionType plainHF)
      : drt_(drt), plainHF_(std::move(plainHF)) {}

  Runtime& decoratedRuntime() {
    return drt_;
  }

  Value
  operator()(Runtime&, const Value& thisVal, const Value* args, size_t count) {
    return plainHF_(decoratedRuntime(), thisVal, args, count);
  }

 private:
  template <typename Plain, typename Base>
  friend class RuntimeDecorator;

  Runtime& drt_;
  HostFunctionType plainHF_;
};

// From the perspective of the caller, a plain HostObject is passed to
// the decorated Runtime, and the HostObject methods expect to get
// passed that Runtime.  But the plain Runtime will pass itself to its
// callback, so we need a helper here which curries the decorated
// Runtime, and calls the plain HostObject with it.
//
// If the concrete RuntimeDecorator derives DecoratedHostObject, it
// should call the base class get() and set() to invoke the plain
// HostObject functionality.  The Runtime& it passes does not matter,
// as it is not used.
class DecoratedHostObject : public HostObject {
 public:
  DecoratedHostObject(Runtime& drt, std::shared_ptr<HostObject> plainHO)
      : drt_(drt), plainHO_(plainHO) {}

  // The derived class methods can call this to get a reference to the
  // decorated runtime, since the rt passed to the callback will be
  // the plain runtime.
  Runtime& decoratedRuntime() {
    return drt_;
  }

  Value get(Runtime&, const PropNameID& name) override {
    return plainHO_->get(decoratedRuntime(), name);
  }

  void set(Runtime&, const PropNameID& name, const Value& value) override {
    plainHO_->set(decoratedRuntime(), name, value);
  }

  std::vector<PropNameID> getPropertyNames(Runtime&) override {
    return plainHO_->getPropertyNames(decoratedRuntime());
  }

 private:
  template <typename Plain, typename Base>
  friend class RuntimeDecorator;

  Runtime& drt_;
  std::shared_ptr<HostObject> plainHO_;
};

/// C++ variant on a standard Decorator pattern, using template
/// parameters.  The \c Plain template parameter type is the
/// undecorated Runtime type.  You can usually use \c Runtime here,
/// but if you know the concrete type ahead of time and it's final,
/// the compiler can devirtualize calls to the decorated
/// implementation.  The \c Base template parameter type will be used
/// as the base class of the decorated type.  Here, too, you can
/// usually use \c Runtime, but if you want the decorated type to
/// implement a derived class of Runtime, you can specify that here.
/// For an example, see threadsafe.h.
template <typename Plain = Runtime, typename Base = Runtime>
class RuntimeDecorator : public Base, private jsi::Instrumentation {
 public:
  Plain& plain() {
    static_assert(
        std::is_base_of<Runtime, Plain>::value,
        "RuntimeDecorator's Plain type must derive from jsi::Runtime");
    static_assert(
        std::is_base_of<Runtime, Base>::value,
        "RuntimeDecorator's Base type must derive from jsi::Runtime");
    return plain_;
  }
  const Plain& plain() const {
    return plain_;
  }

  Value evaluateJavaScript(
      const std::shared_ptr<const Buffer>& buffer,
      const std::string& sourceURL) override {
    return plain().evaluateJavaScript(buffer, sourceURL);
  }
  std::shared_ptr<const PreparedJavaScript> prepareJavaScript(
      const std::shared_ptr<const Buffer>& buffer,
      std::string sourceURL) override {
    return plain().prepareJavaScript(buffer, std::move(sourceURL));
  }
  Value evaluatePreparedJavaScript(
      const std::shared_ptr<const PreparedJavaScript>& js) override {
    return plain().evaluatePreparedJavaScript(js);
  }
  Object global() override {
    return plain().global();
  }
  std::string description() override {
    return plain().description();
  };
  bool isInspectable() override {
    return plain().isInspectable();
  };
  Instrumentation& instrumentation() override {
    return *this;
  }

 protected:
  // plain is generally going to be a reference to an object managed
  // by a derived class.  We cache it here so this class can be
  // concrete, and avoid making virtual calls to find the plain
  // Runtime.  Note that the ctor and dtor do not access through the
  // reference, so passing a reference to an object before its
  // lifetime has started is ok.
  RuntimeDecorator(Plain& plain) : plain_(plain) {}

  Runtime::PointerValue* cloneSymbol(const Runtime::PointerValue* pv) override {
    return plain_.cloneSymbol(pv);
  };
  Runtime::PointerValue* cloneString(const Runtime::PointerValue* pv) override {
    return plain_.cloneString(pv);
  };
  Runtime::PointerValue* cloneObject(const Runtime::PointerValue* pv) override {
    return plain_.cloneObject(pv);
  };
  Runtime::PointerValue* clonePropNameID(
      const Runtime::PointerValue* pv) override {
    return plain_.clonePropNameID(pv);
  };

  PropNameID createPropNameIDFromAscii(const char* str, size_t length)
      override {
    return plain_.createPropNameIDFromAscii(str, length);
  };
  PropNameID createPropNameIDFromUtf8(const uint8_t* utf8, size_t length)
      override {
    return plain_.createPropNameIDFromUtf8(utf8, length);
  };
  PropNameID createPropNameIDFromString(const String& str) override {
    return plain_.createPropNameIDFromString(str);
  };
  std::string utf8(const PropNameID& id) override {
    return plain_.utf8(id);
  };
  bool compare(const PropNameID& a, const PropNameID& b) override {
    return plain_.compare(a, b);
  };

  std::string symbolToString(const Symbol& sym) override {
    return plain_.symbolToString(sym);
  }

  String createStringFromAscii(const char* str, size_t length) override {
    return plain_.createStringFromAscii(str, length);
  };
  String createStringFromUtf8(const uint8_t* utf8, size_t length) override {
    return plain_.createStringFromUtf8(utf8, length);
  };
  std::string utf8(const String& s) override {
    return plain_.utf8(s);
  }

  Object createObject() override {
    return plain_.createObject();
  };

  Object createObject(std::shared_ptr<HostObject> ho) override {
    return plain_.createObject(
        std::make_shared<DecoratedHostObject>(*this, std::move(ho)));
  };
  std::shared_ptr<HostObject> getHostObject(const jsi::Object& o) override {
    std::shared_ptr<HostObject> dho = plain_.getHostObject(o);
    return static_cast<DecoratedHostObject&>(*dho).plainHO_;
  };
  HostFunctionType& getHostFunction(const jsi::Function& f) override {
    HostFunctionType& dhf = plain_.getHostFunction(f);
    // This will fail if a cpp file including this header is not compiled
    // with RTTI.
    return dhf.target<DecoratedHostFunction>()->plainHF_;
  };

  Value getProperty(const Object& o, const PropNameID& name) override {
    return plain_.getProperty(o, name);
  };
  Value getProperty(const Object& o, const String& name) override {
    return plain_.getProperty(o, name);
  };
  bool hasProperty(const Object& o, const PropNameID& name) override {
    return plain_.hasProperty(o, name);
  };
  bool hasProperty(const Object& o, const String& name) override {
    return plain_.hasProperty(o, name);
  };
  void setPropertyValue(Object& o, const PropNameID& name, const Value& value)
      override {
    plain_.setPropertyValue(o, name, value);
  };
  void setPropertyValue(Object& o, const String& name, const Value& value)
      override {
    plain_.setPropertyValue(o, name, value);
  };

  bool isArray(const Object& o) const override {
    return plain_.isArray(o);
  };
  bool isArrayBuffer(const Object& o) const override {
    return plain_.isArrayBuffer(o);
  };
  bool isFunction(const Object& o) const override {
    return plain_.isFunction(o);
  };
  bool isHostObject(const jsi::Object& o) const override {
    return plain_.isHostObject(o);
  };
  bool isHostFunction(const jsi::Function& f) const override {
    return plain_.isHostFunction(f);
  };
  Array getPropertyNames(const Object& o) override {
    return plain_.getPropertyNames(o);
  };

  WeakObject createWeakObject(const Object& o) override {
    return plain_.createWeakObject(o);
  };
  Value lockWeakObject(WeakObject& wo) override {
    return plain_.lockWeakObject(wo);
  };

  Array createArray(size_t length) override {
    return plain_.createArray(length);
  };
  size_t size(const Array& a) override {
    return plain_.size(a);
  };
  size_t size(const ArrayBuffer& ab) override {
    return plain_.size(ab);
  };
  uint8_t* data(const ArrayBuffer& ab) override {
    return plain_.data(ab);
  };
  Value getValueAtIndex(const Array& a, size_t i) override {
    return plain_.getValueAtIndex(a, i);
  };
  void setValueAtIndexImpl(Array& a, size_t i, const Value& value) override {
    plain_.setValueAtIndexImpl(a, i, value);
  };

  Function createFunctionFromHostFunction(
      const PropNameID& name,
      unsigned int paramCount,
      HostFunctionType func) override {
    return plain_.createFunctionFromHostFunction(
        name, paramCount, DecoratedHostFunction(*this, std::move(func)));
  };
  Value call(
      const Function& f,
      const Value& jsThis,
      const Value* args,
      size_t count) override {
    return plain_.call(f, jsThis, args, count);
  };
  Value callAsConstructor(const Function& f, const Value* args, size_t count)
      override {
    return plain_.callAsConstructor(f, args, count);
  };

  // Private data for managing scopes.
  Runtime::ScopeState* pushScope() override {
    return plain_.pushScope();
  }
  void popScope(Runtime::ScopeState* ss) override {
    plain_.popScope(ss);
  }

  bool strictEquals(const Symbol& a, const Symbol& b) const override {
    return plain_.strictEquals(a, b);
  };
  bool strictEquals(const String& a, const String& b) const override {
    return plain_.strictEquals(a, b);
  };
  bool strictEquals(const Object& a, const Object& b) const override {
    return plain_.strictEquals(a, b);
  };

  bool instanceOf(const Object& o, const Function& f) override {
    return plain_.instanceOf(o, f);
  };

  // jsi::Instrumentation methods

  std::string getRecordedGCStats() override {
    return plain().instrumentation().getRecordedGCStats();
  }

  std::unordered_map<std::string, int64_t> getHeapInfo(
      bool includeExpensive) override {
    return plain().instrumentation().getHeapInfo(includeExpensive);
  }

  void collectGarbage(std::string cause) override {
    plain().instrumentation().collectGarbage(std::move(cause));
  }

  void startTrackingHeapObjectStackTraces(
      std::function<void(
          uint64_t,
          std::chrono::microseconds,
          std::vector<HeapStatsUpdate>)> callback) override {
    plain().instrumentation().startTrackingHeapObjectStackTraces(
        std::move(callback));
  }

  void stopTrackingHeapObjectStackTraces() override {
    plain().instrumentation().stopTrackingHeapObjectStackTraces();
  }

  void createSnapshotToFile(const std::string& path) override {
    plain().instrumentation().createSnapshotToFile(path);
  }

  void createSnapshotToStream(std::ostream& os) override {
    plain().instrumentation().createSnapshotToStream(os);
  }

  std::string flushAndDisableBridgeTrafficTrace() override {
    return const_cast<Plain&>(plain())
        .instrumentation()
        .flushAndDisableBridgeTrafficTrace();
  }

  void writeBasicBlockProfileTraceToFile(
      const std::string& fileName) const override {
    const_cast<Plain&>(plain())
        .instrumentation()
        .writeBasicBlockProfileTraceToFile(fileName);
  }

  /// Dump external profiler symbols to the given file name.
  void dumpProfilerSymbolsToFile(const std::string& fileName) const override {
    const_cast<Plain&>(plain()).instrumentation().dumpProfilerSymbolsToFile(
        fileName);
  }

 private:
  Plain& plain_;
};

namespace detail {

// This metaprogramming allows the With type's methods to be
// optional.

template <typename T, typename U = void>
struct BeforeCaller {
  static void before(T&) {}
};

template <typename T, typename U = void>
struct AfterCaller {
  static void after(T&) {}
};

// decltype((void)&...) is either SFINAE, or void.
// So, if SFINAE does not happen for T, then this specialization exists
// for BeforeCaller<T, void>, and always applies.  If not, only the
// default above exists, and that is used instead.
template <typename T>
struct BeforeCaller<T, decltype((void)&T::before)> {
  static void before(T& t) {
    t.before();
  }
};

template <typename T>
struct AfterCaller<T, decltype((void)&T::after)> {
  static void after(T& t) {
    t.after();
  }
};

// It's possible to use multiple decorators by nesting
// WithRuntimeDecorator<...>, but this specialization allows use of
// std::tuple of decorator classes instead.  See testlib.cpp for an
// example.
template <typename... T>
struct BeforeCaller<std::tuple<T...>> {
  static void before(std::tuple<T...>& tuple) {
    all_before<0, T...>(tuple);
  }

 private:
  template <size_t N, typename U, typename... Rest>
  static void all_before(std::tuple<T...>& tuple) {
    detail::BeforeCaller<U>::before(std::get<N>(tuple));
    all_before<N + 1, Rest...>(tuple);
  }

  template <size_t N>
  static void all_before(std::tuple<T...>&) {}
};

template <typename... T>
struct AfterCaller<std::tuple<T...>> {
  static void after(std::tuple<T...>& tuple) {
    all_after<0, T...>(tuple);
  }

 private:
  template <size_t N, typename U, typename... Rest>
  static void all_after(std::tuple<T...>& tuple) {
    all_after<N + 1, Rest...>(tuple);
    detail::AfterCaller<U>::after(std::get<N>(tuple));
  }

  template <size_t N>
  static void all_after(std::tuple<T...>&) {}
};

} // namespace detail

// A decorator which implements an around idiom.  A With instance is
// RAII constructed before each call to the undecorated class; the
// ctor is passed a single argument of type WithArg&.  Plain and Base
// are used as in the base class.
template <typename With, typename Plain = Runtime, typename Base = Runtime>
class WithRuntimeDecorator : public RuntimeDecorator<Plain, Base> {
 public:
  using RD = RuntimeDecorator<Plain, Base>;

  // The reference arguments to the ctor are stored, but not used by
  // the ctor, and there is no ctor, so they can be passed members of
  // the derived class.
  WithRuntimeDecorator(Plain& plain, With& with) : RD(plain), with_(with) {}

  Value evaluateJavaScript(
      const std::shared_ptr<const Buffer>& buffer,
      const std::string& sourceURL) override {
    Around around{with_};
    return RD::evaluateJavaScript(buffer, sourceURL);
  }
  std::shared_ptr<const PreparedJavaScript> prepareJavaScript(
      const std::shared_ptr<const Buffer>& buffer,
      std::string sourceURL) override {
    Around around{with_};
    return RD::prepareJavaScript(buffer, std::move(sourceURL));
  }
  Value evaluatePreparedJavaScript(
      const std::shared_ptr<const PreparedJavaScript>& js) override {
    Around around{with_};
    return RD::evaluatePreparedJavaScript(js);
  }
  Object global() override {
    Around around{with_};
    return RD::global();
  }
  std::string description() override {
    Around around{with_};
    return RD::description();
  };
  bool isInspectable() override {
    Around around{with_};
    return RD::isInspectable();
  };

  // The jsi:: prefix is necessary because MSVC compiler complains C2247:
  // Instrumentation is not accessible because RuntimeDecorator uses private
  // to inherit from Instrumentation.
  // TODO(T40821815) Consider removing this workaround when updating MSVC
  jsi::Instrumentation& instrumentation() override {
    Around around{with_};
    return RD::instrumentation();
  }

 protected:
  Runtime::PointerValue* cloneSymbol(const Runtime::PointerValue* pv) override {
    Around around{with_};
    return RD::cloneSymbol(pv);
  };
  Runtime::PointerValue* cloneString(const Runtime::PointerValue* pv) override {
    Around around{with_};
    return RD::cloneString(pv);
  };
  Runtime::PointerValue* cloneObject(const Runtime::PointerValue* pv) override {
    Around around{with_};
    return RD::cloneObject(pv);
  };
  Runtime::PointerValue* clonePropNameID(
      const Runtime::PointerValue* pv) override {
    Around around{with_};
    return RD::clonePropNameID(pv);
  };

  PropNameID createPropNameIDFromAscii(const char* str, size_t length)
      override {
    Around around{with_};
    return RD::createPropNameIDFromAscii(str, length);
  };
  PropNameID createPropNameIDFromUtf8(const uint8_t* utf8, size_t length)
      override {
    Around around{with_};
    return RD::createPropNameIDFromUtf8(utf8, length);
  };
  PropNameID createPropNameIDFromString(const String& str) override {
    Around around{with_};
    return RD::createPropNameIDFromString(str);
  };
  std::string utf8(const PropNameID& id) override {
    Around around{with_};
    return RD::utf8(id);
  };
  bool compare(const PropNameID& a, const PropNameID& b) override {
    Around around{with_};
    return RD::compare(a, b);
  };

  std::string symbolToString(const Symbol& sym) override {
    Around around{with_};
    return RD::symbolToString(sym);
  };

  String createStringFromAscii(const char* str, size_t length) override {
    Around around{with_};
    return RD::createStringFromAscii(str, length);
  };
  String createStringFromUtf8(const uint8_t* utf8, size_t length) override {
    Around around{with_};
    return RD::createStringFromUtf8(utf8, length);
  };
  std::string utf8(const String& s) override {
    Around around{with_};
    return RD::utf8(s);
  }

  Object createObject() override {
    Around around{with_};
    return RD::createObject();
  };
  Object createObject(std::shared_ptr<HostObject> ho) override {
    Around around{with_};
    return RD::createObject(std::move(ho));
  };
  std::shared_ptr<HostObject> getHostObject(const jsi::Object& o) override {
    Around around{with_};
    return RD::getHostObject(o);
  };
  HostFunctionType& getHostFunction(const jsi::Function& f) override {
    Around around{with_};
    return RD::getHostFunction(f);
  };

  Value getProperty(const Object& o, const PropNameID& name) override {
    Around around{with_};
    return RD::getProperty(o, name);
  };
  Value getProperty(const Object& o, const String& name) override {
    Around around{with_};
    return RD::getProperty(o, name);
  };
  bool hasProperty(const Object& o, const PropNameID& name) override {
    Around around{with_};
    return RD::hasProperty(o, name);
  };
  bool hasProperty(const Object& o, const String& name) override {
    Around around{with_};
    return RD::hasProperty(o, name);
  };
  void setPropertyValue(Object& o, const PropNameID& name, const Value& value)
      override {
    Around around{with_};
    RD::setPropertyValue(o, name, value);
  };
  void setPropertyValue(Object& o, const String& name, const Value& value)
      override {
    Around around{with_};
    RD::setPropertyValue(o, name, value);
  };

  bool isArray(const Object& o) const override {
    Around around{with_};
    return RD::isArray(o);
  };
  bool isArrayBuffer(const Object& o) const override {
    Around around{with_};
    return RD::isArrayBuffer(o);
  };
  bool isFunction(const Object& o) const override {
    Around around{with_};
    return RD::isFunction(o);
  };
  bool isHostObject(const jsi::Object& o) const override {
    Around around{with_};
    return RD::isHostObject(o);
  };
  bool isHostFunction(const jsi::Function& f) const override {
    Around around{with_};
    return RD::isHostFunction(f);
  };
  Array getPropertyNames(const Object& o) override {
    Around around{with_};
    return RD::getPropertyNames(o);
  };

  WeakObject createWeakObject(const Object& o) override {
    Around around{with_};
    return RD::createWeakObject(o);
  };
  Value lockWeakObject(WeakObject& wo) override {
    Around around{with_};
    return RD::lockWeakObject(wo);
  };

  Array createArray(size_t length) override {
    Around around{with_};
    return RD::createArray(length);
  };
  size_t size(const Array& a) override {
    Around around{with_};
    return RD::size(a);
  };
  size_t size(const ArrayBuffer& ab) override {
    Around around{with_};
    return RD::size(ab);
  };
  uint8_t* data(const ArrayBuffer& ab) override {
    Around around{with_};
    return RD::data(ab);
  };
  Value getValueAtIndex(const Array& a, size_t i) override {
    Around around{with_};
    return RD::getValueAtIndex(a, i);
  };
  void setValueAtIndexImpl(Array& a, size_t i, const Value& value) override {
    Around around{with_};
    RD::setValueAtIndexImpl(a, i, value);
  };

  Function createFunctionFromHostFunction(
      const PropNameID& name,
      unsigned int paramCount,
      HostFunctionType func) override {
    Around around{with_};
    return RD::createFunctionFromHostFunction(
        name, paramCount, std::move(func));
  };
  Value call(
      const Function& f,
      const Value& jsThis,
      const Value* args,
      size_t count) override {
    Around around{with_};
    return RD::call(f, jsThis, args, count);
  };
  Value callAsConstructor(const Function& f, const Value* args, size_t count)
      override {
    Around around{with_};
    return RD::callAsConstructor(f, args, count);
  };

  // Private data for managing scopes.
  Runtime::ScopeState* pushScope() override {
    Around around{with_};
    return RD::pushScope();
  }
  void popScope(Runtime::ScopeState* ss) override {
    Around around{with_};
    RD::popScope(ss);
  }

  bool strictEquals(const Symbol& a, const Symbol& b) const override {
    Around around{with_};
    return RD::strictEquals(a, b);
  };
  bool strictEquals(const String& a, const String& b) const override {
    Around around{with_};
    return RD::strictEquals(a, b);
  };
  bool strictEquals(const Object& a, const Object& b) const override {
    Around around{with_};
    return RD::strictEquals(a, b);
  };

  bool instanceOf(const Object& o, const Function& f) override {
    Around around{with_};
    return RD::instanceOf(o, f);
  };

 private:
  // Wrap an RAII type around With& to guarantee after always happens.
  struct Around {
    Around(With& with) : with_(with) {
      detail::BeforeCaller<With>::before(with_);
    }
    ~Around() {
      detail::AfterCaller<With>::after(with_);
    }

    With& with_;
  };

  With& with_;
};

} // namespace jsi
} // namespace facebook
