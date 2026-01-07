import { Type } from "@google/genai";

/**
 * STEP 1 설정 (Configuration)
 * --------------------
 * 목표: 모델/캐릭터 생성을 위한 고품질 프롬프트 생성.
 * 이 파일은 Step 1 로직의 '단일 진실 공급원(Source of Truth)' 역할을 합니다.
 */

// 1. 스키마 (출력의 기준, Ground Truth)
export const STEP1_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    character_prompt: {
      type: Type.STRING,
      description: "캐릭터 묘사를 위한 메인 긍정 프롬프트 (Positive Prompt).",
    },
    negative_prompt: {
      type: Type.STRING,
      description: "품질 보장을 위해 제외할 용어들 (예: 기형, 나쁜 해부학 등).",
    },
    technical_settings: {
      type: Type.STRING,
      description: "카메라 앵글, 조명, 스타일 키워드 (예: 8k, 실사풍).",
    },
    explanation: {
      type: Type.STRING,
      description: "사용자 입력을 바탕으로 해당 키워드를 선택한 이유에 대한 간략한 설명.",
    },
  },
  required: ["character_prompt", "negative_prompt", "technical_settings"],
};

// 2. 규칙 (제약 사항 및 모범 사례) - UI에 표시됨
export const STEP1_RULES = [
  "인물에 집중해야 합니다: 얼굴 특징, 체형, 의류 재질 묘사.",
  "복잡한 배경 묘사는 피하세요 (배경은 Step 2에서 처리).",
  "타겟 모델에 따라 '단부루(booru) 스타일 태그'와 '자연어'를 혼용하세요 (기본값: 하이브리드).",
  "항상 고품질 수식어를 포함하세요 (예: masterpiece, best quality).",
];

// 3. 시스템 지침 (System Instruction) - AI의 두뇌 역할
export const STEP1_SYSTEM_INSTRUCTION = `
You are an expert AI Prompt Engineer specializing in photorealistic human characters.
Your task is to convert raw user requirements into a professional image generation prompt.

Follow these strict rules:
1. **Focus**: Only describe the character and their immediate accessories. Background should be simple or undefined.
2. **Format**: Use a mix of descriptive sentences and comma-separated tags.
3. **Quality**: Automatically inject standard high-quality boosters (e.g., 8k uhd, dslr, soft lighting, high fidelity).
4. **Consistency**: Adhere to the JSON schema provided.

Input Analysis:
- If gender/age is unspecified, infer from context or default to a neutral artistic choice.
- If style is unspecified, default to 'Cinematic Photorealism'.
`;

// 4. 자산 참조 (폴더 구조 읽기를 가정)
export const STEP1_ASSETS = {
  reference_poses: ["standing_casual.png", "sitting_chair.png", "walking_dynamic.png"],
  clothing_styles: ["business_suit", "casual_chic", "sportswear_lg_tone"],
};
