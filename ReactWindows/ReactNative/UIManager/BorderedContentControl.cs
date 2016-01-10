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
        public static readonly DependencyProperty CornerRadiusProperty = DependencyProperty.Register("CornerRadius",
            typeof (CornerRadius),
            typeof (BorderedContentControl),
            new PropertyMetadata(null));

        public CornerRadius CornerRadius
        {
            get { return (CornerRadius) GetValue(CornerRadiusProperty); }
            set { SetValue(CornerRadiusProperty, value); }
        }

        private static readonly SolidColorBrush s_defaultBorderBrush = new SolidColorBrush(Colors.Black);

        private Border _customBorder;
        private Border _customLeftBorder;
        private Border _customRightBorder;
        private Border _customTopBorder;
        private Border _customBottomBorder;

        public BorderedContentControl()
        {
            DefaultStyleKey = typeof (BorderedContentControl);
            BorderBrush = s_defaultBorderBrush;

        }

        protected override void OnApplyTemplate()
        {
            base.OnApplyTemplate();
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

        //public new UIElement Content
        //{
        //    get
        //    {
        //        if (!HasCustomBorder)
        //        {
        //            return (UIElement)base.Content;
        //        }
        //        else if (_customBorder != null)
        //        {
        //            return _customBorder.Child;
        //        }
        //        else
        //        {
        //            return _customBottomBorder.Child;
        //        }
        //    }
        //}

        /// <summary>
        /// Sets the border width.
        /// </summary>
        /// <param name="kind">The width specification.</param>
        /// <param name="width">The width.</param>
        public void SetBorderWidth(CSSSpacingType kind, double width)
        {
            var thickness = _customBorder.BorderThickness;
            switch (kind)
            {
                case CSSSpacingType.Left:
                    thickness.Left = width;
                    break;
                case CSSSpacingType.Top:
                    thickness.Top = width;
                    break;
                case CSSSpacingType.Right:
                    thickness.Right = width;
                    break;
                case CSSSpacingType.Bottom:
                    thickness.Bottom = width;
                    break;
                case CSSSpacingType.All:
                    thickness = new Thickness(width);
                    break;
            }
            //var thickness = BorderThickness;
            //switch (kind)
            //{
            //    case CSSSpacingType.Left:
            //        thickness.Left = width;
            //        break;
            //    case CSSSpacingType.Top:
            //        thickness.Top = width;
            //        break;
            //    case CSSSpacingType.Right:
            //        thickness.Right = width;
            //        break;
            //    case CSSSpacingType.Bottom:
            //        thickness.Bottom = width;
            //        break;
            //    case CSSSpacingType.All:
            //        thickness = new Thickness(width);
            //        break;
            //}
            _customBorder.BorderThickness = thickness;
        }

        //BorderThickness = thickness;
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
            CornerRadius = new CornerRadius(radius);
            //var cornerRadius = new CornerRadius(radius);
            //if (!HasCustomBorder)
            //{
            //    CreateBorder();
            //}
            
            //if (_customBorder != null)
            //{
            //    _customBorder.CornerRadius = cornerRadius;
            //}
            //else
            //{
            //    Debug.Assert(_customLeftBorder != null);
            //    Debug.Assert(_customTopBorder != null);
            //    Debug.Assert(_customRightBorder != null);
            //    Debug.Assert(_customBottomBorder != null);

            //    _customLeftBorder.CornerRadius = cornerRadius;
            //    _customTopBorder.CornerRadius = cornerRadius;
            //    _customRightBorder.CornerRadius = cornerRadius;
            //    _customBottomBorder.CornerRadius = cornerRadius;
            //}
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
            //_customBorder.Child = inner;
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
