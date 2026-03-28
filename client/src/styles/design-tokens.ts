export const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    gradients: {
      primary: 'from-blue-500 to-cyan-500',
      purple: 'from-purple-500 to-pink-500',
      success: 'from-green-500 to-emerald-500',
      warning: 'from-orange-500 to-amber-500',
      danger: 'from-red-500 to-rose-500',
    },
    shadows: {
      glow: {
        blue: 'shadow-blue-500/30',
        green: 'shadow-green-500/30',
        purple: 'shadow-purple-500/30',
        orange: 'shadow-orange-500/30',
      },
    },
  },
  borderRadius: {
    sm: 'rounded-sm',
    DEFAULT: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  },
  transitions: {
    fast: 'duration-150',
    DEFAULT: 'duration-200',
    slow: 'duration-300',
  },
  spacing: {
    button: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg',
    },
    input: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-4 py-3.5 text-base',
    },
  },
} as const;

export const buttonVariants = {
  primary: `
    bg-gradient-to-r from-blue-500 to-cyan-500
    hover:from-blue-600 hover:to-cyan-600
    text-white
    shadow-lg shadow-blue-500/30
    hover:shadow-xl hover:shadow-blue-500/40
    transform hover:-translate-y-0.5
    transition-all duration-200
  `,
  secondary: `
    bg-white
    text-gray-700
    border border-gray-200
    hover:border-gray-300
    hover:bg-gray-50
    shadow-sm
    transition-all duration-200
  `,
  outline: `
    bg-transparent
    text-blue-600
    border border-blue-600
    hover:bg-blue-50
    transition-all duration-200
  `,
  ghost: `
    bg-transparent
    text-gray-600
    hover:bg-gray-100
    hover:text-gray-900
    transition-all duration-200
  `,
  danger: `
    bg-gradient-to-r from-red-500 to-rose-500
    hover:from-red-600 hover:to-rose-600
    text-white
    shadow-lg shadow-red-500/30
    hover:shadow-xl hover:shadow-red-500/40
    transition-all duration-200
  `,
  success: `
    bg-gradient-to-r from-green-500 to-emerald-500
    hover:from-green-600 hover:to-emerald-600
    text-white
    shadow-lg shadow-green-500/30
    hover:shadow-xl hover:shadow-green-500/40
    transition-all duration-200
  `,
} as const;

export const inputVariants = {
  default: `
    w-full
    bg-gray-50
    border border-gray-200
    rounded-xl
    text-gray-900
    placeholder-gray-400
    focus:outline-none
    focus:ring-4 focus:ring-blue-500/20
    focus:border-blue-500
    transition-all duration-200
  `,
  error: `
    w-full
    bg-gray-50
    border border-red-500
    rounded-xl
    text-gray-900
    placeholder-gray-400
    focus:outline-none
    focus:ring-4 focus:ring-red-500/20
    focus:border-red-500
    transition-all duration-200
  `,
} as const;

export const cardVariants = {
  default: `
    bg-white
    rounded-2xl
    shadow-sm
    border border-gray-100
    overflow-hidden
  `,
  hover: `
    bg-white
    rounded-2xl
    shadow-sm
    border border-gray-100
    overflow-hidden
    hover:shadow-xl
    hover:-translate-y-1
    transition-all duration-300
    cursor-pointer
  `,
  interactive: `
    bg-white
    rounded-2xl
    shadow-sm
    border border-gray-100
    overflow-hidden
    hover:shadow-md
    transition-shadow duration-200
    cursor-pointer
  `,
} as const;

export const statCardColors = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/30',
    icon: 'text-white',
  },
  green: {
    bg: 'bg-gradient-to-br from-green-500 to-emerald-500',
    shadow: 'shadow-green-500/30',
    icon: 'text-white',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-500 to-pink-500',
    shadow: 'shadow-purple-500/30',
    icon: 'text-white',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-500 to-amber-500',
    shadow: 'shadow-orange-500/30',
    icon: 'text-white',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-500 to-rose-500',
    shadow: 'shadow-red-500/30',
    icon: 'text-white',
  },
} as const;
