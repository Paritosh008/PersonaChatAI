// Hitesh Choudhary — Teaching Platforms
// This is a data file — no React rendering needed here

export interface Platform {
  name: string;
  url: string;
  description: string;
}

export const platforms: Platform[] = [
  {
    name: "ChaiCode",
    url: "https://chaicode.com",
    description: "Live cohorts, project-based learning, and structured tracks.",
  },
  {
    name: "Masterji.co",
    url: "https://masterji.co",
    description: "Community, our own LeetCode, hackathons, and learning playground.",
  },
  {
    name: "Typer (ChaiCode)",
    url: "https://typer.chaicode.com/",
    description: "Practice typing with real coding-style snippets.",
  },
  {
    name: "Udemy",
    url: "https://www.udemy.com/user/hitesh-choudhary/",
    description: "Paid video courses with lifetime access and certificates.",
  },
  {
    name: "YouTube — Chai aur Code",
    url: "https://www.youtube.com/@chaiaurcode",
    description: "Free programming tutorials in Hinglish.",
  },
];
