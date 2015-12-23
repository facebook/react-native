
namespace ReactNative.UIManager
{
    public abstract class ReactProp
    {
        private readonly string USE_DEFAULT_TYPE = "__default_type__";
        private readonly double DEFAULT_DOUBLE = 0.0;
        private readonly float DEFAULT_FLOAT = 0.0f;
        private readonly int DEFAULT_INT = 0;

        /// <summary>
        /// Name of the property exposed to JS
        /// </summary>
        /// <returns></returns>
        protected abstract string name();

        /// <summary>
        /// Type of property that will be send to JS.
        /// </summary>
        /// <returns></returns>
        protected virtual string customType() {
            return USE_DEFAULT_TYPE;
        }

        public double defaultDouble() {
            return DEFAULT_DOUBLE;
        }

        public float defaultFloat()
        {
            return DEFAULT_FLOAT;
        }

        public int defaultInt()
        {
            return DEFAULT_INT;
        }
    }
}
