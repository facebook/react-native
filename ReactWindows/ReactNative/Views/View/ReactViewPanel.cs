using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ReactNative.touch;
using Windows.UI.Xaml.Controls;
using ReactNative.Touch;
using ReactNative.UIManager;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media.Media3D;

namespace ReactNative.Views.View
{
    /// <summary>
    /// Backing for a React View. Has support for borders, but since borders 
    /// aren't common, lazy initializes most of the storage needed for them. Also supports
    /// 3D transformations such as elevation depth.  
    /// </summary>
    public class ReactViewPanel : Panel, CatalystInterceptingViewGroup, ReactPointerEventsView
    {
        private OnInterceptTouchEventListener _OnInterceptTouchEventListener;
        private PointerEvents _PointerEvents = PointerEvents.Auto;
        private Border _Border;
        private CompositeTransform3D _Transform = new CompositeTransform3D();

        public ReactViewPanel() : base()
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
        public void SetOnInterceptTouchEventListener(OnInterceptTouchEventListener listener)
        {
            _OnInterceptTouchEventListener = listener;
            this.PointerPressed += OnInterceptTouchEvent;
        }

        private void OnInterceptTouchEvent(object sender, PointerRoutedEventArgs ev)
        {
            if (_PointerEvents == PointerEvents.None || _PointerEvents == PointerEvents.BoxNone)
            {
                return;
            }

            _OnInterceptTouchEventListener.onInterceptTouchEvent(sender, ev);
        }

        protected void SetBackgroundColor(string color)
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
        /// Sets the border padding for the <see cref="ReactViewPanel"/>.
        /// </summary>
        /// <param name="thickness">The padding of the <see cref="ReactViewPanel"/> <see cref="Border"/> in pixels.</param>
        public void SetBorderThickness(float thickness)
        {
            GetOrCreateReactViewBorder().BorderThickness = new Thickness(thickness);
        }

        /// <summary>
        /// Sets the padding for the <see cref="ReactViewPanel"/>.
        /// </summary>
        /// <param name="thickness">The padding of the <see cref="ReactViewPanel"/> in pixels.</param>
        public void SetBorderPadding(float thickness)
        {
            GetOrCreateReactViewBorder().Padding = new Thickness(thickness);
        }

        /// <summary>
        /// Sets an elevation 3D transformatin effect on the <see cref="ReactViewPanel"/>.
        /// </summary>
        /// <param name="elevation">The positive negative elevation Z Index value of the view.</param>
        public void SetElevationEffect(float elevation)
        {
            _Transform.TranslateZ = elevation;
            this.Transform3D = _Transform;
        }
        
        /// <summary>
        /// Retrieves the number of subviews for the current <see cref="ReactViewPanel"/> view.
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
