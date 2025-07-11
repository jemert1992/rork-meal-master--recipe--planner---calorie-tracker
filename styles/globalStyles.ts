import { StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

export const GlobalStyles = StyleSheet.create({
  // Enhanced shadows for better depth
  cardShadow: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  
  buttonShadow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  
  // Enhanced button styles
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Enhanced card styles
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  
  // Enhanced input styles
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  
  // Enhanced typography
  heading1: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  
  heading2: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  
  bodyText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  
  captionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  
  // Enhanced spacing
  marginBottom8: { marginBottom: 8 },
  marginBottom12: { marginBottom: 12 },
  marginBottom16: { marginBottom: 16 },
  marginBottom20: { marginBottom: 20 },
  marginBottom24: { marginBottom: 24 },
  marginBottom32: { marginBottom: 32 },
  
  paddingHorizontal16: { paddingHorizontal: 16 },
  paddingHorizontal20: { paddingHorizontal: 20 },
  paddingHorizontal24: { paddingHorizontal: 24 },
  
  paddingVertical8: { paddingVertical: 8 },
  paddingVertical12: { paddingVertical: 12 },
  paddingVertical16: { paddingVertical: 16 },
  paddingVertical20: { paddingVertical: 20 },
  
  // Enhanced layout
  flexRow: { flexDirection: 'row' },
  flexColumn: { flexDirection: 'column' },
  alignCenter: { alignItems: 'center' },
  justifyCenter: { justifyContent: 'center' },
  justifyBetween: { justifyContent: 'space-between' },
  flex1: { flex: 1 },
  
  // Enhanced animations
  scaleOnPress: {
    transform: [{ scale: 0.98 }],
  },
});

export const AnimationConfig = {
  spring: {
    tension: 100,
    friction: 8,
  },
  timing: {
    duration: 300,
  },
};