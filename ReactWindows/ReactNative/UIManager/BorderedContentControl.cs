using Facebook.CSSLayout;
using System.Diagnostics;
using Windows.Foundation;
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
        #region DependencyProperties
        public static readonly DependencyProperty CornerRadiusProperty = DependencyProperty.Register("CornerRadius",
            typeof(CornerRadius),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public CornerRadius CornerRadius
        {
            get { return (CornerRadius)GetValue(CornerRadiusProperty); }
            set { SetValue(CornerRadiusProperty, value); }
        }
        #region Left Border
        public static readonly DependencyProperty LeftBorderGeometryProperty = DependencyProperty.Register("LeftBorderGeometry",
            typeof(GeometryGroup),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public GeometryGroup LeftBorderGeometry
        {
            get { return (GeometryGroup)GetValue(LeftBorderGeometryProperty); }
            set { SetValue(LeftBorderGeometryProperty, value); }
        }
        public static readonly DependencyProperty LeftStartPointProperty = DependencyProperty.Register("LeftStartPoint",
            typeof(Point),
            typeof(BorderedContentControl),
            new PropertyMetadata(new Point()));

        public Point LeftStartPoint
        {
            get { return (Point)GetValue(LeftStartPointProperty); }
            set { SetValue(LeftStartPointProperty, value); }
        }

        public static readonly DependencyProperty LeftEndPointProperty = DependencyProperty.Register("LeftEndPoint",
            typeof(Point),
            typeof(BorderedContentControl),
            new PropertyMetadata(new Point()));

        public Point LeftEndPoint
        {
            get { return (Point)GetValue(LeftEndPointProperty); }
            set { SetValue(LeftEndPointProperty, value); }
        }

        //public static readonly DependencyProperty LeftCornerRadiusProperty = DependencyProperty.Register("LeftCornerRadius",
        //    typeof(CornerRadius),
        //    typeof(BorderedContentControl),
        //    new PropertyMetadata(null));

        //public CornerRadius LeftCornerRadius
        //{
        //    get { return (CornerRadius)GetValue(LeftCornerRadiusProperty); }
        //    set { SetValue(LeftCornerRadiusProperty, value); }
        //}

        //public static readonly DependencyProperty LeftBorderThicknessProperty = DependencyProperty.Register("LeftBorderThickness",
        //    typeof(Thickness),
        //    typeof(BorderedContentControl),
        //    new PropertyMetadata(null));

        //public Thickness LeftBorderThickness
        //{
        //    get { return (Thickness)GetValue(LeftBorderThicknessProperty); }
        //    set { SetValue(LeftBorderThicknessProperty, value); }
        //}
        public static readonly DependencyProperty LeftBorderThicknessProperty = DependencyProperty.Register("LeftBorderThickness",
            typeof(double),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public double LeftBorderThickness
        {
            get { return (double)GetValue(LeftBorderThicknessProperty); }
            set { SetValue(LeftBorderThicknessProperty, value); }
        }

        public static readonly DependencyProperty LeftBorderBrushProperty = DependencyProperty.Register("LeftBorderBrush",
            typeof(Brush),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public Brush LeftBorderBrush
        {
            get { return (Brush)GetValue(LeftBorderBrushProperty); }
            set { SetValue(LeftBorderBrushProperty, value); }
        }
        #endregion

        #region TopBorder
        public static readonly DependencyProperty TopCornerRadiusProperty = DependencyProperty.Register("TopCornerRadius",
            typeof(CornerRadius),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public CornerRadius TopCornerRadius
        {
            get { return (CornerRadius)GetValue(TopCornerRadiusProperty); }
            set { SetValue(TopCornerRadiusProperty, value); }
        }

        public static readonly DependencyProperty TopBorderThicknessProperty = DependencyProperty.Register("TopBorderThickness",
            typeof(Thickness),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public Thickness TopBorderThickness
        {
            get { return (Thickness)GetValue(TopBorderThicknessProperty); }
            set { SetValue(TopBorderThicknessProperty, value); }
        }

        public static readonly DependencyProperty TopBorderBrushProperty = DependencyProperty.Register("TopBorderBrush",
            typeof(Brush),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public Brush TopBorderBrush
        {
            get { return (Brush)GetValue(TopBorderBrushProperty); }
            set { SetValue(TopBorderBrushProperty, value); }
        }
        #endregion

        #region RightBorder
        public static readonly DependencyProperty RightCornerRadiusProperty = DependencyProperty.Register("RightCornerRadius",
            typeof(CornerRadius),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public CornerRadius RightCornerRadius
        {
            get { return (CornerRadius)GetValue(RightCornerRadiusProperty); }
            set { SetValue(RightCornerRadiusProperty, value); }
        }

        public static readonly DependencyProperty RightBorderThicknessProperty = DependencyProperty.Register("RightBorderThickness",
            typeof(Thickness),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public Thickness RightBorderThickness
        {
            get { return (Thickness)GetValue(RightBorderThicknessProperty); }
            set { SetValue(RightBorderThicknessProperty, value); }
        }

        public static readonly DependencyProperty RightBorderBrushProperty = DependencyProperty.Register("RightBorderBrush",
            typeof(Brush),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public Brush RightBorderBrush
        {
            get { return (Brush)GetValue(RightBorderBrushProperty); }
            set { SetValue(RightBorderBrushProperty, value); }
        }
        #endregion

        #region BottomBorder
        public static readonly DependencyProperty BottomCornerRadiusProperty = DependencyProperty.Register("BottomCornerRadius",
            typeof(CornerRadius),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public CornerRadius BottomCornerRadius
        {
            get { return (CornerRadius)GetValue(BottomCornerRadiusProperty); }
            set { SetValue(BottomCornerRadiusProperty, value); }
        }

        public static readonly DependencyProperty BottomBorderThicknessProperty = DependencyProperty.Register("BottomBorderThickness",
            typeof(Thickness),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public Thickness BottomBorderThickness
        {
            get { return (Thickness)GetValue(BottomBorderThicknessProperty); }
            set { SetValue(BottomBorderThicknessProperty, value); }
        }

        public static readonly DependencyProperty BottomBorderBrushProperty = DependencyProperty.Register("BottomBorderBrush",
            typeof(Brush),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public Brush BottomBorderBrush
        {
            get { return (Brush)GetValue(BottomBorderBrushProperty); }
            set { SetValue(BottomBorderBrushProperty, value); }
        }
        #endregion
        #endregion

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
        public BorderedContentControl()
        {
            DefaultStyleKey = typeof (BorderedContentControl);
            BorderBrush = s_defaultBorderBrush;
            SizeChanged += BorderedContentControl_SizeChanged;
        }

        private void BorderedContentControl_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            LayoutBorderGeometry(e.NewSize);
        }

        private void LayoutBorderGeometry(Size newSize)
        {
            //LeftStartPoint = new Point(LeftBorderThickness / 2, 0);
            //LeftEndPoint = new Point(LeftBorderThickness / 2, newSize.Height);
            var leftGeometry = new GeometryGroup();
            leftGeometry.Children.Add(new EllipseGeometry() { Center = new Point(LeftBorderThickness, TopBorderThickness.Top), RadiusX = CornerRadius.TopLeft, RadiusY = CornerRadius.BottomLeft});
            leftGeometry.Children.Add(new LineGeometry() {StartPoint = new Point(LeftBorderThickness / 2, 0 + CornerRadius.TopLeft), EndPoint = new Point(LeftBorderThickness / 2, newSize.Height - CornerRadius.BottomLeft)});
            LeftBorderGeometry = leftGeometry;
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

        ///// <summary>
        ///// An intentional override of the <see cref="ContentControl.Content"/>
        ///// property that returns the child without any borders.
        ///// </summary>
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
        /// <param name="width">The width.</param>
        public void SetBorderWidth(double width)
        {
            LeftBorderThickness = width;
            TopBorderThickness = new Thickness(0, width, 0, 0);
            RightBorderThickness = new Thickness(0, 0, width, 0);
            BottomBorderThickness = new Thickness(0, 0, 0, width);
            //LeftBorderThickness = new Thickness(width, 0, 0, 0);
            //TopBorderThickness = new Thickness(0, width, 0, 0);
            //RightBorderThickness = new Thickness(0, 0, width, 0);
            //BottomBorderThickness = new Thickness(0, 0, 0, width);
            //EnsureBorder();

            //if (_customBorder != null)
            //{
            //    _customBorder.BorderThickness = new Thickness(width);
            //}
            //else if (_customBorder == null)
            //{
            //    _customLeftBorder.BorderThickness = new Thickness(width, 0, 0, 0);
            //    _customTopBorder.BorderThickness = new Thickness(0, width, 0, 0);
            //    _customRightBorder.BorderThickness = new Thickness(0, 0, width, 0);
            //    _customBottomBorder.BorderThickness = new Thickness(0, 0, 0, width);
            //}
        }

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

            switch (kind)
            {
                case CSSSpacingType.Left:
                    //LeftBorderThickness = new Thickness(width, 0, 0, 0);
                    LeftBorderThickness = width;
                    break;
                case CSSSpacingType.Top:
                    TopBorderThickness = new Thickness(0, width, 0, 0);
                    break;
                case CSSSpacingType.Right:
                    RightBorderThickness = new Thickness(0, 0, width, 0);
                    break;
                case CSSSpacingType.Bottom:
                    BottomBorderThickness = new Thickness(0, 0, 0, width);
                    break;
                case CSSSpacingType.All:
                    SetBorderWidth(width);
                    break;
            }

            //EnsureBorder();

            //if (_customBorder != null)
            //{
            //    var thickness = _customBorder.BorderThickness;
            //    switch (kind)
            //    {
            //        case CSSSpacingType.Left:
            //            thickness.Left = width;
            //            break;
            //        case CSSSpacingType.Top:
            //            thickness.Top = width;
            //            break;
            //        case CSSSpacingType.Right:
            //            thickness.Right = width;
            //            break;
            //        case CSSSpacingType.Bottom:
            //            thickness.Bottom = width;
            //            break;
            //        case CSSSpacingType.All:
            //            thickness = new Thickness(width);
            //            break;
            //    }
            //    //var thickness = BorderThickness;
            //    //switch (kind)
            //    //{
            //    //    case CSSSpacingType.Left:
            //    //        thickness.Left = width;
            //    //        break;
            //    //    case CSSSpacingType.Top:
            //    //        thickness.Top = width;
            //    //        break;
            //    //    case CSSSpacingType.Right:
            //    //        thickness.Right = width;
            //    //        break;
            //    //    case CSSSpacingType.Bottom:
            //    //        thickness.Bottom = width;
            //    //        break;
            //    //    case CSSSpacingType.All:
            //    //        thickness = new Thickness(width);
            //    //        break;
            //    //}
            //    _customBorder.BorderThickness = thickness;
            //}
            //else
            //{
            //    switch (kind)
            //    {
            //        case CSSSpacingType.Left:
            //            _customLeftBorder.BorderThickness = new Thickness(width, 0, 0, 0);
            //            break;
            //        case CSSSpacingType.Top:
            //            _customTopBorder.BorderThickness = new Thickness(0, width, 0, 0);
            //            break;
            //        case CSSSpacingType.Right:
            //            _customRightBorder.BorderThickness = new Thickness(0, 0, width, 0);
            //            break;
            //        case CSSSpacingType.Bottom:
            //            _customBottomBorder.BorderThickness = new Thickness(0, 0, 0, width);
            //            break;
            //    }
            //}

            //BorderThickness = thickness;
        }

        //BorderThickness = thickness;
    }
}