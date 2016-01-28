using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// Event emitted by <see cref="TextBox"/> native view when the control gains focus.
    /// </summary>
    class ReactTextInputBlurEvent : EventBase
    {
        public static readonly String EVENT_NAME = "topBlur";

        public ReactTextInputBlurEvent(int viewId) : base(viewId)
        {
        }

        /// <summary>
        /// Disabling event coalescing.
        /// </summary>
        /// <remarks>
        /// Return false if the event can never be coalesced.
        /// </remarks>
        public override bool CanCoalesce
        {
            get
            {
                return false;
            }
        }

        /// <summary>
        /// Gets the name of the Event
        /// </summary>
        public override string EventName
        {
            get
            {
                return EVENT_NAME;
            }
        }
    }
}
