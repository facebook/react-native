
namespace ReactNative.Bridge
{
    /// <summary>
    /// Abstract class responsible for brokering communication between native and React Naitve components 
    /// </summary>
    public abstract class JavaScriptExecuter
    {
        private ICSharpJSExecutor mJSExecutor;

        /// <summary>
        /// Sets the JS executor
        /// </summary>
        /// <param name="executor"></param>
        public JavaScriptExecuter(ICSharpJSExecutor executor)
        {
            mJSExecutor = executor;
        }

        /// <summary>
        /// Closes the executor
        /// </summary>
        public abstract void close();

        /// <summary>
        /// Instantiates the executor
        /// </summary>
        /// <param name="executor"></param>
        public abstract void initialize(ICSharpJSExecutor executor);
    }
}
