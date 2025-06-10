#import "RCTTextView.h"

@interface RCTTextView ()
@property (nonatomic, strong) UILabel *label;
@end

@implementation RCTTextView

- (instancetype)init
{
  if (self = [super init]) {
    _label = [[UILabel alloc] initWithFrame:CGRectZero];
    _label.numberOfLines = 0;
    [self addSubview:_label];
    self.dynamicTypeEnabled = NO;
    self.textStyle = @"body";
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(updateFont)
                                                 name:UIContentSizeCategoryDidChangeNotification
                                               object:nil];
  }
  return self;
}

- (void)setText:(NSString *)text
{
  _text = text;
  _label.text = text;
}

- (void)setDynamicTypeEnabled:(BOOL)enabled
{
  _dynamicTypeEnabled = enabled;
  [self updateFont];
}

- (void)setTextStyle:(NSString *)style
{
  _textStyle = style;
  [self updateFont];
}

- (void)updateFont
{
  if (self.dynamicTypeEnabled) {
    NSString *style = self.textStyle ?: @"body";
    UIFontTextStyle uiStyle = UIFontTextStyleBody;
    if ([style.lowercaseString isEqualToString:@"headline"]) uiStyle = UIFontTextStyleHeadline;
    else if ([style.lowercaseString isEqualToString:@"subheadline"]) uiStyle = UIFontTextStyleSubheadline;
    else if ([style.lowercaseString isEqualToString:@"caption1"]) uiStyle = UIFontTextStyleCaption1;
    else if ([style.lowercaseString isEqualToString:@"caption2"]) uiStyle = UIFontTextStyleCaption2;
    else if ([style.lowercaseString isEqualToString:@"footnote"]) uiStyle = UIFontTextStyleFootnote;
    else if ([style.lowercaseString isEqualToString:@"callout"]) uiStyle = UIFontTextStyleCallout;
    else if ([style.lowercaseString isEqualToString:@"title1"]) uiStyle = UIFontTextStyleTitle1;
    else if ([style.lowercaseString isEqualToString:@"title2"]) uiStyle = UIFontTextStyleTitle2;
    else if ([style.lowercaseString isEqualToString:@"title3"]) uiStyle = UIFontTextStyleTitle3;
    _label.font = [UIFont preferredFontForTextStyle:uiStyle];
    _label.adjustsFontForContentSizeCategory = YES;
  } else {
    _label.font = [UIFont systemFontOfSize:17];
    _label.adjustsFontForContentSizeCategory = NO;
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _label.frame = self.bounds;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end