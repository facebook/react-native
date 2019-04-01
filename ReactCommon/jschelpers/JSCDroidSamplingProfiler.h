/**
Adding this file to keep the devmain builds happy 
for reference on the bewlo functions

'JSStartSamplingProfilingOnMainJSCThread'
'JSPokeSamplingProfiler'

**/
#pragma once

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

RN_EXPORT JSValueRef JSPokeSamplingProfiler(JSContextRef);
RN_EXPORT void JSStartSamplingProfilingOnMainJSCThread(JSGlobalContextRef);
