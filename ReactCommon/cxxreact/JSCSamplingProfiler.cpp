// Copyright 2004-present Facebook. All Rights Reserved.

#ifdef WITH_JSC_EXTRA_TRACING

#include "JSCSamplingProfiler.h"

#include <JavaScriptCore/API/JSProfilerPrivate.h>

namespace facebook {
namespace react {

void initSamplingProfilerOnMainJSCThread(JSGlobalContextRef ctx) {
  JSStartSamplingProfilingOnMainJSCThread(ctx);
}

}
}

#endif // WITH_JSC_EXTRA_TRACING
