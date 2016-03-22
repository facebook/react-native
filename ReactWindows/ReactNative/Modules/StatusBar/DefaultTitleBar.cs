using Windows.UI;

namespace ReactNative.Modules.StatusBar
{
    class DefaultTitleBar : ITitleBar
    {
        private Windows.UI.ViewManagement.ApplicationViewTitleBar _titleBar;

        public DefaultTitleBar(Windows.UI.ViewManagement.ApplicationViewTitleBar titleBar)
        {
            _titleBar = titleBar;
        }

        public Color? BackgroundColor
        {
            get
            {
                return _titleBar.BackgroundColor;
            }
            set
            {
                _titleBar.BackgroundColor = value;
            }
        }
    }
}

