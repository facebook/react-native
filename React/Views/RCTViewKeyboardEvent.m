/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewKeyboardEvent.h"
#import <React/RCTAssert.h>

@implementation RCTViewKeyboardEvent

+ (instancetype)keyDownEventWithReactTag:(NSNumber *)reactTag
                             capsLockKey:(BOOL)capsLockKey
                                shiftKey:(BOOL)shiftKey
                              controlKey:(BOOL)controlKey
                               optionKey:(BOOL)optionKey
                              commandKey:(BOOL)commandKey
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
                                                              @"controlKey" : @(controlKey),
                                                               @"optionKey" : @(optionKey),
                                                              @"commandKey" : @(commandKey),
                                                           @"numericPadKey" : @(numericPadKey),
                                                                 @"helpKey" : @(helpKey),
                                                             @"functionKey" : @(functionKey),
                                                            @"leftArrowKey" : @(leftArrowKey),
                                                           @"rightArrowKey" : @(rightArrowKey),
                                                              @"upArrowKey" : @(upArrowKey),
                                                            @"downArrowKey" : @(downArrowKey),
                                                                     @"key" : key }];
  return event;
}

+(instancetype)keyUpEventWithReactTag:(NSNumber *)reactTag
                          capsLockKey:(BOOL)capsLockKey
                             shiftKey:(BOOL)shiftKey
                           controlKey:(BOOL)controlKey
                            optionKey:(BOOL)optionKey
                           commandKey:(BOOL)commandKey
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
                                                              @"controlKey" : @(controlKey),
                                                               @"optionKey" : @(optionKey),
                                                              @"commandKey" : @(commandKey),
                                                           @"numericPadKey" : @(numericPadKey),
                                                                 @"helpKey" : @(helpKey),
                                                             @"functionKey" : @(functionKey),
                                                            @"leftArrowKey" : @(leftArrowKey),
                                                           @"rightArrowKey" : @(rightArrowKey),
                                                              @"upArrowKey" : @(upArrowKey),
                                                            @"downArrowKey" : @(downArrowKey),
                                                                     @"key" : key }];
  return event;
}

@end
