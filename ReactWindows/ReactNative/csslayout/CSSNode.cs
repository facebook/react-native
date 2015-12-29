
namespace ReactNative.CSSLayout
{
    public class CSSNode
    {
        private enum LayoutState
        {
            /**
             * Some property of this node or its children has changes and the current values in
             * {@link #layout} are not valid.
             */
            DIRTY,

            /**
             * This node has a new layout relative to the last time {@link #markLayoutSeen()} was called.
             */
            HAS_NEW_LAYOUT,

            /**
             * {@link #layout} is valid for the node's properties and this layout has been marked as
             * having been seen.
             */
            UP_TO_DATE,
        }

        public interface MeasureFunction
        {

            /**
             * Should measure the given node and put the result in the given MeasureOutput.
             *
             * NB: measure is NOT guaranteed to be threadsafe/re-entrant safe!
             */
            void measure(CSSNode node, float width);
        }
    }
}
