
using ReactNative.csslayout;
using System.Collections.Generic;

namespace ReactNative.UIManager
{
    public class ReactShadowNode : CSSNode
    {
        private int _ReactTag;
        private float _AbsoluteLeft;
        private float _AbsoluteTop;
        private float _AbsoluteRight;
        private float _AbsoluteBottom;
        private bool _ShouldNotifyOnLayout;
        private bool _NodeUpdated = true;

        // layout-only nodes
        private ReactShadowNode mNativeParent;
        private List<ReactShadowNode> mNativeChildren;

        public int getReactTag()
        {
            return _ReactTag;
        }
    }
}
