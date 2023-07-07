/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// [macOS]

#if TARGET_OS_OSX
#import <React/RCTConvert.h>

// This class is used for specifying key filtering e.g. for -[RCTView validKeysDown] and -[RCTView validKeysUp]
// Also see RCTViewKeyboardEvent, which is a React representation of an actual NSEvent that is dispatched to JS.
@interface RCTHandledKey : NSObject

+ (BOOL)event:(NSEvent *)event matchesFilter:(NSArray<RCTHandledKey *> *)filter;
+ (BOOL)key:(NSString *)key matchesFilter:(NSArray<RCTHandledKey *> *)filter;

- (instancetype)initWithKey:(NSString *)key;
- (BOOL)matchesEvent:(NSEvent *)event;

@property (nonatomic, copy) NSString *key;

// For the following modifiers, nil means we don't care about the presence of the modifier when filtering the key
// They are still expected to be only boolean when not nil.
@property (nonatomic, assign) NSNumber *altKey;
@property (nonatomic, assign) NSNumber *ctrlKey;
@property (nonatomic, assign) NSNumber *metaKey;
@property (nonatomic, assign) NSNumber *shiftKey;

@end

@interface RCTConvert (RCTHandledKey)

+ (RCTHandledKey *)RCTHandledKey:(id)json;

@end

#endif
