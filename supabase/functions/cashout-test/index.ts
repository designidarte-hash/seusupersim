import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM";

interface RequestBody {
  pixKey: string;
  pixKeyType: PixKeyType;
  cpf?: string;
  customerName?: string;
  amount?: number; // default 0.01
  description?: string;
}

const VALID_TYPES: PixKeyType[] = ["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const apiKey = Deno.env.get("BLACKCAT_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "BLACKCAT_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as RequestBody;

    if (!body?.pixKey || !body?.pixKeyType) {
      return new Response(
        JSON.stringify({ error: "pixKey e pixKeyType são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!VALID_TYPES.includes(body.pixKeyType)) {
      return new Response(
        JSON.stringify({
          error: `pixKeyType inválido. Use: ${VALID_TYPES.join(", ")}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amount = typeof body.amount === "number" && body.amount > 0
      ? body.amount
      : 0.01;

    // Cria registro pendente
    const { data: validation, error: insertErr } = await supabase
      .from("pix_validations")
      .insert({
        cpf: body.cpf ?? null,
        customer_name: body.customerName ?? null,
        pix_key: body.pixKey,
        pix_key_type: body.pixKeyType,
        amount,
        status: "pending",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Erro ao inserir pix_validations:", insertErr);
      return new Response(
        JSON.stringify({ error: "Erro ao registrar validação", detail: insertErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Chama a BlackCat — endpoint de saque
    const payload = {
      amount, // em Reais (ex.: 0.01)
      pixKey: body.pixKey,
      pixKeyType: body.pixKeyType,
      description: body.description ?? "Validação de conta",
    };

    console.log("Chamando BlackCat create-withdrawal:", payload);

    const blackcatRes = await fetch(
      "https://api.blackcatpagamentos.com/v1/sales/create-withdrawal",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(payload),
      }
    );

    const responseText = await blackcatRes.text();
    let responseJson: unknown;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = { raw: responseText };
    }

    console.log("Resposta BlackCat:", blackcatRes.status, responseJson);

    if (!blackcatRes.ok) {
      await supabase
        .from("pix_validations")
        .update({
          status: "failed",
          blackcat_response: responseJson as object,
          error_message: `HTTP ${blackcatRes.status}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validation.id);

      return new Response(
        JSON.stringify({
          success: false,
          validationId: validation.id,
          status: blackcatRes.status,
          error: responseJson,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const r = responseJson as Record<string, unknown>;
    const withdrawalId =
      (r.id as string) ||
      (r.withdrawalId as string) ||
      ((r.data as Record<string, unknown>)?.id as string) ||
      null;

    await supabase
      .from("pix_validations")
      .update({
        status: "sent",
        withdrawal_id: withdrawalId,
        blackcat_response: responseJson as object,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validation.id);

    return new Response(
      JSON.stringify({
        success: true,
        validationId: validation.id,
        withdrawalId,
        response: responseJson,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro inesperado:", err);
    return new Response(
      JSON.stringify({
        error: "Erro inesperado",
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
