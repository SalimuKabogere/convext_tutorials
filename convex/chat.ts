// my first mutation 
// import the mutation and the validator

import { query, mutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { scheduler } from "timers/promises";

// we define the mutation that sends a message to the db
// It takes user and the body as the args

export const sendMessage = mutation({
  args: {
    user: v.string(),
    body: v.string(),
  },

  // define the handler function that will be called when the mutation is invoked

  handler: async (ctx, args) => {
    // log sth to the server console
    console.log("sendMessage mutation called with args:", args);

    // insert the message into the db
    const message = await ctx.db.insert("messages", {
      user: args.user,
      body: args.body,
    });

    // if the message starts with /wiki, we want to get the summary from wikipedia and send it as a message
    if (args.body.startsWith("/wiki")) {
      const topic = args.body.split(" ")[1];
      const summary = await ctx.scheduler.runAfter(0, internal.chat.getWikipediaSummary, { topic });
    }
  }
});

// add a query to get the messages from the db

export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    // get most recent messages first
    const messages = await ctx.db.query("messages").order("desc").collect();
    return messages.reverse(); // reverse the order to get oldest messages first
  }

})

// add an action to connect to the wikipedia api and get a random article

export const getWikipediaSummary = internalAction({
  args: {
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await fetch(
      "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=" + args.topic,
    );

    // return getSummaryFromJSON(await response.json());
    const summary = getSummaryFromJSON(await response.json());
    await ctx.scheduler.runAfter(0, api.chat.sendMessage, {
      user: "Wikipedia",
      body: summary,
    })
    
  }
})

export function getSummaryFromJSON(data: any) {
  const firstPageId = Object.keys(data.query.pages)[0];
  const summary = data.query.pages[firstPageId].extract;
  return summary;
}