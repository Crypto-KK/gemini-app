
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DestinationDetails, DayPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

// --- Schemas ---

const destinationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name in Simplified Chinese" },
    country: { type: Type.STRING, description: "Country in Simplified Chinese" },
    description: { type: Type.STRING, description: "Description in Simplified Chinese" },
    bestTimeToVisit: { type: Type.STRING, description: "Best time in Simplified Chinese" },
    imageKeyword: { type: Type.STRING, description: "A single english keyword to search for an image of this place, e.g. 'Eiffel Tower' or 'Kyoto Streets'" },
    rating: { type: Type.NUMBER, description: "A rating from 1 to 5 based on popularity" },
  },
  required: ["name", "country", "description", "bestTimeToVisit", "imageKeyword"],
};

const itinerarySchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      day: { type: Type.INTEGER },
      title: { type: Type.STRING, description: "Short theme for the day in Simplified Chinese" },
      activities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING, description: "Time range (e.g., '09:00 - 11:00')" },
            description: { type: Type.STRING, description: "Activity description in Simplified Chinese" }
          },
          required: ["time", "description"]
        },
        description: "List of key activities for the day in Simplified Chinese with specific time slots."
      }
    },
    required: ["day", "title", "activities"],
  }
};

const inspirationListSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Name in Simplified Chinese" },
      country: { type: Type.STRING, description: "Country in Simplified Chinese" },
      description: { type: Type.STRING, description: "Description in Simplified Chinese" },
      imageKeyword: { type: Type.STRING, description: "English keyword for image generation" },
      bestTimeToVisit: { type: Type.STRING, description: "Best time in Simplified Chinese" },
    },
    required: ["name", "country", "description", "imageKeyword", "bestTimeToVisit"],
  }
};

// --- API Calls ---

export const searchDestination = async (query: string): Promise<DestinationDetails> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Provide travel details for ${query}. Return JSON. The content MUST be in Simplified Chinese (简体中文), except for imageKeyword which must be English.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: destinationSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as DestinationDetails;
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Search Destination Error:", error);
    throw error;
  }
};

export const generateTripPlan = async (
  destination: string, 
  days: number, 
  timeContext?: { arrival: string, departure: string },
  style: 'vacation' | 'leisure' | 'intense' = 'leisure'
): Promise<DayPlan[]> => {
  try {
    let timePrompt = "";
    if (timeContext) {
      timePrompt = `The traveler arrives at ${timeContext.arrival} and departs at ${timeContext.departure}. 
      CRITICAL: Plan the first day's activities ONLY AFTER the arrival time. 
      Plan the last day's activities ONLY BEFORE the departure time. 
      Mention the arrival and departure in the activities list with correct times.`;
    }

    let stylePrompt = "";
    switch (style) {
        case 'vacation':
            stylePrompt = "Travel Style: Vacation/Resort (度假游). Very relaxed pace. Focus on relaxation, enjoying the hotel/resort. Provide relaxed time slots (e.g. 10:00-12:00, 14:00-16:00). No rushing.";
            break;
        case 'intense':
            stylePrompt = "Travel Style: 'Special Forces' style (特种兵打卡). Extremely fast-paced and packed itinerary. Maximize the number of attractions. Provide TIGHT and PRECISE time slots starting early and ending late (e.g. 06:00-07:30, 07:45-09:00).";
            break;
        case 'leisure':
        default:
            stylePrompt = "Travel Style: Leisure (休闲游). Balanced pace. Standard sightseeing. Provide reasonable time slots for 3-4 attractions per day.";
            break;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Create a ${days}-day travel itinerary for ${destination}. ${stylePrompt} ${timePrompt} Return JSON. The content MUST be in Simplified Chinese (简体中文). Ensure every activity has a specific time range.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: itinerarySchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as DayPlan[];
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Generate Plan Error:", error);
    throw error;
  }
};

export const getInspirationPlaces = async (excludeNames: string[] = []): Promise<DestinationDetails[]> => {
  const excludeString = excludeNames.length > 0 
    ? `Do not include these destinations: ${excludeNames.slice(-20).join(', ')}.` 
    : "";

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `List 6 random, unique, and popular travel destinations around the world. Mix of nature, cities, and hidden gems. ${excludeString} Return JSON. The content MUST be in Simplified Chinese (简体中文), except for imageKeyword which must be English.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: inspirationListSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as DestinationDetails[];
    }
    return [];
  } catch (error) {
    console.error("Inspiration Error:", error);
    
    // Fallback data with shuffling to simulate randomness if API fails
    const fallbackData = [
      { name: "京都", country: "日本", description: "拥有古老寺庙和神社的千年古都。", bestTimeToVisit: "春季/秋季", imageKeyword: "Kyoto" },
      { name: "圣托里尼", country: "希腊", description: "爱琴海上的明珠，以白墙蓝顶建筑闻名。", bestTimeToVisit: "夏季", imageKeyword: "Santorini" },
      { name: "雷克雅未克", country: "冰岛", description: "探索极光和火山地貌的绝佳门户。", bestTimeToVisit: "冬季/夏季", imageKeyword: "Reykjavik" },
      { name: "皇后镇", country: "新西兰", description: "世界冒险之都，拥有壮丽的湖光山色。", bestTimeToVisit: "全年", imageKeyword: "Queenstown" },
      { name: "马丘比丘", country: "秘鲁", description: "失落的印加城市，壮观的山顶遗迹。", bestTimeToVisit: "旱季", imageKeyword: "Machu Picchu" },
      { name: "开普敦", country: "南非", description: "桌山脚下的港口城市，风景如画。", bestTimeToVisit: "春秋", imageKeyword: "Cape Town" },
      { name: "巴厘岛", country: "印尼", description: "神之岛，热带海滩与梯田风光。", bestTimeToVisit: "旱季", imageKeyword: "Bali" },
      { name: "班夫国家公园", country: "加拿大", description: "落基山脉的明珠，碧绿湖泊与雪山。", bestTimeToVisit: "夏季/冬季", imageKeyword: "Banff" }
    ];

    // Simple shuffle
    return fallbackData.sort(() => 0.5 - Math.random()).slice(0, 4);
  }
};
