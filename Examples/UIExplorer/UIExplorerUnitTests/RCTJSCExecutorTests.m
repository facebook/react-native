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

#import <React/RCTJSCExecutor.h>

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

@end
