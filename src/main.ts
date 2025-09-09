import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

// Create Vue app with error handling
const app = createApp(App);

// Global error handler
app.config.errorHandler = (err, _instance, info) => {
  console.error("Vue error:", err, info);
  // In production, you might want to send this to an error reporting service
};

// Global warning handler (development only)
if (import.meta.env?.DEV) {
  app.config.warnHandler = (msg, _instance, trace) => {
    console.warn("Vue warning:", msg, trace);
  };
}

app.mount("#app");
