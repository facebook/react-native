// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCHelpers.h"

#include <JavaScriptCore/JSStringRef.h>
#include <glog/logging.h>

#include "Value.h"

namespace facebook {
namespace react {

void installGlobalFunction(
    JSGlobalContextRef ctx,
    const char* name,
    JSObjectCallAsFunctionCallback callback) {
  JSStringRef jsName = JSStringCreateWithUTF8CString(name);
  JSObjectRef functionObj = JSObjectMakeFunctionWithCallback(
      ctx, jsName, callback);
  JSObjectRef globalObject = JSContextGetGlobalObject(ctx);
  JSObjectSetProperty(ctx, globalObject, jsName, functionObj, 0, NULL);
  JSStringRelease(jsName);
}

JSValueRef makeJSCException(
    JSContextRef ctx,
    const char* exception_text) {
  JSStringRef message = JSStringCreateWithUTF8CString(exception_text);
  JSValueRef exceptionString = JSValueMakeString(ctx, message);
  JSStringRelease(message);
  return JSValueToObject(ctx, exceptionString, NULL);
}

JSValueRef evaluateScript(JSContextRef context, JSStringRef script, JSStringRef source) {
  JSValueRef exn, result;
  result = JSEvaluateScript(context, script, NULL, source, 0, &exn);
  if (result == nullptr) {
    Value exception = Value(context, exn);
    std::string exceptionText = exception.toString().str();
    LOG(ERROR) << "Got JS Exception: " << exceptionText;
    auto line = exception.asObject().getProperty("line");

    std::ostringstream locationInfo;
    std::string file = source != nullptr ? String::ref(source).str() : "";
    locationInfo << "(" << (file.length() ? file : "<unknown file>");
    if (line != nullptr && line.isNumber()) {
      locationInfo << ":" << line.asInteger();
    }
    locationInfo << ")";
    throwJSExecutionException("%s %s", exceptionText.c_str(), locationInfo.str().c_str());
  }
  return result;
}

JSValueRef makeJSError(JSContextRef ctx, const char *error) {
  JSValueRef nestedException = nullptr;
  JSValueRef args[] = { Value(ctx, String(error)) };
  JSObjectRef errorObj = JSObjectMakeError(ctx, 1, args, &nestedException);
  if (nestedException != nullptr) {
    return std::move(args[0]);
  }
  return errorObj;
}

JSValueRef translatePendingCppExceptionToJSError(JSContextRef ctx, const char *exceptionLocation) {
  std::ostringstream msg;
  try {
    throw;
  } catch (const std::bad_alloc& ex) {
    throw; // We probably shouldn't try to handle this in JS
  } catch (const std::exception& ex) {
    msg << "C++ Exception in '" << exceptionLocation << "': " << ex.what();
    return makeJSError(ctx, msg.str().c_str());
  } catch (const char* ex) {
    msg << "C++ Exception (thrown as a char*) in '" << exceptionLocation << "': " << ex;
    return makeJSError(ctx, msg.str().c_str());
  } catch (...) {
    msg << "Unknown C++ Exception in '" << exceptionLocation << "'";
    return makeJSError(ctx, msg.str().c_str());
  }
}

} }
