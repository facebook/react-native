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

#import "UpdatePropertiesExampleView.h"

#import <React/RCTRootView.h>
#import <React/RCTViewManager.h>

#import "AppDelegate.h"

@interface UpdatePropertiesExampleViewManager : RCTViewManager

@end

@implementation UpdatePropertiesExampleViewManager

RCT_EXPORT_MODULE();

- (UIView *)view
{
  return [UpdatePropertiesExampleView new];
}

@end

@implementation UpdatePropertiesExampleView
{
  RCTRootView *_rootView;
  UIButton *_button;
  BOOL _beige;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  self = [super initWithFrame:frame];
  if (self) {
    _beige = YES;

    AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];

    _rootView = [[RCTRootView alloc] initWithBridge:appDelegate.bridge
                                         moduleName:@"SetPropertiesExampleApp"
                                  initialProperties:@{@"color":@"beige"}];

    _button = [UIButton buttonWithType:UIButtonTypeRoundedRect];
    [_button setTitle:@"Native Button" forState:UIControlStateNormal];
    [_button setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
    [_button setBackgroundColor:[UIColor grayColor]];

    [_button addTarget:self
                action:@selector(changeColor)
      forControlEvents:UIControlEventTouchUpInside];

    [self addSubview:_button];
    [self addSubview:_rootView];
  }
  return self;
}

- (void)layoutSubviews
{
  float spaceHeight = 20;
  float buttonHeight = 40;
  float rootViewWidth = self.bounds.size.width;
  float rootViewHeight = self.bounds.size.height - spaceHeight - buttonHeight;

  [_rootView setFrame:CGRectMake(0, 0, rootViewWidth, rootViewHeight)];
  [_button setFrame:CGRectMake(0, rootViewHeight + spaceHeight, rootViewWidth, buttonHeight)];
}

- (void)changeColor
{
  _beige = !_beige;
  [_rootView setAppProperties:@{@"color":_beige ? @"beige" : @"purple"}];
}

- (NSArray<UIView<RCTComponent> *> *)reactSubviews
{
  // this is to avoid unregistering our RCTRootView when the component is removed from RN hierarchy
  (void)[super reactSubviews];
  return @[];
}

@end
