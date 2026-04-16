import logo from "@/assets/logo.png";

interface HeaderProps {
  showCta?: boolean;
  onCtaClick?: () => void;
}

const Header = ({ showCta = false, onCtaClick }: HeaderProps) => {
  return (
    <header className="py-3 px-4 flex items-center justify-between bg-background border-b border-border/50 relative z-20">
      <img src={logo} alt="SuperSim" className="h-8 md:h-10" />
      <div className="flex items-center gap-3">
        {showCta && (
          <button onClick={onCtaClick} className="btn-3d-sm">
            Simular empréstimo
          </button>
        )}
        <button className="flex flex-col gap-[5px] p-1">
          <span className="w-6 h-[2.5px] bg-primary rounded-full"></span>
          <span className="w-6 h-[2.5px] bg-primary rounded-full"></span>
          <span className="w-6 h-[2.5px] bg-primary rounded-full"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
