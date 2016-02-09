using System;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

// The Content Dialog item template is documented at http://go.microsoft.com/fwlink/?LinkId=234238

namespace ReactNative.DevSupport
{
    sealed partial class DevOptionDialog : ContentDialog
    {
        private static readonly Thickness s_buttonMargin = new Thickness(2);

        public DevOptionDialog()
        {
            this.InitializeComponent();
        }

        public void Add(string name, Action onSelect)
        {
            var button = new Button
            {
                Content = name,
            };

            button.Click += (sender, args) => onSelect();

            OptionsStackPanel.Children.Add(button);
        }

        private void ContentDialog_PrimaryButtonClick(ContentDialog sender, ContentDialogButtonClickEventArgs args)
        {
        }
    }
}
