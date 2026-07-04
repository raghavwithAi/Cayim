import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Dimensions, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowUp, Sparkles, Lightbulb, Edit3, ChevronRight, X } from 'lucide-react-native';
import AnimatedView, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay,
  Easing, FadeIn, FadeInUp,
} from 'react-native-reanimated';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/themeContext';
import { colors, spacing, typography, radius } from '@/lib/theme';

const { width: W, height: H } = Dimensions.get('window');

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const CONTEXT_LABELS: Record<string, string> = {
  goals: 'Goals',
  skills: 'Skills',
  budget: 'Budget',
  interests: 'Interests',
  location: 'Location',
  experience: 'Experience',
  preferred_business_type: 'Business Type',
  has_own_idea: 'Your Idea',
};

export default function MentorScreen() {
  const { profile, session } = useAuth();
  const { t } = useTheme();
  const username = profile?.username ?? 'Founder';
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [context, setContext] = useState<Record<string, any>>({});
  const [readyForIdeas, setReadyForIdeas] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [hasOwnIdea, setHasOwnIdea] = useState<string | null>(null);
  const [showOwnIdeaModal, setShowOwnIdeaModal] = useState(false);
  const [ownIdeaText, setOwnIdeaText] = useState('');
  const [ownIdeaLoading, setOwnIdeaLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const fadeIn = useSharedValue(0);
  const slideY = useSharedValue(20);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 600 });
    slideY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) });
    addWelcomeMessage();
  }, []);

  function addWelcomeMessage() {
    const welcome: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `Hello${username ? ` ${username}` : ''}! I'm CAYIM, your AI Business Mentor.\n\nI help aspiring entrepreneurs discover the right startup for them. What's driving you to explore entrepreneurship? Are you looking for side income, a career change, or something else?`,
      timestamp: new Date(),
    };
    setMessages([welcome]);
  }

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideY.value }],
  }));

  async function sendMessage(text?: string) {
    const messageText = (text || inputText).trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setShowActionButtons(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/mentor-chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: messageText,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(data.conversation_id);
      setContext(data.context || {});
      setReadyForIdeas(data.ready_for_ideas || false);

      if (data.ready_for_ideas && !data.ideas_generated) {
        setShowActionButtons(true);
      }

      if (data.has_own_idea) {
        setHasOwnIdea(data.has_own_idea);
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: error.message || "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }

  async function generateIdeas(useOwnIdea: boolean) {
    setLoading(true);
    setShowActionButtons(false);

    const generatingMsg: Message = {
      id: `gen-${Date.now()}`,
      role: 'assistant',
      content: "Let me think... I'm analyzing your profile and generating 5 completely unique startup ideas with different markets, revenue models, and strategies.",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, generatingMsg]);

    try {
      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/mentor-chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: '',
          conversation_id: conversationId,
          generate_ideas: true,
          user_idea: useOwnIdea ? hasOwnIdea : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate ideas');
      }

      const data = await response.json();

      if (data.ideas && data.ideas.length > 0) {
        const ideasMsg: Message = {
          id: `ideas-${Date.now()}`,
          role: 'assistant',
          content: `I've generated ${data.ideas.length} completely unique startup ideas for you! Each one is from a different industry with its own market research, revenue model, branding, and marketing strategy. Let me walk you through each one:`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, ideasMsg]);

        await new Promise(resolve => setTimeout(resolve, 500));

        router.push({
          pathname: '/ideas',
          params: { conversation_id: data.conversation_id },
        });
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: error.message || "I couldn't generate ideas right now. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      setShowActionButtons(true);
    } finally {
      setLoading(false);
    }
  }

  async function submitOwnIdea() {
    if (!ownIdeaText.trim() || ownIdeaLoading) return;

    setOwnIdeaLoading(true);
    setShowOwnIdeaModal(false);

    const userIdeaMsg: Message = {
      id: `user-idea-${Date.now()}`,
      role: 'assistant',
      content: "Preparing a comprehensive business breakdown for your idea...",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userIdeaMsg]);
    setLoading(true);

    try {
      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/mentor-chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: '',
          conversation_id: conversationId,
          skip_to_generation: true,
          user_idea: ownIdeaText.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate');
      }

      const data = await response.json();

      if (data.ideas && data.ideas.length > 0) {
        const ideasMsg: Message = {
          id: `ideas-${Date.now()}`,
          role: 'assistant',
          content: `Here's your complete business breakdown with market research, competitor analysis, revenue models, branding, AI prompts for logos and visuals, and viral marketing strategies!`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, ideasMsg]);

        await new Promise(resolve => setTimeout(resolve, 300));

        router.push({
          pathname: '/ideas',
          params: { conversation_id: data.conversation_id },
        });
      }
    } catch (error: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: error.message || "I couldn't process your idea. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setOwnIdeaLoading(false);
      setOwnIdeaText('');
    }
  }

  function renderMessage(message: Message, index: number) {
    const isUser = message.role === 'user';
    const isWelcome = message.id === 'welcome';

    return (
      <AnimatedView.View
        key={message.id}
        entering={FadeInUp.delay(index * 30).springify()}
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.assistantRow,
        ]}
      >
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
            <Sparkles size={16} color={colors.primary} strokeWidth={2} />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isUser
              ? colors.primary
              : t.isDark ? '#1A2535' : colors.white,
            borderColor: isUser ? colors.primary : t.border,
          },
          isWelcome && styles.welcomeBubble,
        ]}>
          <Text style={[
            styles.messageText,
            { color: isUser ? colors.white : t.text },
          ]}>
            {message.content}
          </Text>
        </View>
        {isUser && (
          <View style={[styles.avatarUser, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{username?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
        )}
      </AnimatedView.View>
    );
  }

  const collectedContext = Object.keys(context).filter(k => context[k] && context[k].length > 0);
  const contextProgress = Math.min(collectedContext.length / 7, 1);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: t.borderSoft }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <ArrowLeft size={22} color={t.text} strokeWidth={2} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: t.text }]}>AI Mentor</Text>
            <Text style={[styles.headerSub, { color: t.textSecondary }]}>
              {readyForIdeas ? 'Ready to generate ideas' : 'Getting to know you'}
            </Text>
          </View>
          <Sparkles size={22} color={colors.primary} strokeWidth={2} />
        </View>

        {/* Context Progress */}
        {collectedContext.length > 0 && (
          <View style={[styles.contextBar, { backgroundColor: t.isDark ? '#0A1219' : colors.glowSoft }]}>
            <View style={styles.contextProgress}>
              <View style={[styles.contextProgressFill, { width: `${contextProgress * 100}%` }]} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contextChips}>
              {collectedContext.map(key => (
                <View key={key} style={[styles.contextChip, { backgroundColor: t.isDark ? '#0F2018' : colors.white }]}>
                  <Text style={[styles.contextChipText, { color: colors.primary }]}>
                    {CONTEXT_LABELS[key] || key}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Action - Own Idea Button */}
        <View style={[styles.quickActionBar, { borderBottomColor: t.borderSoft }]}>
          <Pressable
            style={[styles.quickActionBtn, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}
            onPress={() => setShowOwnIdeaModal(true)}
          >
            <Lightbulb size={16} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.quickActionText, { color: colors.primary }]}>
              I already have an idea
            </Text>
          </Pressable>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg, i) => renderMessage(msg, i))}

          {loading && (
            <View style={styles.loadingRow}>
              <View style={[styles.avatar, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
                <Sparkles size={16} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={[styles.messageBubble, { backgroundColor: t.isDark ? '#1A2535' : colors.white, borderColor: t.border }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            </View>
          )}

          {showActionButtons && (
            <AnimatedView.View entering={FadeInUp.springify()} style={styles.actionButtons}>
              <Text style={[styles.actionPrompt, { color: t.textSecondary }]}>
                I have enough information to help you. What would you like to do?
              </Text>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => generateIdeas(false)}
              >
                <Lightbulb size={20} color={colors.white} strokeWidth={2} />
                <Text style={styles.actionBtnText}>Generate 5 Ideas for Me</Text>
                <ChevronRight size={18} color={colors.white} strokeWidth={2} />
              </Pressable>
              {hasOwnIdea && (
                <Pressable
                  style={[styles.actionBtn, styles.actionBtnSecondary, { backgroundColor: t.isDark ? '#0F2018' : colors.glow, borderColor: colors.primary }]}
                  onPress={() => generateIdeas(true)}
                >
                  <Edit3 size={20} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Explore My Idea</Text>
                  <ChevronRight size={18} color={colors.primary} strokeWidth={2} />
                </Pressable>
              )}
            </AnimatedView.View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputArea, { backgroundColor: t.bg, borderTopColor: t.borderSoft }]}>
          <View style={[styles.inputBox, { backgroundColor: t.inputBg, borderColor: t.border }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: t.text }]}
              placeholder={readyForIdeas ? "Tell me more or ask for specific advice..." : "Tell me about yourself..."}
              placeholderTextColor={t.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            {inputText.trim() ? (
              <Pressable
                onPress={() => sendMessage()}
                disabled={loading}
                style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
              >
                {loading
                  ? <ActivityIndicator size="small" color={colors.white} />
                  : <ArrowUp size={20} color={colors.white} strokeWidth={2.5} />
                }
              </Pressable>
            ) : null}
          </View>
          <Text style={[styles.hint, { color: t.textTertiary }]}>
            {readyForIdeas ? 'Type your question or tap a button above' : 'Share your goals, skills, budget, and interests'}
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Own Idea Modal */}
      <Modal
        visible={showOwnIdeaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOwnIdeaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: t.text }]}>Share Your Idea</Text>
              <Pressable onPress={() => setShowOwnIdeaModal(false)} hitSlop={12}>
                <X size={24} color={t.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>
            <Text style={[styles.modalSub, { color: t.textSecondary }]}>
              Describe your business idea and I'll generate a complete business breakdown including market research, branding, AI prompts for visuals, and viral marketing strategies.
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]}
              placeholder="e.g., I want to start an AI-powered fitness coaching app..."
              placeholderTextColor={t.textTertiary}
              value={ownIdeaText}
              onChangeText={setOwnIdeaText}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Pressable
              style={[styles.modalSubmit, { backgroundColor: ownIdeaText.trim() ? colors.primary : t.border }]}
              onPress={submitOwnIdea}
              disabled={!ownIdeaText.trim() || ownIdeaLoading}
            >
              {ownIdeaLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Sparkles size={18} color={colors.white} strokeWidth={2} />
                  <Text style={styles.modalSubmitText}>Generate Business Plan</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: { padding: 6 },
  headerCenter: { flex: 1 },
  headerTitle: { ...typography.h4 },
  headerSub: { ...typography.small, marginTop: 2 },
  contextBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  contextProgress: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  contextProgressFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  contextChips: { flexGrow: 0 },
  contextChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginRight: 6,
  },
  contextChipText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  quickActionBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  quickActionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  messagesScroll: { flex: 1 },
  messagesContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '100%',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  welcomeBubble: {
    maxWidth: '90%',
  },
  messageText: {
    ...typography.body,
    lineHeight: 22,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButtons: {
    marginTop: spacing.md,
    gap: 12,
  },
  actionPrompt: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.xl,
  },
  actionBtnSecondary: {
    borderWidth: 1.5,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  inputArea: {
    paddingHorizontal: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.md : spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: radius.xxl,
    borderWidth: 1.5,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    maxHeight: 120,
    minHeight: 44,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    alignSelf: 'flex-end',
  },
  sendBtnDisabled: {
    backgroundColor: colors.primaryDark,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    ...typography.h3,
  },
  modalSub: {
    ...typography.body,
    lineHeight: 22,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 120,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  modalSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
  },
  modalSubmitText: {
    color: colors.white,
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});
