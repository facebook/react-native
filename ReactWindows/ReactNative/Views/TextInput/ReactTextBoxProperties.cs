using Windows.UI;
using Windows.UI.Text;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Media;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// A Data model which holds measurement related styling updates for 
    /// <see cref="Windows.UI.Xaml.Controls.TextBox"/>.
    /// </summary>
    public class ReactTextBoxProperties
    {
        private const int UNSET = -1;

        /// <summary>
        /// The padding thickness.
        /// </summary>
        public Thickness? Padding { get; set; }

        /// <summary>
        /// The font style.
        /// </summary>
        public FontStyle? FontStyle { get; set; }

        /// <summary>
        /// The font weight.
        /// </summary>
        public FontWeight? FontWeight { get; set; }

        /// <summary>
        /// The border color.
        /// </summary>
        public Color? BorderColor { get; set; }

        /// <summary>
        /// The font family.
        /// </summary>
        public FontFamily FontFamily { get; set; }

        /// <summary>
        /// The font size.
        /// </summary>
        public int FontSize { get; set; } = UNSET;

        /// <summary>
        /// The text value.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// The line height.
        /// </summary>
        public int LineHeight { get; set; } = UNSET;
    }
}
