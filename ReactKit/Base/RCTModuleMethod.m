// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTModuleMethod.h"

@implementation RCTModuleMethod

- (instancetype)initWithSelector:(SEL)selector
                    JSMethodName:(NSString *)JSMethodName
                           arity:(NSUInteger)arity
            blockArgumentIndexes:(NSIndexSet *)blockArgumentIndexes
{
  if ((self = [super init])) {
    _selector = selector;
    _JSMethodName = [JSMethodName copy];
    _arity = arity;
    _blockArgumentIndexes = [blockArgumentIndexes copy];
  }
  return self;
}

- (NSString *)description
{
  NSString *blocks = @"no block args";
  if (self.blockArgumentIndexes.count > 0) {
    NSMutableString *indexString = [NSMutableString string];
    [self.blockArgumentIndexes enumerateIndexesUsingBlock:^(NSUInteger idx, BOOL *stop) {
      [indexString appendFormat:@", %tu", idx];
    }];
    blocks = [NSString stringWithFormat:@"block args at %@", [indexString substringFromIndex:2]];
  }

  return [NSString stringWithFormat:@"<%@: %p; exports -%@ as %@; %@>", NSStringFromClass(self.class), self, NSStringFromSelector(self.selector), self.JSMethodName, blocks];
}

@end
