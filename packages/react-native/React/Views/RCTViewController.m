//
//  RCTViewController.m
//  React-Core
//
//  Created by Hanno Goedecke on 27.04.26.
//

#import "RCTViewController.h"
#import <React/UIViewController+React.h>

@interface RCTViewController ()

@end

@implementation RCTViewController

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  [self reactNotifyViewControllerDidAppear:animated];
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  [self reactNotifyViewControllerDidDisappear:animated];
}

@end
