using System;
using Windows.UI;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;

namespace ReactNative.DevSupport
{
    class RedBoxDialog : ContentDialog
    {
        public RedBoxDialog()
        {
            Background = new SolidColorBrush(Colors.Red);
            FontSize = 12;
        }

        public int ErrorCookie
        {
            get;
            set;
        }

        public IStackFrame[] StackTrace
        {
            set
            {
                if (value == null)
                    throw new ArgumentNullException(nameof(value));

                Content = CreateContent(value);
            }
        }

        private static object CreateContent(IStackFrame[] stackTrace)
        {
            return new TextBlock
            {
                Text = stackTrace.PrettyPrint(),
                FontFamily = new FontFamily("Consolas"),
                FontSize = 10,
            };
        }
    }
}
