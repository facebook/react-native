/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <JavaScriptCore/JavaScriptCore.h>

#import "RCTDefines.h"

/** The API is not thread-safe. */

/** The context is not retained. */
RCT_EXTERN void RCTJSCProfilerStart(JSContextRef ctx);
/** Returns a file path containing the profiler data. */
RCT_EXTERN NSString *RCTJSCProfilerStop(JSContextRef ctx);

RCT_EXTERN BOOL RCTJSCProfilerIsProfiling(JSContextRef ctx);
RCT_EXTERN BOOL RCTJSCProfilerIsSupported(void);
