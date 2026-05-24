// Inline icon set — small SVG glyphs used throughout the app.
// Each accepts color/size props for ad-hoc styling.

import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import { COLORS } from './tokens';

interface IconProps {
  size?: number;
  color?: string;
  opacity?: number;
}

export function ChevronRight({ size = 8, color = COLORS.deepGreen, opacity = 0.4 }: IconProps) {
  return (
    <Svg width={size} height={(size * 14) / 8} viewBox="0 0 8 14">
      <Path d="M1 1l6 6-6 6" stroke={color} strokeOpacity={opacity} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronLeft({ size = 9, color = COLORS.deepGreen }: IconProps) {
  return (
    <Svg width={size} height={(size * 14) / 9} viewBox="0 0 9 14">
      <Path d="M8 1L2 7l6 6" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 16, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size * 14 / 16} viewBox="0 0 16 14">
      <Path d="M1 7l5 5 9-11" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ArrowRight({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <Svg width={size} height={size * 14 / 16} viewBox="0 0 16 14">
      <Path d="M1 7h13M9 1l5 6-5 6" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckboxCheck({ size = 16, color = COLORS.deepGreen }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Rect x={1.5} y={1.5} width={13} height={13} rx={3.5} stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M5 8l2.5 2.5L11 6.5" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusCircle({ size = 22, color = COLORS.deepGreen }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22">
      <Circle cx={11} cy={11} r={9.5} stroke={color} strokeOpacity={0.25} strokeWidth={1} fill="none" />
      <Path d="M11 3v16M3 11h16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function CalendarIcon({ size = 22, color = COLORS.deepGreen }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Rect x={3} y={5} width={16} height={14} rx={2} stroke={color} strokeWidth={1.5} />
      <Path d="M3 9h16M8 3v4M14 3v4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function CameraIcon({ size = 28, color = COLORS.deepGreen, opacity = 0.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Rect x={3} y={6} width={22} height={18} rx={3} stroke={color} strokeOpacity={opacity} strokeWidth={1.4} />
      <Circle cx={14} cy={15} r={4} stroke={color} strokeOpacity={opacity} strokeWidth={1.4} />
      <Path d="M10 6l2-3h4l2 3" stroke={color} strokeOpacity={opacity} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

export function SendIcon({ size = 18, color = COLORS.cream }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path d="M2 16L16 9 2 2v5l9 2-9 2v5z" fill={color} />
    </Svg>
  );
}

export function CloseIcon({ size = 14, color = COLORS.cream }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Path d="M2 2l10 10M12 2L2 12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function AlertTriangle({ size = 22, color = COLORS.amber }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22">
      <Path d="M11 3l9 16H2L11 3z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" fill="none" />
      <Path d="M11 9v4M11 16v0.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function TreatedCheck({ size = 22, color = COLORS.leafGreen }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22">
      <Path d="M4 11l5 5 9-10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// ── Tab bar icons (filled when active) ───────────────────────────────────────

interface TabIconProps {
  active: boolean;
}

export function HomeTab({ active }: TabIconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3C8 8 5 11 5 15a7 7 0 0014 0c0-4-3-7-7-12z"
        fill={active ? COLORS.deepGreen : 'none'}
        stroke={COLORS.deepGreen}
        strokeOpacity={active ? 1 : 0.45}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlanTab({ active }: TabIconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect
        x={4}
        y={5}
        width={16}
        height={15}
        rx={2.5}
        stroke={COLORS.deepGreen}
        strokeOpacity={active ? 1 : 0.45}
        strokeWidth={1.6}
        fill={active ? `${COLORS.deepGreen}24` : 'none'}
      />
      <Path
        d="M4 10h16M9 3v4M15 3v4"
        stroke={COLORS.deepGreen}
        strokeOpacity={active ? 1 : 0.45}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IssuesTab({ active }: TabIconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4v17M5 4l11 2-2 5 2 5-11-2"
        stroke={COLORS.deepGreen}
        strokeOpacity={active ? 1 : 0.45}
        strokeWidth={1.6}
        strokeLinejoin="round"
        fill={active ? `${COLORS.deepGreen}24` : 'none'}
      />
    </Svg>
  );
}

export function ProfileTab({ active }: TabIconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={8.5}
        r={3.5}
        stroke={COLORS.deepGreen}
        strokeOpacity={active ? 1 : 0.45}
        strokeWidth={1.6}
        fill={active ? `${COLORS.deepGreen}24` : 'none'}
      />
      <Path
        d="M5 20c1-3.5 4-5.5 7-5.5s6 2 7 5.5"
        stroke={COLORS.deepGreen}
        strokeOpacity={active ? 1 : 0.45}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

// ── To-do square icon ────────────────────────────────────────────────────────

export function TodoSquare({ size = 14, color = COLORS.amber }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Rect x={1.5} y={1.5} width={11} height={11} rx={3} stroke={color} strokeWidth={1.4} fill="none" />
    </Svg>
  );
}

// ── Plot lawn art (top-down illustrated lawn) ────────────────────────────────

interface PlotLawnArtProps {
  width: number;
  height: number;
}

export function PlotLawnArt({ width, height }: PlotLawnArtProps) {
  // Striped lawn rectangle offset 8% from left, 18% from top, sized 84% × 66%.
  const plotX = width * 0.08;
  const plotY = height * 0.18;
  const plotW = width * 0.84;
  const plotH = height * 0.66;
  const stoneX = width * 0.55;
  const stoneW = width * 0.06;

  // Generate striped pattern manually (RN-SVG patterns are limited; use rects).
  const stripes: React.ReactNode[] = [];
  const stripeSpacing = 6;
  // Rotate 20deg around plot center using a translate-rotate group.
  const stripeCount = Math.ceil((plotW + plotH) / stripeSpacing) + 4;
  for (let i = -2; i < stripeCount; i++) {
    const y = i * stripeSpacing;
    stripes.push(
      <Path
        key={`s-${i}`}
        d={`M${-plotH} ${y} L ${plotW + plotH} ${y}`}
        stroke={COLORS.deepGreen}
        strokeOpacity={0.25}
        strokeWidth={0.6}
      />,
    );
  }

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Deep-green field background */}
      <Rect width={width} height={height} fill={COLORS.deepGreen} />
      {/* Lawn plot rectangle */}
      <G transform={`translate(${plotX}, ${plotY})`}>
        <Rect width={plotW} height={plotH} fill={COLORS.leafGreen} rx={3} />
        {/* Stripes inside the plot */}
        <G transform={`rotate(20, ${plotW / 2}, ${plotH / 2})`}>
          {stripes}
        </G>
        {/* Gradient shade overlay approximated with a darker rect */}
        <Rect width={plotW} height={plotH} fill="#000" opacity={0.10} rx={3} />
        {/* Stone path */}
        <Rect x={stoneX - plotX} y={0} width={stoneW} height={plotH} fill={COLORS.tan} opacity={0.6} />
      </G>
    </Svg>
  );
}
