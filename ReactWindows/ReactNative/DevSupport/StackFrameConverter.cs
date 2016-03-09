using System;
using Windows.UI.Xaml.Data;

namespace ReactNative.DevSupport
{
    /// <summary>
    /// Stack frame converter.
    /// </summary>
    public class StackFrameConverter : IValueConverter
    {
        /// <summary>
        /// Converts from a value type to the target type.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <param name="targetType">The target type.</param>
        /// <param name="parameter">The parameter.</param>
        /// <param name="language">The language.</param>
        /// <returns>The converted object.</returns>
        public object Convert(object value, Type targetType, object parameter, string language)
        {
            return value as IStackFrame;
        }

        /// <summary>
        /// Converts from a target type to the original value type.
        /// </summary>
        /// <param name="value">The converted value.</param>
        /// <param name="targetType">The original target type.</param>
        /// <param name="parameter">The parameter.</param>
        /// <param name="language">The language.</param>
        /// <returns>The converted object.</returns>
        public object ConvertBack(object value, Type targetType, object parameter, string language)
        {
            return value;
        }
    }
}
