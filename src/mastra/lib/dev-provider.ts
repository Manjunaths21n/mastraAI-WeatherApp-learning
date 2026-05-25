import { weatherTool } from '../tools/weather-tool';

/**
 * A simple mock LLM for development that bypasses external API quotas.
 * It simulates an agent by checking for weather-related keywords.
 */
export const devResponser = async (input: string) => {
  const lowerInput = input.toLowerCase();

  // 1. Simulate Tool Calling detection
  if (lowerInput.includes('weather') || lowerInput.includes('temperature')) {
    // Extract a potential location (naive implementation for dev)
    const words = input.split(' ');
    const inIndex = words.findIndex(w => w.toLowerCase() === 'in');
    let location = 'London'; // Default
    
    if (inIndex !== -1 && words[inIndex + 1]) {
      location = words[inIndex + 1].replace(/[?!.,]/g, '');
    }

    try {
      // 2. Call the real tool
      const weatherData = await weatherTool.execute({
        location,
      }, {
          toolId: 'get-weather',
          toolName: 'weatherTool',
          runId: 'dev-run'
      });

      const responseText = `[MOCK MODE] The current weather in ${weatherData.location} is ${weatherData.conditions.toLowerCase()}. The temperature is ${weatherData.temperature}°C, but it feels like ${weatherData.feelsLike}°C. Humidity is at ${weatherData.humidity}%.`;

      // Return both the data and the text
      return {
        location,
        weatherData,
        responseText
      };
    } catch (error) {
      return {
        location,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseText: `[MOCK MODE ERROR] I tried to check the weather for ${location}, but I ran into an error.`
      };
    }
  }

  return {
    responseText: "[MOCK MODE] I'm in Local Dev Mode to save your Gemini API quota. I can only help with weather queries right now (e.g., 'weather in London')."
  };
};
