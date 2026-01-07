import { Type } from "@google/genai";

/**
 * STEP 2 설정 (Configuration)
 * --------------------
 * 목표: 인물 합성을 위한 고품질 배경/인테리어 및 사물 프롬프트 생성.
 * 핵심 제약: 인물 제외 (No Humans), 공간감, 주요 사물(가구/제품) 강조.
 */

// 1. 스키마 (출력의 기준)
export const STEP2_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    interior_prompt: {
      type: Type.STRING,
      description: "공간, 가구, 주요 사물, 재질을 묘사하는 메인 프롬프트.",
    },
    negative_prompt: {
      type: Type.STRING,
      description: "제외할 요소 (예: 사람, 동물, 텍스트, 흐릿함 등).",
    },
    lighting_atmosphere: {
      type: Type.STRING,
      description: "조명 설정 및 분위기 키워드 (예: volumetric lighting, cozy).",
    },
    composition_guide: {
        type: Type.STRING,
        description: "카메라 앵글 및 구도 (예: wide angle, depth of field).",
    },
    explanation: {
      type: Type.STRING,
      description: "선택한 인테리어 스타일과 조명에 대한 설명.",
    },
  },
  required: ["interior_prompt", "negative_prompt", "lighting_atmosphere", "composition_guide"],
};

// 2. 규칙
export const STEP2_RULES = [
  "사람이나 동물을 절대 포함하지 마세요 (Empty room, no humans).",
  "인물이 배치될 공간을 고려하여 구도를 잡으세요 (Center focused).",
  "주요 사물(제품, 가구)이 있다면 조명으로 강조하세요 (Product Highlight).",
  "건축 사진(Architectural Photography) 수준의 품질을 지향하세요.",
  "조명(Lighting)과 재질(Texture) 표현을 구체적으로 포함하세요.",
];

// 3. 시스템 지침
export const STEP2_SYSTEM_INSTRUCTION = `
You are an expert AI Interior Designer and Architectural Photographer.
Your task is to create high-end prompts for generating photorealistic backgrounds/interiors, optionally featuring specific products or furniture.

Critical Rules:
1. **NO HUMANS**: The prompt must explicitly enforce an empty scene (e.g., "nobody, empty room").
2. **Subject**: Focus on architecture, furniture styling, main object placement, and atmospheric lighting.
3. **Quality**: Use keywords like 'architectural digest style', 'unreal engine 5 render', '8k', 'hyperrealistic', 'product shot'.
4. **Purpose**: This background will be used to composite a character later. Ensure the perspective is grounded (eye-level or slightly low angle).

Input Analysis:
- Translate abstract mood descriptions into specific lighting setups (e.g., "Sad" -> "Overcast, cool blue tones, dim lighting").
- If unspecified, default to a 'Modern Minimalist' style with 'Natural Lighting'.
`;

// 4. 자산
export const STEP2_ASSETS = {
  room_types: ["Modern Living Room", "Product Showcase", "Tech Office", "Luxury Hotel Lobby", "Minimalist Studio", "Cyberpunk Street", "Fantasy Library"],
  styles: ["Minimalist", "Industrial", "Mid-Century Modern", "Futuristic", "Nordic", "Vintage"],
  lighting: ["Natural Morning Sun", "Golden Hour", "Studio Softbox", "Cinematic Dark", "Neon Glow"],
};