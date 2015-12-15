namespace ReactNative.Bridge
{
    public interface ICSharpJSExecutor
    {
        void close();

        void executeApplicationScript(string script, string sourceURL);

        string executeJSCall(string methodName, string jsonArgsArray);
  
    }
}
