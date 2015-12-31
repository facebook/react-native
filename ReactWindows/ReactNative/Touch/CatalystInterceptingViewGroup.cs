using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ReactNative.UIManager;
using ReactNative.touch;

namespace ReactNative.Touch
{
    /// <summary>
    /// This interface should be implemented by all <see cref="Panel"/> subviews that can 
    /// be instantiating by <see cref="NativeViewHierarchyManager"/>
    /// </summary>
    public interface CatalystInterceptingViewGroup
    {
        /// <summary>
        /// A callback that <see cref="Panel"/> should delage calls for <see cref="Panel.GotTouchCaptureEvent"/>
        /// </summary>
        /// <param name="listener">The touch event listener</param>
        void setOnInterceptTouchEventListener(OnInterceptTouchEventListener listener);
    }
}
