namespace ReactNative.Modules.Core
{
    public interface RCTNativeAppEventEmitter
    {
        void emit(string eventName, object data);
    }
}
