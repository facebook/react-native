namespace ReactNative.Bridge.Queue
{
    public interface ICatalystQueueConfiguration
    {
        IMessageQueueThread DispatcherQueueThread { get; }
        IMessageQueueThread NativeModulesQueueThread { get; }
        IMessageQueueThread JSQueueThread { get; }
    }
}
