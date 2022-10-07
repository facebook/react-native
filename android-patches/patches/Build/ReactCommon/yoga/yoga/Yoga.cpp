diff --git a/ReactCommon/yoga/yoga/Yoga.cpp b/ReactCommon/yoga/yoga/Yoga.cpp
index 99862797b9b..20389d4f240 100644
--- a/ReactCommon/yoga/yoga/Yoga.cpp
+++ b/ReactCommon/yoga/yoga/Yoga.cpp
@@ -2229,7 +2229,7 @@ static float YGDistributeFreeSpaceSecondPass(
         depth,
         generationCount);
     node->setLayoutHadOverflow(
-        node->getLayout().hadOverflow() |
+        node->getLayout().hadOverflow() ||
         currentRelativeChild->getLayout().hadOverflow());
   }
   return deltaFreeSpace;
