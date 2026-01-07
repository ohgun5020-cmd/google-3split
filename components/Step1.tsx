import React, { useState } from "react";
import { ai } from "../lib/gemini";
import { STEP1_SYSTEM_INSTRUCTION, STEP1_RESPONSE_SCHEMA, STEP1_RULES, STEP1_ASSETS } from "../config/step1";
import { MarkdownCard } from "./MarkdownCard";

interface Step1Output {
  character_prompt: string;
  negative_prompt: string;
  technical_settings: string;
  explanation: string;
}

interface HistoryItem extends Step1Output {
  id: string;
  timestamp: string;
}

export const Step1: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    gender: "여성",
    age: "20대",
    ethnicity: "한국인",
    style: "Professional Chic",
    details: "흰 블라우스를 입고 있으며, 친근한 표정으로 카메라를 응시함.",
  });

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const userPrompt = `
        Create a character prompt for:
        - Gender: ${formData.gender}
        - Age: ${formData.age}
        - Ethnicity: ${formData.ethnicity}
        - Style: ${formData.style}
        - Additional Details: ${formData.details}
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

      if (response.text) {
        const parsed = JSON.parse(response.text);
        const newItem: HistoryItem = {
          ...parsed,
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        // Add new item to the beginning of the list
        setHistory(prev => [newItem, ...prev]);
      }
    } catch (error) {
      console.error("Step 1 Generation Error:", error);
      alert("프롬프트 생성에 실패했습니다. 콘솔을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full items-start">
      {/* LEFT: Input Configuration Card */}
      <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">모델 캐릭터 설정</h2>
            <p className="text-gray-500 text-sm">프롬프트 생성을 위한 기본 정보를 입력해주세요.</p>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">성별</label>
                <div className="relative">
                  <select 
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all appearance-none cursor-pointer hover:bg-gray-100"
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="Female">여성</option>
                    <option value="Male">남성</option>
                    <option value="Non-binary">논바이너리</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                </div>
              </div>
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">연령대</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-gray-400 hover:bg-gray-100"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  placeholder="예: 20대"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">인종 / 국적</label>
              <input 
                type="text" 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-gray-400 hover:bg-gray-100"
                value={formData.ethnicity}
                onChange={(e) => setFormData({...formData, ethnicity: e.target.value})}
                placeholder="예: 한국인"
              />
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">스타일 / 분위기</label>
              <div className="relative">
                <select 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all appearance-none cursor-pointer hover:bg-gray-100"
                  value={formData.style}
                  onChange={(e) => setFormData({...formData, style: e.target.value})}
                >
                  {STEP1_ASSETS.clothing_styles.map(style => (
                    <option key={style} value={style}>
                      {style === "business_suit" ? "비즈니스 정장" : 
                       style === "casual_chic" ? "캐주얼 시크" :
                       style === "sportswear_lg_tone" ? "스포츠웨어 (LG 톤)" : 
                       style.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                  <option value="Custom">직접 입력 (Custom)</option>
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">상세 묘사</label>
              <textarea 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all h-36 resize-none placeholder:text-gray-400 hover:bg-gray-100"
                value={formData.details}
                onChange={(e) => setFormData({...formData, details: e.target.value})}
                placeholder="구체적인 상황, 표정, 조명 등을 자유롭게 서술하세요..."
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`w-full mt-8 py-4 rounded-full font-bold text-white text-lg shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
              loading 
                ? "bg-gray-300 shadow-none cursor-not-allowed" 
                : "bg-gray-900 hover:bg-black hover:shadow-gray-900/30"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <i className="fas fa-circle-notch fa-spin"></i> 생성 중...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-magic"></i> 프롬프트 생성
              </span>
            )}
          </button>
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
            <p className="text-sm text-gray-300 mt-2">고품질의 인물 프롬프트가 생성되면 이곳에 표시됩니다.</p>
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
                    title="Positive Prompt" 
                    content={`${result.character_prompt}, ${result.technical_settings}`} 
                  />
                  
                  <MarkdownCard 
                    title="Negative Prompt" 
                    content={result.negative_prompt} 
                    type="negative" 
                  />

                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100/50">
                    <div className="flex items-center gap-2 mb-3 text-indigo-900">
                      <i className="fas fa-brain"></i>
                      <strong className="text-sm font-bold uppercase tracking-wider">AI Insight</strong>
                    </div>
                    <p className="text-indigo-800 leading-relaxed text-sm">
                      {result.explanation}
                    </p>
                  </div>
                </div>

                {/* Generate More Button - Embedded at bottom of latest card */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
                  <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-indigo-600 transition-all duration-200 bg-white border-2 border-indigo-100 rounded-full hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="absolute left-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-gray-200"></span>
                    <span className="relative flex items-center gap-2">
                      {loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> 처리 중...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus"></i> 추가 변형 생성하기
                        </>
                      )}
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
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded">#{history.length - index}</span>
                      <span className="text-xs text-gray-400 font-mono">{result.timestamp}</span>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Prompt Preview</h4>
                    <p className="text-sm text-gray-700 line-clamp-2 font-mono bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {result.character_prompt.substring(0, 150)}...
                    </p>
                  </div>
                  <div className="flex justify-end">
                     <button 
                       onClick={() => {
                         navigator.clipboard.writeText(`${result.character_prompt}, ${result.technical_settings}`);
                         alert('프롬프트가 복사되었습니다.');
                       }}
                       className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                     >
                       <i className="fas fa-copy"></i> 전체 복사
                     </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
