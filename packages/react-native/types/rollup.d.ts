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

declare const stagger: (
    time: number,
    animations: Array<CompositeAnimation>
  ) => CompositeAnimation;

type Test = string;
