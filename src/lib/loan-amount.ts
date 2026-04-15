// Generate a random loan amount between R$1,500 and R$8,000 in steps of R$100
export function generateLoanAmount(): number {
  const min = 1000;
  const max = 2500;
  const step = 100;
  const steps = Math.floor((max - min) / step);
  const randomStep = Math.floor(Math.random() * (steps + 1));
  return min + randomStep * step;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
