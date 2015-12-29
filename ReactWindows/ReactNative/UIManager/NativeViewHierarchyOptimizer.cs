using System;

namespace ReactNative.UIManager
{
    class NativeViewHierarchyOptimizer
    {
        private readonly UIViewOperationQueue _uiViewOperationQueue;
        private readonly ShadowNodeRegistry _shadowNodeRegistry;

        public NativeViewHierarchyOptimizer(
            UIViewOperationQueue uiViewOperationQueue,
            ShadowNodeRegistry shadowNodeRegistry)
        {
            _uiViewOperationQueue = uiViewOperationQueue;
            _shadowNodeRegistry = shadowNodeRegistry;
        }

        internal void OnBatchComplete()
        {
            throw new NotImplementedException();
        }

        internal void HandleCreateView(ReactShadowNode cssNode, ThemedReactContext themedContext, CatalystStylesDiffMap styles)
        {
            throw new NotImplementedException();
        }

        internal void HandleUpdateView(ReactShadowNode cssNode, string className, CatalystStylesDiffMap styles)
        {
            throw new NotImplementedException();
        }

        internal void HandleManageChildren(ReactShadowNode cssNodeToManage, int[] indicesToRemove, int[] tagsToRemove, ViewAtIndex[] viewsToAdd, int[] tagsToDelete)
        {
            throw new NotImplementedException();
        }

        internal void HandleRemoveNode(ReactShadowNode nodeToRemove)
        {
            throw new NotImplementedException();
        }
    }
}
