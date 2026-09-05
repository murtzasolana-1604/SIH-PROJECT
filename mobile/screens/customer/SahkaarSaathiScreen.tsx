import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../constants/theme';
import { apiService } from '../../services/api';
import { VoiceService } from '../../services/voice';
import { ChatMessage } from '../../types/api';

interface Props {
  onBack: () => void;
  onNavigateToBooking?: (serviceName?: string) => void;
  onNavigateToEmergency?: () => void;
}

export const SahkaarSaathiScreen: React.FC<Props> = ({
  onBack,
  onNavigateToBooking,
  onNavigateToEmergency,
}) => {
  const { t, language } = useLanguage();
  const { customerProfile } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        language === 'hi'
          ? `नमस्ते ${customerProfile?.name || ''}! मैं सहकार साथी हूँ — आपका सहकारी सेवा सहायक। मैं इलेक्ट्रीशियन, प्लंबर या आपातकालीन सेवा खोजने में आपकी मदद कर सकता हूँ।`
          : `Hello ${customerProfile?.name || ''}! I am Sahkaar Saathi, your cooperative AI assistant. Ask me to find verified workers, book services, or explain our fair-wage pricing.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions:
        language === 'hi'
          ? ['इलेक्ट्रीशियन चाहिए', 'प्लंबिंग इमरजेंसी', 'सहकारी दरें क्या हैं?', 'मेरी बुकिंग्स']
          : ['Find Electrician', 'Plumber Emergency', 'How pricing works?', 'Check my bookings'],
    },
  ]);

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await apiService.postChatbotMessage(text, language, 'customer');

      const botMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: response.intent,
        suggestions: response.suggestions,
        action: response.action,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const fallbackReply =
        language === 'hi'
          ? 'माफ़ कीजिए, सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।'
          : 'Sorry, could not connect to Sahkaar server. Please try again.';

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    try {
      const recognized = await VoiceService.simulateVoiceInput(language);
      setIsListening(false);
      if (recognized) {
        setInput(recognized);
        handleSend(recognized);
      }
    } catch {
      setIsListening(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content:
          language === 'hi'
            ? 'बातचीत रीसेट हो गई है। मैं आपकी क्या मदद कर सकता हूँ?'
            : 'Conversation restarted. How can I help you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions:
          language === 'hi'
            ? ['इलेक्ट्रीशियन चाहिए', 'प्लंबिंग इमरजेंसी', 'किराया विवरण']
            : ['Find Electrician', 'Emergency Help', 'Pricing details'],
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Header
        title={t('sahkaarSaathi')}
        subtitle={language === 'hi' ? 'एआई सहकार साथी • ऑनलाइन' : 'AI Assistant • Online'}
        onBack={onBack}
        rightElement={
          <TouchableOpacity onPress={handleClearChat} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        }
      />

      {/* Trust banner */}
      <View style={styles.banner}>
        <Ionicons name="sparkles" size={16} color={COLORS.primary} />
        <Text style={styles.bannerText}>
          {language === 'hi'
            ? 'सहकार साथी राष्ट्रीय सहकारिता नीति के अनुसार उचित दरें सुझाता है।'
            : 'Sahkaar Saathi recommends fair cooperative pricing under Ministry guidelines.'}
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowBot,
              ]}
            >
              {!isUser && (
                <View style={styles.avatarContainer}>
                  <Ionicons name="shield-checkmark" size={18} color={COLORS.surface} />
                </View>
              )}

              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                <Text style={[styles.bubbleText, isUser ? styles.textUser : styles.textBot]}>
                  {msg.content}
                </Text>
                <Text style={[styles.timestamp, isUser ? styles.tsUser : styles.tsBot]}>
                  {msg.timestamp}
                </Text>

                {/* Intent based quick action card */}
                {!isUser && msg.action && (
                  <View style={styles.actionBox}>
                    {msg.action === 'book_service' && onNavigateToBooking && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => onNavigateToBooking()}
                      >
                        <Ionicons name="calendar-outline" size={16} color={COLORS.surface} />
                        <Text style={styles.actionBtnText}>{t('bookNow')}</Text>
                      </TouchableOpacity>
                    )}
                    {msg.action === 'emergency_sos' && onNavigateToEmergency && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: COLORS.danger }]}
                        onPress={onNavigateToEmergency}
                      >
                        <Ionicons name="warning-outline" size={16} color={COLORS.surface} />
                        <Text style={styles.actionBtnText}>{t('emergencySos')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Suggestions pill list */}
                {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                  <View style={styles.suggestionsWrapper}>
                    {msg.suggestions.map((sug, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionChip}
                        onPress={() => handleSend(sug)}
                      >
                        <Text style={styles.suggestionChipText}>{sug}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {loading && (
          <View style={[styles.messageRow, styles.messageRowBot]}>
            <View style={styles.avatarContainer}>
              <Ionicons name="shield-checkmark" size={18} color={COLORS.surface} />
            </View>
            <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.typingText}>
                {language === 'hi' ? 'सहकार साथी सोच रहा है...' : 'Sahkaar Saathi is thinking...'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Voice listening overlay */}
      {isListening && (
        <View style={styles.listeningOverlay}>
          <Animated.View
            style={[
              styles.listeningCircle,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Ionicons name="mic" size={36} color={COLORS.surface} />
          </Animated.View>
          <Text style={styles.listeningText}>
            {language === 'hi' ? 'सुन रहा हूँ... बोलिए' : 'Listening... Speak now'}
          </Text>
          <TouchableOpacity
            style={styles.cancelListeningBtn}
            onPress={() => setIsListening(false)}
          >
            <Text style={styles.cancelListeningText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input row */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={[styles.voiceBtn, isListening && styles.voiceBtnActive]}
          onPress={handleVoiceToggle}
          accessibilityLabel="Voice search"
        >
          <Ionicons
            name={isListening ? 'mic' : 'mic-outline'}
            size={22}
            color={isListening ? COLORS.danger : COLORS.primary}
          />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder={
            language === 'hi' ? 'सहकार साथी से कुछ भी पूछें...' : 'Ask Sahkaar Saathi anything...'
          }
          placeholderTextColor={COLORS.textTertiary}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          multiline={false}
        />

        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || loading}
        >
          <Ionicons
            name="send"
            size={18}
            color={input.trim() ? COLORS.surface : COLORS.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  clearBtn: {
    padding: SPACING.xs,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  bannerText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  bubbleBot: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  bubbleText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
  textUser: {
    color: COLORS.surface,
  },
  textBot: {
    color: COLORS.textPrimary,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  tsUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tsBot: {
    color: COLORS.textTertiary,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  typingText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  suggestionsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  suggestionChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  suggestionChipText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },
  actionBox: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  actionBtnText: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
  },
  listeningOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.lg,
    borderWidth: 2,
    borderColor: COLORS.danger,
    zIndex: 100,
  },
  listeningCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  listeningText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  cancelListeningBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  cancelListeningText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  voiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceBtnActive: {
    backgroundColor: COLORS.dangerLight,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.border,
  },
});
