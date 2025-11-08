// Badge Template Component - Generates SVG badges dynamically
import React from 'react';

export interface BadgeConfig {
  skill: string;
  icon: string; // Emoji
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Predefined badge configurations
export const BADGE_CONFIGS: Record<string, BadgeConfig> = {
  'Python': {
    skill: 'Python Expert',
    icon: '🐍',
    colors: { primary: '#3776AB', secondary: '#FFD43B', accent: '#FFD700' },
  },
  'JavaScript': {
    skill: 'JavaScript Master',
    icon: '⚡',
    colors: { primary: '#F7DF1E', secondary: '#000000', accent: '#FFD700' },
  },
  'Mathematics': {
    skill: 'Math Wizard',
    icon: '🧮',
    colors: { primary: '#8B5CF6', secondary: '#C084FC', accent: '#C0C0C0' },
  },
  'Science': {
    skill: 'Science Specialist',
    icon: '🔬',
    colors: { primary: '#10B981', secondary: '#34D399', accent: '#CD7F32' },
  },
  'Web Development': {
    skill: 'Web Dev Pro',
    icon: '💻',
    colors: { primary: '#F97316', secondary: '#FB923C', accent: '#E5E4E2' },
  },
  'Data Science': {
    skill: 'Data Guru',
    icon: '📊',
    colors: { primary: '#14B8A6', secondary: '#2DD4BF', accent: '#FFD700' },
  },
  'AI/ML': {
    skill: 'AI Pioneer',
    icon: '🤖',
    colors: { primary: '#1E3A8A', secondary: '#3B82F6', accent: '#60A5FA' },
  },
  'Cybersecurity': {
    skill: 'Security Ace',
    icon: '🔐',
    colors: { primary: '#DC2626', secondary: '#000000', accent: '#000000' },
  },
  'Mobile Development': {
    skill: 'Mobile Champion',
    icon: '📱',
    colors: { primary: '#06B6D4', secondary: '#22D3EE', accent: '#E5E5E5' },
  },
  'Blockchain': {
    skill: 'Blockchain Builder',
    icon: '⛓️',
    colors: { primary: '#F59E0B', secondary: '#000000', accent: '#FFD700' },
  },
};

interface BadgeTemplateProps {
  config: BadgeConfig;
  teacherName: string;
  date: string;
  tokenId: string;
}

export const BadgeTemplate: React.FC<BadgeTemplateProps> = ({
  config,
  teacherName,
  date,
  tokenId,
}) => {
  const { skill, icon, colors } = config;

  return (
    <svg width="300" height="400" xmlns="http://www.w3.org/2000/svg" className="badge-svg">
      {/* Background gradient */}
      <defs>
        <linearGradient id={`grad-${tokenId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
        </linearGradient>

        {/* Glow effect */}
        <filter id={`glow-${tokenId}`}>
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="300" height="400" fill={`url(#grad-${tokenId})`} rx="20"/>

      {/* Border with glow */}
      <rect
        x="10"
        y="10"
        width="280"
        height="380"
        fill="none"
        stroke={colors.accent}
        strokeWidth="3"
        rx="15"
        filter={`url(#glow-${tokenId})`}
      />

      {/* Header: "PROOF OF LEARNING" */}
      <text
        x="150"
        y="40"
        fontFamily="Arial, sans-serif"
        fontSize="12"
        fill="rgba(255,255,255,0.9)"
        textAnchor="middle"
        fontWeight="600"
        letterSpacing="2"
      >
        PROOF OF LEARNING
      </text>

      {/* Title */}
      <text
        x="150"
        y="75"
        fontFamily="Arial, sans-serif"
        fontSize="22"
        fill="white"
        textAnchor="middle"
        fontWeight="bold"
      >
        {skill.toUpperCase()}
      </text>

      {/* Icon circle background */}
      <circle cx="150" cy="170" r="70" fill="rgba(255,255,255,0.15)"/>
      <circle cx="150" cy="170" r="65" fill="rgba(255,255,255,0.1)"/>

      {/* Icon */}
      <text x="150" y="200" fontSize="80" textAnchor="middle">
        {icon}
      </text>

      {/* Stars */}
      <text x="150" y="260" fontSize="20" fill={colors.accent} textAnchor="middle" fontWeight="bold">
        ⭐ ⭐ ⭐ ⭐ ⭐
      </text>

      {/* Achievement */}
      <text x="150" y="285" fontSize="14" fill="rgba(255,255,255,0.95)" textAnchor="middle" fontWeight="600">
        5-STAR EXCELLENCE
      </text>

      {/* Details */}
      <text x="150" y="320" fontSize="13" fill="white" textAnchor="middle">
        Verified by: {teacherName}
      </text>
      <text x="150" y="342" fontSize="13" fill="white" textAnchor="middle">
        Date: {date}
      </text>
      <text x="150" y="364" fontSize="11" fill="rgba(255,255,255,0.7)" textAnchor="middle">
        Token ID: {tokenId}
      </text>

      {/* Footer */}
      <text x="150" y="385" fontSize="9" fill="rgba(255,255,255,0.5)" textAnchor="middle">
        🔗 EduChain Blockchain Credential
      </text>
    </svg>
  );
};

// Helper function to detect skill from homework title
export function detectSkillFromTitle(title: string): string {
  const titleLower = title.toLowerCase();

  // Priority order: most specific to least specific
  // Blockchain keywords
  if (titleLower.match(/\b(blockchain|web3|crypto|cryptocurrency|smart\s*contract|solidity|ethereum|defi|nft)\b/)) return 'Blockchain';

  // AI/ML keywords (specific phrases first)
  if (titleLower.match(/\b(machine\s*learning|deep\s*learning|neural|tensorflow|pytorch|scikit|keras)\b/)) return 'AI/ML';

  // Data Science keywords
  if (titleLower.match(/\b(data\s*science|data\s*analytics?|pandas|numpy|matplotlib|tableau)\b/)) return 'Data Science';

  // Mobile Development keywords
  if (titleLower.match(/\b(mobile|android|ios|flutter|swift|kotlin|react\s*native)\b/)) return 'Mobile Development';

  // Cybersecurity keywords
  if (titleLower.match(/\b(security|cyber|encryption|penetration|hacking|firewall)\b/)) return 'Cybersecurity';

  // Python keywords
  if (titleLower.match(/\b(python|django|flask)\b/) || titleLower.includes('.py')) return 'Python';

  // JavaScript keywords
  if (titleLower.match(/\b(javascript|typescript|react|vue|angular|node\.?js|express)\b/) || titleLower.includes('.js') || titleLower.includes('.ts')) return 'JavaScript';

  // Mathematics keywords
  if (titleLower.match(/\b(math|algebra|calculus|geometry|trigonometry|statistics)\b/)) return 'Mathematics';

  // Science keywords
  if (titleLower.match(/\b(science|physics|chemistry|biology)\b/)) return 'Science';

  // Web Development keywords
  if (titleLower.match(/\b(web|html|css|frontend|backend|fullstack|responsive)\b/)) return 'Web Development';

  // AI/ML shorter keywords (checked last)
  if (titleLower.match(/\b(ai|ml)\b/)) return 'AI/ML';

  // Data shorter keywords (checked last)
  if (titleLower.match(/\b(data|analytics?)\b/)) return 'Data Science';

  // Default
  return 'Web Development';
}

// Helper to format date nicely
export function formatBadgeDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
