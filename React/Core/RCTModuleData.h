/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>
#import "RCTJavaScriptExecutor.h"

@class RCTModuleMethod;

/// @class RCTModuleData
/// @brief 每一个 module 最终都会生成一个对应的 RCTModuleData 实例对象，在 RCTBatchedBridge 中遍历生成
@interface RCTModuleData : NSObject

/// @brief javaScript 语句执行器
@property (nonatomic, weak, readonly) id<RCTJavaScriptExecutor> javaScriptExecutor;
/// @brief RCTModuleData 实例的唯一标识，以在 `RCTBatchedBridge` 中数组 `_moduleDataByID` 中的位置作为 uid
@property (nonatomic, strong, readonly) NSNumber *uid;
/// @brief 实现了 `RCTBridgeModule` 协议的实例对象，即 OC 侧的具体实现，如创建的 `RCTAlertManager` 类的实例
@property (nonatomic, strong, readonly) id<RCTBridgeModule> instance;

/// @brief 当前类的属性 `instance` 的 `Class`
@property (nonatomic, strong, readonly) Class moduleClass;
/// @brief module 的名称，由 C 函数 `NSString *RCTBridgeModuleNameForClass(Class cls)` 导出
@property (nonatomic, copy, readonly) NSString *name;
/// @brief 当前 module下 导出的方法列表，方法相关信息在 `RCTModuleMethod` 实例当中
@property (nonatomic, copy, readonly) NSArray<RCTModuleMethod *> *methods;
/// @brief 最终向 JS 注入的配置信息，存储内容如下：
///   moduleID    int   uid 属性
///   constants   map   定义的一些常量
///   methods     map   key: JSMethodName, value: {"methodID": xxx, "type": xxx}
@property (nonatomic, copy, readonly) NSDictionary *config;

/// @brief 所有导出方法的最终执行队列，通过 `RCTBridgeModule` 协议中的 `- methodQueue` 方法获取到的队列
///        这里一定是串行队列，执行导出的方法时异步执行，以此来保证每个 module 内部的通信事件是串行顺序的
@property (nonatomic, strong) dispatch_queue_t queue;

/// @brief 指定初始化方法
/// @param javaScriptExecutor javaScript 语句执行器
/// @param uid RCTModuleData 实例的唯一标识
/// @param instance 实现了 `RCTBridgeModule` 协议的实例对象（OC 侧的具体实现）
/// @return RCTModuleData 实例
- (instancetype)initWithExecutor:(id<RCTJavaScriptExecutor>)javaScriptExecutor
                             uid:(NSNumber *)uid
                        instance:(id<RCTBridgeModule>)instance NS_DESIGNATED_INITIALIZER;

/// @brief 执行 block
/// @param block 要执行的 block
- (void)dispatchBlock:(dispatch_block_t)block;

/// @brief 执行 block
/// @param block 要执行的 block
/// @param group 执行 block 的 group
- (void)dispatchBlock:(dispatch_block_t)block dispatchGroup:(dispatch_group_t)group;

@end
