/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

#import <mach/mach_time.h>

#import <XCTest/XCTest.h>

#import "RCTJSCExecutor.h"
#import "RCTUtils.h"

#define RUN_PERF_TESTS 0

@interface RCTJSCExecutorTests : XCTestCase

@end

@implementation RCTJSCExecutorTests
{
  RCTJSCExecutor *_executor;
}

- (void)setUp
{
  [super setUp];
  _executor = [RCTJSCExecutor new];
  [_executor setUp];
}

- (void)testNativeLoggingHookExceptionBehavior
{
  dispatch_semaphore_t doneSem = dispatch_semaphore_create(0);
  [_executor executeApplicationScript:[@"var x = {toString: function() { throw 1; }}; nativeLoggingHook(x);" dataUsingEncoding:NSUTF8StringEncoding]
                           sourceURL:[NSURL URLWithString:@"file://"]
                          onComplete:^(__unused id error){
                            dispatch_semaphore_signal(doneSem);
                          }];
  dispatch_semaphore_wait(doneSem, DISPATCH_TIME_FOREVER);
  [_executor invalidate];
}

#if RUN_PERF_TESTS

static uint64_t _get_time_nanoseconds(void)
{
  static struct mach_timebase_info tb_info = {0, 0};
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    int ret = mach_timebase_info(&tb_info);
    assert(0 == ret);
  });

  return (mach_absolute_time() * tb_info.numer) / tb_info.denom;
}

- (void)testDeserializationPerf
{
  // This test case checks the assumption that deserializing objects from JavaScript
  // values one-by-one via ObjC JSC API is slower than using JSON string
  // You might want to switch your tests schema to "Release" build configuration

  JSContextGroupRef group = JSContextGroupCreate();
  JSGlobalContextRef context = JSGlobalContextCreateInGroup(group, NULL);
  id message = @[@[@1, @2, @3, @4], @[@{@"a": @1}, @{@"b": @2}], (id)kCFNull];
  NSString *code = RCTJSONStringify(message, NULL);
  JSStringRef script = JSStringCreateWithCFString((__bridge CFStringRef)code);
  JSValueRef error = NULL;
  JSValueRef value = JSEvaluateScript(context, script, NULL, NULL, 0, &error);
  XCTAssertTrue(error == NULL);

  id obj;
  uint64_t start = _get_time_nanoseconds();
  for (int i = 0; i < 10000; i++) {
    JSStringRef jsonJSString = JSValueCreateJSONString(context, value, 0, nil);
    NSString *jsonString = (__bridge NSString *)JSStringCopyCFString(kCFAllocatorDefault, jsonJSString);
    JSStringRelease(jsonJSString);

    obj = RCTJSONParse(jsonString, NULL);
  }
  NSLog(@"JSON Parse time: %.2fms", (_get_time_nanoseconds() - start) / 1000000.0);

  JSStringRelease(script);
  JSGlobalContextRelease(context);
  JSContextGroupRelease(group);
}

- (void)testJavaScriptCallSpeed
{
/**
 * Since we almost don't change the RCTJSCExecutor logic, and this test is
 * very likely to become flaky (specially across different devices) leave it
 * to be run manually
 *
 * Previous Values: If you change the executor code, you should update this values
 */

  int const runs = 4e5;
  int const frequency = 10;
  double const threshold = 0.1;
  static double const expectedTimes[] = {
    0x1.6199943826cf1p+13,
    0x1.a3bc0a81551c3p+13,
    0x1.d49fbb8602fe3p+13,
    0x1.d1f64085ecb7bp+13,
  };

  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  NSString *script = @" \
    var modules = { \
      module: { \
        method: function () { \
          return true; \
        } \
      } \
    }; \
    var Bridge = { \
      callFunctionReturnFlushedQueue: function(module, method, args) { \
        modules[module].apply(modules[module], args); \
      } \
    }; \
    function require(module) { \
      return Bridge; \
    } \
  ";

  [_executor executeApplicationScript:[script dataUsingEncoding:NSUTF8StringEncoding] sourceURL:[NSURL URLWithString:@"http://localhost:8081/"] onComplete:^(__unused NSError *error) {
    NSMutableArray *params = [NSMutableArray new];
    id data = @1;
    for (int i = 0; i < 4; i++) {
      double samples[runs / frequency];
      int size = runs / frequency;
      double total = 0;
      for (int j = 0; j < runs; j++) {
        @autoreleasepool {
          double start = _get_time_nanoseconds();
          [_executor callFunctionOnModule:@"module"
                                   method:@"method"
                                arguments:params
                                 callback:^(__unused id json, __unused NSError *unused) {
                                 }];
          double run = _get_time_nanoseconds() - start;
          if ((j % frequency) == frequency - 1) { // Warmup
            total += run;
            samples[j/frequency] = run;
          }
        }
      }

      double mean = total / size;
      double variance = 0;

      for (int j = 0; j < size; j++) {
        variance += pow(samples[j] - mean, 2);
      }
      variance /= size;

      double standardDeviation = sqrt(variance);
      double marginOfError = standardDeviation * 1.645;

      double lower = mean - marginOfError;
      double upper = mean + marginOfError;

      int s = 0;
      total = 0;
      for (int j = 0; j < size; j++) {
        double v = samples[j];
        if (v >= lower && v <= upper) {
          samples[s++] = v;
          total += v;
        }
      }
      mean = total / s;

      lower = mean * (1.0 - threshold);
      upper = mean * (1.0 + threshold);

      double expected = expectedTimes[i];

      NSLog(@"Previous: %lf, New: %f -> %a", expected, mean, mean);
      if (upper < expected) {
        NSLog(@"You made JS calls with %d argument(s) %.2lf%% faster :) - Remember to update the tests with the new value: %a",
                      i, (1 - (double)mean / expected) * 100, mean);
      }


      XCTAssertTrue(lower < expected, @"You made JS calls with %d argument(s) %.2lf%% slower :( - If that's *really* necessary, update the tests with the new value: %a",
        i, ((double)mean / expected - 1) * 100, mean);

      [params addObject:data];
    }
    dispatch_semaphore_signal(semaphore);
  }];

  while (dispatch_semaphore_wait(semaphore, DISPATCH_TIME_NOW)) {
    [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode
                             beforeDate:[NSDate dateWithTimeIntervalSinceNow:10]];
  }
}

#endif

@end
