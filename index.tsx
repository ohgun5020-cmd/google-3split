import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Step1, Step1Output } from "./components/Step1";
import { Step2, Step2Output } from "./components/Step2";
import { Step3 } from "./components/Step3";

const App = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Output | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Output | null>(null);

  const handleStep1Success = (data: Step1Output, shouldNavigate: boolean = false) => {
    setStep1Data(data);
    if (shouldNavigate) {
      setActiveStep(2);
    }
  };

  const handleStep2Success = (data: Step2Output, shouldNavigate: boolean = false) => {
    setStep2Data(data);
    if (shouldNavigate) {
      setActiveStep(3);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      {/* Header: Minimal & Spacious */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gray-900 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-gray-200">
              <i className="fas fa-layer-group text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">LG Prompt Suite</h1>
              <p className="text-xs text-gray-500 font-medium tracking-wide">Enterprise Creative Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold uppercase tracking-wider">v1.1.0</span>
          </div>
        </div>
      </header>

      {/* Tabs: Floating Pill Style */}
      <div className="max-w-[1600px] mx-auto px-8 py-8 w-full">
        <nav className="flex space-x-2 bg-white p-1.5 rounded-full shadow-sm border border-gray-100 w-fit">
          {[
            { id: 1, label: "1단계: 캐릭터 설정", icon: "fa-user" },
            { id: 2, label: "2단계: 배경 및 사물", icon: "fa-couch" },
            { id: 3, label: "3단계: 합성 및 완성", icon: "fa-magic" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStep(tab.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                activeStep === tab.id
                  ? "bg-gray-900 text-white shadow-md transform scale-[1.02]"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <i className={`fas ${tab.icon} ${activeStep === tab.id ? "text-white" : "text-gray-400"}`}></i>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 pb-12">
        {/* Step 1: Keep mounted to preserve state */}
        <div className={activeStep === 1 ? "block h-full" : "hidden"}>
          <Step1 onDataGenerated={handleStep1Success} />
        </div>

        {/* Step 2: Keep mounted to preserve state */}
        <div className={activeStep === 2 ? "block h-full" : "hidden"}>
          <Step2 step1Data={step1Data} onDataGenerated={handleStep2Success} />
        </div>

        {/* Step 3: Keep mounted to preserve state */}
        <div className={activeStep === 3 ? "block h-full" : "hidden"}>
           <Step3 step1Data={step1Data} step2Data={step2Data} />
        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);