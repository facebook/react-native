using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.UIManager;
using ReactNative.UIManager.Events;
using ReactNative.Views.View;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Automation.Peers;
using Windows.UI.Xaml.Automation.Provider;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Documents;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Media.Media3D;
using Windows.UI.Xaml.Shapes;

namespace ReactNative.Views.TextInput
{
    class ReactTextInputManager : BaseViewManager<TextBox, LayoutShadowNode>
    {
        private static readonly int FOCUS_TEXT_INPUT = 1;
        private static readonly int BLUR_TEXT_INPUT = 2;
        private static readonly string REACT_CLASS = "RCTTextField";

        private const string PROP_ROTATION_X = "rotationX";
        private const string PROP_PLACEHOLDER = "placeholder";
        private const string PROP_TEXT_ALIGN = "textAlign";
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

        /// <summary>
        /// Returns the view instance for <see cref="TextBox"/>.
        /// </summary>
        /// <param name="reactContext"></param>
        /// <returns></returns>
        protected override TextBox CreateViewInstanceCore(ThemedReactContext reactContext)
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
            view.GotFocus += this.OnInterceptGotFocusEvent;
            view.LostFocus += this.OnInterceptLostFocusEvent;
        }
        
        protected override void UpdateExtraData(TextBox root, object extraData)
        {
            var reactTextBoxStyle = (ReactTextBox)extraData;

            if (reactTextBoxStyle == null)
            {
                throw new InvalidOperationException("ReactTextBox is undefined exception. We were unable to measure the dimensions of the TextBox control.");
            }

            reactTextBoxStyle.MergePropertiesToNativeTextBox(ref root);
        }

        protected override LayoutShadowNode CreateShadowNodeInstanceCore()
        {
            return new ReactTextInputShadowNode(false);
        }

        public override IReadOnlyDictionary<string, object> ExportedCustomBubblingEventTypeConstants
        {
            get
            {
                return new Dictionary<string, object>()
                {
                    { "topFocus", new Dictionary<string, object>()
                    {
                        { "phasedRegistrationNames", new Dictionary<string, string>()
                        {
                                                        { "bubbled" , "onFocus" },
                                                        { "captured" , "onFocusCapture" }
                        }
                        }
                    }
                    },
                    { "topEndEditing", new Dictionary<string, object>()
                    {
                        { "phasedRegistrationNames", new Dictionary<string, string>()
                        {
                                                        { "bubbled" , "onEndEditing" },
                                                        { "captured" , "onEndEditingCapture" }
                        }
                        }
                    }
                    },
                    { "topBlur", new Dictionary<string, object>()
                    {
                        { "phasedRegistrationNames", new Dictionary<string, string>()
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
        /// Implement this method to receive events/commands directly from
        /// JavaScript through the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="root">
        /// The view instance that should receive the command.
        /// </param>
        /// <param name="commandId">Identifer for the command.</param>
        /// <param name="args">Optional arguments for the command.</param>
        protected override void ReceiveCommand(TextBox view, int commandId, JArray args)
        {
            if (commandId == FOCUS_TEXT_INPUT)
            {
                view.Focus(FocusState.Programmatic);
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
        /// <param name="color"></param>
        [ReactProperty(ViewProperties.Color)]
        public void SetColor(TextBox view, uint? color)
        {
            if (color.HasValue)
            {
                view.Foreground = new SolidColorBrush(ColorHelpers.Parse(color.Value));
            }
        }

        private EventDispatcher EventDispatcher(TextBox textBox)
        {
            return textBox?.GetReactContext().CatalystInstance.GetNativeModule<UIManagerModule>().EventDispatcher;
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
            EventDispatcher(senderTextInput).DispatchEvent(new ReactTextInputBlurEvent(senderTextInput.GetTag()));
        }

        /// <summary>
        /// The <see cref="TextBox"/> event interceptor for focus gained events for the native control.
        /// </summary>
        /// <param name="sender">The source sender view.</param>
        /// <param name="event">The received event args</param>
        public void OnInterceptGotFocusEvent(object sender, RoutedEventArgs @event)
        {
            var senderTextInput = (TextBox)sender;
            EventDispatcher(senderTextInput).DispatchEvent(new ReactTextInputFocusEvent(senderTextInput.GetTag()));
        }

        /// <summary>
        /// The <see cref="TextBox"/> event interceptor for text change events for the native control.
        /// </summary>
        /// <param name="sender">The source sender view.</param>
        /// <param name="event">The received event args</param>
        public void OnInterceptTextChangeEvent(object sender, TextChangedEventArgs e)
        {
            var senderTextInput = (TextBox)sender;
            EventDispatcher(senderTextInput).DispatchEvent(new ReactTextChangedEvent(senderTextInput.GetTag(), senderTextInput.Text, senderTextInput.Width, senderTextInput.Height));
        }

        /// <summary>
        /// Called when view is detached from view hierarchy and allows for 
        /// additional cleanup by the <see cref="ViewManager{TextBox}"/>
        /// subclass. Unregister all event handlers for the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The <see cref="TextBox"/>.</param>
        protected override void OnDropViewInstance(ThemedReactContext reactContext, TextBox view)
        {
            view.TextChanged -= this.OnInterceptTextChangeEvent;
            view.GotFocus -= this.OnInterceptGotFocusEvent;
            view.LostFocus -= this.OnInterceptLostFocusEvent;
        }
    }
}
