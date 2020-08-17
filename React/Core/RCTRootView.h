/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>
#import "RCTBridge.h"

/**
 * This notification is sent when the first subviews are added to the root view
 * after the application has loaded. This is used to hide the `loadingView`, and
 * is a good indicator that the application is ready to use.
 */
extern NSString *const RCTContentDidAppearNotification;

/**
 * Native view used to host React-managed views within the app. Can be used just
 * like any ordinary UIView. You can have multiple RCTRootViews on screen at
 * once, all controlled by the same JavaScript application.
 */
@interface RCTRootView : UIView

/**
 * - Designated initializer -
 */
/// @brief 指定初始化方法
/// @param bridge RCTBridge 实例
/// @param moduleName 组件名
/// @return RCTRootView 实例
- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName NS_DESIGNATED_INITIALIZER;

/**
 * - Convenience initializer -
 * A bridge will be created internally.
 * This initializer is intended to be used when the app has a single RCTRootView,
 * otherwise create an `RCTBridge` and pass it in via `initWithBridge:moduleName:`
 * to all the instances.
 */
/// @brief 便捷初始化方法，内部调用 `- [RCTRootView initWithBridge:moduleName:]`
/// @param bundleURL 资源包路径
/// @param moduleName 模块名
/// @param launchOptions 启动参数，一般传递 `- [AppDelegate application:didFinishLaunchingWithOptions:]` 的 launchOptions 参数
/// @return RCTRootView 实例
- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                    launchOptions:(NSDictionary *)launchOptions;

/**
 * The name of the JavaScript module to execute within the
 * specified scriptURL (required). Setting this will not have
 * any immediate effect, but it must be done prior to loading
 * the script.
 */
/// @brief 模块名，要在指定 scriptURL 中执行的 JavaScript 模块的名称
@property (nonatomic, copy, readonly) NSString *moduleName;

/**
 * The bridge used by the root view. Bridges can be shared between multiple
 * root views, so you can use this property to initialize another RCTRootView.
 */
/// @brief RCTRootView 实例使用的 bridge 实例，这个 bridge 可以在多个 rootView
///        之间共享，因此可以外部自己创建并维护 bridge 实例以此来实现共享
@property (nonatomic, strong, readonly) RCTBridge *bridge;

/**
 * The default properties to apply to the view when the script bundle
 * is first loaded. Defaults to nil/empty.
 */
/// @brief 第一次加载脚本包时应用于视图的默认属性，默认为空
@property (nonatomic, copy) NSDictionary *initialProperties;

/**
 * The class of the RCTJavaScriptExecutor to use with this view.
 * If not specified, it will default to using RCTContextExecutor.
 * Changes will take effect next time the bundle is reloaded.
 */
/// @brief 遵守了 `RCTJavaScriptExecutor` 协议的执行器类型，默认类型为 `RCTContextExecutor`
@property (nonatomic, strong) Class executorClass;

/**
 * The backing view controller of the root view.
 */
/// @brief 根视图所属的视图控制器
@property (nonatomic, weak) UIViewController *backingViewController;

/**
 * The React-managed contents view of the root view.
 */
/// @brief rootView 的内容视图
@property (nonatomic, strong, readonly) UIView *contentView;

/**
 * A view to display while the JavaScript is loading, so users aren't presented
 * with a blank screen. By default this is nil, but you can override it with
 * (for example) a UIActivityIndicatorView or a placeholder image.
 */
/// @brief 加载 JavaScript 时显示的 loading 视图，避免加载 JS 时出现页面空白状态
@property (nonatomic, strong) UIView *loadingView;

/**
 * Timings for hiding the loading view after the content has loaded. Both of
 * these values default to 0.25 seconds.
 */
/// @brief loading 视图消失延迟，默认 0.25s
@property (nonatomic, assign) NSTimeInterval loadingViewFadeDelay;
/// @brief loading 视图消失过度时长，默认 0.25s
@property (nonatomic, assign) NSTimeInterval loadingViewFadeDuration;

@end
