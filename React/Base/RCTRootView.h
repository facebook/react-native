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
- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties NS_DESIGNATED_INITIALIZER;

/**
 * - Convenience initializer -
 * A bridge will be created internally.
 * This initializer is intended to be used when the app has a single RCTRootView,
 * otherwise create an `RCTBridge` and pass it in via `initWithBridge:moduleName:`
 * to all the instances.
 */
- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions;

/**
 * The name of the JavaScript module to execute within the
 * specified scriptURL (required). Setting this will not have
 * any immediate effect, but it must be done prior to loading
 * the script.
 */
@property (nonatomic, copy, readonly) NSString *moduleName;

/**
 * The bridge used by the root view. Bridges can be shared between multiple
 * root views, so you can use this property to initialize another RCTRootView.
 */
@property (nonatomic, strong, readonly) RCTBridge *bridge;

/**
 * The default properties to apply to the view when the script bundle
 * is first loaded. Defaults to nil/empty.
 */
@property (nonatomic, copy, readonly) NSDictionary *initialProperties;

/**
 * The class of the RCTJavaScriptExecutor to use with this view.
 * If not specified, it will default to using RCTContextExecutor.
 * Changes will take effect next time the bundle is reloaded.
 */
@property (nonatomic, strong) Class executorClass;

/**
 * The backing view controller of the root view.
 */
@property (nonatomic, weak) UIViewController *reactViewController;

/**
 * The React-managed contents view of the root view.
 */
@property (nonatomic, strong, readonly) UIView *contentView;

/**
 * A view to display while the JavaScript is loading, so users aren't presented
 * with a blank screen. By default this is nil, but you can override it with
 * (for example) a UIActivityIndicatorView or a placeholder image.
 */
@property (nonatomic, strong) UIView *loadingView;

/**
 * Timings for hiding the loading view after the content has loaded. Both of
 * these values default to 0.25 seconds.
 */
@property (nonatomic, assign) NSTimeInterval loadingViewFadeDelay;
@property (nonatomic, assign) NSTimeInterval loadingViewFadeDuration;

@end
