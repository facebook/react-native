# Fetching Partitioned Blob URL Issue

This issue occurs when a Blob URL access attempt was blocked because it was made from a cross-partition, same-origin context.

Make sure the Blob URL was created in the same [storage partition](storagePartitioningExplainer) as the context it is being fetched from.

If access to unpartitioned Blob URLs is needed, the Storage Access API [can be used](storageAccessAPI).
