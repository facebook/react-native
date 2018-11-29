/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTParserUtils.h"

#import "RCTLog.h"

@implementation RCTParserUtils

BOOL RCTReadChar(const char **input, char c)
{
  if (**input == c) {
    (*input)++;
    return YES;
  }
  return NO;
}

BOOL RCTReadString(const char **input, const char *string)
{
  int i;
  for (i = 0; string[i] != 0; i++) {
    if (string[i] != (*input)[i]) {
      return NO;
    }
  }
  *input += i;
  return YES;
}

void RCTSkipWhitespace(const char **input)
{
  while (isspace(**input)) {
    (*input)++;
  }
}

static BOOL RCTIsIdentifierHead(const char c)
{
  return isalpha(c) || c == '_';
}

static BOOL RCTIsIdentifierTail(const char c)
{
  return isalnum(c) || c == '_';
}

BOOL RCTParseArgumentIdentifier(const char **input, NSString **string)
{
  const char *start = *input;

  do {
    if (!RCTIsIdentifierHead(**input)) {
      return NO;
    }
    (*input)++;

    while (RCTIsIdentifierTail(**input)) {
      (*input)++;
    }

  // allow namespace resolution operator
  } while (RCTReadString(input, "::"));

  if (string) {
    *string = [[NSString alloc] initWithBytes:start
                                       length:(NSInteger)(*input - start)
                                     encoding:NSASCIIStringEncoding];
  }
  return YES;
}

BOOL RCTParseSelectorIdentifier(const char **input, NSString **string)
{
  const char *start = *input;
  if (!RCTIsIdentifierHead(**input)) {
    return NO;
  }
  (*input)++;
  while (RCTIsIdentifierTail(**input)) {
    (*input)++;
  }
  if (string) {
    *string = [[NSString alloc] initWithBytes:start
                                       length:(NSInteger)(*input - start)
                                     encoding:NSASCIIStringEncoding];
  }
  return YES;
}

static BOOL RCTIsCollectionType(NSString *type)
{
  static NSSet *collectionTypes;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    collectionTypes = [[NSSet alloc] initWithObjects:
                       @"NSArray", @"NSSet", @"NSDictionary", nil];
  });
  return [collectionTypes containsObject:type];
}

NSString *RCTParseType(const char **input)
{
  NSString *type;
  RCTParseArgumentIdentifier(input, &type);
  RCTSkipWhitespace(input);
  if (RCTReadChar(input, '<')) {
    RCTSkipWhitespace(input);
    NSString *subtype = RCTParseType(input);
    if (RCTIsCollectionType(type)) {
      if ([type isEqualToString:@"NSDictionary"]) {
        // Dictionaries have both a key *and* value type, but the key type has
        // to be a string for JSON, so we only care about the value type
        if (RCT_DEBUG && ![subtype isEqualToString:@"NSString"]) {
          RCTLogError(@"%@ is not a valid key type for a JSON dictionary", subtype);
        }
        RCTSkipWhitespace(input);
        RCTReadChar(input, ',');
        RCTSkipWhitespace(input);
        subtype = RCTParseType(input);
      }
      if (![subtype isEqualToString:@"id"]) {
        type = [type stringByReplacingCharactersInRange:(NSRange){0, 2 /* "NS" */}
                                             withString:subtype];
      }
    } else {
      // It's a protocol rather than a generic collection - ignore it
    }
    RCTSkipWhitespace(input);
    RCTReadChar(input, '>');
  }
  RCTSkipWhitespace(input);
  if (!RCTReadChar(input, '*')) {
    RCTReadChar(input, '&');
  }
  return type;
}

@end
