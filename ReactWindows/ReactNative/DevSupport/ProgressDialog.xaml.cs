using System.Threading;
using Windows.UI.Xaml.Controls;

namespace ReactNative.DevSupport
{
    /// <summary>
    /// Content dialog for when the app is waiting.
    /// </summary>
    /// <remarks>
    /// This is used when awaiting the regeneration of the JavaScript bundle.
    /// </remarks>
    public sealed partial class ProgressDialog : ContentDialog
    {
        private readonly CancellationTokenSource _cancellationTokenSource;

        /// <summary>
        /// Instantiates the <see cref="ProgressDialog"/>.
        /// </summary>
        /// <param name="title">The title.</param>
        /// <param name="message">The message.</param>
        public ProgressDialog(string title, string message)
        {
            this.InitializeComponent();

            Heading = title;
            Message = message;

            _cancellationTokenSource = new CancellationTokenSource();
        }

        /// <summary>
        /// The title of the dialog.
        /// </summary>
        public string Heading { get; }

        /// <summary>
        /// The message displayed in the dialog.
        /// </summary>
        public string Message { get; }

        /// <summary>
        /// The cancellation token cancelled upon dialog dismissal.
        /// </summary>
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
