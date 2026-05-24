import React, { ReactNode, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ViewStyle, TextStyle, Animated, Easing,
  TouchableOpacity,
} from 'react-native';
import {
  COLORS, RADII, SPACING, SHADOWS, TYPE, ACCENT_FONT, HEADING_FONT,
  CATEGORY, CategoryId, HEALTH_COLOR, HealthState,
} from './tokens';
import { ChevronLeft } from './icons';

// ─────────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  soft?: boolean;
  padding?: number;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
}

export function Card({ children, soft = false, padding = SPACING.cardPad, onPress, style }: CardProps) {
  const flatStyle: ViewStyle = {
    backgroundColor: soft ? COLORS.softCardBg : COLORS.cardBg,
    borderRadius: RADII.card,
    padding,
    borderWidth: 0.5,
    borderColor: COLORS.line,
    ...SHADOWS.card,
  };
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [flatStyle, style as ViewStyle, pressed && { transform: [{ scale: 0.98 }] }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[flatStyle, style as ViewStyle]}>{children}</View>;
}

// ─────────────────────────────────────────────────────────────────────────────
// GGButton — primary / leaf / amber / ghost / chip kinds
// ─────────────────────────────────────────────────────────────────────────────

type ButtonKind = 'primary' | 'leaf' | 'amber' | 'ghost' | 'chip';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GGButtonProps {
  children: ReactNode;
  kind?: ButtonKind;
  size?: ButtonSize;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  full?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function GGButton({
  children, kind = 'primary', size = 'md', icon, trailingIcon, full,
  disabled, onPress, style,
}: GGButtonProps) {
  const palette = {
    primary: { bg: COLORS.deepGreen, fg: COLORS.cream, border: 'transparent' },
    leaf:    { bg: COLORS.leafGreen, fg: '#fff',        border: 'transparent' },
    amber:   { bg: COLORS.amber,     fg: '#fff',        border: 'transparent' },
    ghost:   { bg: 'transparent',    fg: COLORS.deepGreen, border: `${COLORS.deepGreen}33` },
    chip:    { bg: COLORS.cardBg,    fg: COLORS.deepGreen, border: COLORS.line },
  }[kind];

  const sizing = {
    sm: { height: 36, paddingHorizontal: 14, fontSize: 14 },
    md: { height: 48, paddingHorizontal: 20, fontSize: 15 },
    lg: { height: 56, paddingHorizontal: 24, fontSize: 17 },
  }[size];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          height: sizing.height,
          paddingHorizontal: sizing.paddingHorizontal,
          borderRadius: RADII.button,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: 0.75,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.4 : 1,
        },
        full && { width: '100%' },
        style,
        pressed && !disabled && { transform: [{ scale: 0.98 }] },
      ]}
    >
      {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
      <Text
        style={{
          color: palette.fg,
          fontSize: sizing.fontSize,
          fontWeight: '600',
          letterSpacing: -0.15,
        }}
      >
        {children}
      </Text>
      {trailingIcon && <View style={{ marginLeft: 8 }}>{trailingIcon}</View>}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CategoryTag — pill with colored dot + label
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryTagProps {
  cat: CategoryId;
}

export function CategoryTag({ cat }: CategoryTagProps) {
  const c = CATEGORY[cat];
  const fg = c.color === COLORS.sage ? COLORS.deepGreen : c.color;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        height: 22,
        paddingHorizontal: 9,
        borderRadius: RADII.pill,
        backgroundColor: `${c.color}1f`,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: c.color, marginRight: 6 }} />
      <Text style={[styles.catText, { color: fg }]}>{c.label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HealthBadge — dot + uppercased status text
// ─────────────────────────────────────────────────────────────────────────────

interface HealthBadgeProps {
  status?: HealthState;
  tone?: 'light' | 'dark';
  size?: 'md' | 'lg';
}

export function HealthBadge({ status = 'Good', tone = 'light', size = 'md' }: HealthBadgeProps) {
  const dot = HEALTH_COLOR[status];
  const fg = tone === 'dark' ? COLORS.cream : COLORS.deepGreen;
  const fontSize = size === 'lg' ? 13 : 11;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: tone === 'dark' ? 0.9 : 0.7 }}>
      <View
        style={{
          width: 8, height: 8, borderRadius: 8, backgroundColor: dot, marginRight: 7,
          // Approximation of the 3px halo shadow.
          shadowColor: dot, shadowOpacity: 0.32, shadowRadius: 3, shadowOffset: { width: 0, height: 0 },
        }}
      />
      <Text
        style={{
          color: fg,
          fontSize,
          fontWeight: '600',
          letterSpacing: 0.44, // 0.04em at 11pt
          textTransform: 'uppercase',
        }}
      >
        {status}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusPill — Issue list pill (Active / Treated)
// ─────────────────────────────────────────────────────────────────────────────

interface StatusPillProps {
  status: 'active' | 'treated';
}

export function StatusPill({ status }: StatusPillProps) {
  const active = status === 'active';
  const c = active ? COLORS.amber : COLORS.leafGreen;
  return (
    <View
      style={{
        backgroundColor: `${c}1a`,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: RADII.pill,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: c,
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 1.0, // ≈ 0.1em
          textTransform: 'uppercase',
        }}
      >
        {active ? 'Active' : 'Treated'}
      </Text>
    </View>
  );
}

/** Light variant used on the colored CareCard banner */
export function StatusPillLight({ status }: StatusPillProps) {
  const active = status === 'active';
  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.22)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: RADII.pill,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: '#fff', opacity: 0.95, marginRight: 6 }} />
      <Text
        style={{
          color: '#fff',
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {active ? 'Active' : 'Treated'}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Eyebrow — small uppercase label
// ─────────────────────────────────────────────────────────────────────────────

interface EyebrowProps {
  children: ReactNode;
  color?: string;
  style?: TextStyle;
}

export function Eyebrow({ children, color, style }: EyebrowProps) {
  return (
    <Text
      style={[
        {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1.32,
          textTransform: 'uppercase',
          color: color ?? COLORS.deepGreen,
          opacity: 0.6,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Heading — ethos-aware. Levels 1-4.
// ─────────────────────────────────────────────────────────────────────────────

interface HeadingProps {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4;
  italic?: boolean;
  color?: string;
  style?: TextStyle;
}

const HEADING_SIZES = {
  1: { fontSize: 34, lineHeight: 38 },
  2: { fontSize: 26, lineHeight: 30 },
  3: { fontSize: 20, lineHeight: 24 },
  4: { fontSize: 17, lineHeight: 22 },
};

export function Heading({ children, level = 1, italic, color, style }: HeadingProps) {
  const useItalic = italic ?? level === 1; // hero level italic by default
  return (
    <Text
      style={[
        HEADING_FONT,
        HEADING_SIZES[level],
        {
          fontWeight: '500',
          letterSpacing: -0.34,
          color: color ?? COLORS.deepGreen,
          fontStyle: useItalic ? 'italic' : 'normal',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppHeader — eyebrow + large title + optional back/right
// ─────────────────────────────────────────────────────────────────────────────

interface AppHeaderProps {
  eyebrow?: ReactNode;
  title?: ReactNode;
  right?: ReactNode;
  onBack?: () => void;
  /** Override the bottom padding (default 14). */
  bottomPad?: number;
  /** Override the top padding (default 58 status bar clearance). */
  topPad?: number;
}

export function AppHeader({ eyebrow, title, right, onBack, bottomPad = 14, topPad = SPACING.headerTop }: AppHeaderProps) {
  const hasTop = onBack || eyebrow || right;
  return (
    <View style={{ paddingTop: topPad, paddingBottom: bottomPad, paddingHorizontal: SPACING.appX, gap: 6 }}>
      {hasTop && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 22 }}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={{ flexDirection: 'row', alignItems: 'center' }}
              hitSlop={8}
            >
              <ChevronLeft />
              <Text style={{ color: COLORS.deepGreen, fontSize: 15, fontWeight: '500', marginLeft: 4 }}>Back</Text>
            </TouchableOpacity>
          ) : typeof eyebrow === 'string' ? (
            <Eyebrow>{eyebrow}</Eyebrow>
          ) : (
            eyebrow ?? <View />
          )}
          {right ?? <View />}
        </View>
      )}
      {title && (typeof title === 'string' ? <Heading level={1}>{title}</Heading> : title)}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat thinking dots — 3 leaf-green dots, staggered bounce
// ─────────────────────────────────────────────────────────────────────────────

export function ThinkingDots() {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const make = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 480, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 720, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
      );
    const anims = [make(a, 0), make(b, 150), make(c, 300)];
    anims.forEach((x) => x.start());
    return () => anims.forEach((x) => x.stop());
  }, [a, b, c]);

  const dot = (v: Animated.Value, key: string) => (
    <Animated.View
      key={key}
      style={{
        width: 6,
        height: 6,
        borderRadius: 6,
        marginHorizontal: 2,
        backgroundColor: COLORS.leafGreen,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
      }}
    />
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {dot(a, 'a')}{dot(b, 'b')}{dot(c, 'c')}
    </View>
  );
}

const styles = StyleSheet.create({
  catText: {
    ...TYPE.categoryTag,
  },
});
