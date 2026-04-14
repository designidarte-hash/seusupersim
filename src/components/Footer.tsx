import logo from "@/assets/logo.png";
import seloFeex from "@/assets/selo-feex.png";
import seloRa from "@/assets/selo-ra.png";
import seloFebraban from "@/assets/selo-febraban.png";
import seloAnbima from "@/assets/selo-anbima.png";
import seloSsl from "@/assets/selo-ssl.png";
import { Facebook, Youtube, Instagram, Linkedin } from "lucide-react";

const selos = [
  { src: seloFeex, alt: "FEEx GPTW" },
  { src: seloRa, alt: "RA1000 Reclame Aqui" },
  { src: seloFebraban, alt: "FEBRABAN" },
  { src: seloAnbima, alt: "ANBIMA" },
  { src: seloSsl, alt: "Site Seguro SSL" },
];

const socials = [
  { icon: Facebook, url: "https://www.facebook.com/supersimoficial/" },
  { icon: Youtube, url: "https://www.youtube.com/c/SuperSimEmpr%C3%A9stimoOnlineOficial" },
  { icon: Instagram, url: "https://www.instagram.com/supersimoficial/" },
  { icon: Linkedin, url: "https://www.linkedin.com/company/supersim/" },
];

const Footer = () => (
  <footer className="bg-background px-6 py-8 border-t border-border/50">
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Selos */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {selos.map((selo) => (
          <div key={selo.alt} className="bg-muted rounded-lg px-4 py-2">
            <img src={selo.src} alt={selo.alt} className="h-8 object-contain" loading="lazy" decoding="async" />
          </div>
        ))}
      </div>

      {/* Redes sociais */}
      <div className="flex items-center justify-center gap-4">
        {socials.map((social, i) => (
          <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background hover:bg-primary transition">
            <social.icon className="w-5 h-5" />
          </a>
        ))}
      </div>

      {/* Texto legal */}
      <div className="border-t border-border pt-6">
        <img
          src="https://www.supersim.com.br/image/logo-supersim-grayscale.png"
          alt="SuperSim"
          className="h-6 mb-4 opacity-60"
        />
        <p className="text-xs text-muted-foreground leading-relaxed">
          A SuperSim pertence e é operada pela SUPERSIM ANALISE DE DADOS E CORRESPONDENTE BANCARIO LTDA., inscrita no CNPJ/MF sob o nº 33.030.944/0001-60, localizada na Av. Nove de Julho, 5143 - Conj 121 - Jardim Paulista - São Paulo/SP - CEP: 01.407-906. Atuamos como correspondente bancário, nos termos da Resolução nº 3.954 do Banco Central do Brasil, da BMP SOCIEDADE DE CRÉDITO DIRETO S.A., inscrita no CNPJ/MF sob o nº 34.337.707/0001-00, da SOCINAL S.A. - CRÉDITO, FINANCIAMENTO E INVESTIMENTO, inscrita no CNPJ/MF sob o nº 03.881.423/0001-56 e da VIA CAPITAL – SOCIEDADE DE CRÉDITO DIRETO S.A - CNPJ nº 48.632.754/0001-90. Dispomos de uma plataforma online que disponibiliza produtos e serviços de crédito pessoal por meio de instituições financeiras parceiras. Nosso prazo de pagamento varia de 1 a 48 meses. A taxa de juros praticada no produto de crédito pessoal é de 1,32% a.m. (17,02% a.a.). A tarifa de cadastro (TC) é de R$ 19 até R$ 150. Ao solicitar uma proposta, serão exibidos a taxa de juros utilizada, a tarifa, o imposto (IOF) e o custo efetivo total (CET). A contratação está sujeita à análise de crédito. Exemplo: um empréstimo de R$ 1.000 em 12 meses com taxa de juros de 1,32% a.m. (17,02% a.a.) terá parcelas de R$ 92,63 e CET de 1,42% a.m. (18,42% a.a.).
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
