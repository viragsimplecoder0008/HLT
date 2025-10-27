# 🎤 Voice Input Feature

## Overview

The Daily Check-In now includes voice input functionality for all three questions. Users can speak their answers instead of typing them.

## Features

### 🎙️ **Voice-to-Text**
- Click the microphone icon next to any text field
- Speak your answer
- The transcribed text automatically fills the input field

### 🚫 **Smart Negative Detection**
When users say negative responses like:
- "No"
- "Nope" 
- "Not today"
- "No I did not"
- "No I didn't"
- "Nothing"
- "Nobody"

The system will automatically:
1. Check the "No, not today" checkbox
2. Clear the text field
3. Show a confirmation message

### 🎨 **Visual Feedback**
- **Recording:** Microphone icon turns red with pulsing animation
- **Idle:** Gray microphone icon with hover effect
- **Disabled:** Grayed out when checkbox is selected
- **Toast notifications:** Confirm voice capture or errors

## Browser Support

Voice input uses the Web Speech API, which is supported in:
- ✅ Chrome/Chromium (Desktop & Mobile)
- ✅ Edge (Desktop & Mobile)
- ✅ Safari (iOS 14.5+)
- ❌ Firefox (not supported)

## How to Use

1. **Start Recording:**
   - Click the microphone icon
   - Grant microphone permission if prompted
   - See "Listening... Speak now!" notification

2. **Speak Your Answer:**
   - Speak clearly into your microphone
   - Say positive answer: "I helped my neighbor with groceries"
   - Say negative answer: "No I did not" or just "No"

3. **Automatic Processing:**
   - Positive answers → Fill text field
   - Negative answers → Check "No, not today" box
   - See confirmation toast

4. **Stop Early (Optional):**
   - Click the red pulsing microphone to stop
   - Recognition stops automatically after speech ends

## Technical Implementation

### Speech Recognition Setup
```typescript
const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = 'en-US';
```

### Negative Response Detection
Uses regex patterns to detect negative responses:
```typescript
const negativePatterns = [
  /^no$/,
  /^nope$/,
  /^not today$/,
  /^no i did not$/,
  /^no i didn't$/,
  // ... more patterns
];
```

### Error Handling
- No speech detected → Prompt to try again
- Microphone access denied → Show permission instructions
- Browser not supported → Show compatibility message
- Network error → Graceful fallback

## User Experience

### States
1. **Ready:** Gray mic icon, hoverable
2. **Listening:** Red pulsing mic icon
3. **Processing:** Brief moment while transcribing
4. **Complete:** Toast notification + field update

### Accessibility
- Keyboard accessible (Tab + Enter to activate)
- ARIA labels for screen readers
- Clear visual feedback
- Tooltip on hover: "Voice input"

## Common Voice Commands

### Positive Answers
- "I helped my colleague with a project"
- "I learned about React hooks"
- "I thanked my mom for dinner"

### Negative Answers (Auto-checks checkbox)
- "No"
- "Nope"
- "Not today"
- "No I did not"
- "Nothing today"
- "Nobody"

## Troubleshooting

### "Voice input not supported"
→ Use Chrome, Edge, or Safari

### "Microphone access denied"
→ Check browser permissions:
- Chrome: Settings → Privacy → Microphone
- Safari: System Preferences → Security → Microphone

### "No speech detected"
→ Speak louder or closer to microphone

### Voice input not starting
→ Ensure you're on HTTPS (required for mic access)

## Future Enhancements

- [ ] Multi-language support
- [ ] Continuous recording mode
- [ ] Voice command shortcuts
- [ ] Offline speech recognition
- [ ] Custom voice commands
- [ ] Speech-to-text confidence display

---

**Status:** ✅ Fully implemented and ready to use!
