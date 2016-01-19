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
            new PropertyMetadata(new SolidColorBrush(Colors.Black)));

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
            new PropertyMetadata(new SolidColorBrush(Colors.Black)));

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
            new PropertyMetadata(new SolidColorBrush(Colors.Black)));

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
            new PropertyMetadata(new SolidColorBrush(Colors.Black)));

        public Brush BottomBorderBrush
        {
            get { return (Brush)GetValue(BottomBorderBrushProperty); }
            set { SetValue(BottomBorderBrushProperty, value); }
        }
        #endregion
        #endregion

        /// <summary>
        /// Instantiates the <see cref="BorderedContentControl"/>.
        /// </summary>
        public BorderedContentControl()
        {
            DefaultStyleKey = typeof(BorderedContentControl);
            SizeChanged += BorderedContentControl_SizeChanged;
        }

        private void BorderedContentControl_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            LayoutBorderGeometry(e.NewSize);
        }

        private void LayoutBorderGeometry(Size newSize)
        {
            var upperLeftLowerPoint = new Point(LeftBorderThickness / 2, (TopBorderThickness / 2) + CornerRadius.TopLeft);
            var upperLeftUpperPoint = new Point((LeftBorderThickness / 2) + CornerRadius.TopLeft, TopBorderThickness / 2);
            var upperLeftCenterPoint = new Point((LeftBorderThickness / 2) + CornerRadius.TopLeft, (TopBorderThickness / 2) + CornerRadius.TopLeft);

            var upperRightUpperPoint = new Point(newSize.Width - ((RightBorderThickness / 2) + CornerRadius.TopRight), TopBorderThickness / 2);
            var upperRightLowerPoint = new Point(newSize.Width - (RightBorderThickness / 2), (TopBorderThickness / 2) + CornerRadius.TopRight);
            var upperRightCenterPoint = new Point(newSize.Width - ((RightBorderThickness / 2) + CornerRadius.TopRight), (TopBorderThickness / 2) + CornerRadius.TopRight);

            var lowerRightUpperPoint = new Point(newSize.Width - (RightBorderThickness / 2), newSize.Height - ((BottomBorderThickness / 2) + CornerRadius.BottomRight));
            var lowerRigthLowerPoint = new Point(newSize.Width - ((RightBorderThickness / 2) + CornerRadius.BottomRight), newSize.Height - (BottomBorderThickness / 2));
            var lowerRightCenterPoint = new Point(newSize.Width - ((RightBorderThickness / 2) + CornerRadius.BottomRight), newSize.Height - ((BottomBorderThickness / 2) + CornerRadius.BottomRight));

            var lowerLeftLowerPoint = new Point((LeftBorderThickness / 2) + CornerRadius.BottomLeft, newSize.Height - (BottomBorderThickness / 2));
            var lowerLeftUpperPoint = new Point(LeftBorderThickness / 2, newSize.Height - ((BottomBorderThickness / 2) + CornerRadius.BottomLeft));
            var lowerLeftCenterPoint = new Point((LeftBorderThickness / 2) + CornerRadius.TopLeft, newSize.Height - ((BottomBorderThickness / 2) + CornerRadius.BottomRight));

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
                //figure.Segments.Add(new QuadraticBezierSegment() { Point1  = startPoint, Point2 = endPoint});
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
            Padding = new Thickness(width);
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
            else
            {
                var padding = Padding;
                switch (kind)
                {
                    case CSSSpacingType.Left:
                        LeftBorderThickness = width;
                        padding.Left = width;
                        break;
                    case CSSSpacingType.Top:
                        TopBorderThickness = width;
                        padding.Top = width;
                        break;
                    case CSSSpacingType.Right:
                        RightBorderThickness = width;
                        padding.Right = width;
                        break;
                    case CSSSpacingType.Bottom:
                        BottomBorderThickness = width;
                        padding.Bottom = width;
                        break;
                }
                Padding = padding;
            }
        }

        /// <summary>
        /// Sets the border color.
        /// </summary>
        /// <param name="color">The masked color.</param>
        public void SetBorderColor(uint color)
        {
            var brush = new SolidColorBrush(ColorHelpers.Parse(color));
            LeftBorderBrush = brush;
            TopBorderBrush = brush;
            RightBorderBrush = brush;
            BottomBorderBrush = brush;
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

                switch (kind)
                {
                    case CSSSpacingType.Left:
                        LeftBorderBrush = brush;
                        break;
                    case CSSSpacingType.Top:
                        TopBorderBrush = brush;
                        break;
                    case CSSSpacingType.Right:
                        RightBorderBrush = brush;
                        break;
                    case CSSSpacingType.Bottom:
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
        }
    }
}