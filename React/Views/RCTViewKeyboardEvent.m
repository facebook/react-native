/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewKeyboardEvent.h"
#import <React/RCTAssert.h>

@implementation RCTViewKeyboardEvent
// Keyboard mappings are aligned cross-platform as much as possible as per this doc https://github.com/microsoft/react-native-windows/blob/master/vnext/proposals/active/keyboard-reconcile-desktop.md
+ (instancetype)keyDownEventWithReactTag:(NSNumber *)reactTag
                             capsLockKey:(BOOL)capsLockKey
                                shiftKey:(BOOL)shiftKey
                                 ctrlKey:(BOOL)controlKey
                                  altKey:(BOOL)optionKey
                                 metaKey:(BOOL)commandKey
                           numericPadKey:(BOOL)numericPadKey
                                 helpKey:(BOOL)helpKey
                             functionKey:(BOOL)functionKey
                            leftArrowKey:(BOOL)leftArrowKey
                           rightArrowKey:(BOOL)rightArrowKey
                              upArrowKey:(BOOL)upArrowKey
                            downArrowKey:(BOOL)downArrowKey
                                     key:(NSString *)key {
  RCTViewKeyboardEvent *event = [[self alloc] initWithName:@"keyDown"
                                                  viewTag:reactTag
                                                     body:@{ @"capsLockKey" : @(capsLockKey),
                                                                @"shiftKey" : @(shiftKey),
                                                                 @"ctrlKey" : @(controlKey),
                                                                  @"altKey" : @(optionKey),
                                                                 @"metaKey" : @(commandKey),
                                                           @"numericPadKey" : @(numericPadKey),
                                                                 @"helpKey" : @(helpKey),
                                                             @"functionKey" : @(functionKey),
                                                               @"ArrowLeft" : @(leftArrowKey),
                                                              @"ArrowRight" : @(rightArrowKey),
                                                                 @"ArrowUp" : @(upArrowKey),
                                                               @"ArrowDown" : @(downArrowKey),
                                                                     @"key" : key }];
  return event;
}

+(instancetype)keyUpEventWithReactTag:(NSNumber *)reactTag
                          capsLockKey:(BOOL)capsLockKey
                             shiftKey:(BOOL)shiftKey
                              ctrlKey:(BOOL)controlKey
                               altKey:(BOOL)optionKey
                              metaKey:(BOOL)commandKey
                        numericPadKey:(BOOL)numericPadKey
                              helpKey:(BOOL)helpKey
                          functionKey:(BOOL)functionKey
                         leftArrowKey:(BOOL)leftArrowKey
                        rightArrowKey:(BOOL)rightArrowKey
                           upArrowKey:(BOOL)upArrowKey
                         downArrowKey:(BOOL)downArrowKey
                                   key:(NSString *)key {
  RCTViewKeyboardEvent *event = [[self alloc] initWithName:@"keyUp"
                                                  viewTag:reactTag
                                                     body:@{ @"capsLockKey" : @(capsLockKey),
                                                                @"shiftKey" : @(shiftKey),
                                                                 @"ctrlKey" : @(controlKey),
                                                                  @"altKey" : @(optionKey),
                                                                 @"metaKey" : @(commandKey),
                                                           @"numericPadKey" : @(numericPadKey),
                                                                 @"helpKey" : @(helpKey),
                                                             @"functionKey" : @(functionKey),
                                                               @"ArrowLeft" : @(leftArrowKey),
                                                              @"ArrowRight" : @(rightArrowKey),
                                                                 @"ArrowUp" : @(upArrowKey),
                                                               @"ArrowDown" : @(downArrowKey),
                                                                     @"key" : key }];
  return event;
}

@end
