using System;
using System.Collections.Generic;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    class RootViewManager : ViewGroupManager
    {
        private readonly string REACT_CLASS = "ReactView";

        /// <summary>
        /// Get the name of the react root view
        /// </summary>
        public override string Name
        {
            get
            {
                return REACT_CLASS;
            }
        }

        /// <summary>
        /// Creates a new view instance of type <typeparamref name="Panel"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The view instance.</returns>
        protected override FrameworkElement CreateViewInstance(ThemedReactContext reactContext)
        {
            return new SizeMonitoringFrameLayout();
        }
    }
}