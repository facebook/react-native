using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.UIManager;
using ReactNative.UIManager.Events;
using ReactNative.Views.View;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Automation.Peers;
using Windows.UI.Xaml.Automation.Provider;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media.Media3D;

namespace ReactNative.Views.TextInput
{
    class ReactTextInputManager : BaseViewManager<TextBox, LayoutShadowNode>
    {
        private static readonly int FOCUS_TEXT_INPUT = 1;
        private static readonly int BLUR_TEXT_INPUT = 2;
        public static readonly string REACT_CLASS = ViewProperties.TextInputClassName;

        private const string PROP_ROTATION_X = "rotationX";
        private const string PROP_TEXT_ALIGN = "textAlign";

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

        private void TextChangedHandler(object sender, TextChangedEventArgs e)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Installing the textchanged event emitter on the <see cref="TextInput"/> Control.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The <see cref="TextBox"/> view instance.</param>
        protected override void AddEventEmitters(ThemedReactContext reactContext, TextBox view)
        {
            view.TextChanged += TextChangedHandler;
            view.
        }

        protected override void UpdateExtraData(TextBox root, object extraData)
        {
        }

        public override void SetBackgroundColor(TextBox view, int backgroundColor)
        {
            throw new NotImplementedException();
        }

        protected override LayoutShadowNode CreateShadowNodeInstanceCore()
        {
            //TODO: Need to implement ReactTextInputShadowNode.
            return new LayoutShadowNode();
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
        /// Sets the editability of the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="view">The text input box control.</param>
        /// <param name="degrees">The text alignment.</param>
        [ReactProperty(PROP_TEXT_ALIGN)]
        public void Editable(TextBox view, bool editable)
        {
            var textAlignment = default(TextAlignment);
            if (Enum.TryParse(alignment, out textAlignment))
            {
                view.TextAlignment = textAlignment;
            }
        }

        private class ReactTextInputTextWatcher : IOnInterceptKeyboardEventListener
        {
            private EventDispatcher _EventDispatcher;
            private String _PreviousText;

            public ReactTextInputTextWatcher(ReactContext reactContext)
            {
                _EventDispatcher = reactContext.CatalystInstance.GetNativeModule<UIManagerModule>().EventDispatcher;
                _PreviousText = null;
            }

            public bool OnInterceptKeyboardEvent(object sender, TextChangedEventArgs @event)
            {
                _EventDispatcher.DispatchEvent(new ReactTextChangedEvent());
            }
        }
    }
}
