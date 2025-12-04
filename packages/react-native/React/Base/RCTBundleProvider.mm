/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBundleProvider.h"

using namespace facebook::react;

@implementation RCTBundleProvider{
  std::shared_ptr<const JSBigString> _bundle;
  NSString *_sourceURL;
}

- (std::shared_ptr<const JSBigString>)getBundle {
  return _bundle;
}

- (void)setBundle:(std::shared_ptr<const JSBigString>)bundle {
  _bundle = bundle;
}

- (NSString *)getSourceURL {
  return _sourceURL;
}

- (void)setSourceURL:(NSString *)sourceURL {
  _sourceURL = sourceURL;
}
@end
