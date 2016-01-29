using ReactNative.UIManager;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// Native component to support a multiline <see cref="TextBox"/> control. 
    /// </summary>
    class ReactMultilineTextInputManager : ReactTextInputManager
    {
        private static readonly string ReactClass = "RCTTextView";
        private const string PROP_MULTILINE = "multiline";

        /// <summary>
        /// The name of the view manager.
        /// </summary>
        public override string Name
        {
            get
            {
                return ReactClass;
            }
        }

        /// <summary>
        /// Determines if there should be multiple lines allowed for the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="view">The text input box control.</param>
        /// <param name="multiline">To allow multiline.</param>
        [ReactProperty(PROP_MULTILINE)]
        public void SetMultiline(TextBox view, bool multiline)
        {
            view.AcceptsReturn = multiline;
            view.TextWrapping = TextWrapping.Wrap;
        }
    }
}
