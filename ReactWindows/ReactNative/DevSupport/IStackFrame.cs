namespace ReactNative.DevSupport
{
    interface IStackFrame
    {
        string Method { get; }

        int Line { get; }

        int Column { get; }

        string FileName { get; }
    }
}
