using System.Collections.Generic;

namespace ReactNative.UIManager
{
    class ViewAtIndex
    {
        public ViewAtIndex(int tag, int index)
        {
            Tag = tag;
            Index = index;
        }

        public static IComparer<ViewAtIndex> Comparer { get; } =
            Comparer<ViewAtIndex>.Create((x, y) =>
            {
                return x.Index - y.Index;

            });

        public int Index { get; }

        public int Tag { get; }
    }
}
