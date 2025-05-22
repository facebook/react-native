/* eslint-disable redundant-undefined/redundant-undefined */
import type {EventSubscription as EventSubscription_2} from 'react-native/Libraries/vendor/emitter/EventEmitter';
import type {ListRenderItem} from '@react-native/virtualized-lists';

export declare type AccessibilityActionName =
  | 'activate'
  | 'increment'
  | 'decrement'
  | 'longpress'
  | 'magicTap'
  | 'escape'
  |  'bak';

export declare type AccessibilityAnnouncementEventName = 'announcementFinished';
export declare type AccessibilityAnnouncementFinishedEventHandler = (
  event: AccessibilityAnnouncementFinishedEvent
) => void;
export declare type AccessibilityChangeEvent = boolean;

export declare const stagger: (
    time: number,
    animations: Array<CompositeAnimation>
  ) => CompositeAnimation;


export declare type ____ViewStyle_InternalBase = Readonly<{
  backfaceVisibilityNew: "visible" | "hidden";
  backgroundColor?: ____ColorValue_Internal;
  borderColor?: ____ColorValue_Internal;
}>;
