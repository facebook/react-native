using System;

namespace ReactNative.Hosting
{
    using System.Runtime.InteropServices;

    /// <summary>
    ///     A function callback.
    /// </summary>
    /// <param name="callee">
    ///     A <c>Function</c> object that represents the function being invoked.
    /// </param>
    /// <param name="isConstructCall">Indicates whether this is a regular call or a 'new' call.</param>
    /// <param name="arguments">The arguments to the call.</param>
    /// <param name="argumentCount">The number of arguments.</param>
    /// <param name="callbackData">Callback data, if any.</param>
    /// <returns>The result of the call, if any.</returns>
    public delegate JavaScriptValue JavaScriptNativeFunction(JavaScriptValue callee, bool isConstructCall, [MarshalAs(UnmanagedType.LPArray, SizeParamIndex = 3)] JavaScriptValue[] arguments, ushort argumentCount, IntPtr callbackData);
}
