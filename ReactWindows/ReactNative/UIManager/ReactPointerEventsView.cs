using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.UIManager
{
    /// <summary>
    /// This interface should be implemented be native <see cref="Panel"/> subclasses that support pointer 
    /// events handling.It is used to find the target View of a touch event.
    /// </summary>
    public interface ReactPointerEventsView
    {
        /// <summary>
        /// Return the PointerEvents of the View.
        /// </summary>
        /// <returns></returns>
        PointerEvents GetPointerEvents();
    }
}
