using ReactNative.Touch;
using ReactNative.UIManager;
using System;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Media.Media3D;

namespace ReactNative.Views.View
{
    /// <summary>
    /// Backing for a React View. Has support for borders, but since borders 
    /// aren't common, lazy initializes most of the storage needed for them. Also supports
    /// 3D transformations such as elevation depth.  
    /// </summary>
    public class ReactPanel : Canvas, ICatalystInterceptingViewGroup, ReactPointerEventsView
    {
        private IOnInterceptTouchEventListener _onInterceptTouchEventListener;
        private PointerEvents _PointerEvents = PointerEvents.Auto;
        private Border _Border;
        private CompositeTransform3D _Transform = new CompositeTransform3D();

        public ReactPanel() : base()
        {
            this.SizeChanged += OnBoundsChanged;
        }

        public PointerEvents PointerEvents
        {
            set
            {
                _PointerEvents = value;
            }
        }

        /// <summary>
        /// Stubbed out so any class that implements <see cref="ReactViewManager"/> can 
        /// override the OnBoundsChanged. 
        /// TODO: The default behavior for RCTView still needs to be 
        /// d. 
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        protected virtual void OnBoundsChanged(object sender, SizeChangedEventArgs e)
        {
        }

        public PointerEvents GetPointerEvents()
        {
            return _PointerEvents;
        }

        /// <summary>
        /// Sets the touch event listener for the react view.
        /// </summary>
        /// <param name="listener">The custom touch event listener.</param>
        public void SetOnInterceptTouchEventListener(IOnInterceptTouchEventListener listener)
        {
            _onInterceptTouchEventListener = listener;
            this.PointerPressed += OnInterceptTouchEvent;
        }

        private void OnInterceptTouchEvent(object sender, PointerRoutedEventArgs ev)
        {
            if (_PointerEvents == PointerEvents.None || _PointerEvents == PointerEvents.BoxNone)
            {
                return;
            }

            _onInterceptTouchEventListener.OnInterceptTouchEvent(sender, ev);
        }

        public void SetBackgroundColor(string color)
        {
            this.Background = ParseColor(color);
        }

        private static Brush ParseColor(string color)
        {
            var r = Convert.ToByte(color.Substring(1, 2), 16);
            var g = Convert.ToByte(color.Substring(3, 2), 16);
            var b = Convert.ToByte(color.Substring(5, 2), 16);
            return new SolidColorBrush(Windows.UI.Color.FromArgb(255, r, g, b));
        }
        
        /// <summary>
        /// Sets the border background color.
        /// </summary>
        /// <param name="color">The Hex color code</param>
        public void SetBorderBackgroundColor(string color)
        {
            GetOrCreateReactViewBorder().Background = ParseColor(color);
        }

        /// <summary>
        /// Sets the outer border brush color.
        /// </summary>
        /// <param name="color">The color Hex code</param>
        public void SetBorderOuterColor(string color)
        {
            GetOrCreateReactViewBorder().BorderBrush = ParseColor(color);
        }

        /// <summary>
        /// Sets the border radius.
        /// </summary>
        /// <param name="borderRadius">Boder radius</param>
        public void SetBorderRadius(float borderRadius)
        {
            GetOrCreateReactViewBorder().CornerRadius = new CornerRadius(borderRadius);
        }

        private Border GetOrCreateReactViewBorder()
        {
            if (_Border == null)
            {
                _Border = new Border();
                _Border.Child = this;
            }

            return _Border;
        }
        
        /// <summary>
        /// Sets the border padding for the <see cref="ReactPanel"/>.
        /// </summary>
        /// <param name="thickness">The padding of the <see cref="ReactPanel"/> <see cref="Border"/> in pixels.</param>
        public void SetBorderThickness(float thickness)
        {
            GetOrCreateReactViewBorder().BorderThickness = new Thickness(thickness);
        }

        /// <summary>
        /// Sets the padding for the <see cref="ReactPanel"/>.
        /// </summary>
        /// <param name="thickness">The padding of the <see cref="ReactPanel"/> in pixels.</param>
        public void SetBorderPadding(float thickness)
        {
            GetOrCreateReactViewBorder().Padding = new Thickness(thickness);
        }

        /// <summary>
        /// Sets an elevation 3D transformation effect on the <see cref="ReactPanel"/>.
        /// </summary>
        /// <param name="elevation">The positive negative elevation Z Index value of the view.</param>
        public void SetElevationEffect(float elevation)
        {
            _Transform.TranslateZ = elevation;
            this.Transform3D = _Transform;
        }

        /// <summary>
        /// Sets the distance to translate along the x-axis in pixels of the view panel.
        /// </summary>
        /// <param name="distance">The translation distance value along the x-axis.</param>
        public void setTranslationX(float distance)
        {
            _Transform.TranslateX = distance;
            this.Transform3D = _Transform;
        }

        /// <summary>
        /// Sets the angle in degrees of clockwise rotation around the x-axis 
        /// of the view panel.
        /// </summary>
        /// <param name="degrees">The x-axis rotation degrees.</param>
        public void setRotationX(float degrees)
        {
            _Transform.RotationX = degrees;
            this.Transform3D = _Transform;
        }

        /// <summary>
        /// Sets the angle in degrees of clockwise rotation around the y-axis 
        /// of the view panel.
        /// </summary>
        /// <param name="degrees">The y-axis rotation degrees.</param>
        public void setRotationY(float degrees)
        {
            _Transform.RotationY = degrees;
            this.Transform3D = _Transform;
        }


        /// <summary>
        /// Sets the distance to translate along the y-axis in pixels of the view panel.
        /// </summary>
        /// <param name="value">The translation distance value along the y-axis.</param>
        public void setTranslationY(float value)
        {
            _Transform.TranslateY = value;
            this.Transform3D = _Transform;
        }

        /// <summary>
        /// Sets the y-axis scale factor. You can use this property to stretch or shrink 
        /// the panel  along the y-axis.
        /// </summary>
        /// <param name="factor">The y-axis scale factor.</param>
        public void setScaleY(float factor)
        {
            _Transform.ScaleY = factor;
            this.Transform3D = _Transform;
        }

        /// <summary>
        /// Sets the y-axis scale factor. You can use this property to stretch or shrink 
        /// the panel  along the x-axis.
        /// </summary>
        /// <param name="factor">The x-axis scale factor.</param>
        public void setScaleX(float factor)
        {
            _Transform.ScaleX = factor;
            this.Transform3D = _Transform;
        }

        /// <summary>
        /// Retrieves the number of subviews for the current <see cref="ReactPanel"/> view.
        /// </summary>
        public int ChildrenCount
        {
            get
            {
                return this.Children.Count;
            }
        }
    }
}
