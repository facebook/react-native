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
 * @providesModule NavigatorBreadcrumbNavigationBar
 */
'use strict';

const NavigatorBreadcrumbNavigationBarStyles = require('NavigatorBreadcrumbNavigationBarStyles');
const NavigatorNavigationBarStylesAndroid = require('NavigatorNavigationBarStylesAndroid');
const NavigatorNavigationBarStylesIOS = require('NavigatorNavigationBarStylesIOS');
const Platform = require('Platform');
const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');

const guid = require('guid');
const invariant = require('fbjs/lib/invariant');

const { Map } = require('immutable');

const Interpolators = NavigatorBreadcrumbNavigationBarStyles.Interpolators;
const NavigatorNavigationBarStyles = Platform.OS === 'android' ?
  NavigatorNavigationBarStylesAndroid : NavigatorNavigationBarStylesIOS;
const PropTypes = React.PropTypes;

/**
 * Reusable props objects.
 */
const CRUMB_PROPS = Interpolators.map(() => ({style: {}}));
const ICON_PROPS = Interpolators.map(() => ({style: {}}));
const SEPARATOR_PROPS = Interpolators.map(() => ({style: {}}));
const TITLE_PROPS = Interpolators.map(() => ({style: {}}));
const RIGHT_BUTTON_PROPS = Interpolators.map(() => ({style: {}}));


function navStatePresentedIndex(navState) {
  if (navState.presentedIndex !== undefined) {
    return navState.presentedIndex;
  }
  // TODO: rename `observedTopOfStack` to `presentedIndex` in `NavigatorIOS`
  return navState.observedTopOfStack;
}


/**
 * The first route is initially rendered using a different style than all
 * future routes.
 *
 * @param {number} index Index of breadcrumb.
 * @return {object} Style config for initial rendering of index.
 */
function initStyle(index, presentedIndex) {
  return index === presentedIndex ? NavigatorBreadcrumbNavigationBarStyles.Center[index] :
    index < presentedIndex ? NavigatorBreadcrumbNavigationBarStyles.Left[index] :
    NavigatorBreadcrumbNavigationBarStyles.Right[index];
}

class NavigatorBreadcrumbNavigationBar extends React.Component {
  static propTypes = {
    navigator: PropTypes.shape({
      push: PropTypes.func,
      pop: PropTypes.func,
      replace: PropTypes.func,
      popToRoute: PropTypes.func,
      popToTop: PropTypes.func,
    }),
    routeMapper: PropTypes.shape({
      rightContentForRoute: PropTypes.func,
      titleContentForRoute: PropTypes.func,
      iconForRoute: PropTypes.func,
    }),
    navState: React.PropTypes.shape({
      routeStack: React.PropTypes.arrayOf(React.PropTypes.object),
      presentedIndex: React.PropTypes.number,
    }),
    style: View.propTypes.style,
  };

  static Styles = NavigatorBreadcrumbNavigationBarStyles;

  _updateIndexProgress(progress, index, fromIndex, toIndex) {
    var amount = toIndex > fromIndex ? progress : (1 - progress);
    var oldDistToCenter = index - fromIndex;
    var newDistToCenter = index - toIndex;
    var interpolate;
    invariant(
      Interpolators[index],
      'Cannot find breadcrumb interpolators for ' + index
    );
    if (oldDistToCenter > 0 && newDistToCenter === 0 ||
        newDistToCenter > 0 && oldDistToCenter === 0) {
      interpolate = Interpolators[index].RightToCenter;
    } else if (oldDistToCenter < 0 && newDistToCenter === 0 ||
               newDistToCenter < 0 && oldDistToCenter === 0) {
      interpolate = Interpolators[index].CenterToLeft;
    } else if (oldDistToCenter === newDistToCenter) {
      interpolate = Interpolators[index].RightToCenter;
    } else {
      interpolate = Interpolators[index].RightToLeft;
    }

    if (interpolate.Crumb(CRUMB_PROPS[index].style, amount)) {
      this._setPropsIfExists('crumb_' + index, CRUMB_PROPS[index]);
    }
    if (interpolate.Icon(ICON_PROPS[index].style, amount)) {
      this._setPropsIfExists('icon_' + index, ICON_PROPS[index]);
    }
    if (interpolate.Separator(SEPARATOR_PROPS[index].style, amount)) {
      this._setPropsIfExists('separator_' + index, SEPARATOR_PROPS[index]);
    }
    if (interpolate.Title(TITLE_PROPS[index].style, amount)) {
      this._setPropsIfExists('title_' + index, TITLE_PROPS[index]);
    }
    var right = this.refs['right_' + index];

    const rightButtonStyle = RIGHT_BUTTON_PROPS[index].style;
    if (right && interpolate.RightItem(rightButtonStyle, amount)) {
      right.setNativeProps({
        style: rightButtonStyle,
        pointerEvents: rightButtonStyle.opacity === 0 ? 'none' : 'auto',
      });
    }
  }

  updateProgress(progress, fromIndex, toIndex) {
    var max = Math.max(fromIndex, toIndex);
    var min = Math.min(fromIndex, toIndex);
    for (var index = min; index <= max; index++) {
      this._updateIndexProgress(progress, index, fromIndex, toIndex);
    }
  }

  onAnimationStart(fromIndex, toIndex) {
    var max = Math.max(fromIndex, toIndex);
    var min = Math.min(fromIndex, toIndex);
    for (var index = min; index <= max; index++) {
      this._setRenderViewsToHardwareTextureAndroid(index, true);
    }
  }

  onAnimationEnd() {
    var max = this.props.navState.routeStack.length - 1;
    for (var index = 0; index <= max; index++) {
      this._setRenderViewsToHardwareTextureAndroid(index, false);
    }
  }

  _setRenderViewsToHardwareTextureAndroid(index, renderToHardwareTexture) {
    var props = {
      renderToHardwareTextureAndroid: renderToHardwareTexture,
    };

    this._setPropsIfExists('icon_' + index, props);
    this._setPropsIfExists('separator_' + index, props);
    this._setPropsIfExists('title_' + index, props);
    this._setPropsIfExists('right_' + index, props);
  }

  componentWillMount() {
    this._reset();
  }

  render() {
    var navState = this.props.navState;
    var icons = navState && navState.routeStack.map(this._getBreadcrumb);
    var titles = navState.routeStack.map(this._getTitle);
    var buttons = navState.routeStack.map(this._getRightButton);

    return (
      <View
        key={this._key}
        style={[styles.breadCrumbContainer, this.props.style]}>
        {titles}
        {icons}
        {buttons}
      </View>
    );
  }

  immediatelyRefresh() {
    this._reset();
    this.forceUpdate();
  }

  _reset() {
    this._key = guid();
    this._descriptors = {
      title: new Map(),
      right: new Map(),
    };
  }

  _getBreadcrumb = (route, index) => {
    /**
     * To prevent the case where titles on an empty navigation stack covers the first icon and
     * becomes partially unpressable, we set the first breadcrumb to be unpressable by default, and
     * make it pressable when there are multiple items in the stack.
     */
    const pointerEvents = (
      (this.props.navState.routeStack.length <= 1 && index === 0) ?
      'none' :
      'auto'
    );
    const navBarRouteMapper = this.props.routeMapper;
    const firstStyles = initStyle(index, navStatePresentedIndex(this.props.navState));

    var breadcrumbDescriptor = (
      <View
        key={'crumb_' + index}
        pointerEvents={pointerEvents}
        ref={'crumb_' + index}
        style={firstStyles.Crumb}>
        <View ref={'icon_' + index} style={firstStyles.Icon}>
          {navBarRouteMapper.iconForRoute(route, this.props.navigator)}
        </View>
        <View ref={'separator_' + index} style={firstStyles.Separator}>
          {navBarRouteMapper.separatorForRoute(route, this.props.navigator)}
        </View>
      </View>
    );

    return breadcrumbDescriptor;
  };

  _getTitle = (route, index) => {
    if (this._descriptors.title.has(route)) {
      return this._descriptors.title.get(route);
    }

    var titleContent = this.props.routeMapper.titleContentForRoute(
      this.props.navState.routeStack[index],
      this.props.navigator
    );
    var firstStyles = initStyle(index, navStatePresentedIndex(this.props.navState));

    var titleDescriptor = (
      <View
        key={'title_' + index}
        ref={'title_' + index}
        style={firstStyles.Title}>
        {titleContent}
      </View>
    );
    this._descriptors.title = this._descriptors.title.set(route, titleDescriptor);
    return titleDescriptor;
  };

  _getRightButton = (route, index) => {
    if (this._descriptors.right.has(route)) {
      return this._descriptors.right.get(route);
    }
    var rightContent = this.props.routeMapper.rightContentForRoute(
      this.props.navState.routeStack[index],
      this.props.navigator
    );
    if (!rightContent) {
      this._descriptors.right = this._descriptors.right.set(route, null);
      return null;
    }
    var firstStyles = initStyle(index, navStatePresentedIndex(this.props.navState));
    var rightButtonDescriptor = (
      <View
        key={'right_' + index}
        ref={'right_' + index}
        style={firstStyles.RightItem}>
        {rightContent}
      </View>
    );
    this._descriptors.right = this._descriptors.right.set(route, rightButtonDescriptor);
    return rightButtonDescriptor;
  };

  _setPropsIfExists(ref, props) {
    var ref = this.refs[ref];
    ref && ref.setNativeProps(props);
  }
}

const styles = StyleSheet.create({
  breadCrumbContainer: {
    overflow: 'hidden',
    position: 'absolute',
    height: NavigatorNavigationBarStyles.General.TotalNavHeight,
    top: 0,
    left: 0,
    right: 0,
  },
});

module.exports = NavigatorBreadcrumbNavigationBar;
