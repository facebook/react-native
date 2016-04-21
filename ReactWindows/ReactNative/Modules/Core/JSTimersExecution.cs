using ReactNative.Bridge;
using System.Collections.Generic;

namespace ReactNative.Modules.Core
{
    /// <summary>
    /// JavaScript module for invoking timers by identifier.
    /// </summary>
    public sealed class JSTimersExecution : JavaScriptModuleBase
    {
        /// <summary>
        /// Calls a batch of timers with the given identifiers.
        /// </summary>
        /// <param name="timerIds">The timer identifiers.</param>
        public void callTimers(IList<int> timerIds)
        {
            Invoke(timerIds);
        }
    }
}
