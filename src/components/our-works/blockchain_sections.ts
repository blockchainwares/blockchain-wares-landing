import { createElement } from "react";
import type { ProjectSection } from "../our-works-data";
import { EngineeringIcon, HiveIcon, SdkIcon } from "../icons";

export const BLOCKCHAIN_SECTIONS: ProjectSection[] = [
  {
    id: "blockchain-core",
    slug: "core",
    title: "Blockchain Core & Infrastructure",
    subtitle: "High-performance blockchain nodes and indexing infrastructure",
    description:
      "Experience dating back to 2014 with Keyhotee. Core contributors to Hive blockchain with over 31,000 commits. Specializing in C++ node development (hived), HAF PostgreSQL-backed indexing handling thousands of TPS, DPoS/Graphene-based platforms (BEOS, Peerplays) with 3-second blocks, and exchange infrastructure (BlockTrades).",
    expertise_ids: ["blockchain", "engineering", "devops"],
    projects: [
      {
        title: "Hive Blockchain",
        description:
          "Hive has redefined social media by building a living, breathing, and growing social economy — a community where users are rewarded for sharing their voice. Core node implementation with 3-second blocks, DPoS consensus, free transactions via Resource Credits, and thousands of TPS.",
        deployments: [{ label: "Site", url: "https://hive.io" }],
      },
      {
        title: "HAF — Hive Application Framework",
        description:
          "PostgreSQL-based push-model indexing layer for the Hive blockchain. Multiple HAF apps share a single server with automatic fork handling and efficient data access via sql_serializer plugin and hive_fork_manager extension.",
        deployments: [
          { label: "Site", url: "https://tools.openhive.network/haf" },
          { label: "Source", url: "https://gitlab.syncad.com/hive/haf" },
        ],
      },
      {
        title: "BlockTrades",
        description:
          "BlockTrades enables users to rapidly and safely purchase cryptocurrencies without the hassles typically associated with purchasing through a centralized cryptocurrency exchange. Unlike a traditional exchange, you don't need to maintain a balance on the site.",
      },
      {
        title: "BEOS Blockchain Platform",
        description:
          "Business-oriented EOSIO fork implementing unique and unheard of ideas in the blockchain world. Location-dependent rules of operation, automatically adjusted to current requirements. 0.5s block confirmation with BFT consensus.",
      },
      {
        title: "Peerplays",
        description:
          "The first decentralized global betting platform, using Graphene technology and Delegated Proof of Stake (DPoS) to provide the fastest, most decentralized blockchain consensus model available today.",
        deployments: [{ label: "Site", url: "https://www.peerplays.com/" }],
      },
    ],
  },
  {
    id: "hive-ecosystem-dev",
    slug: "hive",
    title: "Hive Ecosystem Development",
    subtitle:
      "Backend services exposing Hive blockchain data via REST and JSON-RPC",
    description:
      "Production-grade backend services built on top of HAF — REST APIs and JSON-RPC endpoints with OpenAPI/Swagger specifications, enabling third-party developers to query Hive blockchain data without running their own full node.",
    expertise_ids: ["blockchain", "databases", "engineering"],
    custom_icon: createElement(HiveIcon, { className: "w-full h-full" }),
    projects: [
      {
        title: "HAfAH — Account History API",
        description:
          "HAF-based REST API providing account operation history, block and transaction lookup, without requiring blockchain replay. Over 5,353 commits and 68 contributors.",
        deployments: [
          { label: "Site", url: "https://tools.openhive.network/hafah" },
          { label: "Source", url: "https://gitlab.syncad.com/hive/HAfAH" },
        ],
      },
      {
        title: "HAF Block Explorer API",
        description:
          "Comprehensive blockchain REST API built on HAF integrating balance tracking, reputation tracking, and account history. OpenAPI/Swagger docs with Docker Compose deployment.",
        deployments: [
          { label: "Site", url: "https://tools.openhive.network/hafbe" },
          {
            label: "Source",
            url: "https://gitlab.syncad.com/hive/haf_block_explorer",
          },
        ],
      },
    ],
  },
  {
    id: "developer-sdks",
    slug: "sdk",
    title: "Developer SDKs & Libraries",
    subtitle: "Open-source tooling for the Hive developer ecosystem",
    description:
      "A complete developer platform built for Hive: multi-language API bindings, secure key management, automation frameworks, and browser authorization libraries — enabling third-party developers to build on Hive with confidence.",
    expertise_ids: ["blockchain", "python", "frontend"],
    custom_icon: createElement(SdkIcon, { className: "w-full h-full" }),
    projects: [
      {
        title: "Wax — Multi-Language API",
        description:
          "Extension module bridging Hive's C++ core to Python (Cython) and TypeScript (WASM/Emscripten). Transaction building, signing, asset manipulation, and Protobuf integration. Security-audited by Hacken (May 2025).",
        deployments: [
          { label: "Site", url: "https://tools.openhive.network/wax" },
          { label: "Source", url: "https://gitlab.syncad.com/hive/wax" },
          {
            label: "Docs",
            url: "https://doc.openhive.network/wax/develop/manual/",
          },
          { label: "NPM", url: "https://www.npmjs.com/package/@hiveio/wax" },
        ],
      },
      {
        title: "Beekeeper — Wallet Daemon",
        description:
          "Standalone key management daemon with HTTP/WebSocket API, session management, auto-lock timeout, and WASM bindings for browser environments. Published as @hiveio/beekeeper.",
        deployments: [
          { label: "Site", url: "https://tools.openhive.network/beekeeper" },
          { label: "Source", url: "https://gitlab.syncad.com/hive/beekeeper" },
          {
            label: "NPM",
            url: "https://www.npmjs.com/package/@hiveio/beekeeper",
          },
        ],
      },
      {
        title: "WorkerBee — Automation Framework",
        description:
          "Event-based observer pattern library for building Hive bots and automation. 25+ filters, data providers, real-time and historical data, combined filter logic (AND/OR). 181 kB bundle.",
        deployments: [
          { label: "Site", url: "https://tools.openhive.network/workerbee" },
          { label: "Source", url: "https://gitlab.syncad.com/hive/workerbee" },
          {
            label: "Docs",
            url: "https://doc.openhive.network/workerbee/develop/",
          },
          {
            label: "NPM",
            url: "https://www.npmjs.com/package/@hiveio/workerbee",
          },
        ],
      },
      {
        title: "hb-auth — Web Authorization",
        description:
          "Browser authorization library using WebWorker isolation and IndexedDB for secure key storage. Dual client modes without exposing private keys. Published as @hiveio/hb-auth.",
        deployments: [
          { label: "Site", url: "https://tools.openhive.network/hb-auth" },
          { label: "Source", url: "https://gitlab.syncad.com/hive/hb-auth" },
          {
            label: "NPM",
            url: "https://www.npmjs.com/package/@hiveio/hb-auth",
          },
        ],
      },
      {
        title: "MetaMask Snap for Hive",
        description:
          "MetaMask extension deriving Hive keys from MetaMask seed via BIP44, enabling transaction signing within the MetaMask security model. Passed Hacken security audit (May 2025). Published as @hiveio/metamask-snap.",
        deployments: [
          {
            label: "Site",
            url: "https://tools.openhive.network/metamask-snap",
          },
          {
            label: "Source",
            url: "https://gitlab.syncad.com/hive/metamask-snap",
          },
          {
            label: "NPM",
            url: "https://www.npmjs.com/package/@hiveio/metamask-snap",
          },
        ],
      },
      {
        title: "HealthChecker Component",
        description:
          "Reusable React component for monitoring Hive API endpoint health with automatic provider switching and dark mode support. Published as @hiveio/healthchecker-component.",
        deployments: [
          {
            label: "Source",
            url: "https://gitlab.syncad.com/hive/healthchecker-component",
          },
          {
            label: "NPM",
            url: "https://www.npmjs.com/package/@hiveio/healthchecker-component",
          },
        ],
      },
    ],
  },
  {
    id: "user-applications",
    slug: "ufa",
    title: "User-Facing Applications",
    subtitle: "End-user blockchain experiences and decentralized applications",
    description:
      "Rich end-user products across the Hive ecosystem — from a full blockchain explorer and decentralized social media platform to CLI wallets, transaction analysis tools, and AI-powered semantic search. Each project links both to the live deployment and to its open-source repository.",
    expertise_ids: ["frontend", "blockchain", "security"],
    projects: [
      {
        title: "Block Explorer UI",
        description:
          "Full-featured blockchain explorer with block and transaction search, account info, witness tracking, market data, and balance history visualization. Playwright E2E tests across 3 browser engines.",
        deployments: [
          { label: "Site", url: "https://explore.openhive.network/" },
          {
            label: "Source",
            url: "https://gitlab.syncad.com/hive/haf_block_explorer",
          },
        ],
      },
      {
        title: "Denser - decentralized blogging application (dApp)",
        description:
          "Decentralized blogging and social media platform (successor to hive.blog/condenser). Turborepo monorepo with 15+ internal packages, blog app, wallet app, and HAF API stack integration.",
        deployments: [
          { label: "Blog", url: "https://blog.openhive.network/" },
          { label: "Wallet", url: "https://wallet.openhive.network/" },
          { label: "Source", url: "https://gitlab.syncad.com/hive/denser" },
        ],
      },
      {
        title: "Hive Bridge dApp",
        description:
          "Modern multi-auth wallet supporting MetaMask Snap, Keychain, PeakVault, and Google Wallet/Drive integration with dark mode.",
        deployments: [
          { label: "Site", url: "https://auth.openhive.network" },
          {
            label: "Source",
            url: "https://gitlab.syncad.com/hive/wallet-dapp",
          },
        ],
      },
      {
        title: "TX Inspector",
        description:
          "Transaction analysis tool with multi-format input (hash/JSON/binary/file), authority graph visualization, hex viewer, and delegated authority detection up to 2 levels.",
        deployments: [
          { label: "Site", url: "https://tools.openhive.network/tx-inspector" },
          {
            label: "Source",
            url: "https://gitlab.syncad.com/hive/tx-inspector",
          },
        ],
      },
      {
        title: "Clive — CLI/TUI Wallet",
        description:
          "Dual-mode command-line and terminal UI wallet with mouse support, Beekeeper integration, and profile system. Entry points: clive (TUI) and clive-dev (debug mode). Over 8,899 commits.",
        deployments: [
          { label: "Site", url: "https://tools.openhive.network/clive" },
          { label: "Source", url: "https://gitlab.syncad.com/hive/clive" },
        ],
      },
      {
        title: "HiveSense — AI Semantic Search",
        description:
          "HAF-based semantic search over blockchain posts using OLLAMA ML embeddings, pgvector similarity, parallel LLM processing, and thematic contributor identification.",
        deployments: [
          { label: "Site", url: "https://tools.openhive.network/hivesense" },
          { label: "Source", url: "https://gitlab.syncad.com/hive/hivesense" },
        ],
      },
      {
        title: "Balance Tracker",
        description:
          "HAF application for graphing account balances (HIVE/HBD) over time. Dual backend support (PostgREST/Python) with React web UI and JMeter performance testing.",
        deployments: [
          {
            label: "Site",
            url: "https://tools.openhive.network/balance-tracker",
          },
          {
            label: "Source",
            url: "https://gitlab.syncad.com/hive/balance_tracker",
          },
        ],
      },
      {
        title: "Keyhotee",
        description:
          "Pioneering decentralized identity and encrypted messaging desktop application with wallet integration, address book with identity verification, and crash reporting. Built on the BitShares ecosystem in 2013–2014.",
      },
    ],
  },
  {
    id: "eos-ecosystem",
    slug: "eos",
    title: "EOS Ecosystem",
    subtitle: "Governance tools and smart contracts for the EOS blockchain",
    description:
      "Delivered during the 2017–2019 EOS/BEOS era in collaboration with TerraDacs: a cross-platform desktop wallet for block producer voting, and two on-chain governance smart contracts for proxy registration and producer metadata. Separately, we carried out a security audit for FIO Protocol, an EOSIO-based blockchain, in 2019–2020.",
    expertise_ids: ["blockchain", "engineering"],
    custom_icon: createElement(EngineeringIcon, { className: "w-full h-full" }),
    projects: [
      {
        title: "EOS Voter",
        description:
          "Cross-platform Electron desktop wallet and block producer voting tool for the EOS blockchain. AES-256 encrypted local key storage, CPU/bandwidth staking, and token transfers with multi-language support (English, Korean, Chinese, Japanese, Russian).",
      },
      {
        title: "EOS Proxy Info",
        description:
          "On-chain EOSIO smart contract for proxy account information registration and management. Allows proxy accounts to register metadata (name, website, philosophy, social media) for downstream voting portals.",
      },
      {
        title: "Producer JSON",
        description:
          "Smart contract enabling EOS block producers to store and manage their JSON metadata on-chain. Validates producer eligibility and uses multi-index tables for efficient storage.",
      },
      {
        title: "FIO Protocol Security Audit",
        description:
          "Security audit for FIO Protocol, an EOSIO-based blockchain (2019–2020).",
      },
    ],
  },
];
