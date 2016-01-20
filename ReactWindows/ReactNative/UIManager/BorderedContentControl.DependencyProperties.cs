using Windows.UI;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Media;

namespace ReactNative.UIManager
{
    public partial class BorderedContentControl
    {
        #region DependencyProperties
        public static DependencyProperty CornerRadiusProperty { get; } = DependencyProperty.Register("CornerRadius",
            typeof(CornerRadius),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        /// <summary>
        /// Gets or sets the corner radius of the control.
        /// </summary>
        public CornerRadius CornerRadius
        {
            get { return (CornerRadius)GetValue(CornerRadiusProperty); }
            set { SetValue(CornerRadiusProperty, value); }
        }

        #region Left Border
        public static DependencyProperty LeftBorderGeometryProperty { get; } = DependencyProperty.Register(nameof(LeftBorderGeometry),
            typeof(GeometryGroup),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        /// <summary>
        /// Gets or sets the geometry used for the left component of the border.
        /// </summary>
        public GeometryGroup LeftBorderGeometry
        {
            get { return (GeometryGroup)GetValue(LeftBorderGeometryProperty); }
            set { SetValue(LeftBorderGeometryProperty, value); }
        }

        public static DependencyProperty LeftBorderWidthProperty { get; } = DependencyProperty.Register(nameof(LeftBorderWidth),
            typeof(double),
            typeof(BorderedContentControl),
            new PropertyMetadata(0.0));

        /// <summary>
        /// Gets or sets the border width of the left component of the border.
        /// </summary>
        public double LeftBorderWidth
        {
            get { return (double)GetValue(LeftBorderWidthProperty); }
            set { SetValue(LeftBorderWidthProperty, value); }
        }

        public static DependencyProperty LeftBorderBrushProperty { get; } = DependencyProperty.Register(nameof(LeftBorderBrush),
            typeof(Brush),
            typeof(BorderedContentControl),
            new PropertyMetadata(new SolidColorBrush(Colors.Black)));

        /// <summary>
        /// Gets or sets the brush for the left border component.
        /// </summary>
        public Brush LeftBorderBrush
        {
            get { return (Brush)GetValue(LeftBorderBrushProperty); }
            set { SetValue(LeftBorderBrushProperty, value); }
        }
        #endregion

        #region TopBorder
        public static DependencyProperty TopBorderGeometryProperty { get; } = DependencyProperty.Register(nameof(TopBorderGeometry),
            typeof(GeometryGroup),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        /// <summary>
        /// Gets or sets the geometry used for the top component of the border.
        /// </summary>
        public GeometryGroup TopBorderGeometry
        {
            get { return (GeometryGroup)GetValue(TopBorderGeometryProperty); }
            set { SetValue(TopBorderGeometryProperty, value); }
        }

        public static DependencyProperty TopBorderWidthProperty { get; } = DependencyProperty.Register(nameof(TopBorderWidth),
            typeof(double),
            typeof(BorderedContentControl),
            new PropertyMetadata(0.0));

        /// <summary>
        /// Gets or sets the border width of the top component of the border.
        /// </summary>
        public double TopBorderWidth
        {
            get { return (double)GetValue(TopBorderWidthProperty); }
            set { SetValue(TopBorderWidthProperty, value); }
        }

        public static DependencyProperty TopBorderBrushProperty { get; } = DependencyProperty.Register("TopBorderBrush",
            typeof(Brush),
            typeof(BorderedContentControl),
            new PropertyMetadata(new SolidColorBrush(Colors.Black)));

        /// <summary>
        /// Gets or sets the brush for the top border component.
        /// </summary>
        public Brush TopBorderBrush
        {
            get { return (Brush)GetValue(TopBorderBrushProperty); }
            set { SetValue(TopBorderBrushProperty, value); }
        }
        #endregion

        #region RightBorder
        public static DependencyProperty RightBorderGeometryProperty { get; } = DependencyProperty.Register(nameof(RightBorderGeometry),
            typeof(GeometryGroup),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        /// <summary>
        /// Gets or sets the geometry used for the right component of the border.
        /// </summary>
        public GeometryGroup RightBorderGeometry
        {
            get { return (GeometryGroup)GetValue(RightBorderGeometryProperty); }
            set { SetValue(RightBorderGeometryProperty, value); }
        }

        public static DependencyProperty RightBorderWidthProperty { get; } = DependencyProperty.Register(nameof(RightBorderWidth),
            typeof(double),
            typeof(BorderedContentControl),
            new PropertyMetadata(0.0));

        /// <summary>
        /// Gets or sets the border width of the right component of the border.
        /// </summary>
        public double RightBorderWidth
        {
            get { return (double)GetValue(RightBorderWidthProperty); }
            set { SetValue(RightBorderWidthProperty, value); }
        }

        public static DependencyProperty RightBorderBrushProperty { get; } = DependencyProperty.Register(nameof(RightBorderBrush),
            typeof(Brush),
            typeof(BorderedContentControl),
            new PropertyMetadata(new SolidColorBrush(Colors.Black)));

        /// <summary>
        /// Gets or sets the brush for the right border component.
        /// </summary>
        public Brush RightBorderBrush
        {
            get { return (Brush)GetValue(RightBorderBrushProperty); }
            set { SetValue(RightBorderBrushProperty, value); }
        }
        #endregion

        #region BottomBorder
        public static DependencyProperty BottomBorderGeometryProperty { get; } = DependencyProperty.Register(nameof(BottomBorderGeometry),
             typeof(GeometryGroup),
             typeof(BorderedContentControl),
             new PropertyMetadata(null));

        /// <summary>
        /// Gets or sets the geometry used for the bottom component of the border.
        /// </summary>
        public GeometryGroup BottomBorderGeometry
        {
            get { return (GeometryGroup)GetValue(BottomBorderGeometryProperty); }
            set { SetValue(BottomBorderGeometryProperty, value); }
        }

        public static DependencyProperty BottomBorderWidthProperty { get; } = DependencyProperty.Register(nameof(BottomBorderWidth),
            typeof(double),
            typeof(BorderedContentControl),
            new PropertyMetadata(0.0));

        /// <summary>
        /// Gets or sets the border width of the bottom component of the border.
        /// </summary>
        public double BottomBorderWidth
        {
            get { return (double)GetValue(BottomBorderWidthProperty); }
            set { SetValue(BottomBorderWidthProperty, value); }
        }

        public static DependencyProperty BottomBorderBrushProperty { get; } = DependencyProperty.Register(nameof(BottomBorderBrush),
            typeof(Brush),
            typeof(BorderedContentControl),
            new PropertyMetadata(new SolidColorBrush(Colors.Black)));

        /// <summary>
        /// Gets or sets the brush for the bottom component of the border.
        /// </summary>
        public Brush BottomBorderBrush
        {
            get { return (Brush)GetValue(BottomBorderBrushProperty); }
            set { SetValue(BottomBorderBrushProperty, value); }
        }
        #endregion
        #endregion
    }
}
