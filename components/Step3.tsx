import React, { useState } from "react";
import { ai } from "../lib/gemini";
import { STEP3_SYSTEM_INSTRUCTION, STEP3_RESPONSE_SCHEMA, STEP3_RULES, STEP3_ASSETS } from "../config/step3";
import { MarkdownCard } from "./MarkdownCard";
import { Step1Output } from "./Step1";
import { Step2Output } from "./Step2";

interface Step3Props {
  step1Data: Step1Output | null;
  step2Data: Step2Output | null;
}

interface Step3Output {
  master_prompt: string;
  negative_prompt: string;
  lighting_integration: string;
  explanation: string;
}

interface HistoryItem extends Step3Output {
  id: string;
  timestamp: string;
}

export const Step3: React.FC<Step3Props> = ({ step1Data, step2Data }) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    shotType: "Full Body Shot (전신)",
    lightingBalance: "Balanced (균형)",
    cameraPosition: "Eye Level",
    interaction: "No Interaction (단순 배치/거리 두기)",
    additionalDirectives: "",
  });

  const handleGenerate = async () => {
    if (!step1Data || !step2Data) {
      alert("이전 단계(캐릭터, 배경)의 데이터가 필요합니다.");
      return;
    }

    setLoading(true);

    try {
      const userPrompt = `
        [SOURCE 1: CHARACTER]
        ${step1Data.character_prompt}
        (Negative: ${step1Data.negative_prompt})

        [SOURCE 2: BACKGROUND & OBJECTS]
        ${step2Data.interior_prompt}
        (Lighting: ${step2Data.lighting_atmosphere})

        [COMPOSITION & INTERACTION SETTINGS]
        - Shot Type: ${formData.shotType}
        - Camera Position: ${formData.cameraPosition}
        - Lighting Focus: ${formData.lightingBalance}
        
        [CRITICAL INTERACTION INSTRUCTION]
        - Interaction Mode: ${formData.interaction}
        * IMPORTANT: Modify the character's pose to match this interaction with the object/furniture defined in Source 2.
        
        [ADDITIONAL DIRECTIVES]
        ${formData.additionalDirectives}

        Action: Merge these into a single cohesive Master Prompt.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userPrompt,
        config: {
          systemInstruction: STEP3_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: STEP3_RESPONSE_SCHEMA,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        const newItem: HistoryItem = {
          ...parsed,
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setHistory(prev => [newItem, ...prev]);
      }
    } catch (error) {
      console.error("Step 3 Generation Error:", error);
      alert("합성 프롬프트 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isReady = step1Data && step2Data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full items-start">
      {/* LEFT: Input Configuration Card */}
      <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
        
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">최종 합성 설정</h2>
            <p className="text-gray-500 text-sm">캐릭터와 배경/사물을 결합하여 완성된 장면을 연출합니다.</p>
          </div>
          
          {/* Source Summary */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className={`p-4 rounded-2xl border text-sm ${step1Data ? 'bg-indigo-50 border-indigo-100 text-indigo-900' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              <div className="font-bold mb-1 flex items-center gap-2">
                <i className="fas fa-user"></i> 캐릭터
              </div>
              <div className="truncate opacity-70 text-xs">
                {step1Data ? step1Data.character_prompt.substring(0, 30) + "..." : "데이터 없음"}
              </div>
            </div>
            <div className={`p-4 rounded-2xl border text-sm ${step2Data ? 'bg-indigo-50 border-indigo-100 text-indigo-900' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              <div className="font-bold mb-1 flex items-center gap-2">
                <i className="fas fa-couch"></i> 배경/사물
              </div>
              <div className="truncate opacity-70 text-xs">
                {step2Data ? step2Data.interior_prompt.substring(0, 30) + "..." : "데이터 없음"}
              </div>
            </div>
          </div>

          {!isReady && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 text-sm mb-6 flex items-start gap-3">
              <i className="fas fa-exclamation-triangle mt-0.5"></i>
              <p>1단계와 2단계를 먼저 완료해야 합성을 진행할 수 있습니다.</p>
            </div>
          )}

          <div className={`space-y-6 ${!isReady ? 'opacity-50 pointer-events-none' : ''}`}>
            
            {/* Main Interaction Config */}
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
               <div className="group">
                <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                   <i className="fas fa-hand-holding"></i> 사물/제품 상호작용 (Interaction)
                </label>
                <div className="relative">
                  <select 
                    className="w-full p-4 bg-white border border-indigo-100 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    value={formData.interaction}
                    onChange={(e) => setFormData({...formData, interaction: e.target.value})}
                  >
                    {STEP3_ASSETS.interactions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-indigo-400 text-xs pointer-events-none"></i>
                </div>
                <p className="text-xs text-indigo-500 mt-2 px-1">
                   * Step 2에서 생성한 가구에 앉거나, 제품을 들고 있는 등의 행동을 지정합니다.
                </p>
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">샷 타입 (Shot Type)</label>
              <div className="relative">
                <select 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all appearance-none cursor-pointer"
                  value={formData.shotType}
                  onChange={(e) => setFormData({...formData, shotType: e.target.value})}
                >
                  {STEP3_ASSETS.shot_types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
               <div className="group">
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">조명 포커스</label>
                 <div className="relative">
                   <select 
                     className="w-full p-4 bg-gray-50 border-none rounded-2xl text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all appearance-none cursor-pointer"
                     value={formData.lightingBalance}
                     onChange={(e) => setFormData({...formData, lightingBalance: e.target.value})}
                   >
                     {STEP3_ASSETS.lighting_balance.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                   <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                 </div>
               </div>
               <div className="group">
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">카메라 앵글</label>
                 <div className="relative">
                   <select 
                     className="w-full p-4 bg-gray-50 border-none rounded-2xl text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all appearance-none cursor-pointer"
                     value={formData.cameraPosition}
                     onChange={(e) => setFormData({...formData, cameraPosition: e.target.value})}
                   >
                     {STEP3_ASSETS.camera_positions.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                   <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                 </div>
               </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">추가 연출 지시</label>
              <textarea 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all h-24 resize-none placeholder:text-gray-400"
                value={formData.additionalDirectives}
                onChange={(e) => setFormData({...formData, additionalDirectives: e.target.value})}
                placeholder="예: 바람에 머리카락이 날리는 효과, 몽환적인 분위기 강조..."
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !isReady}
            className={`w-full mt-8 py-4 rounded-full font-bold text-white text-lg shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
              loading || !isReady
                ? "bg-gray-300 shadow-none cursor-not-allowed" 
                : "bg-gradient-to-r from-gray-900 to-indigo-900 hover:shadow-indigo-900/30"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <i className="fas fa-circle-notch fa-spin"></i> 합성 중...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-film"></i> 마스터 프롬프트 생성
              </span>
            )}
          </button>
        </div>

        {/* Rules Card */}
        <div className="bg-white/50 p-6 rounded-3xl border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
             <i className="fas fa-check-double text-indigo-500"></i>
             <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">합성 체크포인트</h3>
          </div>
          <ul className="space-y-2">
            {STEP3_RULES.map((rule, idx) => (
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
              <i className="fas fa-photo-video text-4xl text-gray-200"></i>
            </div>
            <p className="text-lg font-medium text-gray-400">캐릭터와 배경을 합성할 준비가 되었습니다.</p>
            <p className="text-sm text-gray-300 mt-2">최종 결과물이 이곳에 표시됩니다.</p>
          </div>
        )}

        {/* State: Has Data */}
        {history.map((result, index) => (
          <div key={result.id} className={`transition-all duration-500 ease-in-out ${index === 0 ? 'opacity-100 translate-y-0' : 'opacity-90'}`}>
            
            {index === 0 && (
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <i className="fas fa-crown text-9xl text-amber-500 transform rotate-6 translate-x-10 -translate-y-10"></i>
                </div>
                
                <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8 relative z-10">
                   <div>
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        마스터 프롬프트 <span className="text-amber-600 text-sm font-normal bg-amber-50 px-3 py-1 rounded-full">Final Output</span>
                      </h2>
                   </div>
                   <div className="flex items-center gap-3">
                     <span className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-100">
                       <i className="fas fa-check-circle"></i> Ready to Generate
                     </span>
                   </div>
                </div>

                <div className="space-y-6 relative z-10">
                  <MarkdownCard 
                    title="Master Prompt" 
                    content={`${result.master_prompt}`} 
                  />
                  
                  <MarkdownCard 
                    title="Negative Prompt" 
                    content={result.negative_prompt} 
                    type="negative" 
                  />

                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-gray-700">
                      <i className="fas fa-sun"></i>
                      <strong className="text-sm font-bold uppercase tracking-wider">Lighting Integration</strong>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-sm font-mono">
                      {result.lighting_integration}
                    </p>
                  </div>

                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100/50">
                    <div className="flex items-center gap-2 mb-3 text-amber-900">
                      <i className="fas fa-comment-dots"></i>
                      <strong className="text-sm font-bold uppercase tracking-wider">Director's Note</strong>
                    </div>
                    <p className="text-amber-800 leading-relaxed text-sm">
                      {result.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {index > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded">#{history.length - index}</span>
                      <span className="text-xs text-gray-400 font-mono">{result.timestamp}</span>
                   </div>
                   <button 
                       onClick={() => {
                         navigator.clipboard.writeText(`${result.master_prompt}`);
                         alert('복사되었습니다.');
                       }}
                       className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                     >
                       <i className="fas fa-copy"></i> 복사
                     </button>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 font-mono bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {result.master_prompt.substring(0, 150)}...
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};