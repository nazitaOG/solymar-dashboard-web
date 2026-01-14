import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

export function MoneyInput({
    value,
    onChange,
    placeholder,
    disabled,
    className
}: {
    value: number;
    onChange: (val: number) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}) {
    // Estado local para lo que se VE (texto)
    const [displayValue, setDisplayValue] = useState(value === 0 ? "" : value.toString());

    // Sincronizar si el valor externo cambia (ej: al cargar data)
    useEffect(() => {
        if (value !== 0 && parseFloat(displayValue) !== value) {
            setDisplayValue(value.toString());
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setDisplayValue(inputValue); // Dejamos que el usuario escriba lo que quiera visualmente

        if (inputValue === "") {
            onChange(0);
            return;
        }

        // 🧠 LÓGICA MAESTRA: "El último separador es el decimal"
        // 1. Limpiamos basura (letras, símbolos raros)
        const clean = inputValue.replace(/[^0-9.,]/g, "");

        // 2. Buscamos el último punto y la última coma
        const lastDot = clean.lastIndexOf('.');
        const lastComma = clean.lastIndexOf(',');

        // El índice mayor es el separador decimal real
        const separatorIndex = Math.max(lastDot, lastComma);

        let finalNumberStr = "";

        if (separatorIndex === -1) {
            // No hay separadores, es entero puro (ej: "40000")
            finalNumberStr = clean;
        } else {
            // Hay separador. Cortamos la torta.
            // Parte entera: Todo lo que está ANTES del separador (quitamos todos los puntos y comas)
            const integers = clean.substring(0, separatorIndex).replace(/[^0-9]/g, "");
            // Parte decimal: Todo lo que está DESPUÉS
            const decimals = clean.substring(separatorIndex + 1).replace(/[^0-9]/g, "");

            finalNumberStr = `${integers}.${decimals}`;
        }

        const parsed = parseFloat(finalNumberStr);
        if (!isNaN(parsed)) {
            onChange(parsed);
        }
    };

    return (
        <Input
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
        />
    );
}