export const paperUrl = "https://huggingface.co/spaces/AranKair/vsarena-paper";

export const vsarenaBibtex = `@techreport{vsarena2026,
  title       = {VSArena: A Browser-Native Public Arena for Vision-Language-Action Policy Evaluation},
  author      = {{ONISCOR}},
  institution = {ONISCOR},
  year        = {2026},
  type        = {Systems report},
  url         = {https://huggingface.co/spaces/AranKair/vsarena-paper},
  note        = {Draft. Empirical study in preparation},
}`;

export type RelatedGroupId = "benchmarks" | "transfer" | "policies" | "physics" | "rating";

export type RelatedItem = {
  authors: string;
  title: string;
  venue: string;
  href?: string;
};

export const relatedGroups: { id: RelatedGroupId; items: RelatedItem[] }[] = [
  {
    id: "benchmarks",
    items: [
      {
        authors: "James, Ma, Rovick Arrojo, and Davison",
        title: "RLBench: The Robot Learning Benchmark and Learning Environment",
        venue: "IEEE RA-L, 2020",
        href: "https://arxiv.org/abs/1909.12271",
      },
      {
        authors: "Yu, Quillen, He, Julian, Hausman, Finn, and Levine",
        title: "Meta-World: A Benchmark and Evaluation for Multi-Task and Meta Reinforcement Learning",
        venue: "CoRL, 2019",
        href: "https://arxiv.org/abs/1910.10897",
      },
      {
        authors: "Zhu, Wong, Mandlekar, Martín-Martín, Joshi, Nasiriany, and Zhu",
        title: "robosuite: A Modular Simulation Framework and Benchmark for Robot Learning",
        venue: "arXiv:2009.12293, 2020",
        href: "https://arxiv.org/abs/2009.12293",
      },
      {
        authors: "Gu, Xiang, Li, Ling, Liu, Mu, Tang, Tao, Wei, Yao, Yuan, Xie, Huang, Chen, and Su",
        title: "ManiSkill2: A Unified Benchmark for Generalizable Manipulation Skills",
        venue: "ICLR, 2023",
        href: "https://arxiv.org/abs/2302.04659",
      },
      {
        authors: "Mees, Hermann, Rosete-Beas, and Burgard",
        title: "CALVIN: A Benchmark for Language-Conditioned Policy Learning for Long-Horizon Robot Manipulation Tasks",
        venue: "IEEE RA-L, 2022",
        href: "https://arxiv.org/abs/2112.03227",
      },
      {
        authors: "Liu, Zhu, Gao, Feng, Liu, Zhu, and Stone",
        title: "LIBERO: Benchmarking Knowledge Transfer for Lifelong Robot Learning",
        venue: "NeurIPS Datasets and Benchmarks, 2023",
        href: "https://arxiv.org/abs/2306.03310",
      },
      {
        authors: "Zeng, Florence, Tompson, Welker, Chien, Attarian, Armstrong, Krasin, Duong, Sindhwani, and Lee",
        title: "Transporter Networks: Rearranging the Visual World for Robotic Manipulation",
        venue: "CoRL, 2020",
        href: "https://arxiv.org/abs/2010.14406",
      },
    ],
  },
  {
    id: "transfer",
    items: [
      {
        authors: "Li, Hsu, Gu, Pertsch, Mees, Walke, Fu, Lunawat, Sieh, Kirmani, Levine, Wu, Finn, Su, Vuong, and Xiao",
        title: "Evaluating Real-World Robot Manipulation Policies in Simulation (SIMPLER)",
        venue: "CoRL, 2024",
        href: "https://arxiv.org/abs/2405.05941",
      },
    ],
  },
  {
    id: "policies",
    items: [
      {
        authors: "Open X-Embodiment Collaboration",
        title: "Open X-Embodiment: Robotic Learning Datasets and RT-X Models",
        venue: "arXiv:2310.08864, 2023",
        href: "https://arxiv.org/abs/2310.08864",
      },
      {
        authors: "Kim, Pertsch, Karamcheti, Xiao, Balakrishna, Nair, Rafailov, Foster, Lam, Sanketi, Vuong, Kollar, Burchfiel, Tedrake, Sadigh, Levine, Liang, and Finn",
        title: "OpenVLA: An Open-Source Vision-Language-Action Model",
        venue: "CoRL, 2024",
        href: "https://arxiv.org/abs/2406.09246",
      },
      {
        authors: "Brohan, Brown, Carbajal, et al",
        title: "RT-1: Robotics Transformer for Real-World Control at Scale",
        venue: "RSS, 2023",
        href: "https://arxiv.org/abs/2212.06817",
      },
      {
        authors: "Brohan, Brown, Carbajal, et al",
        title: "RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control",
        venue: "CoRL, 2023",
        href: "https://arxiv.org/abs/2307.15818",
      },
      {
        authors: "Cadene, Alibert, Soare, Gallouedec, Zouitine, and Wolf",
        title: "LeRobot: State-of-the-Art Machine Learning for Real-World Robotics in PyTorch",
        venue: "GitHub, 2024",
        href: "https://github.com/huggingface/lerobot",
      },
      {
        authors: "Zhao, Kumar, Levine, and Finn",
        title: "Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware",
        venue: "RSS, 2023",
        href: "https://arxiv.org/abs/2304.13705",
      },
      {
        authors: "Chi, Feng, Du, Xu, Cousineau, Burchfiel, and Song",
        title: "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion",
        venue: "RSS, 2023",
        href: "https://arxiv.org/abs/2303.04137",
      },
    ],
  },
  {
    id: "physics",
    items: [
      {
        authors: "Todorov, Erez, and Tassa",
        title: "MuJoCo: A Physics Engine for Model-Based Control",
        venue: "IROS, 2012",
        href: "https://arxiv.org/abs/1201.5172",
      },
      {
        authors: "Makoviychuk, Wawrzyniak, Guo, Lu, Storey, Macklin, Hoeller, Rudin, Allshire, Handa, and State",
        title: "Isaac Gym: High Performance GPU-Based Physics Simulation for Robot Learning",
        venue: "NeurIPS Datasets and Benchmarks, 2021",
        href: "https://arxiv.org/abs/2108.10470",
      },
      {
        authors: "Dimforge",
        title: "Rapier: 2D and 3D Physics Engines for the Rust and JavaScript Ecosystems",
        venue: "rapier.rs",
        href: "https://rapier.rs",
      },
    ],
  },
  {
    id: "rating",
    items: [
      {
        authors: "Elo, A. E.",
        title: "The Rating of Chessplayers, Past and Present",
        venue: "Arco Publishing, 1978",
      },
      {
        authors: "Bradley and Terry",
        title: "Rank Analysis of Incomplete Block Designs: I. The Method of Paired Comparisons",
        venue: "Biometrika, 1952",
        href: "https://doi.org/10.1093/biomet/39.3-4.324",
      },
      {
        authors: "Chiang, Zheng, Sheng, Angelopoulos, Li, Li, Zhang, Zhu, Jordan, Gonzalez, and Stoica",
        title: "Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference",
        venue: "ICML, 2024",
        href: "https://arxiv.org/abs/2403.04132",
      },
    ],
  },
];
