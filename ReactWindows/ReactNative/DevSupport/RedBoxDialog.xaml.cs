using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using Windows.UI.Xaml.Controls;

// The Content Dialog item template is documented at http://go.microsoft.com/fwlink/?LinkId=234238

namespace ReactNative.DevSupport
{
    /// <summary>
    /// The content dialog for red box exception display.
    /// </summary>
    public sealed partial class RedBoxDialog : ContentDialog, INotifyPropertyChanged
    {
        private readonly Action _onClick;

        private string _message;
        private List<IStackFrame> _stackTrace;

        /// <summary>
        /// Instantiates the <see cref="RedBoxDialog"/>.
        /// </summary>
        /// <param name="onClick">
        /// Action to take when primary button is clicked.
        /// </param>
        public RedBoxDialog(Action onClick)
        {
            this.InitializeComponent();

            _onClick = onClick;
        }

        /// <summary>
        /// Notifies the event subscriber when properties change.
        /// </summary>
        public event PropertyChangedEventHandler PropertyChanged;

        /// <summary>
        /// The error cookie.
        /// </summary>
        public int ErrorCookie
        {
            get;
            set;
        }

        /// <summary>
        /// The exception message.
        /// </summary>
        public string Message
        {
            get
            {
                return _message;
            }
            set
            {
                _message = value;
                OnNotifyPropertyChanged();
            }
        }

        /// <summary>
        /// The stack trace.
        /// </summary>
        public List<IStackFrame> StackTrace
        {
            get
            {
                return _stackTrace;
            }
            set
            {
                _stackTrace = value;
                OnNotifyPropertyChanged();
            }
        }

        private void ContentDialog_PrimaryButtonClick(ContentDialog sender, ContentDialogButtonClickEventArgs args)
        {
            _onClick();
        }

        private void OnNotifyPropertyChanged([CallerMemberName] string propertyName = null)
        {
            var propertyChanged = PropertyChanged;
            if (propertyChanged != null)
            {
                propertyChanged(this, new PropertyChangedEventArgs(propertyName));
            }
        }
    }
}
