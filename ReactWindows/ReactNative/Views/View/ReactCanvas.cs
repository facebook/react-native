using ReactNative.Touch;
using ReactNative.UIManager;
using System;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media.Media3D;

namespace ReactNative.Views.View
{
    /// <summary>
    /// Backing for a React View. Has support for borders, but since borders 
    /// aren't common, lazy initializes most of the storage needed for them. Also supports
    /// 3D transformations such as elevation depth.  
    /// </summary>
    public class ReactCanvas : Canvas, IReactInterceptingViewParent, IReactPointerEventsView
    {
        /// <summary>
        /// Sets an elevation 3D transformation effect on the <see cref="ReactCanvas"/>.
        /// </summary>
        /// <param name="elevation">The positive negative elevation Z Index value of the view.</param>
        public void SetElevationEffect(float elevation)
        {
            var transform = EnsureTransform();
            transform.TranslateZ = elevation;
            Transform3D = transform;
        }

        private CompositeTransform3D EnsureTransform()
        {
            var transform = Transform3D;
            var compositeTransform = transform as CompositeTransform3D;
            if (transform != null && compositeTransform == null)
            {
                throw new InvalidOperationException("Transform property is already set.");
            }

            if (transform == null)
            {
                compositeTransform = new CompositeTransform3D();
                Transform3D = compositeTransform;
            }

            return compositeTransform;
        }
    }
}
