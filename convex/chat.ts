import { internalAction, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { MutationCtx, QueryCtx } from "./_generated/server";


export const sendMessage = mutation(
  {
    args: {
      user: v.string(),
      body: v.string(),
    },
    handler: async (ctx: MutationCtx, args: { user: string; body: string }) => {
        // console.log("This typescript message is running on the server!");

        // first insert the message into the database
        await ctx.db.insert("messages", {
            user: args.user,
            body: args.body,
        });

        // sth that could occure
        if (args.user == 'evil') throw new Error('Evil user detected!');

        // second insert
        await ctx.db.insert("events", {
            user: args.user,
            message: "Message sent successfully",
        });
    },
  }
);

// add a query
export const getMessages = query({
  args:{},
  handler: async (ctx: QueryCtx) => {
    const messages = await ctx.db.query("messages").collect();
    return messages.reverse(); // return the messages in ascending order
  } 
})

// we use actions if we want to connect to an external API, like OpenAI, or if we want to do something that is not allowed in a mutation or query, like sending an email.

export const getWikipediaSummary = internalAction({
  args: {
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("Wikipedia topic:", args.topic);

    const topic = args.topic.startsWith("wiki:")
      ? args.topic.slice("wiki:".length).trim()
      : args.topic;

    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext=1&titles=${encodeURIComponent(topic)}`
    );

    const json = await response.json();
    console.log("Wikipedia response:", json);

    return getSummaryFromJSON(json);
  },
});

function getSummaryFromJSON(json: any): string {
  const pages = json?.query?.pages;
  const firstPageId = Object.keys(pages ?? {})[0];
  return pages?.[firstPageId]?.extract ?? "No summary found.";
}

