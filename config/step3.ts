import { Type } from "@google/genai";

/**
 * STEP 3 설정 (Configuration)
 * --------------------
 * 목표: 캐릭터(Step 1)와 배경/사물(Step 2)을 완벽하게 합성한 마스터 프롬프트 생성.
 * 핵심: 조명 일치(Lighting Match), 시선 처리(Eye Contact), 사물 상호작용(Object Interaction).
 */

// 1. 스키마
export const STEP3_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    master_prompt: {
      type: Type.STRING,
      description: "캐릭터, 배경, 사물 상호작용이 통합된 최종 이미지 생성 프롬프트.",
    },
    negative_prompt: {
      type: Type.STRING,
      description: "합성 시 발생할 수 있는 오류 방지 (예: 떠있는 발, 관통된 신체, 부자연스러운 손).",
    },
    lighting_integration: {
      type: Type.STRING,
      description: "캐릭터와 배경의 조명을 섞기 위한 구체적 지시 (예: Rim light matching background window).",
    },
    explanation: {
      type: Type.STRING,
      description: "합성 전략 및 사물 상호작용 연출 의도 설명.",
    },
  },
  required: ["master_prompt", "negative_prompt", "lighting_integration", "explanation"],
};

// 2. 규칙
export const STEP3_RULES = [
  "캐릭터와 배경의 조명 방향을 반드시 일치시키세요 (Coherent Lighting).",
  "Step 2의 주요 사물(가구/제품)이 있다면 캐릭터와의 상호작용을 명시하세요 (Sitting on, Holding, etc.).",
  "캐릭터가 배경에 '떠있지' 않고 '녹아들도록' 그림자(Contact Shadows)를 강조하세요.",
  "전체적인 톤앤매너(Tone & Manner)를 하나로 통일하세요.",
];

// 3. 시스템 지침
export const STEP3_SYSTEM_INSTRUCTION = `
You are an expert Art Director and Cinematographer.
Your task is to merge a [Character Prompt] and an [Interior/Object Prompt] into a single, seamless **Master Prompt**.

Your goals:
1. **Interaction**: Explicitly describe how the character interacts with the main object/furniture from Step 2 based on the user's 'Interaction Mode'.
   - If 'Sitting': Ensure the pose is 'sitting on [Step 2 Object]'.
   - If 'Holding': Ensure the hand pose is 'holding [Step 2 Object]'.
2. **Integration**: The character must look like they are physically present. Mention contact shadows.
3. **Lighting Match**: If the room has "Warm Sunlight", the character must be lit accordingly.
4. **Syntax**: Use standard prompt syntax (Subject + Action + Environment + Technical Specs).

Input Handling:
- Combine Step 1 (Person) + Step 2 (Background/Object).
- Apply the specific 'Interaction Mode' requested by the user.
`;

// 4. 자산
export const STEP3_ASSETS = {
  shot_types: ["Full Body Shot (전신)", "Cowboy Shot (무릎 위)", "Waist Up (상반신)", "Close Up (얼굴 중심)", "Wide Angle (광각/배경 강조)"],
  lighting_balance: ["Balanced (균형)", "Character Focused (인물 강조)", "Product/Object Focused (사물 강조)", "Atmosphere Focused (배경/무드 강조)"],
  camera_positions: ["Eye Level", "Low Angle (Heroic)", "High Angle", "Dutch Angle (Dynamic)"],
  interactions: [
    "No Interaction (단순 배치/거리 두기)", 
    "Holding Object (제품/사물 들고 있기)", 
    "Sitting On (가구에 앉기)", 
    "Leaning Against (가구/벽에 기대기)", 
    "Touching/Using (손으로 만지거나 사용 중)", 
    "Standing Next To (옆에 서기)"
  ]
};