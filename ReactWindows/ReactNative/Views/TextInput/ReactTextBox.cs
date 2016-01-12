using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Text;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// A Data model which holds measurement related styling updates for <see cref="TextBox"/>.
    /// </summary>
    public class ReactTextBox
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

        /// <summary>
        /// This method copies the <see cref="ReactTextBox"/> properties onto a <see cref="TextBox"/> reference.
        /// </summary>
        /// <param name="textBox">The <see cref="TextBox"/> reference used to merge the <see cref="ReactTextBox"/> properties onto.</param>
        /// <returns></returns>
        public void MergePropertiesToNativeTextBox(ref TextBox textBox)
        {
            if (textBox == null)
            {
                textBox = new TextBox();
            }

            textBox.Text = Text != null ? Text : "";

            if (FontWeight.HasValue)
            {
                textBox.FontWeight = FontWeight.Value;
            }

            if (FontStyle.HasValue)
            {
                textBox.FontStyle = FontStyle.Value;
            }

            if (FontSize != UNSET)
            {
                textBox.FontSize = FontSize;
            }

            if (FontFamily != null)
            {
                textBox.FontFamily = FontFamily;
            }

            if (Padding.HasValue)
            {
                textBox.Padding = Padding.Value;
            }
        }
    }
}
