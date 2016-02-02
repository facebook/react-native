using Facebook.CSSLayout;
using Windows.UI;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;

namespace ReactNative.UIManager
{
    /// <summary>
    /// A single child control for managing a border.
    /// </summary>
    public class BorderedContentControl : ContentControl
    {
        private static readonly SolidColorBrush s_defaultBorderBrush = new SolidColorBrush(Colors.Black);

        private bool _hasCustomBorder;

        /// <summary>
        /// Instantiates the <see cref="BorderedContentControl"/>.
        /// </summary>
        /// <param name="content">The content.</param>
        public BorderedContentControl(object content)
        {
            DefaultStyleKey = typeof(BorderedContentControl);
            BorderBrush = s_defaultBorderBrush;
            base.Content = content;
        }

        /// <summary>
        /// An intentional override of the <see cref="ContentControl.Content"/>
        /// property that returns the child without any borders.
        /// </summary>
        public new UIElement Content
        {
            get
            {
                if (!_hasCustomBorder)
                {
                    return (UIElement)base.Content;
                }
                else
                {
                    var customBorder = EnsureBorder();
                    return customBorder.Child;
                }
            }
        }

        /// <summary>
        /// Sets the border width.
        /// </summary>
        /// <param name="width">The width.</param>
        public void SetBorderWidth(double width)
        {
            var customBorder = EnsureBorder();
            customBorder.BorderThickness = new Thickness(width);
        }

        /// <summary>
        /// Sets the border color.
        /// </summary>
        /// <param name="kind">The width specification.</param>
        /// <param name="color">The masked color.</param>
        public void SetBorderColor(CSSSpacingType kind, uint color)
        {
            var customBorder = EnsureBorder();
            customBorder.BorderBrush = new SolidColorBrush(ColorHelpers.Parse(color));
        }

        /// <summary>
        /// Sets the background color.
        /// </summary>
        /// <param name="value">The masked color value.</param>
        public void SetBackgroundColor(uint value)
        {
            EnsureBorder();
            _customBorder.Background = new SolidColorBrush(ColorHelpers.Parse(value));
        }

        /// <summary>
        /// Sets the border radius.
        /// </summary>
        /// <param name="radius">The radius.</param>
        public void SetBorderRadius(double radius)
        {
            var customBorder = EnsureBorder();    
            customBorder.CornerRadius = new CornerRadius(radius);
        }

        private Border EnsureBorder()
        {
            if (_hasCustomBorder)
            {
                return (Border)base.Content;
            }

            var inner = Content;
            _hasCustomBorder = true;
            base.Content = null;
            var customBorder = new Border();
            customBorder.BorderThickness = BorderThickness;
            customBorder.BorderBrush = BorderBrush;
            customBorder.Child = inner;
            base.Content = customBorder;
            return customBorder;
        }
    }
}
