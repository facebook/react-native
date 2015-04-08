/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "../Base/RCTBridgeModule.h"
#import "../Base/RCTConvert.h"
#import "../Base/RCTLog.h"

@class RCTBridge;
@class RCTEventDispatcher;
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
@property (nonatomic, strong) RCTBridge *bridge;

/**
 * The module name exposed to React JS. If omitted, this will be inferred
 * automatically by using the view module's class name. It is better to not
 * override this, and just follow standard naming conventions for your view
 * module subclasses.
 */
+ (NSString *)moduleName;

/**
 * This method instantiates a native view to be managed by the module. Override
 * this to return a custom view instance, which may be preconfigured with default
 * properties, subviews, etc. This method will be called many times, and should
 * return a fresh instance each time. The view module MUST NOT cache the returned
 * view and return the same instance for subsequent calls.
 */
- (UIView *)view;

/**
 * This method instantiates a shadow view to be managed by the module. If omitted,
 * an ordinary RCTShadowView instance will be created, which is typically fine for
 * most view types. As with the -view method, the -shadowView method should return
 * a fresh instance each time it is called.
 */
- (RCTShadowView *)shadowView;

/**
 * Returns a dictionary of config data passed to JS that defines eligible events
 * that can be placed on native views. This should return bubbling
 * directly-dispatched event types and specify what names should be used to
 * subscribe to either form (bubbling/capturing).
 *
 * Returned dictionary should be of the form: @{
 *   @"onTwirl": {
 *     @"phasedRegistrationNames": @{
 *       @"bubbled": @"onTwirl",
 *       @"captured": @"onTwirlCaptured"
 *     }
 *   }
 * }
 *
 * Note that this method is not inherited when you subclass a view module, and
 * you should not call [super customBubblingEventTypes] when overriding it.
 */
- (NSDictionary *)customBubblingEventTypes;

/**
 * Returns a dictionary of config data passed to JS that defines eligible events
 * that can be placed on native views. This should return non-bubbling
 * directly-dispatched event types.
 *
 * Returned dictionary should be of the form: @{
 *   @"onTwirl": {
 *     @"registrationName": @"onTwirl"
 *   }
 * }
 *
 * Note that this method is not inherited when you subclass a view module, and
 * you should not call [super customDirectEventTypes] when overriding it.
 */
- (NSDictionary *)customDirectEventTypes;

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
#define RCT_EXPORT_VIEW_PROPERTY(name, type) RCT_REMAP_VIEW_PROPERTY(name, name, type)

#define RCT_EXPORT_SHADOW_PROPERTY(name, type) RCT_REMAP_SHADOW_PROPERTY(name, name, type)

/**
 * This macro maps a named property on the module to an arbitrary key path
 * within the view or shadowView.
 */
#define RCT_REMAP_VIEW_PROPERTY(name, keyPath, type)                           \
- (void)set_##name:(id)json forView:(id)view withDefaultView:(id)defaultView { \
  if ((json && !RCTSetProperty(view, @#keyPath, @selector(type:), json)) ||    \
      (!json && !RCTCopyProperty(view, defaultView, @#keyPath))) {             \
    RCTLogError(@"%@ does not have setter for `%s` property", [view class], #name); \
  } \
}

#define RCT_REMAP_SHADOW_PROPERTY(name, keyPath, type)                         \
- (void)set_##name:(id)json forShadowView:(id)view withDefaultView:(id)defaultView { \
  if ((json && !RCTSetProperty(view, @#keyPath, @selector(type:), json)) ||    \
      (!json && !RCTCopyProperty(view, defaultView, @#keyPath))) {             \
    RCTLogError(@"%@ does not have setter for `%s` property", [view class], #name); \
  } \
}

/**
 * These macros can be used when you need to provide custom logic for setting
 * view properties. The macro should be followed by a method body, which can
 * refer to "json", "view" and "defaultView" to implement the required logic.
 */
#define RCT_CUSTOM_VIEW_PROPERTY(name, type, viewClass) \
- (void)set_##name:(id)json forView:(viewClass *)view withDefaultView:(viewClass *)defaultView

#define RCT_CUSTOM_SHADOW_PROPERTY(name, type, viewClass) \
- (void)set_##name:(id)json forShadowView:(viewClass *)view withDefaultView:(viewClass *)defaultView

/**
 * These are useful in cases where the module's superclass handles a
 * property, but you wish to "unhandle" it, so it will be ignored.
 */
#define RCT_IGNORE_VIEW_PROPERTY(name) \
- (void)set_##name:(id)value forView:(id)view withDefaultView:(id)defaultView {}

#define RCT_IGNORE_SHADOW_PROPERTY(name) \
- (void)set_##name:(id)value forShadowView:(id)view withDefaultView:(id)defaultView {}

/**
 * Used for when view property names change. Will log an error when used.
 */
#define RCT_DEPRECATED_VIEW_PROPERTY(oldName, newName) \
- (void)set_##oldName:(id)json forView:(id)view withDefaultView:(id)defaultView { \
  RCTLogError(@"Property '%s' has been replaced by '%s'.", #oldName, #newName); \
  [self set_##newName:json forView:view withDefaultView:defaultView]; \
}

#define RCT_DEPRECATED_SHADOW_PROPERTY(oldName, newName) \
- (void)set_##oldName:(id)json forShadowView:(id)view withDefaultView:(id)defaultView { \
  RCTLogError(@"Property '%s' has been replaced by '%s'.", #oldName, #newName); \
  [self set_##newName:json forView:view withDefaultView:defaultView]; \
}

@end
