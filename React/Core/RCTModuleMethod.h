/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class RCTBridge;

/// @brief JS 侧函数调用类型
typedef NS_ENUM(NSUInteger, RCTJavaScriptFunctionKind) {
  RCTJavaScriptFunctionKindNormal,  ///< 普通函数类型
  RCTJavaScriptFunctionKindAsync,   ///< 异步调用函数类型
};

/// @class RCTModuleMethod
/// @brief module 下导出的方法信息实例
@interface RCTModuleMethod : NSObject

/// @brief 所属 module 类名
@property (nonatomic, copy, readonly) NSString *moduleClassName;
/// @brief JS 侧调用函数名称
@property (nonatomic, copy, readonly) NSString *JSMethodName;
/// @brief 方法选择器
@property (nonatomic, assign, readonly) SEL selector;
/// @brief JS 侧函数调用类型
@property (nonatomic, assign, readonly) RCTJavaScriptFunctionKind functionKind;

/// @brief 指定初始化方法
/// @param objCMethodName OC 方法名称，是由 RCT_EXPORT_METHOD(method) 宏导出得到的结果
/// @param JSMethodName JS 侧调用方法名称
/// @param moduleClass module 类型
- (instancetype)initWithObjCMethodName:(NSString *)objCMethodName
                          JSMethodName:(NSString *)JSMethodName
                           moduleClass:(Class)moduleClass NS_DESIGNATED_INITIALIZER;

/// @brief 向 module 实例发送当前方法对应的消息
/// @param bridge RCTBridge 实例
/// @param module module 实例，遵守了 `RCTBridgeModule` 协议的实例
/// @param arguments 参数列表
- (void)invokeWithBridge:(RCTBridge *)bridge
                  module:(id)module
               arguments:(NSArray *)arguments;

@end
