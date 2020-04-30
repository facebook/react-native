/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {
namespace jsi {
namespace detail {

inline Value toValue(Runtime&, std::nullptr_t) {
  return Value::null();
}
inline Value toValue(Runtime&, bool b) {
  return Value(b);
}
inline Value toValue(Runtime&, double d) {
  return Value(d);
}
inline Value toValue(Runtime&, float f) {
  return Value(static_cast<double>(f));
}
inline Value toValue(Runtime&, int i) {
  return Value(i);
}
inline Value toValue(Runtime& runtime, const char* str) {
  return String::createFromAscii(runtime, str);
}
inline Value toValue(Runtime& runtime, const std::string& str) {
  return String::createFromUtf8(runtime, str);
}
template <typename T>
inline Value toValue(Runtime& runtime, const T& other) {
  static_assert(
      std::is_base_of<Pointer, T>::value,
      "This type cannot be converted to Value");
  return Value(runtime, other);
}
inline Value toValue(Runtime& runtime, const Value& value) {
  return Value(runtime, value);
}
inline Value&& toValue(Runtime&, Value&& value) {
  return std::move(value);
}

inline PropNameID toPropNameID(Runtime& runtime, const char* name) {
  return PropNameID::forAscii(runtime, name);
}
inline PropNameID toPropNameID(Runtime& runtime, const std::string& name) {
  return PropNameID::forUtf8(runtime, name);
}
inline PropNameID&& toPropNameID(Runtime&, PropNameID&& name) {
  return std::move(name);
}

void throwJSError(Runtime&, const char* msg);

} // namespace detail

template <typename T>
inline T Runtime::make(Runtime::PointerValue* pv) {
  return T(pv);
}

inline const Runtime::PointerValue* Runtime::getPointerValue(
    const jsi::Pointer& pointer) {
  return pointer.ptr_;
}

inline const Runtime::PointerValue* Runtime::getPointerValue(
    const jsi::Value& value) {
  return value.data_.pointer.ptr_;
}

inline Value Object::getProperty(Runtime& runtime, const char* name) const {
  return getProperty(runtime, String::createFromAscii(runtime, name));
}

inline Value Object::getProperty(Runtime& runtime, const String& name) const {
  return runtime.getProperty(*this, name);
}

inline Value Object::getProperty(Runtime& runtime, const PropNameID& name)
    const {
  return runtime.getProperty(*this, name);
}

inline bool Object::hasProperty(Runtime& runtime, const char* name) const {
  return hasProperty(runtime, String::createFromAscii(runtime, name));
}

inline bool Object::hasProperty(Runtime& runtime, const String& name) const {
  return runtime.hasProperty(*this, name);
}

inline bool Object::hasProperty(Runtime& runtime, const PropNameID& name)
    const {
  return runtime.hasProperty(*this, name);
}

template <typename T>
void Object::setProperty(Runtime& runtime, const char* name, T&& value) {
  setProperty(
      runtime, String::createFromAscii(runtime, name), std::forward<T>(value));
}

template <typename T>
void Object::setProperty(Runtime& runtime, const String& name, T&& value) {
  setPropertyValue(
      runtime, name, detail::toValue(runtime, std::forward<T>(value)));
}

template <typename T>
void Object::setProperty(Runtime& runtime, const PropNameID& name, T&& value) {
  setPropertyValue(
      runtime, name, detail::toValue(runtime, std::forward<T>(value)));
}

inline Array Object::getArray(Runtime& runtime) const& {
  assert(runtime.isArray(*this));
  (void)runtime; // when assert is disabled we need to mark this as used
  return Array(runtime.cloneObject(ptr_));
}

inline Array Object::getArray(Runtime& runtime) && {
  assert(runtime.isArray(*this));
  (void)runtime; // when assert is disabled we need to mark this as used
  Runtime::PointerValue* value = ptr_;
  ptr_ = nullptr;
  return Array(value);
}

inline ArrayBuffer Object::getArrayBuffer(Runtime& runtime) const& {
  assert(runtime.isArrayBuffer(*this));
  (void)runtime; // when assert is disabled we need to mark this as used
  return ArrayBuffer(runtime.cloneObject(ptr_));
}

inline ArrayBuffer Object::getArrayBuffer(Runtime& runtime) && {
  assert(runtime.isArrayBuffer(*this));
  (void)runtime; // when assert is disabled we need to mark this as used
  Runtime::PointerValue* value = ptr_;
  ptr_ = nullptr;
  return ArrayBuffer(value);
}

inline Function Object::getFunction(Runtime& runtime) const& {
  assert(runtime.isFunction(*this));
  return Function(runtime.cloneObject(ptr_));
}

inline Function Object::getFunction(Runtime& runtime) && {
  assert(runtime.isFunction(*this));
  (void)runtime; // when assert is disabled we need to mark this as used
  Runtime::PointerValue* value = ptr_;
  ptr_ = nullptr;
  return Function(value);
}

template <typename T>
inline bool Object::isHostObject(Runtime& runtime) const {
  return runtime.isHostObject(*this) &&
      std::dynamic_pointer_cast<T>(runtime.getHostObject(*this));
}

template <>
inline bool Object::isHostObject<HostObject>(Runtime& runtime) const {
  return runtime.isHostObject(*this);
}

template <typename T>
inline std::shared_ptr<T> Object::getHostObject(Runtime& runtime) const {
  assert(isHostObject<T>(runtime));
  return std::static_pointer_cast<T>(runtime.getHostObject(*this));
}

template <typename T>
inline std::shared_ptr<T> Object::asHostObject(Runtime& runtime) const {
  if (!isHostObject<T>(runtime)) {
    detail::throwJSError(runtime, "Object is not a HostObject of desired type");
  }
  return std::static_pointer_cast<T>(runtime.getHostObject(*this));
}

template <>
inline std::shared_ptr<HostObject> Object::getHostObject<HostObject>(
    Runtime& runtime) const {
  assert(runtime.isHostObject(*this));
  return runtime.getHostObject(*this);
}

inline Array Object::getPropertyNames(Runtime& runtime) const {
  return runtime.getPropertyNames(*this);
}

inline Value WeakObject::lock(Runtime& runtime) {
  return runtime.lockWeakObject(*this);
}

template <typename T>
void Array::setValueAtIndex(Runtime& runtime, size_t i, T&& value) {
  setValueAtIndexImpl(
      runtime, i, detail::toValue(runtime, std::forward<T>(value)));
}

inline Value Array::getValueAtIndex(Runtime& runtime, size_t i) const {
  return runtime.getValueAtIndex(*this, i);
}

inline Function Function::createFromHostFunction(
    Runtime& runtime,
    const jsi::PropNameID& name,
    unsigned int paramCount,
    jsi::HostFunctionType func) {
  return runtime.createFunctionFromHostFunction(
      name, paramCount, std::move(func));
}

inline Value Function::call(Runtime& runtime, const Value* args, size_t count)
    const {
  return runtime.call(*this, Value::undefined(), args, count);
}

inline Value Function::call(Runtime& runtime, std::initializer_list<Value> args)
    const {
  return call(runtime, args.begin(), args.size());
}

template <typename... Args>
inline Value Function::call(Runtime& runtime, Args&&... args) const {
  // A more awesome version of this would be able to create raw values
  // which can be used directly without wrapping and unwrapping, but
  // this will do for now.
  return call(runtime, {detail::toValue(runtime, std::forward<Args>(args))...});
}

inline Value Function::callWithThis(
    Runtime& runtime,
    const Object& jsThis,
    const Value* args,
    size_t count) const {
  return runtime.call(*this, Value(runtime, jsThis), args, count);
}

inline Value Function::callWithThis(
    Runtime& runtime,
    const Object& jsThis,
    std::initializer_list<Value> args) const {
  return callWithThis(runtime, jsThis, args.begin(), args.size());
}

template <typename... Args>
inline Value Function::callWithThis(
    Runtime& runtime,
    const Object& jsThis,
    Args&&... args) const {
  // A more awesome version of this would be able to create raw values
  // which can be used directly without wrapping and unwrapping, but
  // this will do for now.
  return callWithThis(
      runtime, jsThis, {detail::toValue(runtime, std::forward<Args>(args))...});
}

template <typename... Args>
inline Array Array::createWithElements(Runtime& runtime, Args&&... args) {
  return createWithElements(
      runtime, {detail::toValue(runtime, std::forward<Args>(args))...});
}

template <typename... Args>
inline std::vector<PropNameID> PropNameID::names(
    Runtime& runtime,
    Args&&... args) {
  return names({detail::toPropNameID(runtime, std::forward<Args>(args))...});
}

template <size_t N>
inline std::vector<PropNameID> PropNameID::names(
    PropNameID(&&propertyNames)[N]) {
  std::vector<PropNameID> result;
  result.reserve(N);
  for (auto& name : propertyNames) {
    result.push_back(std::move(name));
  }
  return result;
}

inline Value Function::callAsConstructor(
    Runtime& runtime,
    const Value* args,
    size_t count) const {
  return runtime.callAsConstructor(*this, args, count);
}

inline Value Function::callAsConstructor(
    Runtime& runtime,
    std::initializer_list<Value> args) const {
  return callAsConstructor(runtime, args.begin(), args.size());
}

template <typename... Args>
inline Value Function::callAsConstructor(Runtime& runtime, Args&&... args)
    const {
  return callAsConstructor(
      runtime, {detail::toValue(runtime, std::forward<Args>(args))...});
}

} // namespace jsi
} // namespace facebook
