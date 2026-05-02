"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles, Loader2, Image as ImageIcon, Copy, Check,
  Send, Bot, User, Megaphone, X, Video, PlaySquare, Download
} from "lucide-react";
import type { Platform, CopyVariant } from "@/types/content";
import { generateCopies, chatWithAI, generateVideoScript, type VideoScriptPart } from "@/actions/gemini";
import { renderVideoToMp4 } from "@/actions/render-video";
import { Player } from "@remotion/player";
import { MarketingVideo } from "@/components/video/MarketingVideo";

type TabMode = "chat" | "copies" | "video";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function GeneratorForm({ userId }: { userId: string }) {
  // ─── Shared State ───
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [referenceImage, setReferenceImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabMode>("chat");

  // ─── Chat State ───
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      content: "¡Hola! 👋 Soy tu asistente de marketing con IA. Puedo ayudarte a crear contenido para redes sociales, analizar imágenes, sugerir estrategias y más. ¿En qué te puedo ayudar?",
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Copies State ───
  const [objective, setObjective] = useState("");
  const [platform, setPlatform] = useState<Platform>("both");
  const [copies, setCopies] = useState<CopyVariant[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // ─── Video State ───
  const [videoObjective, setVideoObjective] = useState("");
  const [videoScript, setVideoScript] = useState<VideoScriptPart[] | null>(null);
  const [totalDuration, setTotalDuration] = useState(150);
  const [isRenderingMP4, setIsRenderingMP4] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Image Upload Handler ───
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      setReferenceImage({ base64: base64String.split(",")[1], mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setReferenceImage(null);
    setImagePreview(null);
  };

  // ─── Chat Handler ───
  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setError("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const response = await chatWithAI(userMessage, referenceImage || undefined);
      setMessages((prev) => [...prev, { role: "ai", content: response, timestamp: new Date() }]);
      // Limpiar imagen después de enviarla
      if (referenceImage) clearImage();
    } catch (err: any) {
      setError(err.message || "Error al comunicarse con la IA");
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Copies Handler ───
  async function handleGenerateCopies(e: React.FormEvent) {
    e.preventDefault();
    if (!objective.trim() || isLoading) return;

    setError("");
    setCopies(null);
    setIsLoading(true);

    try {
      const result = await generateCopies({ objective, platform, referenceImage: referenceImage || undefined });
      setCopies(result.copies);
    } catch (err: any) {
      setError(err.message || "Error al generar copies");
    } finally {
      setIsLoading(false);
    }
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // ─── Video Handler ───
  async function handleGenerateVideo(e: React.FormEvent) {
    e.preventDefault();
    if (!videoObjective.trim() || isLoading) return;

    setError("");
    setVideoScript(null);
    setIsLoading(true);

    try {
      const script = await generateVideoScript(videoObjective, referenceImage || undefined);
      setVideoScript(script);
      setTotalDuration(script.reduce((acc, part) => acc + part.durationInFrames, 0));
    } catch (err: any) {
      setError(err.message || "Error al generar guion del video");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownloadMP4() {
    if (!videoScript || !imagePreview || isRenderingMP4) return;
    
    setIsRenderingMP4(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("imageSrc", imagePreview);
      formData.append("script", JSON.stringify(videoScript));
      formData.append("durationInFrames", totalDuration.toString());

      const url = await renderVideoToMp4(formData);
      
      // Trigger browser download
      const a = document.createElement("a");
      a.href = url;
      a.download = "Anuncio-WTII-Idiomas.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || "Error al renderizar el video");
    } finally {
      setIsRenderingMP4(false);
    }
  }

  return (
    <div className="space-y-6 animate-card-enter">
      {/* Tabs */}
      <div className="flex gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1.5 w-fit">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "chat"
              ? "bg-purple-500/20 text-purple-300 shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Bot size={16} />
          Chat con IA
        </button>
        <button
          onClick={() => setActiveTab("copies")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "copies"
              ? "bg-amber-500/20 text-amber-300 shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Megaphone size={16} />
          Generar Copies
        </button>
        <button
          onClick={() => setActiveTab("video")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "video"
              ? "bg-pink-500/20 text-pink-300 shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <PlaySquare size={16} />
          Generar Video
        </button>
      </div>

      {/* ═══════════════ TAB: CHAT ═══════════════ */}
      {activeTab === "chat" && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl flex flex-col h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={16} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-purple-500/20 text-purple-100 rounded-tr-sm"
                      : "bg-white/[0.06] text-white/90 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={16} className="text-white/70" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white/[0.06] px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="px-6 pb-2">
              <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-8 h-8 object-cover rounded" />
                <span className="text-xs text-white/60">Imagen adjunta</span>
                <button onClick={clearImage} className="text-white/40 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-6 pb-2">
              <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleChat} className="p-4 border-t border-white/10 flex gap-3 items-end">
            {/* Upload Image Button */}
            <label className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all cursor-pointer shrink-0">
              <ImageIcon size={20} />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Pregúntale algo a la IA..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={isLoading || !chatInput.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════ TAB: COPIES ═══════════════ */}
      {activeTab === "copies" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-5">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                <Sparkles className="text-amber-400" size={20} />
                Parámetros del Anuncio
              </h2>

              <form onSubmit={handleGenerateCopies} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Objetivo del anuncio</label>
                  <textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="Ej. Promocionar curso de inglés intensivo 2x1 para San Valentín..."
                    className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-purple-500/50 transition-all"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Plataforma</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["facebook", "instagram", "both"] as Platform[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatform(p)}
                        disabled={isLoading}
                        className={`py-2 text-sm rounded-lg border transition-all ${
                          platform === p
                            ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        {p === "both" ? "Ambas" : p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Imagen referencia */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Imagen referencia (Opcional)</label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      disabled={isLoading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-full flex items-center justify-center p-4 border border-dashed rounded-xl transition-all ${
                      imagePreview ? "border-purple-500/50 bg-purple-500/5" : "border-white/10 bg-white/5 group-hover:border-white/30"
                    }`}>
                      {imagePreview ? (
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imagePreview} alt="Preview" className="w-10 h-10 object-cover rounded-md" />
                          <span className="text-sm text-purple-300 font-medium">Imagen seleccionada</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center gap-1">
                          <ImageIcon className="text-white/40" size={20} />
                          <span className="text-sm text-white/60">Subir imagen como referencia</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !objective.trim()}
                  className="w-full py-3.5 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-amber-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Generando copies...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generar 3 Variantes
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-7">
            {!copies && !isLoading && (
              <div className="h-full min-h-[400px] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-white/[0.02]">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Megaphone className="text-white/20" size={32} />
                </div>
                <h3 className="text-lg font-medium text-white/60 mb-2">Sin copies aún</h3>
                <p className="text-sm text-white/40 max-w-sm">
                  Describe el objetivo de tu campaña y Gemini generará 3 variantes de texto optimizadas.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="h-full min-h-[400px] border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-white/[0.04]">
                <Loader2 className="animate-spin text-purple-500 mb-4" size={40} />
                <h3 className="text-lg font-medium text-white animate-pulse">Generando copies...</h3>
                <p className="text-sm text-white/50 mt-2">Gemini está creando textos persuasivos.</p>
              </div>
            )}

            {copies && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-medium text-white flex items-center gap-2 px-2">
                  <Copy size={18} className="text-blue-400" />
                  Textos Generados
                </h3>
                {copies.map((copy, index) => (
                  <div key={index} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 hover:bg-white/[0.06] transition-colors relative group">
                    <button
                      onClick={() => copyToClipboard(copy.body, index)}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Copiar texto"
                    >
                      {copiedIndex === index ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                    <span className="inline-block px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs font-medium mb-3">
                      Variante {index + 1}
                    </span>
                    {copy.headline && (
                      <h4 className="font-semibold text-white mb-2">{copy.headline}</h4>
                    )}
                    <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{copy.body}</p>
                    {copy.cta && (
                      <div className="mt-4 inline-block px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium uppercase tracking-wider">
                        CTA: {copy.cta}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ TAB: VIDEO ═══════════════ */}
      {activeTab === "video" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                <Video className="text-pink-400" size={20} />
                Generador de Video IA
              </h2>

              <form onSubmit={handleGenerateVideo} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">¿De qué trata tu video?</label>
                  <textarea
                    value={videoObjective}
                    onChange={(e) => setVideoObjective(e.target.value)}
                    placeholder="Ej. Crear un Reel invitando a jóvenes a inscribirse a clases de inglés..."
                    className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-pink-500/50 transition-all"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Imagen de Fondo (Requerida)</label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      disabled={isLoading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-full flex items-center justify-center p-4 border border-dashed rounded-xl transition-all ${
                      imagePreview ? "border-pink-500/50 bg-pink-500/5" : "border-white/10 bg-white/5 group-hover:border-white/30"
                    }`}>
                      {imagePreview ? (
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imagePreview} alt="Preview" className="w-10 h-10 object-cover rounded-md" />
                          <span className="text-sm text-pink-300 font-medium">Fondo seleccionado</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center gap-1">
                          <ImageIcon className="text-white/40" size={20} />
                          <span className="text-sm text-white/60">Subir imagen 1080x1920 o 1080x1080</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !videoObjective.trim() || !imagePreview}
                  className="w-full py-3.5 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Creando video...
                    </>
                  ) : (
                    <>
                      <PlaySquare size={18} />
                      Generar Video IA
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            {!videoScript && !isLoading && (
              <div className="h-full min-h-[400px] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-white/[0.02]">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Video className="text-white/20" size={32} />
                </div>
                <h3 className="text-lg font-medium text-white/60 mb-2">Sin video aún</h3>
                <p className="text-sm text-white/40 max-w-sm">
                  Describe tu video, sube una imagen y la IA creará una secuencia animada lista para publicarse.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="h-full min-h-[400px] border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-white/[0.04]">
                <Loader2 className="animate-spin text-pink-500 mb-4" size={40} />
                <h3 className="text-lg font-medium text-white animate-pulse">Escribiendo guion y renderizando...</h3>
              </div>
            )}

            {videoScript && imagePreview && (
              <div className="space-y-4 animate-fade-in flex flex-col items-center">
                <h3 className="font-medium text-white flex items-center gap-2 px-2 w-full">
                  <Sparkles size={18} className="text-pink-400" />
                  Video Generado
                </h3>
                
                <div className="bg-black border border-white/[0.08] rounded-2xl overflow-hidden w-full max-w-[360px] aspect-[9/16] relative flex items-center justify-center">
                  <Player
                    component={MarketingVideo}
                    inputProps={{ imageSrc: imagePreview, script: videoScript }}
                    durationInFrames={totalDuration}
                    fps={30}
                    compositionWidth={1080}
                    compositionHeight={1920}
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                    controls
                    autoPlay
                    loop
                  />
                </div>
                
                <button
                  onClick={handleDownloadMP4}
                  disabled={isRenderingMP4}
                  className="w-full max-w-[360px] py-3 mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
                >
                  {isRenderingMP4 ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Renderizando MP4 (puede tardar un minuto)...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Descargar Video (MP4)
                    </>
                  )}
                </button>
                
                <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 mt-4">
                  <h4 className="text-sm font-medium text-white/70 mb-2">Guion Generado:</h4>
                  <ul className="space-y-2">
                    {videoScript.map((part, i) => (
                      <li key={i} className="text-sm text-white/90 bg-white/5 p-2 rounded-lg">
                        <span className="text-pink-400 text-xs font-mono mr-2">[{part.durationInFrames}f]</span>
                        {part.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
