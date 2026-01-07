import { Type } from "@google/genai";

/**
 * STEP 1 설정 (Configuration)
 * --------------------
 * 목표: 모델/캐릭터 생성을 위한 고품질 프롬프트 생성.
 * 변경사항: 권역, 페르소나, 출력 제어 3단계 입력 구조 반영.
 */

// 1. 스키마 (출력의 기준, Ground Truth)
export const STEP1_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    character_prompt: {
      type: Type.STRING,
      description: "캐릭터의 외모, 의상, 포즈를 묘사하는 메인 프롬프트. (직업과 날씨/계절, 지역적 특성 반영)",
    },
    negative_prompt: {
      type: Type.STRING,
      description: "품질 보장을 위해 제외할 용어들 (예: 기형, 나쁜 해부학 등).",
    },
    technical_settings: {
      type: Type.STRING,
      description: "카메라 앵글, 조명, 스타일 키워드 (Aspect Ratio에 최적화된 구도 포함).",
    },
    explanation: {
      type: Type.STRING,
      description: "입력된 페르소나(직업, 나이)와 타겟 지역/날짜를 바탕으로 의상과 스타일을 선정한 이유.",
    },
  },
  required: ["character_prompt", "negative_prompt", "technical_settings", "explanation"],
};

// 2. 규칙 (제약 사항 및 모범 사례)
export const STEP1_RULES = [
  "입력된 날짜와 도시를 기반으로 정확한 계절감(Seasonality)과 날씨를 의상에 반영하세요.",
  "직업(Job) 정보를 바탕으로 현대적이고 세련된 스타일링(Professional/Lifestyle)을 제안하세요.",
  "다양성 모드(Diversity Mode)에 따라 피부톤과 이목구비의 개성을 조절하세요.",
  "출력 비율(Aspect Ratio)에 맞춰 전신(Full body) 또는 상반신(Portrait) 구도를 제안하세요.",
];

// 3. 시스템 지침 (System Instruction)
export const STEP1_SYSTEM_INSTRUCTION = `
You are an expert AI Prompt Engineer and Fashion Stylist for LG's Enterprise Creative Engine.
Your task is to convert detailed marketing persona data into a high-fidelity image generation prompt.

Input Structure:
1. **Region & Schedule**: Location (City, Region) and Date. -> **CRITICAL**: Deduced season/weather dictates clothing (e.g., Paris in Jan = Winter Coat).
2. **Persona**: Age, Gender, Job, Ethnicity. -> Dictates facial features, vibe, and styling (e.g., Engineer = Smart Casual/Tech-chic).
3. **Output Control**: Casting, Diversity, Ratio. -> affects composition and subject count.

Logic:
- **Seasonality**: Always calculate the likely weather for the given City and Date.
- **Style**: Merge the 'Job' context with the 'City' vibe (e.g., NYC Finance vs. Bali Nomad).
- **Diversity**:
  - SAFE: Standard commercial balance. Safe and generally appealing without excessive exaggeration.
  - FULL: DEI (Diversity, Equity, and Inclusion) focused. Actively include diverse features, realistic textures, and broader style ranges.
  - OFF: Minimal diversity. Strictly adhere to the provided input values without adding unrequested variation or interpretation.

Output Requirements:
- Use specific fashion terminology for clothing fabrics and cuts.
- Describe the character's expression and pose to match the 'Job' confidence.
- Keep the background minimal (Step 2 will handle it), but lighting on the character should match the implied environment.
`;

// 4. 자산 (UI 옵션 및 매핑 데이터)

// 지역별 도시 매핑 데이터
export const REGION_CITY_MAP: Record<string, string[]> = {
  "Europe (유럽)": [
    "London (런던)", "Paris (파리)", "Berlin (베를린)", "Madrid (마드리드)",
    "Rome (로마)", "Amsterdam (암스테르담)", "Barcelona (바르셀로나)",
    "Vienna (비엔나)", "Prague (프라하)", "Budapest (부다페스트)",
    "Lisbon (리스본)", "Dublin (더블린)", "Brussels (브뤼셀)",
    "Copenhagen (코펜하겐)", "Stockholm (스톡홀름)", "Oslo (오슬로)",
    "Helsinki (헬싱키)", "Zurich (취리히)", "Munich (뮌헨)", "Istanbul (이스탄불)"
  ],
  "Latin America (남미)": [
    "São Paulo (상파울루)", "Rio de Janeiro (리우데자네이루)", "Brasília (브라질리아)",
    "Belo Horizonte (벨루오리존치)", "Buenos Aires (부에노스아이레스)", "Córdoba (코르도바)",
    "Santiago (산티아고)", "Valparaíso (발파라이소)", "Lima (리마)", "Cusco (쿠스코)",
    "Bogotá (보고타)", "Medellín (메데인)", "Cartagena (카르타헤나)", "Caracas (카라카스)",
    "Quito (키토)", "Guayaquil (과야킬)", "La Paz (라파스)",
    "Santa Cruz de la Sierra (산타크루스 데 라 시에라)", "Montevideo (몬테비데오)",
    "Asunción (아순시온)"
  ]
};

export const STEP1_OPTIONS = {
  // regions 키는 이제 REGION_CITY_MAP의 키를 동적으로 사용하므로 여기서는 명시적 선언을 제거하거나 참조용으로 둡니다.
  // 컴포넌트에서 Object.keys(REGION_CITY_MAP)을 직접 사용합니다.
  genders: ["Female", "Male", "Non-binary", "Not Specified"],
  ethnicity_options: [
    "White / 백인(유럽계)",
    "Black / 흑인(아프리카계)",
    "Indigenous / 원주민(토착민)",
    "Asian / 아시아계",
    "Mixed / Multiracial / 혼혈(다인종)",
    "Another ethnicity (please specify) / 기타(직접 입력)",
    "Prefer not to say / 응답 안 함"
  ],
  casting_modes: ["1명 (Single)", "커플 (Couple)", "가족 (Family)", "그룹 (Group)"],
  diversity_modes: [
    { value: "SAFE", label: "SAFE (기본)", desc: "기본 균형. 과도한 다양성 확장 없이 안전한 범위." },
    { value: "FULL", label: "FULL (DEI)", desc: "다양성을 적극 반영. 인물/스타일 범위를 넓게." },
    { value: "OFF", label: "OFF (최소)", desc: "다양성 최소화. 입력값 중심으로 고정." },
  ],
  aspect_ratios: ["4:5 (룩북)", "1:1 (스퀘어)", "16:9 (시네마틱)", "9:16 (릴스/숏폼)"],
};