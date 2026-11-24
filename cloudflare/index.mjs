import accountWorker from "./account.mjs";
import productBot from "./product-bot.mjs";

export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === "/api/account")
      return accountWorker.fetch(request, env);
    if (path === "/api/bot") return productBot.fetch(request, env);
    return env.ASSETS.fetch(request);
  },
};

