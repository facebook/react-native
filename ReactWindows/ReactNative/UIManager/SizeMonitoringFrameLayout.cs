using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{ 
    /// <summary>
    /// allows registering for size change events. The main purpose for this class is to hide complexity of ReactRootView
    /// </summary>
    public class SizeMonitoringFrameLayout : Panel
    {
        public interface OnSizeChangedListener
        {
            void onSizeChanged(int width, int height, int oldWidth, int oldHeight);
        }

        private OnSizeChangedListener mOnSizeChangedListener;

        public void setOnSizeChangedListener(OnSizeChangedListener onSizeChangedListener)
        {
            mOnSizeChangedListener = onSizeChangedListener;
        }

        protected void onSizeChanged(int w, int h, int oldw, int oldh)
        {
            //  base.onSizeChanged(w, h, oldw, oldh);

            if (mOnSizeChangedListener != null)
            {
                mOnSizeChangedListener.onSizeChanged(w, h, oldw, oldh);
            }
        }
    }
}
