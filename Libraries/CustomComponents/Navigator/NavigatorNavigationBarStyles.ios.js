/**
 * Copyright (c) 2015, Facebook, Inc.  All rights reserved.
 *
 * Facebook, Inc. (“Facebook”) owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the “Software”).  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * (“Your Software”).  Facebook reserves all rights not expressly granted to
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
 * @providesModule NavigatorNavigationBarStyles
 */
'use strict';

var Dimensions = require('Dimensions');

var buildStyleInterpolator = require('buildStyleInterpolator');
var merge = require('merge');

var SCREEN_WIDTH = Dimensions.get('window').width;
var NAV_BAR_HEIGHT = 44;
var STATUS_BAR_HEIGHT = 20;
var NAV_HEIGHT = NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT;

var BASE_STYLES = {
  Title: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT,
    left: 0,
    alignItems: 'center',
    width: SCREEN_WIDTH,
    height: NAV_BAR_HEIGHT,
    backgroundColor: 'transparent',
  },
  LeftButton: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT,
    left: 0,
    overflow: 'hidden',
    opacity: 1,
    width: SCREEN_WIDTH / 3,
    height: NAV_BAR_HEIGHT,
    backgroundColor: 'transparent',
  },
  RightButton: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT,
    left: 2 * SCREEN_WIDTH / 3,
    overflow: 'hidden',
    opacity: 1,
    alignItems: 'flex-end',
    width: SCREEN_WIDTH / 3,
    height: NAV_BAR_HEIGHT,
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
    Title: merge(BASE_STYLES.Title, { left: - SCREEN_WIDTH / 2, opacity: 0 }),
    LeftButton: merge(BASE_STYLES.LeftButton, { left: - SCREEN_WIDTH / 3, opacity: 1 }),
    RightButton: merge(BASE_STYLES.RightButton, { left: SCREEN_WIDTH / 3, opacity: 0 }),
  },
  Center: {
    Title: merge(BASE_STYLES.Title, { left: 0, opacity: 1 }),
    LeftButton: merge(BASE_STYLES.LeftButton, { left: 0, opacity: 1 }),
    RightButton: merge(BASE_STYLES.RightButton, { left: 2 * SCREEN_WIDTH / 3 - 0, opacity: 1 }),
  },
  Right: {
    Title: merge(BASE_STYLES.Title, { left: SCREEN_WIDTH / 2, opacity: 0 }),
    LeftButton: merge(BASE_STYLES.LeftButton, { left: 0, opacity: 0 }),
    RightButton: merge(BASE_STYLES.RightButton, { left: SCREEN_WIDTH, opacity: 0 }),
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
    StatusBarHeight: STATUS_BAR_HEIGHT,
    TotalNavHeight: NAV_HEIGHT,
    ScreenWidth: SCREEN_WIDTH,
  },
  Interpolators,
  Stages,
};
