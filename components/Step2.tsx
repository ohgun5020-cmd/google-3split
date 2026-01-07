import React, { useState } from "react";
import { ai } from "../lib/gemini";
import { STEP2_SYSTEM_INSTRUCTION, STEP2_RESPONSE_SCHEMA, STEP2_RULES, STEP2_ASSETS } from "../config/step2";
import { MarkdownCard } from "./MarkdownCard";
import { Step1Output } from "./Step1";

export interface Step2Output {
  interior_prompt: string;
  negative_prompt: string;
  lighting_atmosphere: string;
  composition_guide: string;
  explanation: string;
}

interface HistoryItem extends Step2Output {
  id: string;
  timestamp: string;
}

interface Step2Props {
  step1Data: Step1Output | null;
  onDataGenerated?: (data: Step2Output, shouldNavigate?: boolean) => void;
}

// Sub-component for individual history items to manage expansion state
const HistoryItemCard: React.FC<{ item: HistoryItem; index: number; onSelect: (item: HistoryItem, navigate: boolean) => void }> = ({ item, index, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const fullPrompt = `${item.interior_prompt}, ${item.lighting_atmosphere}`;

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
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Interior Prompt</h4>
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`text-sm text-gray-700 font-mono bg-gray-50 p-3 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${
              isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'
            }`}
          >
            {fullPrompt}
          </div>
        </div>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="grid grid-cols-2 gap-3 mt-2">
             <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-xs font-bold text-gray-400 block mb-1">Lighting</span>
                <span className="text-xs text-gray-600">{item.lighting_atmosphere}</span>
             </div>
             <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-xs font-bold text-gray-400 block mb-1">Composition</span>
                <span className="text-xs text-gray-600">{item.composition_guide}</span>
             </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-2">
           <button 
             onClick={(e) => {
               e.stopPropagation();
               navigator.clipboard.writeText(fullPrompt);
               onSelect(item, true); // Trigger copy & navigate
             }}
             className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 px-3 py-1.5 bg-indigo-50 rounded-lg transition-colors border border-indigo-100"
           >
             <i className="fas fa-arrow-right"></i> 복사 및 Step 3 적용
           </button>
        </div>
      </div>
    </div>
  );
};

export const Step2: React.FC<Step2Props> = ({ step1Data, onDataGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    roomType: "Modern Living Room",
    style: "Minimalist",
    lighting: "Natural Morning Sun",
    colors: "White and Wood",
    details: "넓은 통창으로 햇살이 들어오고, 편안한 베이지색 소파가 중앙에 배치됨.",
  });

  const handleGenerate = async (mode: 'reset' | 'append') => {
    setLoading(true);

    try {
      // Incorporate Step 1 context if available
      const contextPrompt = step1Data ? `
        [CONTEXT: MATCHING CHARACTER]
        This background is designed for a character described as:
        "${step1Data.character_prompt}"
        Style/Tone: "${step1Data.technical_settings}"
        Ensure the background style, lighting, and camera angle harmonize with this character.
      ` : `
        [CONTEXT]
        No specific character context provided. Create a standalone high-quality background.
      `;

      const userPrompt = `
        ${contextPrompt}

        [USER REQUIREMENTS]
        Create an interior/background prompt for:
        - Room Type: ${formData.roomType}
        - Design Style: ${formData.style}
        - Lighting: ${formData.lighting}
        - Color Palette: ${formData.colors}
        - Specific Details (Objects & Furniture): ${formData.details}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userPrompt,
        config: {
          systemInstruction: STEP2_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: STEP2_RESPONSE_SCHEMA,
        },
      });

      if (response.text) {
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

        // Pass data to parent, no navigation yet
        if (onDataGenerated) {
          onDataGenerated(parsed, false);
        }
      }
    } catch (error) {
      console.error("Step 2 Generation Error:", error);
      alert("배경 프롬프트 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (item: Step2Output, navigate: boolean) => {
    if (onDataGenerated) {
      onDataGenerated(item, navigate);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full items-start">
      {/* LEFT: Input Configuration Card */}
      <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
        
        {/* Step 1 Connection Widget (Collapsible) */}
        {step1Data ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl overflow-hidden transition-all shadow-sm">
            <details className="group">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-indigo-100/50 transition-colors list-none">
                <div className="flex items-center gap-3 text-indigo-900">
                   <div className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center">
                     <i className="fas fa-link text-xs text-indigo-700"></i>
                   </div>
                   <span className="text-sm font-bold">1단계 캐릭터 프롬프트 연결됨</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-xs text-indigo-400 group-open:hidden">펼치기</span>
                   <i className="fas fa-chevron-down text-indigo-400 transform group-open:rotate-180 transition-transform text-xs"></i>
                </div>
              </summary>
              <div className="px-4 pb-4 pt-0">
                <div className="mt-2 pt-3 border-t border-indigo-200/50">
                   <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Character Prompt</p>
                   <div className="bg-white p-3 rounded-xl border border-indigo-100 text-xs text-gray-600 font-mono leading-relaxed mb-3 max-h-32 overflow-y-auto">
                     {step1Data.character_prompt}
                   </div>
                   <button 
                     onClick={(e) => {
                       e.preventDefault();
                       navigator.clipboard.writeText(step1Data.character_prompt);
                       alert("캐릭터 프롬프트가 복사되었습니다.");
                     }}
                     className="w-full py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                   >
                     <i className="fas fa-copy"></i> 복사하기
                   </button>
                </div>
              </div>
            </details>
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-4 flex items-center justify-between text-gray-400">
             <div className="flex items-center gap-3">
               <i className="fas fa-exclamation-circle"></i>
               <span className="text-sm font-medium">1단계 데이터 없음 (독립 생성 모드)</span>
             </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">인테리어/사물 설정</h2>
            <p className="text-gray-500 text-sm">인물이 합성될 배경 공간과 주요 사물을 정의해주세요.</p>
          </div>
          
          <div className="space-y-6">
            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">공간 유형 (Space Type)</label>
              <div className="relative">
                <select 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all appearance-none cursor-pointer hover:bg-gray-100"
                  value={formData.roomType}
                  onChange={(e) => setFormData({...formData, roomType: e.target.value})}
                >
                  {STEP2_ASSETS.room_types.map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="Custom">직접 입력</option>
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
                <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">스타일</label>
                <div className="relative">
                    <select 
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all appearance-none cursor-pointer hover:bg-gray-100"
                    value={formData.style}
                    onChange={(e) => setFormData({...formData, style: e.target.value})}
                    >
                    {STEP2_ASSETS.styles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                </div>
                </div>
                <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">조명/분위기</label>
                <div className="relative">
                    <select 
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all appearance-none cursor-pointer hover:bg-gray-100"
                    value={formData.lighting}
                    onChange={(e) => setFormData({...formData, lighting: e.target.value})}
                    >
                    {STEP2_ASSETS.lighting.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                </div>
                </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">메인 컬러 톤</label>
              <input 
                type="text" 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-gray-400 hover:bg-gray-100"
                value={formData.colors}
                onChange={(e) => setFormData({...formData, colors: e.target.value})}
                placeholder="예: Warm Beige, Cool Blue, Monochrome..."
              />
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">배치할 사물(가구/제품) 및 상세 묘사</label>
              <textarea 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all h-36 resize-none placeholder:text-gray-400 hover:bg-gray-100"
                value={formData.details}
                onChange={(e) => setFormData({...formData, details: e.target.value})}
                placeholder="예: 중앙에 고급스러운 TV가 배치되어 있고, 창가에는 공기청정기가 있음..."
              />
            </div>
          </div>

          <button
            onClick={() => handleGenerate('reset')}
            disabled={loading}
            className={`w-full mt-8 py-4 rounded-full font-bold text-white text-lg shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
              loading 
                ? "bg-gray-300 shadow-none cursor-not-allowed" 
                : "bg-indigo-900 hover:bg-indigo-950 hover:shadow-indigo-900/30"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <i className="fas fa-circle-notch fa-spin"></i> 설계 중...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-layer-group"></i> {history.length > 0 ? "결과 리프레쉬" : "배경/사물 프롬프트 생성"}
              </span>
            )}
          </button>
        </div>

        {/* Rules Card */}
        <div className="bg-white/50 p-6 rounded-3xl border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
             <i className="fas fa-ruler-combined text-indigo-500"></i>
             <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">배경 생성 규칙</h3>
          </div>
          <ul className="space-y-2">
            {STEP2_RULES.map((rule, idx) => (
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
              <i className="fas fa-couch text-4xl text-gray-200"></i>
            </div>
            <p className="text-lg font-medium text-gray-400">배경 설정을 입력하고 생성을 시작하세요.</p>
            <p className="text-sm text-gray-300 mt-2">인물과 주요 사물이 배치될 완벽한 공간 프롬프트를 생성합니다.</p>
          </div>
        )}

        {/* State: Has Data */}
        {history.map((result, index) => (
          <div key={result.id} className={`transition-all duration-500 ease-in-out ${index === 0 ? 'opacity-100 translate-y-0' : 'opacity-90'}`}>
            
            {/* LATEST RESULT CARD */}
            {index === 0 && (
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <i className="fas fa-home text-9xl text-indigo-500 transform -rotate-12 translate-x-10 -translate-y-10"></i>
                </div>
                
                <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8 relative z-10">
                   <div>
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        인테리어 프롬프트 <span className="text-indigo-600 text-sm font-normal bg-indigo-50 px-3 py-1 rounded-full">New</span>
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {result.timestamp}에 생성된 배경입니다.
                      </p>
                   </div>
                   <div className="flex items-center gap-3">
                     <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100 flex items-center gap-2">
                       <i className="fas fa-user-slash"></i> No Humans
                     </span>
                   </div>
                </div>

                <div className="space-y-6 relative z-10">
                  <MarkdownCard 
                    title="Interior Prompt" 
                    content={`${result.interior_prompt}, ${result.lighting_atmosphere}, ${result.composition_guide}`} 
                    onCopy={() => handleSelectPrompt(result, false)}
                  />
                  
                  <MarkdownCard 
                    title="Negative Prompt" 
                    content={result.negative_prompt} 
                    type="negative" 
                  />

                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Lighting & Mood</div>
                        <p className="text-sm text-gray-800">{result.lighting_atmosphere}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Composition</div>
                        <p className="text-sm text-gray-800">{result.composition_guide}</p>
                      </div>
                  </div>

                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100/50">
                    <div className="flex items-center gap-2 mb-3 text-indigo-900">
                      <i className="fas fa-lightbulb"></i>
                      <strong className="text-sm font-bold uppercase tracking-wider">Design Insight</strong>
                    </div>
                    <p className="text-indigo-800 leading-relaxed text-sm">
                      {result.explanation}
                    </p>
                  </div>

                  {/* Generate More & Next Step Buttons */}
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
                          다음 단계 (합성) <i className="fas fa-arrow-right"></i>
                       </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORY LIST HEADER */}
            {index === 1 && (
              <div className="flex items-center gap-4 py-4">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">이전 생성 기록</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
            )}

            {/* HISTORY ITEMS (Collapsible) */}
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