import type { Props } from "astro";
import IconMail from "@/assets/icons/IconMail.svg";
import IconGitHub from "@/assets/icons/IconGitHub.svg";
import IconBrandX from "@/assets/icons/IconBrandX.svg";
import IconLinkedin from "@/assets/icons/IconLinkedin.svg";
import IconWhatsapp from "@/assets/icons/IconWhatsapp.svg";
import IconFacebook from "@/assets/icons/IconFacebook.svg";
import IconTelegram from "@/assets/icons/IconTelegram.svg";
import IconPinterest from "@/assets/icons/IconPinterest.svg";
import {
  PUBLIC_SOCIAL_GITHUB,
  PUBLIC_SOCIAL_X,
  PUBLIC_SOCIAL_LINKEDIN,
  PUBLIC_SOCIAL_EMAIL,
} from "astro:env/client";
import { SITE } from "@/config";

interface Social {
  name: string;
  href: string;
  linkTitle: string;
  icon: (_props: Props) => Element;
}

// ── Profile socials ────────────────────────────────────────────────────────
// URLs come from environment variables (see .env.example).
// Any entry whose URL is empty/unset is automatically excluded from the list,
// so forkers of this repo won't expose the original author's personal data.
export const SOCIALS: Social[] = (
  [
    {
      name: "GitHub",
      href: PUBLIC_SOCIAL_GITHUB ?? "",
      linkTitle: `${SITE.title} 的 GitHub`,
      icon: IconGitHub,
    },
    {
      name: "X",
      href: PUBLIC_SOCIAL_X ?? "",
      linkTitle: `${SITE.title} 的 X`,
      icon: IconBrandX,
    },
    {
      name: "LinkedIn",
      href: PUBLIC_SOCIAL_LINKEDIN ?? "",
      linkTitle: `${SITE.title} 的 LinkedIn`,
      icon: IconLinkedin,
    },
    {
      name: "Mail",
      href: PUBLIC_SOCIAL_EMAIL ? `mailto:${PUBLIC_SOCIAL_EMAIL}` : "",
      linkTitle: `给 ${SITE.title} 发邮件`,
      icon: IconMail,
    },
  ] satisfies Social[]
).filter(s => s.href !== "");

// ── Share links ────────────────────────────────────────────────────────────
// These use standard platform share URLs — no personal data involved.
// The "Mail" entry opens the visitor's own email client, not the author's.
export const SHARE_LINKS: Social[] = [
  {
    name: "WhatsApp",
    href: "https://wa.me/?text=",
    linkTitle: "通过 WhatsApp 分享本文",
    icon: IconWhatsapp,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/sharer.php?u=",
    linkTitle: "在 Facebook 上分享本文",
    icon: IconFacebook,
  },
  {
    name: "X",
    href: "https://x.com/intent/post?url=",
    linkTitle: "在 X 上分享本文",
    icon: IconBrandX,
  },
  {
    name: "Telegram",
    href: "https://t.me/share/url?url=",
    linkTitle: "通过 Telegram 分享本文",
    icon: IconTelegram,
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com/pin/create/button/?url=",
    linkTitle: "在 Pinterest 上分享本文",
    icon: IconPinterest,
  },
  {
    name: "Mail",
    href: "mailto:?subject=See%20this%20post&body=",
    linkTitle: "通过邮件分享本文",
    icon: IconMail,
  },
] as const;
