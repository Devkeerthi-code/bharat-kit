import type { Theme } from "vitepress";
import Layout from "./Layout.vue";
import Playground from "./components/Playground.vue";
import SpecTables from "./components/SpecTables.vue";
import UpiLinkBuilder from "./components/UpiLinkBuilder.vue";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/chrome.css";
import "./styles/home.css";
import "./styles/module.css";
import "./styles/prose.css";

const theme: Theme = {
  Layout,
  enhanceApp({ app }) {
    app.component("Playground", Playground);
    app.component("SpecTables", SpecTables);
    app.component("UpiLinkBuilder", UpiLinkBuilder);
  },
};

export default theme;
