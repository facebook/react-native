using System.Threading;
using Windows.UI.Xaml.Controls;

// The Content Dialog item template is documented at http://go.microsoft.com/fwlink/?LinkId=234238

namespace ReactNative.DevSupport
{
    public sealed partial class ProgressDialog : ContentDialog
    {
        private readonly CancellationTokenSource _cancellationTokenSource;

        public ProgressDialog(string title, string message)
        {
            this.InitializeComponent();

            Heading = title;
            Message = message;

            _cancellationTokenSource = new CancellationTokenSource();
        }

        public string Heading { get; }

        public string Message { get; }

        public CancellationToken Token
        {
            get
            {
                return _cancellationTokenSource.Token;
            }
        }

        private void ContentDialog_PrimaryButtonClick(ContentDialog sender, ContentDialogButtonClickEventArgs args)
        {
            _cancellationTokenSource.Cancel();
        }
    }
}
