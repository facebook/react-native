/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTComponentEvent.h>

/**
 * Represents a focus change event meaning that a view that can become first responder has become or resigned being first responder.
 */
@interface RCTFocusChangeEvent : RCTComponentEvent

+ (instancetype)focusEventWithReactTag:(NSNumber *)reactTag;
+ (instancetype)blurEventWithReactTag:(NSNumber *)reactTag;

@end
