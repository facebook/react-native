/**
 * Copyright (c) 2015, Facebook, Inc.  All rights reserved.
 *
 * Facebook, Inc. ("Facebook") owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the "Software").  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * ("Your Software").  Facebook reserves all rights not expressly granted to
 * you in this license agreement.
 *
 * THE SOFTWARE AND DOCUMENTATION, IF ANY, ARE PROVIDED "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES (INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE) ARE DISCLAIMED.
 * IN NO EVENT SHALL FACEBOOK OR ITS AFFILIATES, OFFICERS, DIRECTORS OR
 * EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @providesModule NavigatorNavigationBarStylesAndroid
 */
'use strict';

var buildStyleInterpolator = require('buildStyleInterpolator');
var merge = require('merge');

// Android Material Design
var NAV_BAR_HEIGHT = 56;
var TITLE_LEFT = 72;
var BUTTON_SIZE = 24;
var TOUCH_TARGT_SIZE = 48;
var BUTTON_HORIZONTAL_MARGIN = 16;

var BUTTON_EFFECTIVE_MARGIN = BUTTON_HORIZONTAL_MARGIN - (TOUCH_TARGT_SIZE - BUTTON_SIZE) / 2;
var NAV_ELEMENT_HEIGHT = NAV_BAR_HEIGHT;

var BASE_STYLES = {
  Title: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-start',
    height: NAV_ELEMENT_HEIGHT,
    backgroundColor: 'transparent',
    marginLeft: TITLE_LEFT,
  },
  LeftButton: {
    position: 'absolute',
    top: 0,
    left: BUTTON_EFFECTIVE_MARGIN,
    overflow: 'hidden',
    height: NAV_ELEMENT_HEIGHT,
    backgroundColor: 'transparent',
  },
  RightButton: {
    position: 'absolute',
    top: 0,
    right: BUTTON_EFFECTIVE_MARGIN,
    overflow: 'hidden',
    alignItems: 'flex-end',
    height: NAV_ELEMENT_HEIGHT,
    backgroundColor: 'transparent',
  },
};

// There are 3 stages: left, center, right. All previous navigation
// items are in the left stage. The current navigation item is in the
// center stage. All upcoming navigation items are in the right stage.
// Another way to think of the stages is in terms of transitions. When
// we move forward in the navigation stack, we perform a
// right-to-center transition on the new navigation item and a
// center-to-left transition on the current navigation item.
var Stages = {
  Left: {
    Title: merge(BASE_STYLES.Title, { opacity: 0 }),
    LeftButton: merge(BASE_STYLES.LeftButton, { opacity: 0 }),
    RightButton: merge(BASE_STYLES.RightButton, { opacity: 0 }),
  },
  Center: {
    Title: merge(BASE_STYLES.Title, { opacity: 1 }),
    LeftButton: merge(BASE_STYLES.LeftButton, { opacity: 1 }),
    RightButton: merge(BASE_STYLES.RightButton, { opacity: 1 }),
  },
  Right: {
    Title: merge(BASE_STYLES.Title, { opacity: 0 }),
    LeftButton: merge(BASE_STYLES.LeftButton, { opacity: 0 }),
    RightButton: merge(BASE_STYLES.RightButton, { opacity: 0 }),
  },
};


var opacityRatio = 100;

function buildSceneInterpolators(startStyles, endStyles) {
  return {
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
    LeftButton: buildStyleInterpolator({
      opacity: {
        type: 'linear',
        from: startStyles.LeftButton.opacity,
        to: endStyles.LeftButton.opacity,
        min: 0,
        max: 1,
        round: opacityRatio,
      },
      left: {
        type: 'linear',
        from: startStyles.LeftButton.left,
        to: endStyles.LeftButton.left,
        min: 0,
        max: 1,
      },
    }),
    RightButton: buildStyleInterpolator({
      opacity: {
        type: 'linear',
        from: startStyles.RightButton.opacity,
        to: endStyles.RightButton.opacity,
        min: 0,
        max: 1,
        round: opacityRatio,
      },
      left: {
        type: 'linear',
        from: startStyles.RightButton.left,
        to: endStyles.RightButton.left,
        min: 0,
        max: 1,
        extrapolate: true,
      },
    }),
  };
}

var Interpolators = {
  // Animating *into* the center stage from the right
  RightToCenter: buildSceneInterpolators(Stages.Right, Stages.Center),
  // Animating out of the center stage, to the left
  CenterToLeft: buildSceneInterpolators(Stages.Center, Stages.Left),
  // Both stages (animating *past* the center stage)
  RightToLeft: buildSceneInterpolators(Stages.Right, Stages.Left),
};


module.exports = {
  General: {
    NavBarHeight: NAV_BAR_HEIGHT,
    StatusBarHeight: 0,
    TotalNavHeight: NAV_BAR_HEIGHT,
  },
  Interpolators,
  Stages,
};
