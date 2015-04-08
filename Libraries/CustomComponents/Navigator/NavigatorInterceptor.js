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
 * @providesModule NavigatorInterceptor
 */
'use strict';

var React = require('React');

var getNavigatorContext = require('getNavigatorContext');

var NavigatorInterceptor = React.createClass({

  contextTypes: {
    navigator: React.PropTypes.object,
  },

  componentWillMount: function() {
    this.navigator = getNavigatorContext(this);
  },

  componentDidMount: function() {
    this.navigator.setHandler(this._navigatorHandleRequest);
  },

  childContextTypes: {
    navigator: React.PropTypes.object,
  },

  getChildContext: function() {
    return {
      navigator: {
        ...this.navigator,
        setHandler: (handler) => {
          this._childNavigationHandler = handler;
        },
      }
    };
  },

  componentWillUnmount: function() {
    this.navigator.setHandler(null);
  },

  _navigatorHandleRequest: function(action, arg1, arg2) {
    if (this._interceptorHandle(action, arg1, arg2)) {
      return true;
    }
    if (this._childNavigationHandler && this._childNavigationHandler(action, arg1, arg2)) {
      return true;
    }
  },

  _interceptorHandle: function(action, arg1, arg2) {
    if (this.props.onRequest && this.props.onRequest(action, arg1, arg2)) {
      return true;
    }
    switch (action) {
      case 'pop':
        return this.props.onPopRequest && this.props.onPopRequest(action, arg1, arg2);
      case 'push':
        return this.props.onPushRequest && this.props.onPushRequest(action, arg1, arg2);
      default:
        return false;
    }
  },

  render: function() {
    return this.props.children;
  },

});

module.exports = NavigatorInterceptor;
