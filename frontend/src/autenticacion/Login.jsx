import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PUG_URL =
    "https://images.unsplash.com/photo-1523626752472-b55a628f1acc?q=80&w=1080";

function PawIcon() {
    return (
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="#29b6d8">
            <ellipse cx="32" cy="42" rx="14" ry="12" />
            <ellipse cx="14" cy="28" rx="6" ry="8" transform="rotate(-20 14 28)" />
            <ellipse cx="24" cy="20" rx="6" ry="8" transform="rotate(-8 24 20)" />
            <ellipse cx="40" cy="20" rx="6" ry="8" transform="rotate(8 40 20)" />
            <ellipse cx="50" cy="28" rx="6" ry="8" transform="rotate(20 50 28)" />
        </svg>
    );
}

function EyeIcon({ open }) {
    return open ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );
}

const inputBase = {
    height: 44,
    border: "1.5px solid #e2eaf0",
    color: "#0d1b2a",
    background: "#fff",
};

function StyledInput({
    id, type, value, onChange, placeholder,
}) {
    return (
        <input
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-[10px] px-4 text-sm transition-all duration-150 outline-none"
            style={inputBase}
            onFocus={(e) => {
                e.currentTarget.style.borderColor = "#29b6d8";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(41,182,216,0.15)";
            }}
            onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2eaf0";
                e.currentTarget.style.boxShadow = "none";
            }}
        />
    );
}

function RightPanel() {
    return (
        <div className="auth-right-panel hidden lg:flex flex-1 relative overflow-hidden" style={{ background: "#b52020" }}>
            <img
                src={PUG_URL}
                alt="Pug negro – Pets Place"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                    mixBlendMode: "multiply",
                    filter: "contrast(1.08) saturate(0.85)",
                    objectPosition: "center 78%"
                }}
            />
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "linear-gradient(135deg, rgba(170,30,20,0.5) 0%, rgba(80,10,5,0.2) 100%)",
                }}
            />
            <div className="absolute bottom-8 left-8 right-8">
                <p className="text-white/70 text-xs font-medium tracking-wider uppercase">
                    Pets Place &nbsp;·&nbsp; Tu espacio para mascotas
                </p>
            </div>
        </div>
    );
}

function Brand() {
    return (
        <div className="flex items-center gap-3 mb-9">
            <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 48, height: 48, background: "#e8f6fb" }}
            >
                <PawIcon />
            </div>
            <span className="text-2xl font-extrabold tracking-tight" style={{ color: "#000000", letterSpacing: "-0.025em", fontWeight: "800" }}>
                Pets Place
            </span>
        </div>
    );
}


export default function Login() {
    const { token, loginUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redireccionar al Dashboard si ya existe sesión activa
    useEffect(() => {
        if (token) {
            const from = location.state?.from?.pathname || "/";
            navigate(from, { replace: true });
        }
    }, [token, navigate, location]);

    const [showPass, setShowPass] = useState(false);
    const [remember, setRemember] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("admin");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const roles = [
        { key: "admin", label: "Administración" },
        { key: "vet", label: "Veterinario" },
        { key: "staff", label: "Personal de atención" },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError("Por favor, completa todos los campos.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Ingresa un correo electrónico válido.");
            return;
        }

        setLoading(true);
        setError("");

        const result = await loginUser(email, password);
        if (result.success) {
            const from = location.state?.from?.pathname || "/";
            navigate(from, { replace: true });
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="flex w-full h-screen overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="auth-form-container flex-none w-full lg:w-[45%] bg-white flex items-center justify-center px-4 sm:px-12 py-10 overflow-y-auto">
                <form onSubmit={handleSubmit} noValidate className="w-full max-w-[380px]">
                    <Brand />

                    <h1 className="text-[1.65rem] font-extrabold mb-1 leading-tight" style={{ color: "#000000", letterSpacing: "-0.025em", fontWeight: "800" }}>
                        Bienvenido de vuelta
                    </h1>
                    <p className="text-sm mb-6" style={{ color: "#7a8fa6" }}>
                        Inicia sesión para continuar
                    </p>

                    {/* Role selector */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-7">
                        {roles.map((r) => (
                            <button
                                key={r.key}
                                type="button"
                                onClick={() => setRole(r.key)}
                                className="flex-1 text-[0.78rem] font-semibold rounded-[10px] transition-all duration-150 leading-tight px-2 py-2.5"
                                style={{
                                    border: role === r.key ? "2px solid #29b6d8" : "1.5px solid #e2eaf0",
                                    background: role === r.key ? "#e8f6fb" : "#fff",
                                    color: role === r.key ? "#1a9ab8" : "#7a8fa6",
                                    cursor: "pointer",
                                }}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="notification is-danger is-light p-2 mb-4 text-xs rounded-[10px]" style={{ color: '#d4183d', background: '#fdf2f2', border: '1.5px solid #fde8e8', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5 mb-4">
                        <label htmlFor="email" className="text-[0.8rem] font-semibold" style={{ color: "#4a5568" }}>
                            Correo electrónico
                        </label>
                        <StyledInput id="email" type="email" value={email} onChange={setEmail} placeholder="tu@correo.com" />
                    </div>

                    <div className="flex flex-col gap-1.5 mb-5">
                        <label htmlFor="password" className="text-[0.8rem] font-semibold" style={{ color: "#4a5568" }}>
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPass ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-[10px] px-4 pr-11 text-sm transition-all duration-150 outline-none"
                                style={inputBase}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = "#29b6d8";
                                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(41,182,216,0.15)";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = "#e2eaf0";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150"
                                style={{ color: "#b0bec5" }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "#29b6d8")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "#b0bec5")}
                            >
                                <EyeIcon open={showPass} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-7">
                        <label className="flex items-center gap-2 text-[0.83rem] cursor-pointer select-none" style={{ color: "#4a5568" }}>
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="w-4 h-4 rounded cursor-pointer flex-shrink-0"
                                style={{ accentColor: "#29b6d8" }}
                            />
                            Recordarme
                        </label>
                        <a
                            href="#"
                            className="text-[0.83rem] font-medium transition-colors duration-150"
                            style={{ color: "#29b6d8" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#1a9ab8")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#29b6d8")}
                        >
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full font-semibold text-white text-[0.95rem] rounded-[10px] transition-all duration-150 active:scale-[0.98]"
                        style={{
                            height: 46,
                            background: loading ? "#a0d8e8" : "#29b6d8",
                            border: "none",
                            letterSpacing: "0.01em",
                            cursor: loading ? "not-allowed" : "pointer"
                        }}
                        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#1da5c5"; }}
                        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#29b6d8"; }}
                    >
                        {loading ? "Ingresando..." : "Ingresar"}
                    </button>

                    <p className="text-center text-[0.83rem] mt-5" style={{ color: "#7a8fa6" }}>
                        ¿No tienes acceso? Solicítalo al administrador de la clínica.
                    </p>
                </form>
            </div>
            <RightPanel />
        </div>
    );
}