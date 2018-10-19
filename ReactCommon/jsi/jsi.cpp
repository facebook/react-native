//  Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
 // LICENSE file in the root directory of this source tree.

#include <cassert>
#include <cmath>
#include <cstdlib>
#include <stdexcept>

#include <jsi/instrumentation.h>
#include <jsi/jsi.h>

namespace facebook {
namespace jsi {

namespace detail {

void throwJSError(Runtime& rt, const char* msg) {
  throw JSError(rt, msg);
}

} // namespace detail

Buffer::~Buffer() {}

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

    Value getHeapInfo(bool) override {
      return Value::undefined();
    }

    void collectGarbage() override {}

    bool createSnapshotToFile(const std::string&, bool) override {
      return false;
    }

    void writeBridgeTrafficTraceToFile(const std::string&) const override {
      std::abort();
    }

    void writeBasicBlockProfileTraceToFile(const std::string&) const override {
      std::abort();
    }

    void enableSamplingProfiler() const override {
      std::abort();
    }

    void dumpSampledTraceToFile(const std::string&) const override {
      std::abort();
    }

    void dumpProfilerSymbolsToFile(const std::string&) const override {
      std::abort();
    }
  };

  static NoInstrumentation sharedInstance;
  return sharedInstance;
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
        std::string("getPropertyAsObject: property '") + name +
            "' is not an Object");
  }

  return v.getObject(runtime);
}

Function Object::getPropertyAsFunction(Runtime& runtime, const char* name)
    const {
  Object obj = getPropertyAsObject(runtime, name);
  if (!obj.isFunction(runtime)) {
    throw JSError(
        runtime,
        std::string("getPropertyAsFunction: property '") + name +
            "' is not a Function");
  };

  Runtime::PointerValue* value = obj.ptr_;
  obj.ptr_ = nullptr;
  return Function(value);
}

Array Object::asArray(Runtime& runtime) const& {
  if (!isArray(runtime)) {
    throw JSError(runtime, "Object is not an array");
  }
  return getArray(runtime);
}

Array Object::asArray(Runtime& runtime) && {
  if (!isArray(runtime)) {
    throw JSError(runtime, "Object is not an array");
  }
  return std::move(*this).getArray(runtime);
}

Function Object::asFunction(Runtime& runtime) const& {
  if (!isFunction(runtime)) {
    throw JSError(runtime, "Object is not a function");
  }
  return getFunction(runtime);
}

Function Object::asFunction(Runtime& runtime) && {
  if (!isFunction(runtime)) {
    throw JSError(runtime, "Object is not a function");
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

Value Value::createFromJsonUtf8(
    Runtime& runtime,
    const uint8_t* json,
    size_t length) {
  Function parseJson = runtime.global()
                           .getPropertyAsObject(runtime, "JSON")
                           .getPropertyAsFunction(runtime, "parse");
  return parseJson.call(runtime, String::createFromUtf8(runtime, json, length));
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

double Value::asNumber() const {
  if (!isNumber()) {
    throw JSINativeException("Value is not an Object");
  }

  return getNumber();
}

Object Value::asObject(Runtime& runtime) const& {
  if (!isObject()) {
    throw JSError(runtime, "Value is not an Object");
  }

  return getObject(runtime);
}

Object Value::asObject(Runtime& rt) && {
  if (!isObject()) {
    throw JSError(rt, "Value is not an Object");
  }
  auto ptr = data_.pointer.ptr_;
  data_.pointer.ptr_ = nullptr;
  return static_cast<Object>(ptr);
}

String Value::asString(Runtime& rt) const& {
  if (!isString()) {
    throw JSError(rt, "Value is not a String");
  }

  return getString(rt);
}

String Value::asString(Runtime& rt) && {
  if (!isString()) {
    throw JSError(rt, "Value is not a String");
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
        rt, rt.global().getPropertyAsFunction(rt, "Error").call(rt, message_));
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
  } catch (...) {
    setValue(rt, Value());
  }
}

JSError::JSError(std::string what, Runtime& rt, Value&& value)
    : JSIException(std::move(what)) {
  setValue(rt, std::move(value));
}

void JSError::setValue(Runtime& rt, Value&& value) {
  value_ = std::make_shared<jsi::Value>(std::move(value));

  try {
    if ((message_.empty() || stack_.empty()) && value_->isObject()) {
      auto obj = value_->getObject(rt);

      if (message_.empty()) {
        jsi::Value message = obj.getProperty(rt, "message");
        if (!message.isUndefined()) {
          message_ = message.toString(rt).utf8(rt);
        }
      }

      if (stack_.empty()) {
        jsi::Value stack = obj.getProperty(rt, "stack");
        if (!stack.isUndefined()) {
          stack_ = stack.toString(rt).utf8(rt);
        }
      }
    }

    if (message_.empty()) {
      message_ = value_->toString(rt).utf8(rt);
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

} // namespace jsi
} // namespace facebook
