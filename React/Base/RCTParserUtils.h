/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>

@interface RCTParserUtils : NSObject

/**
 * Generic utility functions for parsing Objective-C source code.
 */
RCT_EXTERN BOOL RCTReadChar(const char **input, char c);
RCT_EXTERN BOOL RCTReadString(const char **input, const char *string);
RCT_EXTERN void RCTSkipWhitespace(const char **input);
RCT_EXTERN BOOL RCTParseIdentifier(const char **input, NSString **string);

/**
 * Parse an Objective-C type into a form that can be used by RCTConvert.
 * This doesn't really belong here, but it's used by both RCTConvert and
 * RCTModuleMethod, which makes it difficult to find a better home for it.
 */
RCT_EXTERN NSString *RCTParseType(const char **input);

@end
