#include "JSException.h"

#include <functional>
#include <stdexcept>

#include <jschelpers/Value.h>

namespace facebook {
namespace react {
  void JSException::buildMessage(JSContextRef ctx, JSValueRef exn, JSStringRef sourceURL, const char* errorMsg) {
  std::ostringstream msgBuilder;
  if (errorMsg && strlen(errorMsg) > 0) {
    msgBuilder << errorMsg << ": ";
  }

  Object exnObject = Value(ctx, exn).asObject();
  Value exnMessage = exnObject.getProperty("message");
  msgBuilder << (exnMessage.isString() ? exnMessage : (Value)exnObject).toString().str();

  // The null/empty-ness of source tells us if the JS came from a
  // file/resource, or was a constructed statement.  The location
  // info will include that source, if any.
  std::string locationInfo = sourceURL != nullptr ? String::ref(ctx, sourceURL).str() : "";
  auto line = exnObject.getProperty("line");
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
    msgBuilder << " (" << locationInfo << ")";
  }

  auto exceptionText = msgBuilder.str();
  LOG(ERROR) << "Got JS Exception: " << exceptionText;
  msg_ = std::move(exceptionText);

  Value jsStack = exnObject.getProperty("stack");
  if (jsStack.isString()) {
    auto stackText = jsStack.toString().str();
    LOG(ERROR) << "Got JS Stack: " << stackText;
    stack_ = std::move(stackText);
  }
}

}}
