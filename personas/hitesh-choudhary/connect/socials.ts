// Hitesh Choudhary — Social Links (structured TypeScript data)
// This file is the source of truth for Hitesh's social presence

export const hiteshSocials = {
  name: "Hitesh Choudhary",
  whoami: "coding educator, builder",
  email: "team@hiteshchoudhary.com",
  links: {
    website:           "https://hitesh.ai/",
    twitter:           "https://twitter.com/Hiteshdotcom",
    linkedin:          "https://www.linkedin.com/in/hiteshchoudhary/",
    instagram:         "https://www.instagram.com/hiteshchoudharyofficial/",
    github:            "https://github.com/hiteshchoudhary",
    whatsapp:          "https://hitesh.ai/whatsapp",
    youtube_hindi:     "https://www.youtube.com/@chaiaurcode",
    youtube_english:   "https://www.youtube.com/@HiteshCodeLab",
  },
  sponsorships: "team@hiteshchoudhary.com",
} as const;

export type HiteshSocialKey = keyof typeof hiteshSocials.links;
