// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#if defined(WITH_JSC_EXTRA_TRACING)

#include <JavaScriptCore/JSContextRef.h>
namespace facebook {
namespace react {

void addNativeTracingLegacyHooks(JSGlobalContextRef ctx);

} }

#endif
