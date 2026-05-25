import path from 'path';
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from "@mastra/duckdb";
import { MastraCompositeStore } from '@mastra/core/storage';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { chatRoute } from '@mastra/ai-sdk';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
import { devResponser } from './lib/dev-provider';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent },
  server: {
    apiRoutes: [
      {
        path: '/chat/dev',
        method: 'POST',
        handler: async ({ body }) => {
          console.log('HIT /chat/dev handler');
          try {
            const { messages } = body as { messages: any[] };
            if (!messages || !messages.length) {
              return new Response(JSON.stringify({ error: 'No messages provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            const lastMessage = messages[messages.length - 1];
            const result = await devResponser(lastMessage.content);

            const parts: any[] = [];

            // If a tool was "called" in dev mode, add a tool part to trigger the UI
            if (result.weatherData || result.error) {
              parts.push({
                type: 'tool-call',
                toolName: 'weatherTool',
                state: result.error ? 'output-error' : 'output-available',
                input: { location: result.location },
                output: result.weatherData,
                errorText: result.error
              });
            }

            // Always add the text response
            parts.push({ type: 'text', text: result.responseText });

            const responseBody = {
              id: Date.now().toString(),
              role: 'assistant',
              content: result.responseText,
              parts
            };

            return new Response(JSON.stringify(responseBody), {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              }
            });
          } catch (err) {
            console.error('DEV_HANDLER_ERROR:', err);
            return new Response(JSON.stringify({
              error: 'Internal Server Error',
              message: err instanceof Error ? err.message : String(err)
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
      },
      chatRoute({
        path: '/chat/:agentId',
      }),
    ],
  },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: "mastra-storage",
      url: `file:mastra.db`,
    }),
    domains: {
      observability: await new DuckDBStore({ path: 'mastra.duckdb' }).getStore('observability'),
    }
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(),
          new CloudExporter(),
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(),
        ],
      },
    },
  }),
});
