// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTSourceCode.h"

#import "RCTAssert.h"
#import "RCTUtils.h"

@implementation RCTSourceCode

- (void)getScriptText:(RCTResponseSenderBlock)successCallback failureCallback:(RCTResponseSenderBlock)failureCallback
{
  RCT_EXPORT();
  if (self.scriptText && self.scriptURL) {
    successCallback(@[@{@"text": self.scriptText, @"url":[self.scriptURL absoluteString]}]);
  } else {
    failureCallback(@[RCTMakeError(@"Source code is not available", nil, nil)]);
  }

}

@end
