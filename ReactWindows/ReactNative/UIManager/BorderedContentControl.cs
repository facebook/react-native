using Facebook.CSSLayout;
using System.Diagnostics;
using System.Numerics;
using Windows.Foundation;
using Windows.Foundation.Numerics;
using Windows.UI;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;
using Vector2 = System.Numerics.Vector2;

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
        public static readonly DependencyProperty TopBorderGeometryProperty = DependencyProperty.Register("TopBorderGeometry",
            typeof(GeometryGroup),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public GeometryGroup TopBorderGeometry
        {
            get { return (GeometryGroup)GetValue(TopBorderGeometryProperty); }
            set { SetValue(TopBorderGeometryProperty, value); }
        }

        public static readonly DependencyProperty TopBorderThicknessProperty = DependencyProperty.Register("TopBorderThickness",
            typeof(double),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public double TopBorderThickness
        {
            get { return (double)GetValue(TopBorderThicknessProperty); }
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
        public static readonly DependencyProperty RightBorderGeometryProperty = DependencyProperty.Register("RightBorderGeometry",
            typeof(GeometryGroup),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public GeometryGroup RightBorderGeometry
        {
            get { return (GeometryGroup)GetValue(RightBorderGeometryProperty); }
            set { SetValue(RightBorderGeometryProperty, value); }
        }

        public static readonly DependencyProperty RightBorderThicknessProperty = DependencyProperty.Register("RightBorderThickness",
            typeof(double),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public double RightBorderThickness
        {
            get { return (double)GetValue(RightBorderThicknessProperty); }
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
        public static readonly DependencyProperty BottomBorderGeometryProperty = DependencyProperty.Register("BottomBorderGeometry",
             typeof(GeometryGroup),
             typeof(BorderedContentControl),
             new PropertyMetadata(null));

        public GeometryGroup BottomBorderGeometry
        {
            get { return (GeometryGroup)GetValue(BottomBorderGeometryProperty); }
            set { SetValue(BottomBorderGeometryProperty, value); }
        }

        public static readonly DependencyProperty BottomBorderThicknessProperty = DependencyProperty.Register("BottomBorderThickness",
            typeof(double),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public double BottomBorderThickness
        {
            get { return (double)GetValue(BottomBorderThicknessProperty); }
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

        private double _leftBorderThickness;
        private double _topBorderThickness;
        private double _rightBorderThickness;
        private double _bottomBorderThickness;

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
            var upperLeftLowerPoint = new Point(LeftBorderThickness / 2, TopBorderThickness + CornerRadius.TopLeft);
            var upperLeftUpperPoint = new Point(LeftBorderThickness + CornerRadius.TopLeft, TopBorderThickness / 2);
            var upperLeftCenterPoint = new Point(CornerRadius.TopLeft * 2, CornerRadius.TopLeft * 2);
            var upperRightUpperPoint = new Point(newSize.Width - RightBorderThickness - CornerRadius.TopRight, TopBorderThickness / 2);
            var upperRightLowerPoint = new Point(newSize.Width - (RightBorderThickness / 2), TopBorderThickness + CornerRadius.TopRight);
            var upperRightCenterPoint = new Point(newSize.Width - CornerRadius.TopRight * 2, CornerRadius.TopRight * 2);
            var lowerRightUpperPoint = new Point(newSize.Width - (RightBorderThickness / 2), newSize.Height - BottomBorderThickness - CornerRadius.BottomRight);
            var lowerRigthLowerPoint = new Point(newSize.Width - RightBorderThickness - CornerRadius.BottomRight, newSize.Height - (BottomBorderThickness / 2));
            var lowerRightCenterPoint = new Point(newSize.Width - (CornerRadius.BottomRight * 2), newSize.Height - (CornerRadius.BottomRight * 2));
            var lowerLeftLowerPoint = new Point(LeftBorderThickness + CornerRadius.BottomLeft, newSize.Height - (BottomBorderThickness / 2));
            var lowerLeftUpperPoint = new Point(LeftBorderThickness / 2, newSize.Height - BottomBorderThickness - CornerRadius.BottomLeft);
            var lowerLeftCenterPoint = new Point((CornerRadius.BottomLeft * 2), newSize.Height - (CornerRadius.BottomLeft * 2));

             // left geometry
            var leftGeometry = new GeometryGroup();

            // upper left lower corner
            leftGeometry.Children.Add(new PathGeometry
            {
                Figures = CreateFiguresForCorner(upperLeftLowerPoint,
                    upperLeftUpperPoint,
                    upperLeftCenterPoint,
                    CornerRadius.TopLeft, SweepDirection.Clockwise)
            });

            leftGeometry.Children.Add(new LineGeometry() {StartPoint = upperLeftLowerPoint,
                EndPoint = lowerLeftUpperPoint
            });

            // lower left upper half
            leftGeometry.Children.Add(new PathGeometry
            {
                Figures = CreateFiguresForCorner(lowerLeftUpperPoint,
                    lowerLeftLowerPoint,
                    lowerLeftCenterPoint,
                    CornerRadius.BottomLeft, SweepDirection.Counterclockwise)
            });

            LeftBorderGeometry = leftGeometry;

            // top geometry
            var topGeometry = new GeometryGroup();

            // upper left upper half
            topGeometry.Children.Add(new PathGeometry
            {
                Figures = CreateFiguresForCorner(upperLeftUpperPoint,
                    upperLeftLowerPoint,
                    upperLeftCenterPoint,
                    CornerRadius.TopLeft, SweepDirection.Counterclockwise)
            });

            topGeometry.Children.Add(new LineGeometry()
            {
                StartPoint = upperLeftUpperPoint,
                EndPoint = upperRightUpperPoint
            });

            // upper right upper half
            topGeometry.Children.Add(new PathGeometry
            {
                Figures = CreateFiguresForCorner(upperRightUpperPoint,
                    upperRightLowerPoint,
                    upperRightCenterPoint,
                    CornerRadius.TopRight, SweepDirection.Clockwise)
            });

            TopBorderGeometry = topGeometry;

            // right geometry
            var rightGeometry = new GeometryGroup();

            //upper right lower half
            rightGeometry.Children.Add(new PathGeometry
            {
                Figures = CreateFiguresForCorner(upperRightLowerPoint,
                    upperRightUpperPoint,
                    upperRightCenterPoint,
                    CornerRadius.TopRight, SweepDirection.Counterclockwise)
            });

            rightGeometry.Children.Add(new LineGeometry()
            {
                StartPoint = upperRightLowerPoint,
                EndPoint = lowerRightUpperPoint
            });

            // lower right upper half
            rightGeometry.Children.Add(new PathGeometry
            {
                Figures = CreateFiguresForCorner(lowerRightUpperPoint,
                    lowerRigthLowerPoint,
                    lowerRightCenterPoint,
                    CornerRadius.BottomRight, SweepDirection.Clockwise)
            });

            RightBorderGeometry = rightGeometry;

            // bottom geometry
            var bottomGeometry = new GeometryGroup();

            //lower right lower half
            bottomGeometry.Children.Add(new PathGeometry
            {
                Figures = CreateFiguresForCorner(lowerRigthLowerPoint,
                    lowerRightUpperPoint,
                    lowerRightCenterPoint,
                    CornerRadius.BottomRight, SweepDirection.Counterclockwise)
            });

            bottomGeometry.Children.Add(new LineGeometry()
            {
                StartPoint = lowerRigthLowerPoint,
                EndPoint = lowerLeftLowerPoint
            });

            // lower left lower half
            bottomGeometry.Children.Add(new PathGeometry
            {
                Figures = CreateFiguresForCorner(lowerLeftLowerPoint,
                    lowerLeftUpperPoint,
                    lowerLeftCenterPoint,
                    CornerRadius.BottomLeft, SweepDirection.Clockwise)
            });

            BottomBorderGeometry = bottomGeometry;
        }

        private PathFigureCollection CreateFiguresForCorner(Point startPoint, Point endPoint, Point centerPoint, double radius, SweepDirection sweepDirection)
        {
            var figures = new PathFigureCollection();
            var figure = new PathFigure() {StartPoint = startPoint };
            if (radius > 0)
            {
                figure.Segments.Add(GetArcSegment(startPoint, endPoint, centerPoint, radius, sweepDirection));
            }
            else
            {
                figure.Segments.Add(new LineSegment() { Point = endPoint});
            }
            figures.Add(figure);
            return figures;
        }

        private ArcSegment GetArcSegment(Point startPoint, Point endPoint, Point centerPoint, double radius, SweepDirection sweepDirection)
        {
            return new ArcSegment()
            {
                Point = GetArcMidPoint(startPoint.ToVector2(),
                    endPoint.ToVector2(),
                    centerPoint.ToVector2(), (float)radius),
                Size = new Size(radius, radius),
                SweepDirection = sweepDirection
            };
        }

        private Point GetArcMidPoint(Vector2 a, Vector2 b, Vector2 center, float radius)
        {
            var m = (a - center) + (b - center);
            m = Vector2.Normalize(m) * new Vector2(radius, radius);
            return new Point(center.X + m.X, center.Y + m.Y);
        }

        protected override void OnApplyTemplate()
        {
            base.OnApplyTemplate();
        }

        //private bool HasCustomBorder
        //{
        //    get
        //    {
        //        return _customBorder != null ||
        //            _customLeftBorder != null ||
        //            _customRightBorder != null ||
        //            _customTopBorder != null ||
        //            _customBottomBorder != null;
        //    }
        //}

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
            TopBorderThickness = width;
            RightBorderThickness = width;
            BottomBorderThickness = width;

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
            if (kind == CSSSpacingType.All)
            {

            }

            switch (kind)
            {
                case CSSSpacingType.Left:
                    LeftBorderThickness = width;
                    break;
                case CSSSpacingType.Top:
                    //TopBorderThickness = new Thickness(0, width, 0, 0);
                    TopBorderThickness = width;
                    break;
                case CSSSpacingType.Right:
                    //RightBorderThickness = new Thickness(0, 0, width, 0);
                    RightBorderThickness = width;
                    break;
                case CSSSpacingType.Bottom:
                    //BottomBorderThickness = new Thickness(0, 0, 0, width);
                    BottomBorderThickness = width;
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

        /// <summary>
        /// Sets the border color.
        /// </summary>
        /// <param name="color">The masked color.</param>
        public void SetBorderColor(uint color)
        {
            //EnsureBorder();

            var brush = new SolidColorBrush(ColorHelpers.Parse(color));
            LeftBorderBrush = brush;
            TopBorderBrush = brush;
            RightBorderBrush = brush;
            BottomBorderBrush = brush;

            //if (_customBorder != null)
            //{
            //    _customBorder.BorderBrush = brush;
            //}
            //else
            //{
            //    Debug.Assert(_customLeftBorder != null);
            //    Debug.Assert(_customTopBorder != null);
            //    Debug.Assert(_customRightBorder != null);
            //    Debug.Assert(_customBottomBorder != null);

            //    _customLeftBorder.BorderBrush = brush;
            //    _customTopBorder.BorderBrush = brush;
            //    _customRightBorder.BorderBrush = brush;
            //    _customBottomBorder.BorderBrush = brush;
            //}
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

                //EnsureSideBorders();

                switch (kind)
                {
                    case CSSSpacingType.Left:
                        //_customLeftBorder.BorderBrush = brush;
                        LeftBorderBrush = brush;
                        break;
                    case CSSSpacingType.Top:
                        //_customTopBorder.BorderBrush = brush;
                        TopBorderBrush = brush;
                        break;
                    case CSSSpacingType.Right:
                        //_customRightBorder.BorderBrush = brush;
                        RightBorderBrush = brush;
                        break;
                    case CSSSpacingType.Bottom:
                        //_customBottomBorder.BorderBrush = brush;
                        BottomBorderBrush = brush;
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

            //CornerRadius = new CornerRadius(radius);
            //var cornerRadius = new CornerRadius(radius);

            //EnsureBorder();

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
            //    //Debug.Assert(_customLeftBorder != null);
            //    //Debug.Assert(_customTopBorder != null);
            //    //Debug.Assert(_customRightBorder != null);
            //    //Debug.Assert(_customBottomBorder != null);

            //    //_customLeftBorder.CornerRadius = new CornerRadius(radius, 0, 0, 0);
            //    //_customTopBorder.CornerRadius = new CornerRadius(0, radius, 0, 0);
            //    //_customRightBorder.CornerRadius = new CornerRadius(0, 0, radius, 0);
            //    //_customBottomBorder.CornerRadius = new CornerRadius(0, 0, 0, radius);
            //}
        }

        //private void EnsureBorder()
        //{
        //    if (HasCustomBorder)
        //    {
        //        return;
        //    }

        //    var inner = Content;
        //    base.Content = null;
        //    _customBorder = new Border();
        //    _customBorder.BorderThickness = BorderThickness;
        //    _customBorder.BorderBrush = BorderBrush;
        //    base.Content = _customBorder;
        //    //_customBorder.Child = inner;
        //}

        //private void EnsureSideBorders()
        //{
        //    if (HasCustomBorder && _customBorder == null)
        //    {
        //        return;
        //    }

        //    _customLeftBorder = new Border();
        //    _customRightBorder = new Border();
        //    _customTopBorder = new Border();
        //    _customBottomBorder = new Border();

        //    _customLeftBorder.Child = _customTopBorder;
        //    _customTopBorder.Child = _customRightBorder;
        //    _customRightBorder.Child = _customBottomBorder;

        //    var borderThickness = _customBorder != null ? _customBorder.BorderThickness : BorderThickness;
        //    var cornerRadius = _customBorder != null ? _customBorder.CornerRadius : new CornerRadius();
        //    var borderBrush = _customBorder != null ? _customBorder.BorderBrush : BorderBrush;
        //    var child = _customBorder != null ? _customBorder.Child : (UIElement)Content;

        //    if (_customBorder != null)
        //    {
        //        _customBorder.Child = null;
        //        _customBorder = null;
        //    }

        //    _customLeftBorder.BorderThickness = new Thickness(borderThickness.Left, 0, 0, 0);
        //    _customLeftBorder.CornerRadius = new CornerRadius(cornerRadius.TopLeft, 0, 0, cornerRadius.BottomLeft);
        //    _customLeftBorder.BorderBrush = borderBrush;
        //    _customTopBorder.BorderThickness = new Thickness(0, borderThickness.Top, 0, 0);
        //    _customTopBorder.CornerRadius = new CornerRadius(0, cornerRadius.TopRight, 0, 0);
        //    _customTopBorder.BorderBrush = borderBrush;
        //    _customRightBorder.BorderThickness = new Thickness(0, 0, borderThickness.Right, 0);
        //    _customRightBorder.CornerRadius = new CornerRadius(0, 0, cornerRadius.BottomRight, 0);
        //    _customRightBorder.BorderBrush = borderBrush;
        //    _customBottomBorder.BorderThickness = new Thickness(0, 0, 0, borderThickness.Bottom);
        //    _customBottomBorder.CornerRadius = new CornerRadius();
        //    _customBottomBorder.BorderBrush = borderBrush;
        //    _customBottomBorder.Child = child;

        //    base.Content = _customLeftBorder;
        //}
    }
}