using System.Collections.Generic;

namespace ReactNative.UIManager
{
    /// <summary>
    /// A data structure for holding tags and indices.
    /// </summary>
    public class ViewAtIndex
    {
        /// <summary>
        /// Instantiates the <see cref="ViewAtIndex"/>.
        /// </summary>
        /// <param name="tag">The tag.</param>
        /// <param name="index">The index.</param>
        public ViewAtIndex(int tag, int index)
        {
            Tag = tag;
            Index = index;
        }

        /// <summary>
        /// A comparer for <see cref="ViewAtIndex"/> instances to sort by index.
        /// </summary>
        public static IComparer<ViewAtIndex> IndexComparer { get; } =
            Comparer<ViewAtIndex>.Create((x, y) => x.Index - y.Index);

        /// <summary>
        /// The index of the view.
        /// </summary>
        public int Index { get; }

        /// <summary>
        /// The tag of the view.
        /// </summary>
        public int Tag { get; }
    }
}
