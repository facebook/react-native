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

        public CornerRadius CornerRadius
        {
            get { return (CornerRadius)GetValue(CornerRadiusProperty); }
            set { SetValue(CornerRadiusProperty, value); }
        }
        #region Left Border
        public static DependencyProperty LeftBorderGeometryProperty { get; } = DependencyProperty.Register("LeftBorderGeometry",
            typeof(GeometryGroup),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public GeometryGroup LeftBorderGeometry
        {
            get { return (GeometryGroup)GetValue(LeftBorderGeometryProperty); }
            set { SetValue(LeftBorderGeometryProperty, value); }
        }

        public static DependencyProperty LeftBorderThicknessProperty { get; } = DependencyProperty.Register("LeftBorderThickness",
            typeof(double),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public double LeftBorderThickness
        {
            get { return (double)GetValue(LeftBorderThicknessProperty); }
            set { SetValue(LeftBorderThicknessProperty, value); }
        }

        public static DependencyProperty LeftBorderBrushProperty { get; } = DependencyProperty.Register("LeftBorderBrush",
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
        public static DependencyProperty TopBorderGeometryProperty { get; } = DependencyProperty.Register("TopBorderGeometry",
            typeof(GeometryGroup),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public GeometryGroup TopBorderGeometry
        {
            get { return (GeometryGroup)GetValue(TopBorderGeometryProperty); }
            set { SetValue(TopBorderGeometryProperty, value); }
        }

        public static DependencyProperty TopBorderThicknessProperty { get; } = DependencyProperty.Register("TopBorderThickness",
            typeof(double),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public double TopBorderThickness
        {
            get { return (double)GetValue(TopBorderThicknessProperty); }
            set { SetValue(TopBorderThicknessProperty, value); }
        }

        public static DependencyProperty TopBorderBrushProperty { get; } = DependencyProperty.Register("TopBorderBrush",
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
        public static DependencyProperty RightBorderGeometryProperty { get; } = DependencyProperty.Register("RightBorderGeometry",
            typeof(GeometryGroup),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public GeometryGroup RightBorderGeometry
        {
            get { return (GeometryGroup)GetValue(RightBorderGeometryProperty); }
            set { SetValue(RightBorderGeometryProperty, value); }
        }

        public static DependencyProperty RightBorderThicknessProperty { get; } = DependencyProperty.Register("RightBorderThickness",
            typeof(double),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public double RightBorderThickness
        {
            get { return (double)GetValue(RightBorderThicknessProperty); }
            set { SetValue(RightBorderThicknessProperty, value); }
        }

        public static DependencyProperty RightBorderBrushProperty { get; } = DependencyProperty.Register("RightBorderBrush",
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
        public static DependencyProperty BottomBorderGeometryProperty { get; } = DependencyProperty.Register("BottomBorderGeometry",
             typeof(GeometryGroup),
             typeof(BorderedContentControl),
             new PropertyMetadata(null));

        public GeometryGroup BottomBorderGeometry
        {
            get { return (GeometryGroup)GetValue(BottomBorderGeometryProperty); }
            set { SetValue(BottomBorderGeometryProperty, value); }
        }

        public static DependencyProperty BottomBorderThicknessProperty { get; } = DependencyProperty.Register("BottomBorderThickness",
            typeof(double),
            typeof(BorderedContentControl),
            new PropertyMetadata(null));

        public double BottomBorderThickness
        {
            get { return (double)GetValue(BottomBorderThicknessProperty); }
            set { SetValue(BottomBorderThicknessProperty, value); }
        }

        public static DependencyProperty BottomBorderBrushProperty { get; } = DependencyProperty.Register("BottomBorderBrush",
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
    }
}
