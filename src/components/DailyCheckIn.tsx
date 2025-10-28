import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, BookOpen, ThumbsUp, Edit2, Mic } from 'lucide-react';
import { projectId } from '../utils/supabase/info';

interface DailyCheckInProps {
  accessToken: string;
  onCheckInComplete: () => void;
}

export function DailyCheckIn({ accessToken, onCheckInComplete }: DailyCheckInProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [todaysCheckin, setTodaysCheckin] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [helpText, setHelpText] = useState('');
  const [learnText, setLearnText] = useState('');
  const [thankText, setThankText] = useState('');
  
  const [noHelp, setNoHelp] = useState(false);
  const [noLearn, setNoLearn] = useState(false);
  const [noThank, setNoThank] = useState(false);

  // Voice input state
  const [isListening, setIsListening] = useState<'help' | 'learn' | 'thank' | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    checkCheckinStatus();
  }, []);

  const checkCheckinStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8daf44f4/checkin-status`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Silently handle errors - user can still submit
        return;
      }

      const data = await response.json();
      if (data.hasCheckedIn) {
        setHasCheckedIn(true);
        setTodaysCheckin(data.checkin);
      }
    } catch (err) {
      // Silently handle network errors - backend might not be deployed yet
      // User will get a proper error message when they try to submit
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8daf44f4/checkin`,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            help: noHelp ? null : helpText,
            learn: noLearn ? null : learnText,
            thank: noThank ? null : thankText
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || `Failed to ${isEditing ? 'update' : 'submit'} check-in`);
        setIsLoading(false);
        return;
      }

      if (!isEditing) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      
      toast.success(isEditing 
        ? `Updated! You now have ${data.points} point${data.points !== 1 ? 's' : ''} today! ✨` 
        : `Great job! You earned ${data.points} point${data.points !== 1 ? 's' : ''} today! 🎉`
      );
      
      setHasCheckedIn(true);
      setTodaysCheckin(data.checkin);
      setIsEditing(false);
      onCheckInComplete();
    } catch (err) {
      console.error('Error submitting check-in:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        toast.error('⚠️ Backend not responding. Please deploy the Edge Function first.', {
          duration: 6000,
          description: 'Run: supabase functions deploy make-server-8daf44f4'
        });
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        toast.error('⚠️ Backend not deployed. Please deploy the Edge Function.', {
          duration: 6000,
          description: 'Run: supabase link --project-ref ' + projectId + ' && supabase functions deploy make-server-8daf44f4'
        });
      } else {
        toast.error('An error occurred while submitting');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Pre-fill the form with existing data
    setHelpText(todaysCheckin.help || '');
    setLearnText(todaysCheckin.learn || '');
    setThankText(todaysCheckin.thank || '');
    setNoHelp(!todaysCheckin.help);
    setNoLearn(!todaysCheckin.learn);
    setNoThank(!todaysCheckin.thank);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setHelpText('');
    setLearnText('');
    setThankText('');
    setNoHelp(false);
    setNoLearn(false);
    setNoThank(false);
  };

  // Voice input handler
  const handleVoiceInput = (field: 'help' | 'learn' | 'thank') => {
    // If already listening to this field, stop
    if (isListening === field) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(null);
      return;
    }

    // Check browser support
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input not supported', {
        description: 'Please use Chrome, Edge, or Safari'
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(field);
        toast.info('🎙️ Listening... Speak now!');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        
        // Negative response patterns
        const negativePatterns = [
          /^no$/,
          /^nope$/,
          /^nah$/,
          /^not today$/,
          /^no i did not$/,
          /^no i didn't$/,
          /^i did not$/,
          /^i didn't$/,
          /^nothing$/,
          /^nobody$/,
          /^no one$/,
        ];

        const isNegative = negativePatterns.some(pattern => pattern.test(transcript));

        if (isNegative) {
          // Auto-check the "No, not today" checkbox
          if (field === 'help') {
            setNoHelp(true);
            setHelpText('');
          } else if (field === 'learn') {
            setNoLearn(true);
            setLearnText('');
          } else if (field === 'thank') {
            setNoThank(true);
            setThankText('');
          }
          toast.success('✅ Got it! Marked as "No, not today"');
        } else {
          // Fill the text field with the transcript
          if (field === 'help') {
            setHelpText(event.results[0][0].transcript);
            setNoHelp(false);
          } else if (field === 'learn') {
            setLearnText(event.results[0][0].transcript);
            setNoLearn(false);
          } else if (field === 'thank') {
            setThankText(event.results[0][0].transcript);
            setNoThank(false);
          }
          toast.success('✅ Voice input captured!');
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(null);
        if (event.error === 'no-speech') {
          toast.error('No speech detected', {
            description: 'Please try again and speak clearly'
          });
        } else if (event.error === 'not-allowed') {
          toast.error('Microphone access denied', {
            description: 'Please allow microphone access in your browser'
          });
        } else {
          toast.error('Voice input error', {
            description: `Error: ${event.error}`
          });
        }
      };

      recognition.onend = () => {
        setIsListening(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Voice input error:', error);
      toast.error('Failed to start voice input');
      setIsListening(null);
    }
  };

  if (hasCheckedIn && todaysCheckin && !isEditing) {
    return (
      <div className="space-y-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-3"
        >
          <div className="mx-auto w-20 h-20 glass-gradient rounded-full flex items-center justify-center shadow-xl glass-shimmer">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl text-green-600 dark:text-green-400">All Done for Today!</h2>
          <p className="text-gray-600 dark:text-gray-400">You earned {todaysCheckin.points} point{todaysCheckin.points !== 1 ? 's' : ''} today</p>
        </motion.div>

        <Card className="glass-card border-0 shadow-2xl">
          <CardContent className="pt-6 space-y-5">
            {todaysCheckin.help && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex gap-3 p-3 glass-badge rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/30 to-pink-500/20 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                  <Heart className="w-5 h-5 text-red-500 relative z-10" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">You helped:</p>
                  <p className="text-gray-800 dark:text-gray-200">{todaysCheckin.help}</p>
                </div>
              </motion.div>
            )}
            {todaysCheckin.learn && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3 p-3 glass-badge rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/20 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                  <BookOpen className="w-5 h-5 text-blue-500 relative z-10" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">You learned:</p>
                  <p className="text-gray-800 dark:text-gray-200">{todaysCheckin.learn}</p>
                </div>
              </motion.div>
            )}
            {todaysCheckin.thank && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex gap-3 p-3 glass-badge rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/30 to-orange-500/20 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                  <ThumbsUp className="w-5 h-5 text-yellow-500 relative z-10" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">You thanked:</p>
                  <p className="text-gray-800 dark:text-gray-200">{todaysCheckin.thank}</p>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <Button 
          onClick={handleEdit}
          variant="outline"
          className="w-full glass-card border-0 shadow-lg hover:shadow-xl transition-all"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Today's Entry
        </Button>

        <p className="text-center text-gray-500 dark:text-gray-400 text-sm">Come back tomorrow to continue your journey!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                  scale: 1
                }}
                animate={{
                  x: (Math.random() - 0.5) * 1000,
                  y: Math.random() * 800 - 400,
                  opacity: 0,
                  scale: 0
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.3
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 4)]
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Help Question */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card border-0 shadow-xl hover:shadow-2xl transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                  <Heart className="w-6 h-6 text-white relative z-10" />
                </div>
                <div className="flex-1 space-y-3">
                  <Label htmlFor="help" className="dark:text-white">
                    Did you help somebody?
                  </Label>
                  <div className="relative flex items-center gap-2">
                    <Input
                      id="help"
                      placeholder="Tell us how you helped someone today..."
                      value={helpText}
                      onChange={(e) => setHelpText(e.target.value)}
                      disabled={noHelp || isLoading}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => handleVoiceInput('help')}
                      disabled={noHelp || isLoading}
                      className={`absolute right-2 p-2 rounded-lg transition-all ${
                        isListening === 'help'
                          ? 'text-red-500 animate-pulse'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      } ${noHelp || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title="Voice input"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="no-help"
                      checked={noHelp}
                      onCheckedChange={(checked) => {
                        setNoHelp(checked as boolean);
                        if (checked) setHelpText('');
                      }}
                    />
                    <Label htmlFor="no-help" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                      No, not today
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Learn Question */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-0 shadow-xl hover:shadow-2xl transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                  <BookOpen className="w-6 h-6 text-white relative z-10" />
                </div>
                <div className="flex-1 space-y-3">
                  <Label htmlFor="learn" className="dark:text-white">
                    Did you learn something?
                  </Label>
                  <div className="relative flex items-center gap-2">
                    <Input
                      id="learn"
                      placeholder="Share what you learned today..."
                      value={learnText}
                      onChange={(e) => setLearnText(e.target.value)}
                      disabled={noLearn || isLoading}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => handleVoiceInput('learn')}
                      disabled={noLearn || isLoading}
                      className={`absolute right-2 p-2 rounded-lg transition-all ${
                        isListening === 'learn'
                          ? 'text-red-500 animate-pulse'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      } ${noLearn || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title="Voice input"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="no-learn"
                      checked={noLearn}
                      onCheckedChange={(checked) => {
                        setNoLearn(checked as boolean);
                        if (checked) setLearnText('');
                      }}
                    />
                    <Label htmlFor="no-learn" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                      No, not today
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Thank Question */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-0 shadow-xl hover:shadow-2xl transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                  <ThumbsUp className="w-6 h-6 text-white relative z-10" />
                </div>
                <div className="flex-1 space-y-3">
                  <Label htmlFor="thank" className="dark:text-white">
                    Did you thank somebody?
                  </Label>
                  <div className="relative flex items-center gap-2">
                    <Input
                      id="thank"
                      placeholder="Tell us who you thanked..."
                      value={thankText}
                      onChange={(e) => setThankText(e.target.value)}
                      disabled={noThank || isLoading}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => handleVoiceInput('thank')}
                      disabled={noThank || isLoading}
                      className={`absolute right-2 p-2 rounded-lg transition-all ${
                        isListening === 'thank'
                          ? 'text-red-500 animate-pulse'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      } ${noThank || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title="Voice input"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="no-thank"
                      checked={noThank}
                      onCheckedChange={(checked) => {
                        setNoThank(checked as boolean);
                        if (checked) setThankText('');
                      }}
                    />
                    <Label htmlFor="no-thank" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                      No, not today
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3"
        >
          <Button 
            type="submit" 
            className="flex-1 h-12 shadow-xl hover:scale-[1.02] transition-all"
            disabled={isLoading}
          >
            {isLoading 
              ? (isEditing ? 'Updating...' : 'Submitting...') 
              : (isEditing ? 'Update Check-In' : 'Submit Check-In')
            }
          </Button>
          {isEditing && (
            <Button 
              type="button"
              variant="outline"
              className="h-12 glass-card border-0 shadow-lg"
              onClick={handleCancelEdit}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </motion.div>
      </form>
    </div>
  );
}
/*
#include <stdio.h>

int main() {
  printf("Hello World");
  return 0;
}
*/
