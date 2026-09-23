import React, { useState, useRef } from 'react';
import { ShinerayLogo } from './ShinerayLogo';
import { 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  RotateCcw, 
  Check, 
  X, 
  Info, 
  Sun, 
  Moon, 
  Trash2,
  Sparkles
} from 'lucide-react';

interface LogoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customLogoLight: string | null;
  customLogoDark: string | null;
  currentTheme: 'light' | 'dark';
  onSaveLogos: (lightUrl: string | null, darkUrl: string | null) => void;
}

// Helper function to resize image to max 400px width/height while keeping transparency
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw preserving transparency
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Keep as png to preserve alpha
        const dataUrl = canvas.toDataURL('image/png', 0.92);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
  });
};

export const LogoManagerModal: React.FC<LogoManagerModalProps> = ({
  isOpen,
  onClose,
  customLogoLight,
  customLogoDark,
  currentTheme,
  onSaveLogos,
}) => {
  const [activeTab, setActiveTab] = useState<'light' | 'dark'>(currentTheme);
  const [previewLight, setPreviewLight] = useState<string | null>(customLogoLight);
  const [previewDark, setPreviewDark] = useState<string | null>(customLogoDark);
  const [urlInput, setUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRefLight = useRef<HTMLInputElement>(null);
  const fileInputRefDark = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File, mode: 'light' | 'dark') => {
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('O arquivo selecionado é maior que 8MB. Escolha uma imagem menor.');
      return;
    }

    try {
      const optimizedDataUrl = await compressImage(file);
      if (mode === 'light') {
        setPreviewLight(optimizedDataUrl);
      } else {
        setPreviewDark(optimizedDataUrl);
      }
      setErrorMsg(null);
    } catch {
      setErrorMsg('Não foi possível processar a imagem. Tente outro formato.');
    }
  };

  const handleApplyUrl = (mode: 'light' | 'dark') => {
    if (!urlInput.trim()) {
      setErrorMsg('Insira uma URL válida da imagem.');
      return;
    }
    if (mode === 'light') {
      setPreviewLight(urlInput.trim());
    } else {
      setPreviewDark(urlInput.trim());
    }
    setUrlInput('');
    setErrorMsg(null);
  };

  const handleSave = () => {
    onSaveLogos(previewLight, previewDark);
    onClose();
  };

  const handleResetBoth = () => {
    setPreviewLight(null);
    setPreviewDark(null);
    setUrlInput('');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-xl w-full shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E30613] text-white rounded-lg shadow-sm">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Personalizar Logotipos Shineray</span>
                <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-[#E30613] dark:text-red-400 font-bold px-2 py-0.5 rounded-full uppercase">
                  Modo Claro & Escuro
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Configure versões diferentes da logo para fundos claros e fundos escuros
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Side-by-side Dual Live Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                Pré-visualização em Tempo Real
              </label>
              <span className="text-[11px] text-neutral-400">
                Tema atual no sistema: <strong className="text-neutral-700 dark:text-neutral-200 uppercase">{currentTheme}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-100 dark:bg-neutral-800/70 rounded-xl border border-neutral-200 dark:border-neutral-700">
              {/* Light background preview */}
              <div 
                onClick={() => setActiveTab('light')}
                className={`p-3 bg-white rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-center min-h-[85px] relative ${
                  activeTab === 'light' 
                    ? 'ring-2 ring-[#E30613] border-transparent shadow-sm' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-bold uppercase mb-2">
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span>Modo Claro</span>
                  {previewLight ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Imagem personalizada ativa" />
                  ) : (
                    <span className="text-[9px] text-neutral-400 font-normal">(Padrão)</span>
                  )}
                </div>
                <ShinerayLogo size="md" customLogoUrl={previewLight} theme="light" />
              </div>

              {/* Dark background preview */}
              <div 
                onClick={() => setActiveTab('dark')}
                className={`p-3 bg-neutral-950 rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-center min-h-[85px] relative ${
                  activeTab === 'dark' 
                    ? 'ring-2 ring-[#E30613] border-transparent shadow-sm' 
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-bold uppercase mb-2">
                  <Moon className="w-3 h-3 text-blue-400" />
                  <span>Modo Escuro</span>
                  {previewDark ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Imagem personalizada ativa" />
                  ) : (
                    <span className="text-[9px] text-neutral-500 font-normal">(Padrão)</span>
                  )}
                </div>
                <ShinerayLogo size="md" customLogoUrl={previewDark} theme="dark" />
              </div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setActiveTab('light')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'light'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Configurar Imagem do Modo Claro</span>
              {previewLight && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dark')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'dark'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Moon className="w-4 h-4 text-blue-400" />
              <span>Configurar Imagem do Modo Escuro</span>
              {previewDark && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </button>
          </div>

          {/* Configuration Form for Selected Tab */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                {activeTab === 'light' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Logo para Modo Claro (fundo branco/cinza)</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-blue-400" />
                    <span>Logo para Modo Escuro (fundo escuro/preto)</span>
                  </>
                )}
              </span>

              {/* Individual Reset button */}
              {(activeTab === 'light' ? previewLight : previewDark) && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'light') setPreviewLight(null);
                    else setPreviewDark(null);
                  }}
                  className="text-[11px] text-red-600 hover:text-red-700 dark:text-red-400 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Restaurar padrão deste modo</span>
                </button>
              )}
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRefLight}
              type="file"
              accept="image/png, image/jpeg, image/svg+xml, image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f, 'light');
              }}
              className="hidden"
            />
            <input
              ref={fileInputRefDark}
              type="file"
              accept="image/png, image/jpeg, image/svg+xml, image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f, 'dark');
              }}
              className="hidden"
            />

            {/* Upload Button */}
            <div>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'light') fileInputRefLight.current?.click();
                  else fileInputRefDark.current?.click();
                }}
                className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#E30613] dark:hover:border-[#E30613] bg-white dark:bg-neutral-800 hover:bg-red-50/20 transition-all flex items-center justify-center gap-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-200 group"
              >
                <Upload className="w-4 h-4 text-neutral-400 group-hover:text-[#E30613]" />
                <span>
                  {activeTab === 'light'
                    ? 'Enviar arquivo de imagem para o Modo Claro'
                    : 'Enviar arquivo de imagem para o Modo Escuro (ex: logo branca/invertida)'}
                </span>
              </button>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                Formatos aceitos: PNG transparente, SVG, JPG ou WebP.
              </p>
            </div>

            {/* URL Input */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                Ou cole o link direto da imagem ({activeTab === 'light' ? 'Modo Claro' : 'Modo Escuro'})
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={`https://exemplo.com/shineray-${activeTab}.png`}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#E30613]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyUrl(activeTab)}
                  className="px-3.5 py-2 text-xs font-bold bg-neutral-900 dark:bg-neutral-700 text-white hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Carregar
                </button>
              </div>
            </div>
          </div>

          {/* Explanatory banner */}
          <div className="p-3.5 bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-300 text-xs flex gap-2.5">
            <Info className="w-4 h-4 text-[#E30613] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed space-y-1">
              <span className="font-bold text-neutral-900 dark:text-white block">
                Dica de identidade visual:
              </span>
              No <strong>Modo Claro</strong>, utilize uma versão com tipografia escura ou vermelha. No <strong>Modo Escuro</strong>, utilize uma versão com tipografia branca/clara ou o símbolo vazado sobre fundo escuro para máximo contraste e legibilidade.
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-red-600 dark:text-red-400">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetBoth}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-700 transition-colors"
            title="Redefinir ambos os modos para o emblema vetorial nativo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Redefinir Ambos</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold bg-[#E30613] hover:bg-[#C40510] text-white rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Logotipos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
