/*
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

#import <XCTest/XCTest.h>

#import <mach/mach.h>

#import <RCTTest/RCTTestRunner.h>
#import <React/RCTBridge.h>

typedef struct {
  mach_vm_size_t mean;
  double standardDeviation;
} Mean;

Mean calculateMean(mach_vm_size_t *measurements, int count);
NSString *tableRow(NSString *name, mach_vm_size_t *measurements, int count, NSNumberFormatter *numberFormatter);

mach_vm_size_t memoryFootprint(void);

@interface RCTMemoryFootprintTests : XCTestCase <RCTBridgeDelegate> {
  RCTBridge *_bridge;
  mach_vm_size_t _memoryFootprintInitial;
  mach_vm_size_t _memoryFootprintStartLoadJavaScript;
  mach_vm_size_t _memoryFootprintStartExecuteJavaScript;
  mach_vm_size_t _memoryFootprintWhenDone;
}
@end

@implementation RCTMemoryFootprintTests

- (void)setUp
{
  NSNotificationCenter *notificationCenter = NSNotificationCenter.defaultCenter;
  [notificationCenter addObserver:self
                         selector:@selector(javaScriptWillStartLoading:)
                             name:RCTJavaScriptWillStartLoadingNotification
                           object:nil];
  [notificationCenter addObserver:self
                         selector:@selector(javaScriptWillStartExecuting:)
                             name:RCTJavaScriptWillStartExecutingNotification
                           object:nil];
  [notificationCenter addObserver:self
                         selector:@selector(javaScriptDidLoad:)
                             name:RCTJavaScriptDidLoadNotification
                           object:nil];
}

- (void)tearDown
{
  [NSNotificationCenter.defaultCenter removeObserver:self];
}

- (void)testStartupPerformance
{
  const int numRuns = 10;

  mach_vm_size_t startLoadJavaScriptUsage[numRuns];
  mach_vm_size_t startExecuteJavaScriptUsage[numRuns];
  mach_vm_size_t whenDoneUsage[numRuns];

  for (int i = 0; i < numRuns; ++i) {
    _memoryFootprintInitial = memoryFootprint();
    _memoryFootprintStartLoadJavaScript = 0;
    _memoryFootprintStartExecuteJavaScript = 0;
    _memoryFootprintWhenDone = 0;

    @autoreleasepool {
      RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:nil];
      RCT_RUN_RUNLOOP_WHILE(_memoryFootprintWhenDone == 0);
      [bridge invalidate];
      bridge = nil;
    }

    // Wait for RCTBridge to finish :(
    CFRunLoopRunInMode(kCFRunLoopDefaultMode, 1, NO);

    startLoadJavaScriptUsage[i] = _memoryFootprintStartLoadJavaScript - _memoryFootprintInitial;
    startExecuteJavaScriptUsage[i] = _memoryFootprintStartExecuteJavaScript - _memoryFootprintStartLoadJavaScript;
    whenDoneUsage[i] = _memoryFootprintWhenDone - _memoryFootprintStartExecuteJavaScript;
  }

  NSNumberFormatter *numberFormatter = [[NSNumberFormatter alloc] init];
  numberFormatter.usesGroupingSeparator = YES;
  numberFormatter.groupingSeparator = @" ";  // non-breaking space
  numberFormatter.groupingSize = 3;

  NSLog(@"| Checkpoint         | Initial usage | Avg. usage | Std. deviation |");
  NSLog(@"|:-------------------|--------------:|-----------:|:---------------|");
  NSLog(@"%@", tableRow(@"Start loading JS", startLoadJavaScriptUsage, numRuns, numberFormatter));
  NSLog(@"%@", tableRow(@"Start executing JS", startExecuteJavaScriptUsage, numRuns, numberFormatter));
  NSLog(@"%@", tableRow(@"Done loading JS", whenDoneUsage, numRuns, numberFormatter));
}

// MARK: - RCTBridgeDelegate

- (NSURL *)sourceURLForBridge:(__unused RCTBridge *)bridge
{
  NSBundle *bundle = [NSBundle bundleForClass:[self class]];
  return [bundle URLForResource:@"RNTesterUnitTestsBundle" withExtension:@"js"];
}

// MARK: - RCTBridge notifications

- (void)javaScriptDidLoad:(__unused NSNotification *)notification
{
  _memoryFootprintWhenDone = memoryFootprint();
}

- (void)javaScriptWillStartExecuting:(__unused NSNotification *)notification
{
  _memoryFootprintStartExecuteJavaScript = memoryFootprint();
}

- (void)javaScriptWillStartLoading:(__unused NSNotification *)notification
{
  _memoryFootprintStartLoadJavaScript = memoryFootprint();
}

@end

Mean calculateMean(mach_vm_size_t *measurements, int count)
{
  Mean measurement;

  double sum = 0;
  for (int i = 0; i < count; ++i) {
    sum += measurements[i];
  }

  const double mean = sum / count;

  double sigmaSq = 0;
  for (int i = 0; i < count; ++i) {
    double diff = measurements[i] - mean;
    sigmaSq += diff * diff / count;
  }

  measurement.mean = (mach_vm_size_t)mean;
  measurement.standardDeviation = sqrt(sigmaSq);

  return measurement;
}

NSString *tableRow(NSString *name, mach_vm_size_t *measurements, int count, NSNumberFormatter *numberFormatter)
{
  const Mean mean = calculateMean(measurements, count);
  return [NSString stringWithFormat:@"| %@ | +%@ | +%@ | ±%@ (±%@%%) |",
                                    name,
                                    [numberFormatter stringFromNumber:@(measurements[0])],
                                    [numberFormatter stringFromNumber:@(mean.mean)],
                                    [numberFormatter stringFromNumber:@(mean.standardDeviation)],
                                    [numberFormatter stringFromNumber:@(mean.standardDeviation / mean.mean * 100)]];
}

mach_vm_size_t memoryFootprint(void)
{
  task_vm_info_data_t info;
  mach_msg_type_number_t count = TASK_VM_INFO_COUNT;
  kern_return_t kerr = task_info(mach_task_self(), TASK_VM_INFO, (task_info_t)&info, &count);
  return kerr != KERN_SUCCESS ? 0 : info.phys_footprint;
}
