// ─────────────────────────────────────────────────────────────────────────────
// Paywall overlay — Sprint 2 (dummy — no real StoreKit for v1).
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { COLORS, RADII, SPACING } from '../../design/tokens';
import { GGButton, Heading } from '../../design/components';
import { CheckIcon, CloseIcon } from '../../design/icons';
import { Sigil } from '../../design/Sigil';
import { OverlayParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OverlayParamList, 'Paywall'>;

const BENEFITS = [
  { title: 'Unlimited AI recommendations', sub: 'Ask Guru as much as you need.' },
  { title: 'Weekly proactive briefings', sub: 'Push notifications when your lawn needs you.' },
  { title: 'Full issue history & care logs', sub: 'Every problem tracked, every fix documented.' },
];

export default function PaywallScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      {/* Background grass pattern */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 360 800">
        <Defs>
          <Pattern id="grass" patternUnits="userSpaceOnUse" width={40} height={40} patternTransform="rotate(15)">
            <Path d="M0 40 L0 22 M10 40 L10 25 M20 40 L20 18 M30 40 L30 28" stroke={COLORS.cream} strokeWidth={1.2} fill="none" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grass)" opacity={0.06} />
      </Svg>

      {/* Close button */}
      <View style={{ paddingTop: 58, paddingHorizontal: SPACING.appX }}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <CloseIcon />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Sigil size={48} tone="deep" />
        <Heading level={1} italic style={styles.headline}>
          Continue with Grass Guru{' '}
          <Text style={{ fontStyle: 'normal', color: COLORS.leafGreen }}>Pro</Text>.
        </Heading>
        <Text style={styles.subhead}>Your lawn, always looked after.</Text>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={styles.benefitRow}>
              <View style={styles.checkCircle}>
                <CheckIcon size={14} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitSub}>{b.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.priceCard}>
          <Text style={styles.price}>$9.99</Text>
          <Text style={styles.priceSub}> / month · 7-day free trial</Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <GGButton kind="leaf" size="lg" full onPress={() => navigation.goBack()}>
            Start free trial
          </GGButton>
        </View>

        <Pressable onPress={() => navigation.goBack()} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Restore purchase</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.deepGreen },
  closeBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  body: { flex: 1, paddingHorizontal: 26, paddingTop: 40, paddingBottom: 30 },
  headline: {
    color: COLORS.cream,
    fontSize: 38, lineHeight: 42,
    maxWidth: 280,
    marginTop: 26,
  },
  subhead: {
    color: COLORS.cream,
    opacity: 0.7,
    fontSize: 15.5,
    lineHeight: 22,
    marginTop: 14,
    maxWidth: 320,
  },

  benefits: { marginTop: 42, gap: 16 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  checkCircle: {
    width: 28, height: 28, borderRadius: 999,
    backgroundColor: COLORS.leafGreen,
    alignItems: 'center', justifyContent: 'center',
  },
  benefitTitle: {
    color: COLORS.cream, fontSize: 16,
    fontFamily: 'Georgia', fontWeight: '500',
    letterSpacing: -0.16,
  },
  benefitSub: { color: COLORS.cream, opacity: 0.65, fontSize: 13.5, lineHeight: 19, marginTop: 2 },

  priceCard: {
    marginTop: 32,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  price: {
    color: COLORS.cream,
    fontFamily: 'Georgia',
    fontSize: 32,
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: -0.64,
  },
  priceSub: { color: COLORS.cream, opacity: 0.7, fontSize: 14 },

  restoreBtn: { marginTop: 12, height: 32, alignItems: 'center', justifyContent: 'center' },
  restoreText: { color: COLORS.cream, opacity: 0.55, fontSize: 13.5, fontWeight: '500' },
});
