// Copyright 2004-present Facebook. All Rights Reserved.

#include "Value.h"

#include <folly/json.h>
#include <folly/Conv.h>

#include "JSCHelpers.h"
#include "JavaScriptCore.h"

// See the comment under Value::fromDynamic()
#if !defined(__APPLE__) && defined(WITH_FB_JSC_TUNING)
#define USE_FAST_FOLLY_DYNAMIC_CONVERSION 1
#else
#define USE_FAST_FOLLY_DYNAMIC_CONVERSION 0
#endif

namespace facebook {
namespace react {

/* static */
Object Object::makeDate(JSContextRef ctx, Object::TimeType time) {
  using std::chrono::duration_cast;
  using std::chrono::milliseconds;

  JSValueRef arguments[1];
  arguments[0] = JSC_JSValueMakeNumber(
    ctx,
    duration_cast<milliseconds>(time.time_since_epoch()).count());

  JSValueRef exn;
  auto result = JSC_JSObjectMakeDate(ctx, 1, arguments, &exn);
  if (!result) {
    throw JSException(ctx, exn, "Failed to create Date");
  }
  return Object(ctx, result);
}

Object Object::makeArray(JSContextRef ctx, JSValueRef* elements, unsigned length) {
  JSValueRef exn;
  auto arr = JSC_JSObjectMakeArray(ctx, length, elements, &exn);
  if (!arr) {
    throw JSException(ctx, exn, "Failed to create an Array");
  }
  return Object(ctx, arr);
}

Value::Value(JSContextRef context, JSValueRef value)
  : m_context(context), m_value(value) {}

Value::Value(JSContextRef context, JSStringRef str)
  : m_context(context), m_value(JSC_JSValueMakeString(context, str)) {}

JSContextRef Value::context() const {
  return m_context;
}

/* static */
std::string Value::toJSONString(unsigned indent) const {
  JSValueRef exn;
  auto stringToAdopt = JSC_JSValueCreateJSONString(m_context, m_value, indent, &exn);
  if (!stringToAdopt) {
    throw JSException(m_context, exn, "Exception creating JSON string");
  }
  return String::adopt(m_context, stringToAdopt).str();
}

/* static */
Value Value::fromJSON(const String& json) {
  JSContextRef ctx = json.context();
  auto result = JSC_JSValueMakeFromJSONString(ctx, json);
  if (!result) {
    throw JSException(folly::to<std::string>(
      "Failed to create Value from JSON: ", json.str()).c_str());
  }
  return Value(ctx, result);
}

Value Value::fromDynamic(JSContextRef ctx, const folly::dynamic& value) {
// JavaScriptCore's iOS APIs have their own version of this direct conversion.
// In addition, using this requires exposing some of JSC's private APIs,
//  so it's limited to non-apple platforms and to builds that use the custom JSC.
// Otherwise, we use the old way of converting through JSON.
#if USE_FAST_FOLLY_DYNAMIC_CONVERSION
  // Defer GC during the creation of the JSValue, as we don't want
  //  intermediate objects to be collected.
  // We could use JSValueProtect(), but it will make the process much slower.
  JSDeferredGCRef deferGC = JSDeferGarbageCollection(ctx);
  // Set a global lock for the whole process,
  //  instead of re-acquiring the lock for each operation.
  JSLock(ctx);
  JSValueRef jsVal = Value::fromDynamicInner(ctx, value);
  JSUnlock(ctx);
  JSResumeGarbageCollection(ctx, deferGC);
  return Value(ctx, jsVal);
#else
  auto json = folly::toJson(value);
  return fromJSON(String(ctx, json.c_str()));
#endif
}

JSValueRef Value::fromDynamicInner(JSContextRef ctx, const folly::dynamic& obj) {
  switch (obj.type()) {
    // For primitive types (and strings), just create and return an equivalent JSValue
    case folly::dynamic::Type::NULLT:
      return JSC_JSValueMakeNull(ctx);

    case folly::dynamic::Type::BOOL:
      return JSC_JSValueMakeBoolean(ctx, obj.getBool());

    case folly::dynamic::Type::DOUBLE:
      return JSC_JSValueMakeNumber(ctx, obj.getDouble());

    case folly::dynamic::Type::INT64:
      return JSC_JSValueMakeNumber(ctx, obj.asDouble());

    case folly::dynamic::Type::STRING:
      return JSC_JSValueMakeString(ctx, String(ctx, obj.getString().c_str()));

    case folly::dynamic::Type::ARRAY: {
      // Collect JSValue for every element in the array
      JSValueRef vals[obj.size()];
      for (size_t i = 0; i < obj.size(); ++i) {
        vals[i] = fromDynamicInner(ctx, obj[i]);
      }
      // Create a JSArray with the values
      JSValueRef arr = JSC_JSObjectMakeArray(ctx, obj.size(), vals, nullptr);
      return arr;
    }

    case folly::dynamic::Type::OBJECT: {
      // Create an empty object
      JSObjectRef jsObj = JSC_JSObjectMake(ctx, nullptr, nullptr);
      // Create a JSValue for each of the object's children and set them in the object
      for (auto it = obj.items().begin(); it != obj.items().end(); ++it) {
        JSC_JSObjectSetProperty(
          ctx,
          jsObj,
          String(ctx, it->first.asString().c_str()),
          fromDynamicInner(ctx, it->second),
          kJSPropertyAttributeNone,
          nullptr);
      }
      return jsObj;
    }
    default:
      // Assert not reached
      LOG(FATAL) << "Trying to convert a folly object of unsupported type.";
      return JSC_JSValueMakeNull(ctx);
  }
}

Object Value::asObject() const {
  JSValueRef exn;
  JSObjectRef jsObj = JSC_JSValueToObject(context(), m_value, &exn);
  if (!jsObj) {
    throw JSException(m_context, exn, "Failed to convert to object");
  }
  return Object(context(), jsObj);
}

String Value::toString() const {
  JSValueRef exn;
  JSStringRef jsStr = JSC_JSValueToStringCopy(context(), m_value, &exn);
  if (!jsStr) {
    throw JSException(m_context, exn, "Failed to convert to string");
  }
  return String::adopt(context(), jsStr);
}

Value Value::makeError(JSContextRef ctx, const char *error, const char *stack)
{
  auto errorMsg = Value(ctx, String(ctx, error));
  JSValueRef args[] = {errorMsg};
  if (stack) {
    // Using this instead of JSObjectMakeError to actually get a stack property.
    // MakeError only sets it stack when returning from the invoked function, so we
    // can't extend it here.
    auto errorConstructor = Object::getGlobalObject(ctx).getProperty("Error").asObject();
    auto jsError = errorConstructor.callAsConstructor({errorMsg});
    auto fullStack = std::string(stack) + jsError.getProperty("stack").toString().str();
    jsError.setProperty("stack", String(ctx, fullStack.c_str()));
    return jsError;
  } else {
    JSValueRef exn;
    JSObjectRef errorObj = JSC_JSObjectMakeError(ctx, 1, args, &exn);
    if (!errorObj) {
      throw JSException(ctx, exn, "Exception making error");
    }
    return Value(ctx, errorObj);
  }
}

Object::operator Value() const {
  return Value(m_context, m_obj);
}

Value Object::callAsFunction(std::initializer_list<JSValueRef> args) const {
  return callAsFunction(nullptr, args.size(), args.begin());
}

Value Object::callAsFunction(const Object& thisObj, std::initializer_list<JSValueRef> args) const {
  return callAsFunction((JSObjectRef)thisObj, args.size(), args.begin());
}

Value Object::callAsFunction(int nArgs, const JSValueRef args[]) const {
  return callAsFunction(nullptr, nArgs, args);
}

Value Object::callAsFunction(const Object& thisObj, int nArgs, const JSValueRef args[]) const {
  return callAsFunction(static_cast<JSObjectRef>(thisObj), nArgs, args);
}

Value Object::callAsFunction(JSObjectRef thisObj, int nArgs, const JSValueRef args[]) const {
  JSValueRef exn;
  JSValueRef result = JSC_JSObjectCallAsFunction(m_context, m_obj, thisObj, nArgs, args, &exn);
  if (!result) {
    throw JSException(m_context, exn, "Exception calling object as function");
  }
  return Value(m_context, result);
}

Object Object::callAsConstructor(std::initializer_list<JSValueRef> args) const {
  JSValueRef exn;
  JSObjectRef result = JSC_JSObjectCallAsConstructor(m_context, m_obj, args.size(), args.begin(), &exn);
  if (!result) {
    throw JSException(m_context, exn, "Exception calling object as constructor");
  }
  return Object(m_context, result);
}

Value Object::getProperty(const String& propName) const {
  JSValueRef exn;
  JSValueRef property = JSC_JSObjectGetProperty(m_context, m_obj, propName, &exn);
  if (!property) {
    throw JSException(m_context, exn, folly::to<std::string>(
      "Failed to get property '", propName.str(), "'").c_str());
  }
  return Value(m_context, property);
}

Value Object::getPropertyAtIndex(unsigned int index) const {
  JSValueRef exn;
  JSValueRef property = JSC_JSObjectGetPropertyAtIndex(m_context, m_obj, index, &exn);
  if (!property) {
    throw JSException(m_context, exn, folly::to<std::string>(
      "Failed to get property at index ", index).c_str());
  }
  return Value(m_context, property);
}

Value Object::getProperty(const char *propName) const {
  return getProperty(String(m_context, propName));
}

void Object::setProperty(const String& propName, const Value& value) {
  JSValueRef exn = nullptr;
  JSC_JSObjectSetProperty(m_context, m_obj, propName, value, kJSPropertyAttributeNone, &exn);
  if (exn) {
    throw JSException(m_context, exn, folly::to<std::string>(
      "Failed to set property '", propName.str(), "'").c_str());
  }
}

void Object::setPropertyAtIndex(unsigned int index, const Value& value) {
  JSValueRef exn = nullptr;
  JSC_JSObjectSetPropertyAtIndex(m_context, m_obj, index, value, &exn);
  if (exn) {
    throw JSException(m_context, exn, folly::to<std::string>(
      "Failed to set property at index ", index).c_str());
  }
}

void Object::setProperty(const char *propName, const Value& value) {
  setProperty(String(m_context, propName), value);
}

std::vector<String> Object::getPropertyNames() const {
  auto namesRef = JSC_JSObjectCopyPropertyNames(m_context, m_obj);
  size_t count = JSC_JSPropertyNameArrayGetCount(m_context, namesRef);
  std::vector<String> names;
  names.reserve(count);
  for (size_t i = 0; i < count; i++) {
    names.emplace_back(String::ref(m_context,
      JSC_JSPropertyNameArrayGetNameAtIndex(m_context, namesRef, i)));
  }
  JSC_JSPropertyNameArrayRelease(m_context, namesRef);
  return names;
}

std::unordered_map<std::string, std::string> Object::toJSONMap() const {
  std::unordered_map<std::string, std::string> map;
  auto namesRef = JSC_JSObjectCopyPropertyNames(m_context, m_obj);
  size_t count = JSC_JSPropertyNameArrayGetCount(m_context, namesRef);
  for (size_t i = 0; i < count; i++) {
    auto key = String::ref(m_context,
      JSC_JSPropertyNameArrayGetNameAtIndex(m_context, namesRef, i));
    map.emplace(key.str(), getProperty(key).toJSONString());
  }
  JSC_JSPropertyNameArrayRelease(m_context, namesRef);
  return map;
}

/* static */
Object Object::create(JSContextRef ctx) {
  JSObjectRef newObj = JSC_JSObjectMake(
      ctx,
      NULL, // create instance of default object class
      NULL); // no private data
  return Object(ctx, newObj);
}

} }
