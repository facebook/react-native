/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <JavaScriptCore/JavaScriptCore.h>
#import "RCTJavaScriptExecutor.h"

// TODO: (#5906496) Might `RCTJSCoreExecutor` be a better name for this?

/**
 * Uses a JavaScriptCore context as the execution engine.
 */
/// @class RCTContextExecutor
/// @brief JS 侧与 OC 侧通信的出入口，相互方法调用的信息都由这里发出（内部由 JSCore 支持），
///        `RCTJavaScriptExecutor` 包含了 `RCTBridgeModule` 协议，所以 `RCTContextExecutor`
///        也属于一种 module，以宏 `RCT_EXPORT_MODULE()` 的方式导出并创建实例
///        @protocol RCTJavaScriptExecutor <RCTInvalidating, RCTBridgeModule>
@interface RCTContextExecutor : NSObject <RCTJavaScriptExecutor>

/**
 * Configures the executor to run JavaScript on a custom performer.
 * You probably don't want to use this; use -init instead.
 */
/// @brief 指定初始化方法，可以指定 JS 执行线程与 JS 执行上下文
/// @param javaScriptThread JS 执行线程
/// @param context JS 执行上下文
- (instancetype)initWithJavaScriptThread:(NSThread *)javaScriptThread
                        globalContextRef:(JSGlobalContextRef)context NS_DESIGNATED_INITIALIZER;

@end
