using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.Animation
{
    /// <summary>
    /// Interface for getting animation lifecycle updates. It is guaranteed that for a given animation,
    /// only one of <see cref="onFinished"/> and <see cref="OnCancel"/> will be called, and it will be called exactly once.
    /// </summary>
    public interface IAnimationListener
    {
        /// <summary>
        /// Called once animation is finished.
        /// </summary>
        void onFinished();

        /// <summary>
        /// Called in case when animation was cancelled.
        /// </summary>
        void OnCancel();
    }
}
