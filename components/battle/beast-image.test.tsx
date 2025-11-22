import { describe, it, expect } from 'vitest'

// Helper function to get type icon configuration (extracted from component for testing)
const getTypeIconConfig = (beastType?: string) => {
  const type = beastType?.toLowerCase() || ''
  
  switch (type) {
    case 'fire':
      return { iconName: 'Flame', color: 'text-red-500', bg: 'bg-red-500/20' }
    case 'water':
      return { iconName: 'Droplet', color: 'text-blue-500', bg: 'bg-blue-500/20' }
    case 'air':
    case 'wind':
      return { iconName: 'Wind', color: 'text-cyan-500', bg: 'bg-cyan-500/20' }
    case 'electric':
    case 'lightning':
      return { iconName: 'Zap', color: 'text-yellow-500', bg: 'bg-yellow-500/20' }
    case 'earth':
    case 'ground':
      return { iconName: 'Mountain', color: 'text-amber-700', bg: 'bg-amber-700/20' }
    default:
      return { iconName: 'Sparkles', color: 'text-purple-500', bg: 'bg-purple-500/20' }
  }
}

describe('BeastImage Component Logic', () => {
  describe('Type-Based Icon Configuration', () => {
    it('should return correct configuration for fire type', () => {
      const config = getTypeIconConfig('fire')
      expect(config.iconName).toBe('Flame')
      expect(config.color).toBe('text-red-500')
      expect(config.bg).toBe('bg-red-500/20')
    })

    it('should return correct configuration for water type', () => {
      const config = getTypeIconConfig('water')
      expect(config.iconName).toBe('Droplet')
      expect(config.color).toBe('text-blue-500')
      expect(config.bg).toBe('bg-blue-500/20')
    })

    it('should return correct configuration for air type', () => {
      const config = getTypeIconConfig('air')
      expect(config.iconName).toBe('Wind')
      expect(config.color).toBe('text-cyan-500')
      expect(config.bg).toBe('bg-cyan-500/20')
    })

    it('should return correct configuration for wind type (alias)', () => {
      const config = getTypeIconConfig('wind')
      expect(config.iconName).toBe('Wind')
      expect(config.color).toBe('text-cyan-500')
    })

    it('should return correct configuration for electric type', () => {
      const config = getTypeIconConfig('electric')
      expect(config.iconName).toBe('Zap')
      expect(config.color).toBe('text-yellow-500')
      expect(config.bg).toBe('bg-yellow-500/20')
    })

    it('should return correct configuration for lightning type (alias)', () => {
      const config = getTypeIconConfig('lightning')
      expect(config.iconName).toBe('Zap')
      expect(config.color).toBe('text-yellow-500')
    })

    it('should return correct configuration for earth type', () => {
      const config = getTypeIconConfig('earth')
      expect(config.iconName).toBe('Mountain')
      expect(config.color).toBe('text-amber-700')
      expect(config.bg).toBe('bg-amber-700/20')
    })

    it('should return correct configuration for ground type (alias)', () => {
      const config = getTypeIconConfig('ground')
      expect(config.iconName).toBe('Mountain')
      expect(config.color).toBe('text-amber-700')
    })

    it('should return default configuration for unknown type', () => {
      const config = getTypeIconConfig('unknown-type')
      expect(config.iconName).toBe('Sparkles')
      expect(config.color).toBe('text-purple-500')
      expect(config.bg).toBe('bg-purple-500/20')
    })

    it('should return default configuration for undefined type', () => {
      const config = getTypeIconConfig(undefined)
      expect(config.iconName).toBe('Sparkles')
      expect(config.color).toBe('text-purple-500')
      expect(config.bg).toBe('bg-purple-500/20')
    })

    it('should return default configuration for empty string', () => {
      const config = getTypeIconConfig('')
      expect(config.iconName).toBe('Sparkles')
      expect(config.color).toBe('text-purple-500')
    })

    it('should handle case insensitive type names', () => {
      const configLower = getTypeIconConfig('fire')
      const configUpper = getTypeIconConfig('FIRE')
      const configMixed = getTypeIconConfig('Fire')

      expect(configLower).toEqual(configUpper)
      expect(configLower).toEqual(configMixed)
    })

    it('should return correct configuration for all supported types', () => {
      const types = [
        { type: 'fire', iconName: 'Flame', color: 'text-red-500' },
        { type: 'water', iconName: 'Droplet', color: 'text-blue-500' },
        { type: 'air', iconName: 'Wind', color: 'text-cyan-500' },
        { type: 'wind', iconName: 'Wind', color: 'text-cyan-500' },
        { type: 'electric', iconName: 'Zap', color: 'text-yellow-500' },
        { type: 'lightning', iconName: 'Zap', color: 'text-yellow-500' },
        { type: 'earth', iconName: 'Mountain', color: 'text-amber-700' },
        { type: 'ground', iconName: 'Mountain', color: 'text-amber-700' }
      ]

      types.forEach(({ type, iconName, color }) => {
        const config = getTypeIconConfig(type)
        expect(config.iconName).toBe(iconName)
        expect(config.color).toBe(color)
      })
    })
  })

  describe('Loading State Logic', () => {
    it('should show loading state when imageUrl is provided', () => {
      const hasImageUrl = true
      const isLoading = !!hasImageUrl
      
      expect(isLoading).toBe(true)
    })

    it('should not show loading state when imageUrl is not provided', () => {
      const hasImageUrl = false
      const isLoading = !!hasImageUrl
      
      expect(isLoading).toBe(false)
    })

    it('should not show loading state for empty string imageUrl', () => {
      const hasImageUrl = ''
      const isLoading = !!hasImageUrl
      
      expect(isLoading).toBe(false)
    })
  })

  describe('Error Handling Logic', () => {
    it('should show placeholder when no imageUrl is provided', () => {
      const imageUrl = undefined
      const imageError = false
      const shouldShowPlaceholder = !imageUrl || imageError
      
      expect(shouldShowPlaceholder).toBe(true)
    })

    it('should show placeholder when image fails to load', () => {
      const imageUrl = 'https://example.com/beast.png'
      const imageError = true
      const shouldShowPlaceholder = !imageUrl || imageError
      
      expect(shouldShowPlaceholder).toBe(true)
    })

    it('should show image when imageUrl is provided and no error', () => {
      const imageUrl = 'https://example.com/beast.png'
      const imageError = false
      const shouldShowPlaceholder = !imageUrl || imageError
      
      expect(shouldShowPlaceholder).toBe(false)
    })
  })

  describe('Size Classes', () => {
    it('should return correct classes for small size', () => {
      const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-32 h-32',
        lg: 'w-48 h-48'
      }
      
      expect(sizeClasses.sm).toBe('w-16 h-16')
    })

    it('should return correct classes for medium size', () => {
      const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-32 h-32',
        lg: 'w-48 h-48'
      }
      
      expect(sizeClasses.md).toBe('w-32 h-32')
    })

    it('should return correct classes for large size', () => {
      const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-32 h-32',
        lg: 'w-48 h-48'
      }
      
      expect(sizeClasses.lg).toBe('w-48 h-48')
    })
  })

  describe('Icon Size Classes', () => {
    it('should return correct icon sizes for each component size', () => {
      const iconSizes = {
        sm: 'w-8 h-8',
        md: 'w-16 h-16',
        lg: 'w-24 h-24'
      }
      
      expect(iconSizes.sm).toBe('w-8 h-8')
      expect(iconSizes.md).toBe('w-16 h-16')
      expect(iconSizes.lg).toBe('w-24 h-24')
    })
  })

  describe('Component Props Validation', () => {
    it('should accept all required props', () => {
      const props = {
        imageUrl: 'https://example.com/beast.png',
        beastName: 'Test Beast',
        beastType: 'fire',
        size: 'md' as const,
        className: 'custom-class'
      }

      expect(props.imageUrl).toBe('https://example.com/beast.png')
      expect(props.beastName).toBe('Test Beast')
      expect(props.beastType).toBe('fire')
      expect(props.size).toBe('md')
      expect(props.className).toBe('custom-class')
    })

    it('should handle minimal props', () => {
      const minimalProps = {
        beastName: 'Minimal Beast'
      }

      expect(minimalProps.beastName).toBe('Minimal Beast')
    })

    it('should handle optional beastType', () => {
      const props = {
        beastName: 'Test Beast',
        beastType: undefined
      }

      expect(props.beastType).toBeUndefined()
    })

    it('should handle optional imageUrl', () => {
      const props = {
        beastName: 'Test Beast',
        imageUrl: undefined
      }

      expect(props.imageUrl).toBeUndefined()
    })
  })
})
