interface Enemy {
  id: number
  name: string
  level: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  reward: number
}

/**
 * Selects a random enemy from the provided list
 * @param enemies - Array of available enemies
 * @returns A randomly selected enemy, or null if the list is empty
 */
export function selectRandomEnemy(enemies: Enemy[]): Enemy | null {
  if (enemies.length === 0) return null
  const randomIndex = Math.floor(Math.random() * enemies.length)
  return enemies[randomIndex]
}
