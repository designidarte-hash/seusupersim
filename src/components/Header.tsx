import { User } from "lucide-react";
import logo from "@/assets/logo.png";

interface HeaderProps {
  showCta?: boolean;
  onCtaClick?: () => void;
  userName?: string;
  userCpf?: string;
}

const formatFirstAndLast = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].toUpperCase();
  return `${parts[0]} ${parts[parts.length - 1]}`.toUpperCase();
};

const maskCpf = (cpf: string) => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "";
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
};

const Header = ({ showCta = false, onCtaClick, userName, userCpf }: HeaderProps) => {
  const displayName = userName ? formatFirstAndLast(userName) : "";
  const displayCpf = userCpf ? maskCpf(userCpf) : "";
  const showUserBadge = Boolean(displayName);

  return (
    <header className="py-3 px-4 flex items-center justify-between bg-background border-b border-border/50 relative z-20 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button className="flex flex-col gap-[5px] p-1 shrink-0">
          <span className="w-6 h-[2.5px] bg-primary rounded-full"></span>
          <span className="w-6 h-[2.5px] bg-primary rounded-full"></span>
          <span className="w-6 h-[2.5px] bg-primary rounded-full"></span>
        </button>
        <img src={logo} alt="SuperSim" className="h-8 md:h-10 shrink-0" />
      </div>

      <div className="flex items-center gap-3 min-w-0">
        {showUserBadge ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="text-right min-w-0">
              <p className="text-sm md:text-base font-bold text-foreground truncate max-w-[160px] md:max-w-[240px] leading-tight">
                {displayName}
              </p>
              {displayCpf && (
                <p className="text-xs text-muted-foreground tracking-wider leading-tight">
                  {displayCpf}
                </p>
              )}
            </div>
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md">
              <User className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </div>
        ) : (
          showCta && (
            <button onClick={onCtaClick} className="btn-3d-sm">
              Simular empréstimo
            </button>
          )
        )}
      </div>
    </header>
  );
};

export default Header;
