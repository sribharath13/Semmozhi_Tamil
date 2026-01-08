
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  BookOpen, Type, MessageSquare, Award, User, Volume2, Play, 
  CheckCircle2, Trophy, ChevronRight, Home, Sparkles, Database, 
  Trash2, LogOut, Loader2, Settings2, Search, Book, PenTool,
  Menu, X, Filter, Languages, Info, ArrowLeft, Layers, Bookmark, Plus,
  Headphones, History
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

// --- Configuration ---
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// --- Assets ---
const ValluvarIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={`${className} valluvar-glow`} fill="currentColor">
    <path d="M100 20 C80 20 65 35 65 55 C65 75 80 90 100 90 C120 90 135 75 135 55 C135 35 120 20 100 20 Z" />
    <path d="M100 100 C60 100 30 130 30 170 L170 170 C170 130 140 100 100 100 Z" />
    <path d="M100 45 Q100 65 115 55" fill="none" stroke="white" strokeWidth="2" />
    <circle cx="90" cy="50" r="2" fill="white" />
    <circle cx="110" cy="50" r="2" fill="white" />
    <path d="M70 140 Q100 130 130 140" fill="none" stroke="white" strokeWidth="3" opacity="0.3" />
  </svg>
);

// --- Data Constants ---
const ALPHABET = {
  vowels: [
    { char: 'அ', eng: 'a' }, { char: 'ஆ', eng: 'aa' }, { char: 'இ', eng: 'i' }, { char: 'ஈ', eng: 'ee' },
    { char: 'உ', eng: 'u' }, { char: 'ஊ', eng: 'oo' }, { char: 'எ', eng: 'e' }, { char: 'ஏ', eng: 'ae' },
    { char: 'ஐ', eng: 'ai' }, { char: 'ஒ', eng: 'o' }, { char: 'ஓ', eng: 'oa' }, { char: 'ஔ', eng: 'au' }
  ],
  consonants: [
    { char: 'க்', eng: 'k', base: 'க' }, { char: 'ங்', eng: 'ng', base: 'ங' }, { char: 'ச்', eng: 'ch', base: 'ச' },
    { char: 'ஞ்', eng: 'nj', base: 'ஞ' }, { char: 'ட்', eng: 't', base: 'ட' }, { char: 'ண்', eng: 'n', base: 'ண' },
    { char: 'த்', eng: 'th', base: 'த' }, { char: 'ந்', eng: 'n', base: 'ந' }, { char: 'ப்', eng: 'p', base: 'ப' },
    { char: 'ம்', eng: 'm', base: 'ம' }, { char: 'ய்', eng: 'y', base: 'ய' }, { char: 'ர்', eng: 'r', base: 'ர' },
    { char: 'ல்', eng: 'l', base: 'ல' }, { char: 'வ்', eng: 'v', base: 'வ' }, { char: 'ழ்', eng: 'zh', base: 'ழ' },
    { char: 'ள்', eng: 'l', base: 'ள' }, { char: 'ற்', eng: 'r', base: 'ற' }, { char: 'ன்', eng: 'n', base: 'ன' }
  ],
  mods: ['', 'ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ']
};

const WORDS_DATABASE = [
  // Greetings
  { tamil: "வணக்கம்", syllables: ["வ", "ண", "க்", "க", "ம்"], eng: "Vanakkam", meaning: "Hello", cat: "Greetings" },
  { tamil: "நன்றி", syllables: ["ந", "ன்", "றி"], eng: "Nandri", meaning: "Thank you", cat: "Greetings" },
  { tamil: "காலை வணக்கம்", syllables: ["கா", "லை", "வ", "ண", "க்", "க", "ம்"], eng: "Kaalai vanakkam", meaning: "Good morning", cat: "Greetings" },
  // Colors
  { tamil: "சிவப்பு", syllables: ["சி", "வ", "ப்", "பு"], eng: "Sivappu", meaning: "Red", cat: "Colors" },
  { tamil: "நீலம்", syllables: ["நீ", "ல", "ம்"], eng: "Neelam", meaning: "Blue", cat: "Colors" },
  { tamil: "பச்சை", syllables: ["ப", "ச்", "சை"], eng: "Pachai", meaning: "Green", cat: "Colors" },
  // Numbers
  { tamil: "ஒன்று", syllables: ["ஒ", "ன்", "று"], eng: "Onnu", meaning: "One", cat: "Numbers" },
  { tamil: "இரண்டு", syllables: ["இ", "ர", "ண்", "டு"], eng: "Rendu", meaning: "Two", cat: "Numbers" },
  { tamil: "மூன்று", syllables: ["மூ", "ன்", "று"], eng: "Moonu", meaning: "Three", cat: "Numbers" },
  // Verbs
  { tamil: "போ", syllables: ["போ"], eng: "Po", meaning: "Go", cat: "Verbs" },
  { tamil: "வா", syllables: ["வா"], eng: "Va", meaning: "Come", cat: "Verbs" },
  { tamil: "சாப்பிடு", syllables: ["சா", "ப்", "பி", "டு"], eng: "Saappidu", meaning: "Eat", cat: "Verbs" },
];

const THIRUKKURAL_DATA = [
  { no: 1, paal: "அறத்துப்பால்", adhikaram: "கடவுள் வாழ்த்து", kural: "அகர முதல எழுத்தெல்லாம் ஆதி\nபகவன் முதற்றே உலகு.", meaning: "As the letter A is the first of all letters, so is the eternal God the first of the world." },
  { no: 2, paal: "அறத்துப்பால்", adhikaram: "கடவுள் வாழ்த்து", kural: "கற்றதனால் ஆய பயனென்கொல் வாலறிவன்\nநற்றாள் தொழாஅர் எனின்.", meaning: "What is the benefit of learning if one does not worship the feet of the All-knowing God?" },
  { no: 11, paal: "அறத்துப்பால்", adhikaram: "வான் சிறப்பு", kural: "வான்நின்று உலகம் வழங்கி வருதலால்\nதான்அமிழ்தம் என்றுணரற் பாற்று.", meaning: "Since the rain maintains the world, it should be regarded as the nectar of life." },
  { no: 31, paal: "அறத்துப்பால்", adhikaram: "அறன் வலியுறுத்தல்", kural: "சிறப்புஈனும் செல்வமும் ஈனும் அறத்தினூஉங்கு\nஆக்கம் எவனோ உயிர்க்கு.", meaning: "Virtue yields glory and wealth; there is no greater gain for life than virtue." },
  { no: 391, paal: "பொருட்பால்", adhikaram: "கல்வி", kural: "கற்க கசடறக் கற்பவை கற்றபின்\nநிற்க அதற்குத் தக.", meaning: "Learn flawlessly; and having learned, live accordingly." },
  { no: 781, paal: "பொருட்பால்", adhikaram: "நட்பு", kural: "செயற்கரிய யாவுள நட்பின் அதுபோல்\nவினைக்கரிய யாவுள காப்பு.", meaning: "What is so difficult to acquire as friendship? What is so powerful a protection against enemies?" },
  { no: 1101, paal: "காமத்துப்பால்", adhikaram: "புணர்ச்சி மகிழ்தல்", kural: "கண்டுகேட்டு உண்டுயிர்த்து உற்றறியும் ஐம்புலனும்\nஒண்டொடி கண்ணே உள.", meaning: "All the five senses of sight, sound, taste, smell, and touch are found only in this bright-jeweled lady." },
  { no: 1330, paal: "காமத்துப்பால்", adhikaram: "ஊடலுவகை", kural: "ஊடுதல் காமத்திற்கு இன்பம் அதற்கின்பம்\nகூடி முயங்கப் பெறின்.", meaning: "Sulkiness adds zest to love, but only if it ends in a sweet embrace." }
];

// --- Utilities ---
const decodeBase64 = (b: string) => new Uint8Array(atob(b).split("").map(c => c.charCodeAt(0)));
const decodeAudio = async (data: Uint8Array, ctx: AudioContext) => {
  const d16 = new Int16Array(data.buffer);
  const buf = ctx.createBuffer(1, d16.length, 24000);
  const chan = buf.getChannelData(0);
  for (let i = 0; i < d16.length; i++) chan[i] = d16[i] / 32768.0;
  return buf;
};

// --- Main App ---
const SemmozhiApp = () => {
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState('home');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedWord, setSelectedWord] = useState<any>(null);
  const [selectedConsonant, setSelectedConsonant] = useState<any>(null);
  const [kuralFilter, setKuralFilter] = useState({ paal: '', search: '' });
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('semmozhi_v3');
    if (saved) {
      const p = JSON.parse(saved);
      setUser(p.user); setXp(p.xp || 0); setStreak(p.streak || 0);
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('semmozhi_v3', JSON.stringify({ user, xp, streak }));
  }, [user, xp, streak]);

  const speak = async (text: string, isSlow = false) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = isSlow 
        ? `Pronounce the following Tamil phoneme/word very clearly and slowly for a learner: "${text}"`
        : `Read this Tamil text naturally: "${text}"`;

      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: prompt }] }],
        config: { 
          responseModalities: [Modality.AUDIO], 
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
        },
      });
      
      const b64 = response.candidates?.[0]?.content?.parts[0]?.inlineData?.data;
      if (b64) {
        if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        const buf = await decodeAudio(decodeBase64(b64), ctx);
        const src = ctx.createBufferSource();
        src.buffer = buf; src.connect(ctx.destination);
        src.onended = () => setIsSpeaking(false);
        src.start();
      }
    } catch (e) {
      console.error("TTS Error:", e);
      // Fallback to browser TTS if API fails
      const u = new SpeechSynthesisUtterance(text); u.lang = 'ta-IN';
      u.onend = () => setIsSpeaking(false); window.speechSynthesis.speak(u);
    }
  };

  // --- Sub-Views ---

  const KuralLibrary = () => {
    const filteredKurals = useMemo(() => {
      return THIRUKKURAL_DATA.filter(k => {
        const matchesPaal = !kuralFilter.paal || k.paal === kuralFilter.paal;
        const matchesSearch = !kuralFilter.search || 
          k.kural.includes(kuralFilter.search) || 
          k.no.toString().includes(kuralFilter.search) ||
          k.adhikaram.includes(kuralFilter.search);
        return matchesPaal && matchesSearch;
      });
    }, [kuralFilter]);

    return (
      <div className="space-y-6 animate-slide-up pb-32">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setPage('home')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft/></button>
            <h1 className="text-2xl font-bold text-[#800000]">திருக்குறள் (Library)</h1>
          </div>
          <button onClick={() => setPage('kural-intro')} className="p-2 bg-orange-50 text-[#FF9933] rounded-xl"><Info size={20}/></button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
            {['', 'அறத்துப்பால்', 'பொருட்பால்', 'காமத்துப்பால்'].map(p => (
              <button 
                key={p}
                onClick={() => setKuralFilter(f => ({ ...f, paal: p }))}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  kuralFilter.paal === p ? 'bg-[#800000] text-white shadow-lg' : 'bg-white text-gray-400 border border-orange-100'
                }`}
              >
                {p || 'அனைத்தும் (All)'}
              </button>
            ))}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FF9933] transition-colors" size={18}/>
            <input 
              type="text" 
              placeholder="Search by No. or Keyword..."
              value={kuralFilter.search}
              onChange={(e) => setKuralFilter(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-orange-50 rounded-2xl focus:border-[#FF9933] outline-none font-medium transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredKurals.map((k) => (
            <div key={k.no} className="parchment p-6 rounded-[2rem] shadow-sm border-l-8 border-l-[#800000] relative group hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-black text-[#FF9933] uppercase tracking-widest">{k.adhikaram}</span>
                  <p className="text-[9px] text-gray-300 font-bold uppercase">{k.paal} • #{k.no}</p>
                </div>
                <button 
                  onClick={() => { speak(k.kural); setXp(x => x + 5); }}
                  className="p-3 bg-[#800000] text-white rounded-full shadow-lg active:scale-90 transition-all"
                >
                  <Volume2 size={18}/>
                </button>
              </div>
              <p className="tamil-font text-xl font-bold text-[#800000] leading-relaxed mb-4 whitespace-pre-line">{k.kural}</p>
              <div className="bg-[#800000]/5 p-4 rounded-xl border border-[#800000]/10">
                <p className="text-xs text-gray-600 font-medium italic leading-relaxed">"{k.meaning}"</p>
              </div>
            </div>
          ))}
          {filteredKurals.length === 0 && (
            <div className="text-center py-20 text-gray-300 font-bold">
              <Search size={48} className="mx-auto mb-4 opacity-20"/>
              No Kurals found matching your search.
            </div>
          )}
        </div>
      </div>
    );
  };

  const KuralIntro = () => (
    <div className="space-y-8 animate-slide-up pb-20">
       <div className="flex items-center gap-4">
          <button onClick={() => setPage('kural')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft/></button>
          <h1 className="text-2xl font-bold text-[#800000]">அறிமுகம் (History)</h1>
       </div>
       
       <div className="parchment p-8 rounded-[3rem] shadow-md space-y-6 text-gray-700 leading-relaxed font-medium">
          <div className="text-center">
            <ValluvarIcon className="w-24 h-24 mx-auto text-[#800000] mb-4"/>
            <h2 className="text-2xl font-bold text-[#800000]">திவள்ளுவர் (Thiruvalluvar)</h2>
          </div>
          
          <p>The Thirukkural is a masterpiece of Tamil literature, consisting of 1330 couplets (kurals) dealing with the everyday virtues of an individual.</p>
          
          <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 space-y-4">
            <h3 className="font-bold text-[#800000] flex items-center gap-2"><Database size={18}/> Structure:</h3>
            <ul className="text-sm space-y-2">
              <li>• <b>Arathuppaal (அறத்துப்பால்)</b>: 38 Chapters on Virtue</li>
              <li>• <b>Porutpaal (பொருட்பால்)</b>: 70 Chapters on Governance & Wealth</li>
              <li>• <b>Kaamathuppaal (காமத்துப்பால்)</b>: 25 Chapters on Love</li>
            </ul>
          </div>

          <p>Authored by the divine poet <b>Tiruvalluvar</b>, it is known as the "Tamil Veda" or the "Universal Manual for Living." It has been translated into over 80 languages, highlighting its timeless relevance.</p>

          <button 
            onClick={() => setPage('kural')}
            className="w-full py-5 bg-[#800000] text-white rounded-2xl font-black text-xl shadow-lg"
          >
            படிக்க தொடங்கு (Start Reading)
          </button>
       </div>
    </div>
  );

  const VarisaiListView = () => (
    <div className="space-y-6 animate-slide-up pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => setPage('home')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft/></button>
        <h1 className="text-2xl font-bold text-[#800000]">அகர வரிசை (Series)</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 parchment p-6 rounded-[2rem] shadow-sm">
          <h2 className="text-lg font-bold text-[#800000] mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-[#FF9933]"/> உயிரெழுத்துக்கள் (Vowels)
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {ALPHABET.vowels.map(v => (
              <button 
                key={v.char} 
                onClick={() => speak(v.char, true)}
                className="aspect-square bg-white border border-orange-100 rounded-2xl flex items-center justify-center text-3xl font-black text-[#800000] hover:bg-orange-50 active:scale-90 transition-all shadow-sm"
              >
                {v.char}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <h2 className="text-lg font-bold text-[#800000] mb-4 flex items-center gap-2 px-2">
            <Layers size={18} className="text-[#FF9933]"/> உயிர்மெய் வரிசைகள் (Compound)
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {ALPHABET.consonants.map(c => (
              <button 
                key={c.char} 
                onClick={() => { setSelectedConsonant(c); setPage('varisai-explorer'); }}
                className="parchment p-6 rounded-[2rem] text-center space-y-2 group gold-border shadow-sm active:scale-95 transition-all"
              >
                <div className="w-12 h-12 bg-[#800000] text-white rounded-2xl flex items-center justify-center mx-auto text-2xl font-black shadow-lg group-hover:bg-[#FF9933] transition-colors">
                  {c.char}
                </div>
                <h3 className="font-bold text-[#800000] text-lg">{c.base} வரிசை</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{c.eng} Series</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const VarisaiExplorer = () => {
    if (!selectedConsonant) return null;
    const series = ALPHABET.mods.map(mod => selectedConsonant.base + mod);

    return (
      <div className="space-y-8 animate-slide-up pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setPage('varisai')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft/></button>
            <div>
              <h1 className="text-2xl font-bold text-[#800000]">{selectedConsonant.base} வரிசை</h1>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{selectedConsonant.eng} Series Explorer</p>
            </div>
          </div>
          <div className="w-12 h-12 bg-[#800000]/10 rounded-2xl flex items-center justify-center text-[#800000] font-black text-2xl">
            {selectedConsonant.char}
          </div>
        </div>

        <div className="parchment p-8 rounded-[3rem] shadow-xl space-y-8 border-b-4 border-b-[#800000]/20">
          <div className="text-center space-y-4">
            <p className="text-xs font-bold text-[#FF9933] uppercase tracking-[0.2em]">Formation Logic</p>
            <div className="flex items-center justify-center gap-6 text-4xl font-black text-[#800000]">
              <span className="bg-white p-6 rounded-3xl shadow-md border-2 border-orange-50">{selectedConsonant.char}</span>
              <Plus className="text-gray-300" size={32}/>
              <span className="bg-white p-6 rounded-3xl shadow-md border-2 border-orange-50">அ</span>
              <span className="text-gray-300">=</span>
              <span className="bg-[#800000] text-white p-6 rounded-3xl shadow-lg border-4 border-orange-100">{selectedConsonant.base}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {series.map((letter, i) => (
              <button 
                key={i} 
                onClick={() => { speak(letter, true); setXp(x => x + 2); }}
                className="aspect-square bg-white border-2 border-orange-50 rounded-[2rem] flex flex-col items-center justify-center gap-1 active:scale-90 transition-all shadow-sm hover:border-[#FF9933] group"
              >
                <span className="text-3xl font-black text-[#800000] group-hover:scale-110 transition-transform">{letter}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{ALPHABET.vowels[i].char} sound</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const SyllableModal = ({ word, onClose }: { word: any, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="parchment w-full max-w-sm rounded-[3rem] p-8 space-y-8 animate-slide-up relative overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"><X size={20}/></button>
        
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-[#FF9933] uppercase tracking-[0.3em]">Syllable Learning (Slit)</p>
          <h2 className="text-5xl font-black text-[#800000]">{word.tamil}</h2>
          <p className="text-lg text-gray-500 font-medium italic">"{word.eng}" — {word.meaning}</p>
        </div>

        <div className="space-y-4">
           <div className="flex flex-wrap justify-center gap-3">
             {word.syllables.map((s: string, idx: number) => (
               <button 
                 key={idx} 
                 onClick={() => speak(s, true)}
                 className="w-16 h-16 bg-white gold-border rounded-2xl flex items-center justify-center text-3xl font-black text-[#800000] hover:bg-[#800000] hover:text-white transition-all shadow-lg active:scale-90"
               >
                 {s}
               </button>
             ))}
           </div>
           <p className="text-center text-xs text-gray-400 font-bold">Tap each part to hear the split sound</p>
        </div>

        <button 
          onClick={() => { speak(word.tamil); setXp(x => x + 10); }}
          className="w-full py-5 bg-[#800000] text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Volume2 size={24}/> முழுமையாக கேள் (Listen All)
        </button>
      </div>
    </div>
  );

  // --- Main View Logic ---

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#fdfaf6]">
        <div className="relative group cursor-pointer mb-6" onClick={() => speak("செம்மொழி தமிழ்")}>
          <div className="absolute inset-0 bg-[#800000] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <ValluvarIcon className="w-24 h-24 text-[#800000] relative" />
        </div>
        <h1 className="text-5xl font-black text-[#800000] mb-2">செம்மொழி</h1>
        <p className="text-[#FF9933] font-bold uppercase tracking-[0.3em] text-xs mb-10">Classical Tamil Master</p>
        <div className="w-full max-w-sm parchment p-8 rounded-[3.5rem] shadow-2xl space-y-6 border-b-8 border-b-orange-100">
          <input 
            type="text" placeholder="உமது பெயர்" 
            className="w-full p-4 bg-orange-50/50 border-2 border-orange-100 rounded-2xl focus:border-[#FF9933] outline-none font-bold placeholder:text-gray-300 transition-all"
            onChange={(e) => setUser({ email: e.target.value })}
          />
          <button 
            onClick={() => user && setPage('home')}
            className="w-full bg-[#800000] text-white py-5 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all"
          >
            தொடங்கு (Start)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#fdfaf6] overflow-x-hidden">
      {selectedWord && <SyllableModal word={selectedWord} onClose={() => setSelectedWord(null)} />}

      <header className="px-6 pt-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#800000] rounded-2xl flex items-center justify-center text-white shadow-xl">
             <ValluvarIcon className="w-10 h-10"/>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#800000]">வாழ்க தமிழ்!</h2>
            <p className="text-[10px] font-black text-[#FF9933] uppercase tracking-widest">{user.email || "மாணவர்"}</p>
          </div>
        </div>
        <div className="flex gap-2">
           {isSpeaking && (
              <div className="flex items-center gap-1 px-3 bg-[#800000] text-white rounded-full animate-pulse">
                <Volume2 size={12}/> <span className="text-[8px] font-black uppercase">Playing</span>
              </div>
           )}
          <div className="bg-white px-3 py-2 rounded-2xl border border-orange-100 flex items-center gap-2 shadow-sm">
            <Sparkles size={14} className="text-[#FF9933]"/>
            <span className="font-black text-[#FF9933]">{xp}</span>
          </div>
        </div>
      </header>

      <main className="px-6 pb-32">
        {page === 'home' && (
          <div className="space-y-8 animate-slide-up">
             <section className="bg-gradient-to-br from-[#800000] to-[#b30000] rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl group cursor-pointer" onClick={() => setPage('kural')}>
               <div className="relative z-10">
                 <h3 className="text-3xl font-bold mb-2">இன்றைய குறள்</h3>
                 <p className="text-white/60 mb-6 text-sm font-medium">Daily Wisdom Card</p>
                 <p className="tamil-font text-xl leading-relaxed font-bold mb-6 italic group-hover:scale-105 transition-transform origin-left">
                   "அகர முதல எழுத்தெல்லாம் ஆதி<br/>பகவன் முதற்றே உலகு."
                 </p>
                 <button className="bg-[#FF9933] text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Browse Library</button>
               </div>
               <Book size={240} className="absolute -bottom-24 -right-24 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
             </section>

             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setPage('varisai')} className="parchment p-7 rounded-[3rem] text-left space-y-4 group gold-border shadow-md border-b-8 border-b-orange-50">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><Languages size={24}/></div>
                  <div>
                    <h3 className="font-bold text-blue-900 text-lg">அகர வரிசை</h3>
                    <p className="text-[10px] font-black text-gray-300 uppercase">Alphabet Grid</p>
                  </div>
                </button>
                <button onClick={() => setPage('words')} className="parchment p-7 rounded-[3rem] text-left space-y-4 group gold-border shadow-md border-b-8 border-b-orange-50">
                  <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><Layers size={24}/></div>
                  <div>
                    <h3 className="font-bold text-purple-900 text-lg">சொற்கள்</h3>
                    <p className="text-[10px] font-black text-gray-300 uppercase">Vocab Slit</p>
                  </div>
                </button>
                <button onClick={() => setPage('kural')} className="parchment p-7 rounded-[3rem] text-left space-y-4 group gold-border shadow-md border-b-8 border-b-orange-50">
                  <div className="w-12 h-12 bg-[#800000] rounded-2xl flex items-center justify-center text-white shadow-lg"><BookOpen size={24}/></div>
                  <div>
                    <h3 className="font-bold text-[#800000] text-lg">திருக்குறள்</h3>
                    <p className="text-[10px] font-black text-gray-300 uppercase">Universal Book</p>
                  </div>
                </button>
                <button onClick={() => setPage('audio-lab')} className="parchment p-7 rounded-[3rem] text-left space-y-4 group gold-border shadow-md border-b-8 border-b-orange-50">
                  <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><Headphones size={24}/></div>
                  <div>
                    <h3 className="font-bold text-orange-900 text-lg">ஒலிக் கூடம்</h3>
                    <p className="text-[10px] font-black text-gray-300 uppercase">Audio Lab</p>
                  </div>
                </button>
             </div>
          </div>
        )}

        {page === 'kural' && <KuralLibrary />}
        {page === 'kural-intro' && <KuralIntro />}
        {page === 'varisai' && <VarisaiListView />}
        {page === 'varisai-explorer' && <VarisaiExplorer />}
        
        {page === 'words' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center gap-4">
              <button onClick={() => setPage('home')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft/></button>
              <h1 className="text-3xl font-bold text-[#800000]">சொற்கள் (Vocab)</h1>
            </div>
            <div className="space-y-4">
               {WORDS_DATABASE.map((w, i) => (
                 <div key={i} className="parchment p-5 rounded-[2rem] flex items-center justify-between group active:scale-95 transition-all shadow-sm" onClick={() => setSelectedWord(w)}>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#FF9933] group-hover:bg-[#FF9933] group-hover:text-white transition-all"><Play size={20} fill="currentColor"/></div>
                       <div>
                          <h4 className="text-2xl font-bold text-[#800000]">{w.tamil}</h4>
                          <p className="text-[10px] text-gray-400 font-black uppercase">{w.eng} — {w.meaning}</p>
                       </div>
                    </div>
                    <div className="text-[9px] font-black text-[#FF9933] uppercase bg-orange-50 px-3 py-1.5 rounded-full">{w.cat}</div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {page === 'audio-lab' && (
          <div className="space-y-8 animate-slide-up">
            <div className="flex items-center gap-4">
              <button onClick={() => setPage('home')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft/></button>
              <h1 className="text-2xl font-bold text-[#800000]">ஒலிக் கூடம் (Audio Lab)</h1>
            </div>
            <div className="parchment p-8 rounded-[3rem] text-center space-y-6">
              <div className="w-32 h-32 mx-auto bg-orange-50 rounded-full flex items-center justify-center text-[#FF9933] shadow-inner">
                <Volume2 size={64} className={isSpeaking ? "animate-bounce" : ""}/>
              </div>
              <h2 className="text-xl font-bold text-[#800000]">AI Tamil Narrator</h2>
              <p className="text-sm text-gray-500 font-medium">Type any Tamil text below and our AI will pronounce it perfectly.</p>
              <textarea 
                className="w-full p-6 bg-gray-50 border-2 border-orange-100 rounded-3xl outline-none focus:border-[#FF9933] font-bold text-[#800000] text-lg"
                placeholder="உதாரணம்: தமிழ் இனிது"
                rows={3}
                id="lab-input"
              />
              <button 
                onClick={() => {
                  const val = (document.getElementById('lab-input') as HTMLTextAreaElement).value;
                  if (val) speak(val);
                }}
                className="w-full py-5 bg-[#800000] text-white rounded-2xl font-black text-xl shadow-lg active:scale-95"
              >
                கேட்க (Listen)
              </button>
            </div>
          </div>
        )}

        {page === 'profile' && (
           <div className="space-y-10 animate-slide-up pt-4">
              <div className="text-center space-y-6">
                <div className="w-36 h-36 mx-auto bg-white rounded-full gold-border flex items-center justify-center text-[#800000] shadow-2xl relative border-8 border-orange-50">
                   <ValluvarIcon className="w-24 h-24"/>
                   <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2.5 rounded-full border-4 border-white shadow-lg"><CheckCircle2 size={24}/></div>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-[#800000]">{user.email || "மதிப்புக்குரிய மாணவர்"}</h2>
                  <p className="text-[10px] font-black text-[#FF9933] uppercase tracking-[0.5em] mt-2 italic">Heritage Protector</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="parchment p-8 rounded-[2.5rem] text-center gold-border">
                  <p className="text-[10px] font-black text-gray-300 uppercase mb-2">Total XP</p>
                  <p className="text-5xl font-black text-[#FF9933]">{xp}</p>
                </div>
                <div className="parchment p-8 rounded-[2.5rem] text-center gold-border">
                  <p className="text-[10px] font-black text-gray-300 uppercase mb-2">Streak</p>
                  <p className="text-5xl font-black text-[#800000]">{streak} 🔥</p>
                </div>
              </div>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-5 bg-red-50 text-red-500 rounded-[2.5rem] font-black text-lg flex items-center justify-center gap-2 border border-red-100"><LogOut size={22}/> வெளியேறு (Logout)</button>
           </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-6 py-10 z-[90]">
        <div className="bg-white/85 backdrop-blur-2xl rounded-[3.5rem] shadow-2xl border border-white/50 flex items-center justify-between px-10 py-5">
          <button onClick={() => setPage('home')} className={`transition-all ${page === 'home' ? 'text-[#800000] scale-125' : 'text-gray-300'}`}><Home size={30} fill={page === 'home' ? 'currentColor' : 'none'}/></button>
          <button onClick={() => setPage('varisai')} className={`transition-all ${['varisai', 'varisai-explorer'].includes(page) ? 'text-[#800000] scale-125' : 'text-gray-300'}`}><Languages size={30}/></button>
          <button onClick={() => setPage('words')} className={`transition-all ${page === 'words' ? 'text-[#800000] scale-125' : 'text-gray-300'}`}><Layers size={30}/></button>
          <button onClick={() => setPage('kural')} className={`transition-all ${['kural', 'kural-intro'].includes(page) ? 'text-[#800000] scale-125' : 'text-gray-300'}`}><Book size={30}/></button>
          <button onClick={() => setPage('profile')} className={`transition-all ${page === 'profile' ? 'text-[#800000] scale-125' : 'text-gray-300'}`}><User size={30}/></button>
        </div>
      </nav>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<SemmozhiApp />);
