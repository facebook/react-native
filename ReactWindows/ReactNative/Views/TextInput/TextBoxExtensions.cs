using ReactNative.Views.TextInput;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.TextInput
{
    static class TextBoxExtensions
    {
        private const int UNSET = -1;

        /// <summary>
        /// Assigns any set property from the <see cref="ReactTextBoxProperties"/> instance.
        /// </summary>
        /// <param name="textBox">The current <see cref="TextBox"/> context.</param>
        /// <param name="reactProperties">The <see cref="ReactTextBoxProperties"/> property instance.</param>
        public static void SetReactTextBoxProperties(this TextBox textBox, ReactTextBoxProperties reactProperties)
        {
            textBox.Text = reactProperties.Text != null ? reactProperties.Text : "";

            if (reactProperties.FontWeight.HasValue)
            {
                textBox.FontWeight = reactProperties.FontWeight.Value;
            }

            if (reactProperties.FontStyle.HasValue)
            {
                textBox.FontStyle = reactProperties.FontStyle.Value;
            }

            if (reactProperties.FontSize != UNSET)
            {
                textBox.FontSize = reactProperties.FontSize;
            }

            if (reactProperties.FontFamily != null)
            {
                textBox.FontFamily = reactProperties.FontFamily;
            }

            if (reactProperties.Padding.HasValue)
            {
                textBox.Padding = reactProperties.Padding.Value;
            }
        }
    }
}
