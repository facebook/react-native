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
 * @providesModule NavigationCard
 * @flow
 */
'use strict';

const Animated = require('Animated');
const NavigationCardStackPanResponder = require('NavigationCardStackPanResponder');
const NavigationCardStackStyleInterpolator = require('NavigationCardStackStyleInterpolator');
const NavigationContainer = require('NavigationContainer');
const NavigationPagerPanResponder = require('NavigationPagerPanResponder');
const NavigationPagerStyleInterpolator = require('NavigationPagerStyleInterpolator');
const NavigationPropTypes = require('NavigationPropTypes');
const React = require('React');
const ReactComponentWithPureRenderMixin = require('ReactComponentWithPureRenderMixin');
const StyleSheet = require('StyleSheet');
const View = require('View');

import type  {
  NavigationPanPanHandlers,
  NavigationSceneRenderer,
  NavigationSceneRendererProps,
} from 'NavigationTypeDefinition';

type Props = NavigationSceneRendererProps & {
  style: any,
  panHandlers: ?NavigationPanPanHandlers,
  renderScene: NavigationSceneRenderer,
};

const {PropTypes} = React;

const propTypes = {
  ...NavigationPropTypes.SceneRenderer,
  style: PropTypes.any,
  panHandlers: NavigationPropTypes.panHandlers,
  renderScene: PropTypes.func.isRequired,
};

/**
 * Component that renders the scene as card for the <NavigationCardStack />.
 */
class NavigationCard extends React.Component<any, Props, any> {
  props: Props;

  shouldComponentUpdate(nextProps: Props, nextState: any): boolean {
    return ReactComponentWithPureRenderMixin.shouldComponentUpdate.call(
      this,
      nextProps,
      nextState
    );
  }

  render(): ReactElement {
    const {
      panHandlers,
      renderScene,
      style,
      ...props, /* NavigationSceneRendererProps */
    } = this.props;

    let viewStyle = null;
    if (style === undefined) {
      // fall back to default style.
      viewStyle = NavigationCardStackStyleInterpolator.forHorizontal(props);
    } else {
      viewStyle = style;
    }

    const  {
      navigationState,
      scene,
    } = props;

    const interactive = navigationState.index === scene.index && !scene.isStale;
    const pointerEvents = interactive ? 'auto' : 'none';

    let viewPanHandlers = null;
    if (interactive) {
      if (panHandlers === undefined) {
        // fall back to default pan handlers.
        viewPanHandlers = NavigationCardStackPanResponder.forHorizontal(props);
      } else {
        viewPanHandlers = panHandlers;
      }
    }

    return (
      <Animated.View
        {...viewPanHandlers}
        pointerEvents={pointerEvents}
        style={[styles.main, viewStyle]}>
        {renderScene(props)}
      </Animated.View>
    );
  }
}

NavigationCard.propTypes = propTypes;

const styles = StyleSheet.create({
  main: {
    backgroundColor: '#E9E9EF',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    shadowColor: 'black',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    top: 0,
  },
});


const NavigationCardContainer = NavigationContainer.create(NavigationCard);

// Export these buil-in interaction modules.
NavigationCardContainer.CardStackPanResponder = NavigationCardStackPanResponder;
NavigationCardContainer.CardStackStyleInterpolator = NavigationCardStackStyleInterpolator;
NavigationCardContainer.PagerPanResponder = NavigationPagerPanResponder;
NavigationCardContainer.PagerStyleInterpolator = NavigationPagerStyleInterpolator;

module.exports = NavigationCardContainer;
