// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Courier Web",
  tagline: "Robust MQTT Web SDK",
  url: "https://gojekfarm.github.io",
  baseUrl: "/courier-web/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "gojekfarm",
  projectName: "courier-web",

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/gojekfarm/courier-web/tree/main/docs/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "Courier Web",
        items: [
          {
            type: "doc",
            docId: "Introduction",
            position: "left",
            label: "Documentation",
          },
          {
            type: "doc",
            docId: "GettingStarted",
            position: "left",
            label: "Guides",
          },
          {
            type: "doc",
            docId: "Features",
            position: "left",
            label: "Features",
          },
          {
            href: "https://discord.gg/C823qK4AK7",
            label: "Discord",
            position: "right",
          },
          {
            href: "https://github.com/gojekfarm/courier-web",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              { label: "Introduction", to: "/docs/Introduction" },
              { label: "Getting Started", to: "/docs/Installation" },
              { label: "React Hooks", to: "/docs/ReactHooks" },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Discord",
                href: "https://discord.gg/C823qK4AK7",
              },
              {
                label: "GitHub",
                href: "https://github.com/gojekfarm/courier-web",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "Courier",
                href: "https://gojek.github.io/courier/docs/Introduction",
              },
              {
                label: "Courier Android",
                href: "https://github.com/gojek/courier-android",
              },
            ],
          },
        ],
        copyright: `Copyright \u00A9 ${new Date().getFullYear()} Gojek. Built with Docusaurus.`,
      },
      prism: {
        theme: require("prism-react-renderer").themes.github,
        darkTheme: require("prism-react-renderer").themes.dracula,
        additionalLanguages: ["typescript", "tsx", "bash"],
      },
    }),
};

module.exports = config;
