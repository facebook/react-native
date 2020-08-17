/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTBridgeModule.h"
#import "RCTDefines.h"
#import "RCTFrameUpdate.h"
#import "RCTInvalidating.h"
#import "RCTJavaScriptExecutor.h"

@class RCTBridge;
@class RCTEventDispatcher;

/**
 * This notification triggers a reload of all bridges currently running.
 */
RCT_EXTERN NSString *const RCTReloadNotification;

/**
 * This notification fires when the bridge has finished loading.
 */
RCT_EXTERN NSString *const RCTJavaScriptDidLoadNotification;

/**
 * This notification fires when the bridge failed to load.
 */
RCT_EXTERN NSString *const RCTJavaScriptDidFailToLoadNotification;

/**
 * This notification fires when the bridge created all registered native modules
 */
RCT_EXTERN NSString *const RCTDidCreateNativeModules;

/**
 * This block can be used to instantiate modules that require additional
 * init parameters, or additional configuration prior to being used.
 * The bridge will call this block to instatiate the modules, and will
 * be responsible for invalidating/releasing them when the bridge is destroyed.
 * For this reason, the block should always return new module instances, and
 * module instances should not be shared between bridges.
 */
typedef NSArray *(^RCTBridgeModuleProviderBlock)(void);

/**
 * Register the given class as a bridge module. All modules must be registered
 * prior to the first bridge initialization.
 *
 */
/// @brief 将给定的类注册为桥接模块，所有模块必须在第一个网桥初始化之前注册（module 导出宏
///        `RCT_EXPORT_MODULE` 的最终调用函数实现），所有导出的模块类最终都存储在静态数组
///        `RCTModuleClasses` 中
RCT_EXTERN void RCTRegisterModule(Class);

/**
 * This function returns the module name for a given class.
 */
/// @brief 这个函数返回给定的 module 类型的模块名
RCT_EXTERN NSString *RCTBridgeModuleNameForClass(Class bridgeModuleClass);

/**
 * Async batched bridge used to communicate with the JavaScript application.
 */
/// @class RCTBridge
/// @brief 用于与 JS 通信的异步批处理桥接对象
@interface RCTBridge : NSObject <RCTInvalidating>

/**
 * The designated initializer. This creates a new bridge on top of the specified
 * executor. The bridge should then be used for all subsequent communication
 * with the JavaScript code running in the executor. Modules will be automatically
 * instantiated using the default contructor, but you can optionally pass in an
 * array of pre-initialized module instances if they require additional init
 * parameters or configuration.
 */
/// @brief 指定初始化方法
/// @param bundleURL 资源包路径
/// @param block 返回值为预先初始化的 module 的数组集合，提前初始化完成一些 module 模块，在 `RCTBatchedBridge.m` 文件中的 `registerModules` 方法中用到
/// @param launchOptions 启动参数，一般传递 `- [AppDelegate application:didFinishLaunchingWithOptions:]` 的 launchOptions 参数
- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   moduleProvider:(RCTBridgeModuleProviderBlock)block
                    launchOptions:(NSDictionary *)launchOptions NS_DESIGNATED_INITIALIZER;

/**
 * This method is used to call functions in the JavaScript application context.
 * It is primarily intended for use by modules that require two-way communication
 * with the JavaScript code. Safe to call from any thread.
 */
/// @brief [ Native call JS ] 在 JSCore 环境中执行 JS 方法
/// @param moduleDotMethod eg: "XXXModule.XXXMethod" 模块及方法
/// @param args 参数列表
- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args;

/**
 * DEPRECATED: Do not use.
 */
#define RCT_IMPORT_METHOD(module, method) \
  _Pragma("message(\"This macro is no longer required\")")

/**
 * URL of the script that was loaded into the bridge.
 */
/// @brief 脚本资源包路径
@property (nonatomic, copy) NSURL *bundleURL;
/// @brief 在子类 `RCTBatchedBridge` 类中默认为 `RCTContextExecutor` 类型
@property (nonatomic, strong) Class executorClass;

/**
 * The event dispatcher is a wrapper around -enqueueJSCall:args: that provides a
 * higher-level interface for sending UI events such as touches and text input.
 *
 * NOTE: RCTEventDispatcher is now a bridge module, this is implemented as a
 * category but remains declared in the bridge to avoid breaking changes
 *
 * To be moved.
 */
/// @brief 事件分发器
@property (nonatomic, readonly) RCTEventDispatcher *eventDispatcher;

/**
 * A dictionary of all registered RCTBridgeModule instances, keyed by moduleName.
 */
/// @brief 所有已注册 `RCTBridgeModule` 实例的字典，键为相应的 `moduleName`
@property (nonatomic, copy, readonly) NSDictionary *modules;

/**
 * The launch options that were used to initialize the bridge.
 */
/// @brief 用于初始化桥接的启动选项
@property (nonatomic, copy, readonly) NSDictionary *launchOptions;

/**
 * Use this to check if the bridge is currently loading.
 */
/// @brief 用来检查 bridge 是否正在加载
@property (nonatomic, readonly, getter=isLoading) BOOL loading;

/**
 * The block passed in the constructor with pre-initialized modules
 */
/// @brief 返回值为预先初始化的 module 的数组集合，提前初始化完成一些 module 模块，在 `RCTBatchedBridge.m` 文件中的 `registerModules` 方法中用到
@property (nonatomic, copy, readonly) RCTBridgeModuleProviderBlock moduleProvider;

/**
 * Reload the bundle and reset executor & modules. Safe to call from any thread.
 */
/// @brief 重新加载 bundle 并重置执行器和模块，可以安全地从任何线程调用
- (void)reload;

@end
