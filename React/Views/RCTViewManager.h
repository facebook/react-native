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
#import "RCTConvert.h"
#import "RCTComponent.h"
#import "RCTDefines.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"

@class RCTBridge;
@class RCTShadowView;
@class RCTSparseArray;
@class RCTUIManager;

typedef void (^RCTViewManagerUIBlock)(RCTUIManager *uiManager, RCTSparseArray *viewRegistry);

@interface RCTViewManager : NSObject <RCTBridgeModule>

/**
 * The bridge can be used to access both the RCTUIIManager and the RCTEventDispatcher,
 * allowing the manager (or the views that it manages) to manipulate the view
 * hierarchy and send events back to the JS context.
 */
@property (nonatomic, weak) RCTBridge *bridge;

/**
 * This method instantiates a native view to be managed by the module. Override
 * this to return a custom view instance, which may be preconfigured with default
 * properties, subviews, etc. This method will be called many times, and should
 * return a fresh instance each time. The view module MUST NOT cache the returned
 * view and return the same instance for subsequent calls.
 */
- (UIView<RCTComponent> *)view;

/**
 * This method instantiates a native view using the props passed into the component.
 * This method should be used when you need to know about specific props in order to
 * initialize a view. By default, this just calls the -view method. Each prop will
 * still be set individually, after the view is created. Like the -view method,
 * -viewWithProps: should return a fresh instance each time it is called.
 */
- (UIView *)viewWithProps:(NSDictionary *)props;

/**
 * This method instantiates a shadow view to be managed by the module. If omitted,
 * an ordinary RCTShadowView instance will be created, which is typically fine for
 * most view types. As with the -view method, the -shadowView method should return
 * a fresh instance each time it is called.
 */
- (RCTShadowView *)shadowView;

/**
 * DEPRECATED: declare properties of type RCTBubblingEventBlock instead
 *
 * Returns an array of names of events that can be sent by native views. This
 * should return bubbling, directly-dispatched event types. The event name
 * should not include a prefix such as 'on' or 'top', as this will be applied
 * as needed. When subscribing to the event, use the 'Captured' suffix to
 * indicate the captured form, or omit the suffix for the bubbling form.
 *
 * Note that this method is not inherited when you subclass a view module, and
 * you should not call [super customBubblingEventTypes] when overriding it.
 */
- (NSArray *)customBubblingEventTypes;

/**
 * DEPRECATED: declare properties of type RCTDirectEventBlock instead
 *
 * Returns an array of names of events that can be sent by native views. This
 * should return non-bubbling, directly-dispatched event types. The event name
 * should not include a prefix such as 'on' or 'top', as this will be applied
 * as needed.
 *
 * Note that this method is not inherited when you subclass a view module, and
 * you should not call [super customDirectEventTypes] when overriding it.
 */
- (NSArray *)customDirectEventTypes;

/**
 * Called to notify manager that layout has finished, in case any calculated
 * properties need to be copied over from shadow view to view.
 */
- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(RCTShadowView *)shadowView;

/**
 * Called after view hierarchy manipulation has finished, and all shadow props
 * have been set, but before layout has been performed. Useful for performing
 * custo  layout logic or tasks that involve walking the view hierarchy.
 * To be deprecated, hopefully.
 */
- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(RCTSparseArray *)shadowViewRegistry;

/**
 * This handles the simple case, where JS and native property names match.
 */
#define RCT_EXPORT_VIEW_PROPERTY(name, type) \
+ (NSArray *)propConfig_##name { return @[@#type]; }

/**
 * This macro maps a named property to an arbitrary key path in the view.
 */
#define RCT_REMAP_VIEW_PROPERTY(name, keyPath, type) \
+ (NSArray *)propConfig_##name { return @[@#type, @#keyPath]; }

/**
 * This macro can be used when you need to provide custom logic for setting
 * view properties. The macro should be followed by a method body, which can
 * refer to "json", "view" and "defaultView" to implement the required logic.
 */
#define RCT_CUSTOM_VIEW_PROPERTY(name, type, viewClass) \
RCT_REMAP_VIEW_PROPERTY(name, __custom__, type)         \
- (void)set_##name:(id)json forView:(viewClass *)view withDefaultView:(viewClass *)defaultView

/**
 * This macro is used to map properties to the shadow view, instead of the view.
 */
#define RCT_EXPORT_SHADOW_PROPERTY(name, type) \
+ (NSArray *)propConfigShadow_##name { return @[@#type]; }

@end
