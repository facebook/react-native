/**
 * @providesModule NavigationBar
 * @typechecks
 */
'use strict';

var React = require('React');
var NavigationBarStyles = require('NavigationBarStyles');
var StaticContainer = require('StaticContainer.react');
var StyleSheet = require('StyleSheet');
var View = require('View');
var Text = require('Text');

var COMPONENT_NAMES = ['Title', 'LeftButton', 'RightButton'];

/**
 * TODO (janzer): Rename `observedTopOfStack` to `presentedIndex` in `NavigationStack`.
 */
var navStatePresentedIndex = function(navState) {
  if (navState.presentedIndex !== undefined) {
    return navState.presentedIndex;
  } else {
    return navState.observedTopOfStack;
  }
};

var NavigationBar = React.createClass({

  _getReusableProps: function(
    /*string*/componentName,
    /*number*/index
  ) /*object*/ {
    if (!this._reusableProps) {
      this._reusableProps = {};
    };
    var propStack = this._reusableProps[componentName];
    if (!propStack) {
      propStack = this._reusableProps[componentName] = [];
    }
    var props = propStack[index];
    if (!props) {
      props = propStack[index] = {style:{}};
    }
    return props;
  },

  _updateIndexProgress: function(
    /*number*/progress,
    /*number*/index,
    /*number*/fromIndex,
    /*number*/toIndex
  ) {
    var amount = toIndex > fromIndex ? progress : (1 - progress);
    var oldDistToCenter = index - fromIndex;
    var newDistToCenter = index - toIndex;
    var interpolate;
    if (oldDistToCenter > 0 && newDistToCenter === 0 ||
        newDistToCenter > 0 && oldDistToCenter === 0) {
      interpolate = NavigationBarStyles.Interpolators.RightToCenter;
    } else if (oldDistToCenter < 0 && newDistToCenter === 0 ||
               newDistToCenter < 0 && oldDistToCenter === 0) {
      interpolate = NavigationBarStyles.Interpolators.CenterToLeft;
    } else if (oldDistToCenter === newDistToCenter) {
      interpolate = NavigationBarStyles.Interpolators.RightToCenter;
    } else {
      interpolate = NavigationBarStyles.Interpolators.RightToLeft;
    }

    COMPONENT_NAMES.forEach(function (componentName) {
      var component = this.refs[componentName + index];
      var props = this._getReusableProps(componentName, index);
      if (component && interpolate[componentName](props.style, amount)) {
        component.setNativeProps(props);
      }
    }, this);
  },

  updateProgress: function(
    /*number*/progress,
    /*number*/fromIndex,
    /*number*/toIndex
  ) {
    var max = Math.max(fromIndex, toIndex);
    var min = Math.min(fromIndex, toIndex);
    for (var index = min; index <= max; index++) {
      this._updateIndexProgress(progress, index, fromIndex, toIndex);
    }
  },

  render: function() {
    var navState = this.props.navState;
    var components = COMPONENT_NAMES.map(function (componentName) {
      return navState.routeStack.map(
        this._renderOrReturnComponent.bind(this, componentName)
      );
    }, this);

    return (
      <View style={[styles.navBarContainer, this.props.navigationBarStyles]}>
        {components}
      </View>
    );
  },

  _renderOrReturnComponent: function(
    /*string*/componentName,
    /*object*/route,
    /*number*/index
  ) /*object*/ {
    var navState = this.props.navState;
    var navBarRouteMapper = this.props.navigationBarRouteMapper;
    var uid = navState.idStack[index];
    var containerRef = componentName + 'Container' + uid;
    var alreadyRendered = this.refs[containerRef];
    if (alreadyRendered) {
      // Don't bother re-calculating the children
      return (
        <StaticContainer
          ref={containerRef}
          key={containerRef}
          shouldUpdate={false}
        />
      );
    }

    var content = navBarRouteMapper[componentName](
      navState.routeStack[index],
      this.props.navigationOperations,
      index,
      this.props.navState
    );
    if (!content) {
      return null;
    }

    var initialStage = index === navStatePresentedIndex(this.props.navState) ?
      NavigationBarStyles.Stages.Center : NavigationBarStyles.Stages.Left;
    return (
      <StaticContainer
        ref={containerRef}
        key={containerRef}
        shouldUpdate={false}>
        <View ref={componentName + index} style={initialStage[componentName]}>
          {content}
        </View>
      </StaticContainer>
    );
  },

});


var styles = StyleSheet.create({
  navBarContainer: {
    position: 'absolute',
    height: NavigationBarStyles.General.TotalNavHeight,
    top: 0,
    left: 0,
    width: NavigationBarStyles.General.ScreenWidth,
    backgroundColor: 'transparent',
  },
});

module.exports = NavigationBar;
