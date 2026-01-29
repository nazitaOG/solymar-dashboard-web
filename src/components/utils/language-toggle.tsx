import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    // Si es español cambia a inglés, y viceversa
    const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  const isEs = i18n.language.startsWith('es');

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleLanguage}
      className="gap-2 px-2"
      title="Cambiar idioma"
    >
      <span className="font-bold text-xs">{isEs ? 'ES' : 'EN'}</span>
    </Button>
  );
}