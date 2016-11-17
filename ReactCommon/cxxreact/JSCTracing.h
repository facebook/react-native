// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#if defined(WITH_JSC_EXTRA_TRACING) || DEBUG

#include <inttypes.h>

#include <JavaScriptCore/JSContextRef.h>

namespace facebook {
namespace react {

uint64_t tracingTagFromJSValue(JSContextRef ctx, JSValueRef value, JSValueRef* exception);
void addNativeTracingHooks(JSGlobalContextRef ctx);

} }

#endif
