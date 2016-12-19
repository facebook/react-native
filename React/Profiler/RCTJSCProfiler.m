/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTJSCProfiler.h"

#import <UIKit/UIKit.h>

#import "RCTLog.h"

#ifndef RCT_JSC_PROFILER
#define RCT_JSC_PROFILER RCT_PROFILE
#endif

#if RCT_JSC_PROFILER

#include <dlfcn.h>

#ifndef RCT_JSC_PROFILER_DYLIB
  #define RCT_JSC_PROFILER_DYLIB [[[NSBundle mainBundle] pathForResource:[NSString stringWithFormat:@"RCTJSCProfiler.ios%zd", [[[UIDevice currentDevice] systemVersion] integerValue]] ofType:@"dylib" inDirectory:@"RCTJSCProfiler"] UTF8String]
#endif

static const char *const JSCProfileName = "profile";

typedef void (*JSCProfilerStartFunctionType)(JSContextRef, const char *);
typedef void (*JSCProfilerEndFunctionType)(JSContextRef, const char *, const char *);
typedef void (*JSCProfilerEnableFunctionType)(void);

static NSMutableDictionary<NSValue *, NSNumber *> *RCTJSCProfilerStateMap;

static JSCProfilerStartFunctionType RCTNativeProfilerStart  = NULL;
static JSCProfilerEndFunctionType RCTNativeProfilerEnd    = NULL;

NS_INLINE NSValue *RCTJSContextRefKey(JSContextRef ref) {
  return [NSValue valueWithPointer:ref];
}

static void RCTJSCProfilerStateInit()
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    RCTJSCProfilerStateMap = [NSMutableDictionary new];

    void *JSCProfiler = dlopen(RCT_JSC_PROFILER_DYLIB, RTLD_NOW);

    RCTNativeProfilerStart = (JSCProfilerStartFunctionType)dlsym(JSCProfiler, "nativeProfilerStart");
    RCTNativeProfilerEnd =  (JSCProfilerEndFunctionType)dlsym(JSCProfiler, "nativeProfilerEnd");
    JSCProfilerEnableFunctionType enableBytecode = (__typeof__(enableBytecode))dlsym(JSCProfiler, "nativeProfilerEnableBytecode");

    if (RCTNativeProfilerStart && RCTNativeProfilerEnd && enableBytecode) {
      enableBytecode();
    } else {
      RCTNativeProfilerStart = NULL;
      RCTNativeProfilerEnd = NULL;
    }
  });
}

#endif

void RCTJSCProfilerStart(JSContextRef ctx)
{
#if RCT_JSC_PROFILER
  if (ctx != NULL) {
    if (RCTJSCProfilerIsSupported()) {
      NSValue *key = RCTJSContextRefKey(ctx);
      BOOL isProfiling = [RCTJSCProfilerStateMap[key] boolValue];
      if (!isProfiling) {
        RCTLogInfo(@"Starting JSC profiler for context: %p", ctx);
        RCTJSCProfilerStateMap[key] = @YES;
        RCTNativeProfilerStart(ctx, JSCProfileName);
      } else {
        RCTLogWarn(@"Trying to start JSC profiler on a context which is already profiled.");
      }
    } else {
      RCTLogWarn(@"Cannot start JSC profiler as it's not supported.");
    }
  } else {
    RCTLogWarn(@"Trying to start JSC profiler for NULL context.");
  }
#endif
}

NSString *RCTJSCProfilerStop(JSContextRef ctx)
{
  NSString *outputFile = nil;
#if RCT_JSC_PROFILER
  if (ctx != NULL) {
    RCTJSCProfilerStateInit();
    NSValue *key = RCTJSContextRefKey(ctx);
    BOOL isProfiling = [RCTJSCProfilerStateMap[key] boolValue];
    if (isProfiling) {
      NSString *filename = [NSString stringWithFormat:@"cpu_profile_%ld.json", (long)CFAbsoluteTimeGetCurrent()];
      outputFile = [NSTemporaryDirectory() stringByAppendingPathComponent:filename];
      if (RCTNativeProfilerEnd) {
        RCTNativeProfilerEnd(ctx, JSCProfileName, outputFile.UTF8String);
      }
      RCTLogInfo(@"Stopped JSC profiler for context: %p", ctx);
    } else {
      RCTLogWarn(@"Trying to stop JSC profiler on a context which is not being profiled.");
    }
    [RCTJSCProfilerStateMap removeObjectForKey:key];
  } else {
    RCTLogWarn(@"Trying to stop JSC profiler for NULL context.");
  }
#endif
  return outputFile;
}

BOOL RCTJSCProfilerIsProfiling(JSContextRef ctx)
{
  BOOL isProfiling = NO;
#if RCT_JSC_PROFILER
  if (ctx != NULL) {
    RCTJSCProfilerStateInit();
    isProfiling = [RCTJSCProfilerStateMap[RCTJSContextRefKey(ctx)] boolValue];
  }
#endif
  return isProfiling;
}

BOOL RCTJSCProfilerIsSupported(void)
{
  BOOL isSupported = NO;
#if RCT_JSC_PROFILER
  RCTJSCProfilerStateInit();
  isSupported = (RCTNativeProfilerStart != NULL);
#endif
  return isSupported;
}
