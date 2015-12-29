/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTBundleURLProcessor.h"

@implementation RCTBundleURLProcessor

NSDictionary *_qsAttributes;

+ (id)sharedProcessor
{
  static RCTBundleURLProcessor *sharedProcessor = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedProcessor = [self new];
  });
  return sharedProcessor;
}

- (instancetype)init
{
  // dictionary with additional query string attributes that will get appended
  // to the bundle URL
  _qsAttributes = [NSMutableDictionary new];
  return self;
}

- (NSString *)getQueryStringValue:(NSString *)attribute
{
  return [_qsAttributes valueForKey:attribute];
}

- (void)setQueryStringValue:(NSString *)value forAttribute:(NSString *)attribute
{
  [_qsAttributes setValue:value forKey:attribute];
}

- (NSURL *)process:(NSURL *)url
{
  if (url.isFileURL || [_qsAttributes count] == 0) {
    return url;
  }

  // append either `?` or `&` depending on whether there are query string
  // attibutes or not.
  NSString *urlString = url.absoluteString;
  if ([urlString rangeOfString:@"?"].location == NSNotFound) {
    urlString = [urlString stringByAppendingString:@"?"];
  } else {
    urlString = [urlString stringByAppendingString:@"&"];
  }

  // array with new query string attributes
  NSMutableArray *parts = [NSMutableArray new];
  for (id attribute in _qsAttributes) {
    if ([urlString rangeOfString:[NSString stringWithFormat:@"%@=", attribute]].location != NSNotFound) {
      [NSException raise:@"Cannot override attribute" format:@"Attribute %@ is already present in url: %@", attribute, url.absoluteString];
    }
    [parts addObject:[NSString stringWithFormat:@"%@=%@", attribute, _qsAttributes[attribute]]];
  }

  return [NSURL URLWithString:[NSString stringWithFormat:@"%@%@", urlString, [parts componentsJoinedByString:@"&"]]];
}

@end
