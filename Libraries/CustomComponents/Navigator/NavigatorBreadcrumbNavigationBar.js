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
 * @providesModule NavigatorBreadcrumbNavigationBar
 */
'use strict';

var NavigatorBreadcrumbNavigationBarStyles = require('NavigatorBreadcrumbNavigationBarStyles');
var NavigatorNavigationBarStylesAndroid = require('NavigatorNavigationBarStylesAndroid');
var NavigatorNavigationBarStylesIOS = require('NavigatorNavigationBarStylesIOS');
var Platform = require('Platform');
var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');

var { Map } = require('immutable');

var guid = require('guid');
var invariant = require('fbjs/lib/invariant');

var Interpolators = NavigatorBreadcrumbNavigationBarStyles.Interpolators;
var NavigatorNavigationBarStyles = Platform.OS === 'android' ?
  NavigatorNavigationBarStylesAndroid : NavigatorNavigationBarStylesIOS;
var PropTypes = React.PropTypes;

/**
 * Reusable props objects.
 */
var CRUMB_PROPS = Interpolators.map(() => ({style: {}}));
var ICON_PROPS = Interpolators.map(() => ({style: {}}));
var SEPARATOR_PROPS = Interpolators.map(() => ({style: {}}));
var TITLE_PROPS = Interpolators.map(() => ({style: {}}));
var RIGHT_BUTTON_PROPS = Interpolators.map(() => ({style: {}}));


var navStatePresentedIndex = function(navState) {
  if (navState.presentedIndex !== undefined) {
    return navState.presentedIndex;
  }
  // TODO: rename `observedTopOfStack` to `presentedIndex` in `NavigatorIOS`
  return navState.observedTopOfStack;
};


/**
 * The first route is initially rendered using a different style than all
 * future routes.
 *
 * @param {number} index Index of breadcrumb.
 * @return {object} Style config for initial rendering of index.
 */
var initStyle = function(index, presentedIndex) {
  return index === presentedIndex ? NavigatorBreadcrumbNavigationBarStyles.Center[index] :
    index < presentedIndex ? NavigatorBreadcrumbNavigationBarStyles.Left[index] :
    NavigatorBreadcrumbNavigationBarStyles.Right[index];
};

var NavigatorBreadcrumbNavigationBar = React.createClass({
  propTypes: {
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
  },

  statics: {
    Styles: NavigatorBreadcrumbNavigationBarStyles,
  },

  _updateIndexProgress: function(progress, index, fromIndex, toIndex) {
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
  },

  updateProgress: function(progress, fromIndex, toIndex) {
    var max = Math.max(fromIndex, toIndex);
    var min = Math.min(fromIndex, toIndex);
    for (var index = min; index <= max; index++) {
      this._updateIndexProgress(progress, index, fromIndex, toIndex);
    }
  },

  onAnimationStart: function(fromIndex, toIndex) {
    var max = Math.max(fromIndex, toIndex);
    var min = Math.min(fromIndex, toIndex);
    for (var index = min; index <= max; index++) {
      this._setRenderViewsToHardwareTextureAndroid(index, true);
    }
  },

  onAnimationEnd: function() {
    var max = this.props.navState.routeStack.length - 1;
    for (var index = 0; index <= max; index++) {
      this._setRenderViewsToHardwareTextureAndroid(index, false);
    }
  },

  _setRenderViewsToHardwareTextureAndroid: function(index, renderToHardwareTexture) {
    var props = {
      renderToHardwareTextureAndroid: renderToHardwareTexture,
    };

    this._setPropsIfExists('icon_' + index, props);
    this._setPropsIfExists('separator_' + index, props);
    this._setPropsIfExists('title_' + index, props);
    this._setPropsIfExists('right_' + index, props);
  },

  componentWillMount: function() {
    this._reset();
  },

  render: function() {
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
  },

  immediatelyRefresh: function() {
    this._reset();
    this.forceUpdate();
  },

  _reset() {
    this._key = guid();
    this._descriptors = {
      crumb: new Map(),
      title: new Map(),
      right: new Map(),
    };
  },

  _getBreadcrumb: function(route, index) {
    if (this._descriptors.crumb.has(route)) {
      return this._descriptors.crumb.get(route);
    }

    var navBarRouteMapper = this.props.routeMapper;
    var firstStyles = initStyle(index, navStatePresentedIndex(this.props.navState));

    var breadcrumbDescriptor = (
      <View
        key={'crumb_' + index}
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

    this._descriptors.crumb = this._descriptors.crumb.set(route, breadcrumbDescriptor);
    return breadcrumbDescriptor;
  },

  _getTitle: function(route, index) {
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
  },

  _getRightButton: function(route, index) {
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
  },

  _setPropsIfExists: function(ref, props) {
    var ref = this.refs[ref];
    ref && ref.setNativeProps(props);
  },
});

var styles = StyleSheet.create({
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
