namespace ReactNative.Touch
{
    /// <summary>
    /// This interface should be implemented by all
    /// <see cref="Windows.UI.Xaml.Controls.Panel"/> subviews that can 
    /// be instantiated by <see cref="ReactNative.UIManager.NativeViewHierarchyManager"/>.
    /// </summary>
    public interface ICatalystInterceptingViewGroup
    {
        /// <summary>
        /// A callback that <see cref="Windows.UI.Xaml.Controls.Panel"/> should
        /// delegate calls for touch events.
        /// </summary>
        /// <param name="listener">The touch event listener.</param>
        void SetOnInterceptTouchEventListener(IOnInterceptTouchEventListener listener);
    }
}
