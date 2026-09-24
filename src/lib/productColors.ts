/**
 * Cor por produto: slot categórico fixo pela ordem de cadastro do produto
 * (a cor segue a entidade, não a posição num filtro). Até 8 produtos.
 */
const SLOTS = 8;

export function productColorVar(productIndex: number): string {
  return `var(--series-${(productIndex % SLOTS) + 1})`;
}
