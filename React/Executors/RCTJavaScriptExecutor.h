/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <objc/runtime.h>

#import <JavaScriptCore/JavaScriptCore.h>

#import "RCTBridgeModule.h"
#import "RCTInvalidating.h"

typedef void (^RCTJavaScriptCompleteBlock)(NSError *error);
typedef void (^RCTJavaScriptCallback)(id json, NSError *error);

/**
 * Abstracts away a JavaScript execution context - we may be running code in a
 * web view (for debugging purposes), or may be running code in a `JSContext`.
 */
/// @protocol RCTJavaScriptExecutor
/// @brief JS 执行器协议
@protocol RCTJavaScriptExecutor <RCTInvalidating, RCTBridgeModule>

/**
 * Used to set up the executor after the bridge has been fully initialized.
 * Do any expensive setup in this method instead of `-init`.
 */
/// @brief 在 bridge 完全初始化完成之后初始化 JS 执行器，在 `- setUp` 方法中执行开销较大的操作，而不是在 `- init` 方法中
- (void)setUp;

/**
 * Executes given method with arguments on JS thread and calls the given callback
 * with JSValue and JSContext as a result of the JS module call.
 */
/// @brief [Native call JS] 执行 JS 代码
/// @param name module 名称
/// @param method 方法名称
/// @param arguments 参数列表
/// @param onComplete 执行回调，可以在这里获取执行结果（json）和相关错误信息
- (void)executeJSCall:(NSString *)name
               method:(NSString *)method
            arguments:(NSArray *)arguments
             callback:(RCTJavaScriptCallback)onComplete;

/**
 * Runs an application script, and notifies of the script load being complete via `onComplete`.
 */
/// @brief 执行一个应用程序脚本，并通过' onComplete '通知脚本加载已经完成
/// @param script 脚本
/// @param sourceURL 脚本路径
/// @param onComplete 完成回调
- (void)executeApplicationScript:(NSString *)script
                       sourceURL:(NSURL *)sourceURL
                      onComplete:(RCTJavaScriptCompleteBlock)onComplete;

/// @brief 向 JS 侧注入 JS 脚本
/// @param script 脚本内容
/// @param objectName JS 侧全局对象名称
/// @param onComplete 注入完成回调
- (void)injectJSONText:(NSString *)script
   asGlobalObjectNamed:(NSString *)objectName
              callback:(RCTJavaScriptCompleteBlock)onComplete;

/**
 * Enqueue a block to run in the executors JS thread. Fallback to `dispatch_async`
 * on the main queue if the executor doesn't own a thread.
 */
/// @brief 在 JS 队列上执行 block 中内容
/// @param block 需要执行的内容
- (void)executeBlockOnJavaScriptQueue:(dispatch_block_t)block;

@optional

/**
 * Special case for Timers + ContextExecutor - instead of the default
 *   if jsthread then call else dispatch call on jsthread
 * ensure the call is made async on the jsthread
 */
/// @brief 在 JS 队列上异步执行 block 中内容
/// @param block 需要执行的内容
- (void)executeAsyncBlockOnJavaScriptQueue:(dispatch_block_t)block;

@end
