// Copyright 2004-present Facebook. All rights reserved.

#import "RCTRootViewController.h"

#import "RCTBridge.h"
#import "RCTContextExecutor.h"
#import "RCTEventDispatcher.h"
#import "RCTKeyCommands.h"
#import "RCTLog.h"
#import "RCTRedBox.h"
#import "RCTRootView.h"
#import "RCTSourceCode.h"
#import "RCTTouchHandler.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "RCTWebViewExecutor.h"
#import "UIView+ReactKit.h"

@implementation RCTRootViewController
{
  RCTBridge *_bridge;
  RCTTouchHandler *_touchHandler;
  id <RCTJavaScriptExecutor> _executor;
}

static Class _globalExecutorClass;

+ (void)initialize
{

#if DEBUG

  // Register Cmd-R as a global refresh key
  [[RCTKeyCommands sharedInstance] registerKeyCommandWithInput:@"r"
                                                 modifierFlags:UIKeyModifierCommand
                                                        action:^(UIKeyCommand *command) {
                                                          [self reloadAll];
                                                        }];

  // Cmd-D reloads using the web view executor, allows attaching from Safari dev tools in iOS 7.
  [[RCTKeyCommands sharedInstance] registerKeyCommandWithInput:@"d"
                                                 modifierFlags:UIKeyModifierCommand
                                                        action:^(UIKeyCommand *command) {
                                                          _globalExecutorClass = [RCTWebViewExecutor class];
                                                          [self reloadAll];
                                                        }];

#endif

}

- (instancetype)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
  if ((self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil])) {
    // Add reload observer
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(reload)
                                                 name:RCTReloadNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  [_bridge enqueueJSCall:@"ReactIOS.unmountComponentAtNodeAndRemoveContainer"
                    args:@[self.reactRootView.reactTag]];

  // TODO: eventually we'll want to be able to share the bridge between
  // multiple rootviews, in which case we'll need to move this elsewhere
  [_bridge invalidate];
}

- (RCTRootView *)reactRootView
{
  NSAssert([self.view isKindOfClass:[RCTRootView class]],
           @"RCTRootViewController's view must be an RCTRootView");
  return (RCTRootView *)self.view;
}

+ (NSArray *)JSMethods
{
  return @[
    @"AppRegistry.runApplication",
    @"ReactIOS.unmountComponentAtNodeAndRemoveContainer",
  ];
}

#pragma mark - Life Cycle

- (void)loadView
{
  self.view = [[RCTRootView alloc] init];
}

- (void)viewDidLoad
{
  [super viewDidLoad];

  self.view.backgroundColor = [UIColor whiteColor];
}

#pragma mark - Loading JavaScript and Rendering Components

- (void)bundleFinishedLoading:(NSError *)error
{
  if (error != nil) {
    NSArray *stack = [[error userInfo] objectForKey:@"stack"];
    if (stack) {
      [[RCTRedBox sharedInstance] showErrorMessage:[error localizedDescription] withStack:stack];
    } else {
      [[RCTRedBox sharedInstance] showErrorMessage:[error localizedDescription] withDetails:[error localizedFailureReason]];
    }
  } else {
    [_bridge.uiManager registerRootViewController:self];

    NSString *moduleName = _moduleName ?: @"";
    NSDictionary *appParameters = @{
      @"rootTag": self.reactRootView.reactTag,
      @"initialProps": self.initialProperties ?: @{},
    };
    [_bridge enqueueJSCall:@"AppRegistry.runApplication"
                      args:@[moduleName, appParameters]];
  }
}

- (void)loadBundle
{
  // Clear view
  [self.view.subviews makeObjectsPerformSelector:@selector(removeFromSuperview)];

  if (!_scriptURL) {
    return;
  }

  // Clean up
  [self.view removeGestureRecognizer:_touchHandler];
  [_touchHandler invalidate];
  [_executor invalidate];
  [_bridge invalidate];

  // Choose local executor if specified, followed by global, followed by default
  _executor = [[_executorClass ?: _globalExecutorClass ?: [RCTContextExecutor class] alloc] init];
  _bridge = [[RCTBridge alloc] initWithExecutor:_executor moduleProvider:_moduleProvider];
  _touchHandler = [[RCTTouchHandler alloc] initWithBridge:_bridge];
  [self.view addGestureRecognizer:_touchHandler];

  // Load the bundle
  NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithURL:_scriptURL completionHandler:
                                ^(NSData *data, NSURLResponse *response, NSError *error) {

    // Handle general request errors
    if (error) {
      if ([[error domain] isEqualToString:NSURLErrorDomain]) {
        NSDictionary *userInfo = @{
          NSLocalizedDescriptionKey: @"Could not connect to development server. Ensure node server is running - run 'npm start' from ReactKit root",
          NSLocalizedFailureReasonErrorKey: [error localizedDescription],
          NSUnderlyingErrorKey: error,
        };
        error = [NSError errorWithDomain:@"JSServer"
                                    code:error.code
                                userInfo:userInfo];
      }
      [self bundleFinishedLoading:error];
      return;
    }

    // Parse response as text
    NSStringEncoding encoding = NSUTF8StringEncoding;
    if (response.textEncodingName != nil) {
      CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)response.textEncodingName);
      if (cfEncoding != kCFStringEncodingInvalidId) {
        encoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);
      }
    }
    NSString *rawText = [[NSString alloc] initWithData:data encoding:encoding];

    // Handle HTTP errors
    if ([response isKindOfClass:[NSHTTPURLResponse class]] && [(NSHTTPURLResponse *)response statusCode] != 200) {
      NSDictionary *userInfo;
      NSDictionary *errorDetails = RCTJSONParse(rawText, nil);
      if ([errorDetails isKindOfClass:[NSDictionary class]]) {
        userInfo = @{
          NSLocalizedDescriptionKey: errorDetails[@"message"] ?: @"No message provided",
          @"stack": @[@{
            @"methodName": errorDetails[@"description"] ?: @"",
            @"file": errorDetails[@"filename"] ?: @"",
            @"lineNumber": errorDetails[@"lineNumber"] ?: @0
          }]
        };
      } else {
        userInfo = @{NSLocalizedDescriptionKey: rawText};
      }
      error = [NSError errorWithDomain:@"JSServer"
                                  code:[(NSHTTPURLResponse *)response statusCode]
                              userInfo:userInfo];

      [self bundleFinishedLoading:error];
      return;
    }

    // Success!
    RCTSourceCode *sourceCodeModule = _bridge.modules[NSStringFromClass([RCTSourceCode class])];
    sourceCodeModule.scriptURL = _scriptURL;
    sourceCodeModule.scriptText = rawText;

    [_bridge enqueueApplicationScript:rawText url:_scriptURL onComplete:^(NSError *error) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [self bundleFinishedLoading:error];
      });
    }];

  }];

  [task resume];
}

- (void)setScriptURL:(NSURL *)scriptURL
{
  if ([_scriptURL isEqual:scriptURL]) {
    return;
  }

  _scriptURL = scriptURL;
  [self loadBundle];
}

- (void)reload
{
  [self loadBundle];
}

+ (void)reloadAll
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTReloadNotification object:nil];
}

- (void)startOrResetInteractionTiming
{
  [_touchHandler startOrResetInteractionTiming];
}

- (NSDictionary *)endAndResetInteractionTiming
{
  return [_touchHandler endAndResetInteractionTiming];
}

@end
