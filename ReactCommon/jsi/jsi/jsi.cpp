/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cassert>
#include <cmath>
#include <cstdlib>
#include <stdexcept>

#include <jsi/instrumentation.h>
#include <jsi/jsi.h>

namespace facebook {
namespace jsi {

namespace {

// This is used for generating short exception strings.
std::string kindToString(const Value& v, Runtime* rt = nullptr) {
  if (v.isUndefined()) {
    return "undefined";
  } else if (v.isNull()) {
    return "null";
  } else if (v.isBool()) {
    return v.getBool() ? "true" : "false";
  } else if (v.isNumber()) {
    return "a number";
  } else if (v.isString()) {
    return "a string";
  } else if (v.isSymbol()) {
    return "a symbol";
  } else {
    assert(v.isObject() && "Expecting object.");
    return rt != nullptr && v.getObject(*rt).isFunction(*rt) ? "a function"
                                                             : "an object";
  }
}

// getPropertyAsFunction() will try to create a JSError.  If the
// failure is in building a JSError, this will lead to infinite
// recursion.  This function is used in place of getPropertyAsFunction
// when building JSError, to avoid that infinite recursion.
Value callGlobalFunction(Runtime& runtime, const char* name, const Value& arg) {
  Value v = runtime.global().getProperty(runtime, name);
  if (!v.isObject()) {
    throw JSINativeException(
        std::string("callGlobalFunction: JS global property '") + name +
        "' is " + kindToString(v, &runtime) + ", expected a Function");
  }
  Object o = v.getObject(runtime);
  if (!o.isFunction(runtime)) {
    throw JSINativeException(
        std::string("callGlobalFunction: JS global property '") + name +
        "' is a non-callable Object, expected a Function");
  }
  Function f = std::move(o).getFunction(runtime);
  return f.call(runtime, arg);
}

} // namespace

namespace detail {

void throwJSError(Runtime& rt, const char* msg) {
  throw JSError(rt, msg);
}

} // namespace detail

Buffer::~Buffer() = default;

PreparedJavaScript::~PreparedJavaScript() = default;

Value HostObject::get(Runtime&, const PropNameID&) {
  return Value();
}

void HostObject::set(Runtime& rt, const PropNameID& name, const Value&) {
  std::string msg("TypeError: Cannot assign to property '");
  msg += name.utf8(rt);
  msg += "' on HostObject with default setter";
  throw JSError(rt, msg);
}

HostObject::~HostObject() {}

Runtime::~Runtime() {}

Instrumentation& Runtime::instrumentation() {
  class NoInstrumentation : public Instrumentation {
    std::string getRecordedGCStats() override {
      return "";
    }

    std::unordered_map<std::string, int64_t> getHeapInfo(bool) override {
      return std::unordered_map<std::string, int64_t>{};
    }

    void collectGarbage(std::string) override {}

    void startTrackingHeapObjectStackTraces(
        std::function<void(
            uint64_t,
            std::chrono::microseconds,
            std::vector<HeapStatsUpdate>)>) override {}
    void stopTrackingHeapObjectStackTraces() override {}

    void startHeapSampling(size_t) override {}
    void stopHeapSampling(std::ostream&) override {}

    void createSnapshotToFile(const std::string&) override {
      throw JSINativeException(
          "Default instrumentation cannot create a heap snapshot");
    }

    void createSnapshotToStream(std::ostream&) override {
      throw JSINativeException(
          "Default instrumentation cannot create a heap snapshot");
    }

    std::string flushAndDisableBridgeTrafficTrace() override {
      std::abort();
    }

    void writeBasicBlockProfileTraceToFile(const std::string&) const override {
      std::abort();
    }

    void dumpProfilerSymbolsToFile(const std::string&) const override {
      std::abort();
    }
  };

  static NoInstrumentation sharedInstance;
  return sharedInstance;
}

Value Runtime::createValueFromJsonUtf8(const uint8_t* json, size_t length) {
  Function parseJson = global()
                           .getPropertyAsObject(*this, "JSON")
                           .getPropertyAsFunction(*this, "parse");
  return parseJson.call(*this, String::createFromUtf8(*this, json, length));
}

Pointer& Pointer::operator=(Pointer&& other) {
  if (ptr_) {
    ptr_->invalidate();
  }
  ptr_ = other.ptr_;
  other.ptr_ = nullptr;
  return *this;
}

Object Object::getPropertyAsObject(Runtime& runtime, const char* name) const {
  Value v = getProperty(runtime, name);

  if (!v.isObject()) {
    throw JSError(
        runtime,
        std::string("getPropertyAsObject: property '") + name + "' is " +
            kindToString(v, &runtime) + ", expected an Object");
  }

  return v.getObject(runtime);
}

Function Object::getPropertyAsFunction(Runtime& runtime, const char* name)
    const {
  Object obj = getPropertyAsObject(runtime, name);
  if (!obj.isFunction(runtime)) {
    throw JSError(
        runtime,
        std::string("getPropertyAsFunction: property '") + name + "' is " +
            kindToString(std::move(obj), &runtime) + ", expected a Function");
  };

  return std::move(obj).getFunction(runtime);
}

Array Object::asArray(Runtime& runtime) const& {
  if (!isArray(runtime)) {
    throw JSError(
        runtime,
        "Object is " + kindToString(Value(runtime, *this), &runtime) +
            ", expected an array");
  }
  return getArray(runtime);
}

Array Object::asArray(Runtime& runtime) && {
  if (!isArray(runtime)) {
    throw JSError(
        runtime,
        "Object is " + kindToString(Value(runtime, *this), &runtime) +
            ", expected an array");
  }
  return std::move(*this).getArray(runtime);
}

Function Object::asFunction(Runtime& runtime) const& {
  if (!isFunction(runtime)) {
    throw JSError(
        runtime,
        "Object is " + kindToString(Value(runtime, *this), &runtime) +
            ", expected a function");
  }
  return getFunction(runtime);
}

Function Object::asFunction(Runtime& runtime) && {
  if (!isFunction(runtime)) {
    throw JSError(
        runtime,
        "Object is " + kindToString(Value(runtime, *this), &runtime) +
            ", expected a function");
  }
  return std::move(*this).getFunction(runtime);
}

Value::Value(Value&& other) : Value(other.kind_) {
  if (kind_ == BooleanKind) {
    data_.boolean = other.data_.boolean;
  } else if (kind_ == NumberKind) {
    data_.number = other.data_.number;
  } else if (kind_ >= PointerKind) {
    new (&data_.pointer) Pointer(std::move(other.data_.pointer));
  }
  // when the other's dtor runs, nothing will happen.
  other.kind_ = UndefinedKind;
}

Value::Value(Runtime& runtime, const Value& other) : Value(other.kind_) {
  // data_ is uninitialized, so use placement new to create non-POD
  // types in it.  Any other kind of initialization will call a dtor
  // first, which is incorrect.
  if (kind_ == BooleanKind) {
    data_.boolean = other.data_.boolean;
  } else if (kind_ == NumberKind) {
    data_.number = other.data_.number;
  } else if (kind_ == SymbolKind) {
    new (&data_.pointer) Pointer(runtime.cloneSymbol(other.data_.pointer.ptr_));
  } else if (kind_ == StringKind) {
    new (&data_.pointer) Pointer(runtime.cloneString(other.data_.pointer.ptr_));
  } else if (kind_ >= ObjectKind) {
    new (&data_.pointer) Pointer(runtime.cloneObject(other.data_.pointer.ptr_));
  }
}

Value::~Value() {
  if (kind_ >= PointerKind) {
    data_.pointer.~Pointer();
  }
}

bool Value::strictEquals(Runtime& runtime, const Value& a, const Value& b) {
  if (a.kind_ != b.kind_) {
    return false;
  }
  switch (a.kind_) {
    case UndefinedKind:
    case NullKind:
      return true;
    case BooleanKind:
      return a.data_.boolean == b.data_.boolean;
    case NumberKind:
      return a.data_.number == b.data_.number;
    case SymbolKind:
      return runtime.strictEquals(
          static_cast<const Symbol&>(a.data_.pointer),
          static_cast<const Symbol&>(b.data_.pointer));
    case StringKind:
      return runtime.strictEquals(
          static_cast<const String&>(a.data_.pointer),
          static_cast<const String&>(b.data_.pointer));
    case ObjectKind:
      return runtime.strictEquals(
          static_cast<const Object&>(a.data_.pointer),
          static_cast<const Object&>(b.data_.pointer));
  }
  return false;
}

bool Value::asBool() const {
  if (!isBool()) {
    throw JSINativeException(
        "Value is " + kindToString(*this) + ", expected a boolean");
  }

  return getBool();
}

double Value::asNumber() const {
  if (!isNumber()) {
    throw JSINativeException(
        "Value is " + kindToString(*this) + ", expected a number");
  }

  return getNumber();
}

Object Value::asObject(Runtime& rt) const& {
  if (!isObject()) {
    throw JSError(
        rt, "Value is " + kindToString(*this, &rt) + ", expected an Object");
  }

  return getObject(rt);
}

Object Value::asObject(Runtime& rt) && {
  if (!isObject()) {
    throw JSError(
        rt, "Value is " + kindToString(*this, &rt) + ", expected an Object");
  }
  auto ptr = data_.pointer.ptr_;
  data_.pointer.ptr_ = nullptr;
  return static_cast<Object>(ptr);
}

Symbol Value::asSymbol(Runtime& rt) const& {
  if (!isSymbol()) {
    throw JSError(
        rt, "Value is " + kindToString(*this, &rt) + ", expected a Symbol");
  }

  return getSymbol(rt);
}

Symbol Value::asSymbol(Runtime& rt) && {
  if (!isSymbol()) {
    throw JSError(
        rt, "Value is " + kindToString(*this, &rt) + ", expected a Symbol");
  }

  return std::move(*this).getSymbol(rt);
}

String Value::asString(Runtime& rt) const& {
  if (!isString()) {
    throw JSError(
        rt, "Value is " + kindToString(*this, &rt) + ", expected a String");
  }

  return getString(rt);
}

String Value::asString(Runtime& rt) && {
  if (!isString()) {
    throw JSError(
        rt, "Value is " + kindToString(*this, &rt) + ", expected a String");
  }

  return std::move(*this).getString(rt);
}

String Value::toString(Runtime& runtime) const {
  Function toString = runtime.global().getPropertyAsFunction(runtime, "String");
  return toString.call(runtime, *this).getString(runtime);
}

Array Array::createWithElements(
    Runtime& rt,
    std::initializer_list<Value> elements) {
  Array result(rt, elements.size());
  size_t index = 0;
  for (const auto& element : elements) {
    result.setValueAtIndex(rt, index++, element);
  }
  return result;
}

std::vector<PropNameID> HostObject::getPropertyNames(Runtime&) {
  return {};
}

Runtime::ScopeState* Runtime::pushScope() {
  return nullptr;
}

void Runtime::popScope(ScopeState*) {}

JSError::JSError(Runtime& rt, Value&& value) {
  setValue(rt, std::move(value));
}

JSError::JSError(Runtime& rt, std::string msg) : message_(std::move(msg)) {
  try {
    setValue(
        rt,
        callGlobalFunction(rt, "Error", String::createFromUtf8(rt, message_)));
  } catch (const std::exception& ex) {
    message_ = std::string(ex.what()) + " (while raising " + message_ + ")";
    setValue(rt, String::createFromUtf8(rt, message_));
  } catch (...) {
    setValue(rt, Value());
  }
}

JSError::JSError(Runtime& rt, std::string msg, std::string stack)
    : message_(std::move(msg)), stack_(std::move(stack)) {
  try {
    Object e(rt);
    e.setProperty(rt, "message", String::createFromUtf8(rt, message_));
    e.setProperty(rt, "stack", String::createFromUtf8(rt, stack_));
    setValue(rt, std::move(e));
  } catch (const std::exception& ex) {
    setValue(rt, String::createFromUtf8(rt, ex.what()));
  } catch (...) {
    setValue(rt, Value());
  }
}

JSError::JSError(std::string what, Runtime& rt, Value&& value)
    : JSIException(std::move(what)) {
  setValue(rt, std::move(value));
}

void JSError::setValue(Runtime& rt, Value&& value) {
  value_ = std::make_shared<Value>(std::move(value));

  try {
    if ((message_.empty() || stack_.empty()) && value_->isObject()) {
      auto obj = value_->getObject(rt);

      if (message_.empty()) {
        try {
          Value message = obj.getProperty(rt, "message");
          if (!message.isUndefined() && !message.isString()) {
            message = callGlobalFunction(rt, "String", message);
          }
          if (message.isString()) {
            message_ = message.getString(rt).utf8(rt);
          } else if (!message.isUndefined()) {
            message_ = "String(e.message) is a " + kindToString(message, &rt);
          }
        } catch (const std::exception& ex) {
          message_ = std::string("[Exception while creating message string: ") +
              ex.what() + "]";
        }
      }

      if (stack_.empty()) {
        try {
          Value stack = obj.getProperty(rt, "stack");
          if (!stack.isUndefined() && !stack.isString()) {
            stack = callGlobalFunction(rt, "String", stack);
          }
          if (stack.isString()) {
            stack_ = stack.getString(rt).utf8(rt);
          } else if (!stack.isUndefined()) {
            stack_ = "String(e.stack) is a " + kindToString(stack, &rt);
          }
        } catch (const std::exception& ex) {
          message_ = std::string("[Exception while creating stack string: ") +
              ex.what() + "]";
        }
      }
    }

    if (message_.empty()) {
      try {
        if (value_->isString()) {
          message_ = value_->getString(rt).utf8(rt);
        } else {
          Value message = callGlobalFunction(rt, "String", *value_);
          if (message.isString()) {
            message_ = message.getString(rt).utf8(rt);
          } else {
            message_ = "String(e) is a " + kindToString(message, &rt);
          }
        }
      } catch (const std::exception& ex) {
        message_ = std::string("[Exception while creating message string: ") +
            ex.what() + "]";
      }
    }

    if (stack_.empty()) {
      stack_ = "no stack";
    }

    if (what_.empty()) {
      what_ = message_ + "\n\n" + stack_;
    }
  } catch (...) {
    message_ = "[Exception caught creating message string]";
    stack_ = "[Exception caught creating stack string]";
    what_ = "[Exception caught getting value fields]";
  }
}

JSIException::~JSIException() {}

JSINativeException::~JSINativeException() {}

JSError::~JSError() {}

} // namespace jsi
} // namespace facebook
