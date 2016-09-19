// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCHelpers.h"

#include <JavaScriptCore/JSStringRef.h>
#include <folly/String.h>
#include <glog/logging.h>

#include "SystraceSection.h"
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

String jsStringFromBigString(const JSBigString& bigstr) {
  if (bigstr.isAscii()) {
    return String::createExpectingAscii(bigstr.c_str(), bigstr.size());
  } else {
    return String(bigstr.c_str());
  }
}

JSValueRef evaluateScript(JSContextRef context, JSStringRef script, JSStringRef source) {
  SystraceSection s("evaluateScript");
  JSValueRef exn, result;
  result = JSEvaluateScript(context, script, NULL, source, 0, &exn);
  if (result == nullptr) {
    formatAndThrowJSException(context, exn, source);
  }
  return result;
}

#if WITH_FBJSCEXTENSIONS
JSValueRef evaluateSourceCode(JSContextRef context, JSSourceCodeRef source, JSStringRef sourceURL) {
  JSValueRef exn, result;
  result = JSEvaluateSourceCode(context, source, NULL, &exn);
  if (result == nullptr) {
    formatAndThrowJSException(context, exn, sourceURL);
  }
  return result;
}
#endif

void formatAndThrowJSException(JSContextRef context, JSValueRef exn, JSStringRef source) {
  Value exception = Value(context, exn);

  std::string exceptionText = exception.toString().str();

  // The null/empty-ness of source tells us if the JS came from a
  // file/resource, or was a constructed statement.  The location
  // info will include that source, if any.
  std::string locationInfo = source != nullptr ? String::ref(source).str() : "";
  Object exObject = exception.asObject();
  auto line = exObject.getProperty("line");
  if (line != nullptr && line.isNumber()) {
    if (locationInfo.empty() && line.asInteger() != 1) {
      // If there is a non-trivial line number, but there was no
      // location info, we include a placeholder, and the line
      // number.
      locationInfo = folly::to<std::string>("<unknown file>:", line.asInteger());
    } else if (!locationInfo.empty()) {
      // If there is location info, we always include the line
      // number, regardless of its value.
      locationInfo += folly::to<std::string>(":", line.asInteger());
    }
  }

  if (!locationInfo.empty()) {
    exceptionText += " (" + locationInfo + ")";
  }

  LOG(ERROR) << "Got JS Exception: " << exceptionText;

  Value jsStack = exObject.getProperty("stack");
  if (jsStack.isNull() || !jsStack.isString()) {
    throwJSExecutionException("%s", exceptionText.c_str());
  } else {
    LOG(ERROR) << "Got JS Stack: " << jsStack.toString().str();
    throwJSExecutionExceptionWithStack(
        exceptionText.c_str(), jsStack.toString().str().c_str());
  }
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

JSValueRef translatePendingCppExceptionToJSError(JSContextRef ctx, JSObjectRef jsFunctionCause) {
  try {
    auto functionName = Object(ctx, jsFunctionCause).getProperty("name").toString().str();
    return translatePendingCppExceptionToJSError(ctx, functionName.c_str());
  } catch (...) {
    return makeJSError(ctx, "Failed to get function name while handling exception");
  }
}

} }
