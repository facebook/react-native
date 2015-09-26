/**
 * @providesModule TextInput
 */
'use strict';

var React = require('React');
var PropTypes = React.PropTypes;
var webifyStyle = require('webifyStyle');

var ENTER_KEY = '13';

var TextInput = React.createClass({

    propTypes: {

        /**
         * Can tell TextInput to automatically capitalize certain characters.
         *
         * - characters: all characters,
         * - words: first letter of each word
         * - sentences: first letter of each sentence (default)
         * - none: don't auto capitalize anything
         */
        autoCapitalize: PropTypes.oneOf([
          'none',
          'sentences',
          'words',
          'characters',
        ]),

        /**
         * If false, disables auto-correct. Default value is true.
         */
        autoCorrect: PropTypes.bool,

        /**
         * If true, focuses the input on componentDidMount. Default value is false.
         */
        autoFocus: PropTypes.bool,

        /**
         * If false, text is not editable. Default value is true.
         */
        editable: PropTypes.bool,

        /**
         * Callback that is called when the text input is blurred
         */
        onBlur: PropTypes.func,

        /**
         * Callback that is called when the text input is focused
         */
        onFocus: PropTypes.func,

        /**
         * Callback that is called when the text input's text changes.
         */
        onChange: PropTypes.func,

        /**
         * Callback that is called when the text input's text changes.
         * Changed text is passed as an argument to the callback handler.
         */
        onChangeText: PropTypes.func,

        /**
         * If true, the text input obscures the text entered so that sensitive text
         * like passwords stay secure. Default value is false.
         */
        password: PropTypes.bool,

        /**
         * The string that will be rendered before text input has been entered
         */
        placeholder: PropTypes.string,

        /**
         * The controlled input component value
         */
        value: PropTypes.string,

        /**
         * The default value for the text input
         */
        defaultValue: PropTypes.string,

        /*
        * If true, the text field will not be editable
        */
        manualInput: PropTypes.bool,

        /*
        * If true, the text input will not be editable until after it is rendered.
        * Set this for legacy Android devices that have weird focus behavior.
        */
        delayEditability: PropTypes.bool,
    },

    getDefaultProps: function() {
        return {
            editable: true,
        };
    },

    componentWillMount: function() {
        this._canFocus = !this.props.delayEditability;
    },

    componentDidMount: function() {
        if (this.props.delayEditability) {
            // HACK keep the input disabled long enough for all events to be processed
            // but not too long that a user's legitimate focus attempt will be discarded.
            setTimeout(() => {
                this._canFocus = true;
                this.refs.input.disabled = this._isDisabled();
            }, 100);
        }
    },

    render: function() {
        return (
            <input
                ref="input"
                {...this.props}
                onChange={this._onChange}
                onKeyDown={this._onKeyDown}
                disabled={!this._canFocus || this._isDisabled()}
                type={this.props.password ? "password" : "text"}
                style={webifyStyle(this.props.style)}
            />
        );
    },

    _isDisabled: function() {
        return !this.props.editable || this.props.manualInput;
    },

    _getDOMNode: function() {
        return this.refs.input;
    },

    _onKeyDown: function(e) {
        if (e.which == ENTER_KEY) {
            if (this.props.onSubmitEditing) {
                this.props.onSubmitEditing();
            }
        }
        if (this.props.onKeyDown) {
            this.props.onKeyDown(e);
        }
    },

    _onChange: function(e) {
        if (this.props.onChange) {
            this.props.onChange(e);
        }
        if (this.props.onChangeText) {
            this.props.onChangeText(this._getDOMNode().value);
        }
    },

    focus: function() {
        this._getDOMNode().focus();
    },

    blur: function() {
        this._getDOMNode().blur();
    },

});

module.exports = TextInput;
