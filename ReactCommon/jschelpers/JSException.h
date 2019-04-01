#pragma once

#include <stdexcept>
#include <functional>

#if !V8_ENABLED
#include <jschelpers/JavaScriptCore.h>
#endif

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook{
namespace react{

class RN_EXPORT JSException : public std::exception {
public:
  explicit JSException(const char* msg)
    : msg_(msg) {}
  const std::string& getStack() const {
    return stack_;
  }
#if defined(__APPLE__) || !V8_ENABLED
  explicit JSException(JSContextRef ctx, JSValueRef exn, const char* msg) {
    buildMessage(ctx, exn, nullptr, msg);
  }
  
  explicit JSException(JSContextRef ctx, JSValueRef exn, JSStringRef sourceURL) {
    buildMessage(ctx, exn, sourceURL, nullptr);
  }
#endif
  virtual const char* what() const noexcept override {
    return msg_.c_str();
  }
protected:
  std::string msg_;
  std::string stack_;

  virtual void buildMessage(const char* errorMsg) {
        msg_ = errorMsg;
  }
  
#if defined (__APPLE__) || !V8_ENABLED
  void buildMessage(JSContextRef ctx, JSValueRef exn, JSStringRef sourceURL, const char* errorMsg);
#endif
};
}}
