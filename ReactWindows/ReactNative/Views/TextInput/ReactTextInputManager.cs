using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using ReactNative.UIManager.Events;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;

namespace ReactNative.Views.TextInput
{
    class ReactTextInputManager : BaseViewManager<TextBox, ReactTextInputShadowNode>
    {
        private static readonly int FOCUS_TEXT_INPUT = 1;
        private static readonly int BLUR_TEXT_INPUT = 2;
        private static readonly string REACT_CLASS = "RCTTextField";

        private const string PROP_ROTATION_X = "rotationX";
        private const string PROP_PLACEHOLDER = "placeholder";
        private const string PROP_TEXT_ALIGN = "textAlign";
        private const string PROP_VERITCAL_TEXT_ALIGN = "textAlignVertical";
        private const string PROP_MAX_LENGTH = "maxLength";
        private const string PROP_TEXT = "text";
        private const string PROP_IS_EDITABLE = "editable";

        public override string Name
        {
            get
            {
                return REACT_CLASS;
            }
        }

        public override IReadOnlyDictionary<string, object> ExportedCustomBubblingEventTypeConstants
        {
            get
            {
                return new Dictionary<string, object>()
                {
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
                    { "focusTextInput", FOCUS_TEXT_INPUT },
                    { "blurTextInput", BLUR_TEXT_INPUT }
                };
            }
        }

        /// <summary>
        /// Sets the text alignment property on the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="view">The text input box control.</param>
        /// <param name="degrees">The text alignment.</param>
        [ReactProperty(PROP_TEXT_ALIGN)]
        public void SetTextAlign(TextBox view, string alignment)
        {
            var textAlignment = default(TextAlignment);
            if (Enum.TryParse(alignment, out textAlignment))
            {
                view.TextAlignment = textAlignment;
            }
        }

        /// <summary>
        /// Sets the text alignment property on the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="view">The text input box control.</param>
        /// <param name="alignment">The text alignment.</param>
        /// <remarks>
        /// TODO: test this out.
        /// </remarks>
        [ReactProperty(PROP_VERITCAL_TEXT_ALIGN)]
        public void SetTextVerticalAlign(TextBox view, string alignment)
        {
            var textAlignment = default(VerticalAlignment);
            if (Enum.TryParse(alignment, out textAlignment))
            {
                view.VerticalContentAlignment = textAlignment;
            }
        }

        /// <summary>
        /// Sets the editablity property on the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="view">The text input box control.</param>
        /// <param name="editable">The text alignment.</param>
        [ReactProperty(PROP_IS_EDITABLE)]
        public void SetEditable(TextBox view, bool editable)
        {
            view.IsReadOnly = editable;
        }

        /// <summary>
        /// Sets the default text placeholder property on the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="view">The text input box control.</param>
        /// <param name="placeholder">placeholder text.</param>
        [ReactProperty(PROP_PLACEHOLDER)]
        public void SetPlaceholder(TextBox view, string placeholder)
        {
            view.PlaceholderText = placeholder;
        }

        /// <summary>
        /// Sets the foreground color property on the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="color">The masked color value.</param>
        /// <remarks>
        /// TODO: test and get working.
        /// </remarks>
        [ReactProperty(ViewProperties.Color, CustomType = "Color")]
        public void SetColor(TextBox view, uint? color)
        {
            if (color.HasValue)
            {
                view.Foreground = new SolidColorBrush(ColorHelpers.Parse(color.Value));
            }
        }

        /// <summary>
        /// Sets the max charcter length property on the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="view">The text input box control.</param>
        /// <param name="maxCharLength">The text alignment.</param>
        [ReactProperty(PROP_MAX_LENGTH)]
        public void SetMaxLength(TextBox view, int maxCharLength)
        {
            view.MaxLength = maxCharLength;
        }

        /// <summary>
        /// The <see cref="TextBox"/> event interceptor for focus lost events for the native control.
        /// </summary>
        /// <param name="sender">The source sender view.</param>
        /// <param name="event">The received event args</param>
        public void OnInterceptLostFocusEvent(object sender, RoutedEventArgs @event)
        {
            var senderTextInput = (TextBox)sender;
            GetEventDispatcher(senderTextInput).DispatchEvent(new ReactTextInputBlurEvent(senderTextInput.GetTag()));
        }

        /// <summary>
        /// The <see cref="TextBox"/> event interceptor for text change events for the native control.
        /// </summary>
        /// <param name="sender">The source sender view.</param>
        /// <param name="event">The received event args</param>
        public void OnInterceptTextChangeEvent(object sender, TextChangedEventArgs e)
        {
            var senderTextInput = (TextBox)sender;
            GetEventDispatcher(senderTextInput).DispatchEvent(new ReactTextChangedEvent(senderTextInput.GetTag(), senderTextInput.Text, senderTextInput.Width, senderTextInput.Height));
        }

        /// <summary>
        /// Called when view is detached from view hierarchy and allows for 
        /// additional cleanup by the <see cref="ViewManager{TextBox}"/>
        /// subclass. Unregister all event handlers for the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The <see cref="TextBox"/>.</param>
        public override void OnDropViewInstance(ThemedReactContext reactContext, TextBox view)
        {
            view.TextChanged -= this.OnInterceptTextChangeEvent;
            // TODO: Figure out how to get intercept focus to work this to work.
            view.LostFocus -= this.OnInterceptLostFocusEvent;
        }

        /// <summary>
        /// Returns the view instance for <see cref="TextBox"/>.
        /// </summary>
        /// <param name="reactContext"></param>
        /// <returns></returns>
        protected override TextBox CreateViewInstance(ThemedReactContext reactContext)
        {
            return new TextBox();
        }

        /// <summary>
        /// Installing the textchanged event emitter on the <see cref="TextInput"/> Control.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The <see cref="TextBox"/> view instance.</param>
        protected override void AddEventEmitters(ThemedReactContext reactContext, TextBox view)
        {
            view.TextChanged += this.OnInterceptTextChangeEvent;
            // TODO: Figure out how to get intercept focus to work this to work.
            view.LostFocus += this.OnInterceptLostFocusEvent;
        }

        /// <summary>
        /// Sets the border width for a <see cref="TextBox"/>.
        /// </summary>
        /// <param name="text"></param>
        [ReactProperty(ViewProperties.BorderWidth)]
        public void SetBorderWidth(TextBox root, int border)
        {
            root.BorderThickness = new Thickness(border);
        }

        public override void UpdateExtraData(TextBox root, object extraData)
        {
            var reactTextBoxStyle = (ReactTextBoxProperties)extraData;

            if (reactTextBoxStyle == null)
            {
                throw new InvalidOperationException("ReactTextBoxProperties is undefined exception. We were unable to measure the dimensions of the TextBox control.");
            }

            root.SetReactTextBoxProperties(reactTextBoxStyle);
        }

        public override ReactTextInputShadowNode CreateShadowNodeInstance()
        {
            return new ReactTextInputShadowNode(false);
        }

        /// <summary>
        /// Implement this method to receive events/commands directly from
        /// JavaScript through the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="root">
        /// The view instance that should receive the command.
        /// </param>
        /// <param name="commandId">Identifer for the command.</param>
        /// <param name="args">Optional arguments for the command.</param>
        public override void ReceiveCommand(TextBox view, int commandId, JArray args)
        {
            if (commandId == FOCUS_TEXT_INPUT)
            {
                view.Focus(FocusState.Programmatic);
            }
        }
       
        private EventDispatcher GetEventDispatcher(TextBox textBox)
        {
            return textBox?.GetReactContext().GetNativeModule<UIManagerModule>().EventDispatcher;
        }
    }
}
