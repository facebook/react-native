/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTJavaScriptExecutor.h"

@class RCTBridge;

/**
 * Class that allows easy embedding, loading, life-cycle management of a
 * JavaScript application inside of a native application.
 * TODO: Incremental module loading. (low pri).
 */
/// @class RCTJavaScriptLoader
/// @brief JS 资源脚本加载器
@interface RCTJavaScriptLoader : NSObject

/// @brief 指定初始化方法
/// @param bridge RCTBridge 实例
- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

/// @brief 加载脚本资源
/// @param scriptURL 脚本地址
/// @param onComplete 加载回调
- (void)loadBundleAtURL:(NSURL *)scriptURL onComplete:(void (^)(NSError *, NSString *))onComplete;

@end
