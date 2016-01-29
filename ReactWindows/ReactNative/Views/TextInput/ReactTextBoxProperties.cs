using Windows.UI;
using Windows.UI.Text;
using Windows.UI.Xaml;
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
        /// The padding thickness of a <see cref="TextBox"/>.
        /// </summary>
        public Thickness? Padding { get; set; }

        /// <summary>
        /// The <see cref="Windows.UI.Text.FontStyle"/> of a <see cref="TextBox"/>.
        /// </summary>
        public FontStyle? FontStyle { get; set; }

        /// <summary>
        /// The <see cref="Windows.UI.Text.FontWeight"/> of a <see cref="TextBox"/>.
        /// </summary>
        public FontWeight? FontWeight { get; set; }

        /// <summary>
        /// The border color <see cref="Brush"/> of a <see cref="TextBox"/>.
        /// </summary>
        public Color? BorderColor { get; set; }
        
        /// <summary>
        /// The font family of a <see cref="TextBox"/>.
        /// </summary>
        public FontFamily FontFamily { get; set; }

        /// <summary>
        /// SThe font size of a <see cref="TextBox"/>.
        /// </summary>
        public int FontSize { get; set; } = UNSET;

        /// <summary>
        /// The text value of a <see cref="TextBox"/>.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// The line height of a <see cref="TextBox"/>.
        /// </summary>
        public int LineHeight { get; set; } = UNSET;
    }
}
