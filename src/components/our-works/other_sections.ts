import { createElement } from "react";
import type { ProjectSection } from "../our-works-data";
import { DocsIcon } from "../icons";

export const OTHER_SECTIONS: ProjectSection[] = [
  {
    id: "documentation",
    slug: "docs",
    title: "Documentation",
    subtitle: "Developer documentation and interactive code examples",
    description:
      "Comprehensive documentation sites for the Hive developer platform — featuring multi-language code tabs, 71+ executable TypeScript snippets, Swagger API docs, and branch-specific preview deployments.",
    expertise_ids: ["engineering"],
    custom_icon: createElement(DocsIcon, { className: "w-full h-full" }),
    projects: [
      {
        title: "Wax Documentation",
        description:
          "Comprehensive documentation with multi-language code tabs and 71+ executable snippets. Deployed via GitLab Pages with branch-specific URLs for developer convenience.",
        deployments: [
          { label: "Source", url: "https://gitlab.syncad.com/hive/wax-doc" },
          {
            label: "Docs",
            url: "https://doc.openhive.network/wax/develop/manual/",
          },
        ],
      },
      {
        title: "WorkerBee Documentation",
        description:
          "Interactive documentation with Swagger API docs and branch preview deployments covering the full WorkerBee automation framework.",
        deployments: [
          {
            label: "Source",
            url: "https://gitlab.syncad.com/hive/workerbee-doc-snippets",
          },
        ],
      },
      {
        title: "Wax & WorkerBee Code Snippets",
        description:
          "Executable documentation examples: 71+ TypeScript snippets organized by category with built-in test runners, covering Beekeeper, filters, providers, and custom integration patterns.",
        deployments: [
          {
            label: "Source (Wax)",
            url: "https://gitlab.syncad.com/hive/wax-doc-snippets",
          },
          {
            label: "Source (WorkerBee)",
            url: "https://gitlab.syncad.com/hive/workerbee-doc-snippets/",
          },
        ],
      },
    ],
  },
  {
    id: "eda-engineering",
    slug: "eda",
    title: "EDA & Engineering",
    subtitle: "Electronic design automation tools and simulation software",
    description:
      "Over a dozen years developing HDL compiler, simulation and advanced debugging tools for large scale System Verilog models. Development of CAD & CAE software used at design and verification processes at biggest engineering companies worldwide.",
    expertise_ids: ["eda", "engineering"],
    projects: [
      {
        title: "SynaptiCAD - Verilogger",
        description:
          "SynaptiCAD Verilogger Extreme bundle consists of a HDL GUI debugger (BugHunter Pro) and a command-line based Verilog compiler (simx).",
        deployments: [
          {
            label: "Site",
            url: "http://www.syncad.com/vlg_verilog_compiler_simulator.htm",
          },
        ],
      },
      {
        title: "SynaptiCAD - BugHunter Pro",
        description:
          "Graphical Debugging for Verilog, VHDL, and C++ simulators.",
        deployments: [
          {
            label: "Site",
            url: "http://www.syncad.com/vhdl_verilog_debugger.htm",
          },
        ],
      },
      {
        title: "SynaptiCAD - Test Bench Generators",
        description:
          "TestBencher Pro is a graphical test bench generator that dramatically reduces the time required to create and maintain test benches for VHDL and Verilog.",
        deployments: [
          {
            label: "Site",
            url: "http://www.syncad.com/testbencher_verilog_vhdl_testbench_generator.htm",
          },
        ],
      },
      {
        title: "ModelCenter Integrate",
        description:
          "ModelCenter Integrate increases productivity by enabling users to execute significantly more simulations with less time and resources.",
      },
    ],
  },
  {
    id: "data-systems",
    slug: "data",
    title: "Data Systems",
    subtitle: "Database solutions and data center infrastructure management",
    description:
      "Experienced in RDBMS and modern non-SQL databases like RocksDB and Neo4J, offering critical write throughput and efficient object traversal.",
    expertise_ids: ["databases", "engineering"],
    projects: [
      {
        title: "RDBMS - WSMS",
        description:
          "Data access and business logic layers being foundations of Workstation Management System (WSMS) owned by Prointegra company.",
        deployments: [
          { label: "Site", url: "http://www.prointegra.com.pl/system-wsms/" },
        ],
      },
      {
        title: "NonSQL DB Engine",
        description:
          "Unique engine allowing to model extensible user defined entities. Used in MetaModel Base and Uptime-DC products.",
        deployments: [
          { label: "Site", url: "http://www.prointegra.com.pl/714-2/" },
        ],
      },
      {
        title: "Uptime-DC",
        description:
          "Comprehensive data center infrastructure management system for monitoring and controlling critical facilities.",
        deployments: [{ label: "Site", url: "http://uptime-dc.com/" }],
      },
    ],
  },
];
