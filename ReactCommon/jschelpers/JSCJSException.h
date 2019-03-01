#pragma once

#include <stdexcept>
#include <functional>
#include <jschelpers/JavaScriptCore.h>
#include <cxxreact/JSException.h>
#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook{
namespace react{

class RN_EXPORT JSCJSException : public JSException {
public:
  explicit JSCJSException(const char* msg) : JSException(msg){
   }
  explicit JSCJSException(JSContextRef ctx, JSValueRef exn, const char* msg) : JSException(msg){
    buildMessage(ctx, exn, nullptr, msg);
  }

  explicit JSCJSException(JSContextRef ctx, JSValueRef exn, JSStringRef sourceURL) : JSException(nullptr) {
    buildMessage(ctx, exn, sourceURL, nullptr);
  }

  const std::string& getStack() const {
    return stack_;
  }

  virtual const char* what() const noexcept override {
    return msg_.c_str();
  }
private:
  void buildMessage(JSContextRef ctx, JSValueRef exn, JSStringRef sourceURL, const char* errorMsg);
};
}}