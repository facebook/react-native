/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigatorBreadcrumbNavigationBarStyles
 */
'use strict';

var Dimensions = require('Dimensions');
var NavigatorNavigationBarStyles = require('NavigatorNavigationBarStyles');

var buildStyleInterpolator = require('buildStyleInterpolator');
var merge = require('merge');

var SCREEN_WIDTH = Dimensions.get('window').width;
var NAV_BAR_HEIGHT = NavigatorNavigationBarStyles.General.NavBarHeight;

var SPACING = 8;
var ICON_WIDTH = 40;
var SEPARATOR_WIDTH = 9;
var CRUMB_WIDTH = ICON_WIDTH + SEPARATOR_WIDTH;
var NAV_ELEMENT_HEIGHT = NAV_BAR_HEIGHT;

var OPACITY_RATIO = 100;
var ICON_INACTIVE_OPACITY = 0.6;
var MAX_BREADCRUMBS = 10;

var CRUMB_BASE = {
  position: 'absolute',
  flexDirection: 'row',
  top: 0,
  width: CRUMB_WIDTH,
  height: NAV_ELEMENT_HEIGHT,
  backgroundColor: 'transparent',
};

var ICON_BASE = {
  width: ICON_WIDTH,
  height: NAV_ELEMENT_HEIGHT,
};

var SEPARATOR_BASE = {
  width: SEPARATOR_WIDTH,
  height: NAV_ELEMENT_HEIGHT,
};

var TITLE_BASE = {
  position: 'absolute',
  top: 0,
  height: NAV_ELEMENT_HEIGHT,
  backgroundColor: 'transparent',
  alignItems: 'flex-start',
};

var FIRST_TITLE_BASE = merge(TITLE_BASE, {
  left: 0,
  right: 0,
});

var RIGHT_BUTTON_BASE = {
  position: 'absolute',
  top: 0,
  right: 0,
  overflow: 'hidden',
  opacity: 1,
  height: NAV_ELEMENT_HEIGHT,
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
  var crumbRight = crumbLeft + 50;
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
  Crumb: merge(CRUMB_BASE, {left: SPACING + CRUMB_WIDTH}),
  Icon: merge(ICON_BASE, {opacity: 0}),
  Separator: merge(SEPARATOR_BASE, {opacity: 0}),
  Title: merge(FIRST_TITLE_BASE, {opacity: 1}),
  RightItem: CENTER[0].RightItem,
};
LEFT[0].Title = merge(FIRST_TITLE_BASE, {opacity: 0});
RIGHT[0].Title = merge(FIRST_TITLE_BASE, {opacity: 0});


var buildIndexSceneInterpolator = function(startStyles, endStyles) {
  return {
    Crumb: buildStyleInterpolator({
      translateX: {
        type: 'linear',
        from: 0,
        to: endStyles.Crumb.left - startStyles.Crumb.left,
        min: 0,
        max: 1,
        extrapolate: true,
      },
      left: {
        value: startStyles.Crumb.left,
        type: 'constant'
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
      translateX: {
        type: 'linear',
        from: 0,
        to: endStyles.Title.left - startStyles.Title.left,
        min: 0,
        max: 1,
        extrapolate: true,
      },
      left: {
        value: startStyles.Title.left,
        type: 'constant'
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
