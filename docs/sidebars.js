/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    { type: "doc", id: "Introduction" },
    {
      type: "category",
      label: "Getting Started",
      items: ["Installation", "GettingStarted"],
    },
    {
      type: "category",
      label: "Guides",
      items: [
        "ConnectionSetup",
        "Configuration",
        "PublishSubscribe",
        "Authentication",
        "CredentialStorage",
      ],
    },
    {
      type: "category",
      label: "Features",
      items: [
        "Features",
        "HeartbeatMonitoring",
        "SubscriptionLedger",
        "Diagnostics",
        "DeliveryModes",
      ],
    },
    {
      type: "category",
      label: "React",
      items: ["ReactHooks"],
    },
    { type: "doc", id: "CONTRIBUTION" },
    { type: "doc", id: "LICENSE" },
  ],
};

module.exports = sidebars;
