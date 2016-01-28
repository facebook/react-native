using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// Native component to support a multiline <see cref="TextBox"/> Control. 
    /// </summary>
    class ReactMultilineTextInputManager : ReactTextInputManager
    {
        private static readonly string REACT_CLASS = "RCTTextView";
        private const string PROP_MULTILINE = "multiline";

        public override string Name
        {
            get
            {
                return REACT_CLASS;
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
