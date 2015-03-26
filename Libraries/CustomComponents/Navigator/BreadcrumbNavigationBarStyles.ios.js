/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule BreadcrumbNavigationBarStyles
 */
'use strict';

var NavigationBarStyles = require('NavigationBarStyles');

var buildStyleInterpolator = require('buildStyleInterpolator');
var merge = require('merge');

var SCREEN_WIDTH = NavigationBarStyles.General.ScreenWidth;
var STATUS_BAR_HEIGHT = NavigationBarStyles.General.StatusBarHeight;
var NAV_BAR_HEIGHT = NavigationBarStyles.General.NavBarHeight;

var SPACING = 4;
var ICON_WIDTH = 40;
var SEPARATOR_WIDTH = 9;
var CRUMB_WIDTH = ICON_WIDTH + SEPARATOR_WIDTH;
var RIGHT_BUTTON_WIDTH = 58;

var OPACITY_RATIO = 100;
var ICON_INACTIVE_OPACITY = 0.6;
var MAX_BREADCRUMBS = 10;

var CRUMB_BASE = {
  position: 'absolute',
  flexDirection: 'row',
  top: STATUS_BAR_HEIGHT,
  width: CRUMB_WIDTH,
  height: NAV_BAR_HEIGHT,
  backgroundColor: 'transparent',
};

var ICON_BASE = {
  width: ICON_WIDTH,
  height: NAV_BAR_HEIGHT,
};

var SEPARATOR_BASE = {
  width: SEPARATOR_WIDTH,
  height: NAV_BAR_HEIGHT,
};

var TITLE_BASE = {
  position: 'absolute',
  top: STATUS_BAR_HEIGHT,
  height: NAV_BAR_HEIGHT,
  backgroundColor: 'transparent',
};

// For first title styles, make sure first title is centered
var FIRST_TITLE_BASE = merge(TITLE_BASE, {
  left: 0,
  alignItems: 'center',
  width: SCREEN_WIDTH,
  height: NAV_BAR_HEIGHT,
});

var RIGHT_BUTTON_BASE = {
  position: 'absolute',
  top: STATUS_BAR_HEIGHT,
  left: SCREEN_WIDTH - SPACING - RIGHT_BUTTON_WIDTH,
  overflow: 'hidden',
  opacity: 1,
  width: RIGHT_BUTTON_WIDTH,
  height: NAV_BAR_HEIGHT,
  backgroundColor: 'transparent',
};

/**
 * Precompute crumb styles so that they don't need to be recomputed on every
 * interaction.
 */
var LEFT = [];
var CENTER = [];
var RIGHT = [];
for (var i = 0; i < MAX_BREADCRUMBS; i++) {
  var crumbLeft = CRUMB_WIDTH * i + SPACING;
  LEFT[i] = {
    Crumb: merge(CRUMB_BASE, { left: crumbLeft }),
    Icon: merge(ICON_BASE, { opacity: ICON_INACTIVE_OPACITY }),
    Separator: merge(SEPARATOR_BASE, { opacity: 1 }),
    Title: merge(TITLE_BASE, { left: crumbLeft, opacity: 0 }),
    RightItem: merge(RIGHT_BUTTON_BASE, { opacity: 0 }),
  };
  CENTER[i] = {
    Crumb: merge(CRUMB_BASE, { left: crumbLeft }),
    Icon: merge(ICON_BASE, { opacity: 1 }),
    Separator: merge(SEPARATOR_BASE, { opacity: 0 }),
    Title: merge(TITLE_BASE, {
      left: crumbLeft + ICON_WIDTH,
      opacity: 1,
    }),
    RightItem: merge(RIGHT_BUTTON_BASE, { opacity: 1 }),
  };
  var crumbRight = SCREEN_WIDTH - 100;
  RIGHT[i] = {
    Crumb: merge(CRUMB_BASE, { left: crumbRight}),
    Icon: merge(ICON_BASE, { opacity: 0 }),
    Separator: merge(SEPARATOR_BASE, { opacity: 0 }),
    Title: merge(TITLE_BASE, {
      left: crumbRight + ICON_WIDTH,
      opacity: 0,
    }),
    RightItem: merge(RIGHT_BUTTON_BASE, { opacity: 0 }),
  };
}

// Special case the CENTER state of the first scene.
CENTER[0] = {
  Crumb: merge(CRUMB_BASE, {left: SCREEN_WIDTH / 4}),
  Icon: merge(ICON_BASE, {opacity: 0}),
  Separator: merge(SEPARATOR_BASE, {opacity: 0}),
  Title: merge(FIRST_TITLE_BASE, {opacity: 1}),
  RightItem: CENTER[0].RightItem,
};
LEFT[0].Title = merge(FIRST_TITLE_BASE, {left: - SCREEN_WIDTH / 4, opacity: 0});
RIGHT[0].Title = merge(FIRST_TITLE_BASE, {opacity: 0});


var buildIndexSceneInterpolator = function(startStyles, endStyles) {
  return {
    Crumb: buildStyleInterpolator({
      left: {
        type: 'linear',
        from: startStyles.Crumb.left,
        to: endStyles.Crumb.left,
        min: 0,
        max: 1,
        extrapolate: true,
      },
    }),
    Icon: buildStyleInterpolator({
      opacity: {
        type: 'linear',
        from: startStyles.Icon.opacity,
        to: endStyles.Icon.opacity,
        min: 0,
        max: 1,
      },
    }),
    Separator: buildStyleInterpolator({
      opacity: {
        type: 'linear',
        from: startStyles.Separator.opacity,
        to: endStyles.Separator.opacity,
        min: 0,
        max: 1,
      },
    }),
    Title: buildStyleInterpolator({
      opacity: {
        type: 'linear',
        from: startStyles.Title.opacity,
        to: endStyles.Title.opacity,
        min: 0,
        max: 1,
      },
      left: {
        type: 'linear',
        from: startStyles.Title.left,
        to: endStyles.Title.left,
        min: 0,
        max: 1,
        extrapolate: true,
      },
    }),
    RightItem: buildStyleInterpolator({
      opacity: {
        type: 'linear',
        from: startStyles.RightItem.opacity,
        to: endStyles.RightItem.opacity,
        min: 0,
        max: 1,
        round: OPACITY_RATIO,
      },
    }),
  };
};

var Interpolators = CENTER.map(function(_, ii) {
  return {
    // Animating *into* the center stage from the right
    RightToCenter: buildIndexSceneInterpolator(RIGHT[ii], CENTER[ii]),
    // Animating out of the center stage, to the left
    CenterToLeft: buildIndexSceneInterpolator(CENTER[ii], LEFT[ii]),
    // Both stages (animating *past* the center stage)
    RightToLeft: buildIndexSceneInterpolator(RIGHT[ii], LEFT[ii]),
  };
});

/**
 * Contains constants that are used in constructing both `StyleSheet`s and
 * inline styles during transitions.
 */
module.exports = {
  Interpolators,
  Left: LEFT,
  Center: CENTER,
  Right: RIGHT,
  IconWidth: ICON_WIDTH,
  IconHeight: NAV_BAR_HEIGHT,
  SeparatorWidth: SEPARATOR_WIDTH,
  SeparatorHeight: NAV_BAR_HEIGHT,
};
