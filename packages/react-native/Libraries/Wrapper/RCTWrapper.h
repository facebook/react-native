/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

#import <RCTWrapper/RCTWrapperView.h>
#import <RCTWrapper/RCTWrapperViewControllerHostingView.h>
#import <RCTWrapper/RCTWrapperViewManager.h>

// Umbrella header with macros

// RCT_WRAPPER_FOR_VIEW
#define RCT_WRAPPER_FOR_VIEW(ClassName)                                                       \
  NS_ASSUME_NONNULL_BEGIN                                                                     \
                                                                                              \
  __attribute__((deprecated("This API will be removed along with the legacy architecture."))) \
  @interface ClassName                                                                        \
  ##Manager : RCTWrapperViewManager                                                           \
                                                                                              \
              @end                                                                            \
                                                                                              \
  NS_ASSUME_NONNULL_END                                                                       \
                                                                                              \
  @implementation ClassName                                                                   \
  ##Manager                                                                                   \
                                                                                              \
      RCT_EXPORT_MODULE()                                                                     \
                                                                                              \
      - (UIView *)view                                                                        \
  {                                                                                           \
    RCTWrapperView *wrapperView = [super view];                                               \
    wrapperView.contentView = [ClassName new];                                                \
    return wrapperView;                                                                       \
  }                                                                                           \
                                                                                              \
  @end

// RCT_WRAPPER_FOR_VIEW_CONTROLLER
#define RCT_WRAPPER_FOR_VIEW_CONTROLLER(ClassName)                                                                     \
                                                                                                                       \
  NS_ASSUME_NONNULL_BEGIN                                                                                              \
                                                                                                                       \
  __attribute__((deprecated("This API will be removed along with the legacy architecture.")))                          \
  @interface ClassName                                                                                                 \
  ##Manager : RCTWrapperViewManager                                                                                    \
                                                                                                                       \
              @end                                                                                                     \
                                                                                                                       \
  NS_ASSUME_NONNULL_END                                                                                                \
                                                                                                                       \
  @implementation ClassName                                                                                            \
  ##Manager                                                                                                            \
                                                                                                                       \
      RCT_EXPORT_MODULE()                                                                                              \
                                                                                                                       \
      - (UIView *)view                                                                                                 \
  {                                                                                                                    \
    RCTWrapperViewControllerHostingView *contentViewControllerHostingView = [RCTWrapperViewControllerHostingView new]; \
    contentViewControllerHostingView.contentViewController = [[ClassName alloc] initWithNibName:nil bundle:nil];       \
    RCTWrapperView *wrapperView = [super view];                                                                        \
    wrapperView.contentView = contentViewControllerHostingView;                                                        \
    return wrapperView;                                                                                                \
  }                                                                                                                    \
                                                                                                                       \
  @end

#endif // RCT_REMOVE_LEGACY_ARCH
