//
//  RCTDrawerViewController.m
//  HelloWorld
//
//  Created by Grégoire Van der Auwermeulen on 15.06.23.
//

#import <Foundation/Foundation.h>
#import "RCTDrawerViewController.h"

@implementation RCTDrawerViewController {
  CGRect _lastViewFrame;
}

- (instancetype)init
{
  if (!(self = [super init])) {
    return nil;
  }
  return self;
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];

  if (self.boundsDidChangeBlock && !CGRectEqualToRect(_lastViewFrame, self.view.frame)) {
    self.boundsDidChangeBlock(self.view.bounds);
    _lastViewFrame = self.view.frame;
  }
}

@end
