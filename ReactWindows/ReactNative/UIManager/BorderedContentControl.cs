using Facebook.CSSLayout;
using System.Numerics;
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
    public partial class BorderedContentControl : ContentControl
    {
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
            leftGeometry.Children.Add(CreateCornerGeometry(upperLeftLowerPoint,
                    upperLeftUpperPoint,
                    upperLeftCenterPoint,
                    CornerRadius.TopLeft, 
                    SweepDirection.Clockwise));

            leftGeometry.Children.Add(new LineGeometry() {StartPoint = upperLeftLowerPoint,
                EndPoint = lowerLeftUpperPoint
            });

            // lower left upper half
            leftGeometry.Children.Add(CreateCornerGeometry(lowerLeftUpperPoint,
                    lowerLeftLowerPoint,
                    lowerLeftCenterPoint,
                    CornerRadius.BottomLeft, 
                    SweepDirection.Counterclockwise));

            LeftBorderGeometry = leftGeometry;

            // top geometry
            var topGeometry = new GeometryGroup();

            // upper left upper half
            topGeometry.Children.Add(CreateCornerGeometry(upperLeftUpperPoint,
                    upperLeftLowerPoint,
                    upperLeftCenterPoint,
                    CornerRadius.TopLeft, 
                    SweepDirection.Counterclockwise));

            topGeometry.Children.Add(new LineGeometry()
            {
                StartPoint = upperLeftUpperPoint,
                EndPoint = upperRightUpperPoint
            });

            // upper right upper half
            topGeometry.Children.Add(CreateCornerGeometry(upperRightUpperPoint,
                    upperRightLowerPoint,
                    upperRightCenterPoint,
                    CornerRadius.TopRight, 
                    SweepDirection.Clockwise));

            TopBorderGeometry = topGeometry;

            // right geometry
            var rightGeometry = new GeometryGroup();

            //upper right lower half
            rightGeometry.Children.Add(CreateCornerGeometry(upperRightLowerPoint,
                    upperRightUpperPoint,
                    upperRightCenterPoint,
                    CornerRadius.TopRight, 
                    SweepDirection.Counterclockwise));

            rightGeometry.Children.Add(new LineGeometry()
            {
                StartPoint = upperRightLowerPoint,
                EndPoint = lowerRightUpperPoint
            });

            // lower right upper half
            rightGeometry.Children.Add(CreateCornerGeometry(lowerRightUpperPoint,
                    lowerRigthLowerPoint,
                    lowerRightCenterPoint,
                    CornerRadius.BottomRight, 
                    SweepDirection.Clockwise));

            RightBorderGeometry = rightGeometry;

            // bottom geometry
            var bottomGeometry = new GeometryGroup();

            //lower right lower half
            bottomGeometry.Children.Add(CreateCornerGeometry(lowerRigthLowerPoint,
                    lowerRightUpperPoint,
                    lowerRightCenterPoint,
                    CornerRadius.BottomRight, 
                    SweepDirection.Counterclockwise));

            bottomGeometry.Children.Add(new LineGeometry()
            {
                StartPoint = lowerRigthLowerPoint,
                EndPoint = lowerLeftLowerPoint
            });

            // lower left lower half
            bottomGeometry.Children.Add(CreateCornerGeometry(lowerLeftLowerPoint,
                    lowerLeftUpperPoint,
                    lowerLeftCenterPoint,
                    CornerRadius.BottomLeft, 
                    SweepDirection.Clockwise));

            BottomBorderGeometry = bottomGeometry;
        }

        private PathGeometry CreateCornerGeometry(Point startPoint, Point endPoint, Point centerPoint, double radius, SweepDirection sweepDirection)
        {
            var geometry = new PathGeometry();

            var figure = new PathFigure() { StartPoint = startPoint };
            if (radius > 0)
            {
                figure.Segments.Add(CreateArcSegment(startPoint, endPoint, centerPoint, radius, sweepDirection));
            }
            else
            {
                figure.Segments.Add(new LineSegment() { Point = endPoint });
            }
            geometry.Figures.Add(figure);
            return geometry;
        }

        private ArcSegment CreateArcSegment(Point startPoint, Point endPoint, Point centerPoint, double radius, SweepDirection sweepDirection)
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