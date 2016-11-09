/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
 * @providesModule NavigationHeaderStyleInterpolator
 * @flow
 */
'use strict';

const I18nManager = require('I18nManager');

import type  {
  NavigationSceneRendererProps,
} from 'NavigationTypeDefinition';

/**
 * Utility that builds the style for the navigation header.
 *
 * +-------------+-------------+-------------+
 * |             |             |             |
 * |    Left     |   Title     |   Right     |
 * |  Component  |  Component  | Component   |
 * |             |             |             |
 * +-------------+-------------+-------------+
 */

function forLeft(props: NavigationSceneRendererProps): Object {
  const {position, scene} = props;
  const {index} = scene;
  return {
    opacity: position.interpolate({
      inputRange: [ index - 1, index, index + 1 ],
      outputRange: ([ 0, 1, 0 ]: Array<number>),
    }),
  };
}

function forCenter(props: NavigationSceneRendererProps): Object {
  const {position, scene} = props;
  const {index} = scene;
  return {
    opacity:position.interpolate({
      inputRange: [ index - 1, index, index + 1 ],
      outputRange: ([ 0, 1, 0 ]: Array<number>),
    }),
    transform: [
      {
        translateX: position.interpolate({
          inputRange: [ index - 1, index + 1 ],
          outputRange: I18nManager.isRTL ?
            ([ -200, 200 ]: Array<number>) :
            ([ 200, -200 ]: Array<number>),
        }),
      }
    ],
  };
}

function forRight(props: NavigationSceneRendererProps): Object {
  const {position, scene} = props;
  const {index} = scene;
  return {
    opacity: position.interpolate({
      inputRange: [ index - 1, index, index + 1 ],
      outputRange: ([ 0, 1, 0 ]: Array<number>),
    }),
  };
}

module.exports = {
  forCenter,
  forLeft,
  forRight,
};
