import { forwardRef, useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, Loader2, RefreshCw, TicketCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type PixPayment = {
  id: string;
  status: string;
  value: number | null;
  content_id: string | null;
  created_at: string;
  updated_at: string;
};

type Period = {
  label: string;
  start: Date;
  end: Date;
};

const TICKETS = {
  seguroOld: 3179,
  taxaOld: 1874,
  seguroNew: 5279,
  taxaNew: 2874,
};

const paidStatuses = new Set(["paid", "completed", "approved", "confirmed", "pago"]);

const toDateTimeInput = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const pct = (value: number) => `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

const inPeriod = (isoDate: string, period: Period) => {
  const time = new Date(isoDate).getTime();
  return time >= period.start.getTime() && time <= period.end.getTime();
};

const isPaid = (payment: PixPayment) => paidStatuses.has((payment.status || "").toLowerCase());

const summarize = (rows: PixPayment[], period: Period) => {
  const generated = rows.filter((row) => inPeriod(row.created_at, period));
  const paid = rows.filter((row) => isPaid(row) && inPeriod(row.updated_at, period));
  const seguroPaid = paid.filter((row) => row.content_id === "seguro_prestamista").length;
  const taxaPaid = paid.filter((row) => row.content_id === "taxa_transferencia").length;
  const realRevenue = paid.reduce((sum, row) => sum + (row.value || 0), 0);
  const oldTicketRevenue = seguroPaid * TICKETS.seguroOld + taxaPaid * TICKETS.taxaOld;
  const newTicketRevenue = seguroPaid * TICKETS.seguroNew + taxaPaid * TICKETS.taxaNew;

  return {
    generated: generated.length,
    paid: paid.length,
    seguroPaid,
    taxaPaid,
    realRevenue,
    oldTicketRevenue,
    newTicketRevenue,
    conversion: generated.length ? (paid.length / generated.length) * 100 : 0,
  };
};

const delta = (after: number, before: number) => after - before;

const MetricCard = forwardRef<HTMLDivElement, { title: string; value: string; detail: string; diff?: number }>(({ title, value, detail, diff }, ref) => {
  const positive = (diff || 0) >= 0;
  return (
    <Card ref={ref}>
      <CardHeader className="pb-3">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{detail}</p>
        {typeof diff === "number" && (
          <Badge variant="secondary" className={positive ? "text-primary" : "text-destructive"}>
            {positive ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
            {diff > 0 ? "+" : ""}{diff.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = "MetricCard";

const AnalyticsTicket = () => {
  const today = new Date();
  const changeDate = new Date();
  const beforeEnd = new Date(changeDate.getTime() - 1);
  const beforeStart = new Date(changeDate);
  beforeStart.setDate(changeDate.getDate() - 7);

  const [before, setBefore] = useState<Period>({ label: "Antes", start: beforeStart, end: beforeEnd });
  const [after, setAfter] = useState<Period>({ label: "Depois", start: changeDate, end: today });
  const [rows, setRows] = useState<PixPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    const start = before.start < after.start ? before.start : after.start;
    const end = before.end > after.end ? before.end : after.end;

    const select = "id,status,value,content_id,created_at,updated_at";
    const [createdResult, updatedResult] = await Promise.all([
      supabase.from("pix_payments").select(select).gte("created_at", start.toISOString()).lte("created_at", end.toISOString()).range(0, 4999),
      supabase.from("pix_payments").select(select).gte("updated_at", start.toISOString()).lte("updated_at", end.toISOString()).range(0, 4999),
    ]);

    const queryError = createdResult.error || updatedResult.error;
    if (queryError) {
      setError(queryError.message);
      setRows([]);
    } else {
      const merged = new Map<string, PixPayment>();
      [...(createdResult.data || []), ...(updatedResult.data || [])].forEach((row) => merged.set(row.id, row as PixPayment));
      setRows([...merged.values()]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const beforeSummary = useMemo(() => summarize(rows, before), [rows, before]);
  const afterSummary = useMemo(() => summarize(rows, after), [rows, after]);

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit gap-2"><TicketCheck className="h-3.5 w-3.5" /> Ticket R$ 52,79 + R$ 28,74</Badge>
            <h1 className="text-3xl font-black tracking-normal text-foreground md:text-4xl">Analytics de Ticket</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Compare dados reais de PIX por período. Antes de publicar o ticket novo, a coluna “Depois” deve ficar zerada ou quase zerada.
            </p>
          </div>
          <Button onClick={loadPayments} disabled={loading} className="w-full md:w-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar dados
          </Button>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="h-5 w-5 text-primary" /> Períodos de comparação</CardTitle>
            <CardDescription>O período “Depois” deve começar somente na data e hora em que você publicar o ticket novo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {[
              { period: before, setPeriod: setBefore },
              { period: after, setPeriod: setAfter },
            ].map(({ period, setPeriod }) => (
              <div key={period.label} className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="mb-3 font-bold text-foreground">{period.label}</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                    Início
                    <Input type="datetime-local" value={toDateTimeInput(period.start)} onChange={(e) => setPeriod({ ...period, start: new Date(e.target.value) })} />
                  </label>
                  <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                    Fim
                    <Input type="datetime-local" value={toDateTimeInput(period.end)} onChange={(e) => setPeriod({ ...period, end: new Date(e.target.value) })} />
                  </label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {error && <Card className="border-destructive"><CardContent className="p-4 text-sm text-destructive">Erro ao carregar pagamentos: {error}</CardContent></Card>}

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Conversão depois" value={pct(afterSummary.conversion)} detail={`${afterSummary.paid} pagos / ${afterSummary.generated} gerados`} diff={delta(afterSummary.conversion, beforeSummary.conversion)} />
          <MetricCard title="Receita real depois" value={brl(afterSummary.realRevenue)} detail={`Antes: ${brl(beforeSummary.realRevenue)}`} diff={delta(afterSummary.realRevenue / 100, beforeSummary.realRevenue / 100)} />
          <MetricCard title="Simulação se vendesse no ticket novo" value={brl(beforeSummary.newTicketRevenue)} detail={`Sobre vendas do período antes: +${brl(beforeSummary.newTicketRevenue - beforeSummary.oldTicketRevenue)}`} />
          <MetricCard title="PIX pagos depois" value={String(afterSummary.paid)} detail={`Antes: ${beforeSummary.paid} pagos`} diff={delta(afterSummary.paid, beforeSummary.paid)} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {[
            { title: "Antes da mudança", summary: beforeSummary, estimate: beforeSummary.oldTicketRevenue, period: before, note: "Receita real deve bater com os valores antigos pagos." },
            { title: "Depois da publicação", summary: afterSummary, estimate: afterSummary.newTicketRevenue, period: after, note: "Só terá dados reais após você publicar e começar a receber PIX no ticket novo." },
          ].map(({ title, summary, estimate, period, note }) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> {title}</CardTitle>
                <CardDescription>{period.start.toLocaleString("pt-BR")} até {period.end.toLocaleString("pt-BR")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  ["PIX gerados", summary.generated.toLocaleString("pt-BR")],
                  ["PIX pagos", summary.paid.toLocaleString("pt-BR")],
                  ["Conversão", pct(summary.conversion)],
                  ["Seguro Prestamista pagos", summary.seguroPaid.toLocaleString("pt-BR")],
                  ["Taxa Transferência pagos", summary.taxaPaid.toLocaleString("pt-BR")],
                  ["Receita real", brl(summary.realRevenue)],
                  ["Receita pela regra do período", brl(estimate)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 border-b border-border/70 py-2 last:border-0">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <strong className="text-right text-sm text-foreground">{value}</strong>
                  </div>
                ))}
                <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">{note}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
};

export default AnalyticsTicket;