import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
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
  customer_cpf: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  hashed_email: string | null;
  hashed_phone: string | null;
  hashed_external_id: string | null;
  created_at: string;
  updated_at: string;
};

type Period = {
  label: string;
  start: Date;
  end: Date;
};

type TicketValues = {
  seguro: number;
  taxa: number;
};

const TICKETS = {
  seguroOld: 3179,
  taxaOld: 1874,
  seguroNew: 5279,
  taxaNew: 2874,
};

const OLD_TICKET: TicketValues = { seguro: TICKETS.seguroOld, taxa: TICKETS.taxaOld };
const NEW_TICKET: TicketValues = { seguro: TICKETS.seguroNew, taxa: TICKETS.taxaNew };

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

const customerKey = (payment: PixPayment) =>
  payment.customer_cpf || payment.customer_email || payment.customer_phone || payment.hashed_external_id || payment.hashed_email || payment.hashed_phone || "";

const isSeguro = (payment: PixPayment) => payment.content_id === "seguro_prestamista";

const isTaxa = (payment: PixPayment) => payment.content_id === "taxa_transferencia";

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

const summarizeTicket = (rows: PixPayment[], values: TicketValues) => {
  const seguroRows = rows.filter((row) => isSeguro(row) && row.value === values.seguro);
  const taxaRows = rows.filter((row) => isTaxa(row) && row.value === values.taxa);
  const seguroPaidRows = seguroRows.filter(isPaid);
  const taxaPaidRows = taxaRows.filter(isPaid);
  const taxaKeys = new Set(taxaRows.map(customerKey).filter(Boolean));
  const seguroPaidWithoutUpsell = seguroPaidRows.filter((row) => {
    const key = customerKey(row);
    return key && !taxaKeys.has(key);
  }).length;

  return {
    seguroGenerated: seguroRows.length,
    seguroPaid: seguroPaidRows.length,
    taxaGenerated: taxaRows.length,
    taxaPaid: taxaPaidRows.length,
    realRevenue: [...seguroPaidRows, ...taxaPaidRows].reduce((sum, row) => sum + (row.value || 0), 0),
    seguroConversion: seguroRows.length ? (seguroPaidRows.length / seguroRows.length) * 100 : 0,
    upsellGeneratedRate: seguroPaidRows.length ? (taxaRows.length / seguroPaidRows.length) * 100 : 0,
    upsellPaidRate: taxaRows.length ? (taxaPaidRows.length / taxaRows.length) * 100 : 0,
    seguroPaidWithoutUpsell,
  };
};

const ticketRowsAsPeriodSummary = (ticket: ReturnType<typeof summarizeTicket>) => ({
  generated: ticket.seguroGenerated + ticket.taxaGenerated,
  paid: ticket.seguroPaid + ticket.taxaPaid,
  seguroPaid: ticket.seguroPaid,
  taxaPaid: ticket.taxaPaid,
  realRevenue: ticket.realRevenue,
  oldTicketRevenue: 0,
  newTicketRevenue: 0,
  conversion: ticket.seguroConversion,
});

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
  const beforeRef = useRef(before);
  const afterRef = useRef(after);

  useEffect(() => {
    beforeRef.current = before;
    afterRef.current = after;
  }, [before, after]);

  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    const currentBefore = beforeRef.current;
    const currentAfter = { ...afterRef.current, end: new Date() };
    afterRef.current = currentAfter;
    setAfter(currentAfter);
    const start = currentBefore.start;
    const end = currentAfter.end;

    const select = "id,status,value,content_id,customer_cpf,customer_email,customer_phone,hashed_email,hashed_phone,hashed_external_id,created_at,updated_at";
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
    const interval = window.setInterval(loadPayments, 15000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const beforeSummary = useMemo(() => summarize(rows, before), [rows, before]);
  const afterSummary = useMemo(() => summarize(rows, after), [rows, after]);
  const oldTicketSummary = useMemo(() => summarizeTicket(rows, OLD_TICKET), [rows]);
  const newTicketSummary = useMemo(() => summarizeTicket(rows, NEW_TICKET), [rows]);
  const oldTicketRowsSummary = useMemo(() => ticketRowsAsPeriodSummary(oldTicketSummary), [oldTicketSummary]);
  const newTicketRowsSummary = useMemo(() => ticketRowsAsPeriodSummary(newTicketSummary), [newTicketSummary]);

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
          <MetricCard title="Upsell gerado no ticket novo" value={pct(newTicketSummary.upsellGeneratedRate)} detail={`${newTicketSummary.taxaGenerated} upsells / ${newTicketSummary.seguroPaid} seguros pagos`} diff={delta(newTicketSummary.upsellGeneratedRate, oldTicketSummary.upsellGeneratedRate)} />
          <MetricCard title="Leads pagos sem upsell" value={String(newTicketSummary.seguroPaidWithoutUpsell)} detail="Pagaram seguro novo e não têm PIX de upsell vinculado" />
          <MetricCard title="Receita real ticket novo" value={brl(newTicketSummary.realRevenue)} detail={`${newTicketSummary.seguroPaid} seguros pagos + ${newTicketSummary.taxaPaid} upsells pagos`} />
          <MetricCard title="Conversão upsell novo" value={pct(newTicketSummary.upsellPaidRate)} detail={`${newTicketSummary.taxaPaid} pagos / ${newTicketSummary.taxaGenerated} gerados`} diff={delta(newTicketSummary.upsellPaidRate, oldTicketSummary.upsellPaidRate)} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {[
            { title: "Antes da mudança", summary: oldTicketRowsSummary, estimate: oldTicketSummary.realRevenue, period: before, note: "Mostra somente PIX do ticket antigo: R$ 31,79 e R$ 18,74." },
            { title: "Depois da publicação", summary: newTicketRowsSummary, estimate: newTicketSummary.realRevenue, period: after, note: "Mostra somente PIX do ticket novo: R$ 52,79 e R$ 28,74." },
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