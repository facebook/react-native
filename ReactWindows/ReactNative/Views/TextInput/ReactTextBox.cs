using ReactNative.UIManager;
using System.Threading;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.TextInput
{
    class ReactTextBox : TextBox, ILayoutManager
    {
        private int _eventCount;
        private double _lastWidth;
        private double _lastHeight;

        public ReactTextBox()
        {
            LayoutUpdated += OnLayoutUpdated;
        }

        public int CurrentEventCount
        {
            get
            {
                return _eventCount;
            }
        }

        public bool ClearTextOnFocus
        {
            get;
            set;
        }

        public bool SelectTextOnFocus
        {
            get;
            set;
        }

        public int IncrementEventCount()
        {
            return Interlocked.Increment(ref _eventCount);
        }

        public void UpdateLayout(int x, int y, int width, int height)
        {
            Canvas.SetLeft(this, x);
            Canvas.SetTop(this, y);
            Width = width;
        }

        protected override void OnGotFocus(RoutedEventArgs e)
        {
            if (ClearTextOnFocus)
            {
                Text = "";
            }

            if (SelectTextOnFocus)
            {
                SelectionStart = 0;
                SelectionLength = Text.Length;
            }
        }

        private void OnLayoutUpdated(object sender, object e)
        {
            var width = ActualWidth;
            var height = ActualHeight;
            if (width != _lastWidth || height != _lastHeight)
            {
                _lastWidth = width;
                _lastHeight = height;

                this.GetReactContext()
                    .GetNativeModule<UIManagerModule>()
                    .EventDispatcher
                    .DispatchEvent(
                        new ReactTextChangedEvent(
                            this.GetTag(),
                            Text,
                            width,
                            height,
                            IncrementEventCount()));
            }
        }
    }
}
