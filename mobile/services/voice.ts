/**
 * Voice Interaction Service for Mobile
 * Provides mobile-compatible voice query input for Sahkaar Saathi
 */

export interface VoiceRecognitionResult {
  transcript: string;
  language: "en" | "hi";
}

export const VoiceService = {
  // Check if voice input is available on the current device
  isAvailable(): boolean {
    return true;
  },

  // Sample quick vocal prompts for Hindi and English
  getVoicePrompts(language: "en" | "hi"): string[] {
    if (language === "hi") {
      return [
        "🚰 'मुझे कल सुबह प्लंबर चाहिए'",
        "⚡ 'बिजली का स्विच बोर्ड स्पार्क कर रहा है'",
        "🚨 'आपातकालीन एसओएस सेवा सक्रिय करें'",
        "💰 'सहकार कनेक्ट की मजदूरी दरें क्या हैं?'"
      ];
    }
    return [
      "🚰 'I need a plumber tomorrow morning'",
      "⚡ 'Switchboard is sparking, need an electrician'",
      "🚨 'Activate 1-Click Emergency SOS'",
      "💰 'Explain fair-wage cooperative pricing'"
    ];
  },

  // Process simulated speech input with voice feedback
  simulateVoiceQuery(phrase: string, language: "en" | "hi"): VoiceRecognitionResult {
    return {
      transcript: phrase.replace(/^['"🚰⚡🚨💰\s]+|['"\s]+$/g, ""),
      language
    };
  }
};
