/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationAnimatedView
 * @flow
 */
'use strict';

/**
 * WARNING: NavigationAnimatedView will be deprecated soon.
 * Use NavigationTransitioner instead.
 */

const Animated = require('Animated');
const NavigationPropTypes = require('NavigationPropTypes');
const NavigationScenesReducer = require('NavigationScenesReducer');
const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');

import type {
  NavigationActionCaller,
  NavigationAnimatedValue,
  NavigationAnimationSetter,
  NavigationLayout,
  NavigationState,
  NavigationScene,
  NavigationSceneRenderer,
} from 'NavigationTypeDefinition';

type Props = {
  applyAnimation: NavigationAnimationSetter,
  navigationState: NavigationState,
  onNavigate: NavigationActionCaller,
  renderOverlay: ?NavigationSceneRenderer,
  renderScene: NavigationSceneRenderer,
  style: any,
};

type State = {
  layout: NavigationLayout,
  position: NavigationAnimatedValue,
  progress: NavigationAnimatedValue,
  scenes: Array<NavigationScene>,
};

const {PropTypes} = React;

function applyDefaultAnimation(
  position: NavigationAnimatedValue,
  navigationState: NavigationState,
): void {
  Animated.spring(
    position,
    {
      bounciness: 0,
      toValue: navigationState.index,
    }
  ).start();
}

class NavigationAnimatedView
  extends React.Component<any, Props, State> {

  _onLayout: (event: any) => void;
  _onProgressChange: (data: {value: number}) => void;
  _positionListener: any;

  props: Props;
  state: State;

  static propTypes = {
    applyAnimation: PropTypes.func,
    navigationState: NavigationPropTypes.navigationState.isRequired,
    onNavigate: PropTypes.func.isRequired,
    renderOverlay: PropTypes.func,
    renderScene: PropTypes.func.isRequired,
  };

  static defaultProps = {
    applyAnimation: applyDefaultAnimation,
  };

  constructor(props: Props, context: any) {
    super(props, context);

    // The initial layout isn't measured. Measured layout will be only available
    // when the component is mounted.
    const layout = {
      height: new Animated.Value(0),
      initHeight: 0,
      initWidth: 0,
      isMeasured: false,
      width: new Animated.Value(0),
    };

    this.state = {
      layout,
      position: new Animated.Value(this.props.navigationState.index),
      // This `progress` is a adummy placeholder value to meet the values
      // as `NavigationSceneRendererProps` requires.
      progress: new Animated.Value(1),
      scenes: NavigationScenesReducer([], this.props.navigationState),
    };
  }

  componentWillMount(): void {
    this._onLayout = this._onLayout.bind(this);
    this._onProgressChange = this._onProgressChange.bind(this);
  }

  componentDidMount(): void {
    this._positionListener =
      this.state.position.addListener(this._onProgressChange);
  }

  componentWillReceiveProps(nextProps: Props): void {
    if (nextProps.navigationState !== this.props.navigationState) {
      this.setState({
        scenes: NavigationScenesReducer(
          this.state.scenes,
          nextProps.navigationState,
          this.props.navigationState
        ),
      });
    }
  }

  componentDidUpdate(lastProps: Props): void {
    if (lastProps.navigationState.index !== this.props.navigationState.index) {
      this.props.applyAnimation(
        this.state.position,
        this.props.navigationState,
        lastProps.navigationState
      );
    }
  }

  componentWillUnmount(): void {
    this.state.position.removeListener(this._positionListener);
  }

  _onProgressChange(data: Object): void {
    const delta = Math.abs(data.value - this.props.navigationState.index);
    if (delta > Number.EPSILON) {
      return;
    }

    const scenes = this.state.scenes.filter(scene => {
      return !scene.isStale;
    });

    if (scenes.length !== this.state.scenes.length) {
      this.setState({ scenes });
    }
  }

  render(): ReactElement<any> {
    const overlay = this._renderOverlay();
    const scenes = this._renderScenes();
    return (
      <View
        onLayout={this._onLayout}
        style={this.props.style}>
        <View style={styles.scenes} key="scenes">
          {scenes}
        </View>
        {overlay}
      </View>
    );
  }

  _renderScenes(): Array<?ReactElement<any>> {
    return this.state.scenes.map(this._renderScene, this);
  }

  _renderScene(scene: NavigationScene): ?ReactElement<any> {
    const {
      navigationState,
      onNavigate,
      renderScene,
    } = this.props;

    const {
      position,
      progress,
      scenes,
    } = this.state;

    return renderScene({
      layout: this.state.layout,
      navigationState,
      onNavigate,
      position,
      progress,
      scene,
      scenes,
    });
  }

  _renderOverlay(): ?ReactElement<any> {
    if (this.props.renderOverlay) {
      const {
        navigationState,
        onNavigate,
        renderOverlay,
      } = this.props;

      const {
        position,
        progress,
        scenes,
      } = this.state;

      return renderOverlay({
        layout: this.state.layout,
        navigationState,
        onNavigate,
        position,
        progress,
        scene: scenes[navigationState.index],
        scenes,
      });
    }
    return null;
  }

  _onLayout(event: any): void {
    const {height, width} = event.nativeEvent.layout;

    const layout = {
      ...this.state.layout,
      initHeight: height,
      initWidth: width,
      isMeasured: true,
    };

    layout.height.setValue(height);
    layout.width.setValue(width);

    this.setState({ layout });
  }
}

const styles = StyleSheet.create({
  scenes: {
    flex: 1,
  },
});

module.exports = NavigationAnimatedView;
