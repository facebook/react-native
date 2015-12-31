using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ReactNative.touch;
using Windows.UI.Xaml.Controls;
using ReactNative.Touch;

namespace ReactNative.Views.View
{
    /// <summary>
    /// Backing for a React View. Has support for borders, but since borders 
    /// aren't common, lazy initializes most of the storage needed for them.
    /// </summary>
    class ReactViewGroup : Panel, CatalystInterceptingViewGroup
    {
        public void setOnInterceptTouchEventListener(OnInterceptTouchEventListener listener)
        {
            throw new NotImplementedException();
        }
    }
}
