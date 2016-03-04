/**
 * @providesModule WebView
 */
'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var webifyStyle = require('webifyStyle');
var keyMirror = require('keymirror');

var WebViewState = keyMirror({
    IDLE: null,
    LOADING: null,
    ERROR: null,
});

var styles = StyleSheet.create({

    container: {
        flex: 1,
    },

    iframe: {
        flex: 1,
    },

    hidden: {
        height: 0,
        flex: 0,
    },

});

var WebView = React.createClass({

    propTypes: {
        url: React.PropTypes.string,
        renderError: React.PropTypes.func,
        renderLoading: React.PropTypes.func,
        startInLoadingState: React.PropTypes.bool,
    },

    getInitialState: function() {
        return {
            viewState: WebViewState.IDLE,
        };
    },

    componentWillMount: function() {
        if (this.props.startInLoadingState) {
            this.setState({viewState: WebViewState.LOADING});
        }
    },

    render: function() {
        var isLoading = this.state.viewState == WebViewState.LOADING;
        var isErrored = this.state.viewState == WebViewState.ERROR;
        var containerStyle = webifyStyle([styles.container, this.props.style]);
        var iframeStyle = webifyStyle([styles.iframe, (isLoading || isErrored) && styles.hidden]);
        return (
            <div style={containerStyle}>
                {isLoading && this._renderLoadingView()}
                {isErrored && this._renderErrorView()}
                <iframe
                    style={iframeStyle}
                    src={this.props.url}
                    onLoad={this._onLoad}
                    onError={this._onError}>
                </iframe>
            </div>
        );
    },

    _renderLoadingView: function() {
        if (this.props.renderLoading) {
            return this.props.renderLoading();
        }
        return null;
    },

    _renderErrorView: function() {
        if (this.props.renderError) {
            return this.props.renderError();
        }
        return null;
    },

    _onLoad: function() {
        this.setState({viewState: WebViewState.IDLE});
    },

    _onError: function() {
        this.setState({viewState: WebViewState.ERROR});
    },

});

module.exports = WebView;
