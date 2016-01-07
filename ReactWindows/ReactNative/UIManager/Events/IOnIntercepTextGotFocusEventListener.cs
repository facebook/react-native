using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager.Events
{
    /// <summary>
    /// The interface for defining the methods for receiving and losing <see cref="TextBox"/> control focus.
    /// </summary>
    public interface IOnIntercepTextFocusEventListener
    {
        void OnInterceptLostFocusEvent(object sender, RoutedEventArgs @event);

        void OnInterceptGotFocusEvent(object sender, RoutedEventArgs @event);
    }
}
