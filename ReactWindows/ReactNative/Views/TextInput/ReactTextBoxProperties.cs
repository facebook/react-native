using System;
using Windows.UI;
using Windows.UI.Text;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// A Data model which holds measurement related styling updates for <see cref="TextBox"/>.
    /// </summary>
    public class ReactTextBoxProperties
    {
        private const int UNSET = -1;

        /// <summary>
        /// Sets / Gets the padding thickness of a <see cref="TextBox"/>.
        /// </summary>
        public Thickness? Padding { get; set; }

        /// <summary>
        /// Sets / Gets the <see cref="FontStyle"/> of a <see cref="TextBox"/>.
        /// </summary>
        public FontStyle? FontStyle { get; set; }

        /// <summary>
        /// Sets / Gets the <see cref="FontWeight"/> of a <see cref="TextBox"/>.
        /// </summary>
        public FontWeight? FontWeight { get; set; }

        /// <summary>
        /// Sets / Gets the border background <see cref="Brush"/> of a <see cref="TextBox"/>.
        /// </summary>
        public Color BorderBackground { get; set; }
        
        /// <summary>
        /// Sets / Gets the font family of a <see cref="TextBox"/>.
        /// </summary>
        public FontFamily FontFamily { get; set; }

        /// <summary>
        /// Sets / Gets the font size of a <see cref="TextBox"/>.
        /// </summary>
        public int FontSize { get; set; } = UNSET;

        /// <summary>
        /// Sets / Gets the text value of a <see cref="TextBox"/>.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Sets / Gets the line height of a <see cref="TextBox"/>.
        /// </summary>
        public int LineHeight { get; set; } = UNSET;
    }
}
