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
 * @providesModule NavigatorNavigationBar
 */
'use strict';

var React = require('React');
var NavigatorNavigationBarStyles = require('NavigatorNavigationBarStyles');
var StaticContainer = require('StaticContainer.react');
var StyleSheet = require('StyleSheet');
var View = require('View');

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

var NavigatorNavigationBar = React.createClass({

  statics: {
    Styles: NavigatorNavigationBarStyles,
  },

  _getReusableProps: function(
    /*string*/componentName,
    /*number*/index
  ) /*object*/ {
    if (!this._reusableProps) {
      this._reusableProps = {};
    }
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
      interpolate = NavigatorNavigationBarStyles.Interpolators.RightToCenter;
    } else if (oldDistToCenter < 0 && newDistToCenter === 0 ||
               newDistToCenter < 0 && oldDistToCenter === 0) {
      interpolate = NavigatorNavigationBarStyles.Interpolators.CenterToLeft;
    } else if (oldDistToCenter === newDistToCenter) {
      interpolate = NavigatorNavigationBarStyles.Interpolators.RightToCenter;
    } else {
      interpolate = NavigatorNavigationBarStyles.Interpolators.RightToLeft;
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
      this.props.navigator,
      index,
      this.props.navState
    );
    if (!content) {
      return null;
    }

    var initialStage = index === navStatePresentedIndex(this.props.navState) ?
      NavigatorNavigationBarStyles.Stages.Center : NavigatorNavigationBarStyles.Stages.Left;
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
    height: NavigatorNavigationBarStyles.General.TotalNavHeight,
    top: 0,
    left: 0,
    width: NavigatorNavigationBarStyles.General.ScreenWidth,
    backgroundColor: 'transparent',
  },
});

module.exports = NavigatorNavigationBar;
