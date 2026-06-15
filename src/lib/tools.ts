import { AnthropicTool } from "@/app/api/lib/anthropic";

export const TOOL_DEFINITIONS: AnthropicTool[] = [
  {
    name: "web_search",
    description:
      "Search the web for real-time information. Use this when the user asks about current events, recent news, live data, or anything that may have changed after your training cutoff. Returns search results with titles, URLs, and snippets.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query to look up on the web",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "web_fetch",
    description:
      "Fetch and read the content of a specific webpage URL. Use this when the user provides a URL and wants you to read, summarize, or analyze its content. Returns the text content of the page.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The full URL to fetch content from",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "open_application",
    description: "Opens an application on the user's device. To force a desktop app to open, you MUST use its custom URI protocol (e.g. 'spotify://'). Also provide a fallback https URL.",
    input_schema: {
      type: "object" as const,
      properties: {
        appName: {
          type: "string",
          description: "The name of the application (e.g., 'Spotify', 'Notion')",
        },
        uriScheme: {
          type: "string",
          description: "The custom URI protocol for the desktop app (e.g., 'spotify://', 'notion://', 'vscode://')",
        },
        fallbackUrl: {
          type: "string",
          description: "The https:// fallback URL if the app isn't installed (e.g., 'https://open.spotify.com')",
        },
      },
      required: ["appName", "uriScheme", "fallbackUrl"],
    },
  },
  {
    name: "play_spotify",
    description: "Searches for a song on Spotify and plays it on the user's device. Use this when the user asks to play a specific song or type of song on Spotify.",
    input_schema: {
      type: "object" as const,
      properties: {
        songName: {
          type: "string",
          description: "The name of the song and artist to play",
        },
      },
      required: ["songName"],
    },
  },
  {
    name: "open_youtube",
    description: "Opens YouTube on the user's device. If a search query or video name is provided, it searches for that video. Use this when the user asks to open YouTube or play a specific video on YouTube.",
    input_schema: {
      type: "object" as const,
      properties: {
        videoName: {
          type: "string",
          description: "The name of the video to search for and play. Leave empty if the user just wants to open YouTube.",
        },
      },
      required: ["videoName"],
    },
  },
];

export function getToolByName(name: string) {
  return TOOL_DEFINITIONS.find((t) => t.name === name);
}
