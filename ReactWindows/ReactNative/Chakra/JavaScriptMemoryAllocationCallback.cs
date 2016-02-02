namespace ReactNative.Chakra
{
    using System;

    /// <summary>
    ///     User implemented callback routine for memory allocation events
    /// </summary>
    /// <param name="callbackState">The state passed to SetRuntimeMemoryAllocationCallback.</param>
    /// <param name="allocationEvent">The type of type allocation event.</param>
    /// <param name="allocationSize">The size of the allocation.</param>
    /// <returns>
    ///     For the Allocate event, returning true allows the runtime to continue with 
    ///     allocation. Returning false indicates the allocation request is rejected. The return value
    ///     is ignored for other allocation events.
    /// </returns>
    public delegate bool JavaScriptMemoryAllocationCallback(IntPtr callbackState, JavaScriptMemoryEventType allocationEvent, UIntPtr allocationSize);
}
