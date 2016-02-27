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
 * @providesModule NavigationCardStack
 * @flow
 */
'use strict';

const NavigationAnimatedView = require('NavigationAnimatedView');
const NavigationCard = require('NavigationCard');
const NavigationContainer = require('NavigationContainer');
const React = require('React');
const StyleSheet = require('StyleSheet');

const emptyFunction = require('emptyFunction');

const {PropTypes} = React;

import type {
  NavigationParentState,
  NavigationState,
} from 'NavigationStateUtils';

import type {
  Layout,
  OverlayRenderer,
  Position,
  SceneRenderer,
} from 'NavigationAnimatedView';

type Props = {
  navigationState: NavigationParentState,
  renderOverlay: OverlayRenderer,
  renderScene: SceneRenderer,
};

/**
 * A controlled navigation view that renders a list of cards.
 */
class NavigationCardStack extends React.Component {
  _renderScene : SceneRenderer;

  constructor(props: Props, context: any) {
    super(props, context);
    this._renderScene = this._renderScene.bind(this);
  }

  render(): ReactElement {
    return (
      <NavigationAnimatedView
        navigationState={this.props.navigationState}
        style={[styles.animatedView, this.props.style]}
        renderOverlay={this.props.renderOverlay}
        renderScene={this._renderScene}
      />
    );
  }

  _renderScene(
    navigationState: NavigationState,
    index: number,
    position: Position,
    layout: Layout,
  ): ReactElement {
    return (
      <NavigationCard
        key={navigationState.key}
        index={index}
        navigationState={navigationState}
        position={position}
        layout={layout}>
        {this.props.renderScene(navigationState, index, position, layout)}
      </NavigationCard>
    );
  }
}

NavigationCardStack.propTypes = {
  navigationState: PropTypes.object.isRequired,
  renderOverlay: PropTypes.func,
  renderScene: PropTypes.func.isRequired,
};

NavigationCardStack.defaultProps = {
  renderOverlay: emptyFunction.thatReturnsNull,
};

const styles = StyleSheet.create({
  animatedView: {
    flex: 1,
  },
});

module.exports = NavigationContainer.create(NavigationCardStack);
