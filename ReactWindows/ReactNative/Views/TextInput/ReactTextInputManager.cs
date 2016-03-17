using Newtonsoft.Json.Linq;
using ReactNative.Reflection;
using ReactNative.UIManager;
using ReactNative.Views.Text;
using System;
using System.Collections.Generic;
using Windows.System;
using Windows.UI;
using Windows.UI.Text;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// View manager for <see cref="ReactTextBox"/>.
    /// </summary>
    class ReactTextInputManager : BaseViewManager<ReactTextBox, ReactTextInputShadowNode>
    {
        private static readonly int FocusTextInput = 1;
        private static readonly int BlurTextInput = 2;

        private bool _onSelectionChange;

        /// <summary>
        /// The name of the view manager.
        /// </summary>
        public override string Name
        {
            get
            {
                return "RCTTextBox";
            }
        }

        /// <summary>
        /// The exported custom bubbling event types.
        /// </summary>
        public override IReadOnlyDictionary<string, object> ExportedCustomBubblingEventTypeConstants
        {
            get
            {
                return new Dictionary<string, object>()
                {
                    {
                        "topSubmitEditing",
                        new Dictionary<string, object>()
                        {
                            {
                                "phasedRegistrationNames",
                                new Dictionary<string, string>()
                                {
                                    { "bubbled" , "onSubmitEditing" },
                                    { "captured" , "onSubmitEditingCapture" }
                                }
                            }
                        }
                    },
                    {
                        "topEndEditing",
                        new Dictionary<string, object>()
                        {
                            {
                                "phasedRegistrationNames",
                                new Dictionary<string, string>()
                                {
                                    { "bubbled" , "onEndEditing" },
                                    { "captured" , "onEndEditingCapture" }
                                }
                            }
                        }
                    },
                    {
                        "topFocus",
                        new Dictionary<string, object>()
                        {
                            {
                                "phasedRegistrationNames",
                                new Dictionary<string, string>()
                                {
                                    { "bubbled" , "onFocus" },
                                    { "captured" , "onFocusCapture" }
                                }
                            }
                        }
                    },
                    {
                        "topBlur",
                        new Dictionary<string, object>()
                        {
                            {
                                "phasedRegistrationNames",
                                new Dictionary<string, string>()
                                {
                                    { "bubbled" , "onBlur" },
                                    { "captured" , "onBlurCapture" }
                                }
                            }
                        }
                    },
                };
            }
        }

        /// <summary>
        /// The commands map for the <see cref="ReactTextInputManager"/>.
        /// </summary>
        public override IReadOnlyDictionary<string, object> CommandsMap
        {
            get
            {
                return new Dictionary<string, object>()
                {
                    { "focusTextInput", FocusTextInput },
                    { "blurTextInput", BlurTextInput },
                };
            }
        }

        /// <summary>
        /// Sets the font size on the <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="fontSize">The font size.</param>
        [ReactProperty(ViewProperties.FontSize)]
        public void SetFontSize(ReactTextBox view, double fontSize)
        {
            view.FontSize = fontSize;
        }

        /// <summary>
        /// Sets the font color for the node.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="color">The masked color value.</param>
        [ReactProperty(ViewProperties.Color, CustomType = "Color")]
        public void SetColor(ReactTextBox view, uint? color)
        {
            if (color.HasValue)
            {
                view.Foreground = new SolidColorBrush(ColorHelpers.Parse(color.Value));
            }
            else
            {
                view.Foreground = new SolidColorBrush(Colors.Black);
            }
        }

        /// <summary>
        /// Sets the font family for the node.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="familyName">The font family.</param>
        [ReactProperty(ViewProperties.FontFamily)]
        public void SetFontFamily(ReactTextBox view, string familyName)
        {
            if (familyName != null)
            {
                view.FontFamily = new FontFamily(familyName);
            }
            else
            {
                view.FontFamily = new FontFamily("Segoe UI");
            }
        }

        /// <summary>
        /// Sets the font weight for the node.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="fontWeightString">The font weight string.</param>
        [ReactProperty(ViewProperties.FontWeight)]
        public void SetFontWeight(ReactTextBox view, string fontWeightString)
        {
            var fontWeight = FontStyleHelpers.ParseFontWeight(fontWeightString);
            if (fontWeight.HasValue)
            {
                view.FontWeight = fontWeight.Value;
            }
            else
            {
                view.FontWeight = FontWeights.Normal;
            }
        }

        /// <summary>
        /// Sets the font style for the node.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="fontStyleString">The font style string.</param>
        [ReactProperty(ViewProperties.FontStyle)]
        public void SetFontStyle(ReactTextBox view, string fontStyleString)
        {
            var fontStyle = FontStyleHelpers.ParseFontStyle(fontStyleString);
            if (fontStyle.HasValue)
            {
                view.FontStyle = fontStyle.Value;
            }
            else
            {
                view.FontStyle = FontStyle.Normal;
            }
        }

        /// <summary>
        /// Sets whether to track selection changes on the <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="onSelectionChange">The indicator.</param>
        [ReactProperty("onSelectionChange", DefaultBoolean = false)]
        public void SetSelectionChange(ReactTextBox view, bool? onSelectionChange)
        {
            if (onSelectionChange.HasValue && onSelectionChange.Value)
            {
                _onSelectionChange = true;
                view.SelectionChanged += OnSelectionChanged;
            }
            else
            {
                _onSelectionChange = false;
                view.SelectionChanged -= OnSelectionChanged;
            }
        }

        /// <summary>
        /// Sets the default text placeholder property on the <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="placeholder">The placeholder text.</param>
        [ReactProperty("placeholder")]
        public void SetPlaceholder(ReactTextBox view, string placeholder)
        {
            view.PlaceholderText = placeholder;
        }

        /// <summary>
        /// Sets the selection color for the <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="color">The masked color value.</param>
        [ReactProperty("selectionColor", CustomType = "Color")]
        public void SetSelectionColor(ReactTextBox view, uint color)
        {
            view.SelectionHighlightColor = new SolidColorBrush(ColorHelpers.Parse(color));
        }

        /// <summary>
        /// Sets the text alignment property on the <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="alignment">The text alignment.</param>
        [ReactProperty(ViewProperties.TextAlign)]
        public void SetTextAlign(ReactTextBox view, string alignment)
        {
            view.TextAlignment = EnumHelpers.Parse<TextAlignment>(alignment);
        }

        /// <summary>
        /// Sets the text alignment property on the <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="alignment">The text alignment.</param>
        [ReactProperty(ViewProperties.TextAlignVertical)]
        public void SetTextVerticalAlign(ReactTextBox view, string alignment)
        {
            view.VerticalContentAlignment = EnumHelpers.Parse<VerticalAlignment>(alignment);
        }

        /// <summary>
        /// Sets the editablity property on the <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="editable">The editable flag.</param>
        [ReactProperty("editable")]
        public void SetEditable(ReactTextBox view, bool editable)
        {
            view.IsEnabled = editable;
        }

        /// <summary>
        /// Sets the max character length property on the <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="maxCharLength">The max length.</param>
        [ReactProperty("maxLength")]
        public void SetMaxLength(ReactTextBox view, int maxCharLength)
        {
            view.MaxLength = maxCharLength;
        }

        /// <summary>
        /// Sets whether to enable autocorrect on the <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="autoCorrect">The autocorrect flag.</param>
        [ReactProperty("autoCorrect")]
        public void SetAutoCorrect(ReactTextBox view, bool autoCorrect)
        {
            view.IsSpellCheckEnabled = autoCorrect;
        }

        /// <summary>
        /// Sets whether to enable multiline input on the <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="multiline">The multiline flag.</param>
        [ReactProperty("multiline", DefaultBoolean = false)]
        public void SetMultiline(ReactTextBox view, bool multiline)
        {
            view.AcceptsReturn = multiline;
        }

        /// <summary>
        /// Sets the keyboard type on the <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="keyboardType">The keyboard type.</param>
        [ReactProperty("keyboardType")]
        public void SetKeyboardType(ReactTextBox view, string keyboardType)
        {
            view.InputScope = null;
            if (keyboardType != null)
            {
                var inputScope = new InputScope();
                inputScope.Names.Add(
                    new InputScopeName(
                        InputScopeHelpers.FromString(keyboardType)));

                view.InputScope = inputScope;
            }
        }

        /// <summary>
        /// Sets the border width for a <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="width">The border width.</param>
        [ReactProperty(ViewProperties.BorderWidth)]
        public void SetBorderWidth(ReactTextBox view, int width)
        {
            view.BorderThickness = new Thickness(width);
        }

        /// <summary>
        /// Sets whether the text should be cleared on focus.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="clearTextOnFocus">The indicator.</param>
        [ReactProperty("clearTextOnFocus")]
        public void SetClearTextOnFocus(ReactTextBox view, bool clearTextOnFocus)
        {
            view.ClearTextOnFocus = clearTextOnFocus;
        }

        /// <summary>
        /// Sets whether the text should be selected on focus.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="selectTextOnFocus">The indicator.</param>
        [ReactProperty("selectTextOnFocus")]
        public void SetSelectTextOnFocus(ReactTextBox view, bool selectTextOnFocus)
        {
            view.SelectTextOnFocus = selectTextOnFocus;
        }

        /// <summary>
        /// Create the shadow node instance.
        /// </summary>
        /// <returns>The shadow node instance.</returns>
        public override ReactTextInputShadowNode CreateShadowNodeInstance()
        {
            return new ReactTextInputShadowNode();
        }

        /// <summary>
        /// Implement this method to receive events/commands directly from
        /// JavaScript through the <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="view">
        /// The view instance that should receive the command.
        /// </param>
        /// <param name="commandId">Identifer for the command.</param>
        /// <param name="args">Optional arguments for the command.</param>
        public override void ReceiveCommand(ReactTextBox view, int commandId, JArray args)
        {
            if (commandId == FocusTextInput)
            {
                // Sometimes, the focus command is received before the view
                // is actually rendered on screen. In this case, we defer
                // the focus command until after the view is ready.
                // TODO: (#271) resolve issues with focus.
                view.Focus(FocusState.Programmatic);
            }
            else if (commandId == BlurTextInput)
            {
                var frame = Window.Current?.Content as Frame;
                frame?.Focus(FocusState.Programmatic);
            }
        }

        /// <summary>
        /// Update the view with extra data.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="extraData">The extra data.</param>
        public override void UpdateExtraData(ReactTextBox view, object extraData)
        {
            var paddings = extraData as float[];
            var textUpdate = default(Tuple<int, string>);
            if (paddings != null)
            {
                view.Padding = new Thickness(
                    paddings[0],
                    paddings[1],
                    paddings[2],
                    paddings[3]);
            }
            else if ((textUpdate = extraData as Tuple<int, string>) != null)
            {
                if (textUpdate.Item1 < view.CurrentEventCount)
                {
                    return;
                }

                var text = textUpdate.Item2;

                view.TextChanged -= OnTextChanged;
                if (_onSelectionChange)
                {
                    view.SelectionChanged -= OnSelectionChanged;
                }

                var selectionStart = view.SelectionStart;
                var selectionLength = view.SelectionLength;
                var textLength = text?.Length ?? 0;
                var maxLength = textLength - selectionLength;

                view.Text = text ?? "";
                view.SelectionStart = Math.Min(selectionStart, textLength);
                view.SelectionLength = Math.Min(selectionLength, maxLength < 0 ? 0 : maxLength);

                view.TextChanged += OnTextChanged;
                if (_onSelectionChange)
                {
                    view.SelectionChanged += OnSelectionChanged;
                }
            }
        }

        /// <summary>
        /// Called when view is detached from view hierarchy and allows for 
        /// additional cleanup by the <see cref="ReactTextInputManager"/>.
        /// subclass. Unregister all event handlers for the <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The <see cref="ReactTextBox"/>.</param>
        public override void OnDropViewInstance(ThemedReactContext reactContext, ReactTextBox view)
        {
            view.KeyDown -= OnKeyDown;
            view.LostFocus -= OnLostFocus;
            view.GotFocus -= OnGotFocus;
            view.TextChanged -= OnTextChanged;
        }

        /// <summary>
        /// Returns the view instance for <see cref="ReactTextBox"/>.
        /// </summary>
        /// <param name="reactContext"></param>
        /// <returns></returns>
        protected override ReactTextBox CreateViewInstance(ThemedReactContext reactContext)
        {
            return new ReactTextBox
            {
                AcceptsReturn = false,
            };
        }

        /// <summary>
        /// Installing the textchanged event emitter on the <see cref="TextInput"/> Control.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The <see cref="ReactTextBox"/> view instance.</param>
        protected override void AddEventEmitters(ThemedReactContext reactContext, ReactTextBox view)
        {
            view.TextChanged += OnTextChanged;
            view.GotFocus += OnGotFocus;
            view.LostFocus += OnLostFocus;
            view.KeyDown += OnKeyDown;
        }

        private void OnTextChanged(object sender, TextChangedEventArgs e)
        {
            var textBox = (ReactTextBox)sender;
            textBox.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new ReactTextChangedEvent(
                        textBox.GetTag(),
                        textBox.Text,
                        textBox.ActualWidth,
                        textBox.ActualHeight,
                        textBox.IncrementEventCount()));
        }

        private void OnGotFocus(object sender, RoutedEventArgs e)
        {
            var textBox = (ReactTextBox)sender;
            textBox.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new ReactTextInputFocusEvent(textBox.GetTag()));
        }

        private void OnLostFocus(object sender, RoutedEventArgs e)
        {
            var textBox = (ReactTextBox)sender;
            var eventDispatcher = textBox.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher;

            eventDispatcher.DispatchEvent(
                new ReactTextInputBlurEvent(textBox.GetTag()));

            eventDispatcher.DispatchEvent(
                new ReactTextInputEndEditingEvent(
                      textBox.GetTag(),
                      textBox.Text));
        }

        private void OnKeyDown(object sender, KeyRoutedEventArgs e)
        {
            if (e.Key == VirtualKey.Enter)
            {
                var textBox = (ReactTextBox)sender;
                if (!textBox.AcceptsReturn)
                {
                    e.Handled = true;
                    textBox.GetReactContext()
                        .GetNativeModule<UIManagerModule>()
                        .EventDispatcher
                        .DispatchEvent(
                            new ReactTextInputSubmitEditingEvent(
                                textBox.GetTag(),
                                textBox.Text));
                }
            }
        }

        private void OnSelectionChanged(object sender, RoutedEventArgs e)
        {
            var textBox = (ReactTextBox)sender;
            var start = textBox.SelectionStart;
            var length = textBox.SelectionLength;
            textBox.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new ReactTextInputSelectionEvent(
                        textBox.GetTag(),
                        start,
                        start + length));
        }
    }
}
