using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Interface for the root native view of a React native application.
    /// </summary>
    public interface RootView
    {
        /// <summary>
        /// Called when a child starts a native gesture (e.g. a scroll in a ScrollView).
        /// </summary>
        /// <param name="androidEvent"></param>
        //void onChildStartedNativeGesture(CalibrationEventArgs wpEvent);
    }
}
