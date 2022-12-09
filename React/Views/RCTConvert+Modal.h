/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTConvert.h>

@interface RCTConvert (Modal)

+ (UISheetPresentationControllerDetent *)UISheetPresentationControllerDetent:(id)json API_AVAILABLE(ios(15.0));
+ (NSArray<UISheetPresentationControllerDetent *> *)UISheetPresentationControllerDetentArray:(id)json API_AVAILABLE(ios(15.0));

@end
