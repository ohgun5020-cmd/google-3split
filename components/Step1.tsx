import React, { useState } from "react";
import { ai } from "../lib/gemini";
import { STEP1_SYSTEM_INSTRUCTION, STEP1_RESPONSE_SCHEMA, STEP1_RULES, STEP1_OPTIONS, REGION_CITY_MAP } from "../config/step1";
import { MarkdownCard } from "./MarkdownCard";

export interface Step1Output {
  character_prompt: string;
  negative_prompt: string;
  technical_settings: string;
  explanation: string;
}

interface HistoryItem extends Step1Output {
  id: string;
  timestamp: string;
}

interface Step1Props {
  onDataGenerated?: (data: Step1Output, shouldNavigate?: boolean) => void;
}

// Sub-component for individual history items
const HistoryItemCard: React.FC<{ item: HistoryItem; index: number; onSelect: (item: HistoryItem, navigate: boolean) => void }> = ({ item, index, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const fullPrompt = `${item.character_prompt}, ${item.technical_settings}`;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex justify-between items-start mb-4">
         <div className="flex items-center gap-3">
            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded">#{index}</span>
            <span className="text-xs text-gray-400 font-mono">{item.timestamp}</span>
         </div>
         <div className="flex items-center gap-2">
           <button 
             onClick={() => setIsExpanded(!isExpanded)}
             className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors"
           >
             {isExpanded ? '접기' : '펼치기'}
             <i className={`fas fa-chevron-down transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
           </button>
         </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Prompt Preview</h4>
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`text-sm text-gray-700 font-mono bg-gray-50 p-3 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${
              isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'
            }`}
          >
            {fullPrompt}
          </div>
        </div>
        <div className="flex justify-end gap-2">
           <button 
             onClick={(e) => {
               e.stopPropagation();
               navigator.clipboard.writeText(fullPrompt);
               onSelect(item, true);
             }}
             className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 px-3 py-1.5 bg-indigo-50 rounded-lg transition-colors border border-indigo-100"
           >
             <i className="fas fa-arrow-right"></i> 복사 및 Step 2 적용
           </button>
        </div>
      </div>
    </div>
  );
};

export const Step1: React.FC<Step1Props> = ({ onDataGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Initialize Defaults
  const defaultRegion = "Europe (유럽)";
  const defaultCities = REGION_CITY_MAP[defaultRegion];

  // New Form State Structure
  const [formData, setFormData] = useState({
    // Section 1: 권역 (Region)
    region: defaultRegion,
    city: defaultCities[0], // Default to first city of region
    targetDate: "2026-01-07",

    // Section 2: 페르소나 (Persona)
    age: "35",
    gender: "Female",
    job: "Software Engineer",
    ethnicity: "Asian / 아시아계",

    // Section 3: 출력 제어 (Output Control)
    castingMode: "1명 (Single)",
    diversityMode: "SAFE",
    aspectRatio: "4:5 (룩북)"
  });

  // Helper to find diversity description
  const selectedDiversityDesc = STEP1_OPTIONS.diversity_modes.find(m => m.value === formData.diversityMode)?.desc || "";

  // Helper to handle Region Change and auto-set City
  const handleRegionChange = (newRegion: string) => {
    const newCities = REGION_CITY_MAP[newRegion] || [];
    setFormData({
      ...formData,
      region: newRegion,
      city: newCities[0] || "" // Auto-select first city
    });
  };

  const handleGenerate = async (mode: 'reset' | 'append') => {
    setLoading(true);

    try {
      const userPrompt = `
        Create a high-fidelity character prompt based on the following specifications:

        [1. REGION & SCHEDULE]
        - Region: ${formData.region}
        - City: ${formData.city}
        - Target Date: ${formData.targetDate}
        * IMPORTANT: Infer the season and weather from the City and Date to determine appropriate clothing (e.g., Winter coat for Paris in January).

        [2. PERSONA]
        - Age: ${formData.age}
        - Gender: ${formData.gender}
        - Job/Profession: ${formData.job}
        - Ethnicity/Features: ${formData.ethnicity}
        * IMPORTANT: The "Job" should dictate the professional vibe, outfit style, and props.

        [3. OUTPUT CONTROL]
        - Casting Mode: ${formData.castingMode}
        - Diversity Mode: ${formData.diversityMode} (${selectedDiversityDesc})
        - Aspect Ratio: ${formData.aspectRatio}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userPrompt,
        config: {
          systemInstruction: STEP1_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: STEP1_RESPONSE_SCHEMA,
        },
      });

      if (!response.text) {
        throw new Error("AI 응답이 비어있습니다.");
      }

      const parsed = JSON.parse(response.text);
      const newItem: HistoryItem = {
        ...parsed,
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      
      if (mode === 'reset') {
        setHistory([newItem]);
      } else {
        setHistory(prev => [newItem, ...prev]);
      }
      
      if (onDataGenerated) {
        onDataGenerated(parsed, false);
      }

    } catch (error) {
      console.error("Step 1 Generation Error:", error);
      alert("프롬프트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (item: Step1Output, navigate: boolean) => {
    if (onDataGenerated) {
      onDataGenerated(item, navigate);
    }
  };

  // Get available cities for current region
  const availableCities = REGION_CITY_MAP[formData.region] || [];

  // Ethnicity Selection Logic
  const OTHER_ETHNICITY_LABEL = "Another ethnicity (please specify) / 기타(직접 입력)";
  
  // Determine what to show in the dropdown:
  // If the current formData.ethnicity is in the list of options, use it.
  // Otherwise (e.g. custom text or empty), show the "Other" label.
  const currentEthnicitySelectValue = STEP1_OPTIONS.ethnicity_options.includes(formData.ethnicity) 
    ? formData.ethnicity 
    : OTHER_ETHNICITY_LABEL;

  const isCustomEthnicity = currentEthnicitySelectValue === OTHER_ETHNICITY_LABEL;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full items-start">
      {/* LEFT: Input Configuration Card */}
      <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
        
        {/* Main Settings Card */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden">
          <div className="p-8 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">모델 캐릭터 설정</h2>
            <p className="text-gray-500 text-sm">타겟 페르소나와 지역/일정을 상세히 정의하세요.</p>
          </div>

          <div className="divide-y divide-gray-100">
            
            {/* SECTION 1: REGION */}
            <div className="p-8 pt-4">
              <div className="flex items-center gap-2 mb-4 text-indigo-900">
                <i className="fas fa-globe-americas"></i>
                <h3 className="text-sm font-bold uppercase tracking-wider">권역 (Region)</h3>
              </div>
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 mb-1">지역</label>
                  <div className="relative">
                    <select 
                      className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                      value={formData.region}
                      onChange={(e) => handleRegionChange(e.target.value)}
                    >
                      {Object.keys(REGION_CITY_MAP).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1">도시</label>
                     <div className="relative">
                        <select 
                          className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                        >
                          {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                        <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1">타겟 일정</label>
                     <input 
                       type="date" 
                       className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 text-gray-700"
                       value={formData.targetDate}
                       onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                     />
                   </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: PERSONA */}
            <div className="p-8 pt-6">
              <div className="flex items-center gap-2 mb-4 text-indigo-900">
                <i className="fas fa-user-circle"></i>
                <h3 className="text-sm font-bold uppercase tracking-wider">페르소나 (Persona)</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1">나이</label>
                     <input 
                       type="number" 
                       className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                       value={formData.age}
                       onChange={(e) => setFormData({...formData, age: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1">성별</label>
                     <div className="relative">
                        <select 
                          className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                          value={formData.gender}
                          onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        >
                          {STEP1_OPTIONS.genders.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                     </div>
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">직업</label>
                   <input 
                     type="text" 
                     className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 placeholder:text-gray-400"
                     value={formData.job}
                     onChange={(e) => setFormData({...formData, job: e.target.value})}
                     placeholder="예: Software Engineer"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">인종/특징</label>
                   <div className="relative">
                      <select 
                        className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                        value={currentEthnicitySelectValue}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          if (newValue === OTHER_ETHNICITY_LABEL) {
                            setFormData({...formData, ethnicity: ""});
                          } else {
                            setFormData({...formData, ethnicity: newValue});
                          }
                        }}
                      >
                         {STEP1_OPTIONS.ethnicity_options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                   </div>
                   {isCustomEthnicity && (
                     <div className="mt-2 animate-fadeIn">
                        <input 
                          type="text" 
                          className="w-full p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 placeholder:text-gray-400"
                          value={formData.ethnicity}
                          onChange={(e) => setFormData({...formData, ethnicity: e.target.value})}
                          placeholder="구체적인 인종/특징을 직접 입력하세요 (예: Southeast Asian)"
                          autoFocus
                        />
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* SECTION 3: OUTPUT CONTROL */}
            <div className="p-8 pt-6 pb-8">
              <div className="flex items-center gap-2 mb-4 text-indigo-900">
                <i className="fas fa-sliders-h"></i>
                <h3 className="text-sm font-bold uppercase tracking-wider">출력 제어 (Output Control)</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">캐스팅 모드</label>
                      <div className="relative">
                        <select 
                          className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                          value={formData.castingMode}
                          onChange={(e) => setFormData({...formData, castingMode: e.target.value})}
                        >
                           {STEP1_OPTIONS.casting_modes.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">비율</label>
                      <div className="relative">
                        <select 
                          className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                          value={formData.aspectRatio}
                          onChange={(e) => setFormData({...formData, aspectRatio: e.target.value})}
                        >
                           {STEP1_OPTIONS.aspect_ratios.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                      </div>
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">다양성 모드</label>
                   <div className="relative">
                      <select 
                        className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                        value={formData.diversityMode}
                        onChange={(e) => setFormData({...formData, diversityMode: e.target.value})}
                      >
                         {STEP1_OPTIONS.diversity_modes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                   </div>
                   <p className="text-[11px] text-gray-400 mt-1.5 px-1 leading-relaxed">
                     {selectedDiversityDesc}
                   </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <button
                onClick={() => handleGenerate('reset')}
                disabled={loading}
                className={`w-full py-4 rounded-full font-bold text-white text-lg shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
                  loading 
                    ? "bg-gray-300 shadow-none cursor-not-allowed" 
                    : "bg-gray-900 hover:bg-black hover:shadow-gray-900/30"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <i className="fas fa-circle-notch fa-spin"></i> 분석 및 생성 중...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-magic"></i> {history.length > 0 ? "결과 리프레쉬" : "프롬프트 생성"}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Rules Card */}
        <div className="bg-white/50 p-6 rounded-3xl border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
             <i className="fas fa-check-circle text-green-500"></i>
             <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">적용된 규칙</h3>
          </div>
          <ul className="space-y-2">
            {STEP1_RULES.map((rule, idx) => (
              <li key={idx} className="text-sm text-gray-500 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 shrink-0"></span>
                <span className="leading-relaxed">{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT: Output Area */}
      <div className="lg:col-span-7 h-full space-y-8">
        
        {/* State: Empty */}
        {history.length === 0 && (
          <div className="bg-white h-[600px] p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 flex flex-col items-center justify-center text-gray-300">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <i className="fas fa-sparkles text-4xl text-gray-200"></i>
            </div>
            <p className="text-lg font-medium text-gray-400">좌측 설정을 입력하고 생성을 시작하세요.</p>
            <p className="text-sm text-gray-300 mt-2">입력된 페르소나에 최적화된 고품질 인물 프롬프트가 생성됩니다.</p>
          </div>
        )}

        {/* State: Has Data */}
        {history.map((result, index) => (
          <div key={result.id} className={`transition-all duration-500 ease-in-out ${index === 0 ? 'opacity-100 translate-y-0' : 'opacity-90'}`}>
            
            {/* LATEST RESULT CARD (Top) */}
            {index === 0 && (
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <i className="fas fa-star text-9xl text-indigo-500 transform rotate-12 translate-x-10 -translate-y-10"></i>
                </div>
                
                <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8 relative z-10">
                   <div>
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        생성 결과 <span className="text-indigo-600 text-sm font-normal bg-indigo-50 px-3 py-1 rounded-full">New</span>
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {result.timestamp}에 생성된 최적화 프롬프트입니다.
                      </p>
                   </div>
                   <div className="flex items-center gap-3">
                     <span className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-green-100 flex items-center gap-2">
                       <i className="fas fa-shield-check"></i> 검증됨
                     </span>
                   </div>
                </div>

                <div className="space-y-6 relative z-10">
                  <MarkdownCard 
                    title="Character Prompt (Positive)" 
                    content={`${result.character_prompt}, ${result.technical_settings}`}
                    onCopy={() => handleSelectPrompt(result, false)}
                  />
                  
                  <MarkdownCard 
                    title="Negative Prompt" 
                    content={result.negative_prompt} 
                    type="negative" 
                  />

                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100/50">
                    <div className="flex items-center gap-2 mb-3 text-indigo-900">
                      <i className="fas fa-brain"></i>
                      <strong className="text-sm font-bold uppercase tracking-wider">Style Logic (AI Insight)</strong>
                    </div>
                    <p className="text-indigo-800 leading-relaxed text-sm">
                      {result.explanation}
                    </p>
                  </div>
                </div>

                {/* Generate More Button & Next Step - Embedded at bottom of latest card */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center gap-4">
                  <button 
                    onClick={() => handleGenerate('append')}
                    disabled={loading}
                    className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-indigo-600 transition-all duration-200 bg-white border-2 border-indigo-100 rounded-full hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="relative flex items-center gap-2">
                      {loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> 처리 중...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sync-alt"></i> 재생성
                        </>
                      )}
                    </span>
                  </button>

                  <button
                    onClick={() => handleSelectPrompt(result, true)}
                    className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white transition-all duration-200 bg-indigo-600 border-2 border-indigo-600 rounded-full hover:bg-indigo-700 hover:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-200"
                  >
                     <span className="relative flex items-center gap-2">
                        다음 단계 (배경 생성) <i className="fas fa-arrow-right"></i>
                     </span>
                  </button>
                </div>
              </div>
            )}

            {/* HISTORY LIST HEADER (Only before the first history item) */}
            {index === 1 && (
              <div className="flex items-center gap-4 py-4">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">이전 생성 기록</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
            )}

            {/* HISTORY ITEMS */}
            {index > 0 && (
              <HistoryItemCard 
                item={result} 
                index={history.length - index} 
                onSelect={handleSelectPrompt}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};