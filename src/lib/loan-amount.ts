// Fixed loan amount of R$ 2,500
export function generateLoanAmount(): number {
  return 2500;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
