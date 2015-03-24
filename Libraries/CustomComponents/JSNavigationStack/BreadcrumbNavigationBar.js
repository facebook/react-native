/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule BreadcrumbNavigationBar
 */
'use strict';

var BreadcrumbNavigationBarStyles = require('BreadcrumbNavigationBarStyles');
var PixelRatio = require('PixelRatio');
var React = require('React');
var NavigationBarStyles = require('NavigationBarStyles');
var StaticContainer = require('StaticContainer.react');
var StyleSheet = require('StyleSheet');
var View = require('View');

var Interpolators = BreadcrumbNavigationBarStyles.Interpolators;
var PropTypes = React.PropTypes;

/**
 * Reusable props objects.
 */
var CRUMB_PROPS = Interpolators.map(() => {return {style: {}};});
var ICON_PROPS = Interpolators.map(() => {return {style: {}};});
var SEPARATOR_PROPS = Interpolators.map(() => {return {style: {}};});
var TITLE_PROPS = Interpolators.map(() => {return {style: {}};});
var RIGHT_BUTTON_PROPS = Interpolators.map(() => {return {style: {}};});


/**
 * TODO: Rename `observedTopOfStack` to `presentedIndex` in `NavigationStack`.
 */
var navStatePresentedIndex = function(navState) {
  if (navState.presentedIndex !== undefined) {
    return navState.presentedIndex;
  } else {
    return navState.observedTopOfStack;
  }
};


/**
 * The first route is initially rendered using a different style than all
 * future routes.
 *
 * @param {number} index Index of breadcrumb.
 * @return {object} Style config for initial rendering of index.
 */
var initStyle = function(index, presentedIndex) {
  return index === presentedIndex ? BreadcrumbNavigationBarStyles.Center[index] :
    index < presentedIndex ? BreadcrumbNavigationBarStyles.Left[index] :
    BreadcrumbNavigationBarStyles.Right[index];
};

var BreadcrumbNavigationBar = React.createClass({
  propTypes: {
    navigationOperations: PropTypes.shape({
      push: PropTypes.func,
      pop: PropTypes.func,
      replace: PropTypes.func,
      popToRoute: PropTypes.func,
      popToTop: PropTypes.func,
    }),
    navigationBarRouteMapper: PropTypes.shape({
      rightContentForRoute: PropTypes.func,
      titleContentForRoute: PropTypes.func,
      iconForRoute: PropTypes.func,
    }),
    navigationBarStyles: PropTypes.number,
  },

  _updateIndexProgress: function(progress, index, fromIndex, toIndex) {
    var amount = toIndex > fromIndex ? progress : (1 - progress);
    var oldDistToCenter = index - fromIndex;
    var newDistToCenter = index - toIndex;
    var interpolate;
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
      this.refs['crumb_' + index].setNativeProps(CRUMB_PROPS[index]);
    }
    if (interpolate.Icon(ICON_PROPS[index].style, amount)) {
      this.refs['icon_' + index].setNativeProps(ICON_PROPS[index]);
    }
    if (interpolate.Separator(SEPARATOR_PROPS[index].style, amount)) {
      this.refs['separator_' + index].setNativeProps(SEPARATOR_PROPS[index]);
    }
    if (interpolate.Title(TITLE_PROPS[index].style, amount)) {
      this.refs['title_' + index].setNativeProps(TITLE_PROPS[index]);
    }
    var right = this.refs['right_' + index];
    if (right &&
        interpolate.RightItem(RIGHT_BUTTON_PROPS[index].style, amount)) {
      right.setNativeProps(RIGHT_BUTTON_PROPS[index]);
    }
  },

  updateProgress: function(progress, fromIndex, toIndex) {
    var max = Math.max(fromIndex, toIndex);
    var min = Math.min(fromIndex, toIndex);
    for (var index = min; index <= max; index++) {
      this._updateIndexProgress(progress, index, fromIndex, toIndex);
    }
  },

  render: function() {
    var navState = this.props.navState;
    var icons = navState && navState.routeStack.map(this._renderOrReturnBreadcrumb);
    var titles = navState.routeStack.map(this._renderOrReturnTitle);
    var buttons = navState.routeStack.map(this._renderOrReturnRightButton);
    return (
      <View style={[styles.breadCrumbContainer, this.props.navigationBarStyles]}>
        {titles}
        {icons}
        {buttons}
      </View>
    );
  },

  _renderOrReturnBreadcrumb: function(route, index) {
    var uid = this.props.navState.idStack[index];
    var navBarRouteMapper = this.props.navigationBarRouteMapper;
    var navOps = this.props.navigationOperations;
    var alreadyRendered = this.refs['crumbContainer' + uid];
    if (alreadyRendered) {
      // Don't bother re-calculating the children
      return (
        <StaticContainer
          ref={'crumbContainer' + uid}
          key={'crumbContainer' + uid}
          shouldUpdate={false}
        />
      );
    }
    var firstStyles = initStyle(index, navStatePresentedIndex(this.props.navState));
    return (
      <StaticContainer
        ref={'crumbContainer' + uid}
        key={'crumbContainer' + uid}
        shouldUpdate={false}>
        <View ref={'crumb_' + index} style={firstStyles.Crumb}>
          <View ref={'icon_' + index} style={firstStyles.Icon}>
            {navBarRouteMapper.iconForRoute(route, navOps)}
          </View>
          <View ref={'separator_' + index} style={firstStyles.Separator}>
            {navBarRouteMapper.separatorForRoute(route, navOps)}
          </View>
        </View>
      </StaticContainer>
    );
  },

  _renderOrReturnTitle: function(route, index) {
    var navState = this.props.navState;
    var uid = navState.idStack[index];
    var alreadyRendered = this.refs['titleContainer' + uid];
    if (alreadyRendered) {
      // Don't bother re-calculating the children
      return (
        <StaticContainer
          ref={'titleContainer' + uid}
          key={'titleContainer' + uid}
          shouldUpdate={false}
        />
      );
    }
    var navBarRouteMapper = this.props.navigationBarRouteMapper;
    var titleContent = navBarRouteMapper.titleContentForRoute(
      navState.routeStack[index],
      this.props.navigationOperations
    );
    var firstStyles = initStyle(index, navStatePresentedIndex(this.props.navState));
    return (
      <StaticContainer
        ref={'titleContainer' + uid}
        key={'titleContainer' + uid}
        shouldUpdate={false}>
        <View ref={'title_' + index} style={firstStyles.Title}>
          {titleContent}
        </View>
      </StaticContainer>
    );
  },

  _renderOrReturnRightButton: function(route, index) {
    var navState = this.props.navState;
    var navBarRouteMapper = this.props.navigationBarRouteMapper;
    var uid = navState.idStack[index];
    var alreadyRendered = this.refs['rightContainer' + uid];
    if (alreadyRendered) {
      // Don't bother re-calculating the children
      return (
        <StaticContainer
          ref={'rightContainer' + uid}
          key={'rightContainer' + uid}
          shouldUpdate={false}
        />
      );
    }
    var rightContent = navBarRouteMapper.rightContentForRoute(
      navState.routeStack[index],
      this.props.navigationOperations
    );
    if (!rightContent) {
      return null;
    }
    var firstStyles = initStyle(index, navStatePresentedIndex(this.props.navState));
    return (
      <StaticContainer
        ref={'rightContainer' + uid}
        key={'rightContainer' + uid}
        shouldUpdate={false}>
        <View ref={'right_' + index} style={firstStyles.RightItem}>
          {rightContent}
        </View>
      </StaticContainer>
    );
  },
});

var styles = StyleSheet.create({
  breadCrumbContainer: {
    overflow: 'hidden',
    position: 'absolute',
    height: NavigationBarStyles.General.TotalNavHeight,
    top: 0,
    left: 0,
    width: NavigationBarStyles.General.ScreenWidth,
  },
});

module.exports = BreadcrumbNavigationBar;
