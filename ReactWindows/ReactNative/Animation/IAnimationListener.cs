using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.Animation
{
    /// <summary>
    /// Interface for getting animation lifecycle updates. It is guaranteed that for a given animation,
    /// only one of <see cref="OnFinished"/> and <see cref="OnCancel"/> will be called, and it will be called exactly once.
    /// </summary>
    public interface IAnimationListener
    {
        /// <summary>
        /// Called once animation has finished.
        /// </summary>
        void OnFinished();

        /// <summary>
        /// Called in case when animation was cancelled.
        /// </summary>
        void OnCancel();
    }
}
