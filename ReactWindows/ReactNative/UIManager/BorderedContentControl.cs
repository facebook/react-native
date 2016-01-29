using Facebook.CSSLayout;
using System.Diagnostics;
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

        private Border _customBorder;
        private Border _customLeftBorder;
        private Border _customRightBorder;
        private Border _customTopBorder;
        private Border _customBottomBorder;

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

        private bool HasCustomBorder
        {
            get
            {
                return _customBorder != null ||
                    _customLeftBorder != null ||
                    _customRightBorder != null ||
                    _customTopBorder != null ||
                    _customBottomBorder != null;
            }
        }

        /// <summary>
        /// An intentional override of the <see cref="ContentControl.Content"/>
        /// property that returns the child without any borders.
        /// </summary>
        public new UIElement Content
        {
            get
            {
                if (!HasCustomBorder)
                {
                    return (UIElement)base.Content;
                }
                else if (_customBorder != null)
                {
                    return _customBorder.Child;
                }
                else
                {
                    return _customBottomBorder.Child;
                }
            }
        }

        /// <summary>
        /// Sets the border width.
        /// </summary>
        /// <param name="width">The width.</param>
        public void SetBorderWidth(double width)
        {
            EnsureBorder();

            if (_customBorder != null)
            {
                _customBorder.BorderThickness = new Thickness(width);
            }
            else if (_customBorder == null)
            {
                _customLeftBorder.BorderThickness = new Thickness(width, 0, 0, 0);
                _customTopBorder.BorderThickness = new Thickness(0, width, 0, 0);
                _customRightBorder.BorderThickness = new Thickness(0, 0, width, 0);
                _customBottomBorder.BorderThickness = new Thickness(0, 0, 0, width);
            }
        }

        /// <summary>
        /// Sets the border width.
        /// </summary>
        /// <param name="kind">The width specification.</param>
        /// <param name="width">The width.</param>
        public void SetBorderWidth(CSSSpacingType kind, double width)
        {
            if (kind == CSSSpacingType.All)
            {
                SetBorderWidth(width);
            }

            EnsureBorder();

            if (_customBorder != null)
            {
                _customBorder.SetBorderWidth(kind, width);
            }
            else
            {
                switch (kind)
                {
                    case CSSSpacingType.Left:
                        _customLeftBorder.BorderThickness = new Thickness(width, 0, 0, 0);
                        break;
                    case CSSSpacingType.Top:
                        _customTopBorder.BorderThickness = new Thickness(0, width, 0, 0);
                        break;
                    case CSSSpacingType.Right:
                        _customRightBorder.BorderThickness = new Thickness(0, 0, width, 0);
                        break;
                    case CSSSpacingType.Bottom:
                        _customBottomBorder.BorderThickness = new Thickness(0, 0, 0, width);
                        break;
                }
            }
        }

        /// <summary>
        /// Sets the border color.
        /// </summary>
        /// <param name="color">The masked color.</param>
        public void SetBorderColor(uint color)
        {
            EnsureBorder();

            var brush = new SolidColorBrush(ColorHelpers.Parse(color));

            if (_customBorder != null)
            {
                _customBorder.BorderBrush = brush;
            }
            else
            {
                Debug.Assert(_customLeftBorder != null);
                Debug.Assert(_customTopBorder != null);
                Debug.Assert(_customRightBorder != null);
                Debug.Assert(_customBottomBorder != null);

                _customLeftBorder.BorderBrush = brush;
                _customTopBorder.BorderBrush = brush;
                _customRightBorder.BorderBrush = brush;
                _customBottomBorder.BorderBrush = brush;
            }
        }

        /// <summary>
        /// Sets the border color.
        /// </summary>
        /// <param name="kind">The width specification.</param>
        /// <param name="color">The masked color.</param>
        public void SetBorderColor(CSSSpacingType kind, uint color)
        {
            if (kind == CSSSpacingType.All)
            {
                SetBorderColor(color);
            }
            else
            {
                var brush = new SolidColorBrush(ColorHelpers.Parse(color));

                EnsureSideBorders();

                switch (kind)
                {
                    case CSSSpacingType.Left:
                        _customLeftBorder.BorderBrush = brush;
                        break;
                    case CSSSpacingType.Top:
                        _customTopBorder.BorderBrush = brush;
                        break;
                    case CSSSpacingType.Right:
                        _customRightBorder.BorderBrush = brush;
                        break;
                    case CSSSpacingType.Bottom:
                        _customBottomBorder.BorderBrush = brush;
                        break;
                }
            }
        }

        /// <summary>
        /// Sets the border radius.
        /// </summary>
        /// <param name="radius">The radius.</param>
        public void SetBorderRadius(double radius)
        {
            var cornerRadius = new CornerRadius(radius);

            EnsureBorder();
            
            if (_customBorder != null)
            {
                _customBorder.CornerRadius = cornerRadius;
            }
            else
            {
                Debug.Assert(_customLeftBorder != null);
                Debug.Assert(_customTopBorder != null);
                Debug.Assert(_customRightBorder != null);
                Debug.Assert(_customBottomBorder != null);

                _customLeftBorder.CornerRadius = new CornerRadius(radius, 0, 0, 0);
                _customTopBorder.CornerRadius = new CornerRadius(0, radius, 0, 0);
                _customRightBorder.CornerRadius = new CornerRadius(0, 0, radius, 0);
                _customBottomBorder.CornerRadius = new CornerRadius(0, 0, 0, radius);
            }
        }

        private void EnsureBorder()
        {
            if (HasCustomBorder)
            {
                return;
            }
            
            var inner = Content;
            base.Content = null;
            _customBorder = new Border();
            _customBorder.BorderThickness = BorderThickness;
            _customBorder.BorderBrush = BorderBrush;
            base.Content = _customBorder;
            _customBorder.Child = inner;
        }

        private void EnsureSideBorders()
        {
            if (HasCustomBorder && _customBorder == null)
            {
                return;
            }

            _customLeftBorder = new Border();
            _customRightBorder = new Border();
            _customTopBorder = new Border();
            _customBottomBorder = new Border();

            _customLeftBorder.Child = _customTopBorder;
            _customTopBorder.Child = _customRightBorder;
            _customRightBorder.Child = _customBottomBorder;

            var borderThickness = _customBorder != null ? _customBorder.BorderThickness : BorderThickness;
            var cornerRadius = _customBorder != null ? _customBorder.CornerRadius : new CornerRadius();
            var borderBrush = _customBorder != null ? _customBorder.BorderBrush : BorderBrush;
            var child = _customBorder != null ? _customBorder.Child : (UIElement)Content;

            if (_customBorder != null)
            {
                _customBorder.Child = null;
                _customBorder = null;
            }

            _customLeftBorder.BorderThickness = new Thickness(borderThickness.Left, 0, 0, 0);
            _customLeftBorder.CornerRadius = new CornerRadius(cornerRadius.TopLeft, 0, 0, cornerRadius.BottomLeft);
            _customLeftBorder.BorderBrush = borderBrush;
            _customTopBorder.BorderThickness = new Thickness(0, borderThickness.Top, 0, 0);
            _customTopBorder.CornerRadius = new CornerRadius(0, cornerRadius.TopRight, 0, 0);
            _customTopBorder.BorderBrush = borderBrush;
            _customRightBorder.BorderThickness = new Thickness(0, 0, borderThickness.Right, 0);
            _customRightBorder.CornerRadius = new CornerRadius(0, 0, cornerRadius.BottomRight, 0);
            _customRightBorder.BorderBrush = borderBrush;
            _customBottomBorder.BorderThickness = new Thickness(0, 0, 0, borderThickness.Bottom);
            _customBottomBorder.CornerRadius = new CornerRadius();
            _customBottomBorder.BorderBrush = borderBrush;
            _customBottomBorder.Child = child;

            base.Content = _customLeftBorder;
        }
    }
}
