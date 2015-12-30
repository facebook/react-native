using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Interface listener to hook into size change events for XAML components of type <see cref="FrameworkElement"/>
    /// </summary>
    public interface ISizeChangedListener
    {
        void onSizeChanged(object sender, SizeChangedEventArgs e);
    }
}
