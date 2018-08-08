/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRedBoxExtraDataViewController.h"

@interface RCTRedBoxExtraDataCell : UITableViewCell

@property (nonatomic, strong) UILabel *keyLabel;
@property (nonatomic, strong) UILabel *valueLabel;

@end

@implementation RCTRedBoxExtraDataCell

- (instancetype)initWithStyle:(UITableViewCellStyle)style
              reuseIdentifier:(NSString *)reuseIdentifier
{
    if (self = [super initWithStyle:style reuseIdentifier:reuseIdentifier]) {
        self.backgroundColor = [UIColor colorWithRed:0.8
                                               green:0 blue:0
                                               alpha:1];
        UILayoutGuide *contentLayout =  self.contentView.layoutMarginsGuide;

        self.keyLabel = [UILabel new];
        [self.contentView addSubview:self.keyLabel];

        self.keyLabel.translatesAutoresizingMaskIntoConstraints = NO;
        [self.keyLabel.leadingAnchor
            constraintEqualToAnchor:contentLayout.leadingAnchor].active = YES;
        [self.keyLabel.topAnchor
            constraintEqualToAnchor:contentLayout.topAnchor].active = YES;
        [self.keyLabel.bottomAnchor
            constraintEqualToAnchor:contentLayout.bottomAnchor].active = YES;
        [self.keyLabel.widthAnchor
            constraintEqualToAnchor:contentLayout.widthAnchor
            multiplier:0.3].active = YES;


        self.keyLabel.textColor = [UIColor whiteColor];
        self.keyLabel.numberOfLines = 0;
#if !TARGET_OS_TV
        self.keyLabel.lineBreakMode = NSLineBreakByWordWrapping;
        self.keyLabel.font = [UIFont fontWithName:@"Menlo-Regular" size:12.0f];
#endif
        self.valueLabel = [UILabel new];
        [self.contentView addSubview:self.valueLabel];

        self.valueLabel.translatesAutoresizingMaskIntoConstraints = NO;
        [self.valueLabel.leadingAnchor
            constraintEqualToAnchor:self.keyLabel.trailingAnchor
            constant:10.f].active = YES;
        [self.valueLabel.trailingAnchor
            constraintEqualToAnchor:contentLayout.trailingAnchor].active = YES;
        [self.valueLabel.topAnchor
            constraintEqualToAnchor:contentLayout.topAnchor].active = YES;
        [self.valueLabel.bottomAnchor
            constraintEqualToAnchor:contentLayout.bottomAnchor].active = YES;

        self.valueLabel.textColor = [UIColor whiteColor];
        self.valueLabel.numberOfLines = 0;
#if !TARGET_OS_TV
        self.valueLabel.lineBreakMode = NSLineBreakByWordWrapping;
        self.valueLabel.font = [UIFont fontWithName:@"Menlo-Regular" size:12.0f];
#endif
    }
    return self;
}

@end

@interface RCTRedBoxExtraDataViewController ()

@end

@implementation RCTRedBoxExtraDataViewController
{
    UITableView *_tableView;
    NSMutableArray *_extraDataTitle;
    NSMutableArray *_extraData;
}

@synthesize actionDelegate = _actionDelegate;

- (instancetype)init
{
    if (self = [super init]) {
        _extraData = [NSMutableArray new];
        _extraDataTitle = [NSMutableArray new];
        self.view.backgroundColor = [UIColor colorWithRed:0.8
                                                    green:0
                                                     blue:0
                                                    alpha:1];

        _tableView = [UITableView new];
        _tableView.delegate = self;
        _tableView.dataSource = self;
        _tableView.backgroundColor = [UIColor clearColor];
        _tableView.estimatedRowHeight = 200;
#if !TARGET_OS_TV
        _tableView.separatorStyle = UITableViewCellSeparatorStyleNone;
#endif
        _tableView.rowHeight = UITableViewAutomaticDimension;
        _tableView.allowsSelection = NO;

#if TARGET_OS_SIMULATOR
        NSString *reloadText = @"Reload JS (\u2318R)";
        NSString *dismissText = @"Dismiss (ESC)";
#else
        NSString *reloadText = @"Reload JS";
        NSString *dismissText = @"Dismiss";
#endif

        UIButton *dismissButton = [UIButton buttonWithType:UIButtonTypeCustom];
        dismissButton.translatesAutoresizingMaskIntoConstraints = NO;
        dismissButton.accessibilityIdentifier = @"redbox-extra-data-dismiss";
        dismissButton.titleLabel.font = [UIFont systemFontOfSize:13];
        [dismissButton setTitle:dismissText forState:UIControlStateNormal];
        [dismissButton setTitleColor:[UIColor colorWithWhite:1 alpha:0.5]
                            forState:UIControlStateNormal];
        [dismissButton setTitleColor:[UIColor whiteColor]
                            forState:UIControlStateHighlighted];
        [dismissButton addTarget:self
                          action:@selector(dismiss)
                forControlEvents:UIControlEventTouchUpInside];

        UIButton *reloadButton = [UIButton buttonWithType:UIButtonTypeCustom];
        reloadButton.accessibilityIdentifier = @"redbox-reload";
        reloadButton.titleLabel.font = [UIFont systemFontOfSize:13];
        [reloadButton setTitle:reloadText forState:UIControlStateNormal];
        [reloadButton setTitleColor:[UIColor colorWithWhite:1 alpha:0.5]
                           forState:UIControlStateNormal];
        [reloadButton setTitleColor:[UIColor whiteColor]
                            forState:UIControlStateHighlighted];
        [reloadButton addTarget:self
                          action:@selector(reload)
                forControlEvents:UIControlEventTouchUpInside];

        UIStackView *buttonStackView = [UIStackView new];
        buttonStackView.axis = UILayoutConstraintAxisHorizontal;
        buttonStackView.distribution = UIStackViewDistributionEqualSpacing;
        buttonStackView.alignment = UIStackViewAlignmentFill;
        buttonStackView.spacing = 20;

        [buttonStackView addArrangedSubview:dismissButton];
        [buttonStackView addArrangedSubview:reloadButton];
        buttonStackView.translatesAutoresizingMaskIntoConstraints = NO;

        UIStackView *mainStackView = [UIStackView new];
        mainStackView.axis = UILayoutConstraintAxisVertical;
        mainStackView.backgroundColor = [UIColor colorWithRed:0.8
                                                        green:0 blue:0
                                                        alpha:1];
        [mainStackView addArrangedSubview:_tableView];
        [mainStackView addArrangedSubview:buttonStackView];
        mainStackView.translatesAutoresizingMaskIntoConstraints = NO;

        [self.view addSubview:mainStackView];

        CGFloat tableHeight = self.view.bounds.size.height - 60.f;
        [_tableView.heightAnchor constraintEqualToConstant:tableHeight].active = YES;
        [_tableView.widthAnchor constraintEqualToAnchor:self.view.widthAnchor].active = YES;

        CGFloat buttonWidth = self.view.bounds.size.width / 4;
        [dismissButton.heightAnchor constraintEqualToConstant:60].active = YES;
        [dismissButton.widthAnchor
            constraintEqualToConstant:buttonWidth].active = YES;
        [reloadButton.heightAnchor constraintEqualToConstant:60].active = YES;
        [reloadButton.widthAnchor
            constraintEqualToConstant:buttonWidth].active = YES;
    }
    return self;
}

- (void)viewDidAppear:(BOOL)animated
{
    [super viewDidAppear:animated];
    [_tableView reloadData];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    return [[_extraData objectAtIndex:section] count];
}

- (CGFloat)tableView:(UITableView *)tableView heightForHeaderInSection:(NSInteger)section
{
    return 40;
}

- (UIView *)tableView:(UITableView *)tableView viewForHeaderInSection:(NSInteger)section
{
    UIView *view = [UIView new];
    view.backgroundColor = [UIColor colorWithRed:1 green:0 blue:0 alpha:1];

    UILabel *header = [UILabel new];
    [view addSubview:header];

    header.translatesAutoresizingMaskIntoConstraints = NO;
    [header.leadingAnchor
        constraintEqualToAnchor:view.leadingAnchor constant:5].active = YES;
    [header.trailingAnchor
        constraintEqualToAnchor:view.trailingAnchor].active = YES;
    [header.topAnchor
        constraintEqualToAnchor:view.topAnchor].active = YES;
    [header.bottomAnchor
        constraintEqualToAnchor:view.bottomAnchor].active = YES;

    header.textColor = [UIColor whiteColor];
    header.font = [UIFont fontWithName:@"Menlo-Bold" size:14.0f];
    header.text = [_extraDataTitle[section] uppercaseString];

    return view;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *reuseIdentifier = @"RedBoxExtraData";

    RCTRedBoxExtraDataCell *cell =
            (RCTRedBoxExtraDataCell *)[tableView
            dequeueReusableCellWithIdentifier:reuseIdentifier];

    if (cell == nil) {
        cell = [[RCTRedBoxExtraDataCell alloc]
                initWithStyle:UITableViewCellStyleDefault
                reuseIdentifier:reuseIdentifier];
    }

    NSArray *dataKVPair = _extraData[indexPath.section][indexPath.row];
    cell.keyLabel.text = dataKVPair[0];
    cell.valueLabel.text = dataKVPair[1];

    return cell;
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return _extraDataTitle.count;
}

- (void)addExtraData:(NSDictionary *)data forIdentifier:(NSString *)identifier
{
    dispatch_async(dispatch_get_main_queue(), ^{
        NSMutableArray *newData = [NSMutableArray new];
        for (id key in data) {
            [newData addObject:@[[NSString stringWithFormat:@"%@", key],
                [NSString stringWithFormat:@"%@", [data objectForKey:key]]]];
        }

        NSInteger idx = [self->_extraDataTitle indexOfObject:identifier];
        if (idx == NSNotFound) {
            [self->_extraDataTitle addObject:identifier];
            [self->_extraData addObject:newData];
        } else {
            [self->_extraData replaceObjectAtIndex:idx withObject:newData];
        }

        [self->_tableView reloadData];
    });
}

- (void)dismiss
{
    [self dismissViewControllerAnimated:YES completion:nil];
}

- (void)reload
{
    [_actionDelegate reload];
}

#pragma mark - Key commands

- (NSArray<UIKeyCommand *> *)keyCommands
{
    return @[
             // Dismiss
             [UIKeyCommand keyCommandWithInput:UIKeyInputEscape
                                 modifierFlags:0
                                        action:@selector(dismiss)],
             // Reload
             [UIKeyCommand keyCommandWithInput:@"r"
                                 modifierFlags:UIKeyModifierCommand
                                        action:@selector(reload)]
    ];
}

@end
