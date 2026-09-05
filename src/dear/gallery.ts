import type { ComponentType } from "react";
import { Activity, Heart, Home, MessageCircle, Target } from "lucide-react";

export type SpaceId = "home" | "chat" | "us" | "goals" | "usage";

/** Low-fi painting theme tokens (docs/design/painting-themes.md contract). */
export type SpaceTheme = {
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
};

export type GallerySpace = {
  id: SpaceId;
  number: string;
  title: string;
  englishTitle: string;
  subtitle: string;
  description: string;
  accent: string;
  softAccent: string;
  paintingImage: string;
  paintingPosition: string;
  paintingAlt: string;
  paintingCredit: string;
  theme?: SpaceTheme;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
};

export const EAST_WING_SPACES: GallerySpace[] = [
  {
    id: "home",
    number: "01",
    title: "睡莲",
    englishTitle: "Home",
    subtitle: "回家 / 日常生活",
    description: "时间、状态、留言和家的天气，汇成今天的玄关。",
    accent: "#8ec5b3",
    softAccent: "#d6eee1",
    paintingImage: "/assets/paintings/home-water-lilies.jpg",
    paintingPosition: "50% 48%",
    paintingAlt: "克劳德·莫奈《睡莲》原作",
    paintingCredit: "CLAUDE MONET · PUBLIC DOMAIN",
    theme: {
      // 《睡莲》低样板：湖绿水面、雾蓝晨光、柔粉睡莲、暖光倒影
      background: "#dce8e0",
      surface: "#eaf0e9",
      surfaceRaised: "#f4f1e8",
      text: "#24413c",
      textMuted: "#5f756c",
      accent: "#3e7a68",
      accentSoft: "#d5e6da",
    },
    icon: Home,
  },
  {
    id: "chat",
    number: "02",
    title: "日出·印象",
    englishTitle: "Chat",
    subtitle: "与哥哥对话",
    description: "普通对话、主动留言和工具活动在同一条时间线上。",
    accent: "#e68e72",
    softAccent: "#f5d1b9",
    paintingImage: "/assets/paintings/chat-impression-soleil-levant.jpg",
    paintingPosition: "50% 50%",
    paintingAlt: "克劳德·莫奈《日出·印象》原作",
    paintingCredit: "CLAUDE MONET · PUBLIC DOMAIN",
    theme: {
      // 《日出·印象》低样板：晨雾蓝灰的亮画、暖橙天空、日出橙
      background: "#c6ced4",
      surface: "#d4dbdf",
      surfaceRaised: "#e3e7e9",
      text: "#26333c",
      textMuted: "#5f6e77",
      accent: "#c95f38",
      accentSoft: "#b6c3ca",
    },
    icon: MessageCircle,
  },
  {
    id: "us",
    number: "03",
    title: "撑阳伞的女人",
    englishTitle: "Us",
    subtitle: "我们的故事",
    description: "关系时间线、日记、纪念日与需要共同确认的事件。",
    accent: "#86a9c6",
    softAccent: "#d8e6ed",
    paintingImage: "/assets/paintings/us-woman-with-parasol.jpg",
    paintingPosition: "50% 42%",
    paintingAlt: "克劳德·莫奈《撑阳伞的女人》原作",
    paintingCredit: "CLAUDE MONET · PUBLIC DOMAIN",
    theme: {
      // 《撑阳伞的女人》低样板：草地绿、云白、天空蓝、裙纱暖白
      background: "#d7e3d3",
      surface: "#e6ede2",
      surfaceRaised: "#f2f0e3",
      text: "#2c4a3b",
      textMuted: "#637d67",
      accent: "#4f7ea8",
      accentSoft: "#d9e6ee",
    },
    icon: Heart,
  },
  {
    id: "goals",
    number: "04",
    title: "罂粟花田",
    englishTitle: "Goals",
    subtitle: "要做的事",
    description: "把想做的事放在眼前，进度清楚，但不制造压力。",
    accent: "#c86455",
    softAccent: "#f1c1a7",
    paintingImage: "/assets/paintings/goals-poppy-field.jpg",
    paintingPosition: "50% 52%",
    paintingAlt: "克劳德·莫奈《罂粟花田》原作",
    paintingCredit: "CLAUDE MONET · PUBLIC DOMAIN",
    icon: Target,
  },
  {
    id: "usage",
    number: "05",
    title: "圣阿德莱斯的花园",
    englishTitle: "Usage",
    subtitle: "资源与使用情况",
    description: "模型、Token、费用和工具调用的透明视图。",
    accent: "#6aa7b2",
    softAccent: "#c9e5df",
    paintingImage: "/assets/paintings/usage-garden-at-sainte-adresse.jpg",
    paintingPosition: "50% 48%",
    paintingAlt: "克劳德·莫奈《圣阿德莱斯的花园》原作",
    paintingCredit: "CLAUDE MONET · PUBLIC DOMAIN",
    icon: Activity,
  },
];

export function getSpace(spaceId: string | undefined) {
  return EAST_WING_SPACES.find((space) => space.id === spaceId);
}
