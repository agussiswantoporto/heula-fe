/**
 * Single react-icons/io5 import site (design Section 16).
 *
 * This is the ONLY file in the app allowed to import from react-icons. Every
 * other module references icons by their stable IconKey (owned by @/types).
 * The ICONS map is asserted `satisfies Record<IconKey, IconType>` so a missing
 * or stray key is a compile error, keeping the key set and the map in lockstep.
 */
import type { IconType } from "react-icons";
import {
  IoHome,
  IoTime,
  IoStatsChart,
  IoPerson,
  IoPlay,
  IoStop,
  IoCreateOutline,
  IoRestaurantOutline,
  IoFlameOutline,
  IoFlashOutline,
  IoLeafOutline,
  IoMoonOutline,
  IoNotificationsOutline,
  IoSunnyOutline,
  IoListOutline,
  IoFlagOutline,
  IoTrashOutline,
  IoInformationCircleOutline,
  IoRefreshOutline,
  IoChevronForward,
  IoCheckmarkCircle,
  IoArrowForward,
  IoBarbellOutline,
  IoDownloadOutline,
  IoShareOutline,
  IoCloseCircleOutline,
  IoAlertCircleOutline,
  IoWarningOutline,
  IoBodyOutline,
  IoScaleOutline,
  IoTrendingUp,
  IoTrendingDown,
  IoAddOutline,
  IoSparklesOutline,
  IoBatteryChargingOutline,
  IoRemoveCircleOutline,
  IoBatteryDeadOutline,
  IoFastFoodOutline,
  IoTrophyOutline,
  IoLockClosedOutline,
  IoMedalOutline,
  IoRibbonOutline,
} from "react-icons/io5";
import type { IconKey } from "@/types";

const ICONS = {
  tab_home: IoHome,
  tab_history: IoTime,
  tab_stats: IoStatsChart,
  tab_profile: IoPerson,
  play: IoPlay,
  stop: IoStop,
  edit: IoCreateOutline,
  stage_pencernaan: IoRestaurantOutline,
  stage_bakar_lemak: IoFlameOutline,
  stage_ketosis: IoFlashOutline,
  stage_autophagy: IoLeafOutline,
  stage_deep_fast: IoMoonOutline,
  notifications: IoNotificationsOutline,
  theme_dark: IoMoonOutline,
  theme_light: IoSunnyOutline,
  plans: IoListOutline,
  goal: IoFlagOutline,
  trash: IoTrashOutline,
  about: IoInformationCircleOutline,
  refresh: IoRefreshOutline,
  chevron: IoChevronForward,
  check: IoCheckmarkCircle,
  arrow_forward: IoArrowForward,
  exercise: IoBarbellOutline,
  install: IoDownloadOutline,
  share: IoShareOutline,
  status_granted: IoCheckmarkCircle,
  status_denied: IoCloseCircleOutline,
  status_default: IoAlertCircleOutline,
  status_unsupported: IoWarningOutline,
  bmi: IoBodyOutline,
  weight: IoScaleOutline,
  trend_up: IoTrendingUp,
  trend_down: IoTrendingDown,
  plus: IoAddOutline,
  suggestion: IoSparklesOutline,
  mood_energik: IoBatteryChargingOutline,
  mood_biasa: IoRemoveCircleOutline,
  mood_lemes: IoBatteryDeadOutline,
  mood_lapar: IoFastFoodOutline,
  achievement: IoTrophyOutline,
  achievement_locked: IoLockClosedOutline,
  milestone: IoMedalOutline,
  ribbon: IoRibbonOutline,
} satisfies Record<IconKey, IconType>;

export interface IconProps {
  name: IconKey;
  size?: number;
  className?: string;
  "aria-hidden"?: boolean;
}

/** Render an approved io5 icon by its stable IconKey. */
export function Icon({ name, size = 22, className, ...rest }: IconProps) {
  const Cmp = ICONS[name];
  return <Cmp size={size} className={className} aria-hidden {...rest} />;
}
