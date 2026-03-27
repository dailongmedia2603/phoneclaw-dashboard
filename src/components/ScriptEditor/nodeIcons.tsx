import {
  Play, Clock, Shuffle, Repeat, Camera, Home, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Keyboard, Music, Heart, MessageCircle, Share2, UserPlus, Bookmark, Search, User,
  Globe, Facebook, ThumbsUp, Crosshair, Target, Move,
} from 'lucide-react';

const ICON_MAP: Record<string, typeof Play> = {
  play: Play,
  clock: Clock,
  shuffle: Shuffle,
  repeat: Repeat,
  camera: Camera,
  home: Home,
  arrow_up: ArrowUp,
  arrow_down: ArrowDown,
  arrow_left: ArrowLeft,
  arrow_right: ArrowRight,
  keyboard: Keyboard,
  music: Music,
  heart: Heart,
  message: MessageCircle,
  share: Share2,
  user_plus: UserPlus,
  bookmark: Bookmark,
  search: Search,
  user: User,
  globe: Globe,
  facebook: Facebook,
  thumbs_up: ThumbsUp,
  crosshair: Crosshair,
  target: Target,
  move: Move,
};

interface NodeIconProps {
  name: string;
  size?: number;
  className?: string;
}

export default function NodeIcon({ name, size = 16, className = '' }: NodeIconProps) {
  const Icon = ICON_MAP[name];
  if (!Icon) return <span className={className}>{name}</span>;
  return <Icon size={size} className={className} />;
}
