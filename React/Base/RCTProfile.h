/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTDefines.h"

/**
 * RCTProfile
 *
 * This file provides a set of functions and macros for performance profiling
 *
 * NOTE: This API is a work in a work in progress, please consider carefully
 * before before using it.
 */

RCT_EXTERN NSString *const RCTProfileDidStartProfiling;
RCT_EXTERN NSString *const RCTProfileDidEndProfiling;

#if RCT_DEV

@class RCTBridge;

#define RCTProfileBeginFlowEvent() \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wshadow\"") \
NSNumber *__rct_profile_flow_id = _RCTProfileBeginFlowEvent(); \
_Pragma("clang diagnostic pop")

#define RCTProfileEndFlowEvent() \
_RCTProfileEndFlowEvent(__rct_profile_flow_id)

RCT_EXTERN NSNumber *_RCTProfileBeginFlowEvent(void);
RCT_EXTERN void _RCTProfileEndFlowEvent(NSNumber *);

/**
 * Returns YES if the profiling information is currently being collected
 */
RCT_EXTERN BOOL RCTProfileIsProfiling(void);

/**
 * Start collecting profiling information
 */
RCT_EXTERN void RCTProfileInit(RCTBridge *);

/**
 * Stop profiling and return a JSON string of the collected data - The data
 * returned is compliant with google's trace event format - the format used
 * as input to trace-viewer
 */
RCT_EXTERN NSString *RCTProfileEnd(RCTBridge *);

/**
 * Collects the initial event information for the event and returns a reference ID
 */
RCT_EXTERN void RCTProfileBeginEvent(uint64_t tag,
                                     NSString *name,
                                     NSDictionary *args);

/**
 * The ID returned by BeginEvent should then be passed into EndEvent, with the
 * rest of the event information. Just at this point the event will actually be
 * registered
 */
RCT_EXTERN void RCTProfileEndEvent(uint64_t tag,
                                   NSString *category,
                                   NSDictionary *args);

/**
 * Collects the initial event information for the event and returns a reference ID
 */
RCT_EXTERN int RCTProfileBeginAsyncEvent(uint64_t tag,
                                         NSString *name,
                                         NSDictionary *args);

/**
 * The ID returned by BeginEvent should then be passed into EndEvent, with the
 * rest of the event information. Just at this point the event will actually be
 * registered
 */
RCT_EXTERN void RCTProfileEndAsyncEvent(uint64_t tag,
                                        NSString *category,
                                        int cookie,
                                        NSString *name,
                                        NSDictionary *args);
/**
 * An event that doesn't have a duration (i.e. Notification, VSync, etc)
 */
RCT_EXTERN void RCTProfileImmediateEvent(uint64_t tag,
                                         NSString *name,
                                         char scope);

/**
 * Helper to profile the duration of the execution of a block. This method uses
 * self and _cmd to name this event for simplicity sake.
 *
 * NOTE: The block can't expect any argument
 */
#define RCTProfileBlock(block, tag, category, arguments) \
^{ \
  RCTProfileBeginEvent(tag, @(__PRETTY_FUNCTION__), nil); \
  block(); \
  RCTProfileEndEvent(tag, category, arguments); \
}

/**
 * Hook into a bridge instance to log all bridge module's method calls
 */
RCT_EXTERN void RCTProfileHookModules(RCTBridge *);

/**
 * Unhook from a given bridge instance's modules
 */
RCT_EXTERN void RCTProfileUnhookModules(RCTBridge *);

#else

#define RCTProfileBeginFlowEvent()
#define _RCTProfileBeginFlowEvent() @0

#define RCTProfileEndFlowEvent()
#define _RCTProfileEndFlowEvent()

#define RCTProfileIsProfiling(...) NO
#define RCTProfileInit(...)
#define RCTProfileEnd(...) @""

#define RCTProfileBeginEvent(...)
#define RCTProfileEndEvent(...)

#define RCTProfileBeginAsyncEvent(...) 0
#define RCTProfileEndAsyncEvent(...)

#define RCTProfileImmediateEvent(...)

#define RCTProfileBlock(block, ...) block

#define RCTProfileHookModules(...)
#define RCTProfileUnhookModules(...)

#endif
